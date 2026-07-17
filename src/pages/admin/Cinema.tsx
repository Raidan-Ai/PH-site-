import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Plus, Edit2, Trash2, Search, Link as LinkIcon, Download, Film, Ticket, Calendar, Clock } from 'lucide-react';
import axios from 'axios';

export default function CinemaAdmin() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  
  const [shows, setShows] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Tabs: 'shows', 'tickets'
  const [activeTab, setActiveTab] = useState('shows');
  
  // Modals
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    slug: '',
    status: 'upcoming',
    show_time: '',
    imdb_id: '',
    plot: '',
    poster_url: '',
    trailer_url: '',
    director: '',
    release_year: '',
    production: '',
    author: '',
    main_cast: '',
    news_content: ''
  });
  
  const [fetchingImdb, setFetchingImdb] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'shows') {
        const res = await axios.get('/api/cinema/shows');
        setShows(res.data);
      } else {
        const res = await axios.get('/api/cinema/tickets');
        setTickets(res.data);
      }
    } catch (error) {
      console.error('Error fetching cinema data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImdbFetch = async () => {
    if (!formData.imdb_id) return;
    
    // Extract ID if full URL is pasted
    let idToFetch = formData.imdb_id;
    if (idToFetch.includes('imdb.com/title/')) {
      const parts = idToFetch.split('/title/');
      if (parts.length > 1) {
        idToFetch = parts[1].split('/')[0];
        setFormData({ ...formData, imdb_id: idToFetch });
      }
    }

    setFetchingImdb(true);
    try {
      const res = await axios.get(`/api/cinema/imdb/\${idToFetch}`);
      if (res.data.success) {
        const data = res.data.data;
        setFormData(prev => ({
          ...prev,
          title: data.title || prev.title,
          plot: data.plot || prev.plot,
          poster_url: data.poster_url || prev.poster_url,
          director: data.director || prev.director,
          release_year: data.release_year || prev.release_year,
          main_cast: data.main_cast || prev.main_cast,
          slug: data.title ? data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : prev.slug
        }));
      }
    } catch (error) {
      console.error('Error fetching IMDB data:', error);
      alert('Failed to fetch IMDB data. Ensure it is a valid IMDB ID.');
    } finally {
      setFetchingImdb(false);
    }
  };

  const openNewShow = () => {
    setFormData({
      id: '',
      title: '',
      slug: '',
      status: 'upcoming',
      show_time: '',
      imdb_id: '',
      plot: '',
      poster_url: '',
      trailer_url: '',
      director: '',
      release_year: '',
      production: '',
      author: '',
      main_cast: '',
      news_content: ''
    });
    setShowModal(true);
  };

  const editShow = (show: any) => {
    setFormData({
      ...show,
      show_time: show.show_time ? new Date(show.show_time).toISOString().slice(0, 16) : ''
    });
    setShowModal(true);
  };

  const deleteShow = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this show?')) {
      try {
        await axios.delete(`/api/cinema/shows/\${id}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting show:', error);
      }
    }
  };

  const saveShow = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await axios.put(`/api/cinema/shows/\${formData.id}`, formData);
      } else {
        await axios.post('/api/cinema/shows', formData);
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error('Error saving show:', error);
    }
  };

  const updateTicketStatus = async (id: number, status: string) => {
    try {
      await axios.put(`/api/cinema/tickets/\${id}/status`, { status });
      fetchData();
    } catch (error) {
      console.error('Error updating ticket:', error);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Helmet>
        <title>Cinema Management | Admin</title>
      </Helmet>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-800">إدارة سينما الأربعاء</h1>
          <p className="text-slate-500 mt-1">إدارة العروض السينمائية وحجوزات التذاكر</p>
        </div>
        {activeTab === 'shows' && (
          <button 
            onClick={openNewShow}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center font-bold transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5 ml-2" />
            إضافة عرض جديد
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6 gap-6">
        <button
          onClick={() => setActiveTab('shows')}
          className={`pb-3 px-2 font-bold text-sm flex items-center transition-colors \${
            activeTab === 'shows' ? 'border-b-2 border-emerald-600 text-emerald-600' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Film className="w-4 h-4 ml-2" />
          العروض السينمائية
        </button>
        <button
          onClick={() => setActiveTab('tickets')}
          className={`pb-3 px-2 font-bold text-sm flex items-center transition-colors \${
            activeTab === 'tickets' ? 'border-b-2 border-emerald-600 text-emerald-600' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Ticket className="w-4 h-4 ml-2" />
          حجوزات التذاكر
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      ) : activeTab === 'shows' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shows.map(show => (
            <div key={show.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
              <div className="aspect-[16/9] relative bg-slate-100 overflow-hidden">
                <img src={show.poster_url || "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=600"} alt={show.title} className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 flex gap-2">
                  <span className={`text-xs font-bold px-2 py-1 rounded-md text-white \${
                    show.status === 'upcoming' ? 'bg-amber-500' : 
                    show.status === 'past' ? 'bg-slate-600' : 'bg-rose-500'
                  }`}>
                    {show.status === 'upcoming' ? 'قادم' : show.status === 'past' ? 'سابق' : 'مسودة'}
                  </span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-lg text-slate-800 mb-1 line-clamp-1">{show.title}</h3>
                <div className="text-xs text-slate-500 flex items-center mb-4">
                  <Clock className="w-3 h-3 ml-1" />
                  {show.show_time ? new Date(show.show_time).toLocaleString('ar-EG') : 'غير محدد'}
                </div>
                <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                  <button onClick={() => editShow(show)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg flex-1 flex justify-center items-center font-bold text-sm transition-colors">
                    <Edit2 className="w-4 h-4 ml-1" /> تعديل
                  </button>
                  <button onClick={() => deleteShow(show.id)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg flex-1 flex justify-center items-center font-bold text-sm transition-colors">
                    <Trash2 className="w-4 h-4 ml-1" /> حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
          {shows.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500">لا توجد عروض سينمائية حالياً.</div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm text-right">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="p-4">تاريخ الطلب</th>
                <th className="p-4">اسم العرض</th>
                <th className="p-4">الاسم الثلاثي</th>
                <th className="p-4">الواتساب</th>
                <th className="p-4">الفئة العمرية</th>
                <th className="p-4">سبب الحضور</th>
                <th className="p-4">الحالة</th>
                <th className="p-4">الإجراء</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(ticket => (
                <tr key={ticket.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="p-4 text-slate-500">{new Date(ticket.createdAt).toLocaleDateString('ar-EG')}</td>
                  <td className="p-4 font-bold text-slate-800">{ticket.show_title}</td>
                  <td className="p-4">{ticket.full_name}</td>
                  <td className="p-4" dir="ltr">{ticket.whatsapp}</td>
                  <td className="p-4">{ticket.age_group || "-"}</td>
                  <td className="p-4 text-xs text-slate-500 max-w-xs">{ticket.interest_reason || '-'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold \${
                      ticket.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      ticket.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-rose-100 text-rose-700'
                    }`}>
                      {ticket.status === 'pending' ? 'قيد الانتظار' : ticket.status === 'approved' ? 'مقبول' : 'مرفوض'}
                    </span>
                  </td>
                  <td className="p-4">
                    {ticket.status === 'pending' && (
                      <div className="flex gap-2">
                        <button onClick={() => updateTicketStatus(ticket.id, 'approved')} className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold hover:bg-emerald-200">قبول</button>
                        <button onClick={() => updateTicketStatus(ticket.id, 'rejected')} className="bg-rose-100 text-rose-700 px-2 py-1 rounded text-xs font-bold hover:bg-rose-200">رفض</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {tickets.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">لا توجد طلبات حجوزات.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Show Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white/90 backdrop-blur z-10">
              <h2 className="text-xl font-bold text-slate-800">{formData.id ? 'تعديل عرض سينمائي' : 'إضافة عرض جديد'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <Trash2 className="w-5 h-5 hidden" /> {/* Hidden icon to keep spacing */}
                ✕
              </button>
            </div>
            
            <form onSubmit={saveShow} className="p-6">
              {/* IMDB Import Tool */}
              <div className="mb-8 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block text-sm font-bold text-slate-700 mb-2">استيراد من IMDB (اختياري)</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="أدخل رابط الفيلم أو IMDB ID (مثل: tt0111161)"
                    value={formData.imdb_id}
                    onChange={(e) => setFormData({...formData, imdb_id: e.target.value})}
                    className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-left" dir="ltr"
                  />
                  <button 
                    type="button" 
                    onClick={handleImdbFetch}
                    disabled={fetchingImdb || !formData.imdb_id}
                    className="bg-slate-800 text-white px-4 py-2 rounded-lg font-bold flex items-center disabled:opacity-50"
                  >
                    {fetchingImdb ? 'جاري الاستيراد...' : <><Download className="w-4 h-4 ml-2" /> استيراد البيانات</>}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">سيتم تعبئة الحقول تلقائياً (الاسم، الوصف، المخرج، سنة الإصدار، الغلاف).</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">اسم الفيلم</label>
                  <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">الرابط اللطيف (Slug)</label>
                  <input type="text" required value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-left" dir="ltr" />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">تاريخ ووقت العرض</label>
                  <input type="datetime-local" value={formData.show_time} onChange={e => setFormData({...formData, show_time: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-left" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">حالة العرض</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2">
                    <option value="upcoming">قادم (يسمح بالحجز)</option>
                    <option value="past">سابق (انتهى العرض)</option>
                    <option value="draft">مسودة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">رابط الغلاف (Poster URL)</label>
                  <input type="url" value={formData.poster_url} onChange={e => setFormData({...formData, poster_url: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-left" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">رابط الإعلان (Trailer URL - YouTube)</label>
                  <input type="url" value={formData.trailer_url} onChange={e => setFormData({...formData, trailer_url: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-left" dir="ltr" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">المخرج</label>
                  <input type="text" value={formData.director} onChange={e => setFormData({...formData, director: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">سنة الإصدار</label>
                  <input type="text" value={formData.release_year} onChange={e => setFormData({...formData, release_year: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-left" dir="ltr" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">وصف الفيلم والقصة</label>
                  <textarea rows={4} required value={formData.plot} onChange={e => setFormData({...formData, plot: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2"></textarea>
                </div>

                {formData.status === 'past' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1">تغطية صحفية أو مخرجات النقاش (للعروض السابقة)</label>
                    <textarea rows={4} value={formData.news_content} onChange={e => setFormData({...formData, news_content: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2"></textarea>
                  </div>
                )}
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl">إلغاء</button>
                <button type="submit" className="px-5 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl">حفظ العرض</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
