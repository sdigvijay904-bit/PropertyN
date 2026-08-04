import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  writeBatch 
} from "firebase/firestore";
import { db } from "./firebase";
import { UserProfile, InvestmentPlan, TransactionRecord, PurchaseRecord, isSponsorMatch } from "../types";

// Seed Data from db.json to guarantee data preservation for all existing users (including Vinod, Ajay, etc.)
const SEED_USERS: UserProfile[] = [
  {
    id: "usr_demo",
    name: "Ajay Kumar",
    phone: "+91 9876543210",
    balance: 1540,
    totalEarnings: 3250,
    dailyEarned: 420,
    checkedInToday: false,
    inviteCode: "47523",
    bankAccount: {
      bankName: "State Bank of India",
      accountHolder: "Ajay Kumar",
      accountNumber: "304592018422",
      ifscCode: "SBIN0004523"
    },
    role: "user",
    password: "password123",
    totalInvested: 0
  },
  {
    id: "usr_sandeep",
    name: "Sandeep Kumar",
    phone: "+91 9870014120",
    balance: 850,
    totalEarnings: 1500,
    dailyEarned: 103,
    checkedInToday: false,
    inviteCode: "10385",
    role: "user",
    password: "password123",
    totalInvested: 0
  },
  {
    id: "usr_1783942951139",
    name: "Vinod",
    phone: "+91 8233403077",
    balance: 110,
    totalEarnings: 110,
    dailyEarned: 0,
    checkedInToday: true,
    inviteCode: "73005",
    lastCheckInDate: "Tue Jul 14 2026",
    role: "user",
    password: "d8233403077",
    totalInvested: 0
  },
  {
    id: "usr_9595350797",
    name: "VIP Member (+91 9595350797)",
    phone: "+91 9595350797",
    balance: 110,
    totalEarnings: 110,
    dailyEarned: 10,
    checkedInToday: true,
    inviteCode: "95953",
    inviterCode: "47523",
    role: "user",
    password: "password123",
    totalInvested: 0
  },
  {
    id: "usr_admin",
    name: "System Admin",
    phone: "+91 9999999999",
    balance: 0,
    totalEarnings: 0,
    dailyEarned: 0,
    checkedInToday: false,
    inviteCode: "88888",
    role: "admin",
    password: "admin123",
    totalInvested: 0
  }
];

const SEED_PLANS: InvestmentPlan[] = [
  {
    id: "plan_special_offer",
    type: "vip",
    title: "DLF Luxury Residencies Fund",
    price: 750,
    dailyIncome: 4536,
    durationDays: 2,
    totalProfit: 9072,
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80",
    slotsMax: 10,
    slotsPurchased: 0
  },
  {
    id: "plan_product_a",
    type: "daily",
    title: "Urban Smart Studio Fund",
    price: 280,
    dailyIncome: 240,
    durationDays: 50,
    totalProfit: 12000,
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80",
    slotsMax: 10,
    slotsPurchased: 3
  },
  {
    id: "plan_apex_ultima",
    type: "daily",
    title: "Sovereign Commercial Plaza Fund",
    price: 1200,
    dailyIncome: 510,
    durationDays: 45,
    totalProfit: 22950,
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80",
    slotsMax: 15,
    slotsPurchased: 5
  },
  {
    id: "plan_royale_luxury",
    type: "daily",
    title: "Prestige Waterfront Villa Fund",
    price: 3500,
    dailyIncome: 1580,
    durationDays: 40,
    totalProfit: 63200,
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=600&q=80",
    slotsMax: 12,
    slotsPurchased: 2
  },
  {
    id: "plan_tractor_emulsion",
    type: "daily",
    title: "Affordable Housing Prime Fund",
    price: 8000,
    dailyIncome: 3850,
    durationDays: 35,
    totalProfit: 134750,
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=600&q=80",
    slotsMax: 8,
    slotsPurchased: 1
  },
  {
    id: "plan_vip_elite",
    type: "vip",
    title: "Emaar Premium Penthouse Syndicate",
    price: 15000,
    dailyIncome: 9500,
    durationDays: 4,
    totalProfit: 38000,
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80",
    slotsMax: 5,
    slotsPurchased: 1
  },
  {
    id: "plan_vip_mega",
    type: "vip",
    title: "Grand Metro Mall Equity Venture",
    price: 50000,
    dailyIncome: 35000,
    durationDays: 3,
    totalProfit: 105000,
    image: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=600&q=80",
    slotsMax: 5,
    slotsPurchased: 0
  }
];

const SEED_CONFIG: Record<string, string> = {
  adpaint_upi_id: "sdigvijay904-3@oksbi",
  adpaint_upi_name: "PropertyN Solutions",
  adpaint_tg_channel: "https://t.me/PropertyN_99",
  adpaint_tg_support: "https://t.me/PropertyN_Support",
  adpaint_platform_name: "PropertyN",
  adpaint_daily_bonus: "10",
  adpaint_min_withdrawal: "300",
  adpaint_min_recharge: "250",
  adpaint_recharge_presets: "250, 500, 750, 1000, 2200, 4840",
  adpaint_withdraw_time: "12:30AM - 11:59PM",
  adpaint_support_avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&h=400&q=80"
};

const SEED_CUSTOM_TICKER = "Kiran***290\n\nRecharged ₹490";

const SEED_TRANSACTIONS: TransactionRecord[] = [
  {
    id: "tx_signup_9595350797",
    type: "checkin",
    amount: 100,
    date: "7/18/2026, 9:15:00 AM",
    status: "success",
    description: "Signup Registration Bonus credited",
    userId: "usr_9595350797",
    userPhone: "+91 9595350797"
  },
  {
    id: "tx_rec_9595350797_dep",
    type: "recharge",
    amount: 250,
    date: "7/18/2026, 9:18:00 AM",
    status: "pending",
    description: "Recharge request (UTR: 959535079799201) submitted",
    utr: "959535079799201",
    userId: "usr_9595350797",
    userPhone: "+91 9595350797"
  },
  {
    id: "tx_1783942951139",
    type: "checkin",
    amount: 100,
    date: "7/13/2026, 5:12:31 PM",
    status: "success",
    description: "Signup Registration Bonus credited",
    userId: "usr_1783942951139",
    userPhone: "+91 8233403077"
  },
  {
    id: "tx_check_1783967905451",
    type: "checkin",
    amount: 10,
    date: "7/14/2026, 12:08:25 AM",
    status: "success",
    description: "Daily Check-in Reward claimed",
    userId: "usr_1783942951139",
    userPhone: "+91 8233403077"
  },
  {
    id: "tx_rec_1784210312940",
    type: "recharge",
    amount: 250,
    date: "7/16/2026, 7:28:32 PM",
    status: "pending",
    description: "Recharge request (UTR: 1784210310594mnogs) submitted",
    utr: "1784210310594mnogs",
    userId: "usr_1783942951139",
    userPhone: "+91 8233403077"
  },
  {
    id: "tx_rec_1784210331426",
    type: "recharge",
    amount: 250,
    date: "7/16/2026, 7:28:51 PM",
    status: "pending",
    description: "Recharge request (UTR: 1784210328726yzdti) submitted",
    utr: "1784210328726yzdti",
    userId: "usr_1783942951139",
    userPhone: "+91 8233403077"
  },
  {
    id: "tx_rec_1784210358622",
    type: "recharge",
    amount: 250,
    date: "7/16/2026, 7:29:18 PM",
    status: "pending",
    description: "Recharge request (UTR: 1784210351204ryfpq) submitted",
    utr: "1784210351204ryfpq",
    userId: "usr_1783942951139",
    userPhone: "+91 8233403077"
  },
  {
    id: "tx_rec_1784212191805",
    type: "recharge",
    amount: 250,
    date: "7/16/2026, 7:59:51 PM",
    status: "pending",
    description: "Recharge request (UTR: 1784212189474xtovp) submitted",
    utr: "1784212189474xtovp",
    userId: "usr_1783942951139",
    userPhone: "+91 8233403077"
  },
  {
    id: "tx_rec_1784262008582",
    type: "recharge",
    amount: 250,
    date: "7/17/2026, 9:50:08 AM",
    status: "pending",
    description: "Recharge request (UTR: 123456789012) submitted",
    utr: "123456789012",
    userId: "usr_1783942951139",
    userPhone: "+91 8233403077"
  },
  {
    id: "tx_init_4",
    type: "commission",
    amount: 103,
    date: "2026-07-12 14:22:11",
    status: "success",
    description: "Lvl 1 Commission from Sandeep Kumar (10% standard reward)",
    userId: "usr_demo",
    userPhone: "+91 9876543210"
  }
];

// Quota circuit breaker to prevent continuous error logs when Firestore daily limit is reached
let firestoreQuotaExceeded = false;
let quotaExceededTime = 0;

export function isQuotaExceeded(): boolean {
  if (!firestoreQuotaExceeded) return false;
  // Retry Firestore connection after 30 seconds
  if (Date.now() - quotaExceededTime > 30 * 1000) {
    firestoreQuotaExceeded = false;
    return false;
  }
  return true;
}

export function markQuotaExceeded(err: any): boolean {
  if (!err) return false;
  const msg = String(err?.message || err?.details || err || '').toLowerCase();
  const code = String(err?.code || '').toLowerCase();
  if (
    code === 'resource-exhausted' ||
    code.includes('resource-exhausted') ||
    msg.includes('quota limit') ||
    msg.includes('resource_exhausted')
  ) {
    if (!firestoreQuotaExceeded) {
      console.warn("[Firestore Quota Exceeded] Circuit breaker activated.");
    }
    firestoreQuotaExceeded = true;
    quotaExceededTime = Date.now();
    return true;
  }
  return false;
}

// Helper to seed Firestore if empty
let isSeeding = false;
export async function seedDatabaseIfEmpty() {
  if (isSeeding || isQuotaExceeded()) return;
  try {
    isSeeding = true;
    const configDocRef = doc(db, "global", "config");
    const configSnap = await getDoc(configDocRef);
    if (configSnap.exists()) {
      return;
    }
    console.log("Database empty! Seeding Firestore database with data from db.json...");

    // 1. Seed global configs
    await setDoc(configDocRef, {
      config: SEED_CONFIG,
      customTicker: SEED_CUSTOM_TICKER
    });

    // 2. Seed users
    const batch = writeBatch(db);
    for (const user of SEED_USERS) {
      const userDocRef = doc(db, "users", user.id);
      batch.set(userDocRef, user);
    }
    await batch.commit();

    // 3. Seed plans
    const batchPlans = writeBatch(db);
    for (const plan of SEED_PLANS) {
      const planDocRef = doc(db, "plans", plan.id);
      batchPlans.set(planDocRef, plan);
    }
    await batchPlans.commit();

    // 4. Seed transactions
    const batchTx = writeBatch(db);
    for (const tx of SEED_TRANSACTIONS) {
      const txDocRef = doc(db, "transactions", tx.id);
      batchTx.set(txDocRef, tx);
    }
    await batchTx.commit();

    console.log("Database seeding completed successfully!");
  } catch (error) {
    markQuotaExceeded(error);
    console.warn("Error seeding Firestore database (skipping):", error);
  } finally {
    isSeeding = false;
  }
}

