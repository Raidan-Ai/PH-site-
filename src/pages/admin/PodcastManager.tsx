import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Mic, Play, Pause, Plus, Edit, Trash2, Calendar, 
  Clock, Disc, User, FileText, Loader2, Image as ImageIcon, 
  ArrowRight, ExternalLink, Headphones, Sparkles, Check, ChevronRight, HelpCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { clsx } from 'clsx';

interface Podcast {
  id: number;
  title_ar: string;
  title_en?: string;
  description_ar?: string;
  description_en?: string;
  cover_url?: string;
  host?: string;
  createdAt: string;
}

interface Episode {
  id: number;
  podcast_id: number;
  title_ar: string;
  title_en?: string;
  description_ar?: string;
  description_en?: string;
  audio_url?: string;
  duration?: string;
  publish_date?: string;
  views: number;
  createdAt: string;
}

export default function PodcastManager() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [selectedPodcast, setSelectedPodcast] = useState<Podcast | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  
  const [loadingPodcasts, setLoadingPodcasts] = useState(true);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);

  // Modals / forms states
  const [showPodcastModal, setShowPodcastModal] = useState(false);
  const [editingPodcast, setEditingPodcast] = useState<Podcast | null>(null);
  const [podcastForm, setPodcastForm] = useState({
    title_ar: '',
    title_en: '',
    description_ar: '',
    description_en: '',
    cover_url: '',
    host: ''
  });

  const [showEpisodeModal, setShowEpisodeModal] = useState(false);
  const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null);
  const [episodeForm, setEpisodeForm] = useState({
    title_ar: '',
    title_en: '',
    description_ar: '',
    description_en: '',
    audio_url: '',
    duration: '',
    publish_date: ''
  });

  // Audio preview playback state
  const [activeAudioUrl, setActiveAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Fetch Podcasts on mount
  useEffect(() => {
    fetchPodcasts();
  }, []);

  // Fetch episodes whenever a podcast is selected
  useEffect(() => {
    if (selectedPodcast) {
      fetchEpisodes(selectedPodcast.id);
    } else {
      setEpisodes([]);
    }
  }, [selectedPodcast]);

  const fetchPodcasts = async () => {
    setLoadingPodcasts(true);
    try {
      const res = await api.get('/api/podcasts');
      setPodcasts(res.data || []);
    } catch (err) {
      console.error('Error fetching podcasts:', err);
    } finally {
      setLoadingPodcasts(false);
    }
  };

  const fetchEpisodes = async (podcastId: number) => {
    setLoadingEpisodes(true);
    try {
      const res = await api.get(`/api/podcasts/${podcastId}/episodes`);
      setEpisodes(res.data || []);
    } catch (err) {
      console.error('Error fetching episodes:', err);
    } finally {
      setLoadingEpisodes(false);
    }
  };

  // Podcast Channel handlers
  const handleOpenPodcastModal = (podcast: Podcast | null = null) => {
    if (podcast) {
      setEditingPodcast(podcast);
      setPodcastForm({
        title_ar: podcast.title_ar || '',
        title_en: podcast.title_en || '',
        description_ar: podcast.description_ar || '',
        description_en: podcast.description_en || '',
        cover_url: podcast.cover_url || '',
        host: podcast.host || ''
      });
    } else {
      setEditingPodcast(null);
      setPodcastForm({
        title_ar: '',
        title_en: '',
        description_ar: '',
        description_en: '',
        cover_url: '',
        host: ''
      });
    }
    setShowPodcastModal(true);
  };

  const handleSavePodcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!podcastForm.title_ar) {
      alert(isRtl ? 'الرجاء إدخال اسم القناة بالعربية' : 'Please input the Arabic show title');
      return;
    }

    try {
      if (editingPodcast) {
        await api.put(`/api/podcasts/${editingPodcast.id}`, podcastForm);
      } else {
        await api.post('/api/podcasts', podcastForm);
      }
      setShowPodcastModal(false);
      fetchPodcasts();
    } catch (err) {
      console.error('Error saving podcast:', err);
      alert(isRtl ? 'فشل حفظ بيانات القناة' : 'Failed to save podcast channel');
    }
  };

  const handleDeletePodcast = async (id: number) => {
    if (!window.confirm(isRtl 
      ? 'هل أنت متأكد من حذف هذه القناة نهائياً؟ سيتم حذف جميع الحلقات المرتبطة بها!' 
      : 'Are you sure you want to delete this podcast channel? All associated episodes will be deleted!')) return;

    try {
      await api.delete(`/api/podcasts/${id}`);
      if (selectedPodcast?.id === id) {
        setSelectedPodcast(null);
      }
      fetchPodcasts();
    } catch (err) {
      console.error('Error deleting podcast:', err);
    }
  };

  // Episodes handlers
  const handleOpenEpisodeModal = (episode: Episode | null = null) => {
    if (!selectedPodcast) return;
    if (episode) {
      setEditingEpisode(episode);
      setEpisodeForm({
        title_ar: episode.title_ar || '',
        title_en: episode.title_en || '',
        description_ar: episode.description_ar || '',
        description_en: episode.description_en || '',
        audio_url: episode.audio_url || '',
        duration: episode.duration || '',
        publish_date: episode.publish_date || ''
      });
    } else {
      setEditingEpisode(null);
      setEpisodeForm({
        title_ar: '',
        title_en: '',
        description_ar: '',
        description_en: '',
        audio_url: '',
        duration: '',
        publish_date: new Date().toISOString().split('T')[0]
      });
    }
    setShowEpisodeModal(true);
  };

  const handleSaveEpisode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPodcast) return;
    if (!episodeForm.title_ar) {
      alert(isRtl ? 'الرجاء إدخال عنوان الحلقة بالعربية' : 'Please input the Arabic episode title');
      return;
    }

    try {
      if (editingEpisode) {
        await api.put(`/api/podcasts/episodes/${editingEpisode.id}`, {
          ...episodeForm,
          podcast_id: selectedPodcast.id
        });
      } else {
        await api.post(`/api/podcasts/${selectedPodcast.id}/episodes`, episodeForm);
      }
      setShowEpisodeModal(false);
      fetchEpisodes(selectedPodcast.id);
    } catch (err) {
      console.error('Error saving episode:', err);
      alert(isRtl ? 'فشل حفظ بيانات الحلقة' : 'Failed to save episode details');
    }
  };

  const handleDeleteEpisode = async (id: number) => {
    if (!window.confirm(isRtl ? 'هل أنت متأكد من حذف هذه الحلقة نهائياً؟' : 'Are you sure you want to delete this episode permanently?')) return;
    try {
      await api.delete(`/api/podcasts/episodes/${id}`);
      if (selectedPodcast) {
        fetchEpisodes(selectedPodcast.id);
      }
    } catch (err) {
      console.error('Error deleting episode:', err);
    }
  };

  // Audio playback controls
  const togglePlayAudio = (url: string) => {
    if (activeAudioUrl === url) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
    } else {
      setActiveAudioUrl(url);
      setIsPlaying(true);
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.src = url;
          audioRef.current.play();
        }
      }, 50);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in-50">
      {/* Hidden Audio element */}
      {activeAudioUrl && (
        <audio 
          ref={audioRef} 
          onEnded={() => setIsPlaying(false)}
          className="hidden" 
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">
            {isRtl ? 'إدارة استديو البودكاست الرقمي' : 'Digital Podcast Studio'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {isRtl 
              ? 'إنشاء قنوات البودكاست، إدارة الحلقات، تسجيل وتوثيق الملفات الصوتية، ومتابعة إحصائيات الاستماع.' 
              : 'Create shows, manage episodes, index audio tracks, and audit visitor streaming logs.'}
          </p>
        </div>
        <button
          onClick={() => handleOpenPodcastModal(null)}
          className="px-5 py-3 bg-slate-950 text-white font-black text-xs rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg hover:shadow-slate-300 active:scale-95 cursor-pointer"
        >
          <Plus size={16} />
          {isRtl ? 'قناة بودكاست جديدة' : 'New Podcast Show'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Podcast Channels Grid (5 columns if selected, 12 if not) */}
        <div className={clsx("transition-all duration-300", selectedPodcast ? "lg:col-span-5 space-y-6" : "lg:col-span-12")}>
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
              <Disc className="text-blue-600 animate-spin" style={{ animationDuration: '6s' }} size={18} />
              {isRtl ? 'قنوات وبودكاست المؤسسة' : 'PressHouse Podcast Channels'}
            </h3>
            {selectedPodcast && (
              <button
                onClick={() => setSelectedPodcast(null)}
                className="text-xs text-blue-600 hover:underline font-bold flex items-center gap-1"
              >
                {isRtl ? 'عرض كل القنوات مفرودة' : 'Expand Show list'}
                <ChevronRight size={14} className={isRtl ? 'rotate-180' : ''} />
              </button>
            )}
          </div>

          {loadingPodcasts ? (
            <div className="flex justify-center py-16"><Loader2 size={36} className="animate-spin text-blue-600" /></div>
          ) : podcasts.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-10 text-center text-slate-500 text-xs font-semibold">
              <Mic className="mx-auto text-slate-300 mb-3" size={40} />
              {isRtl ? 'لا توجد قنوات بودكاست نشطة حالياً. انقر على "قناة بودكاست جديدة" بالأعلى للبدء!' : 'No podcast channels found. Click New Podcast Show to begin!'}
            </div>
          ) : (
            <div className={clsx("grid gap-4", selectedPodcast ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3")}>
              {podcasts.map((show) => {
                const isCurrent = selectedPodcast?.id === show.id;
                return (
                  <div
                    key={show.id}
                    className={clsx(
                      "group relative rounded-2xl border bg-white p-5 transition-all flex flex-col justify-between overflow-hidden shadow-sm",
                      isCurrent 
                        ? "border-blue-600 ring-2 ring-blue-50" 
                        : "border-slate-200/80 hover:border-slate-300 hover:shadow-md"
                    )}
                  >
                    <div className="flex gap-4">
                      {/* Cover art */}
                      <div className="w-20 h-20 rounded-xl bg-slate-100 overflow-hidden relative flex-shrink-0 border border-slate-200">
                        {show.cover_url ? (
                          <img src={show.cover_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                            <Mic size={24} />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="space-y-1">
                        <span className="text-[9px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold tracking-wider uppercase">
                          {show.host || (isRtl ? 'دون مضيف' : 'No Host')}
                        </span>
                        <h4 className="font-black text-slate-900 text-sm leading-tight line-clamp-1">
                          {isRtl ? show.title_ar : (show.title_en || show.title_ar)}
                        </h4>
                        <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                          {isRtl ? show.description_ar : (show.description_en || show.description_ar)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-5">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleOpenPodcastModal(show)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title={isRtl ? 'تعديل بيانات القناة' : 'Edit Channel'}
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDeletePodcast(show.id)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title={isRtl ? 'حذف القناة' : 'Delete Channel'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <button
                        onClick={() => setSelectedPodcast(show)}
                        className={clsx(
                          "px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 transition-all cursor-pointer",
                          isCurrent 
                            ? "bg-blue-600 text-white" 
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        )}
                      >
                        {isRtl ? 'حلقات القناة' : 'Manage Episodes'}
                        <ArrowRight size={13} className={clsx("transition-transform", isRtl ? "rotate-180" : "", isCurrent ? "translate-x-1" : "")} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Episodes List for selected Podcast (7 columns) */}
        {selectedPodcast && (
          <div className="lg:col-span-7 space-y-6 animate-in slide-in-from-right-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{isRtl ? 'حلقات القناة النشطة' : 'SHOWING EPISODES OF'}</span>
                <h3 className="text-base font-black text-slate-900 leading-tight">
                  {isRtl ? selectedPodcast.title_ar : (selectedPodcast.title_en || selectedPodcast.title_ar)}
                </h3>
              </div>
              <button
                onClick={() => handleOpenEpisodeModal(null)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} />
                {isRtl ? 'إضافة حلقة صوتية' : 'Publish Episode'}
              </button>
            </div>

            {loadingEpisodes ? (
              <div className="flex justify-center py-20"><Loader2 size={36} className="animate-spin text-blue-600" /></div>
            ) : episodes.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-12 text-center text-slate-500 text-xs font-medium">
                <Disc className="mx-auto text-slate-300 mb-3" size={36} />
                {isRtl ? 'هذه القناة فارغة حالياً. لا توجد حلقات مضافة.' : 'No episodes published for this show yet.'}
              </div>
            ) : (
              <div className="space-y-4">
                {episodes.map((ep) => {
                  const isCurrentPlaying = activeAudioUrl === ep.audio_url;
                  return (
                    <div
                      key={ep.id}
                      className={clsx(
                        "p-4 rounded-2xl border bg-white flex items-center justify-between gap-4 transition-all hover:shadow-md",
                        isCurrentPlaying ? "border-blue-500 shadow-sm" : "border-slate-100"
                      )}
                    >
                      <div className="flex items-center gap-3.5">
                        {/* Play/Pause Button */}
                        {ep.audio_url ? (
                          <button
                            onClick={() => togglePlayAudio(ep.audio_url!)}
                            className={clsx(
                              "w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-sm flex-shrink-0",
                              isCurrentPlaying && isPlaying
                                ? "bg-red-500 text-white"
                                : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                            )}
                          >
                            {isCurrentPlaying && isPlaying ? <Pause size={16} /> : <Play size={16} className={isRtl ? 'mr-0' : 'ml-0.5'} />}
                          </button>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center flex-shrink-0">
                            <Headphones size={16} />
                          </div>
                        )}

                        {/* Title and metadata */}
                        <div className="space-y-1">
                          <h4 className="font-bold text-slate-900 text-sm leading-tight">
                            {isRtl ? ep.title_ar : (ep.title_en || ep.title_ar)}
                          </h4>
                          <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500">
                            <span className="flex items-center gap-1 font-semibold">
                              <Calendar size={11} />
                              {ep.publish_date || (isRtl ? 'دون تاريخ' : 'No Date')}
                            </span>
                            <span className="flex items-center gap-1 font-semibold">
                              <Clock size={11} />
                              {ep.duration || (isRtl ? 'دون توقيت' : 'N/A')}
                            </span>
                            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                              {ep.views} {isRtl ? 'استماع' : 'views'}
                            </span>
                          </div>
                          {ep.description_ar && (
                            <p className="text-xs text-slate-500 line-clamp-1 leading-relaxed mt-1">
                              {isRtl ? ep.description_ar : (ep.description_en || ep.description_ar)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Episode Action tools */}
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleOpenEpisodeModal(ep)}
                          className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title={isRtl ? 'تعديل الحلقة' : 'Edit Episode'}
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteEpisode(ep.id)}
                          className="p-2 text-red-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title={isRtl ? 'حذف الحلقة' : 'Delete Episode'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Podcast Channel Form Modal */}
      {showPodcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Mic className="text-blue-600 animate-bounce" size={18} />
                {editingPodcast ? (isRtl ? 'تعديل بيانات القناة' : 'Edit Show Details') : (isRtl ? 'إنشاء قناة بودكاست جديدة' : 'New Podcast Channel')}
              </h3>
              <button onClick={() => setShowPodcastModal(false)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">❌</button>
            </div>

            <form onSubmit={handleSavePodcast} className="p-6 space-y-4 text-xs">
              {/* Title Ar */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'اسم القناة (بالعربية) *' : 'Show Title (Arabic) *'}</label>
                <input 
                  type="text" 
                  required
                  placeholder="مثال: صوت الحريّة"
                  value={podcastForm.title_ar}
                  onChange={(e) => setPodcastForm({...podcastForm, title_ar: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                />
              </div>

              {/* Title En */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'اسم القناة (بالإنجليزية)' : 'Show Title (English)'}</label>
                <input 
                  type="text" 
                  placeholder="e.g. Voice of Freedom"
                  value={podcastForm.title_en}
                  onChange={(e) => setPodcastForm({...podcastForm, title_en: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Host */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'مقدّم البرنامج (Host)' : 'Host Name'}</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Ahmed Al-Sabri"
                    value={podcastForm.host}
                    onChange={(e) => setPodcastForm({...podcastForm, host: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                  />
                </div>

                {/* Cover URL */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'رابط شعار القناة (Cover URL)' : 'Cover Image URL'}</label>
                  <input 
                    type="text" 
                    placeholder="e.g. /uploads/images/cover.jpg"
                    value={podcastForm.cover_url}
                    onChange={(e) => setPodcastForm({...podcastForm, cover_url: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Description Ar */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'شرح وتفاصيل القناة (بالعربية)' : 'Description (Arabic)'}</label>
                <textarea 
                  rows={3}
                  placeholder="اكتب خلاصة البرنامج ومواضيعه..."
                  value={podcastForm.description_ar}
                  onChange={(e) => setPodcastForm({...podcastForm, description_ar: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold"
                />
              </div>

              {/* Description En */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'شرح وتفاصيل القناة (بالإنجليزية)' : 'Description (English)'}</label>
                <textarea 
                  rows={2}
                  placeholder="e.g. Highlights human rights violations..."
                  value={podcastForm.description_en}
                  onChange={(e) => setPodcastForm({...podcastForm, description_en: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold"
                />
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-2.5">
                <HelpCircle className="text-blue-500 mt-0.5" size={16} />
                <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                  {isRtl 
                    ? 'نصيحة: يمكنك نسخ رابط صورة الغلاف مباشرة من "المكتبة" (Media Library) ولصقها في حقل رابط شعار القناة بالأعلى!' 
                    : 'Tip: Copy any cover art URL directly from the self-managed Media Library and paste it in the Cover URL field!'}
                </p>
              </div>

              <div className="flex justify-end gap-2 text-xs pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPodcastModal(false)}
                  className="px-5 py-2.5 font-bold text-slate-500 hover:text-slate-800"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-slate-950 text-white hover:bg-slate-800 rounded-xl font-black shadow-md"
                >
                  {isRtl ? 'حفظ البيانات' : 'Save Channel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Episode Form Modal */}
      {showEpisodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Mic className="text-blue-600 animate-pulse" size={18} />
                {editingEpisode ? (isRtl ? 'تعديل بيانات الحلقة' : 'Edit Episode') : (isRtl ? 'إضافة حلقة صوتية جديدة' : 'Add New Episode')}
              </h3>
              <button onClick={() => setShowEpisodeModal(false)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">❌</button>
            </div>

            <form onSubmit={handleSaveEpisode} className="p-6 space-y-4 text-xs">
              {/* Title Ar */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'عنوان الحلقة (بالعربية) *' : 'Episode Title (Arabic) *'}</label>
                <input 
                  type="text" 
                  required
                  placeholder="مثال: حرية الصحافة في ظل التحديات الراهنة"
                  value={episodeForm.title_ar}
                  onChange={(e) => setEpisodeForm({...episodeForm, title_ar: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                />
              </div>

              {/* Title En */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'عنوان الحلقة (بالإنجليزية)' : 'Episode Title (English)'}</label>
                <input 
                  type="text" 
                  placeholder="e.g. Press freedom under current challenges"
                  value={episodeForm.title_en}
                  onChange={(e) => setEpisodeForm({...episodeForm, title_en: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                />
              </div>

              {/* Audio URL */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'رابط الملف الصوتي (Audio Audio URL) *' : 'Audio Streaming URL (MP3) *'}</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. /uploads/audio/episode-1.mp3"
                  value={episodeForm.audio_url}
                  onChange={(e) => setEpisodeForm({...episodeForm, audio_url: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Duration */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'المدة الزمنية (مثال: 45:30)' : 'Duration (e.g. 45:30)'}</label>
                  <input 
                    type="text" 
                    placeholder="45:30"
                    value={episodeForm.duration}
                    onChange={(e) => setEpisodeForm({...episodeForm, duration: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-semibold"
                  />
                </div>

                {/* Publish Date */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'تاريخ النشر' : 'Publish Date'}</label>
                  <input 
                    type="date" 
                    value={episodeForm.publish_date}
                    onChange={(e) => setEpisodeForm({...episodeForm, publish_date: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Description Ar */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'تفاصيل وشرح الحلقة (بالعربية)' : 'Show Notes (Arabic)'}</label>
                <textarea 
                  rows={2}
                  placeholder="اكتب خلاصة مواضيع الحلقة..."
                  value={episodeForm.description_ar}
                  onChange={(e) => setEpisodeForm({...episodeForm, description_ar: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold"
                />
              </div>

              {/* Description En */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'تفاصيل وشرح الحلقة (بالإنجليزية)' : 'Show Notes (English)'}</label>
                <textarea 
                  rows={2}
                  placeholder="e.g. Discussion with prominent journalists..."
                  value={episodeForm.description_en}
                  onChange={(e) => setEpisodeForm({...episodeForm, description_en: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold"
                />
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-2.5">
                <HelpCircle className="text-blue-500 mt-0.5" size={16} />
                <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                  {isRtl 
                    ? 'ملاحظة: يمكنك رفع وتعديل الملفات الصوتية بكل سهولة وبصورة ذاتية عبر "المكتبة" (Media Library)، ثم نسخ الرابط المباشر للملف ولصقه هنا.' 
                    : 'Note: Upload audio tracks via the self-managed Media Library, then copy the streaming URL and paste it here.'}
                </p>
              </div>

              <div className="flex justify-end gap-2 text-xs pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEpisodeModal(false)}
                  className="px-5 py-2.5 font-bold text-slate-500 hover:text-slate-800"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-black shadow-md"
                >
                  {isRtl ? 'نشر الحلقة' : 'Publish Episode'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
