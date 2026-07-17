import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Play, Plus, Edit, Trash2, Loader2, Link as LinkIcon, 
  Check, X, RefreshCw, Video, MoveUp, MoveDown, HelpCircle, Eye, EyeOff,
  Upload, Globe
} from 'lucide-react';
import { api } from '../../services/api';
import { cn } from '../../lib/utils';

interface VideoItem {
  id: number;
  url: string;
  title: string;
  isActive: number;
  sort_order: number;
  type: 'social' | 'local';
  thumbnail?: string;
  createdAt: string;
  isBroken?: number;
  lastChecked?: string;
  errorMessage?: string;
}

export default function VideosManager() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activePlayId, setActivePlayId] = useState<number | null>(null);
  const [validatingAll, setValidatingAll] = useState(false);
  const [validatingId, setValidatingId] = useState<number | null>(null);

  // Modal / Form States
  const [showModal, setShowModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    url: '',
    title: '',
    isActive: true,
    sort_order: 0,
    type: 'social' as 'social' | 'local',
    thumbnail: ''
  });

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/social-reels'); // Keep API compatible for now
      setVideos(res.data || []);
    } catch (err) {
      console.error('Error fetching videos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleOpenModal = (video: VideoItem | null = null) => {
    if (video) {
      setEditingVideo(video);
      setForm({
        url: video.url,
        title: video.title || '',
        isActive: video.isActive === 1,
        sort_order: video.sort_order || 0,
        type: video.type || 'social',
        thumbnail: video.thumbnail || ''
      });
    } else {
      setEditingVideo(null);
      const maxOrder = videos.reduce((max, v) => Math.max(max, v.sort_order || 0), 0);
      setForm({
        url: '',
        title: '',
        isActive: true,
        sort_order: maxOrder + 1,
        type: 'social',
        thumbnail: ''
      });
    }
    setShowModal(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'url' | 'thumbnail') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/api/upload', formData);
      setForm(prev => ({ ...prev, [field]: res.data.url }));
    } catch (err) {
      console.error('Upload failed:', err);
      alert(isRtl ? 'فشل رفع الملف' : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.url) {
      alert(isRtl ? 'الرجاء إدخال رابط الفيديو أو رفعه' : 'Please enter or upload a video URL');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        isActive: form.isActive ? 1 : 0
      };

      if (editingVideo) {
        await api.put(`/api/social-reels/${editingVideo.id}`, payload);
      } else {
        await api.post('/api/social-reels', payload);
      }
      setShowModal(false);
      fetchVideos();
    } catch (err) {
      console.error('Error saving video:', err);
      alert(isRtl ? 'حدث خطأ أثناء الحفظ' : 'Error saving video');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(isRtl ? 'هل أنت متأكد من حذف هذا الفيديو؟' : 'Are you sure you want to delete this video?')) {
      return;
    }

    try {
      await api.delete(`/api/social-reels/${id}`);
      if (activePlayId === id) setActivePlayId(null);
      fetchVideos();
    } catch (err) {
      console.error('Error deleting video:', err);
      alert(isRtl ? 'فشل حذف الفيديو' : 'Failed to delete video');
    }
  };

  const handleToggleActive = async (video: VideoItem) => {
    try {
      const updatedActive = video.isActive === 1 ? 0 : 1;
      await api.put(`/api/social-reels/${video.id}`, {
        ...video,
        isActive: updatedActive
      });
      fetchVideos();
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  const handleValidateAll = async () => {
    setValidatingAll(true);
    try {
      const res = await api.post('/api/social-reels/trigger-check');
      setVideos(res.data.data || []);
    } catch (err) {
      console.error('Error validating all videos:', err);
      alert(isRtl ? 'حدث خطأ أثناء فحص الروابط' : 'An error occurred during bulk verification');
    } finally {
      setValidatingAll(false);
    }
  };

  const handleValidateSingle = async (id: number) => {
    setValidatingId(id);
    try {
      const res = await api.post(`/api/social-reels/${id}/check-single`);
      const updated = videos.map(v => v.id === id ? { 
        ...v, 
        isBroken: res.data.isBroken, 
        errorMessage: res.data.errorMessage, 
        lastChecked: new Date().toISOString() 
      } : v);
      setVideos(updated);
    } catch (err) {
      console.error('Error validating single video:', err);
      alert(isRtl ? 'فشل فحص الرابط المحدد' : 'Failed to validate selected link');
    } finally {
      setValidatingId(null);
    }
  };

  const getEmbedUrl = (url: string) => {
    if (url.includes('facebook.com')) {
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&t=0`;
    }
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const id = url.split('v=')[1]?.split('&')[0] || url.split('/').pop();
      return `https://www.youtube.com/embed/${id}`;
    }
    return url;
  };

  const brokenVideos = videos.filter(v => v.isBroken === 1 && v.isActive === 1 && v.type === 'social');
  const brokenCount = brokenVideos.length;

  return (
    <div className="space-y-8">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Video className="text-blue-600" size={24} />
            {isRtl ? 'إدارة الفيديوهات' : 'Videos Manager'}
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            {isRtl 
              ? 'إضافة وحذف وترتيب الفيديوهات القصيرة والريلات والإنتاجات المرئية' 
              : 'Add, delete, re-order, and toggle short videos, reels, and visual productions.'}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            onClick={() => fetchVideos()}
            className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-slate-600 hover:bg-slate-100 transition active:scale-95"
            title={isRtl ? 'تحديث البيانات' : 'Refresh list'}
          >
            <RefreshCw size={16} className={cn(loading && "animate-spin")} />
          </button>

          <button
            onClick={handleValidateAll}
            disabled={validatingAll}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-100 text-amber-700 hover:bg-amber-100 transition active:scale-95 disabled:opacity-50"
            title={isRtl ? 'فحص صحة جميع الروابط الخارجية' : 'Validate all social links health'}
          >
            <RefreshCw size={14} className={cn(validatingAll && "animate-spin")} />
            <span className="text-xs font-bold">
              {isRtl ? 'فحص الروابط' : 'Validate Links'}
            </span>
          </button>
          
          <button
            onClick={() => handleOpenModal(null)}
            className="flex-grow sm:flex-grow-0 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-lg shadow-blue-600/15 hover:shadow-blue-600/25 transition active:scale-95"
          >
            <Plus size={16} />
            {isRtl ? 'إضافة فيديو جديد' : 'Add New Video'}
          </button>
        </div>
      </div>

      {/* Supervisor Alerts Banner */}
      {brokenCount > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="space-y-1.5">
            <h3 className="text-red-800 font-black text-lg flex items-center gap-2">
              <span className="animate-pulse inline-block w-2.5 h-2.5 rounded-full bg-red-600"></span>
              {isRtl ? 'تنبيه: تم اكتشاف روابط معطلة!' : 'Alert: Broken Links Detected!'}
            </h3>
            <p className="text-red-600 text-sm font-medium leading-relaxed">
              {isRtl 
                ? `يوجد عدد (${brokenCount}) من روابط الفيديوهات الخارجية التي تبدو معطلة أو غير متاحة حالياً.`
                : `There are (${brokenCount}) social video links that seem to be broken or unavailable.`}
            </p>
          </div>
          <button
            onClick={handleValidateAll}
            disabled={validatingAll}
            className="shrink-0 flex items-center gap-2 px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold shadow-lg shadow-red-600/15 transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={16} className={cn(validatingAll && "animate-spin")} />
            {isRtl ? 'إعادة فحص الروابط الآن' : 'Re-verify All Links Now'}
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <Loader2 className="text-blue-600 animate-spin mb-4" size={32} />
          <p className="text-slate-400 text-sm font-bold">{isRtl ? 'جاري تحميل الفيديوهات...' : 'Loading videos...'}</p>
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <Video size={64} className="mx-auto text-slate-200 mb-4" />
          <h3 className="text-lg font-bold text-slate-700 mb-1">{isRtl ? 'قائمة الفيديوهات فارغة' : 'No videos registered'}</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto mb-6">
            {isRtl 
              ? 'قم بإضافة فيديوهات لتعرض لزوار الموقع في الصفحة الرئيسية بشكل جذاب' 
              : 'Add videos to dynamically display beautiful slides to homepage visitors.'}
          </p>
          <button
            onClick={() => handleOpenModal(null)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition shadow-lg"
          >
            <Plus size={16} />
            {isRtl ? 'إضافة فيديو جديد' : 'Add New Video'}
          </button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* List Table/Card */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-slate-800 text-base">{isRtl ? 'الفيديوهات المسجلة' : 'Registered Videos'}</h3>
              <span className="text-xs bg-blue-50 text-blue-600 font-bold px-3 py-1 rounded-full">
                {videos.length} {isRtl ? 'فيديو' : 'Videos'}
              </span>
            </div>
            
            <div className="divide-y divide-slate-50 max-h-[650px] overflow-y-auto">
              {videos.map((video) => (
                <div 
                  key={video.id} 
                  className={cn(
                    "p-6 flex items-center justify-between gap-4 transition hover:bg-slate-50/40",
                    activePlayId === video.id && "bg-blue-50/20 border-l-4 border-blue-600"
                  )}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-16 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                      {video.thumbnail ? (
                        <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Video size={16} className="text-slate-400" />
                      )}
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold text-slate-400">#{video.sort_order}</span>
                        <h4 className="font-black text-slate-800 truncate text-sm sm:text-base max-w-[200px]">
                          {video.title || (isRtl ? 'فيديو بدون عنوان' : 'Untitled Video')}
                        </h4>
                        
                        <span className={cn(
                          "inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full",
                          video.type === 'social' ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600"
                        )}>
                          {video.type === 'social' ? <Globe size={10} /> : <Upload size={10} />}
                          {video.type === 'social' ? (isRtl ? 'سوشيال' : 'Social') : (isRtl ? 'محلي' : 'Local')}
                        </span>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-[10px] text-slate-400">
                        <p className="flex items-center gap-1 truncate font-mono max-w-[150px]">
                          <LinkIcon size={10} className="shrink-0 text-slate-300" />
                          <span className="truncate">{video.url}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                    {video.type === 'social' && (
                      <button
                        onClick={() => handleValidateSingle(video.id)}
                        disabled={validatingId === video.id}
                        className="p-2.5 rounded-xl bg-white border border-slate-100 text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition active:scale-95 disabled:opacity-50"
                        title={isRtl ? 'فحص صحة هذا الرابط الآن' : 'Validate this link health'}
                      >
                        <RefreshCw size={14} className={cn(validatingId === video.id && "animate-spin")} />
                      </button>
                    )}

                    <button
                      onClick={() => setActivePlayId(activePlayId === video.id ? null : video.id)}
                      className={cn(
                        "p-2.5 rounded-xl border transition active:scale-95",
                        activePlayId === video.id 
                          ? "bg-blue-600 text-white border-blue-600" 
                          : "bg-white text-slate-500 border-slate-100 hover:bg-slate-50"
                      )}
                      title={isRtl ? 'تشغيل / معاينة' : 'Play / Preview'}
                    >
                      <Play size={14} fill={activePlayId === video.id ? "currentColor" : "none"} />
                    </button>

                    <button
                      onClick={() => handleToggleActive(video)}
                      className={cn(
                        "p-2.5 rounded-xl border transition active:scale-95",
                        video.isActive === 1
                          ? "bg-white text-emerald-600 border-emerald-100 hover:bg-emerald-50"
                          : "bg-white text-slate-400 border-slate-100 hover:bg-slate-50"
                      )}
                    >
                      {video.isActive === 1 ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>

                    <button
                      onClick={() => handleOpenModal(video)}
                      className="p-2.5 rounded-xl bg-white border border-slate-100 text-slate-600 hover:bg-slate-50 transition active:scale-95"
                    >
                      <Edit size={14} />
                    </button>

                    <button
                      onClick={() => handleDelete(video.id)}
                      className="p-2.5 rounded-xl bg-white border border-slate-100 text-red-500 hover:bg-red-50 transition active:scale-95"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preview Container */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
            <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
              <h3 className="font-black text-slate-800 text-base">{isRtl ? 'المعاينة' : 'Preview'}</h3>
              <Video size={18} className="text-blue-600" />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 text-white relative">
              {activePlayId ? (
                (() => {
                  const activeVideo = videos.find(v => v.id === activePlayId);
                  if (!activeVideo) return null;
                  
                  if (activeVideo.type === 'local' || !activeVideo.url.includes('facebook.com') && !activeVideo.url.includes('youtube.com')) {
                    return (
                      <video 
                        src={activeVideo.url} 
                        controls 
                        className="w-full h-full object-contain"
                        autoPlay
                      />
                    );
                  }

                  return (
                    <div className="absolute inset-0 w-full h-full flex flex-col bg-black">
                      <iframe
                        src={getEmbedUrl(activeVideo.url)}
                        width="100%"
                        height="100%"
                        style={{ border: 'none', overflow: 'hidden' }}
                        scrolling="no"
                        frameBorder="0"
                        allowFullScreen={true}
                        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                        className="w-full h-full flex-grow"
                      />
                    </div>
                  );
                })()
              ) : (
                <div className="p-8 text-center text-slate-500 max-w-xs space-y-3">
                  <Play size={40} className="mx-auto opacity-30 text-white" />
                  <p className="text-sm font-bold text-slate-400">
                    {isRtl ? 'انقر على زر التشغيل (▶) للمعاينة' : 'Click play (▶) to preview.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-slate-800 text-lg">
                {editingVideo ? (isRtl ? 'تعديل فيديو' : 'Edit Video') : (isRtl ? 'إضافة فيديو جديد' : 'Add New Video')}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-6">
              <div className="flex p-1 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: 'social' })}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition",
                    form.type === 'social' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  <Globe size={14} />
                  {isRtl ? 'رابط خارجي' : 'Social Link'}
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: 'local' })}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition",
                    form.type === 'local' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  <Upload size={14} />
                  {isRtl ? 'رفع ملف' : 'Local Upload'}
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500">
                    {isRtl ? 'العنوان' : 'Title'}
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500">
                    {isRtl ? 'مصدر الفيديو' : 'Video Source'}
                  </label>
                  {form.type === 'social' ? (
                    <input
                      type="url"
                      required
                      placeholder="https://..."
                      value={form.url}
                      onChange={(e) => setForm({ ...form, url: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 text-sm"
                    />
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={form.url}
                        className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 text-sm"
                        placeholder={isRtl ? 'ارفع ملف الفيديو...' : 'Upload video file...'}
                      />
                      <label className="shrink-0 flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 cursor-pointer transition">
                        <Upload size={18} className="text-slate-600" />
                        <input type="file" accept="video/*" className="hidden" onChange={(e) => handleFileUpload(e, 'url')} />
                      </label>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500">
                    {isRtl ? 'صورة الغلاف (اختياري)' : 'Thumbnail (Optional)'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={form.thumbnail}
                      onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                      className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 text-sm"
                      placeholder="https://..."
                    />
                    <label className="shrink-0 flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 cursor-pointer transition">
                      <Upload size={18} className="text-slate-600" />
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'thumbnail')} />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500">
                      {isRtl ? 'الترتيب' : 'Sort Order'}
                    </label>
                    <input
                      type="number"
                      value={form.sort_order}
                      onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 text-sm"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl w-full cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.isActive}
                        onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                        className="w-4 h-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs font-bold text-slate-600">{isRtl ? 'نشط' : 'Active'}</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end border-t border-slate-50 pt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploading}
                  className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-lg disabled:opacity-50"
                >
                  {(submitting || uploading) && <Loader2 size={12} className="animate-spin" />}
                  {isRtl ? 'حفظ' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
