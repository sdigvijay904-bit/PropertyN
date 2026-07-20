/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Wallet, Landmark, Send, HelpCircle, ShieldCheck, Sparkles, ShoppingBag, Coins, BadgeAlert, ArrowUpRight, TrendingUp, Calendar, Award, Heart, Search, X, Star, Info, ChevronRight, MapPin, Percent, Plus, Minus, Check, Smartphone, Download, Banknote } from 'lucide-react';
import { UserProfile, InvestmentPlan, TransactionRecord } from '../types';

interface HomeSectionProps {
  user: UserProfile;
  plans: InvestmentPlan[];
  transactions: TransactionRecord[];
  onOpenRecharge: () => void;
  onOpenWithdraw: () => void;
  onOpenService: () => void;
  onPurchasePlan: (plan: InvestmentPlan) => void;
  liveNotification: string;
  onOpenDownloadApp?: () => void;
}

const CAROUSEL_IMAGES = [
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80'
];

const SLIDE_METADATA = [
  {
    tag: 'Property Investment',
    title: 'Grow Funds in Premium Real Estate',
    desc: 'Invest funds in premium real estate properties to gain maximum daily passive returns.'
  },
  {
    tag: 'Assured Daily Yield',
    title: 'Sovereign Commercial Plaza Income',
    desc: 'Earn stable daily and monthly rental dividends sourced directly from commercial retail malls.'
  },
  {
    tag: 'Secure & Verified',
    title: 'DLF Luxury Villas & Residencies',
    desc: 'Secure property crowdfunding plans fully compliant with real-estate and financial guidelines.'
  }
];

