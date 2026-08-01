/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home, Users, Gift, User, ShieldCheck, RefreshCw, Eye, EyeOff, Lock, Phone, UserCheck,
  Smartphone, Sparkles, X, CheckCircle2, TrendingUp, AlertTriangle, MessageSquare, Landmark, HelpCircle,
  Check, ShoppingBag
} from 'lucide-react';

import { UserProfile, InvestmentPlan, PurchaseRecord, TransactionRecord, TeamMember, BankAccount } from './types';
import { INITIAL_PLANS, MOCK_TEAM_MEMBERS, INITIAL_TRANSACTIONS, GENERATE_RANDOM_LIVE_NOTIF } from './data';

import HomeSection from './components/HomeSection';
import InviteSection from './components/InviteSection';
import TeamSection from './components/TeamSection';
import ProfileSection from './components/ProfileSection';
import AdminSection from './components/AdminSection';
import OrdersSection from './components/OrdersSection';
import { AuthPortal } from './components/AuthPortal';

import RechargeModal from './components/RechargeModal';
import WithdrawModal from './components/WithdrawModal';
import SupportModal from './components/SupportModal';
import PurchaseModal from './components/PurchaseModal';
import WelcomeNoticeModal from './components/WelcomeNoticeModal';
import DownloadAppModal from './components/DownloadAppModal';
import { SlidingAppDownloadBanner } from './components/SlidingAppDownloadBanner';
import SupportAgentAvatar from './components/SupportAgentAvatar';
import { formatTelegramUrl, openTelegramUrl } from './lib/telegram';

import {
  firestoreCheckPhone,
  firestoreLogin,
  firestoreRegister,
  firestoreResetPassword,
  firestoreGetState,
  firestoreSaveState,
  getStoredPurchases,
  cleanUndefined,
  isQuotaExceeded,
  markQuotaExceeded
} from './lib/db';
import { db } from './lib/firebase';
import { doc, setDoc, onSnapshot, collection } from 'firebase/firestore';
import { firebaseService } from './firebase/config';

