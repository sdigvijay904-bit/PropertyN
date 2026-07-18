/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Users, CreditCard, Calendar, TrendingUp, DollarSign, UsersRound, Award, ShieldAlert, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { TeamMember } from '../types';

interface TeamSectionProps {
  teamMembers: TeamMember[];
}

export default function TeamSection({ teamMembers }: TeamSectionProps) {
  const [activeLevelTab, setActiveLevelTab] = useState<1 | 2 | 3>(1);

  // Filter members by selected level
  const filteredMembers = teamMembers.filter((m) => m.level === activeLevelTab);

  // Compute summary values
  const totalTeamCount = teamMembers.length;
  const totalRechargeVol = teamMembers.reduce((acc, m) => acc + m.totalInvested, 0);

  const getLevelCountAndVol = (lvl: 1 | 2 | 3) => {
    const lvlMembers = teamMembers.filter((m) => m.level === lvl);
    const count = lvlMembers.length;
    const vol = lvlMembers.reduce((acc, m) => acc + m.totalInvested, 0);
    return { count, vol };
  };

  const lvl1 = getLevelCountAndVol(1);
  const lvl2 = getLevelCountAndVol(2);
  const lvl3 = getLevelCountAndVol(3);

  return (
    <div className="space-y-6 pb-4 text-slate-800">
      {/* Premium Header Banner matching other sections exactly */}
      <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-700 text-white pt-8 pb-16 px-6 rounded-b-[2.5rem] shadow-md relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-white/5 rounded-full blur-xl translate-x-6 -translate-y-6"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-xl -translate-x-6 translate-y-6"></div>
        
        <div className="flex items-center gap-4 relative z-10 text-left">
          {/* 3D Team icon */}
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-[0_8px_20px_rgba(0,0,0,0.1),_inset_0_1px_0_rgba(255,255,255,0.2)]">
            <UsersRound className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight">My Team</h2>
            <p className="text-xs text-indigo-100 mt-1 font-medium">Monitor your network size and live community volume</p>
          </div>
        </div>
      </div>

      {/* Floating 3D Stats Cards Row */}
      <div className="-mt-10 mx-4 relative z-20 grid grid-cols-2 gap-4">
        {/* Metric 1: Total Team */}
        <div className="bg-white p-4.5 rounded-[1.75rem] border border-slate-100 flex items-center gap-3.5 shadow-[0_12px_24px_-4px_rgba(0,0,0,0.04),_0_2px_0_rgba(255,255,255,0.95)_inset] hover:scale-[1.01] transition-transform">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center shadow-[0_5px_12px_rgba(99,102,241,0.25)] shrink-0">
            <Users className="w-5.5 h-5.5" />
          </div>
          <div className="text-left min-w-0">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-none">Total Team</p>
            <p className="text-xl font-extrabold text-slate-900 mt-2 leading-none font-sans tracking-tight">{totalTeamCount}</p>
          </div>
        </div>

        {/* Metric 2: Recharge */}
        <div className="bg-white p-4.5 rounded-[1.75rem] border border-slate-100 flex items-center gap-3.5 shadow-[0_12px_24px_-4px_rgba(0,0,0,0.04),_0_2px_0_rgba(255,255,255,0.95)_inset] hover:scale-[1.01] transition-transform">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-[0_5px_12px_rgba(245,158,11,0.25)] shrink-0">
            <CreditCard className="w-5.5 h-5.5" />
          </div>
          <div className="text-left min-w-0">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-none">Recharge</p>
            <p className="text-xl font-extrabold text-slate-900 mt-2 leading-none tracking-tight font-sans">₹{totalRechargeVol.toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      {/* Title Divider 1 */}
      <div className="flex items-center gap-2 text-left px-4 pt-1">
        <div className="w-1.5 h-5 bg-indigo-600 rounded-full shadow-sm"></div>
        <span className="text-sm font-black text-indigo-950 uppercase tracking-wider">Level Distribution</span>
      </div>

      {/* Level stats boxes with 3D tactile layouts */}
      <div className="mx-4 p-4 bg-white rounded-[2.25rem] border border-slate-100/85 shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
        <div className="grid grid-cols-3 gap-3">
          {/* Lvl 1 */}
          <div className="text-center p-3.5 rounded-[1.5rem] bg-gradient-to-b from-white to-violet-50/10 border border-violet-100/60 shadow-sm flex flex-col items-center">
            <span className="text-[9px] font-black text-violet-700 bg-violet-100/80 px-2.5 py-1 rounded-full uppercase tracking-wider mb-2 block w-max">
              Lv 1
            </span>
            <p className="text-lg font-extrabold text-slate-900 font-sans tracking-tight leading-none">{lvl1.count}</p>
            <p className="text-[10px] font-bold text-violet-600 mt-2 font-sans bg-violet-50 px-1.5 py-0.5 rounded-lg border border-violet-100/20">
              ₹{lvl1.vol.toLocaleString('en-IN')}
            </p>
          </div>

          {/* Lvl 2 */}
          <div className="text-center p-3.5 rounded-[1.5rem] bg-gradient-to-b from-white to-indigo-50/10 border border-indigo-100/60 shadow-sm flex flex-col items-center">
            <span className="text-[9px] font-black text-indigo-700 bg-indigo-100/80 px-2.5 py-1 rounded-full uppercase tracking-wider mb-2 block w-max">
              Lv 2
            </span>
            <p className="text-lg font-extrabold text-slate-900 font-sans tracking-tight leading-none">{lvl2.count}</p>
            <p className="text-[10px] font-bold text-indigo-600 mt-2 font-sans bg-indigo-50 px-1.5 py-0.5 rounded-lg border border-indigo-100/20">
              ₹{lvl2.vol.toLocaleString('en-IN')}
            </p>
          </div>

          {/* Lvl 3 */}
          <div className="text-center p-3.5 rounded-[1.5rem] bg-gradient-to-b from-white to-emerald-50/10 border border-emerald-100/60 shadow-sm flex flex-col items-center">
            <span className="text-[9px] font-black text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full uppercase tracking-wider mb-2 block w-max">
              Lv 3
            </span>
            <p className="text-lg font-extrabold text-slate-900 font-sans tracking-tight leading-none">{lvl3.count}</p>
            <p className="text-[10px] font-bold text-emerald-600 mt-2 font-sans bg-emerald-50 px-1.5 py-0.5 rounded-lg border border-emerald-100/20">
              ₹{lvl3.vol.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>

      {/* Level tabs select */}
      <div className="space-y-4">
        {/* Title Divider 2 */}
        <div className="px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-5 bg-violet-600 rounded-full shadow-sm"></div>
            <span className="text-sm font-black text-indigo-950 uppercase tracking-wider">Team Members</span>
          </div>
        </div>

        {/* Level Filters in Premium Capsule Layout */}
        <div className="mx-4 p-1.5 bg-slate-100 rounded-2xl flex border border-slate-200/20 shadow-inner">
          {([1, 2, 3] as const).map((lvl) => {
            const count = lvl === 1 ? lvl1.count : lvl === 2 ? lvl2.count : lvl3.count;
            const isActive = activeLevelTab === lvl;
            return (
              <button
                key={lvl}
                onClick={() => setActiveLevelTab(lvl)}
                className={`flex-1 py-2 px-2 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  isActive
                    ? 'bg-gradient-to-b from-violet-500 to-indigo-600 text-white shadow-[0_4px_10px_rgba(99,102,241,0.22)]'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>Level {lvl}</span>
                <span className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[9px] font-bold min-w-[16px] h-4 ${
                  isActive 
                    ? 'bg-white/20 text-white border border-white/10' 
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Member list rendering */}
        <div className="px-4">
          {filteredMembers.length > 0 ? (
            <div className="space-y-3.5">
              {filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="bg-white p-4.5 rounded-[2rem] border border-slate-100 shadow-[0_8px_20px_rgba(0,0,0,0.02)] flex items-center justify-between text-left group hover:bg-slate-50/20 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    {/* Generates dynamic nice 3D initials box based on Level tab */}
                    <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${
                      activeLevelTab === 1 
                        ? 'from-violet-500 to-indigo-600' 
                        : activeLevelTab === 2 
                        ? 'from-indigo-500 to-purple-600' 
                        : 'from-emerald-400 to-teal-500'
                    } text-white flex items-center justify-center font-black text-base shadow-sm`}>
                      {member.name[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black text-slate-800 leading-none">{member.name}</span>
                        <span className="text-[9px] font-black text-violet-700 bg-violet-100/60 px-1.5 py-0.5 rounded font-sans uppercase tracking-wider">
                          Lv{member.level}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-sans mt-1 font-bold">{member.phone}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 flex items-center justify-end gap-1 font-sans">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{member.dateJoined}</span>
                    </p>
                    <p className="text-xs font-semibold text-slate-500 mt-1">
                      Invested: <strong className="font-sans text-slate-800 font-black">₹{member.totalInvested.toLocaleString('en-IN')}</strong>
                    </p>
                    {member.commissionEarned > 0 && (
                      <p className="text-[10px] font-black text-emerald-600 mt-0.5 flex items-center justify-end gap-0.5 uppercase tracking-wider">
                        <TrendingUp className="w-3 h-3 text-emerald-500" />
                        <span>+₹{member.commissionEarned.toFixed(2)}</span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty state (Perfectly polished with a high-fidelity 3D vibe) */
            <div className="py-16 px-4 bg-white rounded-[2.5rem] border border-dashed border-slate-200/80 flex flex-col items-center justify-center text-center space-y-4 shadow-[0_8px_30px_rgba(0,0,0,0.015)]">
              <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 flex items-center justify-center border border-slate-100 relative shadow-inner">
                <Users className="w-8 h-8 text-slate-300" />
                <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-violet-500 to-indigo-600 w-5.5 h-5.5 rounded-full flex items-center justify-center border-2 border-white shadow-md">
                  <span className="text-white text-[10px] font-black">+</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-black text-slate-800 uppercase tracking-wider">No Members Yet</p>
                <p className="text-xs text-slate-400 max-w-[210px] mx-auto leading-normal font-medium">
                  Invite friends to grow your Level {activeLevelTab} team and unlock massive passive commissions!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
