import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Book, 
  Shield, 
  LifeBuoy, 
  Edit, 
  Layers, 
  Users, 
  HelpCircle,
  FileSignature,
  FileText,
  Mail,
  Sliders,
  Award
} from 'lucide-react';
import { motion } from 'motion/react';

export const SystemDocs: React.FC = () => {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const helpSections = [
    {
      title: isRtl ? 'إدارة الأخبار والتقارير الإعلامية' : 'News & Investigations Control',
      description: isRtl 
        ? 'يتيح لك قسم الأخبار كتابة وتحرير التقارير الصحفية الاستقصائية مع ميزات الترجمة الفورية والذكاء الاصطناعي، ودعم تحسين محركات البحث SEO.'
        : 'Allows publishing core news stories and investigative reports with on-the-fly automated translations and SEO metadata.',
      icon: <Edit className="text-blue-600" size={24} />
    },
    {
      title: isRtl ? 'إدارة القوائم والروابط النشطة' : 'Menus & Navigation Control',
      description: isRtl 
        ? 'يمكنك من خلال لوحة إدارة القوائم تخصيص الروابط والأيقونات التفاعلية المعروضة في الشريط السفلي الذكي (Dock) أو تذييل الصفحة (Footer) باختيار مباشر من القوائم.'
        : 'Customize navigation items, relative paths, and descriptive icons displayed in the bottom smart dock or page footer.',
      icon: <Layers className="text-emerald-600" size={24} />
    },
    {
      title: isRtl ? 'رصد الانتهاكات والحريات الصحفية' : 'Liberties & Violations Logging',
      description: isRtl 
        ? 'يحتوي النظام على أداة متخصصة لرصد وتوثيق حالات الانتهاكات التي يتعرض لها الصحفيون في اليمن، مع خيارات إدخال البيانات الجغرافية والنوعية.'
        : 'In-depth analytical log tracking and cataloging violations against journalists in Yemen with geographic breakdowns.',
      icon: <FileSignature className="text-red-500" size={24} />
    },
    {
      title: isRtl ? 'أكاديمية التدريب وبناء القدرات' : 'Training Academy & Courses',
      description: isRtl 
        ? 'إدارة متكاملة للدورات التدريبية المخصصة للمؤسسة، تتيح نشر الفرص، وتحديث الاستمارات، مع فرز تلقائي لطلبات التسجيل المقدمة بالمنصة.'
        : 'Publish training opportunities, workshop calendars, and streamline registration applications submitted by visitors.',
      icon: <Award className="text-amber-500" size={24} />
    },
    {
      title: isRtl ? 'إدارة شؤون الموظفين ومجلس الإدارة' : 'HR & Governance Control',
      description: isRtl 
        ? 'يمكنك رصد الهيكل الوظيفي لبيت الصحافة وإدارة السير الذاتية لأعضاء مجلس الإدارة ومجلس الأمناء، مع خيارات الرفع الحي لصورهم الشخصية.'
        : 'Manage your organizational chart, update official board profiles, and upload high-resolution headshots instantly.',
      icon: <Users className="text-indigo-600" size={24} />
    },
    {
      title: isRtl ? 'إدارة النشرات الإخبارية المتطورة' : 'Newsletter Broadcast Campaigns',
      description: isRtl 
        ? 'يتيح لك قسم النشرة البريدية إرسال تحديثات فورية للمشتركين وصناعة الرسائل المتكاملة مع ميزة المعاينة التفاعلية لإيميلات الهواتف.'
        : 'Create and dispatch highly engaging responsive email updates with live inbox view simulation to your subscribers directory.',
      icon: <Mail className="text-purple-600" size={24} />
    }
  ];

  return (
    <div className="space-y-8 text-start" dir={isRtl ? 'rtl' : 'ltr'}>
        {/* Header Hero Banner */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[32px] p-8 md:p-12 text-white shadow-xl relative overflow-hidden ring-1 ring-white/5">
          <div className="relative z-10 max-w-3xl space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-blue-200">
              <LifeBuoy size={12} />
              {isRtl ? 'دليل المستخدم الرسمي' : 'Official Helpdesk'}
            </span>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
              {isRtl ? 'دليل إدارة منصة بيت الصحافة' : 'Press House CMS Management Guide'}
            </h1>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed font-medium">
              {isRtl 
                ? 'أهلاً بك في نظام إدارة المحتوى الإعلامي لبيت الصحافة - اليمن. تم تصميم هذه اللوحة لتمكينكم من الإدارة الكاملة للهوية الرقمية للمؤسسة، ورصد الانتهاكات، ونشر التقارير الاستقصائية وتحديث هياكل التنقل والروابط بكل سلاسة وسرعة.'
                : 'Welcome to the Press House Yemen Media CMS. This portal provides comprehensive control over your brand, media outputs, human rights tracker, training courses, development projects, and custom navigations.'}
            </p>
          </div>
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-slate-500/15 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl pointer-events-none" />
        </div>

        {/* Documentation Items Grid */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 px-1 flex items-center gap-2">
            <Book size={20} className="text-blue-600" />
            {isRtl ? 'مكونات النظام ولوحات التحكم' : 'Core CMS Control Panels Overview'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {helpSections.map((section, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-inner">
                    {section.icon}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-slate-900 text-base">{section.title}</h3>
                    <p className="text-slate-500 text-xs leading-relaxed font-medium">{section.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Support Section */}
        <div className="bg-blue-50 border border-blue-200/60 rounded-[32px] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-wider">
              {isRtl ? 'الدعم والمساعدة والمقترحات' : 'Extended Support'}
            </div>
            <h2 className="text-2xl font-black text-slate-900">{isRtl ? 'هل تحتاج إلى استشارة أو دعم فني إضافي؟' : 'Need Premium Technical Assistance?'}</h2>
            <p className="text-slate-600 text-sm font-medium leading-relaxed">
              {isRtl 
                ? 'فريق التطوير والتحول الرقمي لبيت الصحافة (RaidanPro) متواجد دائماً لتقديم الدعم أو إدراج تعديلات برمجية مخصصة لخدمة أهداف رسالتكم الإعلامية وحماية الصحفيين.'
                : 'Our development helpdesk is ready to coordinate custom extensions, database back-ups, or integrate additional visual templates to boost your operations.'}
            </p>
          </div>
          <a 
            href="mailto:support@ph-ye.org" 
            className="w-full md:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-sm text-center transition-all shadow-xl hover:shadow-slate-200 block"
          >
            {isRtl ? 'تواصل مع الدعم الفني المباشر' : 'Contact Support Desk'}
          </a>
        </div>
    </div>
  );
};
