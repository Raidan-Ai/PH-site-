import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  Target, Eye, Users, Award, Handshake, 
  MessageSquare, Rocket, Shield, PenTool, 
  TrendingUp, Search, CheckCircle2, Globe
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function About() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [content, setContent] = React.useState<any[]>([]);
  const [boardMembers, setBoardMembers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchContent = async () => {
      try {
        const [response, boardResponse] = await Promise.all([
          fetch('/api/page-content/about'),
          fetch('/api/board-members')
        ]);
        
        if (response.ok) {
          const data = await response.json();
          setContent(data.map((s: any) => ({
            ...s,
            content: typeof s.content === 'string' ? JSON.parse(s.content) : s.content
          })));
        }
        
        if (boardResponse.ok) {
          const bData = await boardResponse.json();
          setBoardMembers(bData);
        }
      } catch (err) {
        console.error("Error fetching about page content:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, []);

  const getSection = (name: string) => content.find(s => s.section_name === name)?.content;

  const hero = getSection('introduction') || {
    title: { ar: 'صحافة من أجل الإنسان أولاً', en: 'Journalism for Humanity First' },
    text: { ar: 'مؤسسة مجتمع مدني تهدف إلى تعزيز حرية الإعلام وخلق مساحة نقاش مهني وعملي للصحفيين، وتبني قضاياهم والعمل على تطوير ودعم الصحافة في اليمن.', en: 'A civil society organization aiming to promote media freedom and create a professional discussion space for journalists, adopting their causes and supporting journalism in Yemen.' },
    image: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=800'
  };

  const vision = getSection('vision') || {
    title: { ar: 'رؤيتنا', en: 'Our Vision' },
    text: { ar: 'صحافة مهنية حرة أولويتها الإنسان.', en: 'Free professional journalism that prioritizes humanity.' }
  };

  const mission = getSection('mission') || {
    title: { ar: 'رسالتنا', en: 'Our Mission' },
    text: { ar: 'أن تصبح بيت الصحافة المؤسسة الأولى في تعزيز حرية الصحافة وحمل مطالبها والدفاع عن استحقاقاتها.', en: 'To become the leading institution in promoting press freedom and defending its entitlements.' }
  };

  const goalsSection = getSection('goals') || {
    title: { ar: 'أهدافنا الاستراتيجية', en: 'Strategic Goals' },
    items: [
      {
        icon: 'MessageSquare',
        title: { ar: 'مساحات نقاش', en: 'Discussion Spaces' },
        desc: { ar: 'إيجاد مساحات نقاش عملية ومهنية للصحفيات والصحفيين.', en: 'Creating practical and professional discussion spaces for journalists.' },
        color: 'text-blue-600',
        bg: 'bg-blue-50'
      },
      {
        icon: 'Rocket',
        title: { ar: 'حاضنة أعمال', en: 'Business Incubator' },
        desc: { ar: 'توفير حاضنة أعمال صحفية توفر للصحفيات والصحفيين مساحات عمل مجانية.', en: 'Providing a journalistic business incubator that provides free workspaces for journalists.' },
        color: 'text-purple-600',
        bg: 'bg-purple-50'
      },
      {
        icon: 'Shield',
        title: { ar: 'الدفاع عن الحرية', en: 'Defending Freedom' },
        desc: { ar: 'الدفاع عن حرية الصحافة والسعي لتطوير العمل الصحفي ودعمه.', en: 'Defending press freedom and seeking to develop and support journalistic work.' },
        color: 'text-emerald-600',
        bg: 'bg-emerald-50'
      },
      {
        icon: 'PenTool',
        title: { ar: 'صحافة مهنية', en: 'Professional Journalism' },
        desc: { ar: 'تقديم صحافة مهنية متطورة تخدم الإنسان أولاً وأخيراً.', en: 'Providing advanced professional journalism that serves humanity first and foremost.' },
        color: 'text-amber-600',
        bg: 'bg-amber-50'
      },
      {
        icon: 'TrendingUp',
        title: { ar: 'الارتقاء بالقدرات', en: 'Capacity Building' },
        desc: { ar: 'الارتقاء بقدرات الصحفيات والصحفيين في مختلف المجالات الصحفية.', en: 'Enhancing the capacities of journalists in various journalistic fields.' },
        color: 'text-rose-600',
        bg: 'bg-rose-50'
      },
      {
        icon: 'Search',
        title: { ar: 'رصد الانتهاكات', en: 'Monitoring Violations' },
        desc: { ar: 'المساهمة في رصد الانتهاكات ضد الصحفيات والصحفيين في اليمن ومناصرة قضاياهم.', en: 'Contributing to monitoring violations against journalists in Yemen and advocating for their causes.' },
        color: 'text-indigo-600',
        bg: 'bg-indigo-50'
      }
    ]
  };

  const renderIcon = (name: string) => {
    switch (name) {
      case 'MessageSquare': return <MessageSquare size={32} />;
      case 'Rocket': return <Rocket size={32} />;
      case 'Shield': return <Shield size={32} />;
      case 'PenTool': return <PenTool size={32} />;
      case 'TrendingUp': return <TrendingUp size={32} />;
      case 'Search': return <Search size={32} />;
      case 'Users': return <Users size={32} />;
      case 'Target': return <Target size={32} />;
      case 'Award': return <Award size={32} />;
      default: return <CheckCircle2 size={32} />;
    }
  };

  return (
    <div className="space-y-32 pb-32 overflow-hidden">
      {/* Hero Section - Editorial Style */}
      <section className="relative min-h-[80vh] flex items-center bg-slate-900 pt-20">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] animate-pulse delay-1000" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
        </div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 text-center lg:text-start">
              <motion.div
                initial={{ opacity: 0, x: isRtl ? 50 : -50 }}
                animate={{ opacity: 1, x: 0 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-widest"
              >
                <Globe size={14} />
                {isRtl ? 'مؤسسة بيت الصحافة - اليمن' : 'Press House Foundation - Yemen'}
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-5xl md:text-7xl font-black text-white leading-[1.1] tracking-tight"
              >
                {isRtl ? hero.title.ar : hero.title.en}
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-slate-400 text-lg md:text-xl leading-relaxed max-w-2xl"
              >
                {isRtl ? hero.text.ar : hero.text.en}
              </motion.p>
            </div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="relative hidden lg:block"
            >
              <div className="relative z-10 rounded-[40px] overflow-hidden border-8 border-white/5 shadow-2xl">
                <img 
                  src={hero.image} 
                  alt="Press House" 
                  className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                />
              </div>
              <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-blue-600 rounded-[40px] -z-10 rotate-12" />
              <div className="absolute -top-10 -left-10 w-48 h-48 bg-purple-600 rounded-full -z-10 blur-2xl opacity-50" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Vision & Mission - Bento Style */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="md:col-span-7 bg-slate-900 p-12 rounded-[48px] text-white relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700">
              <Eye size={200} />
            </div>
            <div className="relative z-10 space-y-6">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/50">
                <Eye size={32} />
              </div>
              <h2 className="text-4xl font-black">{isRtl ? vision.title.ar : vision.title.en}</h2>
              <p className="text-xl text-slate-400 leading-relaxed max-w-md">
                {isRtl ? vision.text.ar : vision.text.en}
              </p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="md:col-span-5 bg-blue-600 p-12 rounded-[48px] text-white relative overflow-hidden group"
          >
            <div className="absolute bottom-0 left-0 p-8 opacity-20 group-hover:rotate-12 transition-transform duration-700">
              <Target size={150} />
            </div>
            <div className="relative z-10 space-y-6">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                <Target size={32} />
              </div>
              <h2 className="text-4xl font-black">{isRtl ? mission.title.ar : mission.title.en}</h2>
              <p className="text-lg text-blue-100 leading-relaxed">
                {isRtl ? mission.text.ar : mission.text.en}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Goals - Interactive Grid */}
      <section className="bg-slate-50 py-32">
        <div className="max-w-7xl mx-auto px-4 space-y-20">
          <div className="text-center space-y-4">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-black text-slate-900"
            >
              {isRtl ? goalsSection.title.ar : goalsSection.title.en}
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {goalsSection.items.map((goal: any, i: number) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -10 }}
                className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 group"
              >
                <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-8 transition-transform group-hover:scale-110 group-hover:rotate-6", goal.bg, goal.color)}>
                  {renderIcon(goal.icon)}
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-blue-600 transition-colors">{isRtl ? goal.title.ar : goal.title.en}</h3>
                <p className="text-slate-500 leading-relaxed">{isRtl ? goal.desc.ar : goal.desc.en}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section - Modern Cards */}
      <section className="max-w-7xl mx-auto px-4 space-y-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <span className="text-blue-600 font-black text-xs uppercase tracking-[0.3em]">{isRtl ? 'العقول المبدعة' : 'Creative Minds'}</span>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900">{isRtl ? 'فريق بيت الصحافة' : 'Press House Team'}</h2>
          </div>
          <p className="text-slate-500 max-w-md font-medium">
            {isRtl ? 'نخبة من الكوادر المهنية المتخصصة في مجالات الإعلام والحقوق، يعملون بشغف من أجل الحقيقة.' : 'A group of professional cadres specialized in media and rights, working with passion for the truth.'}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {(() => {
            const defaultLeadership = [
              { name: isRtl ? 'محمد الحريبي' : 'Mohammed Al-Huraibi', role: isRtl ? 'رئيس المؤسسة' : 'President' },
              { name: isRtl ? 'مازن فارس' : 'Mazen Fares', role: isRtl ? 'المدير التنفيذي' : 'Executive Director' },
              { name: isRtl ? 'الفتح العيسائي' : 'Al-Fath Al-Isai', role: isRtl ? 'مدير البرامج' : 'Programs Director' },
              { name: isRtl ? 'مكين العوجري' : 'Makeen Al-Awjari', role: isRtl ? 'مدير وحدة المالية' : 'Finance Unit Manager' },
              { name: isRtl ? 'رانيا عبدالله' : 'Rania Abdullah', role: isRtl ? 'وحدة العمليات' : 'Operations Unit' },
              { name: isRtl ? 'أبرار مصطفى' : 'Abrar Mustafa', role: isRtl ? 'العلاقات العامة' : 'Public Relations' },
              { name: isRtl ? 'أحمد منعم' : 'Ahmed Monem', role: isRtl ? 'إدارة الإعلام' : 'Media Management' },
              { name: isRtl ? 'محمد الصلاحي' : 'Mohammed Al-Salahi', role: isRtl ? 'مدير وحدة الرصد' : 'Monitoring Unit Manager' },
              { name: isRtl ? 'إيهاب العبسي' : 'Ihab Al-Absi', role: isRtl ? 'متابعة وتقييم' : 'M&E' },
              { name: isRtl ? 'نعمة البرحي' : 'Neama Al-Barhi', role: isRtl ? 'الموارد البشرية' : 'Human Resources' },
            ];

            const dbLeadership = boardMembers.filter(m => !m.category || m.category === 'leadership').map(m => ({
              name: m.full_name,
              role: m.position,
              image: m.photo_url || `https://i.pravatar.cc/400?u=${m.id}`
            }));

            const leadershipToShow = dbLeadership.length > 0 ? dbLeadership : defaultLeadership.map(m => ({
              name: m.name,
              role: m.role,
              image: `https://i.pravatar.cc/400?u=${m.name}`
            }));

            return leadershipToShow.map((member, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -10 }}
                className="group text-start"
              >
                <div className="relative aspect-[4/5] rounded-[32px] overflow-hidden mb-4 bg-slate-100 border border-slate-200">
                  <img 
                    src={member.image} 
                    alt={member.name} 
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 scale-110 group-hover:scale-100" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">{member.name}</h3>
                <p className="text-xs text-blue-600 font-black uppercase tracking-widest mt-1">{member.role}</p>
              </motion.div>
            ));
          })()}
        </div>
      </section>

      {/* Advisory Board - Clean List */}
      <section className="bg-slate-900 py-32 text-white">
        <div className="max-w-7xl mx-auto px-4 space-y-20">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-black">{isRtl ? 'الهيئة الاستشارية' : 'Advisory Board'}</h2>
            <div className="w-24 h-1 bg-blue-600 mx-auto rounded-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {(() => {
              const defaultAdvisory = [
                { name: isRtl ? 'أ. زكريا الكمالي' : 'Zakaria Al-Kamali', image: 'https://i.pravatar.cc/150?u=zakaria' },
                { name: isRtl ? 'د. منصور القدسي' : 'Dr. Mansour Al-Qudsi', image: 'https://i.pravatar.cc/150?u=mansour' },
                { name: isRtl ? 'أ. وداد البدوي' : 'Widad Al-Badawi', image: 'https://i.pravatar.cc/150?u=widad' },
                { name: isRtl ? 'أ. سعيد الصوفي' : 'Saeed Al-Sufi', image: 'https://i.pravatar.cc/150?u=saeed' },
                { name: isRtl ? 'أ. بسام غبر' : 'Bassam Ghabar', image: 'https://i.pravatar.cc/150?u=bassam' },
              ];

              const dbAdvisory = boardMembers.filter(m => m.category === 'advisory').map(m => ({
                name: m.full_name,
                image: m.photo_url || `https://i.pravatar.cc/150?u=${m.id}`
              }));

              const advisoryToShow = dbAdvisory.length > 0 ? dbAdvisory : defaultAdvisory;

              return advisoryToShow.map((member, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="bg-white/5 backdrop-blur-sm p-8 rounded-3xl border border-white/10 text-center hover:bg-white/10 transition-colors group"
                >
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full overflow-hidden border-4 border-white/10 group-hover:border-blue-500/50 transition-colors">
                    <img src={member.image} alt={member.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" referrerPolicy="no-referrer" />
                  </div>
                  <h3 className="font-bold text-white text-base leading-tight">{member.name}</h3>
                </motion.div>
              ));
            })()}
          </div>
        </div>
      </section>

      {/* Partners - Marquee Style */}
      <section className="max-w-7xl mx-auto px-4 space-y-20">
        <div className="text-center space-y-4">
          <span className="text-blue-600 font-black text-xs uppercase tracking-[0.3em]">{isRtl ? 'شبكة التعاون' : 'Collaboration Network'}</span>
          <h2 className="text-4xl font-black text-slate-900">{isRtl ? 'شركاؤنا في النجاح' : 'Our Partners'}</h2>
        </div>
        
        <div className="flex flex-wrap justify-center gap-8">
          {[
            { name: 'مؤسسة أرنيادا للتنمية الثقافية', logo: 'https://ui-avatars.com/api/?name=Arniada&background=e2e8f0&color=1e293b&size=100' },
            { name: 'مؤسسة قرار للإعلام والتنمية', logo: 'https://ui-avatars.com/api/?name=Qarar&background=e2e8f0&color=1e293b&size=100' },
            { name: 'منصة يوب يوب', logo: 'https://ui-avatars.com/api/?name=YopYop&background=e2e8f0&color=1e293b&size=100' },
            { name: 'مؤسسة ألف لدعم وحماية التعليم', logo: 'https://ui-avatars.com/api/?name=Alef&background=e2e8f0&color=1e293b&size=100' },
            { name: 'تكتل وهج الشبابي', logo: 'https://ui-avatars.com/api/?name=Wahaj&background=e2e8f0&color=1e293b&size=100' }
          ].map((partner, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col items-center gap-4 bg-white px-8 py-8 rounded-[32px] border border-slate-100 hover:border-blue-200 hover:shadow-xl transition-all grayscale hover:grayscale-0 group w-48 text-center"
            >
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-50 flex items-center justify-center p-2 group-hover:scale-110 transition-transform">
                <img src={partner.logo} alt={partner.name} className="w-full h-full object-contain" />
              </div>
              <span className="font-bold text-slate-700 text-sm leading-tight">{partner.name}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-7xl mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[64px] p-16 md:p-24 text-center text-white relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="relative z-10 space-y-10">
            <Handshake className="mx-auto text-white/40 animate-bounce" size={64} />
            <h2 className="text-4xl md:text-6xl font-black leading-tight">
              {isRtl ? 'انضم إلينا في رحلة' : 'Join us in the journey'} <br />
              {isRtl ? 'تمكين الكلمة الحرة' : 'of empowering the free word'}
            </h2>
            <div className="flex flex-wrap justify-center gap-6">
              <Link to="/projects" className="px-12 py-5 bg-white text-blue-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-50 transition-colors shadow-xl inline-block">
                {isRtl ? 'شاهد مشاريعنا' : 'View Our Projects'}
              </Link>
              <Link to="/contact" className="px-12 py-5 bg-transparent border-2 border-white/30 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white/10 transition-colors inline-block">
                {isRtl ? 'تواصل معنا' : 'Contact Us'}
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
