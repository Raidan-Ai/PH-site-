import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Save, X, Image as ImageIcon, Globe, Languages, Settings, Library, Upload, Loader2, Wand2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
const ReactQuill = lazy(() => import('react-quill'));
import 'react-quill/dist/quill.snow.css';
import { Article } from '../../types';
import { MediaLibraryModal } from '../../components/media/MediaLibraryModal';
import { FacebookImportModal } from '../../components/admin/FacebookImportModal';
import { translateText, generateSeoMetadata } from '../../services/AIService';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ImagePicker } from '../../components/admin/ImagePicker';
import { SmartTranslate } from '../../components/admin/SmartTranslate';

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

export default function ArticleEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [isFacebookModalOpen, setIsFacebookModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ar' | 'en'>('ar');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTranslateSEO = async (field: 'title' | 'description' | 'keywords', sourceLang: 'ar' | 'en') => {
    const textToTranslate = article.seo?.[field]?.[sourceLang];
    if (!textToTranslate) return;

    setTranslating(true);
    try {
      const targetLang = sourceLang === 'ar' ? 'en' : 'ar';
      const translated = await translateText(textToTranslate, targetLang);
      
      setArticle({ 
        ...article, 
        seo: { 
          ...article.seo!, 
          [field]: { 
            ...(article.seo?.[field] || { ar: '', en: '' }), 
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

  const [generatingSeo, setGeneratingSeo] = useState(false);
  const handleGenerateSmartSEO = async () => {
    setGeneratingSeo(true);
    try {
      const data = await generateSeoMetadata(article.title, article.content);
      if (data) {
        setArticle(prev => ({
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

  const [article, setArticle] = useState<Partial<Article>>({
    title: { ar: '', en: '' },
    content: { ar: '', en: '' },
    category: 'news',
    status: 'draft',
    language: 'both',
    access_tier: 'public',
    mainImage: '',
    show_in_slider: false,
    slider_caption: { ar: '', en: '' },
    slider_button_text: { ar: '', en: '' },
    slider_image: '',
    seo: {
      title: { ar: '', en: '' },
      description: { ar: '', en: '' },
      keywords: { ar: '', en: '' }
    }
  });

  const [sectors, setSectors] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    // Fetch sectors, programs, and projects
    api.get('/api/sectors').then(res => setSectors(res.data || [])).catch(() => {});
    api.get('/api/programs').then(res => setPrograms(res.data || [])).catch(() => {});
    api.get('/api/projects').then(res => setProjects(res.data || [])).catch(() => {});

    if (id && id !== 'new') {
      const fetchArticle = async () => {
        try {
          const res = await api.get('/api/articles');
          const data = res.data.find((a: any) => String(a.id) === String(id));
          if (data) {
            setArticle({
              id: data.id,
              ...data,
              access_tier: data.access_tier || 'public',
              show_in_slider: data.show_in_slider === 1 || data.show_in_slider === true,
              slider_caption: typeof data.slider_caption === 'string' ? JSON.parse(data.slider_caption) : (data.slider_caption || {ar: '', en: ''}),
              slider_button_text: typeof data.slider_button_text === 'string' ? JSON.parse(data.slider_button_text) : (data.slider_button_text || {ar: '', en: ''}),
              seo: typeof data.seo === 'string' ? JSON.parse(data.seo) : data.seo
            } as Article);
          }
        } catch (error) {
          console.error("Error fetching article:", error);
        }
      };
      fetchArticle();
    }
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!article.title?.ar && !article.title?.en) {
      alert(isRtl ? 'يرجى إدخال عنوان واحد على الأقل' : 'Please enter at least one title');
      return;
    }

    setLoading(true);
    try {
      const authorId = user?.uid || 'anonymous';
      const articleData = {
        ...article,
        authorId,
        updatedAt: new Date().toISOString(),
        createdAt: article.createdAt || new Date().toISOString(),
      };

      if (id === 'new') {
        await api.post('/api/articles', articleData);
      } else {
        await api.put(`/api/articles/${id}`, articleData);
      }

      navigate('/admin/dashboard');
    } catch (error) {
      console.error("Error saving article:", error);
      alert(isRtl ? 'حدث خطأ أثناء الحفظ' : 'Error saving article');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    try {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);
      if (user?.uid) formData.append('uploadedBy', user.uid);
      const res = await api.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setArticle({ ...article, mainImage: res.data.url });
    } catch (error) {
      console.error("Error uploading image:", error);
      alert(isRtl ? 'فشل رفع الصورة' : 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-6xl mx-auto"
    >
      <MediaLibraryModal 
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelect={(url) => setArticle({ ...article, mainImage: url })}
      />
      <FacebookImportModal
        isOpen={isFacebookModalOpen}
        onClose={() => setIsFacebookModalOpen(false)}
        onImport={(importedArticle) => setArticle({ ...article, ...importedArticle })}
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {id === 'new' ? (isRtl ? 'إضافة مقال جديد' : 'New Article') : (isRtl ? 'تعديل المقال' : 'Edit Article')}
          </h1>
          <p className="text-slate-500 mt-1">
            {isRtl ? 'قم بإنشاء وتعديل المقالات الإخبارية والتقارير' : 'Create and manage news articles and reports'}
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            type="button"
            onClick={() => setIsFacebookModalOpen(true)}
            className="flex-1 md:flex-none px-6 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl transition-colors flex items-center justify-center gap-2 font-bold"
          >
            {isRtl ? 'استيراد من فيسبوك' : 'Import from FB'}
          </button>
          <button 
            type="button"
            onClick={() => navigate('/admin/articles')}
            className="flex-1 md:flex-none px-6 py-2.5 text-slate-600 hover:bg-slate-200 rounded-xl transition-colors flex items-center justify-center gap-2 font-bold"
          >
            <X size={20} />
            {isRtl ? 'إلغاء' : 'Cancel'}
          </button>
          <button 
            onClick={handleSave}
            disabled={loading}
            className="flex-1 md:flex-none bg-blue-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {isRtl ? 'حفظ المقال' : 'Save Article'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Tabs Header */}
            <div className="flex border-b border-slate-100 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setActiveTab('ar')}
                className={`flex-1 py-4 px-6 text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'ar' 
                    ? 'bg-white text-blue-600 border-b-2 border-blue-600' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Languages size={18} />
                العربية
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('en')}
                className={`flex-1 py-4 px-6 text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'en' 
                    ? 'bg-white text-blue-600 border-b-2 border-blue-600' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Languages size={18} />
                English
              </button>
            </div>

            <div className="p-6 space-y-6">
              <AnimatePresence mode="wait">
                {activeTab === 'ar' ? (
                  <motion.div
                    key="ar"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                    dir="rtl"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-slate-700 block">عنوان المقال</label>
                        <SmartTranslate 
                          text={article.title?.ar || ''} 
                          onTranslate={(translated) => setArticle(p => ({ ...p, title: { ...p.title || { ar: '', en: '' }, en: translated } }))} 
                        />
                      </div>
                      <input 
                        type="text"
                        placeholder="أدخل العنوان هنا..."
                        value={article.title?.ar || ''}
                        onChange={(e) => setArticle({ ...article, title: { ...article.title || { ar: '', en: '' }, ar: e.target.value } })}
                        className="w-full text-xl font-bold p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 block">المحتوى</label>
                      <div className="quill-wrapper">
                        <Suspense fallback={<Loader2 className="animate-spin" />}>
                          <ReactQuill 
                            theme="snow"
                            value={article.content?.ar || ''}
                            onChange={(content) => setArticle({ ...article, content: { ...article.content || { ar: '', en: '' }, ar: content } })}
                            modules={quillModules}
                            placeholder="اكتب محتوى المقال هنا..."
                            className="bg-white rounded-xl overflow-hidden min-h-[400px]"
                          />
                        </Suspense>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="en"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 block">Article Title</label>
                      <input 
                        type="text"
                        placeholder="Enter title here..."
                        value={article.title?.en || ''}
                        onChange={(e) => setArticle({ ...article, title: { ...article.title || { ar: '', en: '' }, en: e.target.value } })}
                        className="w-full text-xl font-bold p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 block">Content</label>
                      <div className="quill-wrapper">
                        <Suspense fallback={<Loader2 className="animate-spin" />}>
                          <ReactQuill 
                            theme="snow"
                            value={article.content?.en || ''}
                            onChange={(content) => setArticle({ ...article, content: { ...article.content || { ar: '', en: '' }, en: content } })}
                            modules={quillModules}
                            placeholder="Write article content here..."
                            className="bg-white rounded-xl overflow-hidden min-h-[400px]"
                          />
                        </Suspense>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* SEO Settings */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6 text-start">
            <div className="flex justify-between items-center flex-wrap gap-2 border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-base">
                <Globe size={18} className="text-blue-600" />
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* AR SEO */}
              <div className="space-y-4" dir="rtl">
                <h4 className="font-bold text-slate-600 text-sm border-b pb-2">العربية</h4>
                <div className="space-y-3">
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="عنوان الميتا"
                      value={article.seo?.title?.ar || ''}
                      onChange={(e) => setArticle({ 
                        ...article, 
                        seo: { 
                          ...article.seo!, 
                          title: { ...(article.seo?.title || { ar: '', en: '' }), ar: e.target.value } 
                        } 
                      })}
                      className="w-full p-3 pr-10 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                    <button type="button" onClick={() => handleTranslateSEO('title', 'ar')} className="absolute right-2 top-2 p-1 text-slate-400 hover:text-blue-600">
                      {translating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                    </button>
                  </div>
                  <div className="relative">
                    <textarea 
                      placeholder="وصف الميتا"
                      rows={3}
                      value={article.seo?.description?.ar || ''}
                      onChange={(e) => setArticle({ 
                        ...article, 
                        seo: { 
                          ...article.seo!, 
                          description: { ...(article.seo?.description || { ar: '', en: '' }), ar: e.target.value } 
                        } 
                      })}
                      className="w-full p-3 pr-10 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
                    />
                    <button type="button" onClick={() => handleTranslateSEO('description', 'ar')} className="absolute right-2 top-2 p-1 text-slate-400 hover:text-blue-600">
                      {translating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                    </button>
                  </div>
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="الكلمات المفتاحية (مفصولة بفاصلة)"
                      value={article.seo?.keywords?.ar || ''}
                      onChange={(e) => setArticle({ 
                        ...article, 
                        seo: { 
                          ...article.seo!, 
                          keywords: { ...(article.seo?.keywords || { ar: '', en: '' }), ar: e.target.value } 
                        } 
                      })}
                      className="w-full p-3 pr-10 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
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
                      value={article.seo?.title?.en || ''}
                      onChange={(e) => setArticle({ 
                        ...article, 
                        seo: { 
                          ...article.seo!, 
                          title: { ...(article.seo?.title || { ar: '', en: '' }), en: e.target.value } 
                        } 
                      })}
                      className="w-full p-3 pl-10 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                    <button type="button" onClick={() => handleTranslateSEO('title', 'en')} className="absolute left-2 top-2 p-1 text-slate-400 hover:text-blue-600">
                      {translating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                    </button>
                  </div>
                  <div className="relative">
                    <textarea 
                      placeholder="Meta Description"
                      rows={3}
                      value={article.seo?.description?.en || ''}
                      onChange={(e) => setArticle({ 
                        ...article, 
                        seo: { 
                          ...article.seo!, 
                          description: { ...(article.seo?.description || { ar: '', en: '' }), en: e.target.value } 
                        } 
                      })}
                      className="w-full p-3 pl-10 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
                    />
                    <button type="button" onClick={() => handleTranslateSEO('description', 'en')} className="absolute left-2 top-2 p-1 text-slate-400 hover:text-blue-600">
                      {translating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                    </button>
                  </div>
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="Keywords (comma separated)"
                      value={article.seo?.keywords?.en || ''}
                      onChange={(e) => setArticle({ 
                        ...article, 
                        seo: { 
                          ...article.seo!, 
                          keywords: { ...(article.seo?.keywords || { ar: '', en: '' }), en: e.target.value } 
                        } 
                      })}
                      className="w-full p-3 pl-10 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                    <button type="button" onClick={() => handleTranslateSEO('keywords', 'en')} className="absolute left-2 top-2 p-1 text-slate-400 hover:text-blue-600">
                      {translating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6 sticky top-8">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-lg">
              <Settings size={20} className="text-blue-600" />
              {isRtl ? 'إعدادات النشر' : 'Publishing Settings'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">{isRtl ? 'التصنيف' : 'Category'}</label>
                <select 
                  value={article.category}
                  onChange={(e) => setArticle({ ...article, category: e.target.value as any })}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                >
                  <option value="news">{isRtl ? 'أخبار' : 'News'}</option>
                  <option value="report">{isRtl ? 'تقارير' : 'Reports'}</option>
                  <option value="press_release">{isRtl ? 'بيانات صحفية' : 'Press Releases'}</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">{isRtl ? 'الحالة' : 'Status'}</label>
                <select 
                  value={article.status}
                  onChange={(e) => setArticle({ ...article, status: e.target.value as any })}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                >
                  <option value="draft">{isRtl ? 'مسودة' : 'Draft'}</option>
                  <option value="published">{isRtl ? 'منشور' : 'Published'}</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">{isRtl ? 'لغة العرض' : 'Display Language'}</label>
                <select 
                  value={article.language}
                  onChange={(e) => setArticle({ ...article, language: e.target.value as any })}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                >
                  <option value="both">{isRtl ? 'كلاهما' : 'Both'}</option>
                  <option value="ar">{isRtl ? 'العربية فقط' : 'Arabic Only'}</option>
                  <option value="en">{isRtl ? 'الإنجليزية فقط' : 'English Only'}</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">{isRtl ? 'مستوى الوصول (العضوية)' : 'Access Control (Membership)'}</label>
                <select 
                  value={article.access_tier || 'public'}
                  onChange={(e) => setArticle({ ...article, access_tier: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm"
                >
                  <option value="public">{isRtl ? 'عام (للجميع)' : 'Public (Everyone)'}</option>
                  <option value="free">{isRtl ? 'أعضاء مسجلين فقط' : 'Free Registered Members Only'}</option>
                  <option value="student">{isRtl ? 'طلاب الإعلام فقط' : 'Media Students Only'}</option>
                  <option value="journalist">{isRtl ? 'صحفيين معتمدين فقط' : 'Certified Journalists Only'}</option>
                  <option value="expert">{isRtl ? 'خبراء إعلاميون ومستشارون' : 'Media Experts & Consultants'}</option>
                  <option value="institution">{isRtl ? 'مؤسسات شريكة' : 'Partner Institutions'}</option>
                </select>
              </div>

              {/* Relational linking dropdowns */}
              <div className="pt-2 space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-150">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest block border-b pb-1 mb-2">
                  {isRtl ? 'ربط المحتوى الاستراتيجي' : 'Link Strategic context'}
                </span>
                
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">{isRtl ? 'القطاع' : 'Sector'}</label>
                  <select 
                    value={article.sector_id || ''}
                    onChange={(e) => setArticle({ ...article, sector_id: e.target.value || null })}
                    className="w-full p-2 text-xs rounded-lg bg-white border border-slate-200 focus:ring-1 focus:ring-blue-500 outline-none font-medium"
                  >
                    <option value="">{isRtl ? '-- حدد القطاع لإرسائه --' : '-- Choose sector --'}</option>
                    {sectors.map(sec => (
                      <option key={sec.id} value={sec.id}>{isRtl ? sec.name_ar : sec.name_en}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">{isRtl ? 'البرنامج' : 'Program'}</label>
                  <select 
                    value={article.program_id || ''}
                    onChange={(e) => setArticle({ ...article, program_id: e.target.value || null })}
                    className="w-full p-2 text-xs rounded-lg bg-white border border-slate-200 focus:ring-1 focus:ring-blue-500 outline-none font-medium"
                  >
                    <option value="">{isRtl ? '-- حدد البرنامج لإرسائه --' : '-- Choose program --'}</option>
                    {programs.map(prog => (
                      <option key={prog.id} value={prog.id}>{prog.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">{isRtl ? 'المشروع' : 'Project'}</label>
                  <select 
                    value={article.project_id || ''}
                    onChange={(e) => setArticle({ ...article, project_id: e.target.value || null })}
                    className="w-full p-2 text-xs rounded-lg bg-white border border-slate-200 focus:ring-1 focus:ring-blue-500 outline-none font-medium"
                  >
                    <option value="">{isRtl ? '-- حدد المشروع لإرسائه --' : '-- Choose project --'}</option>
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

            <hr className="border-slate-100" />

            {/* Slider Settings */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-700">{isRtl ? 'عرض في السلايدر' : 'Show in Slider'}</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={article.show_in_slider}
                    onChange={(e) => setArticle({...article, show_in_slider: e.target.checked})}
                    className="sr-only peer" 
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {article.show_in_slider && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'صورة السلايدر' : 'Slider Image'}</label>
                    <input 
                      type="text"
                      placeholder="URL..."
                      value={article.slider_image}
                      onChange={(e) => setArticle({...article, slider_image: e.target.value})}
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'العنوان العربي' : 'AR Caption'}</label>
                    <input 
                      type="text"
                      value={article.slider_caption?.ar}
                      onChange={(e) => setArticle({...article, slider_caption: { ...article.slider_caption!, ar: e.target.value }})}
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'العنوان الإنجليزي' : 'EN Caption'}</label>
                    <input 
                      type="text"
                      value={article.slider_caption?.en}
                      onChange={(e) => setArticle({...article, slider_caption: { ...article.slider_caption!, en: e.target.value }})}
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'نص الزر' : 'Button Text'}</label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        placeholder="AR"
                        value={article.slider_button_text?.ar}
                        onChange={(e) => setArticle({...article, slider_button_text: { ...article.slider_button_text!, ar: e.target.value }})}
                        className="w-1/2 p-2.5 rounded-lg border border-slate-200 text-xs"
                      />
                      <input 
                        type="text"
                        placeholder="EN"
                        value={article.slider_button_text?.en}
                        onChange={(e) => setArticle({...article, slider_button_text: { ...article.slider_button_text!, en: e.target.value }})}
                        className="w-1/2 p-2.5 rounded-lg border border-slate-200 text-xs"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            <hr className="border-slate-100" />

            {/* Main Image */}
            <div className="space-y-4 text-start">
              <label className="text-sm font-bold text-slate-700">{isRtl ? 'الصورة الرئيسية' : 'Main Image'}</label>
              <ImagePicker 
                value={article.mainImage || ''} 
                onChange={(url) => setArticle(prev => ({ ...prev, mainImage: url }))} 
              />
            </div>
          </div>
        </div>
      </form>
    </motion.div>
  );
}
