import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { blogAPI, newsletterAPI, binAPI, eventAPI, donationAPI, contactAPI } from '../services/api';
import { 
  Camera, 
  BarChart3, 
  MapPin, 
  ArrowRight, 
  CheckCircle2, 
  Mail, 
  Send, 
  Calendar, 
  Tag, 
  Users, 
  Building2, 
  TreePine, 
  Droplets, 
  Home as HomeIcon, 
  Sparkles, 
  ExternalLink, 
  X,
  Shield,
  Layers,
  Check,
  Clock,
  MailCheck,
  Heart,
  Phone,
  Globe,
  Loader2,
  Building,
  Recycle,
  Trash2,
  Truck,
  TrendingUp,
  Leaf,
  ChevronRight
} from 'lucide-react';

const INSPIRED_ORGANIZATIONS = [
  {
    name: 'UNEP',
    fullName: 'UN Environment Programme',
    tag: 'Global Action',
    url: 'https://www.unep.org/',
    logo: 'https://www.google.com/s2/favicons?domain=unep.org&sz=128'
  },
  {
    name: 'UNDP',
    fullName: 'UN Development Programme',
    tag: 'Sustainable Development',
    url: 'https://www.undp.org/',
    logo: 'https://www.google.com/s2/favicons?domain=undp.org&sz=128'
  },
  {
    name: 'WWF',
    fullName: 'World Wildlife Fund',
    tag: 'Conservation',
    url: 'https://www.worldwildlife.org/',
    logo: 'https://www.google.com/s2/favicons?domain=worldwildlife.org&sz=128'
  },
  {
    name: 'Greenpeace',
    fullName: 'Greenpeace International',
    tag: 'Climate Action',
    url: 'https://www.greenpeace.org/',
    logo: 'https://www.google.com/s2/favicons?domain=greenpeace.org&sz=128'
  },
  {
    name: 'ISWA',
    fullName: 'International Solid Waste Association',
    tag: 'Waste Management',
    url: 'https://www.iswa.org/',
    logo: 'https://www.google.com/s2/favicons?domain=iswa.org&sz=128'
  },
  {
    name: 'GAIA',
    fullName: 'Global Alliance for Incinerator Alternatives',
    tag: 'Zero Waste Systems',
    url: 'https://www.no-burn.org/',
    logo: 'https://www.google.com/s2/favicons?domain=no-burn.org&sz=128'
  },
  {
    name: 'Ellen MacArthur Foundation',
    fullName: 'Circular Economy Leader',
    tag: 'Circular Economy',
    url: 'https://www.ellenmacarthurfoundation.org/',
    logo: 'https://www.google.com/s2/favicons?domain=ellenmacarthurfoundation.org&sz=128'
  },
  {
    name: 'Waste Warriors',
    fullName: 'Himalayan Cleanliness Movement',
    tag: 'Grassroots Cleanup',
    url: 'https://wastewarriors.org/',
    logo: 'https://www.google.com/s2/favicons?domain=wastewarriors.org&sz=128'
  },
  {
    name: 'Saahas',
    fullName: 'Waste Management NGO',
    tag: 'Source Segregation',
    url: 'https://saahas.org/',
    logo: 'https://www.google.com/s2/favicons?domain=saahas.org&sz=128'
  },
  {
    name: 'Chintan',
    fullName: 'Environmental Research & Action',
    tag: 'Sustainable Livelihoods',
    url: 'https://www.chintan-india.org/',
    logo: 'https://www.google.com/s2/favicons?domain=chintan-india.org&sz=128'
  },
  {
    name: 'Hasiru Dala',
    fullName: 'Waste Pickers Organisation',
    tag: 'Social Inclusion',
    url: 'https://hasirudala.in/',
    logo: 'https://www.google.com/s2/favicons?domain=hasirudala.in&sz=128'
  },
  {
    name: 'The Nature Conservancy',
    fullName: 'Protecting Nature Globally',
    tag: 'Ecosystem Protection',
    url: 'https://www.nature.org/',
    logo: 'https://www.google.com/s2/favicons?domain=nature.org&sz=128'
  }
];

const FALLBACK_BLOGS = [
  {
    id: 991,
    title: "Zero-Waste Bengaluru: Community Segregation Drive Across 20 Wards",
    title_hi: "शून्य-कचरा बेंगलुरु: 20 वार्डों में सामुदायिक पृथक्करण अभियान",
    summary: "How citizen volunteers and municipal partners are achieving 85%+ waste segregation at source in urban communities.",
    summary_hi: "कैसे नागरिक स्वयंसेवक और नगरपालिका सहयोगी शहरी समुदायों में स्रोत पर 85%+ कचरा पृथक्करण प्राप्त कर रहे हैं।",
    category: "Community Drive",
    image_url: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=700&q=80",
    created_at: new Date().toISOString(),
    content: "ParyavaranSanrakshan has rolled out continuous ward-level engagement programs across Bengaluru to educate households on separating dry, wet, and hazardous electronic waste before municipal collection.",
    content_hi: "पर्यावरण संरक्षण ने नगरपालिका संग्रह से पहले सूखे, गीले और खतरनाक इलेक्ट्रॉनिक कचरे को अलग करने के लिए पूरे बेंगलुरु में निरंतर वार्ड-स्तरीय जागरूकता कार्यक्रम शुरू किए हैं।"
  },
  {
    id: 992,
    title: "Deep Learning for Waste Classification: Edge Vision in Action",
    title_hi: "कचरा वर्गीकरण के लिए डीप लर्निंग: एज विजन का अनुप्रयोग",
    summary: "Exploring our 95%+ precision edge vision model trained for real-time mobile sorting.",
    summary_hi: "वास्तविक समय मोबाइल छंटाई के लिए प्रशिक्षित हमारे 95%+ परिशुद्धता विजन मॉडल की पड़ताल।",
    category: "AI Technology",
    image_url: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=700&q=80",
    created_at: new Date().toISOString(),
    content: "Trained on thousands of curated waste images, our intelligent computer vision architecture delivers sub-second inference in the browser, providing instant disposal recommendations.",
    content_hi: "हजारों कचरा छवियों पर प्रशिक्षित हमारा एआई विजन मॉडल ब्राउज़र में सब-सेकंड परिणाम देता है और तुरंत निस्तारण सुझाव प्रदान करता है।"
  },
  {
    id: 993,
    title: "Preventing Overflow: How IoT Ultrasonic Telemetry Guides Municipal Fleets",
    title_hi: "अतिप्रवाह रोकथाम: आईओटी अल्ट्रासोनिक टेलीमेट्री कैसे मार्गदर्शित करती है",
    summary: "Predictive fill level algorithms help BBMP collection trucks reduce fuel emissions and eliminate roadside dump overflows.",
    summary_hi: "पूर्वानुमान भराव स्तर एल्गोरिदम कचरा संग्रहण वाहनों के ईंधन उत्सर्जन को कम करने और ओवरफ्लो को समाप्त करने में मदद करते हैं।",
    category: "Smart Bins",
    image_url: "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=700&q=80",
    created_at: new Date().toISOString(),
    content: "By monitoring ultrasonic distance sensors mounted inside municipal bins, our platform forecasts 6-hour and 12-hour overflow probabilities.",
    content_hi: "नगर निगम के डिब्बों में लगे अल्ट्रासोनिक दूरी सेंसरों की निगरानी करके, हमारा प्लेटफॉर्म 6 और 12 घंटे के अतिप्रवाह जोखिम की भविष्यवाणी करता है।"
  }
];

