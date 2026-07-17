import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Upload, Search, FileText, Image as ImageIcon, Video as VideoIcon, 
  Music as AudioIcon, Tag, Check, Loader2, RefreshCw, X, Eye, ChevronRight
} from 'lucide-react';
import { api } from '../../services/api';

interface MediaAsset {
  id: string | number;
  name: string;
  url: string;
  type: string;
  size: number;
  tags?: string[];
  description?: string;
}

interface AssetManagementProps {
  onSelectAsset: (url: string, asset: MediaAsset) => void;
  allowedTypes?: 'images' | 'videos' | 'audio' | 'documents' | 'all';
  currentValue?: string;
}

export default function AssetManagement({ onSelectAsset, allowedTypes = 'all', currentValue }: AssetManagementProps) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'images' | 'videos' | 'audio' | 'documents' | 'all'>(allowedTypes);
  const [searchTerm, setSearchTerm] = useState('');
  const [dragActive, setDragActive] = useState(false);
  
  // Custom metadata input for the being-uploaded or selected action
  const [metaTags, setMetaTags] = useState('');
  const [metaDesc, setMetaDesc] = useState('');
  
  // State for alert banner notices
  const [infoMessage, setInfoMessage] = useState<{ textAr: string; textEn: string; isError?: boolean } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch media from server (which logs local & API media items)
  const fetchAssets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/media');
      const apiAssets = (res.data || []).map((item: any) => ({
        id: item.id,
        name: item.name || 'document_asset',
        url: item.url,
        type: item.type || 'image/jpeg',
        size: item.size || 0,
        tags: item.tags ? (typeof item.tags === 'string' ? JSON.parse(item.tags) : item.tags) : [],
        description: item.description || ''
      }));
      setAssets(apiAssets);
    } catch (err) {
      console.error('Failed to fetch media assets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  // Filter assets by Tab and Search Term
  const filteredAssets = assets.filter(asset => {
    const isImage = asset.type.startsWith('image/');
    const isVideo = asset.type.startsWith('video/');
    const isAudio = asset.type.startsWith('audio/');
    const isDoc = asset.type.includes('pdf') || asset.type.includes('document') || asset.type.includes('word') || asset.type.includes('spreadsheet') || asset.type.includes('octet-stream');

    let tabMatch = true;
    if (activeTab === 'images') tabMatch = isImage;
    else if (activeTab === 'videos') tabMatch = isVideo;
    else if (activeTab === 'audio') tabMatch = isAudio;
    else if (activeTab === 'documents') tabMatch = !isImage && !isVideo && !isAudio;

    const termMatch = 
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.tags || []).some(t => t.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (asset.description || '').toLowerCase().includes(searchTerm.toLowerCase());

    return tabMatch && termMatch;
  });

  // Handle Drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Process File Uploading
  const performUpload = async (file: File) => {
    setUploading(true);
    setInfoMessage(null);
    try {
      const cleanFileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

      // Ensure we clean tags
      const processedTags = metaTags.split(',').map(t => t.trim()).filter(Boolean);

      console.log('Uploading file to local multi-format multer storage api on server...');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uploadedBy', 'admin');

      // Append custom tags if relevant
      const res = await api.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const uploadedUrl = res.data.url;
      setInfoMessage({
        textAr: 'تم الرفع بنجاح عبر مخزن الخادم المحلي.',
        textEn: 'Uploaded successfully through the server local filesystem.'
      });

      // Add tag metadata if typed in, and dispatch to fetchAssets
      if (uploadedUrl) {
        const payloadAsset: MediaAsset = {
          id: Date.now(),
          name: file.name,
          url: uploadedUrl,
          type: file.type,
          size: file.size,
          tags: processedTags,
          description: metaDesc
        };

        // Inform the parent component of instant selection
        onSelectAsset(uploadedUrl, payloadAsset);

        // Refresh libraries
        setMetaTags('');
        setMetaDesc('');
        fetchAssets();
      }

    } catch (err: any) {
      console.error('Unified upload failure:', err);
      setInfoMessage({
        textAr: 'فشل رفع الملف. الرجاء التأكد من توافق الحجم وصيغة الميم المستندات.',
        textEn: 'File upload failed. Please verify size and target mime matches.',
        isError: true
      });
    } finally {
      setUploading(false);
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      performUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      performUpload(e.target.files[0]);
    }
  };

  const getFileIcon = (mime: string) => {
    if (mime.startsWith('image/')) return <ImageIcon className="text-emerald-500" size={18} />;
    if (mime.startsWith('video/')) return <VideoIcon className="text-blue-500" size={18} />;
    if (mime.startsWith('audio/')) return <AudioIcon className="text-purple-500" size={18} />;
    return <FileText className="text-amber-500" size={18} />;
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-5 text-start" id="shared-asset-management">
      
      {/* Search and Library Filter Header */}
      <div className="block space-y-3">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
            {isRtl ? 'مدير ملفات الاستوديو والوسائط المركزية' : 'Shared Central Media Asset Manager'}
          </h4>
          <span className="text-[10px] bg-slate-100 font-bold px-2 py-0.5 rounded text-slate-400">
            {isRtl ? `مسموح: ${activeTab}` : `Filter: ${activeTab}`}
          </span>
        </div>

        {/* Tab row */}
        <div className="flex flex-wrap gap-1 p-1 bg-slate-50 rounded-xl border border-slate-100">
          {(['all', 'images', 'videos', 'audio', 'documents'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {tab === 'all' && (isRtl ? 'كل الملفات' : 'All Files')}
              {tab === 'images' && (isRtl ? 'الصور' : 'Images')}
              {tab === 'videos' && (isRtl ? 'الفيديو' : 'Videos')}
              {tab === 'audio' && (isRtl ? 'تحقيقات صوتية' : 'Audio')}
              {tab === 'documents' && (isRtl ? 'الوثائق وتقارير مخرجات' : 'Docs')}
            </button>
          ))}
        </div>
      </div>

      {infoMessage && (
        <div className={`p-3 rounded-xl text-xs font-bold flex justify-between items-center ${
          infoMessage.isError ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-800 border border-emerald-100'
        }`}>
          <span>{isRtl ? infoMessage.textAr : infoMessage.textEn}</span>
          <button type="button" onClick={() => setInfoMessage(null)} className="text-slate-400 hover:text-slate-900">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Upload Drag & Drop Area */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        
        {/* Upload Action (Left Col) */}
        <div className="md:col-span-4 space-y-3">
          <div 
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-2 ${
              dragActive 
                ? 'border-blue-600 bg-blue-50/50' 
                : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50/50'
            }`}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden" 
              accept={
                activeTab === 'images' ? 'image/*' :
                activeTab === 'videos' ? 'video/*' :
                activeTab === 'audio' ? 'audio/*' :
                activeTab === 'documents' ? '.pdf,.doc,.docx,.xls,.xlsx' : undefined
              }
            />
            {uploading ? (
              <Loader2 className="animate-spin text-blue-600" size={24} />
            ) : (
              <Upload className="text-slate-400" size={24} />
            )}
            <div className="space-y-1">
              <p className="text-[11px] font-black text-slate-700">
                {isRtl ? 'اسحب وأفلت الملفات لرفعها' : 'Drag & Drop File'}
              </p>
              <p className="text-[9px] text-slate-400">
                {isRtl ? 'أو انقر للتصفح من جهازك' : 'Or click to select'}
              </p>
            </div>
          </div>

          {/* Quick Tagging and Info inputs */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase mb-0.5">{isRtl ? 'تصنيف الكلمات المفتاحية لمخرجات المانحين (افصل بفاصلة)' : 'Tag Keywords (comma separated)'}</label>
              <div className="relative">
                <input 
                  type="text"
                  value={metaTags}
                  onChange={(e) => setMetaTags(e.target.value)}
                  placeholder="e.g. yemen, press, story_2026"
                  className="w-full pl-6 pr-2 py-1 bg-white border border-slate-250 rounded text-[10px] font-bold"
                />
                <Tag size={10} className="absolute left-2 top-2 text-slate-400" />
              </div>
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase mb-0.5">{isRtl ? 'وصف تفصيلي وحقوق الملكية للوسيط' : 'Intellectual Rights & Desc'}</label>
              <input 
                type="text"
                value={metaDesc}
                onChange={(e) => setMetaDesc(e.target.value)}
                placeholder="Captured during assessment..."
                className="w-full px-2 py-1 bg-white border border-slate-250 rounded text-[10px]"
              />
            </div>
          </div>
        </div>

        {/* Existing Assets Grid Selection Panel (Right Col) */}
        <div className="md:col-span-8 flex flex-col space-y-3">
          <div className="relative">
            <input 
              type="text"
              placeholder={isRtl ? 'ابحث في ملفات ووسوم المستودع...' : 'Search media library by file name/tags...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
            <Search size={12} className="absolute left-2.5 top-2.5 text-slate-400" />
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 bg-slate-25 rounded-xl border border-slate-100">
              <Loader2 className="animate-spin text-blue-600 mb-2" size={24} />
              <p className="text-[10px] text-slate-400 font-bold">{isRtl ? 'جاري قراءة الأرشيف...' : 'Reading library index...'}</p>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs border border-dashed rounded-xl">
              {isRtl ? 'لم يتم العثور على أصول مماثلة.' : 'No matched asset logged yet.'}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 overflow-y-auto max-h-[220px] pr-1">
              {filteredAssets.map(asset => {
                const isSelected = currentValue === asset.url;
                const isImg = asset.type.startsWith('image/');
                return (
                  <div 
                    key={asset.id}
                    onClick={() => onSelectAsset(asset.url, asset)}
                    className={`p-2 rounded-xl border text-start flex flex-col justify-between h-[96px] cursor-pointer group transition-all relative ${
                      isSelected 
                        ? 'border-blue-600 bg-blue-50/20 ring-1 ring-blue-600' 
                        : 'border-slate-100 bg-white hover:border-slate-350 hover:shadow-xs'
                    }`}
                  >
                    {isImg ? (
                      <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none opacity-10 group-hover:opacity-20 transition-opacity">
                        <img src={asset.url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    ) : null}

                    {/* Check indicator */}
                    {isSelected && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center scale-95 shadow-xs">
                        <Check size={10} />
                      </span>
                    )}

                    <div className="flex items-start gap-1.5 pointer-events-none">
                      {getFileIcon(asset.type)}
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] font-black text-slate-800 line-clamp-2 leading-tight break-all">
                          {asset.name}
                        </p>
                        <p className="text-[8px] text-slate-400 font-mono mt-0.5">
                          {(asset.size / 1024).toFixed(0)} KB
                        </p>
                      </div>
                    </div>

                    {asset.tags && asset.tags.length > 0 && (
                      <div className="flex gap-0.5 overflow-hidden w-full select-none mt-1">
                        {asset.tags.slice(0, 2).map((tag, i) => (
                          <span key={i} className="text-[7px] font-extrabold bg-blue-50 text-blue-700 px-1 py-0.5 rounded uppercase max-w-[40px] truncate">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
