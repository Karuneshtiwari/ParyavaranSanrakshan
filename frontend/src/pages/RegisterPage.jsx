import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Truck, 
  CheckCircle2, 
  AlertCircle, 
  KeyRound,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

export const RegisterPage = () => {
  const { lang } = useLanguage();
  const [step, setStep] = useState(1); // 1: Form, 2: OTP Verification
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('CITIZEN'); // CITIZEN or COLLECTOR (Never ADMIN)
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP state
  const [otp, setOtp] = useState('');
  const [devOtpHint, setDevOtpHint] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [error, setError] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const { register, verifyEmail, resendOTP } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.pendingVerification && location.state?.email) {
      setEmail(location.state.email);
      setStep(2);
      if (location.state?.msg) {
        setInfoMessage(location.state.msg);
      }
    }
  }, [location.state]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Step 1: Submit Registration Form
  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      const res = await register(name, email, password, role);
      setStep(2);
      setResendCooldown(60);
      setInfoMessage(res.message || `Verification passcode sent to ${email}.`);
      if (res.dev_otp) {
        setDevOtpHint(res.dev_otp);
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.response?.data?.detail || "Registration failed. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify Email with OTP
  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await verifyEmail(email, otp.trim());
      navigate('/login', { 
        state: { 
          emailVerified: true, 
          email: email 
        } 
      });
    } catch (err) {
      console.error("Email verification error:", err);
      setError(err.response?.data?.detail || "Invalid or expired OTP. Please verify and try again.");
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
      const res = await resendOTP(email, "REGISTER_VERIFY");
      setResendCooldown(60);
      setInfoMessage("A new verification code has been dispatched to your email.");
      if (res.dev_otp) {
        setDevOtpHint(res.dev_otp);
      }
    } catch (err) {
      setError("Failed to resend OTP. Please try again.");
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      
      {/* Split Card Container matching Image 2 Screen 3 */}
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[600px]">
        
        {/* Left Side: Nature Pathway Banner (Image 2 Screen 3 style) */}
        <div className="md:col-span-5 bg-gradient-to-br from-[#12372A] via-[#1b4332] to-[#2d6a4f] p-8 text-white flex flex-col justify-between relative overflow-hidden">
          
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-52 h-52 rounded-full bg-emerald-400/10 pointer-events-none blur-2xl"></div>

          <div className="relative z-10 space-y-2">
            <div className="flex items-center gap-2">
              <img 
                src="/project_logo.png" 
                alt="ParyavaranSanrakshan" 
                className="h-11 w-auto object-contain brightness-0 invert" 
              />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight text-white pt-2">
              Join ParyavaranSanrakshan
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
              Be a part of the movement towards cleaner and smarter communities.
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

          <div className="relative z-10 text-[11px] text-emerald-200/70 border-t border-emerald-800/60 pt-3">
            ParyavaranSanrakshan • Civic Environmental Intelligence
          </div>

        </div>

        {/* Right Side: Clean White Registration Form Card */}
        <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-center">
          
          {/* Header with Centered Project Logo */}
          <div className="flex flex-col items-center text-center space-y-2 mb-5">
            <img 
              src="/project_logo.png" 
              alt="ParyavaranSanrakshan" 
              className="h-12 sm:h-14 w-auto object-contain mb-1" 
            />
            <h3 className="text-2xl font-bold font-serif text-[#12372A]">
              {step === 2 
                ? 'Verify Your Email' 
                : role === 'COLLECTOR' 
                  ? 'Create a Collector Account' 
                  : 'Create a Citizen Account'}
            </h3>
            <p className="text-xs text-slate-500">
              {step === 2
                ? `Enter the 6-digit verification code sent to ${email}`
                : role === 'COLLECTOR'
                  ? 'Access optimized collection routes, dispatch priority queues, and live smart bin telemetry.'
                  : 'Start using AI to identify waste and support a cleaner environment.'}
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
          {devOtpHint && step === 2 && (
            <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
              <div>
                <span className="font-bold">Dev Verification Code: </span>
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

          {/* ─── STEP 2: EMAIL OTP VERIFICATION VIEW ─── */}
          {step === 2 ? (
            <form onSubmit={handleVerifyEmail} className="space-y-5">
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Enter 6-Digit Email Verification Code
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
                <p className="text-[11px] text-slate-400 text-center">
                  Sent from: <code className="text-slate-600">info.karuneshtiwari@gmail.com</code>
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full py-3 rounded-full bg-[#1b4332] hover:bg-[#143527] text-white font-semibold text-sm shadow-md shadow-emerald-950/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <span>{loading ? (lang === 'hi' ? 'सत्यापित हो रहा है...' : 'Verifying...') : (lang === 'hi' ? 'ईमेल सत्यापित करें और आगे बढ़ें' : 'Verify Email & Proceed to Login')}</span>
              </button>

              <div className="flex items-center justify-between text-xs pt-1 text-slate-500">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="hover:underline text-slate-600"
                >
                  {lang === 'hi' ? '← पंजीकरण विवरण बदलें' : '← Edit Registration'}
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
            /* ─── STEP 1: REGISTRATION INPUT FORM ─── */
            <form onSubmit={handleRegister} className="space-y-3.5">
              
              {/* Role Toggle Selector: Citizen vs Collector */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  {lang === 'hi' ? 'अपनी भूमिका चुनें' : 'Choose Your Role'}
                </label>
                <div className="flex rounded-xl bg-slate-100 p-1 mb-2">
                  <button
                    type="button"
                    onClick={() => setRole('CITIZEN')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                      role === 'CITIZEN'
                        ? 'bg-white text-[#1b4332] shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>{lang === 'hi' ? 'नागरिक' : 'Citizen'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('COLLECTOR')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                      role === 'COLLECTOR'
                        ? 'bg-white text-[#1b4332] shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>{lang === 'hi' ? 'कचरा संग्राहक' : 'Waste Collector'}</span>
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  {lang === 'hi' ? 'पूरा नाम' : 'Full Name'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={lang === 'hi' ? 'अपना नाम दर्ज करें' : 'Enter your name'}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs"
                  />
                </div>
              </div>

              {/* Email Address */}
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
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs"
                  />
                </div>
              </div>

              {/* Password */}
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
                    placeholder={lang === 'hi' ? 'पासवर्ड बनाएं' : 'Create a password'}
                    className="w-full pl-10 pr-10 py-2 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  {lang === 'hi' ? 'पासवर्ड की पुष्टि करें' : 'Confirm Password'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={lang === 'hi' ? 'पासवर्ड दोहराएं' : 'Confirm your password'}
                    className="w-full pl-10 pr-10 py-2 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-full bg-[#1b4332] hover:bg-[#143527] text-white font-semibold text-sm shadow-md shadow-emerald-950/20 transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer"
              >
                <span>{loading ? (lang === 'hi' ? 'खाता बनाया जा रहा है...' : 'Creating Account...') : (lang === 'hi' ? 'पंजीकरण करें' : 'Register')}</span>
              </button>

              {/* Continue with Google */}
              <div className="mt-4">
                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-4 text-xs font-semibold text-slate-400 uppercase">{lang === 'hi' ? 'या' : 'Or'}</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <a
                  href={`${import.meta.env.VITE_API_BASE_URL || (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app') ? 'https://paryavaransanrakshan.onrender.com' : '')}/api/auth/google/login?role=${role === 'COLLECTOR' ? 'collector' : 'citizen'}`}
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
                      ? `${role === 'COLLECTOR' ? 'कलेक्टर' : 'नागरिक'} के रूप में Google से जारी रखें`
                      : `Continue with Google as ${role === 'COLLECTOR' ? 'Collector' : 'Citizen'}`}
                  </span>
                </a>
              </div>

              {/* Login Link */}
              <div className="mt-4 pt-3 border-t border-slate-100 text-center text-xs text-slate-600">
                {lang === 'hi' ? 'पहले से खाता है?' : 'Already have an account?'}{' '}
                <Link to="/login" className="font-semibold text-[#1b4332] hover:underline">
                  {lang === 'hi' ? 'यहाँ लॉग इन करें' : 'Login here'}
                </Link>
              </div>

            </form>
          )}

        </div>

      </div>

    </div>
  );
};
