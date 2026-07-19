import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, Play, Clock, Eye, Calendar, Tag, ChevronRight, Video, Layers, Star, Share2 } from 'lucide-react';
import { api } from '../services/api';
import { VideoPlayer } from '../components/VideoPlayer';
import { useDocumentSEO } from '../hooks/useDocumentSEO';

export default function VideoGallery() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  
  useDocumentSEO({
    title: isRtl ? 'معرض الفيديوهات | بيت الصحافة' : 'Video Gallery | PressHouse',
    description: isRtl ? 'مشاهدة أحدث الفيديوهات، التقارير المرئية، والإنتاجات الإعلامية لمؤسسة بيت الصحافة.' : 'Watch the latest videos, visual reports, and media productions from PressHouse.',
  });

  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('newest');

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await api.get('/api/videos');
        setVideos(response.data || []);
      } catch (error) {
        console.error("Error fetching videos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    videos.forEach(v => { if (v.category) cats.add(v.category); });
    return Array.from(cats);
  }, [videos]);

  const filteredVideos = useMemo(() => {
    return videos
      .filter(v => {
        const titleMatch = (v.title[isRtl ? 'ar' : 'en'] || '').toLowerCase().includes(searchTerm.toLowerCase());
        const catMatch = categoryFilter === 'all' || v.category === categoryFilter;
        return titleMatch && catMatch;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === 'popular') return (b.views || 0) - (a.views || 0);
        return 0;
      });
  }, [videos, searchTerm, categoryFilter, sortBy, isRtl]);

  const stats = useMemo(() => {
    const totalViews = videos.reduce((acc, v) => acc + (v.views || 0), 0);
    return {
      total: videos.length,
      views: totalViews,
      categories: categories.length
    };
  }, [videos, categories]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Header */}
      <header className="pt-32 pb-16 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-rose-600/10 rounded-full blur-[120px] -translate-x-1/2 translate-y-1/2" />
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest"
            >
              <Video size={16} />
              {isRtl ? 'الإنتاج المرئي' : 'Visual Production'}
            </motion.div>
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-[1.1]">
              {isRtl ? 'معرض' : 'Video'} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                {isRtl ? 'الفيديوهات' : 'Gallery'}
              </span>
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed max-w-2xl font-medium">
              {isRtl 
                ? 'استعرض مكتبتنا المرئية الشاملة للتقارير الاستقصائية، القصص الإنسانية، والفعاليات التدريبية.' 
                : 'Explore our comprehensive visual library of investigative reports, human stories, and training events.'}
            </p>

            <div className="flex flex-wrap gap-8 pt-4">
              <div className="space-y-1">
                <p className="text-3xl font-black text-white">{stats.total}</p>
                <p className="text-xs text-slate-500 font-bold uppercase">{isRtl ? 'فيديو متاح' : 'Videos Available'}</p>
              </div>
              <div className="w-px h-12 bg-white/10 hidden sm:block" />
              <div className="space-y-1">
                <p className="text-3xl font-black text-white">{stats.views.toLocaleString()}</p>
                <p className="text-xs text-slate-500 font-bold uppercase">{isRtl ? 'إجمالي المشاهدات' : 'Total Views'}</p>
              </div>
              <div className="w-px h-12 bg-white/10 hidden sm:block" />
              <div className="space-y-1">
                <p className="text-3xl font-black text-white">{stats.categories}</p>
                <p className="text-xs text-slate-500 font-bold uppercase">{isRtl ? 'فئات متنوعة' : 'Categories'}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        {/* Search & Filter Bar */}
        <section className="bg-white border border-slate-200 rounded-[32px] p-6 shadow-sm mb-12 flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isRtl ? 'ابحث في الفيديوهات...' : 'Search videos...'}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:bg-white focus:border-blue-500 transition-all"
            />
          </div>
          
          <div className="flex gap-4">
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500"
            >
              <option value="all">{isRtl ? 'جميع الفئات' : 'All Categories'}</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500"
            >
              <option value="newest">{isRtl ? 'الأحدث أولاً' : 'Newest First'}</option>
              <option value="popular">{isRtl ? 'الأكثر مشاهدة' : 'Most Popular'}</option>
            </select>
          </div>
        </section>

        {/* Video Player Modal/Section */}
        <AnimatePresence>
          {selectedVideo && (
            <motion.section 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mb-16 scroll-mt-32"
              id="player-view"
            >
              <div className="bg-slate-900 rounded-[48px] p-8 md:p-12 shadow-2xl relative overflow-hidden border border-white/5">
                <div className="absolute top-8 right-8 z-50">
                  <button 
                    onClick={() => setSelectedVideo(null)}
                    className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
                  >
                    <ChevronRight size={24} className={isRtl ? '' : 'rotate-180'} />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  <div className="lg:col-span-8">
                    <VideoPlayer 
                      url={selectedVideo.url}
                      thumbnail={selectedVideo.thumbnail}
                      title={selectedVideo.title[isRtl ? 'ar' : 'en']}
                    />
                  </div>
                  
                  <div className="lg:col-span-4 space-y-8 flex flex-col justify-center">
                    <div className="space-y-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                        {selectedVideo.category}
                      </div>
                      <h2 className="text-3xl font-bold text-white leading-tight">
                        {selectedVideo.title[isRtl ? 'ar' : 'en']}
                      </h2>
                      <p className="text-slate-400 text-sm leading-relaxed">
                        {selectedVideo.description[isRtl ? 'ar' : 'en']}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-4">
                      {selectedVideo.tags?.map((tag: string, i: number) => (
                        <span key={i} className="text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-1 rounded border border-white/5">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-4 text-slate-500 text-sm">
                        <div className="flex items-center gap-1.5"><Eye size={16} /> {selectedVideo.views || 0}</div>
                        <div className="flex items-center gap-1.5"><Calendar size={16} /> {new Date(selectedVideo.createdAt).toLocaleDateString()}</div>
                      </div>
                      <button className="p-3 bg-white/10 text-white rounded-xl hover:bg-blue-600 transition-all">
                        <Share2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Video Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="aspect-video bg-white rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : filteredVideos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredVideos.map((v, i) => (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => {
                  setSelectedVideo(v);
                  window.scrollTo({ top: document.getElementById('player-view')?.offsetTop || 0, behavior: 'smooth' });
                }}
                className="group bg-white rounded-[32px] border border-slate-200 overflow-hidden cursor-pointer hover:shadow-xl transition-all"
              >
                <div className="relative aspect-video overflow-hidden">
                  <img 
                    src={v.thumbnail || 'https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?auto=format&fit=crop&q=80&w=800'} 
                    alt={v.title[isRtl ? 'ar' : 'en']}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center scale-0 group-hover:scale-100 transition-all duration-500 border border-white/30">
                      <Play size={24} fill="currentColor" className="ml-1" />
                    </div>
                  </div>
                  {v.duration && (
                    <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded">
                      {v.duration}
                    </div>
                  )}
                </div>
                
                <div className="p-6 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 uppercase tracking-wider">
                      {v.category}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
                    {v.title[isRtl ? 'ar' : 'en']}
                  </h3>
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      <div className="flex items-center gap-1"><Eye size={12} /> {v.views || 0}</div>
                      <div className="flex items-center gap-1"><Star size={12} className="text-yellow-400" fill="currentColor" /> 4.8</div>
                    </div>
                    <ChevronRight size={16} className={cn("text-slate-300 group-hover:text-blue-600 transition-all", isRtl ? "rotate-180" : "")} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-[48px] p-24 text-center space-y-6">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
              <Video size={40} />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900">{isRtl ? 'لا توجد فيديوهات مطابقة' : 'No matching videos'}</h3>
              <p className="text-slate-500">{isRtl ? 'جرب البحث بكلمات مختلفة أو تغيير الفلاتر.' : 'Try searching with different keywords or changing filters.'}</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
