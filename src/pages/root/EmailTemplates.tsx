import React, { useState, useEffect } from 'react';
import { Mail, Save, Loader2, Languages, Edit3, Trash2, Plus, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { motion, AnimatePresence } from 'motion/react';

interface EmailTemplate {
  id: string;
  name_ar: string;
  name_en: string;
  subject_ar: string;
  subject_en: string;
  content_ar: string;
  content_en: string;
  updatedAt: string;
}

export default function EmailTemplates() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<Partial<EmailTemplate>>({});
  const [activeLang, setActiveLang] = useState<'ar' | 'en'>(isRtl ? 'ar' : 'en');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/api/email-templates');
      setTemplates(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (tpl: EmailTemplate) => {
    setEditingId(tpl.id);
    setEditForm(tpl);
  };

  const handleSave = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      await api.put(`/api/email-templates/${editingId}`, editForm);
      setEditingId(null);
      fetchTemplates();
    } catch (err) {
      console.error(err);
      alert(isRtl ? 'فشل الحفظ' : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-blue-500" /></div>;

  return (
    <div className="space-y-8 p-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">{isRtl ? 'قوالب المراسلات' : 'Email Templates'}</h1>
          <p className="text-slate-400">{isRtl ? 'إدارة رسائل التأكيد، استعادة كلمة السر والدعوات' : 'Manage verification, password reset, and invitation emails'}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6">
        {templates.map((tpl) => (
          <div key={tpl.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-6 flex justify-between items-center border-b border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <Mail size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-white">{isRtl ? tpl.name_ar : tpl.name_en}</h3>
                  <p className="text-xs text-slate-500">ID: {tpl.id}</p>
                </div>
              </div>
              <button 
                onClick={() => handleEdit(tpl)}
                className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all"
              >
                <Edit3 size={18} />
              </button>
            </div>
            
            {editingId === tpl.id ? (
              <div className="p-6 space-y-6 bg-slate-950/50">
                <div className="flex gap-2 p-1 bg-slate-900 rounded-lg w-fit">
                  <button 
                    onClick={() => setActiveLang('ar')}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeLang === 'ar' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    العربية
                  </button>
                  <button 
                    onClick={() => setActiveLang('en')}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeLang === 'en' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    English
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500">{isRtl ? 'عنوان الرسالة' : 'Email Subject'}</label>
                    <input 
                      type="text"
                      value={activeLang === 'ar' ? editForm.subject_ar : editForm.subject_en}
                      onChange={(e) => setEditForm({ ...editForm, [activeLang === 'ar' ? 'subject_ar' : 'subject_en']: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500">{isRtl ? 'محتوى الرسالة (HTML)' : 'Email Content (HTML)'}</label>
                    <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl flex items-start gap-3 mb-2">
                      <Info size={16} className="text-blue-400 mt-0.5 shrink-0" />
                      <p className="text-[11px] text-blue-200/70">
                        {isRtl 
                          ? 'يمكنك استخدام الرموز التالية: {{name}} لاسم المستخدم، {{link}} لرابط الإجراء.' 
                          : 'You can use placeholders: {{name}} for user name, {{link}} for action link.'}
                      </p>
                    </div>
                    <textarea 
                      rows={8}
                      value={activeLang === 'ar' ? editForm.content_ar : editForm.content_en}
                      onChange={(e) => setEditForm({ ...editForm, [activeLang === 'ar' ? 'content_ar' : 'content_en']: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-white font-mono text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button 
                    onClick={() => setEditingId(null)}
                    className="px-6 py-2 text-slate-400 hover:text-white font-bold transition-all"
                  >
                    {isRtl ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-600 text-white px-8 py-2 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    {isRtl ? 'حفظ التغييرات' : 'Save Changes'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 opacity-60">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Preview (AR)</h4>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 h-24 overflow-hidden relative">
                    <div className="font-bold text-white text-sm mb-1">{tpl.subject_ar}</div>
                    <div className="text-slate-400 text-xs line-clamp-2" dangerouslySetInnerHTML={{ __html: tpl.content_ar }}></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Preview (EN)</h4>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 h-24 overflow-hidden relative">
                    <div className="font-bold text-white text-sm mb-1">{tpl.subject_en}</div>
                    <div className="text-slate-400 text-xs line-clamp-2" dangerouslySetInnerHTML={{ __html: tpl.content_en }}></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent" />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
