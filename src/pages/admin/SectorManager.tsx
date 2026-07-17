import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2, Loader2, Save, Sparkles, Folder, SortAsc } from 'lucide-react';
import { api } from '../../services/api';

interface Sector {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  image: string;
  icon: string;
  color: string;
  sort_order: number;
  status: 'published' | 'draft';
}

export default function SectorManager() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSector, setEditingSector] = useState<Partial<Sector> | null>(null);

  const fetchSectors = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/sectors');
      setSectors(res.data || []);
    } catch (error) {
      console.error('Error fetching CMS sectors:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSectors();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSector || !editingSector.name_ar) return;

    try {
      if (editingSector.id) {
        await api.put(`/api/sectors/${editingSector.id}`, editingSector);
      } else {
        await api.post('/api/sectors', editingSector);
      }
      setShowModal(false);
      setEditingSector(null);
      fetchSectors();
    } catch (error) {
      console.error('Error saving sector:', error);
      alert('Error saving record');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(isRtl ? 'هل تريد حذف هذا القطاع بشكل نهائي؟' : 'Are you sure you want to delete this sector?')) {
      try {
        await api.delete(`/api/sectors/${id}`);
        fetchSectors();
      } catch (error) {
        console.error('Error deleting sector:', error);
      }
    }
  };

  return (
    <div className="space-y-8" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isRtl ? 'إدارة قطاعات التدخل' : 'Sectors of Intervention'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {isRtl
              ? 'تعتبر القطاعات هي المحاور الأساسية للتدخل والموجه الاستراتيجي للمشاريع والبرامج والمحتوى.'
              : 'Add Core Institutional Sectors. Bind them to related programs and articles.'}
          </p>
        </div>
        <button
          onClick={() => {
            setEditingSector({ name_ar: '', name_en: '', description_ar: '', description_en: '', icon: 'Folder', color: '#2563eb', sort_order: 0, status: 'published', image: '' });
            setShowModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-blue-100 flex items-center gap-2 cursor-pointer transition-colors"
        >
          <Plus size={18} />
          {isRtl ? 'إضافة قطاع جديد' : 'Add New Sector'}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-blue-600" size={48} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {sectors.map(sec => (
            <div key={sec.id} className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-black px-3.5 py-1.5 rounded-full border border-blue-100 uppercase tracking-widest ${sec.status === 'published' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                    {sec.status === 'published' ? (isRtl ? 'نشط' : 'Published') : (isRtl ? 'مسودة' : 'Draft')}
                  </span>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingSector(sec);
                        setShowModal(true);
                      }}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(sec.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold shadow-md" style={{ backgroundColor: sec.color || '#3b82f6' }}>
                      <Folder size={22} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 leading-tight">
                        {isRtl ? sec.name_ar : (sec.name_en || sec.name_ar)}
                      </h3>
                      {isRtl && sec.name_en && (
                        <p className="text-xs text-slate-400 font-medium mt-0.5">{sec.name_en}</p>
                      )}
                    </div>
                  </div>

                  <p className="text-slate-600 text-sm leading-relaxed antialiased">
                    {isRtl 
                      ? (sec.description_ar || 'لا يوجد وصف مضاف باللغة العربية.')
                      : (sec.description_en || sec.description_ar || 'No description found.')}
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-semibold font-mono">
                <div className="flex items-center gap-1.5">
                  <SortAsc size={14} className="text-slate-400" />
                  <span>{isRtl ? 'الترتيب الفرعي:' : 'Sort order:'} {sec.sort_order}</span>
                </div>
                <span>ID: {sec.id.substring(0, 8)}</span>
              </div>
            </div>
          ))}

          {sectors.length === 0 && (
            <div className="col-span-full bg-slate-50 border border-dashed border-slate-300 rounded-3xl py-12 text-center text-slate-500">
              {isRtl ? 'لا توجد قطاعات مضافة حالياً.' : 'No sectors of intervention active.'}
            </div>
          )}
        </div>
      )}

      {/* Save Modal */}
      {showModal && editingSector && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                {editingSector.id ? (isRtl ? 'تعديل بيانات القطاع' : 'Edit Sector Info') : (isRtl ? 'إضافة قطاع تدخل جديد' : 'New Intervention Sector')}
              </h2>
              <button 
                onClick={() => { setShowModal(false); setEditingSector(null); }}
                className="text-slate-400 hover:text-slate-600 font-bold hover:bg-slate-50 p-1.5 rounded-full"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-5 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">{isRtl ? 'الاسم (بالعربية) *' : 'Name (Arabic) *'}</label>
                  <input
                    type="text"
                    required
                    value={editingSector.name_ar || ''}
                    onChange={e => setEditingSector({...editingSector, name_ar: e.target.value})}
                    placeholder="مثال: حرية الإعلام وتقلبات المناصرة"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-900 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">{isRtl ? 'الاسم (بالإنجليزية)' : 'Name (English)'}</label>
                  <input
                    type="text"
                    value={editingSector.name_en || ''}
                    onChange={e => setEditingSector({...editingSector, name_en: e.target.value})}
                    placeholder="Example: Press Freedom & Advocacy"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">{isRtl ? 'الوصف الترويجي القصير (بالعربية)' : 'Description (Arabic)'}</label>
                <textarea
                  rows={3}
                  value={editingSector.description_ar || ''}
                  onChange={e => setEditingSector({...editingSector, description_ar: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-900 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">{isRtl ? 'الوصف الترويجي القصير (بالإنجليزية)' : 'Description (English)'}</label>
                <textarea
                  rows={3}
                  value={editingSector.description_en || ''}
                  onChange={e => setEditingSector({...editingSector, description_en: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-900 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">{isRtl ? 'اللون التميزي' : 'Theme Color'}</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={editingSector.color || '#2563eb'}
                      onChange={e => setEditingSector({...editingSector, color: e.target.value})}
                      className="w-12 h-10 border border-slate-200 rounded-xl p-1 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={editingSector.color || ''}
                      onChange={e => setEditingSector({...editingSector, color: e.target.value})}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">{isRtl ? 'ترتيب الظهور' : 'Sort Order'}</label>
                  <input
                    type="number"
                    value={editingSector.sort_order || 0}
                    onChange={e => setEditingSector({...editingSector, sort_order: parseInt(e.target.value) || 0})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">{isRtl ? 'حالة النشر' : 'Status'}</label>
                  <select
                    value={editingSector.status || 'published'}
                    onChange={e => setEditingSector({...editingSector, status: e.target.value as any})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 outline-none"
                  >
                    <option value="published">{isRtl ? 'نشط / منشور في الموقع' : 'Active / Published'}</option>
                    <option value="draft">{isRtl ? 'مسودة مخفية' : 'Draft / Hidden'}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">{isRtl ? 'صورة ترويجية للقطاع' : 'Sector Image Link'}</label>
                  <input
                    type="text"
                    value={editingSector.image || ''}
                    onChange={e => setEditingSector({...editingSector, image: e.target.value})}
                    placeholder="https://example.com/image.jpg"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-150 flex justify-end gap-3.5">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingSector(null); }}
                  className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 text-sm cursor-pointer"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-md flex items-center gap-1 text-sm cursor-pointer"
                >
                  <Save size={16} />
                  {isRtl ? 'حفظ البيانات' : 'Save Sector'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
