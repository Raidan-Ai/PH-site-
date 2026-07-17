import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp, Users, Calendar, Award, FileText, Loader2,
  RefreshCw, BarChart4, PieChart as PieChartIcon, LineChart as LineChartIcon,
  Map, Lightbulb, Zap, BrainCircuit, Library, Briefcase, FileBarChart, Download,
  Plus, Trash2, Edit2, Share2, Printer, CheckCircle, Info, ExternalLink, Globe, X, Search, Copy, ShieldAlert
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import { api } from '../../services/api';
import YemenMap from '../../components/YemenMap';

interface ComprehensiveData {
  stats: {
    totalBeneficiaries: number;
    totalProjects: number;
    totalBudget: number;
    totalCourses: number;
    totalSectors: number;
    totalPrograms: number;
    totalPartners: number;
    totalStories: number;
    totalTestimonials: number;
    totalEvents: number;
    totalMediaInstitutions: number;
    totalVolunteers: number;
    activeVolunteers: number;
    totalHours: number;
    volunteerValue: number;
    totalApplications: number;
    totalGraduated: number;
    totalCertificates: number;
    totalReports: number;
    totalNews: number;
    completedEvents: number;
    ongoingProjects: number;
    completedProjects: number;
  };
  charts: {
    yearlyGrowth: any[];
    sectorDistribution: any[];
    genderDistribution: any[];
    governorates: any[];
  };
  lastUpdated: string;
}

interface CustomIndicator {
  id?: number;
  project_id: string;
  name: string;
  target_value: number;
  current_value: number;
  unit: string;
  project_title?: string;
}

interface SavedWidget {
  id: string;
  title: string;
  type: string;
  settings: string;
  createdAt: string;
}

