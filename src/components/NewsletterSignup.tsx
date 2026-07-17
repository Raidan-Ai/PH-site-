import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, ArrowUpRight, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NewsletterSignupProps {
  source?: string;
  variant?: 'footer' | 'sidebar' | 'default';
}

export default function NewsletterSignup({ source = 'default', variant = 'default' }: NewsletterSignupProps) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorText, setErrorText] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    // Fast check client-side
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setErrorText(isRtl ? 'يرجى إدخال بريد إلكتروني صحيح.' : 'Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setErrorText('');
    setSuccess(false);

    try {
      const response = await fetch('/api/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source })
      });

      if (response.ok) {
        setSuccess(true);
        setEmail('');
      } else {
        const errJson = await response.json().catch(() => ({}));
        setErrorText(errJson.message || (isRtl ? 'هذا البريد مسجل مسبقاً أو غير صالح.' : 'This email is already registered or invalid.'));
      }
    } catch (err) {
      setErrorText(isRtl ? 'تعذر الاتصال بالخادم.' : 'Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  // Determine styles depending on the variant
  const isFooter = variant === 'footer';
  const isSidebar = variant === 'sidebar';

  return (
    <div 
      className={`relative overflow-hidden transition-all duration-300 ${
        isFooter 
          ? 'bg-transparent space-y-5 max-w-full rounded-none' 
          : isSidebar 
          ? 'bg-slate-50 border border-slate-100 p-8 space-y-6 rounded-[32px]' 
          : 'bg-white border border-slate-100 p-8 shadow-xl shadow-slate-100/50 space-y-6 rounded-[32px]'
      }`}
    >
      {/* Decorative vector shine for cards */}
      {!isFooter && (
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
      )}

      {/* Header Info */}
      <div className={`space-y-3 relative z-10 ${isFooter ? 'mb-2' : ''}`}>
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl flex items-center justify-center ${isFooter ? 'bg-white/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
            <Mail size={16} />
          </div>
          <h3 className={`text-base font-black tracking-tight ${isFooter ? 'text-white' : 'text-slate-900'}`}>
            {isRtl ? 'النشرة البريدية' : 'Newsletter'}
          </h3>
        </div>
        <p className={`text-xs leading-relaxed font-medium ${isFooter ? 'text-slate-400/80' : 'text-slate-500'}`}>
          {isRtl 
            ? 'احصل على آخر التحديثات والأخبار مباشرة.' 
            : 'Get the latest updates directly.'}
        </p>
      </div>

      {/* Status states with simple, beautiful transitions */}
      <AnimatePresence mode="wait">
        {success ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className={`rounded-2xl p-6 text-center space-y-3 relative overflow-hidden ${
              isFooter ? 'bg-white/5 border border-white/10 text-white' : 'bg-emerald-50/50 border border-emerald-100 text-emerald-950'
            }`}
          >
            <div className="absolute top-0 right-0 p-2 opacity-10">
              <Sparkles size={48} className="text-emerald-500 animate-pulse" />
            </div>
            
            <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center ${isFooter ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
              <CheckCircle2 size={20} />
            </div>
            
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider">
                {isRtl ? 'تم بنجاح!' : 'Success!'}
              </h4>
            </div>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={handleSubscribe}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3 relative z-10"
          >
            <div className="relative">
              <input 
                type="email" 
                required
                placeholder={isRtl ? "البريد الإلكتروني" : "Email address"}
                value={email}
                disabled={loading}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full text-sm rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 transition-all duration-300 ${
                  isFooter 
                    ? 'bg-white/5 border border-white/10 text-white placeholder:text-slate-600 focus:ring-blue-500/50' 
                    : 'bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:ring-blue-500/20 focus:border-blue-400'
                }`}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 group relative overflow-hidden ${
                loading ? 'opacity-80 cursor-not-allowed' : ''
              } ${
                isFooter 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-900/20' 
                  : 'bg-slate-900 hover:bg-black text-white shadow-lg shadow-slate-900/10'
              }`}
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin text-white" />
              ) : (
                <>
                  <span>{isRtl ? 'اشترك' : 'Subscribe'}</span>
                  <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </>
              )}
            </button>

            {errorText && (
              <motion.p 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[10px] text-rose-500 font-bold text-center mt-2"
              >
                {errorText}
              </motion.p>
            )}
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
