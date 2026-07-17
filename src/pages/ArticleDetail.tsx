import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SEO } from '../components/common/SEO';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { Calendar, User, ArrowLeft, Share2, Facebook, Twitter, Link as LinkIcon, Clock, Tag, ChevronRight, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Article } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { api } from '../services/api';
import NewsletterSignup from '../components/NewsletterSignup';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function ArticleDetail() {
  const { id } = useParams();
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  // Ratings States
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingName, setRatingName] = useState('');
  const [ratingEmail, setRatingEmail] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingStats, setRatingStats] = useState({ count: 0, avgRating: '0.0' });

  const fetchRatingStats = async () => {
    if (!id) return;
    try {
      const response = await api.get(`/api/feedback/ratings/${id}`);
      setRatingStats(response.data || { count: 0, avgRating: '0.0' });
    } catch (err) {
      console.error('Error loading rating statistics:', err);
    }
  };

  useEffect(() => {
    if (id) {
      fetchRatingStats();
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      const fetchArticle = async () => {
        setLoading(true);
        try {
          const response = await api.get('/api/articles');
          const data = response.data.find((a: any) => String(a.id) === String(id));
          if (data) {
            setArticle({
               ...data,
               title: typeof data.title === 'string' ? JSON.parse(data.title) : data.title,
               content: typeof data.content === 'string' ? JSON.parse(data.content) : data.content
            } as Article);
          }
        } catch (error) {
          console.error("Error fetching article:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchArticle();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50/50 space-y-4">
        <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest animate-pulse">
          {isRtl ? 'جاري التحميل...' : 'Loading Article...'}
        </p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50/50 space-y-8">
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
          <Tag size={48} />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black text-slate-900">{isRtl ? 'المقال غير موجود' : 'Article Not Found'}</h2>
          <p className="text-slate-500 font-medium">{isRtl ? 'ربما تم حذف المقال أو الرابط غير صحيح' : 'The article might have been deleted or the link is incorrect'}</p>
        </div>
        <Link to="/news" className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200">
          {isRtl ? 'العودة للأخبار' : 'Back to News'}
        </Link>
      </div>
    );
  }

  const lang = i18n.language as 'ar' | 'en';
  const title = article.title[lang] || article.title[isRtl ? 'ar' : 'en'];
  const content = article.content[lang] || article.content[isRtl ? 'ar' : 'en'];
  
  const seoTitle = article.seo?.title?.[lang] || title;
  const seoDescription = article.seo?.description?.[lang] || '';
  const seoKeywords = article.seo?.keywords?.[lang] || '';

  return (
    <div className="min-h-screen bg-white pb-32">
      <SEO 
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        image={article.mainImage}
        type="article"
        author={article.authorId}
        publishedTime={article.publishDate || article.createdAt}
      />
      {/* Article Header */}
      <header className="relative pt-32 pb-20 overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.15),transparent_70%)]" />
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
                    { label: isRtl ? 'الأخبار' : 'News', path: '/news' },
                    { label: title }
                  ]} 
                  className="!text-slate-300 [&_a]:!text-slate-300 hover:[&_a]:!text-white [&_span.font-medium]:!text-slate-100" 
                />
              </div>
              <Link to="/news" className="md:hidden group flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest">
                <div className={cn("w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-all", isRtl && "rotate-180")}>
                  <ArrowLeft size={14} />
                </div>
                {isRtl ? 'العودة للأخبار' : 'Back to News'}
              </Link>
              <div className="w-1 h-1 bg-slate-700 rounded-full md:hidden" />
              <div className="text-blue-400 text-[10px] font-black uppercase tracking-widest md:hidden">
                {article.category}
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
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-xs">
                  {article.author?.charAt(0) || 'A'}
                </div>
                <div className="text-start">
                  <div className="text-white text-xs font-black uppercase tracking-widest">{article.author || (isRtl ? 'بيت الصحافة' : 'Press House')}</div>
                  <div className="text-slate-500 text-[10px] font-bold">{isRtl ? 'محرر' : 'Editor'}</div>
                </div>
              </div>

              <div className="h-8 w-px bg-slate-800 hidden sm:block" />

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  <Calendar size={14} className="text-blue-500" />
                  {new Date(article.createdAt).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  <Clock size={14} className="text-blue-500" />
                  {Math.ceil(content.split(' ').length / 200)} {isRtl ? 'دقائق قراءة' : 'min read'}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Main Image */}
      <div className="container mx-auto px-6 -mt-16 relative z-20">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="max-w-5xl mx-auto aspect-[21/9] rounded-[48px] overflow-hidden shadow-2xl border-8 border-white"
        >
          <img 
            src={article.mainImage} 
            alt={title} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </motion.div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Sidebar - Left (Desktop) */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-32 space-y-8">
              <div className="flex flex-col gap-4">
                <button className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all flex items-center justify-center border border-slate-100">
                  <Facebook size={20} />
                </button>
                <button className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 hover:bg-sky-50 hover:text-sky-500 transition-all flex items-center justify-center border border-slate-100">
                  <Twitter size={20} />
                </button>
                <button className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-all flex items-center justify-center border border-slate-100">
                  <LinkIcon size={20} />
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-8">
            <article className="prose prose-xl prose-slate max-w-none 
              prose-headings:font-black prose-headings:tracking-tight prose-headings:text-slate-900
              prose-p:text-slate-600 prose-p:leading-[1.8] prose-p:font-medium
              prose-img:rounded-[32px] prose-img:shadow-xl
              prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
              prose-blockquote:border-l-4 prose-blockquote:border-blue-600 prose-blockquote:bg-blue-50/50 prose-blockquote:p-8 prose-blockquote:rounded-r-3xl prose-blockquote:italic
              rtl:prose-blockquote:border-l-0 rtl:prose-blockquote:border-r-4 rtl:prose-blockquote:rounded-r-none rtl:prose-blockquote:rounded-l-3xl
            ">
              <div dangerouslySetInnerHTML={{ __html: content }} />
            </article>

            {/* Article Rating and Feedback */}
            <div className="mt-12 p-8 bg-slate-900 text-white rounded-[32px] border border-slate-800 shadow-xl space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold tracking-tight text-white">
                    {isRtl ? 'ما هو تقييمك لهذا المقال؟' : 'How would you rate this article?'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isRtl 
                      ? 'رأيك يهمنا ويساعدنا في تحسين جودة المحتوى الصحفي المقدم.' 
                      : 'Your voice matters. Help us elevate journalistic reporting in Yemen.'}
                  </p>
                </div>
                {ratingStats.count > 0 && (
                  <div className="bg-slate-800 px-4 py-2 rounded-xl text-xs flex items-center gap-2 border border-slate-700 self-start md:self-auto">
                    <Star size={16} className="text-amber-400 fill-amber-400" />
                    <span className="font-extrabold text-white text-sm">{ratingStats.avgRating}</span>
                    <span className="text-slate-400">({ratingStats.count} {isRtl ? 'تقييمات' : 'votes'})</span>
                  </div>
                )}
              </div>

              {ratingSubmitted ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-emerald-950/20 border border-emerald-500/30 p-6 rounded-2xl text-center space-y-2"
                >
                  <p className="text-emerald-400 font-extrabold text-sm">
                    {isRtl ? '✓ نشكرك على تقييمك ورأيك القّيم!' : '✓ Thank you for your feedback and rating!'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {isRtl 
                      ? 'تم تسجيل مراجعتك بنجاح في أرشيف بيت الصحافة.' 
                      : 'Your review was registered successfully in the Press House records.'}
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {/* Star selection widget */}
                  <div className="flex items-center gap-2 py-2 justify-center md:justify-start">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="transition-transform hover:scale-110 p-1 bg-transparent border-none cursor-pointer focus:outline-none"
                      >
                        <Star 
                          size={28} 
                          className={cn(
                            "transition-colors",
                            (hoverRating || rating) >= star 
                              ? "text-amber-400 fill-amber-400" 
                              : "text-slate-600"
                          )}
                        />
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={ratingName}
                      onChange={(e) => setRatingName(e.target.value)}
                      placeholder={isRtl ? 'الاسم بالكامل (اختياري)' : 'Full Name (Optional)'}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-500"
                    />
                    <input
                      type="email"
                      value={ratingEmail}
                      onChange={(e) => setRatingEmail(e.target.value)}
                      placeholder={isRtl ? 'البريد الإلكتروني (اختياري)' : 'Email (Optional)'}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-500 shadow-sm"
                    />
                  </div>

                  <textarea
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    rows={3}
                    placeholder={isRtl ? 'اكتب تعليقك أو أي ملاحظة تود مشاركتها معنا...' : 'Leave a comment or details about your rating...'}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-500 resize-none shadow-sm"
                  />

                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={submittingRating || rating === 0}
                      onClick={async () => {
                        setSubmittingRating(true);
                        try {
                          await api.post('/api/feedback', {
                            name: ratingName || 'Anonymous',
                            email: ratingEmail || '',
                            comment: ratingComment,
                            rating: rating,
                            feedback_type: 'article_rating',
                            item_id: id
                          });
                          setRatingSubmitted(true);
                          await fetchRatingStats();
                        } catch (err) {
                          console.error(err);
                        } finally {
                          setSubmittingRating(false);
                        }
                      }}
                      className={cn(
                        "px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer border-none",
                        rating === 0 
                          ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
                          : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                      )}
                    >
                      {submittingRating ? (isRtl ? 'جاري الإرسال...' : 'Submitting...') : (isRtl ? 'إرسال تقييمي' : 'Submit Rating')}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="mt-16 pt-16 border-t border-slate-100 flex flex-wrap gap-3">
              {['اليمن', 'صحافة', 'حقوق الإنسان', 'بيت الصحافة'].map(tag => (
                <span key={tag} className="px-4 py-2 bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-xl border border-slate-100">
                  #{tag}
                </span>
              ))}
            </div>
          </main>

          {/* Sidebar - Right (Desktop) */}
          <aside className="lg:col-span-3 space-y-12">
            <NewsletterSignup source="article_detail" variant="sidebar" />

            <div className="space-y-6">
              <h3 className="text-lg font-black text-slate-900">{isRtl ? 'أخبار ذات صلة' : 'Related News'}</h3>
              <div className="space-y-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="group cursor-pointer space-y-2">
                    <div className="text-[10px] text-blue-600 font-black uppercase tracking-widest">
                      {isRtl ? 'تقارير' : 'Reports'}
                    </div>
                    <h4 className="text-sm font-black text-slate-900 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                      {isRtl ? 'تقرير جديد حول حرية الصحافة في اليمن للعام ٢٠٢٤' : 'New report on press freedom in Yemen for 2024'}
                    </h4>
                    <div className="text-[10px] text-slate-400 font-bold">
                      14 Mar 2024
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