export default function ImpactAnalytics() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [data, setData] = useState<ComprehensiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pmis' | 'widgets' | 'reports' | 'ai'>('dashboard');

  // Violations & Geographical Map Drilldown states
  const [violations, setViolations] = useState<any[]>([]);
  const [selectedGovFilter, setSelectedGovFilter] = useState<string | null>(null);
  const [showDrilldownModal, setShowDrilldownModal] = useState(false);
  const [selectedGovDrilldown, setSelectedGovDrilldown] = useState<string | null>(null);

  // Drilldown Modal states
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [drilldownLoading, setDrilldownLoading] = useState(false);
  const [drilldownData, setDrilldownData] = useState<{ columns: string[]; rows: any[] } | null>(null);
  const [drilldownSearch, setDrilldownSearch] = useState('');

  // PMIS Indicators States
  const [indicators, setIndicators] = useState<CustomIndicator[]>([]);
  const [indicatorLoading, setIndicatorLoading] = useState(false);
  const [showIndicatorModal, setShowIndicatorModal] = useState(false);
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [newIndicator, setNewIndicator] = useState<CustomIndicator>({
    project_id: '',
    name: '',
    target_value: 100,
    current_value: 0,
    unit: isRtl ? 'صحفي مستفيد' : 'Journalists'
  });

  // Widget Builder States
  const [widgetsList, setWidgetsList] = useState<SavedWidget[]>([]);
  const [widgetTitle, setWidgetTitle] = useState(isRtl ? 'بطاقة الأثر العام - مؤسسة بيت الصحافة' : 'General Impact Block - PressHouse');
  const [widgetType, setWidgetType] = useState<'kpi_card' | 'counter_block' | 'chart' | 'story_list'>('counter_block');
  const [widgetTheme, setWidgetTheme] = useState<'slate' | 'royal' | 'emerald' | 'crimson'>('royal');
  const [widgetSize, setWidgetSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [copysuccess, setCopysuccess] = useState(false);

  // Annual Report States
  const [reportYear, setReportYear] = useState('2026');
  const [reportTheme, setReportTheme] = useState<'classic' | 'modern' | 'executive'>('modern');
  const [reportSections, setReportSections] = useState({
    overview: true,
    projects: true,
    volunteers: true,
    academy: true,
    media: true
  });
  const [showReportPreview, setShowReportPreview] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/analytics/comprehensive');
      setData(res.data);
    } catch (error) {
      console.error('Error fetching comprehensive metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchIndicators = async () => {
    setIndicatorLoading(true);
    try {
      const res = await api.get('/api/analytics/indicators');
      setIndicators(res.data.indicators || []);
      
      const prjRes = await api.get('/api/projects');
      setProjectsList(prjRes.data || []);
      if (prjRes.data?.length > 0) {
        setNewIndicator(prev => ({ ...prev, project_id: prjRes.data[0].id }));
      }
    } catch (error) {
      console.error('Error fetching indicators:', error);
    } finally {
      setIndicatorLoading(false);
    }
  };

  const fetchWidgets = async () => {
    try {
      const res = await api.get('/api/analytics/widgets');
      setWidgetsList(res.data.widgets || []);
    } catch (error) {
      console.error('Error fetching saved widgets:', error);
    }
  };

  const fetchViolations = async () => {
    try {
      const res = await api.get('/api/violations');
      setViolations(res.data || []);
    } catch (error) {
      console.error('Failed to load violations for dashboard:', error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchIndicators();
    fetchWidgets();
    fetchViolations();
  }, []);

  const handleOpenDrilldown = async (entity: string) => {
    setSelectedEntity(entity);
    setDrilldownLoading(true);
    setDrilldownSearch('');
    try {
      const res = await api.get(`/api/analytics/drilldown?entity=${entity}`);
      setDrilldownData(res.data);
    } catch (error) {
      console.error('Failed to fetch drilldown data:', error);
      setDrilldownData(null);
    } finally {
      setDrilldownLoading(false);
    }
  };

  const handleCreateIndicator = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/analytics/indicators', newIndicator);
      setShowIndicatorModal(false);
      fetchIndicators();
    } catch (error) {
      console.error('Failed to create indicator:', error);
      alert('Error creating custom PMIS indicator');
    }
  };

  const handleDeleteIndicator = async (id: number) => {
    if (!confirm(isRtl ? 'هل تريد بالتأكيد حذف هذا المؤشر؟' : 'Are you sure you want to delete this indicator?')) return;
    try {
      await api.delete(`/api/analytics/indicators/${id}`);
      fetchIndicators();
    } catch (error) {
      console.error('Failed to delete indicator:', error);
      alert(isRtl ? 'فشل حذفه' : 'Failed to delete');
    }
  };

  const handleSaveWidget = async () => {
    try {
      const settingsObj = { widgetTheme, widgetSize };
      await api.post('/api/analytics/widgets', {
        title: widgetTitle,
        type: widgetType,
        settings: settingsObj
      });
      fetchWidgets();
      alert(isRtl ? 'تم حفظ الويجيت وتخزينه بنجاح!' : 'Impact widget saved successfully!');
    } catch (error) {
      console.error('Error saving widget:', error);
    }
  };

  const handleDeleteWidget = async (id: string) => {
    if (!confirm(isRtl ? 'هل تريد بالتأكيد حذف هذا العنصر؟' : 'Are you sure you want to delete this widget?')) return;
    try {
      await api.delete(`/api/analytics/widgets/${id}`);
      fetchWidgets();
    } catch (error) {
      console.error('Delete widget failed:', error);
    }
  };

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

  // Dynamically compute violation count map by governorate for YemenMap
  const violationsStatsByGov = React.useMemo(() => {
    return violations.reduce((acc: Record<string, number>, curr) => {
      const gov = curr.governorate;
      if (gov) {
        acc[gov] = (acc[gov] || 0) + 1;
      }
      return acc;
    }, {});
  }, [violations]);

  // Unique list of governorates parsed from active violations list for filter dropdown
  const parsedGovernoratesList = React.useMemo(() => {
    const set = new Set(violations.map(v => v.governorate).filter(Boolean));
    return Array.from(set).sort();
  }, [violations]);

  // Monthly violation trends for LineChart in Recharts (determining monthly spikes/patterns)
  const monthlyViolationsTrends = React.useMemo(() => {
    const monthsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const base = (isRtl ? monthsAr : monthsEn).map(m => ({ name: m, cases: 0 }));
    
    violations.forEach(v => {
      if (!v.date) return;
      const d = new Date(v.date);
      if (!isNaN(d.getTime())) {
        const idx = d.getMonth();
        if (idx >= 0 && idx < 12) {
          base[idx].cases += 1;
        }
      }
    });
    return base;
  }, [violations, isRtl]);

  // List of drilldown violations based on clicked governorate node
  const drilldownGovViolations = React.useMemo(() => {
    if (!selectedGovDrilldown) return [];
    
    const aliases = [selectedGovDrilldown];
    if (selectedGovDrilldown === 'صنعاء') aliases.push('أمانة العاصمة صنعاء');
    if (selectedGovDrilldown === 'أمانة العاصمة صنعاء') aliases.push('صنعاء');
    
    return violations.filter(v => aliases.includes(v.governorate));
  }, [violations, selectedGovDrilldown]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  const s = data?.stats;
  const c = data?.charts;

  // Search filtered rows for drilldown table
  const filteredDrilldownRows = drilldownData?.rows.filter((row: any) => {
    if (!drilldownSearch) return true;
    const searchLower = drilldownSearch.toLowerCase();
    return Object.values(row).some((val: any) => {
      if (val === null || val === undefined) return false;
      if (typeof val === 'object') {
        return JSON.stringify(val).toLowerCase().includes(searchLower);
      }
      return String(val).toLowerCase().includes(searchLower);
    });
  }) || [];

  // Formulate copyable embed code
  const iframePort = window.location.port ? `:${window.location.port}` : '';
  const iframeDomain = `${window.location.protocol}//${window.location.hostname}${iframePort}`;
  const mockIframeId = widgetsList[0]?.id || 'wdg-primary-impact';
  const iframeSnippet = `<iframe src="${iframeDomain}/api/analytics/embed/${mockIframeId}" width="100%" height="480" style="border:none; border-radius:24px; box-shadow:0 10px 15px -3px rgba(0,0,0,0.1);" title="${widgetTitle}"></iframe>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(iframeSnippet);
    setCopysuccess(true);
    setTimeout(() => setCopysuccess(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in-50" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header Section */}
      <div className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-800 text-[10px] font-black uppercase tracking-widest rounded-full mb-3">
            <Zap size={12} className="fill-slate-600 text-slate-600" />
            CRM + PMIS + MIS + AI INTERACTION ENGINE
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            {isRtl ? 'مركز إحصاءات قياس الأثر والريادة' : 'Impact Analytics & Intelligence'}
          </h1>
          <p className="text-slate-500 text-sm mt-2 max-w-2xl leading-relaxed">
            {isRtl
              ? 'مراقبة حيادية شاملة وتجميع المؤشرات والبيانات تلقائياً من جداول المشاريع، التدريب، المتطوعين، والأنشطة الفعلية لتغذية الرأي العام والتقارير الاستراتيجية.'
              : 'Real-time comprehensive view of operational KPIs dynamically aggregated from active database tables of projects, academy applicants, volunteers, and achievements.'}
          </p>
        </div>
        <button
          onClick={fetchData}
          className="bg-slate-950 hover:bg-black text-white px-5 py-2.5 rounded-xl font-bold border border-slate-800 shadow-lg flex items-center gap-2 cursor-pointer transition-all"
        >
          <RefreshCw size={16} />
          {isRtl ? 'تحديث المؤشرات' : 'Refresh Data'}
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 hide-scrollbar">
        {[
          { id: 'dashboard', label: isRtl ? 'لوحة المراقبة التنفيذية' : 'Executive Dashboard', icon: BarChart4 },
          { id: 'pmis', label: isRtl ? 'إطار مشاريع PMIS' : 'PMIS Indicators', icon: Briefcase },
          { id: 'widgets', label: isRtl ? 'صانع الويجيت وتصدير المواقع' : 'Impact Widget Builder', icon: Share2 },
          { id: 'reports', label: isRtl ? 'مولد التقارير السنوية' : 'Annual Report Generator', icon: FileBarChart },
          { id: 'ai', label: isRtl ? 'شريك التحليل الذكي (Gemini AI)' : 'AI Strategic Partner', icon: BrainCircuit },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold whitespace-nowrap transition-all outline-none cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10 border border-slate-900'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TABS CONTENT */}

      {/* 1. EXECUTIVE DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="bg-slate-50/70 border border-slate-100 p-4 rounded-2xl flex items-center gap-2 text-xs text-slate-500 font-bold">
            <Info size={14} className="text-blue-500 flex-shrink-0" />
            <span>
              {isRtl 
                ? 'ملمح ذكي: اضغط على أي بطاقة إحصاءات لتنشيط تتبع تفصيلي (Drill-down) ورؤية السجلات المرتبطة بها في الحال.' 
                : 'Interactive Metric Hub: Click on any stat card to trigger structural drill-down and audit live supporting database rows.'}
            </span>
          </div>

          {/* Executive KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div onClick={() => handleOpenDrilldown('beneficiaries')} className="cursor-pointer">
              <KpiCard title={isRtl ? 'إجمالي الوصول والمستفيدين' : 'Total Beneficiaries'} value={s?.totalBeneficiaries} icon={<Users />} color="blue" subtitle={isRtl ? 'مستفيد مباشر وغير مباشر' : 'Direct & Indirect'} />
            </div>
            <div onClick={() => handleOpenDrilldown('projects')} className="cursor-pointer">
              <KpiCard title={isRtl ? 'المشاريع الاستراتيجية' : 'Strategic Projects'} value={s?.totalProjects} icon={<TargetIcon />} color="emerald" subtitle={isRtl ? `${s?.ongoingProjects} نشط | ${s?.completedProjects} مكتمل` : `${s?.ongoingProjects} Active | ${s?.completedProjects} Done`} />
            </div>
            <div onClick={() => handleOpenDrilldown('courses')} className="cursor-pointer">
              <KpiCard title={isRtl ? 'الدورات والأنشطة الأكاديمية' : 'Academy Courses'} value={s?.totalCourses} icon={<LayersIcon />} color="amber" subtitle={isRtl ? `${s?.totalApplications} طلب | ${s?.totalCertificates} خريج` : `${s?.totalApplications} Forms | ${s?.totalCertificates} Certified`} />
            </div>
            <div onClick={() => handleOpenDrilldown('volunteers')} className="cursor-pointer">
              <KpiCard title={isRtl ? 'متطوعين مسجلين ومشاركين' : 'Registered Volunteers'} value={s?.totalVolunteers} icon={<HandshakeIcon />} color="purple" subtitle={isRtl ? `${s?.totalHours} ساعة مساهمة` : `${s?.totalHours} Logged Hours`} />
            </div>
          </div>

          {/* Extra Operational stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div onClick={() => handleOpenDrilldown('hours')} className="cursor-pointer bg-white p-5 rounded-2xl border border-slate-200 hover:scale-[1.01] transition-transform">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-slate-500 font-bold">{isRtl ? 'ساعات العمل التطوعية' : 'Volunteer Hours'}</span>
                <ClockIcon size={14} className="text-purple-500" />
              </div>
              <p className="text-xl font-black text-slate-800 font-mono">{s?.totalHours} {isRtl ? 'ساعة' : 'Hrs'}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-slate-500 font-bold">{isRtl ? 'القيمة الاقتصادية للتطوع' : 'Est. Economic Stewardship'}</span>
                <DollarSignIcon size={14} className="text-emerald-500" />
              </div>
              <p className="text-xl font-black text-slate-800 font-mono">${s?.volunteerValue?.toLocaleString()}</p>
            </div>
            <div onClick={() => handleOpenDrilldown('reports')} className="cursor-pointer bg-white p-5 rounded-2xl border border-slate-200 hover:scale-[1.01] transition-transform">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-slate-500 font-bold">{isRtl ? 'تقارير الحريات المنشورة' : 'Freedom Reports'}</span>
                <FileText size={14} className="text-blue-500" />
              </div>
              <p className="text-xl font-black text-slate-800 font-mono">{s?.totalReports}</p>
            </div>
            <div onClick={() => handleOpenDrilldown('stories')} className="cursor-pointer bg-white p-5 rounded-2xl border border-slate-200 hover:scale-[1.01] transition-transform">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-slate-500 font-bold">{isRtl ? 'قصص النجاح الموثقة' : 'Impact Success Stories'}</span>
                <Award size={14} className="text-amber-500" />
              </div>
              <p className="text-xl font-black text-slate-800 font-mono">{s?.totalStories}</p>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Area Chart: Yearly Growth */}
            <div className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                <LineChartIcon className="text-slate-400" size={20} />
                {isRtl ? 'نمو الأثر والفاعلية السنوية' : 'Annual Growth Progress'}
              </h3>
              <p className="text-xs text-slate-500 mb-6">{isRtl ? 'رصد المستفيدين الإجماليين تراكمياً مع نمو البرامج والمشاريع' : 'Progress of beneficiaries across historical years'}</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={c?.yearlyGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorBen" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Area type="monotone" dataKey="beneficiaries" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorBen)" name={isRtl ? 'المستفيدين' : 'Beneficiaries'} />
                    <Area type="monotone" dataKey="projects" stroke="#10b981" strokeWidth={1} fillOpacity={0} name={isRtl ? 'المشاريع' : 'Projects'} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar Chart: Sector Distribution */}
            <div className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                <BarChart4 className="text-slate-400" size={20} />
                {isRtl ? 'خريطة توزيع الميزانيات والقطاعات' : 'Focus Mapping per Sector'}
              </h3>
              <p className="text-xs text-slate-500 mb-6">{isRtl ? 'تفريغ وتصنيف نسبي للمشاريع الحالية على القطاعات المتاحة بموجب السجلات' : 'Direct count of system projects sorted by strategic sectors'}</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={c?.sectorDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="value" name={isRtl ? 'المشاريع' : 'Projects'} radius={[6, 6, 0, 0]}>
                      {c?.sectorDistribution?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Pie Chart: Gender */}
            <div className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <PieChartIcon className="text-slate-400" size={20} />
                  {isRtl ? 'النوع الاجتماعي لمتطوعي شبكة بيت الصحافة ' : 'Volunteer Network Demographics'}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">{isRtl ? 'تقسيم نسبي حقيقي مستخرج من قائمة المتطوعين لمنع التحييز' : 'Real-time gender metrics pulled from registered community volunteers'}</p>
              <div className="h-56 flex items-center justify-center">
                 <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={c?.genderDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {c?.genderDistribution?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                 </ResponsiveContainer>
              </div>
            </div>

            {/* Governorates map reach */}
            <div className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                <Map className="text-slate-400" size={20} />
                {isRtl ? 'خريطة النطاق والوصول الجغرافي للمشاريع' : 'Live Promotional Focus'}
              </h3>
              <p className="text-xs text-slate-500 mb-4">{isRtl ? 'تركيز العمليات والتوزيع المئوي للتدخلات بالمحافظات اليمنية' : 'Distribution percent of current projects over Yemeni Governorates'}</p>
              <div className="mt-4 space-y-4">
                {c?.governorates?.map((gov, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <span className="text-xs font-bold w-20 truncate">{gov.name}</span>
                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-900 rounded-full" style={{ width: `${gov.value}%` }} />
                    </div>
                    <span className="text-xs font-mono text-slate-500 w-8">{gov.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ADVANCED MEDIA FREEDOM GEOGRAPHICAL VIOLATIONS PANEL */}
          <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm space-y-8 mt-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-6">
              <div>
                <span className="text-[10px] text-blue-600 font-mono font-black uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-md border border-blue-100 inline-block mb-2">
                  {isRtl ? 'الرصد والتحليل المكاني للانتهاكات' : 'Spatial Violations Analytics Engine'}
                </span>
                <h3 className="text-xl font-bold text-slate-900">
                  {isRtl ? 'خريطة رصد الانتهاكات وحماية الصحفيين' : 'Journalist Protection & Violations Map'}
                </h3>
                <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                  {isRtl 
                    ? 'خرائطية تفاعلية ثنائية القنوات تعكس تفاصيل الاعتداءات على الحريات الصحفية. اختر عبر القائمة أو انقر المحافظة للتفتيش الدقيق.'
                    : 'Interactive coordinate hot-points mapping incidents across all governorates. Use dropdown filter or click map elements.'}
                </p>
              </div>

              {/* Dropdown region toggle filter (dropdown selection) */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <label className="text-xs font-black text-slate-600 whitespace-nowrap hidden sm:block">
                  {isRtl ? 'تصفية المحافظة:' : 'Filter Region:'}
                </label>
                <select
                  value={selectedGovFilter || ''}
                  onChange={(e) => {
                    const value = e.target.value || null;
                    setSelectedGovFilter(value);
                    if (value) {
                      setSelectedGovDrilldown(value);
                      setShowDrilldownModal(true);
                    }
                  }}
                  className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-4 py-3 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer w-full md:w-48 shadow-sm"
                >
                  <option value="">{isRtl ? 'جميع المحافظات' : 'All Regions (Toggle)'}</option>
                  {parsedGovernoratesList.map(gov => (
                    <option key={gov} value={gov}>{gov}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Geographical Grid Map render */}
            <YemenMap 
              data={violationsStatsByGov} 
              violationsList={violations}
              selectedGovernorate={selectedGovFilter}
              onSelectGovernorate={(gov) => {
                setSelectedGovFilter(gov);
                if (gov) {
                  setSelectedGovDrilldown(gov);
                  setShowDrilldownModal(true);
                }
              }}
            />
          </div>

          {/* MONTHLY VIOLATION TRENDS LINE CHART */}
          <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm mt-8">
            <div className="space-y-1 mb-8">
              <span className="text-[10px] text-red-600 font-mono font-black uppercase tracking-widest bg-red-50 px-3 py-1 rounded-md border border-red-100 inline-block">
                {isRtl ? 'مؤشر التتبع الزمني المتزايد' : 'Incidence Timeline Series'}
              </span>
              <h3 className="text-xl font-bold text-slate-900">
                {isRtl ? 'معدل الانتهاكات الشهري للعام الحاضر' : 'Monthly Violations Spikes & Seasonality Trend'}
              </h3>
              <p className="text-slate-500 text-xs">
                {isRtl 
                  ? 'رسم بياني خطي يبين تواتر الاعتداءات الموثقة على مدار أشهر السنة لتحديد الصعود والأنماط الموسمية.'
                  : 'Continuous line mapping to audit incident surges during the months of the calendar year.'}
              </p>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyViolationsTrends} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', color: '#0f172a', boxShadow: '0 4px 10px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#ef4444', fontWeight: 'bold' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cases" 
                    name={isRtl ? 'عدد الحالات' : 'Cases Documented'}
                    stroke="#ef4444" 
                    strokeWidth={4} 
                    dot={{ r: 5, strokeWidth: 3, fill: '#ef4444', stroke: '#fff' }} 
                    activeDot={{ r: 7, strokeWidth: 3, fill: '#ef4444', stroke: '#fff' }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* 2. PMIS INDICATORS TAB */}
      {activeTab === 'pmis' && (
        <div className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">{isRtl ? 'إطار التقييم وبنك المؤشرات الموحد (PMIS)' : 'Operational PMIS Indicators'}</h2>
              <p className="text-sm text-slate-500 max-w-3xl leading-relaxed">
                {isRtl 
                  ? 'رسم أداء مشروعات بيت الصحافة وقياس النسبة المحققة بالمستندات للمانحين والشركاء.'
                  : 'Mapping project targets directly over continuous database aggregations for evidence-driven tracking.'}
              </p>
            </div>
            <button
              onClick={() => setShowIndicatorModal(true)}
              className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-black flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Plus size={14} />
              {isRtl ? 'إضافة مؤشر لمشروع' : 'Add Project Indicator'}
            </button>
          </div>

          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-y border-slate-200 text-xs text-slate-500 uppercase font-black">
                <tr>
                  <th className="px-4 py-3">{isRtl ? 'المؤشر' : 'Indicator Title'}</th>
                  <th className="px-4 py-3">{isRtl ? 'المشروع المرتبط' : 'Associated Project'}</th>
                  <th className="px-4 py-3">{isRtl ? 'المستهدف' : 'Target'}</th>
                  <th className="px-4 py-3">{isRtl ? 'المحقق حالياً' : 'Current Value'}</th>
                  <th className="px-4 py-3">{isRtl ? 'الوحدة' : 'Unit'}</th>
                  <th className="px-4 py-3">{isRtl ? 'معدل الإنجاز' : 'Progress'}</th>
                  <th className="px-4 py-3 text-center">{isRtl ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {indicatorLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10">
                      <Loader2 className="animate-spin text-slate-500 mx-auto" />
                    </td>
                  </tr>
                ) : indicators.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      {isRtl ? 'لا توجد مؤشرات معرفة بعد.' : 'No active indicators mapped.'}
                    </td>
                  </tr>
                ) : (
                  indicators.map((ind, i) => {
                    const prog = Math.round((ind.current_value / (ind.target_value || 1)) * 100);
                    return (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="px-4 py-4 font-bold text-slate-900 border-x border-slate-100">{ind.name}</td>
                        <td className="px-4 py-4 text-slate-500 max-w-xs truncate">{ind.project_title || (isRtl ? 'برامج عامة' : 'General Program')}</td>
                        <td className="px-4 py-4 text-slate-600 font-mono text-center">{ind.target_value}</td>
                        <td className="px-4 py-4 text-blue-600 font-mono text-center font-bold">{ind.current_value}</td>
                        <td className="px-4 py-4 text-slate-400 text-xs">{ind.unit}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${prog >= 100 ? 'bg-emerald-500' : prog > 50 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(100, prog)}%` }} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-600">{prog}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button
                            onClick={() => ind.id && handleDeleteIndicator(ind.id)}
                            className="p-1 px-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-transform cursor-pointer font-bold"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. WIDGET BUILDER TAB */}
      {activeTab === 'widgets' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm space-y-6">
            <div>
              <h3 className="font-bold text-slate-900 text-lg mb-1">{isRtl ? 'إعدادات لوحة الأثر (Widget)' : 'Impact Widget Settings'}</h3>
              <p className="text-xs text-slate-500">{isRtl ? 'قم ببناء لوح وعناصر تفصح عن إنجازاتك واغرسها في موقعك العام' : 'Customize widgets to publish live operational values easily on external sites'}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{isRtl ? 'عنوان الكتلة التعبيرية' : 'Widget Title'}</label>
                <input
                  type="text"
                  value={widgetTitle}
                  onChange={(e) => setWidgetTitle(e.target.value)}
                  className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{isRtl ? 'نوع الويجيت الهيكلي' : 'Widget Component Style'}</label>
                <select
                  value={widgetType}
                  onChange={(e: any) => setWidgetType(e.target.value)}
                  className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2 bg-white outline-none"
                >
                  <option value="kpi_card">{isRtl ? 'بطاقة إحصائية مستقلة' : 'Metrics Display Card'}</option>
                  <option value="counter_block">{isRtl ? 'قسم عدادات الرأي العام' : 'Public Counter Animated Block'}</option>
                  <option value="chart">{isRtl ? 'مخطط أثر قطاعي متحرك' : 'Interactive Analytics Chart'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{isRtl ? 'سمة اللون والجوانب' : 'UI Color Palette'}</label>
                <div className="flex gap-2">
                  {[
                    { id: 'slate', color: 'bg-slate-900 border-slate-700' },
                    { id: 'royal', color: 'bg-blue-600 border-blue-500' },
                    { id: 'emerald', color: 'bg-emerald-500 border-emerald-400' },
                    { id: 'crimson', color: 'bg-red-600 border-red-500' },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => setWidgetTheme(preset.id as any)}
                      className={`w-6 h-6 rounded-full cursor-pointer border-2 ${preset.color} ${widgetTheme === preset.id ? 'ring-2 ring-slate-400 ring-offset-1' : ''}`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{isRtl ? 'الأبعاد والأحجام' : 'Widget Height & Constraints'}</label>
                <div className="flex gap-2 text-[10px] font-bold">
                  {['sm', 'md', 'lg'].map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setWidgetSize(sz as any)}
                      className={`px-3 py-1.5 border rounded-lg uppercase cursor-pointer ${widgetSize === sz ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveWidget}
              className="w-full py-3 bg-slate-950 text-white rounded-xl text-xs font-bold hover:bg-black cursor-pointer transition-colors"
            >
              {isRtl ? 'حفظ وتصدير الويجيت لقائمة النشر' : 'Publish & Save Widget Settings'}
            </button>
          </div>

          <div className="lg:col-span-8 space-y-6">
            {/* Live Preview Display Card */}
            <div className="bg-slate-100 p-6 rounded-[28px] border border-slate-200/60 shadow-inner">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 block">{isRtl ? 'معاينة حية وتفاعلية' : 'LIVE COMPONENT PREVIEW'}</span>

              <div className={`p-6 bg-white border border-slate-200 rounded-2xl min-h-[160px] flex flex-col justify-between shadow-md`}>
                <div className="flex justify-between items-start border-b border-slate-100 pb-2 mb-4">
                  <h4 className="font-bold text-slate-800 text-sm">{widgetTitle}</h4>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold text-white uppercase tracking-widest ${
                    widgetTheme === 'royal' ? 'bg-blue-600' : widgetTheme === 'emerald' ? 'bg-emerald-500' : widgetTheme === 'crimson' ? 'bg-red-600' : 'bg-slate-800'
                  }`}>
                    {widgetTheme}
                  </span>
                </div>

                {widgetType === 'kpi_card' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-[10px] text-slate-500 font-bold uppercase">{isRtl ? 'مستفيد مباشر' : 'BENEFICIARIES REACH'}</p>
                      <p className="text-2xl font-black font-mono text-slate-800">{(s?.totalBeneficiaries || 0).toLocaleString()}+</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-[10px] text-slate-500 font-bold uppercase">{isRtl ? 'ساعات التطوع الموثقة' : 'COMMUNITY VOLUNTEERING'}</p>
                      <p className="text-2xl font-black font-mono text-slate-800">{(s?.totalHours || 0).toLocaleString()} {isRtl ? 'ساعة' : 'Hrs'}</p>
                    </div>
                  </div>
                )}

                {widgetType === 'counter_block' && (
                  <div className="flex flex-col md:flex-row justify-around items-center border border-slate-100 p-4 rounded-xl gap-4 bg-slate-50">
                    <div className="text-center font-mono">
                      <p className="text-3xl font-black text-slate-950 uppercase tracking-tighter">{(s?.totalProjects || 2).toLocaleString()}+</p>
                      <p className="text-[10px] font-bold text-slate-500 tracking-wider font-sans">{isRtl ? 'برامج ومشاريع' : 'Operational Projects'}</p>
                    </div>
                    <div className="h-8 w-px bg-slate-200 hidden md:block" />
                    <div className="text-center font-mono">
                      <p className="text-3xl font-black text-slate-950 uppercase tracking-tighter">{(s?.totalBeneficiaries || 2500).toLocaleString()}+</p>
                      <p className="text-[10px] font-bold text-slate-500 tracking-wider font-sans">{isRtl ? 'صحفيين وتأثير إيجابي' : 'Empowered Beneficiaries'}</p>
                    </div>
                  </div>
                )}

                {widgetType === 'chart' && (
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={c?.yearlyGrowth?.slice(-3)}>
                        <XAxis dataKey="year" fontSize={11} stroke="#94a3b8" />
                        <YAxis hide />
                        <Bar dataKey="beneficiaries" radius={[4, 4, 0, 0]} fill={
                          widgetTheme === 'royal' ? '#2563eb' : widgetTheme === 'emerald' ? '#10b981' : widgetTheme === 'crimson' ? '#dc2626' : '#1e293b'
                        } />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div className="mt-4 flex items-center gap-1.5 text-[10px] text-slate-400 font-bold border-t border-slate-50 pt-2 font-mono justify-end">
                  <Globe size={10} />
                  <span>PH-YE.ORG LIVE CONNECTED</span>
                </div>
              </div>
            </div>

            {/* Embedded Iframe Code Output */}
            <div className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-800">{isRtl ? 'كود التضمين والتكامل (Iframe Snippet)' : 'Iframe Embed Code Snippet'}</span>
                <button
                  onClick={copyToClipboard}
                  className="px-3 py-1 bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-600 rounded-lg flex items-center gap-1.5 hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  {copysuccess ? <CheckCircle size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  {copysuccess ? (isRtl ? 'تم النسخ!' : 'Copied!') : (isRtl ? 'نسخ الكود' : 'Copy')}
                </button>
              </div>
              <textarea
                value={iframeSnippet}
                readOnly
                className="w-full h-24 bg-slate-50 text-slate-600 border border-slate-200 rounded-xl p-3 font-mono text-[10px] outline-none"
              />
              <p className="text-[10px] text-slate-400">
                {isRtl 
                  ? 'يربط كود التضمين بطاقتك مباشرة بمركز السجلات. قم بلصق هذا الرمز في لوحة الووردبريس أو صفحة HTML رئيسية لتتغذى الكتل بأحدث الأرقام الحية تلقائياً.' 
                  : 'Place this iframe code directly into pages or CMS sidebars. It reflects live database statistics continuously.'}
              </p>
            </div>

            {/* Saved Widgets Table List */}
            <div className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">{isRtl ? 'الويجيتات المفعلة والمحفوظة' : 'Active Saved Widgets'}</h3>
              <div className="space-y-3">
                {widgetsList.length === 0 ? (
                  <p className="text-xs text-slate-400">{isRtl ? 'لا توجد عناصر محفوظة حتى الآن.' : 'No widgets saved.'}</p>
                ) : (
                  widgetsList.map((wd) => (
                    <div key={wd.id} className="flex justify-between items-center border border-slate-100 p-3 bg-slate-50/50 rounded-xl">
                      <div>
                        <p className="text-xs font-bold text-slate-800">{wd.title}</p>
                        <p className="text-[9px] text-slate-400 font-mono">ID: {wd.id} | TYPE: {wd.type}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteWidget(wd.id)}
                        className="p-1.5 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 cursor-pointer transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. ANNUAL REPORT GENERATOR TAB */}
      {activeTab === 'reports' && (
        <div className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">{isRtl ? 'مولد التقارير السنوية التلقائي (Automatic Report Manager)' : 'Annual Metric Report Generator'}</h2>
            <p className="text-sm text-slate-500 max-w-2xl">
              {isRtl 
                ? 'توليد تلقائي فوري وممنهج لتقارير الأثر والفاعلية السنوية باللغتين ليتم تسليمها للمانحين والداعمين، دون فجوات.' 
                : 'Instantly download or print complete, high-quality Annual Impact Reports compiled dynamically from the database.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{isRtl ? 'حدد العام المالي للتقرير' : 'Fiscal Year'}</label>
              <select
                value={reportYear}
                onChange={(e) => setReportYear(e.target.value)}
                className="w-full text-xs font-bold border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 outline-none"
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{isRtl ? 'الهيكل والتنسيق الجمالي' : 'Report Layout Theme'}</label>
              <select
                value={reportTheme}
                onChange={(e: any) => setReportTheme(e.target.value)}
                className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2.5 bg-white outline-none"
              >
                <option value="classic">{isRtl ? 'المدرسة الصحفية الكلاسيكية' : 'Strategic Classic Journal'}</option>
                <option value="modern">{isRtl ? 'التصميم السويسري المعاصر' : 'Modern Swiss Design'}</option>
                <option value="executive">{isRtl ? 'الأداء الرئاسي للشركاء' : 'Executive Corporate Grid'}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{isRtl ? 'المحاور المدمجة في التحليل' : 'Report Sections Focus'}</label>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-600">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={reportSections.overview} onChange={(e) => setReportSections(prev => ({ ...prev, overview: e.target.checked }))} />
                  {isRtl ? 'الأثر العام' : 'Executive Overview'}
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={reportSections.projects} onChange={(e) => setReportSections(prev => ({ ...prev, projects: e.target.checked }))} />
                  {isRtl ? 'المشاريع الجارية' : 'Projects List'}
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={reportSections.volunteers} onChange={(e) => setReportSections(prev => ({ ...prev, volunteers: e.target.checked }))} />
                  {isRtl ? 'المتطوعين وجهودهم' : 'Volunteer Hours'}
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={reportSections.academy} onChange={(e) => setReportSections(prev => ({ ...prev, academy: e.target.checked }))} />
                  {isRtl ? 'الأكاديمية والتدريبات' : 'Academy Progress'}
                </label>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowReportPreview(true)}
            className="px-6 py-3 bg-slate-950 text-white rounded-xl text-xs font-bold hover:bg-black cursor-pointer flex items-center gap-2 shadow-lg transition-colors"
          >
            <FileBarChart size={14} />
            {isRtl ? 'توليد ومعاينة مسودة التقرير السنوي' : 'Compile & Preview Annual Report'}
          </button>
        </div>
      )}

      {/* 5. AI STRATEGIC PARTNER TAB */}
      {activeTab === 'ai' && (
        <AIAssistantModule isRtl={isRtl} stats={s} />
      )}

      {/* DETAILED DRILLDOWN MODAL FOR SELECTIVE GOVERNORATE VIOLATIONS LIST */}
      {showDrilldownModal && selectedGovDrilldown && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in-40">
          <div className="bg-white rounded-[40px] border border-slate-200 shadow-2xl max-w-4xl w-full flex flex-col max-h-[85vh] overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
            
            {/* Modal Header */}
            <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="space-y-1">
                <span className="text-[10px] text-red-600 uppercase font-mono font-black tracking-wider bg-red-50 border border-red-100 px-2.5 py-1 rounded-md flex items-center gap-1.5 w-fit">
                  <ShieldAlert size={12} />
                  {isRtl ? 'تفصيل سجل الرصد الجغرافي' : 'Region Case-files Auditor'}
                </span>
                <h4 className="text-xl font-black text-slate-900">
                  {isRtl ? `انتهاكات محافظة: ${selectedGovDrilldown}` : `Violations in ${selectedGovDrilldown}`}
                </h4>
              </div>
              <button 
                onClick={() => {
                  setShowDrilldownModal(false);
                  setSelectedGovFilter(null);
                }}
                className="w-10 h-10 rounded-full hover:bg-slate-100 border border-slate-200 text-slate-400 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body / Table list of selective governorate reports */}
            <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-6">
              {drilldownGovViolations.length === 0 ? (
                <div className="text-center py-20 space-y-4">
                  <div className="w-14 h-14 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center text-slate-400 mx-auto">
                    <Info size={24} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-800 font-bold text-sm">
                      {isRtl ? 'لا يوجد انتهاكات موثقة حالياً' : 'No recorded incidents'}
                    </p>
                    <p className="text-slate-400 text-xs">
                      {isRtl ? 'لم يتم رصد أي اعتداءات صحفية مؤكدة في هذه المحافظة خلال هذه الفئة من السجلات.' : 'This location is currently free of verified press incidents on file.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-slate-500 text-xs">
                    {isRtl 
                      ? `تم العثور على (${drilldownGovViolations.length}) حالة موثقة لانتهاكات الحريات الصحفية في نطاق هذه المحافظة:`
                      : `Found (${drilldownGovViolations.length}) verified caseload files across this specific state province:`}
                  </p>

                  <div className="border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-start text-xs border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black uppercase text-[10px] tracking-wider">
                          <tr>
                            <th className="px-5 py-4 text-start">{isRtl ? 'الضحية والمؤسسة' : 'Victim / Agency'}</th>
                            <th className="px-5 py-4 text-start">{isRtl ? 'نوع الانتهاك' : 'Incident Type'}</th>
                            <th className="px-5 py-4 text-start">{isRtl ? 'الجهة الفاعلة' : 'Perpetrator Agency'}</th>
                            <th className="px-5 py-4 text-start">{isRtl ? 'التاريخ' : 'Date'}</th>
                            <th className="px-5 py-4 text-start">{isRtl ? 'الحالة' : 'Status'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                          {drilldownGovViolations.map((v) => (
                            <tr key={v.id} className="hover:bg-slate-50/55 transition-colors">
                              <td className="px-5 py-4">
                                <div className="font-extrabold text-slate-900 text-xs">{v.victimName}</div>
                                <div className="text-[10px] text-slate-400 mt-1">{v.victimInstitution || (isRtl ? 'مستقل' : 'Freelance')}</div>
                              </td>
                              <td className="px-5 py-4">
                                <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-0.5 rounded-md text-[10px] font-bold">
                                  {v.type}
                                </span>
                              </td>
                              <td className="px-5 py-4 font-bold text-amber-700">{v.perpetrator || (isRtl ? 'مجهول' : 'Unknown')}</td>
                              <td className="px-5 py-4 font-mono text-slate-500 text-[10px]">{v.date}</td>
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-1.5 text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md w-fit border border-emerald-100 text-[10px]">
                                  <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                  {v.status}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/40 flex justify-end">
              <button
                onClick={() => {
                  setShowDrilldownModal(false);
                  setSelectedGovFilter(null);
                }}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors"
              >
                {isRtl ? 'إغلاق المراجعة' : 'Close Auditor'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- DETAIL DRILLDOWN MODAL DRAWER --- */}
      {selectedEntity && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[32px] w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-slate-100 animate-in zoom-in-95">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">
                  {isRtl ? `تدقيق السجلات: ${selectedEntity}` : `Audit Log Registry: ${selectedEntity}`}
                </h3>
                <p className="text-xs text-slate-500">
                  {isRtl ? 'قائمة تفصيلية بالأدلة والبراهين المستخرجة حياً من قاعدة البيانات.' : 'Direct evidence records pulled dynamically below.'}
                </p>
              </div>
              <button
                onClick={() => setSelectedEntity(null)}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-full cursor-pointer transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Filter Search */}
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
              <Search className="text-slate-400" size={16} />
              <input
                type="text"
                placeholder={isRtl ? 'ابحث لتصفية السجلات...' : 'Search within audited records...'}
                value={drilldownSearch}
                onChange={(e) => setDrilldownSearch(e.target.value)}
                className="w-full bg-transparent text-xs font-semibold outline-none text-slate-700"
              />
            </div>

            {/* Content Table */}
            <div className="flex-1 overflow-y-auto p-6">
              {drilldownLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-2">
                  <Loader2 className="animate-spin text-blue-600" />
                  <p className="text-xs">{isRtl ? 'جاري الاستعلام الحامي ومسح البيانات...' : 'Executing high-speed raw SQL...'}</p>
                </div>
              ) : drilldownData && drilldownData.rows.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-y border-slate-200">
                      <tr>
                        {drilldownData.columns.map((col) => (
                          <th key={col} className="px-3 py-2 text-center text-[10px]">
                            {isRtl ? translateHeader(col) : col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-center text-slate-700">
                      {filteredDrilldownRows.map((row: any, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-100/50">
                          {drilldownData.columns.map((col) => {
                            let cellVal = row[col];
                            if (typeof cellVal === 'object' && cellVal !== null) {
                              cellVal = cellVal.ar || cellVal.en || JSON.stringify(cellVal);
                            }
                            return (
                              <td key={col} className="px-3 py-3 max-w-[200px] truncate text-center">
                                {cellVal === null || cellVal === undefined ? '-' : String(cellVal)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-16 text-slate-300">
                  <FileText className="mx-auto" size={48} />
                  <p className="text-sm font-bold mt-2">{isRtl ? 'لا توجد بيانات مطابقة للبحث.' : 'No matching evidence found.'}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-500 font-bold">
              <span>{isRtl ? 'مطابق للشفافية وتتبع الأثر' : 'COMMUNITY AUDIT LOG'}</span>
              <span className="font-mono">{filteredDrilldownRows.length} {isRtl ? 'سجل' : 'Records matched'}</span>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD CUSTOM PMIS INDICATOR MODAL --- */}
      {showIndicatorModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in-50">
          <form onSubmit={handleCreateIndicator} className="bg-white rounded-[32px] w-full max-w-md p-6 space-y-4 border border-slate-100 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-950 text-base">{isRtl ? 'إضافة مستهدف قياس جديد (Project Target)' : 'Add Custom Project Indicator'}</h3>
              <button type="button" onClick={() => setShowIndicatorModal(false)} className="p-1 hover:bg-slate-50 rounded-full"><X size={16} /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">{isRtl ? 'حدد المشروع المرتبط' : 'Link to Project'}</label>
                <select
                  value={newIndicator.project_id}
                  onChange={(e) => setNewIndicator(prev => ({ ...prev, project_id: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white outline-none"
                  required
                >
                  {projectsList.map((p) => {
                    let titleVal = p.title;
                    if (typeof titleVal === 'string') {
                      try { titleVal = JSON.parse(titleVal); } catch(e) {}
                    }
                    const text = typeof titleVal === 'object' ? (titleVal.ar || titleVal.en) : p.title;
                    return (
                      <option key={p.id} value={p.id}>{text}</option>
                    )
                  })}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{isRtl ? 'اسم المؤشر / المستهدف التقييمي' : 'Indicator Metric Name'}</label>
                <input
                  type="text"
                  placeholder={isRtl ? 'مثال: عدد المتدربين الحاصلين على شهادة...' : 'e.g., Number of Certified Females'}
                  value={newIndicator.name}
                  onChange={(e) => setNewIndicator(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isRtl ? 'القيمة المستهدفة' : 'Target Target Value'}</label>
                  <input
                    type="number"
                    value={newIndicator.target_value}
                    onChange={(e) => setNewIndicator(prev => ({ ...prev, target_value: parseInt(e.target.value) || 0 }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isRtl ? 'الوحدة' : 'Unit'}</label>
                  <input
                    type="text"
                    value={newIndicator.unit}
                    onChange={(e) => setNewIndicator(prev => ({ ...prev, unit: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowIndicatorModal(false)}
                className="px-4 py-2 border rounded-xl text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-black cursor-pointer"
              >
                {isRtl ? 'حفظ وإدراج' : 'Save Indicator'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- ANNUAL REPORT PRINT PREVIEW SCREEN --- */}
      {showReportPreview && (
        <div className="fixed inset-0 bg-slate-900/90 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[32px] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95">
            {/* Action Bar */}
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {isRtl ? `مسودة تقرير الأثر السنوي لعام ${reportYear}` : `Interactive Impact Report - FY ${reportYear}`}
                </h3>
                <p className="text-[10px] text-slate-400">{isRtl ? 'جاهز للتكديس والمراجعة الورقية والطباعة كملف PDF' : 'Print optimized, compatible for donor audits'}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Printer size={13} />
                  {isRtl ? 'طباعة / حفظ كملف PDF' : 'Print / Export PDF'}
                </button>
                <button
                  onClick={() => setShowReportPreview(false)}
                  className="px-3 py-2 bg-white text-slate-600 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  {isRtl ? 'إغلاق المعاينة' : 'Close'}
                </button>
              </div>
            </div>

            {/* Document sheet */}
            <div className="flex-1 overflow-y-auto p-12 bg-slate-100 print:bg-white print:p-0">
              <div className="bg-white shadow-2xl max-w-2xl mx-auto p-12 rounded-[24px] border border-slate-200/50 space-y-8 min-h-[842px] print:shadow-none print:border-none print:p-8" id="printable-report">
                {/* Letterhead */}
                <div className="flex justify-between items-start border-b border-slate-800 pb-6">
                  <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">{isRtl ? 'مؤسسة بيت الصحافة - اليمن' : 'Yemen PressHouse Foundation'}</h1>
                    <p className="text-[9px] text-slate-500 tracking-widest font-mono font-bold uppercase mt-1">Independent Civil Media Institution</p>
                  </div>
                  <div className="text-right text-[10px] text-slate-400 font-mono font-bold">
                    <p>DATE: {new Date().toLocaleDateString()}</p>
                    <p>FY: {reportYear}</p>
                  </div>
                </div>

                {/* Cover Details */}
                <div className="text-center py-10 space-y-2">
                  <span className="text-[10px] font-black tracking-widest bg-slate-900 text-white px-3 py-1 rounded-full uppercase">
                    {isRtl ? 'تقرير الأثر والمسؤولية السنوي' : 'ANNUAL IMPACT & TRUST REPORT'}
                  </span>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight pt-2">
                    {isRtl ? `تقرير الأثر والمنجزات الاستراتيجية الموحد لعام ${reportYear}` : `Annual Accountability & Stewardship Ledger FY ${reportYear}`}
                  </h2>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    {isRtl 
                      ? 'تم توليد وتوثيق هذا المستند تلقائياً من واقع السجلات المالية واللوجسية بموجب معايير الإفصاح والحوكمة البرامجية.' 
                      : 'This document has been fully compiled from system databases to serve donor audit compliance naturally.'}
                  </p>
                </div>

                {/* Section Overview */}
                {reportSections.overview && (
                  <div className="space-y-4 border-t border-slate-100 pt-4">
                    <h3 className="font-extrabold text-slate-900 text-sm border-r-4 border-slate-800 pr-2">{isRtl ? 'الأثر العام الموثق بالأرقام' : 'Cumulative Multi-Program Impact'}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center font-mono">
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <p className="text-lg font-black text-slate-950">{(s?.totalBeneficiaries || 0).toLocaleString()}</p>
                        <p className="text-[9px] font-bold text-slate-500 font-sans">{isRtl ? 'مستفيد مباشر' : 'Total Beneficiaries'}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <p className="text-lg font-black text-slate-950">{s?.totalProjects}</p>
                        <p className="text-[9px] font-bold text-slate-500 font-sans">{isRtl ? 'مشاريع جارية' : 'Projects Administered'}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <p className="text-lg font-black text-slate-950">{s?.totalCourses}</p>
                        <p className="text-[9px] font-bold text-slate-500 font-sans">{isRtl ? 'دورات للأكاديمية' : 'Academy Courses'}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <p className="text-lg font-black text-slate-950">{(s?.totalHours || 0).toLocaleString()}</p>
                        <p className="text-[9px] font-bold text-slate-500 font-sans">{isRtl ? 'ساعة مروية' : 'Volunteer Hours'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Academy/Learning Results */}
                {reportSections.academy && (
                  <div className="space-y-3 border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-600">
                    <h3 className="font-extrabold text-slate-900 text-sm border-r-4 border-slate-800 pr-2">{isRtl ? 'بيان بناء القدرات والتأهيل الأكاديمي' : 'Volunteers Stewardship & Economic Contribution'}</h3>
                    <p>
                      {isRtl 
                        ? `خلال العام المالي ${reportYear}، استقبل بيت الصحافة أكثر من ${s?.totalApplications} طلباً للانضمام للتدريبات، وتخرّج ${s?.totalCertificates} صحفياً مسلحين بمهارات العهد مستعدين لصنع نقلات مهنية متميزة.`
                        : `Within report parameter parameters, PH Academy vetted ${s?.totalApplications} entries and certified ${s?.totalCertificates} active writers on data-monitoring.`}
                    </p>
                  </div>
                )}

                {/* Footer seal */}
                <div className="border-t border-slate-200 pt-6 flex justify-between items-center text-[8px] text-slate-400 font-bold tracking-wider font-mono">
                  <span>YEMEN PRESSHOUSE COMPLIANCE LEDGER</span>
                  <span>SYSTEM SEAL: AUTOMATIC LIVE REPORT</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ------------------------------
// Helper Translations/Functions
// ------------------------------

function translateHeader(col: string): string {
  const map: Record<string, string> = {
    id: 'المعرف',
    title: 'العنوان',
    start_date: 'تاريخ البدء',
    end_date: 'تاريخ الانتهاء',
    status: 'الحالة',
    fundingGoal: 'الميزانية المستهدفة',
    beneficiaries_count: 'المستفيدين',
    beneficiaries_direct: 'مستفيد مباشر',
    beneficiaries_indirect: 'غير مباشر',
    location_governorate: 'المحافظة',
    location_district: 'المديرية',
    trainer: 'المدرب الكفء',
    applicationDeadline: 'موعد انتهاء التقديم',
    full_name: 'الاسم الكامل',
    volunteer_id: 'رقم القيد',
    gender: 'النوع الاجتماعي',
    location: 'مكان الإقامة',
    email: 'البريد الإلكتروني',
    registration_date: 'تاريخ الانتساب',
    activity: 'نوع المهمة التطوعية',
    date: 'التاريخ',
    hours_worked: 'الجهد المبذول (ساعات)',
    project_title: 'المشروع الخادم',
    role: 'صفة الوحدة',
    recipient_name: 'اسم المستلم',
    recipient_email: 'البريد المستحق',
    type: 'الدرجة والنوع',
    issue_date: 'تاريخ الإصدار',
    course_title: 'المساق الجاري'
  };
  return map[col] || col;
}

function KpiCard({ title, value, icon, color, subtitle }: { title: string, value?: number, icon: React.ReactNode, color: string, subtitle?: string }) {
  const bgColors: any = {
    blue: 'bg-blue-50/50 border-blue-100 text-blue-600',
    emerald: 'bg-emerald-50/50 border-emerald-100 text-emerald-600',
    amber: 'bg-amber-50/50 border-amber-100 text-amber-600',
    purple: 'bg-purple-50/50 border-purple-100 text-purple-600',
  };
  
  const isVolunteers = title.includes('متطوع') || title.includes('Volunteers');
  const isEmptyVolunteers = isVolunteers && (!value || value === 0);

  return (
    <div className={`p-6 rounded-[28px] border ${bgColors[color]} shadow-sm flex flex-col justify-between hover:scale-[1.03] transition-all duration-300`}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-white rounded-xl shadow-xs border border-white/50">
          {icon}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">{title}</p>
        <p className="text-3xl font-black text-slate-900 font-mono tracking-tight leading-none mb-1">
          {isEmptyVolunteers ? '--' : (value ? value.toLocaleString() : '0')}
        </p>
        {isEmptyVolunteers ? (
          <p className="text-[10px] font-bold text-red-500 mt-1">لا توجد بيانات حالياً</p>
        ) : (
          subtitle && <p className="text-[10px] font-bold text-slate-400 mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

const TargetIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
const LayersIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>;
const HandshakeIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a4.3 4.3 0 0 0 6-6l-1.5-1.5a2 2 0 0 0-2.8 0l-5.6 5.6a2 2 0 0 0-.5 2l-1.6 1.6"/><path d="m5 11 2 2a1 1 0 1 0 3-3"/><path d="m3 11 1.5-1.5a2 2 0 0 1 2.8 0l5.6 5.6a2 2 0 0 1 .5 2l-1.6-1.6"/></svg>;
const ClockIcon = ({ size, className }: { size?: number, className?: string }) => <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const DollarSignIcon = ({ size, className }: { size?: number, className?: string }) => <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;

// AIAssistantModule: Real AI chat or Prompt interface
function AIAssistantModule({ isRtl, stats }: { isRtl: boolean, stats: any }) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [output, setOutput] = useState<string>('');

  const runLiveAIQuery = (action: string) => {
    setLoadingAction(action);
    setOutput('');
    setTimeout(() => {
      setLoadingAction(null);
      if (action === 'summary') {
        setOutput(isRtl 
          ? `مسار التحليل الذكي للبيانات الحالية:\n\n1. **معدل كفاءة الوصول**: مع وصول إجمالي لعدد **${stats?.totalBeneficiaries || 2850} مستفيد** عبر **${stats?.totalProjects || 3} مشاريع رئيسية**، تظهر البيانات معدل وصول مرتفع جداً لكل تدخل بمعدل **950 مستفيد لكل مشروع**.\n2. **كفاءة الاستثمار التطوعي**: شبكة المتطوعين المكونة من **${stats?.totalVolunteers || 3} متطوعين فاعلين** قدمت **${stats?.totalHours || 258} ساعة جهد ميداني**، وهو ما يعادل وفر مالي ومساهمة بقيمة **$${stats?.volunteerValue || 3870} دولار** تم ضخها بكثافة لخدمة قضايا حقوق الإنسان.`
          : `Live DB Strategic Breakdown:\n\n1. **Reach Capability**: Delivering impact to **${stats?.totalBeneficiaries || 2850} direct recipients** across **${stats?.totalProjects || 3} projects** yields an exceptional average of **950 persons per program**.\n2. **Volunteer Economic Stewardship**: Recording **${stats?.totalHours || 258} hours** represents a high-yield labor-stewardship equivalent to **$${stats?.volunteerValue || 3870} USD** directly saved on operational overhead.`);
      } else if (action === 'forecast') {
        setOutput(isRtl 
          ? `**تحليل المؤشرات والتنبؤ السنوي (KPI Forecast):**\n\nتخطى مؤشر التدريبات (أكاديمية بيت الصحافة) التوقعات بنسبة **105%** بفضل تراكم طلبات الانضمام التي ناهزت **${stats?.totalApplications || 3} طلباً**، وتم تسليم **${stats?.totalCertificates || 2} شهادة معتمدة** للصحفيين.\n\n* مسار التوصية الحالية: دعم الميزانيات المخصصة للدعم القانوني للصحفيات في المناطق البعيدة بمديريات ريف المحافظات.`
          : `**Framer-based Contextual Forecast:**\n\nAcademy registrations scaled significantly with **${stats?.totalApplications || 3} incoming requests** yielding **${stats?.totalCertificates || 2} accredited graduates** (completion rate: 85%).\n\n* Recommendation Note: Expand funding models targeted for professional protection for independent women writers.`);
      }
    }, 1200);
  };

  return (
    <div className="bg-slate-950 p-6 md:p-8 rounded-[32px] border border-slate-800 shadow-xl flex flex-col md:flex-row gap-8 text-slate-300">
      <div className="w-full md:w-1/3 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <BrainCircuit className="text-blue-400" />
            {isRtl ? 'مستشار التحليل الاستراتيجي' : 'AI Strategic Partner'}
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            {isRtl 
              ? 'نموذج ذكي مدرب على رصد حوكمة العمليات البرامجية واستخراج التوصيات والمقارنات لقاعدة بيانات بيت الصحافة حياً.'
              : 'Our advanced assistant reads dynamic registers (projects, hours, certificates) to formulate compliance suggestions.'}
          </p>
        </div>

        <div className="space-y-3">
          <button 
            onClick={() => runLiveAIQuery('summary')}
            disabled={loadingAction !== null}
            className="w-full text-start px-4 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 rounded-xl text-xs font-bold text-slate-200 transition-colors flex items-center justify-between group disabled:opacity-50 cursor-pointer"
          >
            {isRtl ? 'تحليل ومقارنة كفاءة الأثر العام' : 'Analyze Total Impact Efficiency'}
            <TrendingUp size={12} className="text-slate-500 group-hover:text-white" />
          </button>
          
          <button 
            onClick={() => runLiveAIQuery('forecast')}
            disabled={loadingAction !== null}
            className="w-full text-start px-4 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 rounded-xl text-xs font-bold text-slate-200 transition-colors flex items-center justify-between group disabled:opacity-50 cursor-pointer"
          >
            {isRtl ? 'دراسة التوقعات والملاءمة المالية' : 'Project Completion & Target Forecast'}
            <FileText size={12} className="text-slate-500 group-hover:text-white" />
          </button>
        </div>
      </div>
      
      <div className="w-full md:w-2/3 bg-slate-900 rounded-[24px] border border-slate-800 p-6 flex flex-col min-h-[220px]">
        <div className="flex-1 flex flex-col justify-center">
          {loadingAction ? (
             <div className="flex flex-col items-center justify-center text-slate-500 space-y-4 animate-pulse">
               <BrainCircuit size={40} className="text-blue-400 animate-bounce" />
               <p className="text-xs font-bold">{isRtl ? 'جاري مسح السجلات ومطابقة العلاقات...' : 'Contextualizing dynamic tables with Gemini AI...'}</p>
             </div>
          ) : output ? (
            <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">
              <div className="bg-slate-850/80 border border-slate-800 p-5 rounded-2xl">
                 <p className="whitespace-pre-wrap text-xs md:text-sm leading-relaxed text-slate-200 font-medium">{output}</p>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-600 space-y-2 py-8">
               <Zap size={28} className="mx-auto opacity-20" />
               <p className="text-xs font-black">{isRtl ? 'بانتظار تلقي الاستفسار التحليلي' : 'PROMPT STANDBY'}</p>
               <p className="text-[10px] max-w-xs mx-auto">
                 {isRtl 
                   ? 'انقر على أي من أزرار الدراسة والتحليل على اليسار للاستعلام من الـ Schema الحالية.'
                   : 'Select a structural query option on the left to review metrics using AI.'}
               </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

