import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2, Loader2, Save, Sparkles, BookOpen, Quote } from 'lucide-react';
import { api } from '../../services/api';

interface SuccessStory {
  id: string;
  title_ar: string;
  title_en: string;
  project_id: string | null;
  program_id: string | null;
  sector_id: string | null;
  beneficiary_name: string;
  beneficiary_role: string;
  content_ar: string;
  content_en: string;
  images: string; // JSON Array or comma separated Urls
  video_url: string;
  tags: string; // JSON Array or tags
  status: 'published' | 'draft';
  createdAt?: string;
}

export default function SuccessStoryManager() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [sectors, setSectors] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStory, setEditingStory] = useState<Partial<SuccessStory> | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [storiesRes, sectorsRes, programsRes, projectsRes] = await Promise.all([
        api.get('/api/success-stories'),
        api.get('/api/sectors').catch(() => ({ data: [] })),
        api.get('/api/programs').catch(() => ({ data: [] })),
        api.get('/api/projects').catch(() => ({ data: [] }))
      ]);

      setStories(storiesRes.data || []);
      setSectors(sectorsRes.data || []);
      setPrograms(programsRes.data || []);
      setProjects(projectsRes.data || []);
    } catch (error) {
      console.error('Error fetching CMS success stories elements:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStory || !editingStory.title_ar) return;

    try {
      if (editingStory.id) {
        await api.put(`/api/success-stories/${editingStory.id}`, editingStory);
      } else {
        await api.post('/api/success-stories', editingStory);
      }
      setShowModal(false);
      setEditingStory(null);
      fetchData();
    } catch (error) {
      console.error('Error saving success story:', error);
      alert('Error saving record');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(isRtl ? 'هل تريد حذف قصة النجاح هذه بشكل نهائي؟' : 'Are you sure you want to delete this success story?')) {
      try {
        await api.delete(`/api/success-stories/${id}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting success story:', error);
      }
    }
  };

  return (
    <div className="space-y-8" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isRtl ? 'إدارة قصص النجاح والأثر الإنساني' : 'Success Stories & Impact Hub'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {isRtl
              ? 'توثيق الأثر والقصص الملهمة للمستفيدين من التدخلات، وربطها بالقطاع أو البرنامج أو المشروع المحدد.'
              : 'Add and write inspirational stories from beneficiaries. Link them back to core operations.'}
          </p>
        </div>
        <button
          onClick={() => {
            setEditingStory({ title_ar: '', title_en: '', project_id: null, program_id: null, sector_id: null, beneficiary_name: '', beneficiary_role: '', content_ar: '', content_en: '', images: '', video_url: '', tags: '', status: 'published' });
            setShowModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-blue-100 flex items-center gap-2 cursor-pointer transition-colors"
        >
          <Plus size={18} />
          {isRtl ? 'إضافة قصة نجاح ملهمة' : 'Add Success Story'}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-blue-600" size={48} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {stories.map(story => {
            const linkedSector = sectors.find(s => s.id === story.sector_id);
            const linkedProg = programs.find(p => p.id === story.program_id);
            const linkedProj = projects.find(p => p.id === story.project_id);

            return (
              <div key={story.id} className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-black px-3.5 py-1.5 rounded-full border border-blue-100 uppercase tracking-widest ${story.status === 'published' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                      {story.status === 'published' ? (isRtl ? 'نشط' : 'Published') : (isRtl ? 'مسودة' : 'Draft')}
                    </span>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingStory(story);
                          setShowModal(true);
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(story.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-blue-600 font-bold">
                        <BookOpen size={22} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 leading-tight">
                          {isRtl ? story.title_ar : (story.title_en || story.title_ar)}
                        </h3>
                        {story.beneficiary_name && (
                          <p className="text-xs text-slate-500 mt-0.5 font-bold">
                            {isRtl ? 'البطل(ة):' : 'Protagonist:'} {story.beneficiary_name} {story.beneficiary_role ? `(${story.beneficiary_role})` : ''}
                          </p>
                        )}
                      </div>
                    </div>

                    <p className="text-slate-600 text-sm leading-relaxed antialiased line-clamp-3">
                      {isRtl ? story.content_ar : (story.content_en || story.content_ar)}
                    </p>
                  </div>
                </div>

                {/* Linking tags */}
                <div className="mt-8 pt-4 border-t border-slate-100 space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {linkedSector && (
                      <span className="text-[10px] font-black bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md">
                        {isRtl ? 'القطاع:' : 'Sector:'} {linkedSector.name_ar}
                      </span>
                    )}
                    {linkedProg && (
                      <span className="text-[10px] font-black bg-purple-50 text-purple-700 px-2.5 py-1 rounded-md">
                        {isRtl ? 'البرنامج:' : 'Program:'} {linkedProg.name}
                      </span>
                    )}
                    {linkedProj && (
                      <span className="text-[10px] font-black bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md">
                        {isRtl ? 'المشروع:' : 'Project:'} {linkedProj.title ? (typeof linkedProj.title === 'string' ? linkedProj.title : JSON.parse(linkedProj.title)?.ar) : 'Linked Project'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>ID: {story.id.substring(0, 8)}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {stories.length === 0 && (
            <div className="col-span-full bg-slate-50 border border-dashed border-slate-300 rounded-3xl py-12 text-center text-slate-500">
              {isRtl ? 'لا توجد قصص نجاح مضافة حالياً.' : 'No success stories found in registry.'}
            </div>
          )}
        </div>
      )}

      {/* Save Modal */}
      {showModal && editingStory && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                {editingStory.id ? (isRtl ? 'تعديل قصة النجاح' : 'Edit Success Story') : (isRtl ? 'إضافة قصة نجاح ملهمة' : 'New Success Story')}
              </h2>
              <button 
                onClick={() => { setShowModal(false); setEditingStory(null); }}
                className="text-slate-400 hover:text-slate-600 font-bold hover:bg-slate-50 p-1.5 rounded-full"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-5 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">{isRtl ? 'العنوان الرئيسي (بالعربية) *' : 'Headline Title (Arabic) *'}</label>
                  <input
                    type="text"
                    required
                    value={editingStory.title_ar || ''}
                    onChange={e => setEditingStory({...editingStory, title_ar: e.target.value})}
                    placeholder="مثال: من النزوح لبناء منصات تقصي مرنة"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-900 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">{isRtl ? 'العنوان الرئيسي (بالإنجليزية)' : 'Headline Title (English)'}</label>
                  <input
                    type="text"
                    value={editingStory.title_en || ''}
                    onChange={e => setEditingStory({...editingStory, title_en: e.target.value})}
                    placeholder="Example: From Displacement to Platform Building"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">{isRtl ? 'اسم المستفيد / البطل الرئيسي' : 'Beneficiary Hero Name'}</label>
                  <input
                    type="text"
                    value={editingStory.beneficiary_name || ''}
                    onChange={e => setEditingStory({...editingStory, beneficiary_name: e.target.value})}
                    placeholder="مثال: رانيا جازم"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-900 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">{isRtl ? 'دور / صفة المستفيد' : 'Beneficiary Role'}</label>
                  <input
                    type="text"
                    value={editingStory.beneficiary_role || ''}
                    onChange={e => setEditingStory({...editingStory, beneficiary_role: e.target.value})}
                    placeholder="مثال: صحفية مستقلة"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-900 outline-none"
                  />
                </div>
              </div>

              {/* Linked items row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{isRtl ? 'ربط بالقطاع' : 'Link with Sector'}</label>
                  <select
                    value={editingStory.sector_id || ''}
                    onChange={e => setEditingStory({...editingStory, sector_id: e.target.value || null})}
                    className="w-full bg-white border border-slate-150 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                  >
                    <option value="">{isRtl ? '-- حدد القطاع --' : '-- Choose sector --'}</option>
                    {sectors.map(s => (
                      <option key={s.id} value={s.id}>{isRtl ? s.name_ar : s.name_en}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{isRtl ? 'ربط بالبرنامج' : 'Link with Program'}</label>
                  <select
                    value={editingStory.program_id || ''}
                    onChange={e => setEditingStory({...editingStory, program_id: e.target.value || null})}
                    className="w-full bg-white border border-slate-150 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                  >
                    <option value="">{isRtl ? '-- حدد البرنامج --' : '-- Choose program --'}</option>
                    {programs.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{isRtl ? 'ربط بالمشروع' : 'Link with Project'}</label>
                  <select
                    value={editingStory.project_id || ''}
                    onChange={e => setEditingStory({...editingStory, project_id: e.target.value || null})}
                    className="w-full bg-white border border-slate-150 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                  >
                    <option value="">{isRtl ? '-- حدد المشروع --' : '-- Choose project --'}</option>
                    {projects.map(p => {
                      const titleObj = typeof p.title === 'string' ? JSON.parse(p.title || '{}') : p.title;
                      return (
                        <option key={p.id} value={p.id}>{titleObj?.ar || p.id}</option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">{isRtl ? 'تفاصيل ونص القصة المؤثر (بالعربية) *' : 'Inspirational Narrative (Arabic) *'}</label>
                <textarea
                  rows={4}
                  required
                  value={editingStory.content_ar || ''}
                  onChange={e => setEditingStory({...editingStory, content_ar: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-900 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">{isRtl ? 'تفاصيل ونص القصة المؤثر (بالإنجليزية)' : 'Inspirational Narrative (English)'}</label>
                <textarea
                  rows={4}
                  value={editingStory.content_en || ''}
                  onChange={e => setEditingStory({...editingStory, content_en: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-900 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">{isRtl ? 'صورة معبّرة / رئيسية (رابط)' : 'Featured Photo (Link)'}</label>
                  <input
                    type="text"
                    value={editingStory.images || ''}
                    onChange={e => setEditingStory({...editingStory, images: e.target.value})}
                    placeholder="https://example.com/photo.jpg"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-905 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">{isRtl ? 'رابط ملف ملحق / فيديو وثائقي' : 'Supporting Video / YouTube Link'}</label>
                  <input
                    type="text"
                    value={editingStory.video_url || ''}
                    onChange={e => setEditingStory({...editingStory, video_url: e.target.value})}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">{isRtl ? 'حالة النشر' : 'Publish Status'}</label>
                  <select
                    value={editingStory.status || 'published'}
                    onChange={e => setEditingStory({...editingStory, status: e.target.value as any})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 outline-none"
                  >
                    <option value="published">{isRtl ? 'منشور للعامة' : 'Published'}</option>
                    <option value="draft">{isRtl ? 'مسودة للمراجعة' : 'Draft'}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">{isRtl ? 'وسوم الكواليس والكلمات الدليلية' : 'Tags (Comma Separated)'}</label>
                  <input
                    type="text"
                    value={editingStory.tags || ''}
                    onChange={e => setEditingStory({...editingStory, tags: e.target.value})}
                    placeholder="مثال: حرية الصحافة، حماية، عدن"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-150 flex justify-end gap-3.5">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingStory(null); }}
                  className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 text-sm cursor-pointer"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-md flex items-center gap-1 text-sm cursor-pointer"
                >
                  <Save size={16} />
                  {isRtl ? 'حفظ قصة النجاح' : 'Save Story'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
