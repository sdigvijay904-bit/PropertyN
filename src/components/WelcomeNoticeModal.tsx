/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Info, X, Award, Gift, Landmark, Wallet, Clock, Send } from 'lucide-react';

interface WelcomeNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WelcomeNoticeModal({ isOpen, onClose }: WelcomeNoticeModalProps) {
  useEffect(() => {
    if (isOpen) {
      const customTicker = localStorage.getItem('adpaint_custom_ticker') || '';
      localStorage.setItem('adpaint_notice_last_read', customTicker || 'read_default');
      window.dispatchEvent(new Event('adpaint_notice_updated'));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const platformName = localStorage.getItem('adpaint_platform_name') || 'PropertyN';
  const signupBonus = localStorage.getItem('adpaint_signup_bonus') || '100';
  const minWithdrawal = localStorage.getItem('adpaint_min_withdrawal') || '120';
  const minRecharge = localStorage.getItem('adpaint_min_recharge') || '250';
  const withdrawTime = localStorage.getItem('adpaint_withdraw_time') || '12:30AM - 11:59PM';
  const tgChannel = localStorage.getItem('adpaint_tg_channel') || 'https://t.me/PropertyN_99';

  const handleTelegramJoin = () => {
    window.open(tgChannel, '_blank');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
        {/* Backdrop Click */}
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 260 }}
          className="relative w-full max-w-[325px] sm:max-w-[340px] bg-white rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col z-10 border border-slate-100"
        >
          {/* Header Row */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <Info className="w-4.5 h-4.5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight leading-none">Welcome Notice</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">Platform Info & Details</p>
              </div>
            </div>
            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-colors shadow-xs active:scale-90 cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4 stroke-[3]" />
            </button>
          </div>

          {/* List Rows */}
          <div className="space-y-2 mb-4">
            {/* Row 1: Platform Name */}
            <div className="flex items-center justify-between px-3 py-2 bg-emerald-50/50 border border-emerald-100/80 rounded-xl">
              <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                Platform Name:
              </span>
              <span className="text-xs font-black text-slate-900">{platformName}</span>
            </div>

            {/* Row 2: Sign-up Bonus */}
            <div className="flex items-center justify-between px-3 py-2 bg-emerald-50/50 border border-emerald-100/80 rounded-xl">
              <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                Sign-up Bonus:
              </span>
              <span className="text-xs font-black text-emerald-600">₹{signupBonus}</span>
            </div>

            {/* Row 3: Minimum Recharge */}
            <div className="flex items-center justify-between px-3 py-2 bg-emerald-50/50 border border-emerald-100/80 rounded-xl">
              <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                Min Recharge:
              </span>
              <span className="text-xs font-black text-teal-600">₹{minRecharge}</span>
            </div>

            {/* Row 4: Minimum Withdrawal */}
            <div className="flex items-center justify-between px-3 py-2 bg-emerald-50/50 border border-emerald-100/80 rounded-xl">
              <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                Min Withdrawal:
              </span>
              <span className="text-xs font-black text-emerald-600">₹{minWithdrawal}</span>
            </div>

            {/* Row 5: Withdrawal Time */}
            <div className="flex items-center justify-between px-3 py-2 bg-emerald-50/50 border border-emerald-100/80 rounded-xl">
              <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                Withdrawals:
              </span>
              <span className="text-[11px] font-black text-slate-800">{withdrawTime}</span>
            </div>
          </div>

          {/* Join Telegram Channel Button */}
          <button
            onClick={handleTelegramJoin}
            className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.24.38-.49 1.07-.75 4.19-1.82 6.98-3.02 8.38-3.6 3.99-1.66 4.82-1.95 5.36-1.96.12 0 .38.03.55.17.14.12.18.28.2.41-.02.07-.01.21-.03.36z" />
            </svg>
            <span>Join Telegram Channel</span>
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
