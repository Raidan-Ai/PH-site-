import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Menu, Plus, Trash2, Edit, Save, 
  X, Loader2, GripVertical, Link as LinkIcon,
  Layout, LayoutGrid, ArrowDown, ArrowUp,
  Type, CheckCircle2, AlertCircle, ExternalLink
} from 'lucide-react';
import { api } from '../../services/api';

interface MenuItem {
  id?: number;
  location: 'dock' | 'footer';
  title: { ar: string; en: string };
  icon: string;
  path: string;
  isActive: boolean;
  order: number;
}

export default function MenuManager() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<MenuItem>({
    location: 'dock',
    title: { ar: '', en: '' },
    icon: 'Home',
    path: '/',
    isActive: true,
    order: 0
  });

  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/menus');
      const data = (Array.isArray(response.data) ? response.data : []).map((m: any) => ({
        ...m,
        title: typeof m.title === 'string' ? JSON.parse(m.title) : m.title,
        isActive: m.isActive === 1 || m.isActive === true
      }));
      setMenus(data);
    } catch (error) {
      console.error("Error fetching menus:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await api.put(`/api/menus/${editingId}`, formData);
      } else {
        await api.post('/api/menus', { ...formData, order: menus.length });
      }
      setIsAdding(false);
      setEditingId(null);
      fetchMenus();
    } catch (error) {
      console.error("Error saving menu:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(isRtl ? 'هل أنت متأكد؟' : 'Are you sure?')) return;
    try {
      await api.delete(`/api/menus/${id}`);
      fetchMenus();
    } catch (error) {
      console.error("Error deleting menu:", error);
    }
  };

  const startEdit = (item: MenuItem) => {
    setFormData(item);
    setEditingId(item.id!);
    setIsAdding(true);
  };

  const moveOrder = async (id: number, direction: 'up' | 'down') => {
    // Basic ordering logic could be improved, for now just simple
    const idx = menus.findIndex(m => m.id === id);
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === menus.length - 1) return;

    const newMenus = [...menus];
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    [newMenus[idx], newMenus[swapIdx]] = [newMenus[swapIdx], newMenus[idx]];
    
    // Save new order
    setMenus(newMenus);
    try {
      await Promise.all(newMenus.map((m, i) => api.put(`/api/menus/${m.id}`, { ...m, order: i })));
    } catch (e) {
      console.error("Error updating order:", e);
    }
  };

  const dockMenus = menus.filter(m => m.location === 'dock');
  const footerMenus = menus.filter(m => m.location === 'footer');

  return (
    <div className="space-y-8 pb-24">
      <div className="flex justify-between items-center bg-white p-8 rounded-[40px] border border-slate-200">
        <div>
          <h1 className="text-3xl font-black text-slate-900 leading-tight">
            {isRtl ? 'إدارة القوائم والروابط' : 'Menu & Link Management'}
          </h1>
          <p className="text-slate-500 font-medium mt-2">
            {isRtl ? 'تخصيص أيقونات الشريط السفلي وروابط الفوتر' : 'Customize Bottom Dock icons and Footer links'}
          </p>
        </div>
        <button 
          onClick={() => { 
            setIsAdding(true); 
            setEditingId(null); 
            setFormData({ location: 'dock', title: { ar: '', en: '' }, icon: 'Link', path: '/', isActive: true, order: 0 });
          }}
          className="flex items-center gap-3 px-6 py-4 bg-blue-600 text-white rounded-[24px] font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
        >
          <Plus size={18} />
          {isRtl ? 'إضافة رابط جديد' : 'Add New Link'}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-10 rounded-[48px] border-4 border-blue-50 shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-2xl font-black text-slate-900">{editingId ? (isRtl ? 'تعديل الرابط' : 'Edit Link') : (isRtl ? 'إضافة رابط جديد' : 'Add New Link')}</h3>
            <button onClick={() => setIsAdding(false)} className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"><X size={24} /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{isRtl ? 'الموقع' : 'Location'}</label>
              <div className="flex gap-4 p-2 bg-slate-50 rounded-2xl border border-slate-100">
                <button 
                  onClick={() => setFormData({...formData, location: 'dock'})}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${formData.location === 'dock' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-500'}`}
                >
                  {isRtl ? 'الشريط السفلي' : 'Bottom Dock'}
                </button>
                <button 
                  onClick={() => setFormData({...formData, location: 'footer'})}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${formData.location === 'footer' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-500'}`}
                >
                  {isRtl ? 'الفوتر (تذييل)' : 'Footer'}
                </button>
              </div>
            </div>

            <div className="space-y-4 text-start">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{isRtl ? 'أيقونة القائمة المنسدلة' : 'Icon Representation'}</label>
              <select 
                value={formData.icon}
                onChange={(e) => setFormData({...formData, icon: e.target.value})}
                className="w-full px-6 py-4 rounded-2xl bg-slate-100 border-none focus:ring-4 focus:ring-blue-100 outline-none text-sm font-bold bg-white"
              >
                <option value="Home">{isRtl ? '🏠 الرئيسية (Home)' : 'Home'}</option>
                <option value="Info">{isRtl ? 'ℹ️ من نحن وهوية المؤسسة (Info)' : 'About Us'}</option>
                <option value="Newspaper">{isRtl ? '📰 الأخبار والتقارير الاستقصائية (Newspaper)' : 'News & Investigations'}</option>
                <option value="ShieldAlert">{isRtl ? '🛡️ رصد الحريات والانتهاكات الصحفية (ShieldAlert)' : 'Press Liberties & Violations'}</option>
                <option value="GraduationCap">{isRtl ? '🎓 أكاديمية بيت الصحافة للتطوير (GraduationCap)' : 'Training Academy'}</option>
                <option value="MessageSquare">{isRtl ? '💬 منتدى الصحفيين والمدونات (MessageSquare)' : 'Press Forum'}</option>
                <option value="Briefcase">{isRtl ? '💼 رصد وطلب فرص العمل والتوظيف (Briefcase)' : 'Careers & Vacancies'}</option>
                <option value="FileText">{isRtl ? '📄 المناقصات والملفات والمشتريات (FileText)' : 'Tenders & Documents'}</option>
                <option value="Mail">{isRtl ? '✉️ النشرة البريدية والتواصل (Mail)' : 'Newsletter & Contact'}</option>
                <option value="Calendar">{isRtl ? '📅 الفعاليات والمؤتمرات والندوات (Calendar)' : 'Seminars & Events'}</option>
                <option value="Globe">{isRtl ? '🌐 الروابط الخارجية والإنجليزية (Globe)' : 'External/Global Link'}</option>
                <option value="Link">{isRtl ? '🔗 رابط إضافي مخصص (Link)' : 'Custom Link Icon'}</option>
              </select>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{isRtl ? 'العنوان (عربي)' : 'Title (Arabic)'}</label>
              <input 
                type="text"
                value={formData.title.ar}
                onChange={(e) => setFormData({...formData, title: { ...formData.title, ar: e.target.value }})}
                className="w-full px-6 py-4 rounded-2xl bg-slate-100 border-none focus:ring-4 focus:ring-blue-100 transition-all font-bold"
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{isRtl ? 'العنوان (انجليزي)' : 'Title (English)'}</label>
              <input 
                type="text"
                value={formData.title.en}
                onChange={(e) => setFormData({...formData, title: { ...formData.title, en: e.target.value }})}
                className="w-full px-6 py-4 rounded-2xl bg-slate-100 border-none focus:ring-4 focus:ring-blue-100 transition-all font-bold"
              />
            </div>

            <div className="space-y-4 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{isRtl ? 'المسار (Link)' : 'Path (Link)'}</label>
              <input 
                type="text"
                value={formData.path}
                onChange={(e) => setFormData({...formData, path: e.target.value})}
                className="w-full px-6 py-4 rounded-2xl bg-slate-100 border-none focus:ring-4 focus:ring-blue-100 transition-all font-bold"
                placeholder="/academy, https://..."
              />
            </div>

            <div className="md:col-span-2 flex justify-end gap-4 mt-6">
              <button 
                onClick={handleSave}
                className="flex items-center gap-3 px-10 py-5 bg-blue-600 text-white rounded-3xl font-black uppercase tracking-[0.2em] text-xs hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
              >
                <Save size={18} />
                {isRtl ? 'حفظ التغييرات' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Dock Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layout size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">{isRtl ? 'أيقونات الشريط السفلي' : 'Bottom Dock Icons'}</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Bottom Navigation Bar</p>
            </div>
          </div>

          <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm">
            {dockMenus.length === 0 ? (
              <div className="p-20 text-center text-slate-400 font-bold">{isRtl ? 'لا يوجد روابط' : 'No links found'}</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {dockMenus.map((item, idx) => (
                  <div key={item.id} className="p-6 flex items-center gap-6 hover:bg-slate-50 transition-colors group">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm group-hover:scale-110 transition-transform">
                      <LinkIcon size={20} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-slate-900">{isRtl ? item.title.ar : item.title.en}</h4>
                      <p className="text-xs text-slate-400 font-mono mt-1">{item.path}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => moveOrder(item.id!, 'up')} className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><ArrowUp size={16} /></button>
                      <button onClick={() => moveOrder(item.id!, 'down')} className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><ArrowDown size={16} /></button>
                      <button onClick={() => startEdit(item)} className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"><Edit size={16} /></button>
                      <button onClick={() => handleDelete(item.id!)} className="p-2 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <LayoutGrid size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">{isRtl ? 'روابط الفوتر' : 'Footer Links'}</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Quick Links in Footer</p>
            </div>
          </div>

          <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm">
            {footerMenus.length === 0 ? (
              <div className="p-20 text-center text-slate-400 font-bold">{isRtl ? 'لا يوجد روابط' : 'No links found'}</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {footerMenus.map((item) => (
                  <div key={item.id} className="p-6 flex items-center gap-6 hover:bg-slate-50 transition-colors group">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm group-hover:scale-110 transition-transform">
                      <LinkIcon size={20} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-slate-900">{isRtl ? item.title.ar : item.title.en}</h4>
                      <p className="text-xs text-slate-400 font-mono mt-1">{item.path}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => moveOrder(item.id!, 'up')} className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><ArrowUp size={16} /></button>
                      <button onClick={() => moveOrder(item.id!, 'down')} className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><ArrowDown size={16} /></button>
                      <button onClick={() => startEdit(item)} className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"><Edit size={16} /></button>
                      <button onClick={() => handleDelete(item.id!)} className="p-2 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
