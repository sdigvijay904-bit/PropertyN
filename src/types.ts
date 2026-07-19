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
