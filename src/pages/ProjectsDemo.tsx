import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ProjectGrid } from '../components/projects/ProjectGrid';
import { YemenJPTDetailSection } from '../components/YemenJPTDetailSection';
import { motion } from 'motion/react';
import { 
  History, CheckCircle, Database, 
  Video, Gavel, GraduationCap,
  ArrowRight, Sparkles, LayoutGrid, Monitor, Smartphone, Tablet
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useResponsiveLayout } from '../components/ResponsiveLayoutWrapper';
import { api } from '../services/api';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function ProjectsDemo() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { width, tier, isMobile, isTablet } = useResponsiveLayout();

  const [featuredProjects, setFeaturedProjects] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await api.get('/api/projects');
        const data = response.data || [];
        if (data.length > 0) {
          const featured = data.filter((p: any) => p.isFeatured === 1 || p.isFeatured === true);
          const toUse = featured.length > 0 ? featured : data;
          
          const mapped = toUse.slice(0, 6).map((p: any) => {
            let titleObj = p.title;
            let descObj = p.description;
            try {
              if (typeof titleObj === 'string') titleObj = JSON.parse(titleObj);
            } catch (e) {}
            try {
              if (typeof descObj === 'string') descObj = JSON.parse(descObj);
            } catch (e) {}

            return {
              title: isRtl ? titleObj?.ar || titleObj?.en || p.title : titleObj?.en || titleObj?.ar || p.title,
              desc: isRtl ? descObj?.ar || descObj?.en || p.description : descObj?.en || descObj?.ar || p.description,
              icon: p.category === 'Heritage' ? History : 
                    p.category === 'Training' ? GraduationCap :
                    p.category === 'Protection' ? CheckCircle : 
                    p.category === 'Digital' ? Database : Sparkles,
              color: 'text-blue-600',
              bg: 'bg-blue-50',
              id: p.id
            };
          });
          setFeaturedProjects(mapped);
        } else {
          setFeaturedProjects([]);
        }
      } catch (err) {
        setFeaturedProjects([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [isRtl]);

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Hero Section - Immersive */}
      <section className="relative min-h-[70vh] flex items-center bg-slate-900 pt-20">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-600/10 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(37,99,235,0.15),transparent_70%)]" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center space-y-10">
          <div className="flex flex-wrap justify-center gap-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`inline-flex items-center gap-3 px-6 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-blue-400 text-xs font-black ${isRtl ? 'normal-case tracking-normal' : 'uppercase tracking-[0.3em]'}`}
            >
              <Sparkles size={14} className="animate-pulse" />
              {isRtl ? 'مشاريع بيت الصحافة' : 'Press House Projects'}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-950/60 border border-slate-800 text-[11px] font-mono text-emerald-400"
            >
              {isMobile ? <Smartphone size={12} /> : isTablet ? <Tablet size={12} /> : <Monitor size={12} />}
              <span>{width}px</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="uppercase text-slate-400 font-bold tracking-widest">{tier}</span>
            </motion.div>
          </div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`text-5xl md:text-8xl font-black text-white max-w-5xl mx-auto tracking-tight ${isRtl ? 'leading-[1.4]' : 'leading-[1.1]'}`}
          >
            {isRtl 
              ? 'نعمل معاً من أجل إعلام حر ومستقل' 
              : 'Working together for a free and independent media'}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
          >
            {isRtl 
              ? 'مشاريعنا تهدف إلى تعزيز حرية الصحافة، حماية الصحفيين، ومكافحة التضليل الإعلامي في اليمن.' 
              : 'Our projects aim to promote press freedom, protect journalists, and combat media misinformation in Yemen.'}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-6"
          >
            <Link to="/contact" className="px-12 py-5 rounded-2xl bg-blue-600 text-white font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all shadow-2xl shadow-blue-600/20 flex items-center justify-center">
              {isRtl ? 'ساهم معنا' : 'Contribute With Us'}
            </Link>
            <button className="px-12 py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-sm uppercase tracking-widest hover:bg-white/10 transition-all backdrop-blur-sm">
              {isRtl ? 'التقارير السنوية' : 'Annual Reports'}
            </button>
          </motion.div>
        </div>
      </section>

      {/* Featured Projects - Modern Grid */}
      <section className="py-32 bg-slate-50 relative">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-slate-900 to-transparent" />
        
        <div className="max-w-7xl mx-auto px-4 space-y-24 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-black text-slate-900">{isRtl ? 'أبرز مشاريعنا' : 'Featured Projects'}</h2>
            </div>
            <p className="text-slate-500 max-w-md font-medium">
              {isRtl ? 'مبادرات مستمرة لإحداث تغيير حقيقي في المشهد الإعلامي اليمني.' : 'Ongoing initiatives to make a real difference in the Yemeni media landscape.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProjects.map((p, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -10 }}
                className="bg-white p-10 rounded-[48px] shadow-sm border border-slate-100 hover:shadow-2xl transition-all duration-500 group relative overflow-hidden"
              >
                <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-8 transition-transform group-hover:scale-110 group-hover:rotate-6", p.bg, p.color)}>
                  <p.icon size={32} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-4 group-hover:text-blue-600 transition-colors leading-tight">{p.title}</h3>
                <p className="text-slate-500 leading-relaxed text-sm">{p.desc}</p>
                
                <div className="mt-8 pt-8 border-t border-slate-50 flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link to={`/projects/${p.id || p.title}`} className="flex items-center gap-2 w-full h-full">
                    {isRtl ? 'اكتشف المزيد' : 'Explore More'}
                    <ArrowRight size={14} className={isRtl ? 'rotate-180' : ''} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Projects Grid */}
      <section className="py-32 max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-4 mb-16">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <LayoutGrid size={24} />
          </div>
          <h2 className="text-4xl font-black text-slate-900">{isRtl ? 'دليل المشاريع' : 'Projects Directory'}</h2>
        </div>
        <ProjectGrid />
      </section>

      {/* YemenJPT Detail Section */}
      <YemenJPTDetailSection />

      {/* Call to Action - Immersive */}
      <section className="py-32 px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-7xl mx-auto bg-slate-900 rounded-[64px] p-16 md:p-32 text-center text-white relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=1920')] opacity-10 grayscale mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20" />
          
          <div className="relative z-10 space-y-10">
            <h2 className="text-4xl md:text-6xl font-black leading-tight max-w-4xl mx-auto">
              {isRtl ? 'هل تريد المساهمة بطريقة أخرى؟' : 'Want to contribute in another way?'}
            </h2>
            <p className="text-slate-400 text-xl leading-relaxed max-w-2xl mx-auto">
              {isRtl 
                ? 'تواصل معنا لمناقشة فرص الشراكة والتعاون المؤسسي ودعم حرية الإعلام في اليمن' 
                : 'Contact us to discuss partnership opportunities and institutional cooperation to support media freedom in Yemen'}
            </p>
            <div className="flex justify-center">
              <button className="px-16 py-6 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all shadow-2xl shadow-blue-900/50">
                {isRtl ? 'تواصل معنا' : 'Contact Us'}
              </button>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
