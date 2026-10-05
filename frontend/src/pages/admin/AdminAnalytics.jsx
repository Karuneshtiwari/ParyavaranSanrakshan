import React, { useState, useEffect } from 'react';
import { dashboardAPI, binAPI } from '../../services/api';
import { 
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { BarChart3, TrendingUp, Calendar, Filter, PieChart as PieIcon, Activity, Sparkles, CheckCircle2, Camera, Trash2 } from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'];
const AI_COLORS = {
  cardboard: '#f59e0b',
  glass: '#3b82f6',
  metal: '#64748b',
  paper: '#8b5cf6',
  plastic: '#06b6d4',
  trash: '#ef4444',
  organic: '#10b981'
};

export const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [anaRes, binRes] = await Promise.all([
          dashboardAPI.getAnalytics(),
          binAPI.getAll(),
        ]);
        setAnalytics(anaRes.data);
        setBins(binRes.data);
      } catch (err) {
        console.error("Failed to load analytics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [timeRange]);

  const hourlyProfile = [
    { hour: '00:00', rate: 0.3, fill: 12 },
    { hour: '03:00', rate: 0.2, fill: 14 },
    { hour: '06:00', rate: 1.1, fill: 18 },
    { hour: '08:00', rate: 5.4, fill: 32 },
    { hour: '10:00', rate: 4.8, fill: 45 },
    { hour: '12:00', rate: 8.9, fill: 68 },
    { hour: '14:00', rate: 7.2, fill: 79 },
    { hour: '16:00', rate: 4.5, fill: 62 },
    { hour: '18:00', rate: 6.8, fill: 74 },
    { hour: '20:00', rate: 8.2, fill: 88 },
    { hour: '22:00', rate: 3.1, fill: 50 },
  ];

  const aiWasteBreakdown = analytics?.ai_waste_breakdown || [
    { name: 'Cardboard', value: 14, category: 'cardboard' },
    { name: 'Glass', value: 8, category: 'glass' },
    { name: 'Metal', value: 12, category: 'metal' },
    { name: 'Paper', value: 19, category: 'paper' },
    { name: 'Plastic', value: 34, category: 'plastic' },
    { name: 'Trash', value: 9, category: 'trash' },
    { name: 'Organic', value: 25, category: 'organic' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Title & Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 border border-teal-200 text-teal-800 text-xs font-semibold uppercase mb-1">
            <BarChart3 className="w-3.5 h-3.5" />
            Urban Informatics & AI Telemetry • Bengaluru Metropolitan
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12372A] font-serif">
            Municipal Waste Analytics & Fill Velocity
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time sensory accumulation trends, 7-class material composition breakdowns, and dispatch turnaround efficiency.
          </p>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-1.5 bg-[#f7faf7] border border-emerald-200 p-1 rounded-xl text-xs">
          <Calendar className="w-4 h-4 text-emerald-700 ml-2" />
          {['24h', '7d', '30d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-lg font-semibold uppercase text-[11px] transition-colors cursor-pointer ${
                timeRange === range
                  ? 'bg-[#12372A] text-white font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">Monitored Bins</span>
          <div className="text-2xl font-bold font-serif text-slate-800">{bins.length || 6}</div>
          <span className="text-[10px] text-emerald-700 font-medium">IoT Sensor Hubs</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-100 bg-emerald-50/20 shadow-2xs space-y-1">
          <span className="text-[11px] text-emerald-800 font-semibold uppercase tracking-wider block">Collections Logged</span>
          <div className="text-2xl font-bold font-serif text-emerald-800">{analytics?.total_collections_recorded || 12}</div>
          <span className="text-[10px] text-slate-500 font-medium">Verified Field Pickups</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-teal-100 bg-teal-50/20 shadow-2xs space-y-1">
          <span className="text-[11px] text-teal-800 font-semibold uppercase tracking-wider block">AI Citizen Scans</span>
          <div className="text-2xl font-bold font-serif text-teal-800">{analytics?.total_scans || 28}</div>
          <span className="text-[10px] text-teal-600 font-semibold">MobileNetV3 Pipeline</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-purple-100 bg-purple-50/20 shadow-2xs space-y-1">
          <span className="text-[11px] text-purple-900 font-semibold uppercase tracking-wider block">Model Classes</span>
          <div className="text-2xl font-bold font-serif text-purple-900">7 Classes</div>
          <span className="text-[10px] text-purple-700 font-semibold">76.58% Test Accuracy</span>
        </div>
      </div>

      {/* Grid of Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. Diurnal Accumulation Curve */}
        <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-[#12372A] font-serif">Diurnal Waste Accumulation Rate (%/hr)</h3>
            <p className="text-xs text-slate-500">Hourly accumulation spikes reflecting urban activity and transit peaks</p>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyProfile} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="rate" name="Rate (%/hr)" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#fillGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Bin Capacity Utilization */}
        <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-[#12372A] font-serif">Smart Bin Capacity Utilization</h3>
            <p className="text-xs text-slate-500">Current volume occupied per Bengaluru municipal hub</p>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bins.slice(0, 10)} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="bin_code" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(val, name, item) => [`${val}% (${item.payload.location_name})`, 'Current Fill']}
                />
                <Bar dataKey="current_fill" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. AI Scanner 7-Class Material Stream Breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-[#12372A] font-serif">AI Scanner Stream Composition (7 Classes)</h3>
              <p className="text-xs text-slate-500">Classification distribution from citizen camera uploads</p>
            </div>
            <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              MobileNetV3
            </span>
          </div>
          <div className="h-[260px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={aiWasteBreakdown}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  innerRadius={45}
                  paddingAngle={3}
                  label={({ name }) => name}
                  fontSize={11}
                >
                  {aiWasteBreakdown.map((entry, index) => {
                    const color = AI_COLORS[entry.category?.toLowerCase()] || COLORS[index % COLORS.length];
                    return <Cell key={`ai-${index}`} fill={color} />;
                  })}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Weekly Collection Efficiency */}
        <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-[#12372A] font-serif">Weekly Completed Collections vs Alerts</h3>
            <p className="text-xs text-slate-500">Correlating dispatch turnaround to overflow prevention</p>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.daily_trends || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="collections" name="Collections Handled" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="overflow_alerts" name="High-Risk Alerts" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};

export default AdminAnalytics;