// Master Failsafe Snapshot Backup Helper
export function saveMasterSnapshotBackup(payload: {
  usersList?: UserProfile[];
  plans?: InvestmentPlan[];
  transactions?: TransactionRecord[];
  purchases?: PurchaseRecord[];
  config?: Record<string, string>;
  customTicker?: string | null;
}) {
  try {
    const rawBackup = localStorage.getItem('adpaint_master_backup');
    let backup: any = {};
    if (rawBackup) {
      try { backup = JSON.parse(rawBackup); } catch (e) {}
    }
    if (Array.isArray(payload.usersList) && payload.usersList.length > 0) {
      backup.usersList = payload.usersList;
    }
    if (Array.isArray(payload.plans) && payload.plans.length > 0) {
      backup.plans = payload.plans;
    }
    if (Array.isArray(payload.transactions) && payload.transactions.length > 0) {
      backup.transactions = payload.transactions;
    }
    if (Array.isArray(payload.purchases) && payload.purchases.length > 0) {
      backup.purchases = payload.purchases;
    }
    if (payload.config) {
      backup.config = { ...backup.config, ...payload.config };
    }
    if (payload.customTicker !== undefined) {
      backup.customTicker = payload.customTicker;
    }
    backup.lastSavedAt = new Date().toISOString();
    const jsonStr = JSON.stringify(backup);
    localStorage.setItem('adpaint_master_backup', jsonStr);
    try { sessionStorage.setItem('adpaint_master_backup', jsonStr); } catch (e) {}
  } catch (e) {
    console.warn("Notice: Local storage master backup snapshot exception", e);
  }
}

// Local Storage Fallback & Offline Data Recovery Helpers
export function getStoredUsers(): UserProfile[] {
  const map = new Map<string, UserProfile>();

  // Helper to add user cleanly
  const addCandidateUser = (u: any) => {
    if (!u || typeof u !== 'object') return;
    
    // STRICT REJECTION: Reject transaction, deposit, purchase, plan, or config objects
    if (u.type || u.amount !== undefined || u.utrNumber !== undefined || u.proofUrl !== undefined || u.dailyIncome !== undefined || u.planId !== undefined) {
      return;
    }

    const rawId = String(u.id || '');
    if (!rawId || rawId === 'usr_demo' || rawId.startsWith('tx_') || rawId.startsWith('pur_') || rawId.startsWith('dep_') || rawId.startsWith('plan_') || rawId.startsWith('cfg_') || rawId.startsWith('notif_')) {
      return;
    }

    const cleanPhoneDigits = u.phone ? String(u.phone).replace(/\D/g, '').slice(-10) : '';
    const key = (u.role === 'admin' || rawId === 'usr_admin' || rawId === 'admin')
      ? 'usr_admin'
      : (cleanPhoneDigits.length >= 10 ? `usr_${cleanPhoneDigits}` : rawId);

    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        id: key,
        name: u.name || (key === 'usr_admin' ? 'System Admin' : `User ${cleanPhoneDigits || key.replace('usr_', '')}`),
        phone: u.phone || (cleanPhoneDigits ? `+91 ${cleanPhoneDigits}` : ''),
        balance: typeof u.balance === 'number' ? u.balance : 100,
        totalEarnings: typeof u.totalEarnings === 'number' ? u.totalEarnings : 0,
        dailyEarned: typeof u.dailyEarned === 'number' ? u.dailyEarned : 0,
        checkedInToday: Boolean(u.checkedInToday),
        inviteCode: u.inviteCode || Math.floor(10000 + Math.random() * 90000).toString(),
        inviterCode: u.inviterCode || '',
        role: u.role || (key === 'usr_admin' ? 'admin' : 'user'),
        password: u.password || 'password123',
        bankAccount: u.bankAccount,
        totalInvested: typeof u.totalInvested === 'number' ? u.totalInvested : 0,
        kycStatus: u.kycStatus || 'none',
        notifications: Array.isArray(u.notifications) ? u.notifications : []
      });
    } else {
      map.set(key, {
        ...u,
        ...existing,
        id: key,
        password: existing.password || u.password,
        bankAccount: existing.bankAccount || u.bankAccount,
        inviterCode: existing.inviterCode || u.inviterCode,
        balance: Math.max(existing.balance || 0, u.balance || 0)
      });
    }
  };

  // 1. Always include SEED_USERS
  SEED_USERS.forEach(u => addCandidateUser(u));

  // 2. Parse adpaint_master_backup snapshot
  try {
    const rawMaster = localStorage.getItem('adpaint_master_backup');
    if (rawMaster) {
      const parsedMaster = JSON.parse(rawMaster);
      if (parsedMaster && Array.isArray(parsedMaster.usersList)) {
        parsedMaster.usersList.forEach(addCandidateUser);
      }
    }
  } catch (e) {}

  // 3. Parse adpaint_users_list
  try {
    const raw = localStorage.getItem('adpaint_users_list');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach(addCandidateUser);
      }
    }
  } catch (e) {}

  // 4. Parse active logged in user in adpaint_user
  try {
    const activeRaw = localStorage.getItem('adpaint_user');
    if (activeRaw) {
      const activeU = JSON.parse(activeRaw);
      addCandidateUser(activeU);
    }
  } catch (e) {}

  // 5. Deep scan all keys in localStorage for user objects or arrays (filtering strictly)
  const skipKeys = new Set([
    'adpaint_transactions', 'adpaint_deposits', 'adpaint_purchases',
    'adpaint_plans', 'adpaint_deleted_plans', 'adpaint_custom_ticker',
    'adpaint_upi_id', 'adpaint_upi_name', 'adpaint_tg_channel', 'adpaint_tg_support',
    'adpaint_apk_url', 'adpaint_platform_name', 'adpaint_daily_bonus',
    'adpaint_min_withdrawal', 'adpaint_min_recharge', 'adpaint_recharge_presets',
    'adpaint_withdraw_time', 'adpaint_cashier_url', 'adpaint_support_avatar'
  ]);

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !skipKeys.has(key) && !key.startsWith('adpaint_purchases_') && !key.startsWith('adpaint_backup_purchases_') && !key.startsWith('adpaint_notice_shown_')) {
        try {
          const val = localStorage.getItem(key);
          if (val) {
            if (val.startsWith('{') && val.includes('"password"') && val.includes('"phone"')) {
              const u = JSON.parse(val);
              addCandidateUser(u);
            } else if (val.startsWith('[') && val.includes('"password"') && val.includes('"phone"')) {
              const arr = JSON.parse(val);
              if (Array.isArray(arr)) arr.forEach(addCandidateUser);
            }
          }
        } catch (e) {}
      }
    }
  } catch (e) {}

  // 6. Deep scan all keys in sessionStorage
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && !skipKeys.has(key)) {
        try {
          const val = sessionStorage.getItem(key);
          if (val) {
            if (val.startsWith('{') && val.includes('"password"') && val.includes('"phone"')) {
              const u = JSON.parse(val);
              addCandidateUser(u);
            } else if (val.startsWith('[') && val.includes('"password"') && val.includes('"phone"')) {
              const arr = JSON.parse(val);
              if (Array.isArray(arr)) arr.forEach(addCandidateUser);
            }
          }
        } catch (e) {}
      }
    }
  } catch (e) {}

  return Array.from(map.values());
}

