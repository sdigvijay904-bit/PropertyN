/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Wallet, Landmark, Send, HelpCircle, ShieldCheck, Sparkles, ShoppingBag, Coins, BadgeAlert, ArrowUpRight, TrendingUp, Calendar, Award, Heart, Search, X, Star, Info, ChevronRight, MapPin, Percent, Plus, Minus, Check, Smartphone, Download } from 'lucide-react';
import { UserProfile, InvestmentPlan } from '../types';

interface HomeSectionProps {
  user: UserProfile;
  plans: InvestmentPlan[];
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
    <div className="space-y-5 pb-24">
      {/* Top Brand Header */}
      <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-700 text-white p-4 rounded-b-2xl shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center p-1.5 shadow-inner">
            <svg viewBox="0 0 100 100" className="w-full h-full text-violet-700" fill="none" stroke="currentColor">
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
            <h1 className="text-xl font-black tracking-tight flex items-center gap-1.5">
              <span>{localStorage.getItem('adpaint_platform_name') || 'PropertyN'}</span>
              <span className="text-[9px] uppercase tracking-widest bg-violet-500/30 border border-violet-400/20 px-2 py-0.5 rounded-full font-bold">
                Earning
              </span>
            </h1>
            <p className="text-[10px] text-violet-200 font-medium">Premium Real-Estate Sponsoring</p>
          </div>
        </div>

