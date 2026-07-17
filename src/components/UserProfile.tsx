import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  User, Mail, Phone, Building2, Calendar, Users, 
  Save, Loader2, AlertCircle, CheckCircle, 
  Linkedin, Twitter, Facebook, Globe, Plus, Trash2
} from 'lucide-react';
import { api } from '../services/api';
import { motion } from 'motion/react';

export default function UserProfile() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [profile, setProfile] = useState<any>({
    displayName: '',
    email: '',
    age: '',
    gender: '',
    workplace: '',
    phone: '',
    whatsapp: '',
    bio: '',
    specialization: ''
  });

  const [workSamples, setWorkSamples] = useState<any[]>([]);
  const [socialPages, setSocialPages] = useState<any>({
    facebook: '',
    twitter: '',
    linkedin: '',
    portfolio: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/api/auth/profile');
      setProfile({
        displayName: data.displayName || '',
        email: data.email || '',
        age: data.age || '',
        gender: data.gender || '',
        workplace: data.workplace || '',
        phone: data.phone || '',
        whatsapp: data.whatsapp || '',
        bio: data.bio || '',
        specialization: data.specialization || ''
      });
      
      if (data.work_samples) {
        try {
          const samples = typeof data.work_samples === 'string' ? JSON.parse(data.work_samples) : data.work_samples;
          setWorkSamples(Array.isArray(samples) ? samples : []);
        } catch (e) {
          setWorkSamples([]);
        }
      }
      
      if (data.social_pages) {
        try {
          const social = typeof data.social_pages === 'string' ? JSON.parse(data.social_pages) : data.social_pages;
          setSocialPages(social || {});
        } catch (e) {
          setSocialPages({});
        }
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(isRtl ? 'فشل تحميل البيانات' : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      await api.put('/api/auth/profile', {
        ...profile,
        work_samples: workSamples,
        social_pages: socialPages
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError(err.response?.data?.message || (isRtl ? 'فشل حفظ البيانات' : 'Failed to save profile'));
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setProfile((prev: any) => ({ ...prev, [field]: value }));
  };

  const addWorkSample = () => setWorkSamples([...workSamples, { title: '', url: '' }]);
  const removeWorkSample = (index: number) => setWorkSamples(workSamples.filter((_, i) => i !== index));
  const updateWorkSample = (index: number, field: string, value: string) => {
    const newSamples = [...workSamples];
    newSamples[index] = { ...newSamples[index], [field]: value };
    setWorkSamples(newSamples);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-900" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{isRtl ? 'إدارة الملف الشخصي' : 'Profile Management'}</h2>
          <p className="text-slate-500 text-sm">{isRtl ? 'قم بتحديث بياناتك الشخصية والمهنية' : 'Update your personal and professional info'}</p>
        </div>
        
        {success && (
          <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl animate-bounce">
            <CheckCircle size={18} />
            <span className="text-sm font-bold">{isRtl ? 'تم الحفظ بنجاح' : 'Saved successfully'}</span>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8 pb-12">
        {/* Basic Info */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-slate-800 border-b pb-4">{isRtl ? 'المعلومات الأساسية' : 'Basic Information'}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase">{isRtl ? 'الاسم الكامل' : 'Full Name'}</label>
              <div className="relative">
                <User className="absolute ltr:left-4 rtl:right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" value={profile.displayName}
                  onChange={(e) => updateField('displayName', e.target.value)}
                  className="w-full ltr:pl-12 rtl:pr-12 px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase">{isRtl ? 'البريد الإلكتروني' : 'Email'}</label>
              <div className="relative">
                <Mail className="absolute ltr:left-4 rtl:right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="email" disabled value={profile.email}
                  className="w-full ltr:pl-12 rtl:pr-12 px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-400 outline-none text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase">{isRtl ? 'العمر' : 'Age'}</label>
              <div className="relative">
                <Calendar className="absolute ltr:left-4 rtl:right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="number" value={profile.age}
                  onChange={(e) => updateField('age', e.target.value)}
                  className="w-full ltr:pl-12 rtl:pr-12 px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase">{isRtl ? 'النوع' : 'Gender'}</label>
              <div className="relative">
                <Users className="absolute ltr:left-4 rtl:right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select 
                  value={profile.gender}
                  onChange={(e) => updateField('gender', e.target.value)}
                  className="w-full ltr:pl-12 rtl:pr-12 px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm appearance-none bg-white"
                >
                  <option value="">{isRtl ? 'اختر' : 'Select'}</option>
                  <option value="male">{isRtl ? 'ذكر' : 'Male'}</option>
                  <option value="female">{isRtl ? 'أنثى' : 'Female'}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Info */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-slate-800 border-b pb-4">{isRtl ? 'المعلومات المهنية' : 'Professional Information'}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase">{isRtl ? 'مكان العمل' : 'Workplace'}</label>
              <div className="relative">
                <Building2 className="absolute ltr:left-4 rtl:right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" value={profile.workplace}
                  onChange={(e) => updateField('workplace', e.target.value)}
                  className="w-full ltr:pl-12 rtl:pr-12 px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase">{isRtl ? 'التخصص' : 'Specialization'}</label>
              <input 
                type="text" value={profile.specialization}
                onChange={(e) => updateField('specialization', e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase">{isRtl ? 'رقم الهاتف' : 'Phone'}</label>
              <div className="relative">
                <Phone className="absolute ltr:left-4 rtl:right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="tel" value={profile.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className="w-full ltr:pl-12 rtl:pr-12 px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase">{isRtl ? 'واتساب' : 'WhatsApp'}</label>
              <div className="relative">
                <Phone className="absolute ltr:left-4 rtl:right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="tel" value={profile.whatsapp}
                  onChange={(e) => updateField('whatsapp', e.target.value)}
                  className="w-full ltr:pl-12 rtl:pr-12 px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase">{isRtl ? 'السيرة الذاتية / نبذة' : 'Bio / Bio Summary'}</label>
            <textarea 
              value={profile.bio}
              onChange={(e) => updateField('bio', e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm min-h-[120px] resize-none"
            />
          </div>
        </div>

        {/* Work Samples */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <h3 className="text-lg font-bold text-slate-800">{isRtl ? 'نماذج الأعمال' : 'Work Samples'}</h3>
            <button type="button" onClick={addWorkSample} className="text-blue-600 p-1 hover:bg-blue-50 rounded-lg">
              <Plus size={20} />
            </button>
          </div>
          
          <div className="space-y-4">
            {workSamples.length === 0 && (
              <p className="text-center text-slate-400 text-sm py-4">{isRtl ? 'لا توجد نماذج أعمال مضافة' : 'No work samples added'}</p>
            )}
            {workSamples.map((sample, idx) => (
              <div key={idx} className="flex gap-4 items-start p-4 bg-slate-50 rounded-2xl relative group">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase">{isRtl ? 'العنوان' : 'Title'}</label>
                    <input 
                      type="text" value={sample.title}
                      onChange={(e) => updateWorkSample(idx, 'title', e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                      placeholder={isRtl ? 'مثال: تقرير عن الحريات' : 'e.g. Freedoms Report'}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase">{isRtl ? 'الرابط' : 'URL'}</label>
                    <input 
                      type="url" value={sample.url}
                      onChange={(e) => updateWorkSample(idx, 'url', e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <button type="button" onClick={() => removeWorkSample(idx)} className="text-red-400 p-2 self-center hover:bg-red-50 rounded-xl transition-all">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Social Presence */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-slate-800 border-b pb-4">{isRtl ? 'التواجد الرقمي' : 'Social Presence'}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase">Facebook</label>
              <div className="relative">
                <Facebook className="absolute ltr:left-4 rtl:right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="url" value={socialPages.facebook}
                  onChange={(e) => setSocialPages({...socialPages, facebook: e.target.value})}
                  className="w-full ltr:pl-12 rtl:pr-12 px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                  placeholder="https://facebook.com/..."
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase">Twitter / X</label>
              <div className="relative">
                <Twitter className="absolute ltr:left-4 rtl:right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="url" value={socialPages.twitter}
                  onChange={(e) => setSocialPages({...socialPages, twitter: e.target.value})}
                  className="w-full ltr:pl-12 rtl:pr-12 px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                  placeholder="https://twitter.com/..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase">LinkedIn</label>
              <div className="relative">
                <Linkedin className="absolute ltr:left-4 rtl:right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="url" value={socialPages.linkedin}
                  onChange={(e) => setSocialPages({...socialPages, linkedin: e.target.value})}
                  className="w-full ltr:pl-12 rtl:pr-12 px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase">{isRtl ? 'موقع إلكتروني' : 'Website / Portfolio'}</label>
              <div className="relative">
                <Globe className="absolute ltr:left-4 rtl:right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="url" value={socialPages.portfolio}
                  onChange={(e) => setSocialPages({...socialPages, portfolio: e.target.value})}
                  className="w-full ltr:pl-12 rtl:pr-12 px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-4">
          <button 
            type="submit" 
            disabled={saving}
            className="bg-blue-900 text-white px-12 py-4 rounded-[20px] font-bold hover:bg-blue-800 transition-all flex items-center gap-3 disabled:opacity-50 shadow-lg shadow-blue-900/20"
          >
            {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
            {isRtl ? 'حفظ التغييرات' : 'Save Changes'}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
