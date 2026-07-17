import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2, Loader2, Save, Globe, User, Heart } from 'lucide-react';
import { api } from '../../services/api';
import { ImagePicker } from '../../components/admin/ImagePicker';

interface Partner {
  id: string;
  name: string;
  type: 'donor' | 'executive_partner' | 'technical_partner' | 'government';
  logo: string;
  country: string;
  website: string;
  contact_person: string;
}

export default function PartnerManager() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partial<Partner> | null>(null);

  const partnerTypes = [
    { value: 'donor', label: isRtl ? 'جهة مانحة' : 'Donor / Funder' },
    { value: 'executive_partner', label: isRtl ? 'شريك تنفيذي' : 'Executive Partner' },
    { value: 'technical_partner', label: isRtl ? 'شريك تقني' : 'Technical Partner' },
    { value: 'government', label: isRtl ? 'شريك حكومي' : 'Government Agency' }
  ];

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/partners');
      setPartners(res.data || []);
    } catch (error) {
      console.error('Error fetching partners:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPartner || !editingPartner.name) return;

    try {
      if (editingPartner.id) {
        await api.put(`/api/partners/${editingPartner.id}`, editingPartner);
      } else {
        await api.post('/api/partners', editingPartner);
      }
      setShowModal(false);
      setEditingPartner(null);
      fetchPartners();
    } catch (error) {
      console.error('Error saving partner:', error);
      alert('Error saving record');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(isRtl ? 'هل تريد حذف هذا الشريك؟' : 'Are you sure you want to delete this partner?')) {
      try {
        await api.delete(`/api/partners/${id}`);
        fetchPartners();
      } catch (error) {
        console.error('Error deleting partner:', error);
      }
    }
  };

  return (
    <div className="space-y-8" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isRtl ? 'إدارة الشركاء المانحين' : 'Partners & Donors Hub'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {isRtl
              ? 'إدارة المنظمات المانحة، والشركاء المحليين والدوليين للمشاريع الاستراتيجية لبيت الصحافة.'
              : 'Configure strategic partners, executive alliances, and funding organizations.'}
          </p>
        </div>
        <button
          onClick={() => {
            setEditingPartner({ name: '', type: 'donor', logo: '', country: '', website: '', contact_person: '' });
            setShowModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-blue-100 flex items-center gap-2 cursor-pointer transition-colors"
        >
          <Plus size={18} />
          {isRtl ? 'إضافة شريك جديد' : 'Add New Partner'}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-blue-600" size={48} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {partners.map(partner => (
            <div key={partner.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    partner.type === 'donor' 
                      ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                      : partner.type === 'executive_partner' 
                      ? 'bg-blue-50 text-blue-700 border border-blue-100'
                      : 'bg-slate-50 text-slate-700 border border-slate-200'
                  }`}>
                    {partnerTypes.find(t => t.value === partner.type)?.label || partner.type}
                  </span>
                  
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setEditingPartner(partner);
                        setShowModal(true);
                      }}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(partner.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 p-2 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {partner.logo ? (
                      <img src={partner.logo} alt={partner.name} className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      <Heart className="text-slate-300" size={24} />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {partner.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{partner.country || (isRtl ? 'دولي' : 'International')}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-500">
                {partner.contact_person && (
                  <p className="flex items-center gap-2">
                    <User size={12} className="text-slate-400" />
                    <span className="font-bold text-slate-700">{partner.contact_person}</span>
                  </p>
                )}
                {partner.website && (
                  <a
                    href={partner.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:underline inline-block font-mono"
                  >
                    <Globe size={12} />
                    {partner.website.replace('https://', '').replace('http://', '').replace('www.', '')}
                  </a>
                )}
              </div>
            </div>
          ))}

          {partners.length === 0 && (
            <div className="col-span-full border-2 border-dashed border-slate-200 p-12 text-center rounded-3xl text-slate-400">
              {isRtl ? 'لا يوجد شركاء مسجلين بعد في النظام.' : 'No strategic partners added yet.'}
            </div>
          )}
        </div>
      )}

      {/* Partner Modal Form */}
      {showModal && editingPartner && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-950">
                {editingPartner.id ? (isRtl ? 'تعديل الشريك الكفيل' : 'Edit Partner Details') : (isRtl ? 'شريك / مانح جديد' : 'New Strategic Partner')}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-800 font-bold text-xl">&times;</button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-start">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">اسم المانح أو الشريك الكفيل</label>
                <input
                  type="text"
                  required
                  value={editingPartner.name || ''}
                  onChange={e => setEditingPartner({ ...editingPartner, name: e.target.value })}
                  placeholder="e.g. UNESCO, EU Commission"
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">تبويب الشريك</label>
                  <select
                    value={editingPartner.type || 'donor'}
                    onChange={e => setEditingPartner({ ...editingPartner, type: e.target.value as any })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none text-sm bg-white font-medium"
                  >
                    {partnerTypes.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">الدولة أو المقر الرئيسي</label>
                  <input
                    type="text"
                    value={editingPartner.country || ''}
                    onChange={e => setEditingPartner({ ...editingPartner, country: e.target.value })}
                    placeholder="e.g. Yemen, France"
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  {isRtl ? 'شعار الشريك البصري' : 'Partner Brand Logo'}
                </label>
                <ImagePicker
                  value={editingPartner.logo || ''}
                  onChange={(url) => setEditingPartner({ ...editingPartner, logo: url })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">الموقع الإلكتروني</label>
                  <input
                    type="text"
                    value={editingPartner.website || ''}
                    onChange={e => setEditingPartner({ ...editingPartner, website: e.target.value })}
                    placeholder="https://example.com"
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">مسؤول الاتصال (Contact)</label>
                  <input
                    type="text"
                    value={editingPartner.contact_person || ''}
                    onChange={e => setEditingPartner({ ...editingPartner, contact_person: e.target.value })}
                    placeholder="e.g. Jane Doe"
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none text-sm"
                  />
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
                  {isRtl ? 'حفظ البيانات' : 'Save Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
