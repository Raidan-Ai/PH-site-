import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: {
          "nav": {
            "home": "Home",
            "about": "About Us",
            "news": "News",
            "violations": "Violations",
            "jobs": "Jobs",
            "tenders": "Tenders",
            "academy": "Academy",
            "forum": "Forum",
            "contact": "Contact",
            "admin": "Admin",
            "terms": "Terms of Service",
            "privacy": "Privacy Policy",
            "workplace": "Workplace Policy"
          },
          "home": {
            "latest_news": "Latest News",
            "projects": "Our Projects",
            "stats": "Key Statistics"
          },
          "violations": {
            "report": "Report a Violation",
            "map": "Violation Map",
            "stats": "Statistics"
          },
          "jobs": {
            "apply": "Apply Now",
            "form_title": "Job Application",
            "full_name": "Full Name",
            "email": "Email Address",
            "phone": "Phone Number",
            "cv": "Upload CV",
            "cover_letter": "Cover Letter",
            "submit": "Submit Application",
            "success": "Application Received!",
            "success_msg": "Thank you for your interest. We have received your application and will review it soon.",
            "close": "Close",
            "view_details": "View Details"
          }
        }
      },
      ar: {
        translation: {
          "nav": {
            "home": "الرئيسية",
            "about": "من نحن",
            "news": "الأخبار",
            "violations": "مركز الانتهاكات",
            "jobs": "الوظائف",
            "tenders": "المناقصات",
            "academy": "الأكاديمية",
            "forum": "المنتدى",
            "contact": "اتصل بنا",
            "admin": "لوحة التحكم",
            "terms": "شروط الخدمة",
            "privacy": "سياسة الخصوصية",
            "workplace": "سياسة العمل"
          },
          "home": {
            "latest_news": "أحدث الأخبار",
            "projects": "مشاريعنا",
            "stats": "إحصائيات رئيسية"
          },
          "violations": {
            "report": "إبلاغ عن انتهاك",
            "map": "خريطة الانتهاكات",
            "stats": "الإحصائيات"
          },
          "jobs": {
            "apply": "قدم الآن",
            "form_title": "طلب توظيف",
            "full_name": "الاسم الكامل",
            "email": "البريد الإلكتروني",
            "phone": "رقم الهاتف",
            "cv": "رفع السيرة الذاتية",
            "cover_letter": "رسالة التغطية",
            "submit": "إرسال الطلب",
            "success": "تم استلام طلبك!",
            "success_msg": "شكراً لاهتمامك. لقد استلمنا طلبك وسنقوم بمراجعته قريباً.",
            "close": "إغلاق",
            "view_details": "عرض التفاصيل"
          }
        }
      }
    },
    fallbackLng: 'ar',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
