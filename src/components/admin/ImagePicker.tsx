import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, UploadCloud, FolderOpen, Check, X, FileImage, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

interface ImagePickerProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export const ImagePicker: React.FC<ImagePickerProps> = ({ value, onChange, label }) => {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  
  const [modalOpen, setModalOpen] = useState(false);
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<string>('all');
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Fetch media from Library
  const fetchMedia = async () => {
    setLoadingMedia(true);
    try {
      const res = await api.get('/api/media');
      setMediaList(res.data || []);
    } catch (err) {
      console.error('Error fetching media library:', err);
    } finally {
      setLoadingMedia(false);
    }
  };

  const fetchAlbums = async () => {
    try {
      const res = await api.get('/api/media/albums');
      setAlbums(res.data || []);
    } catch (err) {
      console.error('Error fetching albums:', err);
    }
  };

  useEffect(() => {
    if (modalOpen) {
      fetchMedia();
      fetchAlbums();
    }
  }, [modalOpen]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files.length) return;
    setUploading(true);
    try {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uploadedBy', 'admin');
      
      const res = await api.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const newUrl = res.data.url;
      onChange(newUrl);
      setModalOpen(false);
    } catch (err) {
      console.error('Failed to upload file:', err);
      alert(isRtl ? 'فشل تحميل الملف' : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const selectMediaItem = (url: string) => {
    onChange(url);
    setModalOpen(false);
  };

  const filteredMedia = mediaList.filter(item => {
    const isImage = item.type?.startsWith('image/');
    if (!isImage) return false;
    if (selectedAlbum === 'all') return true;
    return item.album_id === parseInt(selectedAlbum);
  });

  return (
    <div className="space-y-2 text-start">
      {label && (
        <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
          {label}
        </label>
      )}
      
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm transition-all hover:border-slate-250">
        {value ? (
          <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-200 shadow-inner group flex-shrink-0">
            <img 
              referrerPolicy="no-referrer" 
              src={value} 
              alt="Selected Preview" 
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="w-16 h-16 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-slate-400 bg-slate-100 flex-shrink-0">
            <Image size={24} />
          </div>
        )}

        <div className="flex-1 space-y-2">
          {value ? (
            <div className="text-xs font-mono text-slate-500 truncate max-w-xs">{value}</div>
          ) : (
            <div className="text-xs text-slate-400">{isRtl ? 'لم يتم اختيار ملف' : 'No file selected'}</div>
          )}
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="px-4 py-2 text-xs font-extrabold text-slate-700 bg-white hover:bg-slate-50 border border-slate-250 rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <FolderOpen size={14} className="text-blue-600" />
              {isRtl ? 'مكتبة الوسائط' : 'Media Library'}
            </button>
            
            <label className="px-4 py-2 text-xs font-extrabold text-white bg-slate-900 hover:bg-slate-800 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-sm active:scale-95">
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
              {isRtl ? 'رفع جديد' : 'Upload New'}
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileUpload} 
                className="hidden" 
                disabled={uploading}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Modal dialog for Media Library Select */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]" dir={isRtl ? 'rtl' : 'ltr'}>
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">{isRtl ? 'اختر ملف من مكتبة الوسائط' : 'Select from Media Library'}</h3>
                <p className="text-xs text-slate-500">{isRtl ? 'انقر على الصورة لاستخدامها فوراً في هذا الحقل' : 'Click on any image to select and apply instantly'}</p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors"
                id="close-image-picker-modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Filter Album Bar */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-400">{isRtl ? 'تصفية حسب الألبوم:' : 'Filter by Album:'}</span>
              <button
                type="button"
                onClick={() => setSelectedAlbum('all')}
                className={`px-3 py-1 text-xs font-extrabold rounded-full transition-all ${selectedAlbum === 'all' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-150'}`}
              >
                {isRtl ? 'الكل' : 'All'}
              </button>
              {albums.map((album) => (
                <button
                  key={album.id}
                  type="button"
                  onClick={() => setSelectedAlbum(album.id.toString())}
                  className={`px-3 py-1 text-xs font-extrabold rounded-full transition-all ${selectedAlbum === album.id.toString() ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-150'}`}
                >
                  {isRtl ? album.name_ar : (album.name_en || album.name_ar)}
                </button>
              ))}
            </div>

            {/* Grid display */}
            <div className="flex-1 overflow-y-auto p-6 min-h-[300px]">
              {loadingMedia ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-2">
                  <Loader2 size={36} className="animate-spin text-blue-600" />
                  <span className="text-sm font-bold">{isRtl ? 'جاري تحميل ملفات الوسائط...' : 'Loading media items...'}</span>
                </div>
              ) : filteredMedia.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-63 text-slate-400 gap-4">
                  <FileImage size={48} className="text-slate-300 animate-pulse" />
                  <div className="text-center">
                    <p className="font-extrabold text-slate-700">{isRtl ? 'المكتبة فارغة أو لا يوجد صور مطابقة' : 'No images found in this selection'}</p>
                    <p className="text-xs mt-1 text-slate-400">{isRtl ? 'بإمكانك رفع صور جديدة مباشرةً ليتم تخزينها بالقسم' : 'You can upload new photos directly to feed this storage'}</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                  {filteredMedia.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectMediaItem(item.url)}
                      className={`group relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border-2 select-none duration-250 cursor-pointer ${value === item.url ? 'border-indigo-600 shadow-lg' : 'border-slate-100 hover:border-slate-350 hover:scale-101'}`}
                    >
                      <img 
                        referrerPolicy="no-referrer" 
                        src={item.url} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-slate-950/70 p-2 text-start opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-[10px] text-white font-bold truncate">{item.name}</p>
                      </div>
                      {value === item.url && (
                        <div className="absolute top-2 right-2 bg-indigo-600 text-white p-1 rounded-full shadow-md">
                          <Check size={12} strokeWidth={4} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer with actions */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
              <label className="px-6 py-3 bg-indigo-600 text-white hover:bg-indigo-700 font-extrabold rounded-2xl text-xs flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-lg shadow-indigo-600/10">
                <UploadCloud size={16} />
                {isRtl ? 'رفع وحفظ بالمكتبة' : 'Upload & Save to Library'}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
              </label>
              
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-6 py-3 text-xs font-black text-slate-700 hover:text-slate-900 transition-colors"
                id="cancel-image-picker"
              >
                {isRtl ? 'إغلاق' : 'Close'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
