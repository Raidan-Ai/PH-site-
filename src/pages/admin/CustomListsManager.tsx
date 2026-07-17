import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Loader2, Save, Sparkles, Sliders, Check, ListFilter } from 'lucide-react';
import { api } from '../../services/api';

interface CustomList {
  id: number;
  list_key: string;
  list_value: string; // JSON String of string[]
}

export default function CustomListsManager() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [lists, setLists] = useState<CustomList[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>('governorates');
  const [currentItems, setCurrentItems] = useState<string[]>([]);
  const [newItem, setNewItem] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const listKeys = [
    { key: 'governorates', labelAr: 'المحافظات اليمنية المشمولة', labelEn: 'Yemeni Governorates Covered' },
    { key: 'districts', labelAr: 'المديريات والمناطق المستهدفة', labelEn: 'Target Districts' },
    { key: 'partners', labelAr: 'الوزراء والشركاء والتحالفات', labelEn: 'Partners & Coalitions' },
    { key: 'funding_organizations', labelAr: 'الجهات الداعمة والممولة', labelEn: 'Funding Organizations' },
    { key: 'activity_types', labelAr: 'أنواع الأنشطة والتدخلات', labelEn: 'Activity and Liaison Types' },
    { key: 'opportunity_types', labelAr: 'تصنيفات الفرص والوظائف', labelEn: 'Job and Opportunity Forms' },
    { key: 'event_types', labelAr: 'تصنيفات الفعاليات والمناسبات', labelEn: 'Event & Forum Types' },
    { key: 'tags', labelAr: 'الوسوم الافتراضية للموضوعات', labelEn: 'Default Topic Tags' },
    { key: 'keywords', labelAr: 'الكلمات المفتاحية الـ SEO المولدّة', labelEn: 'AI SEO Keywords Catalog' }
  ];

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/custom-lists');
      const fetched = res.data || [];
      setLists(fetched);
      
      const activeList = fetched.find((l: any) => l.list_key === selectedKey);
      if (activeList) {
        try {
          setCurrentItems(JSON.parse(activeList.list_value));
        } catch {
          setCurrentItems([]);
        }
      } else {
        // Fallback default
        setCurrentItems([]);
      }
    } catch (error) {
      console.error('Error fetching CMS custom-lists parameters:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, [selectedKey]);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    if (currentItems.includes(newItem.trim())) {
      alert(isRtl ? 'هذا البند مضاف مسبقاً!' : 'This item already is registered in list.');
      return;
    }
    setCurrentItems([...currentItems, newItem.trim()]);
    setNewItem('');
  };

  const handleRemoveItem = (itemToRemove: string) => {
    setCurrentItems(currentItems.filter(item => item !== itemToRemove));
  };

  const handleSaveList = async () => {
    setSaving(true);
    setStatusMsg('');
    try {
      await api.put(`/api/custom-lists/${selectedKey}`, { list_value: currentItems });
      setStatusMsg(isRtl ? 'تم تحديث القائمة بنجاح!' : 'List database synchronized successfully!');
      setTimeout(() => setStatusMsg(''), 4000);
      fetchKeys();
    } catch (error) {
      console.error('Error storing CMS parameters:', error);
      alert('Error updating custom options list');
    } finally {
      setSaving(false);
    }
  };

  const activeLabel = listKeys.find(lk => lk.key === selectedKey);

  return (
    <div className="space-y-8" dir={isRtl ? 'rtl' : 'ltr'}>
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Sliders className="text-blue-600" size={26} />
          {isRtl ? 'مركز الإعدادات العام وقوائم النظام المنسدلة' : 'General Options Lists center'}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {isRtl
            ? 'تعديل بنود وهيكل القوائم المنسدلة المتاحة في إضافة وتعديل المشاريع والفرص والفعاليات وقصص النجاح دون الحاجة لكتابة كود برمي.'
            : 'Customize dropdown values dynamically. Updates flow instantly across editing sheets.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Side: Select List Key */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-3 shadow-xs">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 px-2">
            <ListFilter size={15} />
            {isRtl ? 'اختر القائمة المراد تعديلها' : 'Select options list catalog'}
          </h3>
          <div className="space-y-1">
            {listKeys.map((lk) => (
              <button
                key={lk.key}
                onClick={() => setSelectedKey(lk.key)}
                className={`w-full text-start px-4 py-3 rounded-xl transition-all font-bold text-sm cursor-pointer block border border-none ${
                  selectedKey === lk.key
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                    : 'bg-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {isRtl ? lk.labelAr : lk.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Modify Values */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-8">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-6">
            <div>
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest font-mono">List Key: {selectedKey}</span>
              <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                {isRtl ? activeLabel?.labelAr : activeLabel?.labelEn}
              </h2>
            </div>
            <button
              onClick={handleSaveList}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-55 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-blue-100 flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              {saving ? <Loader2 className="animate-spin" size={17} /> : <Check size={18} />}
              {isRtl ? 'حفظ التحديثات الحالية' : 'Save Current Changes'}
            </button>
          </div>

          {statusMsg && (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl px-5 py-3 text-sm font-bold animate-in fade-in-50">
              {statusMsg}
            </div>
          )}

          {/* Form to insert new value */}
          <form onSubmit={handleAddItem} className="flex gap-3">
            <input
              type="text"
              required
              value={newItem}
              onChange={e => setNewItem(e.target.value)}
              placeholder={isRtl ? 'اكتب اسم البند الجديد المراد إضافته...' : 'Type new choice item name...'}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-900 outline-none"
            />
            <button
              type="submit"
              className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer transition-colors shrink-0 flex items-center gap-1.5"
            >
              <Plus size={16} />
              {isRtl ? 'إدراج بند' : 'Insert Item'}
            </button>
          </form>

          {/* List of current items */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
          ) : (
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                {isRtl ? `البنود والخيارات الحالية (${currentItems.length})` : `Registered Options Items (${currentItems.length})`}
              </span>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-150 rounded-2xl transition-all"
                  >
                    <span className="text-sm font-bold text-slate-800 truncate">{item}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer border border-none bg-transparent"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}

                {currentItems.length === 0 && (
                  <div className="col-span-full py-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl text-sm">
                    {isRtl ? 'البنود فارغة حالياً. اكتب اسماً لإدراج الإعداد الأول.' : 'This choice catalog is empty. Add elements above.'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
