import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Bell, Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  time: string;
  location: string;
  type: 'course' | 'workshop' | 'conference';
}

export function EventCalendar() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Mock events for the calendar
  const events: CalendarEvent[] = [
    { id: '1', title: isRtl ? 'دورة الصحافة الاستقصائية' : 'Investigative Journalism Course', date: new Date(new Date().getFullYear(), new Date().getMonth(), 15), time: '10:00 AM', location: isRtl ? 'المقر الرئيسي' : 'Main HQ', type: 'course' },
    { id: '2', title: isRtl ? 'ورشة عمل: السلامة المهنية' : 'Workshop: Occupational Safety', date: new Date(new Date().getFullYear(), new Date().getMonth(), 22), time: '02:00 PM', location: 'Online (Zoom)', type: 'workshop' },
    { id: '3', title: isRtl ? 'مؤتمر حرية التعبير' : 'Freedom of Expression Conference', date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 5), time: '09:00 AM', location: isRtl ? 'صنعاء' : 'Sanaa', type: 'conference' },
  ];

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const monthNames = isRtl 
    ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  const dayNames = isRtl
    ? ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س']
    : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const getEventsForDay = (day: number) => {
    return events.filter(e => 
      e.date.getDate() === day && 
      e.date.getMonth() === currentDate.getMonth() && 
      e.date.getFullYear() === currentDate.getFullYear()
    );
  };

  const handleNotify = (event: CalendarEvent) => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(isRtl ? 'تم تفعيل التنبيه' : 'Notification Enabled', {
            body: isRtl ? `سنقوم بتذكيرك بموعد: ${event.title}` : `We will remind you about: ${event.title}`,
            icon: '/icon-192x192.png'
          });
        }
      });
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col md:flex-row">
      <div className="p-6 md:p-8 flex-1">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-slate-900">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              {isRtl ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
            <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              {isRtl ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-slate-400">
          {dayNames.map(day => <div key={day} className="p-2">{day}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="p-2" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayEvents = getEventsForDay(day);
            const isSelected = selectedDate?.getDate() === day && selectedDate?.getMonth() === currentDate.getMonth();
            const isToday = new Date().getDate() === day && new Date().getMonth() === currentDate.getMonth() && new Date().getFullYear() === currentDate.getFullYear();
            
            return (
              <button
                key={day}
                onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                className={`relative p-2 md:p-4 rounded-xl border flex flex-col items-center gap-1 transition-all
                  ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:bg-slate-50'}
                  ${isToday && !isSelected ? 'bg-slate-100 font-bold' : ''}
                `}
              >
                <span className={`text-sm ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>{day}</span>
                {dayEvents.length > 0 && (
                  <div className="flex gap-1">
                    {dayEvents.map((e, idx) => (
                      <span key={idx} className={`w-1.5 h-1.5 rounded-full ${e.type === 'course' ? 'bg-blue-500' : e.type === 'workshop' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-full md:w-80 bg-slate-50 border-l border-slate-100 p-6 flex flex-col">
        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
          <CalendarIcon size={20} className="text-blue-600" />
          {selectedDate ? selectedDate.toLocaleDateString(isRtl ? 'ar-YE' : 'en-US', { day: 'numeric', month: 'long' }) : (isRtl ? 'الأحداث القادمة' : 'Upcoming Events')}
        </h3>

        <div className="flex-1 space-y-4 overflow-y-auto">
          {events
            .filter(e => !selectedDate || (e.date.getDate() === selectedDate.getDate() && e.date.getMonth() === selectedDate.getMonth()))
            .map(event => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"
              >
                <div className={`text-[10px] font-bold px-2 py-0.5 rounded-md inline-block mb-2
                  ${event.type === 'course' ? 'bg-blue-100 text-blue-800' : 
                    event.type === 'workshop' ? 'bg-emerald-100 text-emerald-800' : 
                    'bg-rose-100 text-rose-800'}
                `}>
                  {event.type.toUpperCase()}
                </div>
                <h4 className="font-bold text-slate-900 leading-tight mb-2">{event.title}</h4>
                <div className="space-y-1.5 text-xs text-slate-500">
                  <div className="flex items-center gap-2"><Clock size={14} /> {event.time}</div>
                  <div className="flex items-center gap-2"><MapPin size={14} /> {event.location}</div>
                </div>
                <button 
                  onClick={() => handleNotify(event)}
                  className="mt-4 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Bell size={14} />
                  {isRtl ? 'تنبيهي' : 'Remind Me'}
                </button>
              </motion.div>
          ))}
          
          {events.filter(e => !selectedDate || (e.date.getDate() === selectedDate.getDate() && e.date.getMonth() === selectedDate.getMonth())).length === 0 && (
            <div className="text-center py-12 text-slate-400">
              {isRtl ? 'لا توجد أحداث في هذا اليوم' : 'No events for this day'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
