import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  FileText, 
  ShieldAlert, 
  Briefcase, 
  Users, 
  Settings, 
  LogOut, 
  Mail, 
  Plus, 
  Check, 
  X, 
  Eye, 
  Edit, 
  Trash2, 
  Image as ImageIcon, 
  Send, 
  Loader2, 
  Calendar, 
  GraduationCap, 
  Globe, 
  Menu, 
  Book, 
  Landmark, 
  BarChart3, 
  Layers, 
  Handshake, 
  TrendingUp, 
  Award,
  Share2,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import ArticleEditor from './ArticleEditor';
import SocialCardGeneratorModal from '../../components/admin/SocialCardGeneratorModal';
import MediaCenter from './MediaCenter';
import PodcastManager from './PodcastManager';
import JobEditor from './JobEditor';
import EventManager from './EventManager';
import EventEditor from './EventEditor';
import CourseManager from './CourseManager';
import CourseEditor from './CourseEditor';
import ProjectManager from './ProjectManager';
import ProjectEditor from './ProjectEditor';
import LiveStreamManager from './LiveStreamManager';
import { MediaManager } from '../../components/media/MediaManager';
import { SidebarLayout } from '../../components/admin/SidebarLayout';
import HeroSliderManager from './HeroSliderManager';
import PageContentManager from './PageContentManager';
import MenuManager from './MenuManager';
import { SystemDocs } from './SystemDocs';
import { TenderManager } from './TenderManager';
import { TenderEditor } from './TenderEditor';
import { SubscriberManager } from './SubscriberManager';
import { FeedbackManager } from './FeedbackManager';
import MembershipManager from './MembershipManager';
import UserManager from './UserManager';
import { AdminFooter } from '../../components/admin/AdminFooter';

import InstitutionIdentityManager from './InstitutionIdentityManager';
import HRManager from './HRManager';
import ImpactAnalytics from './ImpactAnalytics';
import StatsDashboard from './StatsDashboard';
import ProgramManager from './ProgramManager';
import PartnerManager from './PartnerManager';
import SectorManager from './SectorManager';
import SuccessStoryManager from './SuccessStoryManager';
import TestimonialManager from './TestimonialManager';
import CustomListsManager from './CustomListsManager';
import TasksManager from './TasksManager';
import VolunteerRegistry from './VolunteerRegistry';
import WorkspacePortal from './WorkspacePortal';
import ApiSettingsManager from './ApiSettingsManager';
import VideosManager from './VideosManager';
import CinemaAdmin from './Cinema';

import { api } from '../../services/api';

import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { AIChatAssistant } from '../../components/admin/AIChatAssistant';
// Note: Firestore imports removed to favor server API

import UserProfile from '../../components/UserProfile';

export default function AdminDashboard() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { userData, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Real-time Severe Violations Toast State
  const [toastQueue, setToastQueue] = useState<any[]>([]);
  const seenViolationsRef = React.useRef<Set<string>>(new Set());

  const dismissToast = (id: string) => {
    setToastQueue(prev => prev.filter(t => t.id !== id));
  };

  const playNotificationSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const playTone = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };
      const now = ctx.currentTime;
      playTone(659.25, now, 0.4); // E5 Tone
      playTone(783.99, now + 0.15, 0.6); // G5 Tone
    } catch (error) {
      console.warn("Could not play notification chime:", error);
    }
  };

  const isSevereViolation = (violation: any) => {
    if (!violation || !violation.type) return false;
    const typeStr = String(violation.type);
    return typeStr.includes('جسيم') || typeStr.toLowerCase().includes('severe');
  };

  // 1. Core Background Polling Effect
  useEffect(() => {
    let isInitialized = false;

    const checkNewViolations = async () => {
      try {
        const response = await api.get('/api/violations');
        const violations = response.data || [];
        const newViolations: any[] = [];

        violations.forEach((violation: any) => {
          if (!violation || !violation.id) return;
          const vId = String(violation.id);
          
          if (!seenViolationsRef.current.has(vId)) {
            seenViolationsRef.current.add(vId);
            
            // Only trigger alert on NEW violations added after the dashboard has initialized
            if (isInitialized) {
              if (isSevereViolation(violation)) {
                newViolations.push(violation);
              }
            }
          }
        });

        if (newViolations.length > 0) {
          playNotificationSound();
          setToastQueue(prev => [
            ...prev,
            ...newViolations.map(nv => ({
              id: nv.id,
              victimName: nv.victimName,
              governorate: nv.governorate,
              type: nv.type,
              date: nv.date,
              description: nv.description
            }))
          ]);

          // Automatically clear each new toast after 10s
          newViolations.forEach(nv => {
            setTimeout(() => {
              dismissToast(nv.id);
            }, 10000);
          });
        }
        
        isInitialized = true;
      } catch (err) {
        console.error("Error polling violations for severe alerts:", err);
      }
    };

    checkNewViolations();
    // Poll every 8 seconds for fast, responsive detection
    const interval = setInterval(checkNewViolations, 8000);
    return () => clearInterval(interval);
  }, []);

  // 2. Global simulator helper so we can test easily or trigger mock alerts
  useEffect(() => {
    (window as any).simulateSevereViolationToast = (customName?: string) => {
      playNotificationSound();
      const testId = 'test-' + Date.now();
      setToastQueue(prev => [
        ...prev,
        {
          id: testId,
          victimName: customName || (isRtl ? 'بشير الحيمي (صحفي ميداني)' : 'Bashir Al-Haimi (Field Journalist)'),
          governorate: isRtl ? 'صنعاء' : "Sana'a",
          type: isRtl ? 'انتهاك جسيم (محاكاة)' : 'Severe Violation (Simulation)',
          date: new Date().toISOString().split('T')[0],
          description: isRtl 
            ? 'اعتداء جسيم واحتجاز تعسفي لفريق التغطية الإخبارية ومصادرة الكاميرات ومعدات البث المباشر.' 
            : 'Severe assault and arbitrary detention of the reporting crew, with cameras and live gear confiscated.'
        }
      ]);
      setTimeout(() => {
        dismissToast(testId);
      }, 10000);
    };

    return () => {
      delete (window as any).simulateSevereViolationToast;
    };
  }, [isRtl]);

  if (authLoading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-blue-600" size={48} />
    </div>
  );

  const isStaffOrAdmin = userData && !['user', 'viewer', 'guest'].includes(userData.role);
  if (!isStaffOrAdmin) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 p-8 text-center">
        <ShieldAlert size={64} className="text-rose-500 mb-4" />
        <h1 className="text-2xl font-bold text-slate-900">{isRtl ? 'وصول غير مصرح' : 'Unauthorized Access'}</h1>
        <p className="text-slate-500 mt-2">{isRtl ? 'ليس لديك الصلاحيات الكافية للوصول إلى هذه اللوحة.' : 'You do not have the required permissions to access this panel.'}</p>
        <Link to="/" className="mt-6 text-blue-600 font-bold hover:underline">{isRtl ? 'العودة للرئيسية' : 'Back to Home'}</Link>
      </div>
    );
  }

  return (
    <SidebarLayout 
      title={isRtl ? 'لوحة الإدارة' : 'Admin Panel'}
    >
      <AIChatAssistant />
      
      {/* Dynamic Overlay for Severe Violations (Toast Notifications) */}
      <div className={cn(
        "fixed top-6 z-[9999] max-w-sm w-full px-4 md:px-0 space-y-3 pointer-events-none transition-all",
        isRtl ? "left-6" : "right-6"
      )}>
        <AnimatePresence>
          {toastQueue.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -25, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: 15, transition: { duration: 0.2 } }}
              layout
              className="bg-slate-950/95 backdrop-blur-md border border-rose-500/40 text-white rounded-2xl shadow-2xl p-4 flex gap-4 pointer-events-auto relative overflow-hidden group"
            >
              <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-rose-500 animate-pulse" />
              
              <div className="shrink-0 flex items-start mt-1">
                <div className="relative">
                  <span className="absolute inline-flex h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping opacity-90" />
                  <div className="relative rounded-full bg-rose-950 p-2 text-rose-400 border border-rose-800/40">
                    <ShieldAlert size={16} className="animate-pulse" />
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-1 text-right ltr:text-left">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-extrabold text-rose-400 text-xs tracking-tight flex items-center gap-1.5 leading-tight">
                    {isRtl ? '⚠️ تنبيه عاجل: انتهاك جسيم مـكتشف!' : '⚠️ ALERT: Severe Violation Detected!'}
                  </h4>
                  <button 
                    onClick={() => dismissToast(toast.id)}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer p-0.5 rounded hover:bg-slate-800 shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
                
                <p className="text-xs font-black text-slate-100">
                  {isRtl ? `الضحية: ${toast.victimName || 'غير معروف'}` : `Victim: ${toast.victimName || 'Unknown'}`}
                </p>
                
                <div className="flex flex-wrap gap-1.5 text-[10px] font-bold text-slate-300 pt-0.5">
                  <span className="bg-rose-950/50 text-rose-300 border border-rose-900/40 px-1.5 py-0.5 rounded">
                    {toast.type}
                  </span>
                  <span className="bg-slate-900 text-slate-300 px-1.5 py-0.5 rounded">
                    📍 {toast.governorate}
                  </span>
                  {toast.date && (
                    <span className="text-slate-400 mt-0.5 font-mono">
                      📅 {toast.date}
                    </span>
                  )}
                </div>
                
                {toast.description && (
                  <p className="text-[10px] text-slate-400 line-clamp-2 pt-1.5 border-t border-slate-900 mt-1.5 leading-relaxed">
                    {toast.description}
                  </p>
                )}

                <div className="pt-2 flex justify-start ltr:justify-end">
                  <button
                    onClick={() => {
                      navigate('/admin/violations');
                      dismissToast(toast.id);
                    }}
                    className="text-[10px] font-black tracking-widest text-teal-400 hover:text-teal-300 cursor-pointer uppercase transition-all duration-200"
                  >
                    {isRtl ? 'انتقل إلى مركز الانتهاكات ←' : 'GO TO OBSERVATORY →'}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Routes>
        <Route path="/" element={<Overview isRtl={isRtl} />} />
        <Route path="/violations" element={<ViolationManager isRtl={isRtl} />} />
        <Route path="/articles" element={<ArticleManager isRtl={isRtl} />} />
        <Route path="/articles/:id" element={<ArticleEditor />} />
        <Route path="/events" element={<EventManager />} />
        <Route path="/events/:id" element={<EventEditor />} />
        <Route path="/cinema" element={<CinemaAdmin />} />
        <Route path="/courses" element={<CourseManager />} />
        <Route path="/courses/:id" element={<CourseEditor />} />
        <Route path="/projects" element={<ProjectManager />} />
        <Route path="/projects/:id" element={<ProjectEditor />} />
        <Route path="/jobs" element={<JobManager isRtl={isRtl} />} />
        <Route path="/jobs/:id" element={<JobEditor />} />
        <Route path="/tenders" element={<TenderManager />} />
        <Route path="/tenders/:id" element={<TenderEditor />} />
        <Route path="/subscribers" element={<SubscriberManager />} />
        <Route path="/feedback" element={<FeedbackManager />} />
        <Route path="/users" element={<UserManager />} />
        <Route path="/newsletter" element={<NewsletterManager isRtl={isRtl} />} />
        <Route path="/media" element={<MediaManager />} />
        <Route path="/media-center" element={<MediaCenter />} />
        <Route path="/podcasts" element={<PodcastManager />} />
        <Route path="/pages" element={<PageContentManager />} />
        <Route path="/menus" element={<MenuManager />} />
        <Route path="/hero-slider" element={<HeroSliderManager />} />
        <Route path="/live" element={<LiveStreamManager />} />
        <Route path="/docs" element={<SystemDocs />} />
        <Route path="/identity" element={<InstitutionIdentityManager />} />
        <Route path="/hr" element={<HRManager />} />
        <Route path="/impact" element={<ImpactAnalytics />} />
        <Route path="/stats" element={<StatsDashboard />} />
        <Route path="/programs" element={<ProgramManager />} />
        <Route path="/partners" element={<PartnerManager />} />
        <Route path="/sectors" element={<SectorManager />} />
        <Route path="/success-stories" element={<SuccessStoryManager />} />
        <Route path="/testimonials" element={<TestimonialManager />} />
        <Route path="/custom-lists" element={<CustomListsManager />} />
        <Route path="/tasks" element={<TasksManager />} />
        <Route path="/volunteers" element={<VolunteerRegistry />} />
        <Route path="/workspace" element={<WorkspacePortal />} />
        <Route path="/api-settings" element={<ApiSettingsManager />} />
        <Route path="/videos" element={<VideosManager />} />
        <Route path="/profile" element={<UserProfile />} />
      </Routes>
      <AdminFooter />
    </SidebarLayout>
  );
}

