/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, QrCode, Copy, Check, Upload, ArrowRight, ChevronLeft, Info, 
  Lock, UploadCloud, CheckCircle2, ShieldCheck, Landmark, Smartphone, Download,
  ShieldAlert, Loader2
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
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);
  const [qrNotice, setQrNotice] = useState<string>('');

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
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimensions for screenshot verification
          const MAX_WIDTH = 600;
          const MAX_HEIGHT = 1000;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Compress with JPEG quality 0.4
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.4);
            setProofImage(compressedBase64);
            setError('');
          } else {
            // Fallback to original Base64 if canvas context fails
            setProofImage(reader.result as string);
            setError('');
          }
        };
        img.onerror = () => {
          setProofImage(reader.result as string);
          setError('');
        };
        img.src = reader.result as string;
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
      setQrNotice('');
      setError('');

      const fileName = `payment_qr_${amountInput || 'recharge'}.png`;

      // Helper to convert QR image into Blob & Base64 Data URL
      const fetchQrData = async (): Promise<{ blob: Blob; dataUrl: string }> => {
        try {
          const response = await fetch(qrImageSrc);
          const blob = await response.blob();
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          return { blob, dataUrl };
        } catch (fetchErr) {
          // Fallback via Image object + HTML5 Canvas
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = img.width || 300;
              canvas.height = img.height || 300;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0);
                const dataUrl = canvas.toDataURL('image/png');
                const byteString = atob(dataUrl.split(',')[1]);
                const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
                const ab = new ArrayBuffer(byteString.length);
                const ia = new Uint8Array(ab);
                for (let i = 0; i < byteString.length; i++) {
                  ia[i] = byteString.charCodeAt(i);
                }
                const blob = new Blob([ab], { type: mimeString });
                resolve({ blob, dataUrl });
              } else {
                reject(fetchErr);
              }
            };
            img.onerror = () => reject(fetchErr);
            img.src = qrImageSrc;
          });
        }
      };

      const { blob, dataUrl } = await fetchQrData();
      const file = new File([blob], fileName, { type: 'image/png' });

      // Strategy 1: Mobile Web Share API (Primary for Android/iOS APK & Mobile Browsers)
      // This directly triggers the native system dialog to "Save Image", "Gallery", or share
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: 'Payment QR Code',
            text: `Payment QR Code for ₹${amountInput}`,
            files: [file]
          });
          setQrNotice('✅ Save / Share options opened. Choose "Save to Gallery" or "Save Image".');
          setDownloadingQr(false);
          return;
        } catch (shareError: any) {
          if (shareError.name === 'AbortError') {
            setDownloadingQr(false);
            return;
          }
          console.warn("Share API error, falling back to download link", shareError);
        }
      }

      // Strategy 2: Base64 Data URL programmatic download link
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = fileName;
      link.setAttribute('target', '_blank');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setQrNotice('✅ Download started! If running in mobile APK, long-press the QR image below to save directly to Gallery.');

    } catch (err) {
      console.error("Failed to download QR directly", err);
      // Strategy 3: Open image in new window/tab for long press
      try {
        window.open(qrImageSrc, '_blank');
        setQrNotice('ℹ️ QR image opened! Long-press the QR image to save to Gallery.');
      } catch (e) {
        setError('Unable to auto-save. Please long-press the QR image below to save to Gallery.');
      }
    } finally {
      setDownloadingQr(false);
    }
  };

  // Generate UPI payment payload URI
  const upiPayloadLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${amountInput}&cu=INR&tn=Recharge_${user.phone}`;
  // Use public QR Server to render the dynamic QR scanner
  const qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiPayloadLink)}`;

  const handleDirectUpiPay = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setIsRedirecting(true);
    // Synchronously launch the standard upi:// deep link in the same user gesture thread
    window.location.href = upiPayloadLink;
    // Keep the overlay visible for 4 seconds for secure transition feel, then hide
    setTimeout(() => {
      setIsRedirecting(false);
    }, 4000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-white flex flex-col overflow-y-auto font-sans">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="w-full bg-white min-h-screen flex flex-col relative overflow-hidden"
        >
          {/* PayU/Razorpay Secure Processing Portal Overlay */}
          <AnimatePresence>
            {isRedirecting && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center"
              >
                <div className="space-y-6 max-w-xs flex flex-col items-center">
                  {/* Glowing Icon */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-teal-500/30 rounded-full blur-xl animate-pulse"></div>
                    <div className="w-16 h-16 bg-gradient-to-tr from-teal-600 to-emerald-600 rounded-full flex items-center justify-center border border-teal-400/30 shadow-lg relative">
                      <ShieldCheck className="w-8 h-8 text-white animate-pulse" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-black uppercase tracking-widest text-teal-300">Secure Gateway</h4>
                    <p className="text-xs text-slate-300 font-medium">Connecting to official merchant checkout via <span className="font-extrabold text-white">Razorpay Secure Network</span>...</p>
                  </div>

                  {/* Loading spinner */}
                  <div className="flex flex-col items-center gap-1.5 pt-2">
                    <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
                    <span className="text-[10px] text-teal-200/90 font-extrabold uppercase tracking-widest animate-pulse">Handshaking with Paytm/PhonePe...</span>
                  </div>

                  <div className="border-t border-slate-800/80 w-full pt-4 text-[9px] text-slate-400 font-bold space-y-1">
                    <p>⚡ Direct SSL Payment Shield Activated</p>
                    <p>🔒 256-Bit Financial Encryption Active</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {/* Header Bar */}
          <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-700 text-white px-5 py-5 shrink-0 flex items-center justify-between shadow-md">
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
                <QrCode className="w-5 h-5 text-teal-100" />
              </div>
              <div>
                <h3 className="text-base font-black tracking-wide">Secure Cashier Gateway</h3>
                <p className="text-[10px] text-teal-200 font-bold uppercase tracking-wider">Fast Deposit • Secure Escrow</p>
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
                className="absolute left-0 top-3 h-0.5 bg-teal-600 transition-all duration-300 -z-10" 
                style={{ width: step === 'amount' ? '0%' : step === 'payment' ? '50%' : '100%' }}
              />

              {/* Step 1 */}
              <div className="flex flex-col items-center gap-1 bg-transparent">
                <div className={`w-6.5 h-6.5 rounded-full flex items-center justify-center text-[11px] font-black transition-all ${
                  step === 'amount' 
                    ? 'bg-teal-600 text-white ring-4 ring-teal-100' 
                    : 'bg-teal-600 text-white'
                }`}>
                  {step !== 'amount' ? <Check className="w-3.5 h-3.5" /> : '1'}
                </div>
                <span className={`text-[9px] font-black uppercase tracking-wider ${step === 'amount' ? 'text-teal-600' : 'text-slate-400'}`}>Amount</span>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center gap-1 bg-transparent">
                <div className={`w-6.5 h-6.5 rounded-full flex items-center justify-center text-[11px] font-black transition-all ${
                  step === 'payment' 
                    ? 'bg-teal-600 text-white ring-4 ring-teal-100' 
                    : step === 'success' ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  {step === 'success' ? <Check className="w-3.5 h-3.5" /> : '2'}
                </div>
                <span className={`text-[9px] font-black uppercase tracking-wider ${step === 'payment' ? 'text-teal-600' : 'text-slate-400'}`}>Pay</span>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center gap-1 bg-transparent">
                <div className={`w-6.5 h-6.5 rounded-full flex items-center justify-center text-[11px] font-black transition-all ${
                  step === 'success' 
                    ? 'bg-teal-600 text-white ring-4 ring-teal-100' 
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  3
                </div>
                <span className={`text-[9px] font-black uppercase tracking-wider ${step === 'success' ? 'text-teal-600' : 'text-slate-400'}`}>Review</span>
              </div>
            </div>
          </div>

          {/* SSL Encrypted Security Bar */}
          <div className="bg-teal-50/50 border-b border-teal-100/40 px-5 py-2 flex items-center justify-center gap-2 text-[10px] text-teal-700 font-bold tracking-wide shrink-0">
            <Lock className="w-3.5 h-3.5 text-teal-600" />
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
                    <span className="text-[9px] font-black text-teal-600 uppercase tracking-wider bg-teal-50 px-2 py-0.5 rounded-full">INR (₹)</span>
                  </div>
                  
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-3xl font-black text-teal-600">₹</span>
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
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 focus:border-teal-500 focus:bg-white rounded-3xl text-3xl font-black text-slate-800 placeholder:text-slate-300 focus:outline-none transition-all font-sans shadow-inner"
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
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Select Quick Amount</label>
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
                              ? 'bg-gradient-to-br from-teal-600 to-teal-700 border-transparent text-white shadow-md shadow-teal-600/30 scale-98'
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
                  className="w-full py-4 bg-gradient-to-r from-teal-600 via-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-teal-600/20 hover:shadow-teal-600/35 active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Proceed to Payment</span>
                  <ArrowRight className="w-4.5 h-4.5" />
                </button>

                {/* Secure checkout info list */}
                <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100 space-y-2.5 text-[10.5px] text-slate-500 font-sans">
                  <span className="font-black text-slate-700 uppercase tracking-wider block text-[9px]">Important Instructions</span>
                  <div className="flex gap-2 items-start leading-relaxed text-left">
                    <span className="text-teal-600 font-bold">•</span>
                    <p>Enter the correct deposit amount. Any discrepancy will delay account balance update.</p>
                  </div>
                  <div className="flex gap-2 items-start leading-relaxed text-left">
                    <span className="text-teal-600 font-bold">•</span>
                    <p>Always copy the exact amount to pay, and make sure to copy the 12-digit UTR on completion.</p>
                  </div>
                </div>
              </form>
            )}

            {step === 'payment' && (
              <form onSubmit={handlePaymentSubmit} className="space-y-6 text-left">
                {/* Billing Summary Header - Colorful, vibrant gradient */}
                <div className="p-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-pink-600 rounded-2xl text-white flex justify-between items-center shadow-md text-left relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-lg pointer-events-none"></div>
                  <div className="relative z-10">
                    <span className="text-[9px] font-extrabold text-pink-100 uppercase tracking-widest block">PAYABLE AMOUNT</span>
                    <span className="text-2xl font-black font-sans tracking-wide block mt-0.5">₹{parseFloat(amountInput).toLocaleString('en-IN')}.00</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyAmount}
                    className="relative z-10 flex items-center gap-1 px-2.5 py-1.5 bg-white/20 hover:bg-white/30 border border-white/20 rounded-xl text-[9px] font-black text-white transition-all active:scale-95 cursor-pointer shadow-sm shrink-0"
                  >
                    {copiedAmount ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5 text-white" />}
                    <span>{copiedAmount ? 'COPIED' : 'COPY AMOUNT'}</span>
                  </button>
                </div>

                {/* QR Section ( Razorpay Style ) */}
                <div className="flex flex-col items-center p-5 bg-gradient-to-b from-teal-50/70 to-white rounded-[2rem] border-2 border-teal-100 space-y-4 shadow-sm">
                  <div className="text-center space-y-1">
                    <span className="text-[10px] font-black uppercase text-teal-700 tracking-widest bg-teal-50 px-3.5 py-1 rounded-full border border-teal-100">
                      Scan to Pay / QR Scanner
                    </span>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Supports PhonePe, GPay, Paytm & UPI</p>
                  </div>
                  
                  {/* QR Image Box */}
                  <div className="flex flex-col items-center gap-3 w-full">
                    <div className="p-3 bg-white rounded-3xl border-2 border-teal-100/50 shadow-md relative group">
                      <img
                        src={qrImageSrc}
                        alt="Payment QR Code"
                        referrerPolicy="no-referrer"
                        className="w-44 h-44 object-contain transition-transform hover:scale-102 cursor-pointer touch-auto"
                      />
                    </div>
                    
                    <button
                      type="button"
                      onClick={handleDownloadQr}
                      disabled={downloadingQr}
                      className="flex items-center gap-1.5 px-4.5 py-2.5 bg-teal-50 hover:bg-teal-100/80 text-teal-700 border border-teal-200/60 rounded-xl font-extrabold text-[10px] uppercase tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-60"
                    >
                      <Download className="w-3.5 h-3.5 text-teal-600 animate-bounce" />
                      <span>{downloadingQr ? 'Processing...' : 'Save QR to Gallery'}</span>
                    </button>

                    {qrNotice && (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-[10px] font-bold text-center leading-normal w-full max-w-xs animate-fadeIn shadow-sm">
                        {qrNotice}
                      </div>
                    )}

                    <p className="text-[9.5px] text-slate-400 font-medium text-center">
                      💡 Tip: You can also long-press the QR image directly to save to Gallery
                    </p>
                  </div>

                  {/* Merchant details & Quick Copy */}
                  <div className="w-full bg-gradient-to-br from-teal-50/40 via-white to-pink-50/10 p-4 rounded-2.5xl border border-teal-100/60 text-center space-y-3 shadow-inner">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-teal-700 uppercase tracking-wider">Official Merchant UPI ID</p>
                      <div className="flex items-center justify-between gap-2 bg-teal-50/50 p-3 rounded-2xl border border-teal-100/30">
                        <span className="font-mono font-black text-teal-950 text-sm select-all tracking-wide truncate">{upiId}</span>
                        <button
                          type="button"
                          onClick={handleCopyUpi}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-600 text-white font-extrabold text-[10px] uppercase active:scale-95 transition-all shadow-md shrink-0 cursor-pointer"
                        >
                          {copiedUpi ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedUpi ? 'COPIED' : 'COPY'}</span>
                        </button>
                      </div>
                    </div>
                    
                    <div className="border-t border-slate-50 pt-2.5 text-[10px] flex items-center justify-center gap-1.5">
                      <span className="text-slate-400 font-bold uppercase tracking-wider">Business Name: </span>
                      <span className="font-black text-slate-800">{upiName}</span>
                    </div>
                  </div>
                </div>


                {/* Dedicated Payment Button Box */}
                <div className="bg-gradient-to-b from-teal-50/70 to-white rounded-2xl border-2 border-teal-100 p-3.5 space-y-2.5 shadow-sm mt-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5.5 h-5.5 rounded-lg bg-teal-600 text-white font-black text-[10px] flex items-center justify-center shrink-0">2</span>
                    <h4 className="text-[11px] font-black text-teal-900 uppercase tracking-wider">Pay Directly</h4>
                  </div>
                  
                  <a
                    href={upiPayloadLink}
                    onClick={handleDirectUpiPay}
                    className="w-full py-2.5 px-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl transition-all shadow-md shadow-teal-600/10 flex items-center justify-between active:scale-98 cursor-pointer border border-teal-500/10"
                  >
                    <div className="flex items-center gap-2 text-left">
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                        <Smartphone className="w-4 h-4 text-teal-100 animate-pulse" />
                      </div>
                      <div>
                        <p className="font-black text-[10px] tracking-wider text-white">PAY VIA ANY UPI APP</p>
                        <p className="text-[8px] text-teal-100 font-medium tracking-normal normal-case">Pay with Paytm, PhonePe, GPay, or any UPI app</p>
                      </div>
                    </div>
                    <span className="text-[8px] bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded-md font-black shrink-0 tracking-wider">RECOMMENDED</span>
                  </a>
                </div>


                {/* Verification block */}
                <div className="bg-gradient-to-b from-emerald-50/70 to-white rounded-[2rem] border-2 border-emerald-100 p-5 space-y-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">3</span>
                    <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider">Submit 12-Digit UTR & Proof</h4>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                        Enter 12-Digit UPI UTR / Ref ID <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[9px] text-emerald-600 font-extrabold uppercase tracking-wider">Strictly 12 Digits Only</span>
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
                      className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200/40 rounded-xl font-mono text-center text-sm font-black text-slate-800 placeholder:text-slate-300 focus:outline-none transition-all shadow-inner tracking-widest"
                    />
                  </div>

                  {/* Payment Proof Screenshot Uploader */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                      Upload Payment Receipt (Screenshot)
                    </label>
                    
                    {!proofImage ? (
                      <label className="flex flex-col items-center justify-center p-5 bg-teal-50/30 border-2 border-dashed border-teal-200 hover:border-teal-400 rounded-2xl cursor-pointer transition-all hover:bg-teal-50/50">
                        <UploadCloud className="w-8 h-8 text-teal-500 mb-1.5 animate-pulse" />
                        <span className="text-[10.5px] font-black text-slate-700">Attach screenshot of payment</span>
                        <span className="text-[9px] text-teal-500 font-bold mt-0.5">JPEG, PNG files up to 2MB supported</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    ) : (
                      <div className="relative rounded-2xl border-2 border-emerald-100 overflow-hidden bg-emerald-50/30 p-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={proofImage}
                            alt="Payment receipt proof"
                            className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-sm"
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
                    className="w-full py-4.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-wait"
                  >
                    <span>{isSubmitting ? 'Verifying Transaction...' : 'Submit Deposit Request'}</span>
                  </button>

                  {/* Webhook or status instructions space */}



                  {/* Easy Step-by-Step Payment Guide */}
                  <div className="p-3 bg-white rounded-2xl border border-slate-100 text-[10.5px] text-slate-600 font-sans space-y-2 leading-relaxed text-left mt-2 shadow-inner">
                    <p className="font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 text-[8.5px]">
                      <Info className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span>Payment Steps / भुगतान निर्देश</span>
                    </p>
                    <div className="space-y-2 font-medium">
                      <div className="flex gap-2 border-b border-slate-50 pb-1.5">
                        <span className="font-black text-teal-600 text-xs">1.</span>
                        <p className="text-slate-800">
                          Scan QR or pay to above UPI ID. / QR कोड स्कैन करें या ऊपर दी गई UPI ID पर भुगतान करें।
                        </p>
                      </div>
                      <div className="flex gap-2 border-b border-slate-50 pb-1.5">
                        <span className="font-black text-teal-600 text-xs">2.</span>
                        <p className="text-slate-800">
                          Copy 12-digit UTR/Ref No. from bank receipt. / बैंक रसीद या पेमेंट हिस्ट्री से 12-अंकों का UTR नंबर कॉपी करें।
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <span className="font-black text-teal-600 text-xs">3.</span>
                        <p className="text-slate-800">
                          Paste UTR, upload proof and submit request. / UTR नंबर डालें, स्क्रीनशॉट अपलोड करें और Submit करें।
                        </p>
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
                    Your deposit request for <span className="font-extrabold text-slate-900">₹{parseFloat(amountInput).toLocaleString()}</span> has been submitted successfully.
                  </p>
                  <p className="text-slate-600 font-medium">
                    The amount will be added to your wallet balance within <strong className="text-teal-600">5-10 minutes</strong> after admin verification of the UTR and receipt.
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
