import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Mail, Lock, User as UserIcon, UserPlus, Loader2, AlertCircle, 
  Phone, Globe, Building2, Calendar, Users, Plus, Trash2, 
  Linkedin, Twitter, Facebook, ExternalLink, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const navigate = useNavigate();
  const { updateUserContext, googleLogin, linkedinLogin } = useAuth();

  // Form State
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    age: '',
    gender: '',
    workplace: '',
    phone: '',
    whatsapp: '',
    bio: '',
    specialization: '',
    role: 'journalist'
  });

  const [workSamples, setWorkSamples] = useState([{ title: '', url: '' }]);
  const [socialPages, setSocialPages] = useState({
    facebook: '',
    twitter: '',
    linkedin: '',
    portfolio: ''
  });

  const handleGoogleLogin = async () => {
    try {
      await googleLogin();
    } catch (err) {
      setError(isRtl ? 'فشل الاتصال بجوجل' : 'Google connection failed');
    }
  };

  const handleLinkedinLogin = async () => {
    try {
      await linkedinLogin();
    } catch (err) {
      setError(isRtl ? 'فشل الاتصال بلينكد إن' : 'LinkedIn connection failed');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Step-specific validation
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.password) {
        setError(isRtl ? 'يرجى ملء جميع الحقول الأساسية' : 'Please fill all basic fields');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setError(isRtl ? 'البريد الإلكتروني غير صالح' : 'Invalid email address');
        return;
      }
      if (formData.password.length < 6) {
        setError(isRtl ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!formData.phone || formData.phone.length < 9) {
        setError(isRtl ? 'رقم الهاتف مطلوب وصحيح' : 'Valid phone number is required');
        return;
      }
      if (!formData.workplace) {
        setError(isRtl ? 'يرجى تحديد مكان العمل' : 'Please specify workplace');
        return;
      }
      if (!formData.specialization) {
        setError(isRtl ? 'يرجى تحديد التخصص' : 'Please specify specialization');
        return;
      }
      setStep(3);
      return;
    }

    if (step === 3) {
      const hasInvalidSample = workSamples.some(s => s.url && !s.url.startsWith('http'));
      if (hasInvalidSample) {
        setError(isRtl ? 'روابط الأعمال يجب أن تبدأ بـ http' : 'Work sample URLs must start with http');
        return;
      }
    }

    setLoading(true);
    try {
      const response = await api.post('/api/auth/register', { 
        ...formData,
        work_samples: workSamples.filter(s => s.url),
        social_pages: socialPages
      });
      updateUserContext(response.data.token, response.data.user);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || (isRtl ? 'حدث خطأ أثناء إنشاء الحساب' : 'Error creating account'));
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addWorkSample = () => setWorkSamples([...workSamples, { title: '', url: '' }]);
  const removeWorkSample = (index: number) => setWorkSamples(workSamples.filter((_, i) => i !== index));
  const updateWorkSample = (index: number, field: string, value: string) => {
    const newSamples = [...workSamples];
    newSamples[index] = { ...newSamples[index], [field]: value };
    setWorkSamples(newSamples);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-slate-50/50">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full bg-white rounded-[48px] shadow-2xl border border-slate-100 overflow-hidden"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[600px]">
          {/* Left Sidebar - Status */}
          <div className="md:col-span-4 bg-blue-900 p-8 text-white flex flex-col justify-between">
            <div className="space-y-8">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center font-bold text-xl">P</div>
              <div className="space-y-4">
                <h2 className="text-xl font-bold">{isRtl ? 'انضم للمحترفين' : 'Join Professionals'}</h2>
                <div className="space-y-6 relative">
                  {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center gap-4 group">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        step === s ? 'bg-white text-blue-900 scale-110' : 
                        step > s ? 'bg-emerald-400 text-white' : 'bg-white/20 text-white/60'
                      }`}>
                        {step > s ? '✓' : s}
                      </div>
                      <span className={`text-sm font-medium ${step >= s ? 'text-white' : 'text-white/40'}`}>
                        {s === 1 ? (isRtl ? 'البيانات الأساسية' : 'Basic Info') :
                         s === 2 ? (isRtl ? 'المعلومات المهنية' : 'Professional Info') :
                                   (isRtl ? 'نماذج الأعمال' : 'Work Samples')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-white/10 rounded-2xl text-[10px] text-white/60 leading-relaxed">
              <ShieldCheck className="w-4 h-4 mb-2 text-emerald-400" />
              {isRtl 
                ? 'بياناتك مشفرة ومحمية وفق سياسة خصوصية بيت الصحافة.' 
                : 'Your data is encrypted and protected under Press House privacy policy.'}
            </div>
          </div>

          {/* Right Content - Form */}
          <div className="md:col-span-8 p-8 md:p-12">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-2xl font-bold text-slate-900">{isRtl ? 'إنشاء حساب جديد' : 'Registration'}</h1>
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={handleGoogleLogin}
                  className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-sm font-medium"
                >
                  <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
                  {isRtl ? 'جوجل' : 'Google'}
                </button>
                <button 
                  type="button"
                  onClick={handleLinkedinLogin}
                  className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-sm font-medium"
                >
                  <img src="https://www.linkedin.com/favicon.ico" className="w-4 h-4" alt="LinkedIn" />
                  {isRtl ? 'لينكد إن' : 'LinkedIn'}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-sm mb-8">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-8">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div 
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'الاسم الكامل' : 'Full Name'}</label>
                        <div className="relative">
                          <UserIcon className="absolute ltr:left-4 rtl:right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input 
                            type="text" required value={formData.name}
                            onChange={(e) => updateField('name', e.target.value)}
                            className="w-full ltr:pl-12 rtl:pr-12 px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                            placeholder={isRtl ? 'أحمد محمد' : 'John Doe'}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'البريد الإلكتروني' : 'Email'}</label>
                        <div className="relative">
                          <Mail className="absolute ltr:left-4 rtl:right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input 
                            type="email" required value={formData.email}
                            onChange={(e) => updateField('email', e.target.value)}
                            className="w-full ltr:pl-12 rtl:pr-12 px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                            placeholder="mail@example.com"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'كلمة المرور' : 'Password'}</label>
                      <div className="relative">
                        <Lock className="absolute ltr:left-4 rtl:right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                          type="password" required minLength={6} value={formData.password}
                          onChange={(e) => updateField('password', e.target.value)}
                          className="w-full ltr:pl-12 rtl:pr-12 px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'العمر' : 'Age'}</label>
                        <div className="relative">
                          <Calendar className="absolute ltr:left-4 rtl:right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input 
                            type="number" value={formData.age}
                            onChange={(e) => updateField('age', e.target.value)}
                            className="w-full ltr:pl-12 rtl:pr-12 px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                            placeholder="25"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'النوع' : 'Gender'}</label>
                        <div className="relative">
                          <Users className="absolute ltr:left-4 rtl:right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <select 
                            value={formData.gender}
                            onChange={(e) => updateField('gender', e.target.value)}
                            className="w-full ltr:pl-12 rtl:pr-12 px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm appearance-none bg-white"
                          >
                            <option value="">{isRtl ? 'اختر' : 'Select'}</option>
                            <option value="male">{isRtl ? 'ذكر' : 'Male'}</option>
                            <option value="female">{isRtl ? 'أنثى' : 'Female'}</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div 
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'مكان العمل الحالي' : 'Current Workplace'}</label>
                      <div className="relative">
                        <Building2 className="absolute ltr:left-4 rtl:right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                          type="text" value={formData.workplace}
                          onChange={(e) => updateField('workplace', e.target.value)}
                          className="w-full ltr:pl-12 rtl:pr-12 px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                          placeholder={isRtl ? 'صحيفة أو قناة أو مستقل' : 'Newspaper, TV, or Freelance'}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'التخصص الصحفي' : 'Journalism Specialization'}</label>
                      <input 
                        type="text" value={formData.specialization}
                        onChange={(e) => updateField('specialization', e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                        placeholder={isRtl ? 'صحافة استقصائية، تصوير، تحرير' : 'Investigative, Photography, Editing'}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'رقم الهاتف' : 'Phone'}</label>
                        <div className="relative">
                          <Phone className="absolute ltr:left-4 rtl:right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input 
                            type="tel" value={formData.phone}
                            onChange={(e) => updateField('phone', e.target.value)}
                            className="w-full ltr:pl-12 rtl:pr-12 px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                            placeholder="+967..."
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'واتساب' : 'WhatsApp'}</label>
                        <div className="relative">
                          <Phone className="absolute ltr:left-4 rtl:right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input 
                            type="tel" value={formData.whatsapp}
                            onChange={(e) => updateField('whatsapp', e.target.value)}
                            className="w-full ltr:pl-12 rtl:pr-12 px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                            placeholder="+967..."
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'نبذة مختصرة' : 'Short Bio'}</label>
                      <textarea 
                        value={formData.bio}
                        onChange={(e) => updateField('bio', e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm min-h-[100px] resize-none"
                        placeholder={isRtl ? 'تحدث عن خبرتك ومجالات اهتمامك...' : 'Tell us about your experience and interests...'}
                      />
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div 
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'نماذج من أعمالك' : 'Work Samples'}</label>
                        <button type="button" onClick={addWorkSample} className="text-blue-600 p-1 hover:bg-blue-50 rounded-lg">
                          <Plus size={20} />
                        </button>
                      </div>
                      <div className="space-y-3">
                        {workSamples.map((sample, idx) => (
                          <div key={idx} className="flex gap-3 items-start">
                            <div className="flex-1 space-y-2">
                              <input 
                                type="text" value={sample.title}
                                onChange={(e) => updateWorkSample(idx, 'title', e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs"
                                placeholder={isRtl ? 'عنوان العمل' : 'Work title'}
                              />
                              <input 
                                type="url" value={sample.url}
                                onChange={(e) => updateWorkSample(idx, 'url', e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs"
                                placeholder="https://..."
                              />
                            </div>
                            {idx > 0 && (
                              <button type="button" onClick={() => removeWorkSample(idx)} className="text-red-400 p-2">
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'التواجد الرقمي' : 'Digital Presence'}</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                          <Facebook className="absolute ltr:left-4 rtl:right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input 
                            type="url" value={socialPages.facebook}
                            onChange={(e) => setSocialPages({...socialPages, facebook: e.target.value})}
                            className="w-full ltr:pl-12 rtl:pr-12 px-4 py-2 rounded-xl border border-slate-200 text-xs"
                            placeholder="Facebook URL"
                          />
                        </div>
                        <div className="relative">
                          <Twitter className="absolute ltr:left-4 rtl:right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input 
                            type="url" value={socialPages.twitter}
                            onChange={(e) => setSocialPages({...socialPages, twitter: e.target.value})}
                            className="w-full ltr:pl-12 rtl:pr-12 px-4 py-2 rounded-xl border border-slate-200 text-xs"
                            placeholder="Twitter/X URL"
                          />
                        </div>
                        <div className="relative">
                          <Linkedin className="absolute ltr:left-4 rtl:right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input 
                            type="url" value={socialPages.linkedin}
                            onChange={(e) => setSocialPages({...socialPages, linkedin: e.target.value})}
                            className="w-full ltr:pl-12 rtl:pr-12 px-4 py-2 rounded-xl border border-slate-200 text-xs"
                            placeholder="LinkedIn URL"
                          />
                        </div>
                        <div className="relative">
                          <Globe className="absolute ltr:left-4 rtl:right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input 
                            type="url" value={socialPages.portfolio}
                            onChange={(e) => setSocialPages({...socialPages, portfolio: e.target.value})}
                            className="w-full ltr:pl-12 rtl:pr-12 px-4 py-2 rounded-xl border border-slate-200 text-xs"
                            placeholder="Portfolio/Blog"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-4 pt-4">
                {step > 1 && (
                  <button 
                    type="button" 
                    onClick={() => setStep(step - 1)}
                    className="flex-1 px-8 py-4 border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all"
                  >
                    {isRtl ? 'السابق' : 'Back'}
                  </button>
                )}
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex-[2] bg-blue-900 text-white py-4 rounded-2xl font-bold hover:bg-blue-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" />
                  ) : step === 3 ? (
                    <UserPlus size={18} />
                  ) : (
                    <ExternalLink size={18} />
                  )}
                  {step === 3 ? (isRtl ? 'إكمال التسجيل' : 'Complete Registration') : (isRtl ? 'التالي' : 'Next Step')}
                </button>
              </div>
            </form>

            <p className="text-center text-xs text-slate-400 mt-8">
              {isRtl ? 'لديك حساب بالفعل؟' : 'Already have an account?'}{' '}
              <Link to="/login" className="text-blue-600 font-black hover:underline">{isRtl ? 'سجل دخولك' : 'Login here'}</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
