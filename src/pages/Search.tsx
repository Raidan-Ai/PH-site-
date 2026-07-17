import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Search as SearchIcon, 
  Calendar, 
  Tag, 
  Clock, 
  Filter, 
  ArrowLeft, 
  ArrowRight,
  Newspaper,
  Briefcase,
  Layers,
  ShieldAlert,
  MessageSquare,
  FileText,
  HelpCircle,
  TrendingUp,
  Sliders
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import { Link } from 'react-router-dom';

export default function Search() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [timeframe, setTimeframe] = useState('all');
  const [keywords, setKeywords] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const categories = [
    { value: 'all', label: isRtl ? 'الكل' : 'All Sections', icon: <Layers size={16} /> },
    { value: 'news', label: isRtl ? 'الأخبار' : 'News', icon: <Newspaper size={16} /> },
    { value: 'report', label: isRtl ? 'التقارير' : 'Reports', icon: <FileText size={16} /> },
    { value: 'job', label: isRtl ? 'الوظائف' : 'Jobs', icon: <Briefcase size={16} /> },
    { value: 'tender', label: isRtl ? 'المناقصات' : 'Tenders', icon: <FileText size={16} /> },
    { value: 'event', label: isRtl ? 'الفعاليات' : 'Events', icon: <Calendar size={16} /> },
    { value: 'project', label: isRtl ? 'المشاريع' : 'Projects', icon: <Sliders size={16} /> },
    { value: 'forum', label: isRtl ? 'المنتدى' : 'Forum', icon: <MessageSquare size={16} /> }
  ];

  const timeframes = [
    { value: 'all', label: isRtl ? 'كل الأوقات' : 'Anytime' },
    { value: 'today', label: isRtl ? 'آخر ٢٤ ساعة' : 'Past 24H' },
    { value: 'week', label: isRtl ? 'هذا الأسبوع' : 'Past Week' },
    { value: 'month', label: isRtl ? 'هذا الشهر' : 'Past Month' },
    { value: 'year', label: isRtl ? 'هذه السنة' : 'Past Year' }
  ];

  const popularKeywords = [
    isRtl ? 'حرية الصحافة' : 'Press Freedom',
    isRtl ? 'تدريب' : 'Training',
    isRtl ? 'تقرير سنوي' : 'Annual Report',
    isRtl ? 'وظائف شاغرة' : 'Job Openings',
    isRtl ? 'مستقبل الصحافة' : 'Journalism Future',
    isRtl ? 'انتهاك' : 'Violation'
  ];

  const performSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    setHasSearched(true);
    try {
      const response = await api.get('/api/search', {
        params: {
          q: query,
          category,
          timeframe,
          keywords
        }
      });
      setResults(response.data || []);
    } catch (err: any) {
      console.error('Search error:', err);
      setError(isRtl ? 'عذراً، تعذر إتمام البحث حالياً.' : 'Sorry, failed to complete your search.');
    } finally {
      setLoading(false);
    }
  };

  // Run search when filters change instantly for real-time responsiveness
  useEffect(() => {
    performSearch();
  }, [category, timeframe]);

  const handlePopularKeywordClick = (word: string) => {
    setQuery(word);
    performSearch();
  };

  const getSectionBadge = (section: string) => {
    switch (section) {
      case 'news':
        return { 
          label: isRtl ? 'خبر' : 'News', 
          style: 'bg-emerald-50 text-emerald-700 border-emerald-100',
          icon: <Newspaper size={12} />
        };
      case 'report':
        return { 
          label: isRtl ? 'تقرير حقوقي' : 'Report', 
          style: 'bg-indigo-50 text-indigo-700 border-indigo-100',
          icon: <FileText size={12} />
        };
      case 'event':
        return { 
          label: isRtl ? 'فعالية' : 'Event', 
          style: 'bg-amber-50 text-amber-700 border-amber-100',
          icon: <Calendar size={12} />
        };
      case 'job':
        return { 
          label: isRtl ? 'وظيفة' : 'Job', 
          style: 'bg-purple-50 text-purple-700 border-purple-100',
          icon: <Briefcase size={12} />
        };
      case 'tender':
        return { 
          label: isRtl ? 'مناقصة' : 'Tender', 
          style: 'bg-rose-50 text-rose-700 border-rose-100',
          icon: <FileText size={12} />
        };
      case 'project':
        return { 
          label: isRtl ? 'مشروع' : 'Project', 
          style: 'bg-blue-50 text-blue-700 border-blue-100',
          icon: <Sliders size={12} />
        };
      case 'forum':
        return { 
          label: isRtl ? 'منتدى' : 'Forum', 
          style: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: <MessageSquare size={12} />
        };
      default:
        return { 
          label: isRtl ? 'محتوى' : 'Content', 
          style: 'bg-gray-100 text-gray-700 border-gray-200',
          icon: <HelpCircle size={12} />
        };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-20 px-4 md:px-8" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header Title */}
        <div className="text-center md:text-start space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors mb-2">
            {isRtl ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
            {isRtl ? 'العودة للرئيسية' : 'Back to Home'}
          </Link>
          <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight">
            {isRtl ? 'محرك البحث العام للموقع' : 'Simplified Site Search'}
          </h1>
          <p className="text-xs md:text-sm text-slate-400 font-medium">
            {isRtl 
              ? 'تصفح جميع التقارير والقرارات والأخبار والفعاليات بسهولة مطلقة وبدون تعقيد.' 
              : 'Directly search posts, reports, jobs or tenders with zero clutter and high response rates.'}
          </p>
        </div>

        {/* Dynamic Search Box (Mac Spotlight Inspired Design) */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 md:p-6 shadow-xl shadow-slate-100 space-y-6">
          <form onSubmit={performSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={isRtl ? 'اكتب ما تبحث عنه هنا...' : 'Type tags, terms or titles...'}
                className="w-full pl-10 pr-10 py-3.5 bg-slate-50 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold text-slate-800 text-xs md:text-sm shadow-inner placeholder:text-slate-400"
              />
              <SearchIcon size={16} className={`absolute top-4 text-slate-400 ${isRtl ? 'right-3.5' : 'left-3.5'}`} />
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 sm:px-8 rounded-2xl font-black text-xs transition-all active:scale-95 cursor-pointer border-none flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/10"
            >
              <span>{isRtl ? 'ابحث' : 'Search'}</span>
            </button>
          </form>

          {/* Clean Inline Category Filter Pills instead of a huge sidebar */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                {isRtl ? 'اختر القسم للفرز السريع:' : 'Filter by category:'}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => {
                  const isSelected = category === cat.value;
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategory(cat.value)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer border ${
                        isSelected 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/10 scale-105'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200/60 text-slate-600'
                      }`}
                    >
                      {cat.icon}
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Inline Timeframe Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  {isRtl ? 'النطاق الوقتي للمادة:' : 'Filter by period:'}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {timeframes.map((tf) => {
                    const isSelected = timeframe === tf.value;
                    return (
                      <button
                        key={tf.value}
                        type="button"
                        onClick={() => setTimeframe(tf.value)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all border cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 border-blue-200 text-blue-600 font-extrabold'
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {tf.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Popular queries tags */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  {isRtl ? 'روابط بحث مقترحة ومكررة:' : 'Suggested keywords:'}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {popularKeywords.map((word) => (
                    <button
                      key={word}
                      type="button"
                      onClick={() => handlePopularKeywordClick(word)}
                      className="px-2.5 py-1 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 border border-slate-100 hover:border-blue-200 text-slate-500 rounded-lg transition-colors font-bold cursor-pointer text-[10px]"
                    >
                      #{word}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Area */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col items-center justify-center space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-xs font-bold text-slate-400">{isRtl ? 'جاري البحث الفوري في الأرشيف...' : 'Searching archives...'}</p>
            </div>
          ) : error ? (
            <div className="p-5 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl text-xs font-bold">
              {error}
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center px-2">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  {isRtl 
                    ? `تم العثور على ${results.length} نتيجة بحث` 
                    : `Found ${results.length} search results`}
                </p>
                <span className="text-[10px] font-bold text-slate-400">
                  {isRtl ? 'مرتبة حسب الأحدث' : 'Sorted by newest'}
                </span>
              </div>

              <AnimatePresence>
                {results.map((item, index) => {
                  const badge = getSectionBadge(item.section);
                  return (
                    <motion.div
                      key={`${item.section}-${item.id}-${index}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.04 }}
                      className="bg-white border border-slate-200 hover:border-blue-500/40 p-5 md:p-6 rounded-3xl transition-all shadow-sm hover:shadow-md group"
                    >
                      <div className="flex flex-col sm:flex-row gap-5">
                        {item.image && (
                          <div className="w-full sm:w-28 h-20 rounded-2xl overflow-hidden shrink-0 bg-slate-50 border border-slate-100">
                            <img 
                              src={item.image} 
                              alt="" 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black border uppercase ${badge.style}`}>
                              {badge.icon}
                              {badge.label}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                              <Calendar size={11} />
                              {new Date(item.date).toLocaleDateString(i18n.language === 'ar' ? 'ar-YE' : 'en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                          <h3 className="text-sm md:text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            <Link to={item.path}>
                              {item.title[i18n.language] || item.title.ar || item.title.en}
                            </Link>
                          </h3>
                          <p className="text-xs text-slate-400 font-medium leading-relaxed line-clamp-2">
                            {item.description[i18n.language] || item.description.ar || item.description.en}
                          </p>
                          <div className="pt-2">
                            <Link 
                              to={item.path} 
                              className="text-xs text-blue-600 font-black flex items-center gap-1 hover:underline tracking-wider"
                            >
                              {isRtl ? 'اقرأ كامل المادة' : 'Read Full Item'}
                              {isRtl ? <span className="text-[10px]">←</span> : <span className="text-[10px]">→</span>}
                            </Link>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ) : hasSearched ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3 shadow-sm">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <SearchIcon size={20} />
              </div>
              <h3 className="text-sm font-bold text-slate-800">{isRtl ? 'لم نعثر على أي نتائج مطابقة' : 'No matching results found'}</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                {isRtl 
                  ? 'يرجى مراجعة تهجئة العبارة أو استخدام الفلاتر المخصصة بالأعلى للوصول إلى المحتويات المرجوة.' 
                  : 'Please check your text spelling or reset section pills to inspect wider archives.'}
              </p>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3 shadow-sm">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                <TrendingUp size={20} />
              </div>
              <h3 className="text-sm font-bold text-slate-800">{isRtl ? 'جاهزون للبحث الشمولي والذكي' : 'Ready to search the site'}</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                {isRtl 
                  ? 'اكتب أي كلمة أو حدد قسم من الأقسام بالأعلى للوصول الفوري لكل الأوراق العلمية والتقارير والأخبار.' 
                  : 'Write query terms or toggle horizontal tabs above to filter relevant records immediately.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