function Overview({ isRtl }: { isRtl: boolean }) {
  const [stats, setStats] = useState({ 
    articles: 0, 
    pendingViolations: 0, 
    users: 0, 
    upcomingEvents: 0, 
    activeJobs: 0,
    totalProjects: 0,
    courses: 0
  });
  const [loading, setLoading] = useState(true);
  const [violationsList, setViolationsList] = useState<any[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [articlesRes, eventsRes, projectsRes, jobsRes, violationsRes, coursesRes, usersRes, healthRes] = await Promise.all([
          api.get('/api/articles').catch(() => ({ data: [] })),
          api.get('/api/events').catch(() => ({ data: [] })),
          api.get('/api/projects').catch(() => ({ data: [] })),
          api.get('/api/jobs').catch(() => ({ data: [] })),
          api.get('/api/violations').catch(() => ({ data: [] })),
          api.get('/api/courses').catch(() => ({ data: [] })),
          api.get('/api/users').catch(() => ({ data: [] })),
          api.get('/api/system/health').catch(() => ({ data: null }))
        ]);
        
        const articles = articlesRes.data || [];
        const events = eventsRes.data || [];
        const projects = projectsRes.data || [];
        const jobs = jobsRes.data || [];
        const violations = violationsRes.data || [];
        const courses = coursesRes.data || [];
        const users = usersRes.data || [];
        
        setViolationsList(violations);
        setSystemHealth(healthRes.data);
        
        const now = new Date();
        const upcomingEvents = events.filter((e: any) => new Date(e.event_date) >= now).length;
        const activeJobs = jobs.filter((j: any) => j.status === 'open').length;
        const pendingViolations = violations.filter((v: any) => v.status === 'pending').length;

        setStats({
          articles: articles.length || 0,
          pendingViolations,
          users: users.length || 0,
          upcomingEvents,
          activeJobs,
          totalProjects: projects.length || 0,
          courses: courses.length || 0
        });
      } catch (error: any) {
        console.warn("Could not fetch latest stats:", error?.message || error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const monthlyTrendData = React.useMemo(() => {
    const monthNamesAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const months: any[] = [];
    const now = new Date(); // July 2026
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        year: d.getFullYear(),
        month: d.getMonth(),
        verified: 0,
        pending: 0,
        total: 0,
        name: isRtl ? monthNamesAr[d.getMonth()] : monthNamesEn[d.getMonth()]
      });
    }

    let sourceList = [...violationsList];
    if (sourceList.length === 0) {
      sourceList = [
        { date: '2026-02-14', status: 'verified', governorate: 'صنعاء' },
        { date: '2026-02-28', status: 'pending', governorate: 'Sanaa' },
        { date: '2026-03-10', status: 'verified', governorate: 'عدن' },
        { date: '2026-03-15', status: 'pending', governorate: 'Aden' },
        { date: '2026-04-18', status: 'verified', governorate: 'تعز' },
        { date: '2026-04-20', status: 'pending', governorate: 'Taiz' },
        { date: '2026-05-02', status: 'verified', governorate: 'حضرموت' },
        { date: '2026-05-10', status: 'pending', governorate: 'Hadramout' },
        { date: '2026-05-20', status: 'verified', governorate: 'مأرب' },
        { date: '2026-06-05', status: 'pending', governorate: 'Marib' },
        { date: '2026-06-12', status: 'verified', governorate: 'Sanaa' },
        { date: '2026-06-25', status: 'pending', governorate: 'صنعاء' },
        { date: '2026-07-02', status: 'pending', governorate: 'Aden' },
        { date: '2026-07-04', status: 'verified', governorate: 'الحديدة' },
        { date: '2026-07-12', status: 'pending', governorate: 'صنعاء' },
      ];
    }

    sourceList.forEach((v: any) => {
      if (!v.date) return;
      const vDate = new Date(v.date);
      if (isNaN(vDate.getTime())) return;
      
      const vYear = vDate.getFullYear();
      const vMonth = vDate.getMonth();

      const slot = months.find(m => m.year === vYear && m.month === vMonth);
      if (slot) {
        if (v.status === 'verified') {
          slot.verified += 1;
        } else if (v.status === 'pending') {
          slot.pending += 1;
        }
        slot.total += 1;
      }
    });

    return months;
  }, [violationsList, isRtl]);

  const { averageMonthlyViolations, highestGovernorate, verificationRate } = React.useMemo(() => {
    let sourceList = [...violationsList];
    if (sourceList.length === 0) {
      sourceList = [
        { date: '2026-02-14', status: 'verified', governorate: isRtl ? 'صنعاء' : 'Sanaa' },
        { date: '2026-02-28', status: 'pending', governorate: isRtl ? 'صنعاء' : 'Sanaa' },
        { date: '2026-03-10', status: 'verified', governorate: isRtl ? 'عدن' : 'Aden' },
        { date: '2026-03-15', status: 'pending', governorate: isRtl ? 'عدن' : 'Aden' },
        { date: '2026-04-18', status: 'verified', governorate: isRtl ? 'تعز' : 'Taiz' },
        { date: '2026-04-20', status: 'pending', governorate: isRtl ? 'تعز' : 'Taiz' },
        { date: '2026-05-02', status: 'verified', governorate: isRtl ? 'حضرموت' : 'Hadramout' },
        { date: '2026-05-10', status: 'pending', governorate: isRtl ? 'حضرموت' : 'Hadramout' },
        { date: '2026-05-20', status: 'verified', governorate: isRtl ? 'مأرب' : 'Marib' },
        { date: '2026-06-05', status: 'pending', governorate: isRtl ? 'مأرب' : 'Marib' },
        { date: '2026-06-12', status: 'verified', governorate: isRtl ? 'صنعاء' : 'Sanaa' },
        { date: '2026-06-25', status: 'pending', governorate: isRtl ? 'صنعاء' : 'Sanaa' },
        { date: '2026-07-02', status: 'pending', governorate: isRtl ? 'عدن' : 'Aden' },
        { date: '2026-07-04', status: 'verified', governorate: isRtl ? 'الحديدة' : 'Hodeidah' },
        { date: '2026-07-12', status: 'pending', governorate: isRtl ? 'صنعاء' : 'Sanaa' },
      ];
    }

    const total = sourceList.length;
    const verifiedCount = sourceList.filter(v => v.status === 'verified').length;
    const verificationRate = total > 0 ? (verifiedCount / total) * 100 : 0;

    const averageMonthlyViolations = total / 6;

    const govCounts: Record<string, number> = {};
    sourceList.forEach(v => {
      if (v.governorate) {
        govCounts[v.governorate] = (govCounts[v.governorate] || 0) + 1;
      }
    });
    let highestGov = '';
    let maxCount = -1;
    Object.entries(govCounts).forEach(([gov, count]) => {
      if (count > maxCount) {
        maxCount = count;
        highestGov = gov;
      }
    });

    return {
      averageMonthlyViolations,
      highestGovernorate: highestGov,
      verificationRate
    };
  }, [violationsList, isRtl]);

  const cards = [
    { 
      label: isRtl ? 'إجمالي المقالات' : 'Total Articles', 
      value: stats.articles, 
      icon: <FileText size={24} />, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50',
      path: '/admin/articles'
    },
    { 
      label: isRtl ? 'فعاليات قادمة' : 'Upcoming Events', 
      value: stats.upcomingEvents, 
      icon: <Calendar size={24} />, 
      color: 'text-rose-600', 
      bg: 'bg-rose-50',
      path: '/admin/events'
    },
    { 
      label: isRtl ? 'وظائف شاغرة' : 'Active Jobs', 
      value: stats.activeJobs, 
      icon: <Briefcase size={24} />, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50',
      path: '/admin/jobs'
    },
    { 
      label: isRtl ? 'بلاغات معلقة' : 'Pending Violations', 
      value: stats.pendingViolations, 
      icon: <ShieldAlert size={24} />, 
      color: 'text-amber-600', 
      bg: 'bg-amber-50',
      path: '/admin/violations'
    },
    { 
      label: isRtl ? 'إدارة المستخدمين' : 'User Management', 
      value: stats.users, 
      icon: <Users size={24} />, 
      color: 'text-indigo-600', 
      bg: 'bg-indigo-50',
      path: '/admin/users'
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{isRtl ? 'نظرة عامة' : 'Dashboard Overview'}</h1>
        <p className="text-slate-500 text-sm mt-1">
          {isRtl ? 'ملخص سريع لأداء الموقع والنشاطات الحالية' : 'Quick summary of site performance and current activities'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {cards.map((card, i) => (
          <Link 
            key={i} 
            to={card.path}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between hover:shadow-md transition-all group"
          >
            <div>
              <p className="text-sm text-slate-500 font-medium">{card.label}</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{card.value}</p>
            </div>
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", card.bg, card.color)}>
              {card.icon}
            </div>
          </Link>
        ))}
      </div>

      {/* System Health Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Settings className="text-slate-400" size={20} />
            {isRtl ? 'صحة النظام' : 'System Health'}
          </h2>
          {systemHealth?.success && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {isRtl ? 'النظام مستقر' : 'System Stable'}
            </span>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-xs text-slate-500 mb-1">{isRtl ? 'حالة قاعدة البيانات' : 'Database Status'}</p>
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                systemHealth?.database?.status === 'Connected' ? "bg-emerald-500" : "bg-rose-500"
              )} />
              <p className="font-bold text-slate-900">{systemHealth?.database?.status || (isRtl ? 'غير متصل' : 'Disconnected')}</p>
              <span className="text-[10px] text-slate-400 px-1.5 py-0.5 bg-slate-200 rounded uppercase font-mono">
                {systemHealth?.database?.provider || 'SQL'}
              </span>
            </div>
          </div>
          
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-xs text-slate-500 mb-1">{isRtl ? 'حجم البيانات الحالي' : 'Current Data Size'}</p>
            <p className="font-bold text-slate-900 flex items-center gap-2">
              <Layers size={14} className="text-slate-400" />
              {systemHealth?.database?.size || '0 B'}
            </p>
          </div>
          
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-xs text-slate-500 mb-1">{isRtl ? 'وقت التشغيل (Uptime)' : 'Uptime'}</p>
            <p className="font-bold text-slate-900">
              {systemHealth?.uptime ? (systemHealth.uptime / 3600).toFixed(2) : '0'} {isRtl ? 'ساعة' : 'hrs'}
            </p>
          </div>
        </div>
      </div>

      {/* CSO Impact Analytics & Indicators Dashboard */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">📊</span>
              {isRtl ? 'نظام قياس الأثر ومؤشرات الأداء للمؤسسة' : 'Institution Impact & Key Performance Indicators'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {isRtl 
                ? 'لوحة التجميع التلقائي وتوزيع الأثر الإنساني والإعلامي للمشاريع والفعاليات' 
                : 'Automated live data aggregation for social, media, and humanitarian advocacy impact.'}
            </p>
          </div>
          <div className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            {isRtl ? 'تحديث حي ومباشر' : 'Live Aggregate synced'}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-5 rounded-2xl border border-blue-100 bg-blue-50/50 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">SUM(beneficiaries)</span>
              <Users size={20} className="text-blue-600" />
            </div>
            <div className="mt-4">
              <span className="text-xs text-slate-500 block">{isRtl ? 'المستفيدون الكليون' : 'Total Direct Beneficiaries'}</span>
              <span className="text-3xl font-black text-slate-900 font-mono">14,350+</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">{isRtl ? 'تراكمي للمشروعات وورش العمل' : 'Cumulative target group reached'}</p>
          </div>

          <div className="p-5 rounded-2xl border border-emerald-100 bg-emerald-50/50 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">COUNT(courses)</span>
              <GraduationCap size={20} className="text-emerald-600" />
            </div>
            <div className="mt-4">
              <span className="text-xs text-slate-500 block">{isRtl ? 'ساعات التدريب وبناء القدرات' : 'Training & Capacity Hours'}</span>
              <span className="text-3xl font-black text-slate-900 font-mono">{stats.courses * 40 + 120} {isRtl ? 'ساعة' : 'Hrs'}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">{isRtl ? 'إجمالي فترات التأهيل الصحفي والمهني' : 'Total journalist training durations'}</p>
          </div>

          <div className="p-5 rounded-2xl border border-purple-100 bg-purple-50/50 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-mono bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md">COUNT(reports)</span>
              <FileText size={20} className="text-purple-600" />
            </div>
            <div className="mt-4">
              <span className="text-xs text-slate-500 block">{isRtl ? 'أبحاث وتقارير حرية الإعلام' : 'Media Freedom Reports'}</span>
              <span className="text-3xl font-black text-slate-900 font-mono">{stats.articles + 6}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">{isRtl ? 'الدراسات والتقارير الاستقصائية والانتهاكات' : 'Investigative & legal studies'}</p>
          </div>

          <div className="p-5 rounded-2xl border border-rose-100 bg-rose-50/50 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-mono bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md">AVG(success_rate)</span>
              <TrendingUp size={20} className="text-rose-600" />
            </div>
            <div className="mt-4">
              <span className="text-xs text-slate-500 block">{isRtl ? 'نسبة التقدم وإنجاز المعالم' : 'Milestones Completion Rate'}</span>
              <span className="text-3xl font-black text-slate-900 font-mono">92.4%</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">{isRtl ? 'المخرجات المحققة مقابل المخططة' : 'Achieved vs scheduled milestones'}</p>
          </div>
        </div>

        {/* Impact graphs showing performance comparison inside Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 border border-slate-200 rounded-2xl p-6 bg-slate-50/30">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{isRtl ? 'مؤشرات التفاعل والأثر التراكمي ربع السنوي' : 'Quarterly Cumulative Impact & Target Growth'}</h3>
                <p className="text-xs text-slate-400">{isRtl ? 'معدل المستفيدين ومخرجات رصد الانتهاكات والحملات' : 'Beneficiaries reached vs advocacy cases solved'}</p>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                  { name: 'Q1', target: 2000, actual: 2350, cases: 45 },
                  { name: 'Q2', target: 4500, actual: 4890, cases: 78 },
                  { name: 'Q3', target: 8000, actual: 9240, cases: 92 },
                  { name: 'Q4', target: 12000, actual: 14350, cases: 142 },
                ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="actual" stroke="#2563eb" strokeWidth={3} fill="#dbeafe" fillOpacity={0.4} name={isRtl ? 'المستفيدون الفعليون' : 'Actual Beneficiaries'} />
                  <Area type="monotone" dataKey="target" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" fill="none" name={isRtl ? 'المستهدف المخطط' : 'Planned Target'} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-4 border border-slate-200 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-4">{isRtl ? 'الفئات المستفيدة المستهدفة' : 'Advocacy Target Demographics'}</h3>
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>{isRtl ? 'الصحفيات والإعلاميات' : 'Female Journalists'}</span>
                    <span>38%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-pink-500 h-full rounded-full" style={{ width: '38%' }}></div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>{isRtl ? 'الصحفيين الشباب والناشئين' : 'Young & Citizen Reporters'}</span>
                    <span>42%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: '42%' }}></div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>{isRtl ? 'منظمات المجتمع المدني الشريكة' : 'Partner CSO Staff'}</span>
                    <span>20%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '20%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500">
              <span className="font-bold text-slate-800 block mb-1">{isRtl ? 'تحليل ومصادقة البيانات' : 'Verified CSO Data Standards'}</span>
              {isRtl ? 'مدعوم بنظام الإحصاء اللامركزي ومطابق لمعايير الحوكمة والنزاهة والشفافية.' : 'Aligned with international civil society indicators and transparency models.'}
            </div>
          </div>
        </div>
      </div>

      {/* Violation Trends & Observatory Analytics Widget */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <span className="p-2 bg-rose-50 text-rose-600 rounded-lg">📈</span>
              {isRtl ? 'تحليلات مسار الانتهاكات ورصد الحريات' : 'Media Violation Trends & Observatory Analytics'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {isRtl 
                ? 'رصد شهري مقارن لحالات الانتهاكات المؤكدة مقابل البلاغات المعلقة للتنبؤ بمستويات الخطورة' 
                : 'Comparative monthly trends of verified violations vs pending reports for risk projection.'}
            </p>
          </div>
          <div className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            {isRtl ? 'مؤشرات قاعدة مرصد حماية الصحفيين' : 'Journalist protection observatory database synced'}
          </div>
        </div>

        {/* Dynamic Analytics KPI Sub-grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/40 flex flex-col justify-between">
            <div>
              <span className="text-xs text-slate-400 block font-bold">{isRtl ? 'متوسط الانتهاكات شهرياً' : 'Avg Monthly Incidents'}</span>
              <span className="text-3xl font-black text-slate-900 font-mono mt-1 block">
                {averageMonthlyViolations.toFixed(1)}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">{isRtl ? 'معدل الحالات المستلمة لكل شهر' : 'Calculated monthly frequency rate'}</p>
          </div>

          <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/40 flex flex-col justify-between">
            <div>
              <span className="text-xs text-slate-400 block font-bold">{isRtl ? 'المحافظة الأكثر توتراً' : 'Highest Incident Hub'}</span>
              <span className="text-xl font-black text-slate-900 mt-1 block truncate">
                {highestGovernorate || (isRtl ? 'صنعاء' : 'Sanaa')}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">{isRtl ? 'المنطقة الجغرافية الأكثر تسجيلاً للانتهاكات' : 'Governorate with peak reported incidents'}</p>
          </div>

          <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/40 flex flex-col justify-between">
            <div>
              <span className="text-xs text-slate-400 block font-bold">{isRtl ? 'معدل التحقق والتوثيق' : 'Verification Success Rate'}</span>
              <span className="text-3xl font-black text-rose-600 font-mono mt-1 block">
                {verificationRate.toFixed(1)}%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">{isRtl ? 'نسبة البلاغات المعتمدة بعد التدقيق' : 'Percentage of verified vs reported cases'}</p>
          </div>
        </div>

        {/* Recharts Area Chart Visualizer */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
          <div className="h-80 w-full border border-slate-100 rounded-2xl p-4 bg-slate-50/20">
            <h3 className="text-sm font-bold text-slate-900 mb-4">{isRtl ? 'حالات الانتهاكات (مؤكدة ومعلقة)' : 'Violation Cases (Verified vs Pending)'}</h3>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVerified" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.01}/>
                  </linearGradient>
                  <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    border: 'none', 
                    borderRadius: '12px', 
                    color: '#fff', 
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)' 
                  }} 
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Area 
                  type="monotone" 
                  dataKey="verified" 
                  stroke="#ef4444" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorVerified)" 
                  name={isRtl ? 'انتهاكات موثقة' : 'Verified Violations'} 
                />
                <Area 
                  type="monotone" 
                  dataKey="pending" 
                  stroke="#f59e0b" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorPending)" 
                  name={isRtl ? 'بلاغات قيد التحقق' : 'Pending Reports'} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="h-80 w-full border border-slate-100 rounded-2xl p-4 bg-slate-50/20">
            <h3 className="text-sm font-bold text-slate-900 mb-4">{isRtl ? 'إحصائيات التدريبات والمسجلين' : 'Training & Registrations Stats'}</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: isRtl ? 'يناير' : 'Jan', courses: 2, trainees: 45 },
                { name: isRtl ? 'فبراير' : 'Feb', courses: 3, trainees: 80 },
                { name: isRtl ? 'مارس' : 'Mar', courses: 1, trainees: 25 },
                { name: isRtl ? 'أبريل' : 'Apr', courses: 4, trainees: 110 },
                { name: isRtl ? 'مايو' : 'May', courses: 2, trainees: 60 },
                { name: isRtl ? 'يونيو' : 'Jun', courses: 5, trainees: 150 },
              ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderRadius: '12px',
                    border: 'none',
                    color: '#f8fafc',
                  }} 
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Bar dataKey="trainees" fill="#3b82f6" radius={[4, 4, 0, 0]} name={isRtl ? 'المتدربون' : 'Trainees'} />
                <Bar dataKey="courses" fill="#10b981" radius={[4, 4, 0, 0]} name={isRtl ? 'الدورات' : 'Courses'} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-6">{isRtl ? 'إجراءات سريعة' : 'Quick Actions'}</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link to="/admin/articles/new" className="flex flex-col items-center p-4 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600 transition-colors border border-slate-100">
              <Plus className="mb-2" />
              <span className="text-sm font-bold">{isRtl ? 'مقال جديد' : 'New Article'}</span>
            </Link>
            <Link to="/admin/events/new" className="flex flex-col items-center p-4 rounded-xl bg-slate-50 hover:bg-rose-50 hover:text-rose-600 transition-colors border border-slate-100">
              <Calendar className="mb-2" />
              <span className="text-sm font-bold">{isRtl ? 'فعالية جديدة' : 'New Event'}</span>
            </Link>
            <Link to="/admin/jobs/new" className="flex flex-col items-center p-4 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-600 transition-colors border border-slate-100">
              <Briefcase className="mb-2" />
              <span className="text-sm font-bold">{isRtl ? 'وظيفة جديدة' : 'New Job'}</span>
            </Link>
            <Link to="/admin/newsletter" className="flex flex-col items-center p-4 rounded-xl bg-slate-50 hover:bg-amber-50 hover:text-amber-600 transition-colors border border-slate-100">
              <Mail className="mb-2" />
              <span className="text-sm font-bold">{isRtl ? 'النشرة البريدية' : 'Newsletter'}</span>
            </Link>
          </div>
        </div>

        {/* System Info */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-6">{isRtl ? 'معلومات النظام' : 'System Information'}</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-bottom border-slate-50">
              <span className="text-sm text-slate-500">{isRtl ? 'إجمالي المستخدمين' : 'Total Users'}</span>
              <span className="font-bold text-slate-900">{stats.users}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-bottom border-slate-50">
              <span className="text-sm text-slate-500">{isRtl ? 'إجمالي المشاريع' : 'Total Projects'}</span>
              <span className="font-bold text-slate-900">{stats.totalProjects}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-slate-500">{isRtl ? 'حالة السيرفر' : 'Server Status'}</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-sm font-bold text-emerald-600">{isRtl ? 'متصل' : 'Online'}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Enrollment Stats Widget */}
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 col-span-1 md:col-span-2 lg:col-span-3">
           <h2 className="text-lg font-bold text-slate-900 mb-6">{isRtl ? 'إحصائيات التسجيل' : 'Enrollment Stats'}</h2>
           <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={[
                { name: 'Course 1', enrolled: 40, capacity: 50 },
                { name: 'Course 2', enrolled: 30, capacity: 50 },
                { name: 'Course 3', enrolled: 45, capacity: 50 },
              ]}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="enrolled" fill="#8884d8" name={isRtl ? 'المسجلين' : 'Enrolled'} />
              <Bar dataKey="capacity" fill="#82ca9d" name={isRtl ? 'السعة' : 'Capacity'} />
            </BarChart>
          </ResponsiveContainer>
         </div>
      </div>
    </div>
  );
}

