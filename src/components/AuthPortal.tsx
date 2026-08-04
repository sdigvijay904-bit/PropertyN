import React, { useState } from 'react';
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Gift, 
  UserCheck, 
  Headphones, 
  Check,
  ChevronRight,
  Home,
  Building2,
  Loader2
} from 'lucide-react';
import { motion } from 'motion/react';
import { openTelegramUrl } from '../lib/telegram';

interface AuthPortalProps {
  authTab: 'login' | 'register' | 'forgot';
  setAuthTab: (tab: 'login' | 'register' | 'forgot') => void;
  fullName: string;
  setFullName: (val: string) => void;
  mobileNumber: string;
  setMobileNumber: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  invitationCode: string;
  setInvitationCode: (val: string) => void;
  showPassword: boolean;
  setShowPassword: (val: boolean) => void;
  authError: string;
  setAuthError: (err: string) => void;
  handleLogin: (e: React.FormEvent) => void;
  handleRegister: (e: React.FormEvent) => void;
  handleQuickDemo: () => void;
  
  // Forgot Password props
  forgotStep: number;
  setForgotStep: (step: number) => void;
  forgotPhone: string;
  setForgotPhone: (val: string) => void;
  forgotOtpInput: string;
  setForgotOtpInput: (val: string) => void;
  forgotOtpCode: string;
  forgotNewPassword: string;
  setForgotNewPassword: (val: string) => void;
  showForgotNewPassword: boolean;
  setShowForgotNewPassword: (val: boolean) => void;
  handleForgotRequestOtp: (e: React.FormEvent) => void;
  handleForgotVerifyOtp: (e: React.FormEvent) => void;
  handleForgotResetPassword: (e: React.FormEvent) => void;
  isSubmitting?: boolean;
}

