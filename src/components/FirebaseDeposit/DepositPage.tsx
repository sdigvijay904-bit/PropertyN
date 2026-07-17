/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Copy, CheckCircle2, ChevronRight, QrCode, CreditCard, Wallet, Sparkles, 
  Smartphone, ArrowUpRight, Clock, Download, AlertTriangle, ExternalLink, HelpCircle
} from 'lucide-react';
import { UserProfile } from '../../types';
import { firebaseService, DepositRequest, PaymentSettings } from '../../firebase/config';

// Premium Inline SVG Logos for offline & mobile rendering stability
const UpiLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 120 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(6, 4)">
      <path d="M4 22L14 7H24L14 22Z" fill="#097939" />
      <path d="M14 22L24 7H34L24 22Z" fill="#00529B" />
      <text x="38" y="22" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontStyle="italic" fontSize="21" fill="#00529B" letterSpacing="-0.5">UPI</text>
    </g>
  </svg>
);

const PhonePeIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="phonepeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8231d1" />
        <stop offset="50%" stopColor="#5f259f" />
        <stop offset="100%" stopColor="#431478" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="46" fill="url(#phonepeGrad)" />
    <path d="M 26 36 L 74 36" stroke="white" strokeWidth="8" strokeLinecap="round" />
    <path d="M 61 36 L 61 74" stroke="white" strokeWidth="8" strokeLinecap="round" />
    <path d="M 39 36 V 53 C 39 61 47 61 61 61" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M 52 36 C 47 24 39 19 31 22" stroke="white" strokeWidth="8" strokeLinecap="round" fill="none" />
  </svg>
);

const GPayIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg" fill="none">
    <rect width="100" height="100" rx="24" fill="white" stroke="#e2e8f0" strokeWidth="1" />
    <path d="M76 51.1c0-1.8-.2-3.6-.5-5.3H51v10h14c-.6 3.2-2.4 5.9-5.1 7.7v6.4h8.3C73.1 65.4 76 59 76 51.1z" fill="#4285F4" />
    <path d="M51 76.5c6.9 0 12.7-2.3 16.9-6.2l-8.3-6.4c-2.3 1.5-5.2 2.4-8.6 2.4-6.6 0-12.2-4.5-14.2-10.5H28v6.6c4.3 8.6 13.2 14.1 23 14.1z" fill="#34A853" />
    <path d="M36.8 55.8c-.5-1.5-.8-3.1-.8-4.8s.3-3.3.8-4.8v-6.6H28c-1.8 3.6-2.8 7.6-2.8 11.8s1 8.2 2.8 11.8l8.8-6.6z" fill="#FBBC05" />
    <path d="M51 36.5c3.8 0 7.1 1.3 9.8 3.9l7.3-7.3C63.7 29.1 57.9 26.5 51 26.5c-9.8 0-18.7 5.5-23 14.1l8.8 6.6c2-6 7.6-10.7 14.2-10.7z" fill="#EA4335" />
  </svg>
);

const PaytmIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="24" fill="#00baf2" opacity="0.08" />
    <rect width="100" height="100" rx="24" stroke="#00baf2" strokeWidth="1.5" strokeOpacity="0.3" />
    <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="23" letterSpacing="-1">
      <tspan fill="#00BAF2">pay</tspan>
      <tspan fill="#002970">tm</tspan>
    </text>
  </svg>
);

interface DepositPageProps {
  user: UserProfile;
  triggerToast: (text: string, type?: 'success' | 'info' | 'error') => void;
  onDepositSubmitted: (newBalance: number) => void;
  onClose?: () => void;
}

