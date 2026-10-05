import React, { useState, useEffect } from 'react';
import { wasteAPI } from '../services/api';
import { Link } from 'react-router-dom';
import { Camera, Calendar, CheckCircle2, ArrowRight, Trash2, RefreshCw, AlertCircle, ShieldAlert } from 'lucide-react';

export const HistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [notice, setNotice] = useState(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await wasteAPI.getHistory();
      setHistory(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load scan history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleClearHistory = async () => {
    if (!window.confirm("Are you sure you want to clear your entire scan history? All corresponding scan photos will be permanently deleted from Cloudinary cloud storage.")) {
      return;
    }

    try {
      setClearing(true);
      setNotice(null);
      const res = await wasteAPI.clearHistory();
      setHistory([]);
      setNotice({
        type: 'success',
        message: res.data?.message || 'Scan history and all associated photos permanently deleted from Cloudinary.'
      });
    } catch (err) {
      setNotice({
        type: 'error',
        message: err.response?.data?.detail || 'Failed to clear scan history.'
      });
    } finally {
      setClearing(false);
    }
  };

  const handleDeleteItem = async (scanId) => {
    if (!window.confirm(`Delete scan #${scanId}? Its photo will be permanently purged from Cloudinary.`)) {
      return;
    }

    try {
      setDeletingId(scanId);
      setNotice(null);
      await wasteAPI.deleteItem(scanId);
      setHistory(prev => prev.filter(item => item.id !== scanId));
      setNotice({
        type: 'success',
        message: `Scan #${scanId} and its cloud image have been deleted permanently.`
      });
    } catch (err) {
      setNotice({
        type: 'error',
        message: err.response?.data?.detail || `Failed to delete scan #${scanId}.`
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      
      {/* Header matching Image 2 Screen 6 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif text-[#12372A]">
            Scan History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            View your previous waste scans, recommendations, and cloud media logs.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {history.length > 0 && (
            <button
              onClick={handleClearHistory}
              disabled={clearing}
              className="px-4 py-2.5 rounded-full border border-rose-300 hover:bg-rose-50 text-rose-700 text-xs sm:text-sm font-semibold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>{clearing ? 'Purging Cloud Media...' : 'Clear All History'}</span>
            </button>
          )}

          <Link
            to="/scanner"
            className="px-5 py-2.5 rounded-full bg-[#1b4332] hover:bg-[#143527] text-white text-xs sm:text-sm font-semibold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <Camera className="w-4 h-4 text-emerald-300" />
            <span>New Scan</span>
          </Link>
        </div>
      </div>

      {notice && (
        <div className={`p-4 rounded-2xl text-xs flex items-center gap-2.5 shadow-2xs ${
          notice.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' 
            : 'bg-rose-50 text-rose-900 border border-rose-200'
        }`}>
          {notice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{notice.message}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-emerald-700" />
          <span>Loading scan history...</span>
        </div>
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
            className="inline-block mt-2 px-5 py-2 rounded-full bg-[#1b4332] text-white text-xs font-semibold cursor-pointer"
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
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {history.map((scan) => {
                  const confPct = (scan.confidence * 100).toFixed(1);
                  const isDeleting = deletingId === scan.id;
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
                                if (e.target.nextSibling) {
                                  e.target.nextSibling.style.display = 'flex';
                                }
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
                        <button 
                          onClick={() => handleDeleteItem(scan.id)}
                          disabled={isDeleting}
                          title="Delete scan and remove photo from Cloudinary"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-40"
                        >
                          <Trash2 className={`w-4 h-4 ${isDeleting ? 'animate-spin' : ''}`} />
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

export default HistoryPage;
