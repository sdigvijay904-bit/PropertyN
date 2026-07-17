import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "db.json");

app.use(express.json({ limit: '10mb' }));

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
  const db = readDb();
  const exists = (db.usersList || []).some((u: any) => u.phone === phone);
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

// API: Server-side Registration
app.post("/api/register", (req, res) => {
  const { name, phone, password, inviterCode } = req.body;
  if (!name || !phone || !password) {
    return res.status(400).json({ error: "Required fields missing." });
  }
  
  const db = readDb();
  const exists = (db.usersList || []).some((u: any) => u.phone === phone);
  if (exists) {
    return res.status(400).json({ error: "Mobile number already registered! Please log in. (यह मोबाइल नंबर पहले से ही पंजीकृत है! कृपया लॉगिन करें)" });
  }
  
  const newUserId = `usr_${Date.now()}`;
  const newUser = {
    id: newUserId,
    name,
    phone,
    balance: 100, // free signup bonus
    totalEarnings: 100,
    dailyEarned: 0,
    checkedInToday: false,
    inviteCode: Math.floor(10000 + Math.random() * 90000).toString(),
    inviterCode,
    role: 'user',
    password,
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

  // 2. Merge plans (Admin changes are source of truth)
  if (Array.isArray(incoming.plans) && incoming.plans.length > 0) {
    db.plans = incoming.plans;
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
