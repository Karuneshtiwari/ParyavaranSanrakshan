import React, { useState, useEffect, useRef } from 'react';
import { binAPI } from '../../services/api';
import { BinMap } from '../../components/BinMap';
import { 
  Trash2, 
  Search, 
  Filter, 
  MapPin, 
  RefreshCw, 
  AlertTriangle,
  ArrowUpDown,
  Navigation,
  Truck,
  CheckCircle2,
  X
} from 'lucide-react';

export const AdminBins = () => {
  const [bins, setBins] = useState([]);
  const [collectors, setCollectors] = useState([]);
  const [assigningBin, setAssigningBin] = useState(null);
  const [assignMsg, setAssignMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [wasteTypeFilter, setWasteTypeFilter] = useState('');
  const [selectedBin, setSelectedBin] = useState(null);

  const mapSectionRef = useRef(null);

  const fetchBins = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (riskFilter) params.risk = riskFilter;
      if (wasteTypeFilter) params.waste_type = wasteTypeFilter;

      const res = await binAPI.getAll(params);
      setBins(res.data);
    } catch (err) {
      console.error("Failed to fetch bins:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCollectors = async () => {
    try {
      const res = await binAPI.getCollectors();
      setCollectors(res.data || []);
    } catch (err) {
      console.error("Failed to fetch collectors:", err);
    }
  };

  useEffect(() => {
    fetchBins();
    fetchCollectors();
  }, [search, statusFilter, riskFilter, wasteTypeFilter]);

  const handleAssignCollector = async (binId, collector) => {
    try {
      await binAPI.assignCollector(binId, {
        collector_id: collector ? collector.id : null,
        collector_name: collector ? collector.name : null
      });
      setAssignMsg(collector ? `Assigned bin to ${collector.name}` : `Unassigned collector from bin.`);
      setAssigningBin(null);
      await fetchBins();
      setTimeout(() => setAssignMsg(null), 3500);
    } catch (err) {
      console.error("Failed to assign collector:", err);
    }
  };

  const handleSelectBinAndRedirectMap = (bin) => {
    setSelectedBin(bin);
    if (mapSectionRef.current) {
      mapSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-emerald-700 font-bold block mb-1">
            Spatial Telemetry Network • Bengaluru Metropolitan
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12372A] font-serif">
            Smart Bin Monitoring & Municipal Map
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Live telemetry readings, fill rate predictions, and interactive GIS tracking across 20 Bengaluru metropolitan hubs. Click any bin row to center on the map.
          </p>
        </div>

        <button
          onClick={fetchBins}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#12372A] hover:bg-[#1b4332] text-white flex items-center gap-2 transition-colors shadow-sm shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {assignMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{assignMsg}</span>
          </div>
          <button onClick={() => setAssignMsg(null)} className="text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* GIS Leaflet Map */}
      <div 
        ref={mapSectionRef}
        id="admin-map-section"
        className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-sm space-y-3 scroll-mt-6"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 px-1">
          <span className="text-xs sm:text-sm font-bold text-[#12372A] flex items-center gap-2 font-serif">
            <MapPin className="w-4 h-4 text-emerald-600" />
            Bengaluru Metropolitan Smart Bin Topology (20 Municipal Hubs)
          </span>
          {selectedBin && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
              <Navigation className="w-3 h-3 text-emerald-600" />
              <span>Focused: <strong>{selectedBin.bin_code}</strong> ({selectedBin.location_name})</span>
            </div>
          )}
        </div>
        <BinMap bins={bins} selectedBin={selectedBin} onSelectBin={(b) => setSelectedBin(b)} />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by code or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#f7faf7] border border-emerald-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 bg-[#f7faf7] border border-emerald-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-emerald-600"
          >
            <option value="">All Statuses</option>
            <option value="Normal">Normal (&lt;60%)</option>
            <option value="Warning">Warning (60-79%)</option>
            <option value="Critical">Critical (&ge;80%)</option>
          </select>
        </div>

        <div>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="w-full px-3 py-2 bg-[#f7faf7] border border-emerald-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-emerald-600"
          >
            <option value="">All Overflow Risks</option>
            <option value="LOW">LOW Risk</option>
            <option value="MEDIUM">MEDIUM Risk</option>
            <option value="HIGH">HIGH Risk</option>
          </select>
        </div>

        <div>
          <select
            value={wasteTypeFilter}
            onChange={(e) => setWasteTypeFilter(e.target.value)}
            className="w-full px-3 py-2 bg-[#f7faf7] border border-emerald-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-emerald-600"
          >
            <option value="">All Waste Types</option>
            <option value="Plastic">Plastic / Dry</option>
            <option value="Organic">Organic / Wet</option>
            <option value="Paper">Paper / Recyclable</option>
            <option value="Packaging">Cardboard / Packaging</option>
            <option value="Mixed">Mixed / General</option>
          </select>
        </div>
      </div>

      {/* Bin Monitoring Table */}
      <div className="bg-white rounded-2xl border border-emerald-100 overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-emerald-100 flex items-center justify-between bg-emerald-50/50">
          <span className="text-xs font-bold text-[#12372A] font-serif">
            Live Municipal Telemetry Ledger ({bins.length} Active Hubs)
          </span>
          <span className="text-[11px] text-emerald-700 font-medium">
            💡 Click any row to automatically center on map
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f7faf7] text-slate-600 font-mono uppercase tracking-wider border-b border-emerald-100">
              <tr>
                <th className="px-4 py-3">Bin Code</th>
                <th className="px-4 py-3">Bengaluru Zone</th>
                <th className="px-4 py-3">Waste Stream</th>
                <th className="px-4 py-3">Current Fill</th>
                <th className="px-4 py-3">Pred 6h</th>
                <th className="px-4 py-3">Pred 12h</th>
                <th className="px-4 py-3">Risk Level</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Assigned Collector</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="10" className="text-center py-8 text-slate-400">
                    Loading bin sensors...
                  </td>
                </tr>
              ) : bins.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-8 text-slate-400">
                    No bins match your current filters.
                  </td>
                </tr>
              ) : (
                bins.map((bin) => {
                  const pred = bin.latest_prediction;
                  const isSelected = selectedBin?.id === bin.id;
                  const isAssigningThis = assigningBin?.id === bin.id;
                  return (
                    <tr
                      key={bin.id}
                      className={`hover:bg-emerald-50/60 transition-colors cursor-pointer ${
                        isSelected ? 'bg-emerald-50/90 font-semibold' : ''
                      }`}
                      onClick={() => handleSelectBinAndRedirectMap(bin)}
                    >
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        {bin.bin_code}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {bin.location_name}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {bin.waste_type}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold w-9">{bin.current_fill}%</span>
                          <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                            <div
                              className={`h-full rounded-full ${
                                bin.current_fill >= 80 ? 'bg-red-500' :
                                bin.current_fill >= 60 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, bin.current_fill)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {pred ? `${pred.predicted_6h}%` : 'N/A'}
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {pred ? `${pred.predicted_12h}%` : 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          pred?.risk_level === 'HIGH' ? 'bg-red-100 text-red-700 border border-red-200' :
                          pred?.risk_level === 'MEDIUM' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                          'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}>
                          {pred ? pred.risk_level : 'LOW'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          bin.status === 'Critical' ? 'bg-red-100 text-red-800 border border-red-300' :
                          bin.status === 'Warning' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                          'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}>
                          {bin.status}
                        </span>
                      </td>

                      {/* Assigned Collector Cell */}
                      <td className="px-4 py-3 relative" onClick={(e) => e.stopPropagation()}>
                        {bin.assigned_collector_name ? (
                          <div className="flex items-center gap-1.5">
                            <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-900 border border-emerald-200 truncate max-w-[130px] flex items-center gap-1">
                              <Truck className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span className="truncate">{bin.assigned_collector_name}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setAssigningBin(isAssigningThis ? null : bin)}
                              className="text-[10px] text-slate-500 hover:text-emerald-700 font-medium underline"
                            >
                              Edit
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setAssigningBin(isAssigningThis ? null : bin)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-900 border border-slate-200 transition-colors cursor-pointer"
                          >
                            + Assign Collector
                          </button>
                        )}

                        {/* Dropdown Menu */}
                        {isAssigningThis && (
                          <div className="absolute right-0 sm:left-0 z-30 mt-1.5 w-52 bg-white rounded-2xl border border-emerald-200 shadow-xl p-2.5 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                            <div className="flex justify-between items-center px-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              <span>Assign Collector</span>
                              <button onClick={() => setAssigningBin(null)} className="text-slate-400 hover:text-slate-700">
                                <X className="w-3 h-3" />
                              </button>
                            </div>

                            <div className="max-h-40 overflow-y-auto space-y-0.5 py-1">
                              {collectors.length === 0 ? (
                                <div className="text-[11px] text-slate-400 p-2 text-center">
                                  No registered collectors found.
                                </div>
                              ) : (
                                collectors.map((c) => (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => handleAssignCollector(bin.id, c)}
                                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                                      bin.assigned_collector_id === c.id 
                                        ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200' 
                                        : 'hover:bg-slate-50 text-slate-700'
                                    }`}
                                  >
                                    <span className="truncate">{c.name}</span>
                                    {bin.assigned_collector_id === c.id && (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    )}
                                  </button>
                                ))
                              )}
                            </div>

                            {bin.assigned_collector_name && (
                              <button
                                type="button"
                                onClick={() => handleAssignCollector(bin.id, null)}
                                className="w-full text-center text-[11px] font-semibold text-rose-600 hover:text-rose-800 pt-1.5 border-t border-slate-100"
                              >
                                Unassign Collector
                              </button>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectBinAndRedirectMap(bin);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors"
                        >
                          <MapPin className="w-3 h-3 text-emerald-600" />
                          <span>View on Map</span>
                        </button>
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

export default AdminBins;
