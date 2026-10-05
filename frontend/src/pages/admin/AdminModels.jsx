import React, { useState, useEffect } from 'react';
import { modelAPI } from '../../services/api';
import { 
  Cpu, 
  CheckCircle, 
  BarChart2, 
  Layers, 
  Database, 
  ShieldCheck, 
  Calendar,
  Sparkles,
  Info
} from 'lucide-react';

export const AdminModels = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('waste');

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await modelAPI.getMetrics();
        setMetrics(res.data);
      } catch (err) {
        console.error("Failed to load ML metrics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading) {
    return <div className="p-12 text-center text-slate-400">Loading verified ML evaluation results...</div>;
  }

  const waste = metrics?.waste_classifier;
  const binReg = metrics?.bin_regressor;
  const overflow = metrics?.overflow_classifier;

  return (
    <div className="space-y-6">
      
      {/* Title Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 border border-teal-200 text-teal-800 text-xs font-semibold uppercase mb-1">
            <Cpu className="w-3.5 h-3.5" />
            Empirical Machine Learning Evaluation • Bengaluru Metropolitan
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12372A] font-serif">
            Model Performance & Validation
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real test-set evaluation results loaded directly from saved model artifacts. Zero simulated evaluation figures.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Artifacts Validated</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-emerald-100 gap-2 bg-white px-4 pt-3 rounded-2xl border shadow-xs">
        <button
          onClick={() => setActiveTab('waste')}
          className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
            activeTab === 'waste'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Model 1: Waste Classification
        </button>
        <button
          onClick={() => setActiveTab('regressor')}
          className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
            activeTab === 'regressor'
              ? 'border-teal-700 text-teal-800'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Model 2: Bin Fill Regressor
        </button>
        <button
          onClick={() => setActiveTab('overflow')}
          className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
            activeTab === 'overflow'
              ? 'border-amber-700 text-amber-800'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Model 3: Overflow Risk Classifier
        </button>
      </div>

      {/* TAB 1: WASTE CLASSIFICATION */}
      {activeTab === 'waste' && waste && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-emerald-100 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-[#12372A] font-serif">{waste.model_name} (Transfer Learning)</h3>
                <p className="text-xs text-slate-500">Trained on {waste.dataset} • Evaluated on {waste.test_sample_count} hold-out test images</p>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Timestamp: {waste.evaluation_timestamp}
              </span>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#f7faf7] p-4 rounded-xl border border-emerald-100 space-y-1">
                <span className="text-xs text-slate-500 block uppercase font-mono">Test Accuracy</span>
                <strong className="text-2xl font-bold text-emerald-700 font-serif">
                  {(waste.accuracy * 100).toFixed(2)}%
                </strong>
                <p className="text-[10px] text-slate-400">Across 6 classes</p>
              </div>

              <div className="bg-[#f7faf7] p-4 rounded-xl border border-emerald-100 space-y-1">
                <span className="text-xs text-slate-500 block uppercase font-mono">Precision (Macro)</span>
                <strong className="text-2xl font-bold text-teal-700 font-serif">
                  {(waste.precision_macro * 100).toFixed(2)}%
                </strong>
                <p className="text-[10px] text-slate-400">Unweighted class mean</p>
              </div>

              <div className="bg-[#f7faf7] p-4 rounded-xl border border-emerald-100 space-y-1">
                <span className="text-xs text-slate-500 block uppercase font-mono">Recall (Macro)</span>
                <strong className="text-2xl font-bold text-blue-700 font-serif">
                  {(waste.recall_macro * 100).toFixed(2)}%
                </strong>
                <p className="text-[10px] text-slate-400">Unweighted class mean</p>
              </div>

              <div className="bg-[#f7faf7] p-4 rounded-xl border border-emerald-100 space-y-1">
                <span className="text-xs text-slate-500 block uppercase font-mono">F1-Score (Macro)</span>
                <strong className="text-2xl font-bold text-indigo-700 font-serif">
                  {(waste.f1_score_macro * 100).toFixed(2)}%
                </strong>
                <p className="text-[10px] text-slate-400">Harmonic mean</p>
              </div>
            </div>

            {/* Per-Class Breakdown Table */}
            {waste.classification_report && (
              <div className="pt-2 space-y-2">
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-700 font-bold">
                  Per-Class Test Performance (Classification Report)
                </h4>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#f7faf7] text-slate-600 font-mono uppercase border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2.5">Class Name</th>
                        <th className="px-4 py-2.5">Precision</th>
                        <th className="px-4 py-2.5">Recall</th>
                        <th className="px-4 py-2.5">F1-Score</th>
                        <th className="px-4 py-2.5">Support (Test Samples)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {waste.classes.map((cls) => {
                        const rep = waste.classification_report[cls];
                        if (!rep) return null;
                        return (
                          <tr key={cls} className="hover:bg-slate-50">
                            <td className="px-4 py-2.5 font-bold capitalize text-slate-900">{cls}</td>
                            <td className="px-4 py-2.5 font-mono">{(rep.precision * 100).toFixed(1)}%</td>
                            <td className="px-4 py-2.5 font-mono">{(rep.recall * 100).toFixed(1)}%</td>
                            <td className="px-4 py-2.5 font-mono">{(rep['f1-score'] * 100).toFixed(1)}%</td>
                            <td className="px-4 py-2.5 font-mono text-slate-500">{rep.support}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: BIN FILL REGRESSOR */}
      {activeTab === 'regressor' && binReg && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-emerald-100 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-[#12372A] font-serif">{binReg.model_name}</h3>
                <p className="text-xs text-slate-500">{binReg.dataset} • {binReg.test_sample_count} hold-out test records</p>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Timestamp: {binReg.evaluation_timestamp}
              </span>
            </div>

            {/* Regression Horizons Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/40 space-y-3">
                <span className="text-xs font-mono uppercase font-bold text-emerald-800 block">
                  6-Hour Forecast Horizon
                </span>
                <div className="space-y-2 font-mono text-xs">
                  <div className="flex justify-between border-b border-emerald-100 pb-1">
                    <span className="text-slate-600">MAE:</span>
                    <strong className="text-slate-900 text-sm">{binReg.horizon_6h.mae}%</strong>
                  </div>
                  <div className="flex justify-between border-b border-emerald-100 pb-1">
                    <span className="text-slate-600">RMSE:</span>
                    <strong className="text-slate-900 text-sm">{binReg.horizon_6h.rmse}%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">R² Coefficient:</span>
                    <strong className="text-emerald-700 text-sm">{binReg.horizon_6h.r2}</strong>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-teal-200 bg-teal-50/40 space-y-3">
                <span className="text-xs font-mono uppercase font-bold text-teal-800 block">
                  12-Hour Forecast Horizon
                </span>
                <div className="space-y-2 font-mono text-xs">
                  <div className="flex justify-between border-b border-teal-100 pb-1">
                    <span className="text-slate-600">MAE:</span>
                    <strong className="text-slate-900 text-sm">{binReg.horizon_12h.mae}%</strong>
                  </div>
                  <div className="flex justify-between border-b border-teal-100 pb-1">
                    <span className="text-slate-600">RMSE:</span>
                    <strong className="text-slate-900 text-sm">{binReg.horizon_12h.rmse}%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">R² Coefficient:</span>
                    <strong className="text-teal-700 text-sm">{binReg.horizon_12h.r2}</strong>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 bg-[#f7faf7] space-y-3">
                <span className="text-xs font-mono uppercase font-bold text-slate-700 block">
                  Overall Aggregate Metrics
                </span>
                <div className="space-y-2 font-mono text-xs">
                  <div className="flex justify-between border-b border-slate-200 pb-1">
                    <span className="text-slate-600">Average MAE:</span>
                    <strong className="text-slate-900 text-sm">{binReg.overall.mae}%</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-1">
                    <span className="text-slate-600">Average RMSE:</span>
                    <strong className="text-slate-900 text-sm">{binReg.overall.rmse}%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Average R²:</span>
                    <strong className="text-blue-700 text-sm">{binReg.overall.r2}</strong>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* TAB 3: OVERFLOW RISK CLASSIFIER */}
      {activeTab === 'overflow' && overflow && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-emerald-100 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-[#12372A] font-serif">{overflow.model_name}</h3>
                <p className="text-xs text-slate-500">{overflow.dataset} • {overflow.test_sample_count} hold-out test records</p>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Timestamp: {overflow.evaluation_timestamp}
              </span>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#f7faf7] p-4 rounded-xl border border-emerald-100 space-y-1">
                <span className="text-xs text-slate-500 block uppercase font-mono">Accuracy</span>
                <strong className="text-2xl font-bold text-emerald-700 font-serif">
                  {(overflow.accuracy * 100).toFixed(2)}%
                </strong>
                <p className="text-[10px] text-slate-400">3 Risk Tiers</p>
              </div>

              <div className="bg-[#f7faf7] p-4 rounded-xl border border-emerald-100 space-y-1">
                <span className="text-xs text-slate-500 block uppercase font-mono">Precision (Macro)</span>
                <strong className="text-2xl font-bold text-teal-700 font-serif">
                  {(overflow.precision_macro * 100).toFixed(2)}%
                </strong>
                <p className="text-[10px] text-slate-400">Unweighted mean</p>
              </div>

              <div className="bg-[#f7faf7] p-4 rounded-xl border border-emerald-100 space-y-1">
                <span className="text-xs text-slate-500 block uppercase font-mono">Recall (Macro)</span>
                <strong className="text-2xl font-bold text-blue-700 font-serif">
                  {(overflow.recall_macro * 100).toFixed(2)}%
                </strong>
                <p className="text-[10px] text-slate-400">Unweighted mean</p>
              </div>

              <div className="bg-[#f7faf7] p-4 rounded-xl border border-emerald-100 space-y-1">
                <span className="text-xs text-slate-500 block uppercase font-mono">F1-Score (Macro)</span>
                <strong className="text-2xl font-bold text-indigo-700 font-serif">
                  {(overflow.f1_score_macro * 100).toFixed(2)}%
                </strong>
                <p className="text-[10px] text-slate-400">Harmonic mean</p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminModels;
