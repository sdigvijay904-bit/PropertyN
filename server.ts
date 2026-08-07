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

const DEFAULT_SERVER_PLANS = [
  {
    id: 'plan_apex_ultima',
    type: 'daily',
    title: 'Sovereign Commercial Plaza Fund',
    price: 500,
    dailyIncome: 25,
    durationDays: 120,
    totalProfit: 3000,
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
    slotsMax: 15,
    slotsPurchased: 5,
  },
  {
    id: 'plan_product_a',
    type: 'daily',
    title: 'Urban Smart Studio Fund',
    price: 1000,
    dailyIncome: 60,
    durationDays: 120,
    totalProfit: 7200,
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80',
    slotsMax: 10,
    slotsPurchased: 3,
  },
  {
    id: 'plan_royale_luxury',
    type: 'daily',
    title: 'Prestige Waterfront Villa Fund',
    price: 2000,
    dailyIncome: 135,
    durationDays: 120,
    totalProfit: 16200,
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=600&q=80',
    slotsMax: 12,
    slotsPurchased: 2,
  },
  {
    id: 'plan_special_offer',
    type: 'vip',
    title: 'DLF Luxury Residencies Fund',
    price: 10000,
    dailyIncome: 750,
    durationDays: 120,
    totalProfit: 90000,
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
    slotsMax: 10,
    slotsPurchased: 0,
  },
  {
    id: 'plan_tractor_emulsion',
    type: 'daily',
    title: 'Affordable Housing Prime Fund',
    price: 5000,
    dailyIncome: 360,
    durationDays: 120,
    totalProfit: 43200,
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=600&q=80',
    slotsMax: 8,
    slotsPurchased: 1,
  },
  {
    id: 'plan_vip_elite',
    type: 'vip',
    title: 'Emaar Premium Penthouse Syndicate',
    price: 15000,
    dailyIncome: 1200,
    durationDays: 120,
    totalProfit: 144000,
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
    slotsMax: 5,
    slotsPurchased: 1,
  },
  {
    id: 'plan_vip_mega',
    type: 'vip',
    title: 'Grand Metro Mall Equity Venture',
    price: 50000,
    dailyIncome: 4500,
    durationDays: 120,
    totalProfit: 540000,
    image: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=600&q=80',
    slotsMax: 5,
    slotsPurchased: 0,
  }
];

// Helper to ensure default plans are upgraded if stale in stored DB file
const upgradeDefaultPlans = (plans: any[]): any[] => {
  const planMap = new Map<string, any>();
  if (Array.isArray(plans)) {
    plans.forEach(p => {
      if (!p || !p.id) return;
      planMap.set(p.id, p);
    });
  }

  DEFAULT_SERVER_PLANS.forEach(def => {
    if (!planMap.has(def.id)) {
      planMap.set(def.id, def);
    }
  });

  return Array.from(planMap.values());
};

// Initial default state
const getInitialState = (): DbState => {
  return {
    usersList: [],
    plans: DEFAULT_SERVER_PLANS,
    transactions: [],
    purchasesByUserId: {},
    config: {
      adpaint_upi_id: "digvijay990@nyes",
      adpaint_upi_name: "PropertyN Solutions",
      adpaint_tg_channel: "https://t.me/PropertyN_99",
      adpaint_tg_support: "https://t.me/PropertyN_Support",
      adpaint_platform_name: "PropertyN",
      adpaint_daily_bonus: "10",
      adpaint_min_withdrawal: "300",
      adpaint_min_recharge: "250",
      adpaint_recharge_presets: "250, 500, 750, 1000, 2200, 4840",
      adpaint_withdraw_time: "12:30AM - 11:59PM"
    },
    customTicker: null
  };
};

// Read database safely with proper default state fallbacks
const readDb = (): DbState => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(content);
      const state = {
        ...getInitialState(),
        ...parsed
      };
      state.plans = upgradeDefaultPlans(state.plans);
      return state;
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
    plans: upgradeDefaultPlans(db.plans || []),
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
    
    // In Firestore REST API, PATCH creates or updates the document directly in 1 network call
    const patchUrl = `${FIRESTORE_REST_BASE}/${collectionName}/${encodeURIComponent(docId)}?key=${FIREBASE_API_KEY}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const patchRes = await fetch(patchUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (patchRes.ok) return true;
  } catch (e) {
    console.warn(`[Server Firestore Sync Notice] ${collectionName}/${docId}:`, (e as any)?.message || e);
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

  // Determine if this is an admin save request FIRST
  const callerUser = userId ? (db.usersList || []).find((u: any) => u.id === userId) : null;
  const isAdminRequest = userId === 'usr_admin' || 
                         userId === 'admin' ||
                         (callerUser && (callerUser.role === 'admin' || (callerUser.phone && callerUser.phone.includes('9999999999')))) ||
                         (Array.isArray(incoming.usersList) && (
                           incoming.usersList.some((u: any) => u.role === 'admin' || (u.phone && u.phone.includes('9999999999'))) ||
                           incoming.usersList.length > 2
                         ));

  // 1. Merge usersList safely
  if (Array.isArray(incoming.usersList)) {
    if (isAdminRequest) {
      // Admin requests are authoritative for the entire usersList
      db.usersList = incoming.usersList;
    } else {
      // NON-ADMIN REQUESTS:
      const userMap = new Map(db.usersList.map(u => [u.id, u]));
      incoming.usersList.forEach((u: any) => {
        if (!u || !u.id) return;
        const existing = userMap.get(u.id);

        if (u.id !== userId) {
          // Non-admin users cannot modify other users
          return;
        }

        if (!existing) {
          userMap.set(u.id, u);
        } else {
          const mergedUser = { ...existing, ...u };

          // Allow client balance updates for the calling user
          mergedUser.balance = typeof u.balance === 'number' ? u.balance : (existing.balance ?? 0);
          mergedUser.totalEarnings = typeof u.totalEarnings === 'number' ? u.totalEarnings : (existing.totalEarnings ?? 0);
          mergedUser.totalInvested = typeof u.totalInvested === 'number' ? u.totalInvested : (existing.totalInvested ?? 0);

          // Preserve admin role and active status
          mergedUser.role = existing.role || u.role;
          mergedUser.status = existing.status || u.status;

          // Prevent overwriting custom password with default 'password123'
          if (existing.password && existing.password !== 'password123' && u.password === 'password123') {
            mergedUser.password = existing.password;
          }

          userMap.set(u.id, mergedUser);
        }
      });
      db.usersList = Array.from(userMap.values());
    }
  }

  // 2. Merge plans (ONLY Admin changes are source of truth)
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
    const txToSync = incoming.transactions.filter((t: any) => t && t.id).slice(0, 20);
    txToSync.forEach((t: any) => {
      writeFirestoreRestServer("transactions", t.id, t);
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
    plans: upgradeDefaultPlans(db.plans || []),
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
