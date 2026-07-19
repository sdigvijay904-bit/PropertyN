/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Landmark, Lock, HelpCircle, CheckCircle2, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { UserProfile, BankAccount } from '../types';

interface WithdrawModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onWithdrawRequest: (amount: number, withdrawPass: string) => void;
  onOpenBankConfig: () => void;
  hasPurchasedPlan: boolean;
}

export default function WithdrawModal({
  user,
  isOpen,
  onClose,
  onWithdrawRequest,
  onOpenBankConfig,
  hasPurchasedPlan
}: WithdrawModalProps) {
  const [amountInput, setAmountInput] = useState<string>('');
  const [withdrawPassword, setWithdrawPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const minimumWithdraw = parseFloat(localStorage.getItem('adpaint_min_withdrawal') || '120');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!hasPurchasedPlan) {
      setError('Withdrawal Locked: You must purchase at least one Real Estate Fund to unlock withdrawals!');
      return;
    }

    const amount = parseFloat(amountInput);
    if (isNaN(amount) || amount < minimumWithdraw) {
      setError(`Minimum withdrawal amount is ₹${minimumWithdraw}`);
      return;
    }

    if (amount > user.balance) {
      setError(`Insufficient balance. Available: ₹${user.balance.toFixed(2)}`);
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
          <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-xl">
                <Landmark className="w-5 h-5 text-violet-200" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Withdraw Funds</h3>
                <p className="text-xs text-violet-200">Safe, secure bank transfer</p>
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
            {/* Balance Card */}
            <div className="p-4 rounded-2xl bg-violet-50 border border-violet-100/80 flex justify-between items-center">
              <div>
                <span className="text-xs font-semibold text-violet-500 block uppercase tracking-wider">Withdrawable Balance</span>
                <span className="text-2xl font-black text-indigo-950 font-sans">₹{user.balance.toFixed(2)}</span>
              </div>
              <div className="bg-indigo-100/60 px-3 py-1.5 rounded-full flex items-center gap-1">
                <Landmark className="w-3.5 h-3.5 text-indigo-600" />
                <span className="text-[10px] font-bold text-indigo-700 uppercase">Settlement</span>
              </div>
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
                  Withdrawals are locked because you do not have an active Real Estate investment. Please purchase at least one plan on the Home screen to unlock withdrawals.
                </p>
              </div>
            )}

            {/* Bank Card Status */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Destination Bank Account</label>
                {!user.bankAccount && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenBankConfig();
                    }}
                    className="text-xs font-bold text-violet-600 hover:underline"
                  >
                    + Bind Bank Card
                  </button>
                )}
              </div>

              {user.bankAccount ? (
                <div className="p-4 rounded-2xl border border-gray-150 bg-gray-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600">
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
                    onClick={() => {
                      onClose();
                      onOpenBankConfig();
                    }}
                    className="text-xs font-bold text-gray-500 hover:text-violet-600"
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
                    onClick={() => {
                      onClose();
                      onOpenBankConfig();
                    }}
                    className="mt-1 px-4 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-extrabold text-xs rounded-xl shadow-sm"
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
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-violet-600">₹</span>
                <input
                  type="number"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder={`Min ₹${minimumWithdraw}`}
                  className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-base font-black text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Withdrawal Password Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Withdrawal PIN / Password</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock className="w-4 h-4 text-violet-600" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={withdrawPassword}
                  onChange={(e) => setWithdrawPassword(e.target.value)}
                  placeholder="Enter withdraw password"
                  className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all font-sans"
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
                  : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-violet-100 disabled:opacity-75'
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
