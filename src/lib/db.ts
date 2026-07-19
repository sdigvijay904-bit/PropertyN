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
  adpaint_withdraw_time: "12:30AM - 11:59PM"
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
    const configDocRef = doc(db, "global", "config");
    const configSnap = await getDoc(configDocRef);
    if (configSnap.exists()) {
      // already seeded
      return;
    }
    isSeeding = true;
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
    console.error("Error seeding Firestore database:", error);
  } finally {
    isSeeding = false;
  }
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
  await seedDatabaseIfEmpty();
  const cleanedPhone = cleanPhoneNumber(phone);
  try {
    const usersColl = collection(db, "users");
    const q = query(usersColl, where("phone", "==", cleanedPhone));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return { exists: true };
    }

    // Also check deterministic user doc ID as fallback / double check
    const digitsOnly = cleanedPhone.replace(/\D/g, "");
    if (digitsOnly.length >= 10) {
      const last10Digits = digitsOnly.substring(digitsOnly.length - 10);
      const userDocRef = doc(db, "users", `usr_${last10Digits}`);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        return { exists: true };
      }

      // Broad scan check for last 10 digits in phone field
      const allUsersSnap = await getDocs(usersColl);
      let found = false;
      allUsersSnap.forEach((docSnap) => {
        const u = docSnap.data() as UserProfile;
        if (u.phone) {
          const uDigits = u.phone.replace(/\D/g, "");
          if (uDigits.endsWith(last10Digits)) {
            found = true;
          }
        }
      });
      if (found) {
        return { exists: true };
      }
    }

    return { exists: false };
  } catch (err) {
    console.error("firestoreCheckPhone error:", err);
    return { exists: false };
  }
}

// User login
export async function firestoreLogin(payload: { phone: string; password_entered: string }): Promise<any> {
  await seedDatabaseIfEmpty();
  const { phone, password_entered } = payload;
  const cleanedPhone = cleanPhoneNumber(phone);
  try {
    const usersColl = collection(db, "users");
    let q = query(usersColl, where("phone", "==", cleanedPhone));
    let querySnapshot = await getDocs(q);
    let user: UserProfile | null = null;
    
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      user = userDoc.data() as UserProfile;
    } else {
      // If query by phone field did not match, try querying by deterministic document ID
      const digitsOnly = cleanedPhone.replace(/\D/g, "");
      if (digitsOnly.length >= 10) {
        const last10Digits = digitsOnly.substring(digitsOnly.length - 10);
        const userDocRef = doc(db, "users", `usr_${last10Digits}`);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          user = userSnap.data() as UserProfile;
        } else {
          // Broad scan check as fallback
          const allUsersSnap = await getDocs(usersColl);
          allUsersSnap.forEach((docSnap) => {
            const u = docSnap.data() as UserProfile;
            if (u.phone) {
              const uDigits = u.phone.replace(/\D/g, "");
              if (uDigits.endsWith(last10Digits)) {
                user = u;
              }
            }
          });
        }
      }
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

    // Load active purchases
    const purchasesColl = collection(db, "purchases");
    const qPurchases = query(purchasesColl, where("userId", "==", user.id));
    const purchasesSnap = await getDocs(qPurchases);
    const purchases: PurchaseRecord[] = [];
    purchasesSnap.forEach((doc) => {
      purchases.push(doc.data() as PurchaseRecord);
    });

    // Load transactions
    const transactionsColl = collection(db, "transactions");
    const txSnap = await getDocs(transactionsColl);
    const transactions: TransactionRecord[] = [];
    txSnap.forEach((doc) => {
      transactions.push(doc.data() as TransactionRecord);
    });

    // sort transactions by date descending (assuming formatted strings, fallback to parsing)
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
  } catch (err: any) {
    throw err;
  }
}

