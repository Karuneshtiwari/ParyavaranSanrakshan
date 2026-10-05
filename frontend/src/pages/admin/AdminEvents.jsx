import React, { useState, useEffect } from 'react';
import { eventAPI } from '../../services/api';
import { 
  Calendar, 
  Plus, 
  MapPin, 
  Users, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  X, 
  Sparkles,
  Eye,
  AlertCircle
} from 'lucide-react';
import { WordToolbarEditor } from '../../components/WordToolbarEditor';
import { ImageUploadField } from '../../components/ImageUploadField';

export const AdminEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [participantsModalEvent, setParticipantsModalEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [formMsg, setFormMsg] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    title_hi: '',
    category: 'Cleanliness Drive',
    status: 'upcoming',
    event_date: '',
    location: '',
    image_url: '',
    max_participants: 120,
    description: '',
    description_hi: ''
  });

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await eventAPI.getAll({ status: 'all' });
      setEvents(res.data || []);
    } catch (err) {
      console.error("Failed to load events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const openNewModal = () => {
    setEditingEvent(null);
    setFormData({
      title: '',
      title_hi: '',
      category: 'Cleanliness Drive',
      status: 'upcoming',
      event_date: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16),
      location: 'Bengaluru Metropolitan Hub',
      image_url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80',
      max_participants: 150,
      description: '',
      description_hi: ''
    });
    setFormMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (ev) => {
    setEditingEvent(ev);
    setFormData({
      title: ev.title,
      title_hi: ev.title_hi || '',
      category: ev.category,
      status: ev.status,
      event_date: new Date(ev.event_date).toISOString().slice(0, 16),
      location: ev.location,
      image_url: ev.image_url || '',
      max_participants: ev.max_participants,
      description: ev.description,
      description_hi: ev.description_hi || ''
    });
    setFormMsg(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormMsg(null);
    try {
      const payload = {
        ...formData,
        event_date: new Date(formData.event_date).toISOString(),
      };

      if (editingEvent) {
        await eventAPI.update(editingEvent.id, payload);
      } else {
        await eventAPI.create(payload);
      }
      setIsModalOpen(false);
      fetchEvents();
    } catch (err) {
      setFormMsg(err.response?.data?.detail || "Failed to save event.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await eventAPI.delete(id);
      fetchEvents();
    } catch (err) {
      alert("Failed to delete event.");
    }
  };

  const viewParticipants = async (ev) => {
    setParticipantsModalEvent(ev);
    setLoadingParticipants(true);
    try {
      const res = await eventAPI.getParticipants(ev.id);
      setParticipants(res.data || []);
    } catch (err) {
      console.error("Failed to load participants:", err);
    } finally {
      setLoadingParticipants(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">
            <span>Civic Outreach Operations</span>
            <span>•</span>
            <span className="text-slate-400">Bengaluru Metropolitan</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#12372A]">
            Events & Community Drives
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Schedule citizen mobilization drives, manage registration limits, and view attendee lists.
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="px-5 py-2.5 rounded-full font-semibold text-xs bg-[#1b4332] hover:bg-[#143527] text-white shadow-sm flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4 text-emerald-300" />
          <span>Schedule New Event</span>
        </button>
      </div>

      {/* Events Table / Cards */}
      {loading ? (
        <div className="p-16 text-center text-slate-400">Loading events...</div>
      ) : events.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-500">
          No events scheduled yet. Click "Schedule New Event" to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((ev) => (
            <div key={ev.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between">
              <div>
                <div className="h-40 relative bg-slate-100 overflow-hidden">
                  <img src={ev.image_url} alt={ev.title} className="w-full h-full object-cover" />
                  <span className={`absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase shadow-2xs ${
                    ev.status === 'ongoing' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                    ev.status === 'completed' ? 'bg-slate-200 text-slate-700' :
                    'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  }`}>
                    {ev.status}
                  </span>
                  <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-white/95 text-[10px] font-bold text-emerald-900 shadow-2xs">
                    {ev.category}
                  </span>
                </div>

                <div className="p-5 space-y-2">
                  <h3 className="font-bold font-serif text-[#12372A] text-base line-clamp-1">{ev.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{ev.description}</p>
                  
                  <div className="pt-2 text-xs text-slate-600 space-y-1.5 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{new Date(ev.event_date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                      <span className="truncate">{ev.location}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-5 pt-0 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  onClick={() => viewParticipants(ev)}
                  className="font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{ev.registration_count} Attendees</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(ev)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
                    title="Edit Event"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(ev.id)}
                    className="p-1.5 rounded-lg border border-rose-100 hover:bg-rose-50 text-rose-600"
                    title="Delete Event"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* MODAL: CREATE / EDIT EVENT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold font-serif text-[#12372A] mb-4">
              {editingEvent ? 'Edit Scheduled Event' : 'Schedule New Civic Event'}
            </h2>

            {formMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                {formMsg}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Title (English)</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Indiranagar Community Waste Audit"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Title (Hindi - Optional)</label>
                <input
                  type="text"
                  value={formData.title_hi}
                  onChange={(e) => setFormData({ ...formData, title_hi: e.target.value })}
                  placeholder="e.g. इंदिरानगर सामुदायिक अपशिष्ट ऑडिट"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-emerald-600 bg-white"
                  >
                    <option value="Cleanliness Drive">Cleanliness Drive</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Audit & Plantation">Audit & Plantation</option>
                    <option value="Recycling Drive">Recycling Drive</option>
                    <option value="Awareness Walk">Awareness Walk</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-emerald-600 bg-white"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Max Capacity</label>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    value={formData.max_participants}
                    onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) || 100 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Location (Bengaluru)</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Koramangala 5th Block Hub"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <ImageUploadField
                value={formData.image_url}
                onChange={(url) => setFormData({ ...formData, image_url: url })}
                label="Event Cover Image"
              />

              <WordToolbarEditor
                value={formData.description}
                onChange={(content) => setFormData({ ...formData, description: content })}
                label="Event Description & Guidelines"
                placeholder="Write comprehensive drive details, schedule, segregation guidelines, attach documents..."
                required={true}
                minHeight="220px"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#1b4332] text-white hover:bg-[#143527] font-semibold"
                >
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW REGISTERED PARTICIPANTS */}
      {participantsModalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setParticipantsModalEvent(null)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-bold font-serif text-[#12372A]">
                Registered Attendees
              </h3>
              <p className="text-xs text-slate-500">{participantsModalEvent.title}</p>
            </div>

            {loadingParticipants ? (
              <div className="p-8 text-center text-slate-400 text-xs">Loading attendee records...</div>
            ) : participants.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs bg-slate-50 rounded-2xl">
                No citizens have registered for this event yet.
              </div>
            ) : (
              <div className="space-y-2">
                {participants.map((p, idx) => (
                  <div key={p.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-800">{p.user_name}</p>
                      <p className="text-slate-400 font-mono text-[11px]">{p.user_email}</p>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {new Date(p.registered_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setParticipantsModalEvent(null)}
                className="px-4 py-2 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminEvents;
