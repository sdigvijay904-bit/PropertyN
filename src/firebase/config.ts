/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  Auth
} from 'firebase/auth';
import { 
  getFirestore, 
  setLogLevel,
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where,
  Firestore
} from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';
import { isQuotaExceeded, markQuotaExceeded } from '../lib/db';

// Default Firebase configuration fallbacks or actual environment variables
const firebaseConfig = {
  apiKey: "AIzaSyCFrLoVD9mJnwxhdV7AlCGxojWfGpYdpAk",
  authDomain: "isentropic-forcaster-rd2jw.firebaseapp.com",
  projectId: "isentropic-forcaster-rd2jw",
  storageBucket: "isentropic-forcaster-rd2jw.firebasestorage.app",
  messagingSenderId: "338176183572",
  appId: "1:338176183572:web:c8c985320e0a9c3561c601"
};

// Initialize real Firebase services wrapped in try-catch to allow graceful local sandbox simulation fallback
let app;
let auth: any = null;
let db: any = null;
let isRealFirebaseActive = false;

try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  auth = getAuth(app);
  // CRITICAL: Load from firestoreDatabaseId if configured in the applet config json
  const customDbId = "ai-studio-propertynrealest-a366a56b-05b0-4ca9-9769-c63579d84978";
  db = getFirestore(app, customDbId);
  try { setLogLevel('silent'); } catch (e) {}
  isRealFirebaseActive = true;
  console.log("Firebase successfully initialized inside PropertyN!");
} catch (error) {
  console.warn("Firebase initialization failed, utilizing high-fidelity sandbox simulator:", error);
  isRealFirebaseActive = false;
}

// Custom Interfaces matching Firebase types
export interface DepositRequest {
  id: string;
  userId: string;
  userName: string;
  email: string;
  mobileNumber: string;
  orderId: string;
  depositAmount: number;
  utr: string;
  paymentTime: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  approvedAt?: string;
  rejectedAt?: string;
}

export interface PaymentSettings {
  upiId: string;
  merchantName: string;
  qrCodeUrl: string;
  minDeposit: number;
  maxDeposit: number;
  updatedAt: string;
}

export interface PaymentLog {
  id: string;
  userId: string;
  userPhone: string;
  action: string; // e.g., 'INITIATED', 'SUBMITTED_UTR', 'APPROVED', 'REJECTED'
  details: string;
  timestamp: string;
}

// Static fallback memory storage that persists to localStorage as a robust local simulation database
const getLocalCollection = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveLocalCollection = <T>(key: string, data: T[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("Local save error:", e);
  }
};

// INITIAL DEPOSIT SETTINGS
const DEFAULT_SETTINGS: PaymentSettings = {
  upiId: "propertyn@ybl",
  merchantName: "PropertyN Payments Ltd",
  qrCodeUrl: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=600",
  minDeposit: 250,
  maxDeposit: 100000,
  updatedAt: new Date().toISOString()
};

