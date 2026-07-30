import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  writeBatch 
} from "firebase/firestore";
import { db } from "./firebase";
import { UserProfile, InvestmentPlan, TransactionRecord, PurchaseRecord } from "../types";

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
    id: "usr_admin",
    name: "System Admin",
    phone: "+91 9999999999",
    balance: 100000,
    totalEarnings: 100000,
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
  adpaint_tg_channel: "https://t.me/PropertyNc",
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

// Helper to seed Firestore if empty
let isSeeding = false;
export async function seedDatabaseIfEmpty() {
  if (isSeeding) return;
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
    console.warn("Error seeding Firestore database (skipping):", error);
  } finally {
    isSeeding = false;
  }
}

// Local Storage Fallback Helpers
function getStoredUsers(): UserProfile[] {
  try {
    const raw = localStorage.getItem('adpaint_users_list');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const map = new Map<string, UserProfile>();
        SEED_USERS.forEach(u => map.set(u.id, u));
        parsed.forEach((u: UserProfile) => map.set(u.id, u));
        return Array.from(map.values());
      }
    }
  } catch (e) {}
  return SEED_USERS;
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

function getStoredPurchases(userId: string): PurchaseRecord[] {
  try {
    const raw = localStorage.getItem(`adpaint_purchases_${userId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
    const rawMain = localStorage.getItem('adpaint_purchases');
    if (rawMain) {
      const parsedMain = JSON.parse(rawMain);
      if (Array.isArray(parsedMain)) {
        return parsedMain.filter((p: any) => p.userId === userId);
      }
    }
  } catch (e) {}
  return [];
}

function getStoredPlans(): InvestmentPlan[] {
  try {
    const raw = localStorage.getItem('adpaint_plans');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return SEED_PLANS;
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
  const digitsOnly = cleanedPhone.replace(/\D/g, "");
  const last10 = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;

  try {
    await seedDatabaseIfEmpty();
    const usersColl = collection(db, "users");
    const q = query(usersColl, where("phone", "==", cleanedPhone));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return { exists: true };
    }

    if (last10.length >= 10) {
      const userDocRef = doc(db, "users", `usr_${last10}`);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        return { exists: true };
      }
    }
  } catch (err) {
    console.warn("firestoreCheckPhone firestore read failed (using local check):", err);
  }

  const localUsers = getStoredUsers();
  const exists = localUsers.some(u => {
    const uDigits = u.phone ? u.phone.replace(/\D/g, "") : "";
    return (uDigits.length >= 10 && uDigits.endsWith(last10)) || u.phone === cleanedPhone;
  });

  return { exists };
}

// User login
export async function firestoreLogin(payload: { phone: string; password_entered: string }): Promise<any> {
  const { phone, password_entered } = payload;
  const cleanedPhone = cleanPhoneNumber(phone);
  const digitsOnly = cleanedPhone.replace(/\D/g, "");
  const last10 = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;

  let user: UserProfile | null = null;
  let purchases: PurchaseRecord[] = [];
  let transactions: TransactionRecord[] = [];

  try {
    await seedDatabaseIfEmpty();
    const usersColl = collection(db, "users");
    let q = query(usersColl, where("phone", "==", cleanedPhone));
    let querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      user = userDoc.data() as UserProfile;
    } else if (last10.length >= 10) {
      const userDocRef = doc(db, "users", `usr_${last10}`);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        user = userSnap.data() as UserProfile;
      }
    }
  } catch (err) {
    console.warn("Firestore read failed on login (using local cache):", err);
  }

  // Local fallback lookup if Firestore failed or returned empty
  if (!user) {
    const localUsers = getStoredUsers();
    user = localUsers.find(u => {
      const uDigits = u.phone ? u.phone.replace(/\D/g, "") : "";
      return (uDigits.length >= 10 && uDigits.endsWith(last10)) || u.phone === cleanedPhone;
    }) || null;
  }

  if (!user) {
    throw new Error("Mobile number not registered! Please sign up first.");
  }

  if (user.status === 'blocked') {
    throw new Error("Your account has been suspended by Admin.");
  }

  if (user.password && user.password !== password_entered) {
    throw new Error("Incorrect password!");
  }

  // Load active purchases & transactions
  try {
    const purchasesColl = collection(db, "purchases");
    const qPurchases = query(purchasesColl, where("userId", "==", user.id));
    const purchasesSnap = await getDocs(qPurchases);
    purchasesSnap.forEach((doc) => {
      purchases.push(doc.data() as PurchaseRecord);
    });

    const transactionsColl = collection(db, "transactions");
    const txSnap = await getDocs(transactionsColl);
    txSnap.forEach((doc) => {
      transactions.push(doc.data() as TransactionRecord);
    });
  } catch (err) {
    console.warn("Firestore purchases/transactions load failed, using local cache:", err);
  }

  if (purchases.length === 0) {
    purchases = getStoredPurchases(user.id);
  }
  if (transactions.length === 0) {
    transactions = getStoredTransactions();
  }

  transactions.sort((a, b) => {
    const timeA = new Date(a.date).getTime() || 0;
    const timeB = new Date(b.date).getTime() || 0;
    return timeB - timeA;
  });

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

  // Check if phone already registered locally or in Firestore
  const check = await firestoreCheckPhone(cleanedPhone);
  if (check.exists) {
    throw new Error("Mobile number already registered! Please log in.");
  }

  const newUser: UserProfile = {
    id: newUserId,
    name,
    phone: cleanedPhone,
    balance: 100, // free signup bonus
    totalEarnings: 100,
    dailyEarned: 0,
    checkedInToday: false,
    inviteCode: Math.floor(10000 + Math.random() * 90000).toString(),
    inviterCode: inviterCode || "",
    role: 'user',
    password: password_entered,
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

  try {
    await seedDatabaseIfEmpty();
    const userDocRef = doc(db, "users", newUserId);
    await setDoc(userDocRef, cleanUndefined(newUser));
    await setDoc(doc(db, "transactions", signupTx.id), cleanUndefined(signupTx));
  } catch (err) {
    console.warn("Firestore write failed during registration (saving locally):", err);
  }

  // Update local storage so user is registered & saved locally
  const storedUsers = getStoredUsers();
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
  const digitsOnly = cleanedPhone.replace(/\D/g, "");
  const last10 = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;

  try {
    await seedDatabaseIfEmpty();
    const usersColl = collection(db, "users");
    const q = query(usersColl, where("phone", "==", cleanedPhone));
    const querySnapshot = await getDocs(q);
    
    let userDocRef = null;

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      userDocRef = doc(db, "users", userDoc.id);
    } else if (last10.length >= 10) {
      const deterministicRef = doc(db, "users", `usr_${last10}`);
      const userSnap = await getDoc(deterministicRef);
      if (userSnap.exists()) {
        userDocRef = deterministicRef;
      }
    }

    if (userDocRef) {
      await updateDoc(userDocRef, { password: password_entered });
    }
  } catch (err) {
    console.warn("Firestore reset password error (updating local store):", err);
  }

  // Update local storage
  const localUsers = getStoredUsers();
  const userObj = localUsers.find(u => {
    const uDigits = u.phone ? u.phone.replace(/\D/g, "") : "";
    return (uDigits.length >= 10 && uDigits.endsWith(last10)) || u.phone === cleanedPhone;
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
  let config = SEED_CONFIG;
  let customTicker = null;
  let plans: InvestmentPlan[] = getStoredPlans();
  let transactions: TransactionRecord[] = getStoredTransactions();
  let purchases: PurchaseRecord[] = userId ? getStoredPurchases(userId) : [];
  let usersList: UserProfile[] = getStoredUsers();

  try {
    await seedDatabaseIfEmpty();

    const configSnap = await getDoc(doc(db, "global", "config"));
    if (configSnap.exists()) {
      const configData = configSnap.data();
      if (configData.config) config = configData.config;
      if (configData.customTicker) customTicker = configData.customTicker;
    }

    const plansSnap = await getDocs(collection(db, "plans"));
    const fsPlans: InvestmentPlan[] = [];
    plansSnap.forEach((doc) => fsPlans.push(doc.data() as InvestmentPlan));
    if (fsPlans.length > 0) plans = fsPlans;

    const transactionsSnap = await getDocs(collection(db, "transactions"));
    const fsTransactions: TransactionRecord[] = [];
    transactionsSnap.forEach((doc) => fsTransactions.push(doc.data() as TransactionRecord));
    if (fsTransactions.length > 0) transactions = fsTransactions;

    if (userId) {
      const q = query(collection(db, "purchases"), where("userId", "==", userId));
      const purchasesSnap = await getDocs(q);
      const fsPurchases: PurchaseRecord[] = [];
      purchasesSnap.forEach((doc) => fsPurchases.push(doc.data() as PurchaseRecord));
      if (fsPurchases.length > 0) purchases = fsPurchases;
    }

    const usersSnap = await getDocs(collection(db, "users"));
    const fsUsers: UserProfile[] = [];
    usersSnap.forEach((doc) => fsUsers.push(doc.data() as UserProfile));
    if (fsUsers.length > 0) usersList = fsUsers;
  } catch (err) {
    console.warn("firestoreGetState encountered error, serving cached/local state:", err);
  }

  // Always merge local stored users to avoid losing newly registered local users when Firestore is unavailable
  const localUsers = getStoredUsers();
  const userMap = new Map<string, UserProfile>();
  usersList.forEach(u => userMap.set(u.id, u));
  localUsers.forEach(u => userMap.set(u.id, u));
  usersList = Array.from(userMap.values());

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
  const { userId, usersList, plans, transactions, purchases, config, customTicker } = payload;

  // Persist locally first so offline / quota-exceeded changes are never lost!
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

  let isAdmin = userId === 'usr_admin';
  if (!isAdmin && Array.isArray(usersList)) {
    const caller = usersList.find(u => u.id === userId);
    if (caller && caller.role === 'admin') {
      isAdmin = true;
    }
  }

  try {
    await seedDatabaseIfEmpty();

    if (Array.isArray(usersList)) {
      const userBatch = writeBatch(db);
      for (const u of usersList) {
        if (!isAdmin && u.id !== userId) continue;
        const docRef = doc(db, "users", u.id);
        userBatch.set(docRef, cleanUndefined(u), { merge: true });
      }
      await userBatch.commit();
    }

    if (isAdmin) {
      const configDocRef = doc(db, "global", "config");
      await setDoc(configDocRef, cleanUndefined({ config, customTicker }), { merge: true });
    }

    if (isAdmin && Array.isArray(plans) && plans.length > 0) {
      const plansBatch = writeBatch(db);
      for (const plan of plans) {
        plansBatch.set(doc(db, "plans", plan.id), cleanUndefined(plan), { merge: true });
      }
      await plansBatch.commit();
    }

    if (Array.isArray(transactions)) {
      const txBatch = writeBatch(db);
      for (const tx of transactions) {
        if (!isAdmin && tx.userId !== userId) continue;
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
    console.warn("firestoreSaveState error (saved locally):", err);
  }

  return await firestoreGetState(userId);
}
