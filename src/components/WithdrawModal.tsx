/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Landmark, Lock, HelpCircle, CheckCircle2, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { UserProfile, BankAccount, TransactionRecord, PurchaseRecord } from '../types';

interface WithdrawModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onWithdrawRequest: (amount: number, withdrawPass: string) => void;
  onOpenBankConfig: () => void;
  onUpdateBank?: (bank: BankAccount) => void;
  hasPurchasedPlan: boolean;
  transactions: TransactionRecord[];
  purchases?: PurchaseRecord[];
}

export default function WithdrawModal({
  user,
  isOpen,
  onClose,
  onWithdrawRequest,
  onOpenBankConfig,
  onUpdateBank,
  hasPurchasedPlan,
  transactions,
  purchases = []
}: WithdrawModalProps) {
  const [amountInput, setAmountInput] = useState<string>('');
  const [withdrawPassword, setWithdrawPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Bank Binding Inline State
  const [isBindingBank, setIsBindingBank] = useState<boolean>(false);
  const [bankNameInput, setBankNameInput] = useState<string>(user.bankAccount?.bankName || '');
  const [holderNameInput, setHolderNameInput] = useState<string>(user.bankAccount?.accountHolder || '');
  const [accountNoInput, setAccountNoInput] = useState<string>(user.bankAccount?.accountNumber || '');
  const [ifscInput, setIfscInput] = useState<string>(user.bankAccount?.ifscCode || '');
  const [bankError, setBankError] = useState<string>('');

  React.useEffect(() => {
    if (user.bankAccount) {
      setBankNameInput(user.bankAccount.bankName || '');
      setHolderNameInput(user.bankAccount.accountHolder || '');
      setAccountNoInput(user.bankAccount.accountNumber || '');
      setIfscInput(user.bankAccount.ifscCode || '');
    }
  }, [user.bankAccount]);

  const minimumWithdraw = parseFloat(localStorage.getItem('adpaint_min_withdrawal') || '120');

  // Filter user-specific transactions
  const userTx = transactions.filter(
    (t) => (t.userId && t.userId === user.id) || (t.userPhone && t.userPhone === user.phone)
  );

  // Sum actual claimed income from successful claim transactions for THIS user
  const totalClaimedFromTx = userTx
    .filter((t) => t.type === 'claim' && t.status === 'success')
    .reduce((sum, t) => sum + t.amount, 0);

  // Plan Yield is strictly the actual claimed plan earnings matching Total Income on Home/Profile
  const totalPlanEarnings = hasPurchasedPlan
    ? ((user.totalEarnings !== undefined && user.totalEarnings >= 0) ? user.totalEarnings : totalClaimedFromTx)
    : 0;

  // Sum successful/pending withdraw transactions for THIS user
  const totalWithdrawnAmount = userTx
    .filter((t) => t.type === 'withdraw' && (t.status === 'success' || t.status === 'pending'))
    .reduce((sum, t) => sum + t.amount, 0);

  const maxWithdrawablePlanEarnings = Math.max(0, totalPlanEarnings - totalWithdrawnAmount);
  // Withdrawable limit is strictly the plan earnings earned minus withdrawn amount (only plan income can be withdrawn)
  const withdrawableLimit = hasPurchasedPlan ? maxWithdrawablePlanEarnings : 0;

  const handleSaveBankInline = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setBankError('');
    if (!bankNameInput.trim()) {
      setBankError('Bank name is required');
      return;
    }
    if (!holderNameInput.trim()) {
      setBankError('Account holder name is required');
      return;
    }
    if (!accountNoInput.trim()) {
      setBankError('Account number is required');
      return;
    }
    if (!ifscInput.trim()) {
      setBankError('IFSC code is required');
      return;
    }

    const bankObj: BankAccount = {
      bankName: bankNameInput.trim(),
      accountHolder: holderNameInput.trim(),
      accountNumber: accountNoInput.trim(),
      ifscCode: ifscInput.trim().toUpperCase()
    };

    if (onUpdateBank) {
      onUpdateBank(bankObj);
    }
    setIsBindingBank(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!hasPurchasedPlan) {
      setError('Withdrawal Locked: You must buy at least one Real Estate Fund to unlock withdrawals!');
      return;
    }

    const amount = parseFloat(amountInput);
    if (isNaN(amount) || amount < minimumWithdraw) {
      setError(`Minimum withdrawal amount is ₹${minimumWithdraw}`);
      return;
    }

    if (amount > withdrawableLimit) {
      const fmtMax = Math.floor(withdrawableLimit).toLocaleString('en-IN');
      setError(`निकासी सीमा पार: प्लान लेने के बाद प्लान से जो कुल आय होगी, वही निकासी होगी। आपकी उपलब्ध निकासी योग्य सीमा ₹${fmtMax} है। (Withdrawal limit exceeded: Only income earned from plans can be withdrawn. Your current withdrawable limit is ₹${fmtMax}.)`);
      return;
    }

    if (!user.bankAccount) {
      setError('Please configure your bank account details first!');
      return;
    }

    if (!withdrawPassword) {
      setError('Please enter your withdrawal password');
      return;
    }

    // Optional password verification simulation (at least 6 characters)
    if (withdrawPassword.length < 4) {
      setError('Password must be at least 4 digits');
      return;
    }

    setIsSubmitting(true);

    // Simulate submission delay
    setTimeout(() => {
      setIsSubmitting(false);
      onWithdrawRequest(amount, withdrawPassword);
      setAmountInput('');
      setWithdrawPassword('');
      onClose();
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-xl">
                <Landmark className="w-5 h-5 text-emerald-200" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Withdraw Funds</h3>
                <p className="text-xs text-emerald-200">Safe, secure bank transfer</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="overflow-y-auto p-5 flex-1 space-y-5">
            {/* Balance Details Panel */}
            <div className="space-y-3 bg-emerald-50/50 border border-emerald-100/80 p-4 rounded-3xl">
              <div className="flex justify-between items-center pb-2.5 border-b border-emerald-100/50">
                <div>
                  <span className="text-[10px] font-black text-emerald-600 block uppercase tracking-widest">Withdrawable Limit / निकासी योग्य दैनिक आय</span>
                  <span className="text-2xl font-black text-emerald-950 font-sans">₹{Math.floor(withdrawableLimit).toLocaleString('en-IN')}</span>
                </div>
                <div className="bg-emerald-100/80 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="text-[9px] font-black text-emerald-800 uppercase tracking-wider">Settlement</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="bg-white/75 p-2 rounded-2xl border border-emerald-100/30">
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block">Wallet Balance</span>
                  <span className="text-xs font-extrabold text-slate-800 block mt-0.5">₹{Math.floor(user.balance).toLocaleString('en-IN')}</span>
                </div>
                <div className="bg-white/75 p-2 rounded-2xl border border-emerald-100/30">
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block">Plan Yield</span>
                  <span className="text-xs font-extrabold text-teal-700 block mt-0.5">₹{Math.floor(totalPlanEarnings).toLocaleString('en-IN')}</span>
                </div>
                <div className="bg-white/75 p-2 rounded-2xl border border-emerald-100/30">
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block">Withdrawn</span>
                  <span className="text-xs font-extrabold text-rose-600 block mt-0.5">₹{Math.floor(totalWithdrawnAmount).toLocaleString('en-IN')}</span>
                </div>
              </div>
              <p className="text-[9.5px] text-emerald-700 font-bold text-center mt-1">
                * Note: प्लान लेने के बाद प्लान से जो कुल आय होगी वही विड्रॉल होगी (Only total income earned from plans can be withdrawn)
              </p>
            </div>

            {/* Withdrawal Lock Alert if no plans purchased */}
            {!hasPurchasedPlan && (
              <div className="p-4 rounded-2xl border border-dashed border-rose-200 bg-rose-50/70 text-rose-950 space-y-2 flex flex-col items-center text-center">
                <span className="text-[11px] font-black uppercase text-rose-600 tracking-wider flex items-center gap-1 bg-white px-2.5 py-0.5 rounded-full border border-rose-100">
                  Withdrawal Locked 🔒
                </span>
                <p className="text-xs font-black leading-snug">
                  आप केवल तभी पैसे निकाल सकते हैं जब आपने कोई रियल एस्टेट फंड (Plan) खरीदा हो।
                </p>
                <p className="text-[11.5px] text-rose-700 font-medium">
                  Withdrawals are locked because you do not have an active Real Estate investment. Please buy at least one plan on the Home screen to unlock withdrawals.
                </p>
              </div>
            )}

            {/* Bank Card Status */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Destination Bank Account</label>
                {!isBindingBank && (
                  <button
                    type="button"
                    onClick={() => setIsBindingBank(true)}
                    className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
                  >
                    {user.bankAccount ? 'Change Card' : '+ Bind Bank Card'}
                  </button>
                )}
              </div>

              {isBindingBank ? (
                <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 space-y-3 text-left">
                  <div className="flex justify-between items-center pb-2 border-b border-emerald-200/60">
                    <span className="text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Landmark className="w-3.5 h-3.5 text-emerald-600" />
                      Bind Bank Account Card
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsBindingBank(false);
                        setBankError('');
                      }}
                      className="text-[11px] font-bold text-slate-500 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                  </div>

                  {bankError && (
                    <p className="text-[11px] font-extrabold text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-100">
                      ⚠️ {bankError}
                    </p>
                  )}

                  <div>
                    <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">Bank Name</label>
                    <input
                      type="text"
                      value={bankNameInput}
                      onChange={(e) => setBankNameInput(e.target.value)}
                      placeholder="e.g. State Bank of India, HDFC, ICICI, PNB"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500 outline-none mt-0.5"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">Account Holder Name</label>
                    <input
                      type="text"
                      value={holderNameInput}
                      onChange={(e) => setHolderNameInput(e.target.value)}
                      placeholder="Name as printed on Bank Passbook"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500 outline-none mt-0.5"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">Account Number</label>
                      <input
                        type="text"
                        value={accountNoInput}
                        onChange={(e) => setAccountNoInput(e.target.value.replace(/\D/g, ''))}
                        placeholder="Bank A/C Number"
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500 outline-none mt-0.5 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">IFSC Code</label>
                      <input
                        type="text"
                        value={ifscInput}
                        onChange={(e) => setIfscInput(e.target.value.toUpperCase())}
                        placeholder="e.g. SBIN0001234"
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500 outline-none mt-0.5 font-mono uppercase"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveBankInline}
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer mt-1"
                  >
                    Save & Bind Bank Card
                  </button>
                </div>
              ) : user.bankAccount ? (
                <div className="p-4 rounded-2xl border border-gray-150 bg-gray-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <Landmark className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{user.bankAccount.bankName}</p>
                      <p className="text-xs text-gray-500 font-sans font-bold">
                        A/C: {user.bankAccount.accountNumber.replace(/.(?=.{4})/g, '*')}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsBindingBank(true)}
                    className="text-xs font-bold text-gray-500 hover:text-emerald-600 cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-2xl border border-dashed border-red-200 bg-red-50/30 flex flex-col items-center text-center space-y-2">
                  <p className="text-xs font-bold text-red-950">No Bank Card Configured</p>
                  <p className="text-[11px] text-red-700 leading-normal max-w-[260px]">
                    You must bind a valid bank account to withdraw your daily earnings safely.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsBindingBank(true)}
                    className="mt-1 px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs rounded-xl shadow-sm cursor-pointer transition-all active:scale-95"
                  >
                    Bind Bank Card Now
                  </button>
                </div>
              )}
            </div>

            {/* Withdrawal Amount Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Enter Withdrawal Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-emerald-600">₹</span>
                <input
                  type="number"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder={`Min ₹${minimumWithdraw}`}
                  className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-base font-black text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Withdrawal Password Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Withdrawal PIN / Password</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock className="w-4 h-4 text-emerald-600" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={withdrawPassword}
                  onChange={(e) => setWithdrawPassword(e.target.value)}
                  placeholder="Enter withdraw password"
                  className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && <p className="text-xs font-semibold text-rose-500 mt-1">{error}</p>}

            {/* Withdraw Guidelines Box */}
            <div className="p-4 bg-amber-50/50 border border-amber-200/50 rounded-2xl space-y-1.5 text-[11px] text-amber-900/80 leading-relaxed font-medium">
              <div className="flex items-center gap-1 text-amber-800 font-extrabold uppercase">
                <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>Withdrawal Terms</span>
              </div>
              <p>1. Minimum withdrawal is ₹200. Processing fee is 5%.</p>
              <p>2. Withdrawal request operates 24/7. Funds arrive in your bank account typically in 30 minutes to 2 hours.</p>
              <p>3. Please verify IFSC and Account Number carefully; double check before submitting.</p>
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={isSubmitting || !hasPurchasedPlan}
              className={`w-full py-4 rounded-2xl font-extrabold text-base shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98] ${
                !hasPurchasedPlan
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-100 disabled:opacity-75'
              }`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Requesting Withdrawal...</span>
                </>
              ) : !hasPurchasedPlan ? (
                <>
                  <Lock className="w-5 h-5" />
                  <span>Withdrawal Locked</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Withdraw Now</span>
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
