import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2, Loader2, Save, Quote, Star } from 'lucide-react';
import { api } from '../../services/api';

interface Testimonial {
  id: string;
  name: string;
  photo_url: string;
  role: string;
  organization: string;
  content_ar: string;
  content_en: string;
  rating: number;
  project_id: string | null;
  program_id: string | null;
  sector_id: string | null;
  createdAt?: string;
}

export default function TestimonialManager() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [sectors, setSectors] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Partial<Testimonial> | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [testimonialsRes, sectorsRes, programsRes, projectsRes] = await Promise.all([
        api.get('/api/testimonials'),
        api.get('/api/sectors').catch(() => ({ data: [] })),
        api.get('/api/programs').catch(() => ({ data: [] })),
        api.get('/api/projects').catch(() => ({ data: [] }))
      ]);

      setTestimonials(testimonialsRes.data || []);
      setSectors(sectorsRes.data || []);
      setPrograms(programsRes.data || []);
      setProjects(projectsRes.data || []);
    } catch (error) {
      console.error('Error fetching CMS testimonials elements:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTestimonial || !editingTestimonial.name) return;

    try {
      if (editingTestimonial.id) {
        await api.put(`/api/testimonials/${editingTestimonial.id}`, editingTestimonial);
      } else {
        await api.post('/api/testimonials', editingTestimonial);
      }
      setShowModal(false);
      setEditingTestimonial(null);
      fetchData();
    } catch (error) {
      console.error('Error saving testimonial:', error);
      alert('Error saving record');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(isRtl ? 'هل تريد حذف هذه الشهادة بشكل نهائي؟' : 'Are you sure you want to delete this testimonial?')) {
      try {
        await api.delete(`/api/testimonials/${id}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting testimonial:', error);
      }
    }
  };

  return (
    <div className="space-y-8" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isRtl ? 'إدارة آراء وشهادات الشركاء والمستفيدين' : 'Testimonials & Endorsements'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {isRtl
              ? 'إدارة وتقييم الشهادات المكتوبة من قبل المتدربين والشركاء والهيئات الدولية للتدليل على نزاهة وأهمية العمل وبناء المصداقية.'
              : 'Add quotes from trainees, international organisations & local partners to back credibility.'}
          </p>
        </div>
        <button
          onClick={() => {
            setEditingTestimonial({ name: '', photo_url: '', role: '', organization: '', content_ar: '', content_en: '', rating: 5, project_id: null, program_id: null, sector_id: null });
            setShowModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-blue-100 flex items-center gap-2 cursor-pointer transition-colors"
        >
          <Plus size={18} />
          {isRtl ? 'إضافة شهادة رأي جديدة' : 'Add Testimonial'}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-blue-600" size={48} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonials.map(test => {
            const linkedSector = sectors.find(s => s.id === test.sector_id);
            const linkedProg = programs.find(p => p.id === test.program_id);
            const linkedProj = projects.find(p => p.id === test.project_id);

            return (
              <div key={test.id} className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star key={idx} size={15} className={idx < (test.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
                      ))}
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingTestimonial(test);
                          setShowModal(true);
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(test.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      {test.photo_url ? (
                        <img referrerPolicy="no-referrer" src={test.photo_url} alt={test.name} className="w-12 h-12 rounded-full object-cover border border-slate-250 shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-blue-600 font-bold shrink-0">
                          <Quote size={20} />
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 leading-tight">
                          {test.name}
                        </h3>
                        <p className="text-xs text-slate-500 font-bold mt-0.5">
                          {test.role} {test.organization ? ` | ${test.organization}` : ''}
                        </p>
                      </div>
                    </div>

                    <p className="text-slate-600 text-sm leading-relaxed antialiased italic line-clamp-3">
                      “{isRtl ? test.content_ar : (test.content_en || test.content_ar)}”
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
                    <span>ID: {test.id.substring(0, 8)}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {testimonials.length === 0 && (
            <div className="col-span-full bg-slate-50 border border-dashed border-slate-300 rounded-3xl py-12 text-center text-slate-500">
              {isRtl ? 'لا توجد شهادات آراء مضافة حالياً.' : 'No testimonials or endorsements registered.'}
            </div>
          )}
        </div>
      )}

      {/* Save Modal */}
      {showModal && editingTestimonial && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                {editingTestimonial.id ? (isRtl ? 'تعديل الشهادة الرأي' : 'Edit Endorsement') : (isRtl ? 'إضافة شهادة أو تعليق جديد' : 'New Testimonial')}
              </h2>
              <button 
                onClick={() => { setShowModal(false); setEditingTestimonial(null); }}
                className="text-slate-400 hover:text-slate-600 font-bold hover:bg-slate-50 p-1.5 rounded-full"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-5 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">{isRtl ? 'اسم القائل / صاحب العبارة *' : 'Name of Endorser *'}</label>
                  <input
                    type="text"
                    required
                    value={editingTestimonial.name || ''}
                    onChange={e => setEditingTestimonial({...editingTestimonial, name: e.target.value})}
                    placeholder="مثال: د. غانم صلاح"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-900 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">{isRtl ? 'رابط الصورة الشخصية' : 'Endorser Avatar URL'}</label>
                  <input
                    type="text"
                    value={editingTestimonial.photo_url || ''}
                    onChange={e => setEditingTestimonial({...editingTestimonial, photo_url: e.target.value})}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">{isRtl ? 'الصفة الوظيفية' : 'Job Title / Designation'}</label>
                  <input
                    type="text"
                    value={editingTestimonial.role || ''}
                    onChange={e => setEditingTestimonial({...editingTestimonial, role: e.target.value})}
                    placeholder="مثال: مستشار شؤون الشرق الأوسط"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-900 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">{isRtl ? 'المنظمة / المؤسسة التابع لها' : 'Affiliation / Organization'}</label>
                  <input
                    type="text"
                    value={editingTestimonial.organization || ''}
                    onChange={e => setEditingTestimonial({...editingTestimonial, organization: e.target.value})}
                    placeholder="مثال: المفوضية السامية لحقوق الإنسان"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-900 outline-none"
                  />
                </div>
              </div>

              {/* Connected relations row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{isRtl ? 'مربوط بالقطاع' : 'Linked Sector'}</label>
                  <select
                    value={editingTestimonial.sector_id || ''}
                    onChange={e => setEditingTestimonial({...editingTestimonial, sector_id: e.target.value || null})}
                    className="w-full bg-white border border-slate-150 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                  >
                    <option value="">{isRtl ? '-- غير مربوط --' : '-- Choose sector --'}</option>
                    {sectors.map(s => (
                      <option key={s.id} value={s.id}>{isRtl ? s.name_ar : s.name_en}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{isRtl ? 'مربوط بالبرنامج' : 'Linked Program'}</label>
                  <select
                    value={editingTestimonial.program_id || ''}
                    onChange={e => setEditingTestimonial({...editingTestimonial, program_id: e.target.value || null})}
                    className="w-full bg-white border border-slate-150 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                  >
                    <option value="">{isRtl ? '-- غير مربوط --' : '-- Choose program --'}</option>
                    {programs.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{isRtl ? 'مربوط بالمشروع' : 'Linked Project'}</label>
                  <select
                    value={editingTestimonial.project_id || ''}
                    onChange={e => setEditingTestimonial({...editingTestimonial, project_id: e.target.value || null})}
                    className="w-full bg-white border border-slate-150 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                  >
                    <option value="">{isRtl ? '-- غير مربوط --' : '-- Choose project --'}</option>
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
                <label className="text-xs font-bold text-slate-700">{isRtl ? 'محتوى ونقل الرأي المكتوب (بالعربية) *' : 'Endorsement Text (Arabic) *'}</label>
                <textarea
                  rows={3}
                  required
                  value={editingTestimonial.content_ar || ''}
                  onChange={e => setEditingTestimonial({...editingTestimonial, content_ar: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-900 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">{isRtl ? 'محتوى ونقل الرأي المكتوب (بالإنجليزية)' : 'Endorsement Text (English)'}</label>
                <textarea
                  rows={3}
                  value={editingTestimonial.content_en || ''}
                  onChange={e => setEditingTestimonial({...editingTestimonial, content_en: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-900 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">{isRtl ? 'التقييم بالنجوم' : 'Star Rating'}</label>
                <select
                  value={editingTestimonial.rating || 5}
                  onChange={e => setEditingTestimonial({...editingTestimonial, rating: parseInt(e.target.value) || 5})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 outline-none"
                >
                  <option value={5}>⭐⭐⭐⭐⭐ (5/5)</option>
                  <option value={4}>⭐⭐⭐⭐ (4/5)</option>
                  <option value={3}>⭐⭐⭐ (3/5)</option>
                  <option value={2}>⭐⭐ (2/5)</option>
                  <option value={1}>⭐ (1/5)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-150 flex justify-end gap-3.5">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingTestimonial(null); }}
                  className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 text-sm cursor-pointer"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-md flex items-center gap-1 text-sm cursor-pointer"
                >
                  <Save size={16} />
                  {isRtl ? 'حفظ شهادة الرأي' : 'Save Testimonial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
