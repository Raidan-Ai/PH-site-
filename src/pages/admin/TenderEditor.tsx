import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, ArrowLeft, Loader2, Globe, Wand2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { translateText } from '../../services/AIService';
import { api } from '../../services/api';

export const TenderEditor: React.FC = () => {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const navigate = useNavigate();
  const { id } = useParams();
  const isNew = id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [tender, setTender] = useState({
    title: { ar: '', en: '' },
    description: { ar: '', en: '' },
    deadline: '',
    status: 'open',
    documents: [] as any[],
    seo: {
      title: { ar: '', en: '' },
      description: { ar: '', en: '' },
      keywords: { ar: '', en: '' }
    }
  });

  const handleTranslateSEO = async (field: 'title' | 'description' | 'keywords', sourceLang: 'ar' | 'en') => {
    const textToTranslate = tender.seo?.[field]?.[sourceLang];
    if (!textToTranslate) return;

    setTranslating(true);
    try {
      const targetLang = sourceLang === 'ar' ? 'en' : 'ar';
      const translated = await translateText(textToTranslate, targetLang);
      
      setTender({ 
        ...tender, 
        seo: { 
          ...tender.seo!, 
          [field]: { 
            ...(tender.seo?.[field] || { ar: '', en: '' }), 
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
    if (!isNew) {
      const fetchTender = async () => {
        try {
          const res = await api.get(`/api/tenders`);
          const target = res.data.find((t: any) => t.id === id);
          if (target) {
            setTender({
              ...target,
              title: typeof target.title === 'string' ? JSON.parse(target.title) : target.title,
              description: typeof target.description === 'string' ? JSON.parse(target.description) : target.description,
              documents: typeof target.documents === 'string' ? JSON.parse(target.documents) : (target.documents || []),
              seo: typeof target.seo === 'string' ? JSON.parse(target.seo) : (target.seo || { title: { ar: '', en: '' }, description: { ar: '', en: '' }, keywords: { ar: '', en: '' } })
            });
          }
        } catch (error) {
          console.error("Error fetching tender:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchTender();
    }
  }, [id, isNew]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isNew) {
        await api.post('/api/tenders', { ...tender, id: `tnd-${Date.now()}` });
      } else {
        await api.put(`/api/tenders/${id}`, tender);
      }
      navigate('/admin/tenders');
    } catch (error) {
      console.error("Error saving tender:", error);
      alert(isRtl ? 'فشل حفظ المناقصة' : 'Failed to save tender');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/tenders')} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
          <ArrowLeft size={24} className={isRtl ? 'rotate-180' : ''} />
        </button>
        <h1 className="text-2xl font-bold text-slate-900">
          {isNew ? (isRtl ? 'إضافة مناقصة جديدة' : 'Add New Tender') : (isRtl ? 'تعديل المناقصة' : 'Edit Tender')}
        </h1>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">{isRtl ? 'العنوان بالعربية' : 'Title (Arabic)'}</label>
                <input
                  type="text"
                  required
                  value={tender.title.ar}
                  onChange={(e) => setTender({ ...tender, title: { ...tender.title, ar: e.target.value } })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">{isRtl ? 'العنوان بالإنجليزية' : 'Title (English)'}</label>
                <input
                  type="text"
                  required
                  value={tender.title.en}
                  onChange={(e) => setTender({ ...tender, title: { ...tender.title, en: e.target.value } })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">{isRtl ? 'الوصف بالعربية' : 'Description (Arabic)'}</label>
              <textarea
                required
                rows={4}
                value={tender.description.ar}
                onChange={(e) => setTender({ ...tender, description: { ...tender.description, ar: e.target.value } })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">{isRtl ? 'الوصف بالإنجليزية' : 'Description (English)'}</label>
              <textarea
                required
                rows={4}
                value={tender.description.en}
                onChange={(e) => setTender({ ...tender, description: { ...tender.description, en: e.target.value } })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">{isRtl ? 'الموعد النهائي' : 'Deadline'}</label>
                <input
                  type="datetime-local"
                  value={tender.deadline}
                  onChange={(e) => setTender({ ...tender, deadline: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">{isRtl ? 'الحالة' : 'Status'}</label>
                <select
                  value={tender.status}
                  onChange={(e) => setTender({ ...tender, status: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                >
                  <option value="open">{isRtl ? 'مفتوح' : 'Open'}</option>
                  <option value="closed">{isRtl ? 'مغلق' : 'Closed'}</option>
                </select>
              </div>
            </div>
          </div>

          {/* SEO Section */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Globe size={18} className="text-blue-600" />
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
                      value={tender.seo?.title?.ar || ''}
                      onChange={(e) => setTender({ ...tender, seo: { ...tender.seo!, title: { ...tender.seo!.title, ar: e.target.value } } })}
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
                      value={tender.seo?.description?.ar || ''}
                      onChange={(e) => setTender({ ...tender, seo: { ...tender.seo!, description: { ...tender.seo!.description, ar: e.target.value } } })}
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
                      value={tender.seo?.keywords?.ar || ''}
                      onChange={(e) => setTender({ ...tender, seo: { ...tender.seo!, keywords: { ...tender.seo!.keywords, ar: e.target.value } } })}
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
                      value={tender.seo?.title?.en || ''}
                      onChange={(e) => setTender({ ...tender, seo: { ...tender.seo!, title: { ...tender.seo!.title, en: e.target.value } } })}
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
                      value={tender.seo?.description?.en || ''}
                      onChange={(e) => setTender({ ...tender, seo: { ...tender.seo!, description: { ...tender.seo!.description, en: e.target.value } } })}
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
                      value={tender.seo?.keywords?.en || ''}
                      onChange={(e) => setTender({ ...tender, seo: { ...tender.seo!, keywords: { ...tender.seo!.keywords, en: e.target.value } } })}
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
        </div>

        {/* Sidebar/Actions */}
        <div className="space-y-6">
           <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm sticky top-8">
             <div className="flex flex-col gap-4">
              <button
                type="submit"
                disabled={saving}
                className="w-full px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg"
              >
                {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                {isRtl ? 'حفظ البيانات' : 'Save Tender'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/tenders')}
                className="w-full px-8 py-4 rounded-2xl font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-all border border-slate-100"
              >
                {isRtl ? 'المواد المعلقة' : 'Cancel'}
              </button>
             </div>
           </div>
        </div>
      </form>
    </div>
  );
};
