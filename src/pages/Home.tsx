import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { 
  ArrowRight, Newspaper, ShieldAlert, 
  GraduationCap, Users, FileText, 
  Play, CheckCircle2, Heart,
  Sparkles, Zap, 
  MousePointer2,
  ShieldCheck, Search, Database,
  Target, Award
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { HeroSlider } from '../components/home/HeroSlider';
import YemenMap from '../components/YemenMap';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend, PieChart, Pie } from 'recharts';
import { SocialReelsSection } from '../components/SocialReelsSection';

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Swiper for news slider
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-950 text-white p-3.5 rounded-2xl border border-slate-800 shadow-2xl text-xs font-semibold space-y-1.5 text-right">
        <p className="font-bold text-slate-400">{label}</p>
        {payload.map((pld: any) => (
          <p key={pld.name} className="flex items-center gap-2 justify-start">
            <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: pld.color || pld.fill }} />
            <span className="text-slate-300">{pld.name}:</span>
            <span className="font-extrabold text-white">{Number(pld.value).toLocaleString()}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Home() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [errorSubmit, setErrorSubmit] = React.useState('');
  const [featuredProjects, setFeaturedProjects] = React.useState<any[]>([]);
  const [projectsLoading, setProjectsLoading] = React.useState(true);
  const [latestNews, setLatestNews] = React.useState<any[]>([]);
  const [pageContent, setPageContent] = React.useState<any[]>([]);
  const [comprehensiveStats, setComprehensiveStats] = React.useState<any>(null);
  const [liveIndicators, setLiveIndicators] = React.useState<any[]>([]);
  const [violations, setViolations] = React.useState<any[]>([]);
  const [selectedGovernorate, setSelectedGovernorate] = React.useState<string | null>(null);
  const [violationsLoading, setViolationsLoading] = React.useState(true);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);

  const statsByGov = React.useMemo(() => {
    return violations.reduce((acc: any, curr: any) => {
      if (curr.governorate) {
        acc[curr.governorate] = (acc[curr.governorate] || 0) + 1;
      }
      return acc;
    }, {});
  }, [violations]);

  const fetchViolations = React.useCallback(async (silent = false) => {
    if (!silent) setIsSyncing(true);
    try {
      const response = await fetch('/api/violations');
      if (response.ok) {
        const rawData = await response.json();
        let verifiedData = rawData.filter((v: any) => v.status === 'verified');
        setViolations(verifiedData);
      } else {
        setViolations([]);
      }
      setLastUpdated(new Date());
    } catch (err: any) {
      console.warn("Could not fetch latest live violations:", err?.message || err);
      setViolations([]);
      setLastUpdated(new Date());
    } finally {
      setViolationsLoading(false);
      setIsSyncing(false);
    }
  }, [isRtl]);

  React.useEffect(() => {
    const fetchHomeContent = async () => {
      try {
        const response = await fetch('/api/page-content/home');
        if (response.ok) {
          const data = await response.json();
          setPageContent(data.map((s: any) => ({
            ...s,
            content: typeof s.content === 'string' ? JSON.parse(s.content) : s.content
          })));
        }
      } catch (err) {
        console.error("Error fetching home content:", err);
      }
    };
    fetchHomeContent();

    const fetchComprehensive = async () => {
      try {
        const response = await fetch('/api/analytics/comprehensive');
        if (response.ok) {
          const data = await response.json();
          setComprehensiveStats(data);
        }
      } catch (err) {
        console.error("Error fetching comprehensive stats:", err);
      }
    };
    fetchComprehensive();

    const fetchLiveIndicators = async () => {
      try {
        const response = await fetch('/api/analytics/indicators');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setLiveIndicators(data.indicators || []);
          }
        }
      } catch (err) {
        console.error("Error fetching live indicators:", err);
      }
    };
    fetchLiveIndicators();

    fetchViolations();
    // Poll every 10 seconds for real-time live updates
    const intervalId = setInterval(() => {
      fetchViolations(true);
    }, 10000);

    return () => clearInterval(intervalId);
  }, [fetchViolations]);

  const getSection = (name: string) => pageContent.find(s => s.section_name === name)?.content;

  const impactData = getSection('impact_stats') || {
    stats: [
      { type: 'system', metricId: 'total_violations', ar: '1,240+', en: '1,240+', labelAr: 'انتهاك موثق', labelEn: 'Violations Documented', descAr: 'رصد دقيق ومستمر للانتهاكات', descEn: 'Accurate and continuous monitoring' },
      { type: 'system', metricId: 'total_beneficiaries', ar: '450+', en: '450+', labelAr: 'صحفي مستفيد', labelEn: 'Journalists Supported', descAr: 'دعم قانوني ونفسي ومهني', descEn: 'Legal, psychological and professional support' },
      { type: 'system', metricId: 'total_courses', ar: '85+', en: '85+', labelAr: 'دورة تدريبية', labelEn: 'Training Courses', descAr: 'بناء قدرات الكوادر الإعلامية', descEn: 'Capacity building for media cadres' },
      { type: 'system', metricId: 'total_volunteers', ar: '0', en: '0', labelAr: 'المتطوعين المسجلين', labelEn: 'Registered Volunteers', descAr: 'المتطوعون والمناصرون المسجلون', descEn: 'Registered volunteers and advocates' }
    ]
  };

  const getLiveMetricValue = React.useCallback((metricId: string) => {
    if (!comprehensiveStats || !comprehensiveStats.stats) return 0;
    const statsObj = comprehensiveStats.stats;
    switch (metricId) {
      case 'total_projects': return statsObj.totalProjects || 0;
      case 'total_beneficiaries': return statsObj.totalBeneficiaries || 0;
      case 'total_courses': return statsObj.totalCourses || 0;
      case 'total_violations': return statsObj.totalViolations || 0;
      case 'total_reports': return statsObj.totalReports || 0;
      case 'total_volunteers': return statsObj.totalVolunteers || 0;
      default: return 0;
    }
  }, [comprehensiveStats]);

  const statsToRender = React.useMemo(() => {
    const rawStats = impactData.stats || [];
    return rawStats.map((item: any) => {
      const val = getLiveMetricValue(item.metricId);
      const numVal = Number(val) || 0;
      let valueStr = `${numVal.toLocaleString()}`;
      if (numVal > 0) {
        valueStr += '+';
      }
      const hasNoData = numVal === 0;

      return {
        ...item,
        renderedValue: valueStr,
        hasNoData
      };
    });
  }, [impactData, getLiveMetricValue]);

  const programsIntro = getSection('programs_intro') || {
    title: { ar: 'برامجنا الرئيسية لتمكين الإعلام', en: 'Our Main Programs to Empower Media' },
    text: { ar: 'نقدم حزمة متكاملة من الخدمات التي تضمن سلامة الصحفي واستمرارية عمله المهني بحرية واستقلالية.', en: 'We provide an integrated package of services that ensure the safety of the journalist and the continuity of their professional work freely and independently.' }
  };

  React.useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects');
        if (response.ok) {
          const data = await response.json();
          // Filter featured or just take latest 6
          const featured = data.filter((p: any) => p.isFeatured === 1 || p.isFeatured === true);
          if (featured.length > 0) {
            setFeaturedProjects(featured.slice(0, 6));
          } else {
            setFeaturedProjects(data.slice(0, 6));
          }
        }
      } catch (err) {
        console.error("Error fetching projects for home:", err);
      } finally {
        setProjectsLoading(false);
      }
    };
    fetchProjects();

    const fetchNews = async () => {
      try {
        const response = await fetch('/api/articles');
        if (response.ok) {
          const data = await response.json();
          const mapped = data.slice(0, 4).map((n: any) => {
            const title = typeof n.title === 'string' ? JSON.parse(n.title) : n.title;
            return {
              id: n.id,
              title: isRtl ? title?.ar || title?.en : title?.en || title?.ar,
              date: new Date(n.published_at || n.created_at).toISOString().slice(0, 10),
              category: isRtl ? 'خبر' : 'News',
              image: n.featured_image || n.cover_image || 'https://picsum.photos/seed/news/800/600',
              icon: Newspaper
            };
          });
          setLatestNews(mapped);
        } else {
          setLatestNews([]);
        }
      } catch (err) {
        setLatestNews([]);
      }
    };
    fetchNews();
  }, [isRtl]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setErrorSubmit('');
    setSuccess(false);
    try {
      const response = await fetch('/api/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'Home Grid' })
      });
      if (response.ok) {
        setSuccess(true);
        setEmail('');
      } else {
        const errorData = await response.json().catch(() => ({}));
        setErrorSubmit(errorData.message || (isRtl ? 'هذا البريد مسجل مسبقاً أو غير صالح.' : 'This email is already registered or invalid.'));
      }
    } catch (err) {
      setErrorSubmit(isRtl ? 'فشل الاتصال بالخادم.' : 'Connection to server failed.');
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { 
      label: isRtl ? 'انتهاك موثق' : 'Violations Documented', 
      value: '1,240+', 
      icon: ShieldAlert, 
      color: 'text-red-600', 
      bg: 'bg-red-50',
      desc: isRtl ? 'رصد دقيق ومستمر للانتهاكات' : 'Accurate and continuous monitoring'
    },
    { 
      label: isRtl ? 'صحفي مستفيد' : 'Journalists Supported', 
      value: '450+', 
      icon: Users, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50',
      desc: isRtl ? 'دعم قانوني ونفسي ومهني' : 'Legal, psychological and professional support'
    },
    { 
      label: isRtl ? 'دورة تدريبية' : 'Training Courses', 
      value: '85+', 
      icon: GraduationCap, 
      color: 'text-amber-600', 
      bg: 'bg-amber-50',
      desc: isRtl ? 'بناء قدرات الكوادر الإعلامية' : 'Capacity building for media cadres'
    },
    { 
      label: isRtl ? 'تقرير حقوقي' : 'Rights Reports', 
      value: '120+', 
      icon: FileText, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50',
      desc: isRtl ? 'توثيق للعدالة والمساءلة' : 'Documentation for justice and accountability'
    },
  ];

  const programs = [
    { 
      title: isRtl ? 'برنامج الحماية' : 'Protection Program', 
      desc: isRtl ? 'توفير الدعم القانوني والجسدي للصحفيين المعرضين للخطر.' : 'Providing legal and physical support for journalists at risk.',
      icon: ShieldCheck,
      color: 'bg-red-500'
    },
    { 
      title: isRtl ? 'أكاديمية الإعلام' : 'Media Academy', 
      desc: isRtl ? 'تدريب مهني متقدم في الصحافة الاستقصائية والسلامة الرقمية.' : 'Advanced professional training in investigative journalism and digital safety.',
      icon: GraduationCap,
      color: 'bg-blue-500'
    },
    { 
      title: isRtl ? 'مرصد الانتهاكات' : 'Violations Observatory', 
      desc: isRtl ? 'توثيق ورصد كافة الانتهاكات ضد الحريات الإعلامية في اليمن.' : 'Documenting and monitoring all violations against media freedoms in Yemen.',
      icon: Search,
      color: 'bg-emerald-500'
    }
  ];

  return (
    <div className="space-y-16 md:space-y-32 pb-20 md:pb-32 overflow-hidden bg-slate-50/50">
      {/* Hero Slider Section */}
      <HeroSlider />

      {/* Bento Stats Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 md:mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-4xl md:text-6xl font-black text-slate-900 tracking-tight"
          >
            {isRtl ? 'إنجازات نفخر بها' : 'Achievements We Are Proud Of'}
          </motion.h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {statsToRender.map((stat: any, idx: number) => {
            const icons = [ShieldAlert, Users, GraduationCap, FileText];
            const colors = ['text-red-600', 'text-blue-600', 'text-amber-600', 'text-emerald-600'];
            const bgs = ['bg-red-50', 'bg-blue-50', 'bg-amber-50', 'bg-emerald-50'];
            const Icon = icons[idx % icons.length];
            const color = colors[idx % colors.length];
            const bg = bgs[idx % bgs.length];

            return (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ y: -6, transition: { duration: 0.3 } }}
                transition={{ delay: idx * 0.1, duration: 0.6 }}
                className="relative group p-6 md:p-8 rounded-3xl md:rounded-[40px] bg-white border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-500 overflow-hidden"
              >
                <Icon size={120} className={cn("absolute -bottom-6 -right-6 opacity-[0.03] transition-transform group-hover:scale-110 duration-700", color)} />
                
                <div className={cn("w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mb-6 md:mb-8 transition-all duration-500 group-hover:rotate-6 group-hover:scale-110 shadow-lg shadow-current/10", bg, color)}>
                  <Icon size={28} />
                </div>
                
                <div className="space-y-1.5 md:space-y-2 relative z-10">
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 + 0.3 }}
                    className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter"
                  >
                    {stat.renderedValue}
                  </motion.div>
                  {stat.hasNoData && (
                    <div className="text-[10px] md:text-xs font-bold text-red-600 bg-red-50/80 px-2.5 py-1 rounded-lg border border-red-100 flex items-center gap-1 w-fit animate-pulse">
                      <span>●</span>
                      <span>{isRtl ? 'لا توجد بيانات' : 'No Data Available'}</span>
                    </div>
                  )}
                  <div className="text-xs md:text-sm font-black text-slate-900 uppercase tracking-wider">{isRtl ? stat.labelAr : stat.labelEn}</div>
                  <p className="text-[11px] md:text-xs text-slate-400 font-medium leading-relaxed">{isRtl ? stat.descAr : stat.descEn}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Visual Impact Charts Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 md:-mt-16">
        <div className="text-center mb-10 md:mb-16">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-black uppercase tracking-widest text-blue-600 mb-2"
          >
            {isRtl ? 'المقاييس والتحليلات البيانية للأثر' : 'KPI Metrics & Impact Visual Analytics'}
          </motion.p>
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight"
          >
            {isRtl ? 'لوحة قياس الأثر والتمكين الحي' : 'Live Impact & Empowerment Indicators'}
          </motion.h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Chart 1: Yearly Growth */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-6 md:p-8 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col justify-between"
          >
            <div>
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-1">
                {isRtl ? 'النمو السنوي للمستفيدين والمشاريع' : 'Annual Growth: Beneficiaries & Projects'}
              </h4>
              <p className="text-xs text-slate-400 mb-6 font-medium">
                {isRtl ? 'تطور نطاق التدخلات الإعلامية والوصول للمستفيدين' : 'Progression of our media interventions & total outreach'}
              </p>
            </div>
            <div className="h-[280px] w-full font-sans">
              {comprehensiveStats?.charts?.yearlyGrowth?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={comprehensiveStats.charts.yearlyGrowth}>
                    <defs>
                      <linearGradient id="colorBen" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="year" stroke="#94a3b8" fontSize={11} fontWeight="bold" />
                    <YAxis stroke="#94a3b8" fontSize={11} fontWeight="bold" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Area 
                      type="monotone" 
                      name={isRtl ? 'المستفيدون' : 'Beneficiaries'} 
                      dataKey="beneficiaries" 
                      stroke="#3b82f6" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorBen)" 
                    />
                    <Bar 
                      name={isRtl ? 'المشاريع' : 'Projects'} 
                      dataKey="projects" 
                      fill="#ef4444" 
                      radius={[4, 4, 0, 0]} 
                      maxBarSize={30} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400 font-bold">
                  {isRtl ? 'لا تتوفر بيانات نمو حالياً' : 'No growth statistics available yet'}
                </div>
              )}
            </div>
          </motion.div>

          {/* Chart 2: Sector Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="p-6 md:p-8 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col justify-between"
          >
            <div>
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-1">
                {isRtl ? 'توزيع المشاريع والتدخلات بحسب القطاعات' : 'Project Distribution by Sectors'}
              </h4>
              <p className="text-xs text-slate-400 mb-6 font-medium">
                {isRtl ? 'نسب تمثيل وتوزع الأنشطة والمشاريع المنفذة' : 'Share of implementation of projects across key media sectors'}
              </p>
            </div>
            <div className="h-[280px] w-full font-sans" dir="ltr">
              {comprehensiveStats?.charts?.sectorDistribution?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    layout="vertical" 
                    data={comprehensiveStats.charts.sectorDistribution}
                    margin={{ left: 10, right: 10, top: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" stroke="#64748b" fontSize={12} fontWeight="800" />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      stroke="#1e293b" 
                      fontSize={12} 
                      fontWeight="900" 
                      width={160} 
                      tickFormatter={(value) => value.length > 20 ? `${value.slice(0, 20)}...` : value}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      name={isRtl ? 'عدد المشاريع' : 'Projects Count'} 
                      dataKey="value" 
                      fill="#10b981" 
                      radius={[0, 8, 8, 0]} 
                      maxBarSize={25}
                    >
                      {comprehensiveStats.charts.sectorDistribution.map((entry: any, index: number) => {
                        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400 font-bold">
                  {isRtl ? 'لا تتوفر بيانات تصنيف حالياً' : 'No sector distribution statistics available'}
                </div>
              )}
            </div>
          </motion.div>

          {/* Chart 3: Events Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-6 md:p-8 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col justify-between"
          >
            <div>
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-1">
                {isRtl ? 'تصنيف الفعاليات وجلسات النقاش' : 'Events & Discussion Sessions Types'}
              </h4>
              <p className="text-xs text-slate-400 mb-6 font-medium">
                {isRtl ? 'توزع الأنشطة الميدانية والفعاليات المنفذة' : 'Distribution of implemented field activities and events'}
              </p>
            </div>
            <div className="h-[280px] w-full font-sans" dir="ltr">
              {comprehensiveStats?.charts?.governorates?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comprehensiveStats.charts.governorates}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" stroke="#1e293b" fontSize={12} fontWeight="900" />
                    <YAxis stroke="#64748b" fontSize={12} fontWeight="800" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      name={isRtl ? 'العدد' : 'Count'} 
                      dataKey="value" 
                      fill="#f59e0b" 
                      radius={[6, 6, 0, 0]} 
                      maxBarSize={35}
                    >
                      {comprehensiveStats.charts.governorates.map((entry: any, index: number) => {
                        const colors = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6'];
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400 font-bold">
                  {isRtl ? 'لا تتوفر بيانات فعاليات حالياً' : 'No events distribution statistics available'}
                </div>
              )}
            </div>
          </motion.div>

          {/* Chart 4: Gender Balance of Target Audience */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="p-6 md:p-8 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col justify-between"
          >
            <div>
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-1">
                {isRtl ? 'التنوع الجندري للمستهدفين' : 'Targeted Beneficiaries Gender Balance'}
              </h4>
              <p className="text-xs text-slate-400 mb-6 font-medium">
                {isRtl ? 'التوازن والشمول الجندري للمستفيدين من التدخلات' : 'Gender inclusivity metrics across targeted beneficiaries'}
              </p>
            </div>
            <div className="h-[280px] w-full flex items-center justify-center font-sans">
              {comprehensiveStats?.charts?.genderDistribution?.length > 0 ? (
                <div className="w-full h-full flex flex-col sm:flex-row items-center justify-center gap-4">
                  <div className="w-full sm:w-1/2 h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={comprehensiveStats.charts.genderDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={85}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          <Cell fill="#f43f5e" /> {/* Females */}
                          <Cell fill="#0ea5e9" /> {/* Males */}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col gap-3 shrink-0 text-xs font-bold text-slate-700">
                    {comprehensiveStats.charts.genderDistribution.map((item: any, idx: number) => (
                      <div key={item.name} className="flex items-center gap-2.5">
                        <span className="w-3.5 h-3.5 rounded-full inline-block shrink-0" style={{ backgroundColor: idx === 0 ? '#f43f5e' : '#0ea5e9' }} />
                        <span className="text-slate-500">{item.name}:</span>
                        <span className="text-slate-950 font-black">{item.value} {isRtl ? 'عضو' : 'members'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400 font-bold">
                  {isRtl ? 'لا تتوفر بيانات توازن جندري حالياً' : 'No gender balance statistics available'}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Programs Section */}
      <section className="relative py-16 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-slate-900" />
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_0%,rgba(59,130,246,0.15),transparent_50%)]" />
        <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_0%_100%,rgba(16,185,129,0.1),transparent_50%)]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-3 gap-10 md:gap-16 items-start">
            <div className="lg:col-span-1 space-y-6 md:space-y-8 lg:sticky lg:top-32">
              <h2 className="text-3xl md:text-5xl font-black text-white leading-[1.1] tracking-tight">
                {isRtl ? programsIntro.title.ar : programsIntro.title.en}
              </h2>
              <p className="text-slate-400 text-sm md:text-lg leading-relaxed">
                {isRtl ? programsIntro.text.ar : programsIntro.text.en}
              </p>
              <Link to="/about" className="group inline-flex items-center gap-4 text-white font-black uppercase tracking-widest text-[11px] md:text-sm hover:text-blue-400 transition-colors">
                <span className="relative">
                  {isRtl ? 'تعرف على المزيد' : 'Learn More'}
                  <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-blue-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                </span>
                <div className={cn("w-10 h-10 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-600 transition-all", isRtl && "rotate-180")}>
                  <ArrowRight size={18} />
                </div>
              </Link>
            </div>
            
            <div className="lg:col-span-2 grid md:grid-cols-2 gap-6 md:gap-8">
              {projectsLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-64 rounded-3xl bg-white/5 animate-pulse border border-white/10" />
                ))
              ) : featuredProjects.length > 0 ? (
                featuredProjects.map((proj, i) => {
                  const title = typeof proj.title === 'string' ? JSON.parse(proj.title) : proj.title;
                  const desc = typeof proj.description === 'string' ? JSON.parse(proj.description) : proj.description;
                  return (
                    <motion.div 
                      key={proj.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="group p-6 md:p-10 rounded-3xl md:rounded-[48px] bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/[0.08] hover:border-white/20 transition-all duration-500 flex flex-col h-full"
                    >
                      <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mb-6 md:mb-8 shadow-2xl transition-transform group-hover:scale-110 group-hover:rotate-3 text-white bg-blue-600 overflow-hidden">
                        {proj.image ? (
                          <img src={proj.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <ShieldCheck size={28} />
                        )}
                      </div>
                      <h3 className="text-xl md:text-2xl font-black text-white mb-3 md:mb-4 tracking-tight">
                        {isRtl ? title?.ar : (title?.en || title?.ar)}
                      </h3>
                      <p className="text-slate-400 leading-relaxed text-xs md:text-sm font-medium line-clamp-3">
                        {isRtl ? desc?.ar : (desc?.en || desc?.ar)}
                      </p>
                      
                      <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-white/5">
                        <Link to={`/projects/${proj.id}`} className="inline-flex items-center gap-2 text-white/40 text-[10px] font-black uppercase tracking-widest group-hover:text-blue-400 transition-colors">
                          {isRtl ? 'تفاصيل المشروع' : 'Project Details'}
                          <ArrowRight size={14} className={isRtl ? 'rotate-180' : ''} />
                        </Link>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                programs.map((prog, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="group p-6 md:p-10 rounded-3xl md:rounded-[48px] bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/[0.08] hover:border-white/20 transition-all duration-500"
                  >
                    <div className={cn("w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mb-6 md:mb-8 shadow-2xl transition-transform group-hover:scale-110 group-hover:rotate-3 text-white", prog.color)}>
                      <prog.icon size={28} />
                    </div>
                    <h3 className="text-xl md:text-2xl font-black text-white mb-3 md:mb-4 tracking-tight">{prog.title}</h3>
                    <p className="text-slate-400 leading-relaxed text-xs md:text-sm font-medium">{prog.desc}</p>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Realtime Violation Feed Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-12">
          <div className="max-w-3xl space-y-6">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 leading-[1.1] tracking-tight">
              {isRtl ? 'خارطة انتهاكات الحريات الإعلامية' : 'Media Violations Map'}
            </h2>
            <p className="text-slate-500 text-sm md:text-lg leading-relaxed">
              {isRtl 
                ? 'رصد متكامل وتوثيق حي للانتهاكات والاعتداءات على الحريات الإعلامية والصحفية في مختلف المحافظات اليمنية.' 
                : 'The Press House Observatory works around the clock to monitor and document violations against journalists and media institutions in Yemen.'}
            </p>
          </div>

          <div className="w-full h-[650px] relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="h-full"
            >
              <YemenMap
                data={statsByGov}
                violationsList={violations}
                selectedGovernorate={selectedGovernorate}
                onSelectGovernorate={setSelectedGovernorate}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Latest News Slider */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:gap-8 mb-10 md:mb-20">
          <div className="space-y-3 md:space-y-4">
            <h2 className="text-2xl md:text-6xl font-black text-slate-900 tracking-tight">
              {isRtl ? 'أخبار وتقارير' : 'News & Reports'}
            </h2>
          </div>
          <Link to="/news" className="group flex items-center gap-3 px-6 py-3.5 md:px-8 md:py-4 bg-white border-2 border-slate-100 rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95">
            {isRtl ? 'عرض كافة الأخبار' : 'View All News'}
            <ArrowRight size={18} className={cn("transition-transform group-hover:translate-x-1", isRtl && "rotate-180 group-hover:-translate-x-1")} />
          </Link>
        </div>

        <Swiper
          modules={[Autoplay, Pagination, Navigation]}
          spaceBetween={20}
          slidesPerView={1}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          navigation={true}
          breakpoints={{
            640: { slidesPerView: 1 },
            768: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
          className="pb-16"
        >
          {latestNews.map((news, idx) => (
            <SwiperSlide key={news.id}>
              <motion.article 
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.7, delay: idx * 0.1 }}
                className="group flex flex-col h-full bg-white rounded-3xl md:rounded-[48px] overflow-hidden border border-slate-100 transition-all duration-500 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)]"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img 
                    src={news.image} 
                    alt={news.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="absolute top-4 left-4 md:top-6 md:left-6 rtl:left-auto rtl:right-4 md:rtl:right-6 flex gap-2">
                    <div className="bg-white/90 backdrop-blur-md text-blue-900 text-[9px] md:text-[10px] uppercase font-black px-3.5 py-1.5 md:px-4 md:py-2 rounded-full shadow-xl flex items-center gap-1.5 md:gap-2">
                       <news.icon size={11} className="text-blue-600" />
                      {news.category}
                    </div>
                  </div>
                </div>
                
                <div className="p-6 md:p-10 flex flex-col flex-grow space-y-4 md:space-y-6">
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    {news.date}
                  </div>
                  <h3 className="text-lg md:text-2xl font-black text-slate-900 leading-[1.2] group-hover:text-blue-600 transition-colors line-clamp-3">
                    {news.title}
                  </h3>
                  <div className="pt-3 md:pt-4 mt-auto">
                    <Link to={`/news/${news.id}`} className="inline-flex items-center gap-3 text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] group/link">
                      <span className="relative">
                        {isRtl ? 'اقرأ المزيد' : 'Read More'}
                        <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-blue-600 scale-x-0 group-hover/link:scale-x-100 transition-transform origin-left" />
                      </span>
                      <div className={cn("w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center group-hover/link:bg-blue-600 group-hover/link:border-blue-600 group-hover/link:text-white transition-all", isRtl && "rotate-180")}>
                        <ArrowRight size={14} />
                      </div>
                    </Link>
                  </div>
                </div>
              </motion.article>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

      {/* Social Media Reels Section */}
      <SocialReelsSection />
    </div>
  );
}
