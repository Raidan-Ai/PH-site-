import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import { Play, X, ExternalLink, RefreshCw, Facebook } from 'lucide-react';
import { cn } from '../lib/utils';

// Import Swiper styles if not already imported
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

interface Reel {
  id: number;
  url: string;
  title: string;
  isActive: number;
  sort_order: number;
  createdAt: string;
}

export const SocialReelsSection: React.FC = () => {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePlayId, setActivePlayId] = useState<number | null>(null);
  const [selectedReelModal, setSelectedReelModal] = useState<Reel | null>(null);

  const fetchReels = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/social-reels');
      if (res.ok) {
        const data = await res.json();
        // Filter only active reels
        const activeReels = data.filter((r: Reel) => r.isActive === 1);
        setReels(activeReels);
      }
    } catch (err) {
      console.error('Failed to fetch reels:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReels();
  }, []);

  const getEmbedUrl = (url: string) => {
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&t=0`;
  };

  // Helper to get abstract background gradient for each card
  const getGradientClass = (index: number) => {
    const gradients = [
      'from-blue-600 to-indigo-900',
      'from-purple-600 to-blue-900',
      'from-slate-800 to-slate-950',
      'from-blue-700 to-sky-900',
      'from-indigo-600 to-purple-900',
    ];
    return gradients[index % gradients.length];
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-20 md:my-32 relative z-10" id="reels-section">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:gap-8 mb-12 md:mb-16">
        <div className="space-y-3 md:space-y-4">
          <h2 className="text-3xl md:text-6xl font-black text-slate-900 tracking-tight">
            {isRtl ? 'آخر الريلات والإنتاجات' : 'Latest Reels & Videos'}
          </h2>
          <p className="text-slate-500 max-w-2xl font-medium text-sm md:text-base leading-relaxed">
            {isRtl
              ? 'شاهد أحدث التغطيات الصحفية والفيديوهات القصيرة والأنشطة الإنسانية والحقوقية الموثقة عبر حساباتنا الرسمية.'
              : 'Watch our latest short journalistic clips, human stories, and media activities documented live through our official reels.'}
          </p>
        </div>
        
        <button 
          onClick={fetchReels} 
          disabled={loading}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-slate-100 shadow-sm text-slate-600 text-xs font-bold hover:bg-slate-50 transition active:scale-95 disabled:opacity-50"
        >
          <RefreshCw size={14} className={cn(loading && "animate-spin")} />
          {isRtl ? 'تحديث' : 'Refresh'}
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[9/16] rounded-[32px] bg-slate-100 animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : reels.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-100 rounded-[32px] shadow-sm">
          <Facebook size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-400 font-bold">{isRtl ? 'لا توجد ريلات معروضة حالياً.' : 'No reels to display right now.'}</p>
        </div>
      ) : (
        <div className="relative group/swiper">
          <Swiper
            modules={[Autoplay, Pagination, Navigation]}
            spaceBetween={24}
            slidesPerView={1}
            autoplay={{ delay: 6000, disableOnInteraction: true }}
            pagination={{ clickable: true }}
            navigation={true}
            breakpoints={{
              480: { slidesPerView: 1.2 },
              640: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
              1280: { slidesPerView: 4 },
            }}
            className="pb-16"
          >
            {reels.map((reel, idx) => (
              <SwiperSlide key={reel.id}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  className="relative aspect-[9/16] rounded-[32px] overflow-hidden bg-slate-900 border border-slate-100 shadow-lg group hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]"
                >
                  {activePlayId === reel.id ? (
                    // Inline Interactive Iframe
                    <div className="absolute inset-0 w-full h-full bg-black z-20 flex flex-col">
                      <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
                        <button
                          onClick={() => setSelectedReelModal(reel)}
                          title={isRtl ? 'تكبير المشاهدة' : 'Maximize player'}
                          className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-black transition"
                        >
                          <ExternalLink size={12} />
                        </button>
                        <button
                          onClick={() => setActivePlayId(null)}
                          className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition shadow-lg"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <iframe
                        src={getEmbedUrl(reel.url)}
                        width="100%"
                        height="100%"
                        style={{ border: 'none', overflow: 'hidden' }}
                        scrolling="no"
                        frameBorder="0"
                        allowFullScreen={true}
                        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                        title={reel.title || `Reel ${reel.id}`}
                        className="w-full h-full flex-grow"
                      />
                    </div>
                  ) : (
                    // Premium Custom Cover State
                    <div className="absolute inset-0 w-full h-full flex flex-col justify-between p-6 relative z-10 text-white select-none">
                      {/* Branded background gradient with ambient circles */}
                      <div className={cn("absolute inset-0 bg-gradient-to-b opacity-95 transition-all duration-700 group-hover:scale-115", getGradientClass(idx))} />
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.08),transparent_50%)]" />
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />

                      {/* Header Badge */}
                      <div className="relative z-10 flex justify-between items-center">
                        <span className="px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                          {isRtl ? 'فيديو قصير' : 'REEL'}
                        </span>
                        
                        <div className="w-8 h-8 rounded-full bg-blue-600/20 backdrop-blur-md border border-blue-500/30 flex items-center justify-center text-blue-400">
                          <Facebook size={14} className="fill-current" />
                        </div>
                      </div>

                      {/* Big Interactive Center Play Trigger */}
                      <div className="relative z-10 flex flex-col items-center justify-center py-10">
                        <motion.button
                          whileHover={{ scale: 1.12 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setActivePlayId(reel.id)}
                          className="w-16 h-16 md:w-20 md:h-20 bg-white text-blue-900 rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(255,255,255,0.2)] hover:shadow-[0_15px_40px_rgba(255,255,255,0.45)] transition relative group/play-btn"
                        >
                          <div className="absolute inset-0 rounded-full bg-white animate-ping opacity-10 group-hover/play-btn:opacity-25" />
                          <Play size={20} fill="currentColor" className={cn("relative z-10", isRtl ? "mr-1" : "ml-1")} />
                        </motion.button>
                        <span className="text-[10px] uppercase tracking-widest font-black mt-4 text-white/70">
                          {isRtl ? 'انقر للتشغيل' : 'TAP TO PLAY'}
                        </span>
                      </div>

                      {/* Description & Caption at the bottom */}
                      <div className="relative z-10 space-y-3">
                        <h3 className="text-lg md:text-xl font-black leading-snug line-clamp-2 tracking-tight group-hover:text-blue-200 transition-colors">
                          {reel.title || (isRtl ? 'تغطية إعلامية من بيت الصحافة' : 'Press House Media Coverage')}
                        </h3>
                        
                        <div className="flex items-center justify-between text-xs text-white/50 border-t border-white/10 pt-3">
                          <span>{isRtl ? 'منصة بيت الصحافة' : 'Press House'}</span>
                          <button
                            onClick={() => setSelectedReelModal(reel)}
                            className="text-white hover:text-blue-300 font-bold flex items-center gap-1 transition text-[10px] uppercase tracking-wider"
                          >
                            {isRtl ? 'شاشة كاملة' : 'Fullscreen'}
                            <ExternalLink size={10} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}

      {/* Fullscreen Overlay Modal Player for Premium Cinema Feel */}
      <AnimatePresence>
        {selectedReelModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[9999] flex items-center justify-center p-4 md:p-6"
            onClick={() => setSelectedReelModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25 }}
              className="relative w-full max-w-md aspect-[9/16] bg-black rounded-[32px] overflow-hidden border border-white/10 shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header inside Modal */}
              <div className="absolute top-4 left-4 right-4 z-50 flex justify-between items-center pointer-events-auto">
                <div className="bg-black/60 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-full text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                  <Facebook size={12} className="fill-current text-blue-500" />
                  {selectedReelModal.title || (isRtl ? 'مشاهدة الريل' : 'Watch Reel')}
                </div>
                
                <button
                  onClick={() => setSelectedReelModal(null)}
                  className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition shadow-lg"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Embed Iframe */}
              <div className="w-full h-full flex-grow bg-black">
                <iframe
                  src={getEmbedUrl(selectedReelModal.url)}
                  width="100%"
                  height="100%"
                  style={{ border: 'none', overflow: 'hidden' }}
                  scrolling="no"
                  frameBorder="0"
                  allowFullScreen={true}
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                  title={selectedReelModal.title || 'Fullscreen Reel Player'}
                  className="w-full h-full"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
