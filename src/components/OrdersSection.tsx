/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, TrendingUp, Sparkles, CheckCircle2, Clock, Landmark, Gift } from 'lucide-react';
import { PurchaseRecord } from '../types';

interface OrdersSectionProps {
  purchases: PurchaseRecord[];
  onClaimOrderEarnings: (purchaseId: string) => void;
}

export default function OrdersSection({ purchases, onClaimOrderEarnings }: OrdersSectionProps) {
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

  const activePurchases = purchases.filter(p => !p.completed);
  const completedPurchases = purchases.filter(p => p.completed);

  const totalClaimed = purchases.reduce((acc: number, p: PurchaseRecord) => acc + p.totalClaimed, 0);
  const currentUnclaimedLive = purchases.reduce((acc: number, p: PurchaseRecord) => {
    if (!p.completed) {
      return acc + (accruedMap[p.id] || 0);
    }
    return acc;
  }, 0);

  return (
    <div className="space-y-6 pb-4 text-slate-800 text-left">
      {/* Premium Header Banner matching ProfileSection exactly */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-teal-700 text-white pt-8 pb-16 px-6 rounded-b-[2.5rem] shadow-md relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-white/5 rounded-full blur-xl translate-x-6 -translate-y-6"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-xl -translate-x-6 translate-y-6"></div>
        
        <div className="flex items-center gap-4 relative z-10">
          {/* 3D Orders icon */}
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-[0_8px_20px_rgba(0,0,0,0.1),_inset_0_1px_0_rgba(255,255,255,0.2)]">
            <ShoppingBag className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight">My Orders</h2>
            <p className="text-xs text-teal-100 mt-1 font-medium">Manage your active plans, daily yields, and claimed earnings</p>
          </div>
        </div>
      </div>

      {/* Quick Stats Block Overlapping the banner */}
      <div className="px-5 -mt-10 relative z-20">
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_12px_40px_rgba(0,0,0,0.03)] p-5 grid grid-cols-3 gap-2.5 text-center">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Active Plans</span>
            <span className="text-base font-black text-teal-950 font-sans block">{activePurchases.length}</span>
          </div>
          <div className="border-x border-slate-100 space-y-1">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Live Yield</span>
            <span className="text-base font-black text-emerald-600 font-sans block">₹{currentUnclaimedLive.toFixed(3)}</span>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Total Claimed</span>
            <span className="text-base font-black text-teal-600 font-sans block">₹{totalClaimed.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Main Content List */}
      <div className="px-5 space-y-5">
        {purchases.length > 0 ? (
          <div className="space-y-4">
            {/* Active Plans Header */}
            {activePurchases.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div>
                <span className="text-xs font-black text-teal-950 uppercase tracking-wider">Running Investments ({activePurchases.length})</span>
              </div>
            )}

            {/* Render Active Purchases */}
            {activePurchases.map((item) => {
              const accrued = accruedMap[item.id] || 0;
              const canClaim = accrued > 0.01;
              return (
                <div key={item.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm space-y-4 relative overflow-hidden group hover:shadow-md transition-shadow">
                  {/* Subtle watermarked bg icon */}
                  <div className="absolute right-3 -bottom-3 text-slate-50 opacity-60 pointer-events-none group-hover:scale-110 transition-transform">
                    <ShoppingBag className="w-20 h-20" />
                  </div>

                  {/* Plan Summary header */}
                  <div className="flex items-start justify-between relative z-10">
                    <div>
                      <h4 className="text-sm font-black text-teal-950">{item.planTitle}</h4>
                      <div className="flex flex-wrap items-center gap-x-2 mt-1 text-[10px] font-sans font-bold">
                        <span className="text-gray-400">Purchased: {new Date(item.datePurchased).toLocaleDateString()}</span>
                        <span className="text-slate-200 font-normal">•</span>
                        <span className="text-emerald-700 bg-emerald-50/80 px-2 py-0.5 rounded-md font-black">Plan Price: ₹{item.price ? item.price.toLocaleString('en-IN') : '0'}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 animate-pulse">
                      Active & Running
                    </span>
                  </div>

                  {/* Earnings data grids */}
                  <div className="grid grid-cols-3 gap-2 text-center relative z-10">
                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[9px] font-bold text-gray-400 uppercase block">Daily Yield</span>
                      <span className="text-xs font-black text-teal-950 font-sans">₹{item.dailyIncome}</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[9px] font-bold text-gray-400 uppercase block">Total Claimed</span>
                      <span className="text-xs font-black text-teal-950 font-sans">₹{item.totalClaimed.toFixed(2)}</span>
                    </div>
                    <div className="p-2 bg-emerald-50/40 rounded-xl border border-emerald-100/10">
                      <span className="text-[9px] font-bold text-emerald-600 uppercase block">Accruing Now</span>
                      <span className="text-xs font-black text-emerald-600 font-sans animate-pulse">₹{accrued.toFixed(4)}</span>
                    </div>
                  </div>

                  {/* Claim Button */}
                  <div className="relative z-10 pt-1">
                    <button
                      type="button"
                      onClick={() => onClaimOrderEarnings(item.id)}
                      disabled={!canClaim}
                      className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 disabled:from-gray-100 disabled:to-gray-150 disabled:text-gray-400 disabled:shadow-none text-white text-xs font-black rounded-xl shadow-md shadow-emerald-100/30 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
                    >
                      <TrendingUp className="w-3.5 h-3.5 animate-bounce" />
                      <span>Claim Accumulated ₹{accrued.toFixed(2)}</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Completed Plans Header */}
            {completedPurchases.length > 0 && (
              <div className="flex items-center gap-2 pt-2">
                <div className="w-1.5 h-4 bg-slate-400 rounded-full"></div>
                <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Completed Investments ({completedPurchases.length})</span>
              </div>
            )}

            {/* Render Completed Purchases */}
            {completedPurchases.map((item) => {
              return (
                <div key={item.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm space-y-4 opacity-75">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-black text-slate-700">{item.planTitle}</h4>
                      <div className="flex flex-wrap items-center gap-x-2 mt-1 text-[10px] font-sans font-bold">
                        <span className="text-gray-400">Purchased: {new Date(item.datePurchased).toLocaleDateString()}</span>
                        <span className="text-slate-200 font-normal">•</span>
                        <span className="text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md font-black">Plan Price: ₹{item.price ? item.price.toLocaleString('en-IN') : '0'}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500">
                      Completed
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[9px] font-bold text-gray-400 uppercase block">Daily Yield</span>
                      <span className="text-xs font-black text-slate-700 font-sans">₹{item.dailyIncome}</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[9px] font-bold text-gray-400 uppercase block">Total Claimed</span>
                      <span className="text-xs font-black text-slate-700 font-sans">₹{item.totalClaimed.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Elegant Empty State */
          <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-gray-200 flex flex-col items-center justify-center p-5 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-150">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-800">No Active Plans Found</p>
              <p className="text-xs text-gray-400 max-w-[200px] mx-auto mt-0.5">Please purchase our Special Offer or Product plans on the home screen to start generating daily yields.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
