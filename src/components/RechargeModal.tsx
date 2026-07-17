/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, QrCode, Copy, Check, Upload, ArrowRight, ChevronLeft, Info, 
  Lock, UploadCloud, CheckCircle2, ShieldCheck, Landmark, Smartphone, Download
} from 'lucide-react';
import { UserProfile } from '../types';

interface RechargeModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onRechargeSuccess: (amount: number, utr: string, proofImage?: string) => void;
  prefilledAmount?: number;
}

export default function RechargeModal({ 
  user, 
  isOpen, 
  onClose, 
  onRechargeSuccess, 
  prefilledAmount 
}: RechargeModalProps) {
  const [step, setStep] = useState<'amount' | 'payment' | 'success'>('amount');
  const [amountInput, setAmountInput] = useState<string>('');
  const [utrInput, setUtrInput] = useState<string>('');
  const [proofImage, setProofImage] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [copiedAmount, setCopiedAmount] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [downloadingQr, setDownloadingQr] = useState<boolean>(false);

  // Load configured merchant payment gateways from Admin settings or fallback
  const [upiId, setUpiId] = useState<string>('propertyn@ybl');
  const [upiName, setUpiName] = useState<string>('PropertyN Payments Ltd');
  const [cashierUrl, setCashierUrl] = useState<string>('');
  const [minRecharge, setMinRecharge] = useState<number>(250);

  useEffect(() => {
    if (isOpen) {
      const savedUpiId = localStorage.getItem('adpaint_upi_id') || 'propertyn@ybl';
      const savedUpiName = localStorage.getItem('adpaint_upi_name') || 'PropertyN Payments Ltd';
      const savedCashierUrl = localStorage.getItem('adpaint_cashier_url') || '';
      const savedMinRecharge = parseFloat(localStorage.getItem('adpaint_min_recharge') || '250');

      setUpiId(savedUpiId);
      setUpiName(savedUpiName);
      setCashierUrl(savedCashierUrl);
      setMinRecharge(savedMinRecharge);

      // Apply prefilled amount if available
      if (prefilledAmount) {
        setAmountInput(prefilledAmount.toString());
      } else {
        setAmountInput('');
      }

      setStep('amount');
      setUtrInput('');
      setProofImage('');
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen, prefilledAmount]);

  if (!isOpen) return null;

  // Pre-fill quick amount shortcuts
  const quickAmounts = [250, 500, 1000, 2000, 5000, 10000, 20000, 50000];

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleCopyAmount = () => {
    navigator.clipboard.writeText(amountInput);
    setCopiedAmount(true);
    setTimeout(() => setCopiedAmount(false), 2000);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Image file size must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImage(reader.result as string);
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAmountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amount = parseFloat(amountInput);
    if (isNaN(amount) || amount < minRecharge) {
      setError(`Minimum deposit amount is ₹${minRecharge}`);
      return;
    }

    setStep('payment');
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Normalize and validate 12-digit UTR
    const cleanUtr = utrInput.trim().replace(/\s+/g, '');
    if (!/^\d{12}$/.test(cleanUtr)) {
      setError('Please enter a valid 12-digit UPI UTR / Ref No. (only digits)');
      return;
    }

    setIsSubmitting(true);

    // Simulate safe API delay
    setTimeout(() => {
      setIsSubmitting(false);
      onRechargeSuccess(parseFloat(amountInput), cleanUtr, proofImage || undefined);
      setStep('success');
    }, 1500);
  };

  const handleDownloadQr = async () => {
    try {
      setDownloadingQr(true);
      const response = await fetch(qrImageSrc);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payment_qr_${amountInput}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download QR directly", err);
      window.open(qrImageSrc, '_blank');
    } finally {
      setDownloadingQr(false);
    }
  };

  // Generate UPI payment payload URI
  const upiPayloadLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${amountInput}&cu=INR&tn=Recharge_${user.phone}`;
  // Use public QR Server to render the dynamic QR scanner
  const qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiPayloadLink)}`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col overflow-y-auto font-sans">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="w-full max-w-md mx-auto bg-white min-h-screen flex flex-col shadow-2xl border-x border-slate-100"
        >
          {/* Header Bar */}
          <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-700 text-white px-5 py-5 shrink-0 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              {step === 'payment' && (
                <button
                  onClick={() => setStep('amount')}
                  className="p-1.5 hover:bg-white/10 rounded-xl transition-colors text-white active:scale-95"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <div className="p-2 bg-white/15 rounded-xl border border-white/10">
                <QrCode className="w-5 h-5 text-indigo-100" />
              </div>
              <div>
                <h3 className="text-base font-black tracking-wide">Secure Cashier Gateway</h3>
                <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider">Fast Deposit • Secure Escrow</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-90"
            >
              <X className="w-5 h-5 text-white/90" />
            </button>
          </div>

          {/* Step Progress Tracker */}
          <div className="bg-slate-50/70 border-b border-slate-100 py-3.5 px-6 shrink-0">
            <div className="flex items-center justify-between relative max-w-xs mx-auto">
              {/* Connecting line */}
              <div className="absolute left-0 right-0 top-3 h-0.5 bg-slate-200 -z-10" />
              <div 
                className="absolute left-0 top-3 h-0.5 bg-indigo-600 transition-all duration-300 -z-10" 
                style={{ width: step === 'amount' ? '0%' : step === 'payment' ? '50%' : '100%' }}
              />

              {/* Step 1 */}
              <div className="flex flex-col items-center gap-1 bg-transparent">
                <div className={`w-6.5 h-6.5 rounded-full flex items-center justify-center text-[11px] font-black transition-all ${
                  step === 'amount' 
                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' 
                    : 'bg-indigo-600 text-white'
                }`}>
                  {step !== 'amount' ? <Check className="w-3.5 h-3.5" /> : '1'}
                </div>
                <span className={`text-[9px] font-black uppercase tracking-wider ${step === 'amount' ? 'text-indigo-600' : 'text-slate-400'}`}>Amount</span>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center gap-1 bg-transparent">
                <div className={`w-6.5 h-6.5 rounded-full flex items-center justify-center text-[11px] font-black transition-all ${
                  step === 'payment' 
                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' 
                    : step === 'success' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  {step === 'success' ? <Check className="w-3.5 h-3.5" /> : '2'}
                </div>
                <span className={`text-[9px] font-black uppercase tracking-wider ${step === 'payment' ? 'text-indigo-600' : 'text-slate-400'}`}>Pay</span>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center gap-1 bg-transparent">
                <div className={`w-6.5 h-6.5 rounded-full flex items-center justify-center text-[11px] font-black transition-all ${
                  step === 'success' 
                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' 
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  3
                </div>
                <span className={`text-[9px] font-black uppercase tracking-wider ${step === 'success' ? 'text-indigo-600' : 'text-slate-400'}`}>Review</span>
              </div>
            </div>
          </div>

          {/* SSL Encrypted Security Bar */}
          <div className="bg-indigo-50/50 border-b border-indigo-100/40 px-5 py-2 flex items-center justify-center gap-2 text-[10px] text-indigo-700 font-bold tracking-wide shrink-0">
            <Lock className="w-3.5 h-3.5 text-indigo-600" />
            <span>256-Bit SSL Encrypted Secure Transaction</span>
          </div>

          {/* Scrollable Main Area */}
          <div className="overflow-y-auto flex-1 p-5 space-y-5">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-bold leading-normal flex items-start gap-2 animate-shake">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {step === 'amount' && (
              <form onSubmit={handleAmountSubmit} className="space-y-6">
                {/* Input block */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Enter Deposit Amount</label>
                    <span className="text-[9px] font-black text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded-full">INR (₹)</span>
                  </div>
                  
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-3xl font-black text-indigo-600">₹</span>
                    <input
                      type="number"
                      required
                      min={minRecharge}
                      value={amountInput}
                      onChange={(e) => {
                        setAmountInput(e.target.value);
                        setError('');
                      }}
                      placeholder={`${minRecharge}`}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 focus:bg-white rounded-3xl text-3xl font-black text-slate-800 placeholder:text-slate-300 focus:outline-none transition-all font-sans shadow-inner"
                    />
                  </div>
                  
                  <div className="flex items-center gap-1.5 p-3 bg-slate-50 rounded-2xl border border-slate-100/80">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    <p className="text-[10.5px] text-slate-500 font-bold leading-none">
                      Minimum single deposit limit: <span className="text-slate-900 font-black">₹{minRecharge}</span>
                    </p>
                  </div>
                </div>

                {/* Grid of quick choices */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Select Quick Amount / राशि चुनें</label>
                  <div className="grid grid-cols-4 gap-2.5">
                    {quickAmounts.map((amt) => {
                      const isSelected = amountInput === amt.toString();
                      return (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => {
                            setAmountInput(amt.toString());
                            setError('');
                          }}
                          className={`py-3 px-1 rounded-2xl text-[11px] font-black font-sans transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 border-transparent text-white shadow-md shadow-indigo-600/30 scale-98'
                              : 'bg-white hover:bg-slate-50 border-slate-200/80 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          ₹{amt.toLocaleString()}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-extrabold text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/35 active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Proceed to Payment</span>
                  <ArrowRight className="w-4.5 h-4.5" />
                </button>

                {/* Secure checkout info list */}
                <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100 space-y-2.5 text-[10.5px] text-slate-500 font-sans">
                  <span className="font-black text-slate-700 uppercase tracking-wider block text-[9px]">Important Instructions / महत्वपूर्ण निर्देश</span>
                  <div className="flex gap-2 items-start leading-relaxed text-left">
                    <span className="text-indigo-600 font-bold">•</span>
                    <p>Enter the correct deposit amount. Any discrepancy will delay account balance update.</p>
                  </div>
                  <div className="flex gap-2 items-start leading-relaxed text-left">
                    <span className="text-indigo-600 font-bold">•</span>
                    <p>Always copy the exact amount to pay, and make sure to copy the 12-digit UTR on completion.</p>
                  </div>
                </div>
              </form>
            )}

            {step === 'payment' && (
              <form onSubmit={handlePaymentSubmit} className="space-y-6 text-left">
                {/* Billing Summary Header */}
                <div className="p-4.5 bg-gradient-to-r from-slate-900 to-indigo-950 rounded-3xl text-white flex justify-between items-center shadow-md text-left">
                  <div>
                    <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest block">PAYABLE AMOUNT</span>
                    <span className="text-2xl font-black font-sans tracking-wide">₹{parseFloat(amountInput).toFixed(2)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyAmount}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-[10px] font-black text-white transition-all active:scale-95 cursor-pointer"
                  >
                    {copiedAmount ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-indigo-300" />}
                    <span>{copiedAmount ? 'COPIED' : 'COPY'}</span>
                  </button>
                </div>

                {/* QR Section ( Razorpay Style ) */}
                <div className="flex flex-col items-center p-5 bg-slate-50/50 rounded-[2rem] border border-slate-100 space-y-4">
                  <div className="text-center space-y-1">
                    <span className="text-[10px] font-black uppercase text-indigo-700 tracking-widest bg-indigo-50 px-3.5 py-1 rounded-full border border-indigo-100">
                      Scan to Pay / QR Scanner
                    </span>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Supports PhonePe, GPay, Paytm & UPI</p>
                  </div>
                  
                  {/* QR Image Box */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 bg-white rounded-3xl border border-slate-100 shadow-md relative group">
                      <img
                        src={qrImageSrc}
                        alt="Payment QR Code"
                        referrerPolicy="no-referrer"
                        className="w-44 h-44 object-contain select-none transition-transform hover:scale-102"
                      />
                    </div>
                    
                    <button
                      type="button"
                      onClick={handleDownloadQr}
                      disabled={downloadingQr}
                      className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-indigo-600 border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-60"
                    >
                      <Download className="w-3.5 h-3.5 text-indigo-600 animate-bounce" />
                      <span>{downloadingQr ? 'Downloading...' : 'Save QR to Gallery'}</span>
                    </button>
                  </div>

                  {/* Merchant details & Quick Copy */}
                  <div className="w-full bg-white p-4 rounded-2.5xl border border-slate-100 text-center space-y-3">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Official Merchant UPI ID</p>
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-mono font-black text-indigo-950 text-sm select-all tracking-wide">{upiId}</span>
                        <button
                          type="button"
                          onClick={handleCopyUpi}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 active:scale-95 cursor-pointer"
                        >
                          {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-indigo-600" />}
                        </button>
                      </div>
                    </div>
                    
                    <div className="border-t border-slate-50 pt-2.5 text-[10px] flex items-center justify-center gap-1.5">
                      <span className="text-slate-400 font-bold uppercase tracking-wider">Business Name: </span>
                      <span className="font-black text-slate-800">{upiName}</span>
                    </div>
                  </div>
                </div>


                {/* Verification block */}
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                        Enter 12-Digit UPI UTR / Ref ID <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[9px] text-indigo-600 font-bold uppercase tracking-wider">Strictly 12 Digits Only</span>
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={12}
                      value={utrInput}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setUtrInput(val);
                        setError('');
                      }}
                      placeholder="e.g. 301928475819"
                      className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-mono text-center text-lg font-black text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner tracking-widest"
                    />
                  </div>

                  {/* Payment Proof Screenshot Uploader */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                      Upload Payment Receipt (Screenshot) / रसीद का फोटो
                    </label>
                    
                    {!proofImage ? (
                      <label className="flex flex-col items-center justify-center p-5 bg-slate-50 border-2 border-dashed border-slate-200 hover:border-indigo-400/50 rounded-2xl cursor-pointer transition-all hover:bg-slate-50/50">
                        <UploadCloud className="w-8 h-8 text-slate-400 mb-1.5 animate-pulse" />
                        <span className="text-[10.5px] font-black text-slate-600">Attach screenshot of payment</span>
                        <span className="text-[9px] text-slate-400 mt-0.5">JPEG, PNG files up to 2MB supported</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    ) : (
                      <div className="relative rounded-2xl border border-slate-100 overflow-hidden bg-slate-50 p-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={proofImage}
                            alt="Payment receipt proof"
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                          />
                          <div className="text-left">
                            <p className="text-[10.5px] font-black text-slate-800">Screenshot Attached</p>
                            <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider">Ready to upload • Max 2MB</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setProofImage('')}
                          className="p-1.5 hover:bg-slate-200 rounded-xl text-slate-400 hover:text-slate-600 transition-all mr-1 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-wait"
                  >
                    <span>{isSubmitting ? 'Verifying Transaction...' : 'Submit Deposit Request'}</span>
                  </button>

                  {/* Quick Payment Apps (Moved to very bottom / "sab se last me") */}
                  <div className="w-full space-y-2.5 border-t border-slate-100 pt-4 mt-2">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block text-center">
                      Or pay directly via UPI Apps / या सीधे भुगतान करें:
                    </span>
                    
                    <div className="grid grid-cols-1 gap-2 w-full">
                      {/* PhonePe Button */}
                      <a
                        href={`phonepe://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${amountInput}&cu=INR&tn=Recharge_${user.phone}`}
                        className="w-full py-3.5 px-4 bg-[#5f259f] hover:bg-[#4f1e85] text-white text-center text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-sm flex items-center justify-between active:scale-98"
                      >
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-3.5 h-3.5 text-purple-200" />
                          <span>Pay via PhonePe</span>
                        </div>
                        <span className="text-[8px] bg-white/20 px-1.5 py-0.5 rounded font-bold text-white/95">FAST</span>
                      </a>

                      {/* Paytm Button */}
                      <a
                        href={`paytmmp://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${amountInput}&cu=INR&tn=Recharge_${user.phone}`}
                        className="w-full py-3.5 px-4 bg-[#002970] hover:bg-[#001f54] text-white text-center text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-sm flex items-center justify-between active:scale-98"
                      >
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-3.5 h-3.5 text-sky-200" />
                          <span>Pay via Paytm</span>
                        </div>
                        <span className="text-[8px] bg-white/20 px-1.5 py-0.5 rounded font-bold text-white/95">FAST</span>
                      </a>

                      {/* Google Pay Button */}
                      <a
                        href={`gpay://to?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${amountInput}&cu=INR&tn=Recharge_${user.phone}`}
                        className="w-full py-3.5 px-4 bg-[#00875a] hover:bg-[#006f4a] text-white text-center text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-sm flex items-center justify-between active:scale-98"
                      >
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-3.5 h-3.5 text-emerald-200" />
                          <span>Pay via GPay (Google Pay)</span>
                        </div>
                        <span className="text-[8px] bg-white/20 px-1.5 py-0.5 rounded font-bold text-white/95">FAST</span>
                      </a>
                    </div>
                  </div>

                  {/* Easy Step-by-Step Payment Guide */}
                  <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100 text-[10.5px] text-slate-600 font-sans space-y-2.5 leading-relaxed text-left mt-2">
                    <p className="font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 text-[9px]">
                      <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>Payment Instructions / भुगतान निर्देश</span>
                    </p>
                    <div className="space-y-2 font-medium">
                      <div className="flex gap-2">
                        <span className="font-black text-indigo-600">1.</span>
                        <p>QR कोड स्कैन करें या ऊपर दी गई <strong className="text-slate-900">UPI ID</strong> पर पेमेंट पूरा करें।</p>
                      </div>
                      <div className="flex gap-2">
                        <span className="font-black text-indigo-600">2.</span>
                        <p>पेमेंट होने के बाद बैंक रसीद से <strong className="text-slate-900">12 अंकों का UTR Number / Ref No.</strong> कॉपी करें।</p>
                      </div>
                      <div className="flex gap-2">
                        <span className="font-black text-indigo-600">3.</span>
                        <p>नीचे बॉक्स में UTR नंबर दर्ज करें और <strong className="text-slate-900">Submit Deposit Request</strong> पर क्लिक करें।</p>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {step === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-10 px-4 text-center space-y-5"
              >
                <div className="w-18 h-18 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-100/50 animate-bounce border-4 border-emerald-50">
                  <CheckCircle2 className="w-11 h-11" />
                </div>
                
                <div className="space-y-1">
                  <h4 className="text-lg font-black text-slate-800 uppercase tracking-wide">Deposit Submitted Successfully!</h4>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest font-mono">UTR Ref: {utrInput}</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100 max-w-sm space-y-2.5 text-left text-xs leading-relaxed">
                  <p className="text-slate-600 font-medium">
                    आपका <span className="font-extrabold text-slate-900">₹{parseFloat(amountInput).toLocaleString()}</span> का रिचार्ज अनुरोध प्राप्त हो गया है।
                  </p>
                  <p className="text-slate-600 font-medium">
                    एडमिन द्वारा UTR और रसीद वेरिफिकेशन के बाद <strong className="text-indigo-600">5-10 मिनट</strong> के भीतर राशि आपके वॉलेट बैलेंस में जोड़ दी जाएगी।
                  </p>
                </div>

                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-[10px] text-emerald-800 font-bold flex items-center gap-1.5 justify-center w-full">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Secure Escrow Protection Verified</span>
                </div>

                <button
                  onClick={onClose}
                  className="w-full py-4 bg-slate-900 hover:bg-slate-950 text-white font-extrabold text-xs uppercase tracking-widest rounded-2xl transition-all shadow-md cursor-pointer"
                >
                  Return to Dashboard
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
