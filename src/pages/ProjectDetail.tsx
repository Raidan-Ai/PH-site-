import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, Loader2, Target, TrendingUp, 
  Calendar, MapPin, Share2, Heart,
  CheckCircle2, Clock, AlertCircle
} from 'lucide-react';
import { SEO } from '../components/common/SEO';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { motion } from 'motion/react';
import { Project } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { api } from '../services/api';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { i18n, t } = useTranslation();
  const lang = i18n.language;
  const isRtl = lang === 'ar';
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;
      try {
        const response = await api.get('/api/projects');
        const data = response.data.find((p: any) => String(p.id) === String(id));
        if (data) {
          let projectIndicators: any[] = [];
          try {
            const indicatorsRes = await api.get('/api/analytics/indicators');
            const indicatorsList = indicatorsRes.data.indicators || [];
            projectIndicators = indicatorsList.filter((ind: any) => String(ind.project_id) === String(data.id));
          } catch (indErr) {
            console.error("Error loading indicators for detail:", indErr);
          }

          setProject({
            ...data,
            title: typeof data.title === 'string' ? JSON.parse(data.title) : data.title,
            shortDescription: typeof data.shortDescription === 'string' ? JSON.parse(data.shortDescription) : data.shortDescription,
            content: typeof data.content === 'string' ? JSON.parse(data.content) : data.content,
            location: typeof data.location === 'string' ? JSON.parse(data.location) : data.location,
            impact: typeof data.impact === 'string' ? JSON.parse(data.impact) : data.impact,
            indicators: projectIndicators
          } as any);
        }
      } catch (error) {
        console.error("Error fetching project:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-4">
        <Loader2 className="animate-spin text-blue-600 mx-auto" size={48} />
        <p className="text-slate-500 font-medium">{isRtl ? 'جاري تحميل المشروع...' : 'Loading project...'}</p>
      </div>
    </div>
  );

  if (!project) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-6 max-w-md px-4">
        <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">{isRtl ? 'المشروع غير موجود' : 'Project Not Found'}</h2>
        <p className="text-slate-500">{isRtl ? 'عذراً، لم نتمكن من العثور على المشروع الذي تبحث عنه.' : 'Sorry, we couldn\'t find the project you are looking for.'}</p>
        <Link to="/projects" className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all">
          <ArrowLeft size={20} className={isRtl ? 'rotate-180' : ''} />
          {isRtl ? 'العودة للمشاريع' : 'Back to Projects'}
        </Link>
      </div>
    </div>
  );

  const progress = project.fundingGoal 
    ? Math.min(100, (project.currentFunding || 0) / project.fundingGoal * 100) 
    : 0;

  const statusConfig = {
    ongoing: {
      label: isRtl ? 'قيد التنفيذ' : 'Ongoing',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      icon: Clock
    },
    completed: {
      label: isRtl ? 'مكتمل' : 'Completed',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      icon: CheckCircle2
    },
    seeking_funding: {
      label: isRtl ? 'بانتظار التمويل' : 'Seeking Funding',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      icon: Target
    }
  };

  const status = statusConfig[project.status as keyof typeof statusConfig] || statusConfig.ongoing;

  return (
    <div className="min-h-screen bg-white">
      <SEO 
        title={project.title[lang] || project.title[isRtl ? 'ar' : 'en']}
        description={project.description[lang] || project.description[isRtl ? 'ar' : 'en']}
        image={project.image}
        type="article"
      />
      {/* Hero Section - Full Width Image */}
      <section className="relative h-[60vh] md:h-[70vh] overflow-hidden">
        <img 
          src={project.image} 
          alt={project.title[lang]} 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
        
        <div className="absolute top-24 left-0 right-0 z-20 px-4 max-w-7xl mx-auto">
          <div className="bg-slate-900/50 backdrop-blur-md rounded-full px-4 py-2 border border-slate-700/50 inline-block">
            <Breadcrumbs 
              items={[
                { label: isRtl ? 'الرئيسية' : 'Home', path: '/' },
                { label: isRtl ? 'المشاريع' : 'Projects', path: '/projects' },
                { label: project.title[lang] || project.title[isRtl ? 'ar' : 'en'] }
              ]} 
              className="!text-slate-300 [&_a]:!text-slate-300 hover:[&_a]:!text-white [&_span.font-medium]:!text-slate-100" 
            />
          </div>
        </div>

        <div className="absolute inset-0 flex items-end">
          <div className="max-w-7xl mx-auto w-full px-4 pb-16 md:pb-24 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap gap-4"
            >
              <span className={cn(
                "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 backdrop-blur-md border border-white/10",
                status.bg.replace('bg-', 'bg-').replace('50', '900/80'),
                status.color.replace('text-', 'text-')
              )}>
                <status.icon size={14} />
                {status.label}
              </span>
              <span className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <Calendar size={14} />
                {new Date(project.createdAt).toLocaleDateString(isRtl ? 'ar-YE' : 'en-US', { month: 'long', year: 'numeric' })}
              </span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-7xl font-black text-white leading-tight max-w-4xl"
            >
              {project.title[lang]}
            </motion.h1>
          </div>
        </div>

        {/* Back Button - Floating */}
        <Link 
          to="/projects" 
          className="absolute top-8 left-8 z-20 w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center text-white hover:bg-white hover:text-slate-900 transition-all"
        >
          <ArrowLeft size={24} className={isRtl ? 'rotate-180' : ''} />
        </Link>
      </section>

      {/* Content Section */}
      <section className="max-w-7xl mx-auto px-4 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            <div className="prose prose-slate prose-lg max-w-none">
              <h2 className="text-3xl font-black text-slate-900 mb-8">{isRtl ? 'عن المشروع' : 'About the Project'}</h2>
              <div className="text-slate-600 leading-relaxed whitespace-pre-wrap text-lg">
                {project.description[lang]}
              </div>
            </div>

            {/* Project Goals/Details - Visual Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-12 border-t border-slate-100">
              <div className="p-8 bg-slate-50 rounded-[32px] space-y-4">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                  <Target size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">{isRtl ? 'هدف المشروع' : 'Project Goal'}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {isRtl 
                    ? 'يهدف هذا المشروع إلى تعزيز قدرات الصحفيين اليمنيين في مجالات الصحافة الاستقصائية والتحقق من المعلومات.' 
                    : 'This project aims to enhance the capabilities of Yemeni journalists in investigative journalism and fact-checking.'}
                </p>
              </div>
              <div className="p-8 bg-slate-50 rounded-[32px] space-y-4">
                <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                  <TrendingUp size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">{isRtl ? 'الأثر المتوقع' : 'Expected Impact'}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {isRtl 
                    ? 'تحسين جودة المحتوى الإعلامي في اليمن وزيادة الوعي بالقضايا الإنسانية والحقوقية.' 
                    : 'Improving the quality of media content in Yemen and increasing awareness of humanitarian and human rights issues.'}
                </p>
              </div>
            </div>

            {project.indicators && project.indicators.length > 0 && (
              <div className="pt-12 border-t border-slate-100 space-y-6">
                <h3 className="text-2xl font-black text-slate-900">{isRtl ? 'مؤشرات الأثر والأداء الحية (KPIs)' : 'Live Impact & KPI Indicators'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {project.indicators.map((ind: any, i: number) => {
                    const prog = Math.min(100, Math.round((ind.current_value / (ind.target_value || 1)) * 100));
                    return (
                      <div key={i} className="p-6 bg-slate-50 rounded-[24px] border border-slate-100 flex flex-col justify-between space-y-4">
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block">{isRtl ? 'مؤشر أداء معتمد' : 'Verified KPI'}</span>
                          <h4 className="text-base font-bold text-slate-900 leading-snug">{ind.name}</h4>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-end text-xs font-bold text-slate-700">
                            <span>{isRtl ? 'نسبة الإنجاز المحققة' : 'Implementation rate'}</span>
                            <span className="font-mono text-sm text-slate-900">{ind.current_value} / {ind.target_value} {ind.unit} ({prog}%)</span>
                          </div>
                          <div className="h-2.5 bg-slate-200/60 rounded-full overflow-hidden p-0.5">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${prog}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Funding & Actions */}
          <div className="space-y-8">
            {/* Funding Card */}
            {project.fundingGoal > 0 && (
              <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-2xl shadow-slate-200/50 space-y-8 sticky top-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{isRtl ? 'التمويل الحالي' : 'Current Funding'}</span>
                      <span className="text-4xl font-black text-slate-900">${(project.currentFunding || 0).toLocaleString()}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{isRtl ? 'الهدف' : 'Goal'}</span>
                      <span className="text-lg font-bold text-slate-500">${project.fundingGoal.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden p-1">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1.5, ease: "circOut" }}
                        className="h-full bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.5)]"
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-black text-blue-600 uppercase tracking-widest">
                      <span>{Math.round(progress)}% {isRtl ? 'مكتمل' : 'Completed'}</span>
                      <span>{isRtl ? 'باقي' : 'Remaining'}: ${(project.fundingGoal - (project.currentFunding || 0)).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Link to="/contact" className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-3">
                    <Heart size={20} />
                    {isRtl ? 'تواصل للمساهمة' : 'Contact to Support'}
                  </Link>
                  <button className="w-full py-5 bg-slate-50 text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-3">
                    <Share2 size={20} />
                    {isRtl ? 'مشاركة المشروع' : 'Share Project'}
                  </button>
                </div>

                <div className="pt-6 border-t border-slate-100 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{isRtl ? 'الموقع' : 'Location'}</span>
                    <span className="text-sm font-bold text-slate-900">{isRtl ? 'اليمن - جميع المحافظات' : 'Yemen - All Governorates'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Secondary Info */}
            {project.fundingGoal === 0 && (
              <div className="bg-slate-900 p-8 rounded-[40px] text-white space-y-6 sticky top-8">
                <h3 className="text-xl font-bold">{isRtl ? 'حالة المشروع' : 'Project Status'}</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", status.bg, status.color)}>
                      <status.icon size={20} />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{isRtl ? 'الحالة الحالية' : 'Current Status'}</span>
                      <span className="text-sm font-bold">{status.label}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{isRtl ? 'تاريخ البدء' : 'Start Date'}</span>
                      <span className="text-sm font-bold">{new Date(project.createdAt).toLocaleDateString(isRtl ? 'ar-YE' : 'en-US')}</span>
                    </div>
                  </div>
                </div>
                <button className="w-full py-5 bg-white text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-400 hover:text-white transition-all">
                  {isRtl ? 'تواصل معنا للمزيد' : 'Contact Us for More'}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
