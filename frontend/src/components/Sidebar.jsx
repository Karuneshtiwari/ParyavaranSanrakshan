import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Trash2,
  MapPin,
  AlertOctagon,
  BarChart2,
  Cpu,
  History,
  Truck,
  BookOpen,
  Users,
  Settings,
  LogOut,
  Camera,
  Calendar
} from 'lucide-react';

export const Sidebar = ({ role = "ADMIN" }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const adminLinks = [
    { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/bins", label: "Bins & Smart Map", icon: Trash2 },
    { to: "/admin/priority", label: "Collection Priority", icon: AlertOctagon },
    { to: "/admin/users", label: "Users & Directory", icon: Users },
    { to: "/admin/analytics", label: "Analytics", icon: BarChart2 },
    { to: "/admin/models", label: "Model Performance", icon: Cpu },
    { to: "/admin/collections", label: "Collection History", icon: History },
    { to: "/admin/blogs", label: "Featured Activities", icon: BookOpen },
    { to: "/admin/events", label: "Events & Drives", icon: Calendar },
  ];

  const collectorLinks = [
    { to: "/collector/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/collector/priority", label: "Priority Bins", icon: AlertOctagon },
    { to: "/admin/bins", label: "Bin Map", icon: MapPin },
    { to: "/admin/collections", label: "Collection History", icon: History },
  ];

  const links = role === "COLLECTOR" ? collectorLinks : adminLinks;

  return (
    <aside className="w-64 bg-[#12372A] text-slate-200 h-screen sticky top-0 p-4 flex flex-col justify-between hidden md:flex shrink-0 shadow-lg border-r border-emerald-950 overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-900">
      
      {/* Top Brand & Nav */}
      <div className="space-y-6">
        
        {/* Brand Mini Header inside sidebar */}
        <Link to="/" className="flex items-center gap-2 px-2 pt-2">
          <img 
            src="/project_logo.png" 
            alt="ParyavaranSanrakshan" 
            className="h-10 w-auto object-contain brightness-0 invert" 
          />
        </Link>

        {/* Navigation list matching Image 3 & 4 */}
        <nav className="space-y-1">
          {links.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/admin/dashboard" || item.to === "/collector/dashboard"}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                    isActive
                      ? "bg-[#1b4332] text-emerald-300 font-semibold shadow-inner border-l-4 border-emerald-400"
                      : "text-emerald-100/70 hover:text-white hover:bg-white/5"
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0 text-emerald-300/80" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Area: Sustainable Goals Graphic + In-Dashboard Scanner + Logout */}
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
              "Cleaner Cities,<br />Brighter Tomorrows"
            </p>
            <span className="text-[10px] text-amber-300 font-semibold block pt-0.5">
              || माता भूमि: पुत्रों अहम् पृथिव्या: ||
            </span>
          </div>
        </div>

        {/* In-dashboard link to scanner */}
        <Link
          to={role === "ADMIN" ? "/admin/scanner" : "/scanner"}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-emerald-200/80 hover:text-white hover:bg-white/5 transition-colors"
        >
          <Camera className="w-3.5 h-3.5 text-emerald-400" />
          <span>Launch AI Scanner</span>
        </Link>

        {/* Portal Name Label in White Font Color at bottom above logout */}
        <div className="text-center font-bold text-white text-xs tracking-wider uppercase py-1 border-t border-emerald-900/60">
          {role === "COLLECTOR" ? "Collector Portal" : "Admin Portal"}
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-300 hover:text-white hover:bg-rose-950/40 transition-colors"
        >
          <LogOut className="w-4 h-4 text-rose-400" />
          <span>Logout</span>
        </button>

      </div>

    </aside>
  );
};