const FALLBACK_EVENTS = [
  {
    id: 981,
    title: "Indiranagar Green Walk & Native Sapling Plantation",
    title_hi: "इंदिरानगर ग्रीन वॉक एवं स्वदेशी पौधा रोपण",
    description: "Join 150+ conscious citizens in planting 300 native peepal and neem saplings along 100ft Road corridor.",
    description_hi: "100 फीट रोड कॉरिडोर के साथ 300 स्वदेशी पीपल और नीम के पौधे लगाने के लिए 150+ जागरूक नागरिकों के साथ जुड़ें।",
    category: "Plantation",
    status: "upcoming",
    location: "100 Feet Road, Indiranagar, Bengaluru",
    event_date: new Date(Date.now() + 86400000 * 3).toISOString(),
    image_url: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=700&q=80",
    is_registered: false
  },
  {
    id: 982,
    title: "Community Waste Segregation Workshop for RWAs",
    title_hi: "आवासीय कल्याण संघों (RWA) के लिए कचरा पृथक्करण कार्यशाला",
    description: "Hands-on demonstration of source segregation, compost pit management, and AI scanner tools for apartments.",
    description_hi: "अपार्टमेंट के लिए स्रोत पृथक्करण, कंपोस्ट गड्ढे प्रबंधन और एआई स्कैनर उपकरणों का व्यावहारिक प्रदर्शन।",
    category: "Workshop",
    status: "upcoming",
    location: "Koramangala 4th Block Community Hall, Bengaluru",
    event_date: new Date(Date.now() + 86400000 * 6).toISOString(),
    image_url: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=700&q=80",
    is_registered: false
  },
  {
    id: 983,
    title: "Ulsoor Lake Perimeter Clean-up & Plastic Segregation",
    title_hi: "अल्सूर झील परिधि स्वच्छता एवं प्लास्टिक पृथक्करण",
    description: "Volunteer morning drive to intercept single-use plastics and safeguard aquatic habitat around Ulsoor lake.",
    description_hi: "अल्सूर झील के चारों ओर एकल-उपयोग प्लास्टिक को हटाने और जलीय आवास की सुरक्षा के लिए स्वयंसेवी सुबह का अभियान।",
    category: "Cleanliness Drive",
    status: "upcoming",
    location: "Ulsoor Lake Boat Club Entrance, Bengaluru",
    event_date: new Date(Date.now() + 86400000 * 9).toISOString(),
    image_url: "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=700&q=80",
    is_registered: false
  }
];