// User registration
export async function firestoreRegister(payload: { name: string; phone: string; password_entered: string; inviterCode?: string }): Promise<any> {
  await seedDatabaseIfEmpty();
  const { name, phone, password_entered, inviterCode } = payload;
  const cleanedPhone = cleanPhoneNumber(phone);
  try {
    const usersColl = collection(db, "users");
    const q = query(usersColl, where("phone", "==", cleanedPhone));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      throw new Error("Mobile number already registered! Please log in.");
    }

    // Generate a deterministic unique user ID based on phone number to physically prevent duplicates!
    const digitsOnly = cleanedPhone.replace(/\D/g, "");
    if (digitsOnly.length < 10) {
      throw new Error("Please provide a valid mobile number.");
    }
    const last10Digits = digitsOnly.substring(digitsOnly.length - 10);
    const newUserId = `usr_${last10Digits}`;

    // Double check document existence for safety
    const userDocRef = doc(db, "users", newUserId);
    const existingDoc = await getDoc(userDocRef);
    if (existingDoc.exists()) {
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

    // Save user
    await setDoc(userDocRef, cleanUndefined(newUser));

    // Save transaction
    await setDoc(doc(db, "transactions", signupTx.id), cleanUndefined(signupTx));

    // Reload transactions
    const txSnap = await getDocs(collection(db, "transactions"));
    const transactions: TransactionRecord[] = [];
    txSnap.forEach((doc) => {
      transactions.push(doc.data() as TransactionRecord);
    });

    transactions.sort((a, b) => {
      const timeA = new Date(a.date).getTime() || 0;
      const timeB = new Date(b.date).getTime() || 0;
      return timeB - timeA;
    });

    return {
      user: newUser,
      purchases: [],
      transactions
    };
  } catch (err: any) {
    throw err;
  }
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
  await seedDatabaseIfEmpty();
  const { phone, password_entered } = payload;
  const cleanedPhone = cleanPhoneNumber(phone);
  try {
    const usersColl = collection(db, "users");
    const q = query(usersColl, where("phone", "==", cleanedPhone));
    const querySnapshot = await getDocs(q);
    
    let userDocRef = null;

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      userDocRef = doc(db, "users", userDoc.id);
    } else {
      // Try by deterministic document ID
      const digitsOnly = cleanedPhone.replace(/\D/g, "");
      if (digitsOnly.length >= 10) {
        const last10Digits = digitsOnly.substring(digitsOnly.length - 10);
        const deterministicRef = doc(db, "users", `usr_${last10Digits}`);
        const userSnap = await getDoc(deterministicRef);
        if (userSnap.exists()) {
          userDocRef = deterministicRef;
        } else {
          // Broad scan check as fallback
          const allUsersSnap = await getDocs(usersColl);
          allUsersSnap.forEach((docSnap) => {
            const u = docSnap.data() as UserProfile;
            if (u.phone) {
              const uDigits = u.phone.replace(/\D/g, "");
              if (uDigits.endsWith(last10Digits)) {
                userDocRef = doc(db, "users", docSnap.id);
              }
            }
          });
        }
      }
    }

    if (!userDocRef) {
      throw new Error("This mobile number is not registered!");
    }

    await updateDoc(userDocRef, { password: password_entered });
    return { success: true };
  } catch (err: any) {
    throw err;
  }
}

