import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Download, Clock, AlertCircle, ArrowRight, ShieldCheck, Search, Filter, ChevronRight, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '../services/api';

export default function Tenders() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [tenders, setTenders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const fetchTenders = async () => {
      try {
        const response = await api.get('/api/tenders');
        if (response.data && response.data.length > 0) {
          const mapped = (Array.isArray(response.data) ? response.data : []).map((item: any) => {
            const title = typeof item.title === 'string' ? JSON.parse(item.title) : item.title;
            const description = typeof item.description === 'string' ? JSON.parse(item.description) : item.description;
            return {
              id: item.id,
              title: title[isRtl ? 'ar' : 'en'] || title['ar'] || title['en'],
              description: description[isRtl ? 'ar' : 'en'] || description['ar'] || description['en'],
              ref: `PH-${new Date(item.createdAt || Date.now()).getFullYear()}-${String(item.id).substring(0, 4)}`,
              deadline: item.deadline ? new Date(item.deadline).toISOString().slice(0, 10) : '2026-12-31',
              status: item.status || 'open',
              category: isRtl ? 'معدات وتقنية' : 'Technical & Equipment',
              posted: isRtl ? 'حديثاً' : 'Recently'
            };
          });
          setTenders(mapped);
        } else {
          // Backup defaults
          setTenders([
            { 
              id: '1', 
              title: isRtl ? 'توريد أجهزة حاسوب ومعدات تصوير احترافية' : 'Supply of Professional Computers and Photography Equipment', 
              ref: 'PH-2026-001', 
              deadline: '2026-10-05', 
              status: 'open',
              category: isRtl ? 'معدات تقنية' : 'Technical Equipment',
              posted: isRtl ? 'منذ 3 أيام' : '3 days ago'
            },
            { 
              id: '2', 
              title: isRtl ? 'خدمات تدريب وتأهيل صحفيين في مجال السلامة المهنية' : 'Journalist Training and Qualification Services in Professional Safety', 
              ref: 'PH-2026-002', 
              deadline: '2026-11-12', 
              status: 'open',
              category: isRtl ? 'خدمات تدريبية' : 'Training Services',
              posted: isRtl ? 'منذ أسبوع' : '1 week ago'
            },
          ]);
        }
      } catch (error) {
        console.error('Error fetching tenders:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTenders();
  }, [isRtl]);

  const filteredTenders = tenders.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    let matchesCategory = true;
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'Technical Equipment' || selectedCategory === 'معدات') {
        matchesCategory = item.category.includes('معدات') || item.category.toLowerCase().includes('tech') || item.category.toLowerCase().includes('equip');
      } else if (selectedCategory === 'Training Services' || selectedCategory === 'خدمات') {
        matchesCategory = item.category.includes('خدمات') || item.category.toLowerCase().includes('train') || item.category.toLowerCase().includes('serv');
      } else {
        matchesCategory = item.category === selectedCategory;
      }
    }
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="bg-white border-b border-slate-200 pt-32 pb-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-50/50 skew-x-12 transform translate-x-1/4" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl space-y-8">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-600 text-sm font-bold uppercase tracking-wider"
            >
              <ShieldCheck size={18} />
              {isRtl ? 'الشفافية والنزاهة' : 'Transparency & Integrity'}
            </motion.div>
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 tracking-tight leading-tight">
              {isRtl ? 'المناقصات والمشتريات' : 'Tenders & Procurement'}
            </h1>
            <p className="text-xl text-slate-500 leading-relaxed">
              {isRtl 
                ? 'نلتزم في بيت الصحافة بأعلى معايير الشفافية والعدالة في جميع إجراءات المشتريات والتعاقدات لضمان أفضل جودة وكفاءة.' 
                : 'At Press House, we are committed to the highest standards of transparency and fairness in all procurement and contracting procedures to ensure the best quality and efficiency.'}
            </p>
          </div>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="container mx-auto px-4 -mt-10 relative z-20">
        <div className="bg-white p-6 md:p-8 rounded-[32px] shadow-xl shadow-slate-200/50 border border-white flex flex-col lg:flex-row gap-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRtl ? 'بحث عن مناقصة...' : 'Search for a tender...'}
              className="w-full pl-12 pr-6 py-4 bg-slate-50 rounded-2xl border border-transparent focus:bg-white focus:border-blue-500 outline-none transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-6 py-4 bg-slate-50 rounded-2xl border border-transparent focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-slate-600"
            >
              <option value="all">{isRtl ? 'جميع الفئات' : 'All Categories'}</option>
              <option value={isRtl ? 'معدات' : 'Technical Equipment'}>{isRtl ? 'معدات وتقنية' : 'Technical & Equipment'}</option>
              <option value={isRtl ? 'خدمات' : 'Training Services'}>{isRtl ? 'خدمات تدريبية' : 'Training Services'}</option>
            </select>
          </div>
        </div>
      </section>

      {/* Tenders List */}
      <section className="container mx-auto px-4 py-24">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            {filteredTenders.map((tender, i) => (
            <motion.div 
              key={tender.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group bg-white p-8 md:p-12 rounded-[48px] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-blue-100 transition-all flex flex-col lg:flex-row justify-between items-start lg:items-center gap-12"
            >
              <div className="flex gap-8 items-start">
                <div className="w-24 h-24 bg-slate-50 text-slate-400 rounded-[32px] flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                  <FileText size={40} />
                </div>
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider">
                      {tender.ref}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
                      {tender.status}
                    </span>
                    <span className="text-xs text-slate-400 font-bold flex items-center gap-1">
                      <Clock size={14} />
                      {tender.posted}
                    </span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
                    {tender.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-400">
                    <span className="bg-slate-100 px-3 py-1 rounded-lg">{tender.category}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300 mx-2" />
                    <span className="text-rose-600 flex items-center gap-1">
                      <AlertCircle size={16} />
                      {isRtl ? 'الموعد النهائي:' : 'Deadline:'} {tender.deadline}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                <button className="w-full sm:w-auto border-2 border-slate-200 text-slate-600 px-10 py-5 rounded-2xl font-bold hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all flex items-center justify-center gap-2">
                  <Download size={20} />
                  {isRtl ? 'تحميل الوثائق' : 'Download Docs'}
                </button>
                <button className="w-full sm:w-auto bg-blue-600 text-white px-10 py-5 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-900/20 flex items-center justify-center gap-2">
                  {isRtl ? 'تقديم عرض' : 'Submit Proposal'}
                  <ArrowRight size={20} className={isRtl ? 'rotate-180' : ''} />
                </button>
              </div>
            </motion.div>
          ))}
          </div>
        )}

        {!loading && filteredTenders.length === 0 && (
          <div className="bg-white p-24 rounded-[48px] border-2 border-dashed border-slate-200 text-center space-y-6">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
              <AlertCircle size={48} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-slate-900">{isRtl ? 'لا توجد مناقصات مفتوحة حالياً تفي بالشروط' : 'No open tenders matching the criteria'}</h3>
              <p className="text-slate-500">{isRtl ? 'يرجى تغيير فئات التصفية أو البحث مجدداً.' : 'Please adjust your search criteria or filters.'}</p>
            </div>
          </div>
        )}
      </section>

      {/* Info Section */}
      <section className="container mx-auto px-4 pb-24">
        <div className="bg-slate-900 rounded-[48px] p-12 md:p-20 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-20 -translate-x-1/2 -translate-y-1/2" />
          
          <div className="flex-1 space-y-6 relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight">
              {isRtl ? 'هل لديك استفسار حول المناقصات؟' : 'Have a Question About Tenders?'}
            </h2>
            <p className="text-lg text-slate-400">
              {isRtl 
                ? 'فريق المشتريات لدينا جاهز للرد على جميع استفساراتكم المتعلقة بالوثائق والشروط وإجراءات التقديم.' 
                : 'Our procurement team is ready to answer all your inquiries regarding documents, conditions, and submission procedures.'}
            </p>
            <button className="bg-white text-slate-900 px-10 py-4 rounded-2xl font-bold hover:bg-slate-100 transition-all flex items-center gap-2">
              {isRtl ? 'تواصل مع قسم المشتريات' : 'Contact Procurement'}
              <ChevronRight size={20} className={isRtl ? 'rotate-180' : ''} />
            </button>
          </div>
          
          <div className="w-full md:w-1/3 aspect-square bg-white/5 rounded-[40px] border border-white/10 flex items-center justify-center backdrop-blur-sm">
            <ShieldCheck size={120} className="text-blue-500 opacity-50" />
          </div>
        </div>
      </section>
    </div>
  );
}
