import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { eventAPI } from '../services/api';
import { 
  Calendar, 
  MapPin, 
  Users, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Sparkles,
  Tag,
  AlertCircle,
  MailCheck,
  X,
  User,
  Mail,
  Phone
} from 'lucide-react';

const FALLBACK_EVENTS = [
  {
    id: 1,
    title: "Indiranagar Green Walk & Native Sapling Plantation",
    title_hi: "इंदिरानगर ग्रीन वॉक एवं स्वदेशी पौधा रोपण",
    description: "Join 150+ conscious citizens in planting 300 native peepal and neem saplings along 100ft Road corridor to expand Bengaluru's green canopy.",
    description_hi: "100 फीट रोड कॉरिडोर के साथ 300 स्वदेशी पीपल और नीम के पौधे लगाने के लिए 150+ जागरूक नागरिकों के साथ जुड़ें।",
    category: "Plantation Drive",
    status: "upcoming",
    location: "100 Feet Road, Indiranagar, Bengaluru",
    event_date: new Date(Date.now() + 86400000 * 3).toISOString(),
    image_url: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=700&q=80",
    registration_count: 85,
    max_participants: 150,
    is_registered: false
  },
  {
    id: 2,
    title: "Community Waste Segregation Workshop for RWAs",
    title_hi: "आवासीय कल्याण संघों (RWA) के लिए कचरा पृथक्करण कार्यशाला",
    description: "Hands-on training session on 3-way municipal waste segregation (wet organic, dry recyclables, domestic hazardous) and home composting.",
    description_hi: "3-मार्गी नगरपालिका कचरा पृथक्करण और घरेलू खाद बनाने पर व्यावहारिक प्रशिक्षण सत्र।",
    category: "Workshop",
    status: "upcoming",
    location: "Koramangala Club Community Hall, 5th Block, Bengaluru",
    event_date: new Date(Date.now() + 86400000 * 6).toISOString(),
    image_url: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=700&q=80",
    registration_count: 62,
    max_participants: 100,
    is_registered: false
  },
  {
    id: 3,
    title: "Ulsoor Lake Perimeter Cleanliness & Waste Auditing Drive",
    title_hi: "उल्सूर झील स्वच्छता एवं अपशिष्ट ऑडिट अभियान",
    description: "Citizen lake cleanup drive collecting floating single-use plastics and cataloging waste categories for BBMP municipal review.",
    description_hi: "नागरिक झील स्वच्छता अभियान जिसमें एकल-उपयोग प्लास्टिक एकत्र किया जाएगा और नगर निगम समीक्षा के लिए अपशिष्ट श्रेणियों को सूचीबद्ध किया जाएगा।",
    category: "Lake Cleanup",
    status: "ongoing",
    location: "Ulsoor Lake Main Promenade, Halasuru, Bengaluru",
    event_date: new Date(Date.now() - 3600000 * 2).toISOString(),
    image_url: "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=700&q=80",
    registration_count: 120,
    max_participants: 120,
    is_registered: false
  },
  {
    id: 4,
    title: "Smart Bin Telemetry & IoT Sensor Demonstration Workshop",
    title_hi: "स्मार्ट बिन टेलीमेट्री एवं आईओटी सेंसर कार्यशाला",
    description: "Live demonstration of ultrasonic bin fill prediction algorithms and dynamic municipal collection route optimization.",
    description_hi: "अल्ट्रासोनिक बिन फिल प्रेडिक्शन एल्गोरिदम और गतिशील नगरपालिका संग्रह मार्ग अनुकूलन का लाइव प्रदर्शन।",
    category: "Tech Demo",
    status: "upcoming",
    location: "Amrita Vishwa Vidyapeetham Tech Hub, Bengaluru Campus",
    event_date: new Date(Date.now() + 86400000 * 10).toISOString(),
    image_url: "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=700&q=80",
    registration_count: 45,
    max_participants: 80,
    is_registered: false
  },
  {
    id: 5,
    title: "Cubbon Park Plastic Cleanup & Segregation Drive",
    title_hi: "कब्बन पार्क प्लास्टिक सफाई एवं पृथक्करण अभियान",
    description: "Annual green lung cleanup drive where 200+ volunteers successfully collected and diverted 450kg of plastic waste to certified recyclers.",
    description_hi: "वार्षिक हरित पार्क स्वच्छता अभियान जिसमें 200+ स्वयंसेवकों ने 450 किलोग्राम प्लास्टिक कचरा एकत्र कर प्रमाणित रीसाइक्लर्स को भेजा।",
    category: "Park Drive",
    status: "completed",
    location: "Cubbon Park Bandstand, Central Bengaluru",
    event_date: new Date(Date.now() - 86400000 * 14).toISOString(),
    image_url: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=700&q=80",
    registration_count: 210,
    max_participants: 200,
    is_registered: false
  }
];

