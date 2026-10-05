import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  User, 
  Menu, 
  X, 
  ChevronDown, 
  LogOut, 
  History, 
  LayoutDashboard, 
  Truck, 
  ShieldCheck, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, logout, isAdmin, isCollector } = useAuth();
  const { lang, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    setProfileDropdownOpen(false);
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-emerald-900/10 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 sm:h-24">
          
          {/* Official Brand Logo - Prominent Landscape Coverage */}
          <Link to="/" className="flex items-center gap-3 group py-1">
            <img 
              src="/project_logo.png" 
              alt="ParyavaranSanrakshan" 
              className="h-12 sm:h-16 lg:h-20 w-auto max-w-[260px] sm:max-w-md object-contain transition-transform group-hover:scale-105" 
            />
          </Link>

          {/* Center Navigation Links */}
          <div className="hidden md:flex items-center gap-1 sm:gap-2">
            <Link
              to="/"
              className={`px-3.5 py-2 rounded-full text-sm font-medium transition-all ${
                isActive('/')
                  ? 'text-[#1b4332] font-semibold bg-emerald-50'
                  : 'text-slate-650 text-slate-600 hover:text-[#1b4332] hover:bg-slate-50'
              }`}
            >
              {lang === 'hi' ? 'होम' : 'Home'}
            </Link>

            <Link
              to="/scanner"
              className={`px-3.5 py-2 rounded-full text-sm font-medium transition-all ${
                isActive('/scanner')
                  ? 'text-[#1b4332] font-semibold bg-emerald-50'
                  : 'text-slate-600 hover:text-[#1b4332] hover:bg-slate-50'
              }`}
            >
              {lang === 'hi' ? 'एआई स्कैनर' : 'AI Waste Scanner'}
            </Link>

            <Link
              to="/#smart-bins"
              onClick={() => {
                const el = document.getElementById('smart-bins');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-3.5 py-2 rounded-full text-sm font-medium text-slate-600 hover:text-[#1b4332] hover:bg-slate-50 transition-all"
            >
              {lang === 'hi' ? 'स्मार्ट डिब्बे' : 'Smart Bins'}
            </Link>

            <Link
              to="/events"
              className={`px-3.5 py-2 rounded-full text-sm font-medium transition-all ${
                isActive('/events')
                  ? 'text-[#1b4332] font-semibold bg-emerald-50'
                  : 'text-slate-600 hover:text-[#1b4332] hover:bg-slate-50'
              }`}
            >
              {lang === 'hi' ? 'कार्यक्रम' : 'Events'}
            </Link>

            <Link
              to="/about"
              className={`px-3.5 py-2 rounded-full text-sm font-medium transition-all ${
                isActive('/about')
                  ? 'text-[#1b4332] font-semibold bg-emerald-50'
                  : 'text-slate-600 hover:text-[#1b4332] hover:bg-slate-50'
              }`}
            >
              {lang === 'hi' ? 'हमारे बारे में' : 'About'}
            </Link>

            {/* Donate Navigation Menu Button (Simple Green) */}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-donation-modal'))}
              className="px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold text-white bg-[#1b4332] hover:bg-[#143527] transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              <span>{lang === 'hi' ? 'दान करें' : 'Donate'}</span>
            </button>

            {isAuthenticated && !isAdmin && !isCollector && (
              <Link
                to="/citizen/dashboard"
                className={`px-3.5 py-2 rounded-full text-sm font-medium transition-all ${
                  isActive('/citizen/dashboard')
                    ? 'text-[#1b4332] font-semibold bg-emerald-50'
                    : 'text-slate-600 hover:text-[#1b4332] hover:bg-slate-50'
                }`}
              >
                {lang === 'hi' ? 'नागरिक डैशबोर्ड' : 'My Dashboard'}
              </Link>
            )}

            {isAuthenticated && (
              <Link
                to="/history"
                className={`px-3.5 py-2 rounded-full text-sm font-medium transition-all ${
                  isActive('/history')
                    ? 'text-[#1b4332] font-semibold bg-emerald-50'
                    : 'text-slate-600 hover:text-[#1b4332] hover:bg-slate-50'
                }`}
              >
                {lang === 'hi' ? 'इतिहास' : 'History'}
              </Link>
            )}

            {isCollector && (
              <Link
                to="/collector/dashboard"
                className="px-3.5 py-2 rounded-full text-sm font-medium text-amber-900 bg-amber-100/70 hover:bg-amber-100 transition-all flex items-center gap-1.5"
              >
                <Truck className="w-3.5 h-3.5 text-amber-700" />
                {lang === 'hi' ? 'संग्राहक पोर्टल' : 'Collector Portal'}
              </Link>
            )}

            {isAdmin && (
              <Link
                to="/admin/dashboard"
                className="px-3.5 py-2 rounded-full text-sm font-medium text-emerald-900 bg-emerald-100/70 hover:bg-emerald-100 transition-all flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                {lang === 'hi' ? 'व्यवस्थापक' : 'Admin Portal'}
              </Link>
            )}
          </div>

          {/* Right Header Area: Language Toggle & Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            
            {/* Clean, Non-obtrusive Language Toggle with Varnamala character 'अ' */}
            <button
              type="button"
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:border-emerald-500/50 hover:bg-emerald-50/40 text-slate-700 text-xs font-semibold shadow-xs transition-all"
              title="Toggle English / हिन्दी"
            >
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center font-serif text-xs">
                {lang === 'hi' ? 'अ' : 'A'}
              </span>
              <span className="text-[11px] text-slate-700 font-medium">
                {lang === 'hi' ? 'हिन्दी' : 'English'}
              </span>
            </button>

            {/* Auth Buttons */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-slate-200 bg-white hover:border-emerald-500/60 shadow-xs transition-all"
                >
                  <div className="w-7 h-7 rounded-full bg-[#1b4332] text-white flex items-center justify-center font-bold text-xs uppercase">
                    {user?.name ? user.name[0] : 'U'}
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-xs font-semibold text-slate-800 leading-tight">
                      {user?.name?.split(' ')[0]}
                    </p>
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider font-mono">
                      {user?.role}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>

                {/* Profile Dropdown Menu matching Image 2 Screen 7 */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#1b4332] text-white flex items-center justify-center font-bold text-sm">
                          {user?.name ? user.name[0] : 'U'}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-semibold text-slate-800 truncate">
                            {user?.name}
                          </p>
                          <p className="text-xs text-slate-500 truncate font-mono">
                            {user?.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="py-1">
                      {isAdmin && (
                        <Link
                          to="/admin/dashboard"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-[#1b4332]"
                        >
                          <LayoutDashboard className="w-4 h-4 text-emerald-700" />
                          Admin Dashboard
                        </Link>
                      )}

                      {isCollector && (
                        <Link
                          to="/collector/dashboard"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-[#1b4332]"
                        >
                          <Truck className="w-4 h-4 text-amber-600" />
                          Collector Dashboard
                        </Link>
                      )}

                      {!isAdmin && !isCollector && (
                        <Link
                          to="/citizen/dashboard"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-[#1b4332]"
                        >
                          <LayoutDashboard className="w-4 h-4 text-emerald-700" />
                          My Profile & Events
                        </Link>
                      )}

                      <Link
                        to="/history"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-[#1b4332]"
                      >
                        <History className="w-4 h-4 text-slate-500" />
                        Scan History
                      </Link>
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-full text-xs sm:text-sm font-semibold text-slate-700 border border-slate-300 hover:border-emerald-600 hover:text-[#1b4332] bg-white transition-all flex items-center gap-1.5 shadow-2xs"
                >
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>{lang === 'hi' ? 'लॉग इन' : 'Login'}</span>
                </Link>

                <Link
                  to="/register"
                  className="px-5 py-2 rounded-full text-xs sm:text-sm font-semibold bg-[#1b4332] hover:bg-[#143527] text-white shadow-sm shadow-emerald-950/20 transition-all flex items-center gap-1.5"
                >
                  <span>{lang === 'hi' ? 'शुरू करें' : 'Get Started'}</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger trigger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={toggleLanguage}
              className="px-2.5 py-1 rounded-full border border-slate-200 text-xs font-bold text-slate-700"
            >
              {lang === 'hi' ? 'अ' : 'A'}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-2 shadow-lg">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-emerald-50"
          >
            {lang === 'hi' ? 'होम' : 'Home'}
          </Link>
          <Link
            to="/scanner"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-emerald-50"
          >
            {lang === 'hi' ? 'एआई स्कैनर' : 'AI Waste Scanner'}
          </Link>
          <Link
            to="/events"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-emerald-50"
          >
            {lang === 'hi' ? 'कार्यक्रम' : 'Events'}
          </Link>
          <Link
            to="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-emerald-50"
          >
            {lang === 'hi' ? 'हमारे बारे में' : 'About'}
          </Link>
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              window.dispatchEvent(new CustomEvent('open-donation-modal'));
            }}
            className="w-full text-center px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#1b4332] hover:bg-[#143527] transition-all cursor-pointer"
          >
            <span>{lang === 'hi' ? 'दान करें' : 'Donate'}</span>
          </button>

          {isAuthenticated ? (
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="px-3 py-1 text-xs text-slate-500 font-mono">
                Signed in as {user?.email} ({user?.role})
              </div>
              {isAdmin && (
                <Link
                  to="/admin/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-sm font-medium text-emerald-800 bg-emerald-50"
                >
                  Admin Dashboard
                </Link>
              )}
              {isCollector && (
                <Link
                  to="/collector/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-sm font-medium text-amber-800 bg-amber-50"
                >
                  Collector Portal
                </Link>
              )}
              {!isAdmin && !isCollector && (
                <Link
                  to="/citizen/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-sm font-medium text-emerald-800 bg-emerald-50"
                >
                  Citizen Profile & Events
                </Link>
              )}
              <Link
                to="/history"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-medium text-slate-700"
              >
                Scan History
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center py-2 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center py-2 rounded-xl bg-[#1b4332] text-sm font-semibold text-white"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
