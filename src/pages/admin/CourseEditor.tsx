import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
const ReactQuill = lazy(() => import('react-quill'));
import 'react-quill/dist/quill.snow.css';
import { 
  Save, ArrowLeft, Loader2, Image as ImageIcon, 
  Plus, Trash2, Video, GraduationCap, User,
  FileText, Link as LinkIcon, Radio, Globe, Key,
  Library, Wand2, Sparkles
} from 'lucide-react';
import { Course } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { MediaLibraryModal } from '../../components/media/MediaLibraryModal';
import { translateText, generateSeoMetadata } from '../../services/AIService';

const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    [{ 'font': [] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'script': 'sub' }, { 'script': 'super' }],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    [{ 'indent': '-1' }, { 'indent': '+1' }],
    [{ 'direction': 'rtl' }],
    [{ 'align': [] }],
    ['link', 'image', 'video', 'blockquote', 'code-block'],
    ['clean']
  ],
};

export default function CourseEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const isNew = id === 'new';
  const { user } = useAuth();

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [mediaTarget, setMediaTarget] = useState<'announcement' | 'trainer'>('announcement');
  const [course, setCourse] = useState<Partial<Course>>({
    title: { ar: '', en: '' },
    description: { ar: '', en: '' },
    trainer: {
      name: { ar: '', en: '' },
      cvUrl: '',
      photoUrl: ''
    },
    applicationDeadline: new Date().toISOString().slice(0, 10),
    applicationUrl: '',
    announcementImage: '',
    show_in_slider: false,
    slider_caption: { ar: '', en: '' },
    slider_button_text: { ar: '', en: '' },
    slider_image: '',
    videos: [],
    isLive: false,
    liveUrl: '',
    status: 'active',
    seo: {
      title: { ar: '', en: '' },
      description: { ar: '', en: '' },
      keywords: { ar: '', en: '' }
    },
    createdAt: new Date().toISOString()
  });

  const [generatingSeo, setGeneratingSeo] = useState(false);
  const handleGenerateSmartSEO = async () => {
    setGeneratingSeo(true);
    try {
      const data = await generateSeoMetadata(course.title, course.description);
      if (data) {
        setCourse(prev => ({
          ...prev,
          seo: {
            title: { ar: data.title?.ar || '', en: data.title?.en || '' },
            description: { ar: data.description?.ar || '', en: data.description?.en || '' },
            keywords: { ar: data.keywords?.ar || '', en: data.keywords?.en || '' }
          }
        }));
      }
    } catch (err) {
      console.error(err);
      alert(isRtl ? 'حدث خطأ أثناء توليد الكلمات والبيانات' : 'Failed to generate tags');
    } finally {
      setGeneratingSeo(false);
    }
  };

  const handleTranslateSEO = async (field: 'title' | 'description' | 'keywords', sourceLang: 'ar' | 'en') => {
    const textToTranslate = course.seo?.[field]?.[sourceLang];
    if (!textToTranslate) return;

    setTranslating(true);
    try {
      const targetLang = sourceLang === 'ar' ? 'en' : 'ar';
      const translated = await translateText(textToTranslate, targetLang);
      
      setCourse({ 
        ...course, 
        seo: { 
          ...course.seo!, 
          [field]: { 
            ...(course.seo?.[field] || { ar: '', en: '' }), 
            [targetLang]: translated 
          } 
        } 
      });
    } catch (error) {
      alert(isRtl ? 'فشل الترجمة' : 'Translation failed');
    } finally {
      setTranslating(false);
    }
  };

  useEffect(() => {
    if (!isNew && id) {
      const fetchCourse = async () => {
        try {
          const res = await api.get('/api/courses');
          const data = res.data.find((c: any) => String(c.id) === String(id));
          if (data) {
            setCourse({
              ...data,
              show_in_slider: data.show_in_slider === 1 || data.show_in_slider === true,
              slider_caption: typeof data.slider_caption === 'string' ? JSON.parse(data.slider_caption) : (data.slider_caption || {ar: '', en: ''}),
              slider_button_text: typeof data.slider_button_text === 'string' ? JSON.parse(data.slider_button_text) : (data.slider_button_text || {ar: '', en: ''}),
              title: typeof data.title === 'string' ? JSON.parse(data.title) : data.title,
              description: typeof data.description === 'string' ? JSON.parse(data.description) : data.description,
              trainer: typeof data.trainer === 'string' ? JSON.parse(data.trainer) : data.trainer,
              videos: typeof data.videos === 'string' ? JSON.parse(data.videos) : data.videos,
              seo: typeof data.seo === 'string' ? JSON.parse(data.seo) : data.seo,
              applicationDeadline: data.applicationDeadline ? new Date(data.applicationDeadline).toISOString().split('T')[0] : ''
            });
          }
        } catch (error) {
          console.error("Error fetching course:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchCourse();
    }
  }, [id, isNew]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const courseData = {
        ...course,
      };

      if (isNew) {
        await api.post('/api/courses', courseData);
      } else {
        await api.put(`/api/courses/${id}`, courseData);
      }
      
      navigate('/admin/courses');
    } catch (error) {
      console.error("Error saving course:", error);
      alert(isRtl ? 'حدث خطأ أثناء الحفظ' : 'Error saving course');
    } finally {
      setSaving(false);
    }
  };

  const generateStreamCredentials = () => {
    const randomKey = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const domain = window.location.hostname;
    setCourse({
      ...course,
      streamKey: randomKey,
      streamUrl: `rtmp://live.${domain}/app`
    });
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  return (
    <div className="space-y-8 pb-24">
      <MediaLibraryModal 
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelect={(url) => {
          if (mediaTarget === 'announcement') {
            setCourse({ ...course, announcementImage: url });
          } else {
            setCourse({ ...course, trainer: { ...course.trainer!, photoUrl: url } });
          }
        }}
      />
      <div className="flex justify-between items-center">
        <button 
          onClick={() => navigate('/admin/courses')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-colors"
        >
          <ArrowLeft size={20} className={isRtl ? 'rotate-180' : ''} />
          {isRtl ? 'العودة للدورات' : 'Back to Courses'}
        </button>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          {isRtl ? 'حفظ الدورة' : 'Save Course'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Basic Info */}
          <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <GraduationCap className="text-blue-600" size={24} />
              {isRtl ? 'معلومات الدورة' : 'Course Information'}
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">{isRtl ? 'العنوان (بالعربية)' : 'Title (Arabic)'}</label>
                  <input 
                    type="text"
                    value={course.title?.ar}
                    onChange={(e) => setCourse({ ...course, title: { ...course.title!, ar: e.target.value } })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">{isRtl ? 'العنوان (بالإنجليزية)' : 'Title (English)'}</label>
                  <input 
                    type="text"
                    value={course.title?.en}
                    onChange={(e) => setCourse({ ...course, title: { ...course.title!, en: e.target.value } })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">{isRtl ? 'الوصف (بالعربية)' : 'Description (Arabic)'}</label>
                <div className="quill-wrapper" dir="rtl">
                  <Suspense fallback={<Loader2 className="animate-spin" />}>
                    <ReactQuill 
                      theme="snow"
                      value={course.description?.ar || ''}
                      onChange={(content) => setCourse({ ...course, description: { ...course.description!, ar: content } })}
                      modules={quillModules}
                      className="bg-white rounded-xl overflow-hidden min-h-[200px]"
                    />
                  </Suspense>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">{isRtl ? 'الوصف (بالإنجليزية)' : 'Description (English)'}</label>
                <div className="quill-wrapper">
                  <Suspense fallback={<Loader2 className="animate-spin" />}>
                    <ReactQuill 
                      theme="snow"
                      value={course.description?.en || ''}
                      onChange={(content) => setCourse({ ...course, description: { ...course.description!, en: content } })}
                      modules={quillModules}
                      className="bg-white rounded-xl overflow-hidden min-h-[200px]"
                    />
                  </Suspense>
                </div>
              </div>
            </div>
          </div>

          {/* Trainer Info */}
          <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <User className="text-blue-600" size={24} />
              {isRtl ? 'معلومات المدرب' : 'Trainer Information'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">{isRtl ? 'اسم المدرب (بالعربية)' : 'Trainer Name (Arabic)'}</label>
                <input 
                  type="text"
                  value={course.trainer?.name.ar}
                  onChange={(e) => setCourse({ ...course, trainer: { ...course.trainer!, name: { ...course.trainer!.name, ar: e.target.value } } })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">{isRtl ? 'اسم المدرب (بالإنجليزية)' : 'Trainer Name (English)'}</label>
                <input 
                  type="text"
                  value={course.trainer?.name.en}
                  onChange={(e) => setCourse({ ...course, trainer: { ...course.trainer!, name: { ...course.trainer!.name, en: e.target.value } } })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">{isRtl ? 'رابط السيرة الذاتية (CV)' : 'CV URL'}</label>
                <input 
                  type="text"
                  value={course.trainer?.cvUrl}
                  onChange={(e) => setCourse({ ...course, trainer: { ...course.trainer!, cvUrl: e.target.value } })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-bold text-slate-700">{isRtl ? 'رابط صورة المدرب' : 'Trainer Photo URL'}</label>
                  <button onClick={() => { setMediaTarget('trainer'); setIsMediaModalOpen(true); }} className="text-blue-600 text-xs font-bold flex items-center gap-1 hover:underline">
                    <Library size={14} /> {isRtl ? 'المكتبة' : 'Library'}
                  </button>
                </div>
                <input 
                  type="text"
                  value={course.trainer?.photoUrl}
                  onChange={(e) => setCourse({ ...course, trainer: { ...course.trainer!, photoUrl: e.target.value } })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* SEO Settings */}
          <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6 text-start">
            <div className="flex justify-between items-center flex-wrap gap-2 border-b border-slate-100 pb-3">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Globe className="text-blue-600" size={24} />
                {isRtl ? 'تحسين محركات البحث والكلمات الدليليّة (SEO)' : 'SEO Metadata Optimizations'}
              </h3>
              <button
                type="button"
                onClick={handleGenerateSmartSEO}
                disabled={generatingSeo}
                className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500 hover:text-white text-slate-900 border border-amber-300 font-extrabold text-[11px] flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {generatingSeo ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} className="text-amber-500 group-hover:text-white" />}
                {isRtl ? 'توليد ذكي تلقائي (AI)' : 'AI Optimize Metadata'}
              </button>
            </div>

            <div className="space-y-6">
              {/* Arabic SEO */}
              <div className="space-y-4 p-4 bg-slate-50 rounded-2xl">
                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-xs">AR</span>
                  {isRtl ? 'الإعدادات بالعربية' : 'Arabic Settings'}
                </h4>
                <div className="space-y-4">
                  <div className="space-y-2 relative">
                    <label className="text-xs font-bold text-slate-500">{isRtl ? 'عنوان Meta' : 'Meta Title'}</label>
                    <input 
                      type="text"
                      value={course.seo?.title.ar}
                      onChange={(e) => setCourse({ ...course, seo: { ...course.seo!, title: { ...course.seo!.title, ar: e.target.value } } })}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm pr-8"
                    />
                    <button type="button" onClick={() => handleTranslateSEO('title', 'ar')} className="absolute right-2 bottom-2 p-1 text-slate-400 hover:text-blue-600">
                      {translating ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                    </button>
                  </div>
                  <div className="space-y-2 relative">
                    <label className="text-xs font-bold text-slate-500">{isRtl ? 'وصف Meta' : 'Meta Description'}</label>
                    <textarea 
                      rows={2}
                      value={course.seo?.description.ar}
                      onChange={(e) => setCourse({ ...course, seo: { ...course.seo!, description: { ...course.seo!.description, ar: e.target.value } } })}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none pr-8"
                    />
                    <button type="button" onClick={() => handleTranslateSEO('description', 'ar')} className="absolute right-2 bottom-2 p-1 text-slate-400 hover:text-blue-600">
                      {translating ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                    </button>
                  </div>
                  <div className="space-y-2 relative">
                    <label className="text-xs font-bold text-slate-500">{isRtl ? 'الكلمات المفتاحية' : 'Keywords'}</label>
                    <input 
                      type="text"
                      placeholder={isRtl ? 'كلمة، كلمة، كلمة...' : 'keyword, keyword...'}
                      value={course.seo?.keywords.ar}
                      onChange={(e) => setCourse({ ...course, seo: { ...course.seo!, keywords: { ...course.seo!.keywords, ar: e.target.value } } })}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm pr-8"
                    />
                    <button type="button" onClick={() => handleTranslateSEO('keywords', 'ar')} className="absolute right-2 bottom-2 p-1 text-slate-400 hover:text-blue-600">
                      {translating ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* English SEO */}
              <div className="space-y-4 p-4 bg-slate-50 rounded-2xl">
                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-xs">EN</span>
                  {isRtl ? 'الإعدادات بالإنجليزية' : 'English Settings'}
                </h4>
                <div className="space-y-4">
                  <div className="space-y-2 relative">
                    <label className="text-xs font-bold text-slate-500">{isRtl ? 'عنوان Meta' : 'Meta Title'}</label>
                    <input 
                      type="text"
                      value={course.seo?.title.en}
                      onChange={(e) => setCourse({ ...course, seo: { ...course.seo!, title: { ...course.seo!.title, en: e.target.value } } })}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm pl-8"
                    />
                    <button type="button" onClick={() => handleTranslateSEO('title', 'en')} className="absolute left-2 bottom-2 p-1 text-slate-400 hover:text-blue-600">
                      {translating ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                    </button>
                  </div>
                  <div className="space-y-2 relative">
                    <label className="text-xs font-bold text-slate-500">{isRtl ? 'وصف Meta' : 'Meta Description'}</label>
                    <textarea 
                      rows={2}
                      value={course.seo?.description.en}
                      onChange={(e) => setCourse({ ...course, seo: { ...course.seo!, description: { ...course.seo!.description, en: e.target.value } } })}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none pl-8"
                    />
                    <button type="button" onClick={() => handleTranslateSEO('description', 'en')} className="absolute left-2 bottom-2 p-1 text-slate-400 hover:text-blue-600">
                      {translating ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                    </button>
                  </div>
                  <div className="space-y-2 relative">
                    <label className="text-xs font-bold text-slate-500">{isRtl ? 'الكلمات المفتاحية' : 'Keywords'}</label>
                    <input 
                      type="text"
                      placeholder={isRtl ? 'keyword, keyword...' : 'keyword, keyword...'}
                      value={course.seo?.keywords.en}
                      onChange={(e) => setCourse({ ...course, seo: { ...course.seo!, keywords: { ...course.seo!.keywords, en: e.target.value } } })}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm pl-8"
                    />
                    <button type="button" onClick={() => handleTranslateSEO('keywords', 'en')} className="absolute left-2 bottom-2 p-1 text-slate-400 hover:text-blue-600">
                      {translating ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status & Deadline */}
          <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-700">{isRtl ? 'حالة الدورة' : 'Course Status'}</label>
              <select 
                value={course.status}
                onChange={(e) => setCourse({ ...course, status: e.target.value as any })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
              >
                <option value="active">{isRtl ? 'نشطة' : 'Active'}</option>
                <option value="archived">{isRtl ? 'مؤرشفة' : 'Archived'}</option>
              </select>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-700">{isRtl ? 'آخر موعد للتقديم' : 'Application Deadline'}</label>
              <input 
                type="date"
                value={course.applicationDeadline}
                onChange={(e) => setCourse({ ...course, applicationDeadline: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
              />
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-700">{isRtl ? 'رابط استمارة التقديم' : 'Application Form URL'}</label>
              <div className="relative">
                <input 
                  type="text"
                  value={course.applicationUrl}
                  onChange={(e) => setCourse({ ...course, applicationUrl: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <LinkIcon className="absolute left-3 top-3.5 text-slate-400" size={18} />
              </div>
            </div>
          </div>

          {/* Slider Settings */}
          <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ImageIcon className="text-blue-600" size={20} />
                {isRtl ? 'إعدادات السلايدر' : 'Slider Settings'}
              </h3>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={course.show_in_slider}
                  onChange={(e) => setCourse({...course, show_in_slider: e.target.checked})}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {course.show_in_slider && (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'صورة السلايدر' : 'Slider Image URL'}</label>
                  <input 
                    type="text"
                    value={course.slider_image}
                    onChange={(e) => setCourse({...course, slider_image: e.target.value})}
                    placeholder="https://..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'العنوان العربي' : 'Arabic Caption'}</label>
                    <input 
                      type="text"
                      value={course.slider_caption?.ar}
                      onChange={(e) => setCourse({...course, slider_caption: { ...course.slider_caption!, ar: e.target.value }})}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'العنوان الإنجليزي' : 'English Caption'}</label>
                    <input 
                      type="text"
                      value={course.slider_caption?.en}
                      onChange={(e) => setCourse({...course, slider_caption: { ...course.slider_caption!, en: e.target.value }})}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'نص الزر AR' : 'Button Text AR'}</label>
                    <input 
                      type="text"
                      value={course.slider_button_text?.ar}
                      onChange={(e) => setCourse({...course, slider_button_text: { ...course.slider_button_text!, ar: e.target.value }})}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'نص الزر EN' : 'Button Text EN'}</label>
                    <input 
                      type="text"
                      value={course.slider_button_text?.en}
                      onChange={(e) => setCourse({...course, slider_button_text: { ...course.slider_button_text!, en: e.target.value }})}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Live Stream */}
          <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Radio className="text-rose-600" size={20} />
                {isRtl ? 'بث مباشر' : 'Live Stream'}
              </h3>
              <input 
                type="checkbox"
                checked={course.isLive || false}
                onChange={(e) => setCourse({ ...course, isLive: e.target.checked })}
                className="w-6 h-6 rounded-lg border-slate-200 text-blue-600 focus:ring-blue-500"
              />
            </div>
            {course.isLive && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700">{isRtl ? 'رابط البث (Embed)' : 'Live Embed URL'}</label>
                  <input 
                    type="text"
                    placeholder="https://..."
                    value={course.liveUrl || ''}
                    onChange={(e) => setCourse({ ...course, liveUrl: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-xs"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900">{isRtl ? 'بيانات البث (للمذيع)' : 'Stream Credentials (Broadcaster)'}</h4>
                    <button 
                      onClick={generateStreamCredentials}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      {isRtl ? 'توليد بيانات البث' : 'Generate Credentials'}
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">{isRtl ? 'رابط الخادم (Server URL)' : 'Server URL'}</label>
                      <div className="flex items-center gap-2">
                        <Globe size={16} className="text-slate-400" />
                        <input 
                          type="text"
                          readOnly
                          value={course.streamUrl || ''}
                          className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">{isRtl ? 'مفتاح البث (Stream Key)' : 'Stream Key'}</label>
                      <div className="flex items-center gap-2">
                        <Key size={16} className="text-slate-400" />
                        <input 
                          type="text"
                          readOnly
                          value={course.streamKey || ''}
                          className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Announcement Image */}
          <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ImageIcon className="text-blue-600" size={20} />
                {isRtl ? 'صورة الإعلان' : 'Announcement Image'}
              </h3>
              <button onClick={() => { setMediaTarget('announcement'); setIsMediaModalOpen(true); }} className="text-blue-600 text-xs font-bold flex items-center gap-1 hover:underline">
                <Library size={14} /> {isRtl ? 'المكتبة' : 'Library'}
              </button>
            </div>
            <div className="space-y-4">
              <div className="aspect-video rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden relative group">
                {course.announcementImage ? (
                  <img src={course.announcementImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <ImageIcon size={48} />
                  </div>
                )}
              </div>
              <input 
                type="text"
                placeholder={isRtl ? 'رابط الصورة...' : 'Image URL...'}
                value={course.announcementImage}
                onChange={(e) => setCourse({ ...course, announcementImage: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
