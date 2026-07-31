import React from 'react';

// 3D Real Wallet Icon (Green / Emerald) for RECHARGE and BALANCE
export const Real3DWalletIcon = ({ className = "w-7 h-7" }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="walletBgGrad" x1="0" y1="0" x2="0" y2="64" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#047857" />
      </linearGradient>
      <linearGradient id="cardBgGrad" x1="0" y1="0" x2="64" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#6EE7B7" />
        <stop offset="100%" stopColor="#34D399" />
      </linearGradient>
      <linearGradient id="claspBgGrad" x1="0" y1="0" x2="0" y2="20" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
      <filter id="walletShadow" x="-4" y="-4" width="72" height="72" filterUnits="userSpaceOnUse">
        <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#047857" floodOpacity="0.35" />
      </filter>
    </defs>
    {/* Card peaking out */}
    <rect x="14" y="9" width="36" height="20" rx="4" fill="url(#cardBgGrad)" />
    <rect x="18" y="14" width="10" height="4" rx="1" fill="#047857" opacity="0.6" />
    
    {/* Main Wallet Body */}
    <rect x="8" y="18" width="48" height="38" rx="9" fill="url(#walletBgGrad)" filter="url(#walletShadow)" stroke="#34D399" strokeWidth="1" />
    
    {/* Top Highlight Rim */}
    <path d="M12 24 C24 20, 40 20, 52 24" stroke="#A7F3D0" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    
    {/* Clasp Buckle */}
    <rect x="36" y="30" width="22" height="15" rx="5" fill="url(#claspBgGrad)" stroke="#FDE68A" strokeWidth="1" />
    <circle cx="44" cy="37.5" r="3" fill="#FFF" />
    <circle cx="44" cy="37.5" r="1.5" fill="#B45309" />
  </svg>
);

// 3D Real Cash Banknote Icon (Pink / Magenta) for WITHDRAW and RECHARGED
export const Real3DCashIcon = ({ className = "w-7 h-7" }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="cashGradTop" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#F472B6" />
        <stop offset="100%" stopColor="#DB2777" />
      </linearGradient>
      <linearGradient id="cashGradMid" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#EC4899" />
        <stop offset="100%" stopColor="#BE185D" />
      </linearGradient>
      <filter id="cashShadow" x="-4" y="-4" width="72" height="72">
        <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#9D174D" floodOpacity="0.35" />
      </filter>
    </defs>
    {/* Back Cash Bill */}
    <rect x="12" y="24" width="42" height="26" rx="5" fill="#831843" opacity="0.6" transform="rotate(-6 33 37)" />
    {/* Mid Cash Bill */}
    <rect x="11" y="21" width="42" height="26" rx="5" fill="url(#cashGradMid)" transform="rotate(-3 32 34)" />
    {/* Top Cash Bill */}
    <rect x="10" y="17" width="44" height="28" rx="6" fill="url(#cashGradTop)" filter="url(#cashShadow)" stroke="#FBCFE8" strokeWidth="1.5" />
    
    {/* Outer Dashed Border & Center Emblem */}
    <rect x="15" y="21" width="34" height="20" rx="4" stroke="#FCE7F3" strokeWidth="1" strokeDasharray="3 2" fill="none" opacity="0.85" />
    <circle cx="32" cy="31" r="6.5" fill="#FCE7F3" opacity="0.95" />
    <text x="32" y="34.8" textAnchor="middle" fill="#BE185D" fontSize="10.5" fontWeight="900" fontFamily="sans-serif">₹</text>
  </svg>
);

