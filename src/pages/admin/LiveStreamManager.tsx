import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Save, Loader2, Video, Radio, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

export default function LiveStreamManager() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [streamSettings, setStreamSettings] = useState({
    isLive: false,
    title: { ar: '', en: '' },
    description: { ar: '', en: '' },
    embedUrl: '',
    platform: 'youtube', // youtube, facebook, twitch, custom
    restreamUrls: {
      facebook: '',
      twitter: '',
      youtube: '',
      twitch: '',
      instagram: '',
      tiktok: '',
      linkedin: ''
    },
    recordingEnabled: true,
    chatEnabled: true
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get('/api/settings');
        if (response.data && Object.keys(response.data).length > 0) {
           const s = response.data;
           if (s.livestream) {
               setStreamSettings({ ...streamSettings, ...(typeof s.livestream === 'string' ? JSON.parse(s.livestream) : s.livestream) });
           }
        }
      } catch (error) {
        console.error("Error fetching livestream settings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await api.get('/api/settings');
      let currentSettings = {};
      if (response.data && Object.keys(response.data).length > 0) {
          currentSettings = response.data;
      }
      
      await api.post('/api/settings', {
          ...currentSettings,
          livestream: streamSettings
      });
      alert(isRtl ? 'تم حفظ الإعدادات بنجاح' : 'Settings saved successfully');
    } catch (error) {
      console.error("Error saving livestream settings:", error);
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
          <h1 className="text-2xl font-bold text-slate-900">{isRtl ? 'إدارة البث المباشر' : 'Live Stream Management'}</h1>
          <p className="text-slate-500 text-sm mt-1">
            {isRtl ? 'إدارة البث المباشر للفعاليات وتوزيعه على منصات التواصل' : 'Manage live streaming for events and restreaming to social platforms'}
          </p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          {isRtl ? 'حفظ الإعدادات' : 'Save Settings'}
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 flex items-start gap-4">
        <AlertCircle className="text-blue-600 shrink-0 mt-1" />
        <div>
          <h3 className="font-bold text-blue-900 mb-2">
            {isRtl ? 'ملاحظة حول البث المباشر' : 'Note about Live Streaming'}
          </h3>
          <p className="text-blue-800 text-sm leading-relaxed">
            {isRtl 
              ? 'لاستضافة البث المباشر على النطاق الخاص بك وتوزيعه (Restreaming)، نوصي باستخدام خدمة مثل YouTube Live أو Vimeo وتضمين الرابط هنا. البنية التحتية الحالية مصممة للويب ولا تدعم خوادم RTMP المباشرة.' 
              : 'To host and restream live video, we recommend using a service like YouTube Live or Vimeo and embedding the link here. The current infrastructure is web-based and does not support direct RTMP ingest servers.'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm space-y-8">
        <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${streamSettings.isLive ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-500'}`}>
              <Radio size={24} className={streamSettings.isLive ? 'animate-pulse' : ''} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">{isRtl ? 'حالة البث' : 'Stream Status'}</h3>
              <p className="text-slate-500 text-sm">{streamSettings.isLive ? (isRtl ? 'البث قيد التشغيل حالياً' : 'Stream is currently live') : (isRtl ? 'البث متوقف' : 'Stream is offline')}</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer"
              checked={streamSettings.isLive}
              onChange={(e) => setStreamSettings({...streamSettings, isLive: e.target.checked})}
            />
            <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-500"></div>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">
              {isRtl ? 'عنوان البث (عربي)' : 'Stream Title (Arabic)'}
            </label>
            <input 
              type="text"
              value={streamSettings.title.ar}
              onChange={(e) => setStreamSettings({...streamSettings, title: {...streamSettings.title, ar: e.target.value}})}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              dir="rtl"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">
              {isRtl ? 'عنوان البث (إنجليزي)' : 'Stream Title (English)'}
            </label>
            <input 
              type="text"
              value={streamSettings.title.en}
              onChange={(e) => setStreamSettings({...streamSettings, title: {...streamSettings.title, en: e.target.value}})}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              dir="ltr"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-slate-700">
            {isRtl ? 'رابط التضمين (Embed URL)' : 'Embed URL'}
          </label>
          <input 
            type="text"
            value={streamSettings.embedUrl}
            onChange={(e) => setStreamSettings({...streamSettings, embedUrl: e.target.value})}
            placeholder="https://www.youtube.com/embed/..."
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
            dir="ltr"
          />
          <p className="text-xs text-slate-500 mt-1">
            {isRtl ? 'ضع رابط التضمين من يوتيوب أو فيسبوك أو رابط HLS' : 'Enter the embed URL from YouTube, Facebook, or an HLS stream URL'}
          </p>
        </div>

        <div className="border-t border-slate-200 pt-8">
          <h3 className="font-bold text-lg text-slate-900 mb-6 flex items-center gap-2">
            <Globe size={20} className="text-blue-600" />
            {isRtl ? 'قنوات التوزيع وإعادة البث (Restreaming)' : 'Distribution & Restreaming Channels'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">YouTube Live URL</label>
              <input 
                type="url"
                value={streamSettings.restreamUrls.youtube}
                onChange={(e) => setStreamSettings({...streamSettings, restreamUrls: {...streamSettings.restreamUrls, youtube: e.target.value}})}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">Facebook Live URL</label>
              <input 
                type="url"
                value={streamSettings.restreamUrls.facebook}
                onChange={(e) => setStreamSettings({...streamSettings, restreamUrls: {...streamSettings.restreamUrls, facebook: e.target.value}})}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">X (Twitter) Live URL</label>
              <input 
                type="url"
                value={streamSettings.restreamUrls.twitter}
                onChange={(e) => setStreamSettings({...streamSettings, restreamUrls: {...streamSettings.restreamUrls, twitter: e.target.value}})}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">Twitch URL</label>
              <input 
                type="url"
                value={streamSettings.restreamUrls.twitch}
                onChange={(e) => setStreamSettings({...streamSettings, restreamUrls: {...streamSettings.restreamUrls, twitch: e.target.value}})}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">Instagram Live URL</label>
              <input 
                type="url"
                value={streamSettings.restreamUrls.instagram || ''}
                onChange={(e) => setStreamSettings({...streamSettings, restreamUrls: {...streamSettings.restreamUrls, instagram: e.target.value}})}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">LinkedIn Live URL</label>
              <input 
                type="url"
                value={streamSettings.restreamUrls.linkedin || ''}
                onChange={(e) => setStreamSettings({...streamSettings, restreamUrls: {...streamSettings.restreamUrls, linkedin: e.target.value}})}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                dir="ltr"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{isRtl ? 'تفعيل التسجيل' : 'Enable Recording'}</h4>
                <p className="text-xs text-slate-500">{isRtl ? 'حفظ نسخة من البث في المكتبة' : 'Save a copy of the stream to the library'}</p>
              </div>
              <input 
                type="checkbox"
                checked={streamSettings.recordingEnabled}
                onChange={(e) => setStreamSettings({...streamSettings, recordingEnabled: e.target.checked})}
                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
           </div>
           <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{isRtl ? 'تفعيل الدردشة' : 'Enable Live Chat'}</h4>
                <p className="text-xs text-slate-500">{isRtl ? 'السماح للجمهور بالتعليق أثناء البث' : 'Allow audience to comment during stream'}</p>
              </div>
              <input 
                type="checkbox"
                checked={streamSettings.chatEnabled}
                onChange={(e) => setStreamSettings({...streamSettings, chatEnabled: e.target.checked})}
                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
           </div>
        </div>
      </div>
    </div>
  );
}
