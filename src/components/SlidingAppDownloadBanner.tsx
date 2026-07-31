import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, Download, X, ShieldCheck, Sparkles } from 'lucide-react';

interface SlidingAppDownloadBannerProps {
  onOpenFullModal?: () => void;
  triggerToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const SlidingAppDownloadBanner: React.FC<SlidingAppDownloadBannerProps> = ({
  onOpenFullModal,
  triggerToast
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const apkUrl = localStorage.getItem('adpaint_apk_url') || 'https://raw.githubusercontent.com/adpaint-app/builds/main/PropertyN_Earnings.apk';

  useEffect(() => {
    // Slide in smoothly after 600ms whenever mounted on Register page
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
  };

  const handleDownloadClick = () => {
    if (triggerToast) {
      triggerToast('Downloading Property N Official Android Application...', 'info');
    }
    window.open(apkUrl, '_blank');
    if (onOpenFullModal) {
      onOpenFullModal();
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 140, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 140, opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 350, damping: 26 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-sm z-[999] bg-gradient-to-r from-teal-950 via-emerald-950 to-slate-950 text-white rounded-3xl p-3.5 border border-emerald-400/50 shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-2xl"
        >
          {/* Accent top gradient bar */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-1 bg-gradient-to-r from-emerald-400 via-amber-300 to-teal-400 rounded-b-full shadow-sm" />

          {/* Close button */}
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute -top-2.5 -right-2.5 w-7 h-7 bg-slate-900 text-slate-300 hover:text-white rounded-full border border-emerald-500/50 flex items-center justify-center shadow-lg transition-colors cursor-pointer"
            title="Close Banner"
          >
            <X className="w-3.5 h-3.5 stroke-[3]" />
          </button>

          <div className="flex items-center gap-3">
            {/* App Icon */}
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-amber-400 p-0.5 shadow-md shadow-emerald-500/30 flex items-center justify-center">
                <div className="w-full h-full bg-[#05231c] rounded-[14px] flex items-center justify-center text-emerald-300">
                  <Smartphone className="w-6 h-6 stroke-[2.2]" />
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-0.5 rounded-full border border-slate-900">
                <ShieldCheck className="w-3 h-3" />
              </div>
            </div>

            {/* Text details */}
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black uppercase tracking-wider text-amber-300 bg-amber-400/15 px-1.5 py-0.2 rounded border border-amber-400/30 flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5 fill-amber-300" />
                  Official App
                </span>
                <span className="text-[9px] font-bold text-emerald-300">v2.4 APK</span>
              </div>
              <h4 className="text-xs font-black text-white truncate tracking-tight mt-0.5">
                Property N Mobile App
              </h4>
              <p className="text-[10px] text-emerald-200/90 font-medium truncate leading-tight">
                Get faster access &amp; instant real estate alerts
              </p>
            </div>

            {/* Install Button */}
            <button
              type="button"
              onClick={handleDownloadClick}
              className="shrink-0 py-2 px-3 bg-gradient-to-r from-emerald-400 via-teal-400 to-amber-300 hover:from-emerald-300 hover:to-amber-200 text-slate-950 text-[11px] font-black rounded-2xl shadow-md shadow-emerald-500/30 flex items-center gap-1 active:scale-95 transition-all cursor-pointer uppercase tracking-wider"
            >
              <Download className="w-3.5 h-3.5 stroke-[3] animate-bounce" />
              <span>Install</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
