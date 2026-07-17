import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Briefcase, MapPin, Calendar, ArrowRight, Search, Clock, Building2, DollarSign, CheckCircle2, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { JobApplicationModal } from '../components/JobApplicationModal';
import { api } from '../services/api';

export default function Jobs() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const navigate = useNavigate();
  const [selectedJob, setSelectedJob] = useState<string | null>(null);

  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await api.get('/api/jobs');
        if (response.data && response.data.length > 0) {
          const mapped = (Array.isArray(response.data) ? response.data : []).map((item: any) => {
            const title = typeof item.title === 'string' ? JSON.parse(item.title) : item.title;
            const description = typeof item.description === 'string' ? JSON.parse(item.description) : item.description;
            const requirements = typeof item.requirements === 'string' ? JSON.parse(item.requirements) : item.requirements;
            return {
              id: item.id,
              title: title[isRtl ? 'ar' : 'en'] || title['ar'] || title['en'],
              description: description[isRtl ? 'ar' : 'en'] || description['ar'] || description['en'],
              requirements: Array.isArray(requirements) ? requirements : (requirements[isRtl ? 'ar' : 'en'] || []),
              location: isRtl ? 'تعز، اليمن' : 'Taiz, Yemen',
              type: isRtl ? 'دوام كامل' : 'Full-time',
              salary: isRtl ? 'تنافسي' : 'Competitive',
              category: isRtl ? 'تحرير' : 'Editorial',
              deadline: item.deadline ? new Date(item.deadline).toISOString().slice(0, 10) : '2026-12-31',
              status: item.status || 'open',
              posted: isRtl ? 'حديثاً' : 'Recently'
            };
          });
          setJobs(mapped);
        } else {
          // Default backup lists
          setJobs([
            { 
              id: '1', 
              title: isRtl ? 'محرر صحفي أول' : 'Senior News Editor', 
              location: isRtl ? 'تعز، اليمن' : 'Taiz, Yemen', 
              type: isRtl ? 'دوام كامل' : 'Full-time', 
              deadline: '2026-10-15',
              salary: isRtl ? 'تنافسي' : 'Competitive',
              category: isRtl ? 'تحرير' : 'Editorial',
              posted: isRtl ? 'منذ يومين' : '2 days ago',
              status: 'open'
            },
            { 
              id: '2', 
              title: isRtl ? 'منسق مشاريع إعلامية' : 'Media Project Coordinator', 
              location: isRtl ? 'عدن، اليمن' : 'Aden, Yemen', 
              type: isRtl ? 'دوام كامل' : 'Full-time', 
              deadline: '2026-11-20',
              salary: isRtl ? 'تنافسي' : 'Competitive',
              category: isRtl ? 'إدارة' : 'Management',
              posted: isRtl ? 'منذ 5 أيام' : '5 days ago',
              status: 'open'
            },
            { 
              id: '3', 
              title: isRtl ? 'مصمم جرافيك وموشن جرافيك' : 'Graphic & Motion Designer', 
              location: isRtl ? 'عن بعد' : 'Remote', 
              type: isRtl ? 'عقد' : 'Contract', 
              deadline: '2026-09-10',
              salary: isRtl ? 'حسب المشروع' : 'Per Project',
              category: isRtl ? 'تصميم' : 'Design',
              posted: isRtl ? 'منذ أسبوع' : '1 week ago',
              status: 'open'
            },
          ]);
        }
      } catch (error) {
        console.error('Error fetching jobs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [isRtl]);

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (job.description && job.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || job.category === selectedCategory || (selectedCategory === 'تحرير' && job.category.includes('تحرير')) || (selectedCategory === 'Editorial' && job.category.includes('Editorial'));
    const matchesType = selectedType === 'all' || job.type === selectedType || (selectedType === 'Full-time' && job.type.includes('Full')) || (selectedType === 'دوام كامل' && job.type.includes('دوام'));
    return matchesSearch && matchesCategory && matchesType;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="bg-slate-900 pt-32 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-600 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10 text-center space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-blue-400 text-sm font-bold backdrop-blur-md"
          >
            <Briefcase size={16} />
            {isRtl ? 'انضم إلى فريقنا' : 'Join Our Team'}
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight">
            {isRtl ? 'فرص العمل المتاحة' : 'Job Opportunities'}
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            {isRtl 
              ? 'ساهم في تعزيز الحريات الإعلامية وتطوير المشهد الصحفي في اليمن. نحن نبحث عن المبدعين والشغوفين.' 
              : 'Contribute to promoting media freedoms and developing the journalistic landscape in Yemen. We are looking for creative and passionate individuals.'}
          </p>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="container mx-auto px-4 -mt-12 relative z-20">
        <div className="bg-white p-6 md:p-8 rounded-[32px] shadow-xl shadow-slate-200/50 border border-white flex flex-col lg:flex-row gap-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRtl ? 'ابحث عن وظيفة...' : 'Search for a job...'}
              className="w-full pl-12 pr-6 py-4 bg-slate-50 rounded-2xl border border-transparent focus:bg-white focus:border-blue-500 outline-none transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-6 py-4 bg-slate-50 rounded-2xl border border-transparent focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-slate-600"
            >
              <option value="all">{isRtl ? 'جميع الأقسام' : 'All Categories'}</option>
              <option value={isRtl ? 'تحرير' : 'Editorial'}>{isRtl ? 'تحرير' : 'Editorial'}</option>
              <option value={isRtl ? 'إدارة' : 'Management'}>{isRtl ? 'إدارة' : 'Management'}</option>
              <option value={isRtl ? 'تصميم' : 'Design'}>{isRtl ? 'تصميم' : 'Design'}</option>
            </select>
            <select 
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-6 py-4 bg-slate-50 rounded-2xl border border-transparent focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-slate-600"
            >
              <option value="all">{isRtl ? 'نوع الدوام' : 'Job Type'}</option>
              <option value={isRtl ? 'دوام كامل' : 'Full-time'}>{isRtl ? 'دوام كامل' : 'Full-time'}</option>
              <option value={isRtl ? 'عقد' : 'Contract'}>{isRtl ? 'عقد' : 'Contract'}</option>
              <option value={isRtl ? 'عن بعد' : 'Remote'}>{isRtl ? 'عن بعد' : 'Remote'}</option>
            </select>
          </div>
        </div>
      </section>

      {/* Jobs List */}
      <section className="container mx-auto px-4 py-24">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredJobs.map((job, i) => (
              <motion.div 
                key={job.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-blue-100 transition-all flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8"
              >
                <div className="flex gap-8 items-start">
                  <div className="w-20 h-20 bg-slate-50 text-blue-600 rounded-3xl flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                    <Building2 size={32} />
                  </div>
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider">
                        {job.category}
                      </span>
                      <span className="text-xs text-slate-400 font-bold flex items-center gap-1">
                        <Clock size={14} />
                        {job.posted}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {job.title}
                    </h3>
                    <div className="flex flex-wrap gap-6 text-sm font-bold text-slate-500">
                      <div className="flex items-center gap-2"><MapPin size={18} className="text-slate-300" /> {job.location}</div>
                      <div className="flex items-center gap-2"><DollarSign size={18} className="text-slate-300" /> {job.salary}</div>
                      <div className="flex items-center gap-2 text-emerald-600"><CheckCircle2 size={18} /> {job.type}</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                  <div className="text-right lg:text-center px-6">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{isRtl ? 'الموعد النهائي' : 'Deadline'}</div>
                    <div className="text-sm font-bold text-slate-900">{job.deadline}</div>
                  </div>
                  <button 
                    onClick={() => navigate(`/jobs/${job.id}`)}
                    className="w-full sm:w-auto bg-slate-900 text-white px-10 py-5 rounded-2xl font-bold hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10"
                  >
                    {t('jobs.view_details')}
                    <ArrowRight size={20} className={isRtl ? 'rotate-180' : ''} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredJobs.length === 0 && (
          <div className="bg-white p-24 rounded-[48px] border-2 border-dashed border-slate-200 text-center space-y-6">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
              <Briefcase size={48} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-slate-900">{isRtl ? 'لا توجد وظائف متاحة حالياً تفي بالشروط' : 'No jobs available matching the criteria'}</h3>
              <p className="text-slate-500">{isRtl ? 'يرجى تغيير خيارات البحث أو تصفية الوظائف والتحقق مجدداً.' : 'Please change your search criteria or filters and check again.'}</p>
            </div>
          </div>
        )}
      </section>

      <JobApplicationModal 
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        jobTitle={selectedJob || ''}
      />
    </div>
  );
}
