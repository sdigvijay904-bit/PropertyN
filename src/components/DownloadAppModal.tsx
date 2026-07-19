/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Smartphone, Copy, Check, Download, AlertTriangle, ShieldCheck, ExternalLink, HelpCircle } from 'lucide-react';

interface DownloadAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function DownloadAppModal({ isOpen, onClose, triggerToast }: DownloadAppModalProps) {
  const [copied, setCopied] = useState(false);
  const apkUrl = localStorage.getItem('adpaint_apk_url') || 'https://raw.githubusercontent.com/adpaint-app/builds/main/PropertyN_Earnings.apk';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(apkUrl);
    setCopied(true);
    if (triggerToast) {
      triggerToast('Download link copied successfully!', 'success');
    }
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="w-full max-w-md bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-rose-500 to-pink-600 text-white p-5 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-xl">
                <Smartphone className="w-5 h-5 text-rose-200" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Download Android App</h3>
                <p className="text-xs text-rose-200">Official Mobile Application (.APK)</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 p-5 space-y-5 text-left">
            {/* Primary Action Card */}
            <div className="p-5 bg-gradient-to-b from-rose-50 to-pink-50/30 rounded-3xl border border-rose-100/50 flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md border border-rose-100/40">
                <Download className="w-6 h-6 text-rose-500 animate-bounce" />
              </div>
              
              <div>
                <h4 className="text-sm font-black text-slate-800">Direct Download</h4>
                <p className="text-[11px] text-slate-500 mt-1 font-medium leading-relaxed">
                  If you are on Google Chrome or any Android browser, click the button below to download the app directly.
                </p>
              </div>

              <a
                href={apkUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-md shadow-rose-500/25 flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
              >
                <span>Download APK File</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Bulletproof Fallback URL Copy Box */}
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                Download Link (If download doesn't start)
              </span>
              <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed">
                If the download doesn't start automatically after clicking, copy this link and open it in your <strong className="text-indigo-600">Google Chrome browser</strong>:
              </p>
              
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-3">
                <span className="font-mono text-[10px] text-slate-600 font-bold truncate max-w-[240px]">
                  {apkUrl}
                </span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-rose-500" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Quick Installation Guide */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-[11px] text-slate-600 font-sans space-y-2.5 leading-relaxed">
              <p className="font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5 text-[10px]">
                <HelpCircle className="w-4 h-4 text-rose-500" />
                <span>How to Install</span>
              </p>
              
              <div className="space-y-2 font-medium">
                <div className="flex gap-2">
                  <span className="font-black text-rose-500">1.</span>
                  <p><strong>Download:</strong> Wait for the APK download to complete.</p>
                </div>
                <div className="flex gap-2">
                  <span className="font-black text-rose-500">2.</span>
                  <p><strong>Unknown Sources:</strong> Turn on "Allow installation from Unknown Sources" if prompted during installation.</p>
                </div>
                <div className="flex gap-2">
                  <span className="font-black text-rose-500">3.</span>
                  <p><strong>Install:</strong> Click "Install Anyway" and launch the app once complete!</p>
                </div>
              </div>
            </div>

            {/* Secure Escrow Protocol */}
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-[10px] text-emerald-800 font-bold flex items-center gap-1.5 justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Safe & Verified APK File (No Malware / Virus)</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
