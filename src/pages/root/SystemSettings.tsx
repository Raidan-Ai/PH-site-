import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, Globe, Info, Mail, Share2, Loader2, Play } from 'lucide-react';
import { api } from '../../services/api';
import { clsx } from 'clsx';

export default function SystemSettings() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    siteName: { ar: 'بيت الصحافة - اليمن', en: 'Press House - Yemen' },
    contactEmail: 'info@ph-ye.org',
    socialLinks: {
      twitter: '',
      facebook: '',
      youtube: '',
      telegram: '',
      whatsapp: ''
    },
    livestream: {
      enabled: false,
      platform: 'youtube',
      url: ''
    }
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get('/api/settings');
        if (response.data && Object.keys(response.data).length > 0) {
          const rawData = response.data;
          const parsedSettings = {
            ...settings,
            ...rawData,
            siteName: typeof rawData.siteName === 'string' ? JSON.parse(rawData.siteName) : (rawData.siteName || settings.siteName),
            socialLinks: typeof rawData.socialLinks === 'string' ? JSON.parse(rawData.socialLinks) : (rawData.socialLinks || settings.socialLinks),
            livestream: typeof rawData.livestream === 'string' ? JSON.parse(rawData.livestream) : (rawData.livestream || settings.livestream)
          };
          setSettings(parsedSettings);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/api/settings', settings);
      alert(isRtl ? 'تم حفظ الإعدادات بنجاح' : 'Settings saved successfully');
    } catch (error) {
      console.error("Error saving settings:", error);
      alert(isRtl ? 'فشل حفظ الإعدادات' : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={48} /></div>;

  return (
    <div className="space-y-8 p-6 bg-slate-950 min-h-screen text-slate-200">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">{isRtl ? 'إعدادات النظام' : 'System Settings'}</h1>
          <p className="text-slate-400 text-sm mt-1">{isRtl ? 'تكوين الموقع العالمي والمعلومات الأساسية' : 'Configure global site settings and basic information'}</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-900/20"
        >
          {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          {isRtl ? 'حفظ التغييرات' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Basic Info */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Info size={20} className="text-blue-400" />
            {isRtl ? 'المعلومات الأساسية' : 'Basic Information'}
          </h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-400">{isRtl ? 'اسم الموقع (عربي)' : 'Site Name (AR)'}</label>
                <input 
                  type="text" 
                  value={settings.siteName.ar}
                  onChange={(e) => setSettings({...settings, siteName: {...settings.siteName, ar: e.target.value}})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-400">{isRtl ? 'اسم الموقع (إنجليزي)' : 'Site Name (EN)'}</label>
                <input 
                  type="text" 
                  value={settings.siteName.en}
                  onChange={(e) => setSettings({...settings, siteName: {...settings.siteName, en: e.target.value}})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-400">{isRtl ? 'البريد الإلكتروني للتواصل' : 'Contact Email'}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 text-slate-500" size={18} />
                <input 
                  type="email" 
                  value={settings.contactEmail}
                  onChange={(e) => setSettings({...settings, contactEmail: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Share2 size={20} className="text-emerald-400" />
            {isRtl ? 'روابط التواصل الاجتماعي' : 'Social Media Links'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.keys(settings.socialLinks).map((key) => (
              <div key={key} className="space-y-2">
                <label className="text-sm font-bold text-slate-400 capitalize">{key}</label>
                <input 
                  type="text" 
                  value={(settings.socialLinks as any)[key]}
                  onChange={(e) => setSettings({
                    ...settings, 
                    socialLinks: {...settings.socialLinks, [key]: e.target.value}
                  })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder={`https://${key}.com/...`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* AI & Analytics Settings */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">✨</span>
            {isRtl ? 'إعدادات الذكاء الاصطناعي والتحليلات' : 'AI & Analytics Settings'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-400">{isRtl ? 'نموذج الذكاء الاصطناعي (Model)' : 'AI Model'}</label>
              <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="gemini-pro">Gemini Pro</option>
                <option value="gemini-flash">Gemini Flash</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-400">{isRtl ? 'درجة الحرارة (Temperature)' : 'Temperature'}</label>
              <input type="number" step="0.1" min="0" max="1" defaultValue="0.7" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-slate-400">{isRtl ? 'تعليمات النظام (System Prompt)' : 'System Prompt'}</label>
              <textarea rows={3} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none" defaultValue="أنت مساعد ذكي لمنصة بيت الصحافة، هدفك هو تقديم تحليلات وملخصات للمشاريع والفعاليات والأخبار."></textarea>
            </div>
          </div>
        </div>

        {/* Integration Settings */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Globe size={20} className="text-purple-400" />
            {isRtl ? 'إعدادات التكاملات والـ API' : 'Integrations & API Settings'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-400">{isRtl ? 'مفتاح Google Analytics' : 'Google Analytics Key'}</label>
              <input type="text" placeholder="G-XXXXXXXXXX" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-400">{isRtl ? 'مفتاح Mailchimp' : 'Mailchimp API Key'}</label>
              <input type="password" placeholder="••••••••••••••••" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-400">{isRtl ? 'Webhook لأداة الإحصائيات' : 'Analytics Webhook'}</label>
              <input type="url" placeholder="https://..." className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
        </div>

        {/* Live Stream Config */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Play size={20} className="text-rose-400" />
            {isRtl ? 'إعدادات البث المباشر' : 'Live Stream Configuration'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-400">{isRtl ? 'تفعيل البث المباشر' : 'Enable Live Stream'}</label>
              <div 
                onClick={() => setSettings({...settings, livestream: {...settings.livestream, enabled: !settings.livestream.enabled}})}
                className={clsx(
                  "w-14 h-8 rounded-full p-1 cursor-pointer transition-colors duration-300",
                  settings.livestream.enabled ? "bg-rose-500" : "bg-slate-700"
                )}
              >
                <div className={clsx(
                  "w-6 h-6 bg-white rounded-full transition-transform duration-300 transform",
                  settings.livestream.enabled ? (isRtl ? "-translate-x-6" : "translate-x-6") : "translate-x-0"
                )} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-400">{isRtl ? 'المنصة' : 'Platform'}</label>
              <select 
                value={settings.livestream.platform}
                onChange={(e) => setSettings({...settings, livestream: {...settings.livestream, platform: e.target.value}})}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="youtube">YouTube</option>
                <option value="facebook">Facebook</option>
                <option value="twitter">Twitter / X</option>
                <option value="custom">Custom URL</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-400">{isRtl ? 'رابط البث / المعرف' : 'Stream URL / ID'}</label>
              <input 
                type="text" 
                value={settings.livestream.url}
                onChange={(e) => setSettings({...settings, livestream: {...settings.livestream, url: e.target.value}})}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="YouTube ID or iframe URL"
              />
            </div>
          </div>
        </div>

        {/* Local Server & Database Settings */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-blue-500/30 space-y-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Globe size={20} className="text-blue-400" />
            {isRtl ? 'حالة الخادم وقاعدة البيانات المحلية' : 'Local Server & Database Status'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <p className="text-sm text-slate-400">
                {isRtl 
                  ? 'تعمل المنصة الآن بشكل مستقل بالكامل على خادم محلي (Ubuntu Server) متكامل وقاعدة بيانات SQLite محلية مدمجة بأعلى أداء واستقرار، دون الاعتماد على خدمات خارجية.'
                  : 'The platform is running fully standalone on a local Ubuntu Server with an embedded SQLite database for peak performance and stability, with no external service dependencies.'}
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                  {isRtl ? 'قاعدة البيانات: SQLite (محلي)' : 'Database: SQLite (Local)'}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {isRtl ? 'البيئة: Ubuntu Server' : 'Environment: Ubuntu Server'}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  {isRtl ? 'التخزين: محلي مستقل' : 'Storage: Standalone Local'}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
