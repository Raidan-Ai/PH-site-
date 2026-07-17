import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '../services/api';

export default function ForgotPassword() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await api.post('/api/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || (isRtl ? 'فشل إرسال الطلب' : 'Failed to send request'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-[32px] shadow-xl border border-slate-100 p-8 md:p-12 space-y-8"
      >
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-blue-900 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">P</div>
          <h1 className="text-2xl font-bold text-slate-900">{isRtl ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}</h1>
          <p className="text-slate-500 text-sm">
            {isRtl ? 'أدخل بريدك الإلكتروني لتلقي رابط إعادة التعيين' : 'Enter your email to receive a reset link'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl flex items-center gap-3 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-6 rounded-2xl text-center space-y-4">
            <CheckCircle className="w-12 h-12 mx-auto text-emerald-500" />
            <p className="font-medium">
              {isRtl 
                ? 'تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني بنجاح.' 
                : 'A reset link has been sent to your email successfully.'}
            </p>
            <Link to="/login" className="inline-flex items-center gap-2 text-blue-900 font-bold hover:underline">
              <ArrowLeft size={16} />
              {isRtl ? 'العودة لتسجيل الدخول' : 'Back to Login'}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">{isRtl ? 'البريد الإلكتروني' : 'Email'}</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="example@mail.com"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-900 text-white py-4 rounded-xl font-bold hover:bg-blue-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : null}
              {isRtl ? 'إرسال رابط التعيين' : 'Send Reset Link'}
            </button>

            <Link to="/login" className="flex items-center justify-center gap-2 text-slate-500 hover:text-blue-900 transition-all text-sm font-medium">
              <ArrowLeft size={16} className="rtl:rotate-180" />
              {isRtl ? 'العودة لتسجيل الدخول' : 'Back to Login'}
            </Link>
          </form>
        )}
      </motion.div>
    </div>
  );
}
