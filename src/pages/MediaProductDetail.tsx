import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { 
  FileText, Calendar, MapPin, Users, Video, Music, Megaphone, 
  Target, BookOpen, Share2, Award, Download, ThumbsUp, ArrowRight, 
  CheckCircle, Quote, AlertCircle, Loader2, Sparkles, ExternalLink,
  ChevronLeft, Eye, Clock, UserCheck
} from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '../services/api';

export default function MediaProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  
  const [product, setProduct] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [likesCount, setLikesCount] = useState(142);
  const [hasLiked, setHasLiked] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/api/media-products/slug/${slug}`);
        if (response.data) {
          let parsedTitle = { ar: '', en: '' };
          try {
            parsedTitle = typeof response.data.title === 'string' ? JSON.parse(response.data.title) : response.data.title;
          } catch {
            parsedTitle = { ar: response.data.title?.ar || response.data.title || '', en: response.data.title?.en || '' };
          }

          let parsedMetadata = {};
          try {
            parsedMetadata = typeof response.data.metadata === 'string' ? JSON.parse(response.data.metadata) : response.data.metadata;
          } catch {
            parsedMetadata = response.data.metadata || {};
          }

          setProduct({
            ...response.data,
            title: parsedTitle,
            metadata: parsedMetadata
          });
        } else {
          setError(isRtl ? 'لم يتم العثور على المنتج الإعلامي المطلوب.' : 'Requested media product not found.');
        }
      } catch (err: any) {
        console.error('Failed to fetch media product:', err);
        setError(isRtl ? 'حدث خطأ أثناء تحميل المنتج.' : 'An error occurred while loading the product.');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchProduct();
    }
  }, [slug, isRtl]);

  const handleLike = () => {
    if (hasLiked) {
      setLikesCount(prev => prev - 1);
      setHasLiked(false);
    } else {
      setLikesCount(prev => prev + 1);
      setHasLiked(true);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center py-20" id="media-detail-loading">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
        <p className="text-slate-500 font-bold text-sm">
          {isRtl ? 'جاري تحميل المادة الإعلامية وغرفة التحرير...' : 'Fetching media narrative and publications...'}
        </p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center" id="media-detail-error">
        <AlertCircle size={64} className="text-rose-500 mb-4" />
        <h1 className="text-2xl font-black text-slate-900">{isRtl ? 'المحتوى غير متوفر' : 'Product Not Available'}</h1>
        <p className="text-slate-500 mt-2 max-w-md mx-auto">{error || (isRtl ? 'يتعذر العثور على هذا الرابط في الأرشيف.' : 'This link cannot be fetched from our database.')}</p>
        <Link to="/" className="mt-8 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-slate-900 transition-colors">
          {isRtl ? 'العودة للرئيسية' : 'Return to Home'}
        </Link>
      </div>
    );
  }

  const { title, metadata, contentType, division, createdAt } = product;
  const pageTitle = title?.[isRtl ? 'ar' : 'en'] || title?.ar || title?.en || 'PressHouse Publication';
  const pageDesc = metadata.summaryAr || metadata.synopsisAr || metadata.captionAr || 'Yemen PressHouse Publication';
  
  // Custom SEO Schemas & OpenGraph metadata
  const ogImageUrl = metadata.heroImage || metadata.mainImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=1200';
  const urlStructure = `${window.location.origin}/${division}/${contentType}/${product.slug}`;

  // Structured Data (JSON-LD) for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": contentType === 'research_report' ? "Report" : "NewsArticle",
    "headline": pageTitle,
    "image": [ogImageUrl],
    "datePublished": createdAt,
    "dateModified": createdAt,
    "author": {
      "@type": "Organization",
      "name": isRtl ? "بيت الصحافة - اليمن" : "PressHouse - Yemen",
      "url": "https://ph-ye.org"
    },
    "publisher": {
      "@type": "Organization",
      "name": "PressHouse",
      "logo": {
        "@type": "ImageObject",
        "url": "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=100"
      }
    },
    "description": pageDesc
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-24" id="media-product-detail-root" dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* Dynamic SEO Injector */}
      <Helmet>
        <title>{pageTitle} | {isRtl ? 'بيت الصحافة اليمني' : 'PressHouse Yemen'}</title>
        <meta name="description" content={pageDesc} />
        <meta property="og:title" content={`${pageTitle} | PressHouse`} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:url" content={urlStructure} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDesc} />
        <meta name="twitter:image" content={ogImageUrl} />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <div className="max-w-6xl mx-auto px-6">
        
        {/* Back Link Breadcrumb */}
        <div className="mb-6 flex justify-between items-center text-xs text-slate-400 font-bold">
          <Link 
            to="/" 
            className="flex items-center gap-1.5 hover:text-blue-600 transition-colors"
          >
            <ChevronLeft size={16} className={isRtl ? 'rotate-180' : ''} />
            <span>{isRtl ? 'الرئيسية' : 'Home'}</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-500 uppercase">{division}</span>
            <span className="text-slate-300">/</span>
            <span className="text-blue-600 uppercase">{contentType.replace('_', ' ')}</span>
          </Link>

          <span className="text-slate-400 flex items-center gap-1">
            <Clock size={12} />
            {new Date(createdAt).toLocaleDateString(isRtl ? 'ar-YE' : 'en-US')}
          </span>
        </div>

        {/* Dynamic Multi-Layout Rendering Screen */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Content Area (Col Span 8) */}
          <div className="lg:col-span-8 space-y-8 bg-white p-8 md:p-12 rounded-[32px] border border-slate-100 shadow-sm text-start">
            
            {/* Title block */}
            <div className="space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full font-bold text-xs uppercase">
                <Sparkles size={12} className="text-blue-500 animate-pulse" />
                {contentType.replace('_', ' ')}
              </span>
              
              <h1 className="text-2xl md:text-4xl font-black font-sans leading-tight text-slate-900 tracking-tight">
                {title?.[isRtl ? 'ar' : 'en'] || title?.ar || title?.en}
              </h1>

              {title?.en && title?.ar && (
                <p className="text-sm font-semibold text-slate-400 font-mono">
                  {isRtl ? title.en : title.ar}
                </p>
              )}
            </div>

            {/* Layout Type 1: SUCCESS STORY */}
            {contentType === 'success_story' && (
              <div className="space-y-8 mt-6">
                
                {/* Hero section banner */}
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-md">
                  <img 
                    src={metadata.heroImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=1200'} 
                    alt="Success banner" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Narrative Details grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{isRtl ? 'الاسم والمستفيد' : 'Beneficiary Name'}</p>
                    <p className="text-sm font-black text-slate-800 mt-1">{metadata.beneficiaryName || 'سالم عبد الرحمن'}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{isRtl ? 'الموقع والمحافظة' : 'Location'}</p>
                    <p className="text-sm font-black text-slate-800 mt-1">{metadata.location || 'تعز، اليمن'}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{isRtl ? 'المشروع التنموي' : 'Project associated'}</p>
                    <p className="text-sm font-black text-blue-600 mt-1">{metadata.projectName || 'الأصوات المستقلة'}</p>
                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* Timeline sequence columns */}
                <div className="space-y-6">
                  <div className="border-r-4 md:border-r-0 md:border-l-4 border-amber-500 pl-4 pr-1">
                    <h3 className="text-sm font-black text-amber-700 uppercase tracking-wide flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      {isRtl ? 'الوضع قبل التدخل الميداني:' : 'Before Situation:'}
                    </h3>
                    <p className="text-xs text-slate-600 mt-2 font-medium leading-relaxed md:text-sm">
                      {metadata.beforeSituationAr || (isRtl ? 'كان يعاني الصحفيون الميدانيون من شلل تام في أدوات السلامة وحصار مستمر للتغطيات الصحفية.' : 'Independent reporters lacked safety systems and faced continuous embargoes.')}
                    </p>
                  </div>

                  <div className="border-r-4 md:border-r-0 md:border-l-4 border-blue-500 pl-4 pr-1">
                    <h3 className="text-sm font-black text-blue-700 uppercase tracking-wide flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                      {isRtl ? 'التدخل وبناء القدرات القانونية والمرئية:' : 'Our Specialized Intervention:'}
                    </h3>
                    <p className="text-xs text-slate-600 mt-2 font-medium leading-relaxed md:text-sm">
                      {metadata.interventionAr || (isRtl ? 'عقد بيت الصحافة دورات حماية إجرائية وقانونية وأمن معلوماتي، كما وفر سترات واقية وبطاقات تأمين زرقاء.' : 'PressHouse provided digital legal defense toolkits, helmets, blue safety jackets, and information defense courses.')}
                    </p>
                  </div>

                  <div className="border-r-4 md:border-r-0 md:border-l-4 border-emerald-500 pl-4 pr-1">
                    <h3 className="text-sm font-black text-emerald-700 uppercase tracking-wide flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {isRtl ? 'الوضع بعد التدخل والنتائج الإيجابية:' : 'Intervention Outcomes:'}
                    </h3>
                    <p className="text-xs text-slate-600 mt-2 font-medium leading-relaxed md:text-sm">
                      {metadata.outcomeAr || (isRtl ? 'استعاد المستفيد حقل النشر وشكل 3 تحقيقات استقصائية رائدة ألهمت الرأي العام.' : 'The beneficiary successfully returned to active writing and launched 3 investigative exposes.')}
                    </p>
                  </div>
                </div>

                {/* Sub-quote section */}
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex gap-4 relative overflow-hidden">
                  <Quote className="absolute right-4 top-4 text-blue-500/10" size={80} />
                  <div className="relative">
                    <p className="text-sm md:text-base font-bold italic text-slate-700 leading-relaxed">
                      "لم يكن بالإمكان الصمود والتحدي بلا درع الحماية والسترة التقنية الآمنة المهدية من طاقم الصحافة."
                    </p>
                    <p className="text-xs text-slate-400 font-extrabold mt-3">— سالم عبد الرحمن، مستفيد مباشر</p>
                  </div>
                </div>

                {metadata.relatedProjects && (
                  <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 text-xs">
                    <span className="font-bold text-blue-800 block mb-1">{isRtl ? 'مشاريع وفعاليات ذات صلة:' : 'Related projects:'}</span>
                    <span className="text-slate-600 font-semibold">{metadata.relatedProjects}</span>
                  </div>
                )}
              </div>
            )}

            {/* Layout Type 2: TESTIMONIAL */}
            {contentType === 'testimonial' && (
              <div className="flex flex-col items-center justify-center py-12 space-y-6 max-w-lg mx-auto text-center mt-6">
                <div className="w-24 h-24 rounded-full border-4 border-blue-600 overflow-hidden shadow-lg">
                  <img 
                    src={metadata.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300'} 
                    alt="Person Avatar" 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                </div>
                
                <div className="relative">
                  <Quote className="text-blue-500/10 mx-auto" size={56} />
                  <p className="text-base md:text-xl font-bold text-slate-800 leading-relaxed italic px-4 mt-2">
                    "{metadata.bodyAr || (isRtl ? 'البرامج الإستراتيجية وورش العمل التي تشرف عليها مؤسسة بيت الصحافة تسهم بفاعلية في تمكين الصوت الحر.' : 'The programs managed by PressHouse Yemen represent a vital shift for free expression in the region.')}"
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 w-full">
                  <h3 className="text-base font-black text-slate-900">{metadata.personNameAr || 'أ. سارة الكثيري'}</h3>
                  <p className="text-xs text-slate-400 font-bold mt-1">
                    {metadata.personRoleAr || 'خبير حقوقي'} | {metadata.personOrganizationAr || 'منظمة الشفافية الدولية'}
                  </p>
                </div>

                {metadata.videoLink && (
                  <a 
                    href={metadata.videoLink} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="mt-4 text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Video size={14} />
                    <span>{isRtl ? 'شاهد شهادة الفيديو المسجلة للمستفيد' : 'Watch full video endorsement'}</span>
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            )}

            {/* Layout Type 3: DOCUMENTARY / PODCAST AUDIO */}
            {['documentary_film', 'short_doc', 'success_story_video', 'humanitarian_story_video', 'interview', 'podcast_episode'].includes(contentType) && (
              <div className="space-y-6 mt-6">
                
                <div className="relative aspect-video bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 flex flex-col items-center justify-center text-white p-4 shadow-inner">
                  {contentType === 'podcast_episode' ? (
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg animate-pulse">
                        <Music size={28} />
                      </div>
                      <div>
                        <span className="text-[10px] bg-slate-800 px-3 py-1 rounded-full text-slate-300 font-bold uppercase tracking-wider">
                          EPISODE {metadata.episodeNumber || '1'} SEASON {metadata.seasonNumber || '1'}
                        </span>
                        <p className="text-sm font-bold text-slate-300 mt-2">Podcast Episode - أثير بيت الصحافة</p>
                        {metadata.audioLink && (
                          <p className="text-xs text-blue-400 mt-1 font-mono">{metadata.audioLink}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center space-y-3">
                      <Video size={36} className="text-blue-500 animate-pulse" />
                      <p className="text-xs text-slate-400 font-bold">{isRtl ? 'رابط البث التوثيقي المباشر لمشروع الفيديو:' : 'Verifiable video feed URL:'}</p>
                      <p className="text-xs text-blue-400 font-mono italic max-w-sm break-all">{metadata.videoLink || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'}</p>
                    </div>
                  )}

                  <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between text-[10px] text-slate-400 select-none">
                    <span>00:00 / {metadata.runtime || '24:00 Mins'}</span>
                    <span className="bg-red-600 text-white font-extrabold px-1.5 py-0.5 rounded uppercase flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-white bg-slate-100" />
                      HQ FEED
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-150 grid grid-cols-2 md:grid-cols-3 gap-6 text-xs font-semibold text-slate-700">
                  {metadata.director && (
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">{isRtl ? 'المخرج الإبداعي' : 'Director'}</span>
                      <span className="text-slate-800 font-black">{metadata.director}</span>
                    </div>
                  )}
                  {metadata.producer && (
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">{isRtl ? 'المنتج المنفذ' : 'Producer'}</span>
                      <span className="text-slate-800 font-black">{metadata.producer}</span>
                    </div>
                  )}
                  {metadata.hosts && (
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">{isRtl ? 'مقدم الحلقة والبودكاست' : 'Host'}</span>
                      <span className="text-slate-800 font-black">{metadata.hosts}</span>
                    </div>
                  )}
                  {metadata.guests && (
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">{isRtl ? 'الضيف المشارك' : 'Guest'}</span>
                      <span className="text-slate-800 font-black">{metadata.guests}</span>
                    </div>
                  )}
                  {metadata.language && (
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">{isRtl ? 'اللغة والترجمة' : 'Language'}</span>
                      <span className="text-slate-800 font-black">{metadata.language}</span>
                    </div>
                  )}
                  {metadata.awardsAr && (
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">{isRtl ? 'الترشيحات والجوائز' : 'Awards & Recognition'}</span>
                      <span className="text-emerald-600 font-black">{metadata.awardsAr}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-4">
                  <h3 className="text-base font-black text-slate-900">{isRtl ? 'الملخص التعريفي والإنتاجي للمادة:' : 'Synopsis & details:'}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {metadata.synopsisAr || metadata.summaryAr || (isRtl ? 'عرض مرئي للأبعاد الإنسانية في اليمن والتدريب المستهدف.' : 'Immersive digital and visual narrative documenting training outputs in Yemen.')}
                  </p>
                </div>

                {/* Optional Transcript/Show Notes tabs */}
                {(metadata.transcriptAr || metadata.showNotesAr) && (
                  <div className="mt-8 space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'نص الحوار والتفريغ الكتابي' : 'Dialog Transcript / Show Notes'}</h4>
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-150 text-xs text-slate-600 leading-relaxed whitespace-pre-line max-h-60 overflow-y-auto">
                      {metadata.transcriptAr || metadata.showNotesAr}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Layout Type 4: PRESS RELEASE / NEWS ROOM */}
            {contentType === 'press_release' && (
              <div className="space-y-6 mt-6">
                
                {/* News dateline brand block */}
                <div className="text-center pb-6 border-b border-dashed border-slate-200">
                  <span className="text-xs font-extrabold text-blue-600 uppercase tracking-widest block">{isRtl ? 'بيان صحفي للنشـر الفوري' : 'HOT PRESS EMBARGO OVERVIEW'}</span>
                  <div className="text-xs text-slate-400 font-bold italic mt-1.5 flex justify-center items-center gap-1.5">
                    <MapPin size={12} />
                    <span>{metadata.datelineAr || 'صنعاء، اليمن'}</span>
                    <span>•</span>
                    <span>{new Date(createdAt).toLocaleDateString(isRtl ? 'ar-YE' : 'en-US')}</span>
                  </div>
                </div>

                {metadata.summaryAr && (
                  <div className="bg-blue-50/50 p-4 border-r-4 border-blue-600 text-sm font-bold text-slate-800 leading-relaxed">
                    {metadata.summaryAr}
                  </div>
                )}

                <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
                  {metadata.bodyAr || (isRtl ? 'لقد رصد بيت الصحافة تدفقاً هائلاً من الشكاوى والتحديات الأمنية ونؤكد الالتزام المهني بدعم القضايا وحشد المناصرة الدولية.' : 'PressHouse documents constant challenges and reinforces national commitment to coordinate independent global defense programs.')}
                </div>

                {metadata.mediaContactsAr && (
                  <div className="border-t border-slate-150 pt-4 space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{isRtl ? 'الاتصال غرف الأخبار الفوري:' : 'Immediate news cabinet contact:'}</p>
                    <p className="text-xs text-blue-600 font-bold">{metadata.mediaContactsAr}</p>
                  </div>
                )}
              </div>
            )}

            {/* Layout Type 5: SOCIAL POST DIALOGUE CARD SIMULATOR */}
            {contentType === 'social_post' && (
              <div className="space-y-6 mt-6">
                
                {/* Actual social network simulated card */}
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4 max-w-lg mx-auto font-sans">
                  
                  {/* Top Profile indicator */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-700 text-white flex items-center justify-center font-black text-xs">
                        PH
                      </div>
                      <div className="text-start">
                        <p className="font-extrabold text-slate-900 text-xs">بيت الصحافة - اليمن | PressHouse</p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1.5">
                          <Eye size={12} />
                          {isRtl ? 'منشور مدعوم ومصادق علية' : 'Verified Social Feed Statement'}
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] px-2.5 py-1 bg-blue-100 text-blue-700 font-extrabold rounded-full uppercase">
                      {metadata.platform || 'facebook'}
                    </span>
                  </div>

                  {/* Body textual caption */}
                  <div className="space-y-3 text-start">
                    <p className="text-slate-900 font-semibold text-xs leading-relaxed md:text-sm">
                      {metadata.captionAr}
                    </p>
                    <p className="text-blue-600 text-xs font-black select-all">
                      {metadata.hashtags || '#PressHouseYemen #صحافة_حرة'}
                    </p>
                  </div>

                  {/* Attachment image */}
                  {metadata.mediaUrl && (
                    <div className="rounded-2xl overflow-hidden border border-slate-150 max-h-64 shadow-xs">
                      <img 
                        src={metadata.mediaUrl} 
                        alt="Simulated attachment" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  {/* Feed footer mock controls */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-400 font-bold select-none">
                    <button 
                      onClick={handleLike}
                      className={`flex items-center gap-1.5 transition-colors ${hasLiked ? 'text-blue-600' : 'hover:text-blue-600'}`}
                    >
                      👍 {isRtl ? 'أعجبني' : 'Like'} ({likesCount})
                    </button>
                    <span className="cursor-pointer hover:text-blue-600">💬 {isRtl ? 'تعليق (18)' : 'Comments (18)'}</span>
                    <button 
                      onClick={handleShare}
                      className="cursor-pointer hover:text-blue-600 flex items-center gap-1"
                    >
                      🔁 {isRtl ? 'مشاركة' : 'Share'}
                    </button>
                  </div>

                </div>
              </div>
            )}

            {/* FALLBACK/GENERAL ACADEMIC / ADVOCACY / RESEARCH DEFAULT */}
            {!['success_story', 'testimonial', 'documentary_film', 'short_doc', 'press_release', 'social_post', 'podcast_episode'].includes(contentType) && (
              <div className="space-y-6 mt-6">
                
                {/* Report cover layout */}
                {metadata.heroImage && (
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                    <img 
                      src={metadata.heroImage} 
                      alt="Publication Cover" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                {/* Abstract summary card */}
                {(metadata.summaryAr || metadata.issueAr) && (
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-slate-700">
                    <h3 className="text-xs font-black text-blue-600 uppercase tracking-wider mb-2">
                      {isRtl ? 'الملخص التنفيذي للقضية والتشريعات' : 'EXECUTIVE ABSTRACT & RESEARCH PURPOSE'}
                    </h3>
                    <p className="text-xs md:text-sm font-semibold leading-relaxed">
                      {metadata.summaryAr || metadata.issueAr}
                    </p>
                  </div>
                )}

                {/* Full paper details */}
                {metadata.bodyAr && (
                  <div className="space-y-3">
                    <h3 className="text-base font-black text-slate-900">{isRtl ? 'نتائج الرصد والبحث والتقييم الميداني:' : 'Main investigation text:'}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                      {metadata.bodyAr}
                    </p>
                  </div>
                )}

                {/* Key message callout */}
                {metadata.keyMessagesAr && (
                  <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100 text-xs">
                    <h4 className="font-black text-amber-800 uppercase mb-2">{isRtl ? 'رسائل غرف الأخبار والحشد الإستراتيجية:' : 'Strategic Core Messages:'}</h4>
                    <p className="text-amber-900 font-semibold leading-relaxed whitespace-pre-line">{metadata.keyMessagesAr}</p>
                  </div>
                )}

                {/* Recommendations specific panel */}
                {metadata.recommendationsAr && (
                  <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 text-xs">
                    <h4 className="font-black text-emerald-800 uppercase mb-2">{isRtl ? 'التوصيات والأوراق الأساسية الموجهة لصناع القرار:' : 'Policy Actions & Technical Recommendations:'}</h4>
                    <p className="text-emerald-900 leading-relaxed whitespace-pre-line">{metadata.recommendationsAr}</p>
                  </div>
                )}
              </div>
            )}

            {/* Dynamic statistics cards grid representation */}
            {metadata.stats && Array.isArray(metadata.stats) && metadata.stats.length > 0 && (
              <div className="border-t border-slate-100 pt-6 mt-8 space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  {isRtl ? 'إحصائيات ومؤشرات الأثر الرقمي للمؤسسة' : 'Verified Statistical Indicators & Metrics'}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {metadata.stats.map((stat: any, index: number) => (
                    <div key={index} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-center shadow-xs">
                      <p className="text-2xl md:text-3xl font-black text-blue-600 tracking-tight font-mono">
                        {stat.value}
                      </p>
                      <p className="text-[10px] md:text-xs font-bold text-slate-500 mt-1 leading-tight">
                        {isRtl ? stat.labelAr : stat.labelEn}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dynamic chronological timeline presentation */}
            {metadata.timeline && Array.isArray(metadata.timeline) && metadata.timeline.length > 0 && (
              <div className="border-t border-slate-100 pt-6 mt-8 space-y-6">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                  {isRtl ? 'مسار الأحداث والتسلسل الزمني للتحقيق' : 'Chronological Investigative Timeline'}
                </h4>
                <div className="relative border-l border-slate-200 ml-3 md:ml-4 pl-6 space-y-6">
                  {metadata.timeline.map((event: any, index: number) => (
                    <div key={index} className="relative group text-start">
                      <span className="absolute -left-[31px] md:-left-[35px] top-1.5 w-4 h-4 rounded-full bg-blue-50 border-2 border-blue-600 group-hover:bg-blue-600 transition-all flex items-center justify-center">
                        <span className="w-1 h-1 rounded-full bg-blue-600 group-hover:bg-white" />
                      </span>
                      <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl hover:border-blue-200 hover:bg-white transition-all space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-mono">
                            {event.date}
                          </span>
                          <h5 className="text-xs md:text-sm font-black text-slate-800">
                            {isRtl ? event.eventAr : event.eventEn}
                          </h5>
                        </div>
                        {(isRtl ? event.descAr : event.descEn) && (
                          <p className="text-[11px] md:text-xs text-slate-500 leading-relaxed pt-1 font-medium">
                            {isRtl ? event.descAr : event.descEn}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Document attachments or downloads manager block */}
            {metadata.downloads && metadata.downloads.length > 0 && (
              <div className="border-t border-slate-100 pt-6 mt-8 space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'حقيبة التنزيل والملفات الأصلية' : 'Download Center & Attachments'}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {metadata.downloads.map((dl: any, index: number) => (
                    <a 
                      key={index} 
                      href={dl.url || '#'} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-slate-50 border border-slate-150 rounded-xl p-3 flex items-center justify-between hover:bg-blue-50 hover:border-blue-300 transition-all text-xs font-bold text-slate-700"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="text-blue-600" size={18} />
                        <span>{dl.label || `Document ${index + 1}`}</span>
                      </div>
                      <Download size={16} className="text-slate-400" />
                    </a>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Sidebar / Meta Widget Pane (Col Span 4) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Publisher Metadata Card */}
            <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-xs text-start space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'تفاصيل التشر والاعتماد' : 'Institutional Audit'}</h3>
              
              <div className="space-y-3 text-xs leading-relaxed">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-400 font-bold">{isRtl ? 'الجهة الناشرة:' : 'Publisher:'}</span>
                  <span className="font-black text-slate-800">{isRtl ? 'بيت الصحافة - اليمن' : 'PressHouse Yemen'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-400 font-bold">{isRtl ? 'اللغة الأصلية:' : 'Document Language:'}</span>
                  <span className="font-black text-slate-800">{isRtl ? 'العربية / الإنجليزية' : 'Arabic / English'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-400 font-bold">{isRtl ? 'المشرف الصحفي:' : 'Lead editor:'}</span>
                  <span className="font-black text-blue-600 flex items-center gap-1">
                    <UserCheck size={12} />
                    {isRtl ? 'أكرم العمودي' : 'A. Al-Amoudi'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-400 font-bold">{isRtl ? 'مستوى الحماية:' : 'License & Protection:'}</span>
                  <span className="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded text-[10px]">CC BY-NC 4.0</span>
                </div>
              </div>

              <div className="flex gap-2 w-full pt-2">
                <button 
                  onClick={handleLike}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                    hasLiked 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-50' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <ThumbsUp size={14} />
                  <span>{isRtl ? 'أعجبني' : 'Like'} ({likesCount})</span>
                </button>

                <button 
                  onClick={handleShare}
                  className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center"
                  title={isRtl ? 'نسخ الرابط الفوري' : 'Copy live link'}
                >
                  <Share2 size={16} />
                </button>
              </div>

              {copied && (
                <p className="text-[10px] text-center text-emerald-600 font-bold animate-pulse">
                  {isRtl ? 'تم نسخ الرابط الفوري للمادة بنجاح!' : 'Link copied to clipboard successfully!'}
                </p>
              )}
            </div>

            {/* Impact indicator or Campaign statistics of Yemen PressHouse */}
            <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-xs text-start space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'الأثر التنموي المسجل للقصة' : 'Verified narrative impact'}</h3>
              
              <div className="space-y-4 pt-1">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Users size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">{isRtl ? 'الفئة المستفيدة' : 'Beneficiary category'}</span>
                    <span className="text-xs font-extrabold text-slate-800">{isRtl ? 'صحفيون شباب ومستقلون باليمن' : 'Youth reporters & bloggers'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <Award size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">{isRtl ? 'مؤشر أداء المشروع (KPI)' : 'Associated KPI'}</span>
                    <span className="text-xs font-extrabold text-slate-800">{isRtl ? 'رفع السلامة وتخفيف خطاب الكراهية' : 'Hate speech reduction & safety level'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                    <CheckCircle size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">{isRtl ? 'التحقق والمطابقة' : 'Validation context'}</span>
                    <span className="text-xs font-extrabold text-slate-800">{isRtl ? 'تفتيش حي ومطابق لمعيار بيت الصحافة' : 'Verified on field by PressHouse auditors'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Call to action card */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-[24px] shadow-lg text-start space-y-4">
              <div className="p-2 bg-white/10 rounded-xl inline-block">
                <Megaphone size={20} className="text-amber-400 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-black leading-tight">{isRtl ? 'كن شريكاً في دعم الصحفيين والمدنيين باليمن' : 'Become our partner in safeguarding journalism'}</h4>
                <p className="text-[10px] text-blue-100 mt-1 leading-relaxed">
                  {isRtl 
                    ? 'شارك تبرعاتك العينية أو انضم إلى تدريباتنا المستمرة لسلامة التعبير والحريات.' 
                    : 'Provide legal support, donate safety kits, or enroll in our digital verification programs.'}
                </p>
              </div>
              <Link 
                to="/contact" 
                className="bg-white text-blue-600 px-4 py-2 rounded-xl text-xs font-extrabold hover:bg-slate-900 hover:text-white transition-all inline-flex items-center gap-1 shadow-sm"
              >
                <span>{isRtl ? 'تواصل معنا الفـور' : 'Contact us immediately'}</span>
                <ArrowRight size={14} className={isRtl ? 'rotate-180' : ''} />
              </Link>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
