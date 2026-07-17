import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import {
  TrendingUp, Users, Calendar, Award, FileText, Loader2,
  RefreshCw, BarChart4, PieChart as PieChartIcon, LineChart as LineChartIcon,
  ShieldAlert, Landmark, Target, Layers, HelpCircle, Briefcase, Plus, Trash2, CheckCircle2
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import { api } from '../../services/api';
import AcademyPerformanceChart from '../../components/admin/AcademyPerformanceChart';

interface StatsOverview {
  totalBeneficiaries: number;
  totalProjects: number;
  totalBudget: number;
  ongoingProjects: number;
  completedProjects: number;
  totalVolunteers: number;
  activeVolunteers: number;
  totalHours: number;
  volunteerValue: number;
}

interface DynamicKPI {
  id: string;
  name: string;
  target_value: number;
  current_value: number;
  unit: string;
  project_title?: string;
  project_id?: string;
}

export default function StatsDashboard() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [charts, setCharts] = useState<any>(null);
  const [indicators, setIndicators] = useState<DynamicKPI[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Form states for creating KPIs dynamically
  const [showAddModal, setShowAddModal] = useState(false);
  const [newKpi, setNewKpi] = useState({
    project_id: '',
    name: '',
    target_value: 100,
    current_value: 0,
    unit: isRtl ? 'صحفي مستفد' : 'Beneficiaries'
  });

  const fetchData = async () => {
    try {
      const comprehensiveRes = await api.get('/api/analytics/comprehensive');
      setStats(comprehensiveRes.data.stats);
      setCharts(comprehensiveRes.data.charts);

      const indicatorsRes = await api.get('/api/analytics/indicators');
      setIndicators(indicatorsRes.data.indicators || []);

      const projectsRes = await api.get('/api/projects');
      setProjects(projectsRes.data || []);
      if (projectsRes.data?.length > 0 && !newKpi.project_id) {
        setNewKpi(prev => ({ ...prev, project_id: projectsRes.data[0].id }));
      }
    } catch (error) {
      console.error('Error loading stats dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleAddKpi = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/analytics/indicators', newKpi);
      setShowAddModal(false);
      setNewKpi({
        project_id: projects[0]?.id || '',
        name: '',
        target_value: 100,
        current_value: 0,
        unit: isRtl ? 'صحفي مستفد' : 'Beneficiaries'
      });
      fetchData();
    } catch (error) {
      console.error('Error adding kpi:', error);
      alert(isRtl ? 'حدث خطأ أثناء إضافة المؤشر' : 'Error adding KPI indicator');
    }
  };

  const handleDeleteKpi = async (id: string) => {
    if (!confirm(isRtl ? 'هل أنت متأكد من حذف مؤشر الأداء هذا نهائياً؟' : 'Are you sure you want to permanently delete this KPI?')) {
      return;
    }
    try {
      await api.delete(`/api/analytics/indicators/${id}`);
      fetchData();
    } catch (error) {
      console.error('Error deleting KPI:', error);
      alert(isRtl ? 'فشل حذف المؤشر' : 'Failed to delete indicator');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="animate-spin text-blue-600" size={48} />
        <p className="text-slate-500 font-bold">{isRtl ? 'جاري تحميل لوحة المؤشرات الحية...' : 'Loading dynamic stats dashboard...'}</p>
      </div>
    );
  }

  // Fallback charts if none fetched
  const defaultYearlyGrowth = charts?.yearlyGrowth || [
    { year: 2023, projects: 1, beneficiaries: 400 },
    { year: 2024, projects: 2, beneficiaries: 1200 },
    { year: 2025, projects: 3, beneficiaries: 2850 },
    { year: 2026, projects: 4, beneficiaries: 4500 },
  ];

  const defaultSectorDistribution = charts?.sectorDistribution || [
    { name: isRtl ? 'قطاع التطوير الإعلامي' : 'Media Development', value: 3 },
    { name: isRtl ? 'قطاع الحريات وحقوق الإنسان' : 'Rights & Freedoms', value: 2 },
  ];

  const defaultGenderDistribution = charts?.genderDistribution || [
    { name: isRtl ? 'ذكور' : 'Male', value: 65 },
    { name: isRtl ? 'إناث' : 'Female', value: 35 },
  ];

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const isVolunteersEmpty = !stats?.totalVolunteers || stats.totalVolunteers === 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 text-white p-8 rounded-[40px] shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-2xl">
              <TrendingUp size={24} />
            </div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight">
              {isRtl ? 'مركز قياس الأثر والـ KPIs' : 'Impact Leadership & KPI Center'}
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
            {isRtl
              ? 'مراقبة وتقييم المؤشرات الحية ومعدلات كفاءة التدخلات التنموية والإعلامية لمؤسسة بيت الصحافة مباشرة من قاعدة بيانات Supabase.'
              : 'Direct live synchronization of indicators, budget allocations, and human assets of PressHouse connected to Supabase.'}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/10 flex items-center justify-center cursor-pointer transition-all disabled:opacity-50"
            title={isRtl ? 'تحديث البيانات' : 'Refresh Live Data'}
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs flex items-center gap-2 cursor-pointer transition-colors shadow-lg shadow-blue-500/20"
          >
            <Plus size={16} />
            {isRtl ? 'إضافة مؤشر أداء جديد' : 'New KPI Indicator'}
          </button>
        </div>
      </div>

      {/* 2. Bento Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Active Projects KPI Card */}
        <div className="p-8 bg-white rounded-[32px] border border-slate-200/80 shadow-xs flex flex-col justify-between hover:scale-[1.01] transition-transform">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <Briefcase size={22} />
            </div>
          </div>
          <div className="mt-6 space-y-1">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
              {isRtl ? 'المشاريع الجارية والنشطة' : 'Active Projects'}
            </h3>
            <p className="text-4xl font-black text-slate-900 font-mono">
              {stats?.ongoingProjects || 0}
            </p>
            <p className="text-[10px] text-slate-500 font-bold">
              {isRtl ? `إجمالي المشاريع: ${stats?.totalProjects || 0}` : `Total projects registered: ${stats?.totalProjects || 0}`}
            </p>
          </div>
        </div>

        {/* Spent Budget Card */}
        <div className="p-8 bg-white rounded-[32px] border border-slate-200/80 shadow-xs flex flex-col justify-between hover:scale-[1.01] transition-transform">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <Landmark size={22} />
            </div>
          </div>
          <div className="mt-6 space-y-1">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
              {isRtl ? 'إجمالي الميزانيات المخصصة والمنفذة' : 'Total Spent Budget'}
            </h3>
            <p className="text-4xl font-black text-slate-900 font-mono">
              ${stats?.totalBudget?.toLocaleString() || 0}
            </p>
            <p className="text-[10px] text-slate-500 font-bold">
              {isRtl ? 'مستخلص التدخل التنموي وحماية الحريات' : 'Human rights core and developmental allocation'}
            </p>
          </div>
        </div>

        {/* Volunteer KPI Card with required conditional check */}
        <div className="p-8 bg-white rounded-[32px] border border-slate-200/80 shadow-xs flex flex-col justify-between hover:scale-[1.01] transition-transform relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
              <Users size={22} />
            </div>
          </div>
          <div className="mt-6 space-y-1.5">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
              {isRtl ? 'مؤشر قوة المتطوعين' : 'Volunteer Strength'}
            </h3>
            
            {isVolunteersEmpty ? (
              <p className="text-4xl font-black text-slate-300 font-mono">--</p>
            ) : (
              <p className="text-4xl font-black text-slate-900 font-mono">
                {stats?.totalVolunteers || 0}
              </p>
            )}

            {/* If empty, show "No Data Currently" / "لا توجد بيانات حالياً" */}
            {isVolunteersEmpty ? (
              <div className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-1.5 rounded-xl border border-red-100 text-xs font-black">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                <span>{isRtl ? 'لا توجد بيانات حالياً' : 'No data currently'}</span>
              </div>
            ) : (
              <p className="text-[10px] text-slate-500 font-bold">
                {isRtl ? `${stats?.totalHours || 0} ساعة مساهمة ميدانية فاعلة` : `${stats?.totalHours || 0} registered active volunteer hours`}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 3. Interactive Charts Section via Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart A: Yearly Growth and Beneficiary Outreach */}
        <div className="bg-white p-6 md:p-8 rounded-[36px] border border-slate-200 shadow-xs space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-950 flex items-center gap-2">
              <LineChartIcon size={18} className="text-blue-500" />
              {isRtl ? 'منحنى نمو الوصول وأعداد المستفيدين' : 'Outreach Progression & Growth'}
            </h3>
            <p className="text-xs text-slate-500">
              {isRtl ? 'تطور نطاق التغطية والمستفيدين السنويين بحسب التدخلات' : 'Year-on-year dynamic growth of direct project outreach'}
            </p>
          </div>
          <div className="h-80 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={defaultYearlyGrowth}>
                <defs>
                  <linearGradient id="colorBen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }} />
                <Area type="monotone" dataKey="beneficiaries" name={isRtl ? 'الوصول والمستفيدين' : 'Beneficiaries'} stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorBen)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart B: Sector Distribution Bar Chart */}
        <div className="bg-white p-6 md:p-8 rounded-[36px] border border-slate-200 shadow-xs space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-950 flex items-center gap-2">
              <BarChart4 size={18} className="text-emerald-500" />
              {isRtl ? 'توزيع المشاريع الاستراتيجية حسب القطاع' : 'Projects Share by Sector'}
            </h3>
            <p className="text-xs text-slate-500">
              {isRtl ? 'مخطط بياني يظهر كثافة تشتت المشاريع على قطاع الإقرار والحريات والتدريب' : 'Total operational programs weighted by specialized segment content'}
            </p>
          </div>
          <div className="h-80 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={defaultSectorDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={120} tick={{ fill: '#0f172a', fontSize: 10, fontWeight: '700' }} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }} />
                <Bar dataKey="value" name={isRtl ? 'عدد المشاريع' : 'Projects Count'} fill="#10b981" radius={[0, 12, 12, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. PMIS Key Performance Indicators Map Drawer */}
      <div className="bg-white p-6 md:p-8 rounded-[36px] border border-slate-200 shadow-xs space-y-6">
         <AcademyPerformanceChart />
      </div>
      
      {/* 4. PMIS Key Performance Indicators Map Drawer */}
      <div className="bg-white p-6 md:p-8 rounded-[36px] border border-slate-200 shadow-xs space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-950 mb-1">
            {isRtl ? 'مؤشرات الأداء المعتمدة للمانحين (KPIs)' : 'Current Assigned Project KPIs'}
          </h2>
          <p className="text-xs text-slate-500">
            {isRtl
              ? 'تسهل هذه اللوحة تداول وإدارة المؤشرات التشغيلية والنسب المطلوبة لتحقيق حوكمة سليمة مع حذف أو إضافة المؤشرات حياً.'
              : 'Add, review, and delete structural indicators tied to key regional operations.'}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right border-collapse">
            <thead>
              <tr className="bg-slate-50/70 text-xs text-slate-500 uppercase font-black border-b border-slate-200 text-right">
                <th className="px-6 py-4">{isRtl ? 'مؤشر الأداء' : 'KPI description'}</th>
                <th className="px-6 py-4">{isRtl ? 'المشروع المرتبط' : 'Linked Project'}</th>
                <th className="px-6 py-4 text-center">{isRtl ? 'المستهدف العادل' : 'Target'}</th>
                <th className="px-6 py-4 text-center">{isRtl ? 'المحقق' : 'Current'}</th>
                <th className="px-6 py-4 text-center">{isRtl ? 'المقدار الإضافي' : 'Unit'}</th>
                <th className="px-6 py-4">{isRtl ? 'معدل الإنجاز' : 'Implementation rate'}</th>
                <th className="px-6 py-4 text-center">{isRtl ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {indicators.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400">
                    {isRtl ? 'لا توجد مؤشرات في الوقت الحالي.' : 'No performance indicators setup yet.'}
                  </td>
                </tr>
              ) : (
                indicators.map((kpi, idx) => {
                  const progress = Math.round((kpi.current_value / (kpi.target_value || 1)) * 100);
                  const titleJson = typeof kpi.project_title === 'string' ? kpi.project_title : '';
                  let resolvedTitle = '';
                  try {
                    const parsed = JSON.parse(titleJson);
                    resolvedTitle = isRtl ? parsed.ar || parsed.en : parsed.en || parsed.ar;
                  } catch (e) {
                    resolvedTitle = isRtl ? 'مشاريع حيوية عامة' : 'Global Program';
                  }

                  return (
                    <tr key={kpi.id || idx} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-6 py-5 font-bold text-slate-900 border-r border-slate-50">{kpi.name}</td>
                      <td className="px-6 py-5 text-slate-500 max-w-xs truncate">{resolvedTitle}</td>
                      <td className="px-6 py-5 font-mono text-center text-slate-900">{kpi.target_value}</td>
                      <td className="px-6 py-5 font-mono text-center text-blue-600 font-bold">{kpi.current_value}</td>
                      <td className="px-6 py-5 text-center text-slate-400 text-xs">{kpi.unit}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-28 h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5">
                            <div className={`h-full rounded-full transition-all duration-500 ${progress >= 100 ? 'bg-emerald-500' : progress > 50 ? 'bg-blue-600' : 'bg-amber-500'}`} style={{ width: `${Math.min(100, progress)}%` }} />
                          </div>
                          <span className="text-xs font-black text-slate-800">{progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <button
                          onClick={() => kpi.id && handleDeleteKpi(kpi.id)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                          title={isRtl ? 'حذف من الداتا' : 'Delete from DB'}
                        >
                          <Trash2 size={16} />
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

      {/* 5. Create Indicator Dialog Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[32px] w-full max-w-lg p-8 border border-slate-200 shadow-2xl relative"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-slate-900">
                {isRtl ? 'إدراج مؤشر أداء (KPI)' : 'Create New Performance KPI'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-10 h-10 hover:bg-slate-50 flex items-center justify-center rounded-full text-slate-400 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddKpi} className="space-y-5 text-right">
              {/* Target Project Selection */}
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1.5">
                  {isRtl ? 'المشروع ذو الصلة' : 'Select Project'}
                </label>
                <select
                  value={newKpi.project_id}
                  onChange={(e) => setNewKpi(prev => ({ ...prev, project_id: e.target.value }))}
                  className="w-full text-xs font-black bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 outline-none"
                  required
                >
                  <option value="">{isRtl ? '-- حدد مشروع لتغذيته --' : '-- Choose Project --'}</option>
                  {projects.map((proj) => {
                    let resolvedTitle = '';
                    try {
                      const titleObj = typeof proj.title === 'string' ? JSON.parse(proj.title) : proj.title;
                      resolvedTitle = isRtl ? titleObj.ar : titleObj.en;
                    } catch (e) {
                      resolvedTitle = proj.title || 'Other';
                    }
                    return (
                      <option key={proj.id} value={proj.id}>
                        {resolvedTitle}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Indicator Name */}
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1.5">
                  {isRtl ? 'العنوان التوضيحي للمؤشر' : 'Indicator Headline'}
                </label>
                <input
                  type="text"
                  placeholder={isRtl ? 'مثال: عدد الصحفيين الحاصلين على الحماية القانونية' : 'e.g., Number of reporters secured'}
                  value={newKpi.name}
                  onChange={(e) => setNewKpi(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full text-xs font-medium border border-slate-200 rounded-2xl px-4 py-3 bg-slate-50 outline-none"
                  required
                />
              </div>

              {/* Targets, value, and Unit */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-1.5">
                    {isRtl ? 'المقدار المستهدف' : 'Target Value'}
                  </label>
                  <input
                    type="number"
                    value={newKpi.target_value}
                    onChange={(e) => setNewKpi(prev => ({ ...prev, target_value: parseInt(e.target.value) || 0 }))}
                    className="w-full text-xs font-mono font-bold border border-slate-200 rounded-2xl px-4 py-3 bg-slate-50 outline-none text-center"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-1.5">
                    {isRtl ? 'المحقق حالياً' : 'Current value'}
                  </label>
                  <input
                    type="number"
                    value={newKpi.current_value}
                    onChange={(e) => setNewKpi(prev => ({ ...prev, current_value: parseInt(e.target.value) || 0 }))}
                    className="w-full text-xs font-mono font-bold border border-slate-200 rounded-2xl px-4 py-3 bg-slate-50 outline-none text-center"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-1.5">
                    {isRtl ? 'وحدة الاستحقاق' : 'Unit'}
                  </label>
                  <input
                    type="text"
                    placeholder={isRtl ? 'صحفي / ورشة' : 'Unit'}
                    value={newKpi.unit}
                    onChange={(e) => setNewKpi(prev => ({ ...prev, unit: e.target.value }))}
                    className="w-full text-xs font-medium border border-slate-200 rounded-2xl px-4 py-3 bg-slate-50 outline-none text-center"
                    required
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 font-bold rounded-2xl text-xs transition-colors"
                >
                  {isRtl ? 'إلغاء الأمر' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-slate-900 hover:bg-black text-white font-bold rounded-2xl text-xs transition-colors"
                >
                  {isRtl ? 'تخزين المؤشر في Supabase' : 'Assign to Supabase'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
