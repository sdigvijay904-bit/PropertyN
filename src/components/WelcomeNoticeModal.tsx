/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Info, Award, Landmark, Wallet, Clock, Gift } from 'lucide-react';

interface WelcomeNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WelcomeNoticeModal({ isOpen, onClose }: WelcomeNoticeModalProps) {
  if (!isOpen) return null;

  const platformName = localStorage.getItem('adpaint_platform_name') || 'PropertyN';
  const dailyBonus = localStorage.getItem('adpaint_daily_bonus') || '8';
  const minWithdrawal = localStorage.getItem('adpaint_min_withdrawal') || '120';
  const minRecharge = localStorage.getItem('adpaint_min_recharge') || '250';
  const withdrawTime = localStorage.getItem('adpaint_withdraw_time') || '12:30AM - 11:59PM';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        {/* Backdrop Click */}
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="relative w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col z-10"
        >
          {/* Header with Violet/Indigo Gradient */}
          <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 text-white text-center py-6 px-5 relative">
            <h3 className="text-2xl font-black tracking-tight mb-1">Welcome Notice</h3>
            <p className="text-xs text-emerald-100 font-bold opacity-90">Read carefully before you invest</p>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-4">
            {/* List Rows */}
            <div className="space-y-3">
              {/* Row 1: Platform Name */}
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl transition-all hover:bg-slate-100/50">
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-500" />
                  Platform Name
                </span>
                <span className="text-xs font-black text-slate-800">{platformName}</span>
              </div>

              {/* Row 2: Daily Check-In Bonus */}
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl transition-all hover:bg-slate-100/50">
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Gift className="w-4 h-4 text-emerald-500" />
                  Daily Check-In Bonus
                </span>
                <span className="text-xs font-black text-emerald-600">₹{dailyBonus}</span>
              </div>

              {/* Row 3: Minimum Withdrawal */}
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl transition-all hover:bg-slate-100/50">
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-amber-500" />
                  Minimum Withdrawal
                </span>
                <span className="text-xs font-black text-amber-600">₹{minWithdrawal}</span>
              </div>

              {/* Row 4: Minimum Recharge */}
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl transition-all hover:bg-slate-100/50">
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-teal-500" />
                  Minimum Recharge
                </span>
                <span className="text-xs font-black text-teal-600">₹{minRecharge}</span>
              </div>

              {/* Row 5: Withdrawal Time */}
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl transition-all hover:bg-slate-100/50">
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-rose-500" />
                  Withdrawal Time
                </span>
                <span className="text-[11px] font-black text-slate-800">{withdrawTime}</span>
              </div>
            </div>

            {/* OK Got it Button */}
            <button
              onClick={onClose}
              className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-100 active:scale-95 transition-all cursor-pointer text-center block mt-2"
            >
              OK, Got it!
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