export default function DepositPage({ user, triggerToast, onDepositSubmitted, onClose }: DepositPageProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Enter Amount, 2: Gateway UI, 3: Success Screen
  const [amountInput, setAmountInput] = useState<string>('750');
  const [settings, setSettings] = useState<PaymentSettings>({
    upiId: 'propertyn@ybl',
    merchantName: 'PropertyN Payments Ltd',
    qrCodeUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=600',
    minDeposit: 250,
    maxDeposit: 100000,
    updatedAt: ''
  });

  // Active Transaction Details
  const [orderId, setOrderId] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(15 * 60); // 15 mins
  const [utr, setUtr] = useState<string>('');
  const [submittingUtr, setSubmittingUtr] = useState<boolean>(false);
  
  // Copied alerts
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [copiedAmount, setCopiedAmount] = useState<boolean>(false);
  const [copiedOrderId, setCopiedOrderId] = useState<boolean>(false);

  // Load Settings
  useEffect(() => {
    const fetchSettings = async () => {
      const liveSettings = await firebaseService.getSettings();
      setSettings(liveSettings);
    };
    fetchSettings();
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (step !== 2 || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [step, timeLeft]);

  // Format countdown time
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleStartDeposit = async () => {
    const parsedAmount = parseFloat(amountInput);
    if (isNaN(parsedAmount) || parsedAmount < settings.minDeposit || parsedAmount > settings.maxDeposit) {
      triggerToast(`Please enter an amount between ₹${settings.minDeposit} and ₹${settings.maxDeposit}`, 'error');
      return;
    }

    // Generate Order ID
    const newOrderId = `PN${Date.now()}${Math.floor(100 + Math.random() * 900)}`;
    setOrderId(newOrderId);
    setTimeLeft(15 * 60); // reset to 15 mins
    setUtr('');
    setStep(2);

    // Log the initiation of transaction
    try {
      await firebaseService.logAction(
        user.id,
        user.phone,
        'INITIATED',
        `User entered amount: ₹${parsedAmount}, Order ID: ${newOrderId}`
      );
    } catch (err) {
      console.warn("Log initiation failed:", err);
    }
  };

  const handleCopy = (text: string, type: 'upi' | 'amount' | 'orderId') => {
    navigator.clipboard.writeText(text);
    if (type === 'upi') {
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    } else if (type === 'amount') {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    } else if (type === 'orderId') {
      setCopiedOrderId(true);
      setTimeout(() => setCopiedOrderId(false), 2000);
    }
    triggerToast(`Copied successfully!`, 'success');
  };

  // UPI deep links
  const merchantUpiId = settings.upiId;
  const merchantName = settings.merchantName;
  const amtValue = parseFloat(amountInput) || 0;
  
  // Format parameters for standard UPI linking
  const pnEncoded = encodeURIComponent(merchantName);
  const tnEncoded = encodeURIComponent(`PN Deposit ${orderId}`);
  const upiUrl = `upi://pay?pa=${merchantUpiId}&pn=${pnEncoded}&am=${amtValue.toFixed(2)}&cu=INR&tn=${tnEncoded}`;

  // Individual Intent Handlers with fallback to generic UPI URL
  const handleLaunchApp = (appType: 'phonepe' | 'gpay' | 'paytm') => {
    let deepLink = upiUrl;
    if (appType === 'phonepe') {
      deepLink = `phonepe://pay?pa=${merchantUpiId}&pn=${pnEncoded}&am=${amtValue.toFixed(2)}&cu=INR&tn=${tnEncoded}`;
    } else if (appType === 'gpay') {
      deepLink = `tez://pay?pa=${merchantUpiId}&pn=${pnEncoded}&am=${amtValue.toFixed(2)}&cu=INR&tn=${tnEncoded}`;
    } else if (appType === 'paytm') {
      deepLink = `paytmmp://pay?pa=${merchantUpiId}&pn=${pnEncoded}&am=${amtValue.toFixed(2)}&cu=INR&tn=${tnEncoded}`;
    }

    firebaseService.logAction(user.id, user.phone, 'CLICKED_APP_BUTTON', `Selected launcher: ${appType} for Order: ${orderId}`);
    
    // Redirect
    window.location.href = deepLink;
    
    // Fallback if app fails to launch
    setTimeout(() => {
      window.location.href = upiUrl;
    }, 1200);
  };

  // Submit UTR Number
  const handleSubmitUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUtr = utr.trim();
    const utrRegex = /^\d{12}$/;
    if (!utrRegex.test(cleanUtr)) {
      triggerToast("UTR Number must be exactly 12 numeric digits! (UTR नंबर 12 अंकों का होना चाहिए)", 'error');
      return;
    }

    setSubmittingUtr(true);
    try {
      // 1. Save deposit record in Firestore (using firebaseService wrapper)
      await firebaseService.saveDepositRequest({
        userId: user.id,
        userName: user.name,
        email: (user as any).email || `${user.phone.replace(/[^0-9]/g, '')}@propertyn.com`,
        mobileNumber: user.phone,
        orderId: orderId,
        depositAmount: amtValue,
        utr: cleanUtr,
        paymentTime: new Date().toLocaleString()
      });

      // 2. Trigger success step
      setStep(3);
      triggerToast("Deposit request submitted successfully! Pending approval.", 'success');
    } catch (err: any) {
      triggerToast(err.message || "Failed to submit UTR", 'error');
    } finally {
      setSubmittingUtr(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-slate-50 min-h-screen flex flex-col font-sans relative overflow-x-hidden">
      
      {/* Dynamic Purple Header */}
      <div className="bg-gradient-to-r from-violet-700 via-indigo-800 to-indigo-900 text-white p-5 rounded-b-[2rem] shadow-[0_4px_20px_rgba(109,40,217,0.15)] relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-white/10 backdrop-blur-md">
              <Wallet className="w-5 h-5 text-emerald-400 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wide uppercase">PropertyN Deposit</h2>
              <p className="text-[10px] text-violet-200 uppercase font-bold tracking-widest">Firebase Payment Engine</p>
            </div>
          </div>
          {onClose && (
            <button 
              type="button" 
              onClick={onClose} 
              className="p-1.5 bg-white/10 hover:bg-white/20 active:scale-95 transition-all rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Current user context */}
        <div className="mt-4 flex items-center justify-between bg-black/10 backdrop-blur-sm rounded-xl p-3 border border-white/5">
          <div className="text-left">
            <span className="text-[9px] text-indigo-200 block uppercase font-bold tracking-wider">Depositor Account</span>
            <span className="text-xs font-extrabold text-white">{user.name} ({user.phone})</span>
          </div>
          <div className="text-right">
            <span className="text-[9px] text-indigo-200 block uppercase font-bold tracking-wider">Available Wallet</span>
            <span className="text-sm font-black text-emerald-400">₹{user.balance.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="flex-1 p-4 flex flex-col justify-between">
        
        <AnimatePresence mode="wait">
          
          {step === 1 && (
            <motion.div
              key="step-amount"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
                <div className="text-center space-y-1">
                  <h3 className="text-sm font-black text-slate-700 uppercase tracking-wide">Enter Deposit Amount</h3>
                  <p className="text-xs text-slate-400 font-bold">Minimum: ₹{settings.minDeposit} | Maximum: ₹{settings.maxDeposit}</p>
                </div>

                {/* Amount Input */}
                <div className="relative flex items-center justify-center py-2">
                  <span className="absolute left-4 text-2xl font-black text-slate-400">₹</span>
                  <input
                    type="number"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200/50 rounded-2xl text-center text-2xl font-black text-violet-950 transition-all outline-none"
                  />
                </div>

                {/* Quick Presets Grid */}
                <div className="grid grid-cols-4 gap-2">
                  {['250', '500', '1000', '2000', '5000', '10000', '20000', '50000'].map((preset) => {
                    const presetNum = parseFloat(preset);
                    if (presetNum < settings.minDeposit || presetNum > settings.maxDeposit) return null;
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setAmountInput(preset)}
                        className={`py-2 px-1 text-xs font-black rounded-xl border transition-all active:scale-95 ${
                          amountInput === preset
                            ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-transparent shadow-md'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        ₹{preset}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={handleStartDeposit}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-extrabold text-sm shadow-md hover:shadow-violet-200 hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  <span>Proceed to Pay / आगे बढ़ें</span>
                </button>
              </div>

              {/* Safety notice info box */}
              <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 flex gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-left text-[11px] leading-relaxed text-amber-800 font-bold">
                  <p className="font-extrabold uppercase text-amber-900 tracking-wide">Security Guarantee (सुरक्षा गारंटी):</p>
                  <p>All deposits are protected by secure Firebase Auth and monitored directly by our executive admin team. Please do not submit false UTRs as it can lead to account suspension.</p>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-gateway"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Timer & Amount Header Card */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col items-center space-y-4 text-center">
                
                {/* Countdown Timer with warning color state */}
                <div className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black tracking-wide border uppercase ${
                  timeLeft < 3 * 60 
                    ? 'bg-rose-50 border-rose-100 text-rose-600 animate-pulse'
                    : 'bg-violet-50 border-violet-100 text-violet-700'
                }`}>
                  <Clock className="w-3.5 h-3.5" />
                  <span>Session Expires: {formatTime(timeLeft)}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">DEPOSIT AMOUNT (भुगतान राशि)</span>
                  <span className="text-4xl font-black text-violet-950 font-sans block">₹{amtValue.toLocaleString()}</span>
                </div>

                {/* Row of copy buttons for amount & order id */}
                <div className="flex gap-2 w-full justify-center">
                  <button
                    type="button"
                    onClick={() => handleCopy(amountInput, 'amount')}
                    className="flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy Amount</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(orderId, 'orderId')}
                    className="flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy Order ID</span>
                  </button>
                </div>
              </div>

              {/* UPI Quick Launchers Section */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-700 uppercase tracking-wide">⚡ Pay Instantly via UPI App</span>
                  <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-full uppercase tracking-wider">Fastest</span>
                </div>
                
                <p className="text-[11px] text-slate-400 font-bold leading-relaxed text-left">
                  Click any app below to pay instantly. The payment amount and merchant reference will be auto-filled in your app!
                </p>

                {/* App Buttons Grid */}
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleLaunchApp('phonepe')}
                    className="flex flex-col items-center justify-center p-3.5 bg-white hover:bg-violet-50/40 border border-slate-100 hover:border-violet-200 rounded-xl transition-all active:scale-95 group shadow-sm"
                  >
                    <PhonePeIcon className="w-9 h-9 mb-1.5 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black text-slate-800">PhonePe</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLaunchApp('gpay')}
                    className="flex flex-col items-center justify-center p-3.5 bg-white hover:bg-violet-50/40 border border-slate-100 hover:border-violet-200 rounded-xl transition-all active:scale-95 group shadow-sm"
                  >
                    <GPayIcon className="w-9 h-9 mb-1.5 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black text-slate-800">Google Pay</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLaunchApp('paytm')}
                    className="flex flex-col items-center justify-center p-3.5 bg-white hover:bg-violet-50/40 border border-slate-100 hover:border-violet-200 rounded-xl transition-all active:scale-95 group shadow-sm"
                  >
                    <PaytmIcon className="w-9 h-9 mb-1.5 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black text-slate-800">Paytm</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => window.location.href = upiUrl}
                  className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-extrabold text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <UpiLogo className="w-6 h-4 grayscale opacity-80" />
                  <span>Open Any Other UPI App</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>

              {/* QR Code Fallback and Manual Copy Card */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wide block text-left">OR TRANSFER MANUALLY (मैन्युअल ट्रांसफर)</span>

                {/* QR Code Display & Fallback */}
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center space-y-3">
                  <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm relative group overflow-hidden">
                    <img
                      src={settings.qrCodeUrl || "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=600"}
                      alt="Merchant QR"
                      className="w-36 h-36 object-contain pointer-events-none"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <QrCode className="w-8 h-8 text-white filter drop-shadow-md" />
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="text-[11px] font-extrabold text-slate-800 block">{settings.merchantName}</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Scan to Pay using scanner</span>
                  </div>
                </div>

                {/* Merchant UPI copy box */}
                <div className="space-y-1.5 text-left">
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Merchant UPI ID (यूपीआई आईडी)</span>
                  <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-xs font-black font-mono text-violet-950 truncate select-all">{settings.upiId}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(settings.upiId, 'upi')}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all shrink-0 ${
                        copiedUpi
                          ? 'bg-emerald-50 border border-emerald-100 text-emerald-600'
                          : 'bg-violet-50 border border-violet-100 text-violet-600 hover:bg-violet-100'
                      }`}
                    >
                      {copiedUpi ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy ID</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* UTR Form Card */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
                <div className="space-y-1 text-center">
                  <span className="text-xs font-black text-violet-700 uppercase tracking-wide block">3. Submit 12-digit UTR No.</span>
                  <p className="text-[11px] text-slate-400 font-bold leading-relaxed">
                    Once payment is done, copy the 12-digit UTR/Ref No. from your bank app history and paste it below to credit immediately.
                  </p>
                </div>

                <form onSubmit={handleSubmitUtr} className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={12}
                      value={utr}
                      onChange={(e) => setUtr(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="Enter 12-Digit UTR Number"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200/50 rounded-xl text-center text-sm font-black tracking-[0.2em] font-mono text-slate-800 transition-all outline-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingUtr}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                  >
                    {submittingUtr ? (
                      <span>Verifying & Submitting...</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Submit UTR (यूटीआर जमा करें)</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step-success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm text-center space-y-5"
            >
              <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mx-auto shadow-inner text-emerald-500">
                <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-800">Deposit Submitted!</h3>
                <p className="text-xs text-slate-400 font-bold leading-relaxed">
                  Your deposit request of <span className="text-violet-700 font-black">₹{amtValue}</span> has been securely logged with Order ID: <span className="font-mono text-slate-700">{orderId}</span>.
                </p>
                <p className="text-[11px] text-emerald-600 font-black bg-emerald-50 rounded-lg p-2.5">
                  Your UTR: {utr} is currently being verified. Balance will be updated in your wallet automatically upon admin approval.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  onDepositSubmitted(user.balance); // triggers app refresh
                  setStep(1);
                  if (onClose) onClose();
                }}
                className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-extrabold text-xs shadow-md"
              >
                Done / वापिस जाएँ
              </button>
            </motion.div>
          )}

        </AnimatePresence>

      </div>
    </div>
  );
}
