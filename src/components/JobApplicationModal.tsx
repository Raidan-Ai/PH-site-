import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Loader2, CheckCircle2, FileText } from 'lucide-react';
import { api } from '../services/api';

interface JobApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
}

export const JobApplicationModal: React.FC<JobApplicationModalProps> = ({ isOpen, onClose, jobTitle }) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    coverLetter: '',
    portfolioUrl: '',
    linkedInUrl: '',
    cv: null as File | null,
  });

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;
    const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;

    if (!emailRegex.test(formData.email)) {
      errors.email = isRtl ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email address';
    }
    
    if (!phoneRegex.test(formData.phone)) {
      errors.phone = isRtl ? 'يرجى إدخال رقم هاتف صحيح' : 'Please enter a valid phone number';
    }

    if (formData.portfolioUrl && !urlRegex.test(formData.portfolioUrl)) {
      errors.portfolioUrl = isRtl ? 'يرجى إدخال رابط صحيح' : 'Please enter a valid URL';
    }

    if (formData.linkedInUrl && !urlRegex.test(formData.linkedInUrl)) {
      errors.linkedInUrl = isRtl ? 'يرجى إدخال رابط صحيح' : 'Please enter a valid URL';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.post('/api/job-applications', {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        coverLetter: formData.coverLetter,
        portfolioUrl: formData.portfolioUrl,
        linkedInUrl: formData.linkedInUrl,
        jobTitle,
        cvName: formData.cv?.name || '',
      });
      setSubmitted(true);
    } catch (error) {
      console.error('Application error:', error);
      setError(isRtl ? 'حدث خطأ في الاتصال. يرجى التحقق من اتصالك بالإنترنت.' : 'Connection error. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-xl bg-white rounded-[32px] shadow-2xl overflow-hidden"
          >
            <button 
              id="close-job-modal"
              onClick={onClose}
              className={`absolute top-6 p-2 rounded-full bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors z-10 ${isRtl ? 'left-6' : 'right-6'}`}
            >
              <X size={20} />
            </button>

            <div className="p-8 md:p-12">
              {!submitted ? (
                <form id="job-application-form" onSubmit={handleSubmit} className="space-y-6">
                  <div className="text-center space-y-2">
                    <h2 id="job-modal-title" className="text-2xl font-bold text-slate-900">
                      {t('jobs.form_title')}
                    </h2>
                    <p id="job-modal-subtitle" className="text-blue-600 font-bold">
                      {jobTitle}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label htmlFor="full-name" className="text-sm font-bold text-slate-700">{t('jobs.full_name')}</label>
                      <input
                        id="full-name"
                        required
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none"
                        placeholder={isRtl ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label htmlFor="email" className="text-sm font-bold text-slate-700">{t('jobs.email')}</label>
                        <input
                          id="email"
                          required
                          type="email"
                          value={formData.email}
                          onChange={(e) => {
                            setFormData({ ...formData, email: e.target.value });
                            if (validationErrors.email) setValidationErrors({ ...validationErrors, email: '' });
                          }}
                          className={`w-full px-4 py-3 rounded-xl border ${validationErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-600'} focus:ring-2 outline-none`}
                          placeholder="example@mail.com"
                        />
                        {validationErrors.email && <p className="text-xs text-red-500 mt-1">{validationErrors.email}</p>}
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="phone" className="text-sm font-bold text-slate-700">{t('jobs.phone')}</label>
                        <input
                          id="phone"
                          required
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => {
                            setFormData({ ...formData, phone: e.target.value });
                            if (validationErrors.phone) setValidationErrors({ ...validationErrors, phone: '' });
                          }}
                          className={`w-full px-4 py-3 rounded-xl border ${validationErrors.phone ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-600'} focus:ring-2 outline-none`}
                          placeholder="+967 ..."
                        />
                        {validationErrors.phone && <p className="text-xs text-red-500 mt-1">{validationErrors.phone}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label htmlFor="portfolio-url" className="text-sm font-bold text-slate-700">{isRtl ? 'رابط الأعمال (Portfolio)' : 'Portfolio URL'}</label>
                        <input
                          id="portfolio-url"
                          type="url"
                          value={formData.portfolioUrl}
                          onChange={(e) => {
                            setFormData({ ...formData, portfolioUrl: e.target.value });
                            if (validationErrors.portfolioUrl) setValidationErrors({ ...validationErrors, portfolioUrl: '' });
                          }}
                          className={`w-full px-4 py-3 rounded-xl border ${validationErrors.portfolioUrl ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-600'} focus:ring-2 outline-none`}
                          placeholder="https://portfolio.com"
                        />
                        {validationErrors.portfolioUrl && <p className="text-xs text-red-500 mt-1">{validationErrors.portfolioUrl}</p>}
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="linkedin-url" className="text-sm font-bold text-slate-700">{isRtl ? 'رابط LinkedIn' : 'LinkedIn URL'}</label>
                        <input
                          id="linkedin-url"
                          type="url"
                          value={formData.linkedInUrl}
                          onChange={(e) => {
                            setFormData({ ...formData, linkedInUrl: e.target.value });
                            if (validationErrors.linkedInUrl) setValidationErrors({ ...validationErrors, linkedInUrl: '' });
                          }}
                          className={`w-full px-4 py-3 rounded-xl border ${validationErrors.linkedInUrl ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-600'} focus:ring-2 outline-none`}
                          placeholder="https://linkedin.com/in/..."
                        />
                        {validationErrors.linkedInUrl && <p className="text-xs text-red-500 mt-1">{validationErrors.linkedInUrl}</p>}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="cover-letter" className="text-sm font-bold text-slate-700">{t('jobs.cover_letter')}</label>
                      <textarea
                        id="cover-letter"
                        rows={4}
                        value={formData.coverLetter}
                        onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none resize-none"
                        placeholder={isRtl ? 'لماذا أنت مناسب لهذه الوظيفة؟' : 'Why are you a good fit for this role?'}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">{t('jobs.cv')}</label>
                      <label htmlFor="cv-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-all">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-2 text-slate-400" />
                          <p className="text-sm text-slate-500">{isRtl ? 'اضغط لرفع السيرة الذاتية' : 'Click to upload CV'}</p>
                          <p className="text-xs text-slate-400 mt-1">PDF, DOC (Max 5MB)</p>
                        </div>
                        <input 
                          id="cv-upload"
                          type="file" 
                          className="hidden" 
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
                            const maxSize = 5 * 1024 * 1024; // 5MB

                            if (!validTypes.includes(file.type)) {
                              setError(isRtl ? 'صيغة الملف غير مدعومة. يرجى رفع ملف PDF أو DOC.' : 'Unsupported file type. Please upload a PDF or DOC file.');
                              setFormData({...formData, cv: null});
                              return;
                            }

                            if (file.size > maxSize) {
                              setError(isRtl ? 'حجم الملف كبير جداً. الحد الأقصى هو 5 ميجابايت.' : 'File size is too large. Maximum size is 5MB.');
                              setFormData({...formData, cv: null});
                              return;
                            }

                            setError(null);
                            setFormData({...formData, cv: file});
                          }} 
                        />
                      </label>
                      {formData.cv && (
                        <div id="cv-preview" className="flex items-center gap-2 text-emerald-600 font-bold text-sm bg-emerald-50 p-2 rounded-lg">
                          <FileText size={16} />
                          <span>{formData.cv.name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {error && (
                    <div id="application-error" className="p-4 rounded-xl bg-red-50 text-red-600 text-sm font-bold border border-red-100">
                      {error}
                    </div>
                  )}

                  <button 
                    id="submit-application"
                    type="submit"
                    disabled={loading || !formData.cv}
                    className="w-full py-4 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : t('jobs.submit')}
                  </button>
                </form>
              ) : (
                <div id="success-message" className="text-center space-y-8 py-8">
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 size={40} />
                  </div>
                  <div className="space-y-2">
                    <h2 id="success-title" className="text-3xl font-bold text-slate-900">
                      {t('jobs.success')}
                    </h2>
                    <p id="success-desc" className="text-slate-500 max-w-xs mx-auto">
                      {t('jobs.success_msg')}
                    </p>
                  </div>
                  <button 
                    id="close-success-modal"
                    onClick={onClose}
                    className="w-full py-4 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all"
                  >
                    {t('jobs.close')}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
