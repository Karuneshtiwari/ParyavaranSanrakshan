import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../../services/api';
import { AlertOctagon, TrendingUp, Clock, Info, CheckCircle2, RefreshCw } from 'lucide-react';

export const AdminPriority = () => {
  const [priorityList, setPriorityList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPriority = async () => {
    try {
      const res = await dashboardAPI.getPriority();
      setPriorityList(res.data);
    } catch (err) {
      console.error("Failed to load priority queue:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPriority();
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 border border-rose-200 text-rose-800 text-xs font-semibold uppercase mb-1">
            <AlertOctagon className="w-3.5 h-3.5" />
            Decision-Support Optimization Engine • Bengaluru Metropolitan
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12372A] font-serif">
            Today's Collection Priority
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time ranked dispatch schedule based on multi-factor accumulation telemetry and ML risk prediction.
          </p>
        </div>

        <button
          onClick={fetchPriority}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#12372A] hover:bg-[#1b4332] text-white flex items-center gap-2 transition-colors shadow-sm shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Recalculate Priorities</span>
        </button>
      </div>

      {/* Dynamic Collection Priority Operational Guide */}
      <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-[#12372A] font-serif">
          <Info className="w-4 h-4 text-emerald-600" />
          <span>Automated Dispatch Prioritization</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Municipal bins are automatically ranked in real time based on current container fill levels, 6-hour predictive forecasting, and immediate overflow probability to ensure zero physical spillovers.
        </p>
        <div className="text-[11px] text-slate-500 flex flex-wrap gap-4 pt-1 font-medium">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500"></span>Critical Priority: Needs immediate clearance</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"></span>High Priority: Schedule next on route</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>Normal: Container has safe available volume</span>
        </div>
      </div>

      {/* Ranked Queue Cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Computing optimal collection priority queue...</div>
        ) : (
          priorityList.map((item) => {
            const isCritical = item.priority_level === 'CRITICAL';
            const isHigh = item.priority_level === 'HIGH';

            return (
              <div
                key={item.bin_id}
                className={`p-5 rounded-2xl border transition-all ${
                  isCritical ? 'bg-rose-50/50 border-rose-200 shadow-sm' :
                  isHigh ? 'bg-amber-50/40 border-amber-200 shadow-sm' :
                  'bg-white border-emerald-100 shadow-sm'
                } flex flex-col md:flex-row md:items-center justify-between gap-4`}
              >
                {/* Left: Rank, Code, Location */}
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-lg font-mono shrink-0 ${
                    isCritical ? 'bg-rose-600 text-white' :
                    isHigh ? 'bg-amber-600 text-white' :
                    'bg-[#12372A] text-white'
                  }`}>
                    #{item.rank}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {item.bin_code}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 font-serif">
                        {item.location_name}
                      </h3>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        isCritical ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                        isHigh ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {item.priority_level}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{item.waste_type}</p>
                  </div>
                </div>

                {/* Middle: Metrics */}
                <div className="grid grid-cols-3 gap-4 text-xs font-mono bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Current</span>
                    <strong className="text-sm font-bold text-slate-900">{item.current_fill}%</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Pred 6h</span>
                    <strong className="text-sm font-bold text-emerald-700">{item.predicted_6h}%</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Score</span>
                    <strong className={`text-sm font-bold ${isCritical ? 'text-rose-700' : isHigh ? 'text-amber-700' : 'text-slate-800'}`}>
                      {item.priority_score}
                    </strong>
                  </div>
                </div>

                {/* Right: Risk status */}
                <div className="flex md:flex-col items-center md:items-end justify-between text-xs">
                  <span className="text-slate-600">
                    Risk: <strong className={item.risk_level === 'HIGH' ? 'text-rose-700' : 'text-amber-700'}>{item.risk_level}</strong>
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Last clearance: {new Date(item.last_collection).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

export default AdminPriority;
