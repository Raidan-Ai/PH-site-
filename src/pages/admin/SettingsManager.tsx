import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Settings, Save, Palette, Type, Globe, 
  Image as ImageIcon, Mail, Phone, MapPin,
  Facebook, Twitter, Instagram, Youtube,
  Loader2, CheckCircle2, RefreshCw, Shield, Key, Terminal, Upload,
  Plus, Trash2, Hammer
} from 'lucide-react';
import { SiteSettings } from '../../types';
import { MediaLibraryModal } from '../../components/media/MediaLibraryModal';
import { api } from '../../services/api';

const DEFAULT_SETTINGS: SiteSettings = {
  siteName: { ar: '', en: '' },
  logo: '',
  favicon: '',
  primaryColor: '#2563eb',
  secondaryColor: '#e11d48',
  fontFamily: 'Inter',
  socialLinks: [
    { platform: 'facebook', url: 'https://facebook.com/presshoue' },
    { platform: 'twitter', url: 'https://twitter.com/presshoue' },
    { platform: 'instagram', url: 'https://instagram.com/presshoue' },
    { platform: 'youtube', url: 'https://youtube.com/@presshoue' }
  ],
  contactEmail: '',
  contactPhone: '',
  address: { ar: '', en: '' },
  seoTitle: { ar: '', en: '' },
  seoDescription: { ar: '', en: '' },
  seoKeywords: { ar: '', en: '' },
  ogDefaultImage: '',
  ogSiteName: '',
  ogType: 'website',
  googleVerification: '',
  bingVerification: '',
  aiEnabled: true,
  aiModel: 'nvidia/qwen-2.5-coder-32b-instruct',
  aiBaseUrl: 'https://integrate.api.nvidia.com/v1',
  aiApiKey: '',
  aiTemperature: 0.3,
  aiMaxTokens: 1524,
  aiSystemInstruction: '',
  maintenanceMode: 0,
  maintenanceMessage: { ar: 'الموقع حالياً قيد الصيانة لإجراء بعض التحديثات والتحسينات المجدولة. سنعود للعمل قريباً.', en: 'The platform is currently undergoing scheduled maintenance for updates and enhancements. We will be back online shortly.' }
};

