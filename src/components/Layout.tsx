import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Navbar from './Navbar';
import BottomDock from './BottomDock';
import Footer from './Footer';
import { AIAssistant } from './AIAssistant';
import { SpotlightSearch } from './SpotlightSearch';
import { api } from '../services/api';
import { ResponsiveLayoutProvider, ResponsiveLayoutWrapper } from './ResponsiveLayoutWrapper';
import { useAuth } from '../context/AuthContext';
import MaintenanceScreen from './MaintenanceScreen';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const location = useLocation();
  const { userData } = useAuth();
  const [settings, setSettings] = useState<any>(null);
  const [identity, setIdentity] = useState<any>(null);
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);

  useEffect(() => {
    const handleOpenSpotlight = () => setIsSpotlightOpen(true);
    window.addEventListener('open-spotlight', handleOpenSpotlight);
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // CMD+K or CTRL+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSpotlightOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('open-spotlight', handleOpenSpotlight);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/api/settings');
        const data = res.data;
        
        // Parse JSON fields
        const parsedData = {
          ...data,
          siteName: data.siteName ? JSON.parse(data.siteName) : null,
          seoTitle: data.seoTitle ? JSON.parse(data.seoTitle) : null,
          seoDescription: data.seoDescription ? JSON.parse(data.seoDescription) : null,
          seoKeywords: data.seoKeywords ? JSON.parse(data.seoKeywords) : null,
          address: data.address ? JSON.parse(data.address) : null,
          socialLinks: data.socialLinks ? JSON.parse(data.socialLinks) : null,
        };
        
        setSettings(parsedData);
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };

    const fetchIdentity = async () => {
      try {
        const res = await api.get('/api/institution-identity');
        if (res.data) {
          setIdentity(res.data);
          // Dynamically apply properties of color settings to CSS
          const primaryStr = res.data.primaryColor || '#1e3a8a';
          const secondaryStr = res.data.secondaryColor || '#3b82f6';
          const accentStr = res.data.accentColor || '#10b981';
          
          document.documentElement.style.setProperty('--primary-color-dyn', primaryStr);
          document.documentElement.style.setProperty('--secondary-color-dyn', secondaryStr);
          document.documentElement.style.setProperty('--accent-color-dyn', accentStr);
        }
      } catch (error) {
        console.error("Error fetching identity:", error);
      }
    };

    fetchSettings();
    fetchIdentity();
  }, []);

  const siteName = settings?.siteName?.[i18n.language] || (isRtl ? 'بيت الصحافة - اليمن' : 'PressHouse - Yemen');
  const seoTitle = settings?.seoTitle?.[i18n.language] || siteName;
  const seoDescription = settings?.seoDescription?.[i18n.language] || (isRtl 
    ? 'بيت الصحافة - مؤسسة إعلامية مستقلة تعنى بحرية الصحافة وبناء قدرات الصحفيين في اليمن. نعمل على تعزيز قيم العدالة والمساءلة وحماية الحريات الإعلامية.' 
    : 'PressHouse - An independent media institution concerned with press freedom and building the capacity of journalists in Yemen. We work to promote values of justice, accountability and protect media freedoms.');
  const seoKeywords = settings?.seoKeywords?.[i18n.language] || (isRtl 
    ? 'بيت الصحافة، صحافة اليمن، حماية الصحفيين، حرية الإعلام، تدريب صحفي، انتهاكات إعلامية' 
    : 'PressHouse, Yemen Journalism, Journalist Protection, Media Freedom, Journalism Training, Media Violations');

  const ADMIN_PATH = import.meta.env.VITE_ADMIN_PATH || '/admin';
  const ROOT_PATH = import.meta.env.VITE_ROOT_PATH || '/root';

  const isDashboard = 
    location.pathname.startsWith(ADMIN_PATH) || 
    location.pathname.startsWith(ROOT_PATH) || 
    location.pathname.startsWith('/admin') || 
    location.pathname.startsWith('/root') || 
    location.pathname.startsWith('/staff') || 
    location.pathname.startsWith('/profile');

  const isPrivileged = userData && ['root', 'admin', 'staff', 'editor'].includes(userData.role);
  const isMaintenanceActive = settings?.maintenanceMode === 1 && !isPrivileged && !isDashboard && location.pathname !== '/login' && location.pathname !== '/admin/login';

  if (isMaintenanceActive) {
    return (
      <ResponsiveLayoutProvider>
        <MaintenanceScreen settings={settings} />
      </ResponsiveLayoutProvider>
    );
  }

  return (
    <ResponsiveLayoutProvider>
      <div className={isRtl ? 'rtl' : 'ltr'}>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta name="keywords" content={seoKeywords} />
        <meta name="author" content={siteName} />
        <meta name="application-name" content={siteName} />
        <meta name="generator" content="PressHouse CMS" />
        
        {/* Verification */}
        {settings?.googleVerification && <meta name="google-site-verification" content={settings.googleVerification} />}
        {settings?.bingVerification && <meta name="msvalidate.01" content={settings.bingVerification} />}
        
        {/* Geographic Metadata */}
        <meta name="geo.region" content="YE" />
        <meta name="geo.placename" content="Sanaa, Yemen" />
        <meta name="geo.position" content="15.35;44.20" />
        <meta name="ICBM" content="15.35, 44.20" />
        <meta name="ICBM" content="15.35, 44.20" />

        {/* Themes */}
        <meta name="theme-color" content={settings?.primaryColor || "#2563eb"} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content={settings?.ogType || "website"} />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:site_name" content={settings?.ogSiteName || siteName} />
        <meta property="og:locale" content={isRtl ? 'ar_YE' : 'en_US'} />
        {(settings?.ogDefaultImage || settings?.logo) && (
          <meta property="og:image" content={settings?.ogDefaultImage || settings?.logo} />
        )}

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={window.location.href} />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        {(settings?.ogDefaultImage || settings?.logo) && (
          <meta name="twitter:image" content={settings?.ogDefaultImage || settings?.logo} />
        )}

        {/* Additional Identity Meta */}
        <meta name="org:name" content={siteName} />
        <meta name="org:foundingDate" content="2014" />
        <meta name="org:location" content="Yemen" />

        {settings?.favicon && <link rel="icon" href={settings.favicon} />}
      </Helmet>
      {!isDashboard && <Navbar />}
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={isDashboard ? "" : "min-h-screen pb-24"}
        >
          <ResponsiveLayoutWrapper>
            {children}
          </ResponsiveLayoutWrapper>
        </motion.main>
      </AnimatePresence>
      {!isDashboard && <AIAssistant />}
      {!isDashboard && <SpotlightSearch isOpen={isSpotlightOpen} onClose={() => setIsSpotlightOpen(false)} />}
      {!isDashboard && <BottomDock />}
      {!isDashboard && <Footer />}
      </div>
    </ResponsiveLayoutProvider>
  );
}
