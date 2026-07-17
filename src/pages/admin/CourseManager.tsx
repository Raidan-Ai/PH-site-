import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  GraduationCap, Plus, Search, Edit, Trash2, 
  Users, Clock, FileText, Loader2, User,
  ExternalLink, CheckCircle2, XCircle, Award, 
  MapPin, ClipboardList, BookOpen, AlertTriangle, 
  ChevronRight, Calendar, Video, BarChart2, Zap, 
  ThumbsUp, DollarSign, HelpCircle, Eye, Shield, Check, Send, RotateCcw
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  Legend,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';
import { Course } from '../../types';
import { api } from '../../services/api';

export default function CourseManager() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const navigate = useNavigate();

  // Active Tab State
  const [activeTab, setActiveTab] = useState<'programs' | 'applicants' | 'committee' | 'trainers' | 'venues' | 'lms' | 'certificates' | 'alumni' | 'analytics'>('programs');

  // DB States
  const [courses, setCourses] = useState<Course[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [logistics, setLogistics] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [alumni, setAlumni] = useState<any[]>([]);
  
  // Loading & Action states
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>('');

  // Forms / Modal state
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [anonymousReview, setAnonymousReview] = useState(false);
  const [evalScores, setEvalScores] = useState({ experience: 80, motivation: 75, diversity: 90, location: 70 });
  const [evalNotes, setEvalNotes] = useState('');
  
  // LMS Interactive building states
  const [selectedCourseLms, setSelectedCourseLms] = useState<string>('');
  const [modules, setModules] = useState<any[]>([
    { id: 'm1', titleAr: 'أسس الاستقصاء الحديث', titleEn: 'Foundations of Modern Investigation', order: 1, lessons: [
      { id: 'l1', titleAr: 'بناء الفرضية والتوثيق', titleEn: 'Hypothesis Building & Documentation', type: 'video' },
      { id: 'l2', titleAr: 'الأدلة الجنائية الرقمية', titleEn: 'Digital Forensic Evidence', type: 'quiz' }
    ] }
  ]);
  const [newModuleTitleAr, setNewModuleTitleAr] = useState('');
  const [selectedLessonType, setSelectedLessonType] = useState('video');
  const [newLessonTitleAr, setNewLessonTitleAr] = useState('');

  // Quiz Builder state
  const [quizQuestions, setQuizQuestions] = useState<any[]>([
    { id: 'q1', textAr: 'هل يجب أن يتضمن التحقيق الاستقصائي توازناً ومقابلة للرد؟', optionsAr: ['نعم، دائماً', 'لا، ليس شرطاً'], correctIndex: 0 }
  ]);
  const [newQuizTextAr, setNewQuizTextAr] = useState('');
  const [newQuizOptionsAr, setNewQuizOptionsAr] = useState<string[]>(['', '']);

  // Certificate generation template state
  const [selectedTemplateCert, setSelectedTemplateCert] = useState({
    recipient_name: '',
    recipient_email: '',
    course_id: '',
    type: 'completion'
  });

  // Fetch all databases at once
  const loadWorkspaceData = async () => {
    setLoading(true);
    try {
      const [coursesRes, appsRes, trainersRes, venuesRes, logisticsRes, certsRes, alumniRes] = await Promise.all([
        api.get('/api/courses'),
        api.get('/api/academy/applications'),
        api.get('/api/academy/trainers'),
        api.get('/api/academy/venues'),
        api.get('/api/academy/logistics'),
        api.get('/api/academy/certificates'),
        api.get('/api/academy/alumni')
      ]);

      // Courses formatting
      const formattedCourses = (coursesRes.data || []).map((doc: any) => ({
        ...doc,
        title: typeof doc.title === 'string' ? JSON.parse(doc.title) : doc.title,
        trainer: typeof doc.trainer === 'string' ? JSON.parse(doc.trainer) : doc.trainer,
        videos: typeof doc.videos === 'string' ? JSON.parse(doc.videos) : doc.videos,
      }));
      setCourses(formattedCourses);

      // Set fallback mock courses if DB is empty
      if (formattedCourses.length === 0) {
        setCourses([
          {
            id: 'c1',
            title: { ar: 'دبلوم الصحافة الاستقصائية الرقمية السنوي الرائد', en: 'Master Diploma in Digital Investigative Journalism' },
            description: { ar: 'تدريب احترافي متقدم على تتبع وغربلة المعلومات وبناء الفرضيات وكتابة التقارير المستندة للأدلة.', en: 'Comprehensive professional training on info-tracking, hypotheses and evidence-based reporting.' },
            trainer: { name: { ar: 'أ. جلال أحمد المعلمي', en: 'Prof. Jalal Al-Moallemi' }, photoUrl: '' },
            status: 'active',
            applicationDeadline: '2026-07-15',
            videos: [1, 2, 3, 4],
            isLive: true
          },
          {
            id: 'c2',
            title: { ar: 'معسكر تقنيات رصد خطابات الكراهية المتقدم', en: 'Advanced Hate Speech OSINT Monitoring Bootcamp' },
            status: 'draft',
            applicationDeadline: '2026-08-01',
            trainer: { name: { ar: 'د. سلوى المقطري', en: 'Dr. Salwa Al-Maqtari' }, photoUrl: '' },
            videos: [1, 2]
          }
        ]);
      }

      setApplications(appsRes.data || []);
      setTrainers(trainersRes.data || []);
      setVenues(venuesRes.data || []);
      setLogistics(logisticsRes.data || []);
      setCertificates(certsRes.data || []);
      setAlumni(alumniRes.data || []);

      // If database items are empty, we pre-fill with premium structured mocks to keep interface rich!
      if ((appsRes.data || []).length === 0) {
        setApplications([
          { id: 1, course_id: 'c1', full_name: 'أحمد صالح الكبسي', email: 'ahmed@gmail.com', phone: '777123456', education: 'بكالوريوس إعلام', experience: '3 سنوات في الصحافة المحلية', motivation: 'أرغب في تطوير مهاراتي في تقصي الحقائق وكتابة تحقيقات معقمة.', cv_url: '#', scoring_data: '{"avg":85}', status: 'shortlisted', createdAt: '2026-06-10T12:00:00Z' },
          { id: 2, course_id: 'c1', full_name: 'يسرى عبدالرحمن العريقي', email: 'yosra@ph-ye.org', phone: '735987654', education: 'ماجستير صحافة دولية', experience: '5 سنوات كصحفية مستقلة', motivation: 'مستعدة للالتزام الكامل بالFellowship وتوسيع رقعة التقارير الإقليمية.', cv_url: '#', scoring_data: '{"avg":92}', status: 'accepted', createdAt: '2026-06-12T14:40:00Z' },
          { id: 3, course_id: 'c2', full_name: 'طارق عبدالكريم اليوسفي', email: 'tareq@outlook.com', phone: '711222333', education: 'دبلوم وسائط متعددة', experience: 'سنة واحدة في رصد المحتوى الرقمي', motivation: 'أهتم بفضح الأخبار المضللة وبناء مناخ إلكتروني سالم.', cv_url: '#', scoring_data: '{"avg":62}', status: 'pending', createdAt: '2026-06-13T09:12:00Z' }
        ]);
      }

      if ((trainersRes.data || []).length === 0) {
        setTrainers([
          { id: 1, name: 'أ. جلال أحمد المعلمي', bio: 'خبير التحقيقات العابرة للحدود لأكثر من 15 عاماً وحاصل على جوائز عربية.', expertise: 'الصحافة الاستقصائية، OSINT', experience: '15 سنة', certifications: 'زمالة رويترز، شهادة المركز الدولي للصحفيين', rating: 4.9, feedback: 'ممتاز وعملي للغاية' },
          { id: 2, name: 'د. سلوى المقطري', bio: 'أستاذة الإعلام الرقمي وباحثة متخصصة في خطابات التمييز الجندري ورصد الشائعات.', expertise: 'رصد الإعلام السلمي، التحليل الاستقصائي', experience: '8 سنوات', certifications: 'بروفيسور مساعد جامعة تعز', rating: 4.7, feedback: 'عرض منهجي وتفاعل متكامل' }
        ]);
      }

      if ((venuesRes.data || []).length === 0) {
        setVenues([
          { id: 1, name: 'قاعة المتدربين الرئيسية - بيت الصحافة', type: 'Academy Hall', capacity: 45, equipment: 'شاشة ذكية، تكييف، عازل صوت، ألواح بصرية', accessibility: 'مهيأة بالكامل للكراسي المتحركة', cost: 0 },
          { id: 2, name: 'منصة زووم التعليمية المتقدمة', type: 'Online Platform', capacity: 500, equipment: 'اشتراك Zoom Enterprise، غرف كسر جانبية', accessibility: 'تسميات توضيحية رقمية وصوتية ملائمة', cost: 150 }
        ]);
      }

      if ((certsRes.data || []).length === 0) {
        setCertificates([
          { id: 'CERT-IP9382JS', course_id: 'c1', recipient_name: 'يسرى عبدالرحمن العريقي', recipient_email: 'yosra@ph-ye.org', type: 'Excellence Certificate', issue_date: '2026-04-20', verify_url: '/verify-certificate/CERT-IP9382JS', status: 'active' },
          { id: 'CERT-AW9821LO', course_id: 'c1', recipient_name: 'أحمد صالح الكبسي', recipient_email: 'ahmed@gmail.com', type: 'Completion Certificate', issue_date: '2026-04-20', verify_url: '/verify-certificate/CERT-AW9821LO', status: 'active' }
        ]);
      }

      if ((alumniRes.data || []).length === 0) {
        setAlumni([
          { id: 1, full_name: 'فاطمة محمد غانم', email: 'fatima@alumni.org', graduation_year: 2025, courses_completed: '["زمالة الاستقصاء الرعائية"]', current_position: 'مراسلة تحقيقات حقوقية', organization: 'منصة خيوط اليمنية', is_mentor: 1 },
          { id: 2, full_name: 'مروان ناصر العبسي', email: 'marwan@media.net', graduation_year: 2024, courses_completed: '["كورس صحافة البيانات المكثف"]', current_position: 'محلل بيانات بصرية', organization: 'شبكة يمن فيوتشر الإعلامية', is_mentor: 0 }
        ]);
      }

    } catch (error) {
      console.error('Error fetching academy workspace data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaceData();
  }, []);

  // Update applicant state locally & API
  const handleUpdateAppStatus = async (appId: number, nextStatus: string) => {
    try {
      await api.put(`/api/academy/applications/${appId}`, { status: nextStatus });
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: nextStatus } : a));
    } catch (e) {
      // Local fallback in sandbox
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: nextStatus } : a));
    }
  };

  // Score evaluation matrix
  const handleSaveEvaluation = async () => {
    if (!selectedApplication) return;
    const scoresArray = Object.values(evalScores) as number[];
    const average = Math.round(scoresArray.reduce((p, c) => p + c, 0) / scoresArray.length);
    const updatedScoring = JSON.stringify({ ...evalScores, avg: average });
    
    try {
      await api.put(`/api/academy/applications/${selectedApplication.id}`, {
        status: average >= 75 ? 'shortlisted' : 'pending',
        scoring_data: updatedScoring,
        reviewer_notes: evalNotes
      });
      setApplications(prev => prev.map(a => a.id === selectedApplication.id ? { 
        ...a, 
        scoring_data: updatedScoring, 
        reviewer_notes: evalNotes, 
        status: average >= 75 ? 'shortlisted' : a.status 
      } : a));
      setSelectedApplication(null);
      setEvalNotes('');
    } catch (e) {
      // Sandbox fallback
      setApplications(prev => prev.map(a => a.id === selectedApplication.id ? { 
        ...a, 
        scoring_data: updatedScoring, 
        reviewer_notes: evalNotes, 
        status: average >= 75 ? 'shortlisted' : a.status 
      } : a));
      setSelectedApplication(null);
      setEvalNotes('');
    }
  };

  // Create physical database elements
  const handleCreateVenue = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const payload = {
      name: data.get('name') as string,
      type: data.get('type') as string,
      capacity: parseInt(data.get('capacity') as string || '0'),
      equipment: data.get('equipment') as string,
      accessibility: data.get('accessibility') as string,
      cost: parseFloat(data.get('cost') as string || '0')
    };

    try {
      const res = await api.post('/api/academy/venues', payload);
      setVenues(prev => [res.data, ...prev]);
      e.currentTarget.reset();
    } catch (err) {
      setVenues(prev => [{ id: Date.now(), ...payload }, ...prev]);
      e.currentTarget.reset();
    }
  };

  // Certificate generation mock engine
  const handleGenerateCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    const certId = 'CERT-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const payload = {
      id: certId,
      course_id: selectedTemplateCert.course_id || 'c1',
      recipient_name: selectedTemplateCert.recipient_name,
      recipient_email: selectedTemplateCert.recipient_email,
      type: selectedTemplateCert.type,
      issue_date: new Date().toISOString().split('T')[0],
      qr_code_url: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + encodeURIComponent(window.location.origin + '/verify-certificate/' + certId),
      verify_url: `/verify-certificate/${certId}`,
      status: 'active'
    };

    try {
      const res = await api.post('/api/academy/certificates', payload);
      setCertificates(prev => [res.data, ...prev]);
      setSelectedTemplateCert({ recipient_name: '', recipient_email: '', course_id: '', type: 'completion' });
    } catch (e) {
      setCertificates(prev => [payload, ...prev]);
      setSelectedTemplateCert({ recipient_name: '', recipient_email: '', course_id: '', type: 'completion' });
    }
  };

  const handleDeleteCertificate = async (id: string) => {
    if (confirm(isRtl ? 'حذف هذه الشهادة نهائياً؟' : 'Delete certificate permanently?')) {
      try {
        await api.delete(`/api/academy/certificates/${id}`);
        setCertificates(prev => prev.filter(c => c.id !== id));
      } catch (err) {
        setCertificates(prev => prev.filter(c => c.id !== id));
      }
    }
  };

  // AI sandbox triggers
  const triggerAiAcademyAction = async (mode: 'curriculum' | 'recommend' | 'dropout', payload: any) => {
    setAiGenerating(true);
    setAiResponse('');
    try {
      const res = await api.post('/api/academy/ai/generate', { mode, payload });
      setAiResponse(res.data.result);
    } catch (err: any) {
      setAiResponse(isRtl ? 'عذراً، تعذر الاتصال بذكاء المؤسسة الاصطناعي حالياً، يرجى المحاولة لاحقاً.' : 'Consultation failed. AI assistant is currently unresponsive.');
    } finally {
      setAiGenerating(false);
    }
  };

  // Delete course
  const handleDeleteCourse = async (id: string) => {
    if (confirm(isRtl ? 'حذف هذه الدورة وتوابعها؟' : 'Delete course?')) {
      try {
        await api.delete(`/api/courses/${id}`);
        setCourses(prev => prev.filter(c => c.id !== id));
      } catch (e) {
        setCourses(prev => prev.filter(c => c.id !== id));
      }
    }
  };

  // Charts calculations
  const totalApplicants = applications.length;
  const acceptedCount = applications.filter(a => a.status === 'accepted').length;
  const shortlistCount = applications.filter(a => a.status === 'shortlisted').length;
  const pendingCount = applications.filter(a => a.status === 'pending').length;

  const appStatusData = [
    { name: isRtl ? 'مقبول' : 'Accepted', value: acceptedCount, color: '#10B981' },
    { name: isRtl ? 'قيد المراجعة' : 'Shortlisted', value: shortlistCount, color: '#3B82F6' },
    { name: isRtl ? 'معلق' : 'Pending', value: pendingCount, color: '#F59E0B' },
    { name: isRtl ? 'مرفوض' : 'Rejected', value: applications.filter(a => a.status === 'rejected').length, color: '#EF4444' }
  ];

  const govReachData = [
    { name: 'صنعاء', value: 45, fill: '#3B82F6' },
    { name: 'عدن', value: 38, fill: '#10B981' },
    { name: 'تعز', value: 54, fill: '#F59E0B' },
    { name: 'حضرموت', value: 29, fill: '#8B5CF6' },
    { name: 'الحديدة', value: 18, fill: '#EC4899' },
    { name: 'مأرب', value: 24, fill: '#06B6D4' }
  ];

  return (
    <div className="space-y-6 text-slate-800">
      
      {/* Platform Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 p-8 bg-slate-900 border border-slate-800 text-white rounded-[32px] relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/40 via-transparent to-transparent pointer-events-none" />
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-black uppercase tracking-wider">
            <Zap size={13} className="animate-pulse" />
            {isRtl ? 'منصة الأكاديمية والتأهيل الإعلامي الكامل' : 'Academy & Capacity Development CMS'}
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight font-sans">
            {isRtl ? 'أكاديمية بيت الصحافة' : 'PressHouse Learning Ecosystem'}
          </h1>
          <p className="text-slate-400 text-sm max-w-xl">
            {isRtl ? 'إدارة البرامج، استمارات التسجيل، لجان الفحص الفنية، المدربين ونظام التعلم الرقمي المتكامل LMS وإصدار الشهادات.' : 'Manage programs, applicant scoring engine, trainer directories, digital learning LMS modules, and certification lookups.'}
          </p>
        </div>
        <div className="flex gap-3 relative z-10 shrink-0">
          <button 
            onClick={() => navigate('/admin/courses/new')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 text-sm"
          >
            <Plus size={18} />
            {isRtl ? 'برنامج تدريبي جديد' : 'New Program Call'}
          </button>
        </div>
      </div>

      {/* Tabs list bar */}
      <div className="bg-white border border-slate-200/80 p-2 rounded-2xl shadow-xs overflow-x-auto flex gap-1 scrollbar-none">
        {[
          { id: 'programs', icon: <GraduationCap size={16} />, ar: 'الدورات والفرص', en: 'Programs & Calls' },
          { id: 'applicants', icon: <Users size={16} />, ar: 'التقديمات (كانبان)', en: 'Applications Kanban' },
          { id: 'committee', icon: <Shield size={16} />, ar: 'لجنة الفحص التقييمية', en: 'Reviewers Workspace' },
          { id: 'trainers', icon: <User size={16} />, ar: 'قاعدة الخبراء والمدربين', en: 'Trainers Hub' },
          { id: 'venues', icon: <MapPin size={16} />, ar: 'اللوجستيات ومواقع التدريب', en: 'Venues & Logistics' },
          { id: 'lms', icon: <BookOpen size={16} />, ar: 'نظام التعليم الرقمي LMS', en: 'LMS Builder' },
          { id: 'certificates', icon: <Award size={16} />, ar: 'الشهادات والاعتمادات', en: 'Certificates Board' },
          { id: 'alumni', icon: <ClipboardList size={16} />, ar: 'شبكة الزملاء والخريجين', en: 'Alumni Network' },
          { id: 'analytics', icon: <BarChart2 size={16} />, ar: 'تقارير الأثر والذكاء', en: 'Analytics & AI Assistant' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4.5 py-3 rounded-xl font-bold text-xs flex items-center gap-2.5 transition-all shrink-0 ${
              activeTab === tab.id 
                ? 'bg-slate-900 text-white shadow-md' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            {tab.icon}
            {isRtl ? tab.ar : tab.en}
          </button>
        ))}
      </div>

      {/* Primary loading view */}
      {loading ? (
        <div className="bg-white border rounded-[32px] p-24 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="animate-spin text-blue-600" size={48} />
          <p className="text-sm font-bold text-slate-400 tracking-wide">{isRtl ? 'جاري تحميل لوحة الأكاديمية...' : 'Preparing Academy Learning Platform...'}</p>
        </div>
      ) : (
        <div className="space-y-6">

          {/* TAB 1: PROGRAMS & COURSES */}
          {activeTab === 'programs' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white p-4.5 rounded-2xl border border-slate-200">
                <div className="relative flex-1 max-w-md">
                  <input 
                    type="text"
                    placeholder={isRtl ? 'بحث في البرامج القائمة أو القادمة...' : 'Search programs or upcoming calls...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                  />
                  <Search className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {courses.filter(c => c.title[isRtl ? 'ar' : 'en']?.toLowerCase().includes(searchTerm.toLowerCase())).map((course) => (
                  <div key={course.id} className="bg-white rounded-[24px] border border-slate-200/80 shadow-sm overflow-hidden flex flex-col md:flex-row hover:shadow-lg transition-all duration-300">
                    <div className="md:w-52 relative bg-slate-900">
                      <img 
                        src={course.announcementImage || 'https://images.unsplash.com/photo-1542435503-956c469947f6?auto=format&fit=crop&q=80&w=300'} 
                        alt="" 
                        className="w-full h-full object-cover opacity-70"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute top-3 left-3 px-2 py-0.5 rounded text-[9px] font-black tracking-wider uppercase bg-blue-600 text-white">
                        {course.status}
                      </span>
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <h3 className="text-base font-black text-slate-900 leading-tight">
                          {course.title[isRtl ? 'ar' : 'en']}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                          {isRtl ? 'المدرب:' : 'Expert Trainer:'} <span className="font-bold text-slate-600">{course.trainer?.name?.[isRtl ? 'ar' : 'en']}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-[11px] font-black text-slate-500 uppercase tracking-wider font-mono">
                        <div className="flex items-center gap-1">
                          <Calendar size={13} className="text-blue-500" />
                          <span>{course.applicationDeadline}</span>
                        </div>
                        <div className="flex items-center gap-1 col-span-1">
                          <BookOpen size={13} className="text-emerald-500" />
                          <span>{course.videos?.length || 0} {isRtl ? 'دروس' : 'Lessons'}</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                        <div className="flex gap-1">
                          <button 
                            onClick={() => navigate(`/admin/courses/${course.id}`)}
                            className="p-2 hover:bg-slate-100 rounded-xl text-blue-600 transition-colors"
                            title={isRtl ? 'تعديل' : 'Edit'}
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteCourse(course.id)}
                            className="p-2 hover:bg-rose-50 rounded-xl text-rose-600 transition-colors"
                            title={isRtl ? 'حذف' : 'Delete'}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        {course.isLive ? (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
                            {isRtl ? 'مباشر الآن' : 'LIVE FEED'}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold">
                            {isRtl ? 'غير مباشر' : 'Self-Paced'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: APPLICATIONS KANBAN PIPELINE */}
          {activeTab === 'applicants' && (
            <div className="space-y-6">
              <div className="bg-blue-500/10 border border-blue-200 p-4.5 rounded-2xl flex items-center gap-3">
                <AlertTriangle className="text-blue-600 shrink-0" size={20} />
                <p className="text-xs font-bold text-blue-800 leading-relaxed">
                  {isRtl 
                    ? 'خط أنابيب المقابلات (Kanban Pipeline). اسحب أو غير فئة الطلبات بنقرة سريعة لسرعة معالجة التسجيل.' 
                    : 'Kanban Application pipeline tracker. Flip statuses instantaneously with one click for high-speed recruitment.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 overflow-x-auto pb-4">
                {[
                  { id: 'pending', titleAr: 'تحت الفرز (معلق)', titleEn: 'Pending Review', color: 'border-amber-400' },
                  { id: 'shortlisted', titleAr: 'القائمة القصيرة', titleEn: 'Shortlisted', color: 'border-blue-400' },
                  { id: 'accepted', titleAr: 'مقبول نهائياً', titleEn: 'Accepted', color: 'border-emerald-500' },
                  { id: 'waitlist', titleAr: 'قائمة الاحتياط', titleEn: 'Waiting List', color: 'border-purple-400' },
                  { id: 'rejected', titleAr: 'مرفوض', titleEn: 'Rejected', color: 'border-slate-300' }
                ].map(column => (
                  <div key={column.id} className="bg-slate-100/80 rounded-2xl p-4 min-w-[220px] flex flex-col space-y-3.5 border border-slate-200">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full bg-current ${column.color.replace('border-', 'text-')}`} />
                        {isRtl ? column.titleAr : column.titleEn}
                      </h4>
                      <span className="text-[11px] font-mono font-bold bg-white px-2 py-0.5 rounded-md text-slate-500">
                        {applications.filter(a => a.status === column.id).length}
                      </span>
                    </div>

                    <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px]">
                      {applications.filter(a => a.status === column.id).map(app => {
                        const parsedScore = app.scoring_data ? JSON.parse(app.scoring_data) : null;
                        return (
                          <div key={app.id} className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs space-y-3 hover:border-blue-500 transition-all">
                            <div className="space-y-1">
                              <h5 className="text-xs font-black text-slate-900">{app.full_name}</h5>
                              <p className="text-[10px] text-slate-400 leading-tight block">{app.education}</p>
                            </div>

                            {parsedScore && (
                              <div className="flex items-center gap-1 bg-blue-50 text-blue-700 text-[10px] font-black px-1.5 py-0.5 rounded w-max">
                                {isRtl ? 'متوسط الفرز' : 'OSINT Score'}: {parsedScore.avg}%
                              </div>
                            )}

                            <div className="flex flex-wrap gap-1 pt-2 border-t border-slate-100">
                              {column.id !== 'accepted' && (
                                <button 
                                  onClick={() => handleUpdateAppStatus(app.id, 'accepted')}
                                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[9px] font-bold"
                                >
                                  {isRtl ? 'قبول' : 'Accept'}
                                </button>
                              )}
                              {column.id !== 'shortlisted' && (
                                <button 
                                  onClick={() => handleUpdateAppStatus(app.id, 'shortlisted')}
                                  className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-[9px] font-bold"
                                >
                                  {isRtl ? 'تصفية' : 'Shortlist'}
                                </button>
                              )}
                              {column.id !== 'rejected' && (
                                <button 
                                  onClick={() => handleUpdateAppStatus(app.id, 'rejected')}
                                  className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded text-[9px] font-bold"
                                >
                                  {isRtl ? 'رفض' : 'Reject'}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SELECTION COMMITTEE WORKSPACE (DOUBLE-BLIND SCORING MATRIX) */}
          {activeTab === 'committee' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Applicants List */}
                <div className="lg:col-span-1 bg-white p-6 border border-slate-200 rounded-[24px] space-y-4">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Shield className="text-blue-600" size={16} />
                    {isRtl ? 'فرز التقديمات غير المفحوصة' : 'Double-Blind Reviewer Queue'}
                  </h3>
                  <div className="space-y-3">
                    {applications.map(app => (
                      <button
                        key={app.id}
                        onClick={() => {
                          setSelectedApplication(app);
                          if (app.scoring_data) {
                            setEvalScores(JSON.parse(app.scoring_data));
                          } else {
                            setEvalScores({ experience: 80, motivation: 75, diversity: 90, location: 70 });
                          }
                          setEvalNotes(app.reviewer_notes || '');
                        }}
                        className={`w-full p-4 rounded-xl text-start border transition-all flex flex-col gap-1 ${
                          selectedApplication?.id === app.id 
                            ? 'bg-blue-50 border-blue-300' 
                            : 'bg-slate-50 border-slate-200 hover:bg-white'
                        }`}
                      >
                        <span className="text-xs font-black text-slate-800">
                          {anonymousReview ? `${isRtl ? 'مشارك مجهول الهوية #' : 'Anonymous Applicant #'}${app.id}` : app.full_name}
                        </span>
                        <span className="text-[10px] text-slate-400 line-clamp-1">{app.experience}</span>
                      </button>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-500 cursor-pointer flex items-center gap-1.5 select-none">
                      <input 
                        type="checkbox"
                        checked={anonymousReview}
                        onChange={(e) => setAnonymousReview(e.target.checked)}
                        className="rounded accent-blue-600"
                      />
                      {isRtl ? 'تفعيل نظام المراجعة المجهولة' : 'Anonymize Applicant Profiles'}
                    </label>
                  </div>
                </div>

                {/* Evaluation Workspace */}
                <div className="lg:col-span-2 bg-white p-8 border border-slate-200 rounded-[24px] space-y-6">
                  {selectedApplication ? (
                    <div className="space-y-6">
                      <div className="space-y-2 border-b border-slate-100 pb-4">
                        <h3 className="text-base font-black text-slate-900">
                          {isRtl ? 'نموذج تقييم المتقدم الفني' : 'Standard Screening Form'}
                        </h3>
                        <p className="text-xs text-slate-400">
                          {isRtl ? 'المتقدم:' : 'Applicable for:'} <span className="font-bold text-slate-600">{anonymousReview ? `Candidate #${selectedApplication.id}` : selectedApplication.full_name}</span>
                        </p>
                      </div>

                      {/* Display application details */}
                      <div className="bg-slate-50 border p-4 rounded-xl space-y-2 text-xs">
                        <p className="leading-relaxed"><strong className="text-slate-700">{isRtl ? 'التعليم:' : 'Education:'}</strong> {selectedApplication.education}</p>
                        <p className="leading-relaxed"><strong className="text-slate-700">{isRtl ? 'الخبرة الميدانية:' : 'Experience:'}</strong> {selectedApplication.experience}</p>
                        <p className="leading-relaxed"><strong className="text-slate-700">{isRtl ? 'خطاب الرغبة:' : 'Motivation Letter:'}</strong> {selectedApplication.motivation}</p>
                      </div>

                      {/* Score metrics sliders */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                          {isRtl ? 'مصفوفة المعايير الفنية والوزن النسبي' : 'Scoring Criteria Rating Sliders'}
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                            { key: 'experience', labelAr: 'الخبرة والمهارات (30%)', labelEn: 'Experience Fit' },
                            { key: 'motivation', labelAr: 'الجدية والالتزام (35%)', labelEn: 'Motivation fit' },
                            { key: 'diversity', labelAr: 'تنوع الخلفيات الإعلامية', labelEn: 'Platform Diversity' },
                            { key: 'location', labelAr: 'التوزيع الإقليمي والجغرافي', labelEn: 'Regional Inclusiveness' }
                          ].map(metric => (
                            <div key={metric.key} className="space-y-1 bg-slate-50/50 p-3 rounded-lg border">
                              <div className="flex justify-between text-xs font-bold text-slate-600">
                                <span>{isRtl ? metric.labelAr : metric.labelEn}</span>
                                <span className="font-mono text-blue-600">{(evalScores as any)[metric.key]}%</span>
                              </div>
                              <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                value={(evalScores as any)[metric.key]}
                                onChange={(e) => setEvalScores(prev => ({ ...prev, [metric.key]: parseInt(e.target.value) }))}
                                className="w-full accent-blue-600"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Reviewer Note text box */}
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase text-slate-400 tracking-wider block">
                          {isRtl ? 'ملاحظات وتوصيات لجنة التحكيم المجهولة' : 'Reviewer confidential comments'}
                        </label>
                        <textarea 
                          rows={3}
                          value={evalNotes}
                          onChange={(e) => setEvalNotes(e.target.value)}
                          placeholder={isRtl ? 'اكتب تبريرات اللجنة والتوصية بالمسار المناسب...' : 'Log justification for accept or weight criteria...'}
                          className="w-full border rounded-xl p-3 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 justify-end pt-4 border-t">
                        <button 
                          onClick={() => setSelectedApplication(null)}
                          className="px-4 py-2 border rounded-xl hover:bg-slate-50 transition-all font-bold text-xs text-slate-600"
                        >
                          {isRtl ? 'إلغاء' : 'Cancel'}
                        </button>
                        <button 
                          onClick={handleSaveEvaluation}
                          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
                        >
                          <Send size={14} />
                          {isRtl ? 'اعتماد التقييم واحتساب النقاط' : 'Submit Score Sheet'}
                        </button>
                      </div>

                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center p-12 text-center text-slate-300">
                      <Shield size={48} className="stroke-1 mb-3" />
                      <p className="text-xs font-bold text-slate-400">{isRtl ? 'اختر أي متقدم من القائمة الجانبية لبدء الفحص والتقييم والفرز المجهول.' : 'Pick an applicant on the sidebar menu queue to trigger anonymous evaluations spreadsheet.'}</p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: TRAINERS & EXPERTS DIRECTORY */}
          {activeTab === 'trainers' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-black text-slate-900">{isRtl ? 'قاعدة بيانات المستشارين والمدربين الفنيين' : 'Academy Expert Trainer Database'}</h3>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {trainers.map((tr) => (
                  <div key={tr.id} className="bg-white border border-slate-200 rounded-[24px] p-6 space-y-4 shadow-xs">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                        <User size={24} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-slate-900">{tr.name}</h4>
                        <p className="text-xs text-slate-400 font-bold">{tr.expertise}</p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                      {tr.bio}
                    </p>

                    <div className="grid grid-cols-2 gap-3 bg-slate-50 border p-3 rounded-xl text-[11px] font-bold text-slate-500">
                      <p>🎓 {isRtl ? 'الشهادات والمؤهلات:' : 'Qualifications:'} <span>{tr.certifications || 'زمالة معتمدة'}</span></p>
                      <p>⭐ {isRtl ? 'التقييم الفني:' : 'Expert Score:'} <span className="text-amber-500 font-mono">{tr.rating || '5.0'} / 5</span></p>
                    </div>

                    <div className="pt-2 flex justify-between items-center text-xs">
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-black font-mono">
                        {isRtl ? 'الخبرة:' : 'Yrs Practice:'} {tr.experience}
                      </span>
                      <button 
                        onClick={() => triggerAiAcademyAction('recommend', { courseTitle: 'تحقيقات الفساد المالي المتقدمة', trainers: trainers })}
                        className="text-xs font-black text-blue-600 hover:underline flex items-center gap-1.5"
                      >
                        <Zap size={13} />
                        {isRtl ? 'استشارة ملاءمته لكورس مخصص' : 'Interactive Trainer Match Query'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: VENUES & LOGISTICS TRACKER */}
          {activeTab === 'venues' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* Add Venue */}
                <div className="bg-white p-6 border border-slate-200 rounded-[24px] space-y-4">
                  <h3 className="text-sm font-black text-slate-900">{isRtl ? 'إدراج موقع / منصة تدريب' : 'Create Training Venue/Platform'}</h3>
                  <form onSubmit={handleCreateVenue} className="space-y-3.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 block">{isRtl ? 'اسم الموقع' : 'Venue/Platform Name'}</label>
                      <input name="name" required className="w-full border rounded-xl p-2.5 text-xs outline-none" placeholder={isRtl ? 'مثال: فندق الشيراتون، قاعة الصداقة...' : 'Sheraton Grand Hall, Zoom Pro...'} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 block">{isRtl ? 'النوع' : 'Category'}</label>
                      <select name="type" className="w-full border rounded-xl p-2.5 text-xs outline-none bg-white">
                        <option value="Academy Hall">{isRtl ? 'قاعة أكاديمية بيت الصحافة' : 'PressHouse Hall'}</option>
                        <option value="Hotel">{isRtl ? 'قاعة فندق' : 'Hotel Hall'}</option>
                        <option value="Online Platform">{isRtl ? 'منصة تدريبية إلكترونية' : 'Online Platform'}</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 block">{isRtl ? 'الاستيعاب' : 'Capacity'}</label>
                        <input name="capacity" type="number" className="w-full border rounded-xl p-2.5 text-xs outline-none" placeholder="30" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 block">{isRtl ? 'التكلفة اليومية ($)' : 'Daily Cost'}</label>
                        <input name="cost" type="number" className="w-full border rounded-xl p-2.5 text-xs outline-none" placeholder="0" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 block">{isRtl ? 'التجهيزات والمعدات الفنية' : 'Technical equipment'}</label>
                      <input name="equipment" className="w-full border rounded-xl p-2.5 text-xs outline-none" placeholder={isRtl ? 'مثال: بروجكتر، شبكة ألياف...' : 'Projector, smart hub...'} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 block">{isRtl ? 'التسهيلات والوصول الشامل' : 'Accessibility options'}</label>
                      <input name="accessibility" className="w-full border rounded-xl p-2.5 text-xs outline-none" placeholder={isRtl ? 'مهيأة لأصحاب الهمم' : 'Wheelchair accessibility...'} />
                    </div>
                    <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-colors">
                      {isRtl ? 'إدراج المقر بقائمة المواقع' : 'Register Venue Profile'}
                    </button>
                  </form>
                </div>

                {/* Venues list and Logistical Tracker */}
                <div className="xl:col-span-2 bg-white p-6 border border-slate-200 rounded-[24px] space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-slate-900">{isRtl ? 'سجل غرف ومقر التدريب' : 'Venues & Training Facilities'}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {venues.map(v => (
                        <div key={v.id} className="bg-slate-50 border border-slate-200/80 p-4.5 rounded-xl space-y-2">
                          <div className="flex justify-between items-start">
                            <h4 className="text-xs font-black text-slate-900">{v.name}</h4>
                            <span className="text-[10px] bg-slate-200 font-bold px-2 py-0.5 rounded text-slate-600">{v.type}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-tight">💼 {isRtl ? 'تجهيزات الموقع:' : 'Gear:'} {v.equipment || 'مكتمل فنيّاً'}</p>
                          <p className="text-[11px] text-slate-400 leading-tight">♿ {isRtl ? 'الوصول والحركة:' : 'Access:'} {v.accessibility || 'اعتيادي'}</p>
                          <div className="pt-2 border-t flex justify-between text-[11px] font-black text-slate-500 font-mono">
                            <span>{isRtl ? 'السعة:' : 'Max Trainees:'} {v.capacity || 40}</span>
                            <span>{isRtl ? 'التكلفة:' : 'Cost (Day):'} {v.cost || 0}$</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-6 space-y-4">
                    <h3 className="text-sm font-black text-slate-900">{isRtl ? 'خطة الإنفاق واللوجستيات للمجاميع' : 'Logistics Plan & Expenditure Trackers'}</h3>
                    <div className="border border-slate-100 rounded-xl overflow-hidden text-xs">
                      <table className="w-full text-start border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-black border-b">
                            <th className="p-3 text-start">{isRtl ? 'الدورة المعنية' : 'Relational Program'}</th>
                            <th className="p-3 text-start">{isRtl ? 'البند' : 'Expense Category'}</th>
                            <th className="p-3 text-start">{isRtl ? 'المبلغ الفردي' : 'Amount'}</th>
                            <th className="p-3 text-start">{isRtl ? 'حالة الدفع والتنفيذ' : 'Status'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          <tr>
                            <td className="p-3 font-bold">دبلوم الاستقصاء الرائد</td>
                            <td className="p-3">تضمين تذاكر السفر وإقامة فندقية للصحفيين من تعز</td>
                            <td className="p-3 font-mono font-bold text-amber-600">840$</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-[10px] font-bold">{isRtl ? 'معلق الصرف' : 'Awaiting Ledger Approve'}</span>
                            </td>
                          </tr>
                          <tr>
                            <td className="p-3 font-bold">معسكر خطابات الكراهية المكثف</td>
                            <td className="p-3">وجبات خفيفة ومستلزمات مطبوعة لليوم التحضيري</td>
                            <td className="p-3 font-mono font-bold text-emerald-600">320$</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold">{isRtl ? 'مستوفى ومدفوع' : 'Settled'}</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}

          {/* TAB 6: LMS CURRICULUM BUILDER */}
          {activeTab === 'lms' && (
            <div className="space-y-6">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-4.5 rounded-2xl border border-slate-200">
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-slate-900">{isRtl ? 'محرر مساقات ومنهاج الأكاديمية الرقمي' : 'Self-Paced LMS Syllabus Builder'}</h3>
                  <p className="text-xs text-slate-400">{isRtl ? 'قم ببناء الوحدات التدريبية المترابطة والوحدات والاختبارات التفاعلية.' : 'Arrange sequential models, dynamic quiz templates, and grading benchmarks.'}</p>
                </div>
                <select 
                  value={selectedCourseLms} 
                  onChange={(e) => setSelectedCourseLms(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border text-xs outline-none bg-white font-bold text-slate-700"
                >
                  <option value="">{isRtl ? '-- اختر المسار التعليمي لبناء وحداته --' : '-- Choose target course --'}</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title[isRtl ? 'ar' : 'en']}</option>
                  ))}
                </select>
              </div>

              {selectedCourseLms ? (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  
                  {/* Modular builder hierarchy */}
                  <div className="xl:col-span-2 bg-white p-6 border border-slate-200 rounded-[24px] space-y-6">
                    <div className="flex justify-between items-center pb-2 border-b">
                      <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider font-mono">
                        {isRtl ? 'مخطط الوحدات التدريبية' : 'Module Hierarchy Directory'}
                      </h4>
                      <button 
                        onClick={() => triggerAiAcademyAction('curriculum', { title: 'معسكر صحفي متقدم', category: 'Investigative Journ' })}
                        className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1.5"
                      >
                        <Zap size={14} />
                        {isRtl ? 'توليد منهاج متكامل بالذكاء الاصطناعي' : 'Generate Full Syllabus Outline with AI'}
                      </button>
                    </div>

                    <div className="space-y-4">
                      {modules.map((mod, index) => (
                        <div key={mod.id} className="border border-slate-200 rounded-xl overflow-hidden">
                          <div className="bg-slate-50 p-4 border-b flex justify-between items-center">
                            <h5 className="text-xs font-black text-slate-800">
                              {index + 1}. {isRtl ? mod.titleAr : mod.titleEn}
                            </h5>
                            <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-widest">
                              {mod.lessons.length} LESSONS
                            </span>
                          </div>
                          <div className="p-4 space-y-2.5 divide-y divide-slate-100">
                            {mod.lessons.map((les: any) => (
                              <div key={les.id} className="flex justify-between items-center text-xs pt-2.5 first:pt-0">
                                <span className="font-semibold text-slate-600 flex items-center gap-2">
                                  {les.type === 'video' ? <Video size={13} className="text-slate-400" /> : <ClipboardList size={13} className="text-blue-500" />}
                                  {isRtl ? les.titleAr : les.titleEn}
                                </span>
                                <span className="text-[9px] font-black uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded text-slate-400 font-mono">
                                  {les.type}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Quick Module Form */}
                    <div className="bg-slate-50 border p-4.5 rounded-xl space-y-3">
                      <h5 className="text-xs font-black text-slate-800">{isRtl ? 'إدراج وحدة تدريبية جديدة' : 'Add New Curriculum Module'}</h5>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={newModuleTitleAr}
                          onChange={(e) => setNewModuleTitleAr(e.target.value)}
                          placeholder={isRtl ? 'عنوان الوحدة بالأعجمي أو العربي...' : 'Module Name (e.g. Unit 3)...'}
                          className="flex-1 border rounded-xl px-3 py-2 text-xs bg-white outline-none"
                        />
                        <button 
                          onClick={() => {
                            if (!newModuleTitleAr) return;
                            setModules(prev => [
                              ...prev, 
                              { id: Date.now().toString(), titleAr: newModuleTitleAr, titleEn: newModuleTitleAr, order: prev.length + 1, lessons: [] }
                            ]);
                            setNewModuleTitleAr('');
                          }}
                          className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl"
                        >
                          {isRtl ? 'إضافة وحدة' : 'Append'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Quiz & Assessments Designer */}
                  <div className="bg-white p-6 border border-slate-200 rounded-[24px] space-y-6">
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b pb-2">
                      <ClipboardList className="text-blue-600" size={16} />
                      {isRtl ? 'بناء الاختبارات القصيرة للأعضاء' : 'LMS Interactive Quiz Builder'}
                    </h3>

                    <div className="space-y-4">
                      {quizQuestions.map((q, idx) => (
                        <div key={q.id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                          <p className="text-xs font-black text-slate-800">{idx + 1}. {isRtl ? q.textAr : q.textAr}</p>
                          <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-500">
                            {q.optionsAr.map((optionAr: string, oIdx: number) => (
                              <div key={oIdx} className={`p-2 rounded border text-center ${oIdx === q.correctIndex ? 'bg-emerald-50 text-emerald-800 font-bold border-emerald-200' : 'bg-white'}`}>
                                {optionAr}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-slate-50 border p-4 rounded-xl space-y-4">
                      <h4 className="text-xs font-black text-slate-900">{isRtl ? 'إدراج سؤال فني' : 'Append New Multiple Choice Question'}</h4>
                      <div className="space-y-2">
                        <input 
                          type="text" 
                          value={newQuizTextAr}
                          onChange={(e) => setNewQuizTextAr(e.target.value)}
                          placeholder={isRtl ? 'نص السؤال...' : 'Question wording...'}
                          className="w-full border rounded-xl px-3 py-2 text-xs bg-white outline-none"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input 
                            type="text" 
                            value={newQuizOptionsAr[0]}
                            onChange={(e) => {
                              const copy = [...newQuizOptionsAr];
                              copy[0] = e.target.value;
                              setNewQuizOptionsAr(copy);
                            }}
                            placeholder={isRtl ? 'خيار 1 (صحيح)' : 'Correct option'}
                            className="border rounded-xl px-3 py-2 text-xs bg-white outline-none"
                          />
                          <input 
                            type="text" 
                            value={newQuizOptionsAr[1]}
                            onChange={(e) => {
                              const copy = [...newQuizOptionsAr];
                              copy[1] = e.target.value;
                              setNewQuizOptionsAr(copy);
                            }}
                            placeholder={isRtl ? 'خيار 2 (خاطئ)' : 'Wrong option'}
                            className="border rounded-xl px-3 py-2 text-xs bg-white outline-none"
                          />
                        </div>
                        <button 
                          onClick={() => {
                            if (!newQuizTextAr || !newQuizOptionsAr[0]) return;
                            setQuizQuestions(prev => [
                              ...prev,
                              { id: Date.now().toString(), textAr: newQuizTextAr, optionsAr: newQuizOptionsAr, correctIndex: 0 }
                            ]);
                            setNewQuizTextAr('');
                            setNewQuizOptionsAr(['', '']);
                          }}
                          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
                        >
                          {isRtl ? 'حقن السؤال بالمنهاج' : 'Commit Question to Pool'}
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="bg-white border rounded-[32px] p-24 text-center text-slate-300">
                  <BookOpen size={48} className="stroke-1 mx-auto mb-3" />
                  <p className="text-xs font-bold text-slate-400">{isRtl ? 'يرجى اختيار مسار تعليمي فني لفتح لوحة هيكلة الفصول وبناء المنهاج والاختبارات.' : 'Please select a training call syllabus on the list bar to activate interactive curriculum designers.'}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: CERTIFICATES MANAGEMENT */}
          {activeTab === 'certificates' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* Certificate form builder */}
                <div className="bg-white p-6 border border-slate-200 rounded-[24px] space-y-4">
                  <h3 className="text-sm font-black text-slate-900">{isRtl ? 'إصدار وتوثيق شهادة جديدة' : 'Authorize & Mint Graduate Credential'}</h3>
                  <form onSubmit={handleGenerateCertificate} className="space-y-3.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 block">{isRtl ? 'المستلم (الاسم الثلاثي بالكامل)' : 'Full Recipient name'}</label>
                      <input 
                        required 
                        value={selectedTemplateCert.recipient_name}
                        onChange={(e) => setSelectedTemplateCert(prev => ({ ...prev, recipient_name: e.target.value }))}
                        className="w-full border rounded-xl p-2.5 text-xs outline-none" 
                        placeholder={isRtl ? 'مثال: ياسمين محمد الحمادي' : 'Yasmin Hammadi...'} 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 block">{isRtl ? 'البريد الإلكتروني' : 'Recipient Email'}</label>
                      <input 
                        type="email"
                        required 
                        value={selectedTemplateCert.recipient_email}
                        onChange={(e) => setSelectedTemplateCert(prev => ({ ...prev, recipient_email: e.target.value }))}
                        className="w-full border rounded-xl p-2.5 text-xs outline-none" 
                        placeholder="yasmin@example.com" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 block">{isRtl ? 'المساق التدريبي المنجز' : 'Graduated Initiative'}</label>
                      <select 
                        value={selectedTemplateCert.course_id}
                        onChange={(e) => setSelectedTemplateCert(prev => ({ ...prev, course_id: e.target.value }))}
                        className="w-full border rounded-xl p-2.5 text-xs bg-white outline-none"
                      >
                        <option value="">{isRtl ? '-- حدد الدورة التدريبية --' : '-- Choose Course --'}</option>
                        {courses.map(c => (
                          <option key={c.id} value={c.id}>{c.title[isRtl ? 'ar' : 'en']}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 block">{isRtl ? 'فئة ونوع الشهادة الفخرية' : 'Credential Category Preset'}</label>
                      <select 
                        value={selectedTemplateCert.type}
                        onChange={(e) => setSelectedTemplateCert(prev => ({ ...prev, type: e.target.value }))}
                        className="w-full border rounded-xl p-2.5 text-xs bg-white outline-none"
                      >
                        <option value="attendance">{isRtl ? 'شهادة حضور ومشاركة' : 'Attendance Certificate'}</option>
                        <option value="completion">{isRtl ? 'شهادة إنجاز ومثابرة' : 'Completion Certificate'}</option>
                        <option value="excellence">{isRtl ? 'شهادة تميز وامتياز فخري' : 'Excellence Certificate'}</option>
                        <option value="trainer">{isRtl ? 'اعتماد مدرب معتمد بالأكاديمية' : 'Certified Academy Trainer'}</option>
                      </select>
                    </div>

                    <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-blue-500/10">
                      {isRtl ? 'حقن وطباعة المفتاح وترخيص المقعد' : 'Generate Verified Credential'}
                    </button>
                  </form>
                </div>

                {/* Issued list & mock rendering template */}
                <div className="xl:col-span-2 bg-white p-6 border border-slate-200 rounded-[24px] space-y-6">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="text-sm font-black text-slate-900">{isRtl ? 'سجل شهادات الخريجين والأرقام المرجعية المستقرة' : 'Issued Credentials Verification Registry'}</h3>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-lg font-black font-mono">
                      {certificates.length} LISTED
                    </span>
                  </div>

                  <div className="space-y-4">
                    {certificates.map(cert => (
                      <div key={cert.id} className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-white hover:border-blue-200 transition-all">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider font-mono bg-blue-100 text-blue-800">
                              {cert.type}
                            </span>
                            <span className="text-xs text-slate-400 font-mono font-bold tracking-tight">ID: {cert.id}</span>
                          </div>
                          <h4 className="text-sm font-black text-slate-800">{cert.recipient_name}</h4>
                          <p className="text-[11px] text-slate-400">{isRtl ? 'البريد الإلكتروني:' : 'Email Address:'} <span className="font-bold text-slate-600">{cert.recipient_email}</span></p>
                        </div>

                        <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                          <a 
                            href={cert.verify_url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="bg-white border text-slate-600 p-2 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors flex items-center gap-1.5"
                          >
                            <Eye size={14} />
                            {isRtl ? 'معاينة الترخيص' : 'Lookup'}
                          </a>
                          <button 
                            onClick={() => handleDeleteCertificate(cert.id)}
                            className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 8: FELLOWS & ALUMNI NETWORK */}
          {activeTab === 'alumni' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 p-8 rounded-[32px] space-y-4">
                <div className="space-y-1">
                  <h3 className="text-base font-black text-slate-900">{isRtl ? 'شبكة زمالات بيت الصحافة الوطنية' : 'Bayt Al-Sahafa Fellowship & Alumni Union'}</h3>
                  <p className="text-xs text-slate-400">{isRtl ? 'دليل الخريجين المستمر لبناء جسور التواصل والشراكة والتوظيف للصحفيين اليمنيين.' : 'Roster of past program graduates, enabling continuous tracing, mentorship matching and local job board mapping.'}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pt-4">
                  {alumni.map(al => (
                    <div key={al.id} className="border border-slate-200 rounded-[20px] p-5 space-y-4 shadow-xs bg-slate-50 hover:bg-white hover:border-blue-400 transition-all">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <h4 className="text-xs font-black text-slate-900">{al.full_name}</h4>
                          <p className="text-[11px] text-slate-400 font-bold block">{al.current_position} @ <span className="text-slate-600">{al.organization}</span></p>
                        </div>
                        {al.is_mentor === 1 && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700">
                            {isRtl ? 'مرشد معتمد' : 'Mentor'}
                          </span>
                        )}
                      </div>

                      <div className="bg-white border p-3 rounded-xl text-[10px] space-y-1 text-slate-500 font-medium">
                        <p>🎓 {isRtl ? 'المسارات المكملة:' : 'Tracks:'} {al.courses_completed ? JSON.parse(al.courses_completed).join(', ') : 'دورة الاستقصاء'}</p>
                        <p>📅 {isRtl ? 'سنة التخرج:' : 'Graduation Cohort:'} {al.graduation_year}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: REPORTS, ANALYTICS & AI ASSISTANT SANDBOX */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              
              {/* Scorecard KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { value: courses.length, labelAr: 'المسارات المنفذة', labelEn: 'Programs Draft & active', color: 'border-blue-600', trend: '+15% Month' },
                  { value: applications.length, labelAr: 'إجمالي التقديمات السنوية', labelEn: 'Total Applicant entries', color: 'border-emerald-600', trend: 'Inbound +24%' },
                  { value: certificates.length, labelAr: 'شهادات رقمية مرخصة', labelEn: 'Verified Graduates Cert', color: 'border-amber-500', trend: '100% stable' },
                  { value: alumni.length, labelAr: 'أعضاء زمالة الخريجين', labelEn: 'Alumni Network profiles', color: 'border-indigo-600', trend: 'Active Union' }
                ].map((kpi, idx) => (
                  <div key={idx} className={`bg-white border-l-4 p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2 ${kpi.color}`}>
                    <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">{isRtl ? kpi.labelAr : kpi.labelEn}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-slate-900 tracking-tight font-mono">{kpi.value}</span>
                      <span className="text-[10px] font-bold text-emerald-600 font-mono">{kpi.trend}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Graphical distribution and reaches */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                
                {/* Recruitment Funnel Pie chart */}
                <div className="bg-white p-6 border border-slate-200 rounded-[28px] space-y-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest block">{isRtl ? 'توزع القبول ونسب الفرز الفني للطلبات' : 'Applicant Pipeline Funnel Distribution'}</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie 
                          data={appStatusData} 
                          cx="50%" 
                          cy="50%" 
                          innerRadius={60} 
                          outerRadius={90} 
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {appStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Geographical reach representation */}
                <div className="bg-white p-6 border border-slate-200 rounded-[28px] space-y-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest block">{isRtl ? 'مؤشر الامتداد للمحافظات والجندرة' : 'Yemeni Provinces Geographic Reach & Gender Ratio'}</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={govReachData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                        <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                        <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                        <Tooltip cursor={{ fill: 'rgba(230,242,255,0.3)' }} />
                        <Bar dataKey="value" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

              {/* Dynamic AI Consulting Assistant & Dropout Risk warner sandbox */}
              <div className="bg-slate-900 border border-slate-800 text-white rounded-[32px] p-8 space-y-6 relative overflow-hidden">
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-blue-900/10 to-transparent pointer-events-none" />
                
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-400/20 text-blue-400 flex items-center justify-center">
                    <Zap size={18} />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-black text-white">{isRtl ? 'محرك الأكاديمية الاستشاري المدعوم بالذكاء الاصطناعي' : 'Academy AI Curriculum & Evaluation sandbox'}</h3>
                    <p className="text-[11px] text-slate-400">{isRtl ? 'المساعد الخاص ببيت الصحافة لاستنباط الحقائب التدريبية ومسح المتسربين تلقائياً.' : 'PressHouse customized LLM triggers for curriculum minting and candidate analysis.'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button 
                    onClick={() => triggerAiAcademyAction('curriculum', { title: 'الصحافة الاستقصائية الرقمية للنزاعات وتحقيقات الحرب', category: 'Investigative' })}
                    className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 hover:border-blue-500 hover:bg-slate-800 text-start text-xs font-bold leading-normal transition-all"
                  >
                    💡 {isRtl ? 'توليد مسودة كورس استقصائي كامل' : 'Draft Investigation Curriculum'}
                  </button>
                  <button 
                    onClick={() => triggerAiAcademyAction('dropout', { applicantName: 'أحمد صالح الكبسي', attendanceRate: 55, completionRate: 40 })}
                    className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 hover:border-blue-500 hover:bg-slate-800 text-start text-xs font-bold leading-normal transition-all"
                  >
                    ⚠️ {isRtl ? 'فحص مؤشر التسرب للطالب أحمد' : 'Analyze Student Dropout Risks'}
                  </button>
                  <button 
                    onClick={() => triggerAiAcademyAction('recommend', { courseTitle: 'صحافة الهاتف المحمول ورواية القصص الملهمة', trainers: trainers })}
                    className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 hover:border-blue-500 hover:bg-slate-800 text-start text-xs font-bold leading-normal transition-all"
                  >
                    🤝 {isRtl ? 'البحث عن المدرب الأكفأ للمحمول' : 'Match Perfect Expert For Mobile Calling'}
                  </button>
                </div>

                {/* AI prompt / response rendering boxes */}
                {aiGenerating ? (
                  <div className="p-6 bg-slate-800/60 border border-slate-700 rounded-2xl flex items-center gap-3">
                    <Loader2 className="animate-spin text-blue-400" size={20} />
                    <p className="text-xs font-bold text-slate-300">{isRtl ? 'جاري الفحص بالخادم والتوليد التلقائي...' : 'Consulting PressHouse server and composing response...'}</p>
                  </div>
                ) : aiResponse && (
                  <div className="p-6 bg-slate-800 border border-slate-700 rounded-2xl space-y-4">
                    <h5 className="text-xs font-black text-blue-400 uppercase tracking-widest">{isRtl ? 'توجيهات ومخرجات مساعد الأكاديمية' : 'AI Assistant Suggestions'}</h5>
                    <div className="text-xs text-slate-200 leading-relaxed font-mono whitespace-pre-wrap">
                      {aiResponse}
                    </div>
                    <button 
                      onClick={() => setAiResponse('')}
                      className="text-[10px] text-slate-400 hover:text-white font-bold block"
                    >
                      ✕ {isRtl ? 'إغلاق المخرجات' : 'Clear Results'}
                    </button>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}
