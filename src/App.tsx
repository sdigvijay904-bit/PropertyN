/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home, Users, Gift, User, ShieldCheck, RefreshCw, Eye, EyeOff, Lock, Phone, UserCheck,
  Smartphone, Sparkles, X, CheckCircle2, TrendingUp, AlertTriangle, MessageSquare, Landmark, HelpCircle,
  Check
} from 'lucide-react';

import { UserProfile, InvestmentPlan, PurchaseRecord, TransactionRecord, TeamMember, BankAccount } from './types';
import { INITIAL_PLANS, MOCK_TEAM_MEMBERS, INITIAL_TRANSACTIONS, GENERATE_RANDOM_LIVE_NOTIF } from './data';

import HomeSection from './components/HomeSection';
import InviteSection from './components/InviteSection';
import TeamSection from './components/TeamSection';
import ProfileSection from './components/ProfileSection';
import AdminSection from './components/AdminSection';

import RechargeModal from './components/RechargeModal';
import WithdrawModal from './components/WithdrawModal';
import SupportModal from './components/SupportModal';
import PurchaseModal from './components/PurchaseModal';
import WelcomeNoticeModal from './components/WelcomeNoticeModal';
import DownloadAppModal from './components/DownloadAppModal';

import {
  firestoreCheckPhone,
  firestoreLogin,
  firestoreRegister,
  firestoreResetPassword,
  firestoreGetState,
  firestoreSaveState,
  cleanUndefined
} from './lib/db';
import { db } from './lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { firebaseService } from './firebase/config';

