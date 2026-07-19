/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, ShieldAlert, CheckCircle2, XCircle, Clock, Save, Image, Link, 
  Settings, Landmark, DollarSign, ListFilter, Sliders, Calendar, ChevronDown, Check, X
} from 'lucide-react';
import { UserProfile, TransactionRecord } from '../../types';
import { firebaseService, DepositRequest, PaymentSettings, PaymentLog } from '../../firebase/config';

interface AdminDashboardProps {
  adminUser: UserProfile;
  usersList: UserProfile[];
  setUsersList: (updatedList: UserProfile[]) => void;
  transactions: TransactionRecord[];
  setTransactions: (updatedList: TransactionRecord[]) => void;
  triggerToast: (text: string, type?: 'success' | 'info' | 'error') => void;
  onSyncState: () => void;
}

export default function AdminDashboard({ 
  adminUser, 
  usersList, 
  setUsersList, 
  transactions, 
  setTransactions, 
  triggerToast,
  onSyncState
}: AdminDashboardProps) {
  const [activeSubTab, setActiveSubTab] = useState<'deposits' | 'settings' | 'logs'>('deposits');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [logs, setLogs] = useState<PaymentLog[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Settings edit state
  const [settings, setSettings] = useState<PaymentSettings>({
    upiId: 'propertyn@ybl',
    merchantName: 'PropertyN Payments Ltd',
    qrCodeUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=600',
    minDeposit: 250,
    maxDeposit: 100000,
    updatedAt: ''
  });

  // Load Admin Data
  const loadAdminData = async () => {
    setLoading(true);
    try {
      const allDeps = await firebaseService.getDeposits();
      setDeposits(allDeps);
      
      const allLogs = await firebaseService.getLogs();
      setLogs(allLogs);

      const currentSettings = await firebaseService.getSettings();
      setSettings(currentSettings);
    } catch (err) {
      console.error("Error loading admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // Update payment settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await firebaseService.updateSettings(settings);
      triggerToast("Payment configurations updated in Firebase settings!", "success");
      onSyncState(); // sync with full stack config
    } catch (err: any) {
      triggerToast(err.message || "Failed to update settings", "error");
    }
  };

  // Handle Approve Deposit
  const handleApprove = async (deposit: DepositRequest) => {
    if (deposit.status !== 'Pending') {
      triggerToast("This deposit has already been processed!", "error");
      return;
    }

    try {
      // Find the corresponding user in usersList
      const targetUserIndex = usersList.findIndex(u => u.phone === deposit.mobileNumber || u.id === deposit.userId);
      if (targetUserIndex === -1) {
        throw new Error(`Depositor user not found in database.`);
      }

      const targetUser = usersList[targetUserIndex];
      
      // Prevent duplicate credits checks
      const isAlreadyApproved = deposits.some(d => d.id === deposit.id && d.status === 'Approved');
      if (isAlreadyApproved) {
        throw new Error("Safety Guard: This transaction is already flagged as approved!");
      }

      // Update Firestore deposit status
      const updatedDeposit = await firebaseService.updateDepositStatus(deposit.id, 'Approved', adminUser.id);

      // Update local wallet state
      const updatedUsers = [...usersList];
      const previousBalance = targetUser.balance;
      const newBalance = previousBalance + deposit.depositAmount;
      
      updatedUsers[targetUserIndex] = {
        ...targetUser,
        balance: newBalance,
        totalEarnings: targetUser.totalEarnings + deposit.depositAmount
      };

      // Add a client transaction record in synchronization logs
      const newTx: TransactionRecord = {
        id: `tx_${Date.now()}`,
        type: 'recharge',
        amount: deposit.depositAmount,
        date: new Date().toLocaleString(),
        status: 'success',
        description: `Deposit Approved (Order: ${deposit.orderId})`,
        utr: deposit.utr,
        userId: targetUser.id,
        userPhone: targetUser.phone
      };

      // Set new state list and synchronize across the database
      setUsersList(updatedUsers);
      const updatedTxs = [newTx, ...transactions];
      setTransactions(updatedTxs);

      // Trigger server save-state integration
      localStorage.setItem('adpaint_users_list', JSON.stringify(updatedUsers));
      localStorage.setItem('adpaint_transactions', JSON.stringify(updatedTxs));

      // Reload admin views
      await loadAdminData();
      triggerToast(`Successfully approved ₹${deposit.depositAmount} for ${deposit.userName}!`, "success");
      onSyncState();
    } catch (err: any) {
      triggerToast(err.message || "Failed to approve deposit", "error");
    }
  };

  // Handle Reject Deposit
  const handleReject = async (deposit: DepositRequest) => {
    if (deposit.status !== 'Pending') {
      triggerToast("This deposit has already been processed!", "error");
      return;
    }

    try {
      // Update in Firestore
      await firebaseService.updateDepositStatus(deposit.id, 'Rejected', adminUser.id);
      
      // Reload lists
      await loadAdminData();
      triggerToast(`Deposit Order rejected.`, "info");
      onSyncState();
    } catch (err: any) {
      triggerToast(err.message || "Failed to reject deposit", "error");
    }
  };

  // Filter deposits by search query (Search by User, Order ID, or UTR)
  const filteredDeposits = deposits.filter(d => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      d.userName.toLowerCase().includes(query) ||
      d.mobileNumber.toLowerCase().includes(query) ||
      d.orderId.toLowerCase().includes(query) ||
      d.utr.toLowerCase().includes(query)
    );
  });

  // Calculate statistics
  const pendingCount = deposits.filter(d => d.status === 'Pending').length;
  const approvedCount = deposits.filter(d => d.status === 'Approved').length;
  const approvedVolume = deposits.filter(d => d.status === 'Approved').reduce((acc, d) => acc + d.depositAmount, 0);

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto text-slate-800">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-wide uppercase flex items-center gap-2">
            <Sliders className="w-5 h-5 text-violet-600" />
            <span>Firebase Deposit Manager</span>
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">PropertyN Secure Operations Center</p>
        </div>
        
        {/* Toggle options tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl shrink-0 border border-slate-200">
          {[
            { id: 'deposits', label: 'Deposits', count: pendingCount },
            { id: 'settings', label: 'UPI Config', count: null },
            { id: 'logs', label: 'Logs', count: null }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-3 py-1.5 text-[10px] font-black rounded-lg uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === tab.id
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== null && tab.count > 0 && (
                <span className="bg-rose-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Admin stats dashboard strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-3 border border-slate-100 rounded-xl shadow-sm text-left">
          <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Pending Orders</span>
          <span className="text-lg font-black text-amber-500">{pendingCount}</span>
        </div>
        <div className="bg-white p-3 border border-slate-100 rounded-xl shadow-sm text-left">
          <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Approved Trans.</span>
          <span className="text-lg font-black text-emerald-500">{approvedCount}</span>
        </div>
        <div className="bg-white p-3 border border-slate-100 rounded-xl shadow-sm text-left">
          <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Approved Vol.</span>
          <span className="text-lg font-black text-violet-700">₹{approvedVolume.toLocaleString()}</span>
        </div>
      </div>

      {/* Tab Panels */}
      <AnimatePresence mode="wait">
        
        {activeSubTab === 'deposits' && (
          <motion.div
            key="deposits-tab"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-3"
          >
            {/* Search filter panel */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Depositor, Order ID, or 12-Digit UTR..."
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 outline-none focus:border-violet-500 transition-all shadow-sm"
              />
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400 font-bold">Loading deposits from Firebase...</div>
            ) : filteredDeposits.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-200 rounded-2xl py-12 text-center text-xs text-slate-400 font-bold space-y-1">
                <p>No deposit requests found matching criteria.</p>
                <p className="text-[10px] text-slate-300">New deposit requests will automatically populate here via Firebase.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDeposits.map((dep) => (
                  <div 
                    key={dep.id} 
                    className={`bg-white border rounded-2xl p-4 shadow-sm text-left transition-all relative overflow-hidden ${
                      dep.status === 'Pending' ? 'border-amber-200/60 ring-2 ring-amber-500/5' : 'border-slate-100'
                    }`}
                  >
                    {/* Status badge */}
                    <div className="absolute right-4 top-4">
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                        dep.status === 'Pending' 
                          ? 'bg-amber-50 text-amber-600 border border-amber-100' 
                          : dep.status === 'Approved'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          : 'bg-rose-50 text-rose-600 border border-rose-100'
                      }`}>
                        {dep.status}
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {/* Amount & Time */}
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-widest">Amount & Time</span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xl font-black text-violet-950">₹{dep.depositAmount.toLocaleString()}</span>
                          <span className="text-[10px] text-slate-400 font-bold">({dep.paymentTime})</span>
                        </div>
                      </div>

                      {/* User Context */}
                      <div className="grid grid-cols-2 gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100/50">
                        <div>
                          <span className="text-[8px] text-slate-400 font-bold block uppercase tracking-wider">Depositor / User</span>
                          <span className="text-xs font-extrabold text-slate-800 block truncate">{dep.userName}</span>
                          <span className="text-[10px] font-bold text-slate-500 block">{dep.mobileNumber}</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-slate-400 font-bold block uppercase tracking-wider">Order ID / UTR</span>
                          <span className="text-xs font-black text-indigo-950 font-mono block select-all">{dep.orderId}</span>
                          <span className="text-[10px] font-black text-emerald-600 font-mono block select-all">UTR: {dep.utr}</span>
                        </div>
                      </div>

                      {/* Action trigger strip */}
                      {dep.status === 'Pending' && (
                        <div className="flex gap-2 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => handleReject(dep)}
                            className="flex-1 py-2 px-3 border border-rose-200 text-rose-600 hover:bg-rose-50 active:scale-95 transition-all text-xs font-black rounded-lg uppercase tracking-wide flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleApprove(dep)}
                            className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all text-white text-xs font-black rounded-lg uppercase tracking-wide flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeSubTab === 'settings' && (
          <motion.div
            key="settings-tab"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm"
          >
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-4 flex items-center gap-1.5 text-left">
              <Settings className="w-4.5 h-4.5 text-violet-600" />
              <span>Update Deposit Gateways & Limits</span>
            </h3>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-left">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* UPI ID */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Company UPI ID</label>
                  <input
                    type="text"
                    value={settings.upiId}
                    onChange={(e) => setSettings({ ...settings, upiId: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-800 outline-none focus:border-violet-500 transition-all"
                    required
                  />
                </div>

                {/* Merchant Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Merchant Name</label>
                  <input
                    type="text"
                    value={settings.merchantName}
                    onChange={(e) => setSettings({ ...settings, merchantName: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-800 outline-none focus:border-violet-500 transition-all"
                    required
                  />
                </div>

                {/* Min Deposit */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Minimum Deposit Limit (₹)</label>
                  <input
                    type="number"
                    value={settings.minDeposit}
                    onChange={(e) => setSettings({ ...settings, minDeposit: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-800 outline-none focus:border-violet-500 transition-all"
                    required
                  />
                </div>

                {/* Max Deposit */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Maximum Deposit Limit (₹)</label>
                  <input
                    type="number"
                    value={settings.maxDeposit}
                    onChange={(e) => setSettings({ ...settings, maxDeposit: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-800 outline-none focus:border-violet-500 transition-all"
                    required
                  />
                </div>

                {/* QR Code URL */}
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Company QR Code Image URL (Firebase Storage/Unsplash)</label>
                  <input
                    type="text"
                    value={settings.qrCodeUrl}
                    onChange={(e) => setSettings({ ...settings, qrCodeUrl: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-800 outline-none focus:border-violet-500 transition-all"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-extrabold uppercase tracking-widest shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Payment Settings</span>
              </button>
            </form>
          </motion.div>
        )}

        {activeSubTab === 'logs' && (
          <motion.div
            key="logs-tab"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-3 text-left"
          >
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400 font-bold">Loading payment activity logs...</div>
            ) : logs.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-200 rounded-2xl py-8 text-center text-xs text-slate-400 font-bold">
                No logged payment actions.
              </div>
            ) : (
              <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-2 max-h-96 overflow-y-auto">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block mb-2">Payment Security Logs</span>
                {logs.map((log) => (
                  <div key={log.id} className="text-xs p-2.5 border-b border-slate-50 last:border-none flex justify-between gap-3 items-start">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                          log.action === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                          log.action === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                          log.action === 'INITIATED' ? 'bg-blue-100 text-blue-800' :
                          'bg-violet-100 text-violet-800'
                        }`}>
                          {log.action}
                        </span>
                        <span className="font-extrabold text-slate-700">{log.userPhone}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold">{log.details}</p>
                    </div>
                    <span className="text-[8px] font-bold text-slate-400 whitespace-nowrap">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}
