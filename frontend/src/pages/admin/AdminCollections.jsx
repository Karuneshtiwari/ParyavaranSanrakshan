import React, { useState, useEffect } from 'react';
import { collectionAPI } from '../../services/api';
import { History, Calendar, CheckCircle2, Truck, RefreshCw } from 'lucide-react';

export const AdminCollections = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCollections = async () => {
    try {
      const res = await collectionAPI.getAll();
      setCollections(res.data);
    } catch (err) {
      console.error("Failed to load collection logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold uppercase mb-1">
            <History className="w-3.5 h-3.5" />
            Field Operations Audit • Bengaluru Metropolitan
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12372A] font-serif">
            Sanitation Collection History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Audit logs of verified municipal bin clearances, fill differentials, and timestamped pick-ups.
          </p>
        </div>

        <button
          onClick={fetchCollections}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#12372A] hover:bg-[#1b4332] text-white flex items-center gap-2 transition-colors shadow-sm shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Logs</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-emerald-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f7faf7] text-slate-600 font-mono uppercase tracking-wider border-b border-emerald-100">
              <tr>
                <th className="px-4 py-3">Log ID</th>
                <th className="px-4 py-3">Bin Code</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Collector Agent</th>
                <th className="px-4 py-3">Before Fill</th>
                <th className="px-4 py-3">After Fill</th>
                <th className="px-4 py-3">Net Cleared</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-slate-400">
                    Loading logs...
                  </td>
                </tr>
              ) : collections.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-slate-400">
                    No collection actions have been recorded yet. Mark bins collected in the Collector Portal to generate logs.
                  </td>
                </tr>
              ) : (
                collections.map((col) => {
                  const netDiff = Math.max(0, col.before_fill - col.after_fill);
                  return (
                    <tr key={col.id} className="hover:bg-emerald-50/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-400">#{col.id}</td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{col.bin_code || `ID-${col.bin_id}`}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{col.location_name || 'Bengaluru Hub'}</td>
                      <td className="px-4 py-3 text-slate-600">{col.collector_name}</td>
                      <td className="px-4 py-3 font-mono text-rose-600 font-semibold">{col.before_fill}%</td>
                      <td className="px-4 py-3 font-mono text-emerald-600 font-semibold">{col.after_fill}%</td>
                      <td className="px-4 py-3 font-mono font-bold text-teal-700">-{netDiff.toFixed(1)}%</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {col.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                        {new Date(col.collection_time).toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AdminCollections;
