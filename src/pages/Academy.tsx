import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PlayCircle, Clock, BookOpen, Star, ArrowRight, GraduationCap, Award, Users, Search, Loader2, Radio, User, X, Mail, Phone, FileText, Send, CheckCircle2 } from 'lucide-react';
import { SEO } from '../components/common/SEO';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { motion, AnimatePresence } from 'motion/react';
import { Course } from '../types';
import { api } from '../services/api';

export default function Academy() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [settings, setSettings] = useState<any>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    education: '',
    experience: '',
    motivation: '',
    cv_url: ''
  });

  const handleApply = (course: Course) => {
    setSelectedCourse(course);
    setIsModalOpen(true);
    setSubmitted(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    setSubmitting(true);
    try {
      await api.post('/api/academy/apply', {
        ...formData,
        course_id: selectedCourse.id
      });
      setSubmitted(true);
      setFormData({ full_name: '', email: '', phone: '', education: '', experience: '', motivation: '', cv_url: '' });
    } catch (err) {
      alert(isRtl ? 'فشل إرسال الطلب' : 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesRes, settingsRes] = await Promise.all([
          api.get('/api/courses'),
          api.get('/api/settings')
        ]);
        
        const fetchedCourses = (coursesRes.data || []).map((doc: any) => ({
          ...doc,
          title: typeof doc.title === 'string' ? JSON.parse(doc.title) : doc.title,
          description: typeof doc.description === 'string' ? JSON.parse(doc.description) : doc.description,
          trainer: typeof doc.trainer === 'string' ? JSON.parse(doc.trainer) : doc.trainer
        }));
        
        let parsedCourses = fetchedCourses.filter((c: any) => c.status === 'active');
        if (parsedCourses.length === 0) {
          parsedCourses = [
            {
              id: 'c1',
              title: { ar: 'ندوة ثقافية في تعز باليوم العالمي لإنهاء الإفلات من العقاب', en: 'Cultural Seminar in Taiz on International Day to End Impunity' },
              description: { ar: 'ندوة ثقافية لمكافحة الإفلات من العقاب وحماية الصحفيين من الانتهاكات المستمرة وتعزيز الوعي القانوني بخصوصية العمل الإعلامي بالميدان.', en: 'A cultural seminar in Taiz celebrating the live International Day to End Impunity for Crimes against Journalists.' },
              trainer: { name: { ar: 'أكاديمية بيت الصحافة', en: 'Press House Academy' }, photoUrl: 'https://picsum.photos/seed/trainer-ph/200/200' },
              status: 'active',
              isLive: true,
              liveUrl: 'https://www.youtube.com/embed/zN7174CDKi4',
              announcementImage: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&q=80&w=800',
              videos: [1]
            },
            {
              id: 'c2',
              title: { ar: 'صناعة وتصميم أفلام الموشن جرافيك والمونتاج الإشهاري للصحفيين', en: 'Motion Graphics & Video Editing Mastery for Journalists' },
              description: { ar: 'الأدوات والمبادئ لإنشاء تغطيات بصرية جذابة وشروحات موشن جرافيك عالية الاحترافية والسرعة للمنصات الرقمية.', en: 'Key visual story production and video montage skills customized for quick news reporting.' },
              trainer: { name: { ar: 'م. مريم العولقي', en: 'Mariam Al-Awlaqi' }, photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200' },
              status: 'active',
              isLive: false,
              announcementImage: 'https://images.unsplash.com/photo-1551524559-8af4e6624178?auto=format&fit=crop&q=80&w=800',
              videos: [1, 2, 3]
            },
            {
              id: 'c3',
              title: { ar: 'إدارة وتنسيق الهوية الرقمية وصناعة السردية المناهضة لخطاب الكراهية', en: 'Digital Identity Management & Fighting Hate Speech Narrative' },
              description: { ar: 'آليات رصد الشائعات وإعادة تموضع السرد السلمي وبناء توازن موضوعي يعزز السلم الاجتماعي وحرية التعبير.', en: 'Practical tools to monitor rumors and reconstruct balanced dialogues to champion human rights.' },
              trainer: { name: { ar: 'د. خالد اليوسفي', en: 'Dr. Khaled Al-Yousifi' }, photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200' },
              status: 'active',
              isLive: false,
              announcementImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800',
              videos: [1, 2, 3, 4, 5]
            }
          ];
        }

        setCourses(parsedCourses);

        if (settingsRes.data && Object.keys(settingsRes.data).length > 0) {
          const s = settingsRes.data;
          setSettings({
             site: s.siteName ? typeof s.siteName === 'string' ? JSON.parse(s.siteName) : s.siteName : null,
             youtubePlaylistUrl: s.youtubePlaylistUrl || null
          });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredCourses = courses.filter(course => 
    course.title[isRtl ? 'ar' : 'en'].toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ongoingCourse = courses.find(c => c.isLive && c.liveUrl);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center overflow-hidden bg-blue-900">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://picsum.photos/seed/academy-hero/1920/1080" 
            alt="Academy Hero" 
            className="w-full h-full object-cover opacity-30"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-blue-900 via-blue-900/50 to-transparent" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-sm font-bold backdrop-blur-sm">
              <GraduationCap size={16} />
              {isRtl ? 'منصة تعليمية متخصصة' : 'Specialized Educational Platform'}
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
              {isRtl ? 'أكاديمية بيت الصحافة' : 'Press House Academy'}
            </h1>
            <p className="text-xl text-blue-100/80 leading-relaxed max-w-2xl">
              {isRtl 
                ? 'نمكن الصحفيين اليمنيين بأحدث المهارات والأدوات لمواكبة التطورات العالمية في مجال الإعلام الرقمي والصحافة الاستقصائية.' 
                : 'Empowering Yemeni journalists with the latest skills and tools to keep pace with global developments in digital media and investigative journalism.'}
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <button className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2">
                {isRtl ? 'ابدأ التعلم الآن' : 'Start Learning Now'}
                <ArrowRight size={20} className={isRtl ? 'rotate-180' : ''} />
              </button>
              <button className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-8 py-4 rounded-2xl font-bold hover:bg-white/20 transition-all">
                {isRtl ? 'تصفح المسارات' : 'Browse Tracks'}
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Live Stream Section (Happening Now) */}
      <AnimatePresence>
        {ongoingCourse && (
          <motion.section 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-rose-600 py-12 relative overflow-hidden"
          >
            <div className="container mx-auto px-4 relative z-10">
              <div className="flex flex-col lg:flex-row items-center gap-12">
                <div className="flex-1 space-y-6 text-white">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-widest">
                    <Radio size={14} className="animate-pulse" />
                    {isRtl ? 'يحدث الآن' : 'Happening Now'}
                  </div>
                  <h2 className="text-3xl md:text-5xl font-bold leading-tight">
                    {ongoingCourse.title[isRtl ? 'ar' : 'en']}
                  </h2>
                  <p className="text-rose-100 text-lg">
                    {ongoingCourse.description[isRtl ? 'ar' : 'en']}
                  </p>
                  <div className="flex flex-wrap gap-6 text-sm font-bold">
                    <div className="flex items-center gap-2"><User size={18} /> {ongoingCourse.trainer.name[isRtl ? 'ar' : 'en']}</div>
                  </div>
                </div>
                
                <div className="w-full lg:w-1/2 aspect-video bg-black rounded-[32px] overflow-hidden shadow-2xl border-4 border-white/10 relative group">
                  <iframe 
                    src={ongoingCourse.liveUrl}
                    className="w-full h-full border-0"
                    allowFullScreen
                  />
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Stats Section */}
      <section className="container mx-auto px-4 -mt-16 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { icon: <BookOpen className="text-blue-600" />, label: isRtl ? 'دورة تدريبية' : 'Training Courses', value: '50+' },
            { icon: <Users className="text-emerald-600" />, label: isRtl ? 'متدرب نشط' : 'Active Trainees', value: '2,500+' },
            { icon: <Award className="text-amber-600" />, label: isRtl ? 'شهادة معتمدة' : 'Certified Degrees', value: '1,800+' },
            { icon: <Star className="text-purple-600" />, label: isRtl ? 'تقييم المنصة' : 'Platform Rating', value: '4.9/5' },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-8 rounded-[32px] shadow-xl shadow-slate-200/50 border border-white flex items-center gap-6"
            >
              <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0">
                {stat.icon}
              </div>
              <div>
                <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
                <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Courses Grid */}
      <section className="container mx-auto px-4 py-24 space-y-12">
        {settings?.youtubePlaylistUrl && (
          <div className="mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-8">{isRtl ? 'قناتنا على يوتيوب' : 'Our YouTube Channel'}</h2>
            <div className="aspect-video w-full max-w-5xl mx-auto rounded-[32px] overflow-hidden shadow-2xl border-4 border-white">
              <iframe 
                src={settings.youtubePlaylistUrl.replace('/playlist?list=', '/embed/videoseries?list=')}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-slate-900">{isRtl ? 'استكشف الدورات' : 'Explore Courses'}</h2>
            <p className="text-slate-500 max-w-xl">
              {isRtl ? 'اختر من بين مجموعة واسعة من الدورات المتخصصة التي يقدمها خبراء في مجال الإعلام.' : 'Choose from a wide range of specialized courses offered by media experts.'}
            </p>
          </div>
          <div className="flex gap-4">
            <div className="relative">
              <input 
                type="text" 
                placeholder={isRtl ? 'بحث عن دورة...' : 'Search for a course...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-6 py-4 bg-white rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none w-64 md:w-80 transition-all shadow-sm"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-blue-600" size={48} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredCourses.map((course, i) => (
              <motion.div 
                key={course.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="group bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
              >
                <div className="aspect-[4/3] relative overflow-hidden">
                  <img 
                    src={course.announcementImage || 'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&q=80&w=800'} 
                    alt={course.title[isRtl ? 'ar' : 'en']} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-blue-600 text-[10px] font-bold uppercase tracking-wider shadow-sm">
                      {isRtl ? 'دورة تدريبية' : 'Training Course'}
                    </span>
                  </div>
                  {course.isLive && (
                    <div className="absolute top-4 right-4">
                      <span className="px-3 py-1 rounded-full bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        {isRtl ? 'مباشر' : 'LIVE'}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-blue-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-2xl transform scale-50 group-hover:scale-100 transition-transform duration-500">
                      <PlayCircle size={32} className="text-blue-600" />
                    </div>
                  </div>
                </div>
                <div className="p-8 space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1 text-amber-500 text-sm font-bold">
                      <Star size={14} fill="currentColor" />
                      4.9
                      <span className="text-slate-300 font-normal ml-1">(120+)</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
                      {course.title[isRtl ? 'ar' : 'en']}
                    </h3>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 border border-slate-200">
                        {course.trainer.photoUrl ? (
                          <img 
                            src={course.trainer.photoUrl} 
                            alt={course.trainer.name[isRtl ? 'ar' : 'en']}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <User size={14} />
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-slate-400 font-medium">
                        {isRtl ? 'بواسطة' : 'By'} {course.trainer.name[isRtl ? 'ar' : 'en']}
                      </p>
                    </div>
                  </div>
                  
                  <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                      <span className="flex items-center gap-1"><Clock size={14} /> {isRtl ? 'قريباً' : 'Soon'}</span>
                      <span className="flex items-center gap-1">
                        <BookOpen size={14} /> 
                        {course.videos?.length || 0} {isRtl ? 'دروس' : 'Lessons'}
                      </span>
                    </div>
                    <button 
                      onClick={() => handleApply(course)}
                      className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-all"
                    >
                      <ArrowRight size={18} className={isRtl ? 'rotate-180' : ''} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div className="flex justify-center pt-12">
          <button className="px-12 py-4 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all">
            {isRtl ? 'عرض جميع الدورات' : 'View All Courses'}
          </button>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 pb-24">
        <div className="bg-slate-900 rounded-[48px] p-12 md:p-24 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-600 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2" />
          </div>
          
          <div className="relative z-10 max-w-3xl mx-auto space-y-8">
            <h2 className="text-4xl md:text-6xl font-bold text-white leading-tight">
              {isRtl ? 'هل أنت مستعد لتطوير مسيرتك المهنية؟' : 'Ready to Advance Your Career?'}
            </h2>
            <p className="text-xl text-slate-400">
              {isRtl 
                ? 'انضم إلى آلاف الصحفيين الذين طوروا مهاراتهم عبر أكاديميتنا. سجل الآن وابدأ رحلتك التعليمية.' 
                : 'Join thousands of journalists who have developed their skills through our academy. Register now and start your learning journey.'}
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <button className="bg-blue-600 text-white px-12 py-5 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-900/40">
                {isRtl ? 'سجل مجاناً' : 'Register for Free'}
              </button>
              <button className="bg-white text-slate-900 px-12 py-5 rounded-2xl font-bold hover:bg-slate-100 transition-all">
                {isRtl ? 'تواصل معنا' : 'Contact Us'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Application Modal */}
      <AnimatePresence>
        {isModalOpen && selectedCourse && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden"
              dir={isRtl ? 'rtl' : 'ltr'}
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 left-6 z-10 p-2 text-slate-400 hover:text-slate-900 bg-slate-100 rounded-full transition-all"
              >
                <X size={20} />
              </button>

              <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
                <div className="md:w-1/3 bg-blue-600 p-8 text-white space-y-6 hidden md:block">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                    <GraduationCap size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{isRtl ? 'تقديم طلب' : 'Apply Now'}</h3>
                    <p className="text-blue-100 text-sm mt-2">{selectedCourse.title[isRtl ? 'ar' : 'en']}</p>
                  </div>
                  <div className="space-y-4 pt-8 text-xs text-blue-100/60">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 size={16} />
                      {isRtl ? 'مراجعة دقيقة لكل طلب' : 'Careful review of each app'}
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 size={16} />
                      {isRtl ? 'شهادات معتمدة' : 'Certified certificates'}
                    </div>
                  </div>
                </div>

                <div className="flex-1 p-8 overflow-y-auto">
                  {submitted ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
                      <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <CheckCircle2 size={40} />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900">{isRtl ? 'تم إرسال طلبك بنجاح!' : 'Application Sent!'}</h3>
                      <p className="text-slate-500">
                        {isRtl 
                          ? 'شكراً لاهتمامك. سيقوم فريق الأكاديمية بمراجعة طلبك والتواصل معك قريباً عبر البريد الإلكتروني.' 
                          : 'Thank you for your interest. Our academy team will review your application and contact you soon via email.'}
                      </p>
                      <button 
                        onClick={() => setIsModalOpen(false)}
                        className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold mt-4"
                      >
                        {isRtl ? 'إغلاق' : 'Close'}
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <header>
                        <h2 className="text-2xl font-bold text-slate-900">{isRtl ? 'استمارة التقديم' : 'Application Form'}</h2>
                        <p className="text-slate-500 text-sm">{isRtl ? 'يرجى ملء البيانات التالية بدقة' : 'Please fill in the following details accurately'}</p>
                      </header>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <User size={14} /> {isRtl ? 'الاسم الكامل' : 'Full Name'}
                          </label>
                          <input 
                            required
                            type="text"
                            value={formData.full_name}
                            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                              <Mail size={14} /> {isRtl ? 'البريد الإلكتروني' : 'Email'}
                            </label>
                            <input 
                              required
                              type="email"
                              value={formData.email}
                              onChange={(e) => setFormData({...formData, email: e.target.value})}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                              <Phone size={14} /> {isRtl ? 'رقم الهاتف' : 'Phone'}
                            </label>
                            <input 
                              required
                              type="tel"
                              value={formData.phone}
                              onChange={(e) => setFormData({...formData, phone: e.target.value})}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <FileText size={14} /> {isRtl ? 'التعليم والخبرة' : 'Education & Experience'}
                          </label>
                          <textarea 
                            required
                            rows={3}
                            value={formData.experience}
                            onChange={(e) => setFormData({...formData, experience: e.target.value})}
                            placeholder={isRtl ? 'اذكر نبذة عن خلفيتك التعليمية والمهنية' : 'Briefly describe your educational and professional background'}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-600 outline-none transition-all resize-none"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Send size={14} /> {isRtl ? 'لماذا تريد الانضمام؟' : 'Why do you want to join?'}
                          </label>
                          <textarea 
                            required
                            rows={3}
                            value={formData.motivation}
                            onChange={(e) => setFormData({...formData, motivation: e.target.value})}
                            placeholder={isRtl ? 'ما الذي تأمل تحقيقه من هذه الدورة؟' : 'What do you hope to achieve from this course?'}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-600 outline-none transition-all resize-none"
                          />
                        </div>
                      </div>

                      <button 
                        disabled={submitting}
                        className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
                      >
                        {submitting ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                        {isRtl ? 'إرسال الطلب' : 'Submit Application'}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