// 3D Real Telegram Icon (Official Telegram Blue)
export const Real3DTelegramIcon = ({ className = "w-7 h-7" }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="tgGradBg" x1="0" y1="0" x2="0" y2="64" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#37B7FF" />
        <stop offset="100%" stopColor="#0088CC" />
      </linearGradient>
      <filter id="tgGlowShadow" x="-4" y="-4" width="72" height="72">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#0088CC" floodOpacity="0.45" />
      </filter>
    </defs>
    {/* Telegram Outer Badge Circle */}
    <circle cx="32" cy="32" r="28" fill="url(#tgGradBg)" filter="url(#tgGlowShadow)" />
    <circle cx="32" cy="32" r="27" stroke="#93C5FD" strokeWidth="1.5" opacity="0.6" />
    {/* Highlight Arch */}
    <path d="M12 24 C20 12, 44 12, 52 24" stroke="#FFF" strokeWidth="2" strokeLinecap="round" opacity="0.35" />
    {/* Paper Plane Vector */}
    <path d="M45.5 19.5L14 31.5C11.8 32.4 11.8 33.6 13.6 34.2L21.7 36.7L40.5 24.8C41.4 24.2 42.2 24.5 41.5 25.1L26.3 38.8L26.3 46C27.4 46 27.9 45.5 28.5 44.9L33.8 39.8L42.2 46C43.8 46.9 44.9 46.4 45.3 44.5L50.8 18.6C51.4 16.2 49.9 15.1 45.5 19.5Z" fill="white" />
  </svg>
);

// 3D Real Mobile App Download Icon (Indigo / Blue Device)
export const Real3DAppIcon = ({ className = "w-7 h-7" }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="appDevGrad" x1="0" y1="0" x2="0" y2="64" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#4F46E5" />
        <stop offset="100%" stopColor="#312E81" />
      </linearGradient>
      <linearGradient id="appScreenGrad" x1="0" y1="0" x2="0" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#818CF8" />
        <stop offset="100%" stopColor="#6366F1" />
      </linearGradient>
      <filter id="appShadow" x="-4" y="-4" width="72" height="72">
        <feDropShadow dx="0" dy="4" stdDeviation="3.5" floodColor="#312E81" floodOpacity="0.4" />
      </filter>
    </defs>
    {/* Outer Mobile Frame */}
    <rect x="16" y="8" width="32" height="48" rx="8" fill="url(#appDevGrad)" filter="url(#appShadow)" stroke="#A5B4FC" strokeWidth="1.2" />
    {/* Inner Screen */}
    <rect x="19" y="14" width="26" height="36" rx="5" fill="url(#appScreenGrad)" />
    {/* Speaker Notch */}
    <rect x="27" y="10.5" width="10" height="2" rx="1" fill="#C7D2FE" opacity="0.85" />
    {/* Down Arrow / Download */}
    <path d="M32 21V33M32 33L26 27M32 33L38 27" stroke="#FFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="24" y1="37" x2="40" y2="37" stroke="#FFF" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

// 3D Real Income Growth Chart Icon (Green Growth) for TOTAL INCOME
export const Real3DIncomeIcon = ({ className = "w-7 h-7" }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="growthLineGrad" x1="0" y1="64" x2="64" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#059669" />
        <stop offset="100%" stopColor="#34D399" />
      </linearGradient>
      <filter id="chartShadow" x="-4" y="-4" width="72" height="72">
        <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#059669" floodOpacity="0.3" />
      </filter>
    </defs>
    {/* Outer Rounded Container */}
    <circle cx="32" cy="32" r="27" fill="#ECFDF5" stroke="#A7F3D0" strokeWidth="1.5" filter="url(#chartShadow)" />
    {/* Chart Bars */}
    <rect x="16" y="38" width="6" height="12" rx="2" fill="#A7F3D0" />
    <rect x="25" y="30" width="6" height="20" rx="2" fill="#34D399" />
    <rect x="34" y="24" width="6" height="26" rx="2" fill="#10B981" />
    {/* Rising Arrow Path */}
    <path d="M14 36 L26 28 L34 32 L48 18" stroke="url(#growthLineGrad)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M40 18 H48 V26" stroke="url(#growthLineGrad)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
