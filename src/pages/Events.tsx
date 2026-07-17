import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, MapPin, Share2, Play, Image as ImageIcon, Video, Clock, ArrowRight, ExternalLink, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { Event } from '../types';
import { api } from '../services/api';
import { ShareModal } from '../components/ShareModal';
import { EventCalendar } from '../components/EventCalendar';

export default function Events() {

  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'ongoing' | 'completed'>('all');
  const [shareEvent, setShareEvent] = useState<Event | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await api.get('/api/events');
        console.log("EVENTS DATA:", response.data); const fetchedEvents = (Array.isArray(response.data) ? response.data : []).map((doc: any) => ({
          ...doc,
          date: doc.event_date ? new Date(doc.event_date).toISOString().split('T')[0] : '',
          title: typeof doc.title === 'string' ? JSON.parse(doc.title) : doc.title,
          description: typeof doc.description === 'string' ? JSON.parse(doc.description) : doc.description,
          location: typeof doc.location === 'string' ? JSON.parse(doc.location) : doc.location,
          media: typeof doc.media === 'string' ? JSON.parse(doc.media) : doc.media
        }));
        setEvents(fetchedEvents.length > 0 ? fetchedEvents : backupEvents);
      } catch (error) {
        console.error("Error fetching events:", error);
        setEvents(backupEvents);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const backupEvents: Event[] = [
    {
      id: '1', title: { ar: 'مؤتمر الصحفيين السنوي', en: 'Annual Journalists Conference' }, description: { ar: 'مؤتمر سنوي لمناقشة تحديات الصحافة', en: 'Annual conference to discuss journalism challenges' }, date: '2026-10-10', location: { ar: 'صنعاء', en: 'Sanaa' }, isLive: false, status: 'upcoming', media: [], image: '', createdAt: ''
    }
  ];

  const filteredEvents = events.filter(e => filter === 'all' || e.status === filter);
  const ongoingEvent = events.find(e => e.isLive && e.liveStreamUrl);

  const handleShare = (event: Event) => {
    setShareEvent(event);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <ShareModal 
        isOpen={!!shareEvent}
        onClose={() => setShareEvent(null)}
        title={shareEvent?.title[isRtl ? 'ar' : 'en'] || ''}
        url={window.location.origin + '/events/' + shareEvent?.id}
        description={shareEvent?.description[isRtl ? 'ar' : 'en']}
      />
      {/* Hero Section */}
      <section className="bg-slate-900 pt-32 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-rose-600 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10 text-center space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-rose-400 text-sm font-bold backdrop-blur-md"
          >
            <Calendar size={16} />
            {isRtl ? 'الفعاليات والمؤتمرات' : 'Events & Conferences'}
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight">
            {isRtl ? 'فعاليات بيت الصحافة' : 'Press House Events'}
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            {isRtl 
              ? 'تابع أحدث الفعاليات، الندوات، والمؤتمرات التي ننظمها لتعزيز المشهد الإعلامي.' 
              : 'Follow the latest events, seminars, and conferences we organize to enhance the media landscape.'}
          </p>
        </div>
      </section>

      {/* Live Stream Section (Happening Now) */}
      <AnimatePresence>
        {ongoingEvent && (
          <motion.section 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-rose-600 py-12 relative overflow-hidden"
          >
            <div className="container mx-auto px-4 relative z-10">
              <div className="flex flex-col lg:flex-row items-center gap-12">
                <div className="flex-1 space-y-6 text-white">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-widest">
                    <Radio size={14} className="animate-pulse" />
                    {isRtl ? 'يحدث الآن' : 'Happening Now'}
                  </div>
                  <h2 className="text-3xl md:text-5xl font-bold leading-tight">
                    {ongoingEvent.title[isRtl ? 'ar' : 'en']}
                  </h2>
                  <p className="text-rose-100 text-lg">
                    {ongoingEvent.description[isRtl ? 'ar' : 'en']}
                  </p>
                  <div className="flex flex-wrap gap-6 text-sm font-bold">
                    <div className="flex items-center gap-2"><MapPin size={18} /> {ongoingEvent.location[isRtl ? 'ar' : 'en']}</div>
                    <div className="flex items-center gap-2"><Clock size={18} /> {new Date(ongoingEvent.date).toLocaleTimeString()}</div>
                  </div>
                  <div className="pt-4">
                    <Link 
                      to={`/events/${ongoingEvent.id}`}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-white text-rose-600 rounded-xl font-bold hover:bg-rose-50 transition-all"
                    >
                      {isRtl ? 'عرض التفاصيل' : 'View Details'}
                      <ArrowRight size={20} className={isRtl ? 'rotate-180' : ''} />
                    </Link>
                  </div>
                </div>
                
                <div className="w-full lg:w-1/2 aspect-video bg-black rounded-[32px] overflow-hidden shadow-2xl border-4 border-white/10 relative group">
                  {ongoingEvent.liveStreamUrl ? (
                    <iframe 
                      src={ongoingEvent.liveStreamUrl}
                      className="w-full h-full border-0"
                      allowFullScreen
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white/40 space-y-4">
                      <Video size={64} />
                      <p className="font-bold">{isRtl ? 'البث المباشر سيبدأ قريباً' : 'Live stream starting soon'}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Interactive Calendar Section */}
      <section className="container mx-auto px-4 pt-12">
        <EventCalendar />
      </section>

      {/* Filter Bar */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex flex-wrap items-center justify-center gap-4">
          {[
            { id: 'all', label: isRtl ? 'الكل' : 'All' },
            { id: 'upcoming', label: isRtl ? 'القادمة' : 'Upcoming' },
            { id: 'ongoing', label: isRtl ? 'الحالية' : 'Ongoing' },
            { id: 'completed', label: isRtl ? 'السابقة' : 'Past' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id as any)}
              className={`px-8 py-3 rounded-2xl font-bold transition-all ${
                filter === item.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {/* Events Grid */}
      <section className="container mx-auto px-4 pb-24">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-[40px] aspect-[4/5] animate-pulse" />
            ))}
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group bg-white rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl transition-all overflow-hidden flex flex-col"
              >
                <div className="relative aspect-video overflow-hidden">
                  <img 
                    src={event.image || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=800'} 
                    alt={event.title[isRtl ? 'ar' : 'en']}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border ${
                      event.status === 'upcoming' ? 'bg-blue-500/80 text-white border-blue-400' :
                      event.status === 'ongoing' ? 'bg-rose-500/80 text-white border-rose-400' :
                      'bg-slate-500/80 text-white border-slate-400'
                    }`}>
                      {event.status === 'upcoming' ? (isRtl ? 'قادمة' : 'Upcoming') :
                       event.status === 'ongoing' ? (isRtl ? 'مباشر' : 'Live') :
                       (isRtl ? 'منتهية' : 'Completed')}
                    </span>
                  </div>
                </div>

                <div className="p-8 space-y-6 flex-1 flex flex-col">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-blue-600" />
                      {new Date(event.date).toLocaleDateString(isRtl ? 'ar-YE' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-blue-600" />
                      {event.location[isRtl ? 'ar' : 'en']}
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {event.title[isRtl ? 'ar' : 'en']}
                  </h3>

                  <p className="text-slate-500 line-clamp-3 text-sm leading-relaxed">
                    {event.description[isRtl ? 'ar' : 'en']}
                  </p>

                  <div className="pt-6 mt-auto border-t border-slate-100 flex items-center justify-between">
                    <button 
                      onClick={() => handleShare(event)}
                      className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all"
                    >
                      <Share2 size={20} />
                    </button>
                    <Link 
                      to={`/events/${event.id}`}
                      className="flex items-center gap-2 text-blue-600 font-bold hover:gap-3 transition-all"
                    >
                      {isRtl ? 'التفاصيل' : 'Details'}
                      <ArrowRight size={20} className={isRtl ? 'rotate-180' : ''} />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-24 rounded-[48px] border-2 border-dashed border-slate-200 text-center space-y-6">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
              <Calendar size={48} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-slate-900">{isRtl ? 'لا توجد فعاليات حالياً' : 'No events found'}</h3>
              <p className="text-slate-500">{isRtl ? 'يرجى مراجعة الصفحة لاحقاً لمتابعة أحدث فعالياتنا.' : 'Please check back later to follow our latest events.'}</p>
            </div>
          </div>
        )}
      </section>

      {/* Media Highlights Section */}
      <section className="bg-white py-24 border-t border-slate-100">
        <div className="container mx-auto px-4 space-y-12">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
                {isRtl ? 'المواد الإعلامية للفعاليات' : 'Event Media Highlights'}
              </h2>
              <p className="text-xl text-slate-500">
                {isRtl ? 'لقطات وصور من أبرز فعالياتنا السابقة.' : 'Snapshots and photos from our most prominent past events.'}
              </p>
            </div>
            <button className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-blue-600 transition-all flex items-center gap-2">
              {isRtl ? 'مشاهدة الكل' : 'View All Media'}
              <ExternalLink size={20} />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.02 }}
                className="relative aspect-square rounded-3xl overflow-hidden group cursor-pointer"
              >
                <img 
                  src={`https://images.unsplash.com/photo-${[
                    '1504711434969-e33886168f5c',
                    '1495020689067-958852a7765e',
                    '1585829365294-bb7520c35c7a',
                    '1504711434969-e33886168f5c',
                    '1495020689067-958852a7765e',
                    '1585829365294-bb7520c35c7a',
                    '1504711434969-e33886168f5c',
                    '1495020689067-958852a7765e'
                  ][i-1]}?auto=format&fit=crop&q=80&w=600&h=600`} 
                  alt="Media" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  {i % 3 === 0 ? <Video size={32} className="text-white" /> : <ImageIcon size={32} className="text-white" />}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
