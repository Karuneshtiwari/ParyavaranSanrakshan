import React, { useState } from 'react';
import { 
  Sparkles, Cpu, ShieldCheck, MapPin, Trash2, Truck, Users, Leaf, 
  ArrowRight, Mail, Phone, Send, CheckCircle2, AlertTriangle, MessageSquare, 
  ExternalLink, Layers, Award, Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { contactAPI } from '../services/api';

export const AboutPage = () => {
  const { lang } = useLanguage();

  const [activeTab, setActiveTab] = useState('about'); // 'about' or 'contact'
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [contactStatus, setContactStatus] = useState(null);

  const formatErrorMsg = (err) => {
    const detail = err.response?.data?.detail;
    if (!detail) return 'Could not send message. Please verify your connection and try again.';
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail.map(d => d.msg || (typeof d === 'object' ? JSON.stringify(d) : String(d))).join(', ');
    }
    if (typeof detail === 'object') {
      return detail.msg || JSON.stringify(detail);
    }
    return String(detail);
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) return;
    setSubmitting(true);
    setContactStatus(null);
    const senderEmail = contactEmail.trim();
    try {
      await contactAPI.submit({
        name: contactName.trim(),
        email: senderEmail,
        subject: contactSubject.trim() || 'General Inquiry from ParyavaranSanrakshan Portal',
        message: contactMessage.trim()
      });
      setContactStatus({
        type: 'success',
        message: lang === 'hi'
          ? `सफलतापूर्वक संदेश एडमिन टीम को भेज दिया गया है! हमने आपका संदेश प्राप्त कर लिया है और जल्द ही ${senderEmail} पर संपर्क करेंगे।`
          : `Message successfully sent to the admin team! We have received your query and will reach out to you shortly at ${senderEmail}.`
      });
      setContactName('');
      setContactEmail('');
      setContactSubject('');
      setContactMessage('');
    } catch (err) {
      setContactStatus({
        type: 'error',
        message: formatErrorMsg(err)
      });
    } finally {
      setSubmitting(false);
    }
  };

  const zones = [
    { name: "Indiranagar 100ft Rd", type: "Commercial High Density" },
    { name: "Koramangala 5th Block", type: "Mixed Urban Center" },
    { name: "Whitefield ITPL Hub", type: "Tech Corridor & Transit" },
    { name: "MG Road Metro Station", type: "Core Transit Node" },
    { name: "Malleshwaram 8th Cross", type: "Traditional Market" },
    { name: "HSR Layout Sector 1", type: "Residential Ward" },
    { name: "Jayanagar 4th Block", type: "Pedestrian Complex" },
    { name: "Electronic City Gate 1", type: "Industrial IT Cluster" },
  ];

  return (
    <div className="min-h-screen bg-[#f7faf7] text-slate-800 py-10 px-4 sm:px-6 lg:px-8 space-y-12">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* ─── 1. TOP HEADER (EXACT IMAGE 2) ─── */}
        <div className="text-center space-y-4 max-w-3xl mx-auto pt-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/90 border border-emerald-300 text-emerald-800 text-xs font-bold uppercase tracking-wider shadow-xs">
            <Leaf className="w-3.5 h-3.5 text-emerald-700" />
            <span>Civic Environmental Intelligence</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#12372A] font-serif tracking-tight leading-tight">
            About Paryavaran<span className="text-emerald-700">Sanrakshan</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans max-w-2xl mx-auto">
            {lang === 'hi'
              ? 'आधुनिक कंप्यूटर विज़न और प्रिडिक्टिव मशीन लर्निंग द्वारा संचालित नागरिक अपशिष्ट प्रबंधन प्लेटफॉर्म, जो बेंगलुरु महानगर में कचरा पृथक्करण और स्मार्ट डिब्बा निगरानी को सशक्त बनाता है।'
              : 'Next-generation civic waste intelligence platform powered by Computer Vision and predictive Machine Learning, engineered to transform urban waste segregation, real-time bin monitoring, and municipal dispatch across Bengaluru Metropolitan.'}
          </p>

          {/* Interactive Navigation Switcher: About Platform vs Contact & Collaboration */}
          <div className="pt-2 flex justify-center">
            <div className="inline-flex p-1.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <button
                type="button"
                onMouseEnter={() => setActiveTab('about')}
                onClick={() => setActiveTab('about')}
                className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'about'
                    ? 'bg-[#12372A] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                About Platform & Architecture
              </button>
              <button
                type="button"
                onMouseEnter={() => setActiveTab('contact')}
                onClick={() => setActiveTab('contact')}
                className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'contact'
                    ? 'bg-[#12372A] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Get In Touch & Collaborate
              </button>
            </div>
          </div>
        </div>

        {/* ─── TAB 1: ABOUT PLATFORM (EXACT IMAGE 2 MOCKUP) ─── */}
        {activeTab === 'about' && (
          <div className="space-y-12 animate-in fade-in duration-200">
            
            {/* Vision & Core Pillars Banner (High Contrast, Ultra Readable) */}
            <div className="bg-[#12372A] text-white rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden border border-emerald-800">
              <div className="max-w-3xl space-y-3">
                <span className="text-[11px] uppercase tracking-widest text-emerald-400 font-bold font-mono">
                  Municipal Scale Solution
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold font-serif leading-snug text-white">
                  Intelligent Technology for Zero-Overflow Communities
                </h2>
                <p className="text-emerald-100/90 text-xs sm:text-sm leading-relaxed">
                  ParyavaranSanrakshan links citizens, automated fleet dispatchers, and municipal leadership into one unified ecosystem. By recognizing waste instantly at household and commercial disposal points and predicting fill levels before bins overflow, we minimize transit fuel, reduce landfill contamination, and keep streets immaculate.
                </p>
              </div>

              {/* 4 Key Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-emerald-700/60 text-center">
                <div className="space-y-1">
                  <span className="text-2xl sm:text-3xl font-bold text-amber-300 font-serif">20+</span>
                  <p className="text-[11px] text-emerald-200 font-medium">Bengaluru Metro Hubs</p>
                </div>
                <div className="space-y-1">
                  <span className="text-2xl sm:text-3xl font-bold text-emerald-300 font-serif">98.4%</span>
                  <p className="text-[11px] text-emerald-200 font-medium">AI Classification Precision</p>
                </div>
                <div className="space-y-1">
                  <span className="text-2xl sm:text-3xl font-bold text-teal-300 font-serif">&lt; 2 hrs</span>
                  <p className="text-[11px] text-emerald-200 font-medium">Critical Overflow SLA</p>
                </div>
                <div className="space-y-1">
                  <span className="text-2xl sm:text-3xl font-bold text-emerald-200 font-serif">100%</span>
                  <p className="text-[11px] text-emerald-200 font-medium">Real-Time Telemetry</p>
                </div>
              </div>
            </div>

            {/* Core Engineering Architecture (3 White Cards) */}
            <div className="space-y-6">
              <div className="text-center max-w-xl mx-auto space-y-1.5">
                <h3 className="text-xl sm:text-2xl font-bold text-[#12372A] font-serif">
                  Core Engineering Architecture
                </h3>
                <p className="text-xs text-slate-500">
                  End-to-end integration designed for high reliability, low latency, and intuitive citizen usage.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Pillar 1 */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow space-y-3 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h4 className="text-base font-bold text-[#12372A] font-serif">
                      Computer Vision Classification
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Trained deep learning visual model that scans household waste in milliseconds, identifying materials into Wet, Dry Recyclable, Hazardous, and General streams with actionable disposal guidance.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-100 text-[11px] font-semibold text-emerald-700 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    MobileNetV3 Edge Inference
                  </div>
                </div>

                {/* Pillar 2 */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow space-y-3 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <h4 className="text-base font-bold text-[#12372A] font-serif">
                      Bengaluru Smart Bin Telemetry
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Live monitoring network across commercial, transit, and residential hubs in Bengaluru (MG Road, Whitefield, Indiranagar, Electronic City), tracking capacity and fill trajectories.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-100 text-[11px] font-semibold text-teal-700 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                    Temporal Fill Rate Forecasting
                  </div>
                </div>

                {/* Pillar 3 */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow space-y-3 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                      <Truck className="w-5 h-5" />
                    </div>
                    <h4 className="text-base font-bold text-[#12372A] font-serif">
                      Predictive Dispatch Engine
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Multi-output regressor that scores bin collection urgency before physical spillover occurs. Informs municipal whole routes to prioritize critical locations and conserve fuel.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-100 text-[11px] font-semibold text-amber-700 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    Dynamic Priority Scoring
                  </div>
                </div>

              </div>
            </div>

            {/* Bengaluru Metropolitan Municipal Zones */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 uppercase tracking-wider mb-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                    Geographic Deployment
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold font-serif text-[#12372A]">
                    Bengaluru Metropolitan Municipal Zones
                  </h3>
                </div>

                <Link
                  to="/scanner"
                  className="px-5 py-2.5 rounded-full bg-[#12372A] hover:bg-[#1b4332] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                >
                  <span>Try Waste Scanner</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {zones.map((z, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200 bg-[#fbfdfb] hover:border-emerald-300 transition-colors space-y-1"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span className="truncate">{z.name}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 pl-3.5 truncate">
                      {z.type}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Prominent High-Visibility Ground Drives Callout Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0a231a] via-[#12372A] to-[#1c4b37] p-8 sm:p-10 shadow-xl border-2 border-emerald-400/50 text-white flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              {/* Radiant background glow */}
              <div className="absolute top-0 right-0 -mr-12 -mt-12 w-64 h-64 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none"></div>

              <div className="relative z-10 space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/25 border border-emerald-400/60 text-emerald-300 text-xs font-bold tracking-wider uppercase">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Citizen Eco Action Drives</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold font-serif text-white tracking-tight leading-snug">
                  Join Our Ground Drives & Awareness Events
                </h3>
                <p className="text-sm text-emerald-100 font-medium leading-relaxed">
                  Participate in neighborhood tree plantation drives, e-waste collection marathons, and hands-on waste segregation workshops across Bengaluru Metropolitan. Get official registration confirmation and pass dispatched directly to your email inbox!
                </p>
              </div>

              <Link
                to="/events"
                className="relative z-10 px-8 py-3.5 rounded-full bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-sm font-bold transition-all shadow-lg hover:shadow-emerald-500/30 shrink-0 flex items-center gap-2 group"
              >
                <span>Explore Events & Drives</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

          </div>
        )}

        {/* ─── TAB 2: GET IN TOUCH & COLLABORATE (MOVED FROM HOME) ─── */}
        {activeTab === 'contact' && (
          <div className="animate-in fade-in duration-200 space-y-6">
            
            {/* Common Card: Light Color Suitable to Platform */}
            <div className="bg-[#f2f8f4] border border-emerald-200 rounded-3xl p-6 sm:p-10 shadow-sm">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Subcard: Platform Info & Social Redirects */}
                <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-2xl border border-emerald-100 shadow-xs space-y-6 flex flex-col justify-between h-full">
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Get In Touch & Collaborate</span>
                    </div>

                    <h3 className="text-2xl font-bold font-serif text-[#12372A] leading-tight">
                      Connect With ParyavaranSanrakshan
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Have questions about municipality telemetry, college campaigns, or student participation? Reach out anytime.
                    </p>

                    <div className="space-y-3 pt-2 text-xs text-slate-600">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                          <Mail className="w-4 h-4" />
                        </div>
                        <a href="mailto:info.karuneshtiwari@gmail.com" className="hover:text-emerald-700 font-medium">
                          info.karuneshtiwari@gmail.com
                        </a>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                          <Phone className="w-4 h-4" />
                        </div>
                        <a href="https://wa.me/+917991541531" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-700 font-medium">
                          +91 79915 41531 (WhatsApp Helpline)
                        </a>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <span>Amrita Vishwa Vidyapeetham, Bengaluru Campus</span>
                      </div>
                    </div>
                  </div>

                  {/* Real Social Media Channels */}
                  <div className="space-y-2 pt-6 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Official Social Channels
                    </span>
                    <div className="flex items-center gap-2.5">
                      {/* Facebook */}
                      <a
                        href="https://www.facebook.com/karuneshkumar.tiwari.1"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-[#1877F2] hover:text-white text-slate-700 flex items-center justify-center transition-colors shadow-2xs"
                        title="Facebook"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                      </a>

                      {/* LinkedIn */}
                      <a
                        href="https://www.linkedin.com/in/karunesh-kumar-tiwari-72474a330"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-[#0A66C2] hover:text-white text-slate-700 flex items-center justify-center transition-colors shadow-2xs"
                        title="LinkedIn"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                        </svg>
                      </a>

                      {/* WhatsApp */}
                      <a
                        href="https://wa.me/+917991541531"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-[#25D366] hover:text-white text-slate-700 flex items-center justify-center transition-colors shadow-2xs"
                        title="WhatsApp"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                        </svg>
                      </a>

                      {/* X */}
                      <a
                        href="https://x.com/karunesh108"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-black hover:text-white text-slate-700 flex items-center justify-center transition-colors shadow-2xs"
                        title="X (Twitter)"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Right Subcard: Contact Message Form */}
                <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-emerald-100 shadow-xs space-y-5">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold font-serif text-[#12372A]">
                      Send Us a Message
                    </h3>
                    <p className="text-xs text-slate-500">
                      We will get back to you promptly at your provided email address.
                    </p>
                  </div>

                  {contactStatus && (
                    <div className={`p-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-start gap-3 transition-all ${
                      contactStatus.type === 'success'
                        ? 'bg-emerald-50 text-emerald-950 border-2 border-emerald-300 shadow-sm'
                        : 'bg-rose-50 text-rose-950 border-2 border-rose-300 shadow-sm'
                    }`}>
                      {contactStatus.type === 'success' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 leading-relaxed">
                        {String(contactStatus.message)}
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleContactSubmit} className="space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 block">Your Name *</label>
                        <input
                          type="text"
                          required
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="e.g. Karunesh Tiwari"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-emerald-600"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 block">Email Address *</label>
                        <input
                          type="email"
                          required
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="user@example.com"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-emerald-600"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 block">Subject</label>
                      <input
                        type="text"
                        value={contactSubject}
                        onChange={(e) => setContactSubject(e.target.value)}
                        placeholder="e.g. Campus Waste Segregation Drive Inquiry"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-emerald-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 block">Message *</label>
                      <textarea
                        required
                        rows="4"
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        placeholder="Write your query or collaboration request here..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-emerald-600"
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-7 py-3 rounded-full bg-[#12372A] hover:bg-[#1b4332] text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-4 h-4 text-emerald-300" />
                      <span>{submitting ? 'Sending...' : 'Send Message'}</span>
                    </button>
                  </form>
                </div>

              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default AboutPage;
