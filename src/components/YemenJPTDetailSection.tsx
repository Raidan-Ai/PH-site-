import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Cpu, FileText, Layers, ShieldCheck, Sparkles } from 'lucide-react';

export const YemenJPTDetailSection: React.FC = () => {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  return (
    <section className="py-32 bg-slate-50/50 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl -translate-y-1/2" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-100/20 rounded-full blur-3xl translate-y-1/2" />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="mb-24 text-center space-y-6">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`text-4xl md:text-6xl font-black text-slate-900 tracking-tight ${isRtl ? 'leading-[1.4]' : 'leading-[1.1]'}`}
          >
            YemenJPT: <span className="text-blue-600">{isRtl ? 'بنية تقنية متطورة' : 'Advanced Technical Architecture'}</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-slate-500 max-w-2xl mx-auto text-lg leading-relaxed font-medium"
          >
            {isRtl 
              ? 'نظرة فاحصة على البنية التحتية والتقنيات التي تشغل منصة YemenJPT، المصممة خصيصاً لتلبية احتياجات الإعلام اليمني.'
              : 'A closer look at the infrastructure and technologies powering the YemenJPT platform, specifically designed to meet the needs of Yemeni media.'
            }
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: Layers, title: isRtl ? 'طبقة البيانات' : 'Data Layer', desc: isRtl ? 'تجميع ومعالجة البيانات من مصادر متعددة بذكاء.' : 'Intelligent data aggregation and processing from multiple sources.', color: 'text-blue-600', bg: 'bg-blue-50' },
            { icon: Cpu, title: isRtl ? 'محرك الذكاء الاصطناعي' : 'AI Engine', desc: isRtl ? 'نماذج لغوية متخصصة في السياق اليمني المعقد.' : 'Language models specialized in the complex Yemeni context.', color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { icon: ShieldCheck, title: isRtl ? 'الأمن والسيادة' : 'Security & Sovereignty', desc: isRtl ? 'تخزين ومعالجة البيانات محلياً لضمان الخصوصية.' : 'Local data storage and processing to ensure privacy.', color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { icon: FileText, title: isRtl ? 'الوثائق والتقارير' : 'Docs & Reports', desc: isRtl ? 'حوكمة الذكاء الاصطناعي في الإعلام الحديث.' : 'AI governance in modern media.', color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -10 }}
              className="group bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-500"
            >
              <div className={`w-16 h-16 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-lg shadow-current/10`}>
                <item.icon size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">{item.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