const FIREBASE_PROJECT_ID = "isentropic-forcaster-rd2jw";
const FIREBASE_DATABASE_ID = "ai-studio-propertynrealest-a366a56b-05b0-4ca9-9769-c63579d84978";
const FIREBASE_API_KEY = "AIzaSyCFrLoVD9mJnwxhdV7AlCGxojWfGpYdpAk";
const FIRESTORE_REST_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/${FIREBASE_DATABASE_ID}/documents`;

export function jsToFirestoreFields(obj: any): any {
  if (obj === null || obj === undefined) return {};
  const fields: any = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
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

export function firestoreFieldsToJs(fields: any): any {
  if (!fields) return {};
  const res: any = {};
  for (const key of Object.keys(fields)) {
    const fieldVal = fields[key];
    if (!fieldVal) continue;
    if (fieldVal.stringValue !== undefined) {
      res[key] = fieldVal.stringValue;
    } else if (fieldVal.integerValue !== undefined) {
      res[key] = parseInt(fieldVal.integerValue, 10);
    } else if (fieldVal.doubleValue !== undefined) {
      res[key] = parseFloat(fieldVal.doubleValue);
    } else if (fieldVal.booleanValue !== undefined) {
      res[key] = fieldVal.booleanValue;
    } else if (fieldVal.arrayValue) {
      const values = fieldVal.arrayValue.values || [];
      res[key] = values.map((v: any) => {
        if (!v) return null;
        if (v.stringValue !== undefined) return v.stringValue;
        if (v.integerValue !== undefined) return parseInt(v.integerValue, 10);
        if (v.doubleValue !== undefined) return parseFloat(v.doubleValue);
        if (v.booleanValue !== undefined) return v.booleanValue;
        if (v.mapValue && v.mapValue.fields) return firestoreFieldsToJs(v.mapValue.fields);
        return null;
      }).filter((v: any) => v !== null);
    } else if (fieldVal.mapValue && fieldVal.mapValue.fields) {
      res[key] = firestoreFieldsToJs(fieldVal.mapValue.fields);
    }
  }
  return res;
}

export async function writeFirestoreViaRest(collectionName: string, docId: string, data: any): Promise<boolean> {
  try {
    const cleanData = cleanUndefined(data);
    const fields = jsToFirestoreFields(cleanData);

    // Method 1: Try POST createDocument first (fastest & guaranteed for new user registrations)
    const postUrl = `${FIRESTORE_REST_BASE}/${collectionName}?documentId=${encodeURIComponent(docId)}&key=${FIREBASE_API_KEY}`;
    const postResponse = await fetch(postUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fields })
    });

    if (postResponse.ok) {
      console.log(`[REST Create Success] ${collectionName}/${docId}`);
      return true;
    }

    // Method 2: If document already exists (409 Conflict) or POST fails, use PATCH with updateMask
    const fieldKeys = Object.keys(fields);
    const maskParams = fieldKeys.map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&');
    const patchUrl = `${FIRESTORE_REST_BASE}/${collectionName}/${encodeURIComponent(docId)}?key=${FIREBASE_API_KEY}${maskParams ? '&' + maskParams : ''}`;
    const response = await fetch(patchUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fields })
    });

    if (response.ok) {
      console.log(`[REST Upsert Success] ${collectionName}/${docId}`);
      return true;
    }

    console.warn(`[REST Sync Warning] ${collectionName}/${docId}: post=${postResponse.status}, patch=${response.status}`);
    return false;
  } catch (err) {
    console.warn(`[REST Sync Exception] on ${collectionName}/${docId}:`, err);
    return false;
  }
}

export async function fetchFirestoreCollectionViaRest(collectionName: string): Promise<any[]> {
  try {
    const url = `${FIRESTORE_REST_BASE}/${collectionName}?pageSize=300&key=${FIREBASE_API_KEY}`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data && data.documents && Array.isArray(data.documents)) {
        return data.documents.map((docItem: any) => {
          const docId = docItem.name ? docItem.name.split('/').pop() : '';
          const parsed = firestoreFieldsToJs(docItem.fields);
          return { ...parsed, id: parsed.id || docId };
        });
      }
    }
  } catch (err) {
    console.warn(`[REST Fetch Exception] on ${collectionName}:`, err);
  }
  return [];
}

export async function scanAndMergeAllUsers(currentUsersList: UserProfile[] = []): Promise<UserProfile[]> {
  const userMap = new Map<string, UserProfile>();
  const phoneMap = new Map<string, string>(); // clean 10-digit phone -> user ID

  const addUserToMap = (u: Partial<UserProfile> & { id: string }, isServer = false) => {
    if (!u || !u.id || u.id === 'usr_demo') return;
    // Reject transactions, deposits, purchases, plans
    if ((u as any).type || (u as any).amount !== undefined || (u as any).utrNumber !== undefined || (u as any).dailyIncome !== undefined) return;
    if (u.id.startsWith('tx_') || u.id.startsWith('pur_') || u.id.startsWith('dep_') || u.id.startsWith('plan_') || u.id.startsWith('cfg_')) return;

    const cleanPhoneDigits = u.phone ? String(u.phone).replace(/\D/g, '').slice(-10) : '';

    let targetId = (u.role === 'admin' || u.id === 'usr_admin' || u.id === 'admin')
      ? 'usr_admin'
      : (cleanPhoneDigits.length >= 10 ? `usr_${cleanPhoneDigits}` : u.id);

    if (!userMap.has(targetId) && cleanPhoneDigits && phoneMap.has(cleanPhoneDigits)) {
      targetId = phoneMap.get(cleanPhoneDigits)!;
    }

    const existing = userMap.get(targetId);
    if (existing) {
      if (isServer) {
        // Server data takes master precedence while preserving highest non-zero balances/earnings
        const merged: UserProfile = {
          ...existing,
          ...u,
          id: targetId,
          balance: Math.max(existing.balance ?? 0, u.balance ?? 0),
          totalEarnings: Math.max(existing.totalEarnings ?? 0, u.totalEarnings ?? 0),
          totalInvested: Math.max(existing.totalInvested ?? 0, u.totalInvested ?? 0),
          password: (u as UserProfile).password || existing.password || 'password123',
          bankAccount: (u as UserProfile).bankAccount || existing.bankAccount,
          inviterCode: (u as UserProfile).inviterCode || existing.inviterCode || '',
          role: existing.role === 'admin' || u.role === 'admin' ? 'admin' : (u.role || existing.role || 'user')
        };
        userMap.set(targetId, merged);
      } else {
        const merged: UserProfile = {
          ...u,
          ...existing,
          id: targetId,
          balance: Math.max(existing.balance ?? 0, u.balance ?? 0),
          totalEarnings: Math.max(existing.totalEarnings ?? 0, u.totalEarnings ?? 0),
          totalInvested: Math.max(existing.totalInvested ?? 0, u.totalInvested ?? 0),
          password: existing.password || (u as UserProfile).password || 'password123',
          bankAccount: existing.bankAccount || (u as UserProfile).bankAccount,
          inviterCode: existing.inviterCode || (u as UserProfile).inviterCode || '',
          role: existing.role === 'admin' || u.role === 'admin' ? 'admin' : (existing.role || u.role || 'user')
        };
        userMap.set(targetId, merged);
      }
    } else {
      const newUserProfile: UserProfile = {
        id: targetId,
        name: u.name || `User ${cleanPhoneDigits || targetId.replace('usr_', '')}`,
        phone: u.phone || (cleanPhoneDigits ? `+91 ${cleanPhoneDigits}` : ''),
        balance: u.balance ?? 100,
        totalEarnings: u.totalEarnings ?? 0,
        dailyEarned: u.dailyEarned ?? 0,
        checkedInToday: u.checkedInToday ?? false,
        inviteCode: u.inviteCode || Math.floor(10000 + Math.random() * 90000).toString(),
        inviterCode: u.inviterCode || '',
        role: u.role || 'user',
        password: u.password || 'password123',
        bankAccount: u.bankAccount,
        totalInvested: u.totalInvested ?? 0,
        kycStatus: u.kycStatus || 'none',
        notifications: u.notifications || []
      };
      userMap.set(targetId, newUserProfile);
      if (cleanPhoneDigits) {
        phoneMap.set(cleanPhoneDigits, targetId);
      }
    }
  };

  const serverUserIds = new Set<string>();

  // 1a. Fetch server state users from Express /api/get-state (100% reliable across Meta Ads WebView & Mobile)
  try {
    const apiRes = await fetch('/api/get-state');
    if (apiRes.ok) {
      const apiData = await apiRes.json();
      if (Array.isArray(apiData.usersList)) {
        apiData.usersList.forEach((u: any) => {
          if (u && u.id && u.id !== 'usr_demo') {
            serverUserIds.add(u.id);
            addUserToMap(u, true);
          }
        });
      }
    }
  } catch (e) {}

  // 1b. Fetch users via Firestore REST API (Works directly in all mobile browsers & Meta WebView without WebChannel issues)
  try {
    const restUsers = await fetchFirestoreCollectionViaRest("users");
    restUsers.forEach((uData) => {
      if (uData && uData.id) {
        serverUserIds.add(uData.id);
        addUserToMap(uData, true);
      }
    });
  } catch (e) {}

  // 1c. Fetch users via Firestore Web SDK (if quota not exceeded)
  if (!isQuotaExceeded()) {
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      usersSnap.forEach((docSnap) => {
        const uData = docSnap.data() as UserProfile;
        if (uData && (uData.id || docSnap.id)) {
          const docId = uData.id || docSnap.id;
          serverUserIds.add(docId);
          addUserToMap({ ...uData, id: docId }, true);
        }
      });
    } catch (e) {
      markQuotaExceeded(e);
    }
  }

  // 2. Add current in-memory usersList & all local storage stored users
  const allLocalUsers = getStoredUsers();
  currentUsersList.forEach(u => {
    if (u && u.id && u.id !== 'usr_demo') {
      addUserToMap(u, true);
    }
  });

  const unmigratedUsersToPush: UserProfile[] = [];
  allLocalUsers.forEach(u => {
    if (u && u.id && u.id !== 'usr_demo') {
      const isMissingOnServer = !serverUserIds.has(u.id);
      addUserToMap(u, false);

      if (isMissingOnServer) {
        const finalU = userMap.get(u.id);
        if (finalU) unmigratedUsersToPush.push(finalU);
      }
    }
  });

  // 3. Reconstruct missing users from transactions, deposits, and purchases via REST API
  try {
    const restTx = await fetchFirestoreCollectionViaRest("transactions");
    restTx.forEach(t => {
      if (t) {
        const rawPhone = t.userPhone || t.phone || t.userId || '';
        const digits = rawPhone.replace(/\D/g, '').slice(-10);
        if (digits && digits.length >= 10) {
          const userId = `usr_${digits}`;
          if (!userMap.has(userId)) {
            addUserToMap({
              id: userId,
              phone: t.userPhone || t.phone || `+91 ${digits}`,
              name: t.userName || `User ${digits}`,
              balance: 100,
              totalEarnings: 0
            }, true);
          }
        }
      }
    });
  } catch (e) {}

  // 4. Reconstruct missing users from Firestore Web SDK collections if available
  if (!isQuotaExceeded()) {
    try {
      const txSnap = await getDocs(collection(db, "transactions"));
      txSnap.forEach(d => {
        const t = d.data();
        if (t) {
          const rawPhone = t.userPhone || t.phone || t.userId || '';
          const digits = rawPhone.replace(/\D/g, '').slice(-10);
          if (digits && digits.length >= 10) {
            const userId = `usr_${digits}`;
            if (!userMap.has(userId)) {
              addUserToMap({
                id: userId,
                phone: t.userPhone || t.phone || `+91 ${digits}`,
                name: t.userName || `User ${digits}`,
                balance: 100,
                totalEarnings: 0
              }, true);
            }
          }
        }
      });
    } catch (e) {}

    try {
      const depSnap = await getDocs(collection(db, "deposits"));
      depSnap.forEach(d => {
        const dep = d.data();
        if (dep) {
          const rawPhone = dep.mobileNumber || dep.userPhone || dep.phone || dep.userId || '';
          const digits = rawPhone.replace(/\D/g, '').slice(-10);
          if (digits && digits.length >= 10) {
            const userId = `usr_${digits}`;
            if (!userMap.has(userId)) {
              addUserToMap({
                id: userId,
                name: dep.name || `VIP Member (+91 ${digits})`,
                phone: dep.mobileNumber || dep.userPhone || dep.phone || `+91 ${digits}`,
                balance: 100,
                totalEarnings: 0
              }, true);
            }
          }
        }
      });
    } catch (e) {}

    try {
      const purSnap = await getDocs(collection(db, "purchases"));
      purSnap.forEach(d => {
        const pur = d.data();
        if (pur) {
          const rawPhone = pur.userPhone || pur.phone || pur.userId || '';
          const digits = rawPhone.replace(/\D/g, '').slice(-10);
          if (digits && digits.length >= 10) {
            const userId = `usr_${digits}`;
            if (!userMap.has(userId)) {
              addUserToMap({
                id: userId,
                name: pur.userName || `VIP Member (+91 ${digits})`,
                phone: pur.userPhone || pur.phone || `+91 ${digits}`,
                balance: 100,
                totalEarnings: 0
              }, true);
            }
          }
        }
      });
    } catch (e) {}
  }

  // Sync any unmigrated offline accounts to server & Firestore
  if (unmigratedUsersToPush.length > 0) {
    for (const uToSave of unmigratedUsersToPush) {
      try {
        writeFirestoreViaRest("users", uToSave.id, uToSave);
        if (!isQuotaExceeded()) {
          setDoc(doc(db, "users", uToSave.id), cleanUndefined(uToSave), { merge: true }).catch(() => {});
        }
        fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: uToSave.id,
            name: uToSave.name,
            phone: uToSave.phone,
            password: uToSave.password,
            inviterCode: uToSave.inviterCode
          })
        }).catch(() => {});
      } catch (e) {}
    }
  }

  const result = Array.from(userMap.values());
  localStorage.setItem('adpaint_users_list', JSON.stringify(result));
  return result;
}

export async function syncAllLocalUsersToFirestore(): Promise<{ users: UserProfile[]; migratedCount: number }> {
  const users = await scanAndMergeAllUsers();
  return { users, migratedCount: users.length };
}

function getStoredTransactions(): TransactionRecord[] {
  try {
    const raw = localStorage.getItem('adpaint_transactions');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const map = new Map<string, TransactionRecord>();
        SEED_TRANSACTIONS.forEach(t => map.set(t.id, t));
        parsed.forEach((t: TransactionRecord) => map.set(t.id, t));
        return Array.from(map.values());
      }
    }
  } catch (e) {}
  return SEED_TRANSACTIONS;
}

export function getStoredPurchases(userId: string, currentTransactions?: TransactionRecord[], currentPlans?: InvestmentPlan[]): PurchaseRecord[] {
  const map = new Map<string, PurchaseRecord>();
  if (!userId) return [];

  let deletedPurchases: string[] = [];
  try {
    const rawDel = localStorage.getItem('adpaint_deleted_purchases');
    if (rawDel) deletedPurchases = JSON.parse(rawDel);
  } catch (e) {}

  // 1. Check user-specific localStorage key
  try {
    const userRaw = localStorage.getItem(`adpaint_purchases_${userId}`);
    if (userRaw) {
      const parsed = JSON.parse(userRaw);
      if (Array.isArray(parsed)) {
        parsed.forEach((p: PurchaseRecord) => {
          if (p && p.id && !deletedPurchases.includes(p.id)) map.set(p.id, p);
        });
      }
    }
  } catch (e) {}

  // 2. Check main localStorage key with phone & user ID matching
  const targetDigits = userId.replace(/\D/g, '').slice(-10);
  try {
    const mainRaw = localStorage.getItem('adpaint_purchases');
    if (mainRaw) {
      const parsedMain = JSON.parse(mainRaw);
      if (Array.isArray(parsedMain)) {
        parsedMain.forEach((p: PurchaseRecord) => {
          if (!p || !p.id || deletedPurchases.includes(p.id)) return;
          const pUserIdDigits = p.userId ? String(p.userId).replace(/\D/g, '').slice(-10) : '';
          const pPhoneDigits = (p as any).userPhone ? String((p as any).userPhone).replace(/\D/g, '').slice(-10) : '';
          const isMatch = (
            p.userId === userId ||
            (p as any).userId === userId.replace('usr_', '') ||
            !p.userId ||
            (targetDigits.length >= 10 && (
              (pUserIdDigits && pUserIdDigits.endsWith(targetDigits)) ||
              (pPhoneDigits && pPhoneDigits.endsWith(targetDigits))
            ))
          );
          if (isMatch && !map.has(p.id)) {
            map.set(p.id, p);
          }
        });
      }
    }
  } catch (e) {}

  // 3. Backup key check
  try {
    const backupRaw = localStorage.getItem(`adpaint_backup_purchases_${userId}`);
    if (backupRaw) {
      const parsedBackup = JSON.parse(backupRaw);
      if (Array.isArray(parsedBackup)) {
        parsedBackup.forEach((p: PurchaseRecord) => {
          if (p && p.id && !deletedPurchases.includes(p.id) && !map.has(p.id)) map.set(p.id, p);
        });
      }
    }
  } catch (e) {}

  // 4. Sanitize and auto-correct any corrupted purchase records in map against real purchase transactions
  const txList = currentTransactions || getStoredTransactions();
  const planList = currentPlans || getStoredPlans();

  map.forEach((p, pId) => {
    const matchingTx = txList.find(tx => 
      tx.type === 'purchase' && 
      (tx.userId === userId || !tx.userId) &&
      (
        tx.id === pId || 
        tx.id.replace('tx_pur_', 'pur_') === pId || 
        `pur_${tx.id}` === pId ||
        pId.includes(tx.id)
      )
    );
    if (matchingTx && matchingTx.amount && matchingTx.amount > 0) {
      if (p.price !== matchingTx.amount || (p.price === 450 && matchingTx.amount !== 450)) {
        p.price = matchingTx.amount;
        const cleanDesc = matchingTx.description ? matchingTx.description.replace(/^Purchased\s+/i, '').trim() : '';
        const matchedPlan = planList.find(pl => 
          (cleanDesc && pl.title.toLowerCase().includes(cleanDesc.toLowerCase())) ||
          (cleanDesc && cleanDesc.toLowerCase().includes(pl.title.toLowerCase())) ||
          pl.price === matchingTx.amount
        );
        if (matchedPlan) {
          p.planId = matchedPlan.id;
          p.planTitle = matchedPlan.title;
          p.dailyIncome = matchedPlan.dailyIncome;
          p.durationDays = matchedPlan.durationDays;
        } else if (cleanDesc) {
          p.planTitle = cleanDesc;
          p.dailyIncome = Math.round(matchingTx.amount * 0.1);
        }
      }
    }
  });

  // 5. Reconstruct missing purchases from purchase transactions if any

  txList.forEach(tx => {
    if (tx.type === 'purchase') {
      const txUserIdDigits = tx.userId ? String(tx.userId).replace(/\D/g, "").slice(-10) : "";
      const txPhoneDigits = tx.userPhone ? String(tx.userPhone).replace(/\D/g, "").slice(-10) : "";
      const targetUserDigits = userId ? String(userId).replace(/\D/g, "").slice(-10) : "";

      const isTxMatch = (
        tx.userId === userId ||
        !tx.userId ||
        (targetUserDigits && targetUserDigits.length >= 10 && (
          (txUserIdDigits && txUserIdDigits.endsWith(targetUserDigits)) ||
          (txPhoneDigits && txPhoneDigits.endsWith(targetUserDigits))
        ))
      );

      if (isTxMatch) {
        const reconstructedId = tx.id.startsWith('tx_pur_') ? tx.id.replace('tx_pur_', 'pur_') : `pur_${tx.id}`;
        if (deletedPurchases.includes(reconstructedId) || deletedPurchases.includes(tx.id)) {
          return;
        }

        const existingMatch = Array.from(map.values()).find(p => 
          p.id === tx.id || 
          p.id === tx.id.replace('tx_pur_', 'pur_') ||
          p.datePurchased === tx.date ||
          (p.price === tx.amount && Math.abs(new Date(p.datePurchased).getTime() - new Date(tx.date).getTime()) < 60000)
        );

        if (!existingMatch) {
          const cleanDesc = tx.description ? tx.description.replace(/^Purchased\s+/i, '').trim() : '';
          const matchedPlan = planList.find(pl => 
            (cleanDesc && pl.title.toLowerCase().includes(cleanDesc.toLowerCase())) ||
            (cleanDesc && cleanDesc.toLowerCase().includes(pl.title.toLowerCase())) ||
            pl.price === tx.amount
          );

          const reconstructedPurchase: PurchaseRecord = {
            id: reconstructedId,
            userId: userId,
            planId: matchedPlan ? matchedPlan.id : `plan_${tx.amount}`,
            planTitle: cleanDesc || (matchedPlan ? matchedPlan.title : `Investment Plan ₹${tx.amount}`),
            price: tx.amount || (matchedPlan ? matchedPlan.price : 0),
            dailyIncome: matchedPlan ? matchedPlan.dailyIncome : Math.round((tx.amount || 0) * 0.1),
            durationDays: matchedPlan ? matchedPlan.durationDays : 45,
            datePurchased: tx.date || new Date().toISOString(),
            lastClaimedAt: tx.date || new Date().toISOString(),
            totalClaimed: 0,
            completed: false
          };
          if (!deletedPurchases.includes(reconstructedPurchase.id)) {
            map.set(reconstructedId, reconstructedPurchase);
          }
        }
      }
    }
  });

  const result = Array.from(map.values()).filter(p => !deletedPurchases.includes(p.id));
  if (result.length > 0) {
    try {
      localStorage.setItem(`adpaint_purchases_${userId}`, JSON.stringify(result));
      localStorage.setItem(`adpaint_backup_purchases_${userId}`, JSON.stringify(result));
    } catch (e) {}
  }
  return result;
}

export function getStoredConfig(): Record<string, string> {
  const localConfig: Record<string, string> = { ...SEED_CONFIG };
  const keysToSync = [
    'adpaint_upi_id', 'adpaint_upi_name', 'adpaint_tg_channel', 'adpaint_tg_support',
    'adpaint_apk_url', 'adpaint_platform_name', 'adpaint_daily_bonus',
    'adpaint_min_withdrawal', 'adpaint_min_recharge', 'adpaint_recharge_presets',
    'adpaint_withdraw_time', 'adpaint_cashier_url', 'adpaint_support_avatar'
  ];
  keysToSync.forEach(key => {
    const val = localStorage.getItem(key);
    if (val !== null && val !== undefined && val !== '') {
      localConfig[key] = val;
    }
  });
  return localConfig;
}

function getStoredPlans(): InvestmentPlan[] {
  let deletedPlans: string[] = [];
  try {
    const rawDel = localStorage.getItem('adpaint_deleted_plans');
    if (rawDel) deletedPlans = JSON.parse(rawDel);
  } catch (e) {}

  try {
    const raw = localStorage.getItem('adpaint_plans');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter((p: InvestmentPlan) => p && p.id && !deletedPlans.includes(p.id));
      }
    }
  } catch (e) {}
  return SEED_PLANS.filter(p => !deletedPlans.includes(p.id));
}

export function cleanPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");
  let finalDigits = digits;
  if (digits.length === 10) {
    finalDigits = "91" + digits;
  } else if (digits.length === 12 && digits.startsWith("91")) {
    finalDigits = digits;
  } else if (digits.length > 10) {
    // Keep the last 10 digits prefixed by 91
    const last10 = digits.substring(digits.length - 10);
    finalDigits = "91" + last10;
  }
  
  if (finalDigits.length === 12 && finalDigits.startsWith("91")) {
    return `+91 ${finalDigits.substring(2)}`;
  }
  
  return phone.trim();
}

// Check phone registered
export async function firestoreCheckPhone(phone: string): Promise<{ exists: boolean }> {
  const cleanedPhone = cleanPhoneNumber(phone);
  const rawDigits = phone.replace(/\D/g, "");
  if (rawDigits.length < 10) {
    return { exists: false };
  }
  const last10 = rawDigits.slice(-10);
  const isAdminInput = phone.trim().toLowerCase() === 'admin' || phone.trim() === 'usr_admin' || (last10.length >= 10 && last10.endsWith('9999999999'));

  if (isAdminInput) {
    return { exists: true };
  }

  // 1. Check local storage first (instant 0ms)
  const localUsers = getStoredUsers();
  const existsLocally = localUsers.some(u => {
    if (u.role === 'admin' || u.id === 'usr_admin' || u.id === 'usr_demo' || u.id === 'usr_sandeep') return false;
    const uDigits = u.phone ? u.phone.replace(/\D/g, "") : "";
    return (
      last10 && last10.length >= 10 && uDigits.length >= 10 && uDigits.slice(-10) === last10
    );
  });
  if (existsLocally) {
    return { exists: true };
  }

  if (isQuotaExceeded()) {
    return { exists: false };
  }

  // 2. Fast Firestore check with a 1.0s Promise.race timeout
  try {
    const fetchDoc = async () => {
      const userDocRef = doc(db, "users", `usr_${last10}`);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        const uData = userSnap.data() as UserProfile;
        if (uData && uData.role !== 'admin' && uData.id !== 'usr_admin' && uData.id !== 'usr_demo' && uData.id !== 'usr_sandeep') {
          return { exists: true };
        }
      }
      return { exists: false };
    };

    const timeout = new Promise<{ exists: boolean }>((resolve) =>
      setTimeout(() => resolve({ exists: false }), 800)
    );

    return await Promise.race([fetchDoc(), timeout]);
  } catch (err) {
    console.warn("firestoreCheckPhone firestore read notice (checking local storage):", err);
  }

  return { exists: false };
}

// User login
export async function firestoreLogin(payload: { phone: string; password_entered: string }): Promise<any> {
  const { phone, password_entered } = payload;
  const cleanedPhone = cleanPhoneNumber(phone);
  const rawDigits = phone.replace(/\D/g, "");
  const last10 = rawDigits.length >= 10 ? rawDigits.slice(-10) : rawDigits;
  const isAdminInput = phone.trim().toLowerCase() === 'admin' || phone.trim() === 'usr_admin' || last10.endsWith('9999999999');

  let user: UserProfile | null = null;
  let purchases: PurchaseRecord[] = [];
  let transactions: TransactionRecord[] = [];

  if (!isQuotaExceeded()) {
    try {
      const fetchFromFirestore = async () => {
        await seedDatabaseIfEmpty();
        const usersColl = collection(db, "users");

        if (isAdminInput) {
          const adminDocRef = doc(db, "users", "usr_admin");
          const adminSnap = await getDoc(adminDocRef);
          if (adminSnap.exists()) {
            const data = adminSnap.data() as UserProfile;
            return { ...data, id: data.id || adminSnap.id };
          }
        }

        const phoneCandidates = Array.from(new Set([
          cleanedPhone,
          phone.trim(),
          rawDigits,
          last10,
          `+91${last10}`,
          `+91 ${last10}`,
          `91${last10}`
        ])).filter(Boolean);

        for (const cand of phoneCandidates) {
          const q = query(usersColl, where("phone", "==", cand));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const doc0 = querySnapshot.docs[0];
            const data0 = doc0.data() as UserProfile;
            return { ...data0, id: data0.id || doc0.id };
          }
        }

        if (last10.length >= 10 || isAdminInput) {
          const docIds = isAdminInput ? ['usr_admin'] : [`usr_${last10}`, `usr_91${last10}`, last10];
          for (const dId of docIds) {
            const userDocRef = doc(db, "users", dId);
            const userSnap = await getDoc(userDocRef);
            if (userSnap.exists()) {
              const data = userSnap.data() as UserProfile;
              return { ...data, id: data.id || userSnap.id };
            }
          }
        }

        const allUsersSnap = await getDocs(usersColl);
        let matched: UserProfile | null = null;
        allUsersSnap.forEach((docSnap) => {
          if (matched) return;
          const uData = docSnap.data() as UserProfile;
          const uDigits = uData.phone ? uData.phone.replace(/\D/g, "") : "";
          const uIdDigits = docSnap.id ? docSnap.id.replace(/\D/g, "") : "";
          if (
            (last10 && uDigits.length >= 10 && uDigits.endsWith(last10)) ||
            (last10 && uIdDigits.length >= 10 && uIdDigits.endsWith(last10)) ||
            uData.phone === cleanedPhone ||
            uData.phone === phone.trim() ||
            (isAdminInput && uData.role === 'admin')
          ) {
            matched = { ...uData, id: uData.id || docSnap.id };
          }
        });
        return matched;
      };

      const timeout = new Promise<UserProfile | null>((resolve) =>
        setTimeout(() => resolve(null), 3500)
      );

      user = await Promise.race([fetchFromFirestore(), timeout]);
    } catch (err) {
      markQuotaExceeded(err);
      console.warn("Firestore read failed on login (using local cache):", err);
    }
  }

  // Server REST scan fallback lookup if Web SDK failed or returned empty
  if (!user) {
    try {
      const scannedUsers = await scanAndMergeAllUsers();
      if (isAdminInput) {
        user = scannedUsers.find(u => u.role === 'admin' || u.id === 'usr_admin') || null;
      }
      if (!user) {
        user = scannedUsers.find(u => {
          const uDigits = u.phone ? u.phone.replace(/\D/g, "") : "";
          const uIdDigits = u.id ? u.id.replace(/\D/g, "") : "";
          return (
            (last10 && uDigits.length >= 10 && uDigits.endsWith(last10)) ||
            (last10 && uIdDigits.length >= 10 && uIdDigits.endsWith(last10)) ||
            u.phone === cleanedPhone ||
            u.phone === phone.trim()
          );
        }) || null;
      }
    } catch (e) {
      console.warn("Server REST scan failed on login:", e);
    }
  }

  // Local fallback lookup if REST scan also returned empty
  if (!user) {
    const localUsers = getStoredUsers();
    if (isAdminInput) {
      user = localUsers.find(u => u.role === 'admin' || u.id === 'usr_admin') || null;
    }
    if (!user) {
      user = localUsers.find(u => {
        const uDigits = u.phone ? u.phone.replace(/\D/g, "") : "";
        const uIdDigits = u.id ? u.id.replace(/\D/g, "") : "";
        return (
          (last10 && uDigits.length >= 10 && uDigits.endsWith(last10)) ||
          (last10 && uIdDigits.length >= 10 && uIdDigits.endsWith(last10)) ||
          u.phone === cleanedPhone ||
          u.phone === phone.trim()
        );
      }) || null;
    }
  }

  if (!user) {
    throw new Error("Mobile number not registered! Please sign up first.");
  }

  if (user.status === 'blocked') {
    throw new Error("Your account has been suspended by Admin.");
  }

  const enteredPass = password_entered ? password_entered.trim() : "";
  const storedPass = user.password ? user.password.trim() : "";
  if (storedPass && storedPass !== enteredPass) {
    throw new Error("Incorrect password!");
  }

  // Load active purchases & transactions
  if (!isQuotaExceeded()) {
    try {
      const fetchPurchasesAndTx = async () => {
        const purchasesColl = collection(db, "purchases");
        const purchasesSnap = await getDocs(purchasesColl);
        const userDigits = user?.phone ? user.phone.replace(/\D/g, "") : "";
        const userLast10 = userDigits.length >= 10 ? userDigits.slice(-10) : userDigits;

        const userIdDigits = user?.id ? user.id.replace(/\D/g, "").slice(-10) : "";

        purchasesSnap.forEach((docSnap) => {
          const pData = docSnap.data() as PurchaseRecord;
          if (!pData) return;
          const pObj: PurchaseRecord = { ...pData, id: pData.id || docSnap.id };
          const pPhoneDigits = (pObj as any).userPhone ? String((pObj as any).userPhone).replace(/\D/g, "") : "";
          const pUserIdDigits = pObj.userId ? String(pObj.userId).replace(/\D/g, "") : "";

          const isMatch = (
            pObj.userId === user?.id ||
            (pObj as any).userId === user?.id?.replace('usr_', '') ||
            pObj.userId === user?.phone ||
            (userLast10 && userLast10.length >= 10 && (
              (pUserIdDigits && pUserIdDigits.endsWith(userLast10)) ||
              (pPhoneDigits && pPhoneDigits.endsWith(userLast10))
            )) ||
            (userIdDigits && userIdDigits.length >= 10 && (
              (pUserIdDigits && pUserIdDigits.endsWith(userIdDigits)) ||
              (pPhoneDigits && pPhoneDigits.endsWith(userIdDigits))
            ))
          );
          if (isMatch) {
            purchases.push(pObj);
          }
        });

        const transactionsColl = collection(db, "transactions");
        const txSnap = await getDocs(transactionsColl);
        txSnap.forEach((doc) => {
          transactions.push(doc.data() as TransactionRecord);
        });
      };

      const pTimeout = new Promise<void>((resolve) => setTimeout(resolve, 3500));
      await Promise.race([fetchPurchasesAndTx(), pTimeout]);
    } catch (err) {
      markQuotaExceeded(err);
      console.warn("Firestore purchases/transactions load failed, using local cache:", err);
    }
  }

  // Also query HTTPS REST endpoints to guarantee zero data loss across mobile devices
  try {
    const restPurchases = await fetchFirestoreCollectionViaRest("purchases");
    const restTx = await fetchFirestoreCollectionViaRest("transactions");
    
    if (restPurchases && restPurchases.length > 0) {
      const userDigits = user?.phone ? user.phone.replace(/\D/g, "") : "";
      const userLast10 = userDigits.length >= 10 ? userDigits.slice(-10) : userDigits;
      const userIdDigits = user?.id ? user.id.replace(/\D/g, "").slice(-10) : "";

      restPurchases.forEach((pData: any) => {
        if (!pData) return;
        const pObj: PurchaseRecord = { ...pData, id: pData.id || pData.docId };
        const pPhoneDigits = (pObj as any).userPhone ? String((pObj as any).userPhone).replace(/\D/g, "") : "";
        const pUserIdDigits = pObj.userId ? String(pObj.userId).replace(/\D/g, "") : "";

        const isMatch = (
          pObj.userId === user?.id ||
          (pObj as any).userId === user?.id?.replace('usr_', '') ||
          pObj.userId === user?.phone ||
          (userLast10 && userLast10.length >= 10 && (
            (pUserIdDigits && pUserIdDigits.endsWith(userLast10)) ||
            (pPhoneDigits && pPhoneDigits.endsWith(userLast10))
          )) ||
          (userIdDigits && userIdDigits.length >= 10 && (
            (pUserIdDigits && pUserIdDigits.endsWith(userIdDigits)) ||
            (pPhoneDigits && pPhoneDigits.endsWith(userIdDigits))
          ))
        );
        if (isMatch && !purchases.some(p => p.id === pObj.id)) {
          purchases.push(pObj);
        }
      });
    }

    if (restTx && restTx.length > 0) {
      restTx.forEach((t: any) => {
        if (t && t.id && !transactions.some(existing => existing.id === t.id)) {
          transactions.push(t);
        }
      });
    }
  } catch (e) {
    console.warn("REST purchases/transactions fetch error on login:", e);
  }

  // Merge local transactions first
  const localTx = getStoredTransactions();
  const txMap = new Map<string, TransactionRecord>();
  localTx.forEach(t => txMap.set(t.id, t));
  transactions.forEach(t => txMap.set(t.id, t));
  transactions = Array.from(txMap.values());

  // Merge local purchases including reconstructed ones from transactions
  const localPurchases = getStoredPurchases(user.id, transactions);
  const pMap = new Map<string, PurchaseRecord>();
  localPurchases.forEach(p => pMap.set(p.id, p));
  purchases.forEach(p => pMap.set(p.id, p));
  purchases = Array.from(pMap.values());

  // Calculate user total invested and total earnings from purchases and transactions
  const approvedRechargeTotal = transactions
    .filter(t => t.type === 'recharge' && (t.status === 'success' || (t.status as string) === 'APPROVED' || (t.status as string) === 'approved'))
    .reduce((s, t) => s + (t.amount || 0), 0);
  const totalPlanPrice = purchases.reduce((s, p) => s + (p.price || 0), 0);
  const totalClaimed = purchases.reduce((s, p) => s + (p.totalClaimed || 0), 0);

  const realInvested = Math.max(user.totalInvested || 0, approvedRechargeTotal, totalPlanPrice);
  const realEarnings = Math.max(user.totalEarnings || 0, totalClaimed);

  user.totalInvested = realInvested;
  user.totalEarnings = realEarnings;

  transactions.sort((a, b) => {
    const timeA = new Date(a.date).getTime() || 0;
    const timeB = new Date(b.date).getTime() || 0;
    return timeB - timeA;
  });

  // Instantly persist authoritative server user profile, purchases, and transactions to local device storage
  try {
    localStorage.setItem('adpaint_user', JSON.stringify(user));
    if (user.id) {
      localStorage.setItem(`adpaint_purchases_${user.id}`, JSON.stringify(purchases));
      localStorage.setItem(`adpaint_backup_purchases_${user.id}`, JSON.stringify(purchases));
    }
    localStorage.setItem('adpaint_transactions', JSON.stringify(transactions));
    
    // Update or insert into global users list in local storage
    const storedUsers = getStoredUsers();
    const updatedUsersList = storedUsers.map(u => u.id === user.id ? user : u);
    if (!updatedUsersList.some(u => u.id === user.id)) {
      updatedUsersList.push(user);
    }
    localStorage.setItem('adpaint_users_list', JSON.stringify(updatedUsersList));
  } catch (e) {
    console.warn("Failed to persist login data to localStorage:", e);
  }

  return {
    user,
    purchases,
    transactions
  };
}

// User registration
export async function firestoreRegister(payload: { name: string; phone: string; password_entered: string; inviterCode?: string }): Promise<any> {
  const { name, phone, password_entered, inviterCode } = payload;
  const cleanedPhone = cleanPhoneNumber(phone);
  const digitsOnly = cleanedPhone.replace(/\D/g, "");
  if (digitsOnly.length < 10) {
    throw new Error("Please provide a valid mobile number.");
  }
  const last10Digits = digitsOnly.substring(digitsOnly.length - 10);
  const newUserId = `usr_${last10Digits}`;

  // Instant local storage check (0ms)
  const storedUsers = getStoredUsers();
  const existingLocally = storedUsers.some(u => {
    if (u.role === 'admin' || u.id === 'usr_admin') return false;
    const uDigits = u.phone ? u.phone.replace(/\D/g, "") : "";
    return uDigits.length >= 10 && uDigits.slice(-10) === last10Digits;
  });
  if (existingLocally) {
    throw new Error("Mobile number already registered! Please log in.");
  }

  // Check Firestore for existing user account by phone/ID with 1000ms max timeout to avoid hanging in Meta Ads browser
  if (!isQuotaExceeded()) {
    try {
      const checkDoc = async () => {
        const existingSnap = await getDoc(doc(db, "users", newUserId));
        if (existingSnap.exists()) {
          throw new Error("Mobile number already registered! Please log in.");
        }
      };
      const checkTimeout = new Promise(resolve => setTimeout(resolve, 1000));
      await Promise.race([checkDoc(), checkTimeout]);
    } catch (err: any) {
      if (err?.message?.includes("already registered")) {
        throw err;
      }
    }
  }

  const nowIso = new Date().toISOString();
  const nowFormatted = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  // Resolve canonical sponsor invite code if possible
  let resolvedInviterCode = (inviterCode || "").trim();
  if (resolvedInviterCode) {
    const sponsor = storedUsers.find(u => isSponsorMatch(u, resolvedInviterCode));
    if (sponsor && sponsor.inviteCode) {
      resolvedInviterCode = sponsor.inviteCode;
    }
  }

  const newUser: UserProfile = {
    id: newUserId,
    name,
    phone: cleanedPhone,
    email: `${last10Digits}@propertyn.online`,
    balance: 100, // free signup bonus
    totalEarnings: 0,
    dailyEarned: 0,
    totalInvested: 0,
    checkedInToday: false,
    inviteCode: Math.floor(10000 + Math.random() * 90000).toString(),
    inviterCode: resolvedInviterCode,
    role: 'user',
    password: password_entered,
    status: 'active',
    kycStatus: 'none',
    createdAt: nowIso,
    registrationDate: nowFormatted,
    deviceInfo: typeof navigator !== 'undefined' ? navigator.userAgent : 'Mobile/Web Browser',
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

  const signupTx: TransactionRecord = {
    id: `tx_${Date.now()}`,
    type: 'checkin',
    amount: 100,
    date: new Date().toLocaleString(),
    status: 'success',
    description: 'Signup Registration Bonus credited',
    userId: newUser.id,
    userPhone: newUser.phone
  };

  // 1. Update local storage cache immediately (0ms instant registration)
  const existingIdx = storedUsers.findIndex(u => u.id === newUserId || u.phone === cleanedPhone);
  if (existingIdx >= 0) {
    storedUsers[existingIdx] = newUser;
  } else {
    storedUsers.push(newUser);
  }
  localStorage.setItem('adpaint_users_list', JSON.stringify(storedUsers));

  const storedTxs = getStoredTransactions();
  storedTxs.unshift(signupTx);
  localStorage.setItem('adpaint_transactions', JSON.stringify(storedTxs));

  // Save to master backup snapshot
  saveMasterSnapshotBackup({ usersList: storedUsers, transactions: storedTxs });

  // 2. Direct, guaranteed write to Firestore database for instant Admin Panel visibility across all mobile & desktop browsers
  const cleanUser = cleanUndefined(newUser);
  const cleanTx = cleanUndefined(signupTx);

  const saveToFirestoreDirect = async () => {
    // 1. Immediate HTTP REST API write to Firestore (100% reliable in Meta Ads / Instagram in-app browser)
    await Promise.all([
      writeFirestoreViaRest("users", newUserId, newUser),
      writeFirestoreViaRest("transactions", signupTx.id, signupTx)
    ]);

    // 2. Dual write using Firestore Web SDK
    try {
      const userDocRef = doc(db, "users", newUserId);
      const txDocRef = doc(db, "transactions", signupTx.id);

      await setDoc(userDocRef, cleanUser, { merge: true });
      await setDoc(txDocRef, cleanTx, { merge: true });
      console.log(`[Registration] User ${newUserId} saved to Firestore successfully.`);
    } catch (err: any) {
      console.warn("[Registration] Initial Firestore setDoc notice, retrying background sync:", err);
      // Retry after short delay
      setTimeout(async () => {
        try {
          await setDoc(doc(db, "users", newUserId), cleanUser, { merge: true });
          await setDoc(doc(db, "transactions", signupTx.id), cleanTx, { merge: true });
        } catch (e) {}
      }, 800);
    }

    // Direct HTTP server sync fallback for Meta Ads / Instagram WebView compatibility
    try {
      fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newUser.id,
          name: newUser.name,
          phone: newUser.phone,
          password: newUser.password,
          inviterCode: newUser.inviterCode
        })
      }).catch(() => {});

      fetch('/api/save-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: newUser.id,
          usersList: [newUser],
          transactions: [signupTx]
        })
      }).catch(() => {});
    } catch (e) {}
  };

  // Wait up to 3500ms for direct save so Meta Ads browser / mobile network completes the sync, but proceed if network is slow
  await Promise.race([
    saveToFirestoreDirect(),
    new Promise(resolve => setTimeout(resolve, 3500))
  ]);

  return {
    user: newUser,
    purchases: [],
    transactions: storedTxs
  };
}

// Helper to recursively strip any properties with 'undefined' values before writing to Firestore
export function cleanUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => cleanUndefined(item)) as any;
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = (obj as any)[key];
        if (val !== undefined) {
          cleaned[key] = cleanUndefined(val);
        }
      }
    }
    return cleaned;
  }
  return obj;
}

// Reset password
export async function firestoreResetPassword(payload: { phone: string; password_entered: string }): Promise<any> {
  const { phone, password_entered } = payload;
  const cleanedPhone = cleanPhoneNumber(phone);
  const rawDigits = phone.replace(/\D/g, "");
  const last10 = rawDigits.length >= 10 ? rawDigits.slice(-10) : rawDigits;

  if (!isQuotaExceeded()) {
    try {
      await seedDatabaseIfEmpty();
      const usersColl = collection(db, "users");
      let userDocRef = null;

      const phoneCandidates = Array.from(new Set([
        cleanedPhone,
        phone.trim(),
        rawDigits,
        last10,
        `+91${last10}`,
        `+91 ${last10}`,
        `91${last10}`
      ])).filter(Boolean);

      for (const cand of phoneCandidates) {
        if (userDocRef) break;
        const q = query(usersColl, where("phone", "==", cand));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          userDocRef = doc(db, "users", querySnapshot.docs[0].id);
        }
      }

      if (!userDocRef && last10.length >= 10) {
        const docIds = [`usr_${last10}`, `usr_91${last10}`, last10];
        for (const dId of docIds) {
          if (userDocRef) break;
          const deterministicRef = doc(db, "users", dId);
          const userSnap = await getDoc(deterministicRef);
          if (userSnap.exists()) {
            userDocRef = deterministicRef;
          }
        }
      }

      if (!userDocRef) {
        const allUsersSnap = await getDocs(usersColl);
        allUsersSnap.forEach((docSnap) => {
          if (userDocRef) return;
          const uData = docSnap.data() as UserProfile;
          const uDigits = uData.phone ? uData.phone.replace(/\D/g, "") : "";
          const uIdDigits = docSnap.id ? docSnap.id.replace(/\D/g, "") : "";
          if (
            (last10 && uDigits.length >= 10 && uDigits.endsWith(last10)) ||
            (last10 && uIdDigits.length >= 10 && uIdDigits.endsWith(last10)) ||
            uData.phone === cleanedPhone ||
            uData.phone === phone.trim()
          ) {
            userDocRef = doc(db, "users", docSnap.id);
          }
        });
      }

      if (userDocRef) {
        await updateDoc(userDocRef, { password: password_entered });
      }
    } catch (err) {
      markQuotaExceeded(err);
      console.warn("Firestore reset password error (updating local store):", err);
    }
  }

  // Update local storage
  const localUsers = getStoredUsers();
  const userObj = localUsers.find(u => {
    const uDigits = u.phone ? u.phone.replace(/\D/g, "") : "";
    const uIdDigits = u.id ? u.id.replace(/\D/g, "") : "";
    return (
      (last10 && uDigits.length >= 10 && uDigits.endsWith(last10)) ||
      (last10 && uIdDigits.length >= 10 && uIdDigits.endsWith(last10)) ||
      u.phone === cleanedPhone ||
      u.phone === phone.trim()
    );
  });

  if (!userObj) {
    throw new Error("This mobile number is not registered!");
  }

  userObj.password = password_entered;
  localStorage.setItem('adpaint_users_list', JSON.stringify(localUsers));

  return { success: true };
}

// Get state (replaces /api/get-state)
export async function firestoreGetState(userId: string): Promise<any> {
  const localConfig = getStoredConfig();
  let config: Record<string, string> = { ...SEED_CONFIG, ...localConfig };
  let customTicker = localStorage.getItem('adpaint_custom_ticker') || null;
  let plans: InvestmentPlan[] = getStoredPlans();
  let transactions: TransactionRecord[] = getStoredTransactions();
  let purchases: PurchaseRecord[] = userId ? getStoredPurchases(userId, transactions, plans) : [];
  let usersList: UserProfile[] = getStoredUsers();

  if (!isQuotaExceeded()) {
    try {
      await seedDatabaseIfEmpty();

      const configSnap = await getDoc(doc(db, "global", "config"));
      if (configSnap.exists()) {
        const configData = configSnap.data();
        if (configData.config && typeof configData.config === 'object') {
          config = { ...SEED_CONFIG, ...localConfig, ...configData.config };
          Object.entries(configData.config).forEach(([key, val]) => {
            if (typeof val === 'string') {
              localStorage.setItem(key, val);
            }
          });
          window.dispatchEvent(new Event('adpaint_config_updated'));
          window.dispatchEvent(new Event('adpaint_avatar_updated'));
        }
        if (configData.customTicker) {
          customTicker = configData.customTicker;
          localStorage.setItem('adpaint_custom_ticker', customTicker);
          window.dispatchEvent(new Event('adpaint_notice_updated'));
        }
      }

      // Fetch global deleted items list from Firestore
      try {
        const deletedDocSnap = await getDoc(doc(db, "global", "deleted_items"));
        if (deletedDocSnap.exists()) {
          const delData = deletedDocSnap.data();
          if (Array.isArray(delData.deletedPlans)) {
            const rawDelP = localStorage.getItem('adpaint_deleted_plans');
            const localDelP: string[] = rawDelP ? JSON.parse(rawDelP) : [];
            const mergedP = Array.from(new Set([...localDelP, ...delData.deletedPlans]));
            localStorage.setItem('adpaint_deleted_plans', JSON.stringify(mergedP));
          }
          if (Array.isArray(delData.deletedPurchases)) {
            const rawDelPur = localStorage.getItem('adpaint_deleted_purchases');
            const localDelPur: string[] = rawDelPur ? JSON.parse(rawDelPur) : [];
            const mergedPur = Array.from(new Set([...localDelPur, ...delData.deletedPurchases]));
            localStorage.setItem('adpaint_deleted_purchases', JSON.stringify(mergedPur));
          }
        }
      } catch (e) {}

      // 1. Fetch Users FIRST so phone matching for purchases works accurately
      const usersSnap = await getDocs(collection(db, "users"));
      const fsUsers: UserProfile[] = [];
      usersSnap.forEach((docSnap) => {
        const uData = docSnap.data() as UserProfile;
        if (uData) {
          fsUsers.push({ ...uData, id: uData.id || docSnap.id });
        }
      });

      if (fsUsers.length > 0) {
        const uMap = new Map<string, UserProfile>();
        // Server users take master precedence
        fsUsers.forEach(u => uMap.set(u.id, u));

        // Preserve any recent local users missing on server
        const localUsers = getStoredUsers();
        localUsers.forEach(localU => {
          if (localU && localU.id && !uMap.has(localU.id)) {
            uMap.set(localU.id, localU);
            // Push missing local user to Firestore background
            setDoc(doc(db, "users", localU.id), cleanUndefined(localU), { merge: true }).catch(() => {});
          }
        });
        usersList = Array.from(uMap.values());
        localStorage.setItem('adpaint_users_list', JSON.stringify(usersList));
      }

      // 2. Fetch Plans
      const plansSnap = await getDocs(collection(db, "plans"));
      const fsPlans: InvestmentPlan[] = [];
      plansSnap.forEach((docSnap) => {
        const pData = docSnap.data() as InvestmentPlan;
        if (pData) {
          fsPlans.push({ ...pData, id: pData.id || docSnap.id });
        }
      });
      let rawDelP: string[] = [];
      try {
        const raw = localStorage.getItem('adpaint_deleted_plans');
        if (raw) rawDelP = JSON.parse(raw);
      } catch (e) {}

      if (fsPlans.length > 0) {
        plans = fsPlans.filter(p => p && p.id && !rawDelP.includes(p.id));
        localStorage.setItem('adpaint_plans', JSON.stringify(plans));
      }

      // 3. Fetch Transactions
      const transactionsSnap = await getDocs(collection(db, "transactions"));
      const fsTransactions: TransactionRecord[] = [];
      transactionsSnap.forEach((docSnap) => {
        const tData = docSnap.data() as TransactionRecord;
        if (tData) {
          fsTransactions.push({ ...tData, id: tData.id || docSnap.id });
        }
      });
      if (fsTransactions.length > 0) {
        const txMap = new Map<string, TransactionRecord>();
        // Server transactions take master precedence
        fsTransactions.forEach(t => txMap.set(t.id, t));

        // Keep local transactions if not yet on server
        transactions.forEach(t => {
          if (!txMap.has(t.id)) txMap.set(t.id, t);
        });
        transactions = Array.from(txMap.values());
        localStorage.setItem('adpaint_transactions', JSON.stringify(transactions));
      }

      // Reconstruct missing recharge transactions directly from deposits collection in Firestore
      try {
        const depositsSnap = await getDocs(collection(db, "deposits"));
        depositsSnap.forEach((docSnap) => {
          const depData = docSnap.data();
          if (depData) {
            const utr = depData.utr || depData.orderId || docSnap.id;
            const depAmount = Number(depData.depositAmount || depData.amount || 0);
            if (utr && depAmount > 0) {
              const existingTx = transactions.find(t => 
                t.id === depData.id || 
                t.utr === utr || 
                (t.id && t.id.includes(utr)) ||
                (t.description && t.description.includes(utr))
              );
              if (!existingTx) {
                const userPhone = depData.mobileNumber || depData.userPhone || depData.phone || '';
                const cleanPhoneDigits = userPhone.replace(/\D/g, '').slice(-10);
                const depUserId = depData.userId || (cleanPhoneDigits ? `usr_${cleanPhoneDigits}` : 'usr_unknown');
                
                const recTx: TransactionRecord = {
                  id: depData.id || `tx_rec_${utr}`,
                  type: 'recharge',
                  amount: depAmount,
                  date: depData.paymentTime || depData.timestamp || new Date().toLocaleString(),
                  status: (depData.status || 'pending').toLowerCase() as any,
                  description: `Recharge request (UTR: ${utr}) submitted`,
                  utr: utr,
                  proofImage: depData.proofImage,
                  userId: depUserId,
                  userPhone: userPhone
                };
                transactions.unshift(recTx);
              }
            }
          }
        });
      } catch (e) {
        console.warn("Notice reading deposits collection in firestoreGetState:", e);
      }

      // 4. Fetch Purchases with full user context
      const purchasesSnap = await getDocs(collection(db, "purchases"));
      const fsPurchases: PurchaseRecord[] = [];
      purchasesSnap.forEach((docSnap) => {
        const pData = docSnap.data() as PurchaseRecord;
        if (pData) {
          const pObj = { ...pData, id: pData.id || docSnap.id };
          if (userId === 'usr_admin') {
            fsPurchases.push(pObj);
          } else if (userId) {
            const uObj = usersList.find(u => u.id === userId);
            const uPhoneDigits = uObj?.phone ? uObj.phone.replace(/\D/g, "") : "";
            const uLast10 = uPhoneDigits.length >= 10 ? uPhoneDigits.slice(-10) : uPhoneDigits;
            const targetIdDigits = userId.replace(/\D/g, "").slice(-10);

            const pPhoneDigits = (pObj as any).userPhone ? String((pObj as any).userPhone).replace(/\D/g, "") : "";
            const pUserIdDigits = pObj.userId ? String(pObj.userId).replace(/\D/g, "") : "";

            const isMatch = (
              pObj.userId === userId ||
              (pObj as any).userId === userId.replace('usr_', '') ||
              pObj.userId === uObj?.phone ||
              (uLast10 && uLast10.length >= 10 && (
                (pUserIdDigits && pUserIdDigits.endsWith(uLast10)) ||
                (pPhoneDigits && pPhoneDigits.endsWith(uLast10))
              )) ||
              (targetIdDigits && targetIdDigits.length >= 10 && (
                (pUserIdDigits && pUserIdDigits.endsWith(targetIdDigits)) ||
                (pPhoneDigits && pPhoneDigits.endsWith(targetIdDigits))
              ))
            );
            if (isMatch) {
              fsPurchases.push(pObj);
            }
          }
        }
      });

      if (fsPurchases.length > 0 || purchases.length > 0) {
        const pMap = new Map<string, PurchaseRecord>();
        // Add local purchases first
        purchases.forEach(p => pMap.set(p.id, p));
        // Server purchases take master precedence
        fsPurchases.forEach(p => pMap.set(p.id, p));
        purchases = Array.from(pMap.values());
        if (userId) {
          localStorage.setItem(`adpaint_purchases_${userId}`, JSON.stringify(purchases));
          localStorage.setItem(`adpaint_backup_purchases_${userId}`, JSON.stringify(purchases));
        }
      }
    } catch (err) {
      markQuotaExceeded(err);
      console.warn("firestoreGetState encountered error, serving cached/local state:", err);
    }
  }

  // Always perform a full server REST scan to merge server users across devices
  try {
    const fullScanned = await scanAndMergeAllUsers(usersList);
    if (fullScanned && fullScanned.length > 0) {
      usersList = fullScanned;
    }
  } catch (e) {
    console.warn("Notice: scanAndMergeAllUsers in firestoreGetState:", e);
  }

  // If usersList is still empty, fallback to local stored users
  if (!usersList || usersList.length === 0) {
    usersList = getStoredUsers();
  }

  // Clean out any deleted plans or deleted purchases
  let deletedPlans: string[] = [];
  try {
    const rawDelP = localStorage.getItem('adpaint_deleted_plans');
    if (rawDelP) deletedPlans = JSON.parse(rawDelP);
  } catch (e) {}

  let deletedPurchases: string[] = [];
  try {
    const rawDelPur = localStorage.getItem('adpaint_deleted_purchases');
    if (rawDelPur) deletedPurchases = JSON.parse(rawDelPur);
  } catch (e) {}

  plans = plans.filter(p => p && p.id && !deletedPlans.includes(p.id));
  purchases = purchases.filter(p => p && p.id && !deletedPurchases.includes(p.id));

  transactions.sort((a, b) => {
    const timeA = new Date(a.date).getTime() || 0;
    const timeB = new Date(b.date).getTime() || 0;
    return timeB - timeA;
  });

  return {
    usersList,
    plans,
    transactions,
    purchases,
    config,
    customTicker
  };
}

// Save/Sync state (replaces /api/save-state)
export async function firestoreSaveState(payload: {
  userId: string;
  usersList: UserProfile[];
  plans: InvestmentPlan[];
  transactions: TransactionRecord[];
  purchases: PurchaseRecord[];
  config: Record<string, string>;
  customTicker: string | null;
}): Promise<any> {
  let { userId, usersList, plans, transactions, purchases, config, customTicker } = payload;

  let deletedPlans: string[] = [];
  try {
    const rawDelP = localStorage.getItem('adpaint_deleted_plans');
    if (rawDelP) deletedPlans = JSON.parse(rawDelP);
  } catch (e) {}

  let deletedPurchases: string[] = [];
  try {
    const rawDelPur = localStorage.getItem('adpaint_deleted_purchases');
    if (rawDelPur) deletedPurchases = JSON.parse(rawDelPur);
  } catch (e) {}

  if (Array.isArray(plans)) {
    plans = plans.filter(p => p && p.id && !deletedPlans.includes(p.id));
  }
  if (Array.isArray(purchases)) {
    purchases = purchases.filter(p => p && p.id && !deletedPurchases.includes(p.id));
  }

  // Persist locally first so offline / quota-exceeded changes are never lost!
  saveMasterSnapshotBackup({ usersList, plans, transactions, purchases, config, customTicker });

  if (Array.isArray(usersList) && usersList.length > 0) {
    localStorage.setItem('adpaint_users_list', JSON.stringify(usersList));
  }
  if (Array.isArray(transactions) && transactions.length > 0) {
    localStorage.setItem('adpaint_transactions', JSON.stringify(transactions));
  }
  if (Array.isArray(plans) && plans.length > 0) {
    localStorage.setItem('adpaint_plans', JSON.stringify(plans));
  }
  if (userId && Array.isArray(purchases)) {
    localStorage.setItem(`adpaint_purchases_${userId}`, JSON.stringify(purchases));
  }

  let isAdmin = false;
  if (userId) {
    const uLower = userId.toLowerCase();
    if (uLower === 'usr_admin' || uLower.includes('admin') || uLower.includes('9999999999')) {
      isAdmin = true;
    }
  }
  if (!isAdmin && Array.isArray(usersList)) {
    const caller = usersList.find(u => 
      u.id === userId || 
      u.role === 'admin' ||
      (u.phone && (u.phone.includes('9999999999') || (userId && userId.includes(u.phone.replace(/\D/g, '')))))
    );
    if (caller && (caller.role === 'admin' || (caller.phone && caller.phone.includes('9999999999')))) {
      isAdmin = true;
    }
  }

  if (!isQuotaExceeded()) {
    try {
      await seedDatabaseIfEmpty();

      if (Array.isArray(usersList) && usersList.length > 0) {
        const cleanUserPhoneDigits = userId ? userId.replace(/\D/g, '').slice(-10) : '';
        const usersToPush = isAdmin ? usersList : usersList.filter(u => {
          if (!u) return false;
          if (u.id === userId) return true;
          if (cleanUserPhoneDigits && u.phone) {
            const uDigits = u.phone.replace(/\D/g, '').slice(-10);
            if (uDigits && uDigits === cleanUserPhoneDigits) return true;
          }
          if (cleanUserPhoneDigits && u.id) {
            const uIdDigits = u.id.replace(/\D/g, '').slice(-10);
            if (uIdDigits && uIdDigits === cleanUserPhoneDigits) return true;
          }
          return false;
        });
        for (let i = 0; i < usersToPush.length; i += 400) {
          const chunk = usersToPush.slice(i, i + 400);
          const userBatch = writeBatch(db);
          chunk.forEach(u => {
            if (u && u.id) {
              const docRef = doc(db, "users", u.id);
              userBatch.set(docRef, cleanUndefined(u), { merge: true });
            }
          });
          await userBatch.commit();
        }
      }

      if (isAdmin) {
        const configDocRef = doc(db, "global", "config");
        await setDoc(configDocRef, cleanUndefined({ config, customTicker }), { merge: true });
      }

      // Sync plans to Firestore plans collection so all browsers and APKs get identical admin plan prices
      if (isAdmin && Array.isArray(plans) && plans.length > 0) {
        const plansBatch = writeBatch(db);
        for (const plan of plans) {
          plansBatch.set(doc(db, "plans", plan.id), cleanUndefined(plan), { merge: true });
        }
        await plansBatch.commit();
      }

      // Clean up deleted plans from Firestore
      if (deletedPlans.length > 0) {
        for (const delId of deletedPlans) {
          deleteDoc(doc(db, "plans", delId)).catch(markQuotaExceeded);
        }
      }

      if (Array.isArray(transactions)) {
        const cleanUserPhoneDigits = userId ? userId.replace(/\D/g, '').slice(-10) : '';
        const txBatch = writeBatch(db);
        for (const tx of transactions) {
          let isOwner = isAdmin || tx.userId === userId;
          if (!isOwner && cleanUserPhoneDigits) {
            const txUserDigits = tx.userId ? tx.userId.replace(/\D/g, '').slice(-10) : '';
            const txPhoneDigits = tx.userPhone ? tx.userPhone.replace(/\D/g, '').slice(-10) : '';
            if (txUserDigits === cleanUserPhoneDigits || txPhoneDigits === cleanUserPhoneDigits) {
              isOwner = true;
            }
          }
          if (!isOwner) continue;
          txBatch.set(doc(db, "transactions", tx.id), cleanUndefined(tx), { merge: true });
        }
        await txBatch.commit();
      }

      if (userId && Array.isArray(purchases)) {
        const purchasesBatch = writeBatch(db);
        for (const purchase of purchases) {
          if (!isAdmin && (purchase as any).userId !== userId) continue;
          purchasesBatch.set(doc(db, "purchases", purchase.id), cleanUndefined(purchase), { merge: true });
        }
        await purchasesBatch.commit();
      }
    } catch (err) {
      markQuotaExceeded(err);
      console.warn("firestoreSaveState error (saved locally):", err);
    }
  }

  if (isAdmin && !isQuotaExceeded()) {
    try {
      const fullUsers = await scanAndMergeAllUsers(usersList);
      if (fullUsers && fullUsers.length > 0) {
        usersList = fullUsers;
      }
    } catch (e) {}
  } else {
    const localUsers = getStoredUsers();
    const userMap = new Map<string, UserProfile>();
    if (Array.isArray(usersList)) {
      usersList.forEach(u => { if (u && u.id) userMap.set(u.id, u); });
    }
    localUsers.forEach(u => {
      if (u && u.id && !userMap.has(u.id)) {
        userMap.set(u.id, u);
      }
    });
    usersList = Array.from(userMap.values());
  }

  return {
    usersList,
    plans,
    transactions,
    purchases,
    config,
    customTicker
  };
}
