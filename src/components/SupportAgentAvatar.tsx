/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';

interface SupportAgentAvatarProps {
  className?: string;
  src?: string;
}

// Default high-quality female customer support representative photo with headset
const DEFAULT_REAL_PHOTO = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&h=400&q=80";

export default function SupportAgentAvatar({ className = "w-full h-full", src }: SupportAgentAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const [customAvatar, setCustomAvatar] = useState<string | null>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('adpaint_support_avatar') : null;
  });

  useEffect(() => {
    const handleUpdate = () => {
      const stored = localStorage.getItem('adpaint_support_avatar');
      setCustomAvatar(stored);
      setImgError(false);
    };

    window.addEventListener('adpaint_avatar_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('adpaint_avatar_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const imageUrl = src || customAvatar || DEFAULT_REAL_PHOTO;

  if (!imgError && imageUrl) {
    return (
      <img
        src={imageUrl}
        alt="Customer Support Agent"
        className={`${className} object-cover`}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
      />
    );
  }

  // Fallback vector graphic if image fails to load
  return (
    <svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* 1. Circular Green Background */}
      <circle cx="256" cy="256" r="256" fill="#72CB8E" />
      
      {/* 2. Back Hair (Behind Head & Shoulders) */}
      <path d="M145 210C135 150 165 75 256 75C347 75 377 150 367 210C360 250 345 315 320 315C305 315 296 265 296 240C280 250 232 250 216 240C216 265 207 315 192 315C167 315 152 250 145 210Z" fill="#2C3539" />
      <path d="M155 210C148 160 172 90 256 90C340 90 364 160 357 210C350 245 338 300 315 300C300 300 292 255 292 235C278 245 234 245 220 235C220 255 212 300 197 300C174 300 162 245 155 210Z" fill="#3D484D" />

      {/* 3. White Shirt / Collar */}
      <path d="M190 280L256 360L322 280L380 480H132L190 280Z" fill="#FFFFFF" />
      <path d="M190 280L256 350L322 280L256 320Z" fill="#EEF2F6" />
      
      {/* 4. Blue Vest / Overalls */}
      <path d="M132 480H380V512H132V480Z" fill="#4F6D8A" />
      <path d="M152 300L200 480H312L360 300H320L280 420H232L192 300H152Z" fill="#4F6D8A" />
      <path d="M152 300H192L210 480H132L152 300Z" fill="#435D77" />
      <path d="M360 300H320L302 480H380L360 300Z" fill="#435D77" />
      
      {/* 5. Yellow Strap Buttons */}
      <circle cx="182" cy="392" r="11" fill="#FFDC52" />
      <circle cx="330" cy="392" r="11" fill="#FFDC52" />
      
      {/* 6. Neck */}
      <path d="M216 230H296V310H216V230Z" fill="#FFDEB5" />
      <path d="M216 270C216 270 236 295 256 295C276 295 296 270 296 270V310H216V270Z" fill="#F4C79B" />
      
      {/* 7. Ears (Kaan) */}
      <circle cx="182" cy="180" r="15" fill="#FFDEB5" />
      <circle cx="182" cy="180" r="9" fill="#F4C79B" />
      <circle cx="330" cy="180" r="15" fill="#FFDEB5" />
      <circle cx="330" cy="180" r="9" fill="#F4C79B" />

      {/* 8. Head / Face Canvas */}
      <path d="M186 160C186 110 217 80 256 80C295 80 326 110 326 160C326 220 295 270 256 270C217 270 186 220 186 160Z" fill="#FFDEB5" />
      
      {/* 9. Hair Bangs (Top Forehead Hair - Drawn ABOVE face canvas, but ABOVE eyebrows so it doesn't cover eyes) */}
      <path d="M186 142C186 100 217 80 256 80C295 80 326 100 326 142C305 120 280 115 256 115C232 115 207 120 186 142Z" fill="#2C3539" />
      <path d="M192 138C192 102 220 84 256 84C292 84 320 102 320 138C302 122 280 118 256 118C232 118 210 122 192 138Z" fill="#3D484D" />

      {/* 10. Eyebrows (Bhawen) */}
      <path d="M202 150 Q220 140 238 150" stroke="#2D3748" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M274 150 Q292 140 310 150" stroke="#2D3748" strokeWidth="4" strokeLinecap="round" fill="none" />

      {/* 11. Eyes (Aankh) - Left & Right */}
      {/* Left Eye */}
      <ellipse cx="220" cy="172" rx="14" ry="12" fill="#FFFFFF" />
      <ellipse cx="220" cy="172" rx="8" ry="9" fill="#1A202C" />
      <circle cx="217" cy="168" r="3" fill="#FFFFFF" />
      <circle cx="223" cy="175" r="1.5" fill="#FFFFFF" />
      <path d="M204 167 Q220 157 236 167" stroke="#1A202C" strokeWidth="3" strokeLinecap="round" fill="none" />

      {/* Right Eye */}
      <ellipse cx="292" cy="172" rx="14" ry="12" fill="#FFFFFF" />
      <ellipse cx="292" cy="172" rx="8" ry="9" fill="#1A202C" />
      <circle cx="289" cy="168" r="3" fill="#FFFFFF" />
      <circle cx="295" cy="175" r="1.5" fill="#FFFFFF" />
      <path d="M276 167 Q292 157 308 167" stroke="#1A202C" strokeWidth="3" strokeLinecap="round" fill="none" />

      {/* 12. Rosy Cheeks */}
      <circle cx="200" cy="196" r="14" fill="#FF8A8A" opacity="0.4" />
      <circle cx="312" cy="196" r="14" fill="#FF8A8A" opacity="0.4" />

      {/* 13. Nose (Naak) */}
      <path d="M256 180 Q262 196 252 202 Q256 204 260 202" stroke="#E29D72" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />

      {/* 14. Smiling Mouth with Teeth (Muskaan & Honth) */}
      <path d="M222 220 C222 256 290 256 290 220 Z" fill="#D53F8C" />
      <path d="M227 221 C238 238 274 238 285 221 Z" fill="#FFFFFF" />
      <path d="M220 220 Q256 225 292 220" stroke="#9B2C2C" strokeWidth="3" strokeLinecap="round" fill="none" />

      {/* 15. Headset Arc */}
      <path d="M168 180C165 110 200 48 256 48C312 48 347 110 344 180" stroke="#FFFFFF" strokeWidth="22" strokeLinecap="round" />
      
      {/* 16. Yellow Ear Cups */}
      <rect x="148" y="158" width="32" height="66" rx="14" fill="#FFDC52" />
      <rect x="332" y="158" width="32" height="66" rx="14" fill="#FFDC52" />
      <rect x="158" y="170" width="10" height="42" rx="5" fill="#E2BD3B" />
      <rect x="344" y="170" width="10" height="42" rx="5" fill="#E2BD3B" />
      
      {/* 17. Microphone Arm & Foam Mic */}
      <path d="M165 210C165 252 200 282 238 282" stroke="#FFFFFF" strokeWidth="14" strokeLinecap="round" fill="none" />
      <rect x="232" y="266" width="38" height="28" rx="10" fill="#3A4347" />
    </svg>
  );
}
