import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, Save, Trash2, Plus, Globe, Wand2, ArrowLeft, Sparkles } from 'lucide-react';
import { api } from '../../services/api';
import { Event } from '../../types';

export default function EventEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Partial<Event>>({
    title: { ar: '', en: '' },
    description: { ar: '', en: '' },
    date: '',
    location: { ar: '', en: '' },
    imageUrl: '',
    status: 'upcoming',
    show_in_slider: false,
    slider_caption: { ar: '', en: '' },
    slider_button_text: { ar: '', en: '' },
    slider_image: '',
    media: [],
    videos: []
  });
  const [newVideo, setNewVideo] = useState({ title: '', url: '' });
  const [loading, setLoading] = useState(false);
  const [translating, setTranslating] = useState(false);

  const [generatingSeo, setGeneratingSeo] = useState(false);
  const handleGenerateSmartSEO = async () => {
    setGeneratingSeo(true);
    try {
      const { generateSeoMetadata } = await import('../../services/AIService');
      const data = await generateSeoMetadata(event.title, event.description);
      if (data) {
        setEvent(prev => ({
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
    } finally {
      setGeneratingSeo(false);
    }
  };

  const handleTranslateSEO = async (field: 'title' | 'description' | 'keywords', sourceLang: 'ar' | 'en') => {
    const textToTranslate = event.seo?.[field]?.[sourceLang];
    if (!textToTranslate) return;

    setTranslating(true);
    try {
      const targetLang = sourceLang === 'ar' ? 'en' : 'ar';
      const { translateText } = await import('../../services/AIService');
      const translated = await translateText(textToTranslate, targetLang);
      
      setEvent({ 
        ...event, 
        seo: { 
          ...event.seo!, 
          [field]: { 
            ...(event.seo?.[field] || { ar: '', en: '' }), 
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

  const isRtl = true; // Use simple flag as i18n not explicitly checked here but is used in other pages

  const [sectors, setSectors] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    // Fetch sectors, programs, projects
    api.get('/api/sectors').then(res => setSectors(res.data || [])).catch(() => {});
    api.get('/api/programs').then(res => setPrograms(res.data || [])).catch(() => {});
    api.get('/api/projects').then(res => setProjects(res.data || [])).catch(() => {});

    if (id && id !== 'new') {
      fetchEvent();
    }
  }, [id]);

  const fetchEvent = async () => {
    try {
      const res = await api.get('/api/events');
      const data = res.data.find((e: any) => String(e.id) === String(id));
      if (data) {
        setEvent({
          ...data,
          title: typeof data.title === 'string' ? JSON.parse(data.title) : data.title,
          description: typeof data.description === 'string' ? JSON.parse(data.description) : data.description,
          show_in_slider: data.show_in_slider === 1 || data.show_in_slider === true,
          slider_caption: typeof data.slider_caption === 'string' ? JSON.parse(data.slider_caption) : (data.slider_caption || {ar: '', en: ''}),
          slider_button_text: typeof data.slider_button_text === 'string' ? JSON.parse(data.slider_button_text) : (data.slider_button_text || {ar: '', en: ''}),
          date: data.event_date ? new Date(data.event_date).toISOString().split('T')[0] : '',
          location: typeof data.location === 'string' ? JSON.parse(data.location) : data.location,
          media: typeof data.media === 'string' ? JSON.parse(data.media) : data.media,
          videos: typeof data.videos === 'string' ? JSON.parse(data.videos) : (data.videos || []),
          seo: typeof data.seo === 'string' ? JSON.parse(data.seo) : (data.seo || { title: { ar: '', en: '' }, description: { ar: '', en: '' }, keywords: { ar: '', en: '' } })
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const eventData = { ...event, event_date: event.date };
      
      if (id === 'new') {
        await api.post('/api/events', eventData);
      } else {
        await api.put(`/api/events/${id}`, eventData);
      }
      
      navigate('/admin/events');
    } catch (error) {
      alert("Error saving event");
    } finally {
      setLoading(false);
    }
  };

  const addVideo = () => {
    if (newVideo.title && newVideo.url) {
      setEvent({ ...event, videos: [...(event.videos || []), newVideo] });
      setNewVideo({ title: '', url: '' });
    }
  };

  const removeVideo = (index: number) => {
    setEvent({ ...event, videos: event.videos?.filter((_, i) => i !== index) });
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in-50">
      <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-150">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          {id === 'new' ? 'Add Event / الفعاليات' : 'Edit Event / تعديل فعالية'}
        </h1>
        <button type="button" onClick={() => navigate('/admin/events')} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-xl text-xs font-bold transition-colors">
          &larr; Back to Events
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[32px] border border-slate-200 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 block">العنوان الفرعي بالعربية</label>
            <input type="text" placeholder="Title (AR)" required value={event.title?.ar || ''} onChange={e => setEvent({...event, title: {...event.title || { ar: '', en: '' }, ar: e.target.value}})} className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 block">Title (EN)</label>
            <input type="text" placeholder="Title (EN)" value={event.title?.en || ''} onChange={e => setEvent({...event, title: {...event.title || { ar: '', en: '' }, en: e.target.value}})} className="w-full p-3 rounded-xl border border-slate-200 text-sm outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 block">الوصف والتفاصيل بالعربية</label>
            <textarea placeholder="Description (AR)" rows={3} value={event.description?.ar || ''} onChange={e => setEvent({...event, description: {...event.description || { ar: '', en: '' }, ar: e.target.value}})} className="w-full p-3 rounded-xl border border-slate-200 text-sm outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 block">Description (EN)</label>
            <textarea placeholder="Description (EN)" rows={3} value={event.description?.en || ''} onChange={e => setEvent({...event, description: {...event.description || { ar: '', en: '' }, en: e.target.value}})} className="w-full p-3 rounded-xl border border-slate-200 text-sm outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 block">تاريخ الفعالية</label>
            <input type="date" value={event.date} onChange={e => setEvent({...event, date: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 text-sm outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 block">الجهة / الموقع الجغرافي (AR)</label>
            <input type="text" placeholder="Location (AR)" value={event.location?.ar || ''} onChange={e => setEvent({...event, location: {...event.location || { ar: '', en: '' }, ar: e.target.value}})} className="w-full p-3 rounded-xl border border-slate-200 text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 block">Location (EN)</label>
            <input type="text" placeholder="Location (EN)" value={event.location?.en || ''} onChange={e => setEvent({...event, location: {...event.location || { ar: '', en: '' }, en: e.target.value}})} className="w-full p-3 rounded-xl border border-slate-200 text-sm" />
          </div>
        </div>

        {/* Dynamic relational drop-down selections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-150">
          <div className="space-y-1">
            <label className="text-xs font-extrabold text-slate-600 block">ربط بالقطاع الاستراتيجي</label>
            <select
              value={event.sector_id || ''}
              onChange={e => setEvent({ ...event, sector_id: e.target.value || null })}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">-- اختر القطاع --</option>
              {sectors.map(sec => (
                <option key={sec.id} value={sec.id}>{sec.name_ar}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-extrabold text-slate-600 block">ربط بالبرنامج الفرعي</label>
            <select
              value={event.program_id || ''}
              onChange={e => setEvent({ ...event, program_id: e.target.value || null })}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">-- اختر البرنامج --</option>
              {programs.map(prog => (
                <option key={prog.id} value={prog.id}>{prog.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-extrabold text-slate-600 block">ربط بمشروع محدد</label>
            <select
              value={event.project_id || ''}
              onChange={e => setEvent({ ...event, project_id: e.target.value || null })}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">-- اختر المشروع --</option>
              {projects.map(p => {
                const titleObject = typeof p.title === 'string' ? JSON.parse(p.title || '{}') : p.title;
                return (
                  <option key={p.id} value={p.id}>{titleObject?.ar || p.id}</option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Slider Settings */}
        <div className="pt-4 border-t space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg">Hero Slider Settings</h2>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={event.show_in_slider}
                onChange={(e) => setEvent({...event, show_in_slider: e.target.checked})}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {event.show_in_slider && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 animate-in fade-in slide-in-from-top-2">
              <input type="text" placeholder="Slider Image URL" value={event.slider_image} onChange={e => setEvent({...event, slider_image: e.target.value})} className="p-3 rounded-xl border border-slate-200 md:col-span-2" />
              <input type="text" placeholder="Caption (AR)" value={event.slider_caption?.ar} onChange={e => setEvent({...event, slider_caption: {...event.slider_caption!, ar: e.target.value}})} className="p-3 rounded-xl border border-slate-200" />
              <input type="text" placeholder="Caption (EN)" value={event.slider_caption?.en} onChange={e => setEvent({...event, slider_caption: {...event.slider_caption!, en: e.target.value}})} className="p-3 rounded-xl border border-slate-200" />
              <input type="text" placeholder="Button Text (AR)" value={event.slider_button_text?.ar} onChange={e => setEvent({...event, slider_button_text: {...event.slider_button_text!, ar: e.target.value}})} className="p-3 rounded-xl border border-slate-200" />
              <input type="text" placeholder="Button Text (EN)" value={event.slider_button_text?.en} onChange={e => setEvent({...event, slider_button_text: {...event.slider_button_text!, en: e.target.value}})} className="p-3 rounded-xl border border-slate-200" />
            </div>
          )}
        </div>

        {/* Video Management Section */}
        <div className="pt-4 border-t space-y-3">
          <h2 className="font-bold text-lg">Videos</h2>
          {event.videos?.map((video, index) => (
            <div key={index} className="flex gap-2 items-center bg-slate-50 p-2 rounded-xl">
              <span className="flex-1 font-bold">{video.title}</span>
              <span className="flex-1 text-sm text-slate-500 truncate">{video.url}</span>
              <button type="button" onClick={() => removeVideo(index)} className="p-2 text-red-600"><Trash2 size={18} /></button>
            </div>
          ))}
          <div className="flex gap-2 p-2 bg-slate-100 rounded-xl">
            <input type="text" placeholder="Title" value={newVideo.title} onChange={e => setNewVideo({...newVideo, title: e.target.value})} className="p-2 rounded-lg flex-1" />
            <input type="text" placeholder="URL" value={newVideo.url} onChange={e => setNewVideo({...newVideo, url: e.target.value})} className="p-2 rounded-lg flex-1" />
            <button type="button" onClick={addVideo} className="bg-emerald-600 text-white p-2 rounded-lg"><Plus size={20} /></button>
          </div>
        </div>

        {/* SEO Settings */}
        <div className="pt-4 border-t space-y-6 text-start">
          <div className="flex justify-between items-center flex-wrap gap-2 border-b border-slate-100 pb-3">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Globe className="text-blue-600" size={20} />
              {isRtl ? 'تحسين محركات البحث والكلمات الدليليّة (SEO)' : 'SEO Metadata Optimizations'}
            </h2>
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
            <div className="space-y-4" dir="rtl">
              <h4 className="font-bold text-slate-600 text-sm border-b pb-2">العربية</h4>
              <div className="space-y-3">
                <div className="relative">
                  <input type="text" placeholder="عنوان الميتا" value={event.seo?.title?.ar || ''} onChange={e => setEvent({...event, seo: {...event.seo!, title: {...event.seo!.title, ar: e.target.value}}})} className="w-full p-3 pr-10 rounded-xl border border-slate-200" />
                  <button type="button" onClick={() => handleTranslateSEO('title', 'ar')} className="absolute right-3 top-3.5 text-slate-400">
                    {translating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                  </button>
                </div>
                <div className="relative">
                  <textarea placeholder="وصف الميتا" rows={3} value={event.seo?.description?.ar || ''} onChange={e => setEvent({...event, seo: {...event.seo!, description: {...event.seo!.description, ar: e.target.value}}})} className="w-full p-3 pr-10 rounded-xl border border-slate-200 resize-none" />
                  <button type="button" onClick={() => handleTranslateSEO('description', 'ar')} className="absolute right-3 top-3.5 text-slate-400">
                    {translating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-bold text-slate-600 text-sm border-b pb-2">English</h4>
              <div className="space-y-3">
                <div className="relative">
                  <input type="text" placeholder="Meta Title" value={event.seo?.title?.en || ''} onChange={e => setEvent({...event, seo: {...event.seo!, title: {...event.seo!.title, en: e.target.value}}})} className="w-full p-3 pl-10 rounded-xl border border-slate-200" />
                  <button type="button" onClick={() => handleTranslateSEO('title', 'en')} className="absolute left-3 top-3.5 text-slate-400">
                    {translating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                  </button>
                </div>
                <div className="relative">
                  <textarea placeholder="Meta Description" rows={3} value={event.seo?.description?.en || ''} onChange={e => setEvent({...event, seo: {...event.seo!, description: {...event.seo!.description, en: e.target.value}}})} className="w-full p-3 pl-10 rounded-xl border border-slate-200 resize-none" />
                  <button type="button" onClick={() => handleTranslateSEO('description', 'en')} className="absolute left-3 top-3.5 text-slate-400">
                    {translating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2">
          {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />} Save
        </button>
      </form>
    </div>
  );
}
