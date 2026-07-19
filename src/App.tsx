import React, { Suspense, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Live from './pages/Live';
import About from './pages/About';
import News from './pages/News';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import ArticleDetail from './pages/ArticleDetail';
import Violations from './pages/Violations';
import Academy from './pages/Academy';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import Tenders from './pages/Tenders';
import Contact from './pages/Contact';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import WorkplacePolicy from './pages/WorkplacePolicy';
import Search from './pages/Search';
import ProjectsDemo from './pages/ProjectsDemo';
import ProjectDetail from './pages/ProjectDetail';
import Membership from './pages/Membership';
import LegalPage from './pages/LegalPage';
import AdminDashboard from './pages/admin/Dashboard';
import LoginPage from './pages/admin/LoginPage';
import RootDashboard from './pages/root/Dashboard';
import StaffDashboard from './pages/staff/Dashboard';
import JournalistDashboard from './pages/journalist/Dashboard';
import EditorDashboard from "./pages/editor/Dashboard";
import LawyerDashboard from "./pages/lawyer/Dashboard";
import TrainerDashboard from "./pages/trainer/Dashboard";
import MediaProductDetail from './pages/MediaProductDetail';
import VerifyCertificate from './pages/VerifyCertificate';
import VolunteerPortal from './pages/VolunteerPortal';
import VolunteerOpportunityDetail from './pages/VolunteerOpportunityDetail';
import WednesdayCinema from './pages/WednesdayCinema';
import VideoGallery from './pages/VideoGallery';
import MaintenancePage from './components/MaintenancePage';
import { PageLoader } from './components/PageLoader';
import './i18n';

import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

import { motion, AnimatePresence } from 'motion/react';
import { HelmetProvider } from 'react-helmet-async';

const ADMIN_PATH = import.meta.env.VITE_ADMIN_PATH || '/admin';
const ROOT_PATH = import.meta.env.VITE_ROOT_PATH || '/root';
const IS_MAINTENANCE = import.meta.env.VITE_MAINTENANCE_MODE === 'true';

// Route change loader
const RouteTracker = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    // Send GA pageview
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'page_view', {
        page_path: location.pathname + location.search
      });
    }

    setIsNavigating(true);
    const timeout = setTimeout(() => {
      setIsNavigating(false);
    }, 500); // 500ms delay to simulate loading or wait for render
    return () => clearTimeout(timeout);
  }, [location.pathname, location.search]);

  return (
    <>
      <AnimatePresence>
        {isNavigating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-50/50 backdrop-blur-sm flex items-center justify-center pointer-events-none"
          >
            <PageLoader />
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </>
  );
};

const ProtectedRoutes = () => {
  const { userData } = useAuth();
  const location = useLocation();
  
  // Exclude auth routes and dashboard paths from maintenance mode lock
  const isDashboardRoute = location.pathname.startsWith(ADMIN_PATH) || 
                           location.pathname.startsWith(ROOT_PATH) || 
                           location.pathname.startsWith('/staff') || 
                           location.pathname.startsWith('/profile');
  const isAuthRoute = location.pathname === '/login' || 
                      location.pathname === '/admin/login' || 
                      location.pathname === '/register';

  if (IS_MAINTENANCE && !isDashboardRoute && !isAuthRoute && (!userData || !['root', 'admin', 'staff', 'editor', 'lawyer', 'trainer', 'journalist', 'content_creator'].includes(userData.role))) {
    return <MaintenancePage />;
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/admin/login" element={<LoginPage />} />
      <Route path="/register" element={<Register />} />
      <Route path="/live" element={<Live />} />
      <Route path="/about" element={<About />} />
      <Route path="/news" element={<News />} />
      <Route path="/news/:id" element={<ArticleDetail />} />
      <Route path="/events" element={<Events />} />
      <Route path="/events/:id" element={<EventDetail />} />
      <Route path="/violations" element={<Violations />} />
      <Route path="/academy" element={<Academy />} />
      <Route path="/jobs" element={<Jobs />} />
      <Route path="/jobs/:id" element={<JobDetail />} />
      <Route path="/tenders" element={<Tenders />} />
      <Route path="/projects" element={<ProjectsDemo />} />
      <Route path="/projects/:id" element={<ProjectDetail />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/policy" element={<WorkplacePolicy />} />
      <Route path="/search" element={<Search />} />
      <Route path="/videos" element={<VideoGallery />} />
      <Route path="/cinema" element={<WednesdayCinema />} />
      <Route path="/membership" element={<Membership />} />
      <Route path="/legal" element={<LegalPage />} />
      
      {/* Media Products Public URLs */}
      <Route path="/stories/success-story/:slug" element={<MediaProductDetail />} />
      <Route path="/stories/human-story/:slug" element={<MediaProductDetail />} />
      <Route path="/documentaries/:slug" element={<MediaProductDetail />} />
      <Route path="/press-releases/:slug" element={<MediaProductDetail />} />
      <Route path="/research/reports/:slug" element={<MediaProductDetail />} />
      <Route path="/campaigns/:slug" element={<MediaProductDetail />} />
      <Route path="/infographics/:slug" element={<MediaProductDetail />} />

      {/* Certificate Verification routes */}
      <Route path="/verify-certificate" element={<VerifyCertificate />} />
      <Route path="/verify-certificate/:id" element={<VerifyCertificate />} />

      {/* Volunteer Management System URLs */}
      <Route path="/volunteer-portal" element={<VolunteerPortal />} />
      <Route path="/volunteer-opportunities/:slug" element={<VolunteerOpportunityDetail />} />

      <Route path={`${ADMIN_PATH}/*`} element={<AdminDashboard />} />
      <Route path={`${ROOT_PATH}/*`} element={<RootDashboard />} />
      <Route path="/staff/*" element={<StaffDashboard />} />
      <Route path="/editor/*" element={<EditorDashboard />} />
      <Route path="/lawyer/*" element={<LawyerDashboard />} />
      <Route path="/trainer/*" element={<TrainerDashboard />} />
      <Route path="/profile/*" element={<JournalistDashboard />} />
      {/* Fallback for standard paths if they differ */}
      {ADMIN_PATH !== '/admin' && <Route path="/admin/*" element={<AdminDashboard />} />}
      {ROOT_PATH !== '/root' && <Route path="/root/*" element={<RootDashboard />} />}
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <RouteTracker>
          <Layout>
            <ProtectedRoutes />
          </Layout>
        </RouteTracker>
      </Router>
    </AuthProvider>
  );
}