        {/* Live System Alerts */}
        <div className="relative">
          <button
            onClick={onOpenService}
            className="p-2.5 bg-white/10 hover:bg-white/15 rounded-2xl transition-all relative flex items-center justify-center"
          >
            <Bell className="w-5 h-5 text-white" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-indigo-700 animate-pulse"></span>
          </button>
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
            className="mx-4 p-2.5 bg-gradient-to-r from-violet-900/90 to-indigo-900/90 backdrop-blur-md rounded-xl text-[11px] font-bold text-white shadow-lg border border-violet-500/20 flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block shrink-0" />
            <span className="truncate flex-1 font-sans">{liveNotification}</span>
            <span className="text-[9px] text-violet-300 tracking-wider uppercase font-mono">Live</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Carousel Slideshow */}
      <div className="mx-4 overflow-hidden rounded-2xl relative h-48 shadow-lg border border-indigo-50/20 group">
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
          <span className="bg-violet-600/90 px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-widest border border-white/20">
            {SLIDE_METADATA[currentSlide].tag}
          </span>
          <h2 className="text-xs font-black leading-tight tracking-tight">
            {SLIDE_METADATA[currentSlide].title}
          </h2>
          <p className="text-[9px] text-violet-100 font-bold leading-tight">
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

      {/* Quick Action Navigation Grid */}
      <div className="mx-4 p-4 bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.02)] border border-slate-100 flex items-center justify-around">
        {[
          { label: 'Recharge', icon: Wallet, action: onOpenRecharge, color: 'bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 text-white shadow-[0_4px_12px_rgba(16,185,129,0.25),inset_0_1px_1px_rgba(255,255,255,0.4)] border-t border-white/20' },
          { label: 'Withdraw', icon: Landmark, action: onOpenWithdraw, color: 'bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 text-white shadow-[0_4px_12px_rgba(245,158,11,0.25),inset_0_1px_1px_rgba(255,255,255,0.4)] border-t border-white/20' },
          { label: 'Channel', icon: Send, action: () => { window.open(tgChannel, '_blank'); }, color: 'bg-gradient-to-br from-sky-400 via-sky-500 to-blue-600 text-white shadow-[0_4px_12px_rgba(14,165,233,0.25),inset_0_1px_1px_rgba(255,255,255,0.4)] border-t border-white/20' },
          { label: 'Service', icon: HelpCircle, action: () => { window.open(tgSupport, '_blank'); }, color: 'bg-gradient-to-br from-pink-500 via-rose-500 to-rose-600 text-white shadow-[0_4px_12px_rgba(225,29,72,0.25),inset_0_1px_1px_rgba(255,255,255,0.4)] border-t border-white/20' }
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
            <div className="w-1.5 h-5 bg-violet-600 rounded-full"></div>
            <h3 className="text-base font-black text-slate-800">Investment Plans</h3>
          </div>
          <div className="flex items-center gap-1 bg-violet-50 px-2.5 py-1 rounded-full text-[10px] font-bold text-violet-700 border border-violet-100">
            <Sparkles className="w-3.5 h-3.5 text-violet-500 animate-pulse" />
            <span>VIP Rewards Active</span>
          </div>
        </div>

        {/* Search & Filter Component */}
        <div className="px-4 space-y-3">
          {/* Elegant Search Bar */}
          <div className="relative flex items-center bg-slate-50 border border-slate-200/80 rounded-2xl p-1 focus-within:ring-2 focus-within:ring-violet-500 focus-within:bg-white transition-all shadow-inner">
            <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
              <Search className="w-4.5 h-4.5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search properties, categories..."
              className="flex-1 pl-3 pr-8 py-2 bg-transparent text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Horizontal Scrolling Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-violet-100 scrollbar-track-transparent">
            {['All', 'Villas', 'Residential', 'Commercial', 'Favorites'].map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {cat === 'Favorites' && (
                    <Heart className={`w-3.5 h-3.5 ${favorites.length > 0 ? 'fill-rose-500 text-rose-500 animate-pulse' : ''}`} />
                  )}
                  <span>{cat}</span>
                  {cat === 'Favorites' && favorites.length > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${isActive ? 'bg-white text-indigo-600' : 'bg-red-500 text-white animate-bounce'}`}>
                      {favorites.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Toggle buttons */}
        <div className="mx-4 p-1.5 bg-slate-100 rounded-xl flex">
          <button
            onClick={() => setActiveTab('daily')}
            className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${
              activeTab === 'daily'
                ? 'bg-gradient-to-b from-violet-500 to-indigo-600 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Daily-Income
          </button>
          <button
            onClick={() => setActiveTab('vip')}
            className={`flex-1 py-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'vip'
                ? 'bg-gradient-to-b from-violet-500 to-indigo-600 text-white shadow-md'
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
                  
                  {/* Floating Favorite heart Button */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleFavorite(plan.id, e)}
                    className="absolute top-4 left-4 w-9 h-9 rounded-xl bg-white/95 hover:bg-white text-slate-700 flex items-center justify-center shadow-md transition-transform active:scale-90 cursor-pointer z-10"
                  >
                    <Heart
                      className={`w-4.5 h-4.5 transition-colors ${
                        favorites.includes(plan.id) ? 'fill-rose-500 text-rose-500' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    />
                  </button>

                  {/* Floating Slot status */}
                  <div className="absolute top-4 right-4 bg-white/95 text-slate-900 px-3 py-1 rounded-full text-[10px] font-extrabold shadow-sm border border-slate-100 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>{plan.slotsPurchased}/{plan.slotsMax} Slots Purchased</span>
                  </div>

                  {/* Cover Title Overlay */}
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h4 className="text-base font-black tracking-tight">{plan.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="bg-violet-600 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-widest border border-violet-400">
                        Approved
                      </span>
                      <span className="text-[10px] text-violet-100 font-medium">Verified sponsor earnings</span>
                    </div>
                  </div>
                </div>

                {/* Grid Specifications */}
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3.5 text-left">
                    {/* Price */}
                    <div className="relative p-3 pl-3.5 bg-gradient-to-b from-white to-slate-50 border border-slate-200/80 shadow-[0_5px_12px_-4px_rgba(0,0,0,0.04),_0_2px_0_rgba(255,255,255,0.95)_inset] rounded-2xl flex items-center gap-2.5 min-h-[72px]">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center shadow-[0_4px_10px_rgba(124,58,237,0.22),_inset_0_1px_0_rgba(255,255,255,0.3)] shrink-0">
                        <Wallet className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block leading-none">Price</span>
                        <span className="text-[13px] font-black text-slate-900 font-sans mt-1 block truncate">₹{plan.price.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {/* Daily Income */}
                    <div className="relative p-3 pl-3.5 bg-gradient-to-b from-white to-amber-50/10 border border-amber-100/70 shadow-[0_5px_12px_-4px_rgba(245,158,11,0.05),_0_2px_0_rgba(255,255,255,0.95)_inset] rounded-2xl flex items-center gap-2.5 min-h-[72px]">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-[0_4px_10px_rgba(245,158,11,0.22),_inset_0_1px_0_rgba(255,255,255,0.3)] shrink-0">
                        <TrendingUp className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block leading-none">Daily Income</span>
                        <span className="text-[13px] font-black text-amber-600 font-sans mt-1 block truncate">₹{plan.dailyIncome.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {/* Duration */}
                    <div className="relative p-3 pl-3.5 bg-gradient-to-b from-white to-sky-50/10 border border-sky-100/70 shadow-[0_5px_12px_-4px_rgba(14,165,233,0.05),_0_2px_0_rgba(255,255,255,0.95)_inset] rounded-2xl flex items-center gap-2.5 min-h-[72px]">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-blue-500 text-white flex items-center justify-center shadow-[0_4px_10px_rgba(14,165,233,0.22),_inset_0_1px_0_rgba(255,255,255,0.3)] shrink-0">
                        <Calendar className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block leading-none">Duration</span>
                        <span className="text-[13px] font-black text-slate-900 font-sans mt-1 block truncate">{plan.durationDays} Days</span>
                      </div>
                    </div>

                    {/* Total Profit */}
                    <div className="relative p-3 pl-3.5 bg-gradient-to-b from-white to-emerald-50/10 border border-emerald-100/70 shadow-[0_5px_12px_-4px_rgba(16,185,129,0.05),_0_2px_0_rgba(255,255,255,0.95)_inset] rounded-2xl flex items-center gap-2.5 min-h-[72px]">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center shadow-[0_4px_10px_rgba(16,185,129,0.22),_inset_0_1px_0_rgba(255,255,255,0.3)] shrink-0">
                        <Award className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block leading-none">Total Profit</span>
                        <span className="text-[13px] font-black text-emerald-600 font-sans mt-1 block truncate">₹{plan.totalProfit.toLocaleString('en-IN')}</span>
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
                    className="w-full py-4.5 bg-gradient-to-r from-violet-500 via-indigo-600 to-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-[0_6px_20px_rgba(109,40,217,0.25),_0_2px_0_rgba(255,255,255,0.35)_inset] border-t border-white/20 flex items-center justify-center gap-2 hover:opacity-95 active:scale-95 transition-all cursor-pointer group"
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
