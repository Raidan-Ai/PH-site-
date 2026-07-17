import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Users, 
  Briefcase, 
  ShieldAlert, 
  CheckCircle, 
  Calendar, 
  Clock, 
  Star, 
  Award, 
  Trash2, 
  Edit3, 
  Plus, 
  Search, 
  Filter, 
  Sparkles, 
  Send, 
  FileText, 
  Check, 
  AlertCircle, 
  X, 
  UserCheck, 
  QrCode, 
  Activity, 
  TrendingUp, 
  Coins,
  MapPin,
  Mail,
  Phone,
  BookOpen,
  GraduationCap,
  MessageSquare,
  Bookmark,
  Building,
  CalendarDays,
  FileBadge
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../../services/api';
import { cn } from '../../lib/utils';

// Core Type Declarations
export interface Volunteer {
  id: number;
  volunteer_id: string;
  full_name: string;
  profile_photo?: string;
  gender?: string;
  dob?: string;
  nationality?: string;
  location?: string;
  address?: string;
  phone?: string;
  email?: string;
  occupation?: string;
  organization?: string;
  education?: string;
  skills?: string | string[]; // JSON Array
  languages?: string | string[]; // JSON Array
  certifications?: string | string[]; // JSON Array
  status: 'Applicant' | 'Under Review' | 'Accepted' | 'Active' | 'Inactive' | 'Suspended' | 'Alumni';
  registration_date?: string;
  preferred_areas?: string;
  availability?: string;
  experience_level?: string;
}

export interface Opportunity {
  id: number;
  title: string;
  slug: string;
  program_id?: string;
  project_id?: string;
  description?: string;
  requirements?: string;
  location?: string;
  duration?: string;
  available_positions: number;
  application_deadline?: string;
  form_fields?: string | any[]; // JSON Array
}

export interface Application {
  id: number;
  opportunity_id: number;
  full_name: string;
  email: string;
  phone?: string;
  resume_url?: string;
  portfolio_link?: string;
  answers?: string | Record<string, any>;
  screening_notes?: string;
  interview_notes?: string;
  background_check?: string;
  references_data?: string | any[];
  interviewer?: string;
  evaluation_scores?: string | Record<string, number>;
  status: 'Submitted' | 'Screening' | 'Interview' | 'Assessment' | 'Accepted' | 'Rejected';
  createdAt?: string;
}

export interface Assignment {
  id: number;
  volunteer_id: number;
  opportunity_id?: number;
  assignment_name: string;
  project_id?: string;
  department?: string;
  supervisor?: string;
  start_date?: string;
  end_date?: string;
  duty_location?: string;
  status: 'Planned' | 'Active' | 'Completed';
}

export interface HourLog {
  id: number;
  volunteer_id: number;
  project_id?: string;
  activity?: string;
  date: string;
  hours_worked: number;
  status: 'pending' | 'approved';
}

export interface PerformanceReview {
  id: number;
  volunteer_id: number;
  review_period: string;
  supervisor_feedback?: string;
  self_assessment?: string;
  communication_score: number;
  leadership_score: number;
  teamwork_score: number;
  technical_score: number;
  reliability_score: number;
  avg_score: number;
}

export interface VmsEvent {
  id: number;
  name: string;
  description?: string;
  date: string;
  venue?: string;
  attendees?: string | number[]; // JSON
  checkins?: string | number[]; // JSON
}

export interface Recognition {
  id: number;
  volunteer_id: number;
  category: string;
  description?: string;
  badge?: string;
  date_awarded: string;
}

export interface Onboarding {
  id: number;
  volunteer_id: number;
  orientation_sessions?: string | string[]; // JSON Array
  checklist?: string | Record<string, boolean>; // JSON Checklist
  submitted_documents?: string | string[]; // JSON Array
  signature?: string;
  status: 'pending' | 'completed';
}

