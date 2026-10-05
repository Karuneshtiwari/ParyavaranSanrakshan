import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Sidebar } from './components/Sidebar';

import { LandingPage } from './pages/LandingPage';
import { AboutPage } from './pages/AboutPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ScannerPage } from './pages/ScannerPage';
import { HistoryPage } from './pages/HistoryPage';
import { EventsPage } from './pages/EventsPage';
import { ActivityPage } from './pages/ActivityPage';
import { AuthCallback } from './pages/AuthCallback';

import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminBins } from './pages/admin/AdminBins';
import { AdminPredictions } from './pages/admin/AdminPredictions';
import { AdminPriority } from './pages/admin/AdminPriority';
import { AdminAnalytics } from './pages/admin/AdminAnalytics';
import { AdminModels } from './pages/admin/AdminModels';
import { AdminCollections } from './pages/admin/AdminCollections';
import { AdminBlogs } from './pages/admin/AdminBlogs';
import { AdminEvents } from './pages/admin/AdminEvents';
import { AdminUsers } from './pages/admin/AdminUsers';

import { CollectorDashboard } from './pages/collector/CollectorDashboard';
import { CollectorPriority } from './pages/collector/CollectorPriority';
import { CitizenDashboard } from './pages/CitizenDashboard';
import { DonationModal } from './components/DonationModal';

// Route Guard to prevent unauthenticated access
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles) {
    const userRole = (user.role || '').toUpperCase();
    const allowed = allowedRoles.map(r => r.toUpperCase());
    if (!allowed.includes(userRole)) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

// Admin Layout wrapper with operations Sidebar
const AdminLayout = ({ children }) => {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#f7faf7]">
      <Sidebar role="ADMIN" />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
};

// Collector Layout wrapper
const CollectorLayout = ({ children }) => {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#f7faf7]">
      <Sidebar role="COLLECTOR" />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
};

const AppContent = () => {
  const location = useLocation();
  const isDashboard = 
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/collector') ||
    location.pathname.startsWith('/citizen') ||
    location.pathname.startsWith('/profile');

  return (
    <div className="min-h-screen flex flex-col bg-[#f7faf7] text-slate-800 selection:bg-emerald-500 selection:text-white">
      {!isDashboard && <Navbar />}
      
      <div className="flex-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/activity/:id" element={<ActivityPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/scanner" element={<ScannerPage />} />
          <Route path="/history" element={<HistoryPage />} />

          {/* Protected Admin Routes */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/bins" element={<ProtectedRoute allowedRoles={['ADMIN', 'COLLECTOR']}><AdminLayout><AdminBins /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/predictions" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminLayout><AdminPredictions /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/priority" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminLayout><AdminPriority /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/blogs" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminLayout><AdminBlogs /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/events" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminLayout><AdminEvents /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminLayout><AdminAnalytics /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/models" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminLayout><AdminModels /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/collections" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminLayout><AdminCollections /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminLayout><AdminUsers /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/scanner" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminLayout><ScannerPage isEmbedded={true} /></AdminLayout></ProtectedRoute>} />

          {/* Protected Collector Routes */}
          <Route path="/collector" element={<Navigate to="/collector/dashboard" replace />} />
          <Route path="/collector/dashboard" element={<ProtectedRoute allowedRoles={['COLLECTOR', 'ADMIN']}><CollectorDashboard initialTab="dashboard" /></ProtectedRoute>} />
          <Route path="/collector/priority" element={<ProtectedRoute allowedRoles={['COLLECTOR', 'ADMIN']}><CollectorDashboard initialTab="priority" /></ProtectedRoute>} />
          <Route path="/collector/collections" element={<ProtectedRoute allowedRoles={['COLLECTOR', 'ADMIN']}><CollectorDashboard initialTab="collections" /></ProtectedRoute>} />

          {/* Protected Citizen Routes */}
          <Route path="/citizen" element={<Navigate to="/citizen/dashboard" replace />} />
          <Route path="/citizen/dashboard" element={<ProtectedRoute allowedRoles={['CITIZEN', 'ADMIN']}><CitizenDashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<Navigate to="/citizen/dashboard" replace />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {!isDashboard && <Footer />}
      <DonationModal />
    </div>
  );
};

export const App = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;
