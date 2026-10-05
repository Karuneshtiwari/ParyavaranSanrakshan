import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { authAPI } from '../services/api';
import { 
  LogIn, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  Shield, 
  KeyRound,
  Truck,
  User
} from 'lucide-react';

export const LoginPage = () => {
  const { lang } = useLanguage();
  const [roleMode, setRoleMode] = useState('CITIZEN'); // 'CITIZEN', 'COLLECTOR', or 'ADMIN'
  const [loginStep, setLoginStep] = useState(1); // 1: Credentials, 2: 2FA OTP
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  // OTP states
  const [otp, setOtp] = useState('');
  const [devOtpHint, setDevOtpHint] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [error, setError] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login, loginStep1, loginStep2, adminLoginStep1, adminLoginStep2, resendOTP } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.emailVerified) {
      setInfoMessage("Email verified successfully! Please sign in below.");
      if (location.state?.email) {
        setEmail(location.state.email);
      }
    }
    if (location.state?.msg) {
      setInfoMessage(location.state.msg);
    }
  }, [location.state]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Forgot Password States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: enter email, 2: enter otp & new pass
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState(null);
  const [forgotSuccess, setForgotSuccess] = useState(null);

  const handleForgotSubmitEmail = async (e) => {
    e.preventDefault();
    const cleanMail = forgotEmail.trim().toLowerCase();
    if (!cleanMail) return;
    setForgotLoading(true);
    setForgotError(null);
    try {
      const res = await authAPI.forgotPassword(cleanMail);
      setForgotStep(2);
      setForgotSuccess(res?.data?.message || "A 6-digit password reset OTP has been dispatched to your email address.");
    } catch (err) {
      const detail = err.response?.data?.detail;
      const safeMsg = typeof detail === 'string' 
        ? detail 
        : (Array.isArray(detail) ? detail.map(d => d.msg).join(', ') : (err.message || "Could not find an account with that email."));
      setForgotError(safeMsg);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotResetPassword = async (e) => {
    e.preventDefault();
    const cleanMail = forgotEmail.trim().toLowerCase();
    const cleanOtp = forgotOtp.trim();
    if (!cleanOtp || !newPassword) return;
    setForgotLoading(true);
    setForgotError(null);
    try {
      await authAPI.resetPassword(cleanMail, cleanOtp, newPassword);
      setShowForgotModal(false);
      setInfoMessage("Password reset successfully! You can now log in with your new credentials.");
      setEmail(cleanMail);
      setForgotStep(1);
      setForgotOtp('');
      setNewPassword('');
    } catch (err) {
      const detail = err.response?.data?.detail;
      const safeMsg = typeof detail === 'string' 
        ? detail 
        : (Array.isArray(detail) ? detail.map(d => d.msg).join(', ') : (err.message || "Invalid or expired OTP. Please try again."));
      setForgotError(safeMsg);
    } finally {
      setForgotLoading(false);
    }
  };

  // Step 1: Credentials -> Dispatches 6-digit OTP for all roles
  const handleStep1 = async (e) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    setLoading(true);

    try {
      if (roleMode === 'ADMIN') {
        const res = await adminLoginStep1(email.trim(), password);
        setLoginStep(2);
        setResendCooldown(60);
        setInfoMessage(res.message || "Administrator credentials verified. A secure 6-digit OTP has been sent to your email.");
        if (res.dev_otp) setDevOtpHint(res.dev_otp);
      } else {
        const res = await loginStep1(email.trim(), password);
        setLoginStep(2);
        setResendCooldown(60);
        setInfoMessage(res.message || `Credentials verified for ${email.trim()}. A secure 6-digit OTP has been sent to your registered email.`);
      }
    } catch (err) {
      console.error("Login step 1 error:", err);
      const detail = err.response?.data?.detail;
      if (err.response?.status === 403 && detail?.includes("not verified")) {
        navigate('/register', { 
          state: { 
            pendingVerification: true, 
            email: email.trim(),
            msg: "Your email is not verified yet. An OTP has been sent. Please enter it below." 
          } 
        });
      } else {
        setError(detail || "Invalid email or password.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify 6-digit OTP & Access Role Dashboard
  const handleStep2 = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let loggedUser;
      if (roleMode === 'ADMIN') {
        loggedUser = await adminLoginStep2(email.trim(), otp.trim());
      } else {
        loggedUser = await loginStep2(email.trim(), otp.trim());
      }
      setInfoMessage("OTP verified successfully! Access granted to your dashboard.");
      const destRole = (loggedUser?.role || roleMode).toUpperCase();
      setTimeout(() => {
        if (destRole === 'ADMIN') {
          navigate('/admin/dashboard', { replace: true });
        } else if (destRole === 'COLLECTOR') {
          navigate('/collector/dashboard', { replace: true });
        } else {
          navigate('/citizen/dashboard', { replace: true });
        }
      }, 350);
    } catch (err) {
      console.error("Login OTP verification error:", err);
      setError(err.response?.data?.detail || "Invalid or expired OTP. Please verify and retry.");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    setError(null);
    setInfoMessage(null);
    try {
      const purpose = roleMode === 'ADMIN' ? "ADMIN_LOGIN" : "LOGIN";
      const res = await resendOTP(email.trim(), purpose);
      setResendCooldown(60);
      setInfoMessage(res.message || "A fresh OTP has been sent to your email.");
      if (res.dev_otp) setDevOtpHint(res.dev_otp);
    } catch (err) {
      setError("Failed to resend OTP. Please try again.");
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      
      {/* Split Card Container matching Image 2 Screen 2 */}
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[580px]">
        
        {/* Left Side: Nature / Eco Banner (Image 2 Screen 2 style) */}
        <div className="md:col-span-5 bg-gradient-to-br from-[#12372A] via-[#1b4332] to-[#2d6a4f] p-8 text-white flex flex-col justify-between relative overflow-hidden">
          
          {/* Subtle Background Glow */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-52 h-52 rounded-full bg-emerald-400/10 pointer-events-none blur-2xl"></div>

          {/* Top Brand Tag with Project Logo */}
          <div className="relative z-10 space-y-2">
            <div className="flex items-center gap-2">
              <img 
                src="/project_logo.png" 
                alt="ParyavaranSanrakshan" 
                className="h-11 w-auto object-contain brightness-0 invert" 
              />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight text-white pt-2">
              {lang === 'hi' ? 'वापसी पर स्वागत है!' : 'Welcome Back!'}
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
              {lang === 'hi'
                ? 'स्वच्छ और हरित समुदायों की ओर अपनी यात्रा जारी रखें।'
                : 'Continue your journey towards cleaner and greener communities.'}
            </p>
          </div>

          {/* Center Concept Visual - Stylish & Enlarged */}
          <div className="relative z-10 py-4 flex flex-col items-center justify-center text-center">
            <div className="relative group">
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-emerald-400 to-amber-300 opacity-30 blur-sm group-hover:opacity-50 transition duration-500"></div>
              <img 
                src="/concept.png" 
                alt="ParyavaranSanrakshan Concept" 
                className="relative w-60 sm:w-68 max-w-full h-auto object-cover rounded-3xl shadow-2xl border-2 border-emerald-400/40 hover:scale-102 transition-transform duration-500"
              />
            </div>
            <p className="text-xs text-amber-300 font-serif italic mt-3 font-medium">
              || माता भूमि: पुत्रों अहम् पृथिव्या: ||
            </p>
          </div>

          {/* Bottom Endorsement */}
          <div className="relative z-10 text-[11px] text-emerald-200/70 border-t border-emerald-800/60 pt-3">
            ParyavaranSanrakshan • Civic Environmental Intelligence
          </div>

        </div>

        {/* Right Side: Clean White Login Form Card with Identical Balanced Height */}
        <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-between min-h-[580px]">
          
          {/* Form Header with Centered Project Logo */}
          <div className="flex flex-col items-center text-center space-y-2 mb-4">
            <img 
              src="/project_logo.png" 
              alt="ParyavaranSanrakshan" 
              className="h-12 sm:h-14 w-auto object-contain mb-1" 
            />
            <h3 className="text-2xl font-bold font-serif text-[#12372A]">
              {loginStep === 2 
                ? (lang === 'hi' ? 'सुरक्षा सत्यापन (ओटीपी)' : 'Security Verification') 
                : (lang === 'hi' ? 'अपने खाते में लॉग इन करें' : 'Login to Your Account')}
            </h3>
            <p className="text-xs text-slate-500">
              {loginStep === 2 
                ? (lang === 'hi' ? `${email} पर भेजा गया 6-अंकीय ओटीपी कोड दर्ज करें` : `Enter the 6-digit OTP code sent to ${email}`) 
                : (lang === 'hi' ? 'स्वच्छ कल के लिए एआई उपकरणों का उपयोग करें।' : 'Access AI tools for a cleaner tomorrow.')}
            </p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {infoMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* Dev Mode OTP auto-helper */}
          {devOtpHint && loginStep === 2 && (
            <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
              <div>
                <span className="font-bold">Dev Mode Passkey: </span>
                <span className="font-mono text-sm tracking-widest font-bold text-amber-800">{devOtpHint}</span>
              </div>
              <button
                type="button"
                onClick={() => setOtp(devOtpHint)}
                className="px-2.5 py-1 rounded-lg bg-amber-200 hover:bg-amber-300 text-[11px] font-bold text-amber-950 transition-colors"
              >
                Auto Fill
              </button>
            </div>
          )}

          {/* ─── STEP 2: OTP VERIFICATION VIEW (ALL ROLES) ─── */}
          {loginStep === 2 ? (
            <form onSubmit={handleStep2} className="space-y-5 my-auto">
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  {lang === 'hi' ? '6-अंकीय सुरक्षा पासकोड (ओटीपी) दर्ज करें' : 'Enter 6-Digit One-Time Password (OTP)'}
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-center tracking-[8px] font-mono text-xl font-bold text-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full py-3 rounded-full bg-[#1b4332] hover:bg-[#143527] text-white font-semibold text-sm shadow-md shadow-emerald-950/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <span>{loading ? (lang === 'hi' ? 'सत्यापित हो रहा है...' : 'Verifying...') : (lang === 'hi' ? 'सत्यापित करें और प्रवेश करें' : 'Verify & Enter Dashboard')}</span>
              </button>

              <div className="flex items-center justify-between text-xs pt-1 text-slate-500">
                <button
                  type="button"
                  onClick={() => setLoginStep(1)}
                  className="hover:underline text-slate-600"
                >
                  {lang === 'hi' ? 'ईमेल बदलें' : 'Change Email'}
                </button>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resendCooldown > 0}
                  className="font-semibold text-emerald-800 hover:underline disabled:text-slate-400"
                >
                  {resendCooldown > 0 
                    ? (lang === 'hi' ? `${resendCooldown} सेकंड में पुनः भेजें` : `Resend OTP in ${resendCooldown}s`) 
                    : (lang === 'hi' ? 'ओटीपी पुनः भेजें' : 'Resend OTP')}
                </button>
              </div>

            </form>
          ) : (
            /* ─── CREDENTIALS LOGIN VIEW (CITIZEN / COLLECTOR / ADMIN STEP 1) ─── */
            <div className="flex flex-col justify-between flex-1">
              
              {/* Role Toggle Selector */}
              <div className="flex rounded-xl bg-slate-100 p-1 mb-4">
                <button
                  type="button"
                  onClick={() => { setRoleMode('CITIZEN'); setError(null); }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    roleMode === 'CITIZEN'
                      ? 'bg-white text-[#1b4332] shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>{lang === 'hi' ? 'नागरिक' : 'Citizen'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setRoleMode('COLLECTOR'); setError(null); }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    roleMode === 'COLLECTOR'
                      ? 'bg-white text-[#1b4332] shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>{lang === 'hi' ? 'संग्राहक' : 'Collector'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setRoleMode('ADMIN'); setError(null); }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    roleMode === 'ADMIN'
                      ? 'bg-white text-[#1b4332] shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{lang === 'hi' ? 'व्यवस्थापक' : 'Admin'}</span>
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleStep1} className="space-y-3.5">
                
                {/* Email Input */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    {lang === 'hi' ? 'ईमेल पता' : 'Email address'}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    {lang === 'hi' ? 'पासवर्ड' : 'Password'}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>{lang === 'hi' ? 'मुझे याद रखें' : 'Remember me'}</span>
                  </label>
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowForgotModal(true);
                      setForgotStep(1);
                      setForgotEmail(email || '');
                      setForgotError(null);
                      setForgotSuccess(null);
                    }} 
                    className="text-emerald-800 hover:underline font-medium"
                  >
                    {lang === 'hi' ? 'पासवर्ड भूल गए?' : 'Forgot password?'}
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-full bg-[#1b4332] hover:bg-[#143527] text-white font-semibold text-sm shadow-md shadow-emerald-950/20 transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
                >
                  <span>
                    {loading 
                      ? (lang === 'hi' ? 'प्रमाणीकरण हो रहा है...' : 'Authenticating...') 
                      : (lang === 'hi' ? 'क्रेडेंशियल्स सत्यापित करें' : 'Verify Credentials')}
                  </span>
                </button>

              </form>

              {/* Admin Two-Factor Assurance Note to balance height perfectly */}
              {roleMode === 'ADMIN' && (
                <div className="mt-4 p-3 rounded-xl bg-purple-50/70 border border-purple-100 flex items-center gap-2.5 text-xs text-purple-900">
                  <ShieldCheck className="w-5 h-5 text-purple-700 shrink-0" />
                  <div>
                    <span className="font-bold">{lang === 'hi' ? 'द्वि-चरणीय व्यवस्थापक सुरक्षा' : 'Two-Factor Admin Security'}</span>
                    <p className="text-[11px] text-purple-700/80 leading-tight">
                      {lang === 'hi' 
                        ? 'सत्यापन के लिए आपके पंजीकृत ईमेल पर 6-अंकीय सुरक्षा कोड भेजा जाएगा।'
                        : 'A 6-digit one-time security passkey will be dispatched to your email for authentication.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Continue with Google (Citizen / Collector Login) */}
              {roleMode !== 'ADMIN' && (
                <div className="mt-4">
                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="flex-shrink mx-4 text-xs font-semibold text-slate-400 uppercase">{lang === 'hi' ? 'या' : 'Or'}</span>
                    <div className="flex-grow border-t border-slate-200"></div>
                  </div>

                  <a
                    href={`/api/auth/google/login?role=${roleMode === 'COLLECTOR' ? 'collector' : 'citizen'}`}
                    className="w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm shadow-2xs transition-all flex items-center justify-center gap-3 active:scale-98 cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>
                      {lang === 'hi' 
                        ? `${roleMode === 'COLLECTOR' ? 'कलेक्टर' : 'नागरिक'} के रूप में Google से जारी रखें`
                        : `Continue with Google as ${roleMode === 'COLLECTOR' ? 'Collector' : 'Citizen'}`}
                    </span>
                  </a>
                </div>
              )}

              {/* Register Link */}
              <div className="mt-4 pt-3 border-t border-slate-100 text-center text-xs text-slate-600">
                {lang === 'hi' ? 'खाता नहीं है?' : "Don't have an account?"}{' '}
                <Link to="/register" className="font-semibold text-[#1b4332] hover:underline">
                  {lang === 'hi' ? 'यहाँ पंजीकरण करें' : 'Register here'}
                </Link>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* ─── FORGOT PASSWORD OTP MODAL (EXISTING USERS) ─── */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <EyeOff className="hidden" />
              <span className="text-lg leading-none">&times;</span>
            </button>

            <div className="space-y-1">
              <h3 className="text-xl font-bold font-serif text-[#12372A]">
                Reset Account Password
              </h3>
              <p className="text-xs text-slate-500">
                {forgotStep === 1 
                  ? "Enter your registered email to receive a secure 6-digit OTP passkey."
                  : `Enter the OTP sent to ${forgotEmail} along with your new password.`}
              </p>
            </div>

            {forgotError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                {forgotError}
              </div>
            )}

            {forgotSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                {forgotSuccess}
              </div>
            )}

            {forgotStep === 1 ? (
              <form onSubmit={handleForgotSubmitEmail} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Registered Email Address</label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="citizen@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-5 py-2 rounded-full bg-[#1b4332] text-white text-xs font-semibold hover:bg-[#143527] disabled:opacity-50"
                  >
                    {forgotLoading ? 'Sending OTP...' : 'Send Verification OTP'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleForgotResetPassword} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">6-Digit Passcode (OTP)</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-center tracking-[6px] font-mono text-base font-bold text-slate-800 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Enter New Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="text-xs text-slate-500 hover:underline"
                  >
                    ← Change Email
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading || forgotOtp.length < 6}
                    className="px-5 py-2 rounded-full bg-[#1b4332] text-white text-xs font-semibold hover:bg-[#143527] disabled:opacity-50"
                  >
                    {forgotLoading ? 'Updating Password...' : 'Save New Password'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
