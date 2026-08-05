/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BankAccount {
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  ifscCode: string;
}

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  balance: number;
  totalEarnings: number;
  dailyEarned: number;
  checkedInToday: boolean;
  lastCheckInDate?: string;
  inviteCode: string;
  inviterCode?: string;
  withdrawPassword?: string;
  bankAccount?: BankAccount;
  role?: 'user' | 'admin';
  password?: string;
  status?: 'active' | 'blocked';
  totalInvested?: number;
  createdAt?: string;
  registrationDate?: string;
  deviceInfo?: string;
  avatar?: string;
  kycStatus?: 'none' | 'pending' | 'verified' | 'rejected';
  kycIdType?: string;
  kycIdNumber?: string;
  kycDocBase64?: string;
  notifications?: { id: string; title: string; body: string; date: string; read: boolean }[];
}

export interface InvestmentPlan {
  id: string;
  type: 'daily' | 'vip';
  title: string;
  price: number;
  dailyIncome: number;
  durationDays: number;
  totalProfit: number;
  image: string;
  slotsMax: number;
  slotsPurchased: number;
}

export interface PurchaseRecord {
  id: string;
  userId?: string; // Optional so it matches existing local storage gracefully, but populated for firestore syncing
  userPhone?: string;
  planId: string;
  planTitle: string;
  price: number;
  dailyIncome: number;
  durationDays: number;
  datePurchased: string;
  lastClaimedAt: string; // ISO string, we accrue every second!
  totalClaimed: number;
  completed: boolean;
}

export type TransactionType = 'recharge' | 'withdraw' | 'checkin' | 'commission' | 'claim' | 'purchase';

export interface TransactionRecord {
  id: string;
  type: TransactionType;
  amount: number;
  date: string;
  status: 'success' | 'pending' | 'failed';
  description: string;
  utr?: string;
  proofImage?: string;
  userId?: string;
  userPhone?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  phone: string;
  level: 1 | 2 | 3;
  dateJoined: string;
  totalInvested: number;
  commissionEarned: number;
}

export interface LiveNotification {
  id: string;
  text: string;
  time: string;
}

export function isSponsorMatch(sponsor: UserProfile, inviterCode?: string): boolean {
  if (!sponsor || !inviterCode) return false;
  const codeClean = String(inviterCode).trim().toLowerCase();
  if (!codeClean) return false;

  // 1. Direct match with sponsor's inviteCode
  if (sponsor.inviteCode && String(sponsor.inviteCode).trim().toLowerCase() === codeClean) {
    return true;
  }
  // 2. Direct match with sponsor's user ID
  if (sponsor.id && String(sponsor.id).trim().toLowerCase() === codeClean) {
    return true;
  }
  // 3. Match 10-digit phone number
  const sponsorDigits = sponsor.phone ? String(sponsor.phone).replace(/\D/g, '').slice(-10) : '';
  const inviterDigits = codeClean.replace(/\D/g, '').slice(-10);
  if (sponsorDigits && inviterDigits && sponsorDigits.length >= 10 && inviterDigits.length >= 10 && sponsorDigits === inviterDigits) {
    return true;
  }
  return false;
}

export function validateUserProfile(profile: Partial<UserProfile>): UserProfile {
  const safeNumber = (val: any, fallback = 0): number => {
    const num = Number(val);
    return typeof num === 'number' && !isNaN(num) && isFinite(num) && num >= 0 ? num : fallback;
  };

  const cleanPhone = String(profile.phone || '').trim();
  const rawDigits = cleanPhone.replace(/\D/g, '').slice(-10);
  const formattedPhone = cleanPhone.startsWith('+91')
    ? cleanPhone
    : (rawDigits.length >= 10 ? `+91 ${rawDigits}` : cleanPhone || '+91 0000000000');

  const id = String(profile.id || (rawDigits ? `usr_${rawDigits}` : 'usr_guest')).trim();

  return {
    ...profile,
    id,
    name: String(profile.name || 'User').trim(),
    phone: formattedPhone,
    email: profile.email ? String(profile.email).trim() : undefined,
    balance: safeNumber(profile.balance, 0),
    totalEarnings: safeNumber(profile.totalEarnings, 0),
    dailyEarned: safeNumber(profile.dailyEarned, 0),
    checkedInToday: Boolean(profile.checkedInToday),
    lastCheckInDate: profile.lastCheckInDate ? String(profile.lastCheckInDate) : undefined,
    inviteCode: String(profile.inviteCode || Math.floor(10000 + Math.random() * 90000)).trim(),
    inviterCode: profile.inviterCode ? String(profile.inviterCode).trim() : undefined,
    withdrawPassword: profile.withdrawPassword ? String(profile.withdrawPassword) : undefined,
    bankAccount: profile.bankAccount ? {
      bankName: String(profile.bankAccount.bankName || ''),
      accountHolder: String(profile.bankAccount.accountHolder || ''),
      accountNumber: String(profile.bankAccount.accountNumber || ''),
      ifscCode: String(profile.bankAccount.ifscCode || '')
    } : undefined,
    role: profile.role === 'admin' ? 'admin' : 'user',
    password: profile.password ? String(profile.password) : 'password123',
    status: profile.status === 'blocked' ? 'blocked' : 'active',
    totalInvested: safeNumber(profile.totalInvested, 0),
    createdAt: profile.createdAt ? String(profile.createdAt) : new Date().toISOString(),
    registrationDate: profile.registrationDate ? String(profile.registrationDate) : new Date().toISOString(),
    deviceInfo: profile.deviceInfo ? String(profile.deviceInfo) : undefined,
    avatar: profile.avatar ? String(profile.avatar) : undefined,
    kycStatus: (['none', 'pending', 'verified', 'rejected'].includes(profile.kycStatus as string))
      ? profile.kycStatus
      : 'none',
    kycIdType: profile.kycIdType ? String(profile.kycIdType) : undefined,
    kycIdNumber: profile.kycIdNumber ? String(profile.kycIdNumber) : undefined,
    kycDocBase64: profile.kycDocBase64 ? String(profile.kycDocBase64) : undefined,
    notifications: Array.isArray(profile.notifications) ? profile.notifications : []
  };
}

export function validateInvestmentPlan(plan: Partial<InvestmentPlan>): InvestmentPlan {
  const safeNumber = (val: any, fallback = 0): number => {
    const num = Number(val);
    return typeof num === 'number' && !isNaN(num) && isFinite(num) && num >= 0 ? num : fallback;
  };

  const price = safeNumber(plan.price, 0);
  const dailyIncome = safeNumber(plan.dailyIncome, 0);
  const durationDays = Math.max(1, Math.round(safeNumber(plan.durationDays, 1)));
  const totalProfit = safeNumber(plan.totalProfit, dailyIncome * durationDays);
  const slotsMax = Math.max(0, Math.round(safeNumber(plan.slotsMax, 100)));
  const slotsPurchased = Math.max(0, Math.round(safeNumber(plan.slotsPurchased, 0)));

  return {
    id: String(plan.id || `plan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`).trim(),
    type: plan.type === 'vip' ? 'vip' : 'daily',
    title: String(plan.title || 'Investment Plan').trim(),
    price,
    dailyIncome,
    durationDays,
    totalProfit,
    image: String(plan.image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600'),
    slotsMax,
    slotsPurchased
  };
}