export const EventsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const { lang, t } = useLanguage();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('all'); // 'all', 'upcoming', 'ongoing', 'completed'
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registeringId, setRegisteringId] = useState(null);
  const [notification, setNotification] = useState(null);

  // Registration modal state
  const [selectedEventForModal, setSelectedEventForModal] = useState(null);
  const [regPhone, setRegPhone] = useState('');
  const [regAttendees, setRegAttendees] = useState(1);
  const [regNotes, setRegNotes] = useState('');

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await eventAPI.getAll(activeTab === 'all' ? {} : { status: activeTab });
      if (res.data && res.data.length > 0) {
        setEvents(res.data);
      } else {
        const filtered = activeTab === 'all' 
          ? FALLBACK_EVENTS 
          : FALLBACK_EVENTS.filter(e => e.status === activeTab);
        setEvents(filtered);
      }
    } catch (err) {
      console.error("Failed to load events from backend, using fallbacks:", err);
      const filtered = activeTab === 'all' 
        ? FALLBACK_EVENTS 
        : FALLBACK_EVENTS.filter(e => e.status === activeTab);
      setEvents(filtered);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [activeTab]);

  const handleOpenRegisterModal = (ev) => {
    if (!isAuthenticated) {
      navigate('/login', { 
        state: { 
          fromEvent: true, 
          msg: lang === 'hi'
            ? "कार्यक्रम में पंजीकरण करने के लिए कृपया पहले लॉगिन या खाता बनाएं।"
            : "Please sign in or create an account to register for this event."
        } 
      });
      return;
    }

    if (ev.is_registered) {
      setNotification({
        type: 'error',
        message: lang === 'hi'
          ? "आप इस कार्यक्रम के लिए पहले ही पंजीकृत हो चुके हैं।"
          : "You are already registered for this event."
      });
      return;
    }

    setSelectedEventForModal(ev);
  };

  const handleConfirmRegister = async (e) => {
    e.preventDefault();
    if (!selectedEventForModal) return;

    const rawDigits = regPhone.replace(/\D/g, '');
    let clean10 = rawDigits;
    if (clean10.startsWith('91') && clean10.length === 12) {
      clean10 = clean10.slice(2);
    }
    if (!/^[6-9]\d{9}$/.test(clean10)) {
      setNotification({
        type: 'error',
        message: lang === 'hi'
          ? "कृपया मान्य 10 अंकों का भारतीय मोबाइल नंबर दर्ज करें (उदा. 9876543210)।"
          : "Please enter a valid 10-digit Indian mobile number (e.g. 9876543210)."
      });
      return;
    }

    const eventId = selectedEventForModal.id;
    const eventTitle = selectedEventForModal.title;

    setRegisteringId(eventId);
    setNotification(null);
    try {
      await eventAPI.register(eventId, {
        phone: clean10,
        attendees: regAttendees,
        notes: regNotes.trim()
      });
      setNotification({
        type: 'success',
        message: lang === 'hi'
          ? `बधाई हो! आप '${eventTitle}' के लिए सफलतापूर्वक पंजीकृत हो गए हैं। पुष्टि ईमेल भेज दिया गया है!`
          : `Success! You are registered for '${eventTitle}'. A confirmation pass has been dispatched to ${user.email}!`
      });
      setSelectedEventForModal(null);
      setRegPhone('');
      setRegAttendees(1);
      setRegNotes('');
      fetchEvents();
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.detail || "Registration could not be completed. Please try again."
      });
    } finally {
      setRegisteringId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Top Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[#1b4332] text-xs font-semibold uppercase tracking-wider">
          <Calendar className="w-3.5 h-3.5" />
          <span>{lang === 'hi' ? 'नागरिक जागरूकता एवं सहभागिता' : 'Citizen Eco-Initiatives'}</span>
        </div>
        
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serif text-[#12372A]">
          {lang === 'hi' ? 'पर्यावरण संरक्षण कार्यक्रम' : 'Community Drives & Events'}
        </h1>
        
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          {lang === 'hi'
            ? "बेंगलुरु महानगर क्षेत्र में आयोजित स्वच्छता अभियानों, कचरा पृथक्करण कार्यशालाओं एवं नागरिक पर्यावरण गतिविधियों से जुड़ें।"
            : "Participate in hands-on waste segregation drives, cleanups, and smart bin tech workshops across Bengaluru Metropolitan."}
        </p>
      </div>

      {/* Global Alert Notification */}
      {notification && (
        <div className={`p-4 rounded-2xl text-xs sm:text-sm flex items-start gap-3 shadow-xs max-w-2xl mx-auto ${
          notification.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' 
            : 'bg-rose-50 text-rose-900 border border-rose-200'
        }`}>
          {notification.type === 'success' ? (
            <MailCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Tab Filter Bar */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-full bg-slate-100 p-1.5 border border-slate-200 shadow-2xs">
          {[
            { id: 'all', label: lang === 'hi' ? 'सभी (All)' : 'All Events' },
            { id: 'upcoming', label: lang === 'hi' ? 'आगामी (Upcoming)' : 'Upcoming' },
            { id: 'ongoing', label: lang === 'hi' ? 'वर्तमान (Ongoing)' : 'Ongoing' },
            { id: 'completed', label: lang === 'hi' ? 'संपन्न (Completed)' : 'Completed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-[#1b4332] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="p-16 text-center text-slate-400">Loading events...</div>
      ) : events.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 max-w-xl mx-auto space-y-2">
          <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-base font-semibold text-slate-700">
            {lang === 'hi' ? 'कोई कार्यक्रम नहीं मिला।' : 'No events found in this category.'}
          </p>
          <p className="text-xs text-slate-400">
            {lang === 'hi' 
              ? 'कृपया अन्य श्रेणियों की जांच करें या नए आयोजनों की प्रतीक्षा करें।' 
              : 'Check back soon as new civic drives are regularly scheduled by administrators.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((ev) => {
            const isFull = ev.registration_count >= ev.max_participants;
            const isCompleted = ev.status === 'completed';

            return (
              <div 
                key={ev.id} 
                className="rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Event Banner */}
                  <div className="h-48 relative overflow-hidden bg-slate-100">
                    <img
                      src={ev.image_url || "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=700&q=80"}
                      alt={ev.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/95 backdrop-blur-xs text-[11px] font-bold text-[#1b4332] shadow-xs">
                      {ev.category}
                    </div>

                    <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-[11px] font-bold uppercase shadow-xs ${
                      ev.status === 'ongoing' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                      ev.status === 'completed' ? 'bg-slate-200 text-slate-700' :
                      'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    }`}>
                      {ev.status}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 space-y-3">
                    <h3 className="text-lg font-bold font-serif text-[#12372A] leading-snug">
                      {lang === 'hi' && ev.title_hi ? ev.title_hi : ev.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed">
                      {lang === 'hi' && ev.description_hi ? ev.description_hi : ev.description}
                    </p>

                    <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span className="font-medium">
                          {new Date(ev.event_date).toLocaleString(undefined, { 
                            dateStyle: 'medium', 
                            timeStyle: 'short' 
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span className="truncate">{ev.location}</span>
                      </div>

                      <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>{ev.registration_count} / {ev.max_participants} {lang === 'hi' ? 'पंजीकृत' : 'registered'}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-6 pt-0">
                  {isCompleted ? (
                    <div className="w-full py-2.5 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold text-center select-none">
                      {lang === 'hi' ? 'यह कार्यक्रम संपन्न हो चुका है' : 'Event Completed'}
                    </div>
                  ) : ev.is_registered ? (
                    <div className="w-full py-2.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{lang === 'hi' ? 'आप पंजीकृत हैं' : 'Registered ✓'}</span>
                    </div>
                  ) : isFull ? (
                    <div className="w-full py-2.5 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold text-center select-none">
                      {lang === 'hi' ? 'स्थान पूर्ण (Full)' : 'Registration Full'}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleOpenRegisterModal(ev)}
                      disabled={registeringId === ev.id}
                      className="w-full py-2.5 rounded-full bg-[#1b4332] hover:bg-[#143527] text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span>
                        {registeringId === ev.id 
                          ? (lang === 'hi' ? 'पंजीकरण हो रहा है...' : 'Registering...')
                          : (lang === 'hi' ? 'कार्यक्रम के लिए पंजीकरण करें' : 'Register for Event')}
                      </span>
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ─── EVENT REGISTRATION MODAL WITH AUTO-FILLED + MANUAL FIELDS ─── */}
      {selectedEventForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative border border-emerald-100 space-y-5">
            <button
              onClick={() => setSelectedEventForModal(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="inline-block px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                {selectedEventForModal.category}
              </div>
              <h3 className="text-xl font-bold font-serif text-[#12372A]">
                {lang === 'hi' && selectedEventForModal.title_hi ? selectedEventForModal.title_hi : selectedEventForModal.title}
              </h3>
              <p className="text-xs text-slate-500">
                Confirm your participation. Your profile details are auto-filled; please verify and add your contact info.
              </p>
            </div>

            <form onSubmit={handleConfirmRegister} className="space-y-4">
              {/* Auto-filled Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>Full Name</span>
                  <span className="text-[10px] text-emerald-700 font-medium">Auto-filled from profile</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    readOnly
                    value={user?.name || ''}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium focus:outline-none"
                  />
                </div>
              </div>

              {/* Auto-filled Email */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>Email Address (Confirmation Pass Recipient)</span>
                  <span className="text-[10px] text-emerald-700 font-medium">Auto-filled</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    readOnly
                    value={user?.email || ''}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium focus:outline-none"
                  />
                </div>
              </div>

              {/* Manual Field: Phone */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Contact Mobile Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>

              {/* Manual Field: Number of Volunteers */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Number of Attendees / Volunteers
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={regAttendees}
                  onChange={(e) => setRegAttendees(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:border-emerald-600"
                />
              </div>

              {/* Manual Field: Notes */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Notes / College / Neighborhood (Optional)
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Amrita Vishwa Vidyapeetham Student Volunteer"
                  value={regNotes}
                  onChange={(e) => setRegNotes(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:border-emerald-600"
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedEventForModal(null)}
                  className="px-5 py-2.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registeringId === selectedEventForModal.id}
                  className="px-6 py-2.5 rounded-full bg-[#12372A] hover:bg-[#1b4332] text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {registeringId === selectedEventForModal.id ? 'Registering...' : 'Confirm Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default EventsPage;