export const AuthPortal: React.FC<AuthPortalProps> = ({
  authTab,
  setAuthTab,
  fullName,
  setFullName,
  mobileNumber,
  setMobileNumber,
  password,
  setPassword,
  invitationCode,
  setInvitationCode,
  showPassword,
  setShowPassword,
  authError,
  setAuthError,
  handleLogin,
  handleRegister,
  forgotStep,
  setForgotStep,
  forgotPhone,
  setForgotPhone,
  forgotOtpInput,
  setForgotOtpInput,
  forgotOtpCode,
  forgotNewPassword,
  setForgotNewPassword,
  showForgotNewPassword,
  setShowForgotNewPassword,
  handleForgotRequestOtp,
  handleForgotVerifyOtp,
  handleForgotResetPassword,
  isSubmitting = false
}) => {
  const [agreedTerms, setAgreedTerms] = useState(true);

  const onRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedTerms) {
      setAuthError('Please agree to the User Agreement to continue.');
      return;
    }
    handleRegister(e);
  };

  return (
    <div className="flex-1 bg-gradient-to-b from-teal-800 via-teal-900 to-slate-950 text-white flex flex-col justify-start relative overflow-y-auto scrollbar-none font-sans p-3 min-[380px]:p-4 pb-28">
      {/* Background radial glow effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glass Card Container matching Website theme */}
      <div className="w-full max-w-md mx-auto bg-teal-900/90 border border-teal-700/60 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl flex flex-col my-auto relative z-10">
        
        {/* Top Header Logo Banner */}
        <div className="pt-6 pb-4 px-6 text-center relative flex flex-col items-center border-b border-teal-800/50">
          <div className="flex items-center justify-center gap-2.5 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-teal-950 rounded-[14px] flex items-center justify-center text-amber-300">
                <Home className="w-5 h-5 stroke-[2.5]" />
              </div>
            </div>
            <span className="text-2xl min-[380px]:text-3xl font-black italic tracking-tight text-white uppercase drop-shadow-md">
              PROPERTY <span className="text-emerald-400">N</span>
            </span>
          </div>
          <p className="text-[11px] text-teal-200/90 font-extrabold tracking-wide mt-0.5">
            Smart Real Estate Investment &amp; Earnings Platform
          </p>
        </div>

        {/* Register / Login Tab Bar */}
        <div className="mx-4 mt-4 border-b border-teal-800/60 flex items-center justify-around relative">
          {/* Register Tab Button */}
          <button
            type="button"
            onClick={() => {
              setAuthTab('register');
              setAuthError('');
            }}
            className={`flex-1 py-2.5 text-center font-extrabold text-sm relative transition-colors cursor-pointer select-none ${
              authTab === 'register' ? 'text-amber-300 font-black' : 'text-teal-200/70 hover:text-white'
            }`}
          >
            Register
            {authTab === 'register' && (
              <motion.div
                layoutId="authTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]"
              />
            )}
          </button>

          {/* Login Tab Button */}
          <button
            type="button"
            onClick={() => {
              setAuthTab('login');
              setAuthError('');
            }}
            className={`flex-1 py-2.5 text-center font-extrabold text-sm relative transition-colors cursor-pointer select-none ${
              authTab === 'login' ? 'text-amber-300 font-black' : 'text-teal-200/70 hover:text-white'
            }`}
          >
            Login
            {authTab === 'login' && (
              <motion.div
                layoutId="authTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]"
              />
            )}
          </button>
        </div>

        {/* Form Body Container */}
        <div className="p-4 min-[380px]:p-5 pb-6 space-y-3.5">
          {authTab === 'forgot' ? (
            /* Forgot Password Form */
            <form 
              onSubmit={
                forgotStep === 1 
                  ? handleForgotRequestOtp 
                  : forgotStep === 2 
                  ? handleForgotVerifyOtp 
                  : handleForgotResetPassword
              }
              className="space-y-3 text-left"
            >
              <div className="text-center pb-1">
                <span className="text-[10px] bg-teal-950/80 text-amber-300 font-bold px-3 py-1 rounded-full border border-teal-700 uppercase tracking-wider">
                  Step {forgotStep} of 3: {forgotStep === 1 ? "Verify Number" : forgotStep === 2 ? "Enter OTP" : "Set Password"}
                </span>
              </div>

              {forgotStep === 1 && (
                <div className="space-y-1">
                  <p className="text-[11px] text-teal-100/90 font-bold">Registered Mobile Number</p>
                  <div className="relative flex items-center bg-[#072d25] border border-teal-700/80 rounded-xl p-1 focus-within:border-amber-400 transition-all">
                    <User className="w-4 h-4 text-emerald-400 ml-2 shrink-0" />
                    <span className="text-red-400 ml-1 font-black">*</span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={forgotPhone}
                      onChange={(e) => setForgotPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="Please enter Phone number"
                      className="w-full pl-2 pr-3 py-2 bg-transparent text-xs font-semibold text-white placeholder:text-teal-500/70 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              )}

              {forgotStep === 2 && (
                <div className="space-y-1">
                  <p className="text-[11px] text-teal-100/90 font-bold">Enter 4-Digit Security OTP</p>
                  <div className="relative flex items-center bg-[#072d25] border border-teal-700/80 rounded-xl p-1 focus-within:border-amber-400 transition-all">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 ml-2 shrink-0" />
                    <span className="text-red-400 ml-1 font-black">*</span>
                    <input
                      type="text"
                      required
                      maxLength={4}
                      value={forgotOtpInput}
                      onChange={(e) => setForgotOtpInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="4-digit OTP code"
                      className="w-full pl-2 pr-3 py-2 bg-transparent text-xs font-semibold text-white placeholder:text-teal-500/70 focus:outline-none font-mono text-center tracking-widest"
                    />
                  </div>
                  <p className="text-[10px] text-emerald-300 font-mono text-center">
                    Simulated OTP: <strong className="text-amber-300">{forgotOtpCode}</strong>
                  </p>
                </div>
              )}

              {forgotStep === 3 && (
                <div className="space-y-1">
                  <p className="text-[11px] text-teal-100/90 font-bold">Set New Password</p>
                  <div className="relative flex items-center bg-[#072d25] border border-teal-700/80 rounded-xl p-1 focus-within:border-amber-400 transition-all">
                    <Lock className="w-4 h-4 text-emerald-400 ml-2 shrink-0" />
                    <span className="text-red-400 ml-1 font-black">*</span>
                    <input
                      type={showForgotNewPassword ? 'text' : 'password'}
                      required
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full pl-2 pr-9 py-2 bg-transparent text-xs font-semibold text-white placeholder:text-teal-500/70 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                      className="absolute right-3 text-emerald-400 hover:text-white"
                    >
                      {showForgotNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {authError && (
                <p className="text-[11px] font-bold text-rose-300 bg-rose-950/80 border border-rose-800 p-2 rounded-xl text-center">
                  ⚠️ {authError}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all cursor-pointer uppercase tracking-wider"
              >
                {forgotStep === 1 ? 'Request OTP' : forgotStep === 2 ? 'Verify OTP' : 'Update Password'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthTab('login');
                  setAuthError('');
                  setForgotStep(1);
                }}
                className="w-full py-2 text-xs font-bold text-teal-200 hover:text-white text-center cursor-pointer"
              >
                Back to Login
              </button>
            </form>
          ) : (
            /* Register & Login Main Form */
            <form onSubmit={authTab === 'login' ? handleLogin : onRegisterSubmit} className="space-y-3.5 text-left">
              
              {/* Phone number / Account input field */}
              <div className="space-y-1">
                <label className="text-[11px] text-teal-100/90 font-bold block">
                  Mobile Number
                </label>
                <div className="relative flex items-center bg-[#072d25] border border-teal-700/80 rounded-xl p-1 focus-within:border-amber-400 focus-within:ring-1 focus-within:ring-amber-400 transition-all shadow-inner">
                  <User className="w-4 h-4 text-emerald-400 ml-2 shrink-0" />
                  <span className="text-red-400 ml-1 font-black text-xs">*</span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="Please enter Mobile number"
                    className="w-full pl-2 pr-3 py-2 bg-transparent text-xs min-[380px]:text-sm font-semibold text-white placeholder:text-teal-500/70 focus:outline-none"
                  />
                </div>
              </div>

              {/* Full Name input field (for Register) */}
              {authTab === 'register' && (
                <div className="space-y-1">
                  <label className="text-[11px] text-teal-100/90 font-bold block">
                    Full Name
                  </label>
                  <div className="relative flex items-center bg-[#072d25] border border-teal-700/80 rounded-xl p-1 focus-within:border-amber-400 focus-within:ring-1 focus-within:ring-amber-400 transition-all shadow-inner">
                    <UserCheck className="w-4 h-4 text-emerald-400 ml-2 shrink-0" />
                    <span className="text-red-400 ml-1 font-black text-xs">*</span>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Please enter Full Name"
                      className="w-full pl-2 pr-3 py-2 bg-transparent text-xs min-[380px]:text-sm font-semibold text-white placeholder:text-teal-500/70 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Password Field */}
              <div className="space-y-1">
                <label className="text-[11px] text-teal-100/90 font-bold block">
                  {authTab === 'register' ? 'Create Password' : 'Password'}
                </label>
                <div className="relative flex items-center bg-[#072d25] border border-teal-700/80 rounded-xl p-1 focus-within:border-amber-400 focus-within:ring-1 focus-within:ring-amber-400 transition-all shadow-inner">
                  <Lock className="w-4 h-4 text-emerald-400 ml-2 shrink-0" />
                  <span className="text-red-400 ml-1 font-black text-xs">*</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-2 pr-9 py-2 bg-transparent text-xs min-[380px]:text-sm font-semibold text-white placeholder:text-teal-500/70 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-emerald-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Invitation Code (Register only) */}
              {authTab === 'register' && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] text-teal-100/90 font-bold block">
                      Invitation Code (Optional)
                    </label>
                    {invitationCode && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-extrabold px-2 py-0.5 rounded-md border border-emerald-500/40 animate-pulse flex items-center gap-1">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Referral Applied ({invitationCode})</span>
                      </span>
                    )}
                  </div>
                  <div className="relative flex items-center bg-[#072d25] border border-teal-700/80 rounded-xl p-1 focus-within:border-amber-400 focus-within:ring-1 focus-within:ring-amber-400 transition-all shadow-inner">
                    <Gift className="w-4 h-4 text-emerald-400 ml-2 shrink-0" />
                    <input
                      type="text"
                      value={invitationCode}
                      onChange={(e) => setInvitationCode(e.target.value)}
                      placeholder="Enter invitation code (optional)"
                      className="w-full pl-3 pr-3 py-2 bg-transparent text-xs min-[380px]:text-sm font-semibold text-white placeholder:text-teal-500/70 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* User Agreement Checkbox */}
              {authTab === 'register' && (
                <label className="flex items-start gap-2 pt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded border mt-0.5 shrink-0 flex items-center justify-center transition-all ${
                    agreedTerms 
                      ? 'bg-emerald-500 border-emerald-400 text-white' 
                      : 'bg-[#072d25] border-teal-700'
                  }`}>
                    {agreedTerms && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className="text-[11px] text-teal-100/90 leading-tight">
                    I am over 18 years old and have read and agreed to <span className="text-amber-300 font-bold underline">"User Agreement"</span>
                  </span>
                </label>
              )}

              {/* Forgot password link for Login tab */}
              {authTab === 'login' && (
                <div className="flex items-center justify-between text-[11px] font-bold pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab('forgot');
                      setAuthError('');
                    }}
                    className="text-amber-300 hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab('register');
                      setAuthError('');
                    }}
                    className="text-emerald-300 hover:underline cursor-pointer"
                  >
                    Create New Account
                  </button>
                </div>
              )}

              {authError && (
                <motion.p
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-[11px] font-bold text-rose-300 bg-rose-950/80 border border-rose-800 p-2.5 rounded-xl text-center"
                >
                  ⚠️ {authError}
                </motion.p>
              )}

              {/* Primary Yellow Register / Login Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-400 hover:from-yellow-200 hover:to-amber-300 disabled:opacity-70 disabled:cursor-not-allowed text-slate-950 font-black text-base shadow-[0_8px_25px_rgba(250,204,21,0.3)] active:scale-[0.98] transition-all cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2 mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-slate-950" />
                    <span>Please wait...</span>
                  </>
                ) : (
                  <>
                    <span>{authTab === 'login' ? 'Login' : 'Register'}</span>
                    <ChevronRight className="w-5 h-5 stroke-[3]" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Customer Service Footer */}
          <div className="pt-3 border-t border-teal-800/40 text-center space-y-2">
            <button
              type="button"
              onClick={() => openTelegramUrl(localStorage.getItem('adpaint_tg_support'), 'https://t.me/PropertyN_Support')}
              className="text-xs font-bold text-teal-200 hover:text-amber-300 flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer"
            >
              <Headphones className="w-4 h-4 text-amber-400" />
              <span>Need Help? Contact Customer Support</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
