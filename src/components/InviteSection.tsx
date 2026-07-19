/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Copy, QrCode, Users, Gift, Share2, Sparkles, CheckCircle2, Award, Zap, UserPlus, CreditCard, Layers } from 'lucide-react';
import { UserProfile, TeamMember } from '../types';

interface InviteSectionProps {
  user: UserProfile;
  teamMembers: TeamMember[];
}

export default function InviteSection({ user, teamMembers }: InviteSectionProps) {
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const totalTeamCount = teamMembers.length;
  const totalEarnedCommission = teamMembers.reduce((acc, m) => acc + m.commissionEarned, 0);

  // Parse and generate public referral link securely.
  // Converts private development container origins ('ais-dev-') to public preview origins ('ais-pre-') automatically.
  let appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://propertyn.com';
  if (appUrl.includes('ais-dev-')) {
    appUrl = appUrl.replace('ais-dev-', 'ais-pre-');
  }
  const referralLink = `${appUrl}/?code=${user.inviteCode}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(user.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6 pb-4 text-slate-800">
      {/* Premium Header Banner matching ProfileSection exactly */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-teal-700 text-white pt-8 pb-16 px-6 rounded-b-[2.5rem] shadow-md relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-white/5 rounded-full blur-xl translate-x-6 -translate-y-6"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-xl -translate-x-6 translate-y-6"></div>
        
        <div className="flex items-center gap-4 relative z-10 text-left">
          {/* 3D Invite icon */}
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-[0_8px_20px_rgba(0,0,0,0.1),_inset_0_1px_0_rgba(255,255,255,0.2)]">
            <UserPlus className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight">Invite Friends</h2>
            <p className="text-xs text-teal-100 mt-1 font-medium">Earn lifetime commissions on every property investment referral</p>
          </div>
        </div>
      </div>

      {/* Floating 3D Stats Cards Row */}
      <div className="-mt-10 mx-4 relative z-20 grid grid-cols-3 gap-3.5">
        {/* Total Team */}
        <div className="bg-white p-4 rounded-[1.75rem] border border-slate-100 flex flex-col items-center justify-center text-center shadow-[0_12px_24px_-4px_rgba(0,0,0,0.04),_0_2px_0_rgba(255,255,255,0.95)_inset] group hover:scale-[1.02] transition-transform">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-white flex items-center justify-center shadow-[0_4px_10px_rgba(245,158,11,0.2)] mb-2.5 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <p className="text-lg font-black text-slate-900 font-sans tracking-tight">{totalTeamCount}</p>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mt-0.5">Total Team</p>
        </div>

        {/* Total Earned */}
        <div className="bg-white p-4 rounded-[1.75rem] border border-slate-100 flex flex-col items-center justify-center text-center shadow-[0_12px_24px_-4px_rgba(0,0,0,0.04),_0_2px_0_rgba(255,255,255,0.95)_inset] group hover:scale-[1.02] transition-transform">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-[0_4px_10px_rgba(124,58,237,0.2)] mb-2.5 shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <p className="text-lg font-black text-slate-900 font-sans tracking-tight">₹{totalEarnedCommission.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mt-0.5">Earned</p>
        </div>

        {/* Levels */}
        <div className="bg-white p-4 rounded-[1.75rem] border border-slate-100 flex flex-col items-center justify-center text-center shadow-[0_12px_24px_-4px_rgba(0,0,0,0.04),_0_2px_0_rgba(255,255,255,0.95)_inset] group hover:scale-[1.02] transition-transform">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center shadow-[0_4px_10px_rgba(16,185,129,0.2)] mb-2.5 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <p className="text-lg font-black text-slate-900 font-sans tracking-tight">3</p>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mt-0.5">Levels</p>
        </div>
      </div>

      {/* Title Divider */}
      <div className="flex items-center gap-2 text-left px-4 pt-1">
        <div className="w-1.5 h-5 bg-teal-600 rounded-full shadow-sm"></div>
        <span className="text-sm font-black text-teal-950 uppercase tracking-wider">My QR Code</span>
      </div>

      {/* Invite QR & Copy block */}
      <div className="mx-4 p-6 bg-white rounded-[2.5rem] border border-slate-100/80 shadow-[0_15px_35px_-4px_rgba(0,0,0,0.03)] space-y-6 flex flex-col items-center text-center">
        {/* QR Wrapper with beautiful scanning target markers */}
        <div className="p-5 bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl border border-slate-200/50 shadow-inner flex flex-col items-center relative">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/50 shadow-sm relative overflow-hidden flex items-center justify-center">
            
            {/* Top-Left Target Line */}
            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-teal-600 rounded-tl-md"></div>
            {/* Top-Right Target Line */}
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-teal-600 rounded-tr-md"></div>
            {/* Bottom-Left Target Line */}
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-teal-600 rounded-bl-md"></div>
            {/* Bottom-Right Target Line */}
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-teal-600 rounded-br-md"></div>

            <svg className="w-40 h-40 text-slate-800" viewBox="0 0 100 100" fill="currentColor">
              {/* Corner squares */}
              <rect x="0" y="0" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="6" />
              <rect x="5" y="5" width="15" height="15" />
              <rect x="75" y="0" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="6" />
              <rect x="80" y="5" width="15" height="15" />
              <rect x="0" y="75" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="6" />
              <rect x="5" y="80" width="15" height="15" />
              {/* Internal mock data points */}
              <rect x="35" y="5" width="10" height="10" />
              <rect x="50" y="15" width="15" height="5" />
              <rect x="35" y="25" width="25" height="5" />
              <rect x="10" y="35" width="15" height="15" />
              <rect x="35" y="45" width="20" height="10" />
              <rect x="65" y="35" width="25" height="15" />
              <rect x="5" y="60" width="15" height="10" />
              <rect x="30" y="65" width="10" height="25" />
              <rect x="45" y="75" width="20" height="10" />
              <rect x="70" y="60" width="15" height="15" />
              <rect x="75" y="80" width="20" height="15" />
            </svg>
            {/* Tiny PropertyN vector logo at the center of invite QR */}
            <div className="absolute inset-0 m-auto w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center text-[11px] font-black text-white shadow-md border-2 border-white">
              PN
            </div>
          </div>
          <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest mt-3.5 leading-tight">
            Ask friends to scan this QR to register
          </span>
        </div>

        {/* Copy Link & Invite Code fields */}
        <div className="w-full space-y-4 pt-1">
          {/* Referral Link */}
          <div className="text-left space-y-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Referral Link</span>
            <div className="flex items-center gap-2 p-2.5 bg-slate-50/70 rounded-2xl border border-slate-200/60 shadow-[inset_0_1.5px_4px_rgba(0,0,0,0.015)]">
              <span className="text-xs text-slate-600 font-mono truncate flex-1 pl-1.5">{referralLink}</span>
              <button
                type="button"
                onClick={copyLink}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer active:scale-95 ${
                  copiedLink
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm'
                    : 'bg-teal-600 hover:bg-teal-700 text-white shadow-[0_3px_8px_rgba(79,70,229,0.22)]'
                }`}
              >
                {copiedLink ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Referral Code */}
          <div className="text-left space-y-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Referral Code</span>
            <div className="flex items-center justify-between p-2.5 bg-slate-50/70 rounded-2xl border border-slate-200/60 shadow-[inset_0_1.5px_4px_rgba(0,0,0,0.015)]">
              <span className="text-sm font-black text-teal-950 font-sans px-2">{user.inviteCode}</span>
              <button
                type="button"
                onClick={copyCode}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer active:scale-95 ${
                  copiedCode
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_3px_8px_rgba(124,58,237,0.22)]'
                }`}
              >
                {copiedCode ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Rules Divider */}
      <div className="flex items-center gap-2 text-left px-4 pt-1">
        <div className="w-1.5 h-5 bg-amber-500 rounded-full shadow-sm"></div>
        <span className="text-sm font-black text-teal-950 uppercase tracking-wider">Commission Rules</span>
      </div>

      {/* Commission Rules Card */}
      <div className="mx-4 p-5 bg-gradient-to-br from-teal-900 to-teal-950 rounded-[2rem] text-white space-y-4 shadow-xl relative overflow-hidden">
        {/* Abstract shape */}
        <div className="absolute right-0 bottom-0 opacity-[0.03]">
          <Gift className="w-48 h-48 text-white translate-x-12 translate-y-12" />
        </div>

        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
          <h3 className="text-xs font-black uppercase tracking-wider text-amber-300">Passive Commission Matrix</h3>
        </div>

        <div className="space-y-3">
          {/* Level 1 */}
          <div className="flex items-center justify-between p-3.5 bg-white/5 rounded-2xl border border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-black text-xs">
                Lv1
              </div>
              <div className="text-left">
                <p className="text-xs font-black text-white">Direct Referrals</p>
                <p className="text-[10px] text-teal-200">Registers directly via your code</p>
              </div>
            </div>
            <span className="text-sm font-black text-amber-400">10% Commission</span>
          </div>

          {/* Level 2 */}
          <div className="flex items-center justify-between p-3.5 bg-white/5 rounded-2xl border border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-black text-xs">
                Lv2
              </div>
              <div className="text-left">
                <p className="text-xs font-black text-white">Indirect Referrals</p>
                <p className="text-[10px] text-teal-200">Invited by your Level 1 members</p>
              </div>
            </div>
            <span className="text-sm font-black text-emerald-200">5% Commission</span>
          </div>

          {/* Level 3 */}
          <div className="flex items-center justify-between p-3.5 bg-white/5 rounded-2xl border border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-black text-xs">
                Lv3
              </div>
              <div className="text-left">
                <p className="text-xs font-black text-white">Sub-Level Referrals</p>
                <p className="text-[10px] text-teal-200">Invited by your Level 2 members</p>
              </div>
            </div>
            <span className="text-sm font-black text-emerald-400">2% Commission</span>
          </div>
        </div>

        <div className="p-3.5 bg-white/5 rounded-2xl border border-white/5 text-[10px] text-teal-100/90 leading-relaxed font-medium text-left">
          <span className="font-black text-white uppercase block mb-1">Earning Demonstration</span>
          If your Level 1 direct referral recharges <strong className="text-amber-400 font-sans font-extrabold">₹1,000</strong>, you instantly receive <strong className="text-emerald-400 font-sans font-extrabold">₹100</strong>. If their Level 2 referral recharges <strong className="text-amber-400 font-sans font-extrabold">₹1,000</strong>, you automatically earn <strong className="text-emerald-400 font-sans font-extrabold">₹50</strong>!
        </div>
      </div>
    </div>
  );
}

