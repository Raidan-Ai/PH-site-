import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, MapPin, Share2, ArrowLeft, Clock, Video, Radio, ExternalLink, ChevronRight, Play, Image as ImageIcon, X, ChevronLeft } from 'lucide-react';
import { SEO } from '../components/common/SEO';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { motion, AnimatePresence } from 'motion/react';
import { Event } from '../types';
import { api } from '../services/api';
import { ShareModal } from '../components/ShareModal';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function EventDetail() {
  const { id } = useParams();
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number | null>(null);

  useEffect(() => {
    if (id) {
      const fetchEvent = async () => {
        setLoading(true);
        try {
          const res = await api.get('/api/events');
          const data = res.data.find((e: any) => String(e.id) === String(id));
          if (data) {
             setEvent({
                ...data,
                date: data.event_date ? new Date(data.event_date).toISOString().split('T')[0] : '',
                title: typeof data.title === 'string' ? JSON.parse(data.title) : data.title,
                description: typeof data.description === 'string' ? JSON.parse(data.description) : data.description,
                location: typeof data.location === 'string' ? JSON.parse(data.location) : data.location,
                media: typeof data.media === 'string' ? JSON.parse(data.media) : data.media
             } as Event);
          }
        } catch (error) {
          console.error("Error fetching event:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchEvent();
    }
  }, [id]);

  const handleNextMedia = () => {
    if (event?.media && selectedMediaIndex !== null) {
      setSelectedMediaIndex((selectedMediaIndex + 1) % event.media.length);
    }
  };

  const handlePrevMedia = () => {
    if (event?.media && selectedMediaIndex !== null) {
      setSelectedMediaIndex((selectedMediaIndex - 1 + event.media.length) % event.media.length);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50/50 space-y-4">
        <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest animate-pulse">
          {isRtl ? 'جاري التحميل...' : 'Loading Event...'}
        </p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50/50 space-y-8">
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
          <Calendar size={48} />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black text-slate-900">{isRtl ? 'الفعالية غير موجودة' : 'Event Not Found'}</h2>
          <p className="text-slate-500 font-medium">{isRtl ? 'ربما تم حذف الفعالية أو الرابط غير صحيح' : 'The event might have been deleted or the link is incorrect'}</p>
        </div>
        <Link to="/events" className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200">
          {isRtl ? 'العودة للفعاليات' : 'Back to Events'}
        </Link>
      </div>
    );
  }

  const lang = i18n.language as 'ar' | 'en';
  const title = event.title[lang] || event.title[isRtl ? 'ar' : 'en'];
  const description = event.description[lang] || event.description[isRtl ? 'ar' : 'en'];
  const location = event.location[lang] || event.location[isRtl ? 'ar' : 'en'];

  const videos = event.media?.filter(m => m.type === 'video') || [];
  const photos = event.media?.filter(m => m.type === 'image') || [];

  return (
    <div className="min-h-screen bg-white pb-32">
      <SEO 
        title={event.seo?.title?.[lang] || title}
        description={event.seo?.description?.[lang] || description}
        keywords={event.seo?.keywords?.[lang] || ""}
        image={event.mainImage || event.bannerImage}
        type="event"
      />
      {/* Event Header */}
      <header className="relative pt-32 pb-20 overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(225,29,72,0.15),transparent_70%)]" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4"
            >
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-full px-4 py-2 border border-slate-700/50 hidden md:block">
                <Breadcrumbs 
                  items={[
                    { label: isRtl ? 'الرئيسية' : 'Home', path: '/' },
                    { label: isRtl ? 'الفعاليات' : 'Events', path: '/events' },
                    { label: title || 'Event Detail' }
                  ]} 
                  className="!text-slate-300 [&_a]:!text-slate-300 hover:[&_a]:!text-white [&_span.font-medium]:!text-slate-100" 
                />
              </div>

              <Link to="/events" className="md:hidden group flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest">
                <div className={cn("w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-all", isRtl && "rotate-180")}>
                  <ArrowLeft size={14} />
                </div>
                {isRtl ? 'العودة للفعاليات' : 'Back to Events'}
              </Link>
              <div className="w-1 h-1 bg-slate-700 rounded-full md:hidden" />
              <div className="text-rose-400 text-[10px] font-black uppercase tracking-widest md:hidden">
                {event.status === 'upcoming' ? (isRtl ? 'قادمة' : 'Upcoming') :
                 event.status === 'ongoing' ? (isRtl ? 'مباشر' : 'Live') :
                 (isRtl ? 'منتهية' : 'Completed')}
              </div>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-black text-white leading-[1.2] tracking-tight"
            >
              {title}
            </motion.h1>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap items-center gap-8 pt-4"
            >
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  <Calendar size={14} className="text-rose-500" />
                  {new Date(event.date).toLocaleDateString(isRtl ? 'ar-YE' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  <MapPin size={14} className="text-rose-500" />
                  {location}
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  <Clock size={14} className="text-rose-500" />
                  {new Date(event.date).toLocaleTimeString(isRtl ? 'ar-YE' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              <div className="h-8 w-px bg-slate-800 hidden sm:block" />

              <button 
                onClick={() => setIsShareModalOpen(true)}
                className="flex items-center gap-2 text-white text-[10px] font-black uppercase tracking-widest hover:text-rose-400 transition-colors"
              >
                <Share2 size={14} className="text-rose-500" />
                {isRtl ? 'مشاركة' : 'Share'}
              </button>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Main Image / Video */}
      <div className="container mx-auto px-6 -mt-16 relative z-20">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="max-w-5xl mx-auto aspect-video rounded-[48px] overflow-hidden shadow-2xl border-8 border-white bg-slate-900"
        >
          {event.isLive && event.liveStreamUrl ? (
            <iframe 
              src={event.liveStreamUrl}
              className="w-full h-full border-0"
              allowFullScreen
            />
          ) : (
            <img 
              src={event.image || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=1200'} 
              alt={title} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          )}
        </motion.div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto space-y-16">
          <div className="prose prose-xl prose-slate max-w-none 
            prose-headings:font-black prose-headings:tracking-tight prose-headings:text-slate-900
            prose-p:text-slate-600 prose-p:leading-[1.8] prose-p:font-medium
          ">
            <p>{description}</p>
          </div>

          {/* Video Gallery */}
          {videos.length > 0 && (
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-200">
                  <Video size={24} />
                </div>
                <h3 className="text-2xl font-black text-slate-900">{isRtl ? 'معرض الفيديو' : 'Video Gallery'}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {videos.map((video, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="aspect-video bg-slate-900 rounded-[32px] overflow-hidden shadow-xl border-4 border-white group relative"
                  >
                    <iframe 
                      src={video.url}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={`Video ${idx}`}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Photo Gallery */}
          {photos.length > 0 && (
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                  <ImageIcon size={24} />
                </div>
                <h3 className="text-2xl font-black text-slate-900">{isRtl ? 'معرض الصور' : 'Photo Gallery'}</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {photos.map((photo, idx) => {
                  // Find original index for lightbox
                  const originalIndex = event.media.findIndex(m => m.url === photo.url);
                  return (
                    <motion.div
                      key={idx}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setSelectedMediaIndex(originalIndex)}
                      className="relative aspect-square rounded-3xl overflow-hidden group cursor-pointer bg-slate-100 border border-slate-100"
                    >
                      <img 
                        src={photo.url} 
                        alt={`Photo ${idx}`} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ImageIcon size={32} className="text-white" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Media Lightbox */}
      <AnimatePresence>
        {selectedMediaIndex !== null && event?.media && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-slate-950/95 flex items-center justify-center p-4 md:p-12"
          >
            <button 
              onClick={() => setSelectedMediaIndex(null)}
              className="absolute top-8 right-8 text-white/60 hover:text-white transition-colors z-10"
            >
              <X size={32} />
            </button>

            <div className="relative w-full h-full flex items-center justify-center">
              <button 
                onClick={handlePrevMedia}
                className="absolute left-0 top-1/2 -translate-y-1/2 p-4 text-white/40 hover:text-white transition-colors"
              >
                <ChevronLeft size={48} />
              </button>

              <motion.div
                key={selectedMediaIndex}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-full max-h-full flex items-center justify-center"
              >
                {event.media[selectedMediaIndex].type === 'video' ? (
                  <div className="w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl">
                    <iframe 
                      src={event.media[selectedMediaIndex].url}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <img 
                    src={event.media[selectedMediaIndex].url} 
                    alt="Gallery" 
                    className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
                    referrerPolicy="no-referrer"
                  />
                )}
              </motion.div>

              <button 
                onClick={handleNextMedia}
                className="absolute right-0 top-1/2 -translate-y-1/2 p-4 text-white/40 hover:text-white transition-colors"
              >
                <ChevronRight size={48} className={isRtl ? 'rotate-180' : ''} />
              </button>
            </div>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
              {event.media.map((_, i) => (
                <button 
                  key={i}
                  onClick={() => setSelectedMediaIndex(i)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    selectedMediaIndex === i ? "bg-white w-8" : "bg-white/20 hover:bg-white/40"
                  )}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ShareModal 
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={title}
        url={window.location.href}
        description={description}
        thumbnail={event.image}
      />
    </div>
  );
}
