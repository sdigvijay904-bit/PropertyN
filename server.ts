import express from "express";
import path from "path";
import fs from "fs";
import QRCode from "qrcode";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = Number(process.env.PORT || 3000);
const DB_FILE = path.join(process.cwd(), "db.json");

app.use(express.json({ limit: '10mb' }));

// Enable CORS for Meta Ads, Instagram WebView, Landing Pages & Cross-Origin Requests
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE, PATCH");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

// API: Direct QR Code Image Attachment Download (For Android APK WebView & Mobile Browsers)
app.get("/api/download-qr", async (req, res) => {
  try {
    const amount = (req.query.amount as string) || "500";
    const phone = (req.query.phone as string) || "";
    const upiId = (req.query.upiId as string) || "DIGVIJAY990@NYES";
    const upiName = (req.query.upiName as string) || "PropertyN Payment";

    const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${amount}&cu=INR&tn=Recharge_${phone}`;

    const pngBuffer = await QRCode.toBuffer(upiString, {
      width: 1000,
      margin: 2,
      color: {
        dark: '#042f2e',
        light: '#ffffff'
      }
    });

    const filename = `payment_qr_${amount}.png`;

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pngBuffer.length.toString());
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    return res.end(pngBuffer);
  } catch (err) {
    console.error("Error generating QR download:", err);
    res.status(500).send("Error generating QR image");
  }
});

interface DbState {
  usersList: any[];
  plans: any[];
  transactions: any[];
  purchasesByUserId: Record<string, any[]>;
  config: Record<string, string>;
  customTicker: string | null;
}

// Initial default state
const getInitialState = (): DbState => {
  return {
    usersList: [],
    plans: [],
    transactions: [],
    purchasesByUserId: {},
    config: {},
    customTicker: null
  };
};

// Read database safely with proper default state fallbacks
const readDb = (): DbState => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(content);
      return {
        ...getInitialState(),
        ...parsed
      };
    }
  } catch (e) {
    console.error("Error reading DB file, resetting:", e);
  }
  return getInitialState();
};

// Write database safely
const writeDb = (state: DbState) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing DB file:", e);
  }
};

// API: Get current synchronized state
app.get("/api/get-state", (req, res) => {
  const userId = req.query.userId as string;
  const db = readDb();
  
  // Dynamically calculate and append totalInvested for each user based on their actual purchases
  const usersWithInvestments = (db.usersList || []).map((u: any) => {
    const userPurchases = db.purchasesByUserId[u.id] || [];
    const totalInvested = userPurchases.reduce((sum: number, p: any) => sum + (p.price || 0), 0);
    return { ...u, totalInvested };
  });
  
  res.json({
    usersList: usersWithInvestments,
    plans: db.plans || [],
    transactions: db.transactions || [],
    purchases: userId ? (db.purchasesByUserId[userId] || []) : [],
    config: db.config || {},
    customTicker: db.customTicker
  });
});

// API: Check if phone number is registered
app.get("/api/check-phone", (req, res) => {
  const phone = req.query.phone as string;
  if (!phone) {
    return res.status(400).json({ error: "Phone number is required." });
  }
  const cleanQuery = phone.replace(/\D/g, '').slice(-10);
  const db = readDb();
  const exists = (db.usersList || []).some((u: any) => {
    if (!u || !u.phone) return false;
    if (u.phone === phone) return true;
    const uClean = u.phone.replace(/\D/g, '').slice(-10);
    return uClean.length >= 10 && uClean === cleanQuery;
  });
  res.json({ exists });
});

// API: Server-side Login
app.post("/api/login", (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ error: "Phone and password are required." });
  }
  const db = readDb();
  const matchedUser = (db.usersList || []).find((u: any) => u.phone === phone);
  
  if (!matchedUser) {
    return res.status(400).json({ error: "Mobile number not registered! Please sign up first. (यह मोबाइल नंबर पंजीकृत नहीं है! कृपया साइन अप करें।)" });
  }
  if (matchedUser.status === 'blocked') {
    return res.status(400).json({ error: "Your account has been suspended by Admin. (आपका खाता एडमिन द्वारा निलंबित कर दिया गया है।)" });
  }
  if (matchedUser.password && matchedUser.password !== password) {
    return res.status(400).json({ error: "Incorrect password! (गलत पासवर्ड दर्ज किया गया है)" });
  }
  
  const purchases = db.purchasesByUserId[matchedUser.id] || [];
  const transactions = (db.transactions || []);
  
  res.json({
    user: matchedUser,
    purchases,
    transactions
  });
});

const FIREBASE_PROJECT_ID = "isentropic-forcaster-rd2jw";
const FIREBASE_DATABASE_ID = "ai-studio-propertynrealest-a366a56b-05b0-4ca9-9769-c63579d84978";
const FIREBASE_API_KEY = "AIzaSyCFrLoVD9mJnwxhdV7AlCGxojWfGpYdpAk";
const FIRESTORE_REST_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/${FIREBASE_DATABASE_ID}/documents`;

function cleanUndefined(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(cleanUndefined);
  if (typeof obj === 'object') {
    const newObj: any = {};
    for (const key of Object.keys(obj)) {
      if (obj[key] !== undefined) {
        newObj[key] = cleanUndefined(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
}

function jsToFirestoreFields(obj: any): any {
  if (obj === null || obj === undefined) return {};
  const cleaned = cleanUndefined(obj);
  const fields: any = {};
  for (const key of Object.keys(cleaned)) {
    const val = cleaned[key];
    if (val === undefined) continue;

    if (val === null) {
      fields[key] = { nullValue: null };
    } else if (typeof val === 'string') {
      fields[key] = { stringValue: val };
    } else if (typeof val === 'number') {
      if (Number.isInteger(val)) {
        fields[key] = { integerValue: String(val) };
      } else {
        fields[key] = { doubleValue: val };
      }
    } else if (typeof val === 'boolean') {
      fields[key] = { booleanValue: val };
    } else if (Array.isArray(val)) {
      const convertedArr = val.map(item => {
        if (item === null || item === undefined) return { nullValue: null };
        if (typeof item === 'string') return { stringValue: item };
        if (typeof item === 'number') return Number.isInteger(item) ? { integerValue: String(item) } : { doubleValue: item };
        if (typeof item === 'boolean') return { booleanValue: item };
        if (typeof item === 'object') return { mapValue: { fields: jsToFirestoreFields(item) } };
        return { stringValue: String(item) };
      });
      fields[key] = { arrayValue: { values: convertedArr } };
    } else if (typeof val === 'object') {
      fields[key] = { mapValue: { fields: jsToFirestoreFields(val) } };
    }
  }
  return fields;
}

async function writeFirestoreRestServer(collectionName: string, docId: string, data: any) {
  try {
    const cleanData = cleanUndefined(data);
    const fields = jsToFirestoreFields(cleanData);
    
    // Method 1: Try POST create document first (for new registrations)
    const postUrl = `${FIRESTORE_REST_BASE}/${collectionName}?documentId=${encodeURIComponent(docId)}&key=${FIREBASE_API_KEY}`;
    const postRes = await fetch(postUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });

    if (postRes.ok) return true;

    // Method 2: If document already exists (409) or POST fails, use PATCH update
    const fieldKeys = Object.keys(fields);
    const maskParams = fieldKeys.map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&');
    const patchUrl = `${FIRESTORE_REST_BASE}/${collectionName}/${encodeURIComponent(docId)}?key=${FIREBASE_API_KEY}${maskParams ? '&' + maskParams : ''}`;
    const patchRes = await fetch(patchUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });

    if (patchRes.ok) return true;
  } catch (e) {
    console.error(`[Server Firestore Sync Fail] ${collectionName}/${docId}:`, e);
  }
}

// API: Server-side Registration
app.post("/api/register", async (req, res) => {
  const { id, name, phone, password, inviterCode } = req.body;
  if (!name || !phone || !password) {
    return res.status(400).json({ error: "Required fields missing." });
  }
  
  const db = readDb();
  const digitsOnly = phone.replace(/\D/g, '').slice(-10);
  const targetPhone = `+91 ${digitsOnly}`;
  const existingUser = (db.usersList || []).find((u: any) => {
    const uDigits = u.phone ? u.phone.replace(/\D/g, '').slice(-10) : '';
    return uDigits.length >= 10 && uDigits === digitsOnly;
  });
  
  if (existingUser) {
    existingUser.name = name || existingUser.name;
    existingUser.password = password || existingUser.password;
    if (inviterCode) existingUser.inviterCode = inviterCode;
    writeDb(db);
    await writeFirestoreRestServer("users", existingUser.id, existingUser);
    return res.json({
      user: existingUser,
      purchases: db.purchasesByUserId[existingUser.id] || [],
      transactions: db.transactions
    });
  }
  
  let resolvedInviterCode = (inviterCode || '').trim();
  if (resolvedInviterCode && db.usersList) {
    const sponsor = db.usersList.find((u: any) => 
      (u.inviteCode && String(u.inviteCode).trim().toLowerCase() === resolvedInviterCode.toLowerCase()) ||
      (u.id && String(u.id).trim().toLowerCase() === resolvedInviterCode.toLowerCase()) ||
      (u.phone && u.phone.replace(/\D/g, '').slice(-10) === resolvedInviterCode.replace(/\D/g, '').slice(-10))
    );
    if (sponsor && sponsor.inviteCode) {
      resolvedInviterCode = sponsor.inviteCode;
    }
  }

  const newUserId = id || (digitsOnly.length >= 10 ? `usr_${digitsOnly}` : `usr_${Date.now()}`);
  const newUser = {
    id: newUserId,
    name,
    phone: targetPhone,
    balance: 100, // free signup bonus
    totalEarnings: 0,
    dailyEarned: 0,
    checkedInToday: false,
    inviteCode: Math.floor(10000 + Math.random() * 90000).toString(),
    inviterCode: resolvedInviterCode,
    role: 'user',
    password,
    status: 'active',
    kycStatus: 'none',
    notifications: [
      {
        id: `notif_${Date.now()}`,
        title: 'Welcome to PropertyN!',
        body: 'Thank you for registering. You have received ₹100 registration reward. Complete your KYC to unlock full premium features.',
        date: new Date().toLocaleDateString(),
        read: false
      }
    ]
  };
  
  const signupTx = {
    id: `tx_${Date.now()}`,
    type: 'checkin',
    amount: 100,
    date: new Date().toLocaleString(),
    status: 'success',
    description: 'Signup Registration Bonus credited',
    userId: newUser.id,
    userPhone: newUser.phone
  };
  
  db.usersList.push(newUser);
  db.transactions.unshift(signupTx);
  writeDb(db);
  
  // Sync to Firestore REST asynchronously in background
  Promise.all([
    writeFirestoreRestServer("users", newUser.id, newUser),
    writeFirestoreRestServer("transactions", signupTx.id, signupTx)
  ]).catch(() => {});

  res.json({
    user: newUser,
    purchases: [],
    transactions: db.transactions
  });
});

// API: Server-side Password Reset
app.post("/api/reset-password", (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ error: "Phone and password are required." });
  }
  const db = readDb();
  const matchedUser = (db.usersList || []).find((u: any) => u.phone === phone);
  if (!matchedUser) {
    return res.status(400).json({ error: "This mobile number is not registered! (यह मोबाइल नंबर पंजीकृत नहीं है!)" });
  }
  
  matchedUser.password = password;
  writeDb(db);
  
  res.json({ success: true });
});

// API: Save and merge incoming state from any user/admin
app.post("/api/save-state", (req, res) => {
  const incoming = req.body;
  const db = readDb();
  const userId = incoming.userId as string;

  // 1. Merge usersList
  if (Array.isArray(incoming.usersList)) {
    const userMap = new Map(db.usersList.map(u => [u.id, u]));
    incoming.usersList.forEach((u: any) => {
      const existing = userMap.get(u.id);
      if (!existing) {
        userMap.set(u.id, u);
      } else {
        // Overwrite existing with any updated values from current save request
        const mergedUser = { ...existing, ...u };
        
        // SECURITY / STABILITY PROTECTIONS:
        // 1. Prevent non-owner/non-admin clients from overwriting other users' passwords
        if (u.id !== userId && userId !== 'usr_admin') {
          mergedUser.password = existing.password;
        }
        
        // 2. Prevent overwriting a custom password with the default 'password123'
        if (existing.password && existing.password !== 'password123' && u.password === 'password123') {
          mergedUser.password = existing.password;
        }
        
        userMap.set(u.id, mergedUser);
      }
    });
    db.usersList = Array.from(userMap.values());
  }

  // 2. Merge plans (ONLY Admin changes are source of truth)
  const callerUser = userId ? (db.usersList || []).find((u: any) => u.id === userId) : null;
  const isAdminRequest = userId === 'usr_admin' || 
                         (callerUser && (callerUser.role === 'admin' || (callerUser.phone && callerUser.phone.includes('9999999999')))) ||
                         (Array.isArray(incoming.usersList) && incoming.usersList.some((u: any) => u.id === userId && (u.role === 'admin' || (u.phone && u.phone.includes('9999999999')))));

  if (isAdminRequest && Array.isArray(incoming.plans) && incoming.plans.length > 0) {
    db.plans = incoming.plans;
    incoming.plans.forEach((p: any) => {
      if (p && p.id) writeFirestoreRestServer("plans", p.id, p);
    });
  }

  // 3. Merge transactions
  if (Array.isArray(incoming.transactions)) {
    const txMap = new Map(db.transactions.map(t => [t.id, t]));
    incoming.transactions.forEach((t: any) => {
      txMap.set(t.id, t);
    });
    db.transactions = Array.from(txMap.values());
  }

  // 4. Merge user-specific purchases
  if (userId && Array.isArray(incoming.purchases)) {
    db.purchasesByUserId[userId] = incoming.purchases;
  }

  // 5. Merge custom config keys
  if (incoming.config && typeof incoming.config === 'object') {
    db.config = { ...db.config, ...incoming.config };
  }

  // 6. Merge live custom alert message
  if (typeof incoming.customTicker !== 'undefined') {
    db.customTicker = incoming.customTicker;
  }

  writeDb(db);

  // Sync usersList & transactions to Firestore REST asynchronously
  if (Array.isArray(incoming.usersList)) {
    incoming.usersList.forEach((u: any) => {
      if (u && u.id) writeFirestoreRestServer("users", u.id, u);
    });
  }
  if (Array.isArray(incoming.transactions)) {
    incoming.transactions.forEach((t: any) => {
      if (t && t.id) writeFirestoreRestServer("transactions", t.id, t);
    });
  }

  // Dynamically calculate and append totalInvested for each user based on their actual purchases
  const usersWithInvestments = (db.usersList || []).map((u: any) => {
    const userPurchases = db.purchasesByUserId[u.id] || [];
    const totalInvested = userPurchases.reduce((sum: number, p: any) => sum + (p.price || 0), 0);
    return { ...u, totalInvested };
  });

  // Return the fully updated state to the caller
  res.json({
    usersList: usersWithInvestments,
    plans: db.plans,
    transactions: db.transactions,
    purchases: userId ? (db.purchasesByUserId[userId] || []) : [],
    config: db.config,
    customTicker: db.customTicker
  });
});

// Start full stack server
async function startServer() {
  // Vite integration middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
