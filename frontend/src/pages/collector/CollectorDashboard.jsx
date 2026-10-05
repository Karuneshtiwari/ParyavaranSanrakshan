import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dashboardAPI, collectionAPI, uploadAPI, authAPI, eventAPI } from '../../services/api';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Truck, AlertTriangle, AlertCircle, CheckCircle2, Search, 
  MapPin, Clock, ArrowRight, X, ChevronRight, Navigation,
  Calendar, RotateCcw, ShieldCheck, Flame, LayoutDashboard,
  History, Heart, User, Settings, LogOut, Bell, Upload,
  Compass, Crosshair, BarChart2, Activity, Home, Filter,
  Check, Phone, Mail, Award, TrendingUp, Sparkles, Volume2
} from 'lucide-react';

// Leaflet Map centering helper
const MapUpdater = ({ selectedBin }) => {
  const map = useMap();
  useEffect(() => {
    if (selectedBin && selectedBin.latitude && selectedBin.longitude) {
      map.flyTo([selectedBin.latitude, selectedBin.longitude], 15, {
        animate: true,
        duration: 1.0
      });
    }
  }, [selectedBin, map]);
  return null;
};

// Custom Municipal Bin SVG Marker with Glowing Ring
const createBinSvgIcon = (status, isSelected = false) => {
  const color = status === 'CRITICAL' ? '#ef4444' : status === 'HIGH' ? '#f59e0b' : '#10b981';
  const size = isSelected ? 46 : 36;
  const anchor = size / 2;
  const glow = isSelected 
    ? `box-shadow: 0 0 25px ${color}, 0 4px 14px rgba(0,0,0,0.6); transform: scale(1.18);` 
    : 'box-shadow: 0 3px 8px rgba(0,0,0,0.35);';

  const svgHtml = `
    <div style="position: relative; width: ${size}px; height: ${size}px; transition: all 0.3s ease;">
      <div style="position: absolute; inset: 0; background-color: ${color}; border-radius: 50%; opacity: ${isSelected ? 0.4 : 0.2};" class="${status === 'CRITICAL' || isSelected ? 'animate-pulse' : ''}"></div>
      <div style="position: absolute; inset: 3px; background-color: ${color}; border: 2.5px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center; ${glow}">
        <svg xmlns="http://www.w3.org/2000/svg" width="${isSelected ? 20 : 16}" height="${isSelected ? 20 : 16}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 6h18"/>
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
          <line x1="10" y1="11" x2="10" y2="17"/>
          <line x1="14" y1="11" x2="14" y2="17"/>
        </svg>
      </div>
      ${isSelected ? `<div style="position: absolute; -top: 6px; -right: 4px; width: 10px; height: 10px; border-radius: 50%; background-color: #38bdf8; border: 2px solid white;"></div>` : ''}
    </div>
  `;

  return L.divIcon({
    html: svgHtml,
    className: 'custom-collector-bin-marker',
    iconSize: [size, size],
    iconAnchor: [anchor, anchor],
    popupAnchor: [0, -anchor],
  });
};

