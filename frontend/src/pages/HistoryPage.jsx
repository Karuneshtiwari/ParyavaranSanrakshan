import React, { useState, useEffect } from 'react';
import { wasteAPI } from '../services/api';
import { Link } from 'react-router-dom';
import { Camera, Calendar, CheckCircle2, ArrowRight, MoreVertical } from 'lucide-react';

export const HistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await wasteAPI.getHistory();
        setHistory(res.data);
      } catch (err) {
        console.error("Failed to load scan history:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      
      {/* Header matching Image 2 Screen 6 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif text-[#12372A]">
            Scan History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            View your previous waste scans and recommendations.
          </p>
        </div>

        <Link
          to="/scanner"
          className="px-5 py-2.5 rounded-full bg-[#1b4332] hover:bg-[#143527] text-white text-xs sm:text-sm font-semibold shadow-sm transition-all flex items-center gap-2"
        >
          <Camera className="w-4 h-4 text-emerald-300" />
          <span>New Scan</span>
        </Link>
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm text-slate-400">Loading scan history...</div>
      ) : history.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl text-center space-y-3 border border-slate-200 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
            <Camera className="w-6 h-6 text-emerald-700" />
          </div>
          <h3 className="text-base font-semibold text-slate-700">No scans recorded yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Scan your first recyclable or waste item with the camera to see instant predictions logged here.
          </p>
          <Link
            to="/scanner"
            className="inline-block mt-2 px-5 py-2 rounded-full bg-[#1b4332] text-white text-xs font-semibold"
          >
            Launch Scanner
          </Link>
        </div>
      ) : (
        /* Table matching Image 2 Screen 6 */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Image</th>
                  <th className="py-3.5 px-6">Predicted Class</th>
                  <th className="py-3.5 px-6">Confidence</th>
                  <th className="py-3.5 px-6">Category</th>
                  <th className="py-3.5 px-6">Date & Time</th>
                  <th className="py-3.5 px-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {history.map((scan) => {
                  const confPct = (scan.confidence * 100).toFixed(1);
                  return (
                    <tr key={scan.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-6">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                          {scan.image_url ? (
                            <img
                              src={scan.image_url}
                              alt={scan.predicted_class}
                              className="w-full h-full object-cover hover:scale-110 transition-transform"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className={`w-full h-full items-center justify-center bg-emerald-50 text-emerald-800 ${scan.image_url ? 'hidden' : 'flex'}`}>
                            <Camera className="w-5 h-5 text-emerald-700" />
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-6 font-bold text-slate-800 capitalize">
                        {scan.predicted_class}
                      </td>

                      <td className="py-3.5 px-6 font-mono font-semibold text-emerald-800">
                        {confPct}%
                      </td>

                      <td className="py-3.5 px-6 text-slate-600">
                        {scan.category}
                      </td>

                      <td className="py-3.5 px-6 text-slate-400 text-xs">
                        {new Date(scan.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
