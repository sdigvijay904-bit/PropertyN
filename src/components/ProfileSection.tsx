/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Landmark, Wallet, ChevronRight, User, ShoppingBag, CheckSquare, Banknote, Lock, FileText,
  Building, Download, ArrowLeft, RefreshCw, Eye, EyeOff, Save, CheckCircle2, TrendingUp, AlertTriangle, LogOut, ShieldCheck
} from 'lucide-react';
import { UserProfile, PurchaseRecord, TransactionRecord, BankAccount } from '../types';

interface ProfileSectionProps {
  user: UserProfile;
  purchases: PurchaseRecord[];
  transactions: TransactionRecord[];
  onOpenRecharge: () => void;
  onOpenWithdraw: () => void;
  onClaimOrderEarnings: (purchaseId: string) => void;
  onDailyCheckIn: () => void;
  onUpdateBank: (bank: BankAccount) => void;
  onUpdatePassword: (newPass: string) => void;
  onLogout: () => void;
  onEnterAdminTerminal: () => void;
  triggerToast?: (text: string, type: 'success' | 'info' | 'error') => void;
  onOpenDownloadApp?: () => void;
}

export default function ProfileSection({
  user,
  purchases,
  transactions,
  onOpenRecharge,
  onOpenWithdraw,
  onClaimOrderEarnings,
  onDailyCheckIn,
  onUpdateBank,
  onUpdatePassword,
  onLogout,
  onEnterAdminTerminal,
  triggerToast,
  onOpenDownloadApp
}: ProfileSectionProps) {
  const [subView, setSubView] = useState<'main' | 'orders' | 'bank' | 'password' | 'transactions' | 'about'>('main');
  const [isCertOpen, setIsCertOpen] = useState<boolean>(false);

  // Sum successful recharge transactions
  const totalRecharged = transactions
    .filter((t) => t.type === 'recharge' && t.status === 'success')
    .reduce((sum, t) => sum + t.amount, 0);

  // Bank Form State
  const [bankName, setBankName] = useState<string>(user.bankAccount?.bankName || '');
  const [holderName, setHolderName] = useState<string>(user.bankAccount?.accountHolder || '');
  const [accountNo, setAccountNo] = useState<string>(user.bankAccount?.accountNumber || '');
  const [ifsc, setIfsc] = useState<string>(user.bankAccount?.ifscCode || '');
  const [bankSaved, setBankSaved] = useState<boolean>(false);

  // Password Form State
  const [oldPassword, setOldPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [passwordSaved, setPasswordSaved] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string>('');

  // Local calculation of real-time accrued earnings per active plan
  const [accruedMap, setAccruedMap] = useState<Record<string, number>>({});

  // Periodically compute real-time second-by-second accrued balance for the active plans in the UI
  useEffect(() => {
    const timer = setInterval(() => {
      const updated: Record<string, number> = {};
      purchases.forEach((p) => {
        if (!p.completed) {
          const now = new Date().getTime();
          const lastClaim = new Date(p.lastClaimedAt).getTime();
          const elapsedSecs = Math.max(0, (now - lastClaim) / 1000);
          const perSecondEarnings = p.dailyIncome / 86400;
          const accrued = elapsedSecs * perSecondEarnings;
          updated[p.id] = accrued;
        }
      });
      setAccruedMap(updated);
    }, 1000);

    return () => clearInterval(timer);
  }, [purchases]);

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName || !holderName || !accountNo || !ifsc) return;
    onUpdateBank({
      bankName,
      accountHolder: holderName,
      accountNumber: accountNo,
      ifscCode: ifsc
    });
    setBankSaved(true);
    setTimeout(() => setBankSaved(false), 2500);
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (!newPassword || newPassword.length < 4) {
      setPasswordError('Password must be at least 4 digits');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    onUpdatePassword(newPassword);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordSaved(true);
    setTimeout(() => setPasswordSaved(false), 2500);
  };

  const handleDownloadApp = () => {
    if (onOpenDownloadApp) {
      onOpenDownloadApp();
      return;
    }
    try {
      const configuredApkUrl = localStorage.getItem('adpaint_apk_url') || 'https://raw.githubusercontent.com/adpaint-app/builds/main/PropertyN_Earnings.apk';
      
      if (configuredApkUrl.startsWith('http://') || configuredApkUrl.startsWith('https://')) {
        const link = document.createElement('a');
        link.href = configuredApkUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        if (triggerToast) {
          triggerToast('Downloading PropertyN_Earnings.apk... check your browser downloads!', 'success');
        } else {
          alert('Downloading PropertyN_Earnings.apk... check your browser downloads!');
        }
      } else {
        if (triggerToast) {
          triggerToast('Admin has not configured a valid APK URL in settings.', 'error');
        } else {
          alert('Admin has not configured a valid APK URL in settings.');
        }
      }
    } catch (err) {
      if (triggerToast) {
        triggerToast('Download failed. Please try again or contact support.', 'error');
      } else {
        alert('Download failed. Please try again.');
      }
    }
  };

  const renderContent = () => {
    switch (subView) {
      case 'orders':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <button onClick={() => setSubView('main')} className="p-1 hover:bg-slate-100 rounded-lg">
                <ArrowLeft className="w-5 h-5 text-slate-800" />
              </button>
              <h3 className="text-base font-black text-slate-800">My Advertisement Plans</h3>
            </div>

            {purchases.length > 0 ? (
              <div className="space-y-4">
                {purchases.map((item) => {
                  const accrued = accruedMap[item.id] || 0;
                  const canClaim = accrued > 0.01;
                  return (
                    <div key={item.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                      {/* Plan Summary header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-black text-indigo-950">{item.planTitle}</h4>
                          <p className="text-[10px] text-gray-400 font-sans font-bold mt-0.5">Purchased: {new Date(item.datePurchased).toLocaleDateString()}</p>
                        </div>
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${item.completed ? 'bg-gray-100 text-gray-500' : 'bg-emerald-50 text-emerald-600 animate-pulse'}`}>
                          {item.completed ? 'Completed' : 'Active & Running'}
                        </span>
                      </div>

                      {/* Earnings data grids */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-[9px] font-bold text-gray-400 uppercase block">Daily Yield</span>
                          <span className="text-xs font-black text-indigo-950 font-sans">₹{item.dailyIncome}</span>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-[9px] font-bold text-gray-400 uppercase block">Total Claimed</span>
                          <span className="text-xs font-black text-indigo-950 font-sans">₹{item.totalClaimed.toFixed(2)}</span>
                        </div>
                        <div className="p-2 bg-emerald-50/40 rounded-xl border border-emerald-100/10">
                          <span className="text-[9px] font-bold text-emerald-600 uppercase block">Accruing Now</span>
                          <span className="text-xs font-black text-emerald-600 font-sans animate-pulse">₹{accrued.toFixed(4)}</span>
                        </div>
                      </div>

                      {/* Claim Button */}
                      {!item.completed && (
                        <button
                          type="button"
                          onClick={() => onClaimOrderEarnings(item.id)}
                          disabled={!canClaim}
                          className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 disabled:from-gray-100 disabled:to-gray-150 disabled:text-gray-400 disabled:shadow-none text-white text-xs font-black rounded-xl shadow-md shadow-violet-100 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
                        >
                          <TrendingUp className="w-4 h-4 animate-bounce" />
                          <span>Claim Accumulated ₹{accrued.toFixed(2)}</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-gray-200 flex flex-col items-center justify-center p-5 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-150">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800">No Active Plans Found</p>
                  <p className="text-xs text-gray-400 max-w-[200px] mt-0.5">Please purchase our Special Offer or Product plans on the home screen to start generating daily yields.</p>
                </div>
              </div>
            )}
          </div>
        );

      case 'bank':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <button onClick={() => setSubView('main')} className="p-1 hover:bg-slate-100 rounded-lg">
                <ArrowLeft className="w-5 h-5 text-slate-800" />
              </button>
              <h3 className="text-base font-black text-slate-800">Bind Bank Account Details</h3>
            </div>

            <form onSubmit={handleSaveBank} className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4 text-left">
              <div className="p-3 bg-violet-50/50 border border-violet-100 rounded-2xl mb-2 flex items-start gap-2">
                <Landmark className="w-4 h-4 text-violet-600 mt-0.5" />
                <p className="text-[11px] text-violet-900 font-medium leading-relaxed">
                  Please ensure your IFSC code and Account details are perfectly matched to your Bank Passbook. Verified cards enable instant automated payouts.
                </p>
              </div>

              {/* Bank Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Bank Name</label>
                <input
                  type="text"
                  required
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. State Bank of India, HDFC Bank"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all"
                />
              </div>

              {/* Account Holder Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Account Holder Name</label>
                <input
                  type="text"
                  required
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all"
                />
              </div>

              {/* Account Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Account Number</label>
                <input
                  type="text"
                  required
                  value={accountNo}
                  onChange={(e) => setAccountNo(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 302195028420"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all font-sans"
                />
              </div>

              {/* IFSC Code */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">IFSC Code</label>
                <input
                  type="text"
                  required
                  maxLength={11}
                  value={ifsc}
                  onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                  placeholder="e.g. SBIN0001043"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all font-sans"
                />
              </div>

              {bankSaved && (
                <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-100 flex items-center gap-2">
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
                  <span>Bank details updated and verified successfully!</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-extrabold text-sm rounded-2xl shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
              >
                <Save className="w-4.5 h-4.5" />
                <span>Save Bank Details</span>
              </button>
            </form>
          </div>
        );

      case 'password':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <button onClick={() => setSubView('main')} className="p-1 hover:bg-slate-100 rounded-lg">
                <ArrowLeft className="w-5 h-5 text-slate-800" />
              </button>
              <h3 className="text-base font-black text-slate-800">Change Withdrawal PIN</h3>
            </div>

            <form onSubmit={handleSavePassword} className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4 text-left">
              <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-2xl mb-2 flex items-start gap-2">
                <Lock className="w-4 h-4 text-amber-600 mt-0.5" />
                <p className="text-[11px] text-amber-900 font-medium leading-relaxed">
                  Choose a high safety security PIN or key for confirming payout settlements. Keep this absolutely private to avoid any balance fraud.
                </p>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">New Security PIN</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter min 4 digit security password"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all font-sans"
                />
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Confirm Security PIN</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter security password"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all font-sans"
                />
              </div>

              {passwordError && <p className="text-xs font-semibold text-rose-500 mt-1">{passwordError}</p>}

              {passwordSaved && (
                <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-100 flex items-center gap-2">
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
                  <span>Withdrawal security password updated!</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-extrabold text-sm rounded-2xl shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
              >
                <Save className="w-4.5 h-4.5" />
                <span>Save Password</span>
              </button>
            </form>
          </div>
        );

      case 'transactions':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <button onClick={() => setSubView('main')} className="p-1 hover:bg-slate-100 rounded-lg">
                <ArrowLeft className="w-5 h-5 text-slate-800" />
              </button>
              <h3 className="text-base font-black text-slate-800">Transaction History</h3>
            </div>

            {transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.slice().reverse().map((tx) => (
                  <div key={tx.id} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between text-left">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                        tx.type === 'recharge' || tx.type === 'checkin' || tx.type === 'commission' || tx.type === 'claim'
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-rose-50 text-rose-600'
                      }`}>
                        {tx.type === 'recharge' && <Wallet className="w-4.5 h-4.5" />}
                        {tx.type === 'withdraw' && <Landmark className="w-4.5 h-4.5" />}
                        {tx.type === 'checkin' && <CheckSquare className="w-4.5 h-4.5" />}
                        {tx.type === 'purchase' && <ShoppingBag className="w-4.5 h-4.5" />}
                        {tx.type === 'commission' && <TrendingUp className="w-4.5 h-4.5" />}
                        {tx.type === 'claim' && <Banknote className="w-4.5 h-4.5" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{tx.description}</p>
                        <p className="text-[10px] text-gray-400 font-sans font-bold mt-0.5">{tx.date}</p>
                        {tx.utr && <p className="text-[9px] text-violet-600 font-sans font-bold bg-violet-50 px-1.5 py-0.5 rounded w-max mt-1">Ref: {tx.utr}</p>}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className={`text-sm font-black font-sans ${
                        tx.type === 'recharge' || tx.type === 'checkin' || tx.type === 'commission' || tx.type === 'claim'
                          ? 'text-emerald-600'
                          : 'text-rose-600'
                      }`}>
                        {tx.type === 'recharge' || tx.type === 'checkin' || tx.type === 'commission' || tx.type === 'claim' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                      </p>
                      <span className={`inline-block mt-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        tx.status === 'success' ? 'bg-emerald-50 text-emerald-600' : tx.status === 'pending' ? 'bg-amber-50 text-amber-600 animate-pulse' : 'bg-red-50 text-red-600'
                      }`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-gray-200 p-5">
                <p className="text-sm font-black text-slate-800">No Transactions Found</p>
                <p className="text-xs text-gray-400 mt-0.5">Your recharge and withdraw ledgers will display here.</p>
              </div>
            )}
          </div>
        );

      case 'about':
        return (
          <div className="space-y-5 pb-6">
            <div className="flex items-center gap-2 mb-2">
              <button onClick={() => setSubView('main')} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-slate-800" />
              </button>
              <h3 className="text-base font-black text-slate-800">About PropertyN</h3>
            </div>

            {/* Branded Banner */}
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-6 text-left relative overflow-hidden shadow-lg shadow-indigo-100/50">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
              <div className="relative z-10 space-y-2">
                <span className="px-2.5 py-0.5 bg-amber-400 text-amber-950 font-black text-[9px] uppercase tracking-wider rounded-md">
                  Corporate Registration Approved
                </span>
                <h4 className="text-base font-black tracking-tight text-white font-sans">
                  PropertyN Investment Solutions Pvt. Ltd.
                </h4>
                <p className="text-[10px] text-indigo-200/90 leading-normal font-medium">
                  CIN: U74899DL2025PTC139580 • Registered Office: Connaught Place, New Delhi, Delhi 110001 • MCA Registered Operations
                </p>
              </div>
            </div>

            {/* Company Detailed Overview card */}
            <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm space-y-4 text-left leading-relaxed text-xs text-gray-600 font-medium">
              <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center p-2 mb-2 shadow-inner text-violet-700">
                <Building className="w-6 h-6" />
              </div>

              <h4 className="text-sm font-black text-indigo-950">1. Premium Real-Estate Portfolio Aggregation</h4>
              <p>
                PropertyN operates as a premier digital properties and commercial real-estate sponsorship platform. Registered under the Indian Companies Act, 2013, our corporate registration verifies our authorization to acquire, aggregate, lease, and trade premium commercial and residential land portfolios.
              </p>
              <p>
                Through crowdsourced sponsorship capital, PropertyN manages a diverse portfolio of grade-A office spaces, warehousing networks, digital billboards, and roadside commercial sites. We provide access to commercial real-estate yields with a secure and fully certified digital ledger.
              </p>

              <h4 className="text-sm font-black text-indigo-950 mt-4">2. High-Yield Leaseback & Rental Returns</h4>
              <p>
                The rental yields, lease revenues, and advertising fee collections are pooled on a daily basis. PropertyN distributes these proceeds directly into our sponsors' wallets as **Daily-Income** and **VIP-Income** payouts. Our operations are fully backed by corporate rental agreements and real lease documents with Fortune 500 tech companies and premium retail brands.
              </p>

              <h4 className="text-sm font-black text-indigo-950 mt-4">3. Security, RERA Alignment & Government Approvals</h4>
              <p>
                Every single property listed on the PropertyN application is verified, RERA-approved (Real Estate Regulatory Authority), and legally registered. We maintain a strict Capital Protection Fund to guarantee that your sponsored investments are protected by actual collateralized physical properties.
              </p>
              <p>
                Our platform has been awarded the ISO 9001:2015 certification for Quality Investment Management Systems and the ISO 27001:2022 certification for absolute data and transaction security, ensuring that all payment details, bank records, and personal user wallets are fully secure.
              </p>

              <h4 className="text-sm font-black text-indigo-950 mt-4">4. Property Investment & Sponsoring License</h4>
              <p>
                PropertyN operates with full legal clearance under Ministry of Corporate Affairs (MCA) registration number **U74899DL2025PTC139580**. This authorization certificate empowers our platform to act as a fractional real-estate sponsor and investment conduit across major Indian smart cities.
              </p>
            </div>

            {/* Certificate Highlight Card with dynamic preview and full modal trigger */}
            <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm text-left space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider">OFFICIAL AUTHORITY CERTIFICATION</h4>
                  <p className="text-[10px] text-gray-400 font-bold mt-0.5">Verified Property Investment License Status</p>
                </div>
                <span className="text-[9px] bg-emerald-50 text-emerald-600 font-black px-2 py-0.5 rounded-full uppercase shrink-0">
                  Approved
                </span>
              </div>

              {/* Certificate Miniature Preview Screen */}
              <div 
                onClick={() => setIsCertOpen(true)}
                className="relative bg-slate-50 border border-slate-200/80 rounded-2xl p-4 cursor-pointer hover:border-violet-400 group overflow-hidden transition-all duration-300 shadow-inner select-none active:scale-[0.98]"
              >
                {/* Golden/Double Border Inner Decorative Element */}
                <div className="border-2 border-double border-amber-500/60 p-3 rounded-xl bg-white text-center space-y-1 relative">
                  {/* Watermark symbol */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none">
                    <Building className="w-24 h-24 text-slate-900" />
                  </div>

                  <span className="text-[8px] font-bold text-amber-600 uppercase tracking-widest block">Certificate of Compliance</span>
                  <h5 className="text-[10px] font-black text-indigo-950 leading-tight block">PROPERTYN LEASING SOLUTIONS PRIVATE LIMITED</h5>
                  <p className="text-[7.5px] text-slate-400 leading-normal max-w-xs mx-auto">
                    ISO 9001:2015 &amp; ISO 27001:2022 Certified Real-Estate Portfolio Sponsoring Security and Asset Management Regulations.
                  </p>
                  
                  {/* Simulated signatures & Golden seal mini group */}
                  <div className="flex items-center justify-between pt-3 text-[6px] text-slate-400 font-bold">
                    <span>REG: PR-IN-2025-983</span>
                    <div className="w-5 h-5 rounded-full bg-amber-400/20 border border-amber-500 flex items-center justify-center">
                      <span className="text-[5px] text-amber-700 font-black">PN</span>
                    </div>
                    <span>MCA APPROVED</span>
                  </div>
                </div>

                {/* Hover overlay inviting to view full screen */}
                <div className="absolute inset-0 bg-violet-600/5 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                  <span className="bg-violet-600 text-white font-black text-[10px] px-3.5 py-1.5 rounded-xl shadow-md flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                    View Full Certificate
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCertOpen(true)}
                className="w-full py-3 rounded-[1.25rem] bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-black flex items-center justify-center gap-1.5 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4 text-violet-600" />
                <span>View Full-Screen Certificate (सर्टिफिकेट देखें)</span>
              </button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm text-left">
                <span className="text-[8px] font-black text-violet-600 uppercase tracking-widest block">ISO 9001:2015</span>
                <span className="text-[11px] font-black text-slate-800 block mt-0.5">Quality Audited</span>
                <p className="text-[9px] text-gray-400 mt-1">Platform processes, daily yields, and security payouts audited for maximum operational efficiency.</p>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm text-left">
                <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest block">ISO 27001:2022</span>
                <span className="text-[11px] font-black text-slate-800 block mt-0.5">Data Secured</span>
                <p className="text-[9px] text-gray-400 mt-1">Sponsor accounts, passwords, bank transfers, and wallet balance states are fully SSL-secured.</p>
              </div>
            </div>

            {/* Full Screen Certificate Modal Overlay */}
            <AnimatePresence>
              {isCertOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto"
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 15 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 15 }}
                    className="bg-white max-w-md w-full rounded-[2.5rem] p-5 shadow-2xl relative border-4 border-double border-amber-400 m-auto text-center"
                  >
                    {/* Corner Borders design elements */}
                    <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-amber-600"></div>
                    <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-amber-600"></div>
                    <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-amber-600"></div>
                    <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-amber-600"></div>

                    {/* Watermark Diagonal BG */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] rotate-12 select-none pointer-events-none">
                      <p className="text-3xl font-black tracking-widest text-slate-900">PROPERTYN LEGAL</p>
                    </div>

                    {/* Close button top right */}
                    <button 
                      onClick={() => setIsCertOpen(false)}
                      className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition-colors cursor-pointer text-sm font-bold z-20"
                    >
                      ✕
                    </button>

                    <div className="relative z-10 py-4 space-y-4">
                      {/* Government Approval Seal Logo representation */}
                      <div className="mx-auto w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-500/80 p-1 flex items-center justify-center shadow-lg">
                        <svg viewBox="0 0 100 100" className="w-full h-full text-amber-600" fill="none" stroke="currentColor">
                          <circle cx="50" cy="50" r="42" strokeWidth="4" strokeDasharray="3 3" />
                          <circle cx="50" cy="50" r="34" strokeWidth="2" />
                          <path d="M50,18 L58,40 L82,40 L62,54 L70,78 L50,62 L30,78 L38,54 L18,40 L42,40 Z" fill="currentColor" fillOpacity="0.2" strokeWidth="3" />
                        </svg>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-amber-600 uppercase tracking-[0.25em] block">Certificate of Authorization</span>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-tight">
                          PropertyN Investment Solutions Pvt. Ltd.
                        </h3>
                        <p className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">
                          Corporate Identity No: U74899DL2025PTC139580
                        </p>
                      </div>

                      {/* Certificate Core Statement */}
                      <div className="border-t border-b border-slate-100 py-4 text-xs font-medium text-slate-600 leading-relaxed text-justify px-2 font-serif bg-amber-50/10">
                        <p className="indent-4">
                          This certifies that the platform <strong>PropertyN (PropertyN Investment Solutions Private Limited)</strong> is officially licensed to aggregate crowdsourced advertisement sponsoring, commercial asset leasing allocations, and infrastructure funding programs.
                        </p>
                        <p className="mt-2.5">
                          Under our <strong>Secured Real-Estate Collateralized Ledger</strong>, capital deposits are fully matched with physical commercial assets, high-traffic visual advertisement slot arrays, and retail spaces. All distributed payouts are compliance-verified and SSL-encrypted.
                        </p>
                      </div>

                      {/* Certification Badges Footer inside Modal */}
                      <div className="grid grid-cols-3 gap-2 py-1 text-[8px] font-bold text-slate-500">
                        <div className="p-1 bg-slate-50 rounded-lg border border-slate-100">
                          <span className="text-indigo-600 block">ISO 9001</span>
                          <span>Yield Audited</span>
                        </div>
                        <div className="p-1 bg-slate-50 rounded-lg border border-slate-100">
                          <span className="text-emerald-600 block">ISO 27001</span>
                          <span>Data Secured</span>
                        </div>
                        <div className="p-1 bg-slate-50 rounded-lg border border-slate-100">
                          <span className="text-amber-600 block">MCA</span>
                          <span>Govt Compliant</span>
                        </div>
                      </div>

                      {/* Digital Signatures and Seals */}
                      <div className="flex items-center justify-between pt-4 px-3 border-t border-slate-100">
                        <div className="text-left">
                          <span className="font-serif italic text-indigo-900 text-xs tracking-wide block leading-none font-black">R. Mehta</span>
                          <span className="text-[8px] text-gray-400 block mt-0.5 font-bold uppercase">Director of Operations</span>
                        </div>
                        
                        {/* Golden Verified Seal */}
                        <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-600 text-amber-950 font-black flex flex-col items-center justify-center rounded-full shadow-lg border border-amber-300 relative">
                          <span className="text-[5.5px] tracking-tighter uppercase leading-none text-center">APPROVED</span>
                          <span className="text-[6.5px] leading-none mt-0.5">PLATFORM</span>
                          <div className="absolute inset-0.5 rounded-full border border-amber-300/60 pointer-events-none"></div>
                        </div>

                        <div className="text-right">
                          <span className="font-serif italic text-indigo-900 text-xs tracking-wide block leading-none font-black">Ananya S.</span>
                          <span className="text-[8px] text-gray-400 block mt-0.5 font-bold uppercase">Chief Compliance Officer</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsCertOpen(false);
                          if (triggerToast) {
                            triggerToast('Certificate verified successfully!', 'success');
                          }
                        }}
                        className="w-full mt-4 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-xs rounded-2xl shadow-lg shadow-amber-200 transition-colors uppercase tracking-wider"
                      >
                        ✓ Close Verification Screen
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );

      default:
        return (
          <div className="space-y-6">
            {/* 3D Glassmorphic Stats Grid floating card (Matches Screenshot exactly!) */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_15px_35px_-4px_rgba(0,0,0,0.05)] overflow-hidden text-center relative">
              <div className="grid grid-cols-3 divide-x divide-slate-100 py-6 px-2 relative z-10">
                {/* Balance Column */}
                <div className="flex flex-col items-center justify-center">
                  <div className="w-11 h-11 rounded-[1.1rem] bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center shadow-[0_5px_15px_rgba(99,102,241,0.22)] mb-2 shrink-0 group-hover:scale-105 transition-transform">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-black text-slate-900 tracking-tight block">
                    ₹{user.balance.toFixed(2)}
                  </span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mt-1 block">
                    BALANCE
                  </span>
                </div>

                {/* Recharged Column */}
                <div className="flex flex-col items-center justify-center">
                  <div className="w-11 h-11 rounded-[1.1rem] bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shadow-[0_5px_15px_rgba(245,158,11,0.22)] mb-2 shrink-0">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-black text-slate-900 tracking-tight block">
                    ₹{totalRecharged.toFixed(2)}
                  </span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mt-1 block">
                    RECHARGED
                  </span>
                </div>

                {/* Total Income Column */}
                <div className="flex flex-col items-center justify-center">
                  <div className="w-11 h-11 rounded-[1.1rem] bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center shadow-[0_5px_15px_rgba(16,185,129,0.22)] mb-2 shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-black text-slate-900 tracking-tight block">
                    ₹{user.totalEarnings.toFixed(2)}
                  </span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mt-1 block">
                    TOTAL INCOME
                  </span>
                </div>
              </div>

              {/* Action grid (Recharge & Withdraw side by side with border separator) */}
              <div className="grid grid-cols-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onOpenRecharge}
                  className="py-4.5 flex items-center justify-center gap-2.5 hover:bg-slate-50/50 active:scale-95 transition-all font-black text-xs text-indigo-600 border-r border-slate-100 cursor-pointer group"
                >
                  <Wallet className="w-4.5 h-4.5 text-indigo-500 group-hover:scale-110 transition-transform" />
                  <span>Recharge</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenWithdraw}
                  className="py-4.5 flex items-center justify-center gap-2.5 hover:bg-slate-50/50 active:scale-95 transition-all font-black text-xs text-emerald-600 cursor-pointer group"
                >
                  <Landmark className="w-4.5 h-4.5 text-emerald-500 group-hover:scale-110 transition-transform" />
                  <span>Withdraw</span>
                </button>
              </div>
            </div>

            {/* Title with left accent bar */}
            <div className="flex items-center gap-2 text-left mt-2">
              <div className="w-1.5 h-5 bg-indigo-600 rounded-full shadow-sm"></div>
              <span className="text-sm font-black text-indigo-950 uppercase tracking-wider">My Account</span>
            </div>

            {/* Account List details with color coded 3D icons */}
            <div className="bg-white rounded-[2rem] border border-slate-100/80 shadow-[0_12px_40px_rgba(0,0,0,0.03)] overflow-hidden text-left">
              <div className="divide-y divide-slate-100/50">
                {[
                  ...(user.role === 'admin' ? [{ label: 'Admin Panel Control Room', desc: 'Manage users, approvals, plans, & notifications', icon: ShieldCheck, action: onEnterAdminTerminal, highlight: true, grad: 'from-purple-500 to-indigo-600' }] : []),
                  { label: 'My Orders', desc: 'Earnings & active plans', icon: ShoppingBag, action: () => setSubView('orders'), badge: purchases.filter(p => !p.completed).length || undefined, grad: 'from-emerald-400 to-teal-500' },
                  { label: 'Daily Check-in', desc: 'Check in daily to earn free rewards', icon: CheckSquare, action: onDailyCheckIn, highlight: !user.checkedInToday, grad: 'from-indigo-400 to-violet-600' },
                  { label: 'Bank Account', desc: 'Bank details & withdrawal settings', icon: Landmark, action: () => setSubView('bank'), verified: !!user.bankAccount, grad: 'from-amber-400 to-orange-500' },
                  { label: 'Password', desc: 'Password & Security', icon: Lock, action: () => setSubView('password'), grad: 'from-sky-400 to-blue-500' },
                  { label: 'Transaction Records', desc: 'Full recharge & withdrawal history', icon: FileText, action: () => setSubView('transactions'), grad: 'from-pink-400 to-rose-500' },
                  { label: 'About Company', desc: 'Our story, ad sponsors & information', icon: Building, action: () => setSubView('about'), grad: 'from-slate-400 to-slate-600' },
                  { label: 'Download App', desc: 'Get the latest Android APK build package', icon: Download, action: handleDownloadApp, grad: 'from-rose-400 to-pink-500' }
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      onClick={item.action}
                      type="button"
                      className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50/40 transition-colors group text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-[0_4px_10px_-2px_rgba(0,0,0,0.1),_inset_0_1px_0_rgba(255,255,255,0.4)] bg-gradient-to-br ${item.grad} text-white`}>
                          <Icon className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-slate-800">{item.label}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{item.desc}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.badge && (
                          <span className="bg-violet-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full shadow-sm shadow-violet-200">
                            {item.badge}
                          </span>
                        )}
                        {item.highlight && (
                          <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full animate-bounce shadow-sm shadow-amber-200">
                            Claim Free
                          </span>
                        )}
                        {item.verified && (
                          <span className="bg-emerald-50 text-emerald-600 text-[9px] font-black px-2.5 py-0.5 rounded-full border border-emerald-100">
                            Bound
                          </span>
                        )}
                        <ChevronRight className="w-4.5 h-4.5 text-slate-300 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Logout Option */}
            <button
              onClick={onLogout}
              type="button"
              className="w-full py-4.5 bg-rose-50 hover:bg-rose-100/60 text-rose-600 rounded-2xl font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition-all border border-rose-200/40 cursor-pointer shadow-sm"
            >
              <LogOut className="w-4.5 h-4.5" />
              <span>Log Out / Sign Out Account</span>
            </button>
          </div>
        );
    }
  };

  return (
    <div className="pb-24">
      {/* Header Banner only when in main subview */}
      {subView === 'main' && (
        <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-700 text-white pt-8 pb-16 px-6 rounded-b-[2.5rem] shadow-md relative overflow-hidden">
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-white/5 rounded-full blur-xl translate-x-6 -translate-y-6"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-xl -translate-x-6 translate-y-6"></div>
          
          <div className="flex items-center gap-4 relative z-10 text-left">
            {/* Premium branded avatar/logo matching PropertyN style exactly */}
            <div className="w-16 h-16 rounded-[1.25rem] bg-white shadow-[0_8px_20px_rgba(0,0,0,0.06)] flex flex-col items-center justify-center p-2 shrink-0 border border-slate-100/50">
              <div className="flex items-center gap-0.5">
                <span className="text-[17px] font-black tracking-tighter bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">P</span>
                <span className="text-[17px] font-black tracking-tighter bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">N</span>
              </div>
              <span className="text-[7.5px] font-black text-slate-500 tracking-wider uppercase -mt-0.5 block">PropertyN</span>
            </div>

            <div>
              <h2 className="text-lg font-black tracking-tight flex items-center gap-1.5 text-white">
                ID : {user.phone.substring(0, 6)}**{user.phone.substring(user.phone.length - 2)}
              </h2>
              {/* VIP Member pill badge with golden dot */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-[10px] font-bold text-white/95 border border-white/10 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                <span>VIP Member</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main viewport */}
      <div className={`mx-4 ${subView === 'main' ? '-mt-10 relative z-20' : 'mt-5'}`}>
        {renderContent()}
      </div>
    </div>
  );
}
