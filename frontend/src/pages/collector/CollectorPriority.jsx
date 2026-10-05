import React, { useState, useEffect } from 'react';
import { dashboardAPI, collectionAPI } from '../../services/api';
import { Truck, CheckCircle, RefreshCw, AlertTriangle, Clock, Sparkles } from 'lucide-react';

export const CollectorPriority = () => {
  const [priorityQueue, setPriorityQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingBinId, setProcessingBinId] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const fetchPriority = async () => {
    try {
      const res = await dashboardAPI.getPriority();
      setPriorityQueue(res.data);
    } catch (err) {
      console.error("Failed to load queue:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPriority();
  }, []);

  const handleMarkCollected = async (binId, locationName, beforeFill) => {
    setProcessingBinId(binId);
    setActionSuccess(null);
    try {
      await collectionAPI.markCollected(binId, 10.0);
      setActionSuccess(`Successfully serviced ${locationName}! Fill reset from ${beforeFill}% to 10%. Database & telemetry updated.`);
      await fetchPriority();
    } catch (err) {
      console.error("Failed to mark collected:", err);
      alert("Failed to mark bin as collected. Please retry.");
    } finally {
      setProcessingBinId(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 border border-emerald-300 text-emerald-800 text-xs font-semibold uppercase mb-1">
            <Truck className="w-3.5 h-3.5 text-emerald-600" />
            Collector Field Operations • Bengaluru Metropolitan
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12372A] font-serif">
            Priority Collection Dispatch
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Assigned municipal bins requiring collection. Click 'Mark as Serviced' once bin is cleared.
          </p>
        </div>

        <button
          onClick={fetchPriority}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#12372A] hover:bg-[#1b4332] text-white flex items-center gap-2 transition-colors shadow-sm shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Success Notification */}
      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs sm:text-sm flex items-center gap-3 shadow-sm">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Priority Queue Cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading collection dispatch queue...</div>
        ) : priorityQueue.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-emerald-100 text-center space-y-2">
            <div className="text-3xl">🎉</div>
            <h3 className="text-base font-bold text-slate-800">All Bins Within Safe Thresholds</h3>
            <p className="text-xs text-slate-500">No bins currently require urgent municipal dispatch.</p>
          </div>
        ) : (
          priorityQueue.map((item) => {
            const isProcessing = processingBinId === item.bin_id;
            return (
              <div
                key={item.bin_id}
                className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-emerald-300 transition-colors"
              >
                <div className="space-y-2 max-w-xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                      Rank #{item.rank}
                    </span>
                    <span className="font-mono text-xs font-bold text-emerald-800">
                      {item.bin_code}
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      item.priority_level === 'CRITICAL' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                      item.priority_level === 'HIGH' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                      'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {item.priority_level} Priority
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 font-serif">
                    {item.location_name}
                  </h3>

                  <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap">
                    <span>Current Fill: <strong className="text-slate-900">{item.current_fill}%</strong></span>
                    <span>Pred 6h: <strong className="text-slate-900">{item.predicted_6h}%</strong></span>
                    <span>Pred 12h: <strong className="text-slate-900">{item.predicted_12h}%</strong></span>
                    <span>Urgency Score: <strong className="text-emerald-700 font-mono">{item.priority_score}</strong></span>
                  </div>
                </div>

                <button
                  disabled={isProcessing}
                  onClick={() => handleMarkCollected(item.bin_id, item.location_name, item.current_fill)}
                  className={`w-full md:w-auto px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm shrink-0 ${
                    isProcessing
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{isProcessing ? 'Updating Telemetry...' : 'Mark as Serviced'}</span>
                </button>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

export default CollectorPriority;
