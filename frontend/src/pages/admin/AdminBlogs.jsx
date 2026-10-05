import React, { useState, useEffect } from 'react';
import { blogAPI, newsletterAPI } from '../../services/api';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  Mail, 
  Users, 
  Calendar,
  Sparkles,
  RefreshCw,
  X,
  ExternalLink,
  Send,
  Loader2
} from 'lucide-react';
import { WordToolbarEditor } from '../../components/WordToolbarEditor';
import { ImageUploadField } from '../../components/ImageUploadField';

export const AdminBlogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('blogs'); // 'blogs' or 'subscribers'
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    title_hi: '',
    summary: '',
    summary_hi: '',
    content: '',
    content_hi: '',
    category: 'Campaign',
    image_url: '',
    is_published: true,
  });

  // Bulk Broadcast Modal State
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [broadcastData, setBroadcastData] = useState({
    target_audience: 'ALL',
    template_type: 'custom',
    subject: '',
    heading: '',
    content: '',
    badge_text: 'PARYAVARAN OFFICIAL',
    cta_text: '',
    cta_url: ''
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [blogsRes, subsRes] = await Promise.all([
        blogAPI.getAllAdmin(),
        newsletterAPI.getSubscribers()
      ]);
      setBlogs(blogsRes.data);
      setSubscribers(subsRes.data);
    } catch (err) {
      console.error("Failed to load admin data:", err);
      setError("Failed to load activities and subscribers. Please verify authentication.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      title: '',
      title_hi: '',
      summary: '',
      summary_hi: '',
      content: '',
      content_hi: '',
      category: 'Campaign',
      image_url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80',
      is_published: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (blog) => {
    setEditingId(blog.id);
    setFormData({
      title: blog.title || '',
      title_hi: blog.title_hi || '',
      summary: blog.summary || '',
      summary_hi: blog.summary_hi || '',
      content: blog.content || '',
      content_hi: blog.content_hi || '',
      category: blog.category || 'Campaign',
      image_url: blog.image_url || '',
      is_published: blog.is_published,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      if (editingId) {
        await blogAPI.update(editingId, formData);
        setSuccess("Activity updated successfully!");
      } else {
        await blogAPI.create(formData);
        setSuccess("New activity published successfully to the Home page!");
      }
      setShowModal(false);
      await loadData();
    } catch (err) {
      console.error("Submit error:", err);
      setError(err.response?.data?.detail || "Failed to save activity.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this activity?")) return;
    setError(null);
    setSuccess(null);
    try {
      await blogAPI.delete(id);
      setSuccess("Activity deleted successfully.");
      await loadData();
    } catch (err) {
      setError("Failed to delete activity.");
    }
  };

  const applyTemplatePreset = (type) => {
    if (type === 'event_enrolled') {
      setBroadcastData(prev => ({
        ...prev,
        template_type: 'event_enrolled',
        badge_text: '✓ SUCCESSFULLY ENROLLED IN EVENT',
        subject: 'Confirmed: Your Registration for Green Civic Event',
        heading: 'You are Confirmed for the Upcoming Civic Action Drive!',
        content: 'Dear Participant,\n\nWe are pleased to confirm your official enrollment in our scheduled environmental drive. Our coordination team will provide all required segregation kits, gloves, and orientation material on-site.\n\n**Event Checklist:**\n- Arrive 15 minutes prior to scheduled start time.\n- Wear comfortable footwear and cotton clothing.\n- Review attached guidelines before attending.\n\nThank you for standing up for a cleaner, greener tomorrow!',
        cta_text: 'View Event & Guidelines',
        cta_url: window.location.origin + '/events'
      }));
    } else if (type === 'article_read') {
      setBroadcastData(prev => ({
        ...prev,
        template_type: 'article_read',
        badge_text: 'FEATURED ECO PUBLICATION',
        subject: 'New Feature: Practical Strategies for Sustainable Living',
        heading: 'Discover Our Latest Environmental Insights & Waste Reduction Field Guide',
        content: 'Hello Environmental Advocate,\n\nOur sustainability editorial desk has just published a comprehensive field report detailing circular waste segregation, telemetry-driven collection optimization, and community action impact.\n\nDive in to learn actionable insights you can incorporate in your neighborhood today.\n\n**Key Takeaways:**\n- Smart bin fill-rate predictive telemetry\n- Segregation at source protocols\n- Real-world community impact statistics',
        cta_text: 'Read Full Article',
        cta_url: window.location.origin + '/'
      }));
    } else {
      setBroadcastData(prev => ({
        ...prev,
        template_type: 'custom',
        badge_text: 'PARYAVARAN OFFICIAL',
        subject: '',
        heading: '',
        content: '',
        cta_text: '',
        cta_url: ''
      }));
    }
  };

  const handleDeleteSubscriber = async (id) => {
    if (!window.confirm("Are you sure you want to remove this subscriber from the mailing list?")) return;
    try {
      await newsletterAPI.deleteSubscriber(id);
      setSuccess("Subscriber removed successfully.");
      setSubscribers(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      setError("Failed to remove subscriber.");
    }
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    setBroadcastLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await newsletterAPI.broadcast(broadcastData);
      setSuccess(res.data.message || "Bulk broadcast email dispatched successfully!");
      setShowBroadcastModal(false);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to dispatch broadcast email.");
    } finally {
      setBroadcastLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block mb-1">
            Publishing & Citizen Engagement
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#12372A]">
            Featured Activities & Bulletins
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Publish campaigns, sustainability articles, and dispatch bulk email updates to citizens and collectors.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={loadData}
            className="p-2.5 rounded-full border border-slate-300 hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          <button
            type="button"
            onClick={() => {
              applyTemplatePreset('custom');
              setShowBroadcastModal(true);
            }}
            className="px-4 py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Mail className="w-4 h-4 text-emerald-200" />
            <span>Send Bulk Email</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-5 py-2.5 rounded-full bg-[#1b4332] hover:bg-[#143527] text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 text-emerald-300" />
            <span>Post New Activity</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('blogs')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'blogs'
              ? 'bg-[#1b4332] text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Activities & Articles ({blogs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('subscribers')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'subscribers'
              ? 'bg-[#1b4332] text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Newsletter Subscribers ({subscribers.length})</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* ─── TAB 1: ACTIVITIES TABLE ─── */}
      {activeTab === 'blogs' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              Loading featured activities...
            </div>
          ) : blogs.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No activities found. Click "Post New Activity" to publish your first initiative.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-5">Activity Title</th>
                    <th className="py-3 px-5">Hindi Title</th>
                    <th className="py-3 px-5">Category</th>
                    <th className="py-3 px-5">Status</th>
                    <th className="py-3 px-5">Date</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {blogs.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-5 font-semibold text-slate-800 max-w-xs truncate">
                        {b.title}
                      </td>
                      <td className="py-3.5 px-5 text-slate-600 max-w-xs truncate font-serif">
                        {b.title_hi || '—'}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          {b.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          b.is_published 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {b.is_published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-xs text-slate-400">
                        {new Date(b.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(b)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(b.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: NEWSLETTER SUBSCRIBERS TABLE ─── */}
      {activeTab === 'subscribers' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-emerald-50/60 border-b border-emerald-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <span className="text-xs font-bold text-[#12372A] font-serif">Community Mailing List ({subscribers.length} Subscribers)</span>
              <p className="text-[11px] text-slate-500">Recipients receiving weekly eco-bulletins and emergency environmental notifications.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                applyTemplatePreset('custom');
                setBroadcastData(prev => ({ ...prev, target_audience: 'NEWSLETTER' }));
                setShowBroadcastModal(true);
              }}
              className="px-4 py-1.5 rounded-full bg-[#1b4332] text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs hover:bg-[#143527]"
            >
              <Send className="w-3 h-3 text-emerald-300" />
              <span>Broadcast to Subscribers</span>
            </button>
          </div>

          {subscribers.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No newsletter subscribers recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-5">Subscriber Email</th>
                    <th className="py-3 px-5">Status</th>
                    <th className="py-3 px-5">Subscribed Date</th>
                    <th className="py-3 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {subscribers.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-5 font-mono text-slate-800 font-medium">
                        {s.email}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-slate-400 text-xs">
                        {new Date(s.subscribed_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteSubscriber(s.id)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                          title="Remove subscriber from mailing list"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── CREATE / EDIT MODAL ─── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold font-serif text-[#12372A] mb-4">
              {editingId ? "Edit Activity / Blog" : "Post New Activity / Blog"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Title (English)</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Community Tree Plantation & Smart Bin Drive"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Title (Hindi - Optional)</label>
                <input
                  type="text"
                  value={formData.title_hi}
                  onChange={(e) => setFormData({ ...formData, title_hi: e.target.value })}
                  placeholder="e.g. सामुदायिक वृक्षारोपण एवं स्मार्ट बिन अभियान"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-serif focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-emerald-600 bg-white"
                >
                  <option value="Deployment">Deployment</option>
                  <option value="Awareness">Awareness</option>
                  <option value="Campaign">Campaign</option>
                  <option value="Innovation">Innovation</option>
                  <option value="Plantation">Plantation</option>
                </select>
              </div>

              <ImageUploadField
                value={formData.image_url}
                onChange={(url) => setFormData({ ...formData, image_url: url })}
                label="Article / Activity Cover Image"
              />

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Short Summary</label>
                <textarea
                  rows={2}
                  required
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="Brief 1-2 sentence overview of the initiative..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-emerald-600"
                />
              </div>

              <WordToolbarEditor
                value={formData.content}
                onChange={(content) => setFormData({ ...formData, content })}
                label="Full Story & Guidelines"
                placeholder="Write comprehensive story, bold headers, list items, attach documents & guidelines PDF..."
                required={true}
                minHeight="260px"
              />

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pub"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                  className="rounded border-slate-300 text-emerald-600"
                />
                <label htmlFor="pub" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Publish to Home page immediately
                </label>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-full border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-[#1b4332] hover:bg-[#143527] text-white text-xs font-semibold shadow-sm"
                >
                  {editingId ? "Update Activity" : "Publish Activity"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── BULK BROADCAST EMAIL MODAL ─── */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative space-y-5">
            <button
              onClick={() => setShowBroadcastModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest block mb-1">
                Executive Dispatch Console
              </span>
              <h3 className="text-xl font-bold font-serif text-[#12372A]">
                Dispatch Bulk Broadcast Email
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Reach citizens, waste collectors, donors, or newsletter subscribers with stylized HTML updates.
              </p>
            </div>

            {/* Template Presets Bar */}
            <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-100 space-y-2">
              <span className="text-[11px] font-bold text-[#12372A] block uppercase tracking-wider">
                Select Pre-Built Styled Template:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => applyTemplatePreset('custom')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left ${
                    broadcastData.template_type === 'custom'
                      ? 'bg-[#12372A] text-white border-[#12372A] shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  <div>📢 Custom Notice</div>
                  <div className={`text-[10px] font-normal ${broadcastData.template_type === 'custom' ? 'text-emerald-200' : 'text-slate-400'}`}>
                    General community alert
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => applyTemplatePreset('event_enrolled')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left ${
                    broadcastData.template_type === 'event_enrolled'
                      ? 'bg-[#12372A] text-white border-[#12372A] shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  <div>✓ Event Enrollment</div>
                  <div className={`text-[10px] font-normal ${broadcastData.template_type === 'event_enrolled' ? 'text-emerald-200' : 'text-slate-400'}`}>
                    Confirmed registration badge
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => applyTemplatePreset('article_read')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left ${
                    broadcastData.template_type === 'article_read'
                      ? 'bg-[#12372A] text-white border-[#12372A] shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  <div>📖 Article Announcement</div>
                  <div className={`text-[10px] font-normal ${broadcastData.template_type === 'article_read' ? 'text-emerald-200' : 'text-slate-400'}`}>
                    Read Article action button
                  </div>
                </button>
              </div>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Target Audience</label>
                  <select
                    value={broadcastData.target_audience}
                    onChange={(e) => setBroadcastData({ ...broadcastData, target_audience: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-emerald-600 bg-white"
                  >
                    <option value="ALL">All Platform Users & Subscribers</option>
                    <option value="CITIZEN">Registered Citizens Only</option>
                    <option value="COLLECTOR">Assigned Waste Collectors</option>
                    <option value="NEWSLETTER">Newsletter Subscribers</option>
                    <option value="DONOR">Verified Donors & Contributors</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Header Badge Text</label>
                  <input
                    type="text"
                    value={broadcastData.badge_text}
                    onChange={(e) => setBroadcastData({ ...broadcastData, badge_text: e.target.value })}
                    placeholder="e.g. OFFICIAL ANNOUNCEMENT"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Email Subject Line</label>
                <input
                  type="text"
                  required
                  value={broadcastData.subject}
                  onChange={(e) => setBroadcastData({ ...broadcastData, subject: e.target.value })}
                  placeholder="e.g. Important Update from ParyavaranSanrakshan"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Email Main Headline</label>
                <input
                  type="text"
                  required
                  value={broadcastData.heading}
                  onChange={(e) => setBroadcastData({ ...broadcastData, heading: e.target.value })}
                  placeholder="e.g. New Environmental Policy & Scheduled Civic Drives"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-emerald-600 font-serif"
                />
              </div>

              <WordToolbarEditor
                value={broadcastData.content}
                onChange={(content) => setBroadcastData({ ...broadcastData, content })}
                label="Email Message Content"
                placeholder="Compose announcement, bold key dates, list instructions, attach guideline PDFs..."
                required={true}
                minHeight="200px"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Action Button Label (Optional)</label>
                  <input
                    type="text"
                    value={broadcastData.cta_text}
                    onChange={(e) => setBroadcastData({ ...broadcastData, cta_text: e.target.value })}
                    placeholder="e.g. View Event & Guidelines or Read Article"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Action Button URL (Optional)</label>
                  <input
                    type="url"
                    value={broadcastData.cta_url}
                    onChange={(e) => setBroadcastData({ ...broadcastData, cta_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-4 py-2 rounded-full border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={broadcastLoading}
                  className="px-6 py-2 rounded-full bg-[#1b4332] hover:bg-[#143527] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  {broadcastLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-300" />
                      <span>Dispatching Broadcast...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-emerald-300" />
                      <span>Send Broadcast Email</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

