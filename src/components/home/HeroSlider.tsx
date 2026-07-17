import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Navigation, Pagination } from 'swiper/modules';
import { ArrowRight, Sparkles, Zap, ShieldAlert, Newspaper, Globe2, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { HeroSlide, SiteSettings } from '../../types';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export const HeroSlider: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSlidesAndSettings = async () => {
      try {
        const [slidesRes, dynamicRes, settingsRes] = await Promise.all([
          api.get('/api/heroSlides'),
          api.get('/api/dynamic-hero-slides'),
          api.get('/api/settings')
        ]);

        const fetchedSlides = Array.isArray(slidesRes?.data) 
          ? slidesRes.data
            .map((s: any) => ({
              ...s,
              title: typeof s.title === 'string' ? JSON.parse(s.title) : s.title,
              subtitle: typeof s.subtitle === 'string' ? JSON.parse(s.subtitle) : s.subtitle,
              description: typeof s.description === 'string' ? JSON.parse(s.description) : s.description,
              primaryButton: typeof s.primaryButton === 'string' ? JSON.parse(s.primaryButton) : s.primaryButton,
              secondaryButton: typeof s.secondaryButton === 'string' ? JSON.parse(s.secondaryButton) : s.secondaryButton,
            }))
            .filter((s: HeroSlide) => s.isActive)
          : [];
        
        // Map dynamic content to HeroSlide structure
        const dynamicSlides = Array.isArray(dynamicRes?.data)
          ? dynamicRes.data.map((d: any) => {
              const title = typeof d.title === 'string' ? JSON.parse(d.title) : d.title;
              const caption = typeof d.slider_caption === 'string' ? JSON.parse(d.slider_caption) : (d.slider_caption || title);
              const btnText = typeof d.slider_button_text === 'string' ? JSON.parse(d.slider_button_text) : (d.slider_button_text || {ar: 'اقرأ المزيد', en: 'Read More'});
              
              const type = d.entityType || d.type;
              
              let link = '/';
              if (type === 'article' || type === 'news') link = `/news/${d.id}`;
              else if (type === 'project') link = `/projects/${d.id}`;
              else if (type === 'course') link = `/academy/courses/${d.id}`;
              else if (type === 'event') link = `/events/${d.id}`;
              else if (type === 'movie' || type === 'cinema') link = `/cinema/${d.id}`;

              return {
                id: `dynamic-${type}-${d.id}`,
                entityType: type,
                title: caption,
                subtitle: { ar: type === 'article' ? 'خبر جديد' : type === 'project' ? 'مشروع متميز' : type === 'course' ? 'دورة قادمة' : type === 'event' ? 'فعالية قادمة' : type === 'movie' ? 'فلم الأسبوع القادم' : 'تحديث جديد', en: (type || '').toUpperCase() },
                description: { ar: d.excerpt?.ar || '', en: d.excerpt?.en || '' },
                mediaType: 'image',
                mediaUrl: d.slider_image || d.mainImage || d.image || d.announcementImage || d.imageUrl,
                animationType: 'fade',
                primaryButton: { text: btnText, link, icon: 'ArrowRight' },
                order: 0,
                isActive: true,
                createdAt: d.createdAt
              };
            })
          : [];

        const mergedSlides = [...dynamicSlides, ...fetchedSlides]
          .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
          
        setSlides(mergedSlides);

        if (settingsRes.data && Object.keys(settingsRes.data).length > 0) {
          const s = settingsRes.data;
          setSettings({
            ...s,
            siteName: typeof s.siteName === 'string' ? JSON.parse(s.siteName) : s.siteName,
            socialLinks: typeof s.socialLinks === 'string' ? JSON.parse(s.socialLinks) : s.socialLinks,
            address: typeof s.address === 'string' ? JSON.parse(s.address) : s.address,
          });
        }
      } catch (error) {
        console.error("Error fetching hero data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSlidesAndSettings();
  }, []);

  // Fallback slides if none exist in DB
  const displaySlides = slides.length > 0 ? slides : [
    {
      id: '1',
      title: { ar: "صحافة مهنية حرة أولويتها الإنسان", en: "Free Professional Journalism Prioritizing Humanity" },
      subtitle: { ar: "منظمة مستقلة غير ربحية", en: "Independent Non-Profit Organization" },
      description: { ar: "بيت الصحافة هي منظمة مجتمع مدني تهدف إلى تعزيز حرية الإعلام وخلق مساحة نقاش مهني وعملي للصحفيين.", en: "Press House is a civil society organization aiming to promote media freedom and create a professional discussion space." },
      mediaType: 'image',
      mediaUrl: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=1920",
      animationType: 'fade',
      primaryButton: { text: { ar: 'مرصد الانتهاكات', en: 'Violations Observatory' }, link: "/violations", icon: 'ShieldAlert' },
      secondaryButton: { text: { ar: 'استكشف مشاريعنا', en: 'Explore Our Projects' }, link: "/projects", icon: 'Zap' },
      order: 1,
      isActive: true,
      createdAt: new Date().toISOString()
    } as HeroSlide
  ];

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShieldAlert': return ShieldAlert;
      case 'Zap': return Zap;
      case 'Newspaper': return Newspaper;
      case 'Globe2': return Globe2;
      case 'Play': return Play;
      default: return ArrowRight;
    }
  };

  const getAnimationProps = (type: string, delay: number = 0, customType?: string) => {
    const animation = customType || type;
    switch (animation) {
      case 'slide':
        return {
          initial: { opacity: 0, x: isRtl ? 100 : -100 },
          whileInView: { opacity: 1, x: 0 },
          transition: { duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }
        };
      case 'slide-up':
        return {
          initial: { opacity: 0, y: 100 },
          whileInView: { opacity: 1, y: 0 },
          transition: { duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }
        };
      case 'slide-down':
        return {
          initial: { opacity: 0, y: -100 },
          whileInView: { opacity: 1, y: 0 },
          transition: { duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }
        };
      case 'zoom':
      case 'scale-in':
        return {
          initial: { opacity: 0, scale: 0.8 },
          whileInView: { opacity: 1, scale: 1 },
          transition: { duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }
        };
      case 'scale-up':
        return {
          initial: { opacity: 0, scale: 1.5 },
          whileInView: { opacity: 1, scale: 1 },
          transition: { duration: 1, delay, ease: [0.22, 1, 0.36, 1] }
        };
      case 'scale-down':
        return {
          initial: { opacity: 0, scale: 0.5 },
          whileInView: { opacity: 1, scale: 1 },
          transition: { duration: 1, delay, ease: [0.22, 1, 0.36, 1] }
        };
      case 'fade':
      case 'fade-in':
      default:
        return {
          initial: { opacity: 0, y: 20 },
          whileInView: { opacity: 1, y: 0 },
          transition: { duration: 0.8, delay }
        };
    }
  };

  if (loading) {
    return <div className="h-screen w-full bg-slate-900 animate-pulse" />;
  }

  return (
    <section className="relative h-screen w-full overflow-hidden bg-slate-950">
      <Swiper
        modules={[Autoplay, EffectFade, Navigation, Pagination]}
        effect="fade"
        speed={settings?.sliderTransitionSpeed || 1200}
        autoplay={{ delay: settings?.sliderAutoplayDelay || 10000, disableOnInteraction: false }}
        loop={true}
        pagination={{ clickable: true }}
        navigation={true}
        className="h-full w-full"
      >
        {displaySlides.map((slide) => {
          const PrimaryIcon = getIcon(slide.primaryButton.icon);
          const SecondaryIcon = slide.secondaryButton ? getIcon(slide.secondaryButton.icon) : null;
          const lang = i18n.language as 'ar' | 'en';
          
          const textAlignClass = slide.textAlign === 'center' ? 'text-center items-center' : slide.textAlign === 'right' ? 'text-end items-end' : 'text-start items-start';
          const containerAlignClass = slide.textAlign === 'center' ? 'items-center' : slide.textAlign === 'right' ? 'items-end' : 'items-start';

          return (
            <SwiperSlide key={slide.id}>
              <div className={`relative h-full w-full flex items-center ${containerAlignClass}`}>
                {/* Background Media with Overlay */}
                <div className="absolute inset-0 z-0 bg-black">
                  {slide.mediaType === 'video' ? (
                    <video 
                      src={slide.mediaUrl}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className={`h-full w-full object-cover`}
                      style={{ opacity: (slide.overlayOpacity || 60) / 100 }}
                    />
                  ) : (
                    <motion.img 
                      initial={slide.animationType === 'scale-up' ? { scale: 1.2 } : slide.animationType === 'scale-down' ? { scale: 0.8 } : { scale: 1.1 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 15, ease: "linear" }}
                      src={slide.mediaUrl} 
                      alt={slide.title[lang]} 
                      className={`h-full w-full object-cover`}
                      style={{ opacity: (slide.overlayOpacity || 60) / 100 }}
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div className={`absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/20 to-transparent ${isRtl ? 'bg-gradient-to-l' : ''}`} />
                </div>

                <div className={`container mx-auto px-6 relative z-10 flex flex-col ${textAlignClass}`}>
                  <div className={`max-w-4xl space-y-8 flex flex-col ${textAlignClass}`}>
                    {slide.subtitle && slide.subtitle[lang] && (
                      <motion.div
                        {...getAnimationProps(slide.animationType, 0, slide.textAnimation)}
                        className={`inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-blue-400 font-black ${slide.subtitleSize || 'text-xs'} ${isRtl ? 'normal-case tracking-normal' : 'uppercase tracking-[0.2em]'}`}
                      >
                        {slide.entityType === 'event' ? <Zap size={14} className="text-emerald-400" /> :
                         slide.entityType === 'course' ? <Zap size={14} className="text-purple-400" /> :
                         slide.entityType === 'movie' || slide.entityType === 'cinema' ? <Play size={14} className="text-rose-400" /> :
                         <Sparkles size={14} className="text-amber-400" />}
                        {slide.subtitle[lang]}
                      </motion.div>
                    )}

                    <motion.h1
                      {...getAnimationProps(slide.animationType, 0.2, slide.textAnimation)}
                      className={`${slide.titleSize || (isRtl ? 'text-4xl md:text-6xl lg:text-7xl' : 'text-4xl md:text-6xl lg:text-7xl')} font-black text-white max-w-4xl ${isRtl ? 'leading-[1.4] tracking-normal' : 'leading-[1.1] tracking-tighter'}`}
                    >
                      {slide.title[lang]}
                    </motion.h1>

                    <motion.p
                      {...getAnimationProps(slide.animationType, 0.4, slide.textAnimation)}
                      className={`${slide.descriptionSize || 'text-lg md:text-xl'} text-slate-200 leading-relaxed font-medium max-w-2xl`}
                    >
                      {slide.description[lang]}
                    </motion.p>

                    <motion.div
                      {...getAnimationProps(slide.animationType, 0.6, slide.textAnimation)}
                      className={`flex flex-wrap gap-4 pt-4 ${slide.textAlign === 'center' ? 'justify-center' : slide.textAlign === 'right' ? 'justify-end' : 'justify-start'}`}
                    >
                      {slide.primaryButton.text[lang] && (
                        <Link to={slide.primaryButton.link} className={`group relative ${slide.buttonSize || 'px-8 py-4'} bg-blue-600 text-white rounded-2xl font-bold overflow-hidden transition-all hover:bg-blue-700 hover:shadow-2xl hover:shadow-blue-600/30 active:scale-95`}>
                          <span className="relative flex items-center gap-3 whitespace-nowrap">
                            {slide.primaryButton.text[lang]}
                            <PrimaryIcon size={20} className="transition-transform group-hover:translate-x-1" />
                          </span>
                        </Link>
                      )}
                      {slide.secondaryButton?.text?.[lang] && (
                        <Link to={slide.secondaryButton.link} className={`group ${slide.buttonSize || 'px-8 py-4'} bg-white/5 backdrop-blur-md text-white border border-white/10 rounded-2xl font-bold transition-all hover:bg-white/10 hover:border-white/20 active:scale-95`}>
                          <span className="flex items-center gap-3 whitespace-nowrap">
                            {slide.secondaryButton.text[lang]}
                            {SecondaryIcon && <SecondaryIcon size={20} className={isRtl ? 'rotate-180' : ''} />}
                          </span>
                        </Link>
                      )}
                    </motion.div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>

      {/* Custom Styles for Swiper Pagination & Navigation */}
      <style>{`
        .swiper-pagination-bullet {
          background: white !important;
          opacity: 0.3;
          width: 10px;
          height: 10px;
          transition: all 0.3s ease;
        }
        .swiper-pagination-bullet-active {
          opacity: 1;
          width: 24px;
          border-radius: 5px;
          background: #2563eb !important;
        }
        .swiper-button-next, .swiper-button-prev {
          color: white !important;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          width: 50px;
          height: 50px;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }
        .swiper-button-next:after, .swiper-button-prev:after {
          font-size: 20px !important;
          font-weight: bold;
        }
        .swiper-button-next:hover, .swiper-button-prev:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
        }
        @media (max-width: 768px) {
          .swiper-button-next, .swiper-button-prev {
            display: none !important;
          }
        }
      `}</style>
    </section>
  );
};
