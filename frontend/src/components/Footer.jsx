import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { ArrowUp, Mail, Globe, ExternalLink } from 'lucide-react';

export const Footer = () => {
  const { lang } = useLanguage();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#0f2a20] text-slate-300 border-t border-emerald-950/80">
      
      {/* Top Sacred Banner */}
      <div className="bg-[#0a1e17] py-4 border-b border-emerald-900/40 px-4 text-center">
        <div className="max-w-4xl mx-auto space-y-1">
          <p className="text-xs sm:text-sm text-emerald-200/80 italic font-serif">
            {lang === 'hi'
              ? '"पृथ्वी की रक्षा करें, जैसे एक माँ की सेवा की जाती है।"'
              : '"Caring for the earth, as one cares for a mother."'}
          </p>
          <p className="text-sm sm:text-base font-bold font-serif text-amber-300/90 tracking-wider">
            || माता भूमि: पुत्रों अहम् पृथिव्या: ||
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* Column 1: Brand & Identity (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <img 
                src="/project_logo.png" 
                alt="ParyavaranSanrakshan" 
                className="h-12 w-auto object-contain drop-shadow-sm" 
              />
              <div>
                <h3 className="text-lg font-bold text-white font-serif tracking-tight">
                  ParyavaranSanrakshan
                </h3>
                <span className="text-[11px] text-emerald-400 font-medium">
                  {lang === 'hi' ? 'स्मार्ट पर्यावरण एवं अपशिष्ट प्रबंधन' : 'Smart Environmental & Waste Intelligence'}
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-emerald-100/70 leading-relaxed max-w-md">
              {lang === 'hi'
                ? 'स्मार्ट अपशिष्ट वर्गीकरण, वास्तविक समय बिन टेलीमेट्री और सतत सामुदायिक पहलों के माध्यम से स्वच्छ भारत एवं यूएन एसडीजी 11 का समर्थन।'
                : 'Empowering urban communities with edge AI waste classification, ultrasonic bin telemetry, and citizen drives for cleaner, resilient neighborhoods.'}
            </p>

            <div className="pt-1 flex items-center gap-2.5">
              <a
                href="https://www.facebook.com/karuneshkumar.tiwari.1"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-full bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800/40 text-emerald-300 hover:text-white transition-colors"
                title="Facebook"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/in/karunesh-kumar-tiwari-72474a330"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-full bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800/40 text-emerald-300 hover:text-white transition-colors"
                title="LinkedIn"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
              <a
                href="https://x.com/karunesh108"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-full bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800/40 text-emerald-300 hover:text-white transition-colors"
                title="X (Twitter)"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://wa.me/+917991541531"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-full bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800/40 text-emerald-300 hover:text-white transition-colors"
                title="WhatsApp"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.301-.15-1.778-.877-2.054-.977-.275-.1-.476-.15-.677.15-.202.3-.778.977-.954 1.178-.175.201-.351.226-.652.075-.301-.15-1.272-.469-2.423-1.496-.895-.798-1.5-1.784-1.675-2.085-.175-.301-.019-.464.132-.614.136-.134.301-.351.452-.527.15-.175.201-.3.301-.501.101-.201.05-.376-.025-.526-.075-.15-.677-1.632-.928-2.235-.245-.588-.493-.508-.677-.518-.175-.008-.376-.01-.577-.01-.201 0-.527.075-.802.376s-1.053 1.028-1.053 2.508 1.079 2.909 1.229 3.11c.15.201 2.122 3.24 5.141 4.544.718.31 1.278.496 1.716.635.722.23 1.38.197 1.9.12.579-.087 1.778-.727 2.029-1.429.251-.702.251-1.304.175-1.429-.075-.125-.276-.201-.577-.351zM12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.174L2 22l4.982-1.408A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" />
                </svg>
              </a>
              <a
                href="mailto:info.karuneshtiwari@gmail.com"
                className="p-2.5 rounded-full bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800/40 text-emerald-300 hover:text-white transition-colors"
                title="Contact Email"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links (3 cols on lg) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-serif underline decoration-emerald-500 underline-offset-4">
              {lang === 'hi' ? 'मेन्यू' : 'Menu'}
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-emerald-100/70">
              <li>
                <Link to="/" className="hover:text-emerald-300 transition-colors">
                  {lang === 'hi' ? 'होम' : 'Home'}
                </Link>
              </li>
              <li>
                <Link to="/scanner" className="hover:text-emerald-300 transition-colors">
                  {lang === 'hi' ? 'एआई कचरा स्कैनर' : 'AI Waste Scanner'}
                </Link>
              </li>
              <li>
                <Link to="/#smart-bins" className="hover:text-emerald-300 transition-colors">
                  {lang === 'hi' ? 'स्मार्ट डिब्बे' : 'Smart Bins'}
                </Link>
              </li>
              <li>
                <Link to="/events" className="hover:text-emerald-300 transition-colors">
                  {lang === 'hi' ? 'कार्यक्रम' : 'Events'}
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-emerald-300 transition-colors">
                  {lang === 'hi' ? 'हमारे बारे में' : 'About'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact & Back to Top (4 cols on lg) */}
          <div className="lg:col-span-4 space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-serif">
              {lang === 'hi' ? 'संपर्क एवं सहायता' : 'Get in Touch'}
            </h4>

            <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-800/40 text-xs text-emerald-200 space-y-2">
              <div className="flex items-center gap-2 text-emerald-300">
                <Mail className="w-4 h-4 shrink-0" />
                <a
                  href="mailto:info.karuneshtiwari@gmail.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs hover:underline text-emerald-200"
                >
                  info.karuneshtiwari@gmail.com
                </a>
              </div>
              <p className="text-[11px] text-emerald-100/60 leading-relaxed">
                {lang === 'hi'
                  ? 'नागरिक सहभागिता, स्मार्ट बिन एकीकरण एवं अनुसंधान पूछताछ के लिए उपलब्ध।'
                  : 'Open for civic partnerships, research collaborations, and municipal pilots.'}
              </p>
            </div>

            <button
              onClick={scrollToTop}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 hover:text-white border border-emerald-700/50 text-xs font-semibold transition-all cursor-pointer shadow-2xs hover:shadow-md"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'शीर्ष पर वापस जाएं' : 'Back to Top'}</span>
            </button>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-emerald-900/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-emerald-100/60">
          <div>
            © 2026 ParyavaranSanrakshan. {lang === 'hi' ? 'सर्वाधिकार सुरक्षित।' : 'All rights reserved.'}
          </div>
          <div className="flex items-center gap-4 text-[12px]">
            <span className="text-emerald-400 font-medium">Designed by Karunesh Kumar Tiwari</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