export default function App() {
  // Navigation & Authentication states
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [authTab, setAuthTab] = useState<'login' | 'register' | 'forgot'>('login');
  const [activeTab, setActiveTab] = useState<'home' | 'invite' | 'team' | 'profile'>('home');

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
        const hasOldTheme = parsedPlans.some((p: any) => 
          p.title.includes('Beautiful Homes') || 
          p.title.includes('Ad-Sponsor') || 
          p.title.includes('Paint') || 
          p.title.includes('Ad-Plan') ||
          p.title.includes('Special Offer') ||
          p.title.includes('Apex Ultima') ||
          p.title.includes('Royale Luxury') ||
          p.title.includes('Tractor Budget')
        );
        if (!hasOldTheme && parsedPlans.length > 0) {
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
        const userPurchasesStr = localStorage.getItem(`adpaint_purchases_${parsedUser.id}`);
        if (userPurchasesStr) {
          return JSON.parse(userPurchasesStr);
        }
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
      const finalUser = latestFromList || parsedUser;
      setUserProfile(finalUser);
      localStorage.setItem('adpaint_user', JSON.stringify(finalUser));
      setIsLoggedIn(true);
      if (finalUser.role !== 'admin' && !sessionStorage.getItem('adpaint_welcome_shown')) {
        setIsWelcomeNoticeOpen(true);
        sessionStorage.setItem('adpaint_welcome_shown', 'true');
      }

      // Load user-specific purchases on startup
      const userPurchasesStr = localStorage.getItem(`adpaint_purchases_${finalUser.id}`);
      if (userPurchasesStr) {
        setPurchases(JSON.parse(userPurchasesStr));
      } else if (storedPurchases) {
        setPurchases(JSON.parse(storedPurchases));
      } else {
        setPurchases([]);
      }
    } else {
      setPurchases([]);
    }
    let loadedPlans = INITIAL_PLANS;
    if (storedPlans) {
      try {
        const parsedPlans = JSON.parse(storedPlans);
        const hasOldTheme = parsedPlans.some((p: any) => 
          p.title.includes('Beautiful Homes') || 
          p.title.includes('Ad-Sponsor') || 
          p.title.includes('Paint') || 
          p.title.includes('Ad-Plan') ||
          p.title.includes('Special Offer') ||
          p.title.includes('Apex Ultima') ||
          p.title.includes('Royale Luxury') ||
          p.title.includes('Tractor Budget')
        );
        if (!hasOldTheme && parsedPlans.length > 0) {
          loadedPlans = parsedPlans;
        } else {
          localStorage.setItem('adpaint_plans', JSON.stringify(INITIAL_PLANS));
        }
      } catch (e) {
        localStorage.setItem('adpaint_plans', JSON.stringify(INITIAL_PLANS));
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
          localStorage.removeItem('adpaint_purchases');
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
    // If the local state was updated in the last 6 seconds, we defer syncing to prevent clobbering!
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

        // 2. Sync global users list
        let mergedUsers = currentUsersList;
        let usersUpdated = false;
        if (data.usersList && data.usersList.length > 0) {
          const serverUserMap = new Map(data.usersList.map((u: any) => [u.id, u]));
          let hasMissingUser = false;
          
          // Find any users in local memory that aren't on the server yet
          currentUsersList.forEach((localUser: any) => {
            if (!serverUserMap.has(localUser.id)) {
              serverUserMap.set(localUser.id, localUser);
              hasMissingUser = true;
            }
          });
          
          mergedUsers = Array.from(serverUserMap.values());
          
          const isDifferent = JSON.stringify(mergedUsers) !== JSON.stringify(currentUsersList);
          if (isDifferent) {
            setUsersList(mergedUsers);
            localStorage.setItem('adpaint_users_list', JSON.stringify(mergedUsers));
          }
          
          if (activeUser) {
            const latestMe = mergedUsers.find((u: any) => u.id === activeUser.id);
            if (latestMe && JSON.stringify(latestMe) !== JSON.stringify(activeUser)) {
              setUserProfile(latestMe);
              localStorage.setItem('adpaint_user', JSON.stringify(latestMe));
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
          'adpaint_withdraw_time', 'adpaint_cashier_url'
        ];

        const serverConfig = data.config || {};
        keysToSync.forEach(key => {
          const serverVal = serverConfig[key];
          const localVal = localStorage.getItem(key);
          
          if (serverVal) {
            if (localVal !== serverVal) {
              localStorage.setItem(key, serverVal);
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

        // If any local state was missing on the server, push the fully merged states back to restore them!
        if (plansUpdated || usersUpdated || txUpdated || configMismatch) {
          pushStateToServer(activeUser, finalPlans, currentPurchases, mergedTx, mergedUsers);
        }

        // 4. Sync current user's specific purchases list
        if (userId && data.purchases) {
          const isDifferent = JSON.stringify(data.purchases) !== JSON.stringify(currentPurchases);
          if (isDifferent) {
            setPurchases(data.purchases);
            localStorage.setItem(`adpaint_purchases_${userId}`, JSON.stringify(data.purchases));
          }
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
          'adpaint_withdraw_time', 'adpaint_cashier_url'
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
            if (userId) {
              const latestMe = data.usersList.find((u: any) => u.id === userId);
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
      localStorage.removeItem('adpaint_purchases');
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
      if (userId) {
        localStorage.setItem(`adpaint_purchases_${userId}`, JSON.stringify(refinedPurchases));
      }
      localStorage.setItem('adpaint_purchases', JSON.stringify(refinedPurchases));
      setPurchases(refinedPurchases);
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

  // Set up periodic real-time background sync loop and foreground listener
  useEffect(() => {
    if (!isLoggedIn) return;

    // Initial sync upon login/mount
    syncWithServer();

    // Trigger sync when app is brought to foreground (extremely helpful on mobile!)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("App foregrounded. Triggering sync...");
        syncWithServer();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const interval = setInterval(() => {
      syncWithServer();
    }, 8000); // 8 seconds interval provides real-time responsiveness without overloading state or triggering loops

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
      if (typeof u.totalInvested === 'number') {
        return u.totalInvested;
      }
      try {
        const stored = localStorage.getItem(`adpaint_purchases_${u.id}`);
        if (stored) {
          const pur = JSON.parse(stored);
          return pur.reduce((sum: number, p: any) => sum + (p.price || 0), 0);
        }
      } catch (e) {}
      return 0;
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
        phone: u1.phone.substring(0, 7) + '***' + u1.phone.substring(u1.phone.length - 4),
        level: 1,
        dateJoined: new Date(parseInt(u1.id.split('_')[1]) || Date.now()).toISOString().split('T')[0],
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
          phone: u2.phone.substring(0, 7) + '***' + u2.phone.substring(u2.phone.length - 4),
          level: 2,
          dateJoined: new Date(parseInt(u2.id.split('_')[1]) || Date.now()).toISOString().split('T')[0],
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
            phone: u3.phone.substring(0, 7) + '***' + u3.phone.substring(u3.phone.length - 4),
            level: 3,
            dateJoined: new Date(parseInt(u3.id.split('_')[1]) || Date.now()).toISOString().split('T')[0],
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
          const actualElapsed = Math.max(0, (planExpiryTime - lastClaim) / 1000);
          const finalEarn = actualElapsed * earningRatePerSec;
          hasUpdates = true;
          return {
            ...p,
            totalClaimed: p.totalClaimed + finalEarn,
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
    if (!captchaInput) {
      setAuthError('Please enter the verification code');
      return;
    }
    if (captchaInput !== captchaCode) {
      setAuthError('Incorrect Verification Code');
      generateCaptcha(); // regenerate on failure
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
      localStorage.setItem('adpaint_user', JSON.stringify(serverUser));
      localStorage.setItem('adpaint_transactions', JSON.stringify(regData.transactions));
      localStorage.setItem(`adpaint_purchases_${serverUser.id}`, JSON.stringify([]));
      setIsLoggedIn(true);
      setIsWelcomeNoticeOpen(true);
      sessionStorage.setItem('adpaint_welcome_shown', 'true');
      triggerToast('Account Registered Successfully! Enjoy ₹100 Welcome Bonus.', 'success');
      localStorage.removeItem('adpaint_pending_invite_code');

      // Sync users List in background
      syncWithServer(serverUser);

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

    if (!mobileNumber || mobileNumber.length < 10) {
      setAuthError('Please enter a valid mobile number');
      return;
    }
    if (!password || password.length < 6) {
      setAuthError('Password must be at least 6 characters');
      return;
    }

    const targetPhone = `+91 ${mobileNumber}`;

    try {
      const loginData = await firestoreLogin({ phone: targetPhone, password_entered: password });
      const serverUser = loginData.user;
      const serverPurchases = loginData.purchases;

      setUserProfile(serverUser);
      setPurchases(serverPurchases);
      setTransactions(loginData.transactions);
      localStorage.setItem('adpaint_user', JSON.stringify(serverUser));
      localStorage.setItem('adpaint_transactions', JSON.stringify(loginData.transactions));
      localStorage.setItem(`adpaint_purchases_${serverUser.id}`, JSON.stringify(serverPurchases));

      setIsLoggedIn(true);
      if (serverUser.role !== 'admin') {
        setIsWelcomeNoticeOpen(true);
      }
      sessionStorage.setItem('adpaint_welcome_shown', 'true');
      triggerToast('Welcome back! Logs active.', 'success');

      // Deep sync
      syncWithServer(serverUser);

      // Reset fields
      setMobileNumber('');
      setPassword('');
    } catch (err: any) {
      setAuthError(err.message || 'Server communication error. Please try again.');
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

    const targetPhone = `+91 ${forgotPhone}`;
    
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

    const targetPhone = `+91 ${forgotPhone}`;

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
    if (window.confirm('Are you sure you want to sign out? Your balances are saved in this browser.')) {
      saveStateToStorage(null);
      setIsLoggedIn(false);
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
    }
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

  // Daily Check-In Option
  const handleDailyCheckIn = () => {
    if (!userProfile) return;

    if (userProfile.checkedInToday) {
      triggerToast('Already checked in today! Come back tomorrow.', 'error');
      return;
    }

    const bonusStr = localStorage.getItem('adpaint_daily_bonus');
    const reward = bonusStr ? parseFloat(bonusStr) : 8;
    const updatedUser = {
      ...userProfile,
      balance: userProfile.balance + reward,
      totalEarnings: userProfile.totalEarnings + reward,
      checkedInToday: true,
      lastCheckInDate: new Date().toDateString()
    };

    const checkInTx: TransactionRecord = {
      id: `tx_check_${Date.now()}`,
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
      triggerToast(`Insufficient balance! Redirected to the deposit/recharge section to add ₹${(totalCost - userProfile.balance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`, 'info');
      return;
    }

    // Deduct and add purchase
    const updatedUser = {
      ...userProfile,
      balance: userProfile.balance - totalCost
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
      type: 'purchase',
      amount: totalCost,
      date: new Date().toLocaleString(),
      status: 'success',
      description: `Purchased Advertisement Plan: ${plan.title} (${quantity} Slots)`
    };

    // Update remaining slots on plan
    const updatedPlans = plans.map((p) => {
      if (p.id === plan.id) {
        return { ...p, slotsPurchased: Math.min(p.slotsMax, p.slotsPurchased + quantity) };
      }
      return p;
    });

    saveStateToStorage(updatedUser, updatedPlans, [...purchases, newPurchase], [...transactions, purchaseTx], teamMembers);
    triggerToast(`Success! Purchased ${quantity} Slots of ${plan.title}. Yield accumulating!`, 'success');
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
      balance: userProfile.balance + accrued,
      totalEarnings: userProfile.totalEarnings + accrued
    };

    const updatedPurchases = purchases.map((p) => {
      if (p.id === purchaseId) {
        return {
          ...p,
          totalClaimed: p.totalClaimed + accrued,
          completed: isCompleting ? true : p.completed,
          lastClaimedAt: new Date(claimUntil).toISOString()
        };
      }
      return p;
    });

    const claimTx: TransactionRecord = {
      id: `tx_claim_${Date.now()}`,
      type: 'claim',
      amount: accrued,
      date: new Date().toLocaleString(),
      status: 'success',
      description: `Claimed accrued advertisement rewards from: ${purchase.planTitle}${isCompleting ? ' (Plan Completed)' : ''}`
    };

    saveStateToStorage(updatedUser, plans, updatedPurchases, [...transactions, claimTx], teamMembers);
    triggerToast(
      isCompleting 
        ? `Successfully claimed final ₹${accrued.toFixed(2)} ad revenues! Investment completed.` 
        : `Successfully claimed ₹${accrued.toFixed(2)} ad revenues!`, 
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
    try {
      await setDoc(doc(db, "transactions", rechargeTx.id), cleanUndefined(rechargeTx));
    } catch (err) {
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
      console.error("Direct deposit write to Firestore failed:", err);
    }

    saveStateToStorage(userProfile, plans, purchases, [...transactions, rechargeTx], teamMembers);
    triggerToast(`Recharge of ₹${amount.toFixed(2)} submitted! Waiting for Admin verification.`, 'info');
  };

  // Withdraw Submission
  const handleWithdrawRequest = async (amount: number, pin: string) => {
    if (!userProfile) return;

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
    try {
      await setDoc(doc(db, "transactions", withdrawTx.id), cleanUndefined(withdrawTx));
      await setDoc(doc(db, "users", updatedUser.id), cleanUndefined(updatedUser));
    } catch (err) {
      console.error("Direct withdrawal write to Firestore failed:", err);
    }

    saveStateToStorage(updatedUser, plans, purchases, [...transactions, withdrawTx], teamMembers);
    triggerToast(`Withdrawal of ₹${amount.toFixed(2)} requested! Waiting for Admin clearance.`, 'info');
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
              onClose={handleLogout}
              triggerToast={triggerToast}
              onUpdateCurrentUserProfile={(profile) => {
                saveStateToStorage(profile);
              }}
              onSyncConfig={() => {
                pushStateToServer(userProfile, plans, purchases, transactions, usersList);
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
                    const tgSupport = localStorage.getItem('adpaint_tg_support') || 'https://t.me/PropertyN_Support';
                    window.open(tgSupport, '_blank');
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1, y: [0, -6, 0] }}
                  transition={{
                    scale: { type: 'spring', damping: 15 },
                    y: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                  }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute bottom-24 right-5 z-40 w-14 h-14 rounded-full border-2 border-white shadow-[0_8px_30px_rgba(124,58,237,0.3)] overflow-hidden cursor-pointer active:scale-95 transition-transform"
                >
                  <img
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256"
                    alt="Customer Support"
                    className="w-full h-full object-cover pointer-events-none"
                    referrerPolicy="no-referrer"
                  />
                  {/* Pulsing online badge indicator */}
                  <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
                </motion.button>
              )}

              {/* Bottom Navigation rail (Matches screenshot 1 & 4 layout exactly!) */}
              <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 flex items-center justify-around pt-2 pb-6 md:pb-2 px-1.5 z-40 shadow-[0_-8px_24px_rgba(15,23,42,0.06)]">
                {[
                  { id: 'home', label: 'Home', icon: Home },
                  { id: 'invite', label: 'Invite', icon: Gift },
                  { id: 'team', label: 'Team', icon: Users },
                  { id: 'profile', label: 'Profile', icon: User }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isSelected = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className="flex flex-col items-center justify-center flex-1 py-0.5 group cursor-pointer select-none"
                    >
                      <div className={`p-1.5 rounded-xl transition-all duration-300 relative ${
                        isSelected
                          ? 'bg-gradient-to-br from-emerald-500 via-teal-600 to-teal-700 text-white shadow-[0_5px_12px_rgba(109,40,217,0.35),inset_0_1px_1px_rgba(255,255,255,0.4),0_1px_2px_rgba(0,0,0,0.1)] scale-[1.08] border-t border-white/25'
                          : 'text-slate-400 group-hover:text-slate-600 hover:bg-slate-50'
                      }`}>
                        <Icon className="w-4.5 h-4.5 transition-transform group-active:scale-90" />
                        {isSelected && (
                          <span className="absolute -top-0.5 -right-0.5 flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-300 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-400"></span>
                          </span>
                        )}
                      </div>
                      <span className={`text-[9px] font-black mt-1 tracking-wider uppercase transition-all duration-200 ${
                        isSelected ? 'text-teal-600 font-extrabold scale-105' : 'text-slate-400 group-hover:text-slate-500'
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
          /* AUTHENTICATION PORTAL - Styled exactly like the shared screenshot, fully optimized for mobile devices */
          <div ref={scrollContainerRef} className="flex-1 bg-gradient-to-b from-teal-700 via-teal-800 to-teal-950 text-white flex flex-col justify-between relative overflow-y-auto scrollbar-none">
            {/* Subtle background overlay dots */}
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none z-0"></div>
            
            {/* Elegant spacing at the top (PropertyN brand logo and name re-added as requested) */}
            <div className="text-center pt-8 pb-5 z-10 px-6 relative flex flex-col items-center">
              {/* Premium Logo Ring Icon */}
              <div className="w-14 h-14 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/15 mb-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-md">
                  <Home className="w-5.5 h-5.5 stroke-[2.5]" />
                </div>
              </div>
              <h1 className="text-2xl font-black tracking-[0.15em] text-white font-sans uppercase">
                Property<span className="text-emerald-400">N</span>
              </h1>
              <p className="text-[10px] text-teal-100 font-extrabold tracking-widest mt-1 uppercase opacity-90">
                {authTab === 'login' ? 'Secure Member Login' : 'Create your account in seconds'}
              </p>
            </div>

            {/* Main Curved White Card Container (rounded-t-[3rem] for luxurious visual rhythm) */}
            <div className="bg-white text-slate-800 rounded-t-[3rem] px-6 pt-8 pb-6 flex-1 flex flex-col justify-between space-y-6 z-10 relative shadow-[0_-12px_40px_rgba(15,23,42,0.12)]">
              
              {/* Sleek Switch Toggle (Matches Screenshot 2's pill tabs) */}
              <div className="p-1.5 bg-emerald-50/50 border border-emerald-100/50 rounded-3xl flex relative shrink-0 shadow-inner">
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('login');
                    setAuthError('');
                  }}
                  className={`flex-1 py-3.5 text-xs font-black rounded-2xl transition-all duration-300 relative z-10 ${
                    authTab === 'login'
                      ? 'text-white'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {authTab === 'login' && (
                    <motion.div
                      layoutId="authActiveBg"
                      className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl shadow-lg shadow-emerald-200 -z-10"
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    />
                  )}
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('register');
                    setAuthError('');
                  }}
                  className={`flex-1 py-3.5 text-xs font-black rounded-2xl transition-all duration-300 relative z-10 ${
                    authTab === 'register'
                      ? 'text-white'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {authTab === 'register' && (
                    <motion.div
                      layoutId="authActiveBg"
                      className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl shadow-lg shadow-emerald-200 -z-10"
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    />
                  )}
                  Register
                </button>
              </div>

              {/* Form implementation */}
              {authTab === 'forgot' ? (
                /* FORGOT PASSWORD SIMULATION FORM */
                <form 
                  onSubmit={
                    forgotStep === 1 
                      ? handleForgotRequestOtp 
                      : forgotStep === 2 
                      ? handleForgotVerifyOtp 
                      : handleForgotResetPassword
                  } 
                  className="space-y-4 text-left flex-1 flex flex-col justify-center"
                >
                  <div className="text-center pb-1">
                    <span className="text-[10px] bg-teal-50 text-teal-700 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                      Step {forgotStep} of 3: {forgotStep === 1 ? "Verify Number" : forgotStep === 2 ? "Enter OTP" : "Set New Password"}
                    </span>
                  </div>

                  {forgotStep === 1 && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-teal-950/60 uppercase tracking-widest block px-1">REGISTERED MOBILE NUMBER</label>
                      <div className="relative flex items-center bg-emerald-50/30 border border-emerald-100/60 rounded-[1.25rem] p-1.5 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:bg-white transition-all shadow-inner">
                        <div className="w-12 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100/80 flex items-center justify-center font-black text-xs shrink-0 font-mono">
                          +91
                        </div>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          value={forgotPhone}
                          onChange={(e) => setForgotPhone(e.target.value.replace(/\D/g, ''))}
                          placeholder="10-digit number"
                          className="flex-1 pl-3.5 pr-4 py-2.5 bg-transparent text-xs font-black text-slate-800 placeholder-slate-400 focus:outline-none font-mono tracking-wider"
                        />
                      </div>
                    </div>
                  )}

                  {forgotStep === 2 && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-teal-950/60 uppercase tracking-widest block px-1">ENTER 4-DIGIT SECURITY OTP</label>
                      <div className="relative flex items-center bg-emerald-50/30 border border-emerald-100/60 rounded-[1.25rem] p-1.5 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:bg-white transition-all shadow-inner">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-100">
                          <ShieldCheck className="w-4.5 h-4.5" />
                        </div>
                        <input
                          type="text"
                          required
                          maxLength={4}
                          value={forgotOtpInput}
                          onChange={(e) => setForgotOtpInput(e.target.value.replace(/\D/g, ''))}
                          placeholder="4-digit OTP"
                          className="flex-1 pl-3.5 pr-4 py-2.5 bg-transparent text-xs font-black text-slate-800 placeholder-slate-400 focus:outline-none font-mono text-center tracking-[0.25em]"
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium text-center mt-1">
                        We sent a simulated OTP code to your phone. Check the top notifications toast or look at: <strong className="text-teal-600 font-mono text-xs">{forgotOtpCode}</strong>
                      </p>
                    </div>
                  )}

                  {forgotStep === 3 && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-teal-950/60 uppercase tracking-widest block px-1">SET NEW PASSWORD</label>
                      <div className="relative flex items-center bg-emerald-50/30 border border-emerald-100/60 rounded-[1.25rem] p-1.5 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:bg-white transition-all shadow-inner">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-100">
                          <Lock className="w-4.5 h-4.5" />
                        </div>
                        <input
                          type={showForgotNewPassword ? 'text' : 'password'}
                          required
                          value={forgotNewPassword}
                          onChange={(e) => setForgotNewPassword(e.target.value)}
                          placeholder="Min 6 characters"
                          className="flex-1 pl-3.5 pr-10 py-2.5 bg-transparent text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none font-mono tracking-widest"
                        />
                        <button
                          type="button"
                          onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                          className="absolute right-3.5 text-emerald-400 hover:text-emerald-600 transition-colors"
                        >
                          {showForgotNewPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {authError && (
                    <motion.p
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-xs font-black text-rose-500 text-center bg-rose-50 border border-rose-100 py-2.5 px-3 rounded-xl mt-2"
                    >
                      ⚠️ {authError}
                    </motion.p>
                  )}

                  <button
                    type="submit"
                    className="w-full py-4 rounded-[1.5rem] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer select-none uppercase tracking-widest mt-4"
                  >
                    <UserCheck className="w-4.5 h-4.5" />
                    <span>
                      {forgotStep === 1 
                        ? 'Request Verification OTP' 
                        : forgotStep === 2 
                        ? 'Verify Code' 
                        : 'Update New Password'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab('login');
                      setAuthError('');
                      setForgotStep(1);
                      setShowForgotNewPassword(false);
                    }}
                    className="w-full py-3.5 text-xs font-black text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/50 rounded-[1.25rem] flex items-center justify-center gap-2 transition-all cursor-pointer mt-1"
                  >
                    Back to Login
                  </button>
                </form>
              ) : (
                <form onSubmit={authTab === 'login' ? handleLogin : handleRegister} className="space-y-4 text-left flex-1 flex flex-col justify-center">
                
                {/* Full name (Register only) */}
                {authTab === 'register' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-teal-950/60 uppercase tracking-widest block px-1">FULL NAME</label>
                    <div className="relative flex items-center bg-emerald-50/30 border border-emerald-100/60 rounded-[1.25rem] p-1.5 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:bg-white transition-all shadow-inner">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-100">
                        <User className="w-4.5 h-4.5" />
                      </div>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter your full name"
                        className="flex-1 pl-3.5 pr-4 py-2.5 bg-transparent text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Mobile number */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-teal-950/60 uppercase tracking-widest block px-1">MOBILE NUMBER</label>
                  <div className="relative flex items-center bg-emerald-50/30 border border-emerald-100/60 rounded-[1.25rem] p-1.5 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:bg-white transition-all shadow-inner">
                    <div className="w-12 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100/80 flex items-center justify-center font-black text-xs shrink-0 font-mono">
                      +91
                    </div>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="10-digit number"
                      className="flex-1 pl-3.5 pr-4 py-2.5 bg-transparent text-xs font-black text-slate-800 placeholder-slate-400 focus:outline-none font-mono tracking-wider"
                    />
                  </div>
                </div>

                {/* Verification Code / Captcha Verification */}
                {authTab === 'register' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-teal-950/60 uppercase tracking-widest block px-1">VERIFICATION CODE</label>
                    <div className="grid grid-cols-12 gap-2.5 items-center">
                      <div className="col-span-7 relative flex items-center bg-emerald-50/30 border border-emerald-100/60 rounded-[1.25rem] p-1 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:bg-white transition-all shadow-inner">
                        <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-100">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          required
                          maxLength={4}
                          value={captchaInput}
                          onChange={(e) => setCaptchaInput(e.target.value.replace(/\D/g, ''))}
                          placeholder="Enter code"
                          className="flex-1 pl-1.5 pr-1 py-2 bg-transparent text-xs font-black text-slate-800 placeholder-slate-400 focus:outline-none text-center font-sans focus:font-mono tracking-normal focus:tracking-[0.12em] placeholder:tracking-normal placeholder:font-sans"
                        />
                      </div>
                      <div className="col-span-5">
                        <div 
                          onClick={generateCaptcha}
                          title="Click to refresh captcha"
                          className="h-13 bg-gradient-to-r from-emerald-600 via-teal-600 to-teal-700 text-white rounded-[1.25rem] flex items-center justify-center gap-1.5 font-mono font-black text-base tracking-widest relative overflow-hidden select-none cursor-pointer hover:shadow-lg hover:shadow-teal-200 active:scale-95 transition-all shadow-md border border-teal-500/20 px-2 group"
                        >
                          {/* Captcha Background Pattern Effect */}
                          <div className="absolute inset-0 opacity-15 bg-[repeating-linear-gradient(45deg,#000,#000_10px,#fff_10px,#fff_20px)] pointer-events-none"></div>
                          <span className="relative drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] animate-pulse">{captchaCode}</span>
                          <RefreshCw className="w-3.5 h-3.5 text-teal-200 group-hover:rotate-180 transition-transform duration-500 shrink-0" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Password Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-teal-950/60 uppercase tracking-widest block px-1">
                    {authTab === 'register' ? 'CREATE PASSWORD' : 'PASSWORD'}
                  </label>
                  <div className="relative flex items-center bg-emerald-50/30 border border-emerald-100/60 rounded-[1.25rem] p-1.5 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:bg-white transition-all shadow-inner">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-100">
                      <Lock className="w-4.5 h-4.5" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="flex-1 pl-3.5 pr-10 py-2.5 bg-transparent text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none font-mono tracking-widest"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 text-emerald-400 hover:text-emerald-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                </div>

                {authTab === 'login' && (
                  <div className="flex justify-end px-1 -mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthTab('forgot');
                        setAuthError('');
                        setForgotStep(1);
                      }}
                      className="text-[10px] font-black text-teal-600 hover:text-teal-800 transition-colors cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

                {/* Invitation Code (Register only) */}
                {authTab === 'register' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-teal-950/60 uppercase tracking-widest block px-1">INVITATION CODE (OPTIONAL)</label>
                    <div className="relative flex items-center bg-emerald-50/30 border border-emerald-100/60 rounded-[1.25rem] p-1.5 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:bg-white transition-all shadow-inner">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-100">
                        <Gift className="w-4.5 h-4.5" />
                      </div>
                      <input
                        type="text"
                        value={invitationCode}
                        onChange={(e) => setInvitationCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter invite code"
                        className="flex-1 pl-3.5 pr-4 py-2.5 bg-transparent text-xs font-extrabold text-slate-800 placeholder-slate-400 focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                )}

                {authError && (
                  <motion.p
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-xs font-black text-rose-500 text-center bg-rose-50 border border-rose-100 py-2.5 px-3 rounded-xl mt-2"
                  >
                    ⚠️ {authError}
                  </motion.p>
                )}

                <button
                  type="submit"
                  className="w-full py-4 rounded-[1.5rem] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer select-none uppercase tracking-widest mt-4"
                >
                  <UserCheck className="w-4.5 h-4.5" />
                  <span>{authTab === 'login' ? 'Login Now' : 'Create Account'}</span>
                </button>
              </form>
            )}

            </div>

            {/* Bottom SSL Safe Protection Indicator */}
            <div className="flex items-center justify-center gap-1.5 text-[9px] text-teal-200/75 font-extrabold tracking-widest uppercase z-10 relative py-3 select-none">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>SSL Secure Encryption Protected</span>
            </div>
          </div>
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
                triggerToast('Go to "Bank Account" to bind your payout card.', 'info');
              }}
              hasPurchasedPlan={purchases.length > 0}
              transactions={transactions}
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


      </div>
    </div>
  );
}
