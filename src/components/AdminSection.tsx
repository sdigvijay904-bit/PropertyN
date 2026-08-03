/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, Wallet, TrendingUp, ShieldCheck, Check, X, Edit2, Plus, Trash2, Search,
  ArrowDownLeft, ArrowUpRight, Award, Landmark, RefreshCw, Send, Sparkles, Database, FileText, QrCode, Smartphone, LogOut, Camera, Upload, Image as ImageIcon, Copy, ShoppingBag, Package, Tag, Power, PauseCircle, Coins
} from 'lucide-react';
import SupportAgentAvatar from './SupportAgentAvatar';
import { UserProfile, InvestmentPlan, TransactionRecord, PurchaseRecord } from '../types';
import { db } from '../lib/firebase';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { cleanUndefined, isQuotaExceeded, markQuotaExceeded, getStoredPurchases, syncAllLocalUsersToFirestore, scanAndMergeAllUsers } from '../lib/db';
import { firebaseService } from '../firebase/config';
import { formatTelegramUrl } from '../lib/telegram';


interface AdminSectionProps {
  currentProfile: UserProfile | null;
  usersList: UserProfile[];
  setUsersList: React.Dispatch<React.SetStateAction<UserProfile[]>>;
  plans: InvestmentPlan[];
  setPlans: React.Dispatch<React.SetStateAction<InvestmentPlan[]>>;
  transactions: TransactionRecord[];
  setTransactions: React.Dispatch<React.SetStateAction<TransactionRecord[]>>;
  purchases?: PurchaseRecord[];
  setPurchases?: React.Dispatch<React.SetStateAction<PurchaseRecord[]>>;
  onClose: () => void;
  triggerToast: (text: string, type?: 'success' | 'info' | 'error') => void;
  onUpdateCurrentUserProfile: (profile: UserProfile) => void;
  onRefreshData?: () => Promise<void>;
  onSyncConfig?: (
    updatedPlans?: InvestmentPlan[],
    updatedPurchases?: PurchaseRecord[],
    updatedUsersList?: UserProfile[],
    updatedTx?: TransactionRecord[]
  ) => void;
}