// Core Firebase Service Adapter
export const firebaseService = {
  isRealFirebase: () => isRealFirebaseActive,

  // --- SETTINGS APIS ---
  getSettings: async (): Promise<PaymentSettings> => {
    let settings = { ...DEFAULT_SETTINGS };
    const adpaintUpiId = localStorage.getItem('adpaint_upi_id');
    const adpaintUpiName = localStorage.getItem('adpaint_upi_name');

    if (isRealFirebaseActive && db && !isQuotaExceeded()) {
      try {
        const docRef = doc(db, 'settings', 'payment_config');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          settings = { ...DEFAULT_SETTINGS, ...(docSnap.data() as PaymentSettings) };
        } else {
          const altDocSnap = await getDoc(doc(db, 'settings', 'payment'));
          if (altDocSnap.exists()) {
            settings = { ...DEFAULT_SETTINGS, ...(altDocSnap.data() as PaymentSettings) };
          }
        }
      } catch (e) {
        markQuotaExceeded(e);
        console.warn("Firestore error in getSettings, falling back:", e);
      }
    }
    // Fallback: Check localStorage
    const saved = localStorage.getItem('propertyn_payment_config');
    if (saved) {
      try {
        settings = { ...settings, ...JSON.parse(saved) };
      } catch {}
    }
    if (adpaintUpiId) settings.upiId = adpaintUpiId;
    if (adpaintUpiName) settings.merchantName = adpaintUpiName;
    return settings;
  },

  updateSettings: async (settings: PaymentSettings): Promise<void> => {
    const cleanSettings = {
      ...settings,
      updatedAt: new Date().toISOString()
    };
    
    // Always persist locally & in sync
    localStorage.setItem('propertyn_payment_config', JSON.stringify(cleanSettings));
    localStorage.setItem('adpaint_upi_id', cleanSettings.upiId);
    localStorage.setItem('adpaint_upi_name', cleanSettings.merchantName);
    localStorage.setItem('adpaint_min_recharge', cleanSettings.minDeposit.toString());
    localStorage.setItem('adpaint_max_recharge', cleanSettings.maxDeposit.toString());

    // Save to Firestore collections if available
    if (isRealFirebaseActive && db && !isQuotaExceeded()) {
      try {
        const docRef1 = doc(db, 'settings', 'payment_config');
        const docRef2 = doc(db, 'settings', 'payment');
        const globalConfigRef = doc(db, 'global', 'config');
        
        await Promise.all([
          setDoc(docRef1, cleanSettings, { merge: true }),
          setDoc(docRef2, cleanSettings, { merge: true }),
          setDoc(globalConfigRef, {
            config: {
              adpaint_upi_id: cleanSettings.upiId,
              adpaint_upi_name: cleanSettings.merchantName,
              adpaint_min_recharge: cleanSettings.minDeposit.toString()
            }
          }, { merge: true })
        ]);
      } catch (e) {
        markQuotaExceeded(e);
        console.warn("Firestore updateSettings error:", e);
      }
    }

    // Also persist to Express backend db.json
    try {
      fetch('/api/save-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: {
            adpaint_upi_id: cleanSettings.upiId,
            adpaint_upi_name: cleanSettings.merchantName,
            adpaint_min_recharge: cleanSettings.minDeposit.toString()
          }
        })
      }).catch(() => {});
    } catch (e) {}

    window.dispatchEvent(new Event('adpaint_config_updated'));
  },

  // --- DEPOSITS APIS ---
  getDeposits: async (): Promise<DepositRequest[]> => {
    if (isRealFirebaseActive && db && !isQuotaExceeded()) {
      try {
        const collRef = collection(db, 'deposits');
        const querySnap = await getDocs(collRef);
        const list: DepositRequest[] = [];
        querySnap.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as DepositRequest);
        });
        return list;
      } catch (e) {
        markQuotaExceeded(e);
        console.warn("Firestore getDeposits error, falling back:", e);
      }
    }
    return getLocalCollection<DepositRequest>('propertyn_deposits');
  },

  saveDepositRequest: async (deposit: Omit<DepositRequest, 'status' | 'id'>): Promise<DepositRequest> => {
    const newDeposit: DepositRequest = {
      ...deposit,
      id: `dep_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      status: 'Pending'
    };

    // 1. Validation (Verify UTR format)
    const utrRegex = /^\d{12}$/;
    if (!utrRegex.test(deposit.utr)) {
      throw new Error("Invalid UTR. Must be exactly 12 numeric digits.");
    }

    // 2. Prevent Duplicate UTR Submissions
    const allDeposits = await firebaseService.getDeposits();
    const isDuplicateUtr = allDeposits.some(d => d.utr === deposit.utr);
    if (isDuplicateUtr) {
      throw new Error("Duplicate Transaction Reference! This UTR has already been submitted.");
    }

    // Save to Firestore if available
    if (isRealFirebaseActive && db && !isQuotaExceeded()) {
      try {
        await setDoc(doc(db, 'deposits', newDeposit.id), newDeposit);
      } catch (e) {
        markQuotaExceeded(e);
        console.warn("Firestore saveDepositRequest error:", e);
      }
    }

    // Local Storage persistence fallback
    const localDeps = getLocalCollection<DepositRequest>('propertyn_deposits');
    localDeps.unshift(newDeposit);
    saveLocalCollection('propertyn_deposits', localDeps);

    // Write log action
    await firebaseService.logAction(deposit.userId, deposit.mobileNumber, 'SUBMITTED_UTR', `Amount: ₹${deposit.depositAmount}, UTR: ${deposit.utr}`);

    return newDeposit;
  },

  updateDepositStatus: async (depositId: string, status: 'Approved' | 'Rejected', adminUserId: string): Promise<DepositRequest> => {
    const allDeposits = await firebaseService.getDeposits();
    const index = allDeposits.findIndex(d => d.id === depositId);
    if (index === -1) {
      throw new Error("Deposit record not found.");
    }

    const targetDeposit = allDeposits[index];
    if (targetDeposit.status !== 'Pending') {
      throw new Error(`This deposit has already been processed as ${targetDeposit.status}!`);
    }

    const updatedDeposit: DepositRequest = {
      ...targetDeposit,
      status,
      ...(status === 'Approved' ? { approvedAt: new Date().toISOString() } : { rejectedAt: new Date().toISOString() })
    };

    // Save to Firestore if available
    if (isRealFirebaseActive && db && !isQuotaExceeded()) {
      try {
        const docRef = doc(db, 'deposits', depositId);
        await updateDoc(docRef, {
          status,
          ...(status === 'Approved' ? { approvedAt: updatedDeposit.approvedAt } : { rejectedAt: updatedDeposit.rejectedAt })
        });
      } catch (e) {
        markQuotaExceeded(e);
        console.warn("Firestore updateDepositStatus error:", e);
      }
    }

    // Save locally
    allDeposits[index] = updatedDeposit;
    saveLocalCollection('propertyn_deposits', allDeposits);

    // Write log action
    await firebaseService.logAction(adminUserId, 'ADMIN', status, `Deposit ID ${depositId} marked as ${status} for user ${targetDeposit.userName} (Amount: ₹${targetDeposit.depositAmount})`);

    return updatedDeposit;
  },

  // --- LOGS APIS ---
  getLogs: async (): Promise<PaymentLog[]> => {
    if (isRealFirebaseActive && db && !isQuotaExceeded()) {
      try {
        const collRef = collection(db, 'logs');
        const querySnap = await getDocs(collRef);
        const list: PaymentLog[] = [];
        querySnap.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as PaymentLog);
        });
        return list;
      } catch (e) {
        markQuotaExceeded(e);
        console.warn("Firestore getLogs error, falling back:", e);
      }
    }
    return getLocalCollection<PaymentLog>('propertyn_payment_logs');
  },

  logAction: async (userId: string, userPhone: string, action: string, details: string): Promise<void> => {
    const log: PaymentLog = {
      id: `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      userId,
      userPhone,
      action,
      details,
      timestamp: new Date().toISOString()
    };

    if (isRealFirebaseActive && db && !isQuotaExceeded()) {
      try {
        await setDoc(doc(db, 'logs', log.id), log);
      } catch (e) {
        markQuotaExceeded(e);
        console.warn("Firestore logAction error:", e);
      }
    }

    const localLogs = getLocalCollection<PaymentLog>('propertyn_payment_logs');
    localLogs.unshift(log);
    saveLocalCollection('propertyn_payment_logs', localLogs);
  }
};
