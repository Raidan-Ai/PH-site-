import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Upload, 
  Trash2, 
  Image as ImageIcon, 
  Loader2, 
  Copy, 
  Check, 
  FolderPlus, 
  Folder, 
  Calendar, 
  Briefcase, 
  Tag, 
  Plus, 
  X, 
  Film,
  Grid,
  Edit,
  Sliders,
  RotateCw,
  Crop,
  Sparkles,
  Download,
  Type
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const MediaManager: React.FC = () => {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [mediaList, setMediaList] = useState<any[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [submittingAlbum, setSubmittingAlbum] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Selected Album filter
  const [activeAlbumId, setActiveAlbumId] = useState<string>('all');

  // Album creation modal
  const [albumModalOpen, setAlbumModalOpen] = useState(false);
  const [albumForm, setAlbumForm] = useState({
    name_ar: '',
    name_en: '',
    description_ar: '',
    description_en: '',
    type: 'mixed', // mixed, image, video
    project_id: '',
    event_id: ''
  });

  // Media editing and detailed metadata modal
  const [selectedMedia, setSelectedMedia] = useState<any | null>(null);
  const [metadataForm, setMetadataForm] = useState({
    name: '',
    alt_text: '',
    photographer: '',
    description: '',
    extracted_text: '',
    album_id: ''
  });
  const [isSavingMetadata, setIsSavingMetadata] = useState(false);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);

  // Self-Service Client-Side Image Editing States
  const [rotation, setRotation] = useState<number>(0);
  const [cropRatio, setCropRatio] = useState<string>('original');
  const [quality, setQuality] = useState<number>(0.85);
  const [resizeWidth, setResizeWidth] = useState<number>(0);
  const [resizeHeight, setResizeHeight] = useState<number>(0);
  const [watermark, setWatermark] = useState<boolean>(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);

  const { user } = useAuth();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mediaRes, albumsRes, projectsRes, eventsRes] = await Promise.all([
        api.get('/api/media'),
        api.get('/api/media/albums'),
        api.get('/api/media/projects'),
        api.get('/api/media/events')
      ]);

      setMediaList(mediaRes.data || []);
      setAlbums(albumsRes.data || []);
      setProjects(projectsRes.data || []);
      setEvents(eventsRes.data || []);
    } catch (error) {
      console.error('Error fetching media manager data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    try {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);
      if (user?.uid) {
        formData.append('uploadedBy', user.uid);
      }
      
      const uploadRes = await api.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // If we are viewing a specific album, automatically link the newly uploaded media to it!
      if (activeAlbumId !== 'all') {
        const fileId = uploadRes.data.id;
        if (fileId) {
          await api.put(`/api/media/${fileId}/album`, { album_id: parseInt(activeAlbumId) });
        }
      }

      await fetchData();
    } catch (error) {
      console.error('Error uploading media:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(isRtl ? 'هل أنت متأكد من حذف هذا الملف نهائياً؟' : 'Are you sure you want to permanently delete this file?')) return;
    try {
      await api.delete(`/api/media/${id}`);
      await fetchData();
    } catch (error) {
      console.error('Error deleting media:', error);
    }
  };

  const copyToClipboard = (url: string) => {
    const fullUrl = url.startsWith('http') ? url : window.location.origin + url;
    navigator.clipboard.writeText(fullUrl);
    setCopied(fullUrl);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSaveAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!albumForm.name_ar) {
      alert(isRtl ? 'الرجاء إدخال اسم الألبوم بالعربية' : 'Please input the Arabic album name');
      return;
    }
    setSubmittingAlbum(true);
    try {
      const res = await api.post('/api/media/albums', {
        ...albumForm,
        project_id: albumForm.project_id || null,
        event_id: albumForm.event_id || null
      });
      if (res.data.success) {
        setAlbumModalOpen(false);
        setAlbumForm({
          name_ar: '',
          name_en: '',
          description_ar: '',
          description_en: '',
          type: 'mixed',
          project_id: '',
          event_id: ''
        });
        await fetchData();
      }
    } catch (error) {
      console.error('Error saving album:', error);
      alert(isRtl ? 'فشل إنشاء الألبوم' : 'Failed to create album');
    } finally {
      setSubmittingAlbum(false);
    }
  };

  const handleDeleteAlbum = async (albumId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(isRtl ? 'هل تريد حذف هذا الألبوم؟ سيتم فك ارتباط الصور والفيديوهات بالألبوم دون حذفها.' : 'Delete this album? The associated images & videos will not be deleted.')) return;
    try {
      await api.delete(`/api/media/albums/${albumId}`);
      if (activeAlbumId === albumId.toString()) {
        setActiveAlbumId('all');
      }
      await fetchData();
    } catch (error) {
      console.error('Error deleting album:', error);
    }
  };

  const handleMediaAlbumChange = async (mediaId: string, albumId: string) => {
    try {
      await api.put(`/api/media/${mediaId}/album`, { 
        album_id: albumId === 'none' ? null : parseInt(albumId) 
      });
      await fetchData();
    } catch (error) {
      console.error('Error migrating media to album:', error);
    }
  };

  const applyImageEdits = () => {
    if (!selectedMedia) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = selectedMedia.url;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let width = img.naturalWidth;
      let height = img.naturalHeight;

      if (resizeWidth > 0) {
        width = resizeWidth;
      }
      if (resizeHeight > 0) {
        height = resizeHeight;
      }

      if (rotation === 90 || rotation === 270) {
        canvas.width = height;
        canvas.height = width;
      } else {
        canvas.width = width;
        canvas.height = height;
      }

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(img, -width / 2, -height / 2, width, height);
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      let croppedCanvas = canvas;
      if (cropRatio !== 'original') {
        croppedCanvas = document.createElement('canvas');
        const croppedCtx = croppedCanvas.getContext('2d');
        if (croppedCtx) {
          if (cropRatio === '1:1') {
            const size = Math.min(canvas.width, canvas.height);
            croppedCanvas.width = size;
            croppedCanvas.height = size;
            croppedCtx.drawImage(canvas, (canvas.width - size) / 2, (canvas.height - size) / 2, size, size, 0, 0, size, size);
          } else if (cropRatio === '16:9') {
            const h = canvas.width * (9 / 16);
            if (h <= canvas.height) {
              croppedCanvas.width = canvas.width;
              croppedCanvas.height = h;
              croppedCtx.drawImage(canvas, 0, (canvas.height - h) / 2, canvas.width, h, 0, 0, canvas.width, h);
            } else {
              const w = canvas.height * (16 / 9);
              croppedCanvas.width = w;
              croppedCanvas.height = canvas.height;
              croppedCtx.drawImage(canvas, (canvas.width - w) / 2, 0, w, canvas.height, 0, 0, w, canvas.height);
            }
          } else if (cropRatio === '4:3') {
            const h = canvas.width * (3 / 4);
            if (h <= canvas.height) {
              croppedCanvas.width = canvas.width;
              croppedCanvas.height = h;
              croppedCtx.drawImage(canvas, 0, (canvas.height - h) / 2, canvas.width, h, 0, 0, canvas.width, h);
            } else {
              const w = canvas.height * (4 / 3);
              croppedCanvas.width = w;
              croppedCanvas.height = canvas.height;
              croppedCtx.drawImage(canvas, (canvas.width - w) / 2, 0, w, canvas.height, 0, 0, w, canvas.height);
            }
          }
        }
      }

      if (watermark) {
        const watermarkedCtx = croppedCanvas.getContext('2d');
        if (watermarkedCtx) {
          watermarkedCtx.font = 'bold 18px sans-serif';
          watermarkedCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          watermarkedCtx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
          watermarkedCtx.lineWidth = 3;
          const text = 'PressHouse - بيت الصحافة';
          const textWidth = watermarkedCtx.measureText(text).width;
          const x = croppedCanvas.width - textWidth - 20;
          const y = croppedCanvas.height - 20;
          watermarkedCtx.strokeText(text, x, y);
          watermarkedCtx.fillText(text, x, y);
        }
      }

      const finalDataUrl = croppedCanvas.toDataURL('image/jpeg', quality);
      setPreviewDataUrl(finalDataUrl);
    };
  };

  const handleSaveMetadataAndEdits = async () => {
    if (!selectedMedia) return;
    setIsSavingMetadata(true);
    try {
      await api.put(`/api/media/${selectedMedia.id}`, {
        ...metadataForm,
        fileData: previewDataUrl
      });
      setSelectedMedia(null);
      await fetchData();
    } catch (err) {
      console.error('Error saving media data:', err);
      alert(isRtl ? 'فشل حفظ التعديلات' : 'Failed to save modifications');
    } finally {
      setIsSavingMetadata(false);
    }
  };

  const handleRunOcr = async () => {
    if (!selectedMedia) return;
    setIsOcrProcessing(true);
    try {
      const res = await api.post('/api/ai/ocr', {
        id: selectedMedia.id,
        imageUrl: selectedMedia.url
      });
      if (res.data && res.data.text) {
        setMetadataForm(prev => ({ ...prev, extracted_text: res.data.text }));
      }
    } catch (err) {
      console.error('OCR analysis failed:', err);
      alert(isRtl ? 'فشل فحص الصورة واستخراج النصوص' : 'OCR analysis failed to scan image');
    } finally {
      setIsOcrProcessing(false);
    }
  };

  // Filters logic
  const filteredList = mediaList.filter(item => {
    if (activeAlbumId === 'all') return true;
    if (activeAlbumId === 'unsorted') return !item.album_id;
    return item.album_id === parseInt(activeAlbumId);
  });

  return (
    <div className="space-y-6 text-start p-1" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <ImageIcon className="text-blue-600" size={24} />
            {isRtl ? 'مكتبة الوسائط والألبومات' : 'Media Library & Albums'}
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            {isRtl 
              ? 'قم بإدارة الصور، الملفات المرئية والصوتية لألبومات الفعاليات والمشاريع وتخصيصها بيسر.' 
              : 'Upload and organize brand images, media items and video albums connected to events or projects.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={() => setAlbumModalOpen(true)}
            className="px-5 py-3 text-xs bg-white text-slate-800 border border-slate-200 hover:bg-slate-50 font-black rounded-2xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <FolderPlus size={16} className="text-emerald-500" />
            {isRtl ? 'إنشاء ألبوم جديد' : 'Create New Album'}
          </button>

          <label className="px-5 py-3 text-xs bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl flex items-center gap-1.5 cursor-pointer transition-all shadow-lg active:scale-95 shadow-slate-900/15">
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {isRtl ? 'رفع ملف وسائط' : 'Upload Media'}
            <input 
              type="file" 
              className="hidden" 
              accept="image/*,video/*,audio/*" 
              onChange={handleUpload} 
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {/* Grid of album navigation and items */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Albums Sidebar (1 column) */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
            {isRtl ? 'الألبومات وأقسام العرض' : 'Albums & Categories'}
          </h3>
          
          <div className="bg-white p-2.5 rounded-3xl border border-slate-200/60 shadow-sm space-y-1">
            <button
              onClick={() => setActiveAlbumId('all')}
              className={`w-full text-start px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${activeAlbumId === 'all' ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-700'}`}
            >
              <span className="flex items-center gap-2">
                <Grid size={15} />
                {isRtl ? 'المكتبة الكاملة' : 'Full Library'}
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                {mediaList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveAlbumId('unsorted')}
              className={`w-full text-start px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${activeAlbumId === 'unsorted' ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-700'}`}
            >
              <span className="flex items-center gap-2">
                <Folder size={15} />
                {isRtl ? 'غير مصنف' : 'Uncategorized'}
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                {mediaList.filter(m => !m.album_id).length}
              </span>
            </button>

            <div className="border-t border-slate-100 my-2" />

            {/* List custom albums */}
            {albums.length === 0 ? (
              <div className="py-4 text-center text-slate-400 text-xs font-medium">
                {isRtl ? 'لا يوجد ألبومات مخصصة' : 'No custom albums'}
              </div>
            ) : (
              albums.map((album) => {
                const count = mediaList.filter(item => item.album_id === album.id).length;
                return (
                  <button
                    key={album.id}
                    onClick={() => setActiveAlbumId(album.id.toString())}
                    className={`w-full text-start px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-between group cursor-pointer ${activeAlbumId === album.id.toString() ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-700'}`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      {album.type === 'video' ? <Film size={15} className="text-indigo-500" /> : <ImageIcon size={15} className="text-emerald-500" />}
                      <span className="truncate">{isRtl ? album.name_ar : (album.name_en || album.name_ar)}</span>
                    </span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold group-hover:block">
                        {count}
                      </span>
                      <button
                        onClick={(e) => handleDeleteAlbum(album.id, e)}
                        className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-slate-100 hidden group-hover:block transition-all"
                        title={isRtl ? 'حذف الألبوم' : 'Delete Album'}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Media Items Grid (3 columns) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
              {isRtl ? 'ملفات وعناصر الوسائط' : 'Media Library Files'}
            </h3>
            <span className="text-xs font-semibold text-slate-500 bg-slate-150 px-2.5 py-1 rounded-full">
              {isRtl ? `عرض ${filteredList.length} ملف` : `Showing ${filteredList.length} files`}
            </span>
          </div>

          {loading ? (
            <div className="bg-white rounded-3xl p-16 border border-slate-200/60 shadow-sm flex flex-col items-center justify-center gap-2">
              <Loader2 className="animate-spin text-blue-600" size={36} />
              <span className="text-sm font-bold text-slate-500">{isRtl ? 'جار التحميل...' : 'Syncing database...'}</span>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="bg-white rounded-[32px] p-16 border border-slate-200/60 shadow-sm flex flex-col items-center justify-center text-center max-w-2xl mx-auto gap-4">
              <ImageIcon size={48} className="text-slate-300 animate-pulse" />
              <div className="space-y-1">
                <h4 className="text-slate-800 font-extrabold text-base">{isRtl ? 'لا توجد وسائط متطابقة' : 'No items match selection'}</h4>
                <p className="text-slate-400 text-xs font-medium max-w-sm">
                  {isRtl 
                    ? 'هذا الألبوم فارغ حالياً. بإمكانك رفع صور وفيديوهات فوراً أو سحبها لتخزينها فيه.' 
                    : 'This category is currently empty. Direct upload inside an active album will automatically link new media to it!'}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredList.map((item) => {
                const isImage = item.type?.startsWith('image/');
                const isVideo = item.type?.startsWith('video/');
                const isAudio = item.type?.startsWith('audio/');

                return (
                  <div key={item.id} className="bg-white border border-slate-200/70 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative">
                    {/* Media representation */}
                    <div className="aspect-square bg-slate-50 relative overflow-hidden flex items-center justify-center">
                      {isImage ? (
                        <img 
                          referrerPolicy="no-referrer" 
                          src={item.url} 
                          alt={item.name} 
                          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                        />
                      ) : isVideo ? (
                        <div className="flex flex-col items-center justify-center text-slate-400 gap-1 text-center p-2">
                          <Film size={36} className="text-indigo-500" />
                          <span className="text-[10px] font-black">{isRtl ? 'ملف فيديو' : 'Video file'}</span>
                        </div>
                      ) : isAudio ? (
                        <div className="flex flex-col items-center justify-center text-slate-400 gap-1 text-center p-2">
                          <ImageIcon size={36} className="text-purple-500" />
                          <span className="text-[10px] font-black">{isRtl ? 'ملف صوتي' : 'Audio file'}</span>
                        </div>
                      ) : (
                        <div className="text-slate-400">File</div>
                      )}

                      {/* Overlays */}
                      <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 transition-opacity duration-200">
                        <button
                          onClick={() => {
                            setSelectedMedia(item);
                            setMetadataForm({
                              name: item.name || '',
                              alt_text: item.alt_text || '',
                              photographer: item.photographer || '',
                              description: item.description || '',
                              extracted_text: item.extracted_text || '',
                              album_id: item.album_id ? item.album_id.toString() : 'none'
                            });
                            setRotation(0);
                            setCropRatio('original');
                            setQuality(0.85);
                            setWatermark(false);
                            setPreviewDataUrl(null);
                          }}
                          className="bg-white hover:bg-slate-100 text-slate-800 p-2 rounded-xl shadow-md transition-all active:scale-95"
                          title={isRtl ? 'إدارة وتعديل الملف' : 'Manage & Edit File'}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => copyToClipboard(item.url)}
                          className="bg-white hover:bg-slate-100 text-slate-800 p-2 rounded-xl shadow-md transition-all active:scale-95"
                          title={isRtl ? 'نسخ رابط الملف الكامل' : 'Copy link'}
                        >
                          {copied === (item.url.startsWith('http') ? item.url : window.location.origin + item.url) ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-xl shadow-md transition-all active:scale-95"
                          title={isRtl ? 'حذف نهائي' : 'Delete file'}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Metadata and Change Album select dropdown */}
                    <div className="p-3 bg-slate-50 border-t border-slate-150 space-y-2">
                      <div className="text-[10px] font-extrabold text-slate-800 truncate" title={item.name}>
                        {item.name}
                      </div>

                      <div className="flex flex-col gap-1 text-[10px]">
                        <span className="font-bold text-slate-400 flex items-center gap-0.5">
                          <Tag size={10} />
                          {isRtl ? 'ألبوم الارتباط:' : 'Link Album:'}
                        </span>
                        <select
                          value={item.album_id || 'none'}
                          onChange={(e) => handleMediaAlbumChange(item.id, e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-md p-1 outline-none text-[10px] font-semibold"
                        >
                          <option value="none">{isRtl ? '❌ غير مصنف' : 'Unsorted'}</option>
                          {albums.map(alb => (
                            <option key={alb.id} value={alb.id}>
                              {isRtl ? alb.name_ar : (alb.name_en || alb.name_ar)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Album creation Modal overlay */}
      {albumModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <form 
            onSubmit={handleSaveAlbum}
            className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <FolderPlus className="text-emerald-500" size={20} />
                {isRtl ? 'إنشاء ألبوم وسائط إعلامي' : 'Create Media Album'}
              </h3>
              <button
                type="button"
                onClick={() => setAlbumModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              {/* Name Ar */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{isRtl ? 'اسم الألبوم (بالعربية)' : 'Album Name (Arabic)'}</label>
                <input 
                  type="text" 
                  value={albumForm.name_ar} 
                  onChange={(e) => setAlbumForm({...albumForm, name_ar: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-250 focus:ring-4 focus:ring-blue-100 transition-all text-xs font-bold"
                  placeholder="مثال: صور دورة الإستقصاء الرقمي ٢٠٢٦"
                  required
                />
              </div>

              {/* Name En */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{isRtl ? 'اسم الألبوم (بالإنجليزية)' : 'Album Name (English)'}</label>
                <input 
                  type="text" 
                  value={albumForm.name_en} 
                  onChange={(e) => setAlbumForm({...albumForm, name_en: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-250 focus:ring-4 focus:ring-blue-100 transition-all text-xs font-bold"
                  placeholder="e.g. Investigative Journalism Course Photos"
                />
              </div>

              {/* Type selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{isRtl ? 'نوع وسائط الألبوم' : 'Album Media Type'}</label>
                <select 
                  value={albumForm.type} 
                  onChange={(e) => setAlbumForm({...albumForm, type: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-250 font-bold text-xs"
                >
                  <option value="mixed">{isRtl ? 'ألبوم مشكل (صور وفيديوهات)' : 'Mixed (Photos & Videos)'}</option>
                  <option value="image">{isRtl ? 'ألبوم صور فوتوغرافية فقط' : 'Photos Only'}</option>
                  <option value="video">{isRtl ? 'ألبوم أفلام وتقارير مرئية' : 'Videos Only'}</option>
                </select>
              </div>

              {/* Associate to specific Event or Project */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-1">
                    <Briefcase size={12} />
                    {isRtl ? 'ربط بمشروع محدد (اختياري)' : 'Link Project (Optional)'}
                  </span>
                  <select
                    value={albumForm.project_id}
                    onChange={(e) => setAlbumForm({...albumForm, project_id: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-250 font-bold text-xs"
                  >
                    <option value="">{isRtl ? 'لا يوجد ارتباط بمشروع' : 'No project association'}</option>
                    {projects.map(proj => {
                      const titleObj = typeof proj.title === 'string' ? JSON.parse(proj.title) : proj.title;
                      const displayTitle = titleObj?.[i18n.language] || titleObj?.ar || proj.id;
                      return <option key={proj.id} value={proj.id}>{displayTitle}</option>;
                    })}
                  </select>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-1">
                    <Calendar size={12} />
                    {isRtl ? 'ربط بفعالية محددة (اختياري)' : 'Link Event (Optional)'}
                  </span>
                  <select
                    value={albumForm.event_id}
                    onChange={(e) => setAlbumForm({...albumForm, event_id: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-250 font-bold text-xs"
                  >
                    <option value="">{isRtl ? 'لا يوجد ارتباط بفعالية' : 'No event association'}</option>
                    {events.map(ev => {
                      const titleObj = typeof ev.title === 'string' ? JSON.parse(ev.title) : ev.title;
                      const displayTitle = titleObj?.[i18n.language] || titleObj?.ar || ev.id;
                      return <option key={ev.id} value={ev.id}>{displayTitle}</option>;
                    })}
                  </select>
                </div>
              </div>

              {/* Description Ar */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{isRtl ? 'وصف الألبوم (بالعربية)' : 'Arabic Description'}</label>
                <textarea 
                  value={albumForm.description_ar} 
                  onChange={(e) => setAlbumForm({...albumForm, description_ar: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-250 text-xs font-semibold"
                  rows={2}
                  placeholder="اكتب خلاصة الألبوم لتبسيط البحث..."
                />
              </div>

              {/* Description En */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{isRtl ? 'وصف الألبوم (بالإنجليزية)' : 'English Description'}</label>
                <textarea 
                  value={albumForm.description_en} 
                  onChange={(e) => setAlbumForm({...albumForm, description_en: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-250 text-xs font-semibold"
                  rows={2}
                  placeholder="e.g. Highlights of training courses..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setAlbumModalOpen(false)}
                className="px-5 py-2.5 font-black text-slate-600 hover:text-slate-800"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={submittingAlbum}
                className="px-5 py-2.5 bg-slate-950 text-white hover:bg-slate-800 rounded-xl font-black flex items-center gap-1.5 shadow-md disabled:opacity-55 active:scale-95 cursor-pointer"
              >
                {submittingAlbum && <Loader2 size={13} className="animate-spin" />}
                {isRtl ? 'إنشاء الألبوم' : 'Create Album'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Advanced Self-Service Media Details & Editor Modal */}
      {selectedMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4 overflow-y-auto">
          <div 
            className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col my-8 lg:max-h-[90vh]"
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Sliders className="text-blue-600" size={18} />
                  {isRtl ? 'تفاصيل وإدارة ملف الوسائط ذاتياً' : 'Media Management & Editor'}
                </h3>
                <span className="text-[10px] text-slate-500 font-bold block mt-0.5">
                  ID: {selectedMedia.id} • {selectedMedia.type}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMedia(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Main Content Area */}
            <div className="p-6 lg:p-8 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:max-h-[70vh]">
              
              {/* Left Column: Visual Preview & Canvas Editors (7 columns) */}
              <div className="lg:col-span-7 space-y-6">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                  {isRtl ? 'معاينة الوسائط الفورية والمحرر الذاتي' : 'Live Media Preview & Image Editor'}
                </span>

                {/* Main Dynamic Player/Canvas container */}
                <div className="bg-slate-900 rounded-2xl overflow-hidden aspect-video relative flex items-center justify-center border border-slate-950 shadow-inner">
                  {previewDataUrl ? (
                    <img 
                      referrerPolicy="no-referrer" 
                      src={previewDataUrl} 
                      alt="Preview Edited" 
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : selectedMedia.type?.startsWith('image/') ? (
                    <img 
                      referrerPolicy="no-referrer" 
                      src={selectedMedia.url} 
                      alt={selectedMedia.name} 
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : selectedMedia.type?.startsWith('video/') ? (
                    <video controls src={selectedMedia.url} className="w-full h-full object-contain" />
                  ) : selectedMedia.type?.startsWith('audio/') ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-slate-950 p-6">
                      <Film className="text-purple-500 animate-pulse" size={48} />
                      <audio controls src={selectedMedia.url} className="w-full max-w-md" />
                      <span className="text-xs font-bold text-slate-400 font-mono">
                        {isRtl ? 'مشغل الصوت المحمي لبيت الصحافة' : 'PressHouse Secured Audio Stream'}
                      </span>
                    </div>
                  ) : (
                    <div className="text-white text-xs font-bold">
                      {isRtl ? 'الملف غير مدعوم للمعاينة المرئية المباشرة' : 'Unsupported preview format'}
                    </div>
                  )}

                  {/* Tag indicating edits are applied */}
                  {previewDataUrl && (
                    <span className="absolute top-3 left-3 bg-blue-600 text-white text-[9px] px-2 py-0.5 rounded-full font-black tracking-widest uppercase">
                      {isRtl ? 'مُعدّل ومُحسّن' : 'Edits Applied'}
                    </span>
                  )}
                </div>

                {/* Image Editing Sliders & Buttons (Shown ONLY if Image) */}
                {selectedMedia.type?.startsWith('image/') && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-150 pb-2">
                      <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                        <Sliders size={14} className="text-blue-500" />
                        {isRtl ? 'لوحة أدوات معالجة الصور' : 'Image Processor Tools'}
                      </span>
                      {previewDataUrl && (
                        <button
                          onClick={() => setPreviewDataUrl(null)}
                          className="text-[10px] text-red-600 hover:underline font-bold"
                        >
                          {isRtl ? 'إعادة تعيين التغييرات' : 'Reset Changes'}
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {/* Rotate & Crop Controls */}
                      <div className="space-y-3">
                        {/* Rotation */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 block">{isRtl ? 'تدوير الصورة' : 'Rotate Image'}</label>
                          <div className="flex gap-1.5">
                            {[0, 90, 180, 270].map((angle) => (
                              <button
                                key={angle}
                                type="button"
                                onClick={() => {
                                  setRotation(angle);
                                  setTimeout(() => applyImageEdits(), 100);
                                }}
                                className={`px-2.5 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${rotation === angle ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                              >
                                {angle}°
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Aspect Ratio Crop */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 block">{isRtl ? 'نسبة قص الصورة' : 'Crop Ratio'}</label>
                          <div className="flex flex-wrap gap-1">
                            {['original', '1:1', '16:9', '4:3'].map((ratio) => (
                              <button
                                key={ratio}
                                type="button"
                                onClick={() => {
                                  setCropRatio(ratio);
                                  setTimeout(() => applyImageEdits(), 100);
                                }}
                                className={`px-2 py-1 text-[9px] font-extrabold rounded-lg border uppercase transition-all ${cropRatio === ratio ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                              >
                                {isRtl ? (ratio === 'original' ? 'الأصل' : ratio) : ratio}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Compression Quality & Watermark */}
                      <div className="space-y-3">
                        {/* Compression Slider */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-[10px]">
                            <label className="font-black text-slate-400">{isRtl ? 'نسبة ضغط وتكثيف الجودة' : 'Compression Quality'}</label>
                            <span className="font-bold text-slate-800">{Math.round(quality * 100)}%</span>
                          </div>
                          <input 
                            type="range" 
                            min="0.1" 
                            max="1.0" 
                            step="0.05"
                            value={quality}
                            onChange={(e) => {
                              setQuality(parseFloat(e.target.value));
                              setTimeout(() => applyImageEdits(), 100);
                            }}
                            className="w-full accent-slate-900"
                          />
                        </div>

                        {/* Watermark and OCR trigger */}
                        <div className="flex flex-col gap-2">
                          <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700">
                            <input 
                              type="checkbox" 
                              checked={watermark}
                              onChange={(e) => {
                                setWatermark(e.target.checked);
                                setTimeout(() => applyImageEdits(), 100);
                              }}
                              className="accent-slate-900 rounded focus:ring-0"
                            />
                            <span>{isRtl ? 'إضافة العلامة المائية للمؤسسة' : 'Add Corporate Watermark'}</span>
                          </label>

                          <button
                            type="button"
                            onClick={applyImageEdits}
                            className="w-full mt-1.5 py-2 text-[10px] bg-slate-900 hover:bg-slate-800 text-white font-black rounded-lg transition-all"
                          >
                            {isRtl ? '🔄 تطبيق التغييرات مرئياً' : '🔄 Apply Transformations'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Detailed Metadata Form & AI tools (5 columns) */}
              <div className="lg:col-span-5 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {isRtl ? 'البيانات الوصفية والأرشفة' : 'File Metadata & Archives'}
                  </span>

                  {selectedMedia.type?.startsWith('image/') && (
                    <button
                      type="button"
                      disabled={isOcrProcessing}
                      onClick={handleRunOcr}
                      className="px-2.5 py-1 text-[9px] bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-lg font-black flex items-center gap-1 transition-all disabled:opacity-55"
                    >
                      <Sparkles size={11} className={isOcrProcessing ? 'animate-spin' : ''} />
                      {isRtl ? 'تشغيل المسح الذكي OCR بالذكاء الاصطناعي' : 'Run AI Image OCR Scan'}
                    </button>
                  )}
                </div>

                <div className="space-y-4 text-xs">
                  {/* File Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'اسم الملف الأصلي' : 'Original File Name'}</label>
                    <input 
                      type="text"
                      value={metadataForm.name}
                      onChange={(e) => setMetadataForm({ ...metadataForm, name: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-bold"
                    />
                  </div>

                  {/* Alt Text */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'نص بديل (للـ SEO ومحركات البحث)' : 'Alt Text (SEO & Accessibility)'}</label>
                    <input 
                      type="text"
                      placeholder={isRtl ? 'مثال: صورة تعبيرية لشعار بيت الصحافة اليمن' : 'e.g. Logo of PressHouse Yemen'}
                      value={metadataForm.alt_text}
                      onChange={(e) => setMetadataForm({ ...metadataForm, alt_text: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-semibold"
                    />
                  </div>

                  {/* Photographer / copyright */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'الجهة المالكة للحقوق / المصور' : 'Copyright Owner / Photographer'}</label>
                    <input 
                      type="text"
                      placeholder="e.g. PressHouse Yemen / Photographer"
                      value={metadataForm.photographer}
                      onChange={(e) => setMetadataForm({ ...metadataForm, photographer: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-semibold"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'شرح ووصف الملف' : 'Description / Caption'}</label>
                    <textarea 
                      rows={3}
                      placeholder={isRtl ? 'اكتب تفاصيل إضافية لشرح محتوى هذا الملف...' : 'Describe this file in details...'}
                      value={metadataForm.description}
                      onChange={(e) => setMetadataForm({ ...metadataForm, description: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                    />
                  </div>

                  {/* Extracted Text (OCR output) */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <span>{isRtl ? 'النصوص المكتوبة المستخرجة (الممسوحة ضوئياً)' : 'Extracted Text content (Scanned OCR)'}</span>
                      {isOcrProcessing && <Loader2 size={11} className="animate-spin text-blue-500" />}
                    </label>
                    <textarea 
                      rows={4}
                      placeholder={isRtl ? 'اضغط زر "تشغيل المسح الذكي" أعلاه لقراءة النصوص تلقائياً بالذكاء الاصطناعي...' : 'No text content extracted yet. Use AI OCR scan above...'}
                      value={metadataForm.extracted_text}
                      onChange={(e) => setMetadataForm({ ...metadataForm, extracted_text: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-mono text-[11px] leading-relaxed"
                    />
                  </div>

                  {/* Select associated album */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'تعديل ألبوم الارتباط للملف' : 'Edit File Association Album'}</label>
                    <select
                      value={metadataForm.album_id}
                      onChange={(e) => setMetadataForm({ ...metadataForm, album_id: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold"
                    >
                      <option value="none">{isRtl ? '❌ غير مصنف' : 'Unsorted'}</option>
                      {albums.map(alb => (
                        <option key={alb.id} value={alb.id}>
                          {isRtl ? alb.name_ar : (alb.name_en || alb.name_ar)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

            </div>

            {/* Actions */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setSelectedMedia(null)}
                className="px-5 py-2.5 font-black text-slate-600 hover:text-slate-800"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveMetadataAndEdits}
                disabled={isSavingMetadata}
                className="px-6 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-black flex items-center gap-1.5 shadow-md disabled:opacity-55 active:scale-95 cursor-pointer"
              >
                {isSavingMetadata && <Loader2 size={13} className="animate-spin" />}
                {isRtl ? 'حفظ البيانات والتعديلات ذاتياً' : 'Save Media & Edits'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