export default function App() {
  // Navigation & Authentication states
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [authTab, setAuthTab] = useState<'login' | 'register' | 'forgot'>('login');
  const [activeTab, setActiveTab] = useState<'home' | 'invite' | 'orders' | 'team' | 'profile'>('home');

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to top of the inner container whenever the activeTab, authTab, or login status changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab, authTab, isLoggedIn]);

  // Input states for Auth
  const [fullName, setFullName] = useState<string>('');
  const [mobileNumber, setMobileNumber] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [captchaInput, setCaptchaInput] = useState<string>('');
  const [captchaCode, setCaptchaCode] = useState<string>(() => Math.floor(1000 + Math.random() * 9000).toString());
  const [invitationCode, setInvitationCode] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');

  // Forgot Password flow states
  const [forgotStep, setForgotStep] = useState<number>(1);
  const [forgotPhone, setForgotPhone] = useState<string>('');
  const [forgotOtpCode, setForgotOtpCode] = useState<string>('');
  const [forgotOtpInput, setForgotOtpInput] = useState<string>('');
  const [forgotNewPassword, setForgotNewPassword] = useState<string>('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState<boolean>(false);

  // Primary Domain states (persisted in localStorage)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const storedUser = localStorage.getItem('adpaint_user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });
  const [plans, setPlans] = useState<InvestmentPlan[]>(() => {
    try {
      const storedPlans = localStorage.getItem('adpaint_plans');
      if (storedPlans) {
        const parsedPlans = JSON.parse(storedPlans);
        if (Array.isArray(parsedPlans) && parsedPlans.length > 0) {
          return parsedPlans;
        }
      }
    } catch {}
    return INITIAL_PLANS;
  });
  const [purchases, setPurchases] = useState<PurchaseRecord[]>(() => {
    try {
      const storedUser = localStorage.getItem('adpaint_user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        return getStoredPurchases(parsedUser.id);
      }
      const storedPurchases = localStorage.getItem('adpaint_purchases');
      return storedPurchases ? JSON.parse(storedPurchases) : [];
    } catch {
      return [];
    }
  });
  const [transactions, setTransactions] = useState<TransactionRecord[]>(() => {
    try {
      const storedTransactions = localStorage.getItem('adpaint_transactions');
      return storedTransactions ? JSON.parse(storedTransactions) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>(() => {
    try {
      const storedUsersList = localStorage.getItem('adpaint_users_list');
      return storedUsersList ? JSON.parse(storedUsersList) : [];
    } catch {
      return [];
    }
  });
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Keep references to state values up-to-date to avoid stale closures in setInterval background sync callbacks
  const plansRef = React.useRef<InvestmentPlan[]>(plans);
  const transactionsRef = React.useRef<TransactionRecord[]>(transactions);
  const usersListRef = React.useRef<UserProfile[]>(usersList);
  const purchasesRef = React.useRef<PurchaseRecord[]>(purchases);
  const userProfileRef = React.useRef<UserProfile | null>(userProfile);
  const pushTimeoutRef = React.useRef<any>(null);
  const lastLocalUpdateRef = React.useRef<number>(0);

  plansRef.current = plans;
  transactionsRef.current = transactions;
  usersListRef.current = usersList;
  purchasesRef.current = purchases;
  userProfileRef.current = userProfile;

  // Modals state
  const [isRechargeOpen, setIsRechargeOpen] = useState<boolean>(false);
  const [rechargePrefillAmount, setRechargePrefillAmount] = useState<number | undefined>(undefined);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState<boolean>(false);
  const [isServiceOpen, setIsServiceOpen] = useState<boolean>(false);
  const [isPurchaseOpen, setIsPurchaseOpen] = useState<boolean>(false);
  const [isWelcomeNoticeOpen, setIsWelcomeNoticeOpen] = useState<boolean>(false);
  const [isDownloadAppOpen, setIsDownloadAppOpen] = useState<boolean>(false);
  const [selectedPurchasePlan, setSelectedPurchasePlan] = useState<InvestmentPlan | null>(null);

  // Notifications system state
  const [liveNotif, setLiveNotif] = useState<string>('');
  const [customToast, setCustomToast] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // OTP Verification & Session Expiry states
  const [isVerifyingRegisterOtp, setIsVerifyingRegisterOtp] = useState<boolean>(false);
  const [registerOtpCode, setRegisterOtpCode] = useState<string>('');
  const [registerOtpInput, setRegisterOtpInput] = useState<string>('');
  const [pendingNewUser, setPendingNewUser] = useState<UserProfile | null>(null);
  const [lastActivity, setLastActivity] = useState<number>(() => Date.now());

  // Helper to ensure check-in status resets if a new calendar day has started
  const sanitizeUserCheckIn = (user: UserProfile | null): UserProfile | null => {
    if (!user) return null;
    const todayStr = new Date().toDateString();
    const isCheckedIn = user.lastCheckInDate === todayStr && user.checkedInToday === true;
    if (user.checkedInToday !== isCheckedIn) {
      return {
        ...user,
        checkedInToday: isCheckedIn
      };
    }
    return user;
  };

  // Generate dynamic captcha code
  const generateCaptcha = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setCaptchaCode(code);
  };

  // Initialize and load from local storage
  useEffect(() => {

    const storedUser = localStorage.getItem('adpaint_user');
    const storedPlans = localStorage.getItem('adpaint_plans');
    const storedPurchases = localStorage.getItem('adpaint_purchases');
    const storedTransactions = localStorage.getItem('adpaint_transactions');
    const storedTeam = localStorage.getItem('adpaint_team');
    const storedUsersList = localStorage.getItem('adpaint_users_list');

    let loadedUsersList: UserProfile[] = [];
    if (storedUsersList) {
      loadedUsersList = JSON.parse(storedUsersList);
    } else {
      loadedUsersList = [
        {
          id: 'usr_demo',
          name: 'Ajay Kumar',
          phone: '+91 9876543210',
          balance: 1540,
          totalEarnings: 3250,
          dailyEarned: 420,
          checkedInToday: false,
          inviteCode: '47523',
          role: 'user',
          password: 'password123',
          bankAccount: {
            bankName: 'State Bank of India',
            accountHolder: 'Ajay Kumar',
            accountNumber: '304592018422',
            ifscCode: 'SBIN0004523'
          }
        },
        {
          id: 'usr_sandeep',
          name: 'Sandeep Kumar',
          phone: '+91 9870014120',
          balance: 850,
          totalEarnings: 1500,
          dailyEarned: 103,
          checkedInToday: false,
          inviteCode: '10385',
          role: 'user',
          password: 'password123'
        }
      ];
    }

    // Ensure there's an admin user in loadedUsersList
    const hasAdmin = loadedUsersList.some(u => u.role === 'admin' || u.phone === '+91 9999999999');
    if (!hasAdmin) {
      loadedUsersList.push({
        id: 'usr_admin',
        name: 'System Admin',
        phone: '+91 9999999999',
        balance: 100000,
        totalEarnings: 100000,
        dailyEarned: 0,
        checkedInToday: false,
        inviteCode: '88888',
        role: 'admin',
        password: 'admin123'
      });
    }

    // Ensure all users have roles & passwords
    loadedUsersList = loadedUsersList.map(u => {
      if (!u.role) {
        u.role = u.phone === '+91 9999999999' ? 'admin' : 'user';
      }
      if (!u.password) {
        u.password = 'password123';
      }
      return u;
    });

    localStorage.setItem('adpaint_users_list', JSON.stringify(loadedUsersList));
    setUsersList(loadedUsersList);

    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const hasReferralCode = params ? (params.has('code') || params.has('ref') || params.has('invite')) : false;
    const isRegisterPath = typeof window !== 'undefined' ? window.location.pathname.toLowerCase().includes('register') : false;
    const skipAutoLogin = hasReferralCode || isRegisterPath;

    if (storedUser && !skipAutoLogin) {
      const parsedUser = JSON.parse(storedUser);
      const latestFromList = loadedUsersList.find(u => u.id === parsedUser.id);
      const rawUser = parsedUser ? {
        ...latestFromList,
        ...parsedUser,
        balance: Math.max(parsedUser.balance ?? 0, latestFromList?.balance ?? 0),
        totalEarnings: Math.max(parsedUser.totalEarnings ?? 0, latestFromList?.totalEarnings ?? 0)
      } : (latestFromList || parsedUser);
      const finalUser = sanitizeUserCheckIn(rawUser)!;
      setUserProfile(finalUser);
      localStorage.setItem('adpaint_user', JSON.stringify(finalUser));

      // Ensure loadedUsersList contains updated finalUser
      loadedUsersList = loadedUsersList.map(u => u.id === finalUser.id ? finalUser : u);
      if (!loadedUsersList.some(u => u.id === finalUser.id)) {
        loadedUsersList.push(finalUser);
      }
      localStorage.setItem('adpaint_users_list', JSON.stringify(loadedUsersList));
      setUsersList(loadedUsersList);
      setIsLoggedIn(true);
      if (finalUser.role !== 'admin' && !localStorage.getItem(`adpaint_notice_shown_${finalUser.id}`)) {
        setIsWelcomeNoticeOpen(true);
        localStorage.setItem(`adpaint_notice_shown_${finalUser.id}`, 'true');
      }

      // Load user-specific purchases on startup
      const userPurchases = getStoredPurchases(finalUser.id);
      setPurchases(userPurchases);
    } else {
      setPurchases([]);
    }
    let loadedPlans = INITIAL_PLANS;
    if (storedPlans) {
      try {
        const parsedPlans = JSON.parse(storedPlans);
        if (Array.isArray(parsedPlans) && parsedPlans.length > 0) {
          loadedPlans = parsedPlans;
        }
      } catch (e) {
        console.warn("Failed to parse stored plans", e);
      }
    } else {
      localStorage.setItem('adpaint_plans', JSON.stringify(INITIAL_PLANS));
    }
    setPlans(loadedPlans);
    
    if (storedTransactions) {
      setTransactions(JSON.parse(storedTransactions));
    } else {
      setTransactions(INITIAL_TRANSACTIONS);
      localStorage.setItem('adpaint_transactions', JSON.stringify(INITIAL_TRANSACTIONS));
    }
    if (storedTeam) setTeamMembers(JSON.parse(storedTeam));

    // Live Notification simulation - prioritizes custom admin banners
    const customTicker = localStorage.getItem('adpaint_custom_ticker');
    if (customTicker) {
      setLiveNotif(customTicker);
    } else {
      setLiveNotif(GENERATE_RANDOM_LIVE_NOTIF());
    }

    const notifTimer = setInterval(() => {
      const currentCustomTicker = localStorage.getItem('adpaint_custom_ticker');
      if (currentCustomTicker) {
        setLiveNotif(currentCustomTicker);
      } else {
        setLiveNotif(GENERATE_RANDOM_LIVE_NOTIF());
      }
    }, 9000);

    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        triggerToast(customEvent.detail.text, customEvent.detail.type);
      }
    };
    window.addEventListener('app-toast', handleToastEvent);

    return () => {
      clearInterval(notifTimer);
      window.removeEventListener('app-toast', handleToastEvent);
    };
  }, []);

  // Handle referral links (e.g. ?code=12345 or /register?code=12345)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code') || params.get('ref') || params.get('invite');
      const isRegisterPath = window.location.pathname.toLowerCase().includes('register');

      let finalCode = '';
      const hasReferralInUrl = !!code;
      if (code) {
        finalCode = code.replace(/\D/g, '');
        if (finalCode) {
          localStorage.setItem('adpaint_pending_invite_code', finalCode);
        }
      } else {
        const savedCode = localStorage.getItem('adpaint_pending_invite_code');
        if (savedCode) {
          finalCode = savedCode;
        }
      }

      if (finalCode) {
        setInvitationCode(finalCode);
        if (hasReferralInUrl) {
          // Force logout / clear session of previous user to open registration page cleanly
          localStorage.removeItem('adpaint_user');
          setUserProfile(null);
          setPurchases([]);
          setIsLoggedIn(false);
          setAuthTab('register');
          setTimeout(() => {
            triggerToast(`Referral Code ${finalCode} applied successfully!`, 'success');
          }, 800);
        } else {
          const storedUser = localStorage.getItem('adpaint_user');
          if (!storedUser) {
            setAuthTab('register');
          }
        }
      } else if (isRegisterPath) {
        const storedUser = localStorage.getItem('adpaint_user');
        if (!storedUser) {
          setAuthTab('register');
        }
      }
    }
  }, []);

  // API: Synchronize current memory states with full stack server database (real-time sync)
  const syncWithServer = async (
    currentUser: UserProfile | null = userProfileRef.current,
    force: boolean = false
  ) => {
    if (force) {
      lastLocalUpdateRef.current = 0; // Force sync resets local debounce timer so server state takes precedence immediately
    }
    // If quota exceeded or local state updated recently, defer syncing unless forced
    if (!force && isQuotaExceeded()) {
      return;
    }
    if (!force && Date.now() - lastLocalUpdateRef.current < 6000) {
      console.log("Deferring syncWithServer to allow pending pushStateToServer to complete...");
      return;
    }
    try {
      const activeUser = currentUser || userProfileRef.current;
      const userId = activeUser ? activeUser.id : '';
      
      const data = await firestoreGetState(userId);
      if (data) {
        const currentPlans = plansRef.current;
        const currentPurchases = purchasesRef.current;
        const currentTransactions = transactionsRef.current;
        const currentUsersList = usersListRef.current;

        // 1. Sync plans (Admin changes source of truth)
        let plansUpdated = false;
        let finalPlans = currentPlans;
        if (data.plans && data.plans.length > 0) {
          const isDifferent = JSON.stringify(data.plans) !== JSON.stringify(currentPlans);
          if (isDifferent) {
            setPlans(data.plans);
            localStorage.setItem('adpaint_plans', JSON.stringify(data.plans));
            finalPlans = data.plans;
          }
        } else if (currentPlans && currentPlans.length > 0) {
          // Server plans are empty but we have custom/saved plans locally! Restore them.
          plansUpdated = true;
        }

        // 2. Sync global users list (Server's authoritative state takes precedence)
        let mergedUsers = currentUsersList;
        let usersUpdated = false;
        if (data.usersList && data.usersList.length > 0) {
          const serverUserMap = new Map<string, any>();
          const phoneToUserMap = new Map<string, any>();
          let hasMissingUser = false;

          // Index server users and map by last 10 digits
          data.usersList.forEach((u: any) => {
            if (!u || !u.id) return;
            serverUserMap.set(u.id, u);
            const rawP = u.phone ? u.phone.replace(/\D/g, '') : '';
            const last10 = rawP.length >= 10 ? rawP.slice(-10) : rawP;
            if (last10) phoneToUserMap.set(last10, u);
          });

          // If forced (e.g. Admin fetch/sync), server users strictly override local cache
          if (!force) {
            currentUsersList.forEach((localUser: any) => {
              if (!localUser || !localUser.id) return;
              const localRawP = localUser.phone ? localUser.phone.replace(/\D/g, '') : '';
              const localLast10 = localRawP.length >= 10 ? localRawP.slice(-10) : localRawP;
              const existingServerUser = serverUserMap.get(localUser.id) || (localLast10 ? phoneToUserMap.get(localLast10) : null);

              if (existingServerUser) {
                let updatedField = false;
                // Preserve highest local balance and totalEarnings to prevent stale server data from reverting user claims
                const mergedObj = {
                  ...existingServerUser,
                  ...localUser,
                  balance: Math.max(localUser.balance ?? 0, existingServerUser.balance ?? 0),
                  totalEarnings: Math.max(localUser.totalEarnings ?? 0, existingServerUser.totalEarnings ?? 0)
                };

                // Validate and deep-merge inviterCode if local has it but server is empty
                if (!mergedObj.inviterCode && localUser.inviterCode) {
                  mergedObj.inviterCode = localUser.inviterCode;
                  updatedField = true;
                }
                // Deep-merge bank details if local has it but server is empty
                if (!mergedObj.bankAccount && localUser.bankAccount) {
                  mergedObj.bankAccount = localUser.bankAccount;
                  updatedField = true;
                }
                // Preserve password if missing on server
                if (!mergedObj.password && localUser.password) {
                  mergedObj.password = localUser.password;
                  updatedField = true;
                }

                serverUserMap.set(mergedObj.id, mergedObj);

                if (updatedField && !isQuotaExceeded()) {
                  setDoc(doc(db, "users", mergedObj.id), cleanUndefined(mergedObj)).catch(markQuotaExceeded);
                }
              } else {
                // Local user not on server yet — preserve and push to Firestore
                serverUserMap.set(localUser.id, localUser);
                if (!isQuotaExceeded()) {
                  setDoc(doc(db, "users", localUser.id), cleanUndefined(localUser)).catch(markQuotaExceeded);
                }
              }
            });
          }

          mergedUsers = Array.from(serverUserMap.values());
          
          const isDifferent = JSON.stringify(mergedUsers) !== JSON.stringify(currentUsersList);
          if (isDifferent || force) {
            setUsersList(mergedUsers);
            localStorage.setItem('adpaint_users_list', JSON.stringify(mergedUsers));
            usersListRef.current = mergedUsers;
          }
          
          if (activeUser) {
            const activeUserPhone = activeUser.phone ? activeUser.phone.replace(/\D/g, '') : '';
            const activeLast10 = activeUserPhone.length >= 10 ? activeUserPhone.slice(-10) : activeUserPhone;

            const latestMe = mergedUsers.find((u: any) => {
              if (u.id === activeUser.id) return true;
              if (activeLast10) {
                const uPhoneDigits = u.phone ? u.phone.replace(/\D/g, '') : '';
                const uLast10 = uPhoneDigits.length >= 10 ? uPhoneDigits.slice(-10) : uPhoneDigits;
                if (uLast10 && uLast10 === activeLast10) return true;
              }
              return false;
            });

            if (latestMe) {
              const sanitizedMe = sanitizeUserCheckIn(latestMe)!;
              const currentLocal = userProfileRef.current || activeUser;
              const finalMe = {
                ...sanitizedMe,
                balance: Math.max(sanitizedMe.balance ?? 0, currentLocal?.balance ?? 0),
                totalEarnings: Math.max(sanitizedMe.totalEarnings ?? 0, currentLocal?.totalEarnings ?? 0)
              };
              if (JSON.stringify(finalMe) !== JSON.stringify(activeUser)) {
                setUserProfile(finalMe);
                localStorage.setItem('adpaint_user', JSON.stringify(finalMe));
                userProfileRef.current = finalMe;
              }
            }
          }
          
          if (hasMissingUser) {
            usersUpdated = true;
          }
        } else if (currentUsersList && currentUsersList.length > 0) {
          usersUpdated = true;
        }

        // 3. Sync global transactions (approval updates, deposits)
        let mergedTx = currentTransactions;
        let txUpdated = false;
        if (data.transactions && data.transactions.length > 0) {
          const serverTxMap = new Map(data.transactions.map((t: any) => [t.id, t]));
          let hasMissingTx = false;
          
          currentTransactions.forEach((localTx: any) => {
            if (!serverTxMap.has(localTx.id)) {
              serverTxMap.set(localTx.id, localTx);
              hasMissingTx = true;
            }
          });
          
          mergedTx = Array.from(serverTxMap.values());
          
          const isDifferent = JSON.stringify(mergedTx) !== JSON.stringify(currentTransactions);
          if (isDifferent) {
            setTransactions(mergedTx);
            localStorage.setItem('adpaint_transactions', JSON.stringify(mergedTx));
          }
          
          if (hasMissingTx) {
            txUpdated = true;
          }
        } else if (currentTransactions && currentTransactions.length > 0) {
          txUpdated = true;
        }

        // 5. Sync custom configurations (UPI IDs, Support Links)
        let configMismatch = false;
        const keysToSync = [
          'adpaint_upi_id', 'adpaint_upi_name', 'adpaint_tg_channel', 'adpaint_tg_support',
          'adpaint_apk_url', 'adpaint_platform_name', 'adpaint_daily_bonus',
          'adpaint_min_withdrawal', 'adpaint_min_recharge', 'adpaint_recharge_presets',
          'adpaint_withdraw_time', 'adpaint_cashier_url', 'adpaint_support_avatar'
        ];

        const serverConfig = data.config || {};
        keysToSync.forEach(key => {
          const serverVal = serverConfig[key];
          const localVal = localStorage.getItem(key);
          
          if (serverVal) {
            if (localVal !== serverVal) {
              localStorage.setItem(key, serverVal);
              if (key === 'adpaint_support_avatar') {
                window.dispatchEvent(new Event('adpaint_avatar_updated'));
              }
            }
          } else if (localVal) {
            // Server is missing this configuration, but we have it locally!
            configMismatch = true;
          }
        });

        const localTicker = localStorage.getItem('adpaint_custom_ticker');
        if (localTicker && !data.customTicker) {
          configMismatch = true;
        }

        // 4. Sync current user's specific purchases list (with merge-back/restore protection)
        let purchasesUpdated = false;
        let mergedPurchases = currentPurchases;
        if (userId) {
          let deletedPurchasesList: string[] = [];
          try {
            const rawDelPur = localStorage.getItem('adpaint_deleted_purchases');
            if (rawDelPur) deletedPurchasesList = JSON.parse(rawDelPur);
          } catch (e) {}

          const serverPurchasesMap = new Map<string, PurchaseRecord>();

          if (Array.isArray(data.purchases)) {
            data.purchases.forEach((p: any) => {
              if (p && p.id && !deletedPurchasesList.includes(p.id)) {
                serverPurchasesMap.set(p.id, p);
              }
            });
          }

          let hasMissingPurchases = false;

          currentPurchases.forEach((localPurchase: any) => {
            if (deletedPurchasesList.includes(localPurchase.id)) return;
            if (!serverPurchasesMap.has(localPurchase.id)) {
              serverPurchasesMap.set(localPurchase.id, localPurchase);
              hasMissingPurchases = true;
            }
          });

          mergedPurchases = Array.from(serverPurchasesMap.values()).filter(p => !deletedPurchasesList.includes(p.id));

          const isDifferent = JSON.stringify(mergedPurchases) !== JSON.stringify(currentPurchases);
          if (isDifferent) {
            setPurchases(mergedPurchases);
            localStorage.setItem(`adpaint_purchases_${userId}`, JSON.stringify(mergedPurchases));
            localStorage.setItem(`adpaint_backup_purchases_${userId}`, JSON.stringify(mergedPurchases));
            localStorage.setItem('adpaint_purchases', JSON.stringify(mergedPurchases));
            purchasesRef.current = mergedPurchases;
          }

          if (hasMissingPurchases) {
            purchasesUpdated = true;
          }
        } else if (currentPurchases && currentPurchases.length > 0) {
          purchasesUpdated = true;
        }

        // If any local state was missing on the server, push the fully merged states back to restore them!
        if (plansUpdated || usersUpdated || txUpdated || configMismatch || purchasesUpdated) {
          pushStateToServer(activeUser, finalPlans, mergedPurchases, mergedTx, mergedUsers);
        }

        // 6. Sync live news banner alert
        if (data.customTicker) {
          const localTickerStr = localStorage.getItem('adpaint_custom_ticker');
          if (localTickerStr !== data.customTicker) {
            localStorage.setItem('adpaint_custom_ticker', data.customTicker);
            setLiveNotif(data.customTicker);
          }
        }
      }
    } catch (e) {
      console.warn("Real-time sync error (fallback to local state active):", e);
    }
  };

  // API: Post and merge state updates to the server database
  const pushStateToServer = (
    user: UserProfile | null = userProfileRef.current,
    currentPlans?: InvestmentPlan[],
    currentPurchases?: PurchaseRecord[],
    currentTransactions?: TransactionRecord[],
    currentUsersList?: UserProfile[]
  ) => {
    if (pushTimeoutRef.current) {
      clearTimeout(pushTimeoutRef.current);
    }

    const targetUser = user || userProfileRef.current;
    const targetPlans = currentPlans || plansRef.current;
    const rawPurchases = currentPurchases || purchasesRef.current;
    const targetTransactions = currentTransactions || transactionsRef.current;
    const targetUsersList = currentUsersList || usersListRef.current;

    pushTimeoutRef.current = setTimeout(async () => {
      try {
        const userId = targetUser ? targetUser.id : '';
        const targetPurchases = rawPurchases.map(p => {
          if (!p.userId && userId) {
            return { ...p, userId };
          }
          return p;
        });
        
        const localConfig: Record<string, string> = {};
        const keysToSync = [
          'adpaint_upi_id', 'adpaint_upi_name', 'adpaint_tg_channel', 'adpaint_tg_support',
          'adpaint_apk_url', 'adpaint_platform_name', 'adpaint_daily_bonus',
          'adpaint_min_withdrawal', 'adpaint_min_recharge', 'adpaint_recharge_presets',
          'adpaint_withdraw_time', 'adpaint_cashier_url', 'adpaint_support_avatar'
        ];
        keysToSync.forEach(key => {
          const val = localStorage.getItem(key);
          if (val) localConfig[key] = val;
        });

        const payload = {
          userId,
          usersList: targetUsersList,
          plans: targetPlans,
          transactions: targetTransactions,
          purchases: targetPurchases,
          config: localConfig,
          customTicker: localStorage.getItem('adpaint_custom_ticker')
        };

        const data = await firestoreSaveState(payload);
        if (data) {
          if (data.plans && data.plans.length > 0) {
            setPlans(data.plans);
            localStorage.setItem('adpaint_plans', JSON.stringify(data.plans));
            plansRef.current = data.plans;
          }
          if (data.usersList && data.usersList.length > 0) {
            setUsersList(data.usersList);
            localStorage.setItem('adpaint_users_list', JSON.stringify(data.usersList));
            usersListRef.current = data.usersList;
            if (targetUser) {
              const targetPhone = targetUser.phone ? targetUser.phone.replace(/\D/g, '') : '';
              const targetLast10 = targetPhone.length >= 10 ? targetPhone.slice(-10) : targetPhone;

              const latestMe = data.usersList.find((u: any) => {
                if (u.id === targetUser.id) return true;
                if (targetLast10) {
                  const uPhoneDigits = u.phone ? u.phone.replace(/\D/g, '') : '';
                  const uLast10 = uPhoneDigits.length >= 10 ? uPhoneDigits.slice(-10) : uPhoneDigits;
                  if (uLast10 && uLast10 === targetLast10) return true;
                }
                return false;
              });

              if (latestMe) {
                setUserProfile(latestMe);
                localStorage.setItem('adpaint_user', JSON.stringify(latestMe));
                userProfileRef.current = latestMe;
              }
            }
          }
          if (data.transactions) {
            setTransactions(data.transactions);
            localStorage.setItem('adpaint_transactions', JSON.stringify(data.transactions));
            transactionsRef.current = data.transactions;
          }
          if (userId && data.purchases) {
            setPurchases(data.purchases);
            localStorage.setItem(`adpaint_purchases_${userId}`, JSON.stringify(data.purchases));
            purchasesRef.current = data.purchases;
          }
        }
      } catch (e) {
        console.warn("Network transmission error (persisted locally):", e);
      } finally {
        pushTimeoutRef.current = null;
      }
    }, 100);
  };

  // Sync state to local storage when changed and push to server database
  const saveStateToStorage = (
    user: UserProfile | null,
    updatedPlans?: InvestmentPlan[],
    updatedPurchases?: PurchaseRecord[],
    updatedTx?: TransactionRecord[],
    updatedTeam?: TeamMember[]
  ) => {
    lastLocalUpdateRef.current = Date.now();
    let nextUsersList = usersList;
    if (user) {
      localStorage.setItem('adpaint_user', JSON.stringify(user));
      setUserProfile(user);

      // Sync into usersList synchronously first so we can push the correct list to the server
      const updatedList = usersList.map(u => u.id === user.id ? user : u);
      if (!updatedList.some(u => u.id === user.id)) {
        updatedList.push(user);
      }
      localStorage.setItem('adpaint_users_list', JSON.stringify(updatedList));
      setUsersList(updatedList);
      nextUsersList = updatedList;
    } else {
      localStorage.removeItem('adpaint_user');
      setUserProfile(null);
      setPurchases([]);
    }

    if (updatedPlans) {
      localStorage.setItem('adpaint_plans', JSON.stringify(updatedPlans));
      setPlans(updatedPlans);
    }
    if (updatedPurchases) {
      const userId = user ? user.id : (userProfile ? userProfile.id : '');
      const refinedPurchases = updatedPurchases.map(p => {
        if (!p.userId && userId) {
          return { ...p, userId };
        }
        return p;
      });

      let existingUserP: PurchaseRecord[] = [];
      let existingMainP: PurchaseRecord[] = [];
      try {
        if (userId) {
          existingUserP = getStoredPurchases(userId);
        }
        const rawMain = localStorage.getItem('adpaint_purchases');
        if (rawMain) existingMainP = JSON.parse(rawMain);
      } catch (e) {}

      const userMap = new Map<string, PurchaseRecord>();
      existingUserP.forEach(p => userMap.set(p.id, p));
      refinedPurchases.forEach(p => userMap.set(p.id, p));
      const finalUserPurchases = Array.from(userMap.values());

      const mainMap = new Map<string, PurchaseRecord>();
      existingMainP.forEach(p => mainMap.set(p.id, p));
      refinedPurchases.forEach(p => mainMap.set(p.id, p));
      const finalMainPurchases = Array.from(mainMap.values());

      if (userId) {
        localStorage.setItem(`adpaint_purchases_${userId}`, JSON.stringify(finalUserPurchases));
        localStorage.setItem(`adpaint_backup_purchases_${userId}`, JSON.stringify(finalUserPurchases));
      }
      localStorage.setItem('adpaint_purchases', JSON.stringify(finalMainPurchases));
      setPurchases(finalUserPurchases);
    }
    let finalTx = updatedTx;
    if (updatedTx) {
      // Ensure all transactions have phone and userId fields if matched to some user
      const activeUser = user || userProfileRef.current;
      const refinedTx = updatedTx.map(t => {
        if (!t.userId && activeUser) {
          return { ...t, userId: activeUser.id, userPhone: activeUser.phone };
        }
        return t;
      });
      localStorage.setItem('adpaint_transactions', JSON.stringify(refinedTx));
      setTransactions(refinedTx);
      finalTx = refinedTx;
    }
    if (updatedTeam) {
      localStorage.setItem('adpaint_team', JSON.stringify(updatedTeam));
      setTeamMembers(updatedTeam);
    }

    // Push the updated state asynchronously to the server to synchronize other active terminals instantly!
    // We only push to the server if we are logged in/registering (user !== null) or if plans, purchases, transactions, or team lists are updated.
    // This avoids pushing stale/corrupted states on user logout.
    if (user !== null || updatedPlans || updatedPurchases || updatedTx || updatedTeam) {
      pushStateToServer(user, updatedPlans, updatedPurchases, finalTx, nextUsersList);
    }
  };

  // Set up Firestore real-time listener for global configs & plans for instant Mobile APK & Web updates
  useEffect(() => {
    if (isQuotaExceeded()) return;
    let unsub: (() => void) | null = null;
    let unsubPlans: (() => void) | null = null;

    try {
      const configDocRef = doc(db, "global", "config");
      unsub = onSnapshot(configDocRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const serverConfig = data.config || {};
          const keysToSync = [
            'adpaint_upi_id', 'adpaint_upi_name', 'adpaint_tg_channel', 'adpaint_tg_support',
            'adpaint_apk_url', 'adpaint_platform_name', 'adpaint_daily_bonus',
            'adpaint_min_withdrawal', 'adpaint_min_recharge', 'adpaint_recharge_presets',
            'adpaint_withdraw_time', 'adpaint_cashier_url', 'adpaint_support_avatar'
          ];
          keysToSync.forEach(key => {
            const serverVal = serverConfig[key];
            if (serverVal) {
              const localVal = localStorage.getItem(key);
              if (localVal !== serverVal) {
                localStorage.setItem(key, serverVal);
                if (key === 'adpaint_support_avatar') {
                  window.dispatchEvent(new Event('adpaint_avatar_updated'));
                }
              }
            }
          });
          if (data.customTicker) {
            localStorage.setItem('adpaint_custom_ticker', data.customTicker);
          }
        }
      }, (err) => {
        console.warn("Real-time config snapshot listener notice:", err?.message || err);
        markQuotaExceeded(err);
        if (unsub) {
          unsub();
          unsub = null;
        }
      });

      // Live Plans collection listener so all browsers and users get admin updated plan prices real-time
      const plansColRef = collection(db, "plans");
      unsubPlans = onSnapshot(plansColRef, (snapshot) => {
        let rawDelP: string[] = [];
        try {
          const raw = localStorage.getItem('adpaint_deleted_plans');
          if (raw) rawDelP = JSON.parse(raw);
        } catch (e) {}

        const livePlans: InvestmentPlan[] = [];
        snapshot.forEach(docSnap => {
          const pData = docSnap.data() as InvestmentPlan;
          if (pData && pData.id && !rawDelP.includes(pData.id)) {
            livePlans.push(pData);
          }
        });

        if (livePlans.length > 0) {
          const isDiff = JSON.stringify(livePlans) !== JSON.stringify(plansRef.current);
          if (isDiff) {
            setPlans(livePlans);
            plansRef.current = livePlans;
            localStorage.setItem('adpaint_plans', JSON.stringify(livePlans));
          }
        }
      }, (err) => {
        console.warn("Real-time plans snapshot listener notice:", err?.message || err);
        markQuotaExceeded(err);
      });
    } catch (err) {
      markQuotaExceeded(err);
    }

    return () => {
      if (unsub) unsub();
      if (unsubPlans) unsubPlans();
    };
  }, []);

  // Set up Firestore real-time listener for currently logged-in user profile (Balance, Bank, Status updates)
  useEffect(() => {
    if (!isLoggedIn || !userProfile?.id || isQuotaExceeded()) return;
    let unsubUser: (() => void) | null = null;
    let unsubDeleted: (() => void) | null = null;
    let unsubPurchases: (() => void) | null = null;
    let unsubUsers: (() => void) | null = null;
    let unsubTx: (() => void) | null = null;

    try {
      // User document listener
      const userDocRef = doc(db, "users", userProfile.id);
      unsubUser = onSnapshot(userDocRef, (snapshot) => {
        if (snapshot.exists()) {
          const liveUser = snapshot.data() as UserProfile;
          if (liveUser && liveUser.id === userProfile.id) {
            const sanitized = sanitizeUserCheckIn(liveUser);
            if (sanitized) {
              const currentLocal = userProfileRef.current;
              const mergedMe = {
                ...sanitized,
                balance: Math.max(sanitized.balance ?? 0, currentLocal?.balance ?? 0),
                totalEarnings: Math.max(sanitized.totalEarnings ?? 0, currentLocal?.totalEarnings ?? 0)
              };
              if (JSON.stringify(mergedMe) !== JSON.stringify(userProfileRef.current)) {
                setUserProfile(mergedMe);
                localStorage.setItem('adpaint_user', JSON.stringify(mergedMe));
                userProfileRef.current = mergedMe;
              }
            }
          }
        }
      }, (err) => {
        console.warn("Real-time user snapshot listener notice:", err?.message || err);
        markQuotaExceeded(err);
      });

      // Deleted items listener
      const deletedDocRef = doc(db, "global", "deleted_items");
      unsubDeleted = onSnapshot(deletedDocRef, (snap) => {
        if (snap.exists()) {
          const dData = snap.data();
          let pDel: string[] = [];
          let purDel: string[] = [];
          if (Array.isArray(dData.deletedPlans)) {
            pDel = dData.deletedPlans;
            localStorage.setItem('adpaint_deleted_plans', JSON.stringify(pDel));
          }
          if (Array.isArray(dData.deletedPurchases)) {
            purDel = dData.deletedPurchases;
            localStorage.setItem('adpaint_deleted_purchases', JSON.stringify(purDel));
          }

          if (pDel.length > 0) {
            setPlans(prev => prev.filter(p => p && p.id && !pDel.includes(p.id)));
          }
          if (purDel.length > 0) {
            setPurchases(prev => prev.filter(p => p && p.id && !purDel.includes(p.id)));
          }
        }
      }, (err) => {
        markQuotaExceeded(err);
      });

      // Live Purchases listener
      const purColRef = collection(db, "purchases");
      unsubPurchases = onSnapshot(purColRef, (snap) => {
        let rawDelPur: string[] = [];
        try {
          const raw = localStorage.getItem('adpaint_deleted_purchases');
          if (raw) rawDelPur = JSON.parse(raw);
        } catch (e) {}

        const currentUserId = userProfile.id;
        const uPhoneDigits = userProfile.phone ? userProfile.phone.replace(/\D/g, "") : "";
        const uLast10 = uPhoneDigits.length >= 10 ? uPhoneDigits.slice(-10) : uPhoneDigits;

        const liveUserPurchases: PurchaseRecord[] = [];
        snap.forEach(dSnap => {
          const pData = dSnap.data() as PurchaseRecord;
          if (!pData || !pData.id || rawDelPur.includes(pData.id)) return;

          const pPhoneDigits = (pData as any).userPhone ? String((pData as any).userPhone).replace(/\D/g, "") : "";
          const isMatch = (
            pData.userId === currentUserId ||
            (pData as any).userId === currentUserId.replace('usr_', '') ||
            (uLast10 && pPhoneDigits.length >= 10 && pPhoneDigits.endsWith(uLast10)) ||
            pData.userId === userProfile.phone
          );

          if (isMatch || currentUserId === 'usr_admin') {
            const localP = purchasesRef.current.find(p => p.id === pData.id);
            const mergedP = localP ? {
              ...pData,
              ...localP,
              totalClaimed: Math.max(pData.totalClaimed ?? 0, localP.totalClaimed ?? 0),
              lastClaimedAt: (new Date(localP.lastClaimedAt || 0).getTime() > new Date(pData.lastClaimedAt || 0).getTime())
                ? localP.lastClaimedAt
                : pData.lastClaimedAt,
              completed: localP.completed || pData.completed
            } : pData;
            liveUserPurchases.push(mergedP);
          }
        });

        const isDiff = JSON.stringify(liveUserPurchases) !== JSON.stringify(purchasesRef.current);
        if (isDiff) {
          setPurchases(liveUserPurchases);
          purchasesRef.current = liveUserPurchases;
          localStorage.setItem(`adpaint_purchases_${currentUserId}`, JSON.stringify(liveUserPurchases));
          localStorage.setItem(`adpaint_backup_purchases_${currentUserId}`, JSON.stringify(liveUserPurchases));
        }
      }, (err) => {
        markQuotaExceeded(err);
      });

      // Live Users collection listener for Admin real-time panel & team updates
      const usersColRef = collection(db, "users");
      unsubUsers = onSnapshot(usersColRef, (snap) => {
        const liveUsers: UserProfile[] = [];
        snap.forEach(d => {
          const u = d.data() as UserProfile;
          if (u) {
            liveUsers.push({ ...u, id: u.id || d.id });
          }
        });
        if (liveUsers.length > 0) {
          const uMap = new Map<string, UserProfile>();
          // Server snapshot is authoritative, but preserve higher local claimed balance/earnings
          liveUsers.forEach(u => {
            const local = usersListRef.current.find(l => l.id === u.id);
            if (local) {
              uMap.set(u.id, {
                ...u,
                ...local,
                balance: Math.max(u.balance ?? 0, local.balance ?? 0),
                totalEarnings: Math.max(u.totalEarnings ?? 0, local.totalEarnings ?? 0)
              });
            } else {
              uMap.set(u.id, u);
            }
          });

          // Index server users by phone number (last 10 digits)
          const phoneMap = new Map<string, UserProfile>();
          liveUsers.forEach(u => {
            const digits = u.phone ? u.phone.replace(/\D/g, '').slice(-10) : '';
            if (digits) phoneMap.set(digits, u);
          });

          // Only keep local memory users if they aren't on server and don't share a phone number with any server user
          usersListRef.current.forEach(localU => {
            if (!localU || !localU.id) return;
            const digits = localU.phone ? localU.phone.replace(/\D/g, '').slice(-10) : '';
            if (!uMap.has(localU.id) && (!digits || !phoneMap.has(digits))) {
              uMap.set(localU.id, localU);
            }
          });

          const merged = Array.from(uMap.values());

          const isDiff = JSON.stringify(merged) !== JSON.stringify(usersListRef.current);
          if (isDiff) {
            setUsersList(merged);
            usersListRef.current = merged;
            localStorage.setItem('adpaint_users_list', JSON.stringify(merged));
          }
        }
      }, (err) => {
        console.warn("Notice reading live users snapshot:", err);
        markQuotaExceeded(err);
      });

      // Live Transactions collection listener for Admin real-time panel
      const txColRef = collection(db, "transactions");
      unsubTx = onSnapshot(txColRef, (snap) => {
        const liveTx: TransactionRecord[] = [];
        snap.forEach(d => {
          const tx = d.data() as TransactionRecord;
          if (tx) {
            liveTx.push({ ...tx, id: tx.id || d.id });
          }
        });
        if (liveTx.length > 0) {
          const txMap = new Map<string, TransactionRecord>();
          transactionsRef.current.forEach(t => txMap.set(t.id, t));
          liveTx.forEach(t => txMap.set(t.id, t));
          const mergedTx = Array.from(txMap.values());

          const isDiff = JSON.stringify(mergedTx) !== JSON.stringify(transactionsRef.current);
          if (isDiff) {
            setTransactions(mergedTx);
            transactionsRef.current = mergedTx;
            localStorage.setItem('adpaint_transactions', JSON.stringify(mergedTx));
          }
        }
      }, (err) => {
        console.warn("Notice reading live transactions snapshot:", err);
        markQuotaExceeded(err);
      });

      return () => {
        if (unsubUser) unsubUser();
        if (unsubDeleted) unsubDeleted();
        if (unsubPurchases) unsubPurchases();
        if (unsubUsers) unsubUsers();
        if (unsubTx) unsubTx();
      };
    } catch (err) {
      markQuotaExceeded(err);
    }
  }, [isLoggedIn, userProfile?.id, userProfile?.phone]);

  // Set up periodic real-time background sync loop and foreground listener
  useEffect(() => {
    // Initial sync upon mount to fetch global configs (avatar, UPI, links) for mobile APK & Web
    syncWithServer();

    // Trigger sync when app is brought to foreground (extremely helpful on mobile APK!)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("App foregrounded. Triggering sync...");
        syncWithServer();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const interval = setInterval(() => {
      syncWithServer();
    }, 30000); // 30 seconds interval prevents exhausting database quotas while maintaining synchronization

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [isLoggedIn]);

  // Manual refresh and sync trigger
  const handleSyncData = async () => {
    if (!isLoggedIn || !userProfile) return;
    setIsSyncing(true);
    triggerToast('Connecting to database and updating records...', 'info');
    try {
      // Force sync with server bypassing local update safety timers
      await syncWithServer(userProfile, true);
      
      // Load user-specific purchases to update UI immediately
      const userPurchasesStr = localStorage.getItem(`adpaint_purchases_${userProfile.id}`);
      if (userPurchasesStr) {
        setPurchases(JSON.parse(userPurchasesStr));
      }
      
      triggerToast('Database updated! Plans, balance, and ledger are up-to-date.', 'success');
    } catch (e: any) {
      console.error("Manual sync failed:", e);
      triggerToast(`Sync failed: ${e.message || 'Network timeout'}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Helper to get user-specific team members dynamically based on registration hierarchy
  const getDynamicTeamMembers = (user: UserProfile, allUsers: UserProfile[]): TeamMember[] => {
    const list: TeamMember[] = [];
    
    const getUserInvestedAmount = (u: UserProfile) => {
      // Sum successful recharges for this user from global transactions list
      const cleanPhone = u.phone ? u.phone.replace(/\D/g, '') : '';
      const rechargeSum = transactions
        .filter(t => t.type === 'recharge' && (t.status === 'success' || t.status === 'Approved' || t.status === 'approved') && (
          t.userId === u.id || 
          (cleanPhone.length >= 10 && t.userPhone && t.userPhone.replace(/\D/g, '').includes(cleanPhone.slice(-10)))
        ))
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      // Referral commission is awarded strictly when referred user performs a successful recharge
      return rechargeSum;
    };

    const getUserJoinedDate = (u: UserProfile) => {
      if (u.createdAt) {
        if (u.createdAt.includes('T')) return u.createdAt.split('T')[0];
        if (u.createdAt.includes(' ')) return u.createdAt.split(' ')[0];
        return u.createdAt;
      }
      const idParts = u.id ? u.id.split('_') : [];
      if (idParts.length > 1) {
        const ts = parseInt(idParts[1]);
        if (!isNaN(ts) && ts > 1600000000000) {
          return new Date(ts).toISOString().split('T')[0];
        }
      }
      return new Date().toISOString().split('T')[0];
    };

    console.group(`[Team Tree Calculation for: ${user.name} (Code: ${user.inviteCode})]`);
    console.log(`Total active system users scanned: ${allUsers.length}`);

    // Level 1: referred directly by current user
    const level1Users = allUsers.filter(u => u.inviterCode === user.inviteCode);
    console.log(`Level 1 (Direct Referred) matches: ${level1Users.length}`, level1Users.map(u => ({ name: u.name, code: u.inviteCode, sponsor: u.inviterCode })));

    const level2Collected: UserProfile[] = [];
    const level3Collected: UserProfile[] = [];

    level1Users.forEach(u1 => {
      const invested = getUserInvestedAmount(u1);
      list.push({
        id: u1.id,
        name: u1.name,
        phone: u1.phone && u1.phone.length > 7 ? u1.phone.substring(0, 7) + '***' + u1.phone.substring(u1.phone.length - 4) : u1.phone,
        level: 1,
        dateJoined: getUserJoinedDate(u1),
        totalInvested: invested,
        commissionEarned: invested * 0.10
      });

      // Level 2: referred by Level 1 users
      const level2Users = allUsers.filter(u => u.inviterCode === u1.inviteCode);
      level2Users.forEach(u2 => {
        level2Collected.push(u2);
        const invested2 = getUserInvestedAmount(u2);
        list.push({
          id: u2.id,
          name: u2.name,
          phone: u2.phone && u2.phone.length > 7 ? u2.phone.substring(0, 7) + '***' + u2.phone.substring(u2.phone.length - 4) : u2.phone,
          level: 2,
          dateJoined: getUserJoinedDate(u2),
          totalInvested: invested2,
          commissionEarned: invested2 * 0.05
        });

        // Level 3: referred by Level 2 users
        const level3Users = allUsers.filter(u => u.inviterCode === u2.inviteCode);
        level3Users.forEach(u3 => {
          level3Collected.push(u3);
          const invested3 = getUserInvestedAmount(u3);
          list.push({
            id: u3.id,
            name: u3.name,
            phone: u3.phone && u3.phone.length > 7 ? u3.phone.substring(0, 7) + '***' + u3.phone.substring(u3.phone.length - 4) : u3.phone,
            level: 3,
            dateJoined: getUserJoinedDate(u3),
            totalInvested: invested3,
            commissionEarned: invested3 * 0.02
          });
        });
      });
    });

    console.log(`Level 2 (Indirect - referred by L1) matches: ${level2Collected.length}`, level2Collected.map(u => ({ name: u.name, code: u.inviteCode, sponsor: u.inviterCode })));
    console.log(`Level 3 (Indirect - referred by L2) matches: ${level3Collected.length}`, level3Collected.map(u => ({ name: u.name, code: u.inviteCode, sponsor: u.inviterCode })));
    console.groupEnd();

    // Fallback to showcase premium mock data ONLY if the logged-in user is a static demo user,
    // to avoid confusing real users/admins who expect to see only their actual network referrals.
    if (list.length === 0 && (user.id === 'usr_demo' || user.id === 'usr_sandeep')) {
      return MOCK_TEAM_MEMBERS;
    }
    return list;
  };

  // Trigger Custom Toast
  const triggerToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setCustomToast({ text, type });
    setTimeout(() => setCustomToast(null), 3500);
  };

  // Real-time passive income tick accrual every 1.5 seconds to conserve CPU
  useEffect(() => {
    if (!isLoggedIn || !userProfile || purchases.length === 0) return;

    const accrualTimer = setInterval(() => {
      let accruedAmount = 0;
      let hasUpdates = false;

      const updatedPurchases = purchases.map((p) => {
        if (p.completed) return p;

        const now = new Date().getTime();
        const lastClaim = new Date(p.lastClaimedAt).getTime();
        const elapsedSecs = Math.max(0, (now - lastClaim) / 1000);
        
        // Earning rates per second (dailyIncome / 86400)
        const earningRatePerSec = p.dailyIncome / 86400;
        const incrementalEarnings = elapsedSecs * earningRatePerSec;

        // If the elapsed duration has completed, mark plan as completed
        const purchaseTime = new Date(p.datePurchased).getTime();
        const totalDurationMs = p.durationDays * 24 * 60 * 60 * 1000;
        const planExpiryTime = purchaseTime + totalDurationMs;

        if (now >= planExpiryTime) {
          hasUpdates = true;
          return {
            ...p,
            completed: true,
            lastClaimedAt: new Date(planExpiryTime).toISOString()
          };
        }

        return p;
      });

      if (hasUpdates) {
        saveStateToStorage(userProfile, plans, updatedPurchases, transactions, teamMembers);
      }
    }, 1500);

    return () => clearInterval(accrualTimer);
  }, [isLoggedIn, userProfile, purchases, plans, transactions, teamMembers]);

  // Auth Operations
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (!fullName.trim()) {
      setAuthError('Please enter your full name');
      return;
    }
    if (!mobileNumber || mobileNumber.length < 10) {
      setAuthError('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!password || password.length < 6) {
      setAuthError('Password must be at least 6 characters');
      return;
    }

    const targetPhone = `+91 ${mobileNumber}`;
    
    try {
      const checkData = await firestoreCheckPhone(targetPhone);
      if (checkData.exists) {
        setAuthError('Mobile number already registered! Please log in.');
        return;
      }
    } catch (err) {
      console.warn("Check phone error:", err);
    }

    // Success registration
    const finalInviterCode = invitationCode || localStorage.getItem('adpaint_pending_invite_code') || undefined;

    try {
      const regData = await firestoreRegister({
        name: fullName,
        phone: targetPhone,
        password_entered: password,
        inviterCode: finalInviterCode
      });
      const serverUser = regData.user;

      // Update state and persist
      setUserProfile(serverUser);
      setPurchases([]);
      setTransactions(regData.transactions);

      // Append new user to global usersList immediately so Admin panel and referral links reflect instantly
      const updatedUsersList = [...usersListRef.current.filter(u => u.id !== serverUser.id), serverUser];
      setUsersList(updatedUsersList);
      usersListRef.current = updatedUsersList;
      localStorage.setItem('adpaint_users_list', JSON.stringify(updatedUsersList));

      localStorage.setItem('adpaint_user', JSON.stringify(serverUser));
      localStorage.setItem('adpaint_transactions', JSON.stringify(regData.transactions));
      localStorage.setItem(`adpaint_purchases_${serverUser.id}`, JSON.stringify([]));
      setIsLoggedIn(true);
      setIsWelcomeNoticeOpen(true);
      localStorage.setItem(`adpaint_notice_shown_${serverUser.id}`, 'true');
      triggerToast('Account Registered Successfully! Enjoy ₹100 Welcome Bonus.', 'success');
      localStorage.removeItem('adpaint_pending_invite_code');

      // Force instant sync with server
      syncWithServer(serverUser, true);

      // Reset fields
      setFullName('');
      setMobileNumber('');
      setPassword('');
      setCaptchaInput('');
      generateCaptcha();
      setInvitationCode('');
      
      setIsVerifyingRegisterOtp(false);
      setPendingNewUser(null);
      setRegisterOtpInput('');
      setRegisterOtpCode('');
    } catch (err) {
      setAuthError('Server communication error. Please try again.');
    }
  };



  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const targetPhone = mobileNumber.trim();
    const isAdminInput = targetPhone.toLowerCase() === 'admin' || targetPhone === 'usr_admin' || targetPhone.includes('9999999999');

    if (!isAdminInput && (!mobileNumber || mobileNumber.replace(/\D/g, '').length < 10)) {
      setAuthError('Please enter a valid mobile number');
      return;
    }
    if (!password || password.length < 6) {
      setAuthError('Password must be at least 6 characters');
      return;
    }

    try {
      const loginData = await firestoreLogin({ phone: targetPhone, password_entered: password });
      const serverUser = sanitizeUserCheckIn(loginData.user)!;
      const serverPurchases = loginData.purchases || [];

      const localPurchases = getStoredPurchases(serverUser.id, loginData.transactions);
      const mergedPMap = new Map<string, PurchaseRecord>();
      localPurchases.forEach(p => mergedPMap.set(p.id, p));
      serverPurchases.forEach((p: PurchaseRecord) => mergedPMap.set(p.id, p));
      const finalPurchases = Array.from(mergedPMap.values());

      setUserProfile(serverUser);
      setPurchases(finalPurchases);
      setTransactions(loginData.transactions);
      localStorage.setItem('adpaint_user', JSON.stringify(serverUser));
      localStorage.setItem('adpaint_transactions', JSON.stringify(loginData.transactions));
      localStorage.setItem(`adpaint_purchases_${serverUser.id}`, JSON.stringify(finalPurchases));
      localStorage.setItem(`adpaint_backup_purchases_${serverUser.id}`, JSON.stringify(finalPurchases));
      localStorage.setItem('adpaint_purchases', JSON.stringify(finalPurchases));

      setIsLoggedIn(true);
      if (serverUser.role !== 'admin' && !localStorage.getItem(`adpaint_notice_shown_${serverUser.id}`)) {
        setIsWelcomeNoticeOpen(true);
        localStorage.setItem(`adpaint_notice_shown_${serverUser.id}`, 'true');
      }
      triggerToast('Welcome back! Logs active.', 'success');

      // Deep sync
      syncWithServer(serverUser);

      // Reset fields
      setMobileNumber('');
      setPassword('');
    } catch (err: any) {
      const rawMsg = err?.message || '';
      if (rawMsg.includes('Quota limit') || rawMsg.includes('quota') || rawMsg.includes('RESOURCE_EXHAUSTED')) {
        setAuthError('Server is currently busy. Please try logging in again.');
      } else {
        setAuthError(rawMsg || 'Server communication error. Please try again.');
      }
    }
  };

  // Forgot Password flow handlers
  const handleForgotRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (!forgotPhone || forgotPhone.length < 10) {
      setAuthError('Please enter a valid 10-digit mobile number.');
      return;
    }

    const targetPhone = forgotPhone.trim();
    
    try {
      const checkData = await firestoreCheckPhone(targetPhone);
      if (!checkData.exists) {
        setAuthError('This mobile number is not registered!');
        return;
      }
    } catch (err) {
      console.warn("Check phone error:", err);
    }

    // Generate random 4-digit OTP code
    const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
    setForgotOtpCode(generatedOtp);
    setForgotStep(2);

    // Simulate SMS delivery beautifully!
    triggerToast(`OTP Code sent to +91 ${forgotPhone}: ${generatedOtp}`, 'success');
  };

  const handleForgotVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (forgotOtpInput !== forgotOtpCode) {
      setAuthError('Incorrect OTP Code! Please try again.');
      return;
    }

    setForgotStep(3);
    triggerToast('OTP verified successfully! Set your new password.', 'success');
  };

  const handleForgotResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (!forgotNewPassword || forgotNewPassword.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }

    const targetPhone = forgotPhone.trim();

    try {
      await firestoreResetPassword({ phone: targetPhone, password_entered: forgotNewPassword });

      const updatedList = usersList.map(u => {
        if (u.phone === targetPhone) {
          return { ...u, password: forgotNewPassword };
        }
        return u;
      });

      setUsersList(updatedList);
      localStorage.setItem('adpaint_users_list', JSON.stringify(updatedList));

      // Also update current active session user password if they were logged in
      let activeUser = userProfile;
      if (userProfile && userProfile.phone === targetPhone) {
        activeUser = { ...userProfile, password: forgotNewPassword };
        setUserProfile(activeUser);
        localStorage.setItem('adpaint_user', JSON.stringify(activeUser));
      }

      triggerToast('Password reset successful! Please login with your new password.', 'success');
      
      // Reset forgot state and redirect to login
      setAuthTab('login');
      setForgotPhone('');
      setForgotOtpInput('');
      setForgotOtpCode('');
      setForgotNewPassword('');
      setForgotStep(1);

      // Trigger sync
      syncWithServer(activeUser);
    } catch (err) {
      setAuthError('Server communication error. Please try again.');
    }
  };

  // Quick Guest Account setup
  const handleQuickDemo = () => {
    const demoUser: UserProfile = {
      id: 'usr_demo',
      name: 'Ajay Kumar',
      phone: '+91 9876543210',
      balance: 1540,
      totalEarnings: 3250,
      dailyEarned: 420,
      checkedInToday: false,
      inviteCode: '47523', // Matches the screenshot referral link code! High-fidelity!
      role: 'user',
      password: 'password123',
      bankAccount: {
        bankName: 'State Bank of India',
        accountHolder: 'Ajay Kumar',
        accountNumber: '304592018422',
        ifscCode: 'SBIN0004523'
      }
    };

    saveStateToStorage(demoUser, plans, [], INITIAL_TRANSACTIONS, MOCK_TEAM_MEMBERS);
    setIsLoggedIn(true);
    setIsWelcomeNoticeOpen(true);
    sessionStorage.setItem('adpaint_welcome_shown', 'true');
    triggerToast('Logged in as Guest Demo Account!', 'info');
  };

  const handleLogout = () => {
    saveStateToStorage(null);
    setIsLoggedIn(false);
    setUserProfile(null);
    setActiveTab('home');
    setIsAdminMode(false);
    
    // Fully clear all auth form input states to prevent session switching leaks
    setFullName('');
    setMobileNumber('');
    setPassword('');
    setCaptchaInput('');
    generateCaptcha();
    setInvitationCode('');
    setShowPassword(false);
    
    setForgotStep(1);
    setForgotPhone('');
    setForgotOtpCode('');
    setForgotOtpInput('');
    setForgotNewPassword('');
    setShowForgotNewPassword(false);
    setAuthError('');
    
    setAuthTab('login');
    
    triggerToast('Signed out successfully.', 'info');
  };

  // Automatic inactivity auto-logout disabled as requested by the user
  // Users will remain logged in until they explicitly click the Logout button.

  const handleAdminSetUsersList = (action: React.SetStateAction<UserProfile[]>) => {
    const updated = typeof action === 'function' ? (action as Function)(usersListRef.current) : action;
    
    localStorage.setItem('adpaint_users_list', JSON.stringify(updated));
    usersListRef.current = updated;
    setUsersList(updated);

    let currentMe = userProfileRef.current;
    if (currentMe) {
      const matching = updated.find((u: UserProfile) => u.id === currentMe!.id);
      if (matching) {
        currentMe = matching;
        setUserProfile(matching);
        userProfileRef.current = matching;
        localStorage.setItem('adpaint_user', JSON.stringify(matching));
      }
    }
    
    pushStateToServer(currentMe, plansRef.current, purchasesRef.current, transactionsRef.current, updated);
  };

  const handleAdminSetPlans = (action: React.SetStateAction<InvestmentPlan[]>) => {
    const updated = typeof action === 'function' ? (action as Function)(plansRef.current) : action;
    
    localStorage.setItem('adpaint_plans', JSON.stringify(updated));
    plansRef.current = updated;
    setPlans(updated);
    
    pushStateToServer(userProfileRef.current, updated, purchasesRef.current, transactionsRef.current, usersListRef.current);
  };

  const handleAdminSetTransactions = (action: React.SetStateAction<TransactionRecord[]>) => {
    const updated = typeof action === 'function' ? (action as Function)(transactionsRef.current) : action;
    
    localStorage.setItem('adpaint_transactions', JSON.stringify(updated));
    transactionsRef.current = updated;
    setTransactions(updated);
    
    pushStateToServer(userProfileRef.current, plansRef.current, purchasesRef.current, updated, usersListRef.current);
  };

  const handleAdminSetPurchases = (action: React.SetStateAction<PurchaseRecord[]>) => {
    const updated = typeof action === 'function' ? (action as Function)(purchasesRef.current) : action;
    
    localStorage.setItem('adpaint_purchases', JSON.stringify(updated));
    purchasesRef.current = updated;
    setPurchases(updated);
    
    pushStateToServer(userProfileRef.current, plansRef.current, updated, transactionsRef.current, usersListRef.current);
  };

  // Daily Check-In Option
  const handleDailyCheckIn = () => {
    if (!userProfile) return;

    const todayStr = new Date().toDateString();
    const isAlreadyCheckedIn = userProfile.lastCheckInDate === todayStr && userProfile.checkedInToday === true;

    if (isAlreadyCheckedIn) {
      triggerToast('Already checked in today! Come back tomorrow.', 'error');
      return;
    }

    const bonusStr = localStorage.getItem('adpaint_daily_bonus');
    const reward = bonusStr ? parseFloat(bonusStr) : 10;
    const updatedUser: UserProfile = {
      ...userProfile,
      balance: (userProfile.balance || 0) + reward,
      totalEarnings: (userProfile.totalEarnings || 0) + reward,
      dailyEarned: (userProfile.dailyEarned || 0) + reward,
      checkedInToday: true,
      lastCheckInDate: todayStr
    };

    const checkInTx: TransactionRecord = {
      id: `tx_check_${Date.now()}`,
      userId: updatedUser.id,
      userPhone: updatedUser.phone,
      type: 'checkin',
      amount: reward,
      date: new Date().toLocaleString(),
      status: 'success',
      description: 'Daily Check-in Reward claimed'
    };

    saveStateToStorage(updatedUser, plans, purchases, [...transactions, checkInTx], teamMembers);
    triggerToast(`Congratulations! Claimed ₹${reward} Daily Bonus.`, 'success');
  };

  // Purchase Plan Action
  const handleConfirmPurchase = (plan: InvestmentPlan, quantity: number) => {
    if (!userProfile) return;

    const totalCost = plan.price * quantity;
    if (userProfile.balance < totalCost) {
      setRechargePrefillAmount(totalCost);
      setIsRechargeOpen(true);
      triggerToast(`Insufficient balance! Redirected to the deposit/recharge section to add ₹${Math.round(totalCost - userProfile.balance).toLocaleString('en-IN')}.`, 'info');
      return;
    }

    // Deduct and add purchase
    const updatedUser = {
      ...userProfile,
      balance: userProfile.balance - totalCost,
      totalInvested: (userProfile.totalInvested || 0) + totalCost
    };

    const newPurchase: PurchaseRecord = {
      id: `pur_${Date.now()}`,
      userId: userProfile.id,
      planId: plan.id,
      planTitle: `${plan.title} (${quantity} Slots)`,
      price: totalCost,
      dailyIncome: plan.dailyIncome * quantity,
      durationDays: plan.durationDays,
      datePurchased: new Date().toISOString(),
      lastClaimedAt: new Date().toISOString(),
      totalClaimed: 0,
      completed: false
    };

    const purchaseTx: TransactionRecord = {
      id: `tx_pur_${Date.now()}`,
      userId: userProfile.id,
      userPhone: userProfile.phone,
      type: 'purchase',
      amount: totalCost,
      date: new Date().toLocaleString(),
      status: 'success',
      description: `Bought Advertisement Plan: ${plan.title} (${quantity} Slots)`
    };

    // Immediate direct Firestore write for purchases
    if (!isQuotaExceeded()) {
      try {
        setDoc(doc(db, "purchases", newPurchase.id), cleanUndefined(newPurchase)).catch(markQuotaExceeded);
        setDoc(doc(db, "transactions", purchaseTx.id), cleanUndefined(purchaseTx)).catch(markQuotaExceeded);
        setDoc(doc(db, "users", updatedUser.id), cleanUndefined(updatedUser)).catch(markQuotaExceeded);
      } catch (e) {
        markQuotaExceeded(e);
      }
    }

    // Update remaining slots on plan
    const updatedPlans = plans.map((p) => {
      if (p.id === plan.id) {
        return { ...p, slotsPurchased: Math.min(p.slotsMax, p.slotsPurchased + quantity) };
      }
      return p;
    });

    saveStateToStorage(updatedUser, updatedPlans, [...purchases, newPurchase], [...transactions, purchaseTx], teamMembers);
    triggerToast(`Success! Bought ${quantity} Slots of ${plan.title}. Yield accumulating!`, 'success');
  };

  // Claim Order Accrued Earnings
  const handleClaimOrderEarnings = (purchaseId: string) => {
    if (!userProfile) return;

    const purchase = purchases.find((p) => p.id === purchaseId);
    if (!purchase || purchase.completed) return;

    const now = new Date().getTime();
    const lastClaim = new Date(purchase.lastClaimedAt).getTime();
    
    // Check plan expiration time
    const purchaseTime = new Date(purchase.datePurchased).getTime();
    const totalDurationMs = purchase.durationDays * 24 * 60 * 60 * 1000;
    const planExpiryTime = purchaseTime + totalDurationMs;
    
    let isCompleting = false;
    let claimUntil = now;
    if (now >= planExpiryTime) {
      claimUntil = planExpiryTime;
      isCompleting = true;
    }

    const elapsedSecs = Math.max(0, (claimUntil - lastClaim) / 1000);
    const earningRatePerSec = purchase.dailyIncome / 86400;
    const accrued = elapsedSecs * earningRatePerSec;

    if (accrued < 0.01) {
      triggerToast('Accumulated yield too small. Please wait a few seconds.', 'error');
      return;
    }

    const updatedUser = {
      ...userProfile,
      totalEarnings: userProfile.totalEarnings + accrued
    };

    let targetUpdatedPurchase: PurchaseRecord | null = null;
    const updatedPurchases = purchases.map((p) => {
      if (p.id === purchaseId) {
        const item = {
          ...p,
          totalClaimed: p.totalClaimed + accrued,
          completed: isCompleting ? true : p.completed,
          lastClaimedAt: new Date(claimUntil).toISOString()
        };
        targetUpdatedPurchase = item;
        return item;
      }
      return p;
    });

    const claimTx: TransactionRecord = {
      id: `tx_claim_${Date.now()}`,
      userId: userProfile.id,
      userPhone: userProfile.phone,
      type: 'claim',
      amount: accrued,
      date: new Date().toLocaleString(),
      status: 'success',
      description: `Claimed accrued advertisement rewards from: ${purchase.planTitle}${isCompleting ? ' (Plan Completed)' : ''}`
    };

    if (!isQuotaExceeded() && targetUpdatedPurchase) {
      try {
        setDoc(doc(db, "purchases", (targetUpdatedPurchase as PurchaseRecord).id), cleanUndefined(targetUpdatedPurchase)).catch(markQuotaExceeded);
        setDoc(doc(db, "transactions", claimTx.id), cleanUndefined(claimTx)).catch(markQuotaExceeded);
        setDoc(doc(db, "users", updatedUser.id), cleanUndefined(updatedUser)).catch(markQuotaExceeded);
      } catch (e) {
        markQuotaExceeded(e);
      }
    }

    saveStateToStorage(updatedUser, plans, updatedPurchases, [...transactions, claimTx], teamMembers);
    triggerToast(
      isCompleting 
        ? `Successfully claimed final ₹${accrued % 1 === 0 ? accrued.toLocaleString('en-IN') : accrued.toFixed(2)} ad revenues! Investment completed.` 
        : `Successfully claimed ₹${accrued % 1 === 0 ? accrued.toLocaleString('en-IN') : accrued.toFixed(2)} ad revenues!`, 
      'success'
    );
  };

  // Recharge Submission
  const handleRechargeSuccess = async (amount: number, utr: string, proofImage?: string) => {
    if (!userProfile) return;

    // In a high-fidelity system, a recharge with a UTR is logged as "pending" for Admin review.
    const rechargeTx: TransactionRecord = {
      id: `tx_rec_${Date.now()}`,
      type: 'recharge',
      amount,
      date: new Date().toLocaleString(),
      status: 'pending',
      description: `Recharge request (UTR: ${utr}) submitted`,
      utr,
      proofImage,
      userId: userProfile.id,
      userPhone: userProfile.phone
    };

    // 1. Direct immediate write to transactions collection in Firestore to prevent any sync failure
    if (!isQuotaExceeded()) {
      try {
        await setDoc(doc(db, "transactions", rechargeTx.id), cleanUndefined(rechargeTx));
      } catch (err) {
        markQuotaExceeded(err);
        console.error("Direct transaction write to Firestore failed:", err);
      }

      // 2. Direct immediate write to deposits collection in Firestore using firebaseService wrapper
      try {
        await firebaseService.saveDepositRequest({
          userId: userProfile.id,
          userName: userProfile.name,
          email: (userProfile as any).email || `${userProfile.phone.replace(/[^0-9]/g, '')}@propertyn.com`,
          mobileNumber: userProfile.phone,
          orderId: `order_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          depositAmount: amount,
          utr: utr,
          paymentTime: new Date().toLocaleString()
        });
      } catch (err) {
        markQuotaExceeded(err);
        console.error("Direct deposit write to Firestore failed:", err);
      }
    }

    saveStateToStorage(userProfile, plans, purchases, [...transactions, rechargeTx], teamMembers);
    triggerToast(`Recharge of ₹${amount % 1 === 0 ? amount.toLocaleString('en-IN') : amount.toFixed(2)} submitted! Waiting for Admin verification.`, 'info');
  };

  // Withdraw Submission
  const handleWithdrawRequest = async (amount: number, pin: string) => {
    if (!userProfile) return;

    const hasPurchased = purchases && purchases.length > 0;
    if (!hasPurchased) {
      triggerToast('निकासी अस्वीकृत: पैसे निकालने के लिए आपके पास कम से कम एक खरीदा हुआ प्लान होना आवश्यक है।', 'error');
      return;
    }

    // Verify limit: only plan income earned can be withdrawn
    const userTx = transactions.filter(
      (t) => (t.userId && t.userId === userProfile.id) || (t.userPhone && t.userPhone === userProfile.phone)
    );

    const totalClaimedFromTx = userTx
      .filter((t) => t.type === 'claim' && t.status === 'success')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalPlanEarnings = hasPurchased
      ? ((userProfile.totalEarnings !== undefined && userProfile.totalEarnings >= 0) ? userProfile.totalEarnings : totalClaimedFromTx)
      : 0;

    const totalWithdrawnAmount = userTx
      .filter((t) => t.type === 'withdraw' && (t.status === 'success' || t.status === 'pending'))
      .reduce((sum, t) => sum + t.amount, 0);

    const maxWithdrawablePlanEarnings = Math.max(0, totalPlanEarnings - totalWithdrawnAmount);
    const withdrawableLimit = hasPurchased ? maxWithdrawablePlanEarnings : 0;

    if (amount > withdrawableLimit) {
      const fmtMax = Math.floor(withdrawableLimit).toLocaleString('en-IN');
      triggerToast(`निकासी अस्वीकृत: आप केवल प्लान से प्राप्त कुल आय (₹${fmtMax}) ही विड्रॉल कर सकते हैं।`, 'error');
      return;
    }

    // Deduct immediately and log as PENDING. Admin manually approves/settles it from the Admin Control Panel.
    const updatedUser = {
      ...userProfile,
      balance: userProfile.balance - amount
    };

    const txId = `tx_wd_${Date.now()}`;
    const withdrawTx: TransactionRecord = {
      id: txId,
      type: 'withdraw',
      amount,
      date: new Date().toLocaleString(),
      status: 'pending',
      description: `Bank transfer settlement to: ${userProfile.bankAccount?.bankName}`,
      userId: userProfile.id,
      userPhone: userProfile.phone
    };

    // Direct immediate write to transactions and users collections in Firestore to prevent any sync failure
    if (!isQuotaExceeded()) {
      try {
        await setDoc(doc(db, "transactions", withdrawTx.id), cleanUndefined(withdrawTx));
        await setDoc(doc(db, "users", updatedUser.id), cleanUndefined(updatedUser));
      } catch (err) {
        markQuotaExceeded(err);
        console.error("Direct withdrawal write to Firestore failed:", err);
      }
    }

    saveStateToStorage(updatedUser, plans, purchases, [...transactions, withdrawTx], teamMembers);
    triggerToast(`Withdrawal of ₹${amount % 1 === 0 ? amount.toLocaleString('en-IN') : amount.toFixed(2)} requested! Waiting for Admin clearance.`, 'info');
  };

  // Bank update helper
  const handleUpdateBank = (bank: BankAccount) => {
    if (!userProfile) return;
    const updated = {
      ...userProfile,
      bankAccount: bank
    };
    saveStateToStorage(updated);
    triggerToast('Bank details saved! Withdrawal channel ready.', 'success');
  };

  // Password update helper
  const handleUpdatePassword = (newPass: string) => {
    if (!userProfile) return;
    const updated = {
      ...userProfile,
      withdrawPassword: newPass
    };
    saveStateToStorage(updated);
    triggerToast('Withdrawal PIN changed successfully!', 'success');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-start md:items-center justify-center font-sans antialiased">
      {/* Dynamic Custom Toast */}
      <AnimatePresence>
        {customToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 z-50 px-5 py-3.5 rounded-2xl shadow-xl border flex items-center gap-2 max-w-xs ${
              customToast.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : customToast.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-blue-50 text-blue-800 border-blue-200'
            }`}
          >
            {customToast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            ) : customToast.type === 'error' ? (
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
            ) : (
              <Sparkles className="w-5 h-5 shrink-0 text-blue-600" />
            )}
            <span className="text-xs font-extrabold leading-normal">{customToast.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Responsive Layout Wrapper (Max-width 450px on desktop for users to look identical to native mobile viewports, stretches wide for Admin Control Room on laptops) */}
      <div className={`w-full ${
        isLoggedIn && userProfile?.role === 'admin'
          ? 'max-w-none w-screen h-screen md:h-screen md:my-0 md:rounded-none border-none'
          : 'max-w-md h-[100dvh] md:h-[92vh] md:my-4 md:rounded-[3rem]'
      } bg-slate-50 overflow-hidden shadow-2xl flex flex-col relative border border-slate-800/20 transition-all duration-300`}>
        
        {/* If logged in, show app sections, else show Auth Gate */}
        {isLoggedIn && userProfile ? (
          (userProfile.role === 'admin') ? (
            <AdminSection
              currentProfile={userProfile}
              usersList={usersList}
              setUsersList={handleAdminSetUsersList}
              plans={plans}
              setPlans={handleAdminSetPlans}
              transactions={transactions}
              setTransactions={handleAdminSetTransactions}
              purchases={purchases}
              setPurchases={handleAdminSetPurchases}
              onClose={handleLogout}
              triggerToast={triggerToast}
              onRefreshData={handleSyncData}
              onUpdateCurrentUserProfile={(profile) => {
                saveStateToStorage(profile);
              }}
              onSyncConfig={(updatedPlans, updatedPurchases, updatedUsers, updatedTx) => {
                lastLocalUpdateRef.current = Date.now();
                if (updatedPlans) {
                  setPlans(updatedPlans);
                  plansRef.current = updatedPlans;
                  localStorage.setItem('adpaint_plans', JSON.stringify(updatedPlans));
                }
                if (updatedPurchases) {
                  setPurchases(updatedPurchases);
                  purchasesRef.current = updatedPurchases;
                }
                if (updatedUsers) {
                  setUsersList(updatedUsers);
                  usersListRef.current = updatedUsers;
                  localStorage.setItem('adpaint_users_list', JSON.stringify(updatedUsers));
                }
                if (updatedTx) {
                  setTransactions(updatedTx);
                  transactionsRef.current = updatedTx;
                  localStorage.setItem('adpaint_transactions', JSON.stringify(updatedTx));
                }

                pushStateToServer(
                  userProfile,
                  updatedPlans || plansRef.current,
                  updatedPurchases || purchasesRef.current,
                  updatedTx || transactionsRef.current,
                  updatedUsers || usersListRef.current
                );
              }}
            />
          ) : (
            <div className="flex-1 flex flex-col relative overflow-hidden">
              {/* View Switching Router */}
              <div ref={scrollContainerRef} className="flex-1 overflow-y-auto bg-slate-50 pb-28">
                {activeTab === 'home' && (
                  <HomeSection
                    user={userProfile}
                    plans={plans}
                    transactions={transactions.filter(t => t.userId === userProfile.id)}
                    onOpenRecharge={() => {
                      setRechargePrefillAmount(undefined);
                      setIsRechargeOpen(true);
                    }}
                    onOpenWithdraw={() => setIsWithdrawOpen(true)}
                    onOpenService={() => {
                      setIsServiceOpen(true);
                    }}
                    onOpenNotice={() => {
                      setIsWelcomeNoticeOpen(true);
                    }}
                    onPurchasePlan={(plan) => {
                      setSelectedPurchasePlan(plan);
                      setIsPurchaseOpen(true);
                    }}
                    liveNotification={liveNotif}
                    onOpenDownloadApp={() => setIsDownloadAppOpen(true)}
                  />
                )}

                {activeTab === 'invite' && (
                  <InviteSection
                    user={userProfile}
                    teamMembers={getDynamicTeamMembers(userProfile, usersList)}
                  />
                )}

                {activeTab === 'orders' && (
                  <OrdersSection
                    purchases={purchases}
                    onClaimOrderEarnings={handleClaimOrderEarnings}
                  />
                )}

                {activeTab === 'team' && (
                  <TeamSection
                    teamMembers={getDynamicTeamMembers(userProfile, usersList)}
                  />
                )}

                {activeTab === 'profile' && (
                  <ProfileSection
                    user={userProfile}
                    purchases={purchases}
                    transactions={transactions.filter(t => t.userId === userProfile.id)}
                    onOpenRecharge={() => {
                      setRechargePrefillAmount(undefined);
                      setIsRechargeOpen(true);
                    }}
                    onOpenWithdraw={() => setIsWithdrawOpen(true)}
                    onClaimOrderEarnings={handleClaimOrderEarnings}
                    onDailyCheckIn={handleDailyCheckIn}
                    onUpdateBank={handleUpdateBank}
                    onUpdatePassword={handleUpdatePassword}
                    onLogout={handleLogout}
                    onEnterAdminTerminal={() => {
                      if (userProfile.role === 'admin') {
                        setIsAdminMode(true);
                      } else {
                        triggerToast('Access Denied: Admin role required.', 'error');
                      }
                    }}
                    triggerToast={triggerToast}
                    onOpenDownloadApp={() => setIsDownloadAppOpen(true)}
                    onSyncData={handleSyncData}
                    isSyncing={isSyncing}
                  />
                )}
              </div>

              {/* Floating Customer Support Badge - Sticky inside the phone wrapper, only on Home tab */}
              {activeTab === 'home' && (
                <motion.button
                  type="button"
                  onClick={() => {
                    openTelegramUrl(localStorage.getItem('adpaint_tg_support'), 'https://t.me/PropertyN_Support');
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1, y: [0, -6, 0] }}
                  transition={{
                    scale: { type: 'spring', damping: 15 },
                    y: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                  }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute bottom-24 right-5 z-40 w-14 h-14 rounded-full border-2 border-white shadow-[0_8px_30px_rgba(16,185,129,0.35)] overflow-hidden cursor-pointer active:scale-95 transition-transform bg-white"
                >
                  <SupportAgentAvatar
                    src={localStorage.getItem('adpaint_support_avatar') || undefined}
                    className="w-full h-full object-cover pointer-events-none"
                  />
                  {/* Pulsing online badge indicator */}
                  <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
                </motion.button>
              )}

              {/* Bottom Navigation rail (Matches screenshot, larger height and icons as requested by user) */}
              <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 flex items-center justify-around h-[70px] z-40 shadow-[0_-8px_24px_rgba(15,23,42,0.06)] overflow-visible px-2 pb-1">
                {[
                  { id: 'home', label: 'Home', icon: Home },
                  { id: 'invite', label: 'Invite', icon: Gift },
                  { id: 'orders', label: 'Orders', icon: ShoppingBag, isSpecial: true },
                  { id: 'team', label: 'Team', icon: Users },
                  { id: 'profile', label: 'Profile', icon: User }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isSelected = activeTab === tab.id;
                  
                  if (tab.isSpecial) {
                    const activeOrdersCount = purchases.filter(p => !p.completed).length;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className="flex flex-col items-center justify-center flex-1 relative -top-4 group cursor-pointer select-none"
                      >
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 relative ${
                          isSelected
                            ? 'bg-gradient-to-br from-emerald-500 via-teal-600 to-teal-700 text-white scale-110 ring-4 ring-white shadow-[0_6px_18px_rgba(16,185,129,0.35)]'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 ring-4 ring-white shadow-[0_3px_12px_rgba(16,185,129,0.15)]'
                        }`}>
                          <Icon className={`w-6.5 h-6.5 transition-transform group-active:scale-90 ${isSelected ? 'stroke-[2.5] fill-white/10' : 'stroke-[2.2] fill-emerald-100/30'}`} />
                          {activeOrdersCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center bg-rose-500 text-white text-[9px] font-black rounded-full border border-white shadow-sm">
                              {activeOrdersCount}
                            </span>
                          )}
                        </div>
                        <span className={`text-[10px] font-black tracking-wider uppercase absolute -bottom-5 transition-all duration-200 ${
                          isSelected ? 'text-teal-700 scale-105' : 'text-slate-600/90 group-hover:text-slate-800'
                        }`}>
                          {tab.label}
                        </span>
                      </button>
                    );
                  }

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className="flex flex-col items-center justify-center flex-1 py-1 group cursor-pointer select-none"
                    >
                      <div className={`p-1.5 rounded-xl transition-all duration-300 relative ${
                        isSelected
                          ? 'bg-teal-50 text-teal-700 scale-105 shadow-[0_2px_8px_rgba(13,148,136,0.1)]'
                          : 'text-slate-500 group-hover:text-slate-800 group-hover:bg-slate-50'
                      }`}>
                        <Icon className={`w-5.5 h-5.5 transition-transform duration-300 group-active:scale-90 ${isSelected ? 'stroke-[2.5] fill-teal-100/40' : 'stroke-[2]'}`} />
                        {isSelected && (
                          <span className="absolute top-0.5 right-0.5 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-600"></span>
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] font-black mt-1 tracking-wider uppercase transition-all duration-200 ${
                        isSelected ? 'text-teal-700 scale-105' : 'text-slate-600/90 group-hover:text-slate-800'
                      }`}>
                        {tab.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )
        ) : (
          /* AUTHENTICATION PORTAL - High fidelity redesign matching UK777 style reference screen */
          <AuthPortal
            authTab={authTab}
            setAuthTab={setAuthTab}
            fullName={fullName}
            setFullName={setFullName}
            mobileNumber={mobileNumber}
            setMobileNumber={setMobileNumber}
            password={password}
            setPassword={setPassword}
            invitationCode={invitationCode}
            setInvitationCode={setInvitationCode}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            authError={authError}
            setAuthError={setAuthError}
            handleLogin={handleLogin}
            handleRegister={handleRegister}
            forgotStep={forgotStep}
            setForgotStep={setForgotStep}
            forgotPhone={forgotPhone}
            setForgotPhone={setForgotPhone}
            forgotOtpInput={forgotOtpInput}
            setForgotOtpInput={setForgotOtpInput}
            forgotOtpCode={forgotOtpCode}
            forgotNewPassword={forgotNewPassword}
            setForgotNewPassword={setForgotNewPassword}
            showForgotNewPassword={showForgotNewPassword}
            setShowForgotNewPassword={setShowForgotNewPassword}
            handleForgotRequestOtp={handleForgotRequestOtp}
            handleForgotVerifyOtp={handleForgotVerifyOtp}
            handleForgotResetPassword={handleForgotResetPassword}
          />
        )}

        {/* Modal Interfaces */}
        {userProfile && (
          <>
            <RechargeModal
              user={userProfile}
              isOpen={isRechargeOpen}
              onClose={() => {
                setIsRechargeOpen(false);
                setRechargePrefillAmount(undefined);
              }}
              onRechargeSuccess={handleRechargeSuccess}
              prefilledAmount={rechargePrefillAmount}
            />

            <WithdrawModal
              user={userProfile}
              isOpen={isWithdrawOpen}
              onClose={() => setIsWithdrawOpen(false)}
              onWithdrawRequest={handleWithdrawRequest}
              onOpenBankConfig={() => {
                setActiveTab('profile');
              }}
              onUpdateBank={handleUpdateBank}
              hasPurchasedPlan={purchases.length > 0}
              transactions={transactions.filter(t => t.userId === userProfile.id || t.userPhone === userProfile.phone)}
              purchases={purchases}
            />

            <SupportModal
              isOpen={isServiceOpen}
              onClose={() => setIsServiceOpen(false)}
            />

            <PurchaseModal
              isOpen={isPurchaseOpen}
              onClose={() => setIsPurchaseOpen(false)}
              plan={selectedPurchasePlan}
              user={userProfile}
              onConfirmPurchase={handleConfirmPurchase}
              onOpenRecharge={(amount?: number) => {
                if (amount) {
                  setRechargePrefillAmount(amount);
                } else if (selectedPurchasePlan) {
                  setRechargePrefillAmount(selectedPurchasePlan.price);
                }
                setIsRechargeOpen(true);
              }}
            />

            <WelcomeNoticeModal
              isOpen={isWelcomeNoticeOpen}
              onClose={() => setIsWelcomeNoticeOpen(false)}
            />

            <DownloadAppModal
              isOpen={isDownloadAppOpen}
              onClose={() => setIsDownloadAppOpen(false)}
              triggerToast={triggerToast}
            />
          </>
        )}

        {!isLoggedIn && (
          <SlidingAppDownloadBanner
            onOpenFullModal={() => setIsDownloadAppOpen(true)}
            triggerToast={triggerToast}
          />
        )}
      </div>
    </div>
  );
}