export const LandingPage = () => {
  const { user, isAuthenticated } = useAuth();
  const { lang, t } = useLanguage();
  const navigate = useNavigate();

  const [blogs, setBlogs] = useState([]);
  const [loadingBlogs, setLoadingBlogs] = useState(true);
  const [selectedBlog, setSelectedBlog] = useState(null);

  // Smart Bins Preview
  const [bins, setBins] = useState([]);

  // Events state
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [eventNotice, setEventNotice] = useState(null);
  const [registeringEventId, setRegisteringEventId] = useState(null);

  // Newsletter state
  const [newsEmail, setNewsEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [newsletterStatus, setNewsletterStatus] = useState(null);

  // Donation state (Razorpay)
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(250);
  const [customAmount, setCustomAmount] = useState('');
  const [donorName, setDonorName] = useState(user?.full_name || '');
  const [donorEmail, setDonorEmail] = useState(user?.email || '');
  const [donationLoading, setDonationLoading] = useState(false);
  const [donationSuccess, setDonationSuccess] = useState(false);
  const [donationError, setDonationError] = useState(null);

  // Contact section state
  const [contactName, setContactName] = useState(user?.full_name || '');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactStatus, setContactStatus] = useState(null);

  // Listen to open-donation-modal global custom event
  useEffect(() => {
    const handleOpenModal = () => {
      setShowDonationModal(true);
      setDonationSuccess(false);
      setDonationError(null);
    };
    window.addEventListener('open-donation-modal', handleOpenModal);
    return () => window.removeEventListener('open-donation-modal', handleOpenModal);
  }, []);

  // Update donor contact info when user logs in
  useEffect(() => {
    if (user) {
      if (!donorName) setDonorName(user.full_name || '');
      if (!donorEmail) setDonorEmail(user.email || '');
      if (!contactName) setContactName(user.full_name || '');
      if (!contactEmail) setContactEmail(user.email || '');
    }
  }, [user]);

  // Fetch blogs, bins, and events on load
  const loadData = async () => {
    try {
      const [blogRes, binRes, eventRes] = await Promise.allSettled([
        blogAPI.getPublished({ limit: 6 }),
        binAPI.getAll({ limit: 6 }),
        eventAPI.getAll({ status: 'upcoming' })
      ]);
      if (blogRes.status === 'fulfilled') {
        setBlogs(blogRes.value.data || []);
      }
      if (binRes.status === 'fulfilled') {
        setBins(binRes.value.data?.slice(0, 6) || []);
      }
      if (eventRes.status === 'fulfilled') {
        setEvents(eventRes.value.data?.slice(0, 3) || []);
      }
    } catch (err) {
      console.error("Failed to load initial data:", err);
    } finally {
      setLoadingBlogs(false);
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRegisterEvent = async (eventId, eventTitle) => {
    if (!isAuthenticated) {
      navigate('/login', {
        state: {
          fromEvent: true,
          msg: lang === 'hi'
            ? "कार्यक्रम में पंजीकरण करने के लिए कृपया पहले लॉगिन करें।"
            : "Please sign in or create an account to register for this event."
        }
      });
      return;
    }

    setRegisteringEventId(eventId);
    setEventNotice(null);
    try {
      await eventAPI.register(eventId);
      setEventNotice({
        type: 'success',
        msg: lang === 'hi'
          ? `सफलतापूर्वक पंजीकृत! पुष्टि ईमेल ${user.email} पर भेजा गया है।`
          : `Successfully registered for '${eventTitle}'! A confirmation email has been dispatched to ${user.email}.`
      });
      loadData();
    } catch (err) {
      setEventNotice({
        type: 'error',
        msg: err.response?.data?.detail || "Could not register for event. Please try again."
      });
    } finally {
      setRegisteringEventId(null);
    }
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!newsEmail) return;
    setSubscribing(true);
    setNewsletterStatus(null);
    try {
      await newsletterAPI.subscribe({ email: newsEmail });
      setNewsletterStatus({
        success: true,
        message: lang === 'hi' 
          ? "पर्यावरण संरक्षण पत्रिका की सदस्यता लेने के लिए धन्यवाद!" 
          : "Thank you for subscribing to ParyavaranSanrakshan updates!"
      });
      setNewsEmail('');
    } catch (err) {
      setNewsletterStatus({
        success: false,
        message: lang === 'hi'
          ? "सदस्यता असफल रही। कृपया अपना ईमेल जांचें।"
          : "Subscription failed. Please check your email."
      });
    } finally {
      setSubscribing(false);
    }
  };

  const handleStartDonation = async (e) => {
    e?.preventDefault();
    const finalAmount = customAmount ? parseFloat(customAmount) : selectedPreset;
    if (!finalAmount || isNaN(finalAmount) || finalAmount < 1) {
      setDonationError('Please enter a valid donation amount (minimum ₹1).');
      return;
    }
    setDonationLoading(true);
    setDonationError(null);
    try {
      const res = await donationAPI.createOrder({
        amount: finalAmount,
        donor_name: donorName || (user?.full_name ?? 'Generous Supporter'),
        donor_email: donorEmail || (user?.email ?? undefined)
      });

      const orderData = res.data;
      if (!window.Razorpay) {
        throw new Error('Razorpay SDK is loading or blocked. Please refresh your browser.');
      }

      const options = {
        key: orderData.razorpay_key_id,
        amount: orderData.amount_paise,
        currency: orderData.currency || 'INR',
        name: 'ParyavaranSanrakshan',
        description: 'Contribution towards Smart Waste Segregation & SDG 11',
        image: '/project_logo.png',
        order_id: orderData.order_id,
        prefill: {
          name: donorName || user?.full_name || '',
          email: donorEmail || user?.email || ''
        },
        theme: {
          color: '#1b4332'
        },
        handler: async function (paymentRes) {
          try {
            await donationAPI.verifyPayment({
              razorpay_order_id: paymentRes.razorpay_order_id,
              razorpay_payment_id: paymentRes.razorpay_payment_id,
              razorpay_signature: paymentRes.razorpay_signature
            });
            setDonationSuccess(true);
          } catch (verifErr) {
            setDonationError('Payment verification failed: ' + (verifErr.response?.data?.detail || verifErr.message));
          }
        },
        modal: {
          ondismiss: function () {
            setDonationLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setDonationError(err.response?.data?.detail || err.message || 'Failed to initiate donation order.');
    } finally {
      setDonationLoading(false);
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) return;
    setContactSubmitting(true);
    setContactStatus(null);
    try {
      await contactAPI.submit({
        name: contactName,
        email: contactEmail,
        subject: contactSubject.trim() || 'General Inquiry from ParyavaranSanrakshan Portal',
        message: contactMessage
      });
      setContactStatus({
        type: 'success',
        message: lang === 'hi' 
          ? 'धन्यवाद! आपका संदेश प्राप्त हो गया है और ईमेल अधिसूचना info.karuneshtiwari@gmail.com पर भेज दी गई है।'
          : 'Thank you! Your message has been safely received and dispatched to info.karuneshtiwari@gmail.com.'
      });
      setContactSubject('');
      setContactMessage('');
    } catch (err) {
      setContactStatus({
        type: 'error',
        message: err.response?.data?.detail || 'Could not send message. Please try again later.'
      });
    } finally {
      setContactSubmitting(false);
    }
  };

  const displayBlogs = blogs && blogs.length > 0 ? blogs : FALLBACK_BLOGS;
  const displayEvents = events && events.length > 0 ? events : FALLBACK_EVENTS;

  return (
    <div className="bg-[#f7faf7] text-slate-800 space-y-20 pb-20">
      
      {/* ─── 1. HERO SECTION (FOCUSED HIGH-IMPACT HERO MATCHING SAMPLE 1) ─── */}
      <section className="relative pt-2 sm:pt-4 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          
          {/* Left Column: Heading, Subtitle, CTAs, Metrics */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[#1b4332] text-xs font-semibold tracking-wider uppercase">
              <span>{lang === 'hi' ? 'हरित कल के लिए एआई' : 'AI FOR A GREENER TOMORROW'}</span>
              <span className="w-8 h-0.5 bg-amber-600 rounded-full inline-block"></span>
            </div>

            {/* Main Headline matching mockup */}
            <h1 className="text-4xl sm:text-5xl lg:text-5xl xl:text-6xl font-bold font-serif tracking-tight text-[#12372A] leading-[1.12]">
              {lang === 'hi' ? (
                <>
                  स्मार्ट कचरा प्रबंधन।<br />
                  <span className="text-[#2d6a4f]">स्वच्छ समुदाय।</span>
                </>
              ) : (
                <>
                  Smarter Waste.<br />
                  <span className="text-[#2d6a4f]">Cleaner Communities.</span>
                </>
              )}
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
              {lang === 'hi' 
                ? "अधिक टिकाऊ और स्वच्छ समुदायों के लिए एआई-संचालित कचरा पहचान और स्मार्ट-बिन इंटेलिजेंस।"
                : "AI-powered waste identification and smart-bin intelligence for more sustainable communities."}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <Link
                to="/scanner"
                className="px-6 py-3 rounded-full bg-[#1b4332] hover:bg-[#143527] text-white font-semibold text-sm sm:text-base shadow-md shadow-emerald-950/20 transition-all flex items-center gap-2 group"
              >
                <Camera className="w-4 h-4 text-emerald-300 group-hover:scale-110 transition-transform" />
                <span>{lang === 'hi' ? 'कचरा स्कैन करें' : 'Scan Waste'}</span>
              </Link>

              <a
                href="#smart-bins"
                className="px-6 py-3 rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-sm sm:text-base shadow-2xs transition-all flex items-center gap-2"
              >
                <MapPin className="w-4 h-4 text-[#1b4332]" />
                <span>{lang === 'hi' ? 'स्मार्ट डिब्बे देखें' : 'Explore Smart Bins'}</span>
              </a>
            </div>

            {/* Metrics Bar below CTAs matching mockup */}
            <div className="pt-5 border-t border-slate-200/90 grid grid-cols-3 gap-4 sm:gap-6 max-w-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-800 flex items-center justify-center shrink-0">
                  <Leaf className="w-5 h-5 text-[#1b4332]" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold font-serif text-[#12372A]">6</div>
                  <div className="text-[11px] sm:text-xs text-slate-500 font-medium leading-tight">
                    {lang === 'hi' ? 'कचरा वर्ग' : 'Waste Classes'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-800 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-[#1b4332]" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold font-serif text-[#12372A]">20</div>
                  <div className="text-[11px] sm:text-xs text-slate-500 font-medium leading-tight">
                    {lang === 'hi' ? 'स्मार्ट डिब्बे' : 'Demo Smart Bins'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-800 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-5 h-5 text-[#1b4332]" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold font-serif text-[#12372A]">AI + ML</div>
                  <div className="text-[11px] sm:text-xs text-slate-500 font-medium leading-tight">
                    {lang === 'hi' ? 'निर्णय समर्थन' : 'Decision Support'}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: SDG.jpeg with broad breadth, glowing outline & shorter aligned height */}
          <div className="lg:col-span-7 relative flex justify-center items-center w-full">
            {/* Platform Ambient Green Glow */}
            <div className="absolute -inset-3 bg-gradient-to-r from-emerald-500/35 via-teal-400/30 to-emerald-400/35 rounded-3xl blur-2xl -z-10 opacity-80"></div>
            
            {/* Glowing Border Image Container - Broad breadth covering left areas */}
            <div className="relative w-full h-[380px] sm:h-[430px] lg:h-[430px] rounded-3xl overflow-hidden ring-2 ring-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.32)] group transition-all duration-500 hover:ring-emerald-400 hover:shadow-[0_0_50px_rgba(16,185,129,0.42)]">
              <img
                src="/SDG.jpeg"
                alt="Sustainable Development Goals (SDG 11)"
                onError={(e) => { e.currentTarget.src = '/SDG.jpg'; }}
                className="w-full h-full object-cover object-center transform group-hover:scale-102 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a1e17]/30 via-transparent to-transparent opacity-50 group-hover:opacity-20 transition-opacity"></div>
            </div>
          </div>

        </div>
      </section>

      {/* ─── 2. 3 FLOATING FEATURE CARDS (EXACT REPLICA OF MOCKUP) ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-10 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: AI Waste Scanner */}
          <Link
            to="/scanner"
            className="group p-6 rounded-2xl bg-white border border-slate-200/90 shadow-lg hover:shadow-xl hover:border-emerald-300 transition-all flex items-start gap-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#1b4332] text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-md shadow-emerald-950/15">
              <Camera className="w-7 h-7 text-emerald-300" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold font-serif text-[#12372A] group-hover:text-emerald-700 transition-colors">
                  {lang === 'hi' ? 'एआई कचरा स्कैनर' : 'AI Waste Scanner'}
                </h3>
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                {lang === 'hi' 
                  ? "उन्नत कंप्यूटर विज़न का उपयोग करके कचरे की पहचान करें और उचित निपटान मार्गदर्शन प्राप्त करें।"
                  : "Identify waste using advanced computer vision and get proper disposal recommendations."}
              </p>
            </div>
          </Link>

          {/* Card 2: Smart Bin Intelligence */}
          <a
            href="#smart-bins"
            className="group p-6 rounded-2xl bg-white border border-slate-200/90 shadow-lg hover:shadow-xl hover:border-amber-300 transition-all flex items-start gap-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#b45309] text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-md shadow-amber-950/15">
              <BarChart3 className="w-7 h-7 text-amber-200" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold font-serif text-[#12372A] group-hover:text-amber-800 transition-colors">
                  {lang === 'hi' ? 'स्मार्ट बिन इंटेलिजेंस' : 'Smart Bin Intelligence'}
                </h3>
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-amber-50 group-hover:text-amber-800 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                {lang === 'hi'
                  ? "स्मार्ट-बिन डेटा पर मशीन लर्निंग का उपयोग करके भराव स्तर और अतिप्रवाह जोखिम की भविष्यवाणी करें।"
                  : "Predict fill levels and overflow risk using machine learning on smart-bin data."}
              </p>
            </div>
          </a>

          {/* Card 3: Collection Priority */}
          <Link
            to="/collector/priority"
            className="group p-6 rounded-2xl bg-white border border-slate-200/90 shadow-lg hover:shadow-xl hover:border-teal-300 transition-all flex items-start gap-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#0d9488] text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-md shadow-teal-950/15">
              <MapPin className="w-7 h-7 text-teal-200" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold font-serif text-[#12372A] group-hover:text-teal-800 transition-colors">
                  {lang === 'hi' ? 'संग्रह प्राथमिकता' : 'Collection Priority'}
                </h3>
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-teal-50 group-hover:text-teal-800 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                {lang === 'hi'
                  ? "तेज़ और अधिक कुशल अपशिष्ट संग्रह के लिए उच्च-प्राथमिकता वाले डिब्बों की पहचान करें।"
                  : "Identify high-priority bins for faster and more efficient waste collection."}
              </p>
            </div>
          </Link>

        </div>
      </section>

      {/* ─── 3. SUPPORTING SUSTAINABLE CITIES AND COMMUNITIES ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <div className="lg:col-span-5 rounded-2xl overflow-hidden shadow-md h-64 lg:h-72 bg-emerald-50">
            <img
              src="/story.png"
              alt="Supporting Sustainable Cities and Communities"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              SUPPORTING
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#12372A]">
              Sustainable Cities and Communities
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              ParyavaranSanrakshan demonstrates how AI and Machine Learning can support smarter waste management practices for cleaner, safer and more sustainable communities.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
              <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-100 flex items-center gap-2">
                <Leaf className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="text-xs font-semibold text-emerald-950">Cleaner Environment</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="text-xs font-semibold text-emerald-950">Healthier Communities</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-100 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="text-xs font-semibold text-emerald-950">Smarter Urban Spaces</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="text-xs font-semibold text-emerald-950">Sustainable Future</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                to="/about"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1b4332] hover:text-emerald-700 uppercase tracking-wider group"
              >
                <span>Learn More</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* ─── 4. SACRED SANSKRIT MOTHER EARTH BANNER (USER'S EXACT TEXT) ─── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden bg-gradient-to-br from-[#12372A] via-[#1b4332] to-[#2d6a4f] text-white shadow-xl">
          <div className="relative z-10 max-w-3xl mx-auto space-y-4">
            
            <div className="flex justify-center">
              <TreePine className="w-8 h-8 text-emerald-300" />
            </div>
            
            <p className="text-xl sm:text-2xl font-serif italic text-emerald-100 font-light leading-relaxed">
              "Caring for the earth,<br className="hidden sm:inline" />
              as one cares for a mother."
            </p>

            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-serif text-amber-300 tracking-wide">
              || माता भूमि: पुत्रों अहम् पृथिव्या: ||
            </h3>

            <p className="text-xs sm:text-sm text-emerald-200/90 max-w-xl mx-auto pt-2 leading-relaxed">
              Paryavaran Sanrakshan Gatividhi is an all-India volunteer-led movement dedicated to improving the environment through plantation, water conservation, polythene-free drives, and green homes.
            </p>

            <div className="pt-4 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('open-donation-modal'))}
                className="px-6 py-2.5 rounded-full bg-[#1b4332] hover:bg-[#2d6a4f] text-white font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 cursor-pointer border border-emerald-500/40"
              >
                <span>{lang === 'hi' ? 'दान करें' : 'Donate Now'}</span>
              </button>
              <Link
                to="/about"
                className="px-5 py-2.5 rounded-full bg-emerald-900/60 hover:bg-emerald-900/80 text-emerald-100 border border-emerald-700/60 font-semibold text-xs sm:text-sm transition-all"
              >
                {lang === 'hi' ? 'हमारे बारे में' : 'About Our Mission'}
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ─── 5. FOUR PILLARS OF ACTION (USER SPECIFIED) ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
            {lang === 'hi' ? 'कार्रवाई के चार स्तंभ' : 'FOUR PILLARS OF ACTION'}
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold font-serif text-[#12372A]">
            {lang === 'hi' ? 'स्वच्छ और स्मार्ट समुदायों के लिए चार बौद्धिक समाधान' : 'Four intelligent solutions driving cleaner, smarter communities'}
          </h2>
          <p className="text-sm text-slate-500">
            {lang === 'hi'
              ? 'कंप्यूटर विज़न, स्मार्ट बिन स्तर पूर्वानुमान और संगठित संग्रह से शहर को स्वच्छ बनाएं।'
              : 'Empowering urban neighborhoods through AI segregation, IoT telemetry, and predictive municipal dispatch.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Pillar 1: AI Waste Classification */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center shadow-2xs">
              <Recycle className="w-6 h-6 text-[#1b4332]" />
            </div>
            <h3 className="text-lg font-bold font-serif text-[#12372A]">
              {lang === 'hi' ? 'एआई कचरा वर्गीकरण' : 'AI Waste Classification'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {lang === 'hi' 
                ? 'एआई-संचालित छवि वर्गीकरण का उपयोग करके तुरंत कचरे की पहचान करें और सही निस्तारण मार्गदर्शन प्राप्त करें।'
                : 'Identify waste instantly using AI-powered image classification and receive the right disposal guidance.'}
            </p>
          </div>

          {/* Pillar 2: Smart Bin Intelligence */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-800 flex items-center justify-center shadow-2xs">
              <Trash2 className="w-6 h-6 text-blue-800" />
            </div>
            <h3 className="text-lg font-bold font-serif text-[#12372A]">
              {lang === 'hi' ? 'स्मार्ट बिन इंटेलिजेंस' : 'Smart Bin Intelligence'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {lang === 'hi'
                ? 'कचरे के स्तर की निगरानी करें और एमएल पूर्वानुमानों से उन डिब्बों का पता लगाएं जिन पर ध्यान देने की आवश्यकता है।'
                : 'Monitor bin fill levels and use ML predictions to detect bins that may require attention.'}
            </p>
          </div>

          {/* Pillar 3: Smart Collection */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center shadow-2xs">
              <Truck className="w-6 h-6 text-amber-800" />
            </div>
            <h3 className="text-lg font-bold font-serif text-[#12372A]">
              {lang === 'hi' ? 'स्मार्ट संग्रह' : 'Smart Collection'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {lang === 'hi'
                ? 'गंभीर और उच्च-जोखिम वाले डिब्बों को प्राथमिकता दें ताकि कचरा संग्रह सही समय पर हो सके।'
                : 'Prioritize critical and high-risk bins so waste collection can happen at the right time.'}
            </p>
          </div>

          {/* Pillar 4: Sustainable Communities */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center shadow-2xs">
              <Globe className="w-6 h-6 text-emerald-800" />
            </div>
            <h3 className="text-lg font-bold font-serif text-[#12372A]">
              {lang === 'hi' ? 'टिकाऊ समुदाय' : 'Sustainable Communities'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {lang === 'hi'
                ? 'जिम्मेदार कचरा पृथक्करण, कुशल संग्रह और एसडीजी 11-केंद्रित नवाचार के माध्यम से स्वच्छ पड़ोस का समर्थन करें।'
                : 'Support cleaner neighborhoods through responsible waste segregation, efficient collection, and SDG 11-focused innovation.'}
            </p>
          </div>

        </div>
      </section>

      {/* ─── 6. FEATURED ACTIVITIES & ARTICLES (CLICK OPENS IN NEW TAB ARTICLE VIEW) ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              {lang === 'hi' ? 'अभियान एवं समाचार' : 'NEWS & FIELD UPDATES'}
            </div>
            <h2 className="text-3xl font-bold font-serif text-[#12372A]">
              {lang === 'hi' ? 'प्रमुख गतिविधियाँ' : 'Featured Activities'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {lang === 'hi'
                ? 'प्रशासक द्वारा प्रकाशित पर्यावरण अभियान। लेख पढ़ने के लिए किसी भी कार्ड पर क्लिक करें।'
                : 'Live community drives and awareness articles. Click any story to open the full article in a dedicated tab.'}
            </p>
          </div>
        </div>

        {loadingBlogs ? (
          <div className="p-12 text-center text-slate-400">Loading activities...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayBlogs.map((b) => (
              <Link
                key={b.id}
                to={`/activity/${b.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="h-48 overflow-hidden relative bg-slate-100">
                    <img
                      src={b.image_url || "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=700&q=80"}
                      alt={b.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-xs text-[11px] font-semibold text-emerald-900 shadow-2xs">
                      {b.category}
                    </div>
                  </div>

                  <div className="p-5 space-y-2">
                    <h3 className="text-base sm:text-lg font-bold font-serif text-[#12372A] group-hover:text-emerald-700 transition-colors line-clamp-2">
                      {lang === 'hi' && b.title_hi ? b.title_hi : b.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 line-clamp-3 leading-relaxed">
                      {lang === 'hi' && b.summary_hi ? b.summary_hi : b.summary}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 mt-2">
                  <span>{new Date(b.created_at).toLocaleDateString()}</span>
                  <span className="font-semibold text-[#1b4332] group-hover:underline flex items-center gap-1">
                    {lang === 'hi' ? 'लेख पढ़ें' : 'Read Article'} <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ─── 7. HOW WE'RE ORGANISED (PROJECT-TAILORED WITH IMAGE PLACEHOLDERS) ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
            {lang === 'hi' ? 'परियोजना संगठन' : 'INTEGRATED TRIPARTITE ARCHITECTURE'}
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold font-serif text-[#12372A]">
            {lang === 'hi' ? 'हमारा संगठन कैसे काम करता है' : "How We're Organised"}
          </h2>
          <p className="text-sm text-slate-500">
            {lang === 'hi'
              ? 'नागरिकों, स्वच्छता कर्मचारियों और नगर निगम प्रशासन का एक सुदृढ़ एकीकृत तंत्र।'
              : 'Connecting Conscious Citizens, Field Collectors, and Municipal Administration into one unified loop.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Division 1: Citizens (image1 placeholder) */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-sm transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              {/* IMAGE PLACEHOLDER: image1 */}
              <div className="h-44 rounded-2xl overflow-hidden bg-emerald-50 border border-emerald-100 relative group">
                <img
                  src="https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80"
                  alt="image1 - Conscious Citizens Segregating Waste"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white font-mono text-[10px]">
                  [image1 slot]
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold font-serif text-[#12372A]">
                  {lang === 'hi' ? 'जागरूक नागरिक' : '1. Conscious Citizens'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-2">
                  {lang === 'hi'
                    ? 'नागरिक अपने स्मार्टफोन कैमरे से कचरा तुरंत स्कैन करते हैं। मोबाइलनेटवी3 मॉडल उन्हें सूखा, गीला या रीसाइक्लेबल की सटीक पहचान कराता है।'
                    : 'Citizens scan household waste using the mobile AI camera, ensuring dry recyclables never contaminate municipal landfills at the source.'}
                </p>
              </div>
            </div>

            <Link
              to="/scanner"
              className="text-xs font-semibold text-[#1b4332] hover:underline inline-flex items-center gap-1 pt-2 border-t border-slate-100"
            >
              <span>{lang === 'hi' ? 'स्कैनर आज़माएं' : 'Try AI Scanner'}</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Division 2: Field Collectors (image2 placeholder) */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-sm transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              {/* IMAGE PLACEHOLDER: image2 */}
              <div className="h-44 rounded-2xl overflow-hidden bg-amber-50 border border-amber-100 relative group">
                <img
                  src="https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=600&q=80"
                  alt="image2 - Field Collection Fleet Dispatch"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white font-mono text-[10px]">
                  [image2 slot]
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold font-serif text-[#12372A]">
                  {lang === 'hi' ? 'संग्रहण दल (फील्ड कलेक्टर्स)' : '2. Field Collection Fleet'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-2">
                  {lang === 'hi'
                    ? 'सफाई वाहन दल को 6 और 12 घंटे पहले ही अतिप्रवाह जोखिम वाले डिब्बों का प्राथमिक मार्ग प्राप्त होता है ताकि कचरा समय पर एकत्र हो।'
                    : 'Sanitation drivers receive dynamically optimized dispatch routes prioritized by ML overflow risk, eliminating fuel waste and bin spillages.'}
                </p>
              </div>
            </div>

            <Link
              to="/login"
              className="text-xs font-semibold text-[#1b4332] hover:underline inline-flex items-center gap-1 pt-2 border-t border-slate-100"
            >
              <span>{lang === 'hi' ? 'कलेक्टर पोर्टल' : 'Collector Access'}</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Division 3: Municipal Administration (image3 placeholder) */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-sm transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              {/* IMAGE PLACEHOLDER: image3 */}
              <div className="h-44 rounded-2xl overflow-hidden bg-blue-50 border border-blue-100 relative group">
                <img
                  src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80"
                  alt="image3 - Municipal Command Center"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white font-mono text-[10px]">
                  [image3 slot]
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold font-serif text-[#12372A]">
                  {lang === 'hi' ? 'नगर निगम प्रशासन' : '3. Municipal Administration'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-2">
                  {lang === 'hi'
                    ? 'पूरे बेंगलुरु महानगर के 20 स्मार्ट डिब्बों की लाइव टेलीमेट्री, एमएल मॉडल सटीकता और नागरिक जागरूकता अभियानों की संपूर्ण निगरानी।'
                    : 'Urban administrators oversee real-time telemetry across 20 Bengaluru hubs, schedule civic drives, and monitor model performance.'}
                </p>
              </div>
            </div>

            <Link
              to="/login"
              className="text-xs font-semibold text-[#1b4332] hover:underline inline-flex items-center gap-1 pt-2 border-t border-slate-100"
            >
              <span>{lang === 'hi' ? 'प्रशासक लॉगिन' : 'Admin Login (2FA)'}</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

        </div>
      </section>

      {/* ─── 8. CITIZEN EVENTS & COMMUNITY DRIVES SECTION (NEW) ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              {lang === 'hi' ? 'नागरिक सहभागिता' : 'CITIZEN MOBILIZATION & DRIVES'}
            </div>
            <h2 className="text-3xl font-bold font-serif text-[#12372A]">
              {lang === 'hi' ? 'आगामी एवं सक्रिय कार्यक्रम' : 'Citizen Events & Drives'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {lang === 'hi'
                ? 'स्वच्छ बेंगलुरु के लिए सामुदायिक कार्यक्रमों में भाग लें। 1-क्लिक पंजीकरण पर तुरंत ईमेल पुष्टि प्राप्त करें।'
                : 'Join local cleanups, segregation workshops, and civic drives across Bengaluru Metropolitan.'}
            </p>
          </div>

          <Link
            to="/events"
            className="px-4 py-2 rounded-full border border-[#1b4332] text-[#1b4332] hover:bg-emerald-50 text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap"
          >
            <span>{lang === 'hi' ? 'सभी कार्यक्रम देखें' : 'View All Events'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {eventNotice && (
          <div className={`p-4 rounded-2xl text-xs sm:text-sm flex items-center gap-2.5 shadow-2xs ${
            eventNotice.type === 'success' 
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' 
              : 'bg-rose-50 text-rose-900 border border-rose-200'
          }`}>
            <MailCheck className="w-5 h-5 text-emerald-700 shrink-0" />
            <span>{eventNotice.msg}</span>
          </div>
        )}

        {loadingEvents ? (
          <div className="p-8 text-center text-slate-400">Loading civic events...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayEvents.map((ev) => (
              <div key={ev.id} className="rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between">
                <div>
                  <div className="h-44 relative bg-slate-100 overflow-hidden">
                    <img src={ev.image_url} alt={ev.title} className="w-full h-full object-cover" />
                    <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-white/95 text-[10px] font-bold text-emerald-900 shadow-2xs">
                      {ev.category}
                    </span>
                    <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 text-[10px] font-bold uppercase shadow-2xs">
                      {ev.status}
                    </span>
                  </div>

                  <div className="p-5 space-y-2.5">
                    <h3 className="font-bold font-serif text-[#12372A] text-base line-clamp-1">
                      {lang === 'hi' && ev.title_hi ? ev.title_hi : ev.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {lang === 'hi' && ev.description_hi ? ev.description_hi : ev.description}
                    </p>

                    <div className="pt-2 text-xs text-slate-600 space-y-1.5 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span>{new Date(ev.event_date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span className="truncate">{ev.location}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  {ev.is_registered ? (
                    <div className="w-full py-2 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{lang === 'hi' ? 'आप पंजीकृत हैं' : 'Registered ✓'}</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleRegisterEvent(ev.id, ev.title)}
                      disabled={registeringEventId === ev.id}
                      className="w-full py-2 rounded-full bg-[#1b4332] hover:bg-[#143527] text-white text-xs font-semibold shadow-2xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      <span>
                        {registeringEventId === ev.id 
                          ? (lang === 'hi' ? 'पंजीकरण...' : 'Registering...')
                          : (lang === 'hi' ? 'पंजीकरण करें (1-क्लिक)' : 'Register for Event')}
                      </span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─── 9. INTERACTIVE 20 SMART BINS PREVIEW (BENGALURU METROPOLITAN) ─── */}
      <section id="smart-bins" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              {lang === 'hi' ? 'वास्तविक समय नगर निगम टेलीमेट्री' : 'REAL-TIME MUNICIPAL TELEMETRY'}
            </div>
            <h2 className="text-3xl font-bold font-serif text-[#12372A]">
              {lang === 'hi' ? 'लाइव स्मार्ट बिन नेटवर्क (बेंगलुरु)' : 'Live Smart Bin Network (Bengaluru)'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {lang === 'hi'
                ? 'बेंगलुरु महानगर के २० प्रमुख केंद्रों पर लगे अल्ट्रासोनिक सेंसर द्वारा लाइव भराव स्तर और अतिप्रवाह जोखिम की निगरानी।'
                : 'Ultrasonic sensor telemetry streaming fill levels across 20 monitored Bengaluru Metropolitan hubs.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              <span>Live Telemetry Feed</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {bins.map((bin) => {
            const isCrit = bin.current_fill >= 80;
            const isWarn = bin.current_fill >= 55 && bin.current_fill < 80;
            return (
              <div key={bin.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-400">{bin.bin_code}</span>
                    <h4 className="font-bold text-base text-slate-800">{bin.location_name}</h4>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    isCrit ? 'bg-rose-100 text-rose-800' :
                    isWarn ? 'bg-amber-100 text-amber-800' :
                    'bg-emerald-100 text-emerald-800'
                  }`}>
                    {bin.status}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Fill Level</span>
                    <span className="font-bold font-mono text-slate-700">{bin.current_fill.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        isCrit ? 'bg-rose-500' : isWarn ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, bin.current_fill)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Type: {bin.waste_type}</span>
                  <span className="font-mono">{bin.capacity}L Capacity</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── INSPIRED BY ENVIRONMENTAL ACTION ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pt-4">
        <div className="text-center space-y-2 max-w-3xl mx-auto">
          <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
            {lang === 'hi' ? 'पर्यावरणीय पहलों से प्रेरित' : 'INSPIRED BY ENVIRONMENTAL ACTION'}
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-serif text-[#12372A]">
            {lang === 'hi' ? 'पर्यावरणीय पहलों से प्रेरित' : 'Inspired By Environmental Action'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto">
            {lang === 'hi'
              ? 'स्वच्छ और अधिक सतत भविष्य के निर्माण में संलग्न वैश्विक और राष्ट्रीय संगठन एवं पहलें।'
              : 'Organizations and initiatives advancing a cleaner, more sustainable future.'}
          </p>
        </div>

        {/* 12 Organizations Grid (4 cols desktop, 3 cols tablet, 2 cols mobile) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {INSPIRED_ORGANIZATIONS.map((org) => (
            <a
              key={org.name}
              href={org.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-emerald-600/40 hover:-translate-y-1 transition-all duration-300"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-2 group-hover:scale-105 group-hover:border-emerald-200 transition-all duration-300 overflow-hidden shadow-2xs">
                    <img
                      src={org.logo}
                      alt={`${org.name} logo`}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        if (e.currentTarget.nextElementSibling) {
                          e.currentTarget.nextElementSibling.classList.remove('hidden');
                        }
                      }}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                    <Globe className="w-6 h-6 text-emerald-700 hidden shrink-0" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100/60 group-hover:bg-emerald-100/80 transition-colors">
                    {org.tag}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#12372A] group-hover:text-emerald-800 transition-colors flex items-center gap-1.5">
                    <span>{org.name}</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 text-emerald-600" />
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                    {org.fullName}
                  </p>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 group-hover:text-emerald-700 transition-colors font-medium">
                <span>Visit Initiative</span>
                <span>→</span>
              </div>
            </a>
          ))}
        </div>

        {/* Required Educational & Thematic Reference Disclaimer */}
        <div className="text-center pt-2">
          <p className="text-[11px] text-slate-500 max-w-2xl mx-auto leading-relaxed italic">
            Featured organizations are shown for educational and thematic reference. This project is not affiliated with or endorsed by these organizations.
          </p>
        </div>
      </section>

      {/* ─── 9. NEWSLETTER SUBSCRIPTION CARD SECTION TOWARD FOOTER ─── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="p-8 sm:p-12 rounded-3xl bg-white border border-emerald-900/10 shadow-lg relative overflow-hidden">
          
          <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 rounded-full bg-emerald-50 pointer-events-none"></div>

          <div className="relative z-10 max-w-2xl mx-auto text-center space-y-4">
            <div className="flex justify-center mb-1">
              <img
                src="/project_logo.png"
                alt="ParyavaranSanrakshan"
                className="h-16 w-auto object-contain drop-shadow-sm"
              />
            </div>

            <h3 className="text-2xl sm:text-3xl font-bold font-serif text-[#12372A]">
              Stay Connected With ParyavaranSanrakshan
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl mx-auto">
              Subscribe to the Paryavaran Patrika for weekly updates on urban waste classification, tree plantation drives, and smart community sustainability practices.
            </p>

            <form onSubmit={handleSubscribe} className="pt-2 flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto">
              <input
                type="email"
                required
                value={newsEmail}
                onChange={(e) => setNewsEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full px-4 py-3 rounded-full border border-slate-300 text-sm focus:outline-none focus:border-emerald-600 shadow-2xs"
              />
              <button
                type="submit"
                disabled={subscribing}
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#1b4332] hover:bg-[#143527] text-white text-sm font-semibold shadow-sm transition-all whitespace-nowrap flex items-center justify-center gap-2"
              >
                <span>{subscribing ? 'Subscribing...' : 'Subscribe'}</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

            {newsletterStatus && (
              <div className={`p-3 rounded-xl text-xs font-semibold ${
                newsletterStatus.success 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {newsletterStatus.message}
              </div>
            )}

            <p className="text-[11px] text-slate-400">
              We respect your privacy. Zero spam, unsubscribe anytime.
            </p>
          </div>

        </div>
      </section>

      {/* ─── MODAL: READ FULL FEATURED ACTIVITY STORY ─── */}
      {selectedBlog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setSelectedBlog(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {selectedBlog.image_url && (
              <div className="h-56 rounded-2xl overflow-hidden mb-5">
                <img
                  src={selectedBlog.image_url}
                  alt={selectedBlog.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  {selectedBlog.category}
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(selectedBlog.created_at).toLocaleDateString()}
                </span>
              </div>

              <h2 className="text-2xl font-bold font-serif text-[#12372A]">
                {lang === 'hi' && selectedBlog.title_hi ? selectedBlog.title_hi : selectedBlog.title}
              </h2>

              <p className="text-sm font-semibold text-slate-600 italic">
                {lang === 'hi' && selectedBlog.summary_hi ? selectedBlog.summary_hi : selectedBlog.summary}
              </p>

              <div className="text-sm text-slate-700 leading-relaxed space-y-3 pt-2 border-t border-slate-100">
                <p>
                  {lang === 'hi' && selectedBlog.content_hi ? selectedBlog.content_hi : selectedBlog.content}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setSelectedBlog(null)}
                  className="px-5 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}



    </div>
  );
};
