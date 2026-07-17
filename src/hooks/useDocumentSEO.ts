import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface SEOConfig {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  type?: string;
}

export function useDocumentSEO(config?: SEOConfig) {
  const location = useLocation();
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  useEffect(() => {
    // Generate page-specific metadata based on current pathname as a fallback
    const path = location.pathname;
    let fallbackTitle = isRtl ? 'بيت الصحافة - اليمن' : 'Press House - Yemen';
    let fallbackDesc = isRtl 
      ? 'مؤسسة إعلامية متخصصة تهدف إلى تعزيز حرية الإعلام وحماية الصحفيين ونشر ثقافة حقوق الإنسان.' 
      : 'Specialized media organization aiming to promote press freedom, protect journalists and spread human rights.';
    let fallbackKeywords = isRtl 
      ? 'اليمن, الصحافة, حرية الإعلام, رصد الانتهاكات, حقوق الإنسان' 
      : 'Yemen, Press House, Press Freedom, Media Violations, Human Rights';

    if (path.includes('/news')) {
      fallbackTitle = isRtl ? 'الأخبار والتقارير | بيت الصحافة' : 'News & Reports | Press House';
    } else if (path.includes('/violations')) {
      fallbackTitle = isRtl ? 'مرصد الانتهاكات | بيت الصحافة' : 'Violations Observatory | Press House';
    } else if (path.includes('/academy')) {
      fallbackTitle = isRtl ? 'الأكاديمية | بيت الصحافة' : 'Academy | Press House';
    } else if (path.includes('/about')) {
      fallbackTitle = isRtl ? 'من نحن | بيت الصحافة' : 'About Us | Press House';
    } else if (path.includes('/events')) {
      fallbackTitle = isRtl ? 'الفعاليات والندوات | بيت الصحافة' : 'Events & Seminars | Press House';
    } else if (path.includes('/projects')) {
      fallbackTitle = isRtl ? 'المشاريع | بيت الصحافة' : 'Projects | Press House';
    } else if (path.includes('/jobs')) {
      fallbackTitle = isRtl ? 'فرص العمل والتوظيف | بيت الصحافة' : 'Jobs & Careers | Press House';
    } else if (path.includes('/tenders')) {
      fallbackTitle = isRtl ? 'المناقصات | بيت الصحافة' : 'Tenders | Press House';
    }

    const title = config?.title || fallbackTitle;
    const description = config?.description || fallbackDesc;
    const keywords = config?.keywords || fallbackKeywords;
    const image = config?.image || '/logo.png';
    const type = config?.type || 'website';

    // Update standard DOM elements
    document.title = title;

    // Helper to set or create meta tag
    const setMetaTag = (attrName: string, attrVal: string, contentVal: string, isProperty = false) => {
      let element = document.querySelector(`meta[${isProperty ? 'property' : 'name'}="${attrVal}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(isProperty ? 'property' : 'name', attrVal);
        document.head.appendChild(element);
      }
      element.setAttribute('content', contentVal);
    };

    setMetaTag('name', 'description', description);
    setMetaTag('name', 'keywords', keywords);
    
    // Facebook Graph
    setMetaTag('property', 'og:title', title, true);
    setMetaTag('property', 'og:description', description, true);
    setMetaTag('property', 'og:image', image, true);
    setMetaTag('property', 'og:type', type, true);
    setMetaTag('property', 'og:url', window.location.href, true);

    // Twitter
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', image);
    setMetaTag('name', 'twitter:card', 'summary_large_image');

  }, [location.pathname, config?.title, config?.description, config?.keywords, config?.image, config?.type, isRtl]);
}
