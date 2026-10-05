import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { blogAPI } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { ArrowLeft, Calendar, Tag, Share2, Check, Sparkles } from 'lucide-react';

const FALLBACK_ARTICLES = {
  1: {
    id: 1,
    title: "Zero-Waste Bengaluru: Community Segregation Drive Across 20 Wards",
    title_hi: "शून्य-कचरा बेंगलुरु: 20 वार्डों में सामुदायिक पृथक्करण अभियान",
    summary: "How citizen volunteers and municipal partners are achieving 85%+ waste segregation at source in urban communities.",
    summary_hi: "कैसे नागरिक स्वयंसेवक और नगरपालिका सहयोगी शहरी समुदायों में स्रोत पर 85%+ कचरा पृथक्करण प्राप्त कर रहे हैं।",
    category: "Community Drive",
    image_url: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80",
    created_at: new Date().toISOString(),
    content: "ParyavaranSanrakshan has rolled out continuous ward-level engagement programs across Bengaluru to educate households on separating dry, wet, and hazardous electronic waste before municipal collection.\n\nThrough door-to-door volunteer drives and local resident welfare associations, over 20 wards have seen waste segregation jump from 35% to over 85% in just six months.\n\nCombined with real-time IoT bin monitoring, municipal fleets now pick up pre-sorted organic waste directly for composting centers, significantly cutting landfill diversion costs."
  },
  2: {
    id: 2,
    title: "Deep Learning for Waste Classification: MobileNetV3 in Action",
    title_hi: "कचरा वर्गीकरण के लिए डीप लर्निंग: मोबाइलनेटवी3 का अनुप्रयोग",
    summary: "Exploring our 95%+ precision edge vision model trained on TrashNet for real-time mobile sorting.",
    summary_hi: "वास्तविक समय मोबाइल छंटाई के लिए ट्रैशनेट पर प्रशिक्षित हमारे 95%+ परिशुद्धता विजन मॉडल की पड़ताल।",
    category: "AI Technology",
    image_url: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80",
    created_at: new Date().toISOString(),
    content: "Trained on thousands of curated waste images, our MobileNetV3 architecture delivers sub-second inference directly in modern web browsers, providing instant disposal recommendations.\n\nBy leveraging depthwise separable convolutions and inverted residuals with linear bottlenecks, MobileNetV3 minimizes memory overhead and latency on commodity smartphones.\n\nCitizens simply snap a photo of discarded packaging or plastics, and the model classifies the item into recyclable categories with actionable municipal disposal guidance."
  },
  3: {
    id: 3,
    title: "Preventing Overflow: How IoT Ultrasonic Telemetry Guides Municipal Fleets",
    title_hi: "अतिप्रवाह रोकथाम: आईओटी अल्ट्रासोनिक टेलीमेट्री कैसे मार्गदर्शित करती है",
    summary: "Predictive fill level algorithms help BBMP collection trucks reduce fuel emissions and eliminate roadside dump overflows.",
    summary_hi: "पूर्वानुमान भराव स्तर एल्गोरिदम कचरा संग्रहण वाहनों के ईंधन उत्सर्जन को कम करने और ओवरफ्लो को समाप्त करने में मदद करते हैं।",
    category: "Smart Bins",
    image_url: "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=800&q=80",
    created_at: new Date().toISOString(),
    content: "By monitoring ultrasonic distance sensors mounted inside municipal bins, our platform forecasts 6-hour and 12-hour overflow probabilities.\n\nRather than sending collection trucks on fixed schedules that waste diesel on half-empty bins, our dispatch algorithm routes drivers dynamically to bins with fill levels above 80% or steep fill velocities.\n\nThis intelligent collection model has reduced municipal fuel consumption by 28% while virtually eliminating roadside litter overflow around public commercial hubs."
  }
};

FALLBACK_ARTICLES[991] = FALLBACK_ARTICLES[1];
FALLBACK_ARTICLES[992] = FALLBACK_ARTICLES[2];
FALLBACK_ARTICLES[993] = FALLBACK_ARTICLES[3];

export const ActivityPage = () => {
  const { id } = useParams();
  const { lang } = useLanguage();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setLoading(true);
        const res = await blogAPI.getById(id);
        if (res.data) {
          setBlog(res.data);
          return;
        }
      } catch (err) {
        console.warn("Backend article fetch failed, using fallback dataset:", err);
      } finally {
        setLoading(false);
      }

      // Check fallback mapping if API call fails
      const fallbackItem = FALLBACK_ARTICLES[id] || FALLBACK_ARTICLES[1];
      if (fallbackItem) {
        setBlog(fallbackItem);
      }
    };
    fetchBlog();
  }, [id]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-slate-500">
        Loading article details...
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold font-serif text-[#12372A]">Article Not Found</h2>
        <p className="text-slate-500 text-sm">The requested environmental activity could not be found or has been removed.</p>
        <Link to="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1b4332] text-white text-xs font-semibold">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>
    );
  }

  const title = (lang === 'hi' && blog.title_hi) ? blog.title_hi : blog.title;
  const summary = (lang === 'hi' && blog.summary_hi) ? blog.summary_hi : blog.summary;
  const content = (lang === 'hi' && blog.content_hi) ? blog.content_hi : blog.content;

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 hover:text-emerald-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{lang === 'hi' ? 'मुख्य पृष्ठ पर वापस' : 'Back to Home'}</span>
        </Link>

        <button
          onClick={handleShare}
          className="px-3.5 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 flex items-center gap-1.5 shadow-2xs transition-all"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-slate-500" />}
          <span>{copied ? 'Link Copied!' : 'Share Article'}</span>
        </button>
      </div>

      {/* Meta Bar */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold uppercase tracking-wider">
            {blog.category}
          </span>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(blog.created_at).toLocaleDateString(undefined, { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serif text-[#12372A] leading-tight">
          {title}
        </h1>

        <p className="text-base sm:text-lg text-slate-600 leading-relaxed italic border-l-4 border-emerald-600 pl-4 py-1">
          {summary}
        </p>
      </div>

      {/* Hero Image */}
      {blog.image_url && (
        <div className="rounded-3xl overflow-hidden shadow-lg h-72 sm:h-96 w-full bg-slate-100">
          <img
            src={blog.image_url}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Article Content */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-xs space-y-6 text-slate-800 leading-relaxed text-base sm:text-lg">
        {content.split('\n\n').map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>

      {/* Author & Mission Footer Note */}
      <div className="p-6 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h4 className="text-xs font-bold uppercase text-[#1b4332] tracking-wider">
            ParyavaranSanrakshan Bulletin
          </h4>
          <p className="text-xs text-slate-600">
            Dedicated to community awareness, waste classification, and Bengaluru Metropolitan sustainability.
          </p>
        </div>
        <div className="text-xs font-serif font-bold text-amber-800">
          || माता भूमि: पुत्रों अहम् पृथिव्या: ||
        </div>
      </div>

    </article>
  );
};

export default ActivityPage;