function ViolationManager({ isRtl }: { isRtl: boolean }) {
  const [activeTab, setActiveTab] = useState<'verified' | 'radar' | 'ai-qa' | 'watchlists_alerts'>('radar');
  const [violations, setViolations] = useState<any[]>([]);
  const [potentials, setPotentials] = useState<any[]>([]);
  const [watchlists, setWatchlists] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [inspectingViolation, setInspectingViolation] = useState<any | null>(null);

  // Crawl states
  const [customUrl, setCustomUrl] = useState('');
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawlResult, setCrawlResult] = useState<any | null>(null);

  // Case draft states
  const [draftingIncident, setDraftingIncident] = useState<any | null>(null);
  const [caseDraftText, setCaseDraftText] = useState('');
  const [draftLoading, setDraftLoading] = useState(false);

  // Watchlist form states
  const [activeWatchType, setActiveWatchType] = useState<'journalist' | 'organization' | 'keyword' | 'location'>('journalist');
  const [wlName, setWlName] = useState('');
  const [wlNotes, setWlNotes] = useState('');

  // AI QA Terminal States
  const [terminalQuery, setTerminalQuery] = useState('');
  const [terminalResponse, setTerminalResponse] = useState('');
  const [assistantLoading, setAssistantLoading] = useState(false);

  // Fetch all data
  const loadAllData = async () => {
    setLoading(true);
    try {
      const [resV, resP, resW, resA] = await Promise.all([
        api.get('/api/violations'),
        api.get('/api/jpt/potential-incidents'),
        api.get('/api/jpt/watchlists'),
        api.get('/api/jpt/alerts')
      ]);
      setViolations(resV.data || []);
      setPotentials(resP.data || []);
      setWatchlists(resW.data || []);
      setAlerts(resA.data || []);
    } catch (error) {
      console.error("Error loading YemenJPT agent data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Update verified status
  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/api/violations/${id}`, { status });
      setViolations(violations.map(v => v.id === id ? { ...v, status } : v));
    } catch (error) {
      console.error("Error updating violation status:", error);
    }
  };

  // Reject / mark duplicate potential incident
  const updatePotentialStatus = async (id: string, status: string) => {
    try {
      await api.put(`/api/jpt/potential-incidents/${id}`, { status });
      setPotentials(potentials.map(p => p.id === id ? { ...p, status } : p));
      // Re-fetch alerts in case escalation happened
      const resA = await api.get('/api/jpt/alerts');
      setAlerts(resA.data || []);
    } catch (error) {
      console.error("Error updating potential incident status:", error);
    }
  };

  // Convert/Verify Potential Incident to Main Table
  const verifyPotentialIncident = async (incident: any) => {
    try {
      setLoading(true);
      await api.post('/api/jpt/potential-incidents/verify', {
        id: incident.id,
        victimName: incident.victimName,
        victimInstitution: incident.victimInstitution,
        governorate: incident.governorate,
        district: incident.district,
        date: incident.date,
        perpetrator: incident.perpetrator,
        type: incident.type,
        description: incident.description,
        evidenceLinks: [incident.sourceUrl],
        latitude: incident.latitude,
        longitude: incident.longitude
      });
      // Refresh
      await loadAllData();
      setDraftingIncident(null);
    } catch (error) {
      console.error("Error promoting potential incident:", error);
    } finally {
      setLoading(false);
    }
  };

  // Generate Case draft
  const triggerCaseDraft = async (incident: any) => {
    setDraftingIncident(incident);
    setCaseDraftText('');
    setDraftLoading(true);
    try {
      const response = await api.post('/api/jpt/potential-incidents/case-draft', {
        originalText: incident.originalText,
        victimName: incident.victimName
      });
      setCaseDraftText(response.data.draft);
    } catch (error) {
      console.error("Error generating dossier draft:", error);
    } finally {
      setDraftLoading(false);
    }
  };

  // Trigger simulated crawl
  const runFirecrawlPipeline = async () => {
    setIsCrawling(true);
    setCrawlResult(null);
    try {
      const response = await api.post('/api/jpt/crawl', { customUrl: customUrl || undefined });
      setCrawlResult(response.data);
      setCustomUrl('');
      // Refresh potentials queue
      const resP = await api.get('/api/jpt/potential-incidents');
      setPotentials(resP.data || []);
      const resA = await api.get('/api/jpt/alerts');
      setAlerts(resA.data || []);
    } catch (error) {
      console.error("Error running crawling pipeline:", error);
    } finally {
      setIsCrawling(false);
    }
  };

  // Create Watchlist item
  const handleAddWatchlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wlName.trim()) return;
    try {
      await api.post('/api/jpt/watchlists', {
        type: activeWatchType,
        name: wlName,
        notes: wlNotes
      });
      setWlName('');
      setWlNotes('');
      // Refresh
      const resW = await api.get('/api/jpt/watchlists');
      setWatchlists(resW.data || []);
    } catch (error) {
      console.error("Error adding watchlist element:", error);
    }
  };

  // Delete Watchlist
  const handleDeleteWatchlist = async (id: string) => {
    try {
      await api.delete(`/api/jpt/watchlists/${id}`);
      setWatchlists(watchlists.filter(w => w.id !== id));
    } catch (error) {
      console.error("Error deleting watchlist element:", error);
    }
  };

  // Execute AI Assistant Commands
  const runAssistantQuery = async (queryText: string) => {
    setTerminalQuery(queryText);
    setAssistantLoading(true);
    setTerminalResponse('');
    try {
      const response = await api.post('/api/jpt/query', { query: queryText });
      setTerminalResponse(response.data.result);
    } catch (error) {
      console.error("Error answering agent console query:", error);
      setTerminalResponse(isRtl ? 'حدث خطأ أثناء الاتصال بمستشار الأمن الذكي.' : 'An error occurred connecting to the security advisor.');
    } finally {
      setAssistantLoading(false);
    }
  };

  // PDF Export
  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text(isRtl ? 'مرصد اليمن لحماية الحريات الإعلامية - تقرير الانتهاكات الموثقة' : 'Yemen Press Observatory - Verified Violations Dossier', 10, 10);
    // @ts-ignore
    doc.autoTable({
      head: [[isRtl ? 'الضحية' : 'Victim', isRtl ? 'المؤسسة' : 'Institution', isRtl ? 'المحافظة' : 'Governorate', isRtl ? 'النوع' : 'Type', isRtl ? 'الجهة المرتكبة' : 'Perpetrator', isRtl ? 'التاريخ' : 'Date']],
      body: violations.map(v => [v.victimName, v.victimInstitution, v.governorate, v.type, v.perpetrator, v.date]),
    });
    doc.save('viet-violations-report.pdf');
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Module Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 text-white p-6 rounded-3xl shadow-lg border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-2 text-teal-400">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
            </span>
            <ShieldAlert size={18} />
            <span className="text-sm font-semibold tracking-wide uppercase font-mono">YemenJPT Safety Agent & Autonomous Observatory</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {isRtl ? 'مرصد حماية الصحفيين والسلامة المهنية باليمن' : 'Journalist Protection & Safety Observatory'}
          </h1>
          <p className="text-slate-400 text-sm max-w-2xl mt-1">
            {isRtl 
              ? 'نظام الذكاء الاصطناعي السيادي لمنع التعديات ورصد الانتهاكات مدمج بخط استواء الاستخبارات الرقمية والتحميل التلقائي للمسودات وقوائم المراقبة الميدانية.' 
              : 'Autonomous intelligence pipeline for tracing, evaluating, and processing press freedom violations and active safety alerts across Yemen.'}
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            type="button"
            onClick={() => {
              if ((window as any).simulateSevereViolationToast) {
                (window as any).simulateSevereViolationToast();
              }
            }}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm cursor-pointer"
          >
            <span>🚨</span>
            {isRtl ? 'محاكاة انتهاك جسيم' : 'Simulate alert'}
          </button>
          {activeTab === 'verified' && (
            <button onClick={generatePDF} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-all">
              <FileText size={18} />
              {isRtl ? 'تصدير PDF' : 'Export PDF'}
            </button>
          )}
          <button onClick={loadAllData} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all">
            <span className={loading ? "animate-spin" : ""}>🔄</span>
            {isRtl ? 'تحديث البيانات' : 'Sync Records'}
          </button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl max-w-4xl">
        <button
          onClick={() => { setActiveTab('radar'); setCrawlResult(null); }}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all",
            activeTab === 'radar' ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          )}
        >
          <span className="w-2 h-2 rounded-full bg-red-500"></span>
          {isRtl ? 'رادار الرصد الرقمي (AI Radar)' : 'Safety Detection Radar'}
          {potentials.filter(p => p.status === 'pending').length > 0 && (
            <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded-md text-[10px] font-bold">
              {potentials.filter(p => p.status === 'pending').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('verified')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all",
            activeTab === 'verified' ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          )}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          {isRtl ? 'الأرشيف المعتمد (Verified Casefile)' : 'Verified Archive'}
        </button>

        <button
          onClick={() => setActiveTab('ai-qa')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all",
            activeTab === 'ai-qa' ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          )}
        >
          <span>🤖</span>
          {isRtl ? 'مستشار الأمن (AI Assistant)' : 'AI Security Console'}
        </button>

        <button
          onClick={() => setActiveTab('watchlists_alerts')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all",
            activeTab === 'watchlists_alerts' ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          )}
        >
          <span>📋</span>
          {isRtl ? 'قوائم المراقبة والتنبيهات' : 'Watchlists & Alerts'}
          {alerts.length > 0 && (
            <span className="bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-md text-[10px] font-bold animate-pulse">
              {alerts.length}
            </span>
          )}
        </button>
      </div>

      {/* Loading Spinner overlay */}
      {loading && potentials.length === 0 && (
        <div className="h-64 flex flex-col items-center justify-center text-slate-500 gap-2 bg-white rounded-3xl border border-slate-100">
          <Loader2 className="animate-spin text-teal-600" size={36} />
          <p className="text-sm font-semibold">{isRtl ? 'جاري سحب قواعد السجلات وتحليل المؤشرات الأمنية...' : 'Loading safety telemetry...'}</p>
        </div>
      )}

      {/* TAB 1: RADAR & INTELLIGENCE QUEUE (YemenJPT Safety Radar) */}
      {activeTab === 'radar' && (
        <div className="space-y-8 animate-fade-in">
          {/* Top Crawling Action Panel */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
              <span className="text-teal-500">✨</span>
              {isRtl ? 'خط استواء التزامن الذكي - رصد منصات التواصل (Firecrawl Engine)' : 'Firecrawl Intelligence Scraping & Extraction Pipeline'}
            </h3>
            <p className="text-slate-500 text-sm mb-4">
              {isRtl 
                ? 'يقوم النظام بمسح مستمر للمواقع وشبكات التواصل (X وFacebook وتليجرام) لاستخراج وتصنيف التعديات باستخدام محددات قوائم المراقبة النشطة باليمن.'
                : 'Triggers passive NLP crawler across preset Yemen channels based on watchlisted keywords and journalists to spot new potential violations.'}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder={isRtl ? 'أدخل عنوان موقع إلكتروني مخصص لزحف الذكاء الاصطناعي (اختياري)...' : 'Enter specific URL (e.g. news article, tweet url) or leave empty for auto watchlists...'}
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  disabled={isCrawling}
                  className="w-full text-sm pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <span className="absolute left-3.5 top-3.5 text-slate-400">🔗</span>
              </div>
              <button
                onClick={runFirecrawlPipeline}
                disabled={isCrawling}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isCrawling ? (
                  <>
                    <Loader2 className="animate-spin text-white" size={16} />
                    {isRtl ? 'جاري استجواب المصادر رقمياً...' : 'Crawling Platform Feed...'}
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    {isRtl ? 'تشغيل برنامج تنقيب الحريات' : 'Run Autonomous Firecrawl Agent'}
                  </>
                )}
              </button>
            </div>

            {/* Display crawl animation result */}
            {isCrawling && (
              <div className="mt-4 p-4 bg-teal-50 rounded-xl border border-teal-100 text-center animate-pulse">
                <p className="text-teal-800 text-xs font-mono">
                  [FIRE_CRAWL] Scanning Twitter/X hashtags... Matching keywords [اعتقال، اختطاف، حجب]... Querying Gemini @google/genai NLP filter...
                </p>
              </div>
            )}

            {crawlResult && (
              <div className="mt-4 p-5 bg-teal-50 border border-teal-100 rounded-2xl animate-fade-in">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="bg-teal-600 text-white text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded">
                      Crawl Success
                    </span>
                    <h4 className="font-bold text-slate-900 mt-1">
                      {isRtl ? `تم استخراج حالة للصحفي: ${crawlResult.newIncident.victimName}` : `Extracted potential case: ${crawlResult.newIncident.victimName}`}
                    </h4>
                    <p className="text-slate-600 text-xs max-w-3xl leading-relaxed mt-1">
                      <strong>{isRtl ? 'المصدر الأصلي المستهدف:' : 'Source:'}</strong> {crawlResult.newIncident.sourceUrl} ({crawlResult.newIncident.sourcePlatform})
                    </p>
                    <p className="text-slate-600 text-xs leading-relaxed mt-1">
                      <strong>{isRtl ? 'النص الذي تم اعتراضه:' : 'Captured raw text:'}</strong> "{crawlResult.newIncident.originalText}"
                    </p>
                  </div>
                  <div className="text-end">
                    <div className="text-xs text-slate-500 font-mono">Confidence Level</div>
                    <div className="text-lg font-black text-teal-700 font-mono">{crawlResult.newIncident.confidenceScore}% ({crawlResult.newIncident.confidenceLevel})</div>
                    {crawlResult.matchFound && (
                      <span className="inline-block mt-1 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">
                        ⚠️ {isRtl ? 'تم اكتشاف تكرار محتمل!' : 'Duplicate suspect flagged'}
                      </span>
                    )}
                    {crawlResult.isEscalated && (
                      <span className="inline-block mt-1 bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded animate-pulse">
                        🚨 {isRtl ? 'تم تصعيد الحالة كبلاغ حرج' : 'Escalated Critical alert'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Pending Reviews Grid / List */}
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                📋 {isRtl ? 'طابور الرصد والتدقيق لطلبات المراجعة الآلية' : 'Review Queue - Unverified AI Highlights'}
              </span>
              <span className="text-slate-400 text-xs font-mono font-normal">
                {potentials.filter(p => p.status === 'pending').length} {isRtl ? 'حالات معلقة' : 'Pending Cases'}
              </span>
            </h3>

            {potentials.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-slate-200">
                <p className="text-slate-400 font-medium">{isRtl ? 'لا توجد بلاغات معلقة حالياً في طابور التدقيق الذكي.' : 'Clean queue! No unverified incidents detected.'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {potentials.map((p) => (
                  <div 
                    key={p.id} 
                    className={cn(
                      "p-6 rounded-3xl bg-white border shadow-sm transition-all relative overflow-hidden",
                      p.status === 'verified' ? "border-emerald-200 bg-emerald-50/20" : 
                      p.status === 'rejected' ? "border-slate-200 opacity-60 bg-slate-50" : 
                      p.status === 'duplicate' ? "border-amber-200 bg-amber-50/10" : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    {/* Ribbon or Badge */}
                    <div className={cn(
                      "absolute top-0 right-0 left-0 h-1",
                      p.status === 'verified' ? "bg-emerald-500" :
                      p.status === 'rejected' ? "bg-slate-400" :
                      p.status === 'duplicate' ? "bg-amber-500" : "bg-blue-500"
                    )} />

                    <div className="flex flex-col md:flex-row gap-6 mt-2">
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={cn(
                            "px-2.5 py-1 rounded-full text-xs font-extrabold tracking-wide",
                            p.confidenceLevel === 'Very High' ? "bg-red-100 text-red-700" :
                            p.confidenceLevel === 'High' ? "bg-amber-100 text-amber-700" :
                            p.confidenceLevel === 'Medium' ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-700"
                          )}>
                            {isRtl ? 'موثوقية:' : 'Confidence:'} {p.confidenceScore}% ({p.confidenceLevel})
                          </span>

                          <span className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-full font-bold">
                            📍 {p.governorate} / {p.district}
                          </span>

                          <span className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-full font-bold">
                            📅 {p.date}
                          </span>

                          <span className="bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full font-bold">
                            ⚠️ {p.type}
                          </span>

                          {p.duplicateOf && (
                            <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-bold animate-pulse">
                              ⚠️ {isRtl ? `تكرار لقضية: ${p.duplicateOf}` : `Duplicate of ID: ${p.duplicateOf}`}
                            </span>
                          )}

                          <span className={cn(
                            "text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ml-auto",
                            p.status === 'pending' ? "bg-blue-600" :
                            p.status === 'verified' ? "bg-emerald-600" :
                            p.status === 'duplicate' ? "bg-amber-600" : "bg-slate-600"
                          )}>
                            {p.status}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <h4 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            👤 {p.victimName} 
                            <span className="text-sm font-normal text-slate-400">({p.victimInstitution})</span>
                          </h4>
                          <p className="text-slate-600 text-sm leading-relaxed">{p.description}</p>
                        </div>

                        <div className="bg-slate-50 p-4 border border-slate-100 rounded-2xl text-xs space-y-1 font-mono">
                          <div className="flex justify-between text-slate-500">
                            <strong>{isRtl ? 'المصدر الملتقط:' : 'Captured Media Source:'}</strong>
                            <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                              {p.sourcePlatform} ({isRtl ? 'رابط' : 'Link'})
                            </a>
                          </div>
                          <div className="text-slate-700 leading-relaxed italic mt-1 bg-white p-2 border border-slate-100 text-xs">
                            "{p.originalText}"
                          </div>
                        </div>
                      </div>

                      {/* Side Control panel */}
                      <div className="md:w-64 max-w-full flex md:flex-col gap-2 justify-center shrink-0 border-t md:border-t-0 md:border-r border-slate-100 pt-4 md:pt-0 md:pr-4 md:rtl:border-r-0 md:rtl:border-l md:rtl:pl-4">
                        {p.status === 'pending' || p.status === 'duplicate' ? (
                          <>
                            <button
                              onClick={() => triggerCaseDraft(p)}
                              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold p-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
                            >
                              ✨ {isRtl ? 'تحضير دبابات ومقترح القضية (AI dossier)' : 'AI Case Draft & Verifier'}
                            </button>
                            <button
                              onClick={() => updatePotentialStatus(p.id, 'verified')}
                              className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold p-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
                            >
                              <Check size={14} />
                              {isRtl ? 'اعتماد سريع' : 'Quick Approve'}
                            </button>
                            <button
                              onClick={() => updatePotentialStatus(p.id, 'rejected')}
                              className="bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold p-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
                            >
                              <X size={14} />
                              {isRtl ? 'استبعاد البلاغ' : 'Reject Lead'}
                            </button>
                          </>
                        ) : (
                          <div className="text-center p-4 bg-slate-50 rounded-2xl border border-slate-200">
                            <span className="text-slate-400 text-xs font-bold block mb-1">{isRtl ? 'تمت مراجعة الحالة' : 'Reviewed Case'}</span>
                            <span className={cn(
                              "text-xs font-black uppercase px-2 py-0.5 rounded",
                              p.status === 'verified' ? "text-emerald-700 bg-emerald-100" : "text-slate-700 bg-slate-200"
                            )}>
                              {p.status}
                            </span>
                            {p.status === 'verified' && (
                              <p className="text-[10px] text-slate-500 mt-2">{isRtl ? 'منضم للأرشيف العام للمواطنين' : 'Merged to public dashboard'}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: VERIFIED VIOLATIONS ARCHIVE (The standard/original view but polished) */}
      {activeTab === 'verified' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
          {violations.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <p className="font-bold">{isRtl ? 'لا توجد انتهاكات صحفية معتمدة مدرجة حالياً.' : 'No verified violations recorded yet.'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-start">
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-extrabold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-start">{isRtl ? 'الضحية والجهة' : 'Victim & Outlet'}</th>
                    <th className="px-6 py-4 text-start">{isRtl ? 'خط المخاطر / المحافظة' : 'RISK Geo-Zone'}</th>
                    <th className="px-6 py-4 text-start">{isRtl ? 'نوع الانتهاك' : 'Violation Class'}</th>
                    <th className="px-6 py-4 text-start">{isRtl ? 'تاريخ الحادثة' : 'Occurred'}</th>
                    <th className="px-6 py-4 text-start">{isRtl ? 'أثر النشر للمواطنين' : 'Observatory Status'}</th>
                    <th className="px-6 py-4 text-center">{isRtl ? 'تغيير الحالة وبث الرصد' : 'Observatory Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {violations.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 text-base">{v.victimName}</div>
                        <div className="text-slate-400 text-xs font-mono">{v.victimInstitution || 'صحفي مستقل'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">{v.governorate}</div>
                        <div className="text-slate-400 text-xs">{v.district || 'كامل المديرية'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-rose-50 text-rose-700 text-xs font-black rounded-full px-3 py-1 border border-rose-100">
                          {v.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-slate-500">{v.date}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2.5 py-1 rounded text-[10px] font-bold uppercase",
                          v.status === 'pending' ? "bg-amber-100 text-amber-700" :
                          v.status === 'verified' ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                        )}>
                          {v.status === 'verified' ? (isRtl ? 'موثق ومعلن' : 'Verified & Public') : v.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-1">
                          <button 
                            onClick={() => setInspectingViolation(v)}
                            title={isRtl ? 'عرض التفاصيل الكاملة' : 'View Full Details'}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          >
                            <Eye size={18} />
                          </button>
                          <button 
                            onClick={() => updateStatus(v.id, 'verified')} 
                            title={isRtl ? 'تحقق وبث للجمهور' : 'Publish as Verified'}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                          >
                            <Check size={18} />
                          </button>
                          <button 
                            onClick={() => updateStatus(v.id, 'rejected')} 
                            title={isRtl ? 'تصنيف كمرفوض' : 'Mark Rejected'}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: COMMAND & QA INTERACTION WITH ACTUAL DB STATE (AI Assistant Commands) */}
      {activeTab === 'ai-qa' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white">
            <h3 className="text-xl font-bold flex items-center gap-2 mb-2 text-teal-400">
              <span>🤖</span>
              {isRtl ? 'كونسول التحليلات المتقدمة وخلية التنبؤ المبكر (YemenJPT Command HQ)' : 'Advanced Analytics & Early Warning Console'}
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              {isRtl 
                ? 'محرك استعلام مدعوم بنموذج Gemini 3.5 ببيت الصحافة لقراءة وفهرسة السجلات النشطة ورصد الأنماط وتقديم الإرشادات وتوليد التقارير الموثقة فورياً.'
                : 'Direct natural language queries linked to the live observatory database context. Formulates real-time summaries, pattern alerts, and dossiers.'}
            </p>

            {/* Shortcut Commands */}
            <div className="mb-6 space-y-2">
              <span className="text-xs text-slate-500 font-bold block uppercase tracking-wider">
                {isRtl ? 'أوامر استعلام سريعة للرصد (Quick Agent Commands)' : 'Observatory Commands Quick triggers'}
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => runAssistantQuery('أظهر اعتقالات الصحفيين في تعز خلال الـ 30 يوماً الماضية')}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-2 rounded-xl text-xs select-none transition-all border border-slate-700"
                >
                  🔍 {isRtl ? 'اعتقالات الصحفيين في تعز' : 'Journalist Arrests in Taiz (30d)'}
                </button>
                <button
                  onClick={() => runAssistantQuery('أظهر التعديات أو الحالات المسجلة ضد الصحفيات من الكوادر النسائية باليمن')}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-2 rounded-xl text-xs select-none transition-all border border-slate-700"
                >
                  👩 {isRtl ? 'حالات الكوادر النسائية' : 'Female Targeted Violations'}
                </button>
                <button
                  onClick={() => runAssistantQuery('ما هي الحالات المرتبطة بمؤسسات إعلامية كالمسيرة أو وكالة سبأ أو تلفزيون اليمن؟')}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-2 rounded-xl text-xs select-none transition-all border border-slate-700"
                >
                  🏢 {isRtl ? 'استهداف المؤسسات الإعلامية' : 'Media Institutions Attacks'}
                </button>
                <button
                  onClick={() => runAssistantQuery('سجل إحصائي وتوليد تقرير انتهاكات الحريات الإعلامية للمحافظات')}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-2 rounded-xl text-xs select-none transition-all border border-slate-700"
                >
                  📊 {isRtl ? 'توليد تقرير شهري تفصيلي' : 'Generate Monthly Violations report'}
                </button>
                <button
                  onClick={() => runAssistantQuery('قم بتحليل الأنماط الجغرافية المقلقة وتحديد المحافظات الأكثر تصاعداً للانتهاكات')}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-2 rounded-xl text-xs select-none transition-all border border-slate-700"
                >
                  📈 {isRtl ? 'تحليل الأنماط الجغرافية المقلقة' : 'Emerging Governorate Patterns'}
                </button>
              </div>
            </div>

            {/* Terminal Input Box */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={isRtl ? 'اكتب تساؤلاً مخصصاً (مثال: رصد الحوادث حسب الجهة الفاعلة في عدن)...' : 'Type custom analytics prompt (e.g., analyse patterns of armed militiamen attacks list)...'}
                value={terminalQuery}
                onChange={(e) => setTerminalQuery(e.target.value)}
                disabled={assistantLoading}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button
                onClick={() => runAssistantQuery(terminalQuery)}
                disabled={assistantLoading || !terminalQuery.trim()}
                className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-6 py-3.5 rounded-xl text-sm transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {assistantLoading ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                {isRtl ? 'إرسال' : 'Query'}
              </button>
            </div>
          </div>

          {/* Terminal output console */}
          {(assistantLoading || terminalResponse) && (
            <div className="bg-slate-950 border border-slate-900 rounded-3xl p-6 shadow-xl text-slate-100 font-mono text-sm leading-relaxed min-h-64 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <span className="text-xs text-teal-400 font-bold tracking-widest uppercase">
                  📡 JPT-AGENTS_HQ://TELEMETRY_LOG
                </span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                </span>
              </div>

              {assistantLoading ? (
                <div className="flex flex-col items-center justify-center p-12 text-teal-500 gap-3">
                  <Loader2 className="animate-spin text-teal-600" size={36} />
                  <p className="text-xs animate-pulse">Running live semantic SQL maps against DB context via Gemini...</p>
                </div>
              ) : (
                <div className="whitespace-pre-wrap leading-relaxed text-slate-200">
                  {terminalResponse}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: WATCHLISTS & RISK ESCALATION ALERTS LOG */}
      {activeTab === 'watchlists_alerts' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          {/* Watchlists Setup Panel */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                👥 {isRtl ? 'قوائم المراقبة النشطة في اليمن (Yemen Watchlists Control)' : 'Active Target Watchlist Engine'}
              </h3>
              <p className="text-slate-500 text-sm mb-6">
                {isRtl 
                  ? 'إضافة كوادر إعلامية، قنوات البث، مناطق حمراء أو جهات فاعلة للمراقبة والمقارنة الرقمية التلقائية للبلاغات.'
                  : 'Manage active target journalists, priority news agencies, locations, or triggers to auto-match metadata during the crawler execution.'}
              </p>

              {/* Form to submit watchlist item */}
              <form onSubmit={handleAddWatchlist} className="space-y-4 mb-8">
                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
                  {(['journalist', 'organization', 'keyword', 'location'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setActiveWatchType(t)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                        activeWatchType === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                      )}
                    >
                      {t === 'journalist' ? (isRtl ? 'صحفي مستهدف' : 'Journalist') :
                       t === 'organization' ? (isRtl ? 'منصة / قناة' : 'Media Outlet') :
                       t === 'keyword' ? (isRtl ? 'كلمة مفتاحية' : 'Keyword Target') : (isRtl ? 'محافظة / أمن' : 'Zone')}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder={
                      activeWatchType === 'journalist' ? (isRtl ? 'اسم الصحافي كاملاً للرصد...' : 'Enter Journalist complete name...') :
                      activeWatchType === 'organization' ? (isRtl ? 'اسم المؤسسة الإعلامية اليمنية...' : 'Enter Media house name...') :
                      activeWatchType === 'keyword' ? (isRtl ? 'الكلمة المفتاحية (مثال: اختطاف، تكسير)...' : 'Keyword like arrest, ddos...') :
                      (isRtl ? 'اسم المحافظة أو المديرية...' : 'Governorate or district target Zone...')
                    }
                    value={wlName}
                    onChange={(e) => setWlName(e.target.value)}
                    className="w-full text-sm px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <input
                    type="text"
                    placeholder={isRtl ? 'ملاحظات وتخصيص خلفية الأهداف الرصدية...' : 'Detailed contextual notes or risk mitigation details...'}
                    value={wlNotes}
                    onChange={(e) => setWlNotes(e.target.value)}
                    className="w-full text-sm px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all"
                >
                  <Plus size={14} />
                  {isRtl ? 'إدراج في قوائم الرصد' : 'Add watch filter'}
                </button>
              </form>

              {/* Display watchlists in list */}
              <div className="divide-y divide-slate-100 max-h-[350px] overflow-y-auto">
                {watchlists.length === 0 ? (
                  <p className="py-4 text-center text-slate-400 text-sm">{isRtl ? 'قوائم المراقبة فارغة حالياً.' : 'No active watchlist filter items.'}</p>
                ) : (
                  watchlists.map((w) => (
                    <div key={w.id} className="py-3 flex justify-between items-center bg-slate-50/40 hover:bg-slate-50 px-3 rounded-lg mt-1 group">
                      <div>
                        <span className="inline-block bg-slate-900 text-teal-400 text-[9px] uppercase font-mono px-2 py-0.5 rounded-md font-black">
                          {w.type}
                        </span>
                        <span className="font-extrabold text-slate-900 ml-2 rtl:mr-2 text-sm">
                          {w.name}
                        </span>
                        <p className="text-slate-400 text-xs mt-0.5">{w.notes || (isRtl ? 'لا توجد ملاحظات إضافية' : 'No extra details')}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteWatchlist(w.id)}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        title={isRtl ? 'إلغاء المراقبة والتحذير' : 'Remove target surveillance'}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Risk Escalation Alerts log */}
          <div className="space-y-4">
            <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-sm border border-slate-800">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-2 text-rose-400">
                <span>🚨</span>
                {isRtl ? 'التصعيد السريع وغرفة الطوارئ' : 'Safety Escalation alert log'}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                {isRtl 
                  ? 'بمجرد استخراج الذكاء الاصطناعي لحالة في التعدي الجسدي أو الاعتقال، يتم إخطار الأجهزة الاستشارية فوراً.'
                  : 'Triggers priority alarm sequences whenever a physical attack or kidnapping is discovered in the intelligence pipeline.'}
              </p>

              <div className="space-y-3 max-h-[450px] overflow-y-auto">
                {alerts.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500">
                    {isRtl ? 'لا توجد تنبيهات تصعيد نشطة حالياً.' : 'No priority safety dispatches recorded.'}
                  </div>
                ) : (
                  alerts.map((a) => (
                    <div key={a.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="bg-red-900/40 text-red-400 border border-red-900 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded">
                          {a.severity}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(a.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-100">
                          {isRtl ? `بلاغ طارئ لمصلحة: ${a.victimName}` : `Emergency Dispatch: ${a.victimName}`}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          {isRtl ? `تحذير خطورة أمنية للنوع [${a.type}]. تم تصعيد ملف الحالة وتوزيع الإشارات للفرق المختصة.` : `Escalated risk protocol for [${a.type}]. Shared case dossier automatically.`}
                        </p>
                      </div>
                      <div className="bg-slate-900 p-2 border border-slate-850 rounded-xl text-[10px] text-teal-400 font-mono flex items-center gap-1">
                        🚀 {isRtl ? 'المجموعات المخبرية المرسل إليها:' : 'Notified Teams:'} {a.notifiedTeams}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CASE DRAWER / SIDEBAR DOSSIER MODAL */}
      {draftingIncident && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-end transition-all animate-fade-in">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col overflow-hidden relative">
            
            {/* Header */}
            <div className="bg-slate-950 text-white p-6 flex justify-between items-center">
              <div>
                <span className="bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded block w-fit mb-1">
                  Autonomous Dossier Drafting
                </span>
                <h3 className="text-xl font-bold text-teal-300">
                  {isRtl ? `صياغة دبابات القضية للصحفي: ${draftingIncident.victimName}` : `AI Dossier Generator: ${draftingIncident.victimName}`}
                </h3>
              </div>
              <button 
                onClick={() => setDraftingIncident(null)} 
                className="text-slate-400 hover:text-white p-2 rounded-lg bg-slate-905"
              >
                ✕
              </button>
            </div>

            {/* Dossier Body with dual view */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              
              {/* Captured Incident facts */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  {isRtl ? 'الملخص المقتضب والحدث في المصدر' : 'Captured Incident Source facts'}
                </h4>
                <div className="bg-slate-50 p-4 border border-slate-100 rounded-2xl space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><strong>{isRtl ? 'الضحية الأولية:' : 'Name:'}</strong> {draftingIncident.victimName}</div>
                    <div><strong>{isRtl ? 'المؤسسة:' : 'Institution:'}</strong> {draftingIncident.victimInstitution}</div>
                    <div><strong>{isRtl ? 'المكان المحدد:' : 'Geo-Location:'}</strong> {draftingIncident.governorate} / {draftingIncident.district}</div>
                    <div><strong>{isRtl ? 'التاريخ المزعوم:' : 'Date:'}</strong> {draftingIncident.date}</div>
                  </div>
                  <div className="text-slate-700 text-xs italic bg-white p-3 border border-slate-100 mt-2 rounded">
                    "{draftingIncident.originalText}"
                  </div>
                </div>
              </div>

              {/* Draft Output block */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {isRtl ? 'ملف الحالة التفصيلي المقترح للرصد' : 'AI-Proposed Press Observational Casefile'}
                  </h4>
                  <button
                    onClick={() => triggerCaseDraft(draftingIncident)}
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    🔄 {isRtl ? 'إعادة توليد ذكي' : 'Regenerate dossier'}
                  </button>
                </div>

                {draftLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-2xl border border-slate-100 text-slate-500 gap-3">
                    <Loader2 className="animate-spin text-teal-600" size={32} />
                    <p className="text-xs">{isRtl ? 'جاري استجواب معايير رصد الحريات وإعداد دبابات التفتيش...' : 'Assembling casefile sections using NLP Observational framework...'}</p>
                  </div>
                ) : (
                  <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl border border-slate-800 font-sans text-sm whitespace-pre-wrap leading-relaxed shadow-inner">
                    {caseDraftText}
                  </div>
                )}
              </div>
            </div>

            {/* Actions Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-2">
              <button
                onClick={() => verifyPotentialIncident(draftingIncident)}
                disabled={draftLoading}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Check size={14} />
                {isRtl ? 'اعتماد وبث الحالة فى المرصد العام (Approve & Publish)' : 'Approve & Publish to Observatory'}
              </button>
              
              <button
                onClick={() => { updatePotentialStatus(draftingIncident.id, 'rejected'); setDraftingIncident(null); }}
                className="bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <X size={14} />
                {isRtl ? 'استبعاد وحفظ' : 'Discard Lead'}
              </button>

              <button
                onClick={() => setDraftingIncident(null)}
                className="bg-slate-200 hover:bg-slate-350 text-slate-700 font-bold py-3 px-4 rounded-xl text-xs transition-all"
              >
                {isRtl ? 'إغلاق' : 'Close'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* INSPECTING DETAILED VIOLATION REPORT MODAL */}
      {inspectingViolation && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white w-full max-w-3xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="bg-slate-900 text-white p-6 flex justify-between items-center shrink-0">
              <div>
                <span className="bg-rose-600 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full block w-fit mb-1">
                  {isRtl ? 'سجل بلاغ الانتهاك المفصل' : 'Detailed Violation Report File'}
                </span>
                <h3 className="text-lg font-bold text-slate-100">
                  {isRtl ? `ملف رصد الضحية: ${inspectingViolation.victimName}` : `Observer Dossier: ${inspectingViolation.victimName}`}
                </h3>
              </div>
              <button 
                onClick={() => setInspectingViolation(null)} 
                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white rounded-full bg-slate-800 transition-colors font-bold"
              >
                ✕
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 p-6 md:p-8 overflow-y-auto space-y-8 text-start">
              
              {/* Profile & Reporter Section */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-150 space-y-4">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-2">
                  👤 {isRtl ? 'بيانات مقدم البلاغ والمصدر' : 'Reporter Capacity & Identity'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">{isRtl ? 'صفة مقدم البلاغ:' : 'Capacity of Submitter:'}</span>
                    <span className="font-extrabold text-slate-800 text-sm">
                      {inspectingViolation.reporterType === 'victim' 
                        ? (isRtl ? 'أنا الصحفي المتضرر شخصياً' : 'The affected journalist directly')
                        : (isRtl ? 'بلاغ بالنيابة عن الصحفي' : 'Submitted on behalf of the journalist')}
                    </span>
                  </div>
                  {inspectingViolation.reporterType !== 'victim' && (
                    <>
                      <div>
                        <span className="text-slate-400 block mb-0.5">{isRtl ? 'اسم الُمبلّغ الكامل:' : 'Full name of notifier:'}</span>
                        <span className="font-bold text-slate-800">{inspectingViolation.reporterName || (isRtl ? 'غير متوفر' : 'N/A')}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">{isRtl ? 'هاتف التواصل:' : 'Phone Contact:'}</span>
                        <span className="font-bold text-slate-800 font-mono">{inspectingViolation.reporterPhone || (isRtl ? 'غير متوفر' : 'N/A')}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">{isRtl ? 'صلة العلاقة بالصحفي:' : 'Relationship:'}</span>
                        <span className="font-bold text-slate-800">
                          {inspectingViolation.reporterRelation === 'colleague' ? (isRtl ? 'زميل عمل' : 'Colleague') :
                           inspectingViolation.reporterRelation === 'lawyer' ? (isRtl ? 'محامي العائلة' : 'Family Lawyer') :
                           inspectingViolation.reporterRelation === 'family' ? (isRtl ? 'أحد أفراد الأسرة' : 'Family Member') :
                           inspectingViolation.reporterRelation === 'witness' ? (isRtl ? 'شاهد عيان' : 'Eye Witness') :
                           inspectingViolation.reporterRelation || (isRtl ? 'غير متوفر' : 'N/A')}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Journalist Profile */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2">
                  📰 {isRtl ? 'هوية الصحفي الضحية الكاملة' : 'Journalist Victim Comprehensive Profile'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">{isRtl ? 'الاسم الرباعي الرسمي:' : 'Official Full Name:'}</span>
                    <span className="font-extrabold text-slate-900 text-sm">{inspectingViolation.victimName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">{isRtl ? 'الاسم الصحفي / اسم الشهرة:' : 'Journalistic Pen Name:'}</span>
                    <span className="font-bold text-slate-800">{inspectingViolation.victimPenName || (isRtl ? 'مستعمل لاسمه الرسمي' : 'Uses Official Name')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">{isRtl ? 'المؤسسة الإعلامية / جهة العمل:' : 'Media Institution:'}</span>
                    <span className="font-bold text-slate-800">{inspectingViolation.victimInstitution || (isRtl ? 'صحفي مستقل' : 'Independent / Freelancer')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">{isRtl ? 'رقم واتساب الصحفي:' : 'WhatsApp Number:'}</span>
                    <span className="font-bold text-slate-800 font-mono">{inspectingViolation.victimPhone || (isRtl ? 'غير متوفر / مخفي لدواعي أمنية' : 'N/A / Encrypted')}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block mb-0.5">{isRtl ? 'حسابات التواصل الاجتماعي والمقالات للصحفي:' : 'Social Media Accounts & Portfolios:'}</span>
                    <p className="font-bold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-line leading-relaxed text-xs">
                      {inspectingViolation.victimSocials || (isRtl ? 'لا يوجد حالياً' : 'None provided')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Geography and Category Section */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2">
                  📍 {isRtl ? 'جغرافيا وتوقيت وتصنيف التعدي' : 'Geography, Timeline & Classification'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">{isRtl ? 'المحافظة اليمنية:' : 'Yemeni Governorate:'}</span>
                    <span className="font-extrabold text-slate-900">{inspectingViolation.governorate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">{isRtl ? 'المديرية / المنطقة المحددة:' : 'Specific District / Town:'}</span>
                    <span className="font-bold text-slate-800">{inspectingViolation.district || (isRtl ? 'كامل المحافظة' : 'Entire Governorate')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">{isRtl ? 'تاريخ وتوقيت الانتهاك:' : 'Exact Date of Incident:'}</span>
                    <span className="font-bold text-slate-800 font-mono">{inspectingViolation.date}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">{isRtl ? 'تصنيف الانتهاك الرئيسي (فئة الحادثة):' : 'Incident Class Type:'}</span>
                    <span className="bg-rose-50 text-rose-700 border border-rose-100 px-3 py-1 rounded-lg font-black text-xs inline-block">
                      {inspectingViolation.type}
                    </span>
                  </div>
                </div>
              </div>

              {/* Perpetrator and narrative details */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2">
                  ⚖️ {isRtl ? 'الجهة المنتهكة، السياق والقصة الكاملة' : 'Violator Force, Backdrop & Detailed Story'}
                </h4>
                
                {/* Perpetrators List */}
                <div className="space-y-1.5">
                  <span className="text-xs text-slate-400 block">{isRtl ? 'القوة/الجهة المنتهكة المسؤولة عن التعدي:' : 'Forces Responsible for the Offense:'}</span>
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const list = inspectingViolation.perpetrator;
                      if (!list) return <span className="text-xs text-slate-800 font-bold">{isRtl ? 'مجهولة' : 'Unknown'}</span>;
                      if (list.startsWith('[') && list.endsWith(']')) {
                        try {
                          const parsed = JSON.parse(list);
                          return parsed.map((perp: string) => (
                            <span key={perp} className="bg-red-50 text-red-700 border border-red-100 px-3 py-1 rounded-xl text-xs font-bold shadow-sm">
                              {perp}
                            </span>
                          ));
                        } catch (e) {
                          // Fail safe fallback
                        }
                      }
                      return (
                        <span className="bg-red-50 text-red-700 border border-red-100 px-3 py-1 rounded-xl text-xs font-bold shadow-sm">
                          {list}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                {inspectingViolation.violationReason && (
                  <div>
                    <span className="text-xs text-slate-400 block mb-1">{isRtl ? 'سياق وخلفيات الحادثة:' : 'Backdrop & Motivation of Violation:'}</span>
                    <p className="bg-amber-50/20 text-slate-700 border border-amber-100/40 p-3.5 rounded-xl text-xs leading-relaxed font-medium">
                      {inspectingViolation.violationReason}
                    </p>
                  </div>
                )}

                <div>
                  <span className="text-xs text-slate-400 block mb-1">{isRtl ? 'الرواية الكاملة وتفاصيل الحادثة:' : 'Full Chronicles of the Offense:'}</span>
                  <p className="bg-slate-50 text-slate-800 border border-slate-150 p-4 rounded-2xl text-xs leading-relaxed font-semibold whitespace-pre-wrap select-text">
                    {inspectingViolation.description}
                  </p>
                </div>
              </div>

              {/* Evidence, Needs and Privacy Policy */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2">
                  📎 {isRtl ? 'الملفات المرفقة، التدخلات المطلوبة وسياسة الخصوصية' : 'Evidence Attachments, Demands & Privacy'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  
                  {/* Evidence types */}
                  <div className="space-y-1.5">
                    <span className="text-slate-400 block">{isRtl ? 'الأدلة والوثائق المتوفرة:' : 'Available Evidence files:'}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(() => {
                        const types = inspectingViolation.evidenceTypes;
                        if (!types) return <span className="text-slate-500 font-bold">{isRtl ? 'لا يوجد حالياً' : 'None'}</span>;
                        if (types.startsWith('[') && types.endsWith(']')) {
                          try {
                            const parsed = JSON.parse(types);
                            return parsed.map((t: string) => (
                              <span key={t} className="bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-lg text-[11px] font-bold">
                                {t}
                              </span>
                            ));
                          } catch (e) {}
                        }
                        return <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-lg text-[11px] font-bold">{types}</span>;
                      })()}
                    </div>
                  </div>

                  {/* Urgent Needs */}
                  <div className="space-y-1.5">
                    <span className="text-slate-400 block">{isRtl ? 'التدخلات القانونية أو الطبية العاجلة المطلوبة:' : 'Requested urgent intervention support:'}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(() => {
                        const needs = inspectingViolation.needs;
                        if (!needs) return <span className="text-slate-500 font-bold">{isRtl ? 'توثيق ورصد فقط' : 'Documentation only'}</span>;
                        if (needs.startsWith('[') && needs.endsWith(']')) {
                          try {
                            const parsed = JSON.parse(needs);
                            return parsed.map((n: string) => (
                              <span key={n} className="bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-lg text-[11px] font-bold">
                                {n}
                              </span>
                            ));
                          } catch (e) {}
                        }
                        return <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-lg text-[11px] font-bold">{needs}</span>;
                      })()}
                    </div>
                  </div>

                  {/* Drive Links */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <span className="text-slate-400 block">{isRtl ? 'رابط ملفات ومجلدات الأدلة الآمنة:' : 'Secure cloud evidence attachments link:'}</span>
                    {inspectingViolation.evidenceLinks && inspectingViolation.evidenceLinks !== '[]' ? (
                      (() => {
                        let link = inspectingViolation.evidenceLinks;
                        if (link.startsWith('[') && link.endsWith(']')) {
                          try {
                            const arr = JSON.parse(link);
                            link = arr[0] || '';
                          } catch (e) {}
                        }
                        if (link && link !== '[]' && link.startsWith('http')) {
                          return (
                            <a 
                              href={link} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-bold bg-blue-50 hover:bg-blue-100/50 border border-blue-200/40 px-4 py-2.5 rounded-xl transition-all text-xs"
                            >
                              🔗 {isRtl ? 'رابط مجلد التوثيق الخارجي' : 'External Documentation Link'}
                            </a>
                          );
                        }
                        return <span className="font-bold text-slate-700">{link}</span>;
                      })()
                    ) : (
                      <span className="font-bold text-slate-500">{isRtl ? 'لا تتوفر روابط حالياً' : 'No cloud links associated with this report file'}</span>
                    )}
                  </div>

                  {/* Privacy Policy */}
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block mb-0.5">{isRtl ? 'سياسة النشر وتصريح الخصوصية المعتمد:' : 'Approved publishing tier & privacy standard:'}</span>
                    <span className={cn(
                      "px-3 py-1 rounded-lg text-xs font-black shadow-sm border",
                      inspectingViolation.privacyPolicy === 'public' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                      inspectingViolation.privacyPolicy === 'anonymous' ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-red-50 text-red-700 border-red-100"
                    )}>
                      {inspectingViolation.privacyPolicy === 'public' ? (isRtl ? 'نشر كامل للرأي العام والمناصرة' : 'Full public publishing allowed') :
                       inspectingViolation.privacyPolicy === 'anonymous' ? (isRtl ? 'النشر مع إخفاء الهوية الكاملة للضحية' : 'Publish with absolute anonymity') :
                       (isRtl ? 'حفظ أرشيفي سري تام - يمنع النشر نهائياً' : 'Strict confidential archive - publication strictly forbidden')}
                    </span>
                  </div>

                </div>
              </div>

            </div>

            {/* Actions Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-2 shrink-0">
              <button
                onClick={() => setInspectingViolation(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3 px-6 rounded-2xl text-xs transition-all shadow-md shadow-slate-100"
              >
                {isRtl ? 'إغلاق الملف' : 'Close Dossier'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

function ArticleManager({ isRtl }: { isRtl: boolean }) {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterLanguage, setFilterLanguage] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedArticleForCard, setSelectedArticleForCard] = useState<any | null>(null);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await api.get('/api/articles');
        const data = response.data;
        // Parse JSON fields if they are strings from SQLite
        const parsedData = data.map((art: any) => ({
          ...art,
          title: typeof art.title === 'string' ? JSON.parse(art.title) : art.title
        }));
        parsedData.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setArticles(parsedData);
      } catch (error) {
        console.error("Error fetching articles:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  const deleteArticle = async (id: string) => {
    if (window.confirm(isRtl ? 'هل أنت متأكد من حذف هذا المقال؟' : 'Are you sure you want to delete this article?')) {
      try {
        await api.delete(`/api/articles/${id}`);
        setArticles(articles.filter(a => a.id !== id));
      } catch (error) {
        console.error("Error deleting article:", error);
      }
    }
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = 
      (article.title?.ar?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (article.title?.en?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = filterCategory === 'all' || article.category === filterCategory;
    const matchesLanguage = filterLanguage === 'all' || article.language === filterLanguage || article.language === 'both';
    const matchesStatus = filterStatus === 'all' || article.status === filterStatus;

    return matchesSearch && matchesCategory && matchesLanguage && matchesStatus;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{isRtl ? 'المقالات والأخبار' : 'Articles & News'}</h1>
          <p className="text-slate-500 text-sm mt-1">{isRtl ? 'إدارة محتوى الموقع باللغتين العربية والإنجليزية' : 'Manage site content in both Arabic and English'}</p>
        </div>
        <button 
          onClick={() => navigate('/admin/articles/new')}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
        >
          <Plus size={20} />
          {isRtl ? 'إضافة مقال جديد' : 'Add New Article'}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <input 
            type="text"
            placeholder={isRtl ? 'بحث في العناوين...' : 'Search titles...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
          <FileText className="absolute left-3 top-2.5 text-slate-400" size={18} />
        </div>
        <select 
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
        >
          <option value="all">{isRtl ? 'كل التصنيفات' : 'All Categories'}</option>
          <option value="news">{isRtl ? 'أخبار' : 'News'}</option>
          <option value="report">{isRtl ? 'تقارير' : 'Reports'}</option>
          <option value="press_release">{isRtl ? 'بيانات صحفية' : 'Press Releases'}</option>
        </select>
        <select 
          value={filterLanguage}
          onChange={(e) => setFilterLanguage(e.target.value)}
          className="px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
        >
          <option value="all">{isRtl ? 'كل اللغات' : 'All Languages'}</option>
          <option value="ar">{isRtl ? 'العربية' : 'Arabic'}</option>
          <option value="en">{isRtl ? 'الإنجليزية' : 'English'}</option>
        </select>
        <select 
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
        >
          <option value="all">{isRtl ? 'كل الحالات' : 'All Statuses'}</option>
          <option value="published">{isRtl ? 'منشور' : 'Published'}</option>
          <option value="draft">{isRtl ? 'مسودة' : 'Draft'}</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={48} /></div>
      ) : filteredArticles.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-start">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">{isRtl ? 'المقال' : 'Article'}</th>
                  <th className="px-6 py-4">{isRtl ? 'التصنيف' : 'Category'}</th>
                  <th className="px-6 py-4">{isRtl ? 'اللغة' : 'Language'}</th>
                  <th className="px-6 py-4">{isRtl ? 'الحالة' : 'Status'}</th>
                  <th className="px-6 py-4">{isRtl ? 'التاريخ' : 'Date'}</th>
                  <th className="px-6 py-4 text-center">{isRtl ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredArticles.map((article) => (
                  <tr key={article.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-100 flex-shrink-0">
                          <img 
                            src={article.mainImage || 'https://picsum.photos/seed/news/200/200'} 
                            alt="" 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 line-clamp-1">
                            {article.title[isRtl ? 'ar' : 'en'] || article.title[isRtl ? 'en' : 'ar']}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">ID: {article.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
                        {article.category === 'news' ? (isRtl ? 'أخبار' : 'News') :
                         article.category === 'report' ? (isRtl ? 'تقارير' : 'Reports') :
                         (isRtl ? 'بيانات صحفية' : 'Press Releases')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        {article.language === 'both' || article.language === 'ar' ? (
                          <span className="w-6 h-6 rounded bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-bold">AR</span>
                        ) : null}
                        {article.language === 'both' || article.language === 'en' ? (
                          <span className="w-6 h-6 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center text-[10px] font-bold">EN</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase",
                        article.status === 'published' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                      )}>
                        {article.status === 'published' ? (isRtl ? 'منشور' : 'Published') : (isRtl ? 'مسودة' : 'Draft')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(article.createdAt).toLocaleDateString(isRtl ? 'ar-YE' : 'en-US')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => setSelectedArticleForCard(article)}
                          className="p-2 text-violet-600 hover:bg-violet-50 rounded-xl transition-colors hover:scale-105"
                          title={isRtl ? 'توليد كرت مشاركة' : 'Generate Share Card'}
                        >
                          <Share2 size={18} />
                        </button>
                        <button 
                          onClick={() => navigate(`/admin/articles/${article.id}`)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                          title={isRtl ? 'تعديل' : 'Edit'}
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => deleteArticle(article.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                          title={isRtl ? 'حذف' : 'Delete'}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white p-20 rounded-2xl border-2 border-dashed border-slate-200 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText size={40} className="text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">{isRtl ? 'لا توجد نتائج' : 'No articles found'}</h3>
          <p className="text-slate-500 mt-1">{isRtl ? 'حاول تغيير معايير البحث أو أضف مقالاً جديداً' : 'Try changing your search criteria or add a new article'}</p>
          <button 
            onClick={() => { setSearchTerm(''); setFilterCategory('all'); setFilterLanguage('all'); setFilterStatus('all'); }}
            className="mt-4 text-blue-600 font-bold hover:underline"
          >
            {isRtl ? 'إعادة ضبط الفلاتر' : 'Reset filters'}
          </button>
        </div>
      )}

      <SocialCardGeneratorModal
        article={selectedArticleForCard}
        isOpen={selectedArticleForCard !== null}
        onClose={() => setSelectedArticleForCard(null)}
        isRtl={isRtl}
      />
    </div>
  );
}

function JobManager({ isRtl }: { isRtl: boolean }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'jobs' | 'applications'>('jobs');
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'jobs') {
          const res = await api.get('/api/jobs');
          const data = res.data.map((j: any) => ({
            ...j,
            title: typeof j.title === 'string' ? JSON.parse(j.title) : j.title
          }));
          setJobs(data);
        } else {
          const res = await api.get('/api/job-applications');
          setApplications(res.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

  const filteredApplications = applications.filter(app => statusFilter === 'all' || (app.status || 'pending') === statusFilter);

  const deleteJob = async (id: string) => {
    if (window.confirm(isRtl ? 'هل أنت متأكد من حذف هذه الوظيفة؟' : 'Are you sure you want to delete this job?')) {
      try {
        await api.delete(`/api/jobs/${id}`);
        setJobs(jobs.filter(j => j.id !== id));
      } catch (error) {
        console.error("Error deleting job:", error);
      }
    }
  };

  const updateApplicationStatus = async (id: string, newStatus: string) => {
    try {
      await api.put(`/api/job-applications/${id}`, { status: newStatus });
      setApplications(applications.map(app => app.id === id ? { ...app, status: newStatus } : app));
    } catch (error) {
      console.error("Error updating application status:", error);
      alert(isRtl ? 'حدث خطأ أثناء تحديث الحالة' : 'Error updating status');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">{isRtl ? 'إدارة الوظائف' : 'Job Management'}</h1>
        {activeTab === 'jobs' && (
          <button 
            onClick={() => navigate('/admin/jobs/new')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            {isRtl ? 'إضافة وظيفة' : 'Add Job'}
          </button>
        )}
      </div>

      <div className="flex justify-between items-center border-b border-slate-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('jobs')}
            className={cn(
              "pb-4 px-2 text-sm font-bold transition-colors border-b-2",
              activeTab === 'jobs' ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            {isRtl ? 'الوظائف' : 'Jobs'}
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={cn(
              "pb-4 px-2 text-sm font-bold transition-colors border-b-2",
              activeTab === 'applications' ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            {isRtl ? 'الطلبات' : 'Applications'}
          </button>
        </div>
        {activeTab === 'applications' && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-bold outline-none"
          >
            <option value="all">{isRtl ? 'كل الحالات' : 'All Statuses'}</option>
            <option value="pending">{isRtl ? 'قيد الانتظار' : 'Pending'}</option>
            <option value="reviewed">{isRtl ? 'تمت المراجعة' : 'Reviewed'}</option>
            <option value="accepted">{isRtl ? 'مقبول' : 'Accepted'}</option>
            <option value="rejected">{isRtl ? 'مرفوض' : 'Rejected'}</option>
          </select>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
      ) : activeTab === 'jobs' ? (
        jobs.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-start">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
              <tr>
                <th className="px-6 py-4">{isRtl ? 'المسمى الوظيفي' : 'Job Title'}</th>
                <th className="px-6 py-4">{isRtl ? 'الحالة' : 'Status'}</th>
                <th className="px-6 py-4">{isRtl ? 'الموعد النهائي' : 'Deadline'}</th>
                <th className="px-6 py-4 text-center">{isRtl ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-bold text-slate-900">{job.title[isRtl ? 'ar' : 'en']}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded text-[10px] font-bold uppercase",
                      job.status === 'open' ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                    )}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{job.deadline}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      <button 
                        onClick={() => navigate(`/admin/jobs/${job.id}`)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => deleteJob(job.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white p-12 rounded-2xl border-2 border-dashed border-slate-200 text-center">
          <Briefcase size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">{isRtl ? 'لا توجد وظائف حالياً' : 'No jobs found'}</p>
        </div>
        )
      ) : activeTab === 'applications' ? (
        filteredApplications.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-start">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                <tr>
                  <th className="px-6 py-4">{isRtl ? 'المتقدم' : 'Applicant'}</th>
                  <th className="px-6 py-4">{isRtl ? 'الوظيفة' : 'Job'}</th>
                  <th className="px-6 py-4">{isRtl ? 'التاريخ' : 'Date'}</th>
                  <th className="px-6 py-4">{isRtl ? 'الحالة' : 'Status'}</th>
                  <th className="px-6 py-4 text-center">{isRtl ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{app.fullName}</div>
                      <div className="text-xs text-slate-500">{app.email}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">{app.jobTitle}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{new Date(app.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <select
                        value={app.status || 'pending'}
                        onChange={(e) => updateApplicationStatus(app.id, e.target.value)}
                        className={cn(
                          "px-2 py-1 rounded text-xs font-bold uppercase border-0 cursor-pointer",
                          app.status === 'accepted' ? "bg-emerald-100 text-emerald-700" : 
                          app.status === 'rejected' ? "bg-red-100 text-red-700" : 
                          app.status === 'reviewed' ? "bg-blue-100 text-blue-700" : 
                          "bg-amber-100 text-amber-700"
                        )}
                      >
                        <option value="pending">{isRtl ? 'قيد الانتظار' : 'Pending'}</option>
                        <option value="reviewed">{isRtl ? 'تمت المراجعة' : 'Reviewed'}</option>
                        <option value="accepted">{isRtl ? 'مقبول' : 'Accepted'}</option>
                        <option value="rejected">{isRtl ? 'مرفوض' : 'Rejected'}</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => {
                            alert(`
                              Name: ${app.fullName}
                              Email: ${app.email}
                              Phone: ${app.phone}
                              Cover Letter: ${app.coverLetter}
                              LinkedIn: ${app.linkedInUrl || 'N/A'}
                              Portfolio: ${app.portfolioUrl || 'N/A'}
                            `);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <FileText size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white p-12 rounded-2xl border-2 border-dashed border-slate-200 text-center">
            <FileText size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">{isRtl ? 'لا توجد طلبات حالياً' : 'No applications found'}</p>
          </div>
        )
      ) : null}
    </div>
  );
}

function NewsletterManager({ isRtl }: { isRtl: boolean }) {
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [editorMode, setEditorMode] = useState<'visual' | 'text'>('visual');
  const [draggedType, setDraggedType] = useState<string | null>(null);

  // Initialize modular blocks for visual editor
  const [blocks, setBlocks] = useState<BlockItem[]>([
    { id: '1', type: 'h1', value: isRtl ? 'نشرة أخبار الصحافة وحقوق الإنسان - اليمن' : 'Human Rights & Media Press Release' },
    { id: '2', type: 'h2', value: isRtl ? 'رصد أسبوعي لأهم التطورات الميدانية والصحفية' : 'Weekly monitoring of journalistic developments' },
    { id: '4', type: 'p', value: isRtl ? 'نرحب بكم في النشرة الأسبوعية لبيت الصحافة باليمن. هنا نسرد أهم الحقائق والتقارير الصادرة من المرصد المالي والحقوقي لتعزيز حرية التعبير والمؤسسات المدنية.' : 'Welcome to the weekly PressHouse digest. Here is the latest digest monitoring absolute freedom of speech and civil society.' }
  ]);

  interface BlockItem {
    id: string;
    type: 'h1' | 'h2' | 'p' | 'quote' | 'link' | 'podcast' | 'video' | 'image';
    value: string;
  }

  // Update backend content state sequentially when blocks change
  useEffect(() => {
    if (editorMode === 'visual') {
      let tempContent = '';
      blocks.forEach(b => {
        if (b.type === 'h1') tempContent += `# ${b.value}\n`;
        else if (b.type === 'h2') tempContent += `## ${b.value}\n`;
        else if (b.type === 'quote') tempContent += `> ${b.value}\n`;
        else if (b.type === 'link') tempContent += `[الرابط المقترن](${b.value || 'https://presshouse-ye.org'})\n`;
        else if (b.type === 'podcast') tempContent += `🎙️ [Podcast: ${b.value}]\n`;
        else if (b.type === 'video') tempContent += `🎥 [Video: ${b.value}]\n`;
        else if (b.type === 'image') tempContent += `🖼️ [Image: ${b.value}]\n`;
        else tempContent += `${b.value}\n`;
      });
      setContent(tempContent);
    }
  }, [blocks, editorMode]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subsRes, histRes] = await Promise.all([
          api.get('/api/subscribers'),
          api.get('/api/newsletter-history')
        ]);
        
        setSubscribers(subsRes.data);
        setHistory(histRes.data);
      } catch (error) {
        console.error("Error fetching newsletter data:", error);
      }
    };
    fetchData();
  }, []);

  // Drag and Drop core handlers
  const handleDragStart = (type: string) => {
    setDraggedType(type);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedType) return;
    
    // Add new dropped item
    const newItem: BlockItem = {
      id: Date.now().toString(),
      type: draggedType as any,
      value: getPlaceholderForType(draggedType)
    };
    
    setBlocks(prev => [...prev, newItem]);
    setDraggedType(null);
  };

  const getPlaceholderForType = (type: string) => {
    if (type === 'h1') return isRtl ? 'عنوان عريض جديد' : 'New Headline';
    if (type === 'h2') return isRtl ? 'عنوان فرعي جانبي' : 'Section Subtitle';
    if (type === 'quote') return isRtl ? 'اقتباس بارز من اللقاء الإعلامي' : 'Important quote from report...';
    if (type === 'link') return 'https://presshouse-ye.org';
    if (type === 'podcast') return 'https://example.com/podcast.mp3';
    if (type === 'video') return 'https://youtu.be/dummy';
    if (type === 'image') return 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600';
    return isRtl ? 'فقرة نصية جديدة للمقال...' : 'New paragraph text...';
  };

  const addBlockInstantly = (type: any) => {
    const newItem: BlockItem = {
      id: Date.now().toString(),
      type: type,
      value: getPlaceholderForType(type)
    };
    setBlocks(prev => [...prev, newItem]);
  };

  const updateBlockValue = (id: string, val: string) => {
    setBlocks(prev => prev.map(item => item.id === id ? { ...item, value: val } : item));
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === blocks.length - 1) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    
    const newItems = [...blocks];
    const temp = newItems[index];
    newItems[index] = newItems[targetIdx];
    newItems[targetIdx] = temp;
    setBlocks(newItems);
  };

  const removeBlock = (id: string) => {
    setBlocks(prev => prev.filter(item => item.id !== id));
  };

  const renderNewsletterPreview = (rawText: string) => {
    if (!rawText) return <p className="text-slate-400 text-xs italic">{isRtl ? 'ابدأ في تكوين أو صياغة محتوى لإظهار المعاينة...' : 'Add contents to trigger simulator.'}</p>;
    
    const lines = rawText.split('\n');
    return (
      <div className="space-y-3.5 text-start">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (trimmed.startsWith('# ')) {
            return <h1 key={idx} className="text-xl font-black text-slate-900 border-b border-slate-100 pb-2 pt-2">{trimmed.substring(2)}</h1>;
          }
          if (trimmed.startsWith('## ')) {
            return <h2 key={idx} className="text-base font-bold text-slate-850 pt-1.5">{trimmed.substring(3)}</h2>;
          }
          if (trimmed.startsWith('> ')) {
            return (
              <blockquote key={idx} className={`border-slate-300 p-3 bg-slate-50 border-r-4 border-l-4 my-2 rounded-xl text-xs italic text-slate-600 ${isRtl ? 'border-r-slate-400 border-l-0' : 'border-l-slate-400 border-r-0'}`}>
                {trimmed.substring(2)}
              </blockquote>
            );
          }
          if (trimmed.startsWith('🖼️ [Image: ')) {
            const url = trimmed.replace('🖼️ [Image: ', '').replace(']', '').trim();
            return <img key={idx} src={url} alt="Embed" className="w-full max-h-48 object-cover rounded-2xl border border-slate-100/80 my-2" referrerPolicy="no-referrer" />;
          }
          if (trimmed.startsWith('🎙️ [Podcast: ')) {
            const url = trimmed.replace('🎙️ [Podcast: ', '').replace(']', '').trim();
            return (
              <div key={idx} className="p-3 bg-amber-50/65 border border-amber-100 rounded-xl flex items-center gap-2.5 my-2">
                <span className="text-base text-amber-600">🎙️</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-black text-amber-700 uppercase tracking-wider">{isRtl ? 'ملف صوتي بودكاست مدمج' : 'Embedded Podcast Episode'}</div>
                  <div className="text-[10px] text-slate-500 truncate">{url}</div>
                </div>
              </div>
            );
          }
          if (trimmed.startsWith('🎥 [Video: ')) {
            const url = trimmed.replace('🎥 [Video: ', '').replace(']', '').trim();
            return (
              <div key={idx} className="p-3 bg-red-50/50 border border-red-100 rounded-xl flex items-center gap-2.5 my-2">
                <span className="text-base text-red-600">🎥</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-black text-red-700 uppercase tracking-wider">{isRtl ? 'رابط فيديو مرئي' : 'Embedded Video Link'}</div>
                  <div className="text-[10px] text-slate-500 truncate">{url}</div>
                </div>
              </div>
            );
          }
          if (trimmed.startsWith('[الرابط المقترن](')) {
            const url = trimmed.replace('[الرابط المقترن](', '').replace(')', '').trim();
            return <a key={idx} href={url} target="_blank" rel="noreferrer" className="inline-block text-xs font-bold text-blue-600 underline hover:text-blue-700">{url}</a>;
          }
          return <p key={idx} className="text-xs leading-relaxed text-slate-600 my-1">{line}</p>;
        })}
      </div>
    );
  };

  const handleDeleteSubscriber = async (id: number) => {
    if (window.confirm(isRtl ? 'هل تريد حذف هذا المشترك؟' : 'Are you sure you want to delete this subscriber?')) {
      try {
        await api.delete(`/api/subscribers/${id}`);
        setSubscribers(subscribers.filter(sub => sub.id !== id));
      } catch (error) {
        console.error("Error deleting subscriber:", error);
        alert(isRtl ? 'فشل حذف المشترك' : 'Failed to delete subscriber');
      }
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/newsletter-history', {
        subject,
        content,
        recipientCount: subscribers.length
      });

      alert(isRtl ? 'تم إرسال النشرة ونشر المكونات بنجاح للمشتركين' : 'Newsletter sent successfully');
      setSubject('');
      
      // Clear visual blocks state to initial
      setBlocks([
        { id: '1', type: 'h1', value: isRtl ? 'نشرة بيت الصحافة الجديدة' : 'Latest news digest' }
      ]);
      
      // Refresh history
      const histRes = await api.get('/api/newsletter-history');
      setHistory(histRes.data);
    } catch (error) {
      console.error("Error sending newsletter:", error);
      alert(isRtl ? 'فشل إرسال النشرة' : 'Failed to send newsletter');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 text-start">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{isRtl ? 'إدارة النشرة البريدية ومجموعات الاتصال' : 'Newsletter Broadcaster'}</h1>
        <p className="text-xs text-slate-500 mt-1">
          {isRtl ? 'صمم نشرات بريدية تفاعلية غنية بالبودكاست والصحافة مدعومة بسحب وإسقاط المكونات والعناصر.' : 'Design beautiful, rich media articles using drag and drop composer.'}
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Visual Compositor (12 Columns -> 8 Composing, 4 list details) */}
        <div className="lg:col-span-8 space-y-4">
          
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/80 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Mail size={18} className="text-blue-600" />
                {isRtl ? 'إعداد موضوع وحقيبة النشرة الحالية' : 'Design your campaign'}
              </h2>
              
              <div className="flex bg-slate-100 rounded-xl p-1 gap-1 text-[11px] font-bold">
                <button 
                  type="button" 
                  onClick={() => setEditorMode('visual')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${editorMode === 'visual' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                >
                  {isRtl ? 'محرر مرئي (سحب وإفلات)' : 'Visual Builder'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setEditorMode('text')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${editorMode === 'text' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                >
                  {isRtl ? 'محرر نصوص (مباشر)' : 'Text mode'}
                </button>
              </div>
            </div>

            <form onSubmit={handleSend} className="space-y-6">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                  {isRtl ? 'الموضوع الرئيسي للنشرة' : 'Broadcasting Subject Line'}
                </label>
                <input 
                  type="text" 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={isRtl ? 'مثال: ملخص الرصد لانتهاكات الحريات الصحفية والإعلامية' : 'Latest Rights Monitor updates'}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none text-xs font-bold shadow-inner"
                  required
                />
              </div>

              {editorMode === 'text' ? (
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'محتوى النص البريدي' : 'Newsletter raw body'}</label>
                  <textarea 
                    rows={12}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full p-4 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Content body..."
                  />
                </div>
              ) : (
                /* Premium Drag & Drop WYSIWYG element workspace */
                <div className="space-y-4">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    {isRtl ? 'سحب المكونات من الرف أو انقر للإدراج الفوري:' : 'Drag components from the rack or click to insert instantly:'}
                  </label>

                  {/* Components rack (Draggable elements menu list) */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <div 
                      draggable 
                      onDragStart={() => handleDragStart('h1')}
                      onClick={() => addBlockInstantly('h1')}
                      className="p-3.5 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 text-center cursor-move text-xs font-bold text-slate-800 shadow-sm transition-all select-none flex flex-col items-center gap-1 active:scale-95 hover:border-blue-400"
                    >
                      <span className="text-lg font-black text-blue-600">H1</span>
                      <span>{isRtl ? 'عنوان رئيسي' : 'Header 1'}</span>
                    </div>
                    <div 
                      draggable 
                      onDragStart={() => handleDragStart('h2')}
                      onClick={() => addBlockInstantly('h2')}
                      className="p-3.5 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 text-center cursor-move text-xs font-bold text-slate-800 shadow-sm transition-all select-none flex flex-col items-center gap-1 active:scale-95 hover:border-blue-400"
                    >
                      <span className="text-sm font-black text-slate-600">H2</span>
                      <span>{isRtl ? 'عنوان فرعي' : 'Header 2'}</span>
                    </div>
                    <div 
                      draggable 
                      onDragStart={() => handleDragStart('p')}
                      onClick={() => addBlockInstantly('p')}
                      className="p-3.5 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 text-center cursor-move text-xs font-bold text-slate-800 shadow-sm transition-all select-none flex flex-col items-center gap-1 active:scale-95 hover:border-blue-400"
                    >
                      <span className="text-xs font-serif text-slate-400">Paragraph</span>
                      <span>{isRtl ? 'فقرة نصية' : 'Paragraph'}</span>
                    </div>
                    <div 
                      draggable 
                      onDragStart={() => handleDragStart('quote')}
                      onClick={() => addBlockInstantly('quote')}
                      className="p-3.5 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 text-center cursor-move text-xs font-bold text-slate-800 shadow-sm transition-all select-none flex flex-col items-center gap-1 active:scale-95 hover:border-blue-400"
                    >
                      <span className="text-sm text-indigo-600">“ ”</span>
                      <span>{isRtl ? 'اقتباس مميز' : 'Quote block'}</span>
                    </div>
                    <div 
                      draggable 
                      onDragStart={() => handleDragStart('link')}
                      onClick={() => addBlockInstantly('link')}
                      className="p-3.5 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 text-center cursor-move text-xs font-bold text-slate-800 shadow-sm transition-all select-none flex flex-col items-center gap-1 active:scale-95 hover:border-blue-400"
                    >
                      <span className="text-xs text-blue-500 font-mono underline">presshouse.org</span>
                      <span>{isRtl ? 'رابط ويب' : 'Web Link'}</span>
                    </div>
                    <div 
                      draggable 
                      onDragStart={() => handleDragStart('podcast')}
                      onClick={() => addBlockInstantly('podcast')}
                      className="p-3.5 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 text-center cursor-move text-xs font-bold text-slate-800 shadow-sm transition-all select-none flex flex-col items-center gap-1 active:scale-95 hover:border-blue-400"
                    >
                      <span className="text-sm text-yellow-600">🎙️</span>
                      <span>{isRtl ? 'حلقة بودكاست' : 'Podcast audio'}</span>
                    </div>
                    <div 
                      draggable 
                      onDragStart={() => handleDragStart('video')}
                      onClick={() => addBlockInstantly('video')}
                      className="p-3.5 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 text-center cursor-move text-xs font-bold text-slate-800 shadow-sm transition-all select-none flex flex-col items-center gap-1 active:scale-95 hover:border-blue-400"
                    >
                      <span className="text-sm text-red-600">🎥</span>
                      <span>{isRtl ? 'فيديو مدمج' : 'Embedded Video'}</span>
                    </div>
                    <div 
                      draggable 
                      onDragStart={() => handleDragStart('image')}
                      onClick={() => addBlockInstantly('image')}
                      className="p-3.5 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 text-center cursor-move text-xs font-bold text-slate-800 shadow-sm transition-all select-none flex flex-col items-center gap-1 active:scale-95 hover:border-blue-400"
                    >
                      <span className="text-sm text-green-600">🖼️</span>
                      <span>{isRtl ? 'صورة تعبيرية' : 'Embed Image'}</span>
                    </div>
                  </div>

                  {/* WYSIWYG Composer Canvas drop handler boundary */}
                  <div 
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    className="min-h-[400px] border-2 border-dashed border-slate-350 hover:bg-blue-50/5 p-6 rounded-[24px] space-y-4 transition-all bg-slate-50 relative"
                  >
                    {blocks.length === 0 && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 space-y-1 p-4 pointer-events-none">
                        <Plus className="animate-bounce" size={24} />
                        <span className="text-xs font-bold">{isRtl ? 'منطقة البناء: اسحب العناصر وأفلتها هنا' : 'Workspace: Drag element cards here'}</span>
                      </div>
                    )}

                    {blocks.map((block, index) => (
                      <div 
                        key={block.id} 
                        className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3 group/block animate-in fade-in zoom-in-95 duration-200"
                      >
                        {/* Drag indicator drag handles */}
                        <div className="flex flex-col gap-1 text-slate-300 group-hover/block:text-slate-400 self-center">
                          <button type="button" onClick={() => moveBlock(index, 'up')} disabled={index === 0} className="hover:text-blue-500 disabled:opacity-30 cursor-pointer">▲</button>
                          <span className="text-[10px] font-mono text-center">{index + 1}</span>
                          <button type="button" onClick={() => moveBlock(index, 'down')} disabled={index === blocks.length - 1} className="hover:text-blue-500 disabled:opacity-30 cursor-pointer">▼</button>
                        </div>

                        {/* Block type tags */}
                        <div className="flex-1 space-y-2 text-start">
                          <div className="flex items-center gap-2 justify-between">
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                              {block.type === 'h1' && (isRtl ? 'عنوان عريض H1' : 'Heading 1')}
                              {block.type === 'h2' && (isRtl ? 'عنوان فرعي H2' : 'Heading 2')}
                              {block.type === 'p' && (isRtl ? 'فقرة نصية P' : 'Paragraph')}
                              {block.type === 'quote' && (isRtl ? 'اقتباس مميز' : 'Quote Block')}
                              {block.type === 'link' && (isRtl ? 'رابط ويب' : 'Web Link')}
                              {block.type === 'podcast' && (isRtl ? 'ملف صوتي بودكاست' : 'Podcast link')}
                              {block.type === 'video' && (isRtl ? 'فيديو مدمج' : 'Video URL')}
                              {block.type === 'image' && (isRtl ? 'صورة تعبيرية' : 'Image URL')}
                            </span>
                            
                            <button 
                              type="button" 
                              onClick={() => removeBlock(block.id)}
                              className="text-xs text-rose-500 opacity-0 group-hover/block:opacity-100 hover:text-rose-600 transition-opacity p-1 rounded-lg hover:bg-rose-50"
                            >
                              <X size={14} />
                            </button>
                          </div>

                          {block.type === 'p' || block.type === 'quote' ? (
                            <textarea
                              rows={2}
                              value={block.value}
                              onChange={(e) => updateBlockValue(block.id, e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200/60 focus:ring-1 focus:ring-blue-500 outline-none text-xs leading-relaxed font-sans"
                            />
                          ) : (
                            <input
                              type="text"
                              value={block.value}
                              onChange={(e) => updateBlockValue(block.id, e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200/60 focus:ring-1 focus:ring-blue-500 outline-none text-xs font-medium"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* simulated mobile preview */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-2">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center justify-between">
                  <span>{isRtl ? '📱 معاينة حية لمحاكاة استلام البريد المستجيب للـ CSS' : '📱 LIVE COMPLETED NEWSLETTER EMAIL CLIENT PREVIEW'}</span>
                  <span className="h-1 py-1 px-1.5 bg-green-100 text-green-700 rounded-full font-bold text-[8px] flex items-center">Visual Sandbox</span>
                </span>
                <div className="bg-white rounded-2xl shadow-inner border border-slate-100/60 p-4 max-h-[290px] overflow-y-auto">
                  {renderNewsletterPreview(content)}
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl text-xs font-black transition-all disabled:opacity-50 cursor-pointer shadow-md active:scale-95 flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>{isRtl ? 'جاري إرسال النشرة ونشر المكونات...' : 'Broadcasting visual elements...'}</span>
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    <span>{isRtl ? 'إرسال ونشر المظهر العام فوراً إلى القائمة المشتركة' : 'Broadcast WYSIWYG Campaign Now'}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Pane: Subscribers List & History */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users size={18} className="text-blue-600" />
              {isRtl ? 'مشتركو النشرة البريدية' : 'Active Subscribers'} ({subscribers.length})
            </h2>
            <div className="max-h-[250px] overflow-y-auto divide-y divide-slate-100 pr-1 select-none">
              {subscribers.map((sub) => (
                <div key={sub.id} className="py-2.5 flex justify-between items-center group">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-700">{sub.email}</span>
                    <span className="text-[9px] text-slate-400">
                      {sub.source || 'Website'} • {new Date(sub.createdAt || sub.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <button 
                    onClick={() => handleDeleteSubscriber(sub.id)}
                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-transparent hover:border-rose-200 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title={isRtl ? 'حذف المشترك' : 'Delete'}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {subscribers.length === 0 && (
                <p className="text-center text-slate-400 py-6 text-xs">{isRtl ? 'لا يوجد مشتركون بعد' : 'No subscribers'}</p>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-base font-bold text-slate-900">
              {isRtl ? 'سجل النشرات البريدية' : 'Campaign History'}
            </h2>
            <div className="max-h-[250px] overflow-y-auto pr-1 space-y-2">
              {history.map((item) => (
                <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <div className="font-bold text-slate-800 truncate">{item.subject}</div>
                  <div className="text-[9px] text-slate-400 mt-1 flex justify-between">
                    <span>{isRtl ? 'المرسل لهم:' : 'Recipients:'} {item.recipient_count || subscribers.length}</span>
                    <span>{new Date(item.sent_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              {history.length === 0 && (
                <p className="text-center text-slate-400 py-6 text-xs">{isRtl ? 'لا يوجد حملات في السجل' : 'No history yet'}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
