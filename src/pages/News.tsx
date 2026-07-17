import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Calendar, User, ArrowRight, Newspaper, Filter, Search, Clock, Tag } from 'lucide-react';
import { SEO } from '../components/common/SEO';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { api } from '../services/api';
import { useDocumentSEO } from '../hooks/useDocumentSEO';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function News() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [articles, setArticles] = useState<any[]>([]);
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Call dynamic SEO Hook based on current active news state
  useDocumentSEO({
    title: isRtl ? 'الأخبار والتقارير الصحفية | بيت الصحافة اليمني' : 'News & Press Reports | PressHouse Yemen',
    description: isRtl 
      ? 'تابع آخر الأخبار والتقارير الصحفية الاستقصائية والبيانات الصادرة عن بيت الصحافة في اليمن.' 
      : 'Stay updated with the latest news, investigative press reports, and media releases of PressHouse in Yemen.',
    keywords: isRtl ? 'أخبار اليمن, تقارير صحفية, حرية الرأي, الصحافة الاستقصائية' : 'Yemen news, journalism articles, press freedom, investigative reports'
  });

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        let rawArticles: any[] = [];
        const response = await api.get('/api/articles');
        console.log("RESPONSE DATA:", response.data); rawArticles = (Array.isArray(response.data) ? response.data : []).map((doc: any) => ({
          ...doc,
          title: typeof doc.title === 'string' ? JSON.parse(doc.title) : doc.title,
          content: typeof doc.content === 'string' ? JSON.parse(doc.content) : doc.content,
        }));

        const formattedAndFiltered = rawArticles
          .filter((a: any) => a.status === 'published' && (category === 'all' || a.category === category))
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        setArticles(formattedAndFiltered);
      } catch (error) {
        console.error("Error fetching news:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, [category]);

  const categories = [
    { id: 'all', label: isRtl ? 'الكل' : 'All', icon: Newspaper },
    { id: 'news', label: isRtl ? 'أخبار' : 'News', icon: Clock },
    { id: 'report', label: isRtl ? 'تقارير' : 'Reports', icon: Tag },
    { id: 'press_release', label: isRtl ? 'بيانات صحفية' : 'Press Releases', icon: Newspaper },
  ];

  const stripHtml = (html: string) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const filteredArticles = articles.filter(article => {
    const title = article.title[i18n.language as 'ar'|'en'] || '';
    return title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-slate-50/50 pb-32">
      <SEO 
        title={isRtl ? 'الأخبار والتقارير' : 'News & Reports'}
        description={isRtl ? 'آخر الأخبار والتقارير والمقالات الصحفية من بيت الصحافة' : 'Latest news, reports, and press articles from Press House'}
        type="website"
      />
      {/* Header Section */}
      <section className="bg-slate-900 pt-32 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_70%)]" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl space-y-6 md:space-y-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-4"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em]">
                <Newspaper size={12} />
                {isRtl ? 'المركز الإعلامي' : 'Media Center'}
              </div>
              <Breadcrumbs 
                items={[
                  { label: isRtl ? 'الرئيسية' : 'Home', path: '/' },
                  { label: isRtl ? 'الأخبار' : 'News' }
                ]} 
                className="hidden md:flex !text-slate-400 [&_a]:!text-slate-400 hover:[&_a]:!text-white [&_span.font-medium]:!text-slate-100" 
              />
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-7xl font-black text-white leading-tight tracking-tight"
            >
              {isRtl ? 'الأخبار والتقارير' : 'News & Reports'}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-sm md:text-xl text-slate-400 leading-relaxed font-medium"
            >
              {isRtl 
                ? 'تابع آخر المستجدات والتقارير الحقوقية والبيانات الصحفية الصادرة عن بيت الصحافة.'
                : 'Follow the latest updates, human rights reports, and press releases issued by Press House.'}
            </motion.p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 md:px-6 py-10 md:py-20 relative z-20">
        <div className="flex flex-col lg:flex-row gap-8 md:gap-12">
          
          {/* Sidebar */}
          <aside className="w-full lg:w-80 flex-shrink-0 space-y-8">
            <motion.div 
              initial={{ opacity: 0, x: isRtl ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-[32px] shadow-2xl shadow-slate-200/50 p-6 md:p-8 border border-slate-100 sticky top-32"
            >
              <div className="space-y-8">
                {/* Search */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Search size={16} className="text-blue-600" />
                    {isRtl ? 'بحث' : 'Search'}
                  </h3>
                  <div className="relative">
                    <Search className="absolute rtl:right-4 ltr:left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      placeholder={isRtl ? 'كلمات مفتاحية...' : 'Keywords...'}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full rtl:pr-11 rtl:pl-4 ltr:pl-11 ltr:pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs md:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Filter size={16} className="text-blue-600" />
                    {isRtl ? 'التصنيفات' : 'Categories'}
                  </h3>
                  <div className="space-y-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        className={cn(
                          "w-full px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-3",
                          category === cat.id 
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
                            : "bg-slate-50 text-slate-600 border border-slate-100 hover:bg-slate-100"
                        )}
                      >
                        <cat.icon size={16} />
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tags (Mock) */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Tag size={16} className="text-blue-600" />
                    {isRtl ? 'وسوم' : 'Tags'}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {['Human Rights', 'Journalism', 'Reports', 'Yemen', 'Media'].map((tag) => (
                      <span key={tag} className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold text-slate-500 cursor-pointer hover:bg-slate-100 transition-colors">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </aside>

          {/* Articles Grid */}
          <div className="flex-1">
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8"
            >
              <AnimatePresence mode="popLayout">
                {filteredArticles.length > 0 ? filteredArticles.map((article, idx) => (
              <motion.article 
                key={article.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.5, delay: idx * 0.05 }}
                className="group flex flex-col h-full bg-white rounded-3xl md:rounded-[40px] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img 
                    src={article.mainImage} 
                    alt={article.title[i18n.language as 'ar'|'en']} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute top-4 left-4 md:top-6 md:left-6 rtl:left-auto rtl:right-4 md:rtl:right-6">
                    <div className="bg-white/90 backdrop-blur-md text-blue-900 text-[10px] uppercase font-black px-3.5 py-1.5 md:px-4 md:py-2 rounded-full shadow-xl">
                      {article.category}
                    </div>
                  </div>
                </div>
                
                <div className="p-6 md:p-10 flex flex-col flex-grow space-y-4 md:space-y-6">
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
                    <Calendar size={12} className="text-blue-600" />
                    {new Date(article.createdAt).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-[1.3] group-hover:text-blue-600 transition-colors line-clamp-2">
                    {article.title[i18n.language as 'ar'|'en']}
                  </h2>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed line-clamp-3">
                    {stripHtml(article.content[i18n.language as 'ar'|'en'] || article.content[isRtl ? 'ar' : 'en'])}
                  </p>
                  <div className="pt-6 mt-auto">
                    <Link to={`/news/${article.id}`} className="inline-flex items-center gap-3 text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] group/link">
                      <span className="relative">
                        {isRtl ? 'اقرأ المزيد' : 'Read More'}
                        <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-blue-600 scale-x-0 group-hover/link:scale-x-100 transition-transform origin-left" />
                      </span>
                      <div className={cn("w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center group-hover/link:bg-blue-600 group-hover/link:border-blue-600 group-hover/link:text-white transition-all", isRtl && "rotate-180")}>
                        <ArrowRight size={14} />
                      </div>
                    </Link>
                  </div>
                </div>
              </motion.article>
            )) : !loading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full py-32 text-center space-y-6"
              >
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
                  <Newspaper size={48} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-900">{isRtl ? 'لا توجد نتائج' : 'No Results Found'}</h3>
                  <p className="text-slate-500 font-medium">{isRtl ? 'حاول تغيير معايير البحث أو التصفية' : 'Try changing your search or filter criteria'}</p>
                </div>
                <button 
                  onClick={() => { setCategory('all'); setSearchTerm(''); }}
                  className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all"
                >
                  {isRtl ? 'إعادة تعيين' : 'Reset Filters'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