// Get state (replaces /api/get-state)
export async function firestoreGetState(userId: string): Promise<any> {
  await seedDatabaseIfEmpty();
  try {
    // 1. Get configs and ticker
    const configSnap = await getDoc(doc(db, "global", "config"));
    const configData = configSnap.exists() ? configSnap.data() : { config: {}, customTicker: null };
    const config = configData.config || {};
    const customTicker = configData.customTicker || null;

    // 2. Get plans
    const plansSnap = await getDocs(collection(db, "plans"));
    const plans: InvestmentPlan[] = [];
    plansSnap.forEach((doc) => {
      plans.push(doc.data() as InvestmentPlan);
    });

    // 3. Get transactions
    const transactionsSnap = await getDocs(collection(db, "transactions"));
    const transactions: TransactionRecord[] = [];
    transactionsSnap.forEach((doc) => {
      transactions.push(doc.data() as TransactionRecord);
    });

    transactions.sort((a, b) => {
      const timeA = new Date(a.date).getTime() || 0;
      const timeB = new Date(b.date).getTime() || 0;
      return timeB - timeA;
    });

    // 4. Get purchases for this user
    let purchases: PurchaseRecord[] = [];
    if (userId) {
      const q = query(collection(db, "purchases"), where("userId", "==", userId));
      const purchasesSnap = await getDocs(q);
      purchasesSnap.forEach((doc) => {
        purchases.push(doc.data() as PurchaseRecord);
      });
    }

    // 5. Get users list
    const usersSnap = await getDocs(collection(db, "users"));
    const usersList: UserProfile[] = [];
    usersSnap.forEach((doc) => {
      usersList.push(doc.data() as UserProfile);
    });

    return {
      usersList,
      plans: plans.length > 0 ? plans : SEED_PLANS,
      transactions,
      purchases,
      config,
      customTicker
    };
  } catch (err) {
    console.error("firestoreGetState error:", err);
    throw err;
  }
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
  await seedDatabaseIfEmpty();
  const { userId, usersList, plans, transactions, purchases, config, customTicker } = payload;
  const isAdmin = userId === 'usr_admin';
  try {
    // 1. Merge usersList in Firestore
    if (Array.isArray(usersList)) {
      const userBatch = writeBatch(db);
      for (const u of usersList) {
        // SECURITY / STABILITY PROTECTION:
        // Non-admin users are strictly forbidden from writing other users' profiles!
        if (!isAdmin && u.id !== userId) {
          continue;
        }

        const docRef = doc(db, "users", u.id);
        
        // Load latest to check security/protections
        const existingSnap = await getDoc(docRef);
        let finalUser = { ...u };
        
        if (existingSnap.exists()) {
          const existing = existingSnap.data() as UserProfile;
          
          // PROTECTIONS mirror server.ts exactly:
          // 1. Prevent non-owner/non-admin clients from overwriting other users' passwords
          if (u.id !== userId && !isAdmin) {
            finalUser.password = existing.password;
          }
          // 2. Prevent overwriting a custom password with the default 'password123'
          if (existing.password && existing.password !== 'password123' && u.password === 'password123') {
            finalUser.password = existing.password;
          }
        }
        
        userBatch.set(docRef, cleanUndefined(finalUser), { merge: true });
      }
      await userBatch.commit();
    }

    // 2. Update global configuration
    if (isAdmin) {
      const configDocRef = doc(db, "global", "config");
      await setDoc(configDocRef, cleanUndefined({
        config,
        customTicker
      }), { merge: true });
    }

    // 3. Update plans
    if (isAdmin && Array.isArray(plans) && plans.length > 0) {
      const plansBatch = writeBatch(db);
      for (const plan of plans) {
        plansBatch.set(doc(db, "plans", plan.id), cleanUndefined(plan), { merge: true });
      }
      await plansBatch.commit();
    }

    // 4. Update transactions
    if (Array.isArray(transactions)) {
      const txBatch = writeBatch(db);
      for (const tx of transactions) {
        // Non-admin users are only allowed to write transactions that belong to them
        if (!isAdmin && tx.userId !== userId) {
          continue;
        }
        txBatch.set(doc(db, "transactions", tx.id), cleanUndefined(tx), { merge: true });
      }
      await txBatch.commit();
    }

    // 5. Update user-specific purchases
    if (userId && Array.isArray(purchases)) {
      const purchasesBatch = writeBatch(db);
      
      // Since batch writes require knowing matching keys, and we want to replace or merge user purchases:
      for (const purchase of purchases) {
        // Non-admin users are only allowed to write purchases that belong to them
        if (!isAdmin && (purchase as any).userId !== userId) {
          continue;
        }
        purchasesBatch.set(doc(db, "purchases", purchase.id), cleanUndefined(purchase), { merge: true });
      }
      await purchasesBatch.commit();
    }

    // Load and return final state
    return await firestoreGetState(userId);
  } catch (err) {
    console.error("firestoreSaveState error:", err);
    throw err;
  }
}
