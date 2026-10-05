import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const translations = {
  en: {
    langName: "English",
    langCode: "EN",
    langSymbol: "A",
    navHome: "Home",
    navAbout: "About Us",
    navEvents: "Events",
    navPillars: "Four Pillars",
    navActivities: "Featured Activities",
    navOrganised: "Organisation",
    navScanner: "AI Waste Scanner",
    navDashboard: "Dashboard",
    navLogin: "Login",
    navRegister: "Register",
    navLogout: "Logout",
    navAdmin: "Admin Portal",
    
    // Hero & Quotes
    sanskritQuote1: "Caring for the earth,",
    sanskritQuote2: "as one cares for a mother.",
    sanskritMantra: "|| माता भूमि: पुत्रों अहम् पृथिव्या: ||",
    sanskritMantraMeaning: "Earth is my mother, and I am her child",
    heroTitle: "Smarter Waste. Cleaner Communities.",
    heroSubtitle: "AI-powered waste identification and smart-bin intelligence for cleaner, more sustainable communities across Bengaluru Metropolitan.",
    heroCTA1: "Scan Waste",
    heroCTA2: "Explore Smart Bins",

    // Four Pillars of Action
    pillarsPill: "FOUR PILLARS OF ACTION",
    pillarsTitle: "Four Pillars of Action",
    pillarsSubtitle: "Four intelligent solutions driving cleaner, smarter communities",
    pillar1Title: "AI Waste Classification",
    pillar1Desc: "Identify waste instantly using AI-powered image classification and receive the right disposal guidance.",
    pillar2Title: "Smart Bin Intelligence",
    pillar2Desc: "Monitor bin fill levels and use ML predictions to detect bins that may require attention.",
    pillar3Title: "Smart Collection",
    pillar3Desc: "Prioritize critical and high-risk bins so waste collection can happen at the right time.",
    pillar4Title: "Sustainable Communities",
    pillar4Desc: "Support cleaner neighborhoods through responsible waste segregation, efficient collection, and SDG 11-focused innovation.",

    // How We're Organised
    howOrganisedTitle: "How We're Organised",
    howOrganisedSubtitle: "An integrated civic technology framework uniting Citizens, Field Collection Teams, and Urban Municipal Administration.",
    roleCitizenTitle: "Conscious Citizens",
    roleCitizenDesc: "Identify recyclable materials instantly with the live camera scanner, find clean smart bins, and participate in community drives.",
    roleCollectorTitle: "Field Collectors",
    roleCollectorDesc: "Receive real-time high-risk overflow alerts, access optimal collection routes, and verify bin clearances on-the-go.",
    roleAdminTitle: "Municipal Administration",
    roleAdminDesc: "Citywide Bengaluru Metropolitan bin telemetry overview, ML model performance monitoring, and civic drive management.",

    // Events
    eventsTitle: "Citizen Events & Community Drives",
    eventsSubtitle: "Join upcoming green drives, segregation workshops, and civic cleanups across Bengaluru Metropolitan.",
    tabUpcoming: "Upcoming",
    tabOngoing: "Ongoing",
    tabCompleted: "Completed",
    registerEvent: "Register for Event",
    registeredSuccess: "Registered",
    alreadyRegistered: "Already Registered",
    eventFull: "Full",

    // Featured Activities
    activitiesTitle: "Featured Activities",
    activitiesSubtitle: "Live environmental initiatives and community updates from Bengaluru.",
    readStory: "Read Article",
    noActivities: "No featured activities published yet.",

    // Newsletter
    newsletterTitle: "Stay Connected With The Green Movement",
    newsletterSubtitle: "Subscribe to our periodic bulletin for updates on clean community drives, waste segregation guidelines, and municipal telemetry reports.",
    newsletterPlaceholder: "Enter your email address",
    newsletterButton: "Subscribe",
    newsletterSuccess: "Thank you for subscribing to ParyavaranSanrakshan updates!",
    newsletterError: "Subscription failed. Please check your email and try again.",

    // Footer
    footerDesc: "ParyavaranSanrakshan is dedicated to sustainable urban living, intelligent waste segregation, and ecological conservation across Bengaluru Metropolitan.",
    quickLinks: "Quick Navigation",
    contactUs: "Contact & Community",
    contactEmail: "info.karuneshtiwari@gmail.com",
    copyright: "© 2026 ParyavaranSanrakshan. All rights reserved. Dedicated to Mother Earth."
  },
  hi: {
    langName: "हिन्दी",
    langCode: "HI",
    langSymbol: "अ",
    navHome: "होम",
    navAbout: "हमारे बारे में",
    navEvents: "कार्यक्रम",
    navPillars: "चार स्तंभ",
    navActivities: "प्रमुख गतिविधियाँ",
    navOrganised: "संगठन संरचना",
    navScanner: "एआई स्कैनर",
    navDashboard: "डैशबोर्ड",
    navLogin: "लॉगिन",
    navRegister: "पंजीकरण",
    navLogout: "लॉगआउट",
    navAdmin: "प्रशासक पोर्टल",

    // Hero & Quotes
    sanskritQuote1: "धरती की देखभाल ऐसे करें,",
    sanskritQuote2: "जैसे कोई अपनी माँ की करता है।",
    sanskritMantra: "|| माता भूमि: पुत्रों अहम् पृथिव्या: ||",
    sanskritMantraMeaning: "पृथ्वी मेरी माता है और मैं उसका पुत्र हूँ",
    heroTitle: "स्मार्ट कचरा प्रबंधन। स्वच्छ समुदाय।",
    heroSubtitle: "अधिक टिकाऊ और स्वच्छ समुदायों के लिए एआई-संचालित कचरा पहचान और स्मार्ट-बिन इंटेलिजेंस।",
    heroCTA1: "कचरा स्कैन करें",
    heroCTA2: "स्मार्ट डिब्बे देखें",

    // Four Pillars of Action
    pillarsPill: "कार्रवाई के चार स्तंभ",
    pillarsTitle: "कार्रवाई के चार स्तंभ",
    pillarsSubtitle: "स्वच्छ और स्मार्ट समुदायों के लिए चार बौद्धिक समाधान",
    pillar1Title: "एआई कचरा वर्गीकरण",
    pillar1Desc: "एआई-संचालित छवि वर्गीकरण का उपयोग करके तुरंत कचरे की पहचान करें और सही निस्तारण मार्गदर्शन प्राप्त करें।",
    pillar2Title: "स्मार्ट बिन इंटेलिजेंस",
    pillar2Desc: "कचरे के स्तर की निगरानी करें और एमएल पूर्वानुमानों से उन डिब्बों का पता लगाएं जिन पर ध्यान देने की आवश्यकता है।",
    pillar3Title: "स्मार्ट संग्रह",
    pillar3Desc: "गंभीर और उच्च-जोखिम वाले डिब्बों को प्राथमिकता दें ताकि कचरा संग्रह सही समय पर हो सके।",
    pillar4Title: "टिकाऊ समुदाय",
    pillar4Desc: "जिम्मेदार कचरा पृथक्करण, कुशल संग्रह और एसडीजी 11-केंद्रित नवाचार के माध्यम से स्वच्छ पड़ोस का समर्थन करें।",

    // How We're Organised
    howOrganisedTitle: "हमारा संगठन कैसे काम करता है",
    howOrganisedSubtitle: "नागरिकों, स्वच्छता कर्मचारियों और नगर निगम प्रशासन का एक सुदृढ़ एकीकृत तंत्र।",
    roleCitizenTitle: "जागरूक नागरिक",
    roleCitizenDesc: "मोबाइल कैमरे से तुरंत कचरा पहचानें और निकटतम खाली स्मार्ट डिब्बे में सही जगह डालें।",
    roleCollectorTitle: "संग्रहण दल (कलेक्टर)",
    roleCollectorDesc: "अतिप्रवाह जोखिम वाले डिब्बों की लाइव सूची प्राप्त करें और त्वरित संग्रह दर्ज करें।",
    roleAdminTitle: "नगर निगम प्रशासन",
    roleAdminDesc: "पूरे बेंगलुरु की लाइव स्थिति, मॉडल सटीकता, गतिविधियाँ एवं अभियान प्रबंधन एक ही जगह से करें।",

    // Events
    eventsTitle: "नागरिक कार्यक्रम एवं अभियान",
    eventsSubtitle: "बेंगलुरु में आयोजित स्वच्छता अभियानों, कार्यशालाओं और पर्यावरण गतिविधियों से जुड़ें।",
    tabUpcoming: "आगामी",
    tabOngoing: "वर्तमान",
    tabCompleted: "संपन्न",
    registerEvent: "कार्यक्रम के लिए पंजीकरण करें",
    registeredSuccess: "पंजीकृत",
    alreadyRegistered: "पहले से पंजीकृत",
    eventFull: "स्थान पूर्ण",

    // Featured Activities
    activitiesTitle: "प्रमुख गतिविधियाँ",
    activitiesSubtitle: "प्रशासक द्वारा प्रकाशित पर्यावरण अभियान और सामुदायिक समाचार।",
    readStory: "लेख पढ़ें",
    noActivities: "वर्तमान में कोई गतिविधि उपलब्ध नहीं है।",

    // Newsletter
    newsletterTitle: "पर्यावरण आंदोलन से जुड़े रहें",
    newsletterSubtitle: "कचरा वर्गीकरण, स्वच्छता अभियानों और नगर निगम रिपोर्ट की जानकारी सीधे अपने ईमेल पर प्राप्त करें।",
    newsletterPlaceholder: "अपना ईमेल पता दर्ज करें",
    newsletterButton: "सदस्यता लें",
    newsletterSuccess: "पर्यावरण संरक्षण से जुड़ने के लिए धन्यवाद!",
    newsletterError: "सदस्यता असफल रही। कृपया पुनः प्रयास करें।",

    // Footer
    footerDesc: "पर्यावरण संरक्षण सतत विकास, जिम्मेदार कचरा पृथक्करण और प्रकृति संवर्धन के प्रति समर्पित है।",
    quickLinks: "त्वरित लिंक",
    contactUs: "संपर्क एवं सहायता",
    contactEmail: "info.karuneshtiwari@gmail.com",
    copyright: "© 2026 पर्यावरण संरक्षण। सर्वाधिकार सुरक्षित। धरती माता को सादर समर्पित।"
  }
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem('paryavaran_lang') || 'en');

  useEffect(() => {
    localStorage.setItem('paryavaran_lang', lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const toggleLanguage = () => {
    setLang(prev => (prev === 'en' ? 'hi' : 'en'));
  };

  const t = translations[lang] || translations.en;

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
