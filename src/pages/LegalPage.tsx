import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';

interface LegalPageProps {
  titleAr: string;
  titleEn: string;
  children: React.ReactNode;
}

export default function LegalPage({ titleAr, titleEn, children }: LegalPageProps) {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto px-4 py-16 bg-white"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <h1 className="text-4xl font-black text-slate-900 mb-12">
        {isRtl ? titleAr : titleEn}
      </h1>
      <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed">
        {children}
      </div>
    </motion.div>
  );
}
