import React from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';

export const PageLoader = () => {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  return (
    <div className={`flex flex-col items-center justify-center min-h-[60vh] w-full ${isRtl ? 'rtl' : 'ltr'}`}>
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.5, 1, 0.5]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="w-16 h-16 mb-4 relative flex items-center justify-center"
      >
        <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent"
        ></motion.div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-slate-400 font-medium text-sm flex items-center gap-2"
      >
        <span>{isRtl ? 'جاري التحميل...' : 'Loading...'}</span>
      </motion.div>
    </div>
  );
};
