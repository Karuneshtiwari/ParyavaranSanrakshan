import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { eventAPI, wasteAPI, authAPI, uploadAPI } from '../services/api';
import { 
  User, Mail, Calendar, Camera, Award, CheckCircle2, 
  MapPin, Clock, ArrowRight, Sparkles, Leaf, Trash2, 
  LogOut, Home, Phone, Upload, Check, AlertCircle, RefreshCw,
  Heart, X, Shield, Eye, SwitchCamera
} from 'lucide-react';

export const CitizenDashboard = () => {
  const { user, logout, updateUser } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();

  // Navigation tabs: 'overview', 'scanner', 'events', 'donate', 'profile'
  const [activeTab, setActiveTab] = useState('overview');

  // Events state
  const [myEvents, setMyEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [eventFilter, setEventFilter] = useState('all');
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [registeringModalEvent, setRegisteringModalEvent] = useState(null);
  const [regPhone, setRegPhone] = useState(user?.phone || '');
  const [regAttendees, setRegAttendees] = useState(1);
  const [regNotes, setRegNotes] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);
  const [eventAlert, setEventAlert] = useState(null);

  // Scanner state
  const [scans, setScans] = useState([]);
  const [loadingScans, setLoadingScans] = useState(true);
  const [scanFile, setScanFile] = useState(null);
  const [scanPreview, setScanPreview] = useState(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState(null);
  const fileInputRef = useRef(null);

  // Live Camera Stream State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'user' or 'environment'
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Stop camera stream safely
  const stopCameraStream = () => {
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => track.stop());
      } catch (e) {
        console.warn("Error stopping tracks:", e);
      }
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setCameraLoading(false);
  };

  // Start camera stream
  const startCameraStream = async (targetFacing = facingMode) => {
    setCameraError(null);
    setScanError(null);
    setCameraLoading(true);
    stopCameraStream();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("Direct camera stream is not supported in this browser. Please use 'Select Photo'.");
      setCameraLoading(false);
      return;
    }

    try {
      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: targetFacing },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (prefErr) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      setIsCameraActive(true);
    } catch (err) {
      console.warn("Camera access error:", err);
      let msg = "Camera unavailable or permission denied. Please allow camera permissions in your browser URL bar.";
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = "No camera hardware detected. Please upload an image file instead.";
      }
      setCameraError(msg);
      setIsCameraActive(false);
    } finally {
      setCameraLoading(false);
    }
  };

  // Connect video element to stream
  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      const video = videoRef.current;
      video.srcObject = streamRef.current;
      video.setAttribute("playsinline", "true");
      video.setAttribute("webkit-playsinline", "true");
      video.muted = true;
      video.play().catch(e => console.warn("Video play error:", e));
    }
  }, [isCameraActive]);

  // Flip camera front/back
  const toggleCameraFacing = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    startCameraStream(nextFacing);
  };

  // Capture snapshot from stream
  const captureSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `waste_scan_${Date.now()}.jpg`, { type: 'image/jpeg' });
      setScanFile(file);
      setScanPreview(URL.createObjectURL(blob));
      stopCameraStream();
      setScanResult(null);
      setScanError(null);
    }, 'image/jpeg', 0.92);
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
      if (scanPreview) URL.revokeObjectURL(scanPreview);
    };
  }, []);

  // Profile customization state
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profileAvatarUrl, setProfileAvatarUrl] = useState(user?.avatar_url || '');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileNotice, setProfileNotice] = useState(null);

  // Fetch initial citizen registrations and scan history
  const fetchAllData = async () => {
    try {
      setLoadingEvents(true);
      setLoadingScans(true);
      const [evRegRes, evAllRes, histRes] = await Promise.allSettled([
        eventAPI.getMyRegistrations(),
        eventAPI.getAll(),
        wasteAPI.getHistory(50)
      ]);

      if (evRegRes.status === 'fulfilled') {
        setMyEvents(evRegRes.value.data || []);
      }
      if (evAllRes.status === 'fulfilled') {
        setAllEvents(evAllRes.value.data || []);
      }
      if (histRes.status === 'fulfilled') {
        const histData = Array.isArray(histRes.value.data) ? histRes.value.data : (histRes.value.data?.scans || []);
        setScans(histData);
      }
    } catch (err) {
      console.error("Failed to load citizen data:", err);
    } finally {
      setLoadingEvents(false);
      setLoadingScans(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfilePhone(user.phone || '');
      setProfileAvatarUrl(user.avatar_url || '');
      if (!regPhone && user.phone) setRegPhone(user.phone);
    }
  }, [user]);

  // Handle Home Click: redirect to home and log out so re-entry requires login
  const handleHomeExit = () => {
    logout();
    navigate('/');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // ─── SCANNER HANDLERS ───
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanFile(file);
    setScanPreview(URL.createObjectURL(file));
    setScanResult(null);
    setScanError(null);
  };

  const handleRunScan = async (e) => {
    e.preventDefault();
    if (!scanFile) return;

    setScanLoading(true);
    setScanError(null);
    setScanResult(null);

    const formData = new FormData();
    formData.append('file', scanFile);

    try {
      const res = await wasteAPI.predict(formData);
      setScanResult(res.data);
      // Refresh scan history
      const histRes = await wasteAPI.getHistory(50);
      setScans(Array.isArray(histRes.data) ? histRes.data : (histRes.data?.scans || []));
    } catch (err) {
      console.error("Scan error:", err);
      setScanError(err.response?.data?.detail || "Waste analysis failed. Please try capturing another photo.");
    } finally {
      setScanLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm("Are you sure you want to clear your entire waste scan history? All uploaded photos will also be permanently removed from Cloudinary cloud storage.")) return;
    try {
      await wasteAPI.clearHistory();
      setScans([]);
    } catch (err) {
      alert("Failed to clear scan history.");
    }
  };

  // ─── EVENT REGISTRATION HANDLERS ───
  const handleOpenRegisterModal = (ev) => {
    const alreadyReg = myEvents.some(m => m.event?.id === ev.id || m.event_id === ev.id);
    if (alreadyReg) {
      setEventAlert({
        type: 'error',
        message: `You are already registered for '${ev.title}'.`
      });
      return;
    }
    setRegisteringModalEvent(ev);
    setRegPhone(user?.phone || '');
    setEventAlert(null);
  };

  const handleConfirmEventRegister = async (e) => {
    e.preventDefault();
    if (!registeringModalEvent) return;

    // Strict 10-digit mobile number validation
    const rawDigits = regPhone.replace(/\D/g, '');
    let clean10 = rawDigits;
    if (clean10.startsWith('91') && clean10.length === 12) {
      clean10 = clean10.slice(2);
    }
    if (!/^[6-9]\d{9}$/.test(clean10)) {
      setEventAlert({
        type: 'error',
        message: "Please enter a valid 10-digit Indian mobile number (e.g. 9876543210)."
      });
      return;
    }

    setRegisterLoading(true);
    setEventAlert(null);

    try {
      const res = await eventAPI.register(registeringModalEvent.id, {
        phone: clean10,
        attendees: regAttendees,
        notes: regNotes
      });

      setEventAlert({
        type: 'success',
        message: res.data.message || `Successfully registered for '${registeringModalEvent.title}'! An official confirmation pass has been dispatched to ${user.email}.`
      });

      setRegisteringModalEvent(null);
      setRegNotes('');
      // Reload registrations
      const regRes = await eventAPI.getMyRegistrations();
      setMyEvents(regRes.data || []);
    } catch (err) {
      setEventAlert({
        type: 'error',
        message: err.response?.data?.detail || "Registration could not be completed."
      });
    } finally {
      setRegisterLoading(false);
    }
  };

  // ─── PROFILE UPDATE HANDLERS ───
  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarUploading(true);
    setProfileNotice(null);
    try {
      const res = await uploadAPI.uploadFile(file);
      const uploadedUrl = res.data.url;
      setProfileAvatarUrl(uploadedUrl);
      setProfileNotice({ type: 'success', message: 'Photo uploaded successfully! Click Save Profile to apply.' });
    } catch (err) {
      setProfileNotice({ type: 'error', message: 'Failed to upload photo. Please try again.' });
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileNotice(null);

    try {
      const res = await authAPI.updateProfile({
        name: profileName.trim(),
        phone: profilePhone.trim() || undefined,
        avatar_url: profileAvatarUrl.trim() || undefined
      });
      updateUser(res.data);
      setProfileNotice({ type: 'success', message: 'Profile updated successfully!' });
    } catch (err) {
      setProfileNotice({ type: 'error', message: err.response?.data?.detail || 'Failed to update profile.' });
    } finally {
      setProfileSaving(false);
    }
  };

  // Filtered public events
  const filteredEvents = allEvents.filter(ev => {
    if (eventFilter === 'all') return true;
    return (ev.status || '').toLowerCase() === eventFilter.toLowerCase();
  });

  return (
    <div className="min-h-screen bg-[#f7faf7] text-slate-800 pb-16 flex flex-col">
      
      {/* ─── DEDICATED CITIZEN TOP DASHBOARD HEADER (No Public Header/Footer) ─── */}
      <header className="bg-white border-b border-emerald-100 shadow-2xs sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <button 
              onClick={handleHomeExit}
              title="Clicking logo redirects to Home (securely requires re-login on next access)"
              className="flex items-center gap-2 group cursor-pointer"
            >
              <img 
                src="/project_logo.png" 
                alt="ParyavaranSanrakshan" 
                className="h-10 w-auto object-contain transition-transform group-hover:scale-105" 
              />
            </button>
            <div className="hidden sm:block">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                Citizen Portal
              </span>
              <span className="text-[11px] text-slate-400">
                Eco Action & Waste Intelligence
              </span>
            </div>
          </div>

          {/* Center Tabs Navigation */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {[
              { id: 'overview', label: 'Overview', icon: Leaf },
              { id: 'scanner', label: 'AI Waste Scanner', icon: Camera },
              { id: 'events', label: 'Events & Drives', icon: Calendar },
              { id: 'donate', label: 'Donate', icon: Heart },
              { id: 'profile', label: 'Profile', icon: User },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setEventAlert(null); }}
                  className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive 
                      ? 'bg-[#12372A] text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-300' : 'text-slate-400'}`} />
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right User Badge & Exit Controls */}
          <div className="flex items-center gap-3">
            <div 
              onClick={() => setActiveTab('profile')} 
              className="flex items-center gap-2 cursor-pointer p-1 rounded-xl hover:bg-slate-50 transition-colors"
              title="Customize Profile"
            >
              <div className="w-8 h-8 rounded-full bg-[#1b4332] text-white flex items-center justify-center text-xs font-bold shadow-xs overflow-hidden border border-emerald-400/40">
                {profileAvatarUrl ? (
                  <img src={profileAvatarUrl} alt={user?.name} className="w-full h-full object-cover" />
                ) : (
                  user?.name ? user.name.charAt(0).toUpperCase() : 'C'
                )}
              </div>
              <span className="text-xs font-bold text-slate-800 hidden lg:inline max-w-[100px] truncate">
                {user?.name || 'Citizen'}
              </span>
            </div>

            <button
              onClick={handleHomeExit}
              title="Return to Home (Session ends)"
              className="p-2 rounded-xl text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
            >
              <Home className="w-4 h-4" />
            </button>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* ─── MAIN DASHBOARD CONTENT AREA ─── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 space-y-8">

        {/* Global Event / Action Alerts */}
        {eventAlert && (
          <div className={`p-4 rounded-2xl text-xs sm:text-sm flex items-center justify-between shadow-xs ${
            eventAlert.type === 'success' 
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' 
              : 'bg-rose-50 text-rose-900 border border-rose-200'
          }`}>
            <div className="flex items-center gap-2.5">
              {eventAlert.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span>{eventAlert.message}</span>
            </div>
            <button onClick={() => setEventAlert(null)} className="text-slate-400 hover:text-slate-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 1: OVERVIEW
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            
            {/* Citizen Profile Hero */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#12372A] text-emerald-300 flex items-center justify-center text-2xl font-bold font-serif shadow-md border-2 border-emerald-500/30 overflow-hidden">
                  {profileAvatarUrl ? (
                    <img src={profileAvatarUrl} alt={user?.name} className="w-full h-full object-cover" />
                  ) : (
                    user?.name ? user.name.charAt(0).toUpperCase() : 'C'
                  )}
                </div>
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                    <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Conscious Citizen • Eco Guardian</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12372A] font-serif">
                    {user?.name || 'Citizen User'}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {user?.email}
                    </span>
                    {user?.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        +91 {user.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Action Buttons inside dashboard */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setActiveTab('scanner')}
                  className="px-5 py-2.5 rounded-full bg-[#12372A] hover:bg-[#1b4332] text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-emerald-400" />
                  <span>AI Waste Scanner</span>
                </button>
                <button
                  onClick={() => setActiveTab('events')}
                  className="px-5 py-2.5 rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-2xs cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-emerald-700" />
                  <span>Browse Cleanliness Drives</span>
                </button>
              </div>
            </div>

            {/* Impact Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <span>Registered Events</span>
                  <Calendar className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-3xl font-extrabold text-[#12372A] font-serif">
                  {myEvents.length}
                </div>
                <p className="text-[11px] text-slate-500">Upcoming community & cleanup drives</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <span>AI Waste Scans</span>
                  <Camera className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-3xl font-extrabold text-[#12372A] font-serif">
                  {scans.length}
                </div>
                <p className="text-[11px] text-slate-500">Items analyzed for source segregation</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <span>Citizen Rank</span>
                  <Award className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-3xl font-extrabold text-emerald-700 font-serif">
                  Level {Math.max(1, Math.floor((scans.length + myEvents.length * 3) / 5) + 1)}
                </div>
                <p className="text-[11px] text-slate-500">Verified Environmental Contributor</p>
              </div>
            </div>

            {/* Confirmed Registrations Section */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-5">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-100/70 text-emerald-800 text-xs font-bold uppercase mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Confirmed Registrations ({myEvents.length})
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#12372A]">
                    My Registered Community Events & Drives
                  </h2>
                </div>

                <button
                  onClick={() => setActiveTab('events')}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <span>Explore More Drives</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {myEvents.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-2xl bg-[#fbfdfb] border border-dashed border-emerald-200 space-y-3">
                  <Calendar className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h3 className="text-base font-bold text-slate-800">No Event Registrations Yet</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Join Bangalore tree plantation drives, lake cleanups, and segregation workshops!
                  </p>
                  <button
                    onClick={() => setActiveTab('events')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#12372A] hover:bg-[#1b4332] text-white text-xs font-semibold cursor-pointer"
                  >
                    <span>Browse Drives</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {myEvents.map((item) => {
                    const ev = item.event;
                    return (
                      <div
                        key={item.registration_id || item.id}
                        className="rounded-2xl border border-emerald-100 bg-[#fbfdfb] overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                      >
                        <div className="relative aspect-16/9 bg-slate-100 overflow-hidden">
                          <img
                            src={ev.image_url || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80'}
                            alt={ev.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-emerald-700/90 text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur-xs">
                            Confirmed Pass ✓
                          </div>
                        </div>
                        <div className="p-5 space-y-3">
                          <span className="inline-block px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-semibold uppercase">
                            {ev.category}
                          </span>
                          <h4 className="text-base font-bold text-[#12372A] line-clamp-1">{ev.title}</h4>
                          <p className="text-xs text-slate-500 line-clamp-2">{ev.description}</p>
                          <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs text-slate-600">
                            <div className="flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="truncate">{ev.event_date ? new Date(ev.event_date).toLocaleString() : 'TBA'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="truncate">{ev.location}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 2: AI WASTE SCANNER (EMBEDDED INSIDE DASHBOARD)
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'scanner' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-sm space-y-6">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-1">
                    <Camera className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Real-Time Waste Classification</span>
                  </div>
                  <h2 className="text-2xl font-bold font-serif text-[#12372A]">
                    AI Waste Scanner & Recycling Guidance
                  </h2>
                  <p className="text-xs text-slate-500">
                    Snap or upload a photo of your waste. Our AI detects material and tells you which bin to use!
                  </p>
                </div>

                {scans.length > 0 && (
                  <button
                    onClick={handleClearHistory}
                    className="px-4 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Scan History</span>
                  </button>
                )}
              </div>

              {/* Hidden Canvas for Live Stream Snapshot */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Upload & Prediction Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                
                {/* Left: Live Camera View OR Image Upload */}
                <div className="space-y-4">
                  {isCameraActive ? (
                    /* Live Camera Viewfinder */
                    <div className="relative rounded-3xl overflow-hidden bg-slate-900 border-2 border-emerald-500 shadow-lg min-h-[280px] flex flex-col items-center justify-center">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-72 sm:h-80 object-cover"
                      />

                      {/* Camera Control Overlays */}
                      <div className="absolute top-3 right-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={toggleCameraFacing}
                          className="p-2 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-xs transition-colors"
                          title="Switch Camera"
                        >
                          <SwitchCamera className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={stopCameraStream}
                          className="p-2 rounded-full bg-rose-600/80 text-white hover:bg-rose-700 backdrop-blur-xs transition-colors"
                          title="Close Camera"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Viewfinder Target Reticle */}
                      <div className="absolute inset-8 pointer-events-none border border-white/30 rounded-2xl flex items-center justify-center">
                        <span className="text-[10px] font-mono tracking-widest text-emerald-400 bg-black/50 px-2 py-0.5 rounded uppercase">
                          Center Waste in Frame
                        </span>
                      </div>

                      {/* Bottom Snapshot Button */}
                      <div className="absolute bottom-4 inset-x-0 flex justify-center px-4">
                        <button
                          type="button"
                          onClick={captureSnapshot}
                          className="px-6 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs shadow-lg flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Capture Photo</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* File / Snapshot Box */
                    <form onSubmit={handleRunScan} className="space-y-4">
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-emerald-300 rounded-3xl p-6 text-center cursor-pointer hover:bg-emerald-50/40 transition-colors relative overflow-hidden min-h-[260px] flex flex-col items-center justify-center bg-[#fbfdfb]"
                      >
                        <input 
                          type="file" 
                          accept="image/*" 
                          capture="environment"
                          ref={fileInputRef} 
                          onChange={handleFileSelect} 
                          className="hidden" 
                        />
                        
                        {scanPreview ? (
                          <div className="relative w-full h-60 rounded-2xl overflow-hidden flex items-center justify-center bg-slate-900">
                            <img src={scanPreview} alt="Waste preview" className="w-full h-full object-contain" />
                            
                            {/* DOTTED VIEW FINDER & SCANNING BEAM DURING ANALYSIS */}
                            {scanLoading && (
                              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center p-4">
                                <div className="relative w-52 h-52 border-2 border-dashed border-red-500 rounded-2xl flex flex-col items-center justify-center overflow-hidden bg-red-950/20 shadow-[0_0_25px_rgba(239,68,68,0.5)]">
                                  {/* Animated red laser scan line */}
                                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_12px_#ef4444] animate-bounce w-full"></div>
                                  
                                  {/* Red target reticle brackets */}
                                  <div className="absolute top-2 left-2 text-red-500 font-mono text-xs font-black">┌────</div>
                                  <div className="absolute top-2 right-2 text-red-500 font-mono text-xs font-black">────┐</div>
                                  <div className="absolute bottom-2 left-2 text-red-500 font-mono text-xs font-black">└────</div>
                                  <div className="absolute bottom-2 right-2 text-red-500 font-mono text-xs font-black">────┘</div>

                                  <div className="p-2.5 bg-black/75 rounded-xl border border-red-500/40 text-center space-y-1 max-w-[190px]">
                                    <span className="text-red-400 font-mono text-[9px] tracking-widest uppercase block animate-pulse">
                                      [ -------- SCANNING -------- ]
                                    </span>
                                    <p className="text-white text-[11px] font-bold leading-tight">
                                      Processing the waste by ParyavaranSanrakshan Mitra
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-[#1b4332] flex items-center justify-center mx-auto shadow-sm">
                              <Camera className="w-7 h-7" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">Capture or Upload Waste Photo</p>
                              <p className="text-xs text-slate-400 mt-1">Supports JPG, PNG, WEBP (Live camera supported)</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions: Live Camera / Upload / Classify */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 py-3 px-3 rounded-full border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer text-center"
                          >
                            {scanPreview ? 'Change Photo' : 'Select Photo'}
                          </button>
                          <button
                            type="button"
                            onClick={() => startCameraStream('environment')}
                            disabled={cameraLoading}
                            className="flex-1 py-3 px-3 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
                          >
                            <Camera className="w-3.5 h-3.5 text-emerald-700" />
                            <span>{cameraLoading ? 'Starting...' : 'Live Camera'}</span>
                          </button>
                        </div>

                        <button
                          type="submit"
                          disabled={!scanFile || scanLoading}
                          className="py-3 px-4 rounded-full bg-[#12372A] hover:bg-[#1b4332] text-white text-xs font-bold transition-all shadow-md disabled:opacity-50 cursor-pointer text-center"
                        >
                          {scanLoading ? 'Processing...' : 'Classify Waste Now'}
                        </button>
                      </div>

                      {cameraError && (
                        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                          {cameraError}
                        </div>
                      )}

                      {scanError && (
                        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                          {scanError}
                        </div>
                      )}
                    </form>
                  )}
                </div>

                {/* Right: Real-time Analysis Card */}
                <div className="bg-[#f8faf8] border border-emerald-100 rounded-3xl p-6 sm:p-7 min-h-[320px] flex flex-col justify-between">
                  {scanResult ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                          AI Identification Complete
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold">
                          {Math.round(scanResult.confidence * 100)}% Confidence
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-2xl font-bold font-serif text-[#12372A] capitalize">
                          {scanResult.predicted_class}
                        </h3>
                        <p className="text-xs text-slate-500">
                          Category: <strong className="text-slate-800">{scanResult.category}</strong>
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-2xs space-y-2">
                        <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Recommended Bin Disposal:</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {scanResult.recommendation}
                        </p>
                      </div>

                      {scanResult.warning && (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                          ⚠️ {scanResult.warning}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-16 space-y-3 my-auto">
                      <Sparkles className="w-10 h-10 text-emerald-500 mx-auto animate-pulse" />
                      <h4 className="text-base font-bold text-slate-800">Ready to Analyze</h4>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto">
                        Take a photo or upload an image to receive instant smart bin segregation recommendations.
                      </p>
                    </div>
                  )}
                </div>

              </div>

              {/* Citizen Scan History List */}
              <div className="pt-6 border-t border-slate-100 space-y-4">
                <h3 className="text-base font-bold text-[#12372A] font-serif">
                  My Recent Waste Scans ({scans.length})
                </h3>

                {scans.length === 0 ? (
                  <p className="text-xs text-slate-400">No previous waste scans recorded yet.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {scans.map((sc, idx) => (
                      <div key={sc.id || idx} className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-2xs">
                        <div className="aspect-square bg-slate-100 overflow-hidden">
                          <img src={sc.image_url} alt={sc.predicted_class} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-2 space-y-0.5">
                          <span className="text-[11px] font-bold text-slate-800 capitalize truncate block">
                            {sc.predicted_class}
                          </span>
                          <span className="text-[10px] text-emerald-700 block">
                            {Math.round((sc.confidence || 0.9) * 100)}% match
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 3: EVENTS & DRIVES (EMBEDDED INSIDE DASHBOARD)
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'events' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-sm space-y-6">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Ground Drives & Awareness</span>
                  </div>
                  <h2 className="text-2xl font-bold font-serif text-[#12372A]">
                    Browse & Register for Eco Drives
                  </h2>
                  <p className="text-xs text-slate-500">
                    Register to join environmental conservation initiatives across Bangalore. You will receive an official confirmation pass in your email.
                  </p>
                </div>

                {/* Event Status Filter */}
                <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
                  {['all', 'upcoming', 'ongoing', 'completed'].map(st => (
                    <button
                      key={st}
                      onClick={() => setEventFilter(st)}
                      className={`px-3 py-1.5 rounded-lg capitalize cursor-pointer transition-all ${
                        eventFilter === st ? 'bg-white text-emerald-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Events Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map(ev => {
                  const isReg = myEvents.some(m => m.event?.id === ev.id || m.event_id === ev.id);
                  return (
                    <div 
                      key={ev.id} 
                      className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div className="relative aspect-16/10 bg-slate-100 overflow-hidden">
                        <img 
                          src={ev.image_url || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=700&q=80'} 
                          alt={ev.title} 
                          className="w-full h-full object-cover" 
                        />
                        <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/90 backdrop-blur-xs text-[10px] font-bold text-emerald-900 uppercase">
                          {ev.category || 'Drive'}
                        </div>
                        {isReg && (
                          <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-emerald-700 text-white text-[10px] font-bold uppercase shadow-sm">
                            Enrolled ✓
                          </div>
                        )}
                      </div>

                      <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                        <div className="space-y-2">
                          <h3 className="text-base font-bold text-[#12372A] line-clamp-2 leading-snug">
                            {ev.title}
                          </h3>
                          <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                            {ev.description}
                          </p>
                        </div>

                        <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate">{ev.event_date ? new Date(ev.event_date).toLocaleString() : 'Date TBA'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate">{ev.location}</span>
                          </div>
                        </div>

                        <div className="pt-2">
                          {ev.status === 'completed' ? (
                            <button
                              disabled
                              className="w-full py-2.5 rounded-full bg-slate-100 text-slate-500 text-xs font-bold border border-slate-200 cursor-not-allowed"
                            >
                              Completed
                            </button>
                          ) : isReg ? (
                            <button
                              disabled
                              className="w-full py-2.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 cursor-default"
                            >
                              Registered
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenRegisterModal(ev)}
                              className="w-full py-2.5 rounded-full bg-[#12372A] hover:bg-[#1b4332] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                            >
                              Register
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 4: DONATE (EMBEDDED INSIDE DASHBOARD)
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'donate' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-emerald-100 shadow-sm space-y-8">
              
              <div className="max-w-2xl space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                  <Heart className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Support Environmental Conservation</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#12372A]">
                  Empower Clean Communities & Smart Bin Deployment
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Your generous contributions directly fund native tree plantation saplings, smart ultrasonic bin sensors, and safety gear for Bangalore sanitation workers.
                </p>
              </div>

              {/* Preset Contribution Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {[
                  { amount: 250, label: 'Tree Plantation', impact: 'Plants 5 native peepal/neem saplings in urban green belts' },
                  { amount: 500, label: 'Worker Safety Kit', impact: 'Provides puncture-proof gloves, fluorescent jackets & masks' },
                  { amount: 1500, label: 'Smart IoT Sensor', impact: 'Deploys 1 ultrasonic predictive telemetry unit for high-risk bins' },
                ].map(item => (
                  <div 
                    key={item.amount}
                    className="p-6 rounded-2xl border-2 border-emerald-100 hover:border-emerald-500 bg-[#fbfdfb] transition-all space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="text-3xl font-extrabold text-[#12372A] font-serif">
                        ₹{item.amount}
                      </div>
                      <h4 className="text-sm font-bold text-emerald-900 mt-1">{item.label}</h4>
                      <p className="text-xs text-slate-500 mt-2">{item.impact}</p>
                    </div>

                    <button
                      onClick={() => window.dispatchEvent(new CustomEvent('open-donation-modal'))}
                      className="w-full py-2.5 rounded-full bg-[#12372A] hover:bg-[#1b4332] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      Contribute ₹{item.amount}
                    </button>
                  </div>
                ))}
              </div>

              {/* Custom Donation Button */}
              <div className="p-6 rounded-2xl bg-emerald-50/50 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-emerald-950">Looking to contribute a custom amount?</h4>
                  <p className="text-xs text-slate-600">Tax deductible 80G receipts available for all institutional and individual contributors.</p>
                </div>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('open-donation-modal'))}
                  className="px-6 py-3 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer shrink-0"
                >
                  Choose Custom Amount
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 5: PROFILE CUSTOMIZATION (EMBEDDED INSIDE DASHBOARD)
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-in fade-in duration-200 max-w-2xl mx-auto">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-sm space-y-6">
              
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#12372A]">
                  Customize Profile & Account
                </h2>
                <p className="text-xs text-slate-500">
                  Update your display name, contact phone, and avatar photo.
                </p>
              </div>

              {profileNotice && (
                <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                  profileNotice.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' 
                    : 'bg-rose-50 text-rose-900 border border-rose-200'
                }`}>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{profileNotice.message}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-5">
                
                {/* Avatar Uploader */}
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-[#12372A] text-white flex items-center justify-center text-2xl font-bold font-serif overflow-hidden border-2 border-emerald-400/50 shadow-md shrink-0">
                    {profileAvatarUrl ? (
                      <img src={profileAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      profileName ? profileName.charAt(0).toUpperCase() : 'U'
                    )}
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Profile Avatar
                    </label>
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer transition-colors shadow-2xs">
                      <Upload className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{avatarUploading ? 'Processing...' : 'Upload New Photo'}</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleAvatarFileChange} 
                        disabled={avatarUploading}
                        className="hidden" 
                      />
                    </label>
                  </div>
                </div>

                {/* Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Full Name</label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:border-emerald-600 shadow-2xs"
                  />
                </div>

                {/* Email (Readonly) */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Email Address (Registered)</label>
                  <input
                    type="email"
                    readOnly
                    value={user?.email || ''}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-xs sm:text-sm cursor-not-allowed"
                  />
                </div>

                {/* Phone Number */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Contact 10-Digit Mobile Number</label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    maxLength={10}
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:border-emerald-600 shadow-2xs"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="px-6 py-2.5 rounded-full bg-[#12372A] hover:bg-[#1b4332] text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {profileSaving ? 'Saving Changes...' : 'Save Profile Changes'}
                  </button>
                </div>

              </form>

            </div>
          </div>
        )}

      </main>

      {/* ─── EVENT REGISTRATION MODAL (STRICT 10-DIGIT MOBILE NUMBER) ─── */}
      {registeringModalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative space-y-5 animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setRegisteringModalEvent(null)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-800">
                Official Event Enrollment
              </span>
              <h3 className="text-xl font-bold font-serif text-[#12372A]">
                {registeringModalEvent.title}
              </h3>
              <p className="text-xs text-slate-500">
                Confirm your participation. A valid 10-digit mobile number is mandatory to receive your enrollment pass.
              </p>
            </div>

            <form onSubmit={handleConfirmEventRegister} className="space-y-4">
              
              {/* Auto-filled Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Full Name</label>
                <input
                  type="text"
                  readOnly
                  value={user?.name || ''}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 text-xs sm:text-sm cursor-not-allowed"
                />
              </div>

              {/* Auto-filled Email */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Email Address (Pass Recipient)</label>
                <input
                  type="email"
                  readOnly
                  value={user?.email || ''}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 text-xs sm:text-sm cursor-not-allowed"
                />
              </div>

              {/* Strict 10-digit Mobile Field */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>Contact Mobile Number *</span>
                  <span className="text-[10px] text-emerald-700 font-medium">Exact 10 digits required</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    placeholder="9876543210"
                    maxLength={10}
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:border-emerald-600 shadow-2xs font-mono font-semibold"
                  />
                </div>
              </div>

              {/* Attendees */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Number of Attendees / Volunteers</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={regAttendees}
                  onChange={(e) => setRegAttendees(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:border-emerald-600 shadow-2xs"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Institution / Ward / Neighborhood (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Amrita University Eco Club"
                  value={regNotes}
                  onChange={(e) => setRegNotes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:border-emerald-600 shadow-2xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRegisteringModalEvent(null)}
                  className="px-5 py-2.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registerLoading || regPhone.replace(/\D/g, '').length !== 10}
                  className="px-6 py-2.5 rounded-full bg-[#12372A] hover:bg-[#1b4332] text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {registerLoading ? 'Confirming...' : 'Confirm Registration'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CitizenDashboard;
