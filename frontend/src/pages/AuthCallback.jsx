import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const userRaw = searchParams.get('user');
    const error = searchParams.get('error');

    if (error) {
      setErrorMsg(decodeURIComponent(error));
      return;
    }

    if (token && userRaw) {
      try {
        const userData = JSON.parse(decodeURIComponent(userRaw));
        setSession(token, userData);

        // Redirect based on role after short delay
        const role = (userData.role || '').toUpperCase();
        setTimeout(() => {
          if (role === 'ADMIN') {
            navigate('/admin/dashboard', { replace: true });
          } else if (role === 'COLLECTOR') {
            navigate('/collector/dashboard', { replace: true });
          } else {
            navigate('/citizen/dashboard', { replace: true });
          }
        }, 500);
      } catch (err) {
        console.error("Failed to parse Google OAuth user data:", err);
        setErrorMsg("Failed to complete Google authentication session. Please try again.");
      }
    } else {
      setErrorMsg("Authentication session parameters were missing.");
    }
  }, [searchParams, navigate, setSession]);

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full p-8 rounded-3xl bg-white border border-slate-200 shadow-xl text-center space-y-6">
        
        <div className="flex justify-center">
          <img src="/project_logo.png" alt="ParyavaranSanrakshan" className="h-12 w-auto object-contain" />
        </div>

        {errorMsg ? (
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Authentication Failed</h3>
            <p className="text-sm text-slate-600">{errorMsg}</p>
            <div className="pt-2">
              <Link
                to="/login"
                className="inline-block px-6 py-2.5 rounded-full bg-[#1b4332] text-white font-semibold text-sm hover:bg-[#143527] transition-all"
              >
                Return to Login
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Authenticating with Google...</h3>
            <p className="text-sm text-slate-500">Securing your session and loading your dashboard.</p>
          </div>
        )}

      </div>
    </div>
  );
};
