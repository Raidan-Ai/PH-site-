import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, Loader2, Star, Search, Filter, Quote, Radio, CheckCircle, Mail, AlertTriangle } from 'lucide-react';
import { api } from '../../services/api';

export const FeedbackManager: React.FC = () => {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // all, article_rating, contact, general
  const [ratingFilter, setRatingFilter] = useState('all'); // all, 5, 4, 3, 2, 1

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/feedback');
      setFeedbacks(response.data || []);
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const deleteFeedback = async (id: number) => {
    if (window.confirm(isRtl ? 'هل أنت متأكد من حذف هذا التعليق والتقييم نهائياً؟' : 'Are you sure you want to permanently delete this rating and comment?')) {
      try {
        await api.delete(`/api/feedback/${id}`);
        setFeedbacks(feedbacks.filter(f => f.id !== id));
      } catch (error) {
        console.error("Error deleting feedback:", error);
      }
    }
  };

  // Filter feedback
  const filteredFeedbacks = feedbacks.filter(f => {
    const matchesSearch = 
      (f.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (f.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (f.comment?.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = typeFilter === 'all' || f.feedback_type === typeFilter;
    const matchesRating = ratingFilter === 'all' || String(f.rating) === ratingFilter;

    return matchesSearch && matchesType && matchesRating;
  });

  const getAverageRating = () => {
    const ratingsOnly = feedbacks.filter(f => f.rating > 0);
    if (ratingsOnly.length === 0) return '0.0';
    const total = ratingsOnly.reduce((acc, f) => acc + f.rating, 0);
    return (total / ratingsOnly.length).toFixed(1);
  };

  return (
    <div className="space-y-8" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header and Summary Cards */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{isRtl ? 'الآراء والملاحظات والتقييمات' : 'User Feedback & Ratings'}</h1>
          <p className="text-slate-500 text-sm mt-1">
            {isRtl 
              ? 'مراقبة وإدارة التقييمات والتعليقات والرسائل المستلمة من زوار الموقع.' 
              : 'Review and manage ratings, complaints, contact inputs and comments received from visitors.'}
          </p>
        </div>
      </div>

      {/* Aggregate Metric Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <p className="text-slate-400 text-xs font-black uppercase tracking-wider">{isRtl ? 'إجمالي المدخلات' : 'Total Submissions'}</p>
          <p className="text-3xl font-black text-slate-900">{feedbacks.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <p className="text-slate-400 text-xs font-black uppercase tracking-wider">{isRtl ? 'متوسط تقييم المقالات' : 'Average Article Score'}</p>
          <div className="flex items-center gap-2">
            <p className="text-3xl font-black text-slate-900">{getAverageRating()}</p>
            <Star className="text-amber-400 fill-amber-400" size={24} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <p className="text-slate-400 text-xs font-black uppercase tracking-wider">{isRtl ? 'تقييمات المقالات والتقارير' : 'Article Ratings'}</p>
          <p className="text-3xl font-black text-indigo-600">
            {feedbacks.filter(f => f.feedback_type === 'article_rating').length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <p className="text-slate-400 text-xs font-black uppercase tracking-wider">{isRtl ? 'رسائل نموذج الاتصال' : 'Contact Forms Logs'}</p>
          <p className="text-3xl font-black text-emerald-600">
            {feedbacks.filter(f => f.feedback_type === 'contact').length}
          </p>
        </div>
      </div>

      {/* Filter Options */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search box */}
          <div className="relative">
            <input 
              type="text"
              placeholder={isRtl ? 'بحث في الاسم، البريد، أو نص الملاحظة...' : 'Search name, email, or comments...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-xs text-slate-800 font-bold"
            />
            <Search className={`absolute text-slate-400 ${isRtl ? 'right-3' : 'left-3'} top-3.5`} size={16} />
          </div>

          {/* Type filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 shrink-0">{isRtl ? 'نوع الرسالة:' : 'Type:'}</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 font-bold"
            >
              <option value="all">{isRtl ? 'الكل' : 'All'}</option>
              <option value="article_rating">{isRtl ? 'تقييمات المقالات' : 'Article Rating'}</option>
              <option value="contact">{isRtl ? 'رسائل نموذج الاتصال' : 'Contact Form'}</option>
              <option value="general">{isRtl ? 'ملاحظة عامة' : 'General Notes'}</option>
            </select>
          </div>

          {/* Rating filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 shrink-0">{isRtl ? 'التقييم النجمي:' : 'Stars:'}</span>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 font-bold"
            >
              <option value="all">{isRtl ? 'كل التقييمات' : 'All Ratings'}</option>
              <option value="5">⭐⭐⭐⭐⭐ (5/5)</option>
              <option value="4">⭐⭐⭐⭐ (4/5)</option>
              <option value="3">⭐⭐⭐ (3/5)</option>
              <option value="2">⭐⭐ (2/5)</option>
              <option value="1">⭐ (1/5)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={48} /></div>
      ) : filteredFeedbacks.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {filteredFeedbacks.map((f) => (
            <div key={f.id} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-sm text-slate-900">{f.name || 'Anonymous'}</span>
                    {f.email && <span className="text-slate-400 text-xs">({f.email})</span>}
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold">
                    {new Date(f.createdAt).toLocaleString(isRtl ? 'ar-YE' : 'en-US')}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-xl border ${
                    f.feedback_type === 'article_rating' 
                      ? 'bg-indigo-50 border-indigo-100 text-indigo-600'
                      : f.feedback_type === 'contact'
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                      : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}>
                    {f.feedback_type === 'article_rating' ? (isRtl ? 'تقييم مقال' : 'Article Score') : f.feedback_type === 'contact' ? (isRtl ? 'نموذج الاتصال' : 'Contact Form') : (isRtl ? 'عام' : 'General')}
                  </span>

                  <button 
                    onClick={() => deleteFeedback(f.id)}
                    className="p-2 hover:bg-rose-50 text-slate-400 hover:text-red-600 rounded-xl transition-colors border-none bg-transparent cursor-pointer"
                    title={isRtl ? 'حذف' : 'Delete'}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Stars visualization */}
              {f.rating > 0 && (
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star 
                      key={s} 
                      size={16} 
                      className={s <= f.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} 
                    />
                  ))}
                </div>
              )}

              {/* Comment text */}
              {f.comment && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 relative">
                  <Quote size={24} className="absolute text-slate-200/50 right-3 top-3" />
                  <p className="text-xs text-slate-600 leading-relaxed pl-6 relative z-10 font-medium">
                    {f.comment}
                  </p>
                </div>
              )}

              {f.item_id && f.feedback_type === 'article_rating' && (
                <div className="text-[10px] text-slate-400 font-bold">
                  {isRtl ? 'رابط المادة المقّدرة:' : 'Evaluated Item ID:'} <span className="text-blue-600 underline font-mono select-all">/news/{f.item_id}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-2">
          <p className="text-slate-500 font-bold">{isRtl ? 'لا توجد آراء أو تقييمات مطابقة حالياً.' : 'No feedback or rating matches found.'}</p>
          <small className="text-slate-400 block">{isRtl ? 'يرجى مراجعة كلمات الفلترة أو الانتظار ريثما يقوم الزوار بتقييم المحتوى.' : 'Ensure your filter parameters are cleared.'}</small>
        </div>
      )}
    </div>
  );
};
