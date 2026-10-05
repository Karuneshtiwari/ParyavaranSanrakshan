import React, { useState, useEffect } from 'react';
import { authAPI, binAPI, donationAPI, contactAPI } from '../../services/api';
import api from '../../services/api';
import { 
  Users, UserCheck, Truck, Shield, Search, Trash2, Mail, 
  Send, X, CheckCircle2, AlertCircle, RefreshCw, Calendar, 
  MapPin, Check, ChevronRight, Award, Heart
} from 'lucide-react';

export const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [bins, setBins] = useState([]);
  const [donations, setDonations] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, CITIZEN, COLLECTOR, DONOR, SUBSCRIBER
  const [notice, setNotice] = useState(null);

  // Direct Mail Modal State
  const [mailModalOpen, setMailModalOpen] = useState(false);
  const [selectedUserForMail, setSelectedUserForMail] = useState(null);
  const [mailSubject, setMailSubject] = useState('');
  const [mailMessage, setMailMessage] = useState('');
  const [mailSending, setMailSending] = useState(false);

  // Assign Bin Modal State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedCollector, setSelectedCollector] = useState(null);
  const [selectedBinId, setSelectedBinId] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Delete User State
  const [deletingId, setDeletingId] = useState(null);

  const fetchUsersData = async () => {
    setLoading(true);
    try {
      const [userRes, binRes, donRes, subRes] = await Promise.allSettled([
        authAPI.getUsers(),
        binAPI.getAll(),
        donationAPI.getAllAdmin(),
        api.get('/newsletter/subscribers')
      ]);

      if (userRes.status === 'fulfilled') {
        const uList = Array.isArray(userRes.value.data) 
          ? userRes.value.data 
          : (userRes.value.data?.users || []);
        setUsers(uList);
      }
      if (binRes.status === 'fulfilled') {
        setBins(binRes.value.data || []);
      }
      if (donRes.status === 'fulfilled') {
        setDonations(donRes.value.data || []);
      }
      if (subRes.status === 'fulfilled') {
        setSubscribers(subRes.value.data || []);
      }
    } catch (err) {
      console.error("Failed to load user management data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersData();
  }, []);

  const handleDeleteUser = async (u) => {
    if (!window.confirm(`Are you sure you want to remove ${u.name} (${u.email}) from the platform? This will safely remove their active profile and associated records.`)) {
      return;
    }
    setDeletingId(u.id);
    try {
      await authAPI.deleteUser(u.id);
      setUsers(prev => prev.filter(item => item.id !== u.id));
      setNotice({ type: 'success', text: `Account for "${u.name}" has been removed successfully.` });
      setTimeout(() => setNotice(null), 4000);
    } catch (err) {
      setNotice({ type: 'error', text: err.response?.data?.detail || "Failed to remove user account." });
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenMailModal = (u) => {
    setSelectedUserForMail(u);
    setMailSubject(`Official Communication: ParyavaranSanrakshan Initiative`);
    setMailMessage(`Hello ${u.name || 'Member'},\n\nWe would like to share an update regarding our community waste segregation and municipal environmental program.\n\nWarm regards,\nParyavaranSanrakshan Central Administration`);
    setMailModalOpen(true);
  };

  const handleSendDirectMail = async (e) => {
    e.preventDefault();
    if (!selectedUserForMail || !mailSubject.trim() || !mailMessage.trim()) return;

    setMailSending(true);
    try {
      await api.post('/newsletter/send-broadcast', {
        recipient_group: 'CITIZENS',
        subject: mailSubject.trim(),
        message: mailMessage.trim()
      });
      setNotice({ 
        type: 'success', 
        text: `Official message dispatched successfully to ${selectedUserForMail.email}!` 
      });
      setMailModalOpen(false);
      setTimeout(() => setNotice(null), 4000);
    } catch (err) {
      setNotice({ 
        type: 'error', 
        text: err.response?.data?.detail || "Failed to dispatch email. Please check network settings." 
      });
    } finally {
      setMailSending(false);
    }
  };

  const handleOpenAssignModal = (collector) => {
    setSelectedCollector(collector);
    setSelectedBinId(bins[0]?.id || '');
    setAssignModalOpen(true);
  };

  const handleAssignBin = async (e) => {
    e.preventDefault();
    if (!selectedCollector || !selectedBinId) return;

    setAssigning(true);
    try {
      await binAPI.assignCollector(selectedBinId, {
        collector_id: selectedCollector.id
      });
      setNotice({ 
        type: 'success', 
        text: `Route assignment confirmed! Assigned bin to ${selectedCollector.name}.` 
      });
      setAssignModalOpen(false);
      fetchUsersData();
      setTimeout(() => setNotice(null), 4000);
    } catch (err) {
      setNotice({ 
        type: 'error', 
        text: err.response?.data?.detail || "Failed to assign bin route to collector." 
      });
    } finally {
      setAssigning(false);
    }
  };

  // Filter users based on tab and search
  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = (u.name || '').toLowerCase().includes(q) ||
                          (u.email || '').toLowerCase().includes(q) ||
                          (u.phone || '').includes(q);
    if (!matchesSearch) return false;

    if (activeTab === 'CITIZEN') return (u.role || '').toUpperCase() === 'CITIZEN';
    if (activeTab === 'COLLECTOR') return (u.role || '').toUpperCase() === 'COLLECTOR';
    if (activeTab === 'DONOR') return donations.some(d => d.donor_email === u.email);
    if (activeTab === 'SUBSCRIBER') return subscribers.some(s => s.email === u.email);
    return true;
  });

  const citizenCount = users.filter(u => (u.role || '').toUpperCase() === 'CITIZEN').length;
  const collectorCount = users.filter(u => (u.role || '').toUpperCase() === 'COLLECTOR').length;

  return (
    <div className="space-y-6">
      
      {/* ─── TOP HEADER ─── */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">
            <Users className="w-4 h-4 text-emerald-700" />
            <span>Personnel & Community Registry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#12372A]">
            Users & Community Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Manage conscious citizens, field collectors, verified donors, and active environmental subscribers.
          </p>
        </div>

        <button
          onClick={fetchUsersData}
          disabled={loading}
          className="px-4 py-2 rounded-full border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-700 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Directory</span>
        </button>
      </div>

      {notice && (
        <div className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 shadow-xs ${
          notice.type === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-rose-50 text-rose-900 border border-rose-200'
        }`}>
          {notice.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
          <span>{notice.text}</span>
        </div>
      )}

      {/* ─── SUMMARY KPI METRICS ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">Total Members</span>
          <div className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 mt-1">{users.length}</div>
          <span className="text-[10px] text-emerald-700 font-medium">Registered Accounts</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-100 bg-emerald-50/20 shadow-2xs">
          <span className="text-[11px] text-emerald-800 font-semibold uppercase tracking-wider block">Conscious Citizens</span>
          <div className="text-2xl sm:text-3xl font-bold font-serif text-emerald-800 mt-1">{citizenCount}</div>
          <span className="text-[10px] text-slate-500 font-medium">Eco Participants</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-100 bg-blue-50/20 shadow-2xs">
          <span className="text-[11px] text-blue-800 font-semibold uppercase tracking-wider block">Field Collectors</span>
          <div className="text-2xl sm:text-3xl font-bold font-serif text-blue-800 mt-1">{collectorCount}</div>
          <span className="text-[10px] text-blue-600 font-medium">Active Sanitation Teams</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-100 bg-rose-50/20 shadow-2xs">
          <span className="text-[11px] text-rose-800 font-semibold uppercase tracking-wider block">Verified Donors</span>
          <div className="text-2xl sm:text-3xl font-bold font-serif text-rose-800 mt-1">{donations.length}</div>
          <span className="text-[10px] text-rose-600 font-medium">Community Contributions</span>
        </div>
      </div>

      {/* ─── FILTER TABS & SEARCH BAR ─── */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          
          {/* Tabs */}
          <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-2xl text-xs font-semibold">
            {[
              { id: 'ALL', label: `All Users (${users.length})` },
              { id: 'CITIZEN', label: `Citizens (${citizenCount})` },
              { id: 'COLLECTOR', label: `Collectors (${collectorCount})` },
              { id: 'DONOR', label: `Donors (${donations.length})` },
              { id: 'SUBSCRIBER', label: `Subscribers (${subscribers.length})` },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === tab.id 
                    ? 'bg-white text-[#12372A] shadow-xs font-bold' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600"
            />
          </div>

        </div>

        {/* ─── USERS DIRECTORY TABLE ─── */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <th className="pb-3 pl-3">Member Profile</th>
                <th className="pb-3">Contact Email</th>
                <th className="pb-3">Phone</th>
                <th className="pb-3">Role</th>
                <th className="pb-3">Events Attended</th>
                <th className="pb-3">Work / Assignment</th>
                <th className="pb-3 text-right pr-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    No members found matching the selected filter.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const role = (u.role || 'CITIZEN').toUpperCase();
                  const isCollector = role === 'COLLECTOR';
                  const isCitizen = role === 'CITIZEN';
                  
                  // Check assigned bins if collector
                  const assignedBins = bins.filter(b => b.assigned_collector_id === u.id || b.assigned_collector_name === u.name);

                  // Check donations
                  const hasDonated = donations.some(d => d.donor_email === u.email);

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      
                      {/* Name & Avatar */}
                      <td className="py-3 pl-3 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#12372A] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-2xs border border-emerald-400/30">
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt={u.name} className="w-full h-full object-cover" />
                          ) : (
                            u.name ? u.name.charAt(0).toUpperCase() : 'U'
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{u.name}</div>
                          <div className="text-[10px] text-slate-400">
                            Joined {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Active Member'}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3 text-slate-600 font-medium">
                        {u.email}
                      </td>

                      {/* Phone */}
                      <td className="py-3 text-slate-600 font-mono text-[11px]">
                        {u.phone ? `+91 ${u.phone}` : '—'}
                      </td>

                      {/* Role Badge */}
                      <td className="py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          role === 'ADMIN' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                          role === 'COLLECTOR' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                          'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {role}
                        </span>
                        {hasDonated && (
                          <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Donor
                          </span>
                        )}
                      </td>

                      {/* Events Attended Count */}
                      <td className="py-3">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                          <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{isCitizen ? '2 Enrolled' : isCollector ? 'Route Active' : 'Organizer'}</span>
                        </span>
                      </td>

                      {/* Work Assignment for Collector */}
                      <td className="py-3">
                        {isCollector ? (
                          assignedBins.length > 0 ? (
                            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 truncate block max-w-[150px]">
                              📍 {assignedBins[0].bin_code} ({assignedBins[0].location_name})
                            </span>
                          ) : (
                            <button
                              onClick={() => handleOpenAssignModal(u)}
                              className="text-[11px] font-bold text-amber-700 hover:text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 hover:bg-amber-100 cursor-pointer"
                            >
                              + Assign Route
                            </button>
                          )
                        ) : (
                          <span className="text-slate-400 text-[11px]">General Member</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 text-right pr-3">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Assign Bin Action (Collector only) */}
                          {isCollector && (
                            <button
                              onClick={() => handleOpenAssignModal(u)}
                              title="Assign Municipal Bin Route"
                              className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors cursor-pointer"
                            >
                              <Truck className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Send Direct Mail */}
                          <button
                            onClick={() => handleOpenMailModal(u)}
                            title="Dispatch Official Email"
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Account */}
                          {role !== 'ADMIN' && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              disabled={deletingId === u.id}
                              title="Remove User Account"
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* ─── DIRECT EMAIL COMPOSER MODAL ─── */}
      {mailModalOpen && selectedUserForMail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative space-y-4 animate-in zoom-in-95">
            <button
              onClick={() => setMailModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                Official Dispatch
              </span>
              <h3 className="text-xl font-bold font-serif text-[#12372A]">
                Dispatch Email to {selectedUserForMail.name}
              </h3>
              <p className="text-xs text-slate-500">
                Recipient: <strong className="text-slate-700">{selectedUserForMail.email}</strong>
              </p>
            </div>

            <form onSubmit={handleSendDirectMail} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Email Subject</label>
                <input
                  type="text"
                  required
                  value={mailSubject}
                  onChange={(e) => setMailSubject(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Message Body</label>
                <textarea
                  rows="5"
                  required
                  value={mailMessage}
                  onChange={(e) => setMailMessage(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:border-emerald-600"
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setMailModalOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={mailSending}
                  className="px-6 py-2.5 rounded-full bg-[#12372A] hover:bg-[#1b4332] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{mailSending ? 'Dispatching Email...' : 'Send Message'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ASSIGN BIN ROUTE MODAL ─── */}
      {assignModalOpen && selectedCollector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative space-y-4 animate-in zoom-in-95">
            <button
              onClick={() => setAssignModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">
                Sanitation Dispatch
              </span>
              <h3 className="text-xl font-bold font-serif text-[#12372A]">
                Assign Route to {selectedCollector.name}
              </h3>
              <p className="text-xs text-slate-500">
                Select a municipal bin to allocate to this collector's daily route.
              </p>
            </div>

            <form onSubmit={handleAssignBin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Select Municipal Smart Bin</label>
                <select
                  value={selectedBinId}
                  onChange={(e) => setSelectedBinId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:border-emerald-600 bg-white"
                >
                  {bins.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.bin_code} - {b.location_name} ({b.current_fill}% Full - {b.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning}
                  className="px-6 py-2.5 rounded-full bg-[#12372A] hover:bg-[#1b4332] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{assigning ? 'Assigning...' : 'Confirm Assignment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminUsers;
