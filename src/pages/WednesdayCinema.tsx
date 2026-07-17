import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Play, Ticket, Calendar as CalendarIcon, Clock, Film, Info, X, CheckCircle, Users, Activity } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import CinemaCalendar from '../components/CinemaCalendar';
import axios from 'axios';

export default function WednesdayCinema() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  
  const [shows, setShows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [selectedShow, setSelectedShow] = useState<any>(null);
  
  // Ticket form state
  const [fullName, setFullName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [interestReason, setInterestReason] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Stats state
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchShows();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/cinema/stats');
      if (response.data.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchShows = async () => {
    try {
      const response = await axios.get('/api/cinema/shows');
      setShows(response.data);
    } catch (error) {
      console.error('Error fetching shows:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTicket = (show: any) => {
    setSelectedShow(show);
    setTicketModalOpen(true);
    setSubmitted(false);
  };

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post('/api/cinema/tickets', {
        show_id: selectedShow.id,
        full_name: fullName,
        whatsapp,
        interest_reason: interestReason,
        age_group: ageGroup
      });
      setSubmitted(true);
      setFullName('');
      setWhatsapp('');
      setInterestReason('');
      setAgeGroup('');
    } catch (error) {
      console.error('Error submitting ticket:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const upcomingShows = shows.filter(s => s.status === 'upcoming');
  const pastShows = shows.filter(s => s.status === 'past');

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      <Helmet>
        <title>{isRtl ? 'سينما الأربعاء | بيت الصحافة' : 'Wednesday Cinema | Press House'}</title>
      </Helmet>

      {/* Hero Section */}
      <section className="bg-slate-900 pt-32 pb-20 relative overflow-hidden text-white">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=2000" 
            alt="Cinema Background" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/80 to-slate-900"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center space-x-2 space-x-reverse bg-slate-800/50 backdrop-blur border border-slate-700 rounded-full px-4 py-1.5 mb-8"
            >
              <Film className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-bold text-slate-200">
                {isRtl ? 'مشروع ثقافي أسبوعي' : 'Weekly Cultural Project'}
              </span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-black mb-6 leading-tight"
            >
              {isRtl ? 'مساحة للعرض… ومساحة للتفكير' : 'A Space to Watch... A Space to Think'}
              <br />
              <span className="text-emerald-400">{isRtl ? 'سينما الأربعاء' : 'Wednesday Cinema'}</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-slate-300 leading-relaxed mb-8 max-w-3xl mx-auto"
            >
              {isRtl 
                ? 'سينما الأربعاء هو مشروع ثقافي أسبوعي يُنفَّذ بالشراكة بين بيت الصحافة ومؤسسة أرنيادا للتنمية الثقافية، يهدف إلى إعادة إحياء تجربة السينما الجماعية في مدينة تعز، وتحويلها إلى منصة للحوار، والتعلم، وبناء الوعي النقدي. نحن لا نعرض أفلاماً فقط… نحن نعيد بناء “الفضاء العام” من خلال السينما.' 
                : 'Wednesday Cinema is a weekly cultural project implemented in partnership between Press House and Arniada Foundation for Cultural Development. It aims to revive the collective cinema experience in Taiz, transforming it into a platform for dialogue, learning, and building critical awareness. We don’t just screen films... we rebuild the "public space" through cinema.'}
            </motion.p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        ) : (
          <div className="space-y-24">
            
            {/* Stats Mini Dashboard */}
            {stats && (
              <section className="mb-16">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Total Attendance */}
                  <div className="bg-emerald-600 rounded-3xl p-8 text-white flex flex-col justify-center relative overflow-hidden shadow-lg">
                    <div className="absolute -right-6 -top-6 opacity-10">
                      <Users className="w-48 h-48" />
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-xl font-medium text-emerald-100 mb-2">{isRtl ? 'إجمالي حضور النقاشات' : 'Total Discussion Attendance'}</h3>
                      <div className="text-6xl font-black">{stats.totalAttendance}</div>
                      <div className="mt-4 flex items-center text-sm font-bold bg-emerald-500/50 w-max px-3 py-1 rounded-full">
                        <Activity className="w-4 h-4 ml-1.5" />
                        مشارك مسجل
                      </div>
                    </div>
                  </div>

                  {/* Age Distribution Chart */}
                  <div className="md:col-span-2 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                      <div className="w-2 h-6 bg-emerald-500 rounded-full ml-3"></div>
                      {isRtl ? 'توزيع الفئات العمرية للمشاركين' : 'Age Group Distribution'}
                    </h3>
                    <div className="h-48 w-full flex-grow relative">
                      {stats.ageDistribution && stats.ageDistribution.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={stats.ageDistribution}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {stats.ageDistribution.map((entry, index) => {
                                const colors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];
                                return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                              })}
                            </Pie>
                            <RechartsTooltip 
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                              itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                            />
                            <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                          {isRtl ? 'لا توجد بيانات كافية' : 'Not enough data'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Cinema Calendar */}
            <section className="mb-16">
               <div className="flex items-center space-x-3 space-x-reverse mb-10">
                 <h2 className="text-3xl font-black text-slate-900">
                   {isRtl ? 'التقويم السينمائي' : 'Cinema Calendar'}
                 </h2>
                 <div className="h-px bg-slate-200 flex-grow rounded"></div>
               </div>
               <CinemaCalendar shows={shows} onTicketRequest={handleOpenTicket} />
            </section>

            {/* Upcoming Shows */}
            {upcomingShows.length > 0 && (
              <section>
                <div className="flex items-center space-x-3 space-x-reverse mb-10">
                  <h2 className="text-3xl font-black text-slate-900">
                    {isRtl ? 'العروض القادمة' : 'Upcoming Screenings'}
                  </h2>
                  <div className="h-px bg-slate-200 flex-grow rounded"></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  {upcomingShows.map((show) => (
                    <motion.div 
                      key={show.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      className="bg-white rounded-[2rem] overflow-hidden shadow-lg border border-slate-100 flex flex-col sm:flex-row group"
                    >
                      <div className="sm:w-2/5 relative h-64 sm:h-auto overflow-hidden">
                        <img 
                          src={show.poster_url || "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&q=80&w=600"} 
                          alt={show.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        {show.trailer_url && (
                          <a 
                            href={show.trailer_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          >
                            <div className="bg-emerald-500 text-white rounded-full p-4 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                              <Play className="w-6 h-6 ml-1" />
                            </div>
                          </a>
                        )}
                        <div className="absolute top-4 right-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                          {isRtl ? 'قريباً' : 'Upcoming'}
                        </div>
                      </div>
                      
                      <div className="sm:w-3/5 p-6 flex flex-col justify-between">
                        <div>
                          <h3 className="text-2xl font-black text-slate-900 mb-2">{show.title}</h3>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-slate-500 mb-4">
                            {show.show_time && (
                              <div className="flex items-center text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                                <CalendarIcon className="w-4 h-4 ml-1.5" />
                                {new Date(show.show_time).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                              </div>
                            )}
                            {show.show_time && (
                              <div className="flex items-center bg-slate-100 px-2 py-1 rounded-md">
                                <Clock className="w-4 h-4 ml-1.5" />
                                {new Date(show.show_time).toLocaleTimeString(isRtl ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                          </div>
                          
                          <p className="text-slate-600 text-sm leading-relaxed mb-6 line-clamp-4">
                            {show.plot}
                          </p>
                        </div>
                        
                        <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
                          <button 
                            onClick={() => handleOpenTicket(show)}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center transition-colors"
                          >
                            <Ticket className="w-5 h-5 ml-2" />
                            {isRtl ? 'حجز تذكرة' : 'Request Ticket'}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* Past Shows */}
            {pastShows.length > 0 && (
              <section>
                <div className="flex items-center space-x-3 space-x-reverse mb-10">
                  <h2 className="text-3xl font-black text-slate-900">
                    {isRtl ? 'عروض سابقة' : 'Past Screenings'}
                  </h2>
                  <div className="h-px bg-slate-200 flex-grow rounded"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {pastShows.map((show) => (
                    <motion.div 
                      key={show.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow group"
                    >
                      <div className="aspect-[4/3] relative overflow-hidden">
                        <img 
                          src={show.poster_url || "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&q=80&w=600"} 
                          alt={show.title}
                          className="w-full h-full object-cover filter grayscale hover:grayscale-0 transition-all duration-500"
                        />
                        <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur text-white text-xs font-bold px-3 py-1 rounded-full">
                          {show.show_time && new Date(show.show_time).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { month: 'long', year: 'numeric' })}
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-1">{show.title}</h3>
                        <p className="text-slate-500 text-sm leading-relaxed mb-4 line-clamp-3">
                          {show.plot}
                        </p>
                        {show.news_content && (
                          <div className="pt-4 border-t border-slate-100">
                            <button className="text-emerald-600 hover:text-emerald-700 font-bold text-sm flex items-center">
                              <Info className="w-4 h-4 ml-1" />
                              {isRtl ? 'اقرأ التغطية ومخرجات النقاش' : 'Read coverage and discussion takeaways'}
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {shows.length === 0 && !loading && (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                <Film className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-600 mb-2">
                  {isRtl ? 'لا توجد عروض حالياً' : 'No screenings available'}
                </h3>
                <p className="text-slate-400">
                  {isRtl ? 'سيتم إضافة عروض سينما الأربعاء قريباً.' : 'Wednesday Cinema screenings will be added soon.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ticket Modal */}
      <AnimatePresence>
        {ticketModalOpen && (
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
              className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="p-6 md:p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-black text-slate-900">
                    {isRtl ? 'طلب حجز تذكرة' : 'Ticket Request'}
                  </h3>
                  <button 
                    onClick={() => setTicketModalOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {submitted ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                    <h4 className="text-xl font-bold text-slate-900 mb-2">
                      {isRtl ? 'تم إرسال طلبك بنجاح!' : 'Request Sent Successfully!'}
                    </h4>
                    <p className="text-slate-500 mb-8">
                      {isRtl 
                        ? 'سيتم التواصل معك عبر الواتساب لتأكيد حجز التذكرة وتزويدك بالتفاصيل.' 
                        : 'We will contact you via WhatsApp to confirm your ticket and provide details.'}
                    </p>
                    <button 
                      onClick={() => setTicketModalOpen(false)}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 px-6 rounded-xl transition-colors"
                    >
                      {isRtl ? 'إغلاق' : 'Close'}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-start">
                      <Film className="w-5 h-5 text-emerald-600 ml-3 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-slate-900">{selectedShow?.title}</div>
                        <div className="text-sm text-slate-500 mt-1">
                          {selectedShow?.show_time && new Date(selectedShow.show_time).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handleTicketSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">
                          {isRtl ? 'الاسم الثلاثي' : 'Full Name'} <span className="text-red-500">*</span>
                        </label>
                        <input 
                          type="text" 
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium"
                          placeholder={isRtl ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                        />
                      </div>
                      
                      
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">
                          {isRtl ? 'الفئة العمرية' : 'Age Group'} <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          value={ageGroup}
                          onChange={(e) => setAgeGroup(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium"
                        >
                          <option value="">{isRtl ? 'اختر الفئة العمرية' : 'Select Age Group'}</option>
                          <option value="18-24">18 - 24</option>
                          <option value="25-34">25 - 34</option>
                          <option value="35-44">35 - 44</option>
                          <option value="45+">45+</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">
                          {isRtl ? 'رقم الواتساب' : 'WhatsApp Number'} <span className="text-red-500">*</span>
                        </label>
                        <input 
                          type="tel" 
                          required
                          dir="ltr"
                          value={whatsapp}
                          onChange={(e) => setWhatsapp(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium text-left"
                          placeholder="+967 7X XXX XXXX"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">
                          {isRtl ? 'لماذا ترغب في حضور العرض والنقاش؟' : 'Why do you want to attend?'}
                        </label>
                        <textarea 
                          rows={3}
                          value={interestReason}
                          onChange={(e) => setInterestReason(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium resize-none"
                          placeholder={isRtl ? 'اكتب باختصار...' : 'Write briefly...'}
                        />
                      </div>

                      <button 
                        type="submit"
                        disabled={submitting}
                        className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-xl transition-colors disabled:opacity-70 flex justify-center items-center"
                      >
                        {submitting ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          isRtl ? 'إرسال الطلب' : 'Submit Request'
                        )}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
