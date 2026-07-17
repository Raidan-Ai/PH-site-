import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2, Loader2, Save, Sparkles, Link as LinkIcon, BookOpen, Layers } from 'lucide-react';
import { api } from '../../services/api';

interface Program {
  id: string;
  name: string;
  description: string;
  imageurl: string;
  icon: string;
  category: 'protection' | 'training' | 'media' | 'tech' | 'research';
  sector_id?: string | null;
  description_full_ar?: string;
  description_full_en?: string;
  status?: 'published' | 'draft';
  // Relational aggregates stored as JSON
  related_projects?: string; // JSON array
  related_courses?: string;  // JSON array
  related_articles?: string; // JSON array
}

export default function ProgramManager() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [programs, setPrograms] = useState<Program[]>([]);
  const [sectors, setSectors] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Partial<Program> | null>(null);

  const categories = [
    { value: 'protection', label: isRtl ? 'حماية الصحفيين والحقوق' : 'Protection' },
    { value: 'training', label: isRtl ? 'التطوير وبناء القدرات (تدريب)' : 'Training & Capacity Building' },
    { value: 'media', label: isRtl ? 'الإنتاج والنشر الإعلامي' : 'Media Production' },
    { value: 'tech', label: isRtl ? 'الحلول والابتكارات الرقمية والتقنية' : 'Digital Innovation' },
    { value: 'research', label: isRtl ? 'الأبحاث والسياسات العامة' : 'Research & Policy Studies' }
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [programsRes, sectorsRes, projectsRes, coursesRes, articlesRes] = await Promise.all([
        api.get('/api/programs'),
        api.get('/api/sectors').catch(() => ({ data: [] })),
        api.get('/api/projects').catch(() => ({ data: [] })),
        api.get('/api/courses').catch(() => ({ data: [] })),
        api.get('/api/articles').catch(() => ({ data: [] }))
      ]);

      setPrograms(programsRes.data || []);
      setSectors(sectorsRes.data || []);
      setProjects(projectsRes.data || []);
      setCourses(coursesRes.data || []);
      setArticles(articlesRes.data || []);
    } catch (error) {
      console.error('Error fetching CMS program directories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProgram || !editingProgram.name) return;

    try {
      if (editingProgram.id) {
        await api.put(`/api/programs/${editingProgram.id}`, editingProgram);
      } else {
        await api.post('/api/programs', editingProgram);
      }
      setShowModal(false);
      setEditingProgram(null);
      fetchData();
    } catch (error) {
      console.error('Error saving program:', error);
      alert('Error saving record');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(isRtl ? 'هل تريد حذف هذا البرنامج بشكل نهائي؟' : 'Are you sure you want to delete this program?')) {
      try {
        await api.delete(`/api/programs/${id}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting program:', error);
      }
    }
  };

  // Safe JSON Parsing helper
  const getArrayFromField = (field: string | undefined) => {
    if (!field) return [];
    try {
      return JSON.parse(field);
    } catch {
      return [];
    }
  };

  return (
    <div className="space-y-8" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isRtl ? 'إدارة البرامج التخصصية' : 'Institutional Programs Hub'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {isRtl
              ? 'إنشاء البرامج الإعلامية والتنموية، وربطها بالمشاريع، والدورات النشطة، والتقارير الصحفية.'
              : 'Add Core Institutional Portfolios. Bind them to related projects, training, and releases.'}
          </p>
        </div>
        <button
          onClick={() => {
            setEditingProgram({ name: '', description: '', icon: 'Sparkles', category: 'training', imageurl: '' });
            setShowModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-blue-100 flex items-center gap-2 cursor-pointer transition-colors"
        >
          <Plus size={18} />
          {isRtl ? 'برنامج مؤسسي جديد' : 'Add New Program'}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-blue-600" size={48} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {programs.map(prog => (
            <div key={prog.id} className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-800 text-xs font-black px-3.5 py-1.5 rounded-full border border-blue-100 uppercase tracking-widest">
                    {categories.find(c => c.value === prog.category)?.label || prog.category}
                  </span>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingProgram(prog);
                        setShowModal(true);
                      }}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(prog.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-blue-600 font-bold">
                      <Layers size={22} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 leading-tight">
                        {prog.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5 font-mono">ID: {prog.id.substring(0, 8)}</p>
                    </div>
                  </div>

                  <p className="text-slate-600 text-sm leading-relaxed antialiased">
                    {prog.description || (isRtl ? 'لا يوجد وصف مضاف لهذا البرنامج.' : 'No description specified for this program.')}
                  </p>
                </div>
              </div>

              {/* Connected / Relations block */}
              <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-50/50 p-2.5 rounded-2xl border border-slate-100">
                  <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-widest">{isRtl ? 'مشاريع' : 'Projects'}</span>
                  <p className="text-lg font-black text-slate-800 font-mono mt-0.5">
                    {getArrayFromField(prog.related_projects).length || 0}
                  </p>
                </div>
                <div className="bg-slate-50/50 p-2.5 rounded-2xl border border-slate-100">
                  <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-widest">{isRtl ? 'دورات' : 'Courses'}</span>
                  <p className="text-lg font-black text-slate-800 font-mono mt-0.5">
                    {getArrayFromField(prog.related_courses).length || 0}
                  </p>
                </div>
                <div className="bg-slate-50/50 p-2.5 rounded-2xl border border-slate-100">
                  <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-widest">{isRtl ? 'تقارير' : 'Reports'}</span>
                  <p className="text-lg font-black text-slate-800 font-mono mt-0.5">
                    {getArrayFromField(prog.related_articles).length || 0}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {programs.length === 0 && (
            <div className="col-span-full border-2 border-dashed border-slate-200 p-16 text-center rounded-[32px] text-slate-400">
              {isRtl ? 'لم يتم العثور على برامج مؤسسية مسجلة.' : 'No institutional programs configured yet.'}
            </div>
          )}
        </div>
      )}

      {/* Program Modal Form */}
      {showModal && editingProgram && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-950">
                {editingProgram.id ? (isRtl ? 'تعديل البرنامج التخصصي' : 'Edit Institutional Program') : (isRtl ? 'تسجيل برنامج رئيسي جديد' : 'New Strategic Program')}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-800 font-bold text-xl">&times;</button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-start overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">اسم البرنامج المؤسسي</label>
                <input
                  type="text"
                  required
                  value={editingProgram.name || ''}
                  onChange={e => setEditingProgram({ ...editingProgram, name: e.target.value })}
                  placeholder="e.g. Journalists Advocacy and Assistance Program"
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none text-sm font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">الرتبة / التصنيف</label>
                  <select
                    value={editingProgram.category || 'training'}
                    onChange={e => setEditingProgram({ ...editingProgram, category: e.target.value as any })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none text-sm bg-white font-medium"
                  >
                    {categories.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">الأيقونة (Icon class/name)</label>
                  <input
                    type="text"
                    value={editingProgram.icon || 'Sparkles'}
                    onChange={e => setEditingProgram({ ...editingProgram, icon: e.target.value })}
                    placeholder="e.g. Shield, Scale, Mail"
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none text-sm font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{isRtl ? 'القطاع المرتبط' : 'Linked Sector'}</label>
                  <select
                    value={editingProgram.sector_id || ''}
                    onChange={e => setEditingProgram({ ...editingProgram, sector_id: e.target.value || null })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none text-sm bg-white font-medium"
                  >
                    <option value="">{isRtl ? '-- حدد القطاع التابع --' : '-- Choose sector --'}</option>
                    {sectors.map(s => (
                      <option key={s.id} value={s.id}>{isRtl ? s.name_ar : s.name_en}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{isRtl ? 'حالة النشر' : 'Publish Status'}</label>
                  <select
                    value={editingProgram.status || 'published'}
                    onChange={e => setEditingProgram({ ...editingProgram, status: e.target.value as any })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none text-sm bg-white font-medium"
                  >
                    <option value="published">{isRtl ? 'نشط / منشور' : 'Active'}</option>
                    <option value="draft">{isRtl ? 'مسودة' : 'Draft'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">روبط الصورة الترويجية للبرنامج (Image URL)</label>
                <input
                  type="text"
                  value={editingProgram.imageurl || ''}
                  onChange={e => setEditingProgram({ ...editingProgram, imageurl: e.target.value })}
                  placeholder="https://example.com/program.jpg"
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">التفاصيل والوصف التخصصي / الأهداف الرئيسية</label>
                <textarea
                  value={editingProgram.description || ''}
                  onChange={e => setEditingProgram({ ...editingProgram, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{isRtl ? 'التفاصيل الكلية بالموقع (بالعربية)' : 'Full Details (Arabic)'}</label>
                  <textarea
                    value={editingProgram.description_full_ar || ''}
                    onChange={e => setEditingProgram({ ...editingProgram, description_full_ar: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{isRtl ? 'التفاصيل الكلية بالموقع (بالإنجليزية)' : 'Full Details (English)'}</label>
                  <textarea
                    value={editingProgram.description_full_en || ''}
                    onChange={e => setEditingProgram({ ...editingProgram, description_full_en: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none text-sm"
                  />
                </div>
              </div>

              {/* Simple Dynamic mock relations configuration fields */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold uppercase text-slate-600 border-b pb-1.5 flex items-center gap-1.5">
                  <LinkIcon size={12} />
                  {isRtl ? 'ربط العلاقات والمشاريع التراكمية' : 'Relational CMS Association'}
                </h4>
                <div className="space-y-2 text-xs">
                  <p className="text-[10px] text-slate-400">
                    {isRtl ? 'اربط هذا البرنامج بصيغ العلاقات من خلال إضافة معرفات الكيانات.' : 'Use JSON arrays of IDs (e.g. ["id-1", "id-2"]) to establish deep CMS graphs.'}
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">المشاريع المرتبطة (الأرقام المعرفية كـ JSON)</label>
                      <input
                        type="text"
                        value={editingProgram.related_projects || '[]'}
                        onChange={e => setEditingProgram({ ...editingProgram, related_projects: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-mono text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">الدورات الترويجية (الأرقام المعرفية كـ JSON)</label>
                      <input
                        type="text"
                        value={editingProgram.related_courses || '[]'}
                        onChange={e => setEditingProgram({ ...editingProgram, related_courses: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-mono text-xs bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-sm cursor-pointer"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm cursor-pointer"
                >
                  {isRtl ? 'حفظ البرنامج' : 'Save Program'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