export const CollectorDashboard = ({ initialTab = 'dashboard' }) => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  // Navigation Tabs state
  const [activeTab, setActiveTab] = useState(initialTab);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Notifications popup
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: "Bin B002 (Food Court) has exceeded 95% critical threshold!", time: "10m ago", read: false },
    { id: 2, text: "Zone 3 route optimization updated for afternoon pickup shift", time: "1h ago", read: false },
    { id: 3, text: "Admin assigned 2 new priority bins in Indiranagar ward", time: "3h ago", read: true }
  ]);

  // Live Ticking Device Clock
  const [deviceTime, setDeviceTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setDeviceTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Default fallback drives for collector field participation
  const FALLBACK_COLLECTOR_EVENTS = [
    {
      id: 1,
      title: "Bengaluru Metropolitan Mega E-Waste Collection Marathon",
      description: "Join fellow municipal sanitation heroes and eco-volunteers to collect and safely recycle electronic waste across Indiranagar & Koramangala transit wards.",
      category: "E-Waste Cleanup",
      event_date: "2026-10-18T09:00:00",
      location: "Indiranagar BDA Complex & Transit Ward, Bengaluru",
      status: "upcoming",
      image_url: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 2,
      title: "Whitefield Lake Eco-Restoration & Tree Plantation",
      description: "Community afforestation and shoreline waste collection drive around Whitefield Lake to preserve urban biodiversity and groundwater recharge.",
      category: "Afforestation",
      event_date: "2026-10-25T08:30:00",
      location: "Whitefield Inner Circle Ground & Lake Shore, Bengaluru",
      status: "upcoming",
      image_url: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 3,
      title: "Commercial Zone Wet & Organic Segregation Workshop",
      description: "Field orientation for collectors and local merchant associations on source-segregation of organic waste and direct composting facility routing.",
      category: "Waste Segregation",
      event_date: "2026-11-02T10:00:00",
      location: "MG Road Commercial Corridor Hub, Bengaluru",
      status: "upcoming",
      image_url: "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=800&q=80"
    }
  ];

  // Events & Drives State
  const [eventsList, setEventsList] = useState(FALLBACK_COLLECTOR_EVENTS);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [collectorEventFilter, setCollectorEventFilter] = useState('all');
  const [registeringCollectorEvent, setRegisteringCollectorEvent] = useState(null);
  const [colRegPhone, setColRegPhone] = useState(user?.phone || '');
  const [colRegNotes, setColRegNotes] = useState('');
  const [colRegLoading, setColRegLoading] = useState(false);
  const [colEventAlert, setColEventAlert] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoadingEvents(true);
        const res = await eventAPI.getAll();
        if (res.data && res.data.length > 0) {
          setEventsList(res.data);
        } else {
          setEventsList(FALLBACK_COLLECTOR_EVENTS);
        }
      } catch (e) {
        console.error("Events fetch error:", e);
        setEventsList(FALLBACK_COLLECTOR_EVENTS);
      } finally {
        setLoadingEvents(false);
      }
    };
    fetchEvents();
  }, [activeTab]);

  const handleCollectorEventRegister = async (e) => {
    e.preventDefault();
    if (!registeringCollectorEvent) return;
    const clean10 = colRegPhone.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(clean10)) {
      setColEventAlert({ type: 'error', message: 'Please enter a valid 10-digit Indian mobile number.' });
      return;
    }
    setColRegLoading(true);
    setColEventAlert(null);
    try {
      await eventAPI.register(registeringCollectorEvent.id, {
        phone: clean10,
        attendees: 1,
        notes: colRegNotes || 'Registered as Sanitation Collector'
      });
      setColEventAlert({ type: 'success', message: `Registered successfully for '${registeringCollectorEvent.title}'! Pass dispatched to ${user?.email}.` });
      setRegisteringCollectorEvent(null);
      const res = await eventAPI.getAll();
      setEventsList(res.data || []);
    } catch (err) {
      setColEventAlert({ type: 'error', message: err.response?.data?.detail || 'Failed to register for drive.' });
    } finally {
      setColRegLoading(false);
    }
  };

  // Bins State
  const [bins, setBins] = useState([
    {
      id: 2,
      bin_code: "B002",
      name: "Food Court",
      location: "University Food Court",
      zone: "Central Campus",
      current_fill: 96,
      predicted_6h: 98,
      predicted_12h: 99,
      risk_score: 0.94,
      priority: "CRITICAL",
      distance: "0.8 km",
      lat: "12.9716° N",
      lng: "77.5946° E",
      latitude: 12.9716,
      longitude: 77.5946,
      waste_type: "General Waste",
      last_collection: "01 Oct 2026, 09:30 AM",
      trend: [50, 55, 68, 76, 84, 91, 96],
      image: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80"
    },
    {
      id: 7,
      bin_code: "B007",
      name: "Market Area",
      location: "Commercial High Street",
      zone: "Indiranagar",
      current_fill: 92,
      predicted_6h: 96,
      predicted_12h: 98,
      risk_score: 0.91,
      priority: "CRITICAL",
      distance: "1.2 km",
      lat: "12.9784° N",
      lng: "77.6408° E",
      latitude: 12.9784,
      longitude: 77.6408,
      waste_type: "Dry Recyclable",
      last_collection: "02 Oct 2026, 08:15 AM",
      trend: [45, 52, 60, 72, 82, 89, 92],
      image: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=600&q=80"
    },
    {
      id: 3,
      bin_code: "B003",
      name: "Hostel A",
      location: "Student Residential Block",
      zone: "South Campus",
      current_fill: 88,
      predicted_6h: 91,
      predicted_12h: 95,
      risk_score: 0.86,
      priority: "HIGH",
      distance: "1.5 km",
      lat: "12.9698° N",
      lng: "77.5990° E",
      latitude: 12.9698,
      longitude: 77.5990,
      waste_type: "Organic Waste",
      last_collection: "02 Oct 2026, 11:00 AM",
      trend: [40, 48, 55, 65, 73, 81, 88],
      image: "https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?auto=format&fit=crop&w=600&q=80"
    },
    {
      id: 8,
      bin_code: "B008",
      name: "Residential Area",
      location: "HSR Layout Sector 1",
      zone: "HSR Sector 1",
      current_fill: 76,
      predicted_6h: 84,
      predicted_12h: 90,
      risk_score: 0.72,
      priority: "HIGH",
      distance: "1.8 km",
      lat: "12.9116° N",
      lng: "77.6389° E",
      latitude: 12.9116,
      longitude: 77.6389,
      waste_type: "Plastic & Metal",
      last_collection: "03 Oct 2026, 07:45 AM",
      trend: [35, 42, 50, 58, 65, 70, 76],
      image: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80"
    },
    {
      id: 10,
      bin_code: "B010",
      name: "Bus Stop",
      location: "Koramangala 5th Block",
      zone: "Koramangala",
      current_fill: 72,
      predicted_6h: 80,
      predicted_12h: 87,
      risk_score: 0.68,
      priority: "HIGH",
      distance: "2.1 km",
      lat: "12.9352° N",
      lng: "77.6245° E",
      latitude: 12.9352,
      longitude: 77.6245,
      waste_type: "General Waste",
      last_collection: "03 Oct 2026, 09:20 AM",
      trend: [30, 38, 45, 53, 60, 66, 72],
      image: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=600&q=80"
    },
    {
      id: 1,
      bin_code: "B001",
      name: "Main Gate",
      location: "MG Road Metro Entrance",
      zone: "Central Transit",
      current_fill: 58,
      predicted_6h: 70,
      predicted_12h: 79,
      risk_score: 0.55,
      priority: "MEDIUM",
      distance: "2.4 km",
      lat: "12.9756° N",
      lng: "77.6066° E",
      latitude: 12.9756,
      longitude: 77.6066,
      waste_type: "Paper & Cardboard",
      last_collection: "03 Oct 2026, 02:30 PM",
      trend: [25, 30, 36, 42, 48, 52, 58],
      image: "https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?auto=format&fit=crop&w=600&q=80"
    },
    {
      id: 13,
      bin_code: "B013",
      name: "Cafeteria",
      location: "Whitefield ITPL Hub",
      zone: "Tech Zone",
      current_fill: 46,
      predicted_6h: 62,
      predicted_12h: 74,
      risk_score: 0.48,
      priority: "MEDIUM",
      distance: "2.8 km",
      lat: "12.9866° N",
      lng: "77.7380° E",
      latitude: 12.9866,
      longitude: 77.7380,
      waste_type: "Food Waste",
      last_collection: "04 Oct 2026, 08:00 AM",
      trend: [20, 24, 29, 34, 38, 42, 46],
      image: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80"
    },
    {
      id: 6,
      bin_code: "B006",
      name: "Parking Area",
      location: "Electronic City Gate 1",
      zone: "Industrial IT Cluster",
      current_fill: 38,
      predicted_6h: 48,
      predicted_12h: 58,
      risk_score: 0.32,
      priority: "LOW",
      distance: "3.1 km",
      lat: "12.8399° N",
      lng: "77.6770° E",
      latitude: 12.8399,
      longitude: 77.6770,
      waste_type: "Dry Recyclable",
      last_collection: "04 Oct 2026, 10:15 AM",
      trend: [15, 18, 22, 26, 30, 34, 38],
      image: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=600&q=80"
    }
  ]);

  const [selectedBin, setSelectedBin] = useState(bins[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [collectedCount, setCollectedCount] = useState(8);
  const [collectingId, setCollectingId] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);

  // Profile Customization State
  const [profileName, setProfileName] = useState(user?.name || 'Waste Collector');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profileAvatarUrl, setProfileAvatarUrl] = useState(user?.avatar_url || '');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileNotice, setProfileNotice] = useState(null);

  // Settings State
  const [audioAlerts, setAudioAlerts] = useState(true);
  const [autoRefreshTelemetry, setAutoRefreshTelemetry] = useState(true);
  const [distanceUnit, setDistanceUnit] = useState('km');

  // Fetch real priority telemetry from backend
  const fetchRealData = async () => {
    try {
      const res = await dashboardAPI.getPriority();
      if (res.data && res.data.length > 0) {
        const merged = res.data.map((p, idx) => ({
          id: p.bin_id,
          bin_code: p.bin_code || `B00${idx + 1}`,
          name: p.location_name || p.location || "Smart Bin Hub",
          location: p.location_name || p.location || "Bengaluru Metro",
          zone: p.location_name?.split(',')[0] || "Municipal Ward",
          current_fill: Math.round(p.current_fill !== undefined ? p.current_fill : 50),
          predicted_6h: Math.round(p.predicted_6h !== undefined ? p.predicted_6h : 60),
          predicted_12h: Math.round(p.predicted_12h !== undefined ? p.predicted_12h : 70),
          risk_score: parseFloat((p.priority_score || 0.5).toFixed(2)),
          priority: (p.priority_level || "MEDIUM").toUpperCase(),
          distance: `${(0.8 + idx * 0.3).toFixed(1)} km`,
          lat: `${(12.9716 + (idx * 0.008) * (idx % 2 === 0 ? 1 : -1)).toFixed(4)}° N`,
          lng: `${(77.5946 + (idx * 0.009) * (idx % 3 === 0 ? 1 : -1)).toFixed(4)}° E`,
          latitude: 12.9716 + (idx * 0.008) * (idx % 2 === 0 ? 1 : -1),
          longitude: 77.5946 + (idx * 0.009) * (idx % 3 === 0 ? 1 : -1),
          waste_type: p.waste_type || "General Waste",
          last_collection: p.last_collection ? new Date(p.last_collection).toLocaleString() : "Today, Morning Shift",
          trend: [40, 50, 62, 70, 79, 88, Math.round(p.current_fill !== undefined ? p.current_fill : 92)],
          image: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80"
        }));
        setBins(merged);
        setSelectedBin(merged[0]);
      }
    } catch (err) {
      console.log("Using cached simulated telemetry for collector:", err);
    }
  };

  useEffect(() => {
    fetchRealData();
  }, []);

  // Update profile states if auth user changes
  useEffect(() => {
    if (user) {
      setProfileName(user.name || 'Waste Collector');
      setProfilePhone(user.phone || '');
      setProfileAvatarUrl(user.avatar_url || '');
    }
  }, [user]);

  // Mark bin collected
  const handleMarkCollected = async (binToCollect) => {
    const target = binToCollect || selectedBin;
    if (!target) return;

    setCollectingId(target.id);
    setActionNotice(null);

    try {
      await collectionAPI.markCollected(target.id, 10.0);
    } catch (err) {
      console.log("Collection API dispatch:", err);
    }

    setTimeout(() => {
      setBins(prev => prev.map(b => b.id === target.id ? { 
        ...b, 
        current_fill: 10, 
        priority: "LOW", 
        risk_score: 0.12,
        trend: [40, 55, 70, 85, 96, 96, 10]
      } : b));
      if (selectedBin?.id === target.id) {
        setSelectedBin(prev => ({ 
          ...prev, 
          current_fill: 10, 
          priority: "LOW", 
          risk_score: 0.12,
          trend: [40, 55, 70, 85, 96, 96, 10]
        }));
      }
      setCollectedCount(c => c + 1);
      setCollectingId(null);
      setActionNotice(`Bin ${target.bin_code} (${target.name}) marked as collected! Fill level updated to 10% on Admin Central.`);
    }, 450);
  };

  // Avatar upload via Cloudinary
  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarUploading(true);
    setProfileNotice(null);
    try {
      const res = await uploadAPI.uploadFile(file);
      setProfileAvatarUrl(res.data.url);
      setProfileNotice({ type: 'success', message: 'Photo uploaded to cloud storage successfully! Click Save Changes to commit.' });
    } catch (err) {
      setProfileNotice({ type: 'error', message: 'Failed to upload photo to Cloudinary. Please try another image.' });
    } finally {
      setAvatarUploading(false);
    }
  };

  // Save Collector Profile
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
      setProfileNotice({ type: 'success', message: 'Collector profile updated successfully!' });
    } catch (err) {
      setProfileNotice({ type: 'error', message: err.response?.data?.detail || 'Failed to update profile.' });
    } finally {
      setProfileSaving(false);
    }
  };

  // Return to home & session exit
  const handleHomeExit = () => {
    if (window.confirm("Return to Home Page? For municipal security, your current session will be closed and re-login will be required.")) {
      logout();
      navigate('/');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Filtered bins
  const filteredBins = bins.filter(b => {
    const matchesSearch = b.bin_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === "ALL" || b.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  const criticalCount = bins.filter(b => b.priority === "CRITICAL").length;
  const highCount = bins.filter(b => b.priority === "HIGH").length;
  const normalCount = bins.length - criticalCount - highCount;

  // Sidebar navigation items
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'collections', label: 'My Collections', icon: Truck },
    { id: 'priority', label: 'Priority Bins', icon: Crosshair },
    { id: 'map', label: 'Bin Map', icon: MapPin },
    { id: 'events', label: 'Events & Drives', icon: Calendar },
    { id: 'history', label: 'Collection History', icon: History },
    { id: 'donate', label: 'Donate', icon: Heart },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#f4f7f4] flex text-slate-800 font-sans selection:bg-emerald-600 selection:text-white">
      
      {/* ══════════════════════════════════════════════════════════════════════
          LEFT SIDEBAR (MATCHING SAMPLE IMAGE 2 EXACTLY: DEEP DARK EMERALD)
      ══════════════════════════════════════════════════════════════════════ */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#072617] text-slate-200 p-4 sm:p-5 flex flex-col justify-between shrink-0 shadow-2xl border-r border-emerald-950/80 transition-transform duration-300 ease-in-out
        md:translate-x-0 md:static md:h-screen md:sticky md:top-0
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        {/* Top: Logo & Nav List */}
        <div className="space-y-6">
          
          {/* Brand Header */}
          <div className="flex items-center justify-between">
            <button 
              onClick={handleHomeExit} 
              title="Return to Home"
              className="flex items-center gap-3 text-left group cursor-pointer"
            >
              <img 
                src="/project_logo.png" 
                alt="Logo" 
                className="h-10 w-auto object-contain brightness-0 invert drop-shadow-[0_0_10px_rgba(52,211,153,0.3)] transition-transform group-hover:scale-105" 
              />
            </button>

            {/* Mobile close button */}
            <button 
              onClick={() => setMobileSidebarOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-emerald-300 hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all text-left cursor-pointer ${
                    isActive
                      ? "bg-[#114328] text-white font-semibold shadow-inner border-l-4 border-emerald-400"
                      : "text-emerald-100/70 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-300' : 'text-emerald-400/80'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Foliage Illustration + Sacred Quote + Logout (Image 2) */}
        <div className="space-y-4 pt-4 border-t border-emerald-900/60">
          
          {/* Sustainable Development Goals Card with goals.png */}
          <div className="p-3 rounded-2xl bg-white/5 border border-emerald-800/50 text-center space-y-2 group hover:border-emerald-600/50 transition-colors">
            <div className="w-full h-24 rounded-xl overflow-hidden bg-white/95 p-1 flex items-center justify-center shadow-inner">
              <img 
                src="/goals.png" 
                alt="Sustainable Development Goals" 
                className="w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-300" 
              />
            </div>
            <div className="space-y-0.5">
              <p className="text-[11px] font-serif italic text-emerald-200 font-semibold leading-tight">
                "Collect Today<br />for a Cleaner Tomorrow"
              </p>
              <span className="text-[10px] text-amber-300 font-semibold block pt-0.5">
                ॥ माता भूमि: पुत्रों अहम् ॥
              </span>
            </div>
          </div>

          {/* Collector Portal Title (White color font at bottom above logout) */}
          <div className="text-center font-bold text-white text-xs tracking-wider uppercase py-1 border-t border-emerald-900/60">
            Collector Portal
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-300 hover:text-white hover:bg-rose-950/40 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Logout</span>
          </button>

        </div>

      </aside>

      {/* Backdrop for mobile sidebar */}
      {mobileSidebarOpen && (
        <div 
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs"
        />
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MAIN CONTENT AREA (TOP BAR + CONTENT TABS)
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* ─── TOP BAR (SAMPLE IMAGE 2) ─── */}
        <header className="bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3.5 sticky top-0 z-30 flex items-center justify-between shadow-2xs">
          
          {/* Left: Mobile hamburger */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <Navigation className="w-5 h-5 rotate-90" />
            </button>

            {/* Brand indicator for mobile */}
            <div className="flex items-center gap-2 md:hidden">
              <img src="/project_logo.png" alt="Logo" className="h-8 w-auto" />
              <span className="text-xs font-bold text-slate-800">Collector Hub</span>
            </div>
          </div>

          {/* Right Controls: Notifications + Collector Avatar & Subtext */}
          <div className="flex items-center gap-4 ml-auto">
            
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-5 h-5 text-slate-700" />
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                  3
                </span>
              </button>

              {/* Notification Popover */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 space-y-3 z-50 animate-in fade-in zoom-in-95">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Telemetry Alerts</span>
                    <button 
                      onClick={() => setShowNotifications(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs font-medium"
                    >
                      Close
                    </button>
                  </div>
                  <div className="space-y-2">
                    {notifications.map(n => (
                      <div key={n.id} className={`p-2.5 rounded-xl text-xs flex items-start gap-2.5 ${n.read ? 'bg-slate-50 text-slate-600' : 'bg-rose-50 text-rose-900 font-medium'}`}>
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <p>{n.text}</p>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{n.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Collector Avatar & Info (Matching Image 2) */}
            <div 
              onClick={() => setActiveTab('profile')} 
              className="flex items-center gap-3 p-1 rounded-2xl hover:bg-slate-50 cursor-pointer transition-colors"
              title="View Collector Profile"
            >
              <div className="w-9 h-9 rounded-full bg-[#0a3520] text-emerald-300 font-bold flex items-center justify-center text-sm shadow-xs overflow-hidden border border-emerald-600/40">
                {profileAvatarUrl ? (
                  <img src={profileAvatarUrl} alt={profileName} className="w-full h-full object-cover" />
                ) : (
                  profileName ? profileName.charAt(0).toUpperCase() : 'C'
                )}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {profileName || 'Collector'}
                </div>
                <div className="text-[11px] text-slate-400 leading-tight">
                  Waste Collector
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </div>

          </div>

        </header>

        {/* ─── TAB CONTENT ROUTER ─── */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 max-w-[1600px] w-full mx-auto">
          
          {/* Action Notification Toast */}
          {actionNotice && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{actionNotice}</span>
              </div>
              <button onClick={() => setActionNotice(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              TAB 1: DASHBOARD (PIXEL-PERFECT MATCH TO SAMPLE IMAGE 2)
          ══════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Top Greeting & Date/Time Card */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-serif">
                    Hello, {user?.name || 'Collector'}!
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Here are the bins that need your attention today
                  </p>
                </div>

                {/* Live Device Clock */}
                <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <Clock className="w-4 h-4 animate-spin [animation-duration:12s]" />
                  </div>
                  <div className="text-xs">
                    <div className="font-bold text-slate-800">
                      {deviceTime.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                    <div className="text-slate-500 text-[11px] font-mono">
                      {deviceTime.toLocaleDateString('en-GB', { weekday: 'long' })}, {deviceTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 KPI Cards (Matching Image 2: Light Red, Light Amber, Light Green, Light Mint) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* 1. Critical Bins */}
                <div className="bg-[#fff1f2] border border-rose-100 p-5 rounded-3xl flex items-center gap-4 shadow-2xs">
                  <div className="w-12 h-12 rounded-2xl bg-rose-200/80 text-rose-700 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-none">
                      {criticalCount}
                    </div>
                    <div className="text-xs font-bold text-slate-800 mt-1">Critical Bins</div>
                    <div className="text-[11px] text-slate-400">Need immediate collection</div>
                  </div>
                </div>

                {/* 2. High Priority Bins */}
                <div className="bg-[#fffbeb] border border-amber-100 p-5 rounded-3xl flex items-center gap-4 shadow-2xs">
                  <div className="w-12 h-12 rounded-2xl bg-amber-200/80 text-amber-700 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-none">
                      {highCount}
                    </div>
                    <div className="text-xs font-bold text-slate-800 mt-1">High Priority Bins</div>
                    <div className="text-[11px] text-slate-400">Collect soon</div>
                  </div>
                </div>

                {/* 3. Assigned Bins */}
                <div className="bg-[#f0fdf4] border border-emerald-100 p-5 rounded-3xl flex items-center gap-4 shadow-2xs">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-200/80 text-emerald-800 flex items-center justify-center shrink-0">
                    <Truck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-none">
                      12
                    </div>
                    <div className="text-xs font-bold text-slate-800 mt-1">Assigned Bins</div>
                    <div className="text-[11px] text-slate-400">For today's route</div>
                  </div>
                </div>

                {/* 4. Collected Today */}
                <div className="bg-[#f0fdf4] border border-emerald-100 p-5 rounded-3xl flex items-center gap-4 shadow-2xs">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-200/80 text-emerald-800 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-none">
                      {collectedCount}
                    </div>
                    <div className="text-xs font-bold text-slate-800 mt-1">Collected Today</div>
                    <div className="text-[11px] text-slate-400">Good progress!</div>
                  </div>
                </div>

              </div>

              {/* ─── MAIN 2-COLUMN SECTION: BINS MAP + TABLE (LEFT) & BIN DETAILS (RIGHT) ─── */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* ─── LEFT COLUMN (7 or 8 COLS) ─── */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* 1. Map Panel: Bin Locations (Today's Priority) with Leaflet & Custom SVG Bin Markers */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <h3 className="text-sm font-bold text-slate-900">
                          Bin Locations (Today's Priority)
                        </h3>
                      </div>

                      {/* Status Indicator Legend */}
                      <div className="flex items-center gap-3 text-xs text-slate-600">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                          Critical ({criticalCount})
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                          High ({highCount})
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                          Normal ({normalCount})
                        </span>
                      </div>
                    </div>

                    {/* Interactive Leaflet Map with Custom Bin SVG Icons replacing '+' signs */}
                    <div className="relative rounded-2xl overflow-hidden h-72 sm:h-80 border border-slate-200 shadow-inner z-10">
                      <MapContainer
                        center={[selectedBin?.latitude || 12.9716, selectedBin?.longitude || 77.5946]}
                        zoom={13}
                        scrollWheelZoom={false}
                        className="w-full h-full"
                      >
                        <MapUpdater selectedBin={selectedBin} />
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        {bins.map((bin) => {
                          const isSelected = selectedBin?.id === bin.id;
                          const icon = createBinSvgIcon(bin.priority, isSelected);

                          return (
                            <Marker
                              key={bin.id}
                              position={[bin.latitude, bin.longitude]}
                              icon={icon}
                              eventHandlers={{
                                click: () => setSelectedBin(bin)
                              }}
                            >
                              <Popup className="custom-leaflet-popup">
                                <div className="p-1 min-w-[180px] text-slate-900">
                                  <div className="flex items-center justify-between border-b pb-1 mb-1.5">
                                    <span className="font-bold text-xs bg-slate-800 text-white px-2 py-0.5 rounded font-mono">
                                      {bin.bin_code}
                                    </span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                      bin.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-700' :
                                      bin.priority === 'HIGH' ? 'bg-amber-100 text-amber-700' :
                                      'bg-emerald-100 text-emerald-700'
                                    }`}>
                                      {bin.priority}
                                    </span>
                                  </div>
                                  <h4 className="font-semibold text-xs text-slate-900">{bin.name}</h4>
                                  <p className="text-[11px] text-slate-500">{bin.current_fill}% Full • {bin.waste_type}</p>
                                </div>
                              </Popup>
                            </Marker>
                          );
                        })}
                      </MapContainer>

                      {/* Floating Selected Bin Tag */}
                      {selectedBin && (
                        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md border border-slate-200 px-3 py-1.5 rounded-xl shadow-md z-[1000] text-xs flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping"></span>
                          <span className="font-bold text-slate-800">{selectedBin.name}</span>
                          <span className="text-slate-400 font-mono">({selectedBin.bin_code})</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 2. Action Table: Bins to Collect (Matching Image 2) */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
                    
                    {/* Header + Search & Filter */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-emerald-700" />
                        <h3 className="text-sm font-bold text-slate-900">Bins to Collect</h3>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-56">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Search bins or locations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600"
                          />
                        </div>

                        <select
                          value={priorityFilter}
                          onChange={(e) => setPriorityFilter(e.target.value)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-600 bg-white"
                        >
                          <option value="ALL">All Priority</option>
                          <option value="CRITICAL">Critical</option>
                          <option value="HIGH">High</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="LOW">Low</option>
                        </select>
                      </div>
                    </div>

                    {/* Responsive Table Matching Image 2 */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                            <th className="pb-3 pl-3">Bin ID</th>
                            <th className="pb-3">Location</th>
                            <th className="pb-3">Current Fill</th>
                            <th className="pb-3">Predicted (6h)</th>
                            <th className="pb-3">Risk</th>
                            <th className="pb-3">Priority</th>
                            <th className="pb-3">Distance</th>
                            <th className="pb-3 text-right pr-3">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {filteredBins.map((b) => {
                            const isSelected = selectedBin?.id === b.id;
                            const priorityBadgeClass = 
                              b.priority === 'CRITICAL' ? 'bg-[#ffebeb] text-rose-700 font-bold' :
                              b.priority === 'HIGH' ? 'bg-[#fef9e7] text-amber-700 font-bold' :
                              b.priority === 'MEDIUM' ? 'bg-[#fefce8] text-amber-800' :
                              'bg-[#e8f8f0] text-emerald-800';

                            const fillBarColor =
                              b.current_fill >= 90 ? 'bg-rose-500' :
                              b.current_fill >= 70 ? 'bg-amber-500' :
                              'bg-emerald-500';

                            return (
                              <tr
                                key={b.id}
                                onClick={() => setSelectedBin(b)}
                                className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                                  isSelected ? 'bg-emerald-50/50' : ''
                                }`}
                              >
                                <td className="py-3 pl-3 font-mono font-bold text-slate-900 flex items-center gap-2">
                                  <span className={`w-1 h-5 rounded-full ${
                                    b.priority === 'CRITICAL' ? 'bg-rose-500' : b.priority === 'HIGH' ? 'bg-amber-500' : 'bg-emerald-500'
                                  }`}></span>
                                  <span>{b.bin_code}</span>
                                </td>
                                <td className="py-3 font-medium text-slate-800">
                                  <div className="font-semibold">{b.name}</div>
                                </td>
                                <td className="py-3">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-rose-600 w-8">{b.current_fill}%</span>
                                    <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                      <div
                                        style={{ width: `${b.current_fill}%` }}
                                        className={`h-full ${fillBarColor}`}
                                      ></div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 font-semibold text-rose-500">
                                  {b.predicted_6h}%
                                </td>
                                <td className="py-3 font-mono font-semibold text-rose-500">
                                  {b.risk_score}
                                </td>
                                <td className="py-3">
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] ${priorityBadgeClass}`}>
                                    {b.priority}
                                  </span>
                                </td>
                                <td className="py-3 text-slate-500">
                                  {b.distance}
                                </td>
                                <td className="py-3 text-right pr-3">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMarkCollected(b);
                                    }}
                                    disabled={collectingId === b.id}
                                    className="px-3 py-1 rounded-md bg-[#0a3520] hover:bg-[#114328] text-white font-medium text-xs transition-colors shadow-2xs cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
                                  >
                                    <span>{collectingId === b.id ? 'Saving...' : 'Collect'}</span>
                                    <ChevronRight className="w-3 h-3 text-emerald-400" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                  </div>

                </div>

                {/* ─── RIGHT COLUMN: BIN DETAILS PANEL (MATCHING IMAGE 2) ─── */}
                <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5 sticky top-24">
                  
                  {/* Header */}
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-[#0a3520] text-emerald-300 flex items-center justify-center font-bold text-xs">
                        ▶
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm">Bin Details</h3>
                    </div>
                  </div>

                  {selectedBin ? (
                    <div className="space-y-4 animate-in fade-in duration-150">
                      
                      {/* Photo & Bin Code */}
                      <div className="relative rounded-2xl overflow-hidden aspect-16/9 bg-slate-100 border border-slate-200 shadow-inner">
                        <img
                          src={selectedBin.image}
                          alt={selectedBin.name}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-md bg-emerald-950/90 text-white font-mono font-bold text-xs backdrop-blur-xs">
                          {selectedBin.bin_code}
                        </span>
                      </div>

                      {/* Title & Priority Badge */}
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xl font-bold font-serif text-slate-900">
                            {selectedBin.name}
                          </h4>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                            <span>{selectedBin.location}</span>
                          </p>
                        </div>

                        <span className={`px-3 py-1 rounded-md text-xs font-bold text-white ${
                          selectedBin.priority === 'CRITICAL' ? 'bg-rose-600' :
                          selectedBin.priority === 'HIGH' ? 'bg-amber-600' :
                          'bg-emerald-600'
                        }`}>
                          {selectedBin.priority}
                        </span>
                      </div>

                      {/* Radial Fill Gauge & Predictions Row (Sample Image 2) */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center p-3 rounded-2xl bg-[#fafdfa] border border-emerald-100">
                        
                        {/* Circular Gauge */}
                        <div className="sm:col-span-5 flex flex-col items-center justify-center">
                          <div className="relative w-24 h-24 flex items-center justify-center">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                              <path
                                className="text-slate-200"
                                strokeWidth="3.2"
                                stroke="currentColor"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                              <path
                                className={selectedBin.current_fill >= 90 ? 'text-rose-500' : selectedBin.current_fill >= 70 ? 'text-amber-500' : 'text-emerald-500'}
                                strokeDasharray={`${selectedBin.current_fill}, 100`}
                                strokeWidth="3.2"
                                strokeLinecap="round"
                                stroke="currentColor"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                              <span className="text-lg font-extrabold text-slate-900 leading-none">
                                {selectedBin.current_fill}%
                              </span>
                              <span className="text-[9px] text-slate-400 mt-0.5">Current Fill</span>
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-500 mt-1 font-medium">
                            ({Math.round((selectedBin.current_fill / 100) * 500)} / 500 L)
                          </span>
                        </div>

                        {/* Predictions Next to Gauge */}
                        <div className="sm:col-span-7 space-y-2">
                          <div className="p-2 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs">
                            <span className="text-slate-500 flex items-center gap-1.5">
                              <BarChart2 className="w-3.5 h-3.5 text-rose-500" />
                              Predicted Fill (6h)
                            </span>
                            <span className="font-bold text-rose-600">{selectedBin.predicted_6h}%</span>
                          </div>

                          <div className="p-2 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs">
                            <span className="text-slate-500 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-amber-500" />
                              Predicted Fill (12h)
                            </span>
                            <span className="font-bold text-slate-800">{selectedBin.predicted_12h}%</span>
                          </div>
                        </div>

                      </div>

                      {/* 3 Metrics: Overflow Risk, Priority, Waste Type (Image 2) */}
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="p-2 rounded-xl bg-rose-50 border border-rose-100">
                          <div className="text-rose-600 font-bold flex items-center justify-center gap-1 text-xs">
                            <AlertTriangle className="w-3 h-3" />
                            {selectedBin.risk_score}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">Overflow Risk</div>
                        </div>

                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                          <div className="text-rose-600 font-bold text-xs truncate">
                            {selectedBin.priority}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">Priority</div>
                        </div>

                        <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100">
                          <div className="text-emerald-800 font-bold text-xs truncate">
                            {selectedBin.waste_type}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">Waste Type</div>
                        </div>
                      </div>

                      {/* Mark As Collected Button (Dark Green Matching Image 2) */}
                      <button
                        type="button"
                        onClick={() => handleMarkCollected(selectedBin)}
                        disabled={collectingId === selectedBin.id}
                        className="w-full py-3.5 rounded-2xl bg-[#0a3520] hover:bg-[#114328] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <Truck className="w-4 h-4 text-emerald-300" />
                        <span>{collectingId === selectedBin.id ? 'Recording Collection...' : 'Mark As Collected'}</span>
                      </button>

                      {/* Recent Fill Trend Chart (Matching Image 2 Line Graph) */}
                      <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
                        <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                          <span>Recent Fill Trend</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </div>

                        {/* Responsive SVG Area Chart */}
                        <div className="h-28 w-full relative">
                          <svg className="w-full h-full overflow-visible" viewBox="0 0 300 80" preserveAspectRatio="none">
                            <defs>
                              <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.3" />
                                <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                              </linearGradient>
                            </defs>

                            {/* Background Grid Lines */}
                            <line x1="0" y1="20" x2="300" y2="20" stroke="#f1f5f9" strokeDasharray="3 3" />
                            <line x1="0" y1="50" x2="300" y2="50" stroke="#f1f5f9" strokeDasharray="3 3" />
                            <line x1="0" y1="75" x2="300" y2="75" stroke="#e2e8f0" />

                            {/* Area Fill */}
                            <path
                              d="M 10 55 Q 60 50 110 40 T 210 20 T 290 8 L 290 75 L 10 75 Z"
                              fill="url(#trendGradient)"
                            />

                            {/* Trend Line */}
                            <path
                              d="M 10 55 Q 60 50 110 40 T 210 20 T 290 8"
                              fill="none"
                              stroke="#e11d48"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                            />

                            {/* Data points */}
                            {[
                              { cx: 10, cy: 55 },
                              { cx: 60, cy: 50 },
                              { cx: 110, cy: 40 },
                              { cx: 160, cy: 30 },
                              { cx: 210, cy: 20 },
                              { cx: 250, cy: 14 },
                              { cx: 290, cy: 8 },
                            ].map((pt, i) => (
                              <circle
                                key={i}
                                cx={pt.cx}
                                cy={pt.cy}
                                r="3.5"
                                fill="#ffffff"
                                stroke="#e11d48"
                                strokeWidth="2"
                              />
                            ))}
                          </svg>

                          {/* Chart Dates */}
                          <div className="flex justify-between text-[9px] text-slate-400 mt-2 font-mono">
                            <span>28 Sep</span>
                            <span>29 Sep</span>
                            <span>30 Sep</span>
                            <span>01 Oct</span>
                            <span>02 Oct</span>
                            <span>03 Oct</span>
                            <span>04 Oct</span>
                          </div>
                        </div>
                      </div>

                      {/* Location Information (Latitude, Longitude, Last Collection) */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                        <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                          Location Information
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-[11px]">
                          <div>
                            <span className="text-slate-400 block">Latitude</span>
                            <span className="font-mono font-bold text-slate-700">{selectedBin.lat}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Longitude</span>
                            <span className="font-mono font-bold text-slate-700">{selectedBin.lng}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Last Collection</span>
                            <span className="font-semibold text-slate-700">{selectedBin.last_collection.split(',')[0]}</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="text-center py-12 text-xs text-slate-400">
                      Select a bin from the table or map to inspect details
                    </div>
                  )}

                </div>

              </div>

            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              TAB 2: MY COLLECTIONS
          ══════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'collections' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold font-serif text-slate-900">My Assigned Collections</h2>
                    <p className="text-xs text-slate-500">Today's active route assignments and completed pickups</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                    Route: Shift 1 - Central Zone
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                        <th className="pb-3 pl-3">Bin Code</th>
                        <th className="pb-3">Location</th>
                        <th className="pb-3">Zone</th>
                        <th className="pb-3">Fill Level</th>
                        <th className="pb-3">Priority</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right pr-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bins.map(b => (
                        <tr key={b.id} className="hover:bg-slate-50/80">
                          <td className="py-3 pl-3 font-mono font-bold text-slate-900">{b.bin_code}</td>
                          <td className="py-3 font-semibold text-slate-800">{b.name}</td>
                          <td className="py-3 text-slate-500">{b.zone}</td>
                          <td className="py-3 font-bold text-slate-800">{b.current_fill}%</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              b.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-700' :
                              b.priority === 'HIGH' ? 'bg-amber-100 text-amber-700' :
                              'bg-emerald-100 text-emerald-700'
                            }`}>
                              {b.priority}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              b.current_fill <= 20 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {b.current_fill <= 20 ? 'Collected' : 'Pending'}
                            </span>
                          </td>
                          <td className="py-3 text-right pr-3">
                            <button
                              onClick={() => handleMarkCollected(b)}
                              className="px-3 py-1 rounded-lg bg-[#0a3520] hover:bg-[#114328] text-white font-semibold text-xs transition-colors"
                            >
                              Collect
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              TAB 3: PRIORITY BINS
          ══════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'priority' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold font-serif text-slate-900">Priority Dispatch Queue</h2>
                    <p className="text-xs text-slate-500">Urgent smart bins ranked by ML overflow risk score</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 rounded-xl bg-rose-50 text-rose-800 text-xs font-bold border border-rose-200">
                      {criticalCount} Critical
                    </span>
                    <span className="px-3 py-1 rounded-xl bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                      {highCount} High Priority
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bins.filter(b => b.priority === 'CRITICAL' || b.priority === 'HIGH').map(b => (
                    <div key={b.id} className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-emerald-600 transition-colors shadow-2xs space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-slate-900 text-white">
                            {b.bin_code}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 mt-1">{b.name}</h4>
                          <p className="text-xs text-slate-500">{b.location}</p>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          b.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {b.priority}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl text-center text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Fill</span>
                          <strong className="text-slate-800">{b.current_fill}%</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Risk</span>
                          <strong className="text-rose-600">{b.risk_score}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Distance</span>
                          <strong className="text-slate-700">{b.distance}</strong>
                        </div>
                      </div>

                      <button
                        onClick={() => handleMarkCollected(b)}
                        className="w-full py-2 rounded-xl bg-[#0a3520] hover:bg-[#114328] text-white font-bold text-xs transition-colors shadow-2xs flex items-center justify-center gap-1.5"
                      >
                        <Truck className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Dispatch & Mark Collected</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              TAB 4: BIN MAP (EXPANDED WIDE VIEW)
          ══════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'map' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold font-serif text-slate-900">Metropolitan Smart Bin Telemetry Map</h2>
                    <p className="text-xs text-slate-500">Live IoT bin positions across Bengaluru municipal wards</p>
                  </div>
                  <button 
                    onClick={fetchRealData}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Refresh Telemetry</span>
                  </button>
                </div>

                <div className="h-[600px] rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
                  <MapContainer
                    center={[12.9716, 77.5946]}
                    zoom={13}
                    scrollWheelZoom={true}
                    className="w-full h-full"
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {bins.map((bin) => {
                      const isSelected = selectedBin?.id === bin.id;
                      const icon = createBinSvgIcon(bin.priority, isSelected);

                      return (
                        <Marker
                          key={bin.id}
                          position={[bin.latitude, bin.longitude]}
                          icon={icon}
                          eventHandlers={{
                            click: () => setSelectedBin(bin)
                          }}
                        >
                          <Popup className="custom-leaflet-popup">
                            <div className="p-1 min-w-[200px] text-slate-900">
                              <span className="font-bold text-xs bg-slate-800 text-white px-2 py-0.5 rounded font-mono">
                                {bin.bin_code}
                              </span>
                              <h4 className="font-semibold text-sm text-slate-900 mt-1">{bin.name}</h4>
                              <p className="text-xs text-slate-500">{bin.location}</p>
                              <div className="mt-2 text-xs font-bold text-slate-800">
                                Current Fill: {bin.current_fill}% ({bin.waste_type})
                              </div>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}
                  </MapContainer>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              TAB 5: COLLECTION HISTORY
          ══════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'history' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
                <div>
                  <h2 className="text-xl font-bold font-serif text-slate-900">Collection Logs & History</h2>
                  <p className="text-xs text-slate-500">Verified municipal waste clearance events and truck load logs</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                        <th className="pb-3 pl-3">Timestamp</th>
                        <th className="pb-3">Bin Code</th>
                        <th className="pb-3">Location</th>
                        <th className="pb-3">Waste Category</th>
                        <th className="pb-3">Initial Fill</th>
                        <th className="pb-3">Clearance Level</th>
                        <th className="pb-3 text-right pr-3">Verified By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { time: "Today, 09:30 AM", code: "B002", loc: "University Food Court", cat: "General Waste", init: "96%", clear: "10%", by: "Collector Karunesh" },
                        { time: "Today, 08:45 AM", code: "B007", loc: "Commercial High Street", cat: "Dry Recyclable", init: "92%", clear: "10%", by: "Collector Karunesh" },
                        { time: "03 Oct, 04:15 PM", code: "B003", loc: "Student Residential Block", cat: "Organic Waste", init: "88%", clear: "8%", by: "Collector Karunesh" },
                        { time: "03 Oct, 02:00 PM", code: "B008", loc: "HSR Layout Sector 1", cat: "Plastic & Metal", init: "85%", clear: "12%", by: "Collector Karunesh" },
                        { time: "02 Oct, 11:30 AM", code: "B001", loc: "MG Road Metro Entrance", cat: "Paper & Cardboard", init: "78%", clear: "10%", by: "Collector Karunesh" },
                      ].map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80">
                          <td className="py-3 pl-3 text-slate-500 font-medium">{item.time}</td>
                          <td className="py-3 font-mono font-bold text-slate-900">{item.code}</td>
                          <td className="py-3 font-semibold text-slate-800">{item.loc}</td>
                          <td className="py-3 text-slate-600">{item.cat}</td>
                          <td className="py-3 font-bold text-rose-600">{item.init}</td>
                          <td className="py-3 font-bold text-emerald-600">{item.clear}</td>
                          <td className="py-3 text-right pr-3 text-slate-700 font-medium">{item.by}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              TAB: EVENTS & DRIVES FOR COLLECTOR
          ══════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'events' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-1">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Collector Field Participation</span>
                    </div>
                    <h2 className="text-2xl font-bold font-serif text-slate-900">
                      Community Drives & Cleanup Events
                    </h2>
                    <p className="text-xs text-slate-500">
                      Join municipal drives, segregation awareness camps, and community cleanup initiatives.
                    </p>
                  </div>

                  {/* Filter */}
                  <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
                    {['all', 'upcoming', 'ongoing', 'completed'].map(st => (
                      <button
                        key={st}
                        onClick={() => setCollectorEventFilter(st)}
                        className={`px-3 py-1.5 rounded-lg capitalize cursor-pointer transition-all ${
                          collectorEventFilter === st ? 'bg-white text-emerald-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {colEventAlert && (
                  <div className={`p-4 rounded-2xl text-xs flex items-center gap-2 ${
                    colEventAlert.type === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-rose-50 text-rose-900 border border-rose-200'
                  }`}>
                    {colEventAlert.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
                    <span>{colEventAlert.message}</span>
                  </div>
                )}

                {loadingEvents ? (
                  <div className="p-12 text-center text-slate-400 text-sm">Loading community events...</div>
                ) : eventsList.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-sm">No drives scheduled right now.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {eventsList
                      .filter(ev => collectorEventFilter === 'all' || (ev.status || '').toLowerCase() === collectorEventFilter)
                      .map(ev => {
                        const isCompleted = (ev.status || '').toLowerCase() === 'completed';
                        const isRegistered = ev.is_registered;

                        return (
                          <div key={ev.id} className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                            <div className="relative aspect-16/10 bg-slate-100 overflow-hidden">
                              <img 
                                src={ev.image_url || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=700&q=80'} 
                                alt={ev.title} 
                                className="w-full h-full object-cover" 
                              />
                              <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/90 backdrop-blur-xs text-[10px] font-bold text-emerald-900 uppercase">
                                {ev.category || 'Drive'}
                              </div>
                              {isRegistered && (
                                <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-emerald-700 text-white text-[10px] font-bold uppercase shadow-sm">
                                  Enrolled ✓
                                </div>
                              )}
                            </div>

                            <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                              <div className="space-y-2">
                                <h3 className="text-base font-bold text-slate-900 line-clamp-2 leading-snug">
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
                                {isCompleted ? (
                                  <button
                                    disabled
                                    className="w-full py-2.5 rounded-full bg-slate-100 text-slate-500 text-xs font-bold border border-slate-200 cursor-not-allowed"
                                  >
                                    Completed
                                  </button>
                                ) : isRegistered ? (
                                  <button
                                    disabled
                                    className="w-full py-2.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 cursor-default"
                                  >
                                    Registered
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setRegisteringCollectorEvent(ev);
                                      setColRegPhone(user?.phone || '');
                                      setColEventAlert(null);
                                    }}
                                    className="w-full py-2.5 rounded-full bg-[#072617] hover:bg-[#0b3320] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
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
                )}
              </div>

              {/* Event Modal for Collector */}
              {registeringCollectorEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
                  <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative border border-slate-200 space-y-5">
                    <button
                      onClick={() => setRegisteringCollectorEvent(null)}
                      className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <div className="space-y-1">
                      <div className="inline-block px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                        {registeringCollectorEvent.category || 'Drive'}
                      </div>
                      <h3 className="text-xl font-bold font-serif text-slate-900">
                        {registeringCollectorEvent.title}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Confirm your field registration for this drive.
                      </p>
                    </div>

                    <form onSubmit={handleCollectorEventRegister} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 block">Collector Name</label>
                        <input
                          type="text"
                          readOnly
                          value={user?.name || 'Sanitation Collector'}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 block">Contact Mobile Number *</label>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          placeholder="9876543210"
                          value={colRegPhone}
                          onChange={(e) => setColRegPhone(e.target.value.replace(/\D/g, ''))}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:border-emerald-600 font-mono font-semibold"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 block">Ward / Assigned Route (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. Ward 84 / Indiranagar Zone"
                          value={colRegNotes}
                          onChange={(e) => setColRegNotes(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:border-emerald-600"
                        />
                      </div>

                      <div className="pt-2 flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setRegisteringCollectorEvent(null)}
                          className="px-5 py-2.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={colRegLoading || colRegPhone.length !== 10}
                          className="px-6 py-2.5 rounded-full bg-[#072617] hover:bg-[#0b3320] text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                        >
                          {colRegLoading ? 'Registering...' : 'Register'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              TAB 6: DONATE (EMBEDDED INSIDE COLLECTOR DASHBOARD)
          ══════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'donate' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-white rounded-3xl p-6 sm:p-10 border border-emerald-100 shadow-xs space-y-8">
                
                <div className="max-w-2xl space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                    <Heart className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Support Environmental Conservation</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#072617]">
                    Empower Sanitation Infrastructure & Worker Safety
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Directly support protective sanitation equipment, ultrasonic IoT bin hardware, and urban green belts across Bengaluru Metropolitan.
                  </p>
                </div>

                {/* Preset Contribution Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  {[
                    { amount: 250, label: 'Tree Plantation Drive', impact: 'Plants 5 native peepal and neem saplings along urban routes' },
                    { amount: 500, label: 'Collector Safety Kit', impact: 'Provides puncture-proof nitrile gloves, reflective vests & N95 masks' },
                    { amount: 1500, label: 'Smart IoT Bin Sensor', impact: 'Funds 1 ultrasonic telemetry device with 4G solar battery unit' },
                  ].map(item => (
                    <div 
                      key={item.amount}
                      className="p-6 rounded-2xl border-2 border-emerald-100 hover:border-emerald-600 bg-[#fbfdfb] transition-all space-y-3 flex flex-col justify-between"
                    >
                      <div>
                        <div className="text-3xl font-extrabold text-[#072617] font-serif">
                          ₹{item.amount}
                        </div>
                        <h4 className="text-sm font-bold text-emerald-900 mt-1">{item.label}</h4>
                        <p className="text-xs text-slate-500 mt-2">{item.impact}</p>
                      </div>

                      <button
                        onClick={() => window.dispatchEvent(new CustomEvent('open-donation-modal'))}
                        className="w-full py-2.5 rounded-full bg-[#0a3520] hover:bg-[#114328] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                      >
                        Contribute ₹{item.amount}
                      </button>
                    </div>
                  ))}
                </div>

                {/* Custom Donation Button */}
                <div className="p-6 rounded-2xl bg-emerald-50/50 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-emerald-950">Looking to contribute an institutional amount?</h4>
                    <p className="text-xs text-slate-600">Tax deductible 80G receipts available for all institutional and individual contributors.</p>
                  </div>
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('open-donation-modal'))}
                    className="px-6 py-3 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer shrink-0"
                  >
                    Custom Contribution
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              TAB 7: PROFILE CUSTOMIZATION (WITH CLOUDINARY AVATAR UPLOAD)
          ══════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in duration-200 max-w-2xl mx-auto">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
                
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900">
                    Collector Profile & Account
                  </h2>
                  <p className="text-xs text-slate-500">
                    Update your official name, contact phone, and avatar photo.
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
                    <div className="w-20 h-20 rounded-2xl bg-[#072617] text-white flex items-center justify-center text-2xl font-bold font-serif overflow-hidden border-2 border-emerald-500/50 shadow-md shrink-0">
                      {profileAvatarUrl ? (
                        <img src={profileAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        profileName ? profileName.charAt(0).toUpperCase() : 'C'
                      )}
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <label className="text-xs font-semibold text-slate-700 block">
                        Collector Photo
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
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  {/* Email (Readonly) */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">Registered Email</label>
                    <input
                      type="email"
                      readOnly
                      value={user?.email || ''}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-xs sm:text-sm cursor-not-allowed"
                    />
                  </div>

                  {/* Mobile Number */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">10-Digit Contact Mobile</label>
                    <input
                      type="tel"
                      placeholder="9876543210"
                      maxLength={10}
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="px-6 py-2.5 rounded-full bg-[#0a3520] hover:bg-[#114328] text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {profileSaving ? 'Saving Changes...' : 'Save Profile Changes'}
                    </button>
                  </div>

                </form>

              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              TAB 8: SETTINGS
          ══════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-in fade-in duration-200 max-w-2xl mx-auto">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
                
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900">
                    Collector Preferences & Telemetry Settings
                  </h2>
                  <p className="text-xs text-slate-500">
                    Configure operational alerts, auto-refresh frequency, and route parameters.
                  </p>
                </div>

                <div className="space-y-4">
                  
                  {/* Audio Alerts */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Volume2 className="w-3.5 h-3.5 text-emerald-700" />
                        Audible Critical Bin Alerts
                      </div>
                      <p className="text-[11px] text-slate-500">Play chime when a bin exceeds 90% fill level</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={audioAlerts} 
                      onChange={(e) => setAudioAlerts(e.target.checked)} 
                      className="w-4 h-4 accent-emerald-600 cursor-pointer"
                    />
                  </div>

                  {/* Auto-Refresh Telemetry */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <RotateCcw className="w-3.5 h-3.5 text-emerald-700" />
                        Live IoT Telemetry Polling
                      </div>
                      <p className="text-[11px] text-slate-500">Automatically synchronize fill levels every 60 seconds</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={autoRefreshTelemetry} 
                      onChange={(e) => setAutoRefreshTelemetry(e.target.checked)} 
                      className="w-4 h-4 accent-emerald-600 cursor-pointer"
                    />
                  </div>

                  {/* Distance units */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Navigation className="w-3.5 h-3.5 text-emerald-700" />
                        Distance Units
                      </div>
                      <p className="text-[11px] text-slate-500">Choose between Kilometers or Miles</p>
                    </div>
                    <select
                      value={distanceUnit}
                      onChange={(e) => setDistanceUnit(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                    >
                      <option value="km">Kilometers (km)</option>
                      <option value="mi">Miles (mi)</option>
                    </select>
                  </div>

                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => alert("Collector preferences saved!")}
                    className="px-6 py-2.5 rounded-full bg-[#0a3520] hover:bg-[#114328] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Save Preferences
                  </button>
                </div>

              </div>
            </div>
          )}

        </main>

      </div>

    </div>
  );
};

export default CollectorDashboard;