export default function VolunteerRegistry() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  // Navigation State
  const [activeTab, setActiveTab] = useState<'registry' | 'opportunities' | 'onboarding' | 'assignments' | 'hours' | 'reviews' | 'events' | 'recognition' | 'alumni' | 'ai'>('registry');

  // Core Lists States
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [hours, setHours] = useState<HourLog[]>([]);
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [events, setEvents] = useState<VmsEvent[]>([]);
  const [recognitions, setRecognitions] = useState<Recognition[]>([]);
  const [onboardings, setOnboardings] = useState<Onboarding[]>([]);

  // Filtering System
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [skillFilter, setSkillFilter] = useState('');

  // Loading / Action states
  const [loading, setLoading] = useState(true);
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Forms modals
  const [volunteerModalOpen, setVolunteerModalOpen] = useState(false);
  const [opportunityModalOpen, setOpportunityModalOpen] = useState(false);
  const [hoursModalOpen, setHoursModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [recognitionModalOpen, setRecognitionModalOpen] = useState(false);

  // Form Field parameters
  const [volunteerForm, setVolunteerForm] = useState<Partial<Volunteer>>({
    full_name: '',
    email: '',
    phone: '',
    gender: 'Male',
    location: '',
    occupation: '',
    skills: [],
    languages: [],
    status: 'Applicant',
    preferred_areas: '',
    availability: 'Part-time',
    experience_level: 'Intermediate'
  });

  const [opportunityForm, setOpportunityForm] = useState<Partial<Opportunity>>({
    title: '',
    description: '',
    requirements: '',
    location: '',
    duration: '',
    available_positions: 5,
    application_deadline: '',
    form_fields: []
  });

  const [hoursForm, setHoursForm] = useState<Partial<HourLog>>({
    volunteer_id: 0,
    project_id: '',
    activity: '',
    date: new Date().toISOString().split('T')[0],
    hours_worked: 0
  });

  const [reviewForm, setReviewForm] = useState<Partial<PerformanceReview>>({
    volunteer_id: 0,
    review_period: 'Q1 Review',
    supervisor_feedback: '',
    self_assessment: '',
    communication_score: 5,
    leadership_score: 5,
    teamwork_score: 5,
    technical_score: 5,
    reliability_score: 5
  });

  const [eventForm, setEventForm] = useState<Partial<VmsEvent>>({
    name: '',
    description: '',
    date: '',
    venue: '',
    attendees: [],
    checkins: []
  });

  const [recognitionForm, setRecognitionForm] = useState<Partial<Recognition>>({
    volunteer_id: 0,
    category: 'Outstanding Contributor',
    description: '',
    badge: 'Gold'
  });

  // Load backend data on load
  const loadData = async () => {
    setLoading(true);
    try {
      const [vRes, oRes, aRes, asRes, hRes, rRes, eRes, recRes, onRes] = await Promise.all([
        api.get('/api/volunteers/registry').catch(() => ({ data: [] })),
        api.get('/api/volunteers/opportunities').catch(() => ({ data: [] })),
        api.get('/api/volunteers/applications').catch(() => ({ data: [] })),
        api.get('/api/volunteers/assignments').catch(() => ({ data: [] })),
        api.get('/api/volunteers/hours').catch(() => ({ data: [] })),
        api.get('/api/volunteers/reviews').catch(() => ({ data: [] })),
        api.get('/api/volunteers/events').catch(() => ({ data: [] })),
        api.get('/api/volunteers/recognition').catch(() => ({ data: [] })),
        api.get('/api/volunteers/onboarding').catch(() => ({ data: [] }))
      ]);

      setVolunteers(vRes.data || []);
      setOpportunities(oRes.data || []);
      setApplications(aRes.data || []);
      setAssignments(asRes.data || []);
      setHours(hRes.data || []);
      setReviews(rRes.data || []);
      setEvents(eRes.data || []);
      setRecognitions(recRes.data || []);
      setOnboardings(onRes.data || []);
    } catch (err) {
      console.error('VMS database read failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Safe JSON Parsing helper
  const safeParse = (data: any, fallback: any = []) => {
    if (!data) return fallback;
    if (typeof data !== 'string') return data;
    try {
      return JSON.parse(data);
    } catch {
      return fallback;
    }
  };

  // Stats Counters
  const totalVolunteersCount = volunteers.length;
  const activeVolunteersCount = volunteers.filter(v => v.status === 'Active').length;
  const underReviewCount = volunteers.filter(v => v.status === 'Under Review' || v.status === 'Applicant').length;
  const totalHoursWorked = hours.reduce((sum, h) => sum + (h.status === 'approved' ? h.hours_worked : 0), 0);
  
  // Economic multiplier calculation: Hourly nominal valuation of training/service in Yemen = ~15 USD/hr
  const economicMultiplierUSD = totalHoursWorked * 15;

  // Handles Saving Volunteer
  const handleSaveVolunteer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (volunteerForm.id) {
        await api.put(`/api/volunteers/registry/${volunteerForm.id}`, volunteerForm);
      } else {
        await api.post('/api/volunteers/registry', volunteerForm);
      }
      setVolunteerModalOpen(false);
      setVolunteerForm({
        full_name: '', email: '', phone: '', gender: 'Male', location: '', occupation: '',
        skills: [], languages: [], status: 'Applicant', preferred_areas: '', availability: 'Part-time', experience_level: 'Intermediate'
      });
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error processing request');
    }
  };

  // Handles Saving Opportunity
  const handleSaveOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (opportunityForm.id) {
        await api.put(`/api/volunteers/opportunities/${opportunityForm.id}`, opportunityForm);
      } else {
        await api.post('/api/volunteers/opportunities', opportunityForm);
      }
      setOpportunityModalOpen(false);
      setOpportunityForm({
        title: '', description: '', requirements: '', location: '', duration: '', available_positions: 5, application_deadline: '', form_fields: []
      });
      loadData();
    } catch (err) {
      console.error('Error saving opportunity', err);
    }
  };

  // Handles Saving Hours Log
  const handleSaveHours = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/volunteers/hours', hoursForm);
      setHoursModalOpen(false);
      setHoursForm({ volunteer_id: 0, project_id: '', activity: '', date: new Date().toISOString().split('T')[0], hours_worked: 0 });
      loadData();
    } catch (err) {
      console.error('Error logging hours', err);
    }
  };

  // Handles Saving Performance Review
  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/volunteers/reviews', reviewForm);
      setReviewModalOpen(false);
      setReviewForm({
        volunteer_id: 0, review_period: 'Q1 Review', supervisor_feedback: '', self_assessment: '',
        communication_score: 5, leadership_score: 5, teamwork_score: 5, technical_score: 5, reliability_score: 5
      });
      loadData();
    } catch (err) {
      console.error('Error leaving review', err);
    }
  };

  // Hour approval status
  const toggleHourStatus = async (hour: HourLog) => {
    try {
      await api.put(`/api/volunteers/hours/${hour.id}`, {
        ...hour,
        status: hour.status === 'pending' ? 'approved' : 'pending'
      });
      loadData();
    } catch (err) {
      console.error('Error updating hours log', err);
    }
  };

  // Delete Action helpers
  const deleteRegistry = async (id: number) => {
    if (!confirm(isRtl ? 'هل أنت متأكد من رغبتك بحذف هذا المتطوع؟' : 'Are you sure you want to delete this volunteer?')) return;
    try {
      await api.delete(`/api/volunteers/registry/${id}`);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteOpportunity = async (id: number) => {
    if (!confirm(isRtl ? 'هل تريد حذف هذه الفرصة بالتأكيد؟' : 'Are you sure you want to delete this opportunity?')) return;
    try {
      await api.delete(`/api/volunteers/opportunities/${id}`);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // Run AI Intelligent Matching recommendation
  const runAiMatching = async (oppTitle: string, requirements: string) => {
    setAiLoading(true);
    setAiAnalysis(null);
    try {
      const simplifiedVolunteers = volunteers.map(v => ({
        name: v.full_name,
        location: v.location,
        skills: safeParse(v.skills),
        level: v.experience_level,
        status: v.status
      }));
      const response = await api.post('/api/volunteers/ai/generate', {
        mode: 'match',
        payload: {
          opportunityTitle: oppTitle,
          opportunityRequirements: requirements,
          volunteers: simplifiedVolunteers
        }
      });
      setAiAnalysis(response.data.result);
    } catch (err) {
      setAiAnalysis(isRtl ? 'فشل المحرك الذكي للرصد والمطابقة في جلب الرد حالياً.' : 'Human intelligence server is currently offline.');
    } finally {
      setAiLoading(false);
    }
  };

  // Run AI Applicant Assessment
  const runAiAssessment = async (app: Application) => {
    setAiLoading(true);
    setAiAnalysis(null);
    try {
      const opp = opportunities.find(o => o.id === app.opportunity_id);
      const response = await api.post('/api/volunteers/ai/generate', {
        mode: 'assess',
        payload: {
          applicantName: app.full_name,
          opportunityTitle: opp?.title || 'General Volunteer',
          education: app.phone || '',
          skills: app.email,
          answers: safeParse(app.answers, {})
        }
      });
      setAiAnalysis(response.data.result);
    } catch (err) {
      setAiAnalysis('AI assessment connection failed');
    } finally {
      setAiLoading(false);
    }
  };

  // Onboarding actions completion
  const handleOnboardingChecklist = async (onb: Onboarding, key: string, val: boolean) => {
    const currentChecklist = safeParse(onb.checklist, {});
    const updatedChecklist = { ...currentChecklist, [key]: val };
    const allChecked = Object.values(updatedChecklist).every(v => v === true);
    try {
      await api.put(`/api/volunteers/onboarding/${onb.id}`, {
        ...onb,
        checklist: JSON.stringify(updatedChecklist),
        status: allChecked ? 'completed' : 'pending'
      });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered Registry Items
  const filteredVolunteers = volunteers.filter(v => {
    const matchesSearch = v.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (v.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (v.preferred_areas?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
    
    const parsedSkills = safeParse(v.skills, []);
    const matchesSkill = !skillFilter || parsedSkills.some((s: string) => s.toLowerCase().includes(skillFilter.toLowerCase()));

    return matchesSearch && matchesStatus && matchesSkill;
  });

  return (
    <div className="p-6 bg-slate-50 min-h-screen text-slate-900" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Upper Title Segment */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">
            {isRtl ? 'مركز إدارة المتطوعين' : 'Volunteers Center'}
          </h1>
          <p className="text-slate-500 mt-1">
            {isRtl ? 'منظومة التوظيف، الرصد الدائم، والتكليف المستدام لشركاء العمل الميداني' : 'Complete system for scheduling, tracking, screening and deploying NGO volunteers'}
          </p>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => {
              setVolunteerForm({
                full_name: '', email: '', phone: '', gender: 'Male', location: '', occupation: '',
                skills: [], languages: [], status: 'Applicant', preferred_areas: '', availability: 'Part-time', experience_level: 'Intermediate'
              });
              setVolunteerModalOpen(true);
            }}
            className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition shadow-sm font-semibold text-sm"
          >
            <Plus size={16} />
            {isRtl ? 'إضافة متطوع جديد' : 'New Volunteer'}
          </button>
        </div>
      </div>

      {/* Main Executive Statistics - Bento style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-slate-400 font-medium text-sm">{isRtl ? 'إجمالي السجل' : 'Registered Volunteers'}</span>
            <h3 className="text-3xl font-bold mt-2 text-slate-800">{loading ? '...' : totalVolunteersCount}</h3>
          </div>
          <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
            <Users size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-slate-400 font-medium text-sm">{isRtl ? 'الكوادر النشطة ميدانياً' : 'Active Duty'}</span>
            <h3 className="text-2xl font-bold mt-2 text-emerald-600">{loading ? '...' : activeVolunteersCount}</h3>
          </div>
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl">
            <UserCheck size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-slate-400 font-medium text-sm">{isRtl ? 'قيد المراجعة والفحص' : 'Screening Pipeline'}</span>
            <h3 className="text-2xl font-bold mt-2 text-amber-500">{loading ? '...' : underReviewCount}</h3>
          </div>
          <div className="p-4 bg-amber-50 text-amber-500 rounded-xl">
            <ShieldAlert size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between bg-gradient-to-br from-slate-900 to-slate-850 text-white">
          <div>
            <span className="text-slate-400 font-medium text-sm block">{isRtl ? 'العائد الاقتصادي التقديري' : 'Economic Valuation'}</span>
            <h3 className="text-xl font-mono font-bold mt-1 text-emerald-400">
              {economicMultiplierUSD.toLocaleString()} USD
            </h3>
            <span className="text-xs text-slate-400 mt-1 block">
              {isRtl ? `استناداً إلى ${totalHoursWorked} ساعة عمل` : `Calculated from ${totalHoursWorked} hrs`}
            </span>
          </div>
          <div className="p-4 bg-white/10 text-white rounded-xl">
            <Coins size={24} />
          </div>
        </div>
      </div>

      {/* Interactive Tabs Header */}
      <div className="flex border-b border-slate-205 overflow-x-auto whitespace-nowrap mb-6 gap-2">
        {[
          { id: 'registry', label: isRtl ? 'السجل الرئيسي' : 'Registry', icon: <Users size={16} /> },
          { id: 'opportunities', label: isRtl ? 'الفرص الاستقطابية' : 'Opportunities', icon: <Briefcase size={16} /> },
          { id: 'onboarding', label: isRtl ? 'توقيع الوثائق والتهيئة' : 'Agreements & Onboarding', icon: <CheckCircle size={16} /> },
          { id: 'assignments', label: isRtl ? 'التكليف والمهام' : 'Duty Deployment', icon: <Calendar size={16} /> },
          { id: 'hours', label: isRtl ? 'سجل الساعات الميدانية' : 'Hours sheets', icon: <Clock size={16} /> },
          { id: 'reviews', label: isRtl ? 'تقييم الأداء والمراجعة' : 'Performance', icon: <Star size={16} /> },
          { id: 'recognition', label: isRtl ? 'الأوسمة والشهادات الرقمية' : 'Badges & Awards', icon: <Award size={16} /> },
          { id: 'events', label: isRtl ? 'فعاليات المتطوعين' : 'Gathering Events', icon: <QrCode size={16} /> },
          { id: 'alumni', label: isRtl ? 'شبكة الخريجين والإرشاد' : 'Alumni & Mentors', icon: <GraduationCap size={16} /> },
          { id: 'ai', label: isRtl ? 'محرك ذكاء الكفاءات' : 'VMS AI Engine', icon: <Sparkles size={16} /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              setAiAnalysis(null);
            }}
            className={cn(
              "flex items-center gap-2 px-5 py-3 font-semibold text-sm transition border-b-2",
              activeTab === tab.id 
                ? "border-slate-800 text-slate-800 font-bold" 
                : "border-transparent text-slate-500 hover:text-slate-800"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tabs Content Sections */}

      {/* TAB 1: Main Register */}
      {activeTab === 'registry' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm mb-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="relative w-full md:w-1/3">
                <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder={isRtl ? 'البحث بالاسم، المدينة أو الشغف...' : 'Search by registration details, cities...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-205 focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
              </div>

              <div className="flex gap-2 w-full md:w-auto overflow-x-auto justify-end">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-slate-205 bg-white text-sm"
                >
                  <option value="ALL">{isRtl ? 'كل الحالات' : 'All Status'}</option>
                  <option value="Applicant">{isRtl ? 'مقدم جديد' : 'Applicant'}</option>
                  <option value="Under Review">{isRtl ? 'قيد المراجعة' : 'Under Review'}</option>
                  <option value="Accepted">{isRtl ? 'مقبول' : 'Accepted'}</option>
                  <option value="Active">{isRtl ? 'نشط ميدانياً' : 'Active'}</option>
                  <option value="Inactive">{isRtl ? 'خامل مؤقتاً' : 'Inactive'}</option>
                  <option value="Alumni">{isRtl ? 'خريج ممارس' : 'Alumni'}</option>
                </select>

                <input
                  type="text"
                  placeholder={isRtl ? 'فلترة بالمهارة (مثل: تصوير)' : 'Filter by specialized skill...'}
                  value={skillFilter}
                  onChange={(e) => setSkillFilter(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-slate-205 bg-white text-sm"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 font-bold text-xs uppercase tracking-wider text-center">
                  <th className="py-4 px-6 text-right">{isRtl ? 'الاسم والرمز' : 'Name & ID'}</th>
                  <th className="py-4 px-6">{isRtl ? 'المدينة' : 'Location'}</th>
                  <th className="py-4 px-6">{isRtl ? 'التصنيف المفضل' : 'Preferred Areas'}</th>
                  <th className="py-4 px-6">{isRtl ? 'التوفر والجاهزية' : 'Availability'}</th>
                  <th className="py-4 px-6">{isRtl ? 'الهوية والمهارات الرئيسية' : 'Main Skills'}</th>
                  <th className="py-4 px-6">{isRtl ? 'حالة التكليف' : 'Deployment Status'}</th>
                  <th className="py-4 px-6 text-center">{isRtl ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredVolunteers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      {isRtl ? 'لم يتم العثور على متطوعين يتطابقون مع الفلاتر الحالية.' : 'No profiles match current query filters.'}
                    </td>
                  </tr>
                ) : (
                  filteredVolunteers.map((vol) => (
                    <tr 
                      key={vol.id} 
                      className="border-b border-slate-100 hover:bg-slate-50/70 transition cursor-pointer"
                      onClick={() => setSelectedVolunteer(vol)}
                    >
                      <td className="py-4 px-6 text-right font-medium text-slate-900 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                          {vol.full_name.charAt(0)}
                        </div>
                        <div>
                          <span className="block font-semibold">{vol.full_name}</span>
                          <span className="text-xs text-slate-400 font-mono block mt-0.5">{vol.volunteer_id}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-500 text-sm align-middle">
                        <span className="flex items-center gap-1"><MapPin size={14} /> {vol.location}</span>
                      </td>
                      <td className="py-4 px-6 text-slate-600 text-sm align-middle">
                        {vol.preferred_areas}
                      </td>
                      <td className="py-4 px-6 text-slate-600 text-sm align-middle">
                        {vol.availability}
                      </td>
                      <td className="py-4 px-6 text-sm align-middle">
                        <div className="flex flex-wrap gap-1">
                          {safeParse(vol.skills, []).slice(0, 3).map((sk: string, i: number) => (
                            <span key={i} className="bg-slate-100 px-2 py-0.5 rounded text-xs text-slate-600">
                              {sk}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-6 align-middle">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-semibold inline-block",
                          vol.status === 'Active' && "bg-emerald-50 text-emerald-600",
                          vol.status === 'Applicant' && "bg-purple-50 text-purple-600",
                          vol.status === 'Under Review' && "bg-yellow-50 text-yellow-600",
                          vol.status === 'Accepted' && "bg-blue-50 text-blue-600",
                          vol.status === 'Inactive' && "bg-slate-100 text-slate-500",
                          vol.status === 'Alumni' && "bg-sky-50 text-sky-600"
                        )}>
                          {vol.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 align-middle text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-2 justify-center">
                          <button 
                            onClick={() => {
                              setVolunteerForm(vol);
                              setVolunteerModalOpen(true);
                            }}
                            className="p-1 px-2.5 text-slate-500 hover:text-slate-800 border border-slate-205 rounded-lg hover:bg-slate-100 transition"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => deleteRegistry(vol.id)}
                            className="p-1 px-2.5 text-rose-500 hover:text-rose-700 border border-rose-205 rounded-lg hover:bg-rose-50 transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* TAB 2: Opportunities & Recruitment Pipeline */}
      {activeTab === 'opportunities' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">{isRtl ? 'الفرص المتاحة لإستقطاب الكفاءات' : 'Available Opportunities & Campaigns'}</h2>
            <button 
              onClick={() => {
                setOpportunityForm({
                  title: '', description: '', requirements: '', location: '', duration: '', available_positions: 5, application_deadline: '', form_fields: []
                });
                setOpportunityModalOpen(true);
              }}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold flex items-center gap-1 hover:bg-slate-800 transition"
            >
              <Plus size={16} /> {isRtl ? 'بناء فرصة استقطاب جديدة' : 'Build Recruitment Campaign'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {opportunities.map((opp) => (
              <div key={opp.id} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:scale-[1.01] transition-transform duration-200">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">{opp.title}</h3>
                  <div className="flex flex-wrap gap-2 my-3">
                    <span className="bg-slate-50 border border-slate-100 px-2 py-0.5 rounded text-xs text-slate-500 flex items-center gap-1">
                      <MapPin size={12} /> {opp.location}
                    </span>
                    <span className="bg-slate-50 border border-slate-100 px-2 py-0.5 rounded text-xs text-slate-505 flex items-center gap-1">
                      <Clock size={12} /> {opp.duration}
                    </span>
                    <span className="bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                      {isRtl ? `العدد المطلوب: ${opp.available_positions}` : `${opp.available_positions} positions`}
                    </span>
                  </div>

                  <p className="text-slate-500 text-sm line-clamp-3">
                    {opp.description}
                  </p>

                  <div className="bg-slate-50 p-3 rounded-lg text-xs mt-4 text-slate-600">
                    <strong>{isRtl ? 'المتطلبات الضرورية: ' : 'Requirements: '}</strong>
                    <p>{opp.requirements}</p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center gap-2">
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        setOpportunityForm(opp);
                        setOpportunityModalOpen(true);
                      }}
                      className="p-1 px-2.5 border border-slate-205 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => deleteOpportunity(opp.id)}
                      className="p-1 px-2.5 border border-rose-200 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <button
                    onClick={() => runAiMatching(opp.title, opp.requirements || '')}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Sparkles size={12} /> {isRtl ? 'ترشيح ذكي' : 'AI Matching'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* AI Matcher Output Section */}
          {aiLoading && (
            <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 text-center text-slate-600 mt-6 animate-pulse">
              <Sparkles className="animate-spin text-indigo-600 mx-auto mb-2" size={32} />
              <p>{isRtl ? 'يرشح المحرك الآن من السجل ويحلل فجوات المهارات...' : 'AI is assessing suitability index against credentials & records...'}</p>
            </div>
          )}

          {aiAnalysis && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-indigo-900 text-white p-6 rounded-2xl shadow-lg border border-indigo-805 mt-6 relative overflow-hidden">
              <div className="absolute right-0 top-0 opacity-10 transform translate-x-5 -translate-y-5">
                <Sparkles size={164} />
              </div>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-amber-400" size={24} />
                  <h4 className="font-bold text-lg">{isRtl ? 'التوصية والاستحقاق الذكي' : 'VMS Interactive Matchmaking'}</h4>
                </div>
                <button onClick={() => setAiAnalysis(null)} className="text-indigo-200 hover:text-white">
                  <X size={18} />
                </button>
              </div>
              <p className="mt-4 text-indigo-100 text-sm whitespace-pre-line leading-relaxed">
                {aiAnalysis}
              </p>
            </motion.div>
          )}

          {/* Applications list */}
          <div className="mt-12 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h3 className="font-bold text-lg mb-4">{isRtl ? 'طلبات الانضمام المقدمة قيد الفحص' : 'Pending Recruitment Applications'}</h3>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase text-slate-500">
                  <th className="py-3 px-4 text-right">{isRtl ? 'اسم المتقدم' : 'Applicant'}</th>
                  <th className="py-3 px-4">{isRtl ? 'البريد والهاتف' : 'Contact'}</th>
                  <th className="py-3 px-4">{isRtl ? 'التكليفات المطلوبة' : 'Opportunity Target'}</th>
                  <th className="py-3 px-4">{isRtl ? 'نقاط التقييم الذكي' : 'Screening Scores'}</th>
                  <th className="py-3 px-4">{isRtl ? 'حالة الطلب' : 'Status'}</th>
                  <th className="py-3 px-4 text-center">{isRtl ? 'إجراءات الفحص والتقييم' : 'Verification Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {applications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      {isRtl ? 'لا يوجد طلبات انضمام حالياً.' : 'No submission requests yet.'}
                    </td>
                  </tr>
                ) : (
                  applications.map((app) => {
                    const opp = opportunities.find(o => o.id === app.opportunity_id);
                    return (
                      <tr key={app.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="py-3 px-4 text-right font-medium text-slate-800">{app.full_name}</td>
                        <td className="py-3 px-4 text-slate-500 text-sm">
                          <div>{app.email}</div>
                          <div className="text-xs">{app.phone}</div>
                        </td>
                        <td className="py-3 px-4 text-sm font-semibold">{opp?.title || 'General Volunteer'}</td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-xs font-bold bg-slate-100 px-2 py-1 rounded">
                            {isRtl ? 'الخبرة المرجّحة: ' : 'Scoring: '} {JSON.stringify(safeParse(app.evaluation_scores, {}))}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={cn(
                            "px-2.5 py-0.5 rounded text-xs font-semibold uppercase",
                            app.status === 'Submitted' && "bg-blue-50 text-blue-600",
                            app.status === 'Screening' && "bg-orange-50 text-orange-600",
                            app.status === 'Interview' && "bg-purple-50 text-purple-600",
                            app.status === 'Accepted' && "bg-emerald-50 text-emerald-600",
                            app.status === 'Rejected' && "bg-red-50 text-red-600"
                          )}>
                            {app.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => runAiAssessment(app)}
                            className="px-2.5 py-1 text-slate-600 border border-slate-205 rounded hover:bg-slate-50 hover:text-indigo-650 font-medium text-xs flex items-center gap-1 mx-auto"
                          >
                            <Sparkles size={12} /> {isRtl ? 'تقييم ذكي فوري' : 'Score Applicant'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* TAB 3: Onboarding & Agreements */}
      {activeTab === 'onboarding' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <h2 className="text-xl font-bold">{isRtl ? 'برامج التهيئة والالتزام بنظم العمل' : 'Agreements, Code of Conduct & Signatures'}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="font-bold text-lg mb-2 text-slate-800">{isRtl ? 'الشهادات والالتزام المطلوب' : 'Institutional Safeguarding & Policies'}</h3>
              <p className="text-slate-500 text-sm mb-4">
                {isRtl ? 'يجب على كل متطوع ممارس التوقيع والمصادقة على أوراق ومواثيق العمل الإنساني والمهني:' : 'Each active volunteer must digitally review and sign standard legal & code of conduct agreements'}
              </p>

              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={18} className="text-slate-600" />
                    <span className="text-sm font-semibold">{isRtl ? 'ميثاق السلوك المهني والنزاهة' : 'Code of Conduct & Professional Integrity'}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-400">PDF Document</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={18} className="text-slate-600" />
                    <span className="text-sm font-semibold">{isRtl ? 'سياسة صون وحماية الفئات المستضعفة' : 'Child Protection & Safeguarding Policy'}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-400">PDF Document</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={18} className="text-slate-600" />
                    <span className="text-sm font-semibold">{isRtl ? 'اتفاقية عدم الإفصاح والسرية' : 'Non-Disclosure & Confidentiality Agreement'}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-400">PDF Document</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-lg mb-2 text-slate-800">{isRtl ? 'تحسين كفاءة التهيئة' : 'Smart Digital Checkpoints'}</h3>
                <p className="text-slate-500 text-sm mb-4">
                  {isRtl ? 'مراجعة المذكرة وجاهزية المتطوعين الجدد للانتقال بالوضع النشط.' : 'Monitor onboarding checklists status and confirm compliance records before deploying fields.'}
                </p>
                
                <div className="space-y-2 max-h-[180px] overflow-y-auto">
                  {onboardings.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-6">{isRtl ? 'لا يوجد ملفات تهيئة حالياً.' : 'No onboarding checklist instances registered.'}</p>
                  ) : (
                    onboardings.map(onb => {
                      const vol = volunteers.find(v => v.id === onb.volunteer_id);
                      return (
                        <div key={onb.id} className="p-2 border-b border-slate-50 text-xs flex justify-between items-center">
                          <span className="font-semibold">{vol?.full_name || 'Volunteer'}</span>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full font-bold",
                            onb.status === 'completed' ? "bg-emerald-50 text-emerald-600" : "bg-yellow-50 text-yellow-600"
                          )}>
                            {onb.status}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB 4: Assignments & Scheduling */}
      {activeTab === 'assignments' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">{isRtl ? 'التكليفات النشطة وتوزيع المهام' : 'Active Field Deployments & Assignments'}</h2>
            <button 
              onClick={() => {
                const activeRegistry = volunteers.filter(v => v.status === 'Active');
                if (activeRegistry.length === 0) {
                  alert(isRtl ? 'يجب ترقية متطوع واحد على الأقل ليصبح نشطاً للتعيين' : 'Please make at least one volunteer active first');
                  return;
                }
                const firstId = activeRegistry[0].id;
                setAssignments([{
                  id: 0,
                  volunteer_id: firstId,
                  assignment_name: '',
                  status: 'Planned'
                }] as any);
                api.post('/api/volunteers/assignments', {
                  volunteer_id: firstId,
                  assignment_name: isRtl ? 'مهمة مسح ميداني' : 'Field Survey Assignment',
                  status: 'Active'
                }).then(() => loadData());
              }}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold transition hover:bg-slate-800"
            >
              {isRtl ? 'تعيين مهمة جديدة' : 'Deploy Assignment'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Planned columns / states */}
            {['Planned', 'Active', 'Completed'].map((stage) => {
              const stageAssignments = assignments.filter(as => as.status === stage);
              return (
                <div key={stage} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-800 uppercase tracking-wide text-xs">
                      {stage === 'Planned' && (isRtl ? 'مخطط له' : 'Planned')}
                      {stage === 'Active' && (isRtl ? 'جار ومستمر' : 'Active')}
                      {stage === 'Completed' && (isRtl ? 'مكتمل' : 'Completed')}
                    </h3>
                    <span className="bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono">
                      {stageAssignments.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {stageAssignments.map(as => {
                      const vol = volunteers.find(v => v.id === as.volunteer_id);
                      return (
                        <div key={as.id} className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs">
                          <h4 className="font-bold text-slate-800 text-sm">{as.assignment_name}</h4>
                          <div className="flex items-center gap-1.5 mt-2">
                            <div className="w-5 h-5 rounded-full bg-slate-100 text-[10px] flex items-center justify-center font-bold text-slate-500">
                              {vol?.full_name?.charAt(0)}
                            </div>
                            <span className="text-xs text-slate-500">{vol?.full_name}</span>
                          </div>

                          <div className="mt-3 flex justify-between items-center border-t border-slate-50 pt-3">
                            <span className="text-[10px] font-mono text-slate-400">
                              {as.start_date || 'Ongoing'}
                            </span>

                            <div className="flex gap-1">
                              {stage !== 'Completed' && (
                                <button
                                  onClick={async () => {
                                    const nextStatus = stage === 'Planned' ? 'Active' : 'Completed';
                                    await api.put(`/api/volunteers/assignments/${as.id}`, { ...as, status: nextStatus });
                                    loadData();
                                  }}
                                  className="px-2 py-0.5 bg-slate-100 text-slate-800 text-[10px] uppercase font-bold rounded-md hover:bg-slate-200 transition"
                                >
                                  {isRtl ? 'ترقية الوضع' : 'Advance'}
                                </button>
                              )}
                              <button
                                onClick={async () => {
                                  if (confirm(isRtl ? 'هل تريد حذف هذا التكليف؟' : 'Remove assignment?')) {
                                    await api.delete(`/api/volunteers/assignments/${as.id}`);
                                    loadData();
                                  }
                                }}
                                className="p-1 hover:text-rose-600 transition"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* TAB 5: Hours Logs Sheets */}
      {activeTab === 'hours' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">{isRtl ? 'جدول تسجيل الساعات التراكمي' : 'Field Hours Tracking logs'}</h2>
            <button 
              onClick={() => {
                if (volunteers.length === 0) {
                  alert(isRtl ? 'أضف متطوعاً أولاً بمميزات نشطة' : 'Must have registered volunteers');
                  return;
                }
                setHoursForm({ volunteer_id: volunteers[0].id, project_id: '', activity: '', date: new Date().toISOString().split('T')[0], hours_worked: 4 });
                setHoursModalOpen(true);
              }}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold transition hover:bg-slate-800"
            >
              {isRtl ? 'تسجيل ساعات متطوع' : 'Log Hours Entry'}
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase text-slate-500 text-center">
                  <th className="py-3 px-4 text-right">{isRtl ? 'المتطوع' : 'Volunteer'}</th>
                  <th className="py-3 px-4">{isRtl ? 'النشاط المنجز' : 'Logged Activity'}</th>
                  <th className="py-3 px-4">{isRtl ? 'التاريخ والمدة' : 'Date'}</th>
                  <th className="py-3 px-4">{isRtl ? 'عدد الساعات الكلي' : 'Hours'}</th>
                  <th className="py-3 px-4">{isRtl ? 'الحالة والموثوقية' : 'Status'}</th>
                  <th className="py-3 px-4 text-center">{isRtl ? 'إجراءات التدقيق' : 'Verification'}</th>
                </tr>
              </thead>
              <tbody>
                {hours.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      {isRtl ? 'لا توجد ساعات عمل مسجلة حالياً.' : 'No active hour timesheets yet.'}
                    </td>
                  </tr>
                ) : (
                  hours.map((hr) => {
                    const vol = volunteers.find(v => v.id === hr.volunteer_id);
                    return (
                      <tr key={hr.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="py-3 px-4 text-right font-medium text-slate-800">{vol?.full_name || `ID: ${hr.volunteer_id}`}</td>
                        <td className="py-3 px-4 text-sm text-slate-600">{hr.activity}</td>
                        <td className="py-3 px-4 text-sm text-slate-500">{hr.date}</td>
                        <td className="py-3 px-4 text-sm font-mono font-bold">{hr.hours_worked} {isRtl ? 'ساعات' : 'hrs'}</td>
                        <td className="py-3 px-4">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                            hr.status === 'approved' ? "bg-emerald-50 text-emerald-600" : "bg-yellow-50 text-yellow-600"
                          )}>
                            {hr.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => toggleHourStatus(hr)}
                              className="px-2 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-705 rounded"
                            >
                              {hr.status === 'approved' ? (isRtl ? 'إلغاء الموثوقية' : 'Revoke') : (isRtl ? 'تأكيد وصرف' : 'Approve')}
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm(isRtl ? 'حذف هذا السجل للساعات؟' : 'Delete log entry?')) {
                                  await api.delete(`/api/volunteers/hours/${hr.id}`);
                                  loadData();
                                }
                              }}
                              className="text-rose-500 hover:text-rose-700"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* TAB 6: Reviews */}
      {activeTab === 'reviews' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">{isRtl ? 'تقييمات المتطوعين ومؤشرات الالتزام' : 'Performance and Competencies scorecards'}</h2>
            <button 
              onClick={() => {
                if (volunteers.length === 0) {
                  alert('Must register volunteers first');
                  return;
                }
                setReviewForm({
                  volunteer_id: volunteers[0].id, review_period: 'Annual Review 2026', supervisor_feedback: '', self_assessment: '',
                  communication_score: 5, leadership_score: 5, teamwork_score: 5, technical_score: 5, reliability_score: 5
                });
                setReviewModalOpen(true);
              }}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold transition hover:bg-slate-800"
            >
              {isRtl ? 'كتابة تقييم متطوع' : 'Write Review Card'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews.map((rev) => {
              const vol = volunteers.find(v => v.id === rev.volunteer_id);
              return (
                <div key={rev.id} className="bg-white rounded-2xl border border-slate-105 p-6 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-sm">
                          {vol?.full_name?.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800">{vol?.full_name}</h4>
                          <span className="text-xs text-slate-400">{rev.review_period}</span>
                        </div>
                      </div>

                      <div className="bg-indigo-50 text-indigo-700 p-2 rounded-xl text-center">
                        <span className="text-xs font-bold block">{isRtl ? 'النتيجة' : 'Score'}</span>
                        <span className="text-xl font-bold font-mono">{rev.avg_score} / 10</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-5 gap-2 mt-4 text-center">
                      <div className="bg-slate-50 p-2 rounded">
                        <span className="text-[10px] text-slate-400 block">{isRtl ? 'تواصل' : 'Comm'}</span>
                        <strong className="text-sm text-slate-700">{rev.communication_score}</strong>
                      </div>
                      <div className="bg-slate-50 p-2 rounded">
                        <span className="text-[10px] text-slate-400 block">{isRtl ? 'قيادة' : 'Lead'}</span>
                        <strong className="text-sm text-slate-700">{rev.leadership_score}</strong>
                      </div>
                      <div className="bg-slate-50 p-2 rounded">
                        <span className="text-[10px] text-slate-400 block">{isRtl ? 'تعاون' : 'Team'}</span>
                        <strong className="text-sm text-slate-700">{rev.teamwork_score}</strong>
                      </div>
                      <div className="bg-slate-50 p-2 rounded">
                        <span className="text-[10px] text-slate-400 block">{isRtl ? 'عمليات' : 'Tech'}</span>
                        <strong className="text-sm text-slate-700">{rev.technical_score}</strong>
                      </div>
                      <div className="bg-slate-50 p-2 rounded">
                        <span className="text-[10px] text-slate-400 block">{isRtl ? 'انضباط' : 'Reli'}</span>
                        <strong className="text-sm text-slate-700">{rev.reliability_score}</strong>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 font-semibold mt-4">
                      {isRtl ? 'ملاحظات المشرف: ' : 'Supervisor Feedback: '}
                      <span className="font-normal block text-slate-600 italic mt-1 bg-slate-50 p-2 rounded">{rev.supervisor_feedback}</span>
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-50 flex justify-end">
                    <button
                      onClick={async () => {
                        if (confirm(isRtl ? 'حذف هذا التقييم؟' : 'Remove scorecard?')) {
                          await api.delete(`/api/volunteers/reviews/${rev.id}`);
                          loadData();
                        }
                      }}
                      className="p-1 px-3 text-rose-500 hover:bg-rose-50 rounded border border-rose-100 text-xs flex items-center gap-1"
                    >
                      <Trash2 size={12} /> {isRtl ? 'حذف الكارت' : 'Delete Card'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* TAB 7: Recognition & Badge generator */}
      {activeTab === 'recognition' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">{isRtl ? 'برنامج التكريم والشهادات الرقمية الموثقة' : 'Recognition Badges & Services Certificates'}</h2>
            <button 
              onClick={() => {
                if (volunteers.length === 0) return;
                setRecognitionForm({ volunteer_id: volunteers[0].id, category: 'Outstanding Contributor', description: '', badge: 'Gold' });
                setRecognitionModalOpen(true);
              }}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold transition hover:bg-slate-800"
            >
              {isRtl ? 'منح جائزة/وسام' : 'Award Digital Badge'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {recognitions.map((rec) => {
              const vol = volunteers.find(v => v.id === rec.volunteer_id);
              return (
                <div key={rec.id} className="bg-white border border-slate-105 rounded-2xl p-6 text-center shadow-xs hover:shadow-sm transition-shadow relative overflow-hidden">
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={async () => {
                        await api.delete(`/api/volunteers/recognition/${rec.id}`);
                        loadData();
                      }}
                      className="text-slate-300 hover:text-rose-500 transition"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="mx-auto w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-800 mb-4 border border-amber-200">
                    <Award size={32} className="text-amber-500 animate-pulse" />
                  </div>

                  <span className={cn(
                    "px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider",
                    rec.badge === 'Bronze' && "bg-orange-100 text-orange-700",
                    rec.badge === 'Silver' && "bg-slate-100 text-slate-700",
                    rec.badge === 'Gold' && "bg-amber-100 text-amber-700",
                    rec.badge === 'Platinum' && "bg-indigo-100 text-indigo-700"
                  )}>
                    {rec.badge}
                  </span>

                  <h4 className="font-bold text-slate-800 mt-3 text-sm">{vol?.full_name || 'Volunteer'}</h4>
                  <p className="text-slate-500 text-xs mt-1 font-semibold text-indigo-620">{rec.category}</p>
                  <p className="text-slate-400 text-[11px] mt-2 italic leading-relaxed">
                    {rec.description}
                  </p>

                  <div className="mt-4 pt-4 border-t border-slate-50 text-[10px] font-mono text-slate-400">
                    {isRtl ? 'التاريخ الممنوح: ' : 'Awarded: '} {rec.date_awarded}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* TAB 8: Events & QR Checks */}
      {activeTab === 'events' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">{isRtl ? 'فعاليات المتطوعين والمسح الرقمي' : 'Gathering Events & Live Attendance'}</h2>
            <button 
              onClick={() => {
                setEventForm({ name: '', description: '', date: '', venue: '', attendees: [], checkins: [] });
                setEventModalOpen(true);
              }}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold transition hover:bg-slate-800"
            >
              <Plus size={16} /> {isRtl ? 'برمجة فعالية جديدة' : 'Add Event'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.map((ev) => {
              const atts = safeParse(ev.attendees, []);
              const ins = safeParse(ev.checkins, []);
              return (
                <div key={ev.id} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-slate-800">{ev.name}</h3>
                    <p className="text-slate-500 text-sm mt-1">{ev.description}</p>

                    <div className="flex flex-wrap gap-4 mt-4 text-xs text-slate-500 border-b border-b-slate-50 pb-3">
                      <span className="flex items-center gap-1"><CalendarDays size={14} /> {ev.date}</span>
                      <span className="flex items-center gap-1"><MapPin size={14} /> {ev.venue}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="bg-slate-50 p-3 rounded-xl text-center">
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest">{isRtl ? 'المسجلون' : 'Registered'}</span>
                        <strong className="block text-xl font-bold mt-1">{atts.length}</strong>
                      </div>
                      <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl text-center">
                        <span className="text-[10px] uppercase tracking-widest">{isRtl ? 'الحضور (تأكيد)' : 'Checked-In'}</span>
                        <strong className="block text-xl font-bold mt-1">{ins.length}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center">
                    <button
                      onClick={async () => {
                        const vIds = volunteers.map(v => v.id);
                        await api.put(`/api/volunteers/events/${ev.id}`, {
                          ...ev,
                          attendees: JSON.stringify(vIds),
                          checkins: JSON.stringify(vIds.slice(0, 2)) // Simulate check-in QR scan
                        });
                        loadData();
                      }}
                      className="px-3 py-1.5 border border-slate-205 text-slate-600 hover:text-slate-900 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <QrCode size={14} /> {isRtl ? 'تأكيد الحضور الرقمي (محاكاة)' : 'Simulate Scanner Check-in'}
                    </button>

                    <button
                      onClick={async () => {
                        if (confirm('Delete gathering?')) {
                          await api.delete(`/api/volunteers/events/${ev.id}`);
                          loadData();
                        }
                      }}
                      className="text-rose-500 hover:text-rose-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* TAB 9: Alumni & Mentor Net */}
      {activeTab === 'alumni' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <h2 className="text-xl font-bold">{isRtl ? 'سجل الخريجين والإرشاد التفاعلي' : 'Alumni Network & Mentor Directories'}</h2>
          
          <div className="bg-white rounded-2xl border border-slate-105 p-6 shadow-sm">
            <p className="text-slate-500 text-sm mb-4">
              {isRtl ? 'انتقل متطوعين مخضرمين إلى شبكة الخريجين لتمكين نقل الخبرات والإرشاد المباشر للوافدين الجدد:' : 'Alumni with deep field records acting as guides and career advisors for young humanitarians'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {volunteers.filter(v => v.status === 'Alumni').length === 0 ? (
                <div className="col-span-3 text-center py-6 text-slate-400 text-sm">{isRtl ? 'لا يوجد متطوعين بوضعية "خريج" حالياً في السجل.' : 'No alumni directory listings configured.'}</div>
              ) : (
                volunteers.filter(v => v.status === 'Alumni').map((alm) => (
                  <div key={alm.id} className="bg-slate-50 border border-slate-150 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700">
                      {alm.full_name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-850 text-sm">{alm.full_name}</h4>
                      <p className="text-xs text-slate-500">{alm.occupation || 'Executive Advocate'}</p>
                      <span className="inline-block mt-2 bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {isRtl ? 'مرشد معتمد' : 'Certified Mentor'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB 10: VMS AI Intelligence Widget */}
      {activeTab === 'ai' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="bg-gradient-to-r from-indigo-900 to-indigo-805 text-white p-8 rounded-3xl relative overflow-hidden shadow-xl">
            <div className="absolute right-0 top-0 opacity-10 transform translate-x-12 -translate-y-12">
              <Sparkles size={196} />
            </div>
            
            <div className="max-w-2xl">
              <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold text-amber-300 inline-block mb-3 uppercase tracking-wider">
                {isRtl ? 'لوحة تحكم الكفاءات المدعومة بالذكاء الرقمي' : 'VMS AI Copilot'}
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold">{isRtl ? 'محرك الفرز والامتثال والمطابقة' : 'Humanitarian Matching Intelligence'}</h2>
              <p className="text-slate-100 text-sm mt-3 leading-relaxed">
                {isRtl ? 'اطرح أي معايير أو أسئلة لتحليل جدارة متطوعين محددين، كتابة توصيات خطابات التكليف مخصصة، أو التحقيق في معدلات البقاء وخطر التسرب والانسحاب الميداني.' : 'Generate match recommendations for open duty opportunities, run safeguarding reports, or calculate retention analytics on current volunteers.'}
              </p>

              <div className="mt-6 flex flex-col md:flex-row gap-2">
                <input
                  type="text"
                  placeholder={isRtl ? 'اكتب تخصصاً مطلوباً أو مهارة للترشيح المباشر...' : 'Enter target skills to generate AI shortlist...'}
                  value={skillFilter}
                  onChange={(e) => setSkillFilter(e.target.value)}
                  className="bg-white/10 border border-white/20 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 focus:bg-white text-slate-800 placeholder-white/60 focus:placeholder-slate-400 w-full"
                />
                <button
                  onClick={async () => {
                    setAiLoading(true);
                    setAiAnalysis(null);
                    try {
                      const response = await api.post('/api/volunteers/ai/generate', {
                        mode: 'recommend',
                        payload: {
                          skillsInterest: skillFilter || 'Field photography and media rights'
                        }
                      });
                      setAiAnalysis(response.data.result);
                    } catch {
                      setAiAnalysis('AI connection temporary offline');
                    } finally {
                      setAiLoading(false);
                    }
                  }}
                  className="px-6 py-2.5 bg-amber-400 hover:bg-amber-380 text-indigo-950 font-bold text-sm rounded-xl transition flex items-center justify-center gap-1"
                >
                  <Sparkles size={16} /> {isRtl ? 'فرز كفاءات' : 'Run Analytics'}
                </button>
              </div>
            </div>
          </div>

          {aiLoading && (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-100 shadow-xs animate-pulse">
              <Sparkles className="animate-spin text-indigo-500 mx-auto" size={48} />
              <p className="text-slate-500 mt-4">{isRtl ? 'يحلل النظام سجلات الساعات التاريخية ويطابق السير الذاتية...' : 'System analysis active: matching transcripts...'}</p>
            </div>
          )}

          {aiAnalysis && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-900 text-white p-6 rounded-2xl shadow-md border border-slate-800 whitespace-pre-line leading-relaxed text-sm font-sans">
              <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-amber-400" size={18} />
                  <strong className="text-base">{isRtl ? 'تحليلات المحاكاة والتكليف الموصى به' : 'AI Strategic Insight Report'}</strong>
                </div>
                <button onClick={() => setAiAnalysis(null)} className="text-slate-400 hover:text-white">
                  <X size={16} />
                </button>
              </div>
              {aiAnalysis}
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Volunteer Modal Entry Form */}
      {volunteerModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">{volunteerForm.id ? (isRtl ? 'تعديل السجل المتطوع' : 'Edit Volunteer Profile') : (isRtl ? 'تسجيل متطوع جديد بالسجل' : 'Register New Volunteer')}</h3>
              <button onClick={() => setVolunteerModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveVolunteer} className="space-y-4">
              <div>
                <label className="text-xs text-slate-500 font-bold block mb-1">{isRtl ? 'الاسم الكامل للمتطوع' : 'Full Name'}</label>
                <input
                  type="text"
                  required
                  value={volunteerForm.full_name}
                  onChange={(e) => setVolunteerForm({ ...volunteerForm, full_name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-205 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500 font-bold block mb-1">{isRtl ? 'البريد الإلكتروني' : 'Email'}</label>
                  <input
                    type="email"
                    value={volunteerForm.email || ''}
                    onChange={(e) => setVolunteerForm({ ...volunteerForm, email: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-205 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-bold block mb-1">{isRtl ? 'الهاتف' : 'Phone'}</label>
                  <input
                    type="text"
                    value={volunteerForm.phone || ''}
                    onChange={(e) => setVolunteerForm({ ...volunteerForm, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-205 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500 font-bold block mb-1">{isRtl ? 'المدينة / المحافظة' : 'Governorate / City'}</label>
                  <input
                    type="text"
                    value={volunteerForm.location}
                    onChange={(e) => setVolunteerForm({ ...volunteerForm, location: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-205 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-bold block mb-1">{isRtl ? 'المهنة الرئيسية' : 'Primary Occupation'}</label>
                  <input
                    type="text"
                    value={volunteerForm.occupation}
                    onChange={(e) => setVolunteerForm({ ...volunteerForm, occupation: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-205 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500 font-bold block mb-1">{isRtl ? 'التصنيف المفضل للعمل والتمثيل' : 'Preferred Areas'}</label>
                  <input
                    type="text"
                    value={volunteerForm.preferred_areas}
                    onChange={(e) => setVolunteerForm({ ...volunteerForm, preferred_areas: e.target.value })}
                    placeholder={isRtl ? 'مثال: الرصد الحقوقي والتصوير' : 'NGO fields...'}
                    className="w-full px-4 py-2 border border-slate-205 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-bold block mb-1">{isRtl ? 'حالة التكليف الحالية' : 'Status'}</label>
                  <select
                    value={volunteerForm.status}
                    onChange={(e) => setVolunteerForm({ ...volunteerForm, status: e.target.value as any })}
                    className="w-full px-4 py-2 border border-slate-205 rounded-xl text-sm bg-white"
                  >
                    <option value="Applicant">Applicant</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Alumni">Alumni</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setVolunteerModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-500"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800"
                >
                  {isRtl ? 'حفظ السجل' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Opportunity Modal Builder */}
      {opportunityModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">{opportunityForm.id ? 'Edit Opportunity Campaign' : 'Create Opportunity Campaign'}</h3>
              <button onClick={() => setOpportunityModalOpen(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveOpportunity} className="space-y-4">
              <div>
                <label className="text-xs text-slate-500 font-bold block mb-1">{isRtl ? 'العنوان' : 'Opportunity Title'}</label>
                <input
                  type="text"
                  required
                  value={opportunityForm.title}
                  onChange={(e) => setOpportunityForm({ ...opportunityForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-205 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 font-bold block mb-1">{isRtl ? 'الوصف الرئيسي' : 'Campaign Description'}</label>
                <textarea
                  value={opportunityForm.description}
                  onChange={(e) => setOpportunityForm({ ...opportunityForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-205 rounded-xl text-sm min-h-[100px]"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 font-bold block mb-1">{isRtl ? 'المتطلبات والكفاءة المطلوبة' : 'Competency Credentials Requirements'}</label>
                <input
                  type="text"
                  value={opportunityForm.requirements}
                  onChange={(e) => setOpportunityForm({ ...opportunityForm, requirements: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-205 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500 font-bold block mb-1">{isRtl ? 'الموقع الجغرافي للتمثيل' : 'Duty Location'}</label>
                  <input
                    type="text"
                    value={opportunityForm.location}
                    onChange={(e) => setOpportunityForm({ ...opportunityForm, location: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-205 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-bold block mb-1">{isRtl ? 'مدة الاستحواذ والتكليف' : 'Duration'}</label>
                  <input
                    type="text"
                    value={opportunityForm.duration}
                    onChange={(e) => setOpportunityForm({ ...opportunityForm, duration: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-205 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 font-semibold">
                <button type="button" onClick={() => setOpportunityModalOpen(false)} className="px-4 py-2 border rounded-xl text-sm text-slate-500">{isRtl ? 'إلغاء' : 'Cancel'}</button>
                <button type="submit" className="px-5 py-2 bg-slate-900 text-white rounded-xl text-sm">{isRtl ? 'حفظ الفرصة' : 'Publish Opportunity'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hours Log Modal */}
      {hoursModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">{isRtl ? 'تسجيل ساعات المتطوعين' : 'Log Volunteer Hours'}</h3>
              <button onClick={() => setHoursModalOpen(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveHours} className="space-y-4">
              <div>
                <label className="text-xs text-slate-500 font-bold block mb-1">{isRtl ? 'اختر متطوع من السجل الرئيسي ' : 'Select Volunteer'}</label>
                <select
                  value={hoursForm.volunteer_id}
                  onChange={(e) => setHoursForm({ ...hoursForm, volunteer_id: Number(e.target.value) })}
                  className="w-full px-4 py-2 border rounded-xl bg-white text-sm"
                >
                  {volunteers.map(v => (
                    <option key={v.id} value={v.id}>{v.full_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-500 font-bold block mb-1">{isRtl ? 'النشاط المنجز' : 'Activity details'}</label>
                <input
                  type="text"
                  required
                  value={hoursForm.activity}
                  onChange={(e) => setHoursForm({ ...hoursForm, activity: e.target.value })}
                  className="w-full px-4 py-2 border rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500 font-bold block mb-1">{isRtl ? 'عدد الساعات الملتزمة' : 'Hours worked'}</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={hoursForm.hours_worked}
                    onChange={(e) => setHoursForm({ ...hoursForm, hours_worked: Number(e.target.value) })}
                    className="w-full px-4 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-bold block mb-1">{isRtl ? 'التاريخ' : 'Date'}</label>
                  <input
                    type="date"
                    required
                    value={hoursForm.date}
                    onChange={(e) => setHoursForm({ ...hoursForm, date: e.target.value })}
                    className="w-full px-4 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button type="submit" className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl">
                  {isRtl ? 'تسجيل الملحق وتقديمه' : 'Submit Hour Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Selected Volunteer Detail Overlay Card */}
      <AnimatePresence>
        {selectedVolunteer && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex justify-end z-[45]"
            onClick={() => setSelectedVolunteer(null)}
          >
            <motion.div 
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 20 }}
              className="w-full max-w-md bg-white h-screen overflow-y-auto p-6 shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedVolunteer(null)}
                className="absolute left-6 top-6 text-slate-400 hover:text-slate-800"
              >
                <X size={20} />
              </button>

              <div className="text-center mt-8">
                <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center text-3xl font-bold text-slate-600 mx-auto border-2 border-slate-205">
                  {selectedVolunteer.full_name?.charAt(0)}
                </div>
                <h3 className="text-xl font-bold mt-4 text-slate-800">{selectedVolunteer.full_name}</h3>
                <span className="text-xs font-mono text-slate-400">{selectedVolunteer.volunteer_id}</span>
                
                <div className="mt-3">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold",
                    selectedVolunteer.status === 'Active' ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                  )}>
                    {selectedVolunteer.status}
                  </span>
                </div>
              </div>

              <div className="space-y-4 mt-8 border-t border-slate-100 pt-6">
                <div>
                  <span className="text-xs text-slate-400 font-bold block">{isRtl ? 'الموقع والجاهزية' : 'Primary City & Availability'}</span>
                  <div className="flex items-center gap-1.5 text-sm text-slate-700 mt-1 font-semibold">
                    <MapPin size={16} /> {selectedVolunteer.location} | {selectedVolunteer.availability}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-slate-400 font-bold block">{isRtl ? 'البريد الإلكتروني' : 'Email'}</span>
                    <a href={`mailto:${selectedVolunteer.email}`} className="text-sm font-semibold hover:underline text-indigo-700 flex items-center gap-1 mt-1">
                      <Mail size={14} /> {selectedVolunteer.email || 'N/A'}
                    </a>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-bold block">{isRtl ? 'رقم الهاتف' : 'Phone'}</span>
                    <a href={`tel:${selectedVolunteer.phone}`} className="text-sm font-semibold hover:underline text-indigo-700 flex items-center gap-1 mt-1">
                      <Phone size={14} /> {selectedVolunteer.phone || 'N/A'}
                    </a>
                  </div>
                </div>

                <div>
                  <span className="text-xs text-slate-400 font-bold block">{isRtl ? 'الاهتمام ومجال التفضيل' : 'Preferred Field Target'}</span>
                  <p className="text-sm text-slate-705 mt-1 font-semibold bg-slate-50 p-2.5 rounded-lg border border-slate-105">
                    {selectedVolunteer.preferred_areas || 'None specified'}
                  </p>
                </div>

                <div>
                  <span className="text-xs text-slate-400 font-bold block mb-1.5">{isRtl ? 'المهارات والكفاءات المسجلة' : 'Capabilities Registry'}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {safeParse(selectedVolunteer.skills, []).length === 0 ? (
                      <span className="text-xs text-slate-400 italic">No skills registered</span>
                    ) : (
                      safeParse(selectedVolunteer.skills, []).map((sk: string, i: number) => (
                        <span key={i} className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1 rounded-xl text-xs font-semibold">
                          {sk}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-150 flex gap-2">
                  <button
                    onClick={async () => {
                      setAiLoading(true);
                      setAiAnalysis(null);
                      try {
                        const response = await api.post('/api/volunteers/ai/generate', {
                          mode: 'risk',
                          payload: {
                            volunteerName: selectedVolunteer.full_name,
                            recentHours: hours.filter(h => h.volunteer_id === selectedVolunteer.id).reduce((sum, h) => sum + h.hours_worked, 0),
                            completedTasks: assignments.filter(as => as.volunteer_id === selectedVolunteer.id && as.status === 'Completed').length,
                            totalTasks: assignments.filter(as => as.volunteer_id === selectedVolunteer.id).length
                          }
                        });
                        setAiAnalysis(response.data.result);
                        setActiveTab('ai');
                        setSelectedVolunteer(null);
                      } catch {
                        alert('Connection error');
                      } finally {
                        setAiLoading(false);
                      }
                    }}
                    className="w-full bg-slate-900 border text-white hover:bg-slate-800 py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 text-xs transition shadow-sm"
                  >
                    <Sparkles size={14} />
                    {isRtl ? 'تحليل مخاطر التسرب والجاهزية' : 'Predict Retention Risk'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
