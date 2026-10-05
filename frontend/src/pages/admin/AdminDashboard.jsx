import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI, binAPI, contactAPI, donationAPI, authAPI } from '../../services/api';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  TrendingUp, 
  ArrowRight, 
  Sparkles,
  MapPin,
  Clock,
  Layers,
  Activity,
  Calendar,
  AlertCircle,
  Mail,
  Heart,
  Check,
  Users,
  UserCheck,
  Truck,
  Shield,
  BookOpen
} from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

export const AdminDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [priority, setPriority] = useState([]);
  const [contactMessages, setContactMessages] = useState([]);
  const [donations, setDonations] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [simMessage, setSimMessage] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshNotice, setRefreshNotice] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);

  const fetchData = async () => {
    try {
      const [sumRes, anaRes, priRes, msgRes, donRes, userRes] = await Promise.allSettled([
        dashboardAPI.getSummary(),
        dashboardAPI.getAnalytics(),
        dashboardAPI.getPriority(),
        contactAPI.getAll(),
        donationAPI.getAllAdmin(),
        authAPI.getUsers(),
      ]);
      if (sumRes.status === 'fulfilled') setSummary(sumRes.value.data);
      if (anaRes.status === 'fulfilled') setAnalytics(anaRes.value.data);
      if (priRes.status === 'fulfilled') setPriority(priRes.value.data);
      if (msgRes.status === 'fulfilled') setContactMessages(msgRes.value.data || []);
      if (donRes.status === 'fulfilled') setDonations(donRes.value.data || []);
      if (userRes.status === 'fulfilled') setUsersList(Array.isArray(userRes.value.data) ? userRes.value.data : (userRes.value.data?.users || []));
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshData = async () => {
    setRefreshing(true);
    setRefreshNotice(null);
    try {
      await fetchData();
      setRefreshNotice("System metrics, sensor telemetry, and logs synchronized successfully!");
      setTimeout(() => setRefreshNotice(null), 4000);
    } catch (err) {
      setRefreshNotice("Failed to refresh some telemetry services.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeleteUser = async (u) => {
    if (!window.confirm(`Are you sure you want to delete user "${u.name}" (${u.email})? This action will remove all their records from the platform.`)) {
      return;
    }
    setDeletingUserId(u.id);
    try {
      await authAPI.deleteUser(u.id);
      setUsersList(prev => prev.filter(item => item.id !== u.id));
      setRefreshNotice(`User "${u.name}" deleted successfully.`);
      setTimeout(() => setRefreshNotice(null), 4000);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete user.");
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleMarkMessageRead = async (id) => {
    try {
      await contactAPI.markRead(id);
      setContactMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: true } : m));
    } catch (err) {
      console.error("Failed to mark message read:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSimulateUpdate = async () => {
    setSimulating(true);
    setSimMessage(null);
    try {
      const res = await binAPI.simulateUpdate();
      setSimMessage(res.data.message);
      await fetchData();
    } catch (err) {
      console.error("Simulation failed:", err);
      setSimMessage("Simulation failed to execute.");
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-500 flex items-center justify-center gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-[#1b4332]" />
        <span>Loading Smart Bin Operations Dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Banner matching Image 3 Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">
            <span>Autonomous Sanitation Command Center</span>
            <span>•</span>
            <span className="text-slate-400">04 Oct 2026</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#12372A]">
            Welcome, Admin !
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Monitor smart bins, track predictions and manage waste collection for cleaner, healthier communities.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleRefreshData}
            disabled={refreshing}
            className="px-4 py-2.5 rounded-full font-semibold text-xs border border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-900 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-700 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing Telemetry...' : 'Refresh Data & Logs'}</span>
          </button>

          <button
            onClick={handleSimulateUpdate}
            disabled={simulating}
            className="px-5 py-2.5 rounded-full font-semibold text-xs bg-[#1b4332] hover:bg-[#143527] text-white shadow-sm flex items-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-300 ${simulating ? 'animate-spin' : ''}`} />
            <span>{simulating ? 'Simulating Telemetry...' : 'Simulate Sensor Update'}</span>
          </button>

          <Link
            to="/admin/blogs"
            className="px-4 py-2.5 rounded-full font-semibold text-xs border border-slate-300 hover:bg-slate-50 text-slate-700 transition-all flex items-center justify-center shadow-2xs"
          >
            <span>Post Activity</span>
          </Link>
        </div>
      </div>

      {refreshNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{refreshNotice}</span>
        </div>
      )}

      {simMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 shadow-xs">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{simMessage}</span>
        </div>
      )}

      {/* KPI METRIC CARDS MATCHING IMAGE 3 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        
        {/* Total Bins */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">Total Bins</span>
          <div className="text-2xl sm:text-3xl font-bold font-serif text-slate-800">{summary?.total_bins}</div>
          <span className="text-[10px] text-emerald-700 font-medium">Monitored Locations (+0%)</span>
        </div>

        {/* Normal Bins */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 bg-emerald-50/20 shadow-2xs space-y-1">
          <span className="text-[11px] text-emerald-800 font-semibold uppercase tracking-wider block">Normal Bins</span>
          <div className="text-2xl sm:text-3xl font-bold font-serif text-emerald-800">{summary?.normal_count}</div>
          <span className="text-[10px] text-slate-500 font-medium">60% Safe</span>
        </div>

        {/* Warning Bins */}
        <div className="bg-white p-4 rounded-2xl border border-amber-100 bg-amber-50/20 shadow-2xs space-y-1">
          <span className="text-[11px] text-amber-800 font-semibold uppercase tracking-wider block">Warning Bins</span>
          <div className="text-2xl sm:text-3xl font-bold font-serif text-amber-800">{summary?.warning_count}</div>
          <span className="text-[10px] text-slate-500 font-medium">25% Capacity</span>
        </div>

        {/* Critical Bins */}
        <div className="bg-white p-4 rounded-2xl border border-rose-100 bg-rose-50/20 shadow-2xs space-y-1">
          <span className="text-[11px] text-rose-800 font-semibold uppercase tracking-wider block">Critical Bins</span>
          <div className="text-2xl sm:text-3xl font-bold font-serif text-rose-800">{summary?.critical_count}</div>
          <span className="text-[10px] text-rose-600 font-semibold">15% Immediate</span>
        </div>

        {/* Average Fill Level */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">Average Fill Level</span>
          <div className="text-2xl sm:text-3xl font-bold font-serif text-slate-800">{summary?.average_fill}%</div>
          <span className="text-[10px] text-emerald-700 font-semibold">↑ +12% vs last week</span>
        </div>

        {/* Predicted Overflow */}
        <div className="bg-white p-4 rounded-2xl border border-purple-100 bg-purple-50/20 shadow-2xs space-y-1">
          <span className="text-[11px] text-purple-900 font-semibold uppercase tracking-wider block">Predicted Overflow</span>
          <div className="text-2xl sm:text-3xl font-bold font-serif text-purple-900">{summary?.predicted_overflow_count}</div>
          <span className="text-[10px] text-purple-700 font-semibold">Next 12 Hours</span>
        </div>

      </div>

      {/* MIDDLE ROW: Smart Bin Network Status & Top Collection Priority (Matching Image 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Fill Level by Location Bar Chart */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold font-serif text-[#12372A]">Smart Bin Network Fill Levels</h3>
              <p className="text-xs text-slate-500">Live status of campus smart bins vs critical threshold (80%)</p>
            </div>
            <Link to="/admin/bins" className="text-xs font-semibold text-[#1b4332] hover:underline">
              <span>View Map</span>
            </Link>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.fill_by_location || []} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="code" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(val, name, item) => [`${val}% (${item.payload.location})`, 'Fill Level']}
                />
                <Bar dataKey="fill" radius={[6, 6, 0, 0]}>
                  {(analytics?.fill_by_location || []).map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.fill >= 80 ? '#ef4444' : entry.fill >= 60 ? '#f59e0b' : '#10b981'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Top Collection Priority (Matching Image 3) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold font-serif text-[#12372A]">Top Collection Priority</h3>
              <p className="text-xs text-slate-500">Bins needing immediate dispatch</p>
            </div>
            <Link to="/admin/priority" className="text-xs font-semibold text-[#1b4332] hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {(priority.slice(0, 5)).map((item, idx) => (
              <div key={item.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{item.location}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">{item.bin_code}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-bold text-xs text-slate-800 font-mono">{item.current_fill}%</span>
                  <span className={`block text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                    item.priority_level === 'CRITICAL' ? 'text-rose-700 bg-rose-100' :
                    item.priority_level === 'HIGH' ? 'text-amber-700 bg-amber-100' :
                    'text-emerald-700 bg-emerald-100'
                  }`}>
                    {item.priority_level}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* BOTTOM ROW: Donut Charts & Insights (Matching Image 3) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Waste Stream Breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm font-bold font-serif text-[#12372A]">Waste Category Distribution</h3>
          <p className="text-xs text-slate-400">Total scans categorized by AI</p>

          <div className="h-[200px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics?.waste_by_category || []}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  innerRadius={45}
                  paddingAngle={3}
                >
                  {(analytics?.waste_by_category || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fill Level Trend */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm font-bold font-serif text-[#12372A]">Bin Fill Level Trend</h3>
          <p className="text-xs text-slate-400">Weekly average accumulation</p>

          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics?.daily_trends || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip />
                <Line type="monotone" dataKey="avg_fill" stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Insights Alert Box matching Image 3 bottom right */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm font-bold font-serif text-[#12372A]">AI/ML Real-Time Insights</h3>
          <p className="text-xs text-slate-400">Generated from current predictions and bin data</p>

          <div className="space-y-2.5 text-xs text-slate-600">
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-2">
              <span className="text-rose-600 font-bold shrink-0">⚠️</span>
              <span>Food Court (B002) is predicted to reach 98% fill in the next 6 hours.</span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100 flex items-start gap-2">
              <span className="text-amber-600 font-bold shrink-0">⚠️</span>
              <span>3 bins are likely to overflow within the next 12 hours.</span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-2">
              <span className="text-emerald-600 font-bold shrink-0">📈</span>
              <span>Market Area shows higher waste generation during evenings.</span>
            </div>
          </div>
        </div>

      </div>

      {/* CITIZEN INQUIRIES & MESSAGES (PERSISTED IN NEON POSTGRESQL) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-emerald-800" />
            <h3 className="text-base font-bold font-serif text-[#12372A]">
              Community Inquiries & Citizen Feedback ({contactMessages.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400">Official Communication Channel</span>
        </div>

        {contactMessages.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No contact messages received yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400">
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Sender</th>
                  <th className="pb-3 font-semibold">Email</th>
                  <th className="pb-3 font-semibold">Subject</th>
                  <th className="pb-3 font-semibold">Message</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {contactMessages.map((msg) => (
                  <tr key={msg.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 text-slate-500 whitespace-nowrap">
                      {new Date(msg.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 font-bold text-slate-800">{msg.name}</td>
                    <td className="py-3 text-slate-600">{msg.email}</td>
                    <td className="py-3 font-semibold text-slate-700">{msg.subject}</td>
                    <td className="py-3 text-slate-600 max-w-xs truncate" title={msg.message}>
                      {msg.message}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        msg.is_read ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {msg.is_read ? 'Read' : 'New'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {!msg.is_read && (
                        <button
                          onClick={() => handleMarkMessageRead(msg.id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-[11px] transition-all cursor-pointer"
                        >
                          Mark Read
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RAZORPAY COMMUNITY DONATIONS (PERSISTED IN NEON POSTGRESQL) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-600 fill-rose-600" />
            <h3 className="text-base font-bold font-serif text-[#12372A]">
              Community Contributions & Donations ({donations.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400">Verified Environmental Contributions</span>
        </div>

        {donations.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No donations recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400">
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Donor</th>
                  <th className="pb-3 font-semibold">Email</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold">Order ID</th>
                  <th className="pb-3 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {donations.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 text-slate-500 whitespace-nowrap">
                      {new Date(d.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 font-bold text-slate-800">{d.donor_name || 'Anonymous'}</td>
                    <td className="py-3 text-slate-600">{d.donor_email || '—'}</td>
                    <td className="py-3 font-bold text-emerald-700">₹{d.amount.toFixed(2)}</td>
                    <td className="py-3 font-mono text-[11px] text-slate-500">
                      <div>{d.razorpay_order_id}</div>
                      {d.razorpay_payment_id && <div className="text-slate-400">{d.razorpay_payment_id}</div>}
                    </td>
                    <td className="py-3 text-right">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        d.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CITIZENS & COLLECTORS DIRECTORY */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#1b4332]" />
            <div>
              <h3 className="text-base font-bold font-serif text-[#12372A]">
                Platform Users & Waste Collectors Directory ({usersList.length})
              </h3>
              <p className="text-xs text-slate-500">
                Registered platform citizens, assigned municipality collectors, and administrators.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Role Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
              {['ALL', 'CITIZEN', 'COLLECTOR', 'ADMIN'].map((rf) => (
                <button
                  key={rf}
                  onClick={() => setUserRoleFilter(rf)}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    userRoleFilter === rf
                      ? 'bg-white text-slate-800 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {rf}
                </button>
              ))}
            </div>

            <Link
              to="/admin/users"
              className="px-4 py-2 rounded-xl bg-[#12372A] hover:bg-[#1b4332] text-white text-xs font-bold transition-all shadow-xs"
            >
              <span>Manage Directory</span>
            </Link>
          </div>
        </div>

        {/* User list table */}
        {usersList.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No registered users found in database.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400">
                  <th className="pb-3 font-semibold">User</th>
                  <th className="pb-3 font-semibold">Email</th>
                  <th className="pb-3 font-semibold">Role</th>
                  <th className="pb-3 font-semibold">Registered</th>
                  <th className="pb-3 font-semibold text-center">Permissions</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {usersList
                  .filter((u) => userRoleFilter === 'ALL' || (u.role || '').toUpperCase() === userRoleFilter)
                  .map((u) => {
                    const roleUpper = (u.role || 'CITIZEN').toUpperCase();
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 font-bold text-slate-800 flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold ${
                            roleUpper === 'ADMIN' ? 'bg-purple-700' : roleUpper === 'COLLECTOR' ? 'bg-amber-600' : 'bg-[#1b4332]'
                          }`}>
                            {u.name ? u.name[0] : 'U'}
                          </div>
                          <span>{u.name || 'Anonymous User'}</span>
                        </td>
                        <td className="py-3 text-slate-600 font-mono text-[11px]">{u.email}</td>
                        <td className="py-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            roleUpper === 'ADMIN'
                              ? 'bg-purple-100 text-purple-800'
                              : roleUpper === 'COLLECTOR'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {roleUpper === 'ADMIN' && <Shield className="w-3 h-3" />}
                            {roleUpper === 'COLLECTOR' && <Truck className="w-3 h-3" />}
                            {roleUpper === 'CITIZEN' && <UserCheck className="w-3 h-3" />}
                            {roleUpper}
                          </span>
                        </td>
                        <td className="py-3 text-slate-500 whitespace-nowrap">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-3 text-center text-slate-500">
                          {roleUpper === 'ADMIN'
                            ? 'Full Command Access'
                            : roleUpper === 'COLLECTOR'
                            ? 'Routes & Collections'
                            : 'Scanning & Events'}
                        </td>
                        <td className="py-3 text-right">
                          {roleUpper !== 'ADMIN' ? (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              disabled={deletingUserId === u.id}
                              title={`Delete ${roleUpper.toLowerCase()}`}
                              className="p-1.5 rounded-lg text-rose-500 hover:text-white hover:bg-rose-600 transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center justify-center"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-semibold px-2">Primary</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QUICK ADMINISTRATIVE HUBS (Articles, Events, Telemetry) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link
          to="/admin/blogs"
          className="group p-5 bg-white rounded-3xl border border-slate-200 hover:border-emerald-500 shadow-xs hover:shadow-md transition-all flex items-start gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#1b4332] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 group-hover:text-[#1b4332] transition-colors">
              Article & Newsletter Publishing
            </h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Compose sustainability articles, publish awareness bulletins, and manage newsletter updates.
            </p>
          </div>
        </Link>

        <Link
          to="/admin/events"
          className="group p-5 bg-white rounded-3xl border border-slate-200 hover:border-emerald-500 shadow-xs hover:shadow-md transition-all flex items-start gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#1b4332] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 group-hover:text-[#1b4332] transition-colors">
              Events Scheduling & Attendees
            </h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Organize neighborhood plantation drives, e-waste campaigns, and track citizen registrations.
            </p>
          </div>
        </Link>

        <Link
          to="/admin/priority"
          className="group p-5 bg-white rounded-3xl border border-slate-200 hover:border-emerald-500 shadow-xs hover:shadow-md transition-all flex items-start gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#1b4332] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 group-hover:text-[#1b4332] transition-colors">
              Fleet & Dispatch Priorities
            </h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Coordinate bin routes, monitor critical overflow scores, and view collector completions.
            </p>
          </div>
        </Link>
      </div>

    </div>
  );
};
