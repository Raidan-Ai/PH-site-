import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Save, X, Briefcase, Calendar, Languages, Settings, Trash2, Globe, Wand2, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Job } from '../../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { translateText } from '../../services/AIService';
import { api } from '../../services/api';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    [{ 'direction': 'rtl' }],
    ['link', 'blockquote', 'code-block'],
    ['clean']
  ],
};

export default function JobEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  
  const [loading, setLoading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [job, setJob] = useState<Partial<Job>>({
    title: { ar: '', en: '' },
    description: { ar: '', en: '' },
    requirements: { ar: '', en: '' },
    location: { ar: '', en: '' },
    employmentType: 'full-time',
    salary: '',
    deadline: '',
    status: 'open',
    seo: {
      title: { ar: '', en: '' },
      description: { ar: '', en: '' },
      keywords: { ar: '', en: '' }
    },
  });
  
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleTranslateSEO = async (field: 'title' | 'description' | 'keywords', sourceLang: 'ar' | 'en') => {
    const textToTranslate = job.seo?.[field]?.[sourceLang];
    if (!textToTranslate) return;

    setTranslating(true);
    try {
      const targetLang = sourceLang === 'ar' ? 'en' : 'ar';
      const translated = await translateText(textToTranslate, targetLang);
      
      setJob({ 
        ...job, 
        seo: { 
          ...job.seo!, 
          [field]: { 
            ...(job.seo?.[field] || { ar: '', en: '' }), 
            [targetLang]: translated 
          } 
        } 
      });
    } catch (error) {
      showMessage('error', isRtl ? 'فشل الترجمة' : 'Translation failed');
    } finally {
      setTranslating(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleDelete = async () => {
    if (!id || id === 'new') return;
    setLoading(true);
    try {
      await api.delete(`/api/jobs/${id}`);
      showMessage('success', isRtl ? 'تم حذف الوظيفة بنجاح' : 'Job deleted successfully');
      navigate('/admin/jobs');
    } catch (error) {
      console.error("Error deleting job:", error);
      showMessage('error', isRtl ? 'حدث خطأ أثناء حذف الوظيفة' : 'Error deleting job');
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const [sectors, setSectors] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    // Fetch sectors, programs, projects
    api.get('/api/sectors').then(res => setSectors(res.data || [])).catch(() => {});
    api.get('/api/programs').then(res => setPrograms(res.data || [])).catch(() => {});
    api.get('/api/projects').then(res => setProjects(res.data || [])).catch(() => {});

    if (id && id !== 'new') {
      const fetchJob = async () => {
        try {
          const res = await api.get('/api/jobs');
          const data = res.data.find((j: any) => String(j.id) === String(id));
          if (data) {
            setJob({
              ...data,
              title: typeof data.title === 'string' ? JSON.parse(data.title) : data.title,
              description: typeof data.description === 'string' ? JSON.parse(data.description) : data.description,
              requirements: typeof data.requirements === 'string' ? JSON.parse(data.requirements) : data.requirements,
              seo: typeof data.seo === 'string' ? JSON.parse(data.seo) : data.seo,
              deadline: data.deadline ? new Date(data.deadline).toISOString().split('T')[0] : ''
            });
          }
        } catch (error) {
          console.error("Error fetching job:", error);
        }
      };
      fetchJob();
    }
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const jobData = {
        ...job,
        createdAt: job.createdAt || new Date().toISOString(),
      };

      if (id === 'new') {
        await api.post('/api/jobs', jobData);
      } else {
        await api.put(`/api/jobs/${id}`, jobData);
      }

      showMessage('success', isRtl ? 'تم حفظ الوظيفة بنجاح' : 'Job saved successfully');
      if (id === 'new') navigate('/admin');
    } catch (error) {
      console.error("Error saving job:", error);
      showMessage('error', isRtl ? 'حدث خطأ أثناء حفظ الوظيفة' : 'Error saving job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-5xl mx-auto p-6"
    >
      {message && (
        <div className={cn(
          "fixed top-24 right-6 z-50 p-4 rounded-xl shadow-lg border",
          message.type === 'success' ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-red-50 text-red-800 border-red-200"
        )}>
          {message.text}
        </div>
      )}

      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">
          {id === 'new' ? (isRtl ? 'إضافة وظيفة جديدة' : 'New Job Posting') : (isRtl ? 'تعديل الوظيفة' : 'Edit Job Posting')}
        </h1>
        <div className="flex gap-3">
          {id !== 'new' && (
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
            >
              <Trash2 size={20} />
              {isRtl ? 'حذف' : 'Delete'}
            </button>
          )}
          <button 
            onClick={() => navigate('/admin/jobs')}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2"
          >
            <X size={20} />
            {isRtl ? 'إلغاء' : 'Cancel'}
          </button>
          <button 
            onClick={handleSave}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <Save size={20} />}
            {isRtl ? 'حفظ' : 'Save'}
          </button>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full space-y-6">
            <h2 className="text-xl font-bold text-slate-900">{isRtl ? 'تأكيد الحذف' : 'Confirm Deletion'}</h2>
            <p className="text-slate-600">{isRtl ? 'هل أنت متأكد من حذف هذه الوظيفة؟ لا يمكن التراجع عن هذا الإجراء.' : 'Are you sure you want to delete this job? This action cannot be undone.'}</p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button 
                onClick={handleDelete}
                className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700 transition-colors"
              >
                {isRtl ? 'حذف' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-8">
            {/* Arabic */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-blue-600 font-bold border-b border-slate-100 pb-2">
                <Languages size={20} />
                <span>العربية</span>
              </div>
              <input 
                type="text"
                placeholder="المسمى الوظيفي بالعربية"
                value={job.title?.ar || ''}
                onChange={(e) => setJob({ ...job, title: { ...job.title || { ar: '', en: '' }, ar: e.target.value } })}
                className="w-full text-xl font-bold p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                dir="rtl"
              />
              <input 
                type="text"
                placeholder="الموقع بالعربية"
                value={job.location?.ar || ''}
                onChange={(e) => setJob({ ...job, location: { ...job.location || { ar: '', en: '' }, ar: e.target.value } })}
                className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                dir="rtl"
              />
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">{isRtl ? 'وصف الوظيفة' : 'Job Description'}</label>
                <div className="quill-wrapper" dir="rtl">
                  <ReactQuill 
                    theme="snow"
                    value={job.description?.ar || ''}
                    onChange={(content) => setJob({ ...job, description: { ...job.description || { ar: '', en: '' }, ar: content } })}
                    modules={quillModules}
                    placeholder="وصف الوظيفة بالعربية..."
                    className="bg-white rounded-xl overflow-hidden"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">{isRtl ? 'المتطلبات' : 'Requirements'}</label>
                <div className="quill-wrapper" dir="rtl">
                  <ReactQuill 
                    theme="snow"
                    value={job.requirements?.ar || ''}
                    onChange={(content) => setJob({ ...job, requirements: { ...job.requirements || { ar: '', en: '' }, ar: content } })}
                    modules={quillModules}
                    placeholder="المتطلبات بالعربية..."
                    className="bg-white rounded-xl overflow-hidden"
                  />
                </div>
              </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* English */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-blue-600 font-bold border-b border-slate-100 pb-2">
                <Languages size={20} />
                <span>English</span>
              </div>
              <input 
                type="text"
                placeholder="Job Title in English"
                value={job.title?.en || ''}
                onChange={(e) => setJob({ ...job, title: { ...job.title || { ar: '', en: '' }, en: e.target.value } })}
                className="w-full text-xl font-bold p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <input 
                type="text"
                placeholder="Location in English"
                value={job.location?.en || ''}
                onChange={(e) => setJob({ ...job, location: { ...job.location || { ar: '', en: '' }, en: e.target.value } })}
                className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">{isRtl ? 'وصف الوظيفة' : 'Job Description'}</label>
                <div className="quill-wrapper">
                  <ReactQuill 
                    theme="snow"
                    value={job.description?.en || ''}
                    onChange={(content) => setJob({ ...job, description: { ...job.description || { ar: '', en: '' }, en: content } })}
                    modules={quillModules}
                    placeholder="Job description in English..."
                    className="bg-white rounded-xl overflow-hidden"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">{isRtl ? 'المتطلبات' : 'Requirements'}</label>
                <div className="quill-wrapper">
                  <ReactQuill 
                    theme="snow"
                    value={job.requirements?.en || ''}
                    onChange={(content) => setJob({ ...job, requirements: { ...job.requirements || { ar: '', en: '' }, en: content } })}
                    modules={quillModules}
                    placeholder="Requirements in English..."
                    className="bg-white rounded-xl overflow-hidden"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* SEO Settings */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Globe size={18} />
              {isRtl ? 'تحسين محركات البحث (SEO)' : 'SEO Settings'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* AR SEO */}
              <div className="space-y-4" dir="rtl">
                <h4 className="font-bold text-slate-600 text-sm border-b pb-2">العربية</h4>
                <div className="space-y-3">
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="عنوان الميتا"
                      value={job.seo?.title?.ar || ''}
                      onChange={(e) => setJob({ ...job, seo: { ...job.seo!, title: { ...job.seo!.title, ar: e.target.value } } })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm pr-10"
                    />
                    <button type="button" onClick={() => handleTranslateSEO('title', 'ar')} className="absolute right-2 top-2 p-1 text-slate-400 hover:text-blue-600">
                      {translating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                    </button>
                  </div>
                  <div className="relative">
                    <textarea 
                      placeholder="وصف الميتا"
                      rows={3}
                      value={job.seo?.description?.ar || ''}
                      onChange={(e) => setJob({ ...job, seo: { ...job.seo!, description: { ...job.seo!.description, ar: e.target.value } } })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none pr-10"
                    />
                    <button type="button" onClick={() => handleTranslateSEO('description', 'ar')} className="absolute right-2 top-2 p-1 text-slate-400 hover:text-blue-600">
                      {translating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                    </button>
                  </div>
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="الكلمات المفتاحية (مفصولة بفاصلة)"
                      value={job.seo?.keywords?.ar || ''}
                      onChange={(e) => setJob({ ...job, seo: { ...job.seo!, keywords: { ...job.seo!.keywords, ar: e.target.value } } })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm pr-10"
                    />
                    <button type="button" onClick={() => handleTranslateSEO('keywords', 'ar')} className="absolute right-2 top-2 p-1 text-slate-400 hover:text-blue-600">
                      {translating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* EN SEO */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-600 text-sm border-b pb-2">English</h4>
                <div className="space-y-3">
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="Meta Title"
                      value={job.seo?.title?.en || ''}
                      onChange={(e) => setJob({ ...job, seo: { ...job.seo!, title: { ...job.seo!.title, en: e.target.value } } })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm pl-10"
                    />
                    <button type="button" onClick={() => handleTranslateSEO('title', 'en')} className="absolute left-2 top-2 p-1 text-slate-400 hover:text-blue-600">
                      {translating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                    </button>
                  </div>
                  <div className="relative">
                    <textarea 
                      placeholder="Meta Description"
                      rows={3}
                      value={job.seo?.description?.en || ''}
                      onChange={(e) => setJob({ ...job, seo: { ...job.seo!, description: { ...job.seo!.description, en: e.target.value } } })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none pl-10"
                    />
                    <button type="button" onClick={() => handleTranslateSEO('description', 'en')} className="absolute left-2 top-2 p-1 text-slate-400 hover:text-blue-600">
                      {translating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                    </button>
                  </div>
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="Keywords (comma separated)"
                      value={job.seo?.keywords?.en || ''}
                      onChange={(e) => setJob({ ...job, seo: { ...job.seo!, keywords: { ...job.seo!.keywords, en: e.target.value } } })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm pl-10"
                    />
                    <button type="button" onClick={() => handleTranslateSEO('keywords', 'en')} className="absolute left-2 top-2 p-1 text-slate-400 hover:text-blue-600">
                      {translating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                    </button>
                  </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Settings size={18} />
              {isRtl ? 'إعدادات الوظيفة' : 'Job Settings'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">{isRtl ? 'الحالة' : 'Status'}</label>
                <select 
                  value={job.status}
                  onChange={(e) => setJob({ ...job, status: e.target.value as any })}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="open">{isRtl ? 'مفتوح' : 'Open'}</option>
                  <option value="closed">{isRtl ? 'مغلق' : 'Closed'}</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">{isRtl ? 'نوع التوظيف' : 'Employment Type'}</label>
                <select 
                  value={job.employmentType}
                  onChange={(e) => setJob({ ...job, employmentType: e.target.value as any })}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="full-time">{isRtl ? 'دوام كامل' : 'Full-time'}</option>
                  <option value="part-time">{isRtl ? 'دوام جزئي' : 'Part-time'}</option>
                  <option value="contract">{isRtl ? 'عقد' : 'Contract'}</option>
                  <option value="remote">{isRtl ? 'عن بعد' : 'Remote'}</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">{isRtl ? 'الراتب' : 'Salary'}</label>
                <input 
                  type="text"
                  placeholder={isRtl ? 'مثال: 1000$ - 2000$' : 'e.g., $1000 - $2000'}
                  value={job.salary}
                  onChange={(e) => setJob({ ...job, salary: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">{isRtl ? 'الموعد النهائي' : 'Deadline'}</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input 
                    type="date"
                    value={job.deadline}
                    onChange={(e) => setJob({ ...job, deadline: e.target.value })}
                    className="w-full p-3 pl-10 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Strategic Context Linkages */}
              <div className="pt-2 space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-150 text-start">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest block border-b pb-1 mb-2">
                  {isRtl ? 'ربط المبادرة الاستراتيجية' : 'Link Strategic context'}
                </span>
                
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">{isRtl ? 'القطاع' : 'Sector'}</label>
                  <select 
                    value={job.sector_id || ''}
                    onChange={(e) => setJob({ ...job, sector_id: e.target.value || null })}
                    className="w-full p-2.5 text-xs rounded-lg bg-white border border-slate-200 focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    <option value="">{isRtl ? '-- اختر القطاع --' : '-- Choose sector --'}</option>
                    {sectors.map(sec => (
                      <option key={sec.id} value={sec.id}>{isRtl ? sec.name_ar : sec.name_en}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">{isRtl ? 'البرنامج' : 'Program'}</label>
                  <select 
                    value={job.program_id || ''}
                    onChange={(e) => setJob({ ...job, program_id: e.target.value || null })}
                    className="w-full p-2.5 text-xs rounded-lg bg-white border border-slate-200 focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    <option value="">{isRtl ? '-- اختر البرنامج --' : '-- Choose program --'}</option>
                    {programs.map(prog => (
                      <option key={prog.id} value={prog.id}>{prog.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">{isRtl ? 'المشروع' : 'Project'}</label>
                  <select 
                    value={job.project_id || ''}
                    onChange={(e) => setJob({ ...job, project_id: e.target.value || null })}
                    className="w-full p-2.5 text-xs rounded-lg bg-white border border-slate-200 focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    <option value="">{isRtl ? '-- اختر المشروع --' : '-- Choose project --'}</option>
                    {projects.map(p => {
                      const t = typeof p.title === 'string' ? JSON.parse(p.title || '{}') : p.title;
                      return (
                        <option key={p.id} value={p.id}>{t?.ar || p.id}</option>
                      );
                    })}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </motion.div>
  );
}