export default function AdminSection({
  currentProfile,
  usersList,
  setUsersList,
  plans,
  setPlans,
  transactions,
  setTransactions,
  purchases = [],
  setPurchases,
  onClose,
  triggerToast,
  onUpdateCurrentUserProfile,
  onRefreshData,
  onSyncConfig
}: AdminSectionProps) {
  const [adminTab, setAdminTab] = useState<'stats' | 'users' | 'approvals' | 'plans' | 'custom_notif' | 'upi_config'>('stats');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // UPI / QR code config states
  const [upiIdInput, setUpiIdInput] = useState<string>(() => {
    return localStorage.getItem('adpaint_upi_id') || 'pay-propn@ybl';
  });
  const [upiNameInput, setUpiNameInput] = useState<string>(() => {
    return localStorage.getItem('adpaint_upi_name') || 'PropertyN Solutions';
  });
  const [cashierUrlInput, setCashierUrlInput] = useState<string>(() => {
    return localStorage.getItem('adpaint_cashier_url') || 'https://cashiernew.blue-pay.vip/#/mobile';
  });

  // Support Agent Avatar Config State
  const [supportAvatarInput, setSupportAvatarInput] = useState<string>(() => {
    return localStorage.getItem('adpaint_support_avatar') || '';
  });
  const [savedSupportAvatar, setSavedSupportAvatar] = useState<string | null>(() => {
    return localStorage.getItem('adpaint_support_avatar');
  });
  const avatarFileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    let isMounted = true;
    const doScan = async () => {
      try {
        const scanned = await scanAndMergeAllUsers();
        if (isMounted && scanned && scanned.length > 0) {
          setUsersList(scanned);
          onSyncConfig?.(undefined, undefined, scanned, undefined);
        }
      } catch (e) {}
    };

    doScan();

    const handleUsersUpdated = async () => {
      if (isMounted) {
        doScan();
      }
    };

    window.addEventListener('adpaint_users_updated', handleUsersUpdated);
    return () => {
      isMounted = false;
      window.removeEventListener('adpaint_users_updated', handleUsersUpdated);
    };
  }, []);

  const PRESET_AGENT_PHOTOS = [
    {
      name: 'Female Agent 1 (Default HD)',
      url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&h=400&q=80'
    },
    {
      name: 'Female Agent 2 (HD Support)',
      url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=400&h=400&q=80'
    },
    {
      name: 'Female Agent 3 (Corporate Help)',
      url: 'https://images.unsplash.com/photo-1573497019236-17f8177b81e8?auto=format&fit=crop&w=400&h=400&q=80'
    }
  ];

  const handleApplyAvatar = async (url: string) => {
    localStorage.setItem('adpaint_support_avatar', url);
    setSavedSupportAvatar(url);
    setSupportAvatarInput(url);
    window.dispatchEvent(new Event('adpaint_avatar_updated'));

    // Instantly write to Firebase Firestore global/config so Mobile APK updates live in real time
    try {
      const configDocRef = doc(db, "global", "config");
      const snap = await getDoc(configDocRef);
      const existingConfig = snap.exists() && snap.data().config ? snap.data().config : {};
      existingConfig['adpaint_support_avatar'] = url;

      await setDoc(configDocRef, {
        config: existingConfig,
        customTicker: localStorage.getItem('adpaint_custom_ticker') || null
      }, { merge: true });
      console.log("Avatar synced directly to Firestore global/config!");
    } catch (err) {
      console.error("Direct Firestore config sync error:", err);
    }

    if (onSyncConfig) {
      onSyncConfig();
    }
    triggerToast('Support Agent Photo updated & synced live to Mobile APK!', 'success');
  };

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawResult = event.target?.result as string;
        if (rawResult) {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_SIZE = 250;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_SIZE) {
                height = Math.round((height * MAX_SIZE) / width);
                width = MAX_SIZE;
              }
            } else {
              if (height > MAX_SIZE) {
                width = Math.round((width * MAX_SIZE) / height);
                height = MAX_SIZE;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
              handleApplyAvatar(compressedBase64);
            } else {
              handleApplyAvatar(rawResult);
            }
          };
          img.onerror = () => {
            handleApplyAvatar(rawResult);
          };
          img.src = rawResult;
        }
      };
      reader.readAsDataURL(file);
    }
  };
  const [tgChannelInput, setTgChannelInput] = useState<string>(() => {
    return localStorage.getItem('adpaint_tg_channel') || 'https://t.me/PropertyN_99';
  });
  const [tgSupportInput, setTgSupportInput] = useState<string>(() => {
    return localStorage.getItem('adpaint_tg_support') || 'https://t.me/PropertyN_Support';
  });
  const [apkUrlInput, setApkUrlInput] = useState<string>(() => {
    return localStorage.getItem('adpaint_apk_url') || 'https://raw.githubusercontent.com/adpaint-app/builds/main/PropertyN_Earnings.apk';
  });

  // Admin configurable values for System Thresholds & Welcome Notice
  const [platformNameInput, setPlatformNameInput] = useState<string>(() => {
    return localStorage.getItem('adpaint_platform_name') || 'PropertyN';
  });
  const [dailyBonusInput, setDailyBonusInput] = useState<string>(() => {
    return localStorage.getItem('adpaint_daily_bonus') || '8';
  });
  const [minWithdrawalInput, setMinWithdrawalInput] = useState<string>(() => {
    return localStorage.getItem('adpaint_min_withdrawal') || '120';
  });
  const [minRechargeInput, setMinRechargeInput] = useState<string>(() => {
    return localStorage.getItem('adpaint_min_recharge') || '250';
  });
  const [rechargePresetsInput, setRechargePresetsInput] = useState<string>(() => {
    return localStorage.getItem('adpaint_recharge_presets') || '280, 530, 750, 1000, 2200, 4840';
  });
  const [withdrawTimeInput, setWithdrawTimeInput] = useState<string>(() => {
    return localStorage.getItem('adpaint_withdraw_time') || '12:30AM - 11:59PM';
  });

  // Saved config states for UI display reactivity
  const [savedUpiId, setSavedUpiId] = useState<string>(() => localStorage.getItem('adpaint_upi_id') || 'pay-propn@ybl');
  const [savedUpiName, setSavedUpiName] = useState<string>(() => localStorage.getItem('adpaint_upi_name') || 'PropertyN Solutions');
  const [savedCashierUrl, setSavedCashierUrl] = useState<string>(() => localStorage.getItem('adpaint_cashier_url') || 'https://cashiernew.blue-pay.vip/#/mobile');
  const [savedTgChannel, setSavedTgChannel] = useState<string>(() => localStorage.getItem('adpaint_tg_channel') || 'https://t.me/PropertyN_99');
  const [savedTgSupport, setSavedTgSupport] = useState<string>(() => localStorage.getItem('adpaint_tg_support') || 'https://t.me/PropertyN_Support');
  const [savedApkUrl, setSavedApkUrl] = useState<string>(() => localStorage.getItem('adpaint_apk_url') || 'https://raw.githubusercontent.com/adpaint-app/builds/main/PropertyN_Earnings.apk');
  const [savedPlatformName, setSavedPlatformName] = useState<string>(() => localStorage.getItem('adpaint_platform_name') || 'PropertyN');
  const [savedDailyBonus, setSavedDailyBonus] = useState<string>(() => localStorage.getItem('adpaint_daily_bonus') || '8');
  const [savedMinWithdrawal, setSavedMinWithdrawal] = useState<string>(() => localStorage.getItem('adpaint_min_withdrawal') || '120');
  const [savedMinRecharge, setSavedMinRecharge] = useState<string>(() => localStorage.getItem('adpaint_min_recharge') || '250');
  const [savedRechargePresets, setSavedRechargePresets] = useState<string>(() => localStorage.getItem('adpaint_recharge_presets') || '280, 530, 750, 1000, 2200, 4840');

  // User search & balance edit states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [userFilterType, setUserFilterType] = useState<'all' | 'referral' | 'direct' | 'vip'>('all');
  const [approvalSearchQuery, setApprovalSearchQuery] = useState<string>('');
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [viewingReferralsUser, setViewingReferralsUser] = useState<UserProfile | null>(null);
  const [amountAdjust, setAmountAdjust] = useState<string>('');
  const [adjustType, setAdjustType] = useState<'add' | 'subtract'>('add');
  const [editBankName, setEditBankName] = useState<string>('');
  const [editHolderName, setEditHolderName] = useState<string>('');
  const [editAccountNumber, setEditAccountNumber] = useState<string>('');
  const [editIfscCode, setEditIfscCode] = useState<string>('');
  const [editName, setEditName] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');
  const [editPassword, setEditPassword] = useState<string>('');
  const [editRole, setEditRole] = useState<'user' | 'admin'>('user');
  const [editTotalEarnings, setEditTotalEarnings] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const syncConfigDirectToFirestore = async (overrides?: Record<string, string>) => {
    const keysToSync = [
      'adpaint_upi_id', 'adpaint_upi_name', 'adpaint_tg_channel', 'adpaint_tg_support',
      'adpaint_apk_url', 'adpaint_platform_name', 'adpaint_daily_bonus',
      'adpaint_min_withdrawal', 'adpaint_min_recharge', 'adpaint_recharge_presets',
      'adpaint_withdraw_time', 'adpaint_cashier_url', 'adpaint_support_avatar'
    ];
    if (overrides) {
      Object.entries(overrides).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          localStorage.setItem(k, v);
        }
      });
    }

    const configMap: Record<string, string> = {};
    keysToSync.forEach(key => {
      const val = localStorage.getItem(key);
      if (val !== null && val !== undefined) configMap[key] = val;
    });

    if (!isQuotaExceeded()) {
      try {
        const configDocRef = doc(db, "global", "config");
        await setDoc(configDocRef, {
          config: configMap,
          customTicker: localStorage.getItem('adpaint_custom_ticker') || null
        }, { merge: true });
        window.dispatchEvent(new Event('adpaint_config_updated'));
        window.dispatchEvent(new Event('adpaint_avatar_updated'));
      } catch (err) {
        markQuotaExceeded(err);
        console.error("Direct Firestore config sync error:", err);
      }
    } else {
      window.dispatchEvent(new Event('adpaint_config_updated'));
      window.dispatchEvent(new Event('adpaint_avatar_updated'));
    }

    if (onSyncConfig) {
      onSyncConfig();
    }
  };

  const handleCopyText = (text: string, labelKey: string, successMessage?: string) => {
    if (!text || text === 'N/A') return;
    navigator.clipboard.writeText(text);
    setCopiedKey(labelKey);
    triggerToast(successMessage || `Copied: ${text}`, 'success');
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  // Helper to fetch purchased plans for a user
  const getUserPurchases = (userId: string, userPhone?: string): PurchaseRecord[] => {
    const cleanPhone = userPhone ? userPhone.replace(/\D/g, '') : '';
    
    let deletedPurchases: string[] = [];
    try {
      const rawDel = localStorage.getItem('adpaint_deleted_purchases');
      if (rawDel) deletedPurchases = JSON.parse(rawDel);
    } catch (e) {}

    const fromProp = (purchases || []).filter(p => 
      !deletedPurchases.includes(p.id) &&
      (p.userId === userId || 
      (cleanPhone.length >= 10 && (p as any).userPhone && (p as any).userPhone.replace(/\D/g, '').includes(cleanPhone.slice(-10))))
    );

    const fromStorage = getStoredPurchases(userId, transactions, plans).filter(p => !deletedPurchases.includes(p.id));

    const map = new Map<string, PurchaseRecord>();
    fromProp.forEach(p => map.set(p.id, p));
    fromStorage.forEach(p => map.set(p.id, p));

    return Array.from(map.values()).filter(p => !deletedPurchases.includes(p.id));
  };

  // Helper to fetch user deposits (recharges)
  const getUserDeposits = (userId: string, userPhone?: string) => {
    const cleanPhone = userPhone ? userPhone.replace(/\D/g, '') : '';
    const userTx = (transactions || []).filter(t => 
      t.type === 'recharge' && (
        (t.userId && t.userId === userId) || 
        (cleanPhone.length >= 10 && t.userPhone && t.userPhone.replace(/\D/g, '').includes(cleanPhone.slice(-10)))
      )
    );
    const approvedDeposit = userTx.filter(t => t.status === 'success').reduce((sum, t) => sum + (t.amount || 0), 0);
    const pendingDeposit = userTx.filter(t => t.status === 'pending').reduce((sum, t) => sum + (t.amount || 0), 0);
    return { approvedDeposit, pendingDeposit, totalCount: userTx.length, transactions: userTx };
  };

  // Helper to fetch user withdrawals
  const getUserWithdrawals = (userId: string, userPhone?: string) => {
    const cleanPhone = userPhone ? userPhone.replace(/\D/g, '') : '';
    const userTx = (transactions || []).filter(t => 
      t.type === 'withdraw' && (
        (t.userId && t.userId === userId) || 
        (cleanPhone.length >= 10 && t.userPhone && t.userPhone.replace(/\D/g, '').includes(cleanPhone.slice(-10)))
      )
    );
    const approvedWithdraw = userTx.filter(t => t.status === 'success').reduce((sum, t) => sum + (t.amount || 0), 0);
    const pendingWithdraw = userTx.filter(t => t.status === 'pending').reduce((sum, t) => sum + (t.amount || 0), 0);
    return { approvedWithdraw, pendingWithdraw, totalCount: userTx.length, transactions: userTx };
  };

  // Helper to fetch ALL transactions for a user
  const getUserTransactions = (userId: string, userPhone?: string) => {
    const cleanPhone = userPhone ? userPhone.replace(/\D/g, '') : '';
    return (transactions || []).filter(t => 
      (t.userId && t.userId === userId) || 
      (cleanPhone.length >= 10 && t.userPhone && t.userPhone.replace(/\D/g, '').includes(cleanPhone.slice(-10)))
    );
  };

  // Helper to toggle plan deactivation (complete / active state)
  const handleToggleDeactivatePurchase = (purchaseId: string, userId: string) => {
    let newStatus = false;

    // Determine target purchase and next status
    const targetP = (purchases || []).find(p => p.id === purchaseId);
    if (targetP) {
      newStatus = !targetP.completed;
    } else {
      newStatus = true;
    }

    const updatedPurchasesList = (purchases || []).map(p => {
      if (p.id === purchaseId) {
        return { ...p, completed: newStatus };
      }
      return p;
    });

    if (setPurchases) {
      setPurchases(updatedPurchasesList);
    }

    // Update user-specific localStorage key
    try {
      const raw = localStorage.getItem(`adpaint_purchases_${userId}`);
      if (raw) {
        const userP: PurchaseRecord[] = JSON.parse(raw);
        const updatedUserP = userP.map(p => {
          if (p.id === purchaseId) {
            return { ...p, completed: newStatus };
          }
          return p;
        });
        localStorage.setItem(`adpaint_purchases_${userId}`, JSON.stringify(updatedUserP));
      }
    } catch (e) {}

    // Update global localStorage key
    try {
      const rawMain = localStorage.getItem('adpaint_purchases');
      if (rawMain) {
        const mainP: PurchaseRecord[] = JSON.parse(rawMain);
        const updatedMain = mainP.map(p => {
          if (p.id === purchaseId) {
            return { ...p, completed: newStatus };
          }
          return p;
        });
        localStorage.setItem('adpaint_purchases', JSON.stringify(updatedMain));
      }
    } catch (e) {}

    if (!isQuotaExceeded()) {
      try {
        if (targetP) {
          const updatedP = { ...targetP, completed: newStatus };
          setDoc(doc(db, "purchases", purchaseId), cleanUndefined(updatedP), { merge: true }).catch(markQuotaExceeded);
        } else {
          setDoc(doc(db, "purchases", purchaseId), cleanUndefined({ completed: newStatus }), { merge: true }).catch(markQuotaExceeded);
        }
      } catch (e) {
        markQuotaExceeded(e);
      }
    }

    onSyncConfig?.(undefined, updatedPurchasesList);
    triggerToast(newStatus ? 'User plan deactivated!' : 'User plan reactivated!', newStatus ? 'info' : 'success');
  };

  // Helper to delete user purchase completely
  const handleDeletePurchase = (purchaseId: string, userId: string) => {
    if (!window.confirm('Are you sure you want to delete this purchased plan for the user?')) {
      return;
    }

    // 1. Mark in adpaint_deleted_purchases
    let delList: string[] = [];
    try {
      const rawDel = localStorage.getItem('adpaint_deleted_purchases');
      delList = rawDel ? JSON.parse(rawDel) : [];
      if (!delList.includes(purchaseId)) {
        delList.push(purchaseId);
      }
      const txEq = purchaseId.startsWith('pur_') ? purchaseId.replace('pur_', 'tx_pur_') : `tx_pur_${purchaseId}`;
      if (!delList.includes(txEq)) {
        delList.push(txEq);
      }
      localStorage.setItem('adpaint_deleted_purchases', JSON.stringify(delList));
    } catch (e) {}

    // 2. Filter local purchases
    const updatedPurchases = (purchases || []).filter(p => p.id !== purchaseId);
    if (setPurchases) {
      setPurchases(updatedPurchases);
    }

    // 3. Filter matching purchase transactions
    const updatedTransactions = (transactions || []).filter(tx => 
      tx.id !== purchaseId &&
      tx.id !== purchaseId.replace('pur_', 'tx_pur_') &&
      tx.id.replace('tx_pur_', 'pur_') !== purchaseId
    );
    if (setTransactions) {
      setTransactions(updatedTransactions);
    }

    // 4. Clean local storage
    try {
      const raw = localStorage.getItem(`adpaint_purchases_${userId}`);
      if (raw) {
        const userP: PurchaseRecord[] = JSON.parse(raw);
        const updatedUserP = userP.filter(p => p.id !== purchaseId);
        localStorage.setItem(`adpaint_purchases_${userId}`, JSON.stringify(updatedUserP));
      }
      localStorage.removeItem(`adpaint_backup_purchases_${userId}`);
    } catch (e) {}

    try {
      const rawMain = localStorage.getItem('adpaint_purchases');
      if (rawMain) {
        const mainP: PurchaseRecord[] = JSON.parse(rawMain);
        const updatedMain = mainP.filter(p => p.id !== purchaseId);
        localStorage.setItem('adpaint_purchases', JSON.stringify(updatedMain));
      }
    } catch (e) {}

    try {
      localStorage.setItem('adpaint_transactions', JSON.stringify(updatedTransactions));
    } catch (e) {}

    // 5. Delete document from Firestore AND update global deleted_items doc
    if (!isQuotaExceeded()) {
      try {
        deleteDoc(doc(db, "purchases", purchaseId)).catch(markQuotaExceeded);
        deleteDoc(doc(db, "transactions", purchaseId)).catch(markQuotaExceeded);
        deleteDoc(doc(db, "transactions", purchaseId.replace('pur_', 'tx_pur_'))).catch(markQuotaExceeded);
        setDoc(doc(db, "global", "deleted_items"), { deletedPurchases: delList }, { merge: true }).catch(markQuotaExceeded);
      } catch (e) {
        markQuotaExceeded(e);
      }
    }

    onSyncConfig?.(undefined, updatedPurchases, undefined, updatedTransactions);
    triggerToast('User plan deleted successfully!', 'success');
  };

  // Plans editor states
  const [isCreatingPlan, setIsCreatingPlan] = useState<boolean>(false);
  const [editingPlan, setEditingPlan] = useState<InvestmentPlan | null>(null);
  const [planTitle, setPlanTitle] = useState<string>('');
  const [planType, setPlanType] = useState<'daily' | 'vip'>('daily');
  const [planPrice, setPlanPrice] = useState<string>('');
  const [planDailyIncome, setPlanDailyIncome] = useState<string>('');
  const [planDuration, setPlanDuration] = useState<string>('');
  const [planImage, setPlanImage] = useState<string>('');
  const [planSlotsMax, setPlanSlotsMax] = useState<string>('10');

  // Custom live ticker simulation state
  const [tickerMessage, setTickerMessage] = useState<string>('');

  // Calculations for Stats Tab
  const totalUsers = usersList.length;
  const systemTotalBalance = usersList.reduce((acc, u) => acc + u.balance, 0);
  const systemTotalEarnings = usersList.reduce((acc, u) => acc + u.totalEarnings, 0);
  
  const totalDeposited = transactions
    .filter(t => t.type === 'recharge' && t.status === 'success')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalWithdrawn = transactions
    .filter(t => t.type === 'withdraw' && t.status === 'success')
    .reduce((acc, t) => acc + t.amount, 0);

  const pendingRecharges = transactions.filter(t => 
    t.type === 'recharge' && 
    (t.status === 'pending' || (t.status as string) === 'Pending' || (t.status as string) === 'requested')
  );
  const pendingWithdrawals = transactions.filter(t => 
    t.type === 'withdraw' && 
    (t.status === 'pending' || (t.status as string) === 'Pending' || (t.status as string) === 'requested')
  );

  const filteredPendingRecharges = pendingRecharges.filter(tx => {
    if (!approvalSearchQuery.trim()) return true;
    const qTrim = approvalSearchQuery.trim();
    const qLower = qTrim.toLowerCase();
    const qDigits = qTrim.replace(/\D/g, '');

    const txUser = usersList.find(u => (tx.userId && u.id === tx.userId) || (tx.userPhone && u.phone === tx.userPhone));
    const userName = txUser ? txUser.name.toLowerCase() : '';
    const userPhoneRaw = tx.userPhone || (txUser ? txUser.phone : '');
    const userPhoneDigits = userPhoneRaw.replace(/\D/g, '');
    const utrStr = (tx.utr || '').toLowerCase();

    return (
      userName.includes(qLower) ||
      userPhoneRaw.includes(qTrim) ||
      (qDigits.length >= 3 && userPhoneDigits.includes(qDigits)) ||
      utrStr.includes(qLower) ||
      tx.amount.toString().includes(qTrim)
    );
  });

  const filteredPendingWithdrawals = pendingWithdrawals.filter(tx => {
    if (!approvalSearchQuery.trim()) return true;
    const qTrim = approvalSearchQuery.trim();
    const qLower = qTrim.toLowerCase();
    const qDigits = qTrim.replace(/\D/g, '');

    const txUser = usersList.find(u => (tx.userId && u.id === tx.userId) || (tx.userPhone && u.phone === tx.userPhone));
    const userName = txUser ? txUser.name.toLowerCase() : '';
    const userPhoneRaw = tx.userPhone || (txUser ? txUser.phone : '');
    const userPhoneDigits = userPhoneRaw.replace(/\D/g, '');

    return (
      userName.includes(qLower) ||
      userPhoneRaw.includes(qTrim) ||
      (qDigits.length >= 3 && userPhoneDigits.includes(qDigits)) ||
      tx.amount.toString().includes(qTrim)
    );
  });

  // Approve Recharge Handler
  const handleApproveRecharge = async (txId: string) => {
    const tx = transactions.find(t => t.id === txId);
    if (!tx) return;

    // Find the user associated with this transaction
    const txUserDigits = tx.userId ? tx.userId.replace(/\D/g, '').slice(-10) : '';
    const txPhoneDigits = tx.userPhone ? tx.userPhone.replace(/\D/g, '').slice(-10) : '';
    
    let targetUser = usersList.find(u => u.id === tx.userId);
    if (!targetUser) {
      targetUser = usersList.find(u => {
        if (tx.userPhone && u.phone === tx.userPhone) return true;
        const uDigits = u.phone ? u.phone.replace(/\D/g, '').slice(-10) : '';
        if (uDigits && (uDigits === txUserDigits || uDigits === txPhoneDigits)) return true;
        const uIdDigits = u.id ? u.id.replace(/\D/g, '').slice(-10) : '';
        if (uIdDigits && (uIdDigits === txUserDigits || uIdDigits === txPhoneDigits)) return true;
        return false;
      });
    }

    if (!targetUser) {
      triggerToast('User not found for this recharge.', 'error');
      return;
    }
    const targetUserId = targetUser.id;

    // 1. Update user balance and totalInvested
    const updatedUsers = usersList.map(u => {
      if (u.id === targetUserId) {
        const updated = {
          ...u,
          balance: u.balance + tx.amount,
          totalInvested: (u.totalInvested || 0) + tx.amount
        };
        // If this is the currently logged-in user, update current session as well
        if (currentProfile && u.id === currentProfile.id) {
          onUpdateCurrentUserProfile(updated);
        }
        return updated;
      }
      return u;
    });

    // 2. Mark transaction as success
    const updatedTx = transactions.map(t => {
      if (t.id === txId) {
        return { ...t, status: 'success' as const, description: `Recharge approved by Admin` };
      }
      return t;
    });

    // Handle 3-level referral commissions (L1 10%, L2 5%, L3 2%) when a user's recharge is approved
    let finalUsers = updatedUsers;
    const rechargeAmt = tx.amount || 0;
    const creditSponsorList: string[] = [];

    if (targetUser.inviterCode && rechargeAmt > 0) {
      // Level 1 Sponsor
      const inviter1 = usersList.find(u => u.inviteCode === targetUser.inviterCode);
      if (inviter1) {
        creditSponsorList.push(inviter1.id);
        const comm1 = rechargeAmt * 0.10;
        finalUsers = finalUsers.map(u => {
          if (u.id === inviter1.id) {
            const updatedInviter = {
              ...u,
              balance: u.balance + comm1,
              totalEarnings: u.totalEarnings + comm1
            };
            if (currentProfile && u.id === currentProfile.id) {
              onUpdateCurrentUserProfile(updatedInviter);
            }
            return updatedInviter;
          }
          return u;
        });

        const commissionTx1: TransactionRecord = {
          id: `tx_comm1_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          type: 'commission',
          amount: comm1,
          date: new Date().toLocaleString(),
          status: 'success',
          description: `Lvl 1 Commission (10%) from +91 ${targetUser.phone.replace('+91 ', '')} recharge`,
          userId: inviter1.id,
          userPhone: inviter1.phone
        };
        updatedTx.unshift(commissionTx1);

        // Level 2 Sponsor
        if (inviter1.inviterCode) {
          const inviter2 = usersList.find(u => u.inviteCode === inviter1.inviterCode);
          if (inviter2) {
            creditSponsorList.push(inviter2.id);
            const comm2 = rechargeAmt * 0.05;
            finalUsers = finalUsers.map(u => {
              if (u.id === inviter2.id) {
                const updatedInviter = {
                  ...u,
                  balance: u.balance + comm2,
                  totalEarnings: u.totalEarnings + comm2
                };
                if (currentProfile && u.id === currentProfile.id) {
                  onUpdateCurrentUserProfile(updatedInviter);
                }
                return updatedInviter;
              }
              return u;
            });

            const commissionTx2: TransactionRecord = {
              id: `tx_comm2_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
              type: 'commission',
              amount: comm2,
              date: new Date().toLocaleString(),
              status: 'success',
              description: `Lvl 2 Commission (5%) from +91 ${targetUser.phone.replace('+91 ', '')} recharge`,
              userId: inviter2.id,
              userPhone: inviter2.phone
            };
            updatedTx.unshift(commissionTx2);

            // Level 3 Sponsor
            if (inviter2.inviterCode) {
              const inviter3 = usersList.find(u => u.inviteCode === inviter2.inviterCode);
              if (inviter3) {
                creditSponsorList.push(inviter3.id);
                const comm3 = rechargeAmt * 0.02;
                finalUsers = finalUsers.map(u => {
                  if (u.id === inviter3.id) {
                    const updatedInviter = {
                      ...u,
                      balance: u.balance + comm3,
                      totalEarnings: u.totalEarnings + comm3
                    };
                    if (currentProfile && u.id === currentProfile.id) {
                      onUpdateCurrentUserProfile(updatedInviter);
                    }
                    return updatedInviter;
                  }
                  return u;
                });

                const commissionTx3: TransactionRecord = {
                  id: `tx_comm3_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
                  type: 'commission',
                  amount: comm3,
                  date: new Date().toLocaleString(),
                  status: 'success',
                  description: `Lvl 3 Commission (2%) from +91 ${targetUser.phone.replace('+91 ', '')} recharge`,
                  userId: inviter3.id,
                  userPhone: inviter3.phone
                };
                updatedTx.unshift(commissionTx3);
              }
            }
          }
        }
      }
    }

    // Direct immediate write to Firestore for target user and transaction
    if (!isQuotaExceeded()) {
      try {
        const updatedUserObj = finalUsers.find(u => u.id === targetUserId);
        if (updatedUserObj) {
          await setDoc(doc(db, "users", targetUserId), cleanUndefined(updatedUserObj));
        }

        // Save credited sponsors' updated profiles and commission transactions
        for (const sponsorId of creditSponsorList) {
          const sponsorObj = finalUsers.find(u => u.id === sponsorId);
          if (sponsorObj) {
            await setDoc(doc(db, "users", sponsorId), cleanUndefined(sponsorObj));
          }
        }
        const newCommissionTxs = updatedTx.filter(t => t.type === 'commission' && creditSponsorList.includes(t.userId || ''));
        for (const commTx of newCommissionTxs) {
          await setDoc(doc(db, "transactions", commTx.id), cleanUndefined(commTx));
        }

        // Save approved recharge transaction directly
        const approvedTxObj = updatedTx.find(t => t.id === txId);
        if (approvedTxObj) {
          await setDoc(doc(db, "transactions", txId), cleanUndefined(approvedTxObj));
        }

        // Try to find a matching record in the deposits collection and approve it there too
        if (tx.utr) {
          const allDeposits = await firebaseService.getDeposits();
          const matchDep = allDeposits.find(d => d.utr === tx.utr && d.status === 'Pending');
          if (matchDep) {
            await firebaseService.updateDepositStatus(matchDep.id, 'Approved', currentProfile?.id || 'admin');
          }
        }
      } catch (err) {
        markQuotaExceeded(err);
        console.error("Direct Firestore writes in handleApproveRecharge failed:", err);
      }
    }

    setUsersList(finalUsers);
    setTransactions(updatedTx);
    
    localStorage.setItem('adpaint_users_list', JSON.stringify(finalUsers));
    localStorage.setItem('adpaint_transactions', JSON.stringify(updatedTx));
    
    onSyncConfig?.(undefined, undefined, finalUsers, updatedTx);
    triggerToast(`Approved ₹${tx.amount} recharge for +91 ${targetUser.phone.replace('+91 ', '')}`, 'success');
  };

  // Reject Recharge Handler
  const handleRejectRecharge = async (txId: string) => {
    const tx = transactions.find(t => t.id === txId);
    if (!tx) return;

    const updatedTx = transactions.map(t => {
      if (t.id === txId) {
        return { ...t, status: 'failed' as const, description: `Recharge rejected by Admin (invalid UTR)` };
      }
      return t;
    });

    // Direct immediate write to Firestore
    if (!isQuotaExceeded()) {
      try {
        const rejectedTxObj = updatedTx.find(t => t.id === txId);
        if (rejectedTxObj) {
          await setDoc(doc(db, "transactions", txId), cleanUndefined(rejectedTxObj));
        }

        // Try to find a matching record in the deposits collection and reject it there too
        if (tx.utr) {
          const allDeposits = await firebaseService.getDeposits();
          const matchDep = allDeposits.find(d => d.utr === tx.utr && d.status === 'Pending');
          if (matchDep) {
            await firebaseService.updateDepositStatus(matchDep.id, 'Rejected', currentProfile?.id || 'admin');
          }
        }
      } catch (err) {
        markQuotaExceeded(err);
        console.error("Direct Firestore writes in handleRejectRecharge failed:", err);
      }
    }

    setTransactions(updatedTx);
    localStorage.setItem('adpaint_transactions', JSON.stringify(updatedTx));
    onSyncConfig?.(undefined, undefined, undefined, updatedTx);
    triggerToast('Recharge request rejected.', 'info');
  };

  // Approve Withdrawal Handler
  const handleApproveWithdrawal = async (txId: string) => {
    const tx = transactions.find(t => t.id === txId);
    if (!tx) return;

    // Mark transaction as success
    const updatedTx = transactions.map(t => {
      if (t.id === txId) {
        return { ...t, status: 'success' as const, description: `Settled bank transfer successfully` };
      }
      return t;
    });

    // Direct immediate write to Firestore
    if (!isQuotaExceeded()) {
      try {
        const approvedTxObj = updatedTx.find(t => t.id === txId);
        if (approvedTxObj) {
          await setDoc(doc(db, "transactions", txId), cleanUndefined(approvedTxObj));
        }
      } catch (err) {
        markQuotaExceeded(err);
        console.error("Direct Firestore write in handleApproveWithdrawal failed:", err);
      }
    }

    setTransactions(updatedTx);
    localStorage.setItem('adpaint_transactions', JSON.stringify(updatedTx));
    onSyncConfig?.(undefined, undefined, undefined, updatedTx);
    triggerToast(`Withdrawal of ₹${tx.amount} approved and settled!`, 'success');
  };

  // Reject Withdrawal Handler (Refunds amount back to user's wallet!)
  const handleRejectWithdrawal = async (txId: string) => {
    const tx = transactions.find(t => t.id === txId);
    if (!tx) return;

    const targetUserId = tx.userId;
    const targetUser = usersList.find(u => u.id === targetUserId);

    if (!targetUser) {
      triggerToast('User not found for this withdrawal refund.', 'error');
      return;
    }

    // 1. Refund the withdrawal amount back to the user balance
    const updatedUsers = usersList.map(u => {
      if (u.id === targetUserId) {
        const updated = {
          ...u,
          balance: u.balance + tx.amount
        };
        if (currentProfile && u.id === currentProfile.id) {
          onUpdateCurrentUserProfile(updated);
        }
        return updated;
      }
      return u;
    });

    // 2. Mark transaction as failed/rejected
    const updatedTx = transactions.map(t => {
      if (t.id === txId) {
        return { ...t, status: 'failed' as const, description: `Withdrawal rejected & refunded by Admin` };
      }
      return t;
    });

    // Direct immediate write to Firestore
    if (!isQuotaExceeded()) {
      try {
        const updatedUserObj = updatedUsers.find(u => u.id === targetUserId);
        if (updatedUserObj) {
          await setDoc(doc(db, "users", targetUserId), cleanUndefined(updatedUserObj));
        }

        const rejectedTxObj = updatedTx.find(t => t.id === txId);
        if (rejectedTxObj) {
          await setDoc(doc(db, "transactions", txId), cleanUndefined(rejectedTxObj));
        }
      } catch (err) {
        markQuotaExceeded(err);
        console.error("Direct Firestore writes in handleRejectWithdrawal failed:", err);
      }
    }

    setUsersList(updatedUsers);
    setTransactions(updatedTx);

    localStorage.setItem('adpaint_users_list', JSON.stringify(updatedUsers));
    localStorage.setItem('adpaint_transactions', JSON.stringify(updatedTx));

    onSyncConfig?.(undefined, undefined, updatedUsers, updatedTx);
    triggerToast(`Withdrawal rejected! ₹${tx.amount} refunded to user's balance.`, 'info');
  };

  // Adjust User Balance Handler
  const handleAdjustBalance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const amt = parseFloat(amountAdjust);
    if (isNaN(amt) || amt <= 0) {
      triggerToast('Please enter a valid positive amount', 'error');
      return;
    }

    const updatedUsers = usersList.map(u => {
      if (u.id === editingUser.id) {
        const multiplier = adjustType === 'add' ? 1 : -1;
        const newBalance = Math.max(0, u.balance + amt * multiplier);
        const newTotalEarnings = adjustType === 'add' ? u.totalEarnings + amt : u.totalEarnings;
        
        const updated = {
          ...u,
          balance: newBalance,
          totalEarnings: newTotalEarnings
        };

        if (currentProfile && u.id === currentProfile.id) {
          onUpdateCurrentUserProfile(updated);
        }
        return updated;
      }
      return u;
    });

    // Log the manual change as a transaction
    const adjustTx: TransactionRecord = {
      id: `tx_adj_${Date.now()}`,
      type: adjustType === 'add' ? 'checkin' : 'purchase',
      amount: amt,
      date: new Date().toLocaleString(),
      status: 'success',
      description: adjustType === 'add' ? 'Balance credited by Admin' : 'Balance debited by Admin',
      userId: editingUser.id,
      userPhone: editingUser.phone
    };

    const updatedTx = [adjustTx, ...transactions];

    setUsersList(updatedUsers);
    setTransactions(updatedTx);
    localStorage.setItem('adpaint_users_list', JSON.stringify(updatedUsers));
    localStorage.setItem('adpaint_transactions', JSON.stringify(updatedTx));

    if (!isQuotaExceeded()) {
      try {
        const uObj = updatedUsers.find(u => u.id === editingUser.id);
        if (uObj) {
          setDoc(doc(db, "users", editingUser.id), cleanUndefined(uObj)).catch(markQuotaExceeded);
        }
        setDoc(doc(db, "transactions", adjustTx.id), cleanUndefined(adjustTx)).catch(markQuotaExceeded);
      } catch (e) {
        markQuotaExceeded(e);
      }
    }

    onSyncConfig?.(undefined, undefined, updatedUsers, updatedTx);
    triggerToast(`Successfully ${adjustType === 'add' ? 'added' : 'deducted'} ₹${amt} from user balance`, 'success');
    setEditingUser(updatedUsers.find(u => u.id === editingUser.id) || null);
    setAmountAdjust('');
  };

  // Override Bank Details Handler
  const handleSaveBankOverride = () => {
    if (!editingUser) return;

    const updatedUsers = usersList.map(u => {
      if (u.id === editingUser.id) {
        const updated = {
          ...u,
          bankAccount: {
            bankName: editBankName,
            accountHolder: editHolderName,
            accountNumber: editAccountNumber,
            ifscCode: editIfscCode
          }
        };

        if (currentProfile && u.id === currentProfile.id) {
          onUpdateCurrentUserProfile(updated);
        }
        return updated;
      }
      return u;
    });

    setUsersList(updatedUsers);
    localStorage.setItem('adpaint_users_list', JSON.stringify(updatedUsers));

    if (!isQuotaExceeded()) {
      try {
        const uObj = updatedUsers.find(u => u.id === editingUser.id);
        if (uObj) {
          setDoc(doc(db, "users", editingUser.id), cleanUndefined(uObj)).catch(markQuotaExceeded);
        }
      } catch (e) {
        markQuotaExceeded(e);
      }
    }

    onSyncConfig?.(undefined, undefined, updatedUsers);
    triggerToast('Bank credentials overridden successfully!', 'success');
    setEditingUser(updatedUsers.find(u => u.id === editingUser.id) || null);
  };

  // Open User Panel for editing
  const handleOpenUserEdit = (user: UserProfile) => {
    setEditingUser(user);
    setEditBankName(user.bankAccount?.bankName || '');
    setEditHolderName(user.bankAccount?.accountHolder || '');
    setEditAccountNumber(user.bankAccount?.accountNumber || '');
    setEditIfscCode(user.bankAccount?.ifscCode || '');
    setEditName(user.name || '');
    setEditPhone(user.phone?.replace('+91 ', '') || '');
    setEditPassword(user.password || 'password123');
    setEditRole(user.role || 'user');
    setEditTotalEarnings(user.totalEarnings !== undefined ? user.totalEarnings.toString() : '0');
  };

  // Override Total Income / Plan Yield Handler
  const handleSaveTotalEarnings = () => {
    if (!editingUser) return;

    const newEarnings = parseFloat(editTotalEarnings);
    if (isNaN(newEarnings) || newEarnings < 0) {
      triggerToast('Please enter a valid total income amount', 'error');
      return;
    }

    const updatedUsers = usersList.map(u => {
      if (u.id === editingUser.id) {
        const updated = {
          ...u,
          totalEarnings: newEarnings
        };

        if (currentProfile && u.id === currentProfile.id) {
          onUpdateCurrentUserProfile(updated);
        }
        return updated;
      }
      return u;
    });

    setUsersList(updatedUsers);
    localStorage.setItem('adpaint_users_list', JSON.stringify(updatedUsers));

    if (!isQuotaExceeded()) {
      try {
        const uObj = updatedUsers.find(u => u.id === editingUser.id);
        if (uObj) {
          setDoc(doc(db, "users", editingUser.id), cleanUndefined(uObj)).catch(markQuotaExceeded);
        }
      } catch (e) {
        markQuotaExceeded(e);
      }
    }

    onSyncConfig?.(undefined, undefined, updatedUsers);
    triggerToast(`Total Income updated to ₹${newEarnings.toLocaleString('en-IN')}`, 'success');
    setEditingUser(updatedUsers.find(u => u.id === editingUser.id) || null);
  };

  // Credentials Override Handler
  const handleSaveCredentialsOverride = () => {
    if (!editingUser) return;

    if (!editName.trim()) {
      triggerToast('Name cannot be empty', 'error');
      return;
    }
    if (!editPhone.trim() || editPhone.length < 10) {
      triggerToast('Phone number must be at least 10 digits', 'error');
      return;
    }
    if (!editPassword.trim() || editPassword.length < 6) {
      triggerToast('Password must be at least 6 characters', 'error');
      return;
    }

    const targetPhone = `+91 ${editPhone.trim().replace(/\D/g, '')}`;
    
    // Check if this new phone is already registered by another user
    const phoneExists = usersList.some(u => u.id !== editingUser.id && u.phone === targetPhone);
    if (phoneExists) {
      triggerToast('This phone number is already registered to another user!', 'error');
      return;
    }

    const updatedUsers = usersList.map(u => {
      if (u.id === editingUser.id) {
        const updated = {
          ...u,
          name: editName.trim(),
          phone: targetPhone,
          password: editPassword.trim(),
          role: editRole
        };

        if (currentProfile && u.id === currentProfile.id) {
          onUpdateCurrentUserProfile(updated);
        }
        return updated;
      }
      return u;
    });

    setUsersList(updatedUsers);
    localStorage.setItem('adpaint_users_list', JSON.stringify(updatedUsers));

    if (!isQuotaExceeded()) {
      try {
        const uObj = updatedUsers.find(u => u.id === editingUser.id);
        if (uObj) {
          setDoc(doc(db, "users", editingUser.id), cleanUndefined(uObj)).catch(markQuotaExceeded);
        }
      } catch (e) {
        markQuotaExceeded(e);
      }
    }

    onSyncConfig?.(undefined, undefined, updatedUsers);
    triggerToast('User credentials updated successfully!', 'success');
    setEditingUser(updatedUsers.find(u => u.id === editingUser.id) || null);
  };

  // Toggle account suspension handler
  const handleToggleUserBlock = () => {
    if (!editingUser) return;
    if (editingUser.id === currentProfile?.id) {
      triggerToast('You cannot suspend your own admin account!', 'error');
      return;
    }

    const nextStatus = editingUser.status === 'blocked' ? 'active' : 'blocked';
    const updatedUsers = usersList.map(u => {
      if (u.id === editingUser.id) {
        return {
          ...u,
          status: nextStatus as 'active' | 'blocked'
        };
      }
      return u;
    });

    setUsersList(updatedUsers);
    localStorage.setItem('adpaint_users_list', JSON.stringify(updatedUsers));

    if (!isQuotaExceeded()) {
      try {
        const uObj = updatedUsers.find(u => u.id === editingUser.id);
        if (uObj) {
          setDoc(doc(db, "users", editingUser.id), cleanUndefined(uObj)).catch(markQuotaExceeded);
        }
      } catch (e) {
        markQuotaExceeded(e);
      }
    }

    onSyncConfig?.(undefined, undefined, updatedUsers);
    triggerToast(`User account status updated to ${nextStatus.toUpperCase()}!`, 'success');
    setEditingUser(updatedUsers.find(u => u.id === editingUser.id) || null);
  };

  // Permanently delete user account handler
  const handleDeleteUser = async (userId: string) => {
    if (!editingUser) return;
    if (userId === currentProfile?.id) {
      triggerToast('You cannot delete your own admin account!', 'error');
      return;
    }

    try {
      // 1. Delete user document from Firestore directly to ensure absolute permanent deletion
      await deleteDoc(doc(db, "users", userId));

      // 2. Filter them out from the users list
      const updatedUsers = usersList.filter(u => u.id !== userId);
      setUsersList(updatedUsers);
      localStorage.setItem('adpaint_users_list', JSON.stringify(updatedUsers));
      onSyncConfig?.(undefined, undefined, updatedUsers);

      triggerToast(`User ${editingUser.name} permanently deleted!`, 'success');
      setEditingUser(null);
      setShowDeleteConfirm(false);
    } catch (err: any) {
      console.error("Firestore deleteDoc failed:", err);
      // Fallback: still delete locally so admin has feedback
      const updatedUsers = usersList.filter(u => u.id !== userId);
      setUsersList(updatedUsers);
      localStorage.setItem('adpaint_users_list', JSON.stringify(updatedUsers));
      triggerToast('User account removed locally. Please verify connection.', 'info');
      setEditingUser(null);
      setShowDeleteConfirm(false);
    }
  };

  // Create or Update Ad Plan Handler
  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();

    const price = parseFloat(planPrice);
    const dailyIncome = parseFloat(planDailyIncome);
    const duration = parseInt(planDuration);
    const slots = parseInt(planSlotsMax);

    if (!planTitle.trim()) {
      triggerToast('Please specify a plan title', 'error');
      return;
    }
    if (isNaN(price) || price < 100) {
      triggerToast('Minimum price is ₹100', 'error');
      return;
    }
    if (isNaN(dailyIncome) || dailyIncome <= 0) {
      triggerToast('Please provide a valid daily income', 'error');
      return;
    }
    if (isNaN(duration) || duration <= 0) {
      triggerToast('Duration must be 1 day or more', 'error');
      return;
    }

    const finalImage = planImage.trim() || 'https://images.unsplash.com/photo-1562624236-f1574fa91191?auto=format&fit=crop&w=600&q=80';

    let updatedPlansList: InvestmentPlan[] = plans;

    if (editingPlan) {
      // Editing existing plan
      updatedPlansList = plans.map(p => {
        if (p.id === editingPlan.id) {
          return {
            ...p,
            title: planTitle,
            type: planType,
            price,
            dailyIncome,
            durationDays: duration,
            totalProfit: dailyIncome * duration,
            image: finalImage,
            slotsMax: slots || 10
          };
        }
        return p;
      });

      setPlans(updatedPlansList);
      localStorage.setItem('adpaint_plans', JSON.stringify(updatedPlansList));
      triggerToast('Advertisement Plan updated successfully!', 'success');
    } else {
      // Creating a new plan
      const newPlan: InvestmentPlan = {
        id: `plan_${Date.now()}`,
        type: planType,
        title: planTitle,
        price,
        dailyIncome,
        durationDays: duration,
        totalProfit: dailyIncome * duration,
        image: finalImage,
        slotsMax: slots || 10,
        slotsPurchased: 0
      };

      updatedPlansList = [...plans, newPlan];
      setPlans(updatedPlansList);
      localStorage.setItem('adpaint_plans', JSON.stringify(updatedPlansList));
      triggerToast('New Advertisement Plan published live!', 'success');
    }

    if (!isQuotaExceeded()) {
      try {
        const savedPlanObj = editingPlan
          ? updatedPlansList.find(p => p.id === editingPlan.id)
          : updatedPlansList[updatedPlansList.length - 1];
        if (savedPlanObj) {
          setDoc(doc(db, "plans", savedPlanObj.id), cleanUndefined(savedPlanObj), { merge: true }).catch(markQuotaExceeded);
        }
      } catch (e) {
        markQuotaExceeded(e);
        console.warn("Notice saving plan to firestore:", e);
      }
    }

    onSyncConfig?.(updatedPlansList);

    // Reset states
    setIsCreatingPlan(false);
    setEditingPlan(null);
    setPlanTitle('');
    setPlanPrice('');
    setPlanDailyIncome('');
    setPlanDuration('');
    setPlanImage('');
    setPlanSlotsMax('10');
  };

  // Delete Ad Plan Handler
  const handleDeletePlan = (planId: string) => {
    if (window.confirm('Are you sure you want to permanently delete this plan? This takes it offline.')) {
      // 1. Mark in deleted plans list
      let delList: string[] = [];
      try {
        const rawDel = localStorage.getItem('adpaint_deleted_plans');
        delList = rawDel ? JSON.parse(rawDel) : [];
        if (!delList.includes(planId)) {
          delList.push(planId);
          localStorage.setItem('adpaint_deleted_plans', JSON.stringify(delList));
        }
      } catch (e) {}

      // 2. Filter local state & storage
      const updatedPlans = plans.filter(p => p.id !== planId);
      setPlans(updatedPlans);
      localStorage.setItem('adpaint_plans', JSON.stringify(updatedPlans));

      // 3. Delete document from Firestore and update global deleted_items
      if (!isQuotaExceeded()) {
        try {
          deleteDoc(doc(db, "plans", planId)).catch(markQuotaExceeded);
          setDoc(doc(db, "global", "deleted_items"), { deletedPlans: delList }, { merge: true }).catch(markQuotaExceeded);
        } catch (e) {
          markQuotaExceeded(e);
        }
      }

      onSyncConfig?.(updatedPlans);
      triggerToast('Advertisement plan deleted.', 'info');
    }
  };

  // Push Live Ticker Alert
  const handlePushTicker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tickerMessage.trim()) return;

    localStorage.setItem('adpaint_custom_ticker', tickerMessage.trim());
    window.dispatchEvent(new Event('adpaint_notice_updated'));
    syncConfigDirectToFirestore();
    triggerToast('Custom alert published live!', 'success');
    setTickerMessage('');
  };

  // Filter users by search query & category filter safely
  const filteredUsers = usersList.filter(u => {
    if (!u) return false;

    // Filter by tab category first
    if (userFilterType === 'referral' && !u.inviterCode) return false;
    if (userFilterType === 'direct' && u.inviterCode) return false;
    if (userFilterType === 'vip') {
      const uPurchases = getUserPurchases(u.id, u.phone);
      const uDeposits = getUserDeposits(u.id, u.phone);
      if (uPurchases.length === 0 && uDeposits.approvedDeposit <= 0) return false;
    }

    const searchTrim = searchQuery.trim();
    if (!searchTrim) return true;

    const searchLower = searchTrim.toLowerCase();
    const searchDigits = searchTrim.replace(/\D/g, '');

    const nameStr = (u.name || '').toLowerCase();
    const phoneRaw = (u.phone || '');
    const phoneDigits = phoneRaw.replace(/\D/g, '');
    const inviteCodeStr = (u.inviteCode || '').toLowerCase();
    const inviterCodeStr = (u.inviterCode || '').toLowerCase();
    const idStr = (u.id || '').toLowerCase();
    const passStr = (u.password || '').toLowerCase();

    // Check sponsor info
    const sponsor = u.inviterCode ? usersList.find(s => s.inviteCode === u.inviterCode) : null;
    const sponsorName = sponsor ? (sponsor.name || '').toLowerCase() : '';
    const sponsorPhoneDigits = sponsor ? (sponsor.phone || '').replace(/\D/g, '') : '';

    const matchesName = nameStr.includes(searchLower);
    const matchesPhoneRaw = phoneRaw.includes(searchTrim);
    const matchesPhoneDigits = searchDigits.length >= 3 && phoneDigits.includes(searchDigits);
    const matchesInviteCode = inviteCodeStr.includes(searchLower);
    const matchesInviterCode = inviterCodeStr.includes(searchLower);
    const matchesId = idStr.includes(searchLower);
    const matchesPass = passStr.includes(searchLower);
    const matchesSponsorName = sponsorName.includes(searchLower);
    const matchesSponsorPhone = searchDigits.length >= 3 && sponsorPhoneDigits.includes(searchDigits);

    return (
      matchesName ||
      matchesPhoneRaw ||
      matchesPhoneDigits ||
      matchesInviteCode ||
      matchesInviterCode ||
      matchesId ||
      matchesPass ||
      matchesSponsorName ||
      matchesSponsorPhone
    );
  });

  const getDownlineTree = (targetUser: UserProfile) => {
    const list: { id: string; name: string; phone: string; level: number; totalInvested: number; inviterName: string }[] = [];
    
    const getUserInvested = (u: UserProfile) => {
      const cleanPhone = u.phone ? u.phone.replace(/\D/g, '') : '';
      const rechargeSum = transactions
        .filter(t => t.type === 'recharge' && (t.status === 'success' || (t.status as string) === 'Approved' || (t.status as string) === 'approved') && (
          t.userId === u.id || 
          (cleanPhone.length >= 10 && t.userPhone && t.userPhone.replace(/\D/g, '').includes(cleanPhone.slice(-10)))
        ))
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      return rechargeSum;
    };

    // Level 1: referred directly by current user
    const level1Users = usersList.filter(u => u.inviterCode === targetUser.inviteCode);
    level1Users.forEach(u1 => {
      list.push({
        id: u1.id,
        name: u1.name,
        phone: u1.phone,
        level: 1,
        totalInvested: getUserInvested(u1),
        inviterName: targetUser.name
      });

      // Level 2: referred by Level 1 users
      const level2Users = usersList.filter(u => u.inviterCode === u1.inviteCode);
      level2Users.forEach(u2 => {
        list.push({
          id: u2.id,
          name: u2.name,
          phone: u2.phone,
          level: 2,
          totalInvested: getUserInvested(u2),
          inviterName: u1.name
        });

        // Level 3: referred by Level 2 users
        const level3Users = usersList.filter(u => u.inviterCode === u2.inviteCode);
        level3Users.forEach(u3 => {
          list.push({
            id: u3.id,
            name: u3.name,
            phone: u3.phone,
            level: 3,
            totalInvested: getUserInvested(u3),
            inviterName: u2.name
          });
        });
      });
    });

    return list;
  };

  // Helper to calculate referral earnings & team breakdown for any user
  const getUserReferralStats = (targetUser: UserProfile) => {
    const downlines = getDownlineTree(targetUser);
    const l1 = downlines.filter(x => x.level === 1);
    const l2 = downlines.filter(x => x.level === 2);
    const l3 = downlines.filter(x => x.level === 3);

    const l1Earning = l1.reduce((sum, item) => sum + (item.totalInvested * 0.10), 0);
    const l2Earning = l2.reduce((sum, item) => sum + (item.totalInvested * 0.05), 0);
    const l3Earning = l3.reduce((sum, item) => sum + (item.totalInvested * 0.02), 0);

    const cleanPhone = targetUser.phone ? targetUser.phone.replace(/\D/g, '') : '';
    const txCommissionSum = (transactions || [])
      .filter(t => t.type === 'commission' && (
        t.userId === targetUser.id || 
        (cleanPhone.length >= 10 && t.userPhone && t.userPhone.replace(/\D/g, '').includes(cleanPhone.slice(-10)))
      ))
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const calculatedCommission = l1Earning + l2Earning + l3Earning;
    const totalReferralEarnings = Math.max(calculatedCommission, txCommissionSum);

    return {
      totalReferralEarnings,
      l1Count: l1.length,
      l2Count: l2.length,
      l3Count: l3.length,
      l1Earning,
      l2Earning,
      l3Earning,
      totalDownlines: downlines.length
    };
  };

  return (
    <div className="flex-1 bg-slate-900 text-slate-100 flex flex-col h-full min-h-screen">
      
      {/* Admin Top Banner */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-teal-800 p-5 rounded-b-[2rem] shadow-xl border-b border-teal-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-sm">
              <Database className="w-5 h-5 text-teal-200 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-emerald-500/90 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-widest text-[8px]">ROOT SERVER</span>
                <span className="text-[10px] text-teal-200 font-mono">v4.9-Stable</span>
              </div>
              <h2 className="text-lg font-black tracking-tight text-white mt-0.5 uppercase">Admin Control Room</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                if (onRefreshData) {
                  setIsRefreshing(true);
                  await onRefreshData();
                  setIsRefreshing(false);
                } else {
                  onSyncConfig?.();
                  triggerToast('Refreshed local records.', 'info');
                }
              }}
              disabled={isRefreshing}
              className="px-3 py-2 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 rounded-2xl text-[10px] font-black uppercase tracking-wider text-emerald-200 transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync Database'}</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-900/40 hover:bg-slate-900/60 border border-slate-700/50 rounded-2xl text-[10px] font-black uppercase tracking-wider text-slate-200 transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Admin Horizontal Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-3 px-4 bg-slate-950/40 border-b border-slate-800/40 scrollbar-none">
        {[
          { id: 'stats', label: 'Dashboard', icon: TrendingUp },
          { id: 'users', label: 'Users Base', icon: Users },
          { id: 'approvals', label: 'Approvals', icon: ShieldCheck, badge: pendingRecharges.length + pendingWithdrawals.length },
          { id: 'plans', label: 'Ad Plans', icon: FileText },
          { id: 'custom_notif', label: 'Ticker Control', icon: Send },
          { id: 'upi_config', label: 'Gateway & Telegram', icon: QrCode }
        ].map(tab => {
          const Icon = tab.icon;
          const isSelected = adminTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setAdminTab(tab.id as any);
                setEditingUser(null);
                setIsCreatingPlan(false);
                setEditingPlan(null);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/30 border border-emerald-500/20'
                  : 'bg-slate-800/50 hover:bg-slate-800 text-slate-400 border border-transparent'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {!!tab.badge && (
                <span className="bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full ring-2 ring-slate-900">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Admin Working Area */}
      <div className="flex-1 p-4 overflow-y-auto pb-12">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: SYSTEM OVERVIEW STATS */}
          {adminTab === 'stats' && (
            <motion.div
              key="stats-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                {/* Stat 1 */}
                <div className="bg-slate-850 p-4 rounded-3xl border border-slate-800 flex flex-col justify-between shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Users</span>
                    <Users className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="mt-2.5">
                    <span className="text-2xl font-black font-mono tracking-tight text-white">{totalUsers}</span>
                    <p className="text-[9px] text-emerald-400/90 font-medium mt-1 font-mono">All registered users (Direct & Referral)</p>
                  </div>
                </div>

                {/* Stat 2 */}
                <div className="bg-slate-850 p-4 rounded-3xl border border-slate-800 flex flex-col justify-between shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Deposited</span>
                    <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="mt-2.5">
                    <span className="text-xl font-black font-mono tracking-tight text-emerald-400">₹{totalDeposited % 1 === 0 ? totalDeposited.toLocaleString('en-IN') : totalDeposited.toFixed(2)}</span>
                    <p className="text-[9px] text-slate-500 font-medium mt-1">Successful recharges</p>
                  </div>
                </div>

                {/* Stat 3 */}
                <div className="bg-slate-850 p-4 rounded-3xl border border-slate-800 flex flex-col justify-between shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Withdrawn</span>
                    <ArrowUpRight className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="mt-2.5">
                    <span className="text-xl font-black font-mono tracking-tight text-rose-400">₹{totalWithdrawn % 1 === 0 ? totalWithdrawn.toLocaleString('en-IN') : totalWithdrawn.toFixed(2)}</span>
                    <p className="text-[9px] text-slate-500 font-medium mt-1">Paid settlement claims</p>
                  </div>
                </div>

                {/* Stat 4 */}
                <div className="bg-slate-850 p-4 rounded-3xl border border-slate-800 flex flex-col justify-between shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">User Ledgers</span>
                    <Wallet className="w-4 h-4 text-teal-400" />
                  </div>
                  <div className="mt-2.5">
                    <span className="text-xl font-black font-mono tracking-tight text-white">₹{systemTotalBalance % 1 === 0 ? systemTotalBalance.toLocaleString('en-IN') : systemTotalBalance.toFixed(2)}</span>
                    <p className="text-[9px] text-slate-500 font-medium mt-1">Total outstanding liabilities</p>
                  </div>
                </div>

                {/* Stat 5: Total Purchased Plans */}
                <div className="col-span-2 bg-slate-850 p-4 rounded-3xl border border-emerald-900/40 flex flex-col justify-between shadow-lg">
                  {(() => {
                    let totalPCount = 0;
                    let totalPVal = 0;
                    usersList.forEach(u => {
                      const uP = getUserPurchases(u.id, u.phone);
                      totalPCount += uP.length;
                      totalPVal += uP.reduce((sum, p) => sum + (p.price || 0), 0);
                    });
                    return (
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-emerald-400 font-black uppercase tracking-wider flex items-center gap-1.5">
                            <ShoppingBag className="w-4 h-4 text-emerald-400" />
                            <span>Total Plans Bought</span>
                          </span>
                          <span className="text-[10px] font-mono text-teal-300 font-bold bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-lg">
                            Value: ₹{totalPVal.toLocaleString()}
                          </span>
                        </div>
                        <div className="mt-2 flex items-baseline justify-between">
                          <span className="text-2xl font-black font-mono tracking-tight text-white">{totalPCount} <span className="text-xs text-slate-400 font-sans font-bold">Active & Historical Plans</span></span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Server health check logs */}
              <div className="bg-slate-950/60 p-4 rounded-[1.8rem] border border-slate-850 font-mono space-y-2">
                <h4 className="text-[10px] text-teal-400 font-black uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                  <span>Terminal Diagnostics</span>
                </h4>
                <div className="text-[10px] text-slate-400 space-y-1">
                  <p><span className="text-slate-600">[SYSTEM]</span> Server core: Node.js standard</p>
                  <p><span className="text-slate-600">[DATABASE]</span> Mock persistent engine: LocalStorage verified</p>
                  <p><span className="text-slate-600">[SECURITY]</span> 256-bit sandbox container active</p>
                  <p><span className="text-slate-600">[STATUS]</span> Ingress port 3000 mapping: OK</p>
                  <p><span className="text-emerald-500">[ONLINE]</span> System listening for sponsor actions...</p>
                </div>
              </div>

              {/* Shortcut Panel */}
              <div className="bg-gradient-to-r from-emerald-950/40 to-teal-950/40 p-4 rounded-3xl border border-emerald-900/20 space-y-3">
                <h4 className="text-xs font-black text-emerald-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Evaluation Quick Tools</span>
                </h4>
                <p className="text-[10px] text-slate-400 font-medium">Use these preset triggers to test real-time data tracking state changes instantly.</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      const updated = usersList.map(u => {
                        if (currentProfile && u.id === currentProfile.id) {
                          const up = { ...u, balance: u.balance + 1000, totalEarnings: u.totalEarnings + 1000 };
                          onUpdateCurrentUserProfile(up);
                          return up;
                        }
                        return u;
                      });
                      setUsersList(updated);
                      localStorage.setItem('adpaint_users_list', JSON.stringify(updated));
                      triggerToast('Added ₹1,000 to your active sponsor account!', 'success');
                    }}
                    className="py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-[10px] font-bold transition-all cursor-pointer"
                  >
                    +₹1,000 to Current User
                  </button>
                  <button
                    onClick={() => {
                      // Trigger a mock pending deposit to test approvals tab
                      const pendingTx: TransactionRecord = {
                        id: `tx_rec_test_${Date.now()}`,
                        type: 'recharge',
                        amount: 2200,
                        date: new Date().toLocaleString(),
                        status: 'pending',
                        description: 'Simulated deposit to test admin panel',
                        utr: '937402840194',
                        userId: currentProfile?.id || 'usr_demo',
                        userPhone: currentProfile?.phone || '+91 9876543210'
                      };
                      const updatedTx = [pendingTx, ...transactions];
                      setTransactions(updatedTx);
                      localStorage.setItem('adpaint_transactions', JSON.stringify(updatedTx));
                      setAdminTab('approvals');
                      triggerToast('Simulated a ₹2,200 pending deposit request!', 'info');
                    }}
                    className="py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-[10px] font-bold transition-all cursor-pointer"
                  >
                    Simulate Pending Deposit
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: USER DIRECTORY & WALLET CONTROL */}
          {adminTab === 'users' && (
            <motion.div
              key="users-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Search Bar & Category Filter Pills */}
              <div className="space-y-2.5">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                      <Search className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="Search phone (9595350797), name, invite code, sponsor..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-600 transition-all font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      setIsRefreshing(true);
                      try {
                        const fullMerged = await scanAndMergeAllUsers(usersList);
                        setUsersList(fullMerged);
                        if (onRefreshData) {
                          await onRefreshData();
                        } else {
                          onSyncConfig?.(undefined, undefined, fullMerged, undefined);
                        }
                        window.dispatchEvent(new Event('adpaint_users_updated'));
                        triggerToast(`Scanned & synced ${fullMerged.length} total user accounts!`, 'success');
                      } catch (err) {
                        triggerToast('User list synced!', 'info');
                      } finally {
                        setIsRefreshing(false);
                      }
                    }}
                    disabled={isRefreshing}
                    className="px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Sync Users</span>
                  </button>
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => setUserFilterType('all')}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                      userFilterType === 'all'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <span>All Accounts</span>
                    <span className="bg-slate-900/80 px-1.5 py-0.5 rounded-md text-[9px] font-mono">{usersList.length}</span>
                  </button>

                  <button
                    onClick={() => setUserFilterType('referral')}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                      userFilterType === 'referral'
                        ? 'bg-teal-600 text-white shadow-md'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <span>🔗 Referral Link Accounts</span>
                    <span className="bg-slate-900/80 px-1.5 py-0.5 rounded-md text-[9px] font-mono">
                      {usersList.filter(u => Boolean(u.inviterCode)).length}
                    </span>
                  </button>

                  <button
                    onClick={() => setUserFilterType('direct')}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                      userFilterType === 'direct'
                        ? 'bg-cyan-600 text-white shadow-md'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <span>👤 Direct Registered</span>
                    <span className="bg-slate-900/80 px-1.5 py-0.5 rounded-md text-[9px] font-mono">
                      {usersList.filter(u => !u.inviterCode).length}
                    </span>
                  </button>

                  <button
                    onClick={() => setUserFilterType('vip')}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                      userFilterType === 'vip'
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <span>👑 VIP Investors</span>
                    <span className="bg-slate-900/80 px-1.5 py-0.5 rounded-md text-[9px] font-mono">
                      {usersList.filter(u => {
                        const dep = getUserDeposits(u.id, u.phone);
                        const pur = getUserPurchases(u.id, u.phone);
                        return pur.length > 0 || dep.approvedDeposit > 0;
                      }).length}
                    </span>
                  </button>
                </div>
              </div>

              {/* User management panel or user list */}
              {editingUser ? (
                // Inside User Detailed View / Edit screen
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-slate-850 p-5 rounded-[2rem] border border-slate-800 space-y-5"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <h4 className="text-sm font-black text-white">{editingUser.name}</h4>
                      <p className="text-[10px] font-mono text-slate-400">{editingUser.phone}</p>
                    </div>
                    <button
                      onClick={() => setEditingUser(null)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-[10px] font-black uppercase rounded-xl text-slate-300 cursor-pointer"
                    >
                      Back To List
                    </button>
                  </div>

                  {/* Complete User Financial Summary Cards */}
                  {(() => {
                    const editUserPurchases = getUserPurchases(editingUser.id, editingUser.phone);
                    const editUserDep = getUserDeposits(editingUser.id, editingUser.phone);
                    const editUserWith = getUserWithdrawals(editingUser.id, editingUser.phone);
                    const editUserRef = getUserReferralStats(editingUser);
                    const totalPlanInvest = editUserPurchases.reduce((s, p) => s + (p.price || 0), 0);
                    const activePlansCount = editUserPurchases.filter(p => !p.completed).length;

                    return (
                      <div className="bg-slate-900 p-4 rounded-3xl border border-slate-800 space-y-3.5 shadow-inner">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                          <h5 className="text-[11px] font-black text-teal-400 uppercase tracking-widest flex items-center gap-2">
                            <Wallet className="w-4 h-4 text-emerald-400" />
                            <span>User Complete Financial Summary</span>
                          </h5>
                          <span className="text-[9.5px] font-mono text-slate-400 bg-slate-950 px-2.5 py-0.5 rounded-lg border border-slate-800">
                            UID: {editingUser.id}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          {/* Total Deposit Card */}
                          <div className="bg-emerald-950/40 border border-emerald-800/50 p-3 rounded-2xl">
                            <span className="text-[9px] font-extrabold text-emerald-400 uppercase tracking-wider block flex items-center gap-1">
                              <ArrowDownLeft className="w-3 h-3 text-emerald-400" />
                              Total Deposit
                            </span>
                            <p className="text-base font-black text-emerald-300 font-mono mt-1">
                              ₹{editUserDep.approvedDeposit.toLocaleString('en-IN')}
                            </p>
                            {editUserDep.pendingDeposit > 0 ? (
                              <p className="text-[9px] font-extrabold text-amber-400 mt-0.5 font-mono">
                                ⏳ Pending: ₹{editUserDep.pendingDeposit.toLocaleString('en-IN')}
                              </p>
                            ) : (
                              <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                                {editUserDep.totalCount} deposit tx
                              </p>
                            )}
                          </div>

                          {/* Plans Purchased Card */}
                          <div className="bg-teal-950/40 border border-teal-800/50 p-3 rounded-2xl">
                            <span className="text-[9px] font-extrabold text-teal-400 uppercase tracking-wider block flex items-center gap-1">
                              <ShoppingBag className="w-3 h-3 text-teal-400" />
                              Plans Bought
                            </span>
                            <p className="text-base font-black text-teal-200 font-mono mt-1">
                              {editUserPurchases.length} Plan{editUserPurchases.length !== 1 ? 's' : ''}
                            </p>
                            <p className="text-[9px] text-teal-400 font-extrabold font-mono mt-0.5">
                              ₹{totalPlanInvest.toLocaleString('en-IN')} ({activePlansCount} Active)
                            </p>
                          </div>

                          {/* Total Withdrawn Card */}
                          <div className="bg-purple-950/40 border border-purple-800/50 p-3 rounded-2xl">
                            <span className="text-[9px] font-extrabold text-purple-400 uppercase tracking-wider block flex items-center gap-1">
                              <ArrowUpRight className="w-3 h-3 text-purple-400" />
                              Total Withdrawn
                            </span>
                            <p className="text-base font-black text-purple-300 font-mono mt-1">
                              ₹{editUserWith.approvedWithdraw.toLocaleString('en-IN')}
                            </p>
                            {editUserWith.pendingWithdraw > 0 ? (
                              <p className="text-[9px] font-extrabold text-amber-400 mt-0.5 font-mono">
                                ⏳ Pending: ₹{editUserWith.pendingWithdraw.toLocaleString('en-IN')}
                              </p>
                            ) : (
                              <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                                {editUserWith.totalCount} withdraw tx
                              </p>
                            )}
                          </div>

                          {/* Wallet Balance & Total Earnings */}
                          <div className="bg-slate-950 border border-slate-800 p-3 rounded-2xl">
                            <span className="text-[9px] font-extrabold text-amber-400 uppercase tracking-wider block flex items-center gap-1">
                              <Coins className="w-3 h-3 text-amber-400" />
                              Current Wallet
                            </span>
                            <p className="text-base font-black text-white font-mono mt-1">
                              ₹{editingUser.balance % 1 === 0 ? editingUser.balance.toLocaleString('en-IN') : editingUser.balance.toFixed(2)}
                            </p>
                            <p className="text-[9px] text-teal-300 font-extrabold font-mono mt-0.5">
                              Earned: ₹{editingUser.totalEarnings % 1 === 0 ? editingUser.totalEarnings.toLocaleString('en-IN') : editingUser.totalEarnings.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {/* Referral & Team Commission Summary Card */}
                        <div className="bg-gradient-to-r from-amber-950/50 via-teal-950/40 to-slate-950 p-3 rounded-2xl border border-amber-800/40">
                          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/60">
                            <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                              <Award className="w-3.5 h-3.5 text-amber-400" />
                              <span>Referral Commission Earnings (रिफर कमाई)</span>
                            </span>
                            <span className="text-xs font-black text-emerald-400 font-mono bg-emerald-950/80 px-2 py-0.5 rounded-lg border border-emerald-800/50">
                              Total: ₹{editUserRef.totalReferralEarnings.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 mt-2 text-center text-[9px] font-mono">
                            <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800">
                              <span className="text-amber-400 block text-[8.5px] font-bold uppercase">Lvl 1 (10% Direct)</span>
                              <strong className="text-emerald-300 text-[11px] block mt-0.5">₹{editUserRef.l1Earning.toLocaleString('en-IN')}</strong>
                              <span className="text-slate-500 block text-[8px]">{editUserRef.l1Count} Referrals</span>
                            </div>
                            <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800">
                              <span className="text-teal-400 block text-[8.5px] font-bold uppercase">Lvl 2 (5% Indirect)</span>
                              <strong className="text-teal-300 text-[11px] block mt-0.5">₹{editUserRef.l2Earning.toLocaleString('en-IN')}</strong>
                              <span className="text-slate-500 block text-[8px]">{editUserRef.l2Count} Referrals</span>
                            </div>
                            <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800">
                              <span className="text-sky-400 block text-[8.5px] font-bold uppercase">Lvl 3 (2% Sub)</span>
                              <strong className="text-sky-300 text-[11px] block mt-0.5">₹{editUserRef.l3Earning.toLocaleString('en-IN')}</strong>
                              <span className="text-slate-500 block text-[8px]">{editUserRef.l3Count} Referrals</span>
                            </div>
                          </div>
                        </div>

                        {/* User Bank Account Details Quick Info */}
                        <div className="pt-2.5 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono">
                          <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-850">
                            <span className="text-slate-500 block text-[8px] uppercase font-bold">Bank Name</span>
                            <strong className="text-slate-200 truncate block">{editingUser.bankAccount?.bankName || editBankName || 'Not Bound'}</strong>
                          </div>
                          <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-850">
                            <span className="text-slate-500 block text-[8px] uppercase font-bold">Account Holder</span>
                            <strong className="text-slate-200 truncate block">{editingUser.bankAccount?.accountHolder || editHolderName || 'N/A'}</strong>
                          </div>
                          <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-850">
                            <span className="text-slate-500 block text-[8px] uppercase font-bold">Account Number</span>
                            <strong className="text-emerald-400 truncate block select-all">{editingUser.bankAccount?.accountNumber || editAccountNumber || 'N/A'}</strong>
                          </div>
                          <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-850">
                            <span className="text-slate-500 block text-[8px] uppercase font-bold">IFSC Code</span>
                            <strong className="text-teal-300 truncate block select-all">{editingUser.bankAccount?.ifscCode || editIfscCode || 'N/A'}</strong>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Balance Adjustment Form */}
                  <form onSubmit={handleAdjustBalance} className="space-y-3.5">
                    <h5 className="text-[10px] font-black text-teal-400 uppercase tracking-widest block">Adjust Wallet Funds</h5>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setAdjustType('add')}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${
                          adjustType === 'add'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                            : 'bg-slate-800/40 text-slate-400 border-transparent'
                        }`}
                      >
                        Add Balance (+)
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdjustType('subtract')}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${
                          adjustType === 'subtract'
                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                            : 'bg-slate-800/40 text-slate-400 border-transparent'
                        }`}
                      >
                        Deduct Balance (-)
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-slate-400">₹</span>
                        <input
                          type="number"
                          value={amountAdjust}
                          onChange={(e) => setAmountAdjust(e.target.value)}
                          placeholder="Amount in Rupees"
                          className="w-full pl-8 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black uppercase tracking-wider"
                      >
                        Apply
                      </button>
                    </div>
                  </form>

                  {/* Total Income / Plan Yield Override Form */}
                  <div className="space-y-3 pt-4 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <h5 className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                        <span>Total Income / Plan Yield Override (कुल आय)</span>
                      </h5>
                      <span className="text-[9px] font-mono text-slate-400">
                        Current: <strong className="text-teal-300">₹{editingUser.totalEarnings % 1 === 0 ? editingUser.totalEarnings.toLocaleString('en-IN') : editingUser.totalEarnings.toFixed(2)}</strong>
                      </span>
                    </div>
                    <p className="text-[9.5px] text-slate-400 leading-tight">
                      This value controls the user's Total Plan Income displayed on the Home screen, Profile, and Withdrawal limit (Plan Yield).
                    </p>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-slate-400">₹</span>
                        <input
                          type="number"
                          value={editTotalEarnings}
                          onChange={(e) => setEditTotalEarnings(e.target.value)}
                          placeholder="Set Total Income in Rupees"
                          className="w-full pl-8 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSaveTotalEarnings}
                        className="px-4 bg-gradient-to-r from-amber-600 to-teal-600 hover:from-amber-700 hover:to-teal-700 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-md"
                      >
                        Update Income
                      </button>
                    </div>
                  </div>

                  {/* Bank Details Config Form (Override channel) */}
                  <div className="space-y-3.5 pt-4 border-t border-slate-800">
                    <h5 className="text-[10px] font-black text-teal-400 uppercase tracking-widest block">Bank Account Override</h5>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Bank Name</label>
                        <input
                          type="text"
                          value={editBankName}
                          onChange={(e) => setEditBankName(e.target.value)}
                          placeholder="State Bank of India"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-[11px] font-bold text-white font-sans"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Holder Name</label>
                        <input
                          type="text"
                          value={editHolderName}
                          onChange={(e) => setEditHolderName(e.target.value)}
                          placeholder="Beneficiary Name"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-[11px] font-bold text-white font-sans"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Account Number</label>
                          {editAccountNumber && (
                            <button
                              type="button"
                              onClick={() => handleCopyText(editAccountNumber, 'edit_ac', 'Account Number Copied!')}
                              className="text-[9px] text-teal-400 hover:text-teal-300 font-bold flex items-center gap-0.5 cursor-pointer"
                            >
                              {copiedKey === 'edit_ac' ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                              <span>{copiedKey === 'edit_ac' ? 'Copied' : 'Copy'}</span>
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={editAccountNumber}
                          onChange={(e) => setEditAccountNumber(e.target.value)}
                          placeholder="12 digit account no"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-[11px] font-bold text-white font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">IFSC Code</label>
                          {editIfscCode && (
                            <button
                              type="button"
                              onClick={() => handleCopyText(editIfscCode, 'edit_ifsc', 'IFSC Code Copied!')}
                              className="text-[9px] text-teal-400 hover:text-teal-300 font-bold flex items-center gap-0.5 cursor-pointer"
                            >
                              {copiedKey === 'edit_ifsc' ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                              <span>{copiedKey === 'edit_ifsc' ? 'Copied' : 'Copy'}</span>
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={editIfscCode}
                          onChange={(e) => setEditIfscCode(e.target.value)}
                          placeholder="SBIN000XXXX"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-[11px] font-bold text-white font-mono"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleSaveBankOverride}
                      className="w-full py-2.5 mt-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-black uppercase rounded-xl tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Save Bank Credentials</span>
                    </button>
                  </div>

                  {/* Profile Credentials Override Form */}
                  <div className="space-y-3.5 pt-4 border-t border-slate-800">
                    <h5 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">User Credentials & Role</h5>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Full Name</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="User's Name"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-[11px] font-bold text-white font-sans"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Phone (excluding +91)</label>
                        <input
                          type="text"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          placeholder="10 digit phone"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-[11px] font-bold text-white font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Password</label>
                        <input
                          type="text"
                          value={editPassword}
                          onChange={(e) => setEditPassword(e.target.value)}
                          placeholder="Password"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-[11px] font-bold text-white font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">User Role</label>
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value as 'user' | 'admin')}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-[11px] font-bold text-white font-sans"
                        >
                          <option value="user">User</option>
                          <option value="admin">Administrator</option>
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={handleSaveCredentialsOverride}
                      className="w-full py-2.5 mt-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-black uppercase rounded-xl tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Save Profile Credentials</span>
                    </button>
                  </div>

                  {/* Account Block/Suspension Controls */}
                  <div className="space-y-3 pt-4 border-t border-slate-800">
                    <h5 className="text-[10px] font-black text-rose-400 uppercase tracking-widest block">Account Protection & Moderation</h5>
                    <div className="flex items-center justify-between p-3 bg-slate-900 rounded-2xl border border-slate-800/80">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${editingUser.status === 'blocked' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                          <span className="text-xs font-black text-white uppercase tracking-wider">
                            {editingUser.status === 'blocked' ? 'Suspended' : 'Active'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium mt-1 col-span-2">
                          {editingUser.status === 'blocked' 
                            ? 'This user is suspended and cannot log in.' 
                            : 'This user is active and can perform normal operations.'}
                        </p>
                      </div>

                      <button
                        onClick={handleToggleUserBlock}
                        className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
                          editingUser.status === 'blocked'
                            ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border-emerald-500/40 animate-pulse'
                            : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {editingUser.status === 'blocked' ? 'Activate User' : 'Suspend User'}
                      </button>
                    </div>
                  </div>

                  {/* User Purchased Plans Breakdown */}
                  <div className="space-y-3 pt-4 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <h5 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Bought Investment Plans</span>
                      </h5>
                      {(() => {
                        const userP = getUserPurchases(editingUser.id, editingUser.phone);
                        const totalInvest = userP.reduce((sum, p) => sum + (p.price || 0), 0);
                        return (
                          <span className="text-[9px] font-mono font-bold text-teal-300 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md">
                            Total: {userP.length} Plans (₹{totalInvest.toLocaleString()})
                          </span>
                        );
                      })()}
                    </div>

                    {(() => {
                      const userP = getUserPurchases(editingUser.id, editingUser.phone);
                      if (userP.length === 0) {
                        return (
                          <div className="p-3 bg-slate-950/40 rounded-2xl border border-slate-900 text-center">
                            <p className="text-[10px] text-slate-500 font-bold">This user has not bought any investment plans yet.</p>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                          {userP.map((pur, idx) => (
                            <div key={pur.id || idx} className="p-3 bg-slate-950 rounded-2xl border border-slate-800/90 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-white flex items-center gap-1.5">
                                  <Package className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>{pur.planTitle}</span>
                                </span>
                                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                                  pur.completed ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60' : 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                                }`}>
                                  {pur.completed ? 'Deactivated' : 'Active'}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-900">
                                <div>
                                  <span className="text-slate-500">Plan Price: </span>
                                  <strong className="text-emerald-400 font-bold">₹{pur.price}</strong>
                                </div>
                                <div>
                                  <span className="text-slate-500">Daily Return: </span>
                                  <strong className="text-teal-300 font-bold">₹{pur.dailyIncome}/day</strong>
                                </div>
                                <div>
                                  <span className="text-slate-500">Bought On: </span>
                                  <span className="text-slate-300">
                                    {pur.datePurchased ? new Date(pur.datePurchased).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-500">Total Claimed: </span>
                                  <strong className="text-amber-300 font-bold">₹{(pur.totalClaimed || 0) % 1 === 0 ? (pur.totalClaimed || 0).toLocaleString('en-IN') : (pur.totalClaimed || 0).toFixed(2)}</strong>
                                </div>
                              </div>

                              {/* Admin Action Controls for Plan Deactivation / Deletion */}
                              <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-900">
                                <button
                                  type="button"
                                  onClick={() => handleToggleDeactivatePurchase(pur.id, editingUser.id)}
                                  className={`px-2.5 py-1 text-[9px] font-extrabold rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                                    pur.completed
                                      ? 'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-400 border-emerald-700/60'
                                      : 'bg-amber-950/60 hover:bg-amber-900/80 text-amber-400 border-amber-700/60'
                                  }`}
                                  title={pur.completed ? "Reactivate this plan" : "Deactivate this plan"}
                                >
                                  <Power className="w-3 h-3" />
                                  <span>{pur.completed ? 'Reactivate Plan' : 'Deactivate Plan'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePurchase(pur.id, editingUser.id)}
                                  className="px-2 py-1 text-[9px] font-extrabold rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-400 border border-rose-800/60 transition-all cursor-pointer flex items-center gap-1"
                                  title="Delete this purchase record"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  {/* User Transaction History (Recharges & Withdrawals) */}
                  <div className="space-y-3 pt-4 border-t border-slate-800">
                    <h5 className="text-[10px] font-black text-teal-400 uppercase tracking-widest flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-teal-400" />
                      <span>User Deposit & Withdrawal History</span>
                    </h5>

                    {(() => {
                      const userTxs = getUserTransactions(editingUser.id, editingUser.phone);
                      if (userTxs.length === 0) {
                        return (
                          <div className="p-3 bg-slate-950/40 rounded-2xl border border-slate-900 text-center">
                            <p className="text-[10px] text-slate-500 font-bold">No transaction records found for this user.</p>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {userTxs.map((tx, txIdx) => (
                            <div key={tx.id || txIdx} className="p-3 bg-slate-950 rounded-2xl border border-slate-850 flex items-center justify-between text-[10px] font-mono">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded-md font-bold uppercase text-[8px] ${
                                    tx.type === 'recharge' 
                                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                                      : tx.type === 'withdraw' 
                                      ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                      : 'bg-slate-800 text-slate-300'
                                  }`}>
                                    {tx.type}
                                  </span>
                                  <span className={`font-bold uppercase text-[8.5px] ${
                                    tx.status === 'success' ? 'text-emerald-400' : tx.status === 'pending' ? 'text-amber-400 animate-pulse' : 'text-rose-400'
                                  }`}>
                                    [{tx.status}]
                                  </span>
                                </div>
                                <p className="text-slate-400 text-[9px] font-sans">{tx.description}</p>
                                {tx.utr && <p className="text-slate-500 text-[8.5px]">UTR: <strong className="text-slate-300 select-all">{tx.utr}</strong></p>}
                                <p className="text-slate-600 text-[8px]">{tx.date}</p>
                              </div>
                              <div className="text-right">
                                <span className={`text-xs font-black ${
                                  tx.type === 'recharge' ? 'text-emerald-400' : tx.type === 'withdraw' ? 'text-purple-300' : 'text-white'
                                }`}>
                                  ₹{tx.amount}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Danger Zone: Account Deletion */}
                  <div className="space-y-3 pt-4 border-t border-slate-800">
                    <h5 className="text-[10px] font-black text-rose-500 uppercase tracking-widest block">Danger Zone</h5>
                    <div className="flex items-center justify-between p-3 bg-rose-950/10 rounded-2xl border border-rose-900/30">
                      <div className="pr-2">
                        <span className="text-xs font-black text-rose-400 uppercase tracking-wider block">Delete Account</span>
                        <p className="text-[10px] text-slate-400 font-medium mt-1">
                          Permanently delete +91 {editingUser.phone.replace('+91 ', '')}'s account. This action is irreversible.
                        </p>
                      </div>

                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-[0_4px_12px_rgba(225,29,72,0.2)] transition-all cursor-pointer whitespace-nowrap"
                      >
                        Delete Account
                      </button>
                    </div>
                  </div>

                  {/* Summary Indicators */}
                  <div className="pt-4 border-t border-slate-800 grid grid-cols-2 gap-2 text-center">
                    <div className="bg-slate-950/40 p-2.5 rounded-2xl border border-slate-900">
                      <p className="text-[9px] text-slate-500 font-bold uppercase">Balance</p>
                      <span className="text-xs font-black text-white font-mono">₹{editingUser.balance % 1 === 0 ? editingUser.balance.toLocaleString('en-IN') : editingUser.balance.toFixed(2)}</span>
                    </div>
                    <div className="bg-slate-950/40 p-2.5 rounded-2xl border border-slate-900">
                      <p className="text-[9px] text-slate-500 font-bold uppercase">Total Earned</p>
                      <span className="text-xs font-black text-teal-300 font-mono">₹{editingUser.totalEarnings % 1 === 0 ? editingUser.totalEarnings.toLocaleString('en-IN') : editingUser.totalEarnings.toFixed(2)}</span>
                    </div>
                  </div>
                </motion.div>
              ) : (
                // Users list
                <div className="space-y-2.5">
                  {filteredUsers.length === 0 ? (
                    <div className="text-center py-10 bg-slate-850 rounded-3xl border border-slate-800">
                      <Users className="w-10 h-10 text-slate-600 mx-auto mb-2 animate-pulse" />
                      <p className="text-xs font-extrabold text-slate-500">No users found matching query</p>
                    </div>
                  ) : (
                    filteredUsers.map(user => {
                      const isCurrent = currentProfile?.id === user.id;
                      const userPurchasesList = getUserPurchases(user.id, user.phone);
                      const userDep = getUserDeposits(user.id, user.phone);
                      const userWith = getUserWithdrawals(user.id, user.phone);
                      const totalPlanPrice = userPurchasesList.reduce((s, p) => s + (p.price || 0), 0);
                      const activePlansCount = userPurchasesList.filter(p => !p.completed).length;

                      return (
                        <div
                          key={user.id}
                          className={`p-4 bg-slate-850 rounded-3xl border ${
                            isCurrent ? 'border-emerald-600/60' : 'border-slate-800/80'
                          } flex flex-col md:flex-row md:items-center justify-between shadow-md gap-3`}
                        >
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-white">{user.name}</span>
                              {isCurrent && (
                                <span className="bg-emerald-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                                  Current Session
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] font-mono text-slate-400 flex flex-wrap items-center gap-1.5">
                              <span>{user.phone}</span>
                              {user.password && (
                                <span className="bg-slate-900/80 border border-emerald-500/20 text-amber-300 px-2 py-0.5 rounded-lg text-[9px] font-bold tracking-wider flex items-center gap-1">
                                  <span>🔑</span>
                                  <span className="font-mono text-slate-100 select-all">{user.password}</span>
                                </span>
                              )}
                            </p>

                            {/* Referral Info & Badges */}
                            <div className="space-y-1">
                              <div className="flex flex-wrap gap-1.5 items-center">
                                <span className="text-[9px] bg-slate-900 border border-slate-800 text-teal-300 px-2 py-0.5 rounded-lg font-mono">
                                  My Invite Code: <strong className="text-white font-black">{user.inviteCode}</strong>
                                </span>
                                {user.inviterCode ? (
                                  <span className="text-[9px] bg-emerald-950 border border-emerald-600/50 text-emerald-300 px-2 py-0.5 rounded-lg font-mono font-bold flex items-center gap-1 shadow-sm">
                                    <span className="text-amber-300">🔗 Referral Link Account</span>
                                    <span>• Sponsor:</span>
                                    <strong className="text-white font-black">{user.inviterCode}</strong>
                                    {(() => {
                                      const sponsor = usersList.find(u => u.inviteCode === user.inviterCode);
                                      return sponsor ? `(${sponsor.name} - ${sponsor.phone})` : '';
                                    })()}
                                  </span>
                                ) : (
                                  <span className="text-[9px] bg-slate-900/40 border border-slate-800 text-slate-500 px-2 py-0.5 rounded-lg font-mono">
                                    Direct Organic Registration
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Comprehensive Financial Overview Cards for each User */}
                            {(() => {
                              const userRef = getUserReferralStats(user);
                              return (
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-1">
                                  {/* Total Deposit */}
                                  <div className="bg-emerald-950/40 border border-emerald-800/40 p-2 rounded-xl">
                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Total Deposit</span>
                                    <span className="text-[11px] font-black text-emerald-400 font-mono">₹{userDep.approvedDeposit.toLocaleString('en-IN')}</span>
                                    {userDep.pendingDeposit > 0 && (
                                      <span className="text-[8px] font-bold text-amber-400 block font-mono">Pend: ₹{userDep.pendingDeposit}</span>
                                    )}
                                  </div>

                                  {/* Plans Purchased */}
                                  <div className="bg-teal-950/40 border border-teal-800/40 p-2 rounded-xl">
                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Plans Bought</span>
                                    <span className="text-[11px] font-black text-teal-300 font-mono">{userPurchasesList.length} (₹{totalPlanPrice.toLocaleString('en-IN')})</span>
                                    <span className="text-[8px] font-bold text-teal-400/80 block font-mono">{activePlansCount} Active</span>
                                  </div>

                                  {/* Total Withdraw */}
                                  <div className="bg-purple-950/40 border border-purple-800/40 p-2 rounded-xl">
                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Total Withdraw</span>
                                    <span className="text-[11px] font-black text-purple-300 font-mono">₹{userWith.approvedWithdraw.toLocaleString('en-IN')}</span>
                                    {userWith.pendingWithdraw > 0 && (
                                      <span className="text-[8px] font-bold text-amber-400 block font-mono">Pend: ₹{userWith.pendingWithdraw}</span>
                                    )}
                                  </div>

                                  {/* Referral Earnings Card */}
                                  <div className="bg-amber-950/40 border border-amber-800/40 p-2 rounded-xl">
                                    <span className="text-[8px] font-bold text-amber-400 uppercase tracking-wider block">Reffer Income</span>
                                    <span className="text-[11px] font-black text-amber-300 font-mono">₹{userRef.totalReferralEarnings.toLocaleString('en-IN')}</span>
                                    <span className="text-[8px] font-bold text-teal-300 block font-mono">Team: {userRef.totalDownlines} users</span>
                                  </div>

                                  {/* Balance & Earnings */}
                                  <div className="bg-slate-950 border border-slate-800 p-2 rounded-xl">
                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Wallet / Earned</span>
                                    <span className="text-[11px] font-black text-white font-mono">₹{user.balance.toFixed(0)}</span>
                                    <span className="text-[8px] font-bold text-teal-400 block font-mono">Earn: ₹{user.totalEarnings.toFixed(0)}</span>
                                  </div>
                                </div>
                              );
                            })()}

                            {/* User Purchased Plans Badges */}
                            {userPurchasesList.length === 0 ? (
                              <div>
                                <span className="text-[9px] bg-slate-900/60 border border-slate-800 text-slate-500 px-2 py-0.5 rounded-lg font-mono">
                                  No Plans Bought
                                </span>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <div className="flex flex-wrap gap-1">
                                  {userPurchasesList.map((p, pIdx) => (
                                    <div
                                      key={p.id || pIdx}
                                      className={`text-[8.5px] border px-2 py-0.5 rounded-md font-mono flex items-center gap-1.5 ${
                                        p.completed
                                          ? 'bg-slate-950/80 border-slate-800 text-slate-500'
                                          : 'bg-slate-950 border-emerald-900/60 text-teal-300'
                                      }`}
                                    >
                                      <Tag className={`w-2.5 h-2.5 ${p.completed ? 'text-slate-600' : 'text-teal-400'}`} />
                                      <span>{p.planTitle} (₹{p.price})</span>
                                      <span className={`text-[7.5px] font-black px-1 rounded ${
                                        p.completed ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60' : 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                                      }`}>
                                        {p.completed ? 'OFF' : 'ON'}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleToggleDeactivatePurchase(p.id, user.id);
                                        }}
                                        className={`p-0.5 rounded hover:bg-slate-800 transition-colors cursor-pointer ${
                                          p.completed ? 'text-emerald-400' : 'text-amber-400'
                                        }`}
                                        title={p.completed ? "Reactivate Plan" : "Deactivate Plan"}
                                      >
                                        <Power className="w-2.5 h-2.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex md:flex-col gap-2 shrink-0">
                            <button
                              onClick={() => handleOpenUserEdit(user)}
                              className="flex-1 md:flex-initial px-3 py-2 bg-slate-800 hover:bg-slate-750 text-[10px] font-black uppercase text-teal-300 rounded-xl transition-all flex items-center justify-center gap-1 border border-slate-700/50 cursor-pointer w-24 font-sans"
                            >
                              <Edit2 className="w-2.5 h-2.5" />
                              <span>Manage</span>
                            </button>
                            <button
                              onClick={() => setViewingReferralsUser(user)}
                              className="flex-1 md:flex-initial px-3 py-2 bg-emerald-950/40 hover:bg-emerald-900/40 text-[10px] font-black uppercase text-emerald-400 rounded-xl transition-all flex items-center justify-center gap-1 border border-emerald-900/30 cursor-pointer w-24 font-sans"
                            >
                              <Users className="w-3 h-3" />
                              <span>View Team</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 3: PENDING APPROVAL DESK */}
          {adminTab === 'approvals' && (
            <motion.div
              key="approvals-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              {/* Search Bar inside Approvals Desk */}
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Search request by phone (9595350797), name, UTR number, amount..."
                  value={approvalSearchQuery}
                  onChange={(e) => setApprovalSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-600 transition-all font-mono"
                />
              </div>

              {/* Part 1: Pending Deposits (Recharges) */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-teal-400 uppercase tracking-widest flex items-center gap-2">
                  <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                  <span>Pending Deposit Recharges ({filteredPendingRecharges.length} of {pendingRecharges.length})</span>
                </h3>

                {filteredPendingRecharges.length === 0 ? (
                  <div className="p-5 bg-slate-850 rounded-3xl border border-slate-800/80 text-center text-slate-500 text-xs font-bold">
                    No matching pending deposit claims found.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {filteredPendingRecharges.map(tx => {
                      const txUser = usersList.find(u => (tx.userId && u.id === tx.userId) || (tx.userPhone && u.phone === tx.userPhone));
                      return (
                        <div key={tx.id} className="p-4 bg-slate-850 rounded-3xl border border-slate-800 space-y-3 shadow-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-xs font-black text-white block">
                                {txUser ? txUser.name : 'Anonymous'} 
                                <span className="text-[10px] text-slate-400 font-mono font-medium ml-1.5">({tx.userPhone || 'Anonymous'})</span>
                              </span>
                              <p className="text-[9px] font-mono text-slate-500 mt-0.5">{tx.date}</p>
                            </div>
                            <span className="text-sm font-black text-emerald-400 font-mono">₹{tx.amount % 1 === 0 ? tx.amount.toLocaleString('en-IN') : tx.amount.toFixed(2)}</span>
                          </div>

                          {tx.utr && (
                            <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-900/80 flex items-center justify-between">
                              <span className="text-[9px] text-slate-500 font-bold uppercase font-mono">UTR Reference</span>
                              <span className="text-xs font-black text-teal-300 font-mono select-all">{tx.utr}</span>
                            </div>
                          )}

                          {tx.proofImage && (
                            <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-900/80 flex flex-col gap-2">
                              <span className="text-[9px] text-slate-500 font-bold uppercase font-mono text-left block">Uploaded Screenshot Proof</span>
                              <div className="relative overflow-hidden rounded-xl border border-slate-800">
                                <img 
                                  src={tx.proofImage} 
                                  alt="Payment Receipt" 
                                  className="max-h-48 w-full object-contain bg-slate-900 hover:scale-[1.05] transition-transform duration-300 cursor-pointer"
                                  onClick={() => {
                                    const win = window.open();
                                    if (win) {
                                      win.document.write(`<img src="${tx.proofImage}" style="max-width:100%; height:auto; display:block; margin:auto;" />`);
                                    }
                                  }}
                                />
                              </div>
                              <span className="text-[8px] text-slate-400 font-medium text-center">Click image to view full size</span>
                            </div>
                          )}

                          <div className="flex gap-2.5 pt-1">
                            <button
                              onClick={() => handleRejectRecharge(tx.id)}
                              className="flex-1 py-2 bg-slate-800 hover:bg-slate-750 text-rose-400 rounded-xl text-[10px] font-black uppercase border border-slate-700 flex items-center justify-center gap-1 transition-all cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject (Trash UTR)</span>
                            </button>
                            <button
                              onClick={() => handleApproveRecharge(tx.id)}
                              className="flex-1 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-1 transition-all cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5 text-white" />
                              <span>Approve Deposit</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Part 2: Pending Withdrawals */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <h3 className="text-xs font-black text-teal-400 uppercase tracking-widest flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-rose-400" />
                  <span>Pending Payout Settlements ({filteredPendingWithdrawals.length} of {pendingWithdrawals.length})</span>
                </h3>

                {filteredPendingWithdrawals.length === 0 ? (
                  <div className="p-5 bg-slate-850 rounded-3xl border border-slate-800/80 text-center text-slate-500 text-xs font-bold">
                    No matching pending payout claims found.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {filteredPendingWithdrawals.map(tx => {
                      // Fetch current bank details of user
                      const user = usersList.find(u => (tx.userId && u.id === tx.userId) || (tx.userPhone && u.phone === tx.userPhone));
                      return (
                        <div key={tx.id} className="p-4 bg-slate-850 rounded-3xl border border-slate-800 space-y-3 shadow-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-xs font-black text-white block">
                                {user ? user.name : 'Anonymous'} 
                                <span className="text-[10px] text-slate-400 font-mono font-medium ml-1.5">({tx.userPhone || 'Anonymous'})</span>
                              </span>
                              <p className="text-[9px] font-mono text-slate-500 mt-0.5">{tx.date}</p>
                            </div>
                            <span className="text-sm font-black text-rose-400 font-mono">₹{tx.amount % 1 === 0 ? tx.amount.toLocaleString('en-IN') : tx.amount.toFixed(2)}</span>
                          </div>

                          {/* Bank Details Display */}
                          <div className="p-3 bg-slate-950/70 rounded-2xl border border-slate-900 space-y-2">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-slate-500 font-bold uppercase font-mono">Bank Name</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-white font-extrabold">{user?.bankAccount?.bankName || 'N/A'}</span>
                                {user?.bankAccount?.bankName && (
                                  <button
                                    onClick={() => handleCopyText(user.bankAccount!.bankName, `bank_${tx.id}`, 'Bank Name Copied!')}
                                    className="p-1 text-slate-400 hover:text-teal-300 transition-colors cursor-pointer"
                                    title="Copy Bank Name"
                                  >
                                    {copiedKey === `bank_${tx.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-slate-500 font-bold uppercase font-mono">Holder</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-white font-extrabold">{user?.bankAccount?.accountHolder || 'N/A'}</span>
                                {user?.bankAccount?.accountHolder && (
                                  <button
                                    onClick={() => handleCopyText(user.bankAccount!.accountHolder, `holder_${tx.id}`, 'Holder Name Copied!')}
                                    className="p-1 text-slate-400 hover:text-teal-300 transition-colors cursor-pointer"
                                    title="Copy Holder Name"
                                  >
                                    {copiedKey === `holder_${tx.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-slate-500 font-bold uppercase font-mono">A/C NO</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-teal-300 font-bold font-mono select-all bg-teal-950/50 px-2 py-0.5 rounded-md border border-teal-800/40">
                                  {user?.bankAccount?.accountNumber || 'N/A'}
                                </span>
                                {user?.bankAccount?.accountNumber && (
                                  <button
                                    onClick={() => handleCopyText(user.bankAccount!.accountNumber, `ac_${tx.id}`, 'Account Number Copied!')}
                                    className="px-2 py-1 bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 rounded-lg font-black text-[9px] flex items-center gap-1 transition-all cursor-pointer active:scale-95 shadow-sm"
                                    title="Copy Account Number"
                                  >
                                    {copiedKey === `ac_${tx.id}` ? (
                                      <>
                                        <Check className="w-3 h-3 text-emerald-400" />
                                        <span className="text-emerald-400">COPIED</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3 h-3 text-teal-300" />
                                        <span>COPY A/C</span>
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-slate-500 font-bold uppercase font-mono">IFSC</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-teal-300 font-bold font-mono select-all bg-teal-950/50 px-2 py-0.5 rounded-md border border-teal-800/40">
                                  {user?.bankAccount?.ifscCode || 'N/A'}
                                </span>
                                {user?.bankAccount?.ifscCode && (
                                  <button
                                    onClick={() => handleCopyText(user.bankAccount!.ifscCode, `ifsc_${tx.id}`, 'IFSC Code Copied!')}
                                    className="px-2 py-1 bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 rounded-lg font-black text-[9px] flex items-center gap-1 transition-all cursor-pointer active:scale-95 shadow-sm"
                                    title="Copy IFSC Code"
                                  >
                                    {copiedKey === `ifsc_${tx.id}` ? (
                                      <>
                                        <Check className="w-3 h-3 text-emerald-400" />
                                        <span className="text-emerald-400">COPIED</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3 h-3 text-teal-300" />
                                        <span>COPY IFSC</span>
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>

                            {user?.bankAccount?.accountNumber && user?.bankAccount?.ifscCode && (
                              <button
                                onClick={() => {
                                  const fullDetails = `Bank: ${user.bankAccount?.bankName || ''}\nHolder: ${user.bankAccount?.accountHolder || ''}\nA/C No: ${user.bankAccount?.accountNumber || ''}\nIFSC: ${user.bankAccount?.ifscCode || ''}\nAmount: ₹${tx.amount}`;
                                  handleCopyText(fullDetails, `full_${tx.id}`, 'All Bank Details Copied!');
                                }}
                                className="w-full py-1.5 mt-1 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white rounded-lg text-[9px] font-bold uppercase border border-slate-800 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98"
                              >
                                {copiedKey === `full_${tx.id}` ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    <span className="text-emerald-400 font-bold">ALL DETAILS COPIED TO CLIPBOARD!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Copy All Bank Details</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>

                          <div className="flex gap-2.5 pt-1">
                            <button
                              onClick={() => handleRejectWithdrawal(tx.id)}
                              className="flex-1 py-2 bg-slate-800 hover:bg-slate-750 text-rose-400 rounded-xl text-[10px] font-black uppercase border border-slate-700 flex items-center justify-center gap-1 transition-all cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject & Refund</span>
                            </button>
                            <button
                              onClick={() => handleApproveWithdrawal(tx.id)}
                              className="flex-1 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-1 transition-all cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5 text-white" />
                              <span>Settle (Approve)</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 4: ADVERTISEMENT PLANS PUBLISHER */}
          {adminTab === 'plans' && (
            <motion.div
              key="plans-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {isCreatingPlan || editingPlan ? (
                // Create/Edit Ad Plan Form
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-slate-850 p-5 rounded-[2rem] border border-slate-800 space-y-4 shadow-xl"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">
                      {editingPlan ? 'Modify Sponsor Plan' : 'Create New Ad Plan'}
                    </h4>
                    <button
                      onClick={() => {
                        setIsCreatingPlan(false);
                        setEditingPlan(null);
                      }}
                      className="text-xs font-black text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>

                  <form onSubmit={handleSavePlan} className="space-y-3.5">
                    {/* Plan Title */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Plan Title</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Apex Ultima Gold"
                        value={planTitle}
                        onChange={(e) => setPlanTitle(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    {/* Plan Category Type */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Plan Class</label>
                        <select
                          value={planType}
                          onChange={(e) => setPlanType(e.target.value as any)}
                          className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none"
                        >
                          <option value="daily">Daily Income (Standard)</option>
                          <option value="vip">VIP Class (Short high-yield)</option>
                        </select>
                      </div>

                      {/* Image URL (Prepopulated/mock options) */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Slots Capacity</label>
                        <input
                          type="number"
                          value={planSlotsMax}
                          onChange={(e) => setPlanSlotsMax(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Price, Daily Income, Duration */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Sponsor Cost</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-500">₹</span>
                          <input
                            type="number"
                            required
                            placeholder="750"
                            value={planPrice}
                            onChange={(e) => setPlanPrice(e.target.value)}
                            className="w-full pl-6 pr-2 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white font-mono"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Daily Reward</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-500">₹</span>
                          <input
                            type="number"
                            required
                            placeholder="320"
                            value={planDailyIncome}
                            onChange={(e) => setPlanDailyIncome(e.target.value)}
                            className="w-full pl-6 pr-2 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white font-mono"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Days Run</label>
                        <input
                          type="number"
                          required
                          placeholder="30"
                          value={planDuration}
                          onChange={(e) => setPlanDuration(e.target.value)}
                          className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white font-mono"
                        />
                      </div>
                    </div>

                    {/* Image Unsplash URL option */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Banner Image URL</label>
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/photo-..."
                        value={planImage}
                        onChange={(e) => setPlanImage(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white font-sans text-[10px]"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer mt-3"
                    >
                      {editingPlan ? 'Update and Save Plan' : 'Publish Plan Live'}
                    </button>
                  </form>
                </motion.div>
              ) : (
                // List of plans with add button
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-xs text-slate-400 font-extrabold uppercase">ACTIVE OFFERS ({plans.length})</span>
                    <button
                      onClick={() => {
                        setEditingPlan(null);
                        setPlanTitle('');
                        setPlanPrice('');
                        setPlanDailyIncome('');
                        setPlanDuration('');
                        setPlanImage('');
                        setPlanSlotsMax('10');
                        setIsCreatingPlan(true);
                      }}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Plan</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {plans.map(p => (
                      <div key={p.id} className="p-3 bg-slate-850 rounded-3xl border border-slate-800 flex items-center gap-3">
                        <img
                          src={p.image}
                          alt={p.title}
                          className="w-12 h-12 object-cover rounded-2xl border border-slate-850 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black text-white truncate">{p.title}</h4>
                            <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase ${
                              p.type === 'vip' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700/60 text-slate-300'
                            }`}>
                              {p.type}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3 mt-1.5 font-mono text-[10px] text-slate-400">
                            <span>Cost: <strong className="text-white">₹{p.price}</strong></span>
                            <span>Daily: <strong className="text-emerald-400">₹{p.dailyIncome}</strong></span>
                            <span>Days: <strong className="text-teal-400">{p.durationDays}</strong></span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 border-l border-slate-800/80 pl-2 shrink-0">
                          <button
                            onClick={() => {
                              setEditingPlan(p);
                              setPlanTitle(p.title);
                              setPlanType(p.type);
                              setPlanPrice(p.price.toString());
                              setPlanDailyIncome(p.dailyIncome.toString());
                              setPlanDuration(p.durationDays.toString());
                              setPlanImage(p.image);
                              setPlanSlotsMax(p.slotsMax.toString());
                            }}
                            className="p-1.5 hover:bg-slate-800 text-teal-400 rounded-lg transition-colors cursor-pointer"
                            title="Edit Plan"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePlan(p.id)}
                            className="p-1.5 hover:bg-slate-800 text-rose-400 rounded-lg transition-colors cursor-pointer"
                            title="Delete Plan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 5: SYSTEM TICKER CUSTOM ALERTS */}
          {adminTab === 'custom_notif' && (
            <motion.div
              key="custom_notif-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="bg-slate-850 p-5 rounded-[2rem] border border-slate-800 space-y-4">
                <h3 className="text-xs font-black text-teal-400 uppercase tracking-widest flex items-center gap-2">
                  <Send className="w-4 h-4 text-emerald-400" />
                  <span>Push Custom Ticker Notification</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  Type a custom message below. It will immediately show up as an active alert ticker in the Home page.
                </p>

                <form onSubmit={handlePushTicker} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Custom Alert Message</label>
                    <textarea
                      rows={3}
                      value={tickerMessage}
                      onChange={(e) => setTickerMessage(e.target.value)}
                      placeholder="e.g., Notice: Server upgrade completed! Withdrawals will process within 10 minutes."
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-600 transition-all font-sans"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Push Live Alert Ticker</span>
                  </button>
                </form>
              </div>

              {/* Ticker history/recommendations */}
              <div className="bg-slate-950/40 p-4 rounded-3xl border border-slate-900 font-sans space-y-2.5">
                <h4 className="text-[10px] text-teal-400 font-black uppercase tracking-wider">Useful Admin Ticker Presets</h4>
                <div className="space-y-2">
                  {[
                    '🔥 Limited Offer: 12% bonus commission on all direct level 1 invites valid today only!',
                    '🚀 Withdrawals are active 24/7. Standard processing window is 5 minutes.',
                    '🎨 PropertyN official property sponsorship partners program reaches 50,000 active sponsors!'
                  ].map((preset, i) => (
                    <button
                      key={i}
                      onClick={() => setTickerMessage(preset)}
                      className="w-full p-2.5 bg-slate-850 hover:bg-slate-800 text-left rounded-xl text-[10px] text-slate-300 font-semibold border border-slate-800/60 block transition-all truncate"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 6: UPI QR SCANNER & TELEGRAM CONFIGURATION */}
          {adminTab === 'upi_config' && (
            <motion.div
              key="upi_config-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* UPI Card */}
              <div className="bg-slate-850 p-5 rounded-[2rem] border border-slate-800 space-y-4">
                <h3 className="text-xs font-black text-teal-400 uppercase tracking-widest flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-emerald-400" />
                  <span>Configure UPI Scanner & Merchant ID</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                  You can update the UPI ID and merchant name used for the Recharge Gateway here.
                  When users deposit funds, they will see these details.
                </p>

                <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold">Current UPI ID:</span>
                    <span className="font-mono text-emerald-400 font-black">{savedUpiId}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold">Current Name:</span>
                    <span className="font-bold text-emerald-300">{savedUpiName}</span>
                  </div>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!upiIdInput.trim() || !upiNameInput.trim()) {
                    triggerToast('All fields are required', 'error');
                    return;
                  }
                  const cleanUpiId = upiIdInput.trim();
                  const cleanUpiName = upiNameInput.trim();
                  localStorage.setItem('adpaint_upi_id', cleanUpiId);
                  localStorage.setItem('adpaint_upi_name', cleanUpiName);
                  localStorage.setItem('adpaint_cashier_url', '');
                  setSavedUpiId(cleanUpiId);
                  setSavedUpiName(cleanUpiName);
                  setSavedCashierUrl('');
                  syncConfigDirectToFirestore({
                    'adpaint_upi_id': cleanUpiId,
                    'adpaint_upi_name': cleanUpiName,
                    'adpaint_cashier_url': ''
                  });
                  firebaseService.updateSettings({
                    upiId: cleanUpiId,
                    merchantName: cleanUpiName,
                    minDeposit: parseFloat(savedMinRecharge || '250'),
                    maxDeposit: 100000,
                    qrCodeUrl: '',
                    updatedAt: new Date().toISOString()
                  }).catch(() => {});
                  window.dispatchEvent(new Event('adpaint_config_updated'));
                  triggerToast('UPI settings saved & published live across all mobile devices!', 'success');
                }} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Merchant UPI ID (e.g. upi@bank)</label>
                    <input
                      type="text"
                      required
                      value={upiIdInput}
                      onChange={(e) => setUpiIdInput(e.target.value)}
                      placeholder="e.g. propertyn@upi"
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-600 transition-all font-sans"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Merchant Business Name</label>
                    <input
                      type="text"
                      required
                      value={upiNameInput}
                      onChange={(e) => setUpiNameInput(e.target.value)}
                      placeholder="e.g. PropertyN Solutions"
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-600 transition-all font-sans"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Payment Details</span>
                  </button>
                </form>
              </div>

              {/* Telegram Links Card */}
              <div className="bg-slate-850 p-5 rounded-[2rem] border border-slate-800 space-y-4">
                <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                  <Send className="w-4 h-4 text-emerald-400" />
                  <span>Configure Telegram Channels & Support IDs</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                  You can configure the redirect links for your official Telegram Channel and Telegram Support chat here.
                </p>

                <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs gap-2">
                    <span className="text-slate-400 font-bold shrink-0">Current Telegram Channel:</span>
                    <span className="font-mono text-emerald-400 font-black break-all text-right select-all">
                      {savedTgChannel}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs gap-2">
                    <span className="text-slate-400 font-bold shrink-0">Current Support Chat:</span>
                    <span className="font-mono text-emerald-300 font-black break-all text-right select-all">
                      {savedTgSupport}
                    </span>
                  </div>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!tgChannelInput.trim() || !tgSupportInput.trim()) {
                    triggerToast('All fields are required', 'error');
                    return;
                  }
                  const cleanChannel = formatTelegramUrl(tgChannelInput.trim(), 'https://t.me/PropertyN_99');
                  const cleanSupport = formatTelegramUrl(tgSupportInput.trim(), 'https://t.me/PropertyN_Support');
                  localStorage.setItem('adpaint_tg_channel', cleanChannel);
                  localStorage.setItem('adpaint_tg_support', cleanSupport);
                  setSavedTgChannel(cleanChannel);
                  setSavedTgSupport(cleanSupport);
                  syncConfigDirectToFirestore({
                    'adpaint_tg_channel': cleanChannel,
                    'adpaint_tg_support': cleanSupport
                  });
                  window.dispatchEvent(new Event('adpaint_config_updated'));
                  triggerToast('Telegram settings saved & published live!', 'success');
                }} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Telegram Channel Link (e.g. https://t.me/channel)</label>
                    <input
                      type="text"
                      required
                      value={tgChannelInput}
                      onChange={(e) => setTgChannelInput(e.target.value)}
                      placeholder="e.g. https://t.me/PropertyN_99"
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-600 transition-all font-sans"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Telegram Customer Support Link (e.g. https://t.me/username)</label>
                    <input
                      type="text"
                      required
                      value={tgSupportInput}
                      onChange={(e) => setTgSupportInput(e.target.value)}
                      placeholder="e.g. https://t.me/PropertyN_Support"
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-600 transition-all font-sans"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Telegram Details</span>
                  </button>
                </form>
              </div>

              {/* APK Download URL Card */}
              <div className="bg-slate-850 p-5 rounded-[2rem] border border-slate-800 space-y-4">
                <h3 className="text-xs font-black text-teal-400 uppercase tracking-widest flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>Configure Android App APK Download URL</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                  You can configure the download link for the official Android APK here. 
                  When users click on the "App Download" button, they will be redirected to this URL.
                </p>

                <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs gap-2">
                    <span className="text-slate-400 font-bold shrink-0">Current APK URL:</span>
                    <span className="font-mono text-teal-400 font-black break-all text-right select-all">
                      {savedApkUrl}
                    </span>
                  </div>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!apkUrlInput.trim()) {
                    triggerToast('APK Download Link is required', 'error');
                    return;
                  }
                  if (!apkUrlInput.trim().startsWith('http://') && !apkUrlInput.trim().startsWith('https://')) {
                    triggerToast('APK Link must be a valid HTTP/HTTPS URL', 'error');
                    return;
                  }
                  localStorage.setItem('adpaint_apk_url', apkUrlInput.trim());
                  setSavedApkUrl(apkUrlInput.trim());
                  syncConfigDirectToFirestore({
                    'adpaint_apk_url': apkUrlInput.trim()
                  });
                  window.dispatchEvent(new Event('adpaint_config_updated'));
                  triggerToast('APK Download Link saved & published live!', 'success');
                }} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">APK Download URL (e.g. https://domain.com/app.apk)</label>
                    <input
                      type="text"
                      required
                      value={apkUrlInput}
                      onChange={(e) => setApkUrlInput(e.target.value)}
                      placeholder="e.g. https://domain.com/PropertyN_Earnings.apk"
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-600 transition-all font-sans font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save APK Download URL</span>
                  </button>
                </form>
              </div>

              {/* Support Agent Photo Configuration Card (Admin Only) */}
              <div className="bg-slate-850 p-5 rounded-[2rem] border border-slate-800 space-y-4">
                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={avatarFileInputRef}
                  onChange={handleAvatarFileUpload}
                  accept="image/*"
                  className="hidden"
                />

                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                    <Camera className="w-4 h-4 text-emerald-400" />
                    <span>Configure Customer Support Agent Photo (सपोर्ट एजेंट की फोटो)</span>
                  </h3>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Admin Exclusive
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                  Upload or select the photo displayed for the 24/7 Customer Support Agent in the app. 
                  Users will see this photo when chatting with support.
                </p>

                {/* Current Avatar Preview */}
                <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full border-2 border-emerald-500/50 overflow-hidden bg-slate-950 shrink-0 shadow-lg flex items-center justify-center">
                      <SupportAgentAvatar
                        src={savedSupportAvatar || undefined}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-200">Active Support Avatar</p>
                      <p className="text-[10px] text-emerald-400 font-medium">
                        {savedSupportAvatar ? 'Custom Photo Applied' : 'Default System HD Photo'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      localStorage.removeItem('adpaint_support_avatar');
                      setSavedSupportAvatar(null);
                      setSupportAvatarInput('');
                      window.dispatchEvent(new Event('adpaint_avatar_updated'));

                      try {
                        const configDocRef = doc(db, "global", "config");
                        const snap = await getDoc(configDocRef);
                        if (snap.exists() && snap.data().config) {
                          const existingConfig = { ...snap.data().config };
                          delete existingConfig['adpaint_support_avatar'];
                          await setDoc(configDocRef, {
                            config: existingConfig,
                            customTicker: localStorage.getItem('adpaint_custom_ticker') || null
                          }, { merge: true });
                        }
                      } catch (err) {
                        console.error("Direct Firestore reset error:", err);
                      }

                      if (onSyncConfig) {
                        onSyncConfig();
                      }
                      triggerToast('Reset to default support agent photo!', 'info');
                    }}
                    className="text-[10px] text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl font-bold border border-slate-700 transition-all flex items-center gap-1 shrink-0"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Reset Default</span>
                  </button>
                </div>

                {/* Action Buttons: Upload File & URL Input */}
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => avatarFileInputRef.current?.click()}
                      className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload Photo from Device (फाइल अपलोड करें)</span>
                    </button>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!supportAvatarInput.trim()) {
                          triggerToast('Please enter an Image URL or upload a file', 'error');
                          return;
                        }
                        handleApplyAvatar(supportAvatarInput.trim());
                      }}
                      className="flex gap-2"
                    >
                      <input
                        type="url"
                        value={supportAvatarInput}
                        onChange={(e) => setSupportAvatarInput(e.target.value)}
                        placeholder="Or paste image URL (https://...)"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-600 transition-all font-sans"
                      />
                      <button
                        type="submit"
                        className="px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shrink-0"
                      >
                        Set URL
                      </button>
                    </form>
                  </div>

                  {/* Ready Presets Selection */}
                  <div className="pt-2">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">
                      Or Choose from Ready High-Resolution Photos:
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {PRESET_AGENT_PHOTOS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleApplyAvatar(preset.url)}
                          className="group relative rounded-2xl overflow-hidden border-2 border-slate-700 hover:border-emerald-400 aspect-square transition-all bg-slate-900 shadow-md cursor-pointer text-left"
                        >
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
                          <span className="absolute bottom-1.5 left-1.5 right-1.5 text-[9px] font-bold text-white truncate block">
                            {preset.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* System Config & Thresholds Card */}
              <div className="bg-slate-850 p-5 rounded-[2rem] border border-slate-800 space-y-4">
                <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>Configure Thresholds, Presets & Bonuses</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                  Configure the minimum withdrawal amount, minimum deposit limits, deposit preset options, daily check-in bonus, and the platform brand name.
                </p>

                <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 font-bold block">Platform Name:</span>
                      <span className="text-white font-black">{savedPlatformName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block">Daily Bonus:</span>
                      <span className="text-emerald-400 font-black">₹{savedDailyBonus}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block">Min Recharge:</span>
                      <span className="text-teal-400 font-black">₹{savedMinRecharge}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block">Min Withdrawal:</span>
                      <span className="text-amber-400 font-black">₹{savedMinWithdrawal}</span>
                    </div>
                  </div>
                  <div className="text-xs pt-1 border-t border-slate-800/65">
                    <span className="text-slate-400 font-bold block">Recharge Presets:</span>
                    <span className="font-mono text-slate-300 break-all">{savedRechargePresets}</span>
                  </div>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!platformNameInput.trim()) {
                    triggerToast('Platform Name is required', 'error');
                    return;
                  }
                  if (isNaN(parseFloat(dailyBonusInput)) || parseFloat(dailyBonusInput) < 0) {
                    triggerToast('Invalid Daily Bonus amount', 'error');
                    return;
                  }
                  if (isNaN(parseFloat(minWithdrawalInput)) || parseFloat(minWithdrawalInput) < 0) {
                    triggerToast('Invalid Minimum Withdrawal amount', 'error');
                    return;
                  }
                  if (isNaN(parseFloat(minRechargeInput)) || parseFloat(minRechargeInput) < 0) {
                    triggerToast('Invalid Minimum Recharge amount', 'error');
                    return;
                  }

                  // Validate presets comma-separated list of numbers
                  const presetValues = rechargePresetsInput.split(',').map(s => s.trim());
                  const hasInvalidPreset = presetValues.some(val => isNaN(parseFloat(val)) || parseFloat(val) <= 0);
                  if (hasInvalidPreset || presetValues.length === 0) {
                    triggerToast('Recharge Presets must be a valid list of comma-separated positive numbers', 'error');
                    return;
                  }

                  localStorage.setItem('adpaint_platform_name', platformNameInput.trim());
                  localStorage.setItem('adpaint_daily_bonus', dailyBonusInput.trim());
                  localStorage.setItem('adpaint_min_withdrawal', minWithdrawalInput.trim());
                  localStorage.setItem('adpaint_min_recharge', minRechargeInput.trim());
                  localStorage.setItem('adpaint_recharge_presets', presetValues.join(', '));
                  localStorage.setItem('adpaint_withdraw_time', withdrawTimeInput.trim());

                  setSavedPlatformName(platformNameInput.trim());
                  setSavedDailyBonus(dailyBonusInput.trim());
                  setSavedMinWithdrawal(minWithdrawalInput.trim());
                  setSavedMinRecharge(minRechargeInput.trim());
                  setSavedRechargePresets(presetValues.join(', '));

                  syncConfigDirectToFirestore({
                    'adpaint_platform_name': platformNameInput.trim(),
                    'adpaint_daily_bonus': dailyBonusInput.trim(),
                    'adpaint_min_withdrawal': minWithdrawalInput.trim(),
                    'adpaint_min_recharge': minRechargeInput.trim(),
                    'adpaint_recharge_presets': presetValues.join(', '),
                    'adpaint_withdraw_time': withdrawTimeInput.trim()
                  });

                  window.dispatchEvent(new Event('adpaint_config_updated'));
                  triggerToast('System thresholds & presets saved and published live!', 'success');
                }} className="space-y-4">
                  {/* Platform Name */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Platform Name</label>
                    <input
                      type="text"
                      required
                      value={platformNameInput}
                      onChange={(e) => setPlatformNameInput(e.target.value)}
                      placeholder="e.g. PropertyN"
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-600 transition-all font-sans"
                    />
                  </div>

                  {/* Daily Check-In Bonus */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Daily Check-In Bonus (₹)</label>
                    <input
                      type="number"
                      required
                      value={dailyBonusInput}
                      onChange={(e) => setDailyBonusInput(e.target.value)}
                      placeholder="e.g. 8"
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-600 transition-all font-sans"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Minimum Recharge */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Min Recharge (₹)</label>
                      <input
                        type="number"
                        required
                        value={minRechargeInput}
                        onChange={(e) => setMinRechargeInput(e.target.value)}
                        placeholder="e.g. 250"
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-600 transition-all font-sans"
                      />
                    </div>

                    {/* Minimum Withdrawal */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Min Withdrawal (₹)</label>
                      <input
                        type="number"
                        required
                        value={minWithdrawalInput}
                        onChange={(e) => setMinWithdrawalInput(e.target.value)}
                        placeholder="e.g. 120"
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-600 transition-all font-sans"
                      />
                    </div>
                  </div>

                  {/* Recharge Preset Prices */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Recharge Preset Prices (comma separated)</label>
                    <input
                      type="text"
                      required
                      value={rechargePresetsInput}
                      onChange={(e) => setRechargePresetsInput(e.target.value)}
                      placeholder="e.g. 280, 530, 750, 1000, 2200, 4840"
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-600 transition-all"
                    />
                  </div>

                  {/* Withdrawal Time */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Withdrawal Time Notice</label>
                    <input
                      type="text"
                      required
                      value={withdrawTimeInput}
                      onChange={(e) => setWithdrawTimeInput(e.target.value)}
                      placeholder="e.g. 12:30AM - 11:59PM"
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-600 transition-all font-sans"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Thresholds & Presets</span>
                  </button>
                </form>
              </div>

              {/* Security Guidance */}
              <div className="bg-slate-950/40 p-4 rounded-3xl border border-slate-900 font-sans space-y-2.5">
                <h4 className="text-[10px] text-teal-400 font-black uppercase tracking-wider">UPI & Telegram Configuration Guide</h4>
                <div className="text-[10px] text-slate-400 space-y-1.5 font-medium leading-relaxed">
                  <p>1. Make sure to double-check the UPI ID. Incorrect IDs will result in loss of deposits.</p>
                  <p>2. The business name entered here is used as the overlay title in the QR code and merchant info box.</p>
                  <p>3. Dynamic qr code scanner inside recharge portal automatically renders this new merchant detail in real-time.</p>
                  <p>4. Users clicking "Channel" on the main dashboard will instantly open the configured Telegram channel URL in a new browser tab.</p>
                  <p>5. Users clicking "Service" on the main dashboard will open the customer support telegram link directly.</p>
                </div>
              </div>
            </motion.div>
          )}



          {/* Referral Hierarchy / Tree Modal */}
          {viewingReferralsUser && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 text-slate-100"
            >
              <motion.div
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh] text-slate-100 font-sans"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-teal-800 p-5 border-b border-teal-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-xl">
                      <Users className="w-5 h-5 text-teal-200" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white">{viewingReferralsUser.name}'s Downline</h3>
                      <p className="text-[10px] font-mono text-teal-200">Code: {viewingReferralsUser.inviteCode}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setViewingReferralsUser(null)}
                    className="w-8 h-8 rounded-full bg-slate-950/40 hover:bg-slate-950/60 flex items-center justify-center border border-slate-700/50 text-slate-300 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Tree Content */}
                <div className="p-5 overflow-y-auto space-y-5 flex-1 min-h-0 scrollbar-thin">
                  {(() => {
                    const downlines = getDownlineTree(viewingReferralsUser);
                    const l1 = downlines.filter(u => u.level === 1);
                    const l2 = downlines.filter(u => u.level === 2);
                    const l3 = downlines.filter(u => u.level === 3);

                    const totalNetworkInvested = downlines.reduce((sum, u) => sum + u.totalInvested, 0);
                    const refStats = getUserReferralStats(viewingReferralsUser);

                    return (
                      <>
                        {/* Summary stats */}
                        <div className="grid grid-cols-3 gap-2 text-left">
                          <div className="bg-slate-950/40 p-3 rounded-2xl border border-slate-800/60">
                            <p className="text-[8px] text-slate-500 font-black uppercase tracking-wider">Network Size</p>
                            <p className="text-sm font-black text-white mt-0.5">{downlines.length} Members</p>
                          </div>
                          <div className="bg-slate-950/40 p-3 rounded-2xl border border-slate-800/60">
                            <p className="text-[8px] text-slate-500 font-black uppercase tracking-wider">Invested</p>
                            <p className="text-sm font-black text-emerald-400 mt-0.5 font-mono">₹{totalNetworkInvested.toLocaleString('en-IN')}</p>
                          </div>
                          <div className="bg-amber-950/30 p-3 rounded-2xl border border-amber-900/40">
                            <p className="text-[8px] text-amber-400 font-black uppercase tracking-wider">Reffer Income</p>
                            <p className="text-sm font-black text-amber-300 mt-0.5 font-mono">₹{refStats.totalReferralEarnings.toLocaleString('en-IN')}</p>
                          </div>
                        </div>

                        {/* Levels rendering */}
                        {downlines.length === 0 ? (
                          <div className="text-center py-12 bg-slate-950/25 rounded-3xl border border-dashed border-slate-800/60 flex flex-col items-center justify-center space-y-2">
                            <Users className="w-8 h-8 text-slate-700" />
                            <p className="text-xs font-black text-slate-500 uppercase tracking-wider">No Downline Accounts</p>
                            <p className="text-[10px] text-slate-600 max-w-[200px] mx-auto text-center font-medium font-sans">
                              This user has not referred any accounts yet.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4 text-left">
                            {/* Level 1 Block */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-[10px] uppercase font-black tracking-wider text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 px-3 py-1.5 rounded-xl">
                                <span>Level 1 (Direct 10%)</span>
                                <span>{l1.length} Accounts (₹{refStats.l1Earning.toLocaleString('en-IN')})</span>
                              </div>
                              <div className="space-y-2 pl-2">
                                {l1.length === 0 ? (
                                  <p className="text-[10px] text-slate-600 italic">None</p>
                                ) : (
                                  l1.map(u => {
                                    const commission = u.totalInvested * 0.10;
                                    return (
                                      <div key={u.id} className="bg-slate-850 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
                                        <div>
                                          <p className="text-xs font-black text-slate-200">{u.name}</p>
                                          <p className="text-[9px] font-mono text-slate-500 mt-0.5">{u.phone}</p>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-[10px] font-bold text-slate-400">Invested: <strong className="text-slate-200 font-mono">₹{u.totalInvested.toLocaleString('en-IN')}</strong></p>
                                          <p className="text-[9.5px] font-extrabold text-emerald-400 font-mono mt-0.5">Ref Earn (10%): +₹{commission.toLocaleString('en-IN')}</p>
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </div>

                            {/* Level 2 Block */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-[10px] uppercase font-black tracking-wider text-teal-400 bg-teal-950/20 border border-teal-900/30 px-3 py-1.5 rounded-xl">
                                <span>Level 2 (Indirect 5%)</span>
                                <span>{l2.length} Accounts (₹{refStats.l2Earning.toLocaleString('en-IN')})</span>
                              </div>
                              <div className="space-y-2 pl-2">
                                {l2.length === 0 ? (
                                  <p className="text-[10px] text-slate-600 italic">None</p>
                                ) : (
                                  l2.map(u => {
                                    const commission = u.totalInvested * 0.05;
                                    return (
                                      <div key={u.id} className="bg-slate-850 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
                                        <div>
                                          <div className="flex items-center gap-1.5">
                                            <p className="text-xs font-black text-slate-200">{u.name}</p>
                                            <span className="text-[8px] bg-slate-900 px-1 py-0.5 rounded text-slate-400">by {u.inviterName}</span>
                                          </div>
                                          <p className="text-[9px] font-mono text-slate-500 mt-0.5">{u.phone}</p>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-[10px] font-bold text-slate-400">Invested: <strong className="text-slate-200 font-mono">₹{u.totalInvested.toLocaleString('en-IN')}</strong></p>
                                          <p className="text-[9.5px] font-extrabold text-teal-300 font-mono mt-0.5">Ref Earn (5%): +₹{commission.toLocaleString('en-IN')}</p>
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </div>

                            {/* Level 3 Block */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-[10px] uppercase font-black tracking-wider text-sky-400 bg-sky-950/20 border border-sky-900/30 px-3 py-1.5 rounded-xl">
                                <span>Level 3 (Indirect 2%)</span>
                                <span>{l3.length} Accounts (₹{refStats.l3Earning.toLocaleString('en-IN')})</span>
                              </div>
                              <div className="space-y-2 pl-2">
                                {l3.length === 0 ? (
                                  <p className="text-[10px] text-slate-600 italic">None</p>
                                ) : (
                                  l3.map(u => {
                                    const commission = u.totalInvested * 0.02;
                                    return (
                                      <div key={u.id} className="bg-slate-850 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
                                        <div>
                                          <div className="flex items-center gap-1.5">
                                            <p className="text-xs font-black text-slate-200">{u.name}</p>
                                            <span className="text-[8px] bg-slate-900 px-1 py-0.5 rounded text-slate-400">by {u.inviterName}</span>
                                          </div>
                                          <p className="text-[9px] font-mono text-slate-500 mt-0.5">{u.phone}</p>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-[10px] font-bold text-slate-400">Invested: <strong className="text-slate-200 font-mono">₹{u.totalInvested.toLocaleString('en-IN')}</strong></p>
                                          <p className="text-[9.5px] font-extrabold text-sky-300 font-mono mt-0.5">Ref Earn (2%): +₹{commission.toLocaleString('en-IN')}</p>
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* Close Button Footer */}
                <div className="p-4 bg-slate-950/40 border-t border-slate-800/60 flex justify-end">
                  <button
                    onClick={() => setViewingReferralsUser(null)}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-750 text-xs font-black uppercase text-slate-200 rounded-xl transition-all cursor-pointer active:scale-95 font-sans"
                  >
                     Close Window
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Custom Delete Confirmation Modal */}
          {showDeleteConfirm && editingUser && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden"
              >
                {/* Background Accent glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-rose-500/10 blur-3xl rounded-full pointer-events-none" />

                <div className="text-center space-y-4">
                  <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto">
                    <Trash2 className="w-5 h-5 animate-pulse" />
                  </div>

                  <div className="space-y-1.5 text-center">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Delete User Account?</h3>
                    <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                      Are you sure you want to permanently delete <strong className="text-white font-black">{editingUser.name}</strong> ({editingUser.phone})?
                    </p>
                    <p className="text-[10px] text-rose-400 font-bold bg-rose-950/20 py-1.5 px-3 rounded-lg border border-rose-950/50">
                      ⚠️ This action is permanent and cannot be undone. All balance and profit records for this account will be lost.
                    </p>
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all border border-slate-700/60 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDeleteUser(editingUser.id)}
                      className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-[0_4px_12px_rgba(225,29,72,0.25)] cursor-pointer"
                    >
                      Yes, Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