export default function HomeSection({
  user,
  plans,
  transactions = [],
  onOpenRecharge,
  onOpenWithdraw,
  onOpenService,
  onPurchasePlan,
  liveNotification,
  onOpenDownloadApp
}: HomeSectionProps) {
  const [activeTab, setActiveTab] = useState<'daily' | 'vip'>('daily');
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('adpaint_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sum successful recharge transactions
  const totalRecharged = transactions
    .filter((t) => t.type === 'recharge' && t.status === 'success')
    .reduce((sum, t) => sum + t.amount, 0);

  // Sum successful claim transactions (only plan earnings!)
  const totalPlanEarnings = transactions
    .filter((t) => t.type === 'claim' && t.status === 'success')
    .reduce((sum, t) => sum + t.amount, 0);


  const tgChannel = localStorage.getItem('adpaint_tg_channel') || 'https://t.me/PropertyN_99';
  const tgSupport = localStorage.getItem('adpaint_tg_support') || 'https://t.me/PropertyN_Support';

  useEffect(() => {
    const slideTimer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
    }, 4500);
    return () => clearInterval(slideTimer);
  }, []);

  const getPlanCategory = (p: InvestmentPlan): string => {
    const id = p.id.toLowerCase();
    const title = p.title.toLowerCase();
    if (id.includes('villa') || id.includes('luxury') || title.includes('villa') || title.includes('residencies') || title.includes('house')) {
      return 'Villas';
    }
    if (id.includes('plaza') || id.includes('mall') || id.includes('commercial') || title.includes('mall') || title.includes('plaza') || title.includes('penthouse')) {
      return 'Commercial';
    }
    return 'Residential';
  };

  const handleToggleFavorite = (planId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let updated: string[];
    if (favorites.includes(planId)) {
      updated = favorites.filter(id => id !== planId);
    } else {
      updated = [...favorites, planId];
    }
    setFavorites(updated);
    localStorage.setItem('adpaint_favorites', JSON.stringify(updated));
  };

  const filteredPlans = plans.filter((p) => {
    // 1. Filter by Daily vs VIP
    if (p.type !== activeTab) return false;

    // 2. Filter by Category
    if (activeCategory === 'Favorites') {
      if (!favorites.includes(p.id)) return false;
    } else if (activeCategory !== 'All') {
      if (getPlanCategory(p) !== activeCategory) return false;
    }

    // 3. Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = p.title.toLowerCase().includes(q) || getPlanCategory(p).toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  return (
    <div className="space-y-5 pb-4">
      {/* Top Brand Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-teal-700 text-white py-6 px-6 rounded-b-[2rem] shadow-md relative overflow-hidden">
        {/* Decorative shapes */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-white/5 rounded-full blur-xl translate-x-6 -translate-y-6"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-xl -translate-x-6 translate-y-6"></div>
        
        <div className="flex items-center justify-between relative z-10 text-left">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-[1.25rem] bg-white shadow-[0_8px_20px_rgba(0,0,0,0.06)] flex items-center justify-center p-1.5 shrink-0 border border-slate-100/50">
              <svg viewBox="0 0 100 100" className="w-full h-full text-emerald-700" fill="none" stroke="currentColor">
                {/* Stylized Modern Properties Building Group */}
                <rect x="25" y="32" width="18" height="48" rx="2" strokeWidth="6" strokeLinejoin="round" />
                <rect x="48" y="15" width="28" height="65" rx="3" strokeWidth="6" strokeLinejoin="round" fill="currentColor" fillOpacity="0.1" />
                <line x1="58" y1="28" x2="66" y2="28" strokeWidth="4" strokeLinecap="round" />
                <line x1="58" y1="42" x2="66" y2="42" strokeWidth="4" strokeLinecap="round" />
                <line x1="58" y1="56" x2="66" y2="56" strokeWidth="4" strokeLinecap="round" />
                <path d="M12,72 L12,52 L28,72 L28,52" strokeWidth="6" strokeLinecap="round" className="text-emerald-500" stroke="currentColor" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight flex items-center gap-1.5 text-white">
                <span>{localStorage.getItem('adpaint_platform_name') || 'PropertyN'}</span>
                <span className="text-[9px] uppercase tracking-widest bg-emerald-500/30 border border-emerald-400/20 px-2 py-0.5 rounded-full font-bold">
                  Earning
                </span>
              </h1>
              <p className="text-[10px] text-emerald-200 font-medium">Premium Real-Estate Sponsoring</p>
            </div>
          </div>

          {/* Live System Alerts Bell */}
          <div className="relative shrink-0">
            <button
              onClick={onOpenService}
              className="p-2.5 bg-white/10 hover:bg-white/15 rounded-2xl transition-all relative flex items-center justify-center cursor-pointer"
            >
              <Bell className="w-5 h-5 text-white" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-teal-700 animate-pulse"></span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating live alerts ticker */}
      <AnimatePresence mode="wait">
        {liveNotification && (
          <motion.div
            key={liveNotification}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
            className="mx-4 p-2.5 bg-gradient-to-r from-emerald-900/90 to-teal-900/90 backdrop-blur-md rounded-xl text-[11px] font-bold text-white shadow-lg border border-emerald-500/20 flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block shrink-0" />
            <span className="truncate flex-1 font-sans">{liveNotification}</span>
            <span className="text-[9px] text-emerald-300 tracking-wider uppercase font-mono">Live</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Carousel Slideshow */}
      <div className="mx-4 overflow-hidden rounded-2xl relative h-48 shadow-lg border border-teal-50/20 group">
        <div className="absolute inset-0 bg-black/15 z-10" />
        <AnimatePresence mode="wait">
          <motion.img
            key={currentSlide}
            src={CAROUSEL_IMAGES[currentSlide]}
            alt="Beautiful Painting Design"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.7 }}
            className="w-full h-full object-cover absolute inset-0"
          />
        </AnimatePresence>

        {/* Floating Text on Carousel */}
        <div className="absolute bottom-4 left-4 z-20 text-white space-y-1 max-w-[85%] drop-shadow-md">
          <span className="bg-emerald-600/90 px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-widest border border-white/20">
            {SLIDE_METADATA[currentSlide].tag}
          </span>
          <h2 className="text-xs font-black leading-tight tracking-tight">
            {SLIDE_METADATA[currentSlide].title}
          </h2>
          <p className="text-[9px] text-emerald-100 font-bold leading-tight">
            {SLIDE_METADATA[currentSlide].desc}
          </p>
        </div>

        {/* Carousel indicators */}
        <div className="absolute bottom-4 right-4 z-20 flex gap-1.5">
          {CAROUSEL_IMAGES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`w-2.5 h-1.5 rounded-full transition-all ${
                currentSlide === idx ? 'bg-white w-5' : 'bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Overlapping 3D Glassmorphic Stats Grid card (Now naturally follows the carousel) */}
      <div className="mx-4 relative z-20">
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_15px_35px_-4px_rgba(0,0,0,0.05)] overflow-hidden text-center relative">
          <div className="grid grid-cols-3 divide-x divide-slate-100 py-6 px-1 relative z-10">
            {/* Balance Column */}
            <div className="flex flex-col items-center justify-center min-w-0">
              <div className="w-11 h-11 rounded-[1.1rem] bg-gradient-to-br from-teal-500 to-teal-700 text-white flex items-center justify-center shadow-[0_5px_15px_rgba(99,102,241,0.22)] mb-2 shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
              <span 
                className="text-sm min-[375px]:text-base sm:text-lg font-black text-slate-900 tracking-tight block truncate w-full px-0.5"
                title={`₹${user.balance.toFixed(2)}`}
              >
                ₹{Math.round(user.balance).toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mt-1 block">
                BALANCE
              </span>
            </div>

            {/* Recharged Column */}
            <div className="flex flex-col items-center justify-center min-w-0">
              <div className="w-11 h-11 rounded-[1.1rem] bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shadow-[0_5px_15px_rgba(245,158,11,0.22)] mb-2 shrink-0">
                <Banknote className="w-5 h-5" />
              </div>
              <span 
                className="text-sm min-[375px]:text-base sm:text-lg font-black text-slate-900 tracking-tight block truncate w-full px-0.5"
                title={`₹${totalRecharged.toFixed(2)}`}
              >
                ₹{Math.round(totalRecharged).toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mt-1 block">
                RECHARGED
              </span>
            </div>

            {/* Total Income Column */}
            <div className="flex flex-col items-center justify-center min-w-0">
              <div className="w-11 h-11 rounded-[1.1rem] bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center shadow-[0_5px_15px_rgba(16,185,129,0.22)] mb-2 shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span 
                className="text-sm min-[375px]:text-base sm:text-lg font-black text-slate-900 tracking-tight block truncate w-full px-0.5"
                title={`₹${totalPlanEarnings.toFixed(2)}`}
              >
                ₹{Math.round(totalPlanEarnings).toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mt-1 block">
                TOTAL INCOME
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="mx-4 p-4 bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.02)] border border-slate-100 flex items-center justify-around">
        {[
          { label: 'Recharge', icon: Wallet, action: onOpenRecharge, color: 'bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 text-white shadow-[0_4px_12px_rgba(16,185,129,0.25),inset_0_1px_1px_rgba(255,255,255,0.4)] border-t border-white/20' },
          { label: 'Withdraw', icon: Landmark, action: onOpenWithdraw, color: 'bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 text-white shadow-[0_4px_12px_rgba(245,158,11,0.25),inset_0_1px_1px_rgba(255,255,255,0.4)] border-t border-white/20' },
          { label: 'Channel', icon: Send, action: () => { window.open(tgChannel, '_blank'); }, color: 'bg-gradient-to-br from-sky-400 via-sky-500 to-blue-600 text-white shadow-[0_4px_12px_rgba(14,165,233,0.25),inset_0_1px_1px_rgba(255,255,255,0.4)] border-t border-white/20' },
          { label: 'App', icon: Download, action: onOpenDownloadApp || (() => {
            const configuredApkUrl = localStorage.getItem('adpaint_apk_url') || 'https://raw.githubusercontent.com/adpaint-app/builds/main/PropertyN_Earnings.apk';
            window.open(configuredApkUrl, '_blank');
          }), color: 'bg-gradient-to-br from-pink-500 via-rose-500 to-rose-600 text-white shadow-[0_4px_12px_rgba(225,29,72,0.25),inset_0_1px_1px_rgba(255,255,255,0.4)] border-t border-white/20' }
        ].map((btn, idx) => {
          const Icon = btn.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={btn.action}
              className="flex flex-col items-center space-y-2 group cursor-pointer"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${btn.color} group-active:scale-95 duration-200`}>
                <Icon className="w-5.5 h-5.5 transition-transform group-hover:scale-110" />
              </div>
              <span className="text-[11px] font-black text-slate-700 tracking-wider uppercase font-sans">{btn.label}</span>
            </button>
          );
        })}
      </div>

      {/* Investment plans structure */}
      <div className="space-y-4">
        {/* Title row */}
        <div className="px-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-5 bg-emerald-600 rounded-full"></div>
            <h3 className="text-base font-black text-slate-800">Investment Plans</h3>
          </div>
          <div className="flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-full text-[10px] font-bold text-emerald-700 border border-emerald-100">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span>VIP Rewards Active</span>
          </div>
        </div>



        {/* Tab Toggle buttons */}
        <div className="mx-4 p-1.5 bg-slate-100 rounded-xl flex">
          <button
            onClick={() => setActiveTab('daily')}
            className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${
              activeTab === 'daily'
                ? 'bg-gradient-to-b from-emerald-500 to-teal-600 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Daily-Income
          </button>
          <button
            onClick={() => setActiveTab('vip')}
            className={`flex-1 py-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'vip'
                ? 'bg-gradient-to-b from-emerald-500 to-teal-600 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>VIP-Income</span>
            <Coins className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Render Cards */}
        <div className="px-4 space-y-5">
          {filteredPlans.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-bold bg-white rounded-2xl border border-slate-100">
              No matching properties found!
            </div>
          ) : (
            filteredPlans.map((plan) => (
              <div
                key={plan.id}
                onClick={() => {
                  onPurchasePlan(plan);
                }}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 cursor-pointer transform hover:-translate-y-0.5"
              >
                {/* Product Cover image */}
                <div className="h-44 relative overflow-hidden">
                  <img
                    src={plan.image}
                    alt={plan.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                  {/* Floating Slot status */}
                  <div className="absolute top-4 right-4 bg-white/95 text-slate-900 px-3 py-1 rounded-full text-[10px] font-extrabold shadow-sm border border-slate-100 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>{plan.slotsPurchased}/{plan.slotsMax} Slots Purchased</span>
                  </div>

                  {/* Cover Title Overlay */}
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h4 className="text-base font-black tracking-tight">{plan.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="bg-emerald-600 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-widest border border-emerald-400">
                        Approved
                      </span>
                      <span className="text-[10px] text-emerald-100 font-medium">Verified sponsor earnings</span>
                    </div>
                  </div>
                </div>

                {/* Grid Specifications */}
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-left">
                    {/* Price */}
                    <div className="relative p-3 px-4 bg-gradient-to-b from-white to-slate-50 border border-slate-200/80 shadow-[0_5px_12px_-4px_rgba(0,0,0,0.04),_0_2px_0_rgba(255,255,255,0.95)_inset] rounded-2xl flex flex-col justify-center min-h-[68px]">
                      <div className="min-w-0">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block leading-none">Price</span>
                        <span className="text-[13px] font-black text-slate-900 font-sans mt-2 block whitespace-nowrap">₹{plan.price.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {/* Daily Income */}
                    <div className="relative p-3 px-4 bg-gradient-to-b from-white to-amber-50/10 border border-amber-100/70 shadow-[0_5px_12px_-4px_rgba(245,158,11,0.05),_0_2px_0_rgba(255,255,255,0.95)_inset] rounded-2xl flex flex-col justify-center min-h-[68px]">
                      <div className="min-w-0">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block leading-none">Daily Income</span>
                        <span className="text-[13px] font-black text-amber-600 font-sans mt-2 block whitespace-nowrap">₹{plan.dailyIncome.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {/* Duration */}
                    <div className="relative p-3 px-4 bg-gradient-to-b from-white to-sky-50/10 border border-sky-100/70 shadow-[0_5px_12px_-4px_rgba(14,165,233,0.05),_0_2px_0_rgba(255,255,255,0.95)_inset] rounded-2xl flex flex-col justify-center min-h-[68px]">
                      <div className="min-w-0">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block leading-none">Duration</span>
                        <span className="text-[13px] font-black text-slate-900 font-sans mt-2 block whitespace-nowrap">{plan.durationDays} Days</span>
                      </div>
                    </div>

                    {/* Total Profit */}
                    <div className="relative p-3 px-4 bg-gradient-to-b from-white to-emerald-50/10 border border-emerald-100/70 shadow-[0_5px_12px_-4px_rgba(16,185,129,0.05),_0_2px_0_rgba(255,255,255,0.95)_inset] rounded-2xl flex flex-col justify-center min-h-[68px]">
                      <div className="min-w-0">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block leading-none">Total Profit</span>
                        <span className="text-[13px] font-black text-emerald-600 font-sans mt-2 block whitespace-nowrap">₹{plan.totalProfit.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Purchase Action */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPurchasePlan(plan);
                    }}
                    className="w-full py-4.5 bg-gradient-to-r from-emerald-500 via-teal-600 to-teal-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-[0_6px_20px_rgba(109,40,217,0.25),_0_2px_0_rgba(255,255,255,0.35)_inset] border-t border-white/20 flex items-center justify-center gap-2 hover:opacity-95 active:scale-95 transition-all cursor-pointer group"
                  >
                    <ShoppingBag className="w-4.5 h-4.5 group-hover:scale-110 transition-transform" />
                    <span>Purchase Now</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>


    </div>
  );
}
