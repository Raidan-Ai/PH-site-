import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { CalendarIcon, ChevronLeft, ChevronRight, X, Clock, Play, Ticket } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export default function CinemaCalendar({ shows, onTicketRequest }: { shows: any[], onTicketRequest: (show: any) => void }) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedShow, setSelectedShow] = useState<any>(null);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const getShowsForDate = (date: Date) => {
    return shows.filter(s => {
      if (!s.show_time) return false;
      const showDate = new Date(s.show_time);
      return showDate.getDate() === date.getDate() &&
             showDate.getMonth() === date.getMonth() &&
             showDate.getFullYear() === date.getFullYear();
    });
  };

  const renderCells = () => {
    const cells = [];
    let dayIdx = isRtl ? (firstDayOfMonth + 1) % 7 : firstDayOfMonth; // Simple adjustment
    
    // Add empty cells for beginning of month
    for (let i = 0; i < dayIdx; i++) {
      cells.push(<div key={`empty-${i}`} className="p-2 border border-slate-100 bg-slate-50/50 min-h-[100px]"></div>);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), d);
      const dayShows = getShowsForDate(cellDate);
      
      cells.push(
        <div key={d} className="p-2 border border-slate-100 min-h-[100px] hover:bg-slate-50 transition-colors relative">
          <span className="text-sm font-bold text-slate-400 block mb-2">{d}</span>
          <div className="flex flex-col gap-1">
            {dayShows.map(show => (
              <button 
                key={show.id}
                onClick={() => setSelectedShow(show)}
                className={twMerge(
                  "text-xs px-2 py-1.5 rounded-md font-bold text-right truncate w-full border transition-all",
                  show.status === 'upcoming' ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                )}
              >
                {show.title}
              </button>
            ))}
          </div>
        </div>
      );
    }
    return cells;
  };

  return (
    <div className="mb-16">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Calendar Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="bg-slate-100 p-2 rounded-xl">
              <CalendarIcon className="w-5 h-5 text-slate-700" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              {currentDate.toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { month: 'long', year: 'numeric' })}
            </h3>
          </div>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
            <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
          {['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map(day => (
            <div key={day} className="p-3 text-center text-xs font-bold text-slate-500">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 bg-white">
          {renderCells()}
        </div>
      </div>

      {/* Show Details Modal */}
      <AnimatePresence>
        {selectedShow && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="relative h-48 sm:h-64 shrink-0">
                <img 
                  src={selectedShow.poster_url || "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&q=80&w=800"} 
                  alt={selectedShow.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent"></div>
                <button 
                  onClick={() => setSelectedShow(null)}
                  className="absolute top-4 left-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors backdrop-blur-md"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute bottom-6 right-6 left-6 text-white">
                  <h3 className="text-2xl font-black mb-2">{selectedShow.title}</h3>
                  <div className="flex gap-4 text-sm font-bold opacity-90">
                    <span className="flex items-center"><Clock className="w-4 h-4 ml-1" /> {selectedShow.show_time ? new Date(selectedShow.show_time).toLocaleString(isRtl ? 'ar-EG' : 'en-US') : ''}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-6 sm:p-8 overflow-y-auto">
                <div className="mb-6">
                  <h4 className="text-lg font-bold text-slate-900 mb-2">قصة الفيلم</h4>
                  <p className="text-slate-600 leading-relaxed">{selectedShow.plot}</p>
                </div>

                {selectedShow.news_content && (
                  <div className="mb-6 bg-slate-50 rounded-2xl p-6 border border-slate-100">
                    <h4 className="text-lg font-bold text-slate-900 mb-2 flex items-center">
                      <Play className="w-4 h-4 ml-2 text-emerald-600" />
                      مخرجات النقاش
                    </h4>
                    <p className="text-slate-600 leading-relaxed">{selectedShow.news_content}</p>
                  </div>
                )}

                {selectedShow.status === 'upcoming' && (
                  <div className="pt-6 border-t border-slate-100">
                    <button 
                      onClick={() => {
                        setSelectedShow(null);
                        onTicketRequest(selectedShow);
                      }}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center transition-colors"
                    >
                      <Ticket className="w-5 h-5 ml-2" />
                      طلب تذكرة حضور
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