export default function SettingsManager() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'contact' | 'social' | 'seo' | 'telegram' | 'slider' | 'ai' | 'smtp' | 'maintenance'>('general');
  const [telegramUsers, setTelegramUsers] = useState<any[]>([]);
  const [newTelegramUser, setNewTelegramUser] = useState({ chatId: '', displayName: '' });
  const [loadingTelegram, setLoadingTelegram] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [activeMediaField, setActiveMediaField] = useState<'logo' | 'favicon' | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get('/api/settings');
        if (response.data && Object.keys(response.data).length > 0) {
          const s = response.data;
          let maintenanceMessageParsed = { ar: 'الموقع حالياً قيد الصيانة لإجراء بعض التحديثات والتحسينات المجدولة. سنعود للعمل قريباً.', en: 'The platform is currently undergoing scheduled maintenance for updates and enhancements. We will be back online shortly.' };
          if (s.maintenanceMessage) {
            try {
              const parsed = JSON.parse(s.maintenanceMessage);
              if (parsed && (parsed.ar || parsed.en)) {
                maintenanceMessageParsed = { ar: parsed.ar || '', en: parsed.en || '' };
              } else if (typeof s.maintenanceMessage === 'string') {
                maintenanceMessageParsed = { ar: s.maintenanceMessage, en: s.maintenanceMessage };
              }
            } catch (e) {
              if (typeof s.maintenanceMessage === 'string') {
                maintenanceMessageParsed = { ar: s.maintenanceMessage, en: s.maintenanceMessage };
              }
            }
          }
          setSettings({
            ...DEFAULT_SETTINGS,
            ...s,
            siteName: typeof s.siteName === 'string' ? JSON.parse(s.siteName) : s.siteName,
            socialLinks: typeof s.socialLinks === 'string' ? JSON.parse(s.socialLinks) : s.socialLinks,
            address: typeof s.address === 'string' ? JSON.parse(s.address) : s.address,
            seoTitle: typeof s.seoTitle === 'string' ? JSON.parse(s.seoTitle) : (s.seoTitle || DEFAULT_SETTINGS.seoTitle),
            seoDescription: typeof s.seoDescription === 'string' ? JSON.parse(s.seoDescription) : (s.seoDescription || DEFAULT_SETTINGS.seoDescription),
            seoKeywords: typeof s.seoKeywords === 'string' ? JSON.parse(s.seoKeywords) : (s.seoKeywords || DEFAULT_SETTINGS.seoKeywords),
            maintenanceMode: s.maintenanceMode || 0,
            maintenanceMessage: maintenanceMessageParsed
          });
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
    fetchTelegramUsers();
  }, []);

  const fetchTelegramUsers = async () => {
    try {
      const response = await api.get('/api/telegram-users');
      setTelegramUsers(response.data);
    } catch (error) {
      console.error("Error fetching telegram users:", error);
    }
  };

  const addTelegramUser = async () => {
    if (!newTelegramUser.chatId) return;
    setLoadingTelegram(true);
    try {
      await api.post('/api/telegram-users', newTelegramUser);
      setNewTelegramUser({ chatId: '', displayName: '' });
      fetchTelegramUsers();
    } catch (error) {
      console.error("Error adding user:", error);
    } finally {
      setLoadingTelegram(false);
    }
  };

  const deleteTelegramUser = async (id: number) => {
    if (!confirm(isRtl ? 'هل أنت متأكد؟' : 'Are you sure?')) return;
    try {
      await api.delete(`/api/telegram-users/${id}`);
      fetchTelegramUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/api/settings', {
        ...settings,
        id: undefined, // Let the backend handle the ID or insert if not exists
      });
      alert(isRtl ? 'تم حفظ الإعدادات بنجاح' : 'Settings saved successfully');
    } catch (error) {
      console.error("Error saving settings:", error);
      alert(isRtl ? 'حدث خطأ أثناء الحفظ' : 'Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  return (
    <div className="space-y-8 pb-24">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{isRtl ? 'إعدادات الموقع' : 'Site Settings'}</h1>
          <p className="text-slate-500 text-sm mt-1">{isRtl ? 'تخصيص الهوية، المظهر، ومعلومات الاتصال' : 'Customize identity, appearance, and contact info'}</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          {isRtl ? 'حفظ التغييرات' : 'Save Changes'}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Tabs */}
        <aside className="w-full lg:w-64 space-y-1">
          {[
            { id: 'general', label: isRtl ? 'عام' : 'General', icon: <Settings size={18} /> },
            { id: 'appearance', label: isRtl ? 'المظهر' : 'Appearance', icon: <Palette size={18} /> },
            { id: 'contact', label: isRtl ? 'الاتصال' : 'Contact', icon: <Mail size={18} /> },
            { id: 'social', label: isRtl ? 'التواصل الاجتماعي' : 'Social Media', icon: <Globe size={18} /> },
            { id: 'seo', label: isRtl ? 'محركات البحث SEO' : 'SEO Settings', icon: <Shield size={18} /> },
            { id: 'slider', label: isRtl ? 'إعدادات السلايدر' : 'Slider Settings', icon: <RefreshCw size={18} /> },
            { id: 'telegram', label: isRtl ? 'مساعد تليجرام' : 'Telegram Assistant', icon: <Terminal size={18} /> },
            { id: 'ai', label: isRtl ? 'المساعد الذكي' : 'AI Assistant', icon: <Terminal size={18} /> },
            { id: 'smtp', label: isRtl ? 'إعدادات البريد SMTP' : 'SMTP Settings', icon: <Mail size={18} /> },
            { id: 'maintenance', label: isRtl ? 'وضع الصيانة' : 'Maintenance Mode', icon: <Hammer size={18} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                activeTab === tab.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                  : 'text-slate-500 hover:bg-white hover:text-slate-900'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </aside>

        {/* Content Area */}
        <div className="flex-1 space-y-6">
          <MediaLibraryModal 
            isOpen={isMediaModalOpen}
            onClose={() => setIsMediaModalOpen(false)}
            onSelect={(url) => {
              if (activeMediaField === 'logo') setSettings({ ...settings, logo: url });
              if (activeMediaField === 'favicon') setSettings({ ...settings, favicon: url });
              setIsMediaModalOpen(false);
            }}
          />
          {activeTab === 'general' && (
            <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-8">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Settings className="text-blue-600" size={24} />
                {isRtl ? 'الإعدادات العامة' : 'General Settings'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-slate-700">{isRtl ? 'اسم الموقع (بالعربية)' : 'Site Name (Arabic)'}</label>
                  <input 
                    type="text"
                    value={settings.siteName.ar}
                    onChange={(e) => setSettings({ ...settings, siteName: { ...settings.siteName, ar: e.target.value } })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-slate-700">{isRtl ? 'اسم الموقع (بالإنجليزية)' : 'Site Name (English)'}</label>
                  <input 
                    type="text"
                    value={settings.siteName.en}
                    onChange={(e) => setSettings({ ...settings, siteName: { ...settings.siteName, en: e.target.value } })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-slate-700">{isRtl ? 'الشعار (Logo)' : 'Logo'}</label>
                  <div className="flex gap-4">
                    <input 
                      type="text"
                      value={settings.logo}
                      onChange={(e) => setSettings({ ...settings, logo: e.target.value })}
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button
                      onClick={() => {
                        setActiveMediaField('logo');
                        setIsMediaModalOpen(true);
                      }}
                      className="px-4 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-2"
                    >
                      <Upload size={20} />
                      {isRtl ? 'اختر صورة' : 'Select Image'}
                    </button>
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                      {settings.logo ? <img src={settings.logo} alt="" className="w-full h-full object-contain" /> : <ImageIcon size={20} className="text-slate-300" />}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-slate-700">{isRtl ? 'الأيقونة (Favicon)' : 'Favicon'}</label>
                  <div className="flex gap-4">
                    <input 
                      type="text"
                      value={settings.favicon}
                      onChange={(e) => setSettings({ ...settings, favicon: e.target.value })}
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button
                      onClick={() => {
                        setActiveMediaField('favicon');
                        setIsMediaModalOpen(true);
                      }}
                      className="px-4 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-2"
                    >
                      <Upload size={20} />
                      {isRtl ? 'اختر صورة' : 'Select Image'}
                    </button>
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                      {settings.favicon ? <img src={settings.favicon} alt="" className="w-full h-full object-contain" /> : <ImageIcon size={20} className="text-slate-300" />}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-8">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Palette className="text-blue-600" size={24} />
                {isRtl ? 'المظهر والألوان' : 'Appearance & Colors'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-slate-700">{isRtl ? 'اللون الأساسي' : 'Primary Color'}</label>
                  <div className="flex gap-4">
                    <input 
                      type="color"
                      value={settings.primaryColor}
                      onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                      className="w-12 h-12 rounded-xl border-0 p-0 cursor-pointer"
                    />
                    <input 
                      type="text"
                      value={settings.primaryColor}
                      onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-slate-700">{isRtl ? 'اللون الثانوي' : 'Secondary Color'}</label>
                  <div className="flex gap-4">
                    <input 
                      type="color"
                      value={settings.secondaryColor}
                      onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                      className="w-12 h-12 rounded-xl border-0 p-0 cursor-pointer"
                    />
                    <input 
                      type="text"
                      value={settings.secondaryColor}
                      onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-slate-700">{isRtl ? 'الخط الأساسي' : 'Font Family'}</label>
                  <select 
                    value={settings.fontFamily}
                    onChange={(e) => setSettings({ ...settings, fontFamily: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  >
                    <option value="Inter">Inter (Modern Sans)</option>
                    <option value="Space Grotesk">Space Grotesk (Tech)</option>
                    <option value="Playfair Display">Playfair Display (Editorial)</option>
                    <option value="Cairo">Cairo (Arabic Optimized)</option>
                    <option value="Tajawal">Tajawal (Elegant Arabic)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-8">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Mail className="text-blue-600" size={24} />
                {isRtl ? 'معلومات الاتصال' : 'Contact Information'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-slate-700">{isRtl ? 'البريد الإلكتروني' : 'Contact Email'}</label>
                  <input 
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-slate-700">{isRtl ? 'رقم الهاتف' : 'Contact Phone'}</label>
                  <input 
                    type="text"
                    value={settings.contactPhone}
                    onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-slate-700">{isRtl ? 'العنوان (بالعربية)' : 'Address (Arabic)'}</label>
                  <input 
                    type="text"
                    value={settings.address.ar}
                    onChange={(e) => setSettings({ ...settings, address: { ...settings.address, ar: e.target.value } })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-slate-700">{isRtl ? 'العنوان (بالإنجليزية)' : 'Address (English)'}</label>
                  <input 
                    type="text"
                    value={settings.address.en}
                    onChange={(e) => setSettings({ ...settings, address: { ...settings.address, en: e.target.value } })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'social' && (
            <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-8">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Globe className="text-blue-600" size={24} />
                {isRtl ? 'روابط التواصل الاجتماعي' : 'Social Media Links'}
              </h3>
              
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-4 border-b border-slate-100 pb-6">
                  <h4 className="font-bold text-slate-900">{isRtl ? 'إعدادات يوتيوب' : 'YouTube Settings'}</h4>
                  <div className="space-y-4">
                    <input 
                      type="text"
                      placeholder={isRtl ? 'معرف القناة (Channel ID)' : 'Channel ID'}
                      value={settings.youtubeChannelId || ''}
                      onChange={(e) => setSettings({ ...settings, youtubeChannelId: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <input 
                      type="text"
                      placeholder={isRtl ? 'رابط قائمة التشغيل' : 'Playlist URL'}
                      value={settings.youtubePlaylistUrl || ''}
                      onChange={(e) => setSettings({ ...settings, youtubePlaylistUrl: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
                {settings.socialLinks.map((link, index) => (
                  <div key={link.platform} className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
                      {link.platform === 'facebook' && <Facebook size={20} />}
                      {link.platform === 'twitter' && <Twitter size={20} />}
                      {link.platform === 'instagram' && <Instagram size={20} />}
                      {link.platform === 'youtube' && <Youtube size={20} />}
                    </div>
                    <div className="flex-1">
                      <input 
                        type="text"
                        placeholder={`https://${link.platform}.com/your-profile`}
                        value={link.url}
                        onChange={(e) => {
                          const newLinks = [...settings.socialLinks];
                          newLinks[index].url = e.target.value;
                          setSettings({ ...settings, socialLinks: newLinks });
                        }}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeTab === 'seo' && (
            <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-8">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Shield className="text-blue-600" size={24} />
                {isRtl ? 'إعدادات محركات البحث و Metadata' : 'SEO & Metadata Settings'}
              </h3>
              
              <div className="grid grid-cols-1 gap-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-slate-700">{isRtl ? 'عنوان الصفحة SEO (بالعربية)' : 'SEO Title (Arabic)'}</label>
                    <input 
                      type="text"
                      value={settings.seoTitle?.ar || ''}
                      onChange={(e) => setSettings({ ...settings, seoTitle: { ...settings.seoTitle!, ar: e.target.value } })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-slate-700">{isRtl ? 'عنوان الصفحة SEO (بالإنجليزية)' : 'SEO Title (English)'}</label>
                    <input 
                      type="text"
                      value={settings.seoTitle?.en || ''}
                      onChange={(e) => setSettings({ ...settings, seoTitle: { ...settings.seoTitle!, en: e.target.value } })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-slate-700">{isRtl ? 'وصف الميتا (بالعربية)' : 'Meta Description (Arabic)'}</label>
                    <textarea 
                      rows={3}
                      value={settings.seoDescription?.ar || ''}
                      onChange={(e) => setSettings({ ...settings, seoDescription: { ...settings.seoDescription!, ar: e.target.value } })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-slate-700">{isRtl ? 'وصف الميتا (بالإنجليزية)' : 'Meta Description (English)'}</label>
                    <textarea 
                      rows={3}
                      value={settings.seoDescription?.en || ''}
                      onChange={(e) => setSettings({ ...settings, seoDescription: { ...settings.seoDescription!, en: e.target.value } })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-slate-700">{isRtl ? 'الكلمات المفتاحية (بالعربية)' : 'Keywords (Arabic)'}</label>
                    <input 
                      type="text"
                      value={settings.seoKeywords?.ar || ''}
                      onChange={(e) => setSettings({ ...settings, seoKeywords: { ...settings.seoKeywords!, ar: e.target.value } })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="كلمة1, كلمة2..."
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-slate-700">{isRtl ? 'الكلمات المفتاحية (بالإنجليزية)' : 'Keywords (English)'}</label>
                    <input 
                      type="text"
                      value={settings.seoKeywords?.en || ''}
                      onChange={(e) => setSettings({ ...settings, seoKeywords: { ...settings.seoKeywords!, en: e.target.value } })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="keyword1, keyword2..."
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100">
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-900 border-b pb-2">{isRtl ? 'روابط التواصل الاجتماعي (OpenGraph)' : 'Social SEO (OpenGraph)'}</h4>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">{isRtl ? 'صورة المشاركة الافتراضية' : 'Default Sharing Image'}</label>
                        <input 
                          type="text"
                          value={settings.ogDefaultImage || ''}
                          onChange={(e) => setSettings({ ...settings, ogDefaultImage: e.target.value })}
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                          placeholder="https://..."
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">{isRtl ? 'اسم الموقع في OG' : 'OG Site Name'}</label>
                        <input 
                          type="text"
                          value={settings.ogSiteName || ''}
                          onChange={(e) => setSettings({ ...settings, ogSiteName: e.target.value })}
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">{isRtl ? 'نوع الموقع' : 'Site Type'}</label>
                        <select 
                          value={settings.ogType || 'website'}
                          onChange={(e) => setSettings({ ...settings, ogType: e.target.value })}
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                        >
                          <option value="website">Website</option>
                          <option value="article">Article</option>
                          <option value="organization">Organization</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-900 border-b pb-2">{isRtl ? 'أدوات التحقق' : 'Verification Tools'}</h4>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">{isRtl ? 'كود التحقق من Google' : 'Google Site Verification'}</label>
                        <input 
                          type="text"
                          value={settings.googleVerification || ''}
                          onChange={(e) => setSettings({ ...settings, googleVerification: e.target.value })}
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 font-mono text-xs"
                          placeholder="google-site-verification=..."
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">{isRtl ? 'كود التحقق من Bing' : 'Bing Site Verification'}</label>
                        <input 
                          type="text"
                          value={settings.bingVerification || ''}
                          onChange={(e) => setSettings({ ...settings, bingVerification: e.target.value })}
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 font-mono text-xs"
                          placeholder="msvalidate.01=..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Terminal className="text-blue-600" size={24} />
                  {isRtl ? 'إعدادات المساعد الذكي (NVIDIA)' : 'AI Assistant Settings (NVIDIA)'}
                </h3>
                <div className="flex items-center gap-2">
                   <label className="text-sm font-bold text-slate-600">{isRtl ? 'تفعيل الذكاء الاصطناعي' : 'Enable AI'}</label>
                   <button 
                    type="button"
                    onClick={() => setSettings({ ...settings, aiEnabled: !settings.aiEnabled })}
                    className={`w-12 h-6 rounded-full transition-all relative ${settings.aiEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}
                   >
                     <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.aiEnabled ? 'right-1' : 'left-1'}`} />
                   </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-slate-700">{isRtl ? 'مزود الخدمة (Provider)' : 'AI Provider'}</label>
                  <select 
                    value={settings.aiProvider || 'openai'}
                    onChange={(e) => setSettings({ ...settings, aiProvider: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                  >
                    <option value="openai">OpenAI Compatible (NVIDIA, Groq, etc.)</option>
                    <option value="gemini">Google Gemini SDK</option>
                  </select>
                </div>
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-slate-700">{isRtl ? 'الموديل المفضل' : 'AI Model'}</label>
                  <input 
                    type="text"
                    value={settings.aiModel || ''}
                    onChange={(e) => setSettings({ ...settings, aiModel: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                    placeholder="nvidia/qwen-2.5-coder-32b-instruct"
                  />
                  <p className="text-xs text-slate-400">
                    {isRtl ? 'اسم الموديل من NVIDIA API أو أي مزود متوافق مع OpenAI API.' : 'Model identifier from NVIDIA API or any OpenAI-compatible provider.'}
                  </p>
                </div>
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-slate-700">{isRtl ? 'رابط الـ API الأساسي' : 'API Base URL'}</label>
                  <input 
                    type="text"
                    value={settings.aiBaseUrl || ''}
                    onChange={(e) => setSettings({ ...settings, aiBaseUrl: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                    placeholder="https://integrate.api.nvidia.com/v1"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-bold text-slate-700">{isRtl ? 'مفتاح الـ API (Secret Token)' : 'API Key'}</label>
                <div className="relative">
                  <input 
                    type="password"
                    value={settings.aiApiKey || ''}
                    onChange={(e) => setSettings({ ...settings, aiApiKey: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm pr-12"
                    placeholder="nvapi-..."
                  />
                  <Key className="absolute right-4 top-3.5 text-slate-400" size={18} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-slate-700">{isRtl ? 'درجة الحرارة (Temperature)' : 'Temperature'}</label>
                  <input 
                    type="number"
                    step={0.1}
                    min={0}
                    max={1}
                    value={settings.aiTemperature || 0.3}
                    onChange={(e) => setSettings({ ...settings, aiTemperature: parseFloat(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-slate-700">{isRtl ? 'أقصى عدد للتوكنات' : 'Max Tokens'}</label>
                  <input 
                    type="number"
                    step={100}
                    value={settings.aiMaxTokens || 1524}
                    onChange={(e) => setSettings({ ...settings, aiMaxTokens: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-bold text-slate-700">{isRtl ? 'تعليمات النظام المخصصة (System Instruction)' : 'Custom System Instruction'}</label>
                <textarea 
                  rows={4}
                  value={settings.aiSystemInstruction || ''}
                  onChange={(e) => setSettings({ ...settings, aiSystemInstruction: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder={isRtl ? 'أنت مساعد ذكي متخصص في...' : 'You are an AI assistant specializing in...'}
                />
                <p className="text-xs text-slate-400">
                  {isRtl ? 'هذه التعليمات ستضاف إلى التعليمات الأساسية المدمجة في النظام.' : 'These instructions will be appended to the core system instructions.'}
                </p>
              </div>

              <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                <div className="flex gap-4">
                  <Terminal className="text-blue-600 shrink-0" size={24} />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-blue-900">{isRtl ? 'ملاحظة للمطورين' : 'Developer Note'}</p>
                    <p className="text-xs text-blue-700 leading-relaxed">
                      {isRtl 
                        ? 'يستخدم الموقع موديلات NVIDIA بشكل أساسي لتوليد الردود وترجمة المحتوى وتنسيق المنشورات. يمكنك تغيير الموديل والرابط ليشمل أي مزود يدعم بروتوكول OpenAI مثل Azure OpenAI أو Local LLMs.' 
                        : 'The site uses NVIDIA models primarily for generating responses, translating content, and formatting posts. You can change the model and URL to any provider supporting the OpenAI protocol like Azure OpenAI or Local LLMs.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'slider' && (
            <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-8">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <RefreshCw className="text-blue-600" size={24} />
                {isRtl ? 'إعدادات السلايدر الرئيسي' : 'Hero Slider Configuration'}
              </h3>
              
              <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 mb-8 max-w-2xl">
                <p className="text-sm text-amber-800 font-bold mb-1">{isRtl ? 'إعدادات الحركة التلقائية' : 'Autoplay Configuration'}</p>
                <p className="text-xs text-amber-600 leading-relaxed">
                  {isRtl ? 'تحكم في سرعة تبديل الشرائح والوقت المستغرق للحركة الانتقالية بين كل شريحة وأخرى.' : 'Control slide switching speed and transition duration between slides.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-slate-700">
                    {isRtl ? 'وقت بقاء الشريحة (بالملي ثانية)' : 'Slide Autoplay Delay (ms)'}
                  </label>
                  <input 
                    type="number"
                    step={500}
                    min={1000}
                    value={settings.sliderAutoplayDelay || 8000}
                    onChange={(e) => setSettings({ ...settings, sliderAutoplayDelay: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  />
                  <p className="text-xs text-slate-400">{isRtl ? 'مثال: 8000 تعني 8 ثواني' : 'Example: 8000 means 8 seconds'}</p>
                </div>
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-slate-700">
                    {isRtl ? 'سرعة الانتقال (بالملي ثانية)' : 'Transition Speed (ms)'}
                  </label>
                  <input 
                    type="number"
                    step={100}
                    min={100}
                    value={settings.sliderTransitionSpeed || 1000}
                    onChange={(e) => setSettings({ ...settings, sliderTransitionSpeed: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  />
                  <p className="text-xs text-slate-400">{isRtl ? 'وقت حركة التلاشي أو الانزلاق' : 'Duration of fade or slide animation'}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'telegram' && (
            <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Terminal className="text-blue-600" size={24} />
                  {isRtl ? 'إدارة مساعد تليجرام الذكي' : 'Telegram Assistant Management'}
                </h3>
              </div>

              <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 space-y-2">
                <p className="text-sm text-blue-800 font-medium">
                  {isRtl ? 'حصري للمدراء: أضف معرفات تليجرام لتمكين التحكم في الموقع عبر البوت.' : 'Exclusive for admins: Add Telegram Chat IDs to enable site control via bot.'}
                </p>
                <p className="text-xs text-blue-600">
                  {isRtl ? 'يجب على الشخص إرسال أمر /start للبوت لمعرفة معرفه (Chat ID).' : 'The person must send /start to the bot to get their Chat ID.'}
                </p>
              </div>

              {/* Add New User */}
              <div className="flex flex-col md:flex-row gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex-1 space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">{isRtl ? 'معرف الدردشة (Chat ID)' : 'Chat ID'}</label>
                  <input 
                    type="text"
                    placeholder="123456789"
                    value={newTelegramUser.chatId}
                    onChange={(e) => setNewTelegramUser({ ...newTelegramUser, chatId: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">{isRtl ? 'اسم العرض' : 'Display Name'}</label>
                  <input 
                    type="text"
                    placeholder={isRtl ? 'اسم الشخص...' : 'Person Name...'}
                    value={newTelegramUser.displayName}
                    onChange={(e) => setNewTelegramUser({ ...newTelegramUser, displayName: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <button 
                  onClick={addTelegramUser}
                  disabled={loadingTelegram || !newTelegramUser.chatId}
                  className="self-end px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                  {loadingTelegram ? <RefreshCw className="animate-spin" size={20} /> : <Plus size={20} />}
                </button>
              </div>

              {/* User List */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-2">{isRtl ? 'الأشخاص المصرح لهم' : 'Authorized People'}</h4>
                <div className="grid grid-cols-1 gap-3">
                  {telegramUsers.length === 0 ? (
                    <p className="text-sm text-slate-400 italic text-center py-4">{isRtl ? 'لا يوجد مستخدمون مصرح لهم بعد' : 'No authorized users yet'}</p>
                  ) : (
                    telegramUsers.map((tUser) => (
                      <div key={tUser.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                            {tUser.displayName?.[0] || 'T'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{tUser.displayName}</div>
                            <div className="text-xs font-mono text-slate-400">ID: {tUser.chatId}</div>
                          </div>
                        </div>
                        <button 
                          onClick={() => deleteTelegramUser(tUser.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SMTP Settings */}
          {activeTab === 'smtp' && (
            <div className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Mail size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{isRtl ? 'إعدادات البريد الإلكتروني SMTP' : 'SMTP Email Settings'}</h2>
                  <p className="text-sm text-slate-500">{isRtl ? 'إدارة مزود خدمة البريد والنشرات والمراسلات' : 'Manage email provider and newsletters'}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-slate-700">{isRtl ? 'خادم SMTP (Host)' : 'SMTP Host'}</label>
                    <input 
                      type="text"
                      placeholder="e.g. smtp.office365.com"
                      value={settings.smtpHost || ''}
                      onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-slate-700">{isRtl ? 'المنفذ (Port)' : 'SMTP Port'}</label>
                    <input 
                      type="number"
                      placeholder="e.g. 587"
                      value={settings.smtpPort || ''}
                      onChange={(e) => setSettings({ ...settings, smtpPort: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-slate-700">{isRtl ? 'اسم المستخدم / البريد' : 'SMTP User / Email'}</label>
                    <input 
                      type="email"
                      placeholder="web@ph-ye.org"
                      value={settings.smtpUser || ''}
                      onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-slate-700">{isRtl ? 'كلمة المرور' : 'SMTP Password'}</label>
                    <input 
                      type="password"
                      placeholder="********"
                      value={settings.smtpPass || ''}
                      onChange={(e) => setSettings({ ...settings, smtpPass: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-slate-700">{isRtl ? 'البريد المرسل (From)' : 'Sender Email (From)'}</label>
                  <input 
                    type="email"
                    placeholder="web@ph-ye.org"
                    value={settings.smtpFrom || ''}
                    onChange={(e) => setSettings({ ...settings, smtpFrom: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                  />
                  <p className="text-xs text-slate-500">{isRtl ? 'سيظهر كعنوان المرسل للمستلمين' : 'Will appear as the sender address to recipients'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Maintenance Mode */}
          {activeTab === 'maintenance' && (
            <div className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600">
                  <Hammer size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">{isRtl ? 'وضع الصيانة' : 'Maintenance Mode'}</h3>
                  <p className="text-sm text-slate-500 font-medium">{isRtl ? 'إيقاف الموقع مؤقتاً للزوار لإجراء التحديثات' : 'Temporarily disable public access for updates'}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div>
                    <h4 className="font-bold text-slate-900">{isRtl ? 'تفعيل وضع الصيانة' : 'Enable Maintenance Mode'}</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-md">{isRtl ? 'عند التفعيل، سيرى جميع الزوار صفحة الصيانة المخصصة ولن يتمكنوا من تصفح الموقع باستثناء الإدارة.' : 'When enabled, all visitors will see a custom maintenance page. Admins can still access the dashboard.'}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={settings.maintenanceMode === 1}
                      onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked ? 1 : 0 })}
                    />
                    <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 rtl:after:right-1 rtl:after:left-auto after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-bold text-slate-900">
                    {isRtl ? 'رسالة الصيانة (عربي)' : 'Maintenance Message (Arabic)'}
                  </label>
                  <textarea
                    value={settings.maintenanceMessage?.ar || ''}
                    onChange={(e) => setSettings({ ...settings, maintenanceMessage: { ...settings.maintenanceMessage, ar: e.target.value } })}
                    placeholder={isRtl ? 'الموقع حالياً في وضع الصيانة لإجراء التحديثات...' : 'Site is under maintenance...'}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl px-5 py-4 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-medium resize-none min-h-[120px]"
                    dir="rtl"
                  />
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-bold text-slate-900">
                    {isRtl ? 'رسالة الصيانة (إنجليزي)' : 'Maintenance Message (English)'}
                  </label>
                  <textarea
                    value={settings.maintenanceMessage?.en || ''}
                    onChange={(e) => setSettings({ ...settings, maintenanceMessage: { ...settings.maintenanceMessage, en: e.target.value } })}
                    placeholder={isRtl ? 'الموقع حالياً في وضع الصيانة لإجراء التحديثات...' : 'Site is under maintenance...'}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl px-5 py-4 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-medium resize-none min-h-[120px]"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
