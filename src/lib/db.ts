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
  // Retry Firestore connection after 15 minutes
  if (Date.now() - quotaExceededTime > 15 * 60 * 1000) {
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
    code.includes('resource-exhausted') ||
    code.includes('quota') ||
    msg.includes('quota limit') ||
    msg.includes('quota') ||
    msg.includes('resource_exhausted') ||
    msg.includes('resource-exhausted') ||
    msg.includes('exceeded')
  ) {
    if (!firestoreQuotaExceeded) {
      console.warn("[Firestore Quota Exceeded] Circuit breaker activated. App will seamlessly operate on LocalStorage.");
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

  // 2. Check main localStorage key
  try {
    const mainRaw = localStorage.getItem('adpaint_purchases');
    if (mainRaw) {
      const parsedMain = JSON.parse(mainRaw);
      if (Array.isArray(parsedMain)) {
        parsedMain.forEach((p: PurchaseRecord) => {
          if (p && p.id && !deletedPurchases.includes(p.id) && (p.userId === userId || !p.userId)) {
            if (!map.has(p.id)) map.set(p.id, p);
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
    if (tx.type === 'purchase' && (tx.userId === userId || !tx.userId)) {
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

  if (!isQuotaExceeded()) {
    try {
      await seedDatabaseIfEmpty();
      const usersColl = collection(db, "users");

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
          // Verify at least one match is not admin
          const foundUser = querySnapshot.docs.some(docSnap => {
            const data = docSnap.data() as UserProfile;
            return docSnap.id !== 'usr_admin' && data.role !== 'admin';
          });
          if (foundUser) return { exists: true };
        }
      }

      if (last10.length >= 10) {
        const docIds = [`usr_${last10}`, `usr_91${last10}`, last10];
        for (const dId of docIds) {
          const userDocRef = doc(db, "users", dId);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            const uData = userSnap.data() as UserProfile;
            if (uData && uData.role !== 'admin' && dId !== 'usr_admin') {
              const uDigits = (uData.phone || "").replace(/\D/g, "");
              if (uDigits.length >= 10 && uDigits.slice(-10) === last10) {
                return { exists: true };
              }
            }
          }
        }
      }

      const allUsersSnap = await getDocs(usersColl);
      let found = false;
      allUsersSnap.forEach((docSnap) => {
        if (found) return;
        if (docSnap.id === 'usr_admin') return;
        const uData = docSnap.data() as UserProfile;
        if (uData.role === 'admin') return;
        const uDigits = uData.phone ? uData.phone.replace(/\D/g, "") : "";
        if (last10 && last10.length >= 10 && uDigits.length >= 10 && uDigits.slice(-10) === last10) {
          found = true;
        }
      });
      if (found) return { exists: true };
    } catch (err) {
      markQuotaExceeded(err);
      console.warn("firestoreCheckPhone firestore read failed (using local check):", err);
    }
  }

  const localUsers = getStoredUsers();
  const exists = localUsers.some(u => {
    if (u.role === 'admin' || u.id === 'usr_admin') return false;
    const uDigits = u.phone ? u.phone.replace(/\D/g, "") : "";
    return (
      last10 && last10.length >= 10 && uDigits.length >= 10 && uDigits.slice(-10) === last10
    );
  });

  return { exists };
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
      await seedDatabaseIfEmpty();
      const usersColl = collection(db, "users");

      if (isAdminInput) {
        const adminDocRef = doc(db, "users", "usr_admin");
        const adminSnap = await getDoc(adminDocRef);
        if (adminSnap.exists()) {
          user = adminSnap.data() as UserProfile;
        }
      }

      if (!user) {
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
          if (user) break;
          const q = query(usersColl, where("phone", "==", cand));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            user = querySnapshot.docs[0].data() as UserProfile;
          }
        }
      }

      if (!user && (last10.length >= 10 || isAdminInput)) {
        const docIds = isAdminInput ? ['usr_admin'] : [`usr_${last10}`, `usr_91${last10}`, last10];
        for (const dId of docIds) {
          if (user) break;
          const userDocRef = doc(db, "users", dId);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            user = userSnap.data() as UserProfile;
          }
        }
      }

      if (!user) {
        const allUsersSnap = await getDocs(usersColl);
        allUsersSnap.forEach((docSnap) => {
          if (user) return;
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
            user = uData;
          }
        });
      }
    } catch (err) {
      markQuotaExceeded(err);
      console.warn("Firestore read failed on login (using local cache):", err);
    }
  }

  // Local fallback lookup if Firestore failed or returned empty
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
      const purchasesColl = collection(db, "purchases");
      const purchasesSnap = await getDocs(purchasesColl);
      const userDigits = user.phone ? user.phone.replace(/\D/g, "") : "";
      const userLast10 = userDigits.length >= 10 ? userDigits.slice(-10) : userDigits;

      purchasesSnap.forEach((docSnap) => {
        const pData = docSnap.data() as PurchaseRecord;
        const pPhoneDigits = (pData as any).userPhone ? String((pData as any).userPhone).replace(/\D/g, "") : "";
        const isMatch = (
          pData.userId === user.id ||
          (pData as any).userId === user.id.replace('usr_', '') ||
          (userLast10 && pPhoneDigits.length >= 10 && pPhoneDigits.endsWith(userLast10)) ||
          pData.userId === user.phone
        );
        if (isMatch) {
          purchases.push(pData);
        }
      });

      const transactionsColl = collection(db, "transactions");
      const txSnap = await getDocs(transactionsColl);
      txSnap.forEach((doc) => {
        transactions.push(doc.data() as TransactionRecord);
      });
    } catch (err) {
      markQuotaExceeded(err);
      console.warn("Firestore purchases/transactions load failed, using local cache:", err);
    }
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

  if (!isQuotaExceeded()) {
    try {
      await seedDatabaseIfEmpty();
      const userDocRef = doc(db, "users", newUserId);
      await setDoc(userDocRef, cleanUndefined(newUser));
      await setDoc(doc(db, "transactions", signupTx.id), cleanUndefined(signupTx));
    } catch (err) {
      markQuotaExceeded(err);
      console.warn("Firestore write failed during registration (saving locally):", err);
    }
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
  let config = SEED_CONFIG;
  let customTicker = null;
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
        if (configData.config) config = configData.config;
        if (configData.customTicker) customTicker = configData.customTicker;
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

      const plansSnap = await getDocs(collection(db, "plans"));
      const fsPlans: InvestmentPlan[] = [];
      plansSnap.forEach((doc) => fsPlans.push(doc.data() as InvestmentPlan));
      if (fsPlans.length > 0) plans = fsPlans;

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
        transactions.forEach(t => txMap.set(t.id, t));
        fsTransactions.forEach(t => txMap.set(t.id, t));
        transactions = Array.from(txMap.values());
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
            const pPhoneDigits = (pObj as any).userPhone ? String((pObj as any).userPhone).replace(/\D/g, "") : "";
            
            const isMatch = (
              pObj.userId === userId ||
              (pObj as any).userId === userId.replace('usr_', '') ||
              (uLast10 && pPhoneDigits.length >= 10 && pPhoneDigits.endsWith(uLast10)) ||
              pObj.userId === uObj?.phone
            );
            if (isMatch) {
              fsPurchases.push(pObj);
            }
          }
        }
      });
      if (fsPurchases.length > 0 || purchases.length > 0) {
        // Merge server and local purchases safely (local purchases retained if not yet on server)
        const pMap = new Map<string, PurchaseRecord>();
        // First add local purchases
        purchases.forEach(p => pMap.set(p.id, p));
        // Server purchases take precedence
        fsPurchases.forEach(p => pMap.set(p.id, p));
        purchases = Array.from(pMap.values());
      }

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
        // Index server users first as authoritative records
        fsUsers.forEach(u => {
          if (u && u.id) uMap.set(u.id, u);
        });

        // Index server phone numbers (last 10 digits)
        const serverPhones = new Set<string>();
        fsUsers.forEach(u => {
          const digits = u.phone ? u.phone.replace(/\D/g, '').slice(-10) : '';
          if (digits) serverPhones.add(digits);
        });

        // Only add local users if they don't exist on server and don't share a phone number with any server user
        usersList.forEach(u => {
          if (!u || !u.id) return;
          const digits = u.phone ? u.phone.replace(/\D/g, '').slice(-10) : '';
          if (!uMap.has(u.id) && (!digits || !serverPhones.has(digits))) {
            uMap.set(u.id, u);
          }
        });

        usersList = Array.from(uMap.values());
      }
    } catch (err) {
      markQuotaExceeded(err);
      console.warn("firestoreGetState encountered error, serving cached/local state:", err);
    }
  }

  // Merge local stored users with phone deduplication, ensuring server users retain total precedence
  const localUsers = getStoredUsers();
  const userMap = new Map<string, UserProfile>();
  
  // 1. Add current server/merged users first
  usersList.forEach(u => {
    if (u && u.id) userMap.set(u.id, u);
  });

  const activePhones = new Set<string>();
  usersList.forEach(u => {
    const digits = u.phone ? u.phone.replace(/\D/g, '').slice(-10) : '';
    if (digits) activePhones.add(digits);
  });

  // 2. Add stored local users only if not on server & no phone overlap
  localUsers.forEach(u => {
    if (!u || !u.id) return;
    const digits = u.phone ? u.phone.replace(/\D/g, '').slice(-10) : '';
    if (!userMap.has(u.id) && (!digits || !activePhones.has(digits))) {
      userMap.set(u.id, u);
    }
  });

  usersList = Array.from(userMap.values());

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

      // Sync plans to Firestore plans collection so all browsers and APKs get identical admin plan prices
      if (Array.isArray(plans) && plans.length > 0) {
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

  return await firestoreGetState(userId);
}
