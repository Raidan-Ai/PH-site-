import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Hammer, Mail, Phone, Lock, ChevronRight, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MaintenancePage() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const maintenanceMsg = {
    ar: 'المنصة حالياً في وضع الصيانة لإجراء بعض التحديثات والتحسينات المجدولة. سنعود للعمل قريباً. نشكر تفهمكم.',
    en: 'The platform is currently undergoing scheduled maintenance for updates and enhancements. We will be back online shortly. Thank you for your patience.'
  };

  const contactEmail = import.meta.env.VITE_CONTACT_EMAIL || 'info@ph-ye.org';
  const contactPhone = import.meta.env.VITE_CONTACT_PHONE || '+967123456';

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between p-6 relative overflow-hidden font-sans" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Decorative background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Header */}
      <header className="w-full max-w-5xl mx-auto flex justify-between items-center z-10 py-4">
        <div className="flex items-center gap-3">
          <span className="text-xl font-black tracking-tight text-white bg-blue-600 px-3 py-1.5 rounded-xl">
            {isRtl ? 'بيت الصحافة' : 'PressHouse'}
          </span>
          <span className="text-xs font-bold text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700/50">
            {isRtl ? 'وضع الصيانة' : 'Maintenance Mode'}
          </span>
        </div>

        {/* Language Toggle */}
        <button
          onClick={() => i18n.changeLanguage(isRtl ? 'en' : 'ar')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/85 hover:bg-slate-700 text-xs font-semibold border border-slate-700 transition active:scale-95"
        >
          <Globe size={14} className="text-blue-400" />
          <span>{isRtl ? 'English' : 'العربية'}</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-2xl mx-auto flex-1 flex flex-col items-center justify-center text-center z-10 py-12">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="mb-8 p-6 rounded-[32px] bg-blue-500/10 border border-blue-500/20 text-blue-400 inline-flex items-center justify-center relative"
        >
          <div className="absolute inset-0 bg-blue-500/5 rounded-[32px] animate-pulse" />
          <Hammer size={48} className="relative z-10 animate-bounce" style={{ animationDuration: '3s' }} />
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4 leading-tight"
        >
          {isRtl ? 'المنصة قيد التحديث' : 'Platform Under Maintenance'}
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-slate-300 text-base sm:text-lg max-w-xl leading-relaxed mb-10"
        >
          {isRtl ? maintenanceMsg.ar : maintenanceMsg.en}
        </motion.p>

        {/* Stats / Estimate section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md bg-slate-800/40 p-5 rounded-3xl border border-slate-800/80 backdrop-blur-sm mb-12"
        >
          <div className="text-center sm:text-right p-3 space-y-1">
            <span className="text-xs text-slate-400 font-bold block">
              {isRtl ? 'البريد الإلكتروني' : 'Support Email'}
            </span>
            <a 
              href={`mailto:${contactEmail}`}
              className="text-sm font-black text-blue-400 hover:underline flex items-center justify-center sm:justify-start gap-1"
            >
              <Mail size={13} />
              <span dir="ltr">{contactEmail}</span>
            </a>
          </div>

          <div className="text-center sm:text-right p-3 space-y-1 border-t sm:border-t-0 sm:border-r border-slate-700/50">
            <span className="text-xs text-slate-400 font-bold block">
              {isRtl ? 'الهاتف' : 'Direct Line'}
            </span>
            <a 
              href={`tel:${contactPhone}`}
              className="text-sm font-black text-emerald-400 hover:underline flex items-center justify-center sm:justify-start gap-1"
            >
              <Phone size={13} />
              <span dir="ltr">{contactPhone}</span>
            </a>
          </div>
        </motion.div>

        {/* Admin Backdoor */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Link
            to="/admin/login"
            className="inline-flex items-center gap-2 text-xs font-black text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-800 px-4 py-2.5 rounded-2xl border border-slate-800 hover:border-slate-700 transition active:scale-95"
          >
            <Lock size={12} className="text-slate-500" />
            <span>{isRtl ? 'دخول الإدارة' : 'Admin Portal'}</span>
            <ChevronRight size={12} className={isRtl ? 'rotate-180' : ''} />
          </Link>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto text-center py-4 z-10 border-t border-slate-800/60 mt-auto">
        <p className="text-xs text-slate-500 font-medium">
          &copy; {new Date().getFullYear()} {isRtl ? 'بيت الصحافة - اليمن. جميع الحقوق محفوظة.' : 'PressHouse - Yemen. All Rights Reserved.'}
        </p>
      </footer>
    </div>
  );
}
