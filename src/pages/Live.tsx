import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Radio, Users, Calendar, Share2, Facebook, Twitter, Youtube, Loader2, ExternalLink } from 'lucide-react';
import { api } from '../services/api';
import { motion } from 'framer-motion';

export default function Live() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [loading, setLoading] = useState(true);
  const [streamSettings, setStreamSettings] = useState<any>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get('/api/settings');
        if (response.data && Object.keys(response.data).length > 0) {
            const s = response.data;
            if (s.livestream) {
               setStreamSettings(typeof s.livestream === 'string' ? JSON.parse(s.livestream) : s.livestream);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!streamSettings || !streamSettings.isLive) {
    return (
      <div className="min-h-screen bg-slate-50 pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white rounded-[32px] p-12 shadow-sm border border-slate-100 flex flex-col items-center">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <Radio size={48} className="text-slate-400" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-4">
              {isRtl ? 'لا يوجد بث مباشر حالياً' : 'No Live Stream Currently'}
            </h1>
            <p className="text-slate-500 text-lg max-w-xl">
              {isRtl 
                ? 'ترقبوا فعالياتنا القادمة. سيتم الإعلان عن البث المباشر القادم قريباً.' 
                : 'Stay tuned for our upcoming events. The next live stream will be announced soon.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 pt-32 pb-20 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                <Radio size={16} />
                {isRtl ? 'مباشر' : 'LIVE'}
              </span>
              <span className="text-slate-400 text-sm flex items-center gap-1">
                <Users size={16} />
                {isRtl ? 'يشاهد الآن' : 'Watching now'}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold">
              {isRtl ? streamSettings.title.ar : streamSettings.title.en}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-sm">{isRtl ? 'مشاركة البث:' : 'Share stream:'}</span>
            <button className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-600 transition-colors">
              <Facebook size={18} />
            </button>
            <button className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-sky-500 transition-colors">
              <Twitter size={18} />
            </button>
            <button className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors">
              <Share2 size={18} />
            </button>
          </div>
        </div>

        {/* Video Player Area */}
        <div className="bg-black rounded-3xl overflow-hidden aspect-video shadow-2xl border border-slate-800 relative group">
          {streamSettings.embedUrl ? (
            <iframe 
              src={streamSettings.embedUrl} 
              className="w-full h-full absolute inset-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            ></iframe>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800">
              <Radio size={64} className="text-slate-600 mb-4" />
              <p className="text-slate-400">{isRtl ? 'جاري تحميل البث...' : 'Loading stream...'}</p>
            </div>
          )}
        </div>

        {/* Description & Restreaming Links */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-slate-800 rounded-3xl p-8 border border-slate-700">
            <h2 className="text-xl font-bold mb-4">{isRtl ? 'عن هذا البث' : 'About this stream'}</h2>
            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
              {isRtl ? streamSettings.description.ar : streamSettings.description.en}
            </p>
          </div>
          
          <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700 h-fit">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Share2 className="text-blue-400" />
              {isRtl ? 'يُبث أيضاً على' : 'Also streaming on'}
            </h3>
            <div className="space-y-4">
              {streamSettings.restreamUrls?.youtube && (
                <a href={streamSettings.restreamUrls.youtube} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 rounded-2xl bg-slate-700/50 hover:bg-slate-700 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                      <Youtube size={20} />
                    </div>
                    <span className="font-medium">YouTube Live</span>
                  </div>
                  <ExternalLink size={16} className="text-slate-500 group-hover:text-white transition-colors" />
                </a>
              )}
              {streamSettings.restreamUrls?.facebook && (
                <a href={streamSettings.restreamUrls.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 rounded-2xl bg-slate-700/50 hover:bg-slate-700 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-500">
                      <Facebook size={20} />
                    </div>
                    <span className="font-medium">Facebook Live</span>
                  </div>
                  <ExternalLink size={16} className="text-slate-500 group-hover:text-white transition-colors" />
                </a>
              )}
              {streamSettings.restreamUrls?.twitter && (
                <a href={streamSettings.restreamUrls.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 rounded-2xl bg-slate-700/50 hover:bg-slate-700 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-500">
                      <Twitter size={20} />
                    </div>
                    <span className="font-medium">X (Twitter)</span>
                  </div>
                  <ExternalLink size={16} className="text-slate-500 group-hover:text-white transition-colors" />
                </a>
              )}
              
              {!streamSettings.restreamUrls?.youtube && !streamSettings.restreamUrls?.facebook && !streamSettings.restreamUrls?.twitter && (
                <p className="text-slate-500 text-sm text-center py-4">
                  {isRtl ? 'لا توجد منصات أخرى حالياً' : 'No other platforms currently'}
                </p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
