import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Calendar, Plus, Search, Filter, Edit, Trash2, 
  Video, Image as ImageIcon, Share2, Radio, Loader2,
  Clock, MapPin, ExternalLink
} from 'lucide-react';
import { Event } from '../../types';
import { clsx } from 'clsx';
import { api } from '../../services/api';

export default function EventManager() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await api.get('/api/events');
        const data = (Array.isArray(response.data) ? response.data : []).map((doc: any) => ({
          ...doc,
          title: typeof doc.title === 'string' ? JSON.parse(doc.title) : doc.title,
          location: typeof doc.location === 'string' ? JSON.parse(doc.location) : doc.location,
          date: doc.event_date
        }));
        data.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setEvents(data as Event[]);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm(isRtl ? 'هل أنت متأكد من حذف هذه الفعالية؟' : 'Are you sure you want to delete this event?')) {
      try {
        await api.delete(`/api/events/${id}`);
        setEvents(events.filter(e => e.id !== id));
      } catch (error) {
        console.error("Error deleting event:", error);
      }
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = 
      event.title[isRtl ? 'ar' : 'en']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location[isRtl ? 'ar' : 'en']?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || event.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{isRtl ? 'إدارة الفعاليات' : 'Event Management'}</h1>
          <p className="text-slate-500 text-sm mt-1">{isRtl ? 'إدارة المؤتمرات، الندوات، والبث المباشر' : 'Manage conferences, seminars, and live streams'}</p>
        </div>
        <button 
          onClick={() => navigate('/admin/events/new')}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
        >
          <Plus size={20} />
          {isRtl ? 'إضافة فعالية جديدة' : 'Add New Event'}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <input 
            type="text"
            placeholder={isRtl ? 'بحث في الفعاليات...' : 'Search events...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
        </div>
        <select 
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
        >
          <option value="all">{isRtl ? 'كل الحالات' : 'All Statuses'}</option>
          <option value="upcoming">{isRtl ? 'قادمة' : 'Upcoming'}</option>
          <option value="ongoing">{isRtl ? 'حالية (بث مباشر)' : 'Ongoing (Live)'}</option>
          <option value="completed">{isRtl ? 'منتهية' : 'Completed'}</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={48} /></div>
      ) : filteredEvents.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-start">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">{isRtl ? 'الفعالية' : 'Event'}</th>
                  <th className="px-6 py-4">{isRtl ? 'التاريخ' : 'Date'}</th>
                  <th className="px-6 py-4">{isRtl ? 'الموقع' : 'Location'}</th>
                  <th className="px-6 py-4">{isRtl ? 'الحالة' : 'Status'}</th>
                  <th className="px-6 py-4 text-center">{isRtl ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-100 flex-shrink-0">
                          <img 
                            src={event.image || 'https://picsum.photos/seed/event/200/200'} 
                            alt="" 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 line-clamp-1">
                            {event.title[isRtl ? 'ar' : 'en']}
                          </p>
                          {event.liveStreamUrl && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 uppercase">
                              <Radio size={10} className="animate-pulse" />
                              Live Stream
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(event.date).toLocaleDateString(isRtl ? 'ar-YE' : 'en-US')}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {event.location[isRtl ? 'ar' : 'en']}
                    </td>
                    <td className="px-6 py-4">
                      <span className={clsx(
                        "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase",
                        event.status === 'ongoing' ? "bg-rose-100 text-rose-700" :
                        event.status === 'upcoming' ? "bg-blue-100 text-blue-700" :
                        "bg-slate-100 text-slate-600"
                      )}>
                        {event.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => navigate(`/admin/events/${event.id}`)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(event.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white p-20 rounded-2xl border-2 border-dashed border-slate-200 text-center">
          <Calendar size={40} className="text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900">{isRtl ? 'لا توجد فعاليات' : 'No events found'}</h3>
          <button 
            onClick={() => navigate('/admin/events/new')}
            className="mt-4 text-blue-600 font-bold hover:underline"
          >
            {isRtl ? 'أضف فعالية الآن' : 'Add an event now'}
          </button>
        </div>
      )}
    </div>
  );
}
