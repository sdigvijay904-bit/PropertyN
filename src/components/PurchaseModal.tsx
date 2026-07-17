/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingCart, Info, Sparkles, Check, AlertTriangle } from 'lucide-react';
import { UserProfile, InvestmentPlan } from '../types';

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: InvestmentPlan | null;
  user: UserProfile | null;
  onConfirmPurchase: (plan: InvestmentPlan, quantity: number) => void;
  onOpenRecharge: (amount?: number) => void;
}

export default function PurchaseModal({
  isOpen,
  onClose,
  plan,
  user,
  onConfirmPurchase,
  onOpenRecharge
}: PurchaseModalProps) {
  const [quantity, setQuantity] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);

  // Reset states when plan changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setError(null);
    }
  }, [isOpen, plan]);

  if (!isOpen || !plan) return null;

  const maxAvailable = Math.max(1, plan.slotsMax - plan.slotsPurchased);
  const sliderMax = Math.min(10, maxAvailable);

  const totalPrice = plan.price * quantity;
  const totalProfit = plan.totalProfit * quantity;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuantity(parseInt(e.target.value, 10));
    setError(null); // Clear error on interaction
  };

  const handleConfirm = () => {
    if (!user) return;

    if (user.balance < totalPrice) {
      onClose();
      onOpenRecharge(totalPrice);
      return;
    }
    setError(null);
    onConfirmPurchase(plan, quantity);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
        {/* Backdrop Click */}
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="relative w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] z-10"
        >
          {/* Drag Handle at top of sheet */}
          <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto my-3 flex-shrink-0" />

          {/* Close Button 'X' */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-8 h-8 bg-violet-50 hover:bg-violet-100 text-violet-600 rounded-full flex items-center justify-center transition-colors active:scale-90"
            aria-label="Close"
          >
            <X className="w-4 h-4" strokeWidth={3} />
          </button>

          {/* Scrollable Container */}
          <div className="overflow-y-auto px-5 pb-8 pt-1 flex-1 space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1, x: [0, -6, 6, -4, 4, 0] }}
                transition={{ duration: 0.4 }}
                className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center justify-center shadow-[0_8px_20px_rgba(244,63,94,0.12)] relative overflow-hidden"
              >
                {/* Visual loading bar to show redirect feedback */}
                <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-rose-500 to-pink-600 animate-[pulse_1s_infinite] w-full"></div>
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  <div className="text-center">
                    <p className="text-sm font-black uppercase tracking-wider text-rose-600">Insufficient Balance</p>
                    <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest mt-0.5 animate-pulse">Opening Recharge Screen...</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Plan Card Image Banner */}
            <div className="relative h-48 rounded-xl overflow-hidden shadow-sm border border-slate-100 flex-shrink-0">
              <img
                src={plan.image}
                alt={plan.title}
                className="w-full h-full object-cover"
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

              {/* Verified Badge on top right */}
              <div className="absolute top-4 left-4 bg-emerald-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-400/30 flex items-center gap-1">
                <Check className="w-3 h-3 text-white" strokeWidth={3} />
                <span>Verified Deal</span>
              </div>

              {/* Title overlay at the bottom */}
              <div className="absolute bottom-5 left-5 right-5 text-left text-white">
                <h3 className="text-xl font-black tracking-tight drop-shadow-sm">{plan.title}</h3>
                <p className="text-[10px] text-violet-100 font-bold mt-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
                  <span>Real-Estate Advertisement Slot Sponsorship</span>
                </p>
              </div>
            </div>

            {/* Select Quantity (Slots) header and badge */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-black text-slate-800">Select Quantity (Slots)</span>
                <span className="bg-violet-600 text-white font-extrabold text-sm px-4 py-1.5 rounded-full shadow-sm shadow-violet-200">
                  {quantity}
                </span>
              </div>

              {/* Beautiful Range Slider */}
              <div className="space-y-2">
                <input
                  type="range"
                  min="1"
                  max={sliderMax}
                  step="1"
                  value={quantity}
                  onChange={handleSliderChange}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-violet-600 focus:outline-none focus:ring-0"
                  style={{
                    background: `linear-gradient(to right, #7c3aed 0%, #7c3aed ${((quantity - 1) / (sliderMax - 1)) * 100}%, #f1f5f9 ${((quantity - 1) / (sliderMax - 1)) * 100}%, #f1f5f9 100%)`
                  }}
                />
                
                {/* Horizontal Tick Labels */}
                <div className="flex justify-between text-[10px] font-extrabold text-slate-400 font-sans px-1">
                  {Array.from({ length: sliderMax }, (_, i) => i + 1).map((num) => (
                    <span
                      key={num}
                      className={`transition-colors duration-200 ${
                        quantity === num ? 'text-violet-600 font-black scale-110' : 'text-slate-400'
                      }`}
                    >
                      {num}
                    </span>
                  ))}
                </div>
              </div>

              {/* Available balance warning or slots info */}
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-2 rounded-xl">
                <Info className="w-3.5 h-3.5 text-slate-500" />
                <span>You can sponsor up to {sliderMax} slots of this asset plan today.</span>
              </div>
            </div>

            {/* Total Payable Card */}
            <div className="bg-violet-50/70 border border-violet-100/60 rounded-xl p-5 flex items-center justify-between shadow-sm">
              <div className="text-left space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Payable</span>
                <span className="text-xs font-black text-emerald-600 block flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Total Profit: ₹{totalProfit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-violet-700 font-sans">
                  ₹{totalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Confirm Purchase Button */}
            <button
              onClick={handleConfirm}
              className="w-full py-4.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-extrabold text-sm rounded-xl shadow-md shadow-violet-100 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
            >
              <ShoppingCart className="w-5 h-5 text-white" />
              <span>Confirm Purchase</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
