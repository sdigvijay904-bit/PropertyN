/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, Wallet, TrendingUp, ShieldCheck, Check, X, Edit2, Plus, Trash2, Search,
  ArrowDownLeft, ArrowUpRight, Award, Landmark, RefreshCw, Send, Sparkles, Database, FileText, QrCode, Smartphone, LogOut
} from 'lucide-react';
import { UserProfile, InvestmentPlan, TransactionRecord } from '../types';


interface AdminSectionProps {
  currentProfile: UserProfile | null;
  usersList: UserProfile[];
  setUsersList: React.Dispatch<React.SetStateAction<UserProfile[]>>;
  plans: InvestmentPlan[];
  setPlans: React.Dispatch<React.SetStateAction<InvestmentPlan[]>>;
  transactions: TransactionRecord[];
  setTransactions: React.Dispatch<React.SetStateAction<TransactionRecord[]>>;
  onClose: () => void;
  triggerToast: (text: string, type?: 'success' | 'info' | 'error') => void;
  onUpdateCurrentUserProfile: (profile: UserProfile) => void;
  onSyncConfig?: () => void;
}

export default function AdminSection({
  currentProfile,
  usersList,
  setUsersList,
  plans,
  setPlans,
  transactions,
  setTransactions,
  onClose,
  triggerToast,
  onUpdateCurrentUserProfile,
  onSyncConfig
}: AdminSectionProps) {
  const [adminTab, setAdminTab] = useState<'stats' | 'users' | 'approvals' | 'plans' | 'custom_notif' | 'upi_config'>('stats');
  
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

  // Telegram Config states
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

  const pendingRecharges = transactions.filter(t => t.type === 'recharge' && t.status === 'pending');
  const pendingWithdrawals = transactions.filter(t => t.type === 'withdraw' && t.status === 'pending');

  // Approve Recharge Handler
  const handleApproveRecharge = (txId: string) => {
    const tx = transactions.find(t => t.id === txId);
    if (!tx) return;

    // Find the user associated with this transaction
    const targetUserId = tx.userId;
    const targetUser = usersList.find(u => u.id === targetUserId);

    if (!targetUser) {
      triggerToast('User not found for this recharge.', 'error');
      return;
    }

    // 1. Update user balance
    const updatedUsers = usersList.map(u => {
      if (u.id === targetUserId) {
        const updated = {
          ...u,
          balance: u.balance + tx.amount,
          totalEarnings: u.totalEarnings + tx.amount
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

    // Handle affiliate commission (10% standard Lvl 1 commission) if the user was invited
    let finalUsers = updatedUsers;
    if (targetUser.inviterCode) {
      const inviter = usersList.find(u => u.inviteCode === targetUser.inviterCode);
      if (inviter) {
        const comm = tx.amount * 0.10;
        finalUsers = updatedUsers.map(u => {
          if (u.id === inviter.id) {
            const updatedInviter = {
              ...u,
              balance: u.balance + comm,
              totalEarnings: u.totalEarnings + comm
            };
            if (currentProfile && u.id === currentProfile.id) {
              onUpdateCurrentUserProfile(updatedInviter);
            }
            return updatedInviter;
          }
          return u;
        });

        // Add a commission transaction
        const commissionTx: TransactionRecord = {
          id: `tx_comm_${Date.now()}`,
          type: 'commission',
          amount: comm,
          date: new Date().toLocaleString(),
          status: 'success',
          description: `Lvl 1 Commission credited from +91 ${targetUser.phone.replace('+91 ', '')} recharge`,
          userId: inviter.id,
          userPhone: inviter.phone
        };
        updatedTx.unshift(commissionTx);
      }
    }

    setUsersList(finalUsers);
    setTransactions(updatedTx);
    
    localStorage.setItem('adpaint_users_list', JSON.stringify(finalUsers));
    localStorage.setItem('adpaint_transactions', JSON.stringify(updatedTx));
    
    triggerToast(`Approved ₹${tx.amount} recharge for +91 ${targetUser.phone.replace('+91 ', '')}`, 'success');
  };

  // Reject Recharge Handler
  const handleRejectRecharge = (txId: string) => {
    const updatedTx = transactions.map(t => {
      if (t.id === txId) {
        return { ...t, status: 'failed' as const, description: `Recharge rejected by Admin (invalid UTR)` };
      }
      return t;
    });

    setTransactions(updatedTx);
    localStorage.setItem('adpaint_transactions', JSON.stringify(updatedTx));
    triggerToast('Recharge request rejected.', 'info');
  };

  // Approve Withdrawal Handler
  const handleApproveWithdrawal = (txId: string) => {
    const tx = transactions.find(t => t.id === txId);
    if (!tx) return;

    // Mark transaction as success
    const updatedTx = transactions.map(t => {
      if (t.id === txId) {
        return { ...t, status: 'success' as const, description: `Settled bank transfer successfully` };
      }
      return t;
    });

    setTransactions(updatedTx);
    localStorage.setItem('adpaint_transactions', JSON.stringify(updatedTx));
    triggerToast(`Withdrawal of ₹${tx.amount} approved and settled!`, 'success');
  };

  // Reject Withdrawal Handler (Refunds amount back to user's wallet!)
  const handleRejectWithdrawal = (txId: string) => {
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

    setUsersList(updatedUsers);
    setTransactions(updatedTx);

    localStorage.setItem('adpaint_users_list', JSON.stringify(updatedUsers));
    localStorage.setItem('adpaint_transactions', JSON.stringify(updatedTx));

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

    triggerToast(`User account status updated to ${nextStatus.toUpperCase()}!`, 'success');
    setEditingUser(updatedUsers.find(u => u.id === editingUser.id) || null);
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

    if (editingPlan) {
      // Editing existing plan
      const updatedPlans = plans.map(p => {
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

      setPlans(updatedPlans);
      localStorage.setItem('adpaint_plans', JSON.stringify(updatedPlans));
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

      const updatedPlans = [...plans, newPlan];
      setPlans(updatedPlans);
      localStorage.setItem('adpaint_plans', JSON.stringify(updatedPlans));
      triggerToast('New Advertisement Plan published live!', 'success');
    }

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
      const updatedPlans = plans.filter(p => p.id !== planId);
      setPlans(updatedPlans);
      localStorage.setItem('adpaint_plans', JSON.stringify(updatedPlans));
      triggerToast('Advertisement plan deleted.', 'info');
    }
  };

  // Push Live Ticker Alert
  const handlePushTicker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tickerMessage.trim()) return;

    // We can simulate updating the live ticker in the host component by adding it
    localStorage.setItem('adpaint_custom_ticker', tickerMessage.trim());
    onSyncConfig?.();
    triggerToast('Custom alert injected! It will show up on client screens.', 'success');
    setTickerMessage('');
  };

  // Filter users by search query
  const filteredUsers = usersList.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.phone.includes(searchQuery) ||
    (u.inviteCode && u.inviteCode.includes(searchQuery)) ||
    (u.inviterCode && u.inviterCode.includes(searchQuery))
  );

  const getDownlineTree = (targetUser: UserProfile) => {
    const list: { id: string; name: string; phone: string; level: number; totalInvested: number; inviterName: string }[] = [];
    
    // Level 1: referred directly by current user
    const level1Users = usersList.filter(u => u.inviterCode === targetUser.inviteCode);
    level1Users.forEach(u1 => {
      list.push({
        id: u1.id,
        name: u1.name,
        phone: u1.phone,
        level: 1,
        totalInvested: u1.totalInvested || 0,
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
          totalInvested: u2.totalInvested || 0,
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
            totalInvested: u3.totalInvested || 0,
            inviterName: u2.name
          });
        });
      });
    });

    return list;
  };

  return (
    <div className="flex-1 bg-slate-900 text-slate-100 flex flex-col h-full min-h-screen">
      
      {/* Admin Top Banner */}
      <div className="bg-gradient-to-r from-violet-700 via-purple-700 to-indigo-800 p-5 rounded-b-[2rem] shadow-xl border-b border-indigo-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-sm">
              <Database className="w-5 h-5 text-indigo-200 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-emerald-500/90 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-widest text-[8px]">ROOT SERVER</span>
                <span className="text-[10px] text-indigo-200 font-mono">v4.9-Stable</span>
              </div>
              <h2 className="text-lg font-black tracking-tight text-white mt-0.5 uppercase">Admin Control Room</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900/40 hover:bg-slate-900/60 border border-slate-700/50 rounded-2xl text-[10px] font-black uppercase tracking-wider text-slate-200 transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span>Sign Out</span>
          </button>
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
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-900/30 border border-violet-500/20'
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
                    <Users className="w-4 h-4 text-violet-400" />
                  </div>
                  <div className="mt-2.5">
                    <span className="text-2xl font-black font-mono tracking-tight text-white">{totalUsers}</span>
                    <p className="text-[9px] text-slate-500 font-medium mt-1">Sponsors registered</p>
                  </div>
                </div>

                {/* Stat 2 */}
                <div className="bg-slate-850 p-4 rounded-3xl border border-slate-800 flex flex-col justify-between shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Deposited</span>
                    <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="mt-2.5">
                    <span className="text-xl font-black font-mono tracking-tight text-emerald-400">₹{totalDeposited.toFixed(2)}</span>
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
                    <span className="text-xl font-black font-mono tracking-tight text-rose-400">₹{totalWithdrawn.toFixed(2)}</span>
                    <p className="text-[9px] text-slate-500 font-medium mt-1">Paid settlement claims</p>
                  </div>
                </div>

                {/* Stat 4 */}
                <div className="bg-slate-850 p-4 rounded-3xl border border-slate-800 flex flex-col justify-between shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">User Ledgers</span>
                    <Wallet className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="mt-2.5">
                    <span className="text-xl font-black font-mono tracking-tight text-white">₹{systemTotalBalance.toFixed(2)}</span>
                    <p className="text-[9px] text-slate-500 font-medium mt-1">Total outstanding liabilities</p>
                  </div>
                </div>
              </div>

              {/* Server health check logs */}
              <div className="bg-slate-950/60 p-4 rounded-[1.8rem] border border-slate-850 font-mono space-y-2">
                <h4 className="text-[10px] text-indigo-400 font-black uppercase tracking-wider flex items-center gap-1.5">
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
              <div className="bg-gradient-to-r from-violet-950/40 to-indigo-950/40 p-4 rounded-3xl border border-violet-900/20 space-y-3">
                <h4 className="text-xs font-black text-violet-300 flex items-center gap-1.5">
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
              {/* Search Bar */}
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Search user by name or +91 phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-slate-600 transition-all font-mono"
                />
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

                  {/* Balance Adjustment Form */}
                  <form onSubmit={handleAdjustBalance} className="space-y-3.5">
                    <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">Adjust Wallet Funds</h5>
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
                          className="w-full pl-8 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-violet-500 font-mono"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider"
                      >
                        Apply
                      </button>
                    </div>
                  </form>

                  {/* Bank Details Config Form (Override channel) */}
                  <div className="space-y-3.5 pt-4 border-t border-slate-800">
                    <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">Bank Account Override</h5>
                    
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
                        <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Account Number</label>
                        <input
                          type="text"
                          value={editAccountNumber}
                          onChange={(e) => setEditAccountNumber(e.target.value)}
                          placeholder="12 digit account no"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-[11px] font-bold text-white font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">IFSC Code</label>
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
                    <h5 className="text-[10px] font-black text-violet-400 uppercase tracking-widest block">User Credentials & Role</h5>
                    
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
                      <Check className="w-4 h-4 text-violet-400" />
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
                            ? 'यह उपयोगकर्ता निलंबित है और लॉगिन नहीं कर सकता।' 
                            : 'यह उपयोगकर्ता सक्रिय है और सामान्य रूप से निवेश व निकासी कर सकता है।'}
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

                  {/* Summary Indicators */}
                  <div className="pt-4 border-t border-slate-800 grid grid-cols-2 gap-2 text-center">
                    <div className="bg-slate-950/40 p-2.5 rounded-2xl border border-slate-900">
                      <p className="text-[9px] text-slate-500 font-bold uppercase">Balance</p>
                      <span className="text-xs font-black text-white font-mono">₹{editingUser.balance.toFixed(2)}</span>
                    </div>
                    <div className="bg-slate-950/40 p-2.5 rounded-2xl border border-slate-900">
                      <p className="text-[9px] text-slate-500 font-bold uppercase">Total Earned</p>
                      <span className="text-xs font-black text-indigo-300 font-mono">₹{editingUser.totalEarnings.toFixed(2)}</span>
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
                      return (
                        <div
                          key={user.id}
                          className={`p-4 bg-slate-850 rounded-3xl border ${
                            isCurrent ? 'border-violet-600/60' : 'border-slate-800/80'
                          } flex items-center justify-between shadow-md`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-white">{user.name}</span>
                              {isCurrent && (
                                <span className="bg-violet-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                  Current Session
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] font-mono text-slate-400 mt-0.5 flex flex-wrap items-center gap-1.5">
                              <span>{user.phone}</span>
                              {user.password && (
                                <span className="bg-slate-900/80 border border-violet-500/20 text-amber-300 px-2 py-0.5 rounded-lg text-[9px] font-bold tracking-wider flex items-center gap-1">
                                  <span>🔑</span>
                                  <span className="font-mono text-slate-100 select-all">{user.password}</span>
                                </span>
                              )}
                            </p>

                            {/* Referral Info */}
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              <span className="text-[9px] bg-slate-900 border border-slate-800 text-indigo-300 px-1.5 py-0.5 rounded-lg font-mono">
                                My Code: <strong className="text-white font-black">{user.inviteCode}</strong>
                              </span>
                              {user.inviterCode ? (
                                <span className="text-[9px] bg-indigo-950/40 border border-indigo-900/40 text-emerald-300 px-1.5 py-0.5 rounded-lg font-mono flex items-center gap-1">
                                  <span>👤 Sponsor:</span>
                                  <strong className="text-emerald-400 font-black">{user.inviterCode}</strong>
                                  {(() => {
                                    const sponsor = usersList.find(u => u.inviteCode === user.inviterCode);
                                    return sponsor ? `(${sponsor.name})` : '';
                                  })()}
                                </span>
                              ) : (
                                <span className="text-[9px] bg-slate-900/40 border border-slate-800 text-slate-500 px-1.5 py-0.5 rounded-lg font-mono">
                                  Direct Register
                                </span>
                              )}
                            </div>
                            
                            {/* Short stats badge */}
                            <div className="flex items-center gap-2.5 mt-2">
                              <span className="text-[10px] font-mono text-slate-300">
                                Bal: <strong className="text-white">₹{user.balance.toFixed(0)}</strong>
                              </span>
                              <span className="text-[10px] font-mono text-slate-500">|</span>
                              <span className="text-[10px] font-mono text-slate-400">
                                Earn: <strong className="text-indigo-400">₹{user.totalEarnings.toFixed(0)}</strong>
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1.5 shrink-0">
                            <button
                              onClick={() => handleOpenUserEdit(user)}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-[10px] font-black uppercase text-indigo-300 rounded-xl transition-all flex items-center justify-center gap-1 border border-slate-700/50 cursor-pointer w-24 font-sans"
                            >
                              <Edit2 className="w-2.5 h-2.5" />
                              <span>Manage</span>
                            </button>
                            <button
                              onClick={() => setViewingReferralsUser(user)}
                              className="px-3 py-1.5 bg-violet-950/40 hover:bg-violet-900/40 text-[10px] font-black uppercase text-emerald-400 rounded-xl transition-all flex items-center justify-center gap-1 border border-violet-900/30 cursor-pointer w-24 font-sans"
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
              {/* Part 1: Pending Deposits (Recharges) */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                  <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                  <span>Pending Deposit Recharges ({pendingRecharges.length})</span>
                </h3>

                {pendingRecharges.length === 0 ? (
                  <div className="p-5 bg-slate-850 rounded-3xl border border-slate-800/80 text-center text-slate-500 text-xs font-bold">
                    No pending deposit claims at the moment.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {pendingRecharges.map(tx => {
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
                            <span className="text-sm font-black text-emerald-400 font-mono">₹{tx.amount.toFixed(2)}</span>
                          </div>

                          {tx.utr && (
                            <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-900/80 flex items-center justify-between">
                              <span className="text-[9px] text-slate-500 font-bold uppercase font-mono">UTR Reference</span>
                              <span className="text-xs font-black text-indigo-300 font-mono select-all">{tx.utr}</span>
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
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-rose-400" />
                  <span>Pending Payout Settlements ({pendingWithdrawals.length})</span>
                </h3>

                {pendingWithdrawals.length === 0 ? (
                  <div className="p-5 bg-slate-850 rounded-3xl border border-slate-800/80 text-center text-slate-500 text-xs font-bold">
                    No pending payouts at the moment.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {pendingWithdrawals.map(tx => {
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
                            <span className="text-sm font-black text-rose-400 font-mono">₹{tx.amount.toFixed(2)}</span>
                          </div>

                          {/* Bank Details Display */}
                          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-900/80 space-y-1.5">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-slate-500 font-bold uppercase font-mono">Bank Name</span>
                              <span className="text-white font-extrabold">{user?.bankAccount?.bankName || 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-slate-500 font-bold uppercase font-mono">Holder</span>
                              <span className="text-white font-extrabold">{user?.bankAccount?.accountHolder || 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-slate-500 font-bold uppercase font-mono">A/C No</span>
                              <span className="text-indigo-300 font-bold font-mono select-all">{user?.bankAccount?.accountNumber || 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-slate-500 font-bold uppercase font-mono">IFSC</span>
                              <span className="text-indigo-300 font-bold font-mono select-all">{user?.bankAccount?.ifscCode || 'N/A'}</span>
                            </div>
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
                              className="flex-1 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-1 transition-all cursor-pointer"
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
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
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
                      className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer mt-3"
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
                      className="px-3.5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all active:scale-95"
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
                            <span>Days: <strong className="text-indigo-400">{p.durationDays}</strong></span>
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
                            className="p-1.5 hover:bg-slate-800 text-indigo-400 rounded-lg transition-colors cursor-pointer"
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
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                  <Send className="w-4 h-4 text-violet-400" />
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
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500 placeholder:text-slate-600 transition-all font-sans"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Push Live Alert Ticker</span>
                  </button>
                </form>
              </div>

              {/* Ticker history/recommendations */}
              <div className="bg-slate-950/40 p-4 rounded-3xl border border-slate-900 font-sans space-y-2.5">
                <h4 className="text-[10px] text-indigo-400 font-black uppercase tracking-wider">Useful Admin Ticker Presets</h4>
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
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-violet-400" />
                  <span>Configure UPI Scanner & Merchant ID</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                  यहाँ से आप रीचार्ज गेटवे (Recharge Gateway) में उपयोग होने वाली UPI ID और मर्चेंट का नाम बदल सकते हैं। 
                  जब उपयोगकर्ता पैसे जमा करेंगे, तो उन्हें यही UPI और नाम दिखाई देगा।
                </p>

                <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold">Current UPI ID:</span>
                    <span className="font-mono text-emerald-400 font-black">{savedUpiId}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold">Current Name:</span>
                    <span className="font-bold text-violet-300">{savedUpiName}</span>
                  </div>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!upiIdInput.trim() || !upiNameInput.trim()) {
                    triggerToast('All fields are required', 'error');
                    return;
                  }
                  localStorage.setItem('adpaint_upi_id', upiIdInput.trim());
                  localStorage.setItem('adpaint_upi_name', upiNameInput.trim());
                  localStorage.setItem('adpaint_cashier_url', '');
                  setSavedUpiId(upiIdInput.trim());
                  setSavedUpiName(upiNameInput.trim());
                  setSavedCashierUrl('');
                  onSyncConfig?.();
                  triggerToast('UPI settings updated successfully!', 'success');
                }} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Merchant UPI ID (e.g. upi@bank)</label>
                    <input
                      type="text"
                      required
                      value={upiIdInput}
                      onChange={(e) => setUpiIdInput(e.target.value)}
                      placeholder="e.g. propertyn@upi"
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500 placeholder:text-slate-600 transition-all font-sans"
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
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500 placeholder:text-slate-600 transition-all font-sans"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
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
                  यहाँ से आप उपयोगकर्ताओं के लिए Telegram Channel और Telegram Support (Customer Service) का लिंक बदल सकते हैं। 
                  जब वे "Channel" या "Service" बटन पर क्लिक करेंगे, तो वे इसी लिंक पर रीडायरेक्ट होंगे।
                </p>

                <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold">Current Telegram Channel:</span>
                    <span className="font-mono text-emerald-400 font-black truncate max-w-[180px]">
                      {savedTgChannel}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold">Current Support Chat:</span>
                    <span className="font-mono text-violet-300 font-black truncate max-w-[180px]">
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
                  localStorage.setItem('adpaint_tg_channel', tgChannelInput.trim());
                  localStorage.setItem('adpaint_tg_support', tgSupportInput.trim());
                  setSavedTgChannel(tgChannelInput.trim());
                  setSavedTgSupport(tgSupportInput.trim());
                  onSyncConfig?.();
                  triggerToast('Telegram settings updated successfully!', 'success');
                }} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Telegram Channel Link (e.g. https://t.me/channel)</label>
                    <input
                      type="text"
                      required
                      value={tgChannelInput}
                      onChange={(e) => setTgChannelInput(e.target.value)}
                      placeholder="e.g. https://t.me/PropertyN_99"
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500 placeholder:text-slate-600 transition-all font-sans"
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
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500 placeholder:text-slate-600 transition-all font-sans"
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
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-violet-400" />
                  <span>Configure Android App APK Download URL</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                  यहाँ से आप उपयोगकर्ताओं के लिए आधिकारिक एंड्रॉइड एप्लिकेशन (.apk) का डाउनलोड लिंक बदल सकते हैं। 
                  जब उपयोगकर्ता प्रोफाइल सेक्शन में "App Download" बटन पर क्लिक करेंगे, तो वे इसी लिंक से रियल APK फ़ाइल डाउनलोड कर पाएंगे।
                </p>

                <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold">Current APK URL:</span>
                    <span className="font-mono text-indigo-400 font-black truncate max-w-[180px]">
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
                  onSyncConfig?.();
                  triggerToast('APK Download Link updated successfully!', 'success');
                }} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">APK Download URL (e.g. https://domain.com/app.apk)</label>
                    <input
                      type="text"
                      required
                      value={apkUrlInput}
                      onChange={(e) => setApkUrlInput(e.target.value)}
                      placeholder="e.g. https://domain.com/PropertyN_Earnings.apk"
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500 placeholder:text-slate-600 transition-all font-sans font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save APK Download URL</span>
                  </button>
                </form>
              </div>

              {/* System Config & Thresholds Card */}
              <div className="bg-slate-850 p-5 rounded-[2rem] border border-slate-800 space-y-4">
                <h3 className="text-xs font-black text-violet-400 uppercase tracking-widest flex items-center gap-2">
                  <Database className="w-4 h-4 text-violet-400" />
                  <span>Configure Thresholds, Presets & Bonuses</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                  यहाँ से आप न्यूनतम निकासी (Min Withdraw), न्यूनतम रीचार्ज (Min Recharge), रीचार्ज के विकल्प (Preset Prices), दैनिक चेक-इन बोनस (Daily Bonus) और प्लेटफार्म का नाम बदल सकते हैं।
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
                      <span className="text-indigo-400 font-black">₹{savedMinRecharge}</span>
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

                  onSyncConfig?.();

                  triggerToast('System thresholds & presets saved successfully!', 'success');
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
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500 placeholder:text-slate-600 transition-all font-sans"
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
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500 placeholder:text-slate-600 transition-all font-sans"
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
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500 placeholder:text-slate-600 transition-all font-sans"
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
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500 placeholder:text-slate-600 transition-all font-sans"
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
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500 placeholder:text-slate-600 transition-all"
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
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500 placeholder:text-slate-600 transition-all font-sans"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Thresholds & Presets</span>
                  </button>
                </form>
              </div>

              {/* Security Guidance */}
              <div className="bg-slate-950/40 p-4 rounded-3xl border border-slate-900 font-sans space-y-2.5">
                <h4 className="text-[10px] text-indigo-400 font-black uppercase tracking-wider">UPI & Telegram Configuration Guide</h4>
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
                <div className="bg-gradient-to-r from-violet-700 via-indigo-700 to-indigo-800 p-5 border-b border-indigo-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-xl">
                      <Users className="w-5 h-5 text-indigo-200" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white">{viewingReferralsUser.name}'s Downline</h3>
                      <p className="text-[10px] font-mono text-indigo-200">Code: {viewingReferralsUser.inviteCode}</p>
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

                    return (
                      <>
                        {/* Summary stats */}
                        <div className="grid grid-cols-2 gap-3 text-left">
                          <div className="bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800/60">
                            <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider">Total Network Size</p>
                            <p className="text-lg font-black text-white mt-1">{downlines.length} Members</p>
                          </div>
                          <div className="bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800/60">
                            <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider">Network Investment</p>
                            <p className="text-lg font-black text-emerald-400 mt-1">₹{totalNetworkInvested.toLocaleString('en-IN')}</p>
                          </div>
                        </div>

                        {/* Levels rendering */}
                        {downlines.length === 0 ? (
                          <div className="text-center py-12 bg-slate-950/25 rounded-3xl border border-dashed border-slate-800/60 flex flex-col items-center justify-center space-y-2">
                            <Users className="w-8 h-8 text-slate-700" />
                            <p className="text-xs font-black text-slate-500 uppercase tracking-wider">No Downline Accounts</p>
                            <p className="text-[10px] text-slate-600 max-w-[200px] mx-auto text-center font-medium font-sans">
                              This user has not referred any accounts yet. (इस उपयोगकर्ता ने अभी तक कोई अकाउंट रेफर नहीं किया है।)
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4 text-left">
                            {/* Level 1 Block */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-[10px] uppercase font-black tracking-wider text-violet-400 bg-violet-950/20 border border-violet-900/30 px-3 py-1.5 rounded-xl">
                                <span>Level 1 (Direct Referred)</span>
                                <span>{l1.length} Accounts</span>
                              </div>
                              <div className="space-y-2 pl-2">
                                {l1.length === 0 ? (
                                  <p className="text-[10px] text-slate-600 italic">None</p>
                                ) : (
                                  l1.map(u => (
                                    <div key={u.id} className="bg-slate-850 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
                                      <div>
                                        <p className="text-xs font-black text-slate-200">{u.name}</p>
                                        <p className="text-[9px] font-mono text-slate-500 mt-0.5">{u.phone}</p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-[10px] font-bold text-slate-400">Invested: <strong className="text-slate-200 font-mono">₹{u.totalInvested.toLocaleString('en-IN')}</strong></p>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>

                            {/* Level 2 Block */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-[10px] uppercase font-black tracking-wider text-indigo-400 bg-indigo-950/20 border border-indigo-900/30 px-3 py-1.5 rounded-xl">
                                <span>Level 2 (Indirect)</span>
                                <span>{l2.length} Accounts</span>
                              </div>
                              <div className="space-y-2 pl-2">
                                {l2.length === 0 ? (
                                  <p className="text-[10px] text-slate-600 italic">None</p>
                                ) : (
                                  l2.map(u => (
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
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>

                            {/* Level 3 Block */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-[10px] uppercase font-black tracking-wider text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 px-3 py-1.5 rounded-xl">
                                <span>Level 3 (Indirect)</span>
                                <span>{l3.length} Accounts</span>
                              </div>
                              <div className="space-y-2 pl-2">
                                {l3.length === 0 ? (
                                  <p className="text-[10px] text-slate-600 italic">None</p>
                                ) : (
                                  l3.map(u => (
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
                                      </div>
                                    </div>
                                  ))
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

        </AnimatePresence>
      </div>
    </div>
  );
}
