import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Cpu, Shield, Zap, BookOpen, BrainCircuit, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const YemenJPTSection: React.FC = () => {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-32">
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative rounded-[64px] overflow-hidden bg-slate-900 py-24 px-8 md:px-20"
      >
        {/* Background Effects */}
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_0%,rgba(59,130,246,0.2),transparent_50%)]" />
        <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_0%_100%,rgba(16,185,129,0.1),transparent_50%)]" />
        
        <div className="relative z-10 grid lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-10">
            <h2 className={`text-5xl md:text-6xl font-black text-white tracking-tight ${isRtl ? 'leading-[1.3]' : 'leading-[1.1]'}`}>
              YemenJPT: <span className="text-blue-400">{isRtl ? 'تمكين الكلمة بالتقنية' : 'Empowering Words with Technology'}</span>
            </h2>
            
            <p className="text-xl text-slate-400 leading-relaxed font-medium">
              {isRtl 
                ? 'هو أول منصة ذكاء اصطناعي تخصصية مصممة لدعم الصحفيين وصناع المحتوى الإخباري في اليمن. يدمج بين قوة الحوسبة السحابية وفهم السياق المحلي لتقديم تجربة صحفية ذكية وآمنة.'
                : 'The first specialized AI platform designed to support journalists and news content creators in Yemen. It integrates cloud computing power with local context understanding to provide a smart and secure journalistic experience.'}
            </p>
            
            <div className="grid sm:grid-cols-2 gap-6">
              {[
                { icon: Shield, title: isRtl ? 'تحقق دقيق' : 'Accurate Verification', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                { icon: Zap, title: isRtl ? 'صياغة احترافية' : 'Professional Drafting', color: 'text-blue-400', bg: 'bg-blue-400/10' },
                { icon: BookOpen, title: isRtl ? 'تلخيص ذكي' : 'Smart Summarization', color: 'text-amber-400', bg: 'bg-amber-400/10' },
                { icon: BrainCircuit, title: isRtl ? 'أدوات استقصاء' : 'Investigative Tools', color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
              ].map((item, i) => (
                <motion.div 
                  key={i} 
                  whileHover={{ x: isRtl ? -5 : 5 }}
                  className="flex items-center gap-4 bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-md"
                >
                  <div className={`w-12 h-12 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center shadow-lg shadow-current/5`}>
                    <item.icon size={24} />
                  </div>
                  <span className={`font-black text-xs text-white ${isRtl ? 'normal-case tracking-normal' : 'uppercase tracking-widest'}`}>{item.title}</span>
                </motion.div>
              ))}
            </div>

            <div className="pt-6">
              <Link to="/projects" className={`group inline-flex items-center gap-4 text-white font-black text-sm hover:text-blue-400 transition-colors ${isRtl ? 'normal-case tracking-normal' : 'uppercase tracking-widest'}`}>
                <span className="relative">
                  {isRtl ? 'اكتشف المنصة' : 'Discover the Platform'}
                  <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-blue-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                </span>
                <div className={`w-10 h-10 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-600 transition-all ${isRtl ? 'rotate-180' : ''}`}>
                  <ArrowRight size={18} />
                </div>
              </Link>
            </div>
          </div>
          
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-[48px] p-12 border border-white/10 shadow-2xl overflow-hidden group"
          >
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_70%)]" />
            
            <div className="relative z-10 aspect-square bg-slate-950 rounded-[32px] flex items-center justify-center border border-white/5 shadow-inner overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 10,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Cpu size={120} className="text-blue-500 drop-shadow-[0_0_30px_rgba(59,130,246,0.5)]" />
              </motion.div>
              
              {/* Animated rings */}
              <div className="absolute w-64 h-64 border border-blue-500/20 rounded-full animate-[ping_3s_linear_infinite]" />
              <div className="absolute w-80 h-80 border border-blue-500/10 rounded-full animate-[ping_4s_linear_infinite]" />
            </div>
            
            <div className="mt-12 space-y-6 relative z-10">
              <h3 className="text-3xl font-black text-white tracking-tight">{isRtl ? 'لماذا YemenJPT؟' : 'Why YemenJPT?'}</h3>
              <p className="text-slate-400 text-lg leading-relaxed font-medium">
                {isRtl 
                  ? 'يقلل الجهد الروتيني للصحفي، ليمنحه وقتاً أكبر للبحث الميداني والتحليل الإبداعي، مع الحفاظ على أعلى معايير الخصوصية المهنية والسيادة الرقمية.'
                  : 'Reduces routine effort for journalists, giving them more time for field research and creative analysis, while maintaining the highest standards of professional privacy and digital sovereignty.'}
              </p>
            </div>

            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl group-hover:bg-blue-600/20 transition-colors duration-700" />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};
