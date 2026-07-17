import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FileText, Plus, Search, Filter, Loader2, Sparkles, Image, Video, 
  Music, BookOpen, Share2, Award, Download, ThumbsUp, Calendar, 
  MapPin, CheckCircle, Quote, Trash2, Edit3, ArrowRight,
  Target, Presentation, Award as Trophy, Users, BarChart2, Briefcase, 
  Laptop, AlignLeft, Send, Link as LinkIcon, AlertCircle, FileSpreadsheet,
  Megaphone, ExternalLink, RefreshCw, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useDocumentSEO } from '../../hooks/useDocumentSEO';
import StatisticsCardsBuilder from '../../components/admin/StatisticsCardsBuilder';
import TimelineBuilder from '../../components/admin/TimelineBuilder';
import AssetManagement from '../../components/admin/AssetManagement';

// Renders interactive statistics, timeline, quotes, live platform preview, mock player, download section

// Categories and Content types configurations
export interface MediaProductType {
  id: string;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
}

export interface ContentDivision {
  id: string;
  nameAr: string;
  nameEn: string;
  icon: any;
  descAr: string;
  descEn: string;
  types: MediaProductType[];
}

export default function MediaCenter() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { userData } = useAuth();

  const getProductUrl = (contentType: string, slug: string) => {
    if (contentType === 'success_story') return `/stories/success-story/${slug}`;
    if (contentType === 'human_interest') return `/stories/human-story/${slug}`;
    if (['documentary_film', 'short_doc', 'success_story_video', 'humanitarian_story_video', 'interview', 'podcast_episode'].includes(contentType)) {
      return `/documentaries/${slug}`;
    }
    if (['press_release', 'news_article', 'feature_story'].includes(contentType)) {
      return `/press-releases/${slug}`;
    }
    if (['research_report', 'investigative_report', 'needs_assessment', 'media_monitoring_report', 'public_opinion_analysis'].includes(contentType)) {
      return `/research/reports/${slug}`;
    }
    if (['campaign', 'advocacy_brief', 'policy_brief', 'position_paper'].includes(contentType)) {
      return `/campaigns/${slug}`;
    }
    return `/infographics/${slug}`;
  };

  // Selected view modes: 'list' | 'create_wizard' | 'editor'
  const [viewMode, setViewMode] = useState<'list' | 'create_wizard' | 'editor'>('list');
  const [mediaProducts, setMediaProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit / Create State
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');

  // Search & Filter State in main dashboard
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDivision, setFilterDivision] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Form Fields State
  const [formData, setFormData] = useState({
    titleAr: '',
    titleEn: '',
    slug: '',
    status: 'draft',
    // Metadata holds specialized fields
    metadata: {} as Record<string, any>
  });

  // AI assistant states
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [selectedFieldForAI, setSelectedFieldForAI] = useState<string>('');

  // Configure SEO headers for the Media Center Admin Dashboard itself
  useDocumentSEO({
    title: isRtl ? 'مستودع الإنتاج والاستديو الإعلامي - لوحة الإدارة' : 'Media Production Hub & Studio - Admin Panel',
    description: 'إدارة وتطوير المنتجات الإعلامية الإستراتيجية، حملات التوعية، والتحقيقات الصحفية المهنية.',
  });

  const contentDivisions: ContentDivision[] = [
    {
      id: 'storytelling',
      nameAr: 'قصص النجاح والأثر الإنساني',
      nameEn: 'Storytelling & Human Interest',
      icon: Users,
      descAr: 'قصص نجاح ومقالات تركز على الأثر والجانب الإنساني للمستفيدين.',
      descEn: 'Human-centered storytelling and impact narratives focusing on beneficiaries.',
      types: [
        { id: 'success_story', nameAr: 'قصة نجاح متكاملة', nameEn: 'Success Story', descAr: 'قصة نجاح تركز على الأثر بإحصائيات وصور واقتباسات.', descEn: 'Impact-oriented storytelling with statistics, photos, and quotes.' },
        { id: 'human_interest', nameAr: 'قصة ذات بعد إنساني', nameEn: 'Human Interest Story', descAr: 'قصص وتغطيات صحفية تركز على التفاصيل الشخصية والأبعاد الإنسانية.', descEn: 'Immersive stories highlighting emotional and personal human aspects.' },
        { id: 'testimonial', nameAr: 'شهادة مستفيد/شريك', nameEn: 'Testimonial', descAr: 'شهادة قصيرة موثقة بشخصيات حقيقية لدعم مصداقية المشاريع.', descEn: 'Quote-centered endorsement from direct beneficiaries or project partners.' },
        { id: 'case_study', nameAr: 'دراسة حالة تفصيلية', nameEn: 'Case Study', descAr: 'دراسة تحليلية دقيقة لتحدي معين واستجابة بيت الصحافة له.', descEn: 'Analytical report on specific challenges, methodologies, and findings.' }
      ]
    },
    {
      id: 'documentary',
      nameAr: 'الإنتاج الوثائقي والمرئي وحلقات البودكاست',
      nameEn: 'Documentary & Video Production',
      icon: Video,
      descAr: 'إدارة وتوثيق ونشر الأفلام الاستقصائية، والتحقيقات، والمقابلات وبودكاست أثير.',
      descEn: 'Management and archiving of investigative documentaries, short films, interviews, and podcasts.',
      types: [
        { id: 'documentary_film', nameAr: 'فيلم وثائقي طويل', nameEn: 'Documentary Film', descAr: 'فيلم وثائقي متكامل مع بوستر استعراضي وتفاصيل الإنتاج والجوائز.', descEn: 'Feature-length documentary with Netflix-style poster, trailer, and credits.' },
        { id: 'short_doc', nameAr: 'فيلم وثائقي قصير', nameEn: 'Short Documentary', descAr: 'تغطيات مرئية سريعة ومكثفة لتسليط الضوء على قضية أو تدخل.', descEn: 'Compact visual stories focusing on a specific rapid intervention or cause.' },
        { id: 'success_story_video', nameAr: 'فيديو قصة نجاح ملهمة', nameEn: 'Success Story Video', descAr: 'مادة مرئية توضح نقلة نوعية في حياة شخص نتيجة التدخل.', descEn: 'An inspiring video mapping out a beneficiary change with indicators.' },
        { id: 'humanitarian_story_video', nameAr: 'فيديو أثر إنساني وخلفيات', nameEn: 'Humanitarian Story Video', descAr: 'تقرير مرئي يسلط الضوء على المعاناة أو سياق التحدي الإنساني.', descEn: 'Structured video package mapping out humanitarian contexts with transcripts.' },
        { id: 'interview', nameAr: 'مقابلة صحفية مصورة', nameEn: 'Interview', descAr: 'حوار مصور مع خبراء، قادة مجتمعيين أو وفود صحفية.', descEn: 'A styled recorded interview with complete multi-language transcript.' },
        { id: 'podcast_episode', nameAr: 'حلقة بودكاست أثير', nameEn: 'Podcast Episode', descAr: 'إنتاج صوتي متميز مع تفاصيل الضيوف ونص الحوار والمصادر.', descEn: 'Premium audio show notes, audio files embed and guest details.' }
      ]
    },
    {
      id: 'communications',
      nameAr: 'الاتصالات الإستراتيجية والبيانات',
      nameEn: 'Strategic Communications',
      icon: Megaphone,
      descAr: 'إدارة غرف الأخبار، والبيانات والتقارير الصحفية الرسمية الصادرة واللقطات العامة.',
      descEn: 'Press releases, news, statements, and institutional updates.',
      types: [
        { id: 'press_release', nameAr: 'بيان صحفي رسمي', nameEn: 'Press Release', descAr: 'بيان موجه لوسائل الإعلام مع جهات الاتصال وملفات التحميل.', descEn: 'Official statement with dateline, media contacts, and formal layout.' },
        { id: 'news_article', nameAr: 'خبر صحفي تفصيلي', nameEn: 'News Article', descAr: 'خبر رسمي من الميدان يخص أنشطة أو مواقف بيت الصحافة في الساحة.', descEn: 'Dynamic news update with categorized tags and reporter credits.' },
        { id: 'feature_story', nameAr: 'تقرير صحفي معمق', nameEn: 'Feature Story', descAr: 'معالجة صحفية معمقة تجمع بين السرد القصصي والوسائط المتعددة.', descEn: 'Long-form rich journalist story with multiple multimedia embeds.' },
        { id: 'executive_summary', nameAr: 'ملخص تنفيذي موجز', nameEn: 'Executive Summary', descAr: 'أوراق إرشادية مقتضبة للمدراء والشركاء تسرد قصة نجاح أو نتائج رئيسية.', descEn: 'Brief brief outlining high-level progress, findings, and recommendations.' },
        { id: 'annual_report', nameAr: 'التقرير السنوي التفاعلي', nameEn: 'Annual Report', descAr: 'منشور دوري يستعرض الإنجازات والبيانات الإحصائية السنوية والعمليات كاملة.', descEn: 'Interactive report showcasing annual milestones, finances, and impact.' }
      ]
    },
    {
      id: 'advocacy',
      nameAr: 'المناصرة وحملات التوعية',
      nameEn: 'Advocacy & Campaigns',
      icon: Target,
      descAr: 'بيانات، رسائل إرشادية، وحملات توعوية لتعزيز الحريات الصحفية والدفاع عن الصحفيين.',
      descEn: 'Public affairs, advocacy papers, messages and full scale campaigns for press safety.',
      types: [
        { id: 'advocacy_brief', nameAr: 'موجز مناصرة وحشد كود', nameEn: 'Advocacy Brief', descAr: 'ورقة لحشد الدعم وحماية المعتقلين أو المطالبة بقوانين أفضل.', descEn: 'Policy tool focused on rallying stakeholders for press safety action.' },
        { id: 'policy_brief', nameAr: 'موجز سياسات إعلامية', nameEn: 'Policy Brief', descAr: 'تحليل للسياسات الإعلامية مع طرح مقترحات وتوصيات لصناع القرار.', descEn: 'Objective analysis of systemic regulations with practical recommended shifts.' },
        { id: 'position_paper', nameAr: 'ورقة موقف حقوقية', nameEn: 'Position Paper', descAr: 'بيان موقف رسمي حيال حادثة أو تشريع أو تطور يؤثر على الإعلام.', descEn: 'Clear organizational stance with legal evidence and direct demands.' },
        { id: 'campaign', nameAr: 'حملة إعلامية متكاملة', nameEn: 'Campaign', descAr: 'صفحة هبوط مخصصة لحملة توعوية مع الهوية البصرية وخطة العمل وأزرار التفاعل.', descEn: 'Landing-page campaign platform with branding, timelines, and action calls.' },
        { id: 'key_messages_repository', nameAr: 'مستودع الرسائل الرئيسية للمؤسسة', nameEn: 'Key Messages Repository', descAr: 'الرسائل الأساسية المعتمدة لكل جمهور مستهدف للتنسيق الموحد.', descEn: 'Reference database of pre-approved advocacy messages and taglines.' }
      ]
    },
    {
      id: 'research',
      nameAr: 'الأبحاث والذكاء الإعلامي',
      nameEn: 'Research & Media Intelligence',
      icon: BookOpen,
      descAr: 'تحليلات الرأي العام ومرصد الانتهاكات، والأوراق البحثية، وخرائط التضليل وخطاب الكراهية.',
      descEn: 'Deep sociological research, investigations, fake news logs, and monitoring outputs.',
      types: [
        { id: 'research_report', nameAr: 'تقرير بحثي أو دراسة فكرية', nameEn: 'Research Report', descAr: 'دراسة علمية محكمة مع الملخص والمنهجية والنتائج والملفات الأصلية.', descEn: 'Peer-reviewed style paper with abstract, scientific logs, and downloads.' },
        { id: 'investigative_report', nameAr: 'تحقيق استقصائي معمق', nameEn: 'Investigative Report', descAr: 'تحقيق صحفي استقصائي يكشف حقائق مدعومة بالوثائق والأدلة والخط الزمني.', descEn: 'High-stake investigative report with evidence timeline and leak analysis.' },
        { id: 'needs_assessment', nameAr: 'تقييم الاحتياجات الإعلامية', nameEn: 'Needs Assessment', descAr: 'دراسة ميدانية تسبق المشاريع لمعرفة حاجات الصحفيين والمؤسسات.', descEn: 'Field assessment detailing training, equipment, or protection needs.' },
        { id: 'media_monitoring_report', nameAr: 'تقرير رصد خطاب ومصداقية الصحافة', nameEn: 'Media Monitoring Report', descAr: 'تحليل لتغطية الإعلام، الرصد التليفزيوني، مؤشرات خطاب الكراهية.', descEn: 'Analysis on press freedom violations, television metrics, or clickbaits.' },
        { id: 'public_opinion_analysis', nameAr: 'تحليل اتجاهات الرأي العام لليمنين', nameEn: 'Public Opinion Analysis', descAr: 'استطلاع اتجاهات رأي المواطنين تجاه الإعلام وقضايا المجتمع وحقوق التعبير.', descEn: 'Surveys documenting local attitudes, trends and audience insights.' }
      ]
    },
    {
      id: 'digital',
      nameAr: 'المحتوى الرقمي والتواصل الاجتماعي',
      nameEn: 'Digital Content & Social Media',
      icon: Share2,
      descAr: 'محتوى مخصص للشبكات (منشورات، إنفوجرافيكس تفاعلي، حقائق سريعة وملخصات في ورقة واحدة).',
      descEn: 'Digital-first campaign outputs, social cards, interactive infographics, fact sheets.',
      types: [
        { id: 'social_campaign', nameAr: 'حملة شبكات متكاملة ورزنامة', nameEn: 'Social Media Campaign', descAr: 'خطة وجدول إنتاج المنشورات لعدة منصات مع الهوية وتتبع الأداء.', descEn: 'Meta-campaign system tracking schedules, assets, and overall performance.' },
        { id: 'social_post', nameAr: 'منشور منفرد لشبكة التواصل', nameEn: 'Social Post', descAr: 'مسودة منشور مع محاكي متميز لشكل المنشور المكتمل على فيسبوك وتويتر.', descEn: 'Social post editor with customized Live Facebook and Twitter mockup card previews.' },
        { id: 'infographic', nameAr: 'إنفوجرافيك تفاعلي وأوراق', nameEn: 'Infographic', descAr: 'عرض مرئي للمعلومات مع صانع المخططات والبطاقات والمؤشرات المدمجة.', descEn: 'Eye-catching visual document with dynamic statistics and interactive charts.' },
        { id: 'fact_sheet', nameAr: 'ورقة حقائق سريعة وصادمة', nameEn: 'Fact Sheet', descAr: 'حقائق وأرقام مرقمة مركزة في تصميم سريع للتداول الصحفي.', descEn: 'Bulletproof summary containing key numbers, bullet facts and downloads.' },
        { id: 'one_pager', nameAr: 'ملخص مشروع في صفحة واحدة', nameEn: 'One Pager', descAr: 'ملخص مركز للغاية يعرض فكرة، مشروع، أو واقع في صفحة قياسية واحدة قابلة للتداول.', descEn: 'Brief proposal format matching standard donor single-page specifications.' }
      ]
    }
  ];

  // Load all media products from backend API
  const fetchMediaProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/media-products');
      const formatted = (res.data || []).map((item: any) => {
        let parsedTitle = { ar: '', en: '' };
        try {
          parsedTitle = typeof item.title === 'string' ? JSON.parse(item.title) : item.title;
        } catch {
          parsedTitle = { ar: item.title?.ar || item.title || '', en: item.title?.en || '' };
        }

        let parsedMetadata = {};
        try {
          parsedMetadata = typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata;
        } catch {
          parsedMetadata = item.metadata || {};
        }

        return {
          ...item,
          title: parsedTitle,
          metadata: parsedMetadata
        };
      });
      setMediaProducts(formatted);
    } catch (err) {
      console.error('Failed to fetch media products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMediaProducts();
  }, []);

  // Filter products
  const filteredProducts = mediaProducts.filter(item => {
    const titleMatch = 
      (item.title?.ar?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
      (item.title?.en?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (item.slug || '').toLowerCase().includes(searchTerm.toLowerCase());

    const divisionMatch = filterDivision === 'all' || item.division === filterDivision;
    const typeMatch = filterType === 'all' || item.contentType === filterType;
    const statusMatch = filterStatus === 'all' || item.status === filterStatus;

    return titleMatch && divisionMatch && typeMatch && statusMatch;
  });

  // Start creation of media product
  const handleStartCreation = () => {
    setSelectedDivision('');
    setSelectedType('');
    setViewMode('create_wizard');
  };

  // Select Type in Wizard -> Trigger Editor
  const handleSelectType = (divisionId: string, typeId: string) => {
    setSelectedDivision(divisionId);
    setSelectedType(typeId);
    
    // Set default structure for Selected Content Type
    setFormData({
      titleAr: '',
      titleEn: '',
      slug: '',
      status: 'draft',
      metadata: initDefaultFields(typeId)
    });
    setSelectedProduct(null);
    setViewMode('editor');
  };

  // Initialize fields for custom content types
  const initDefaultFields = (typeId: string): Record<string, any> => {
    const base = {
      summaryAr: '',
      summaryEn: '',
      bodyAr: '',
      bodyEn: '',
      mainImage: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=800',
      heroImage: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=1200',
      gallery: [] as string[],
      downloads: [] as { label: string; url: string }[],
      stats: [] as { labelAr: string; labelEn: string; value: string }[],
      quotes: [] as { textAr: string; textEn: string; authorAr: string; authorEn: string }[],
      timeline: [] as { date: string; eventAr: string; eventEn: string; descAr: string; descEn: string }[],
      citations: [] as string[]
    };

    switch (typeId) {
      case 'success_story':
        return {
          ...base,
          beneficiaryName: '',
          location: '',
          projectName: '',
          beforeSituationAr: '',
          beforeSituationEn: '',
          interventionAr: '',
          interventionEn: '',
          outcomeAr: '',
          outcomeEn: '',
          relatedProjects: ''
        };
      case 'human_interest':
        return {
          ...base,
          subheadlineAr: '',
          subheadlineEn: '',
          beneficiaryProfileAr: '',
          beneficiaryProfileEn: '',
          audioLink: '',
          videoLink: ''
        };
      case 'testimonial':
        return {
          ...base,
          personNameAr: '',
          personNameEn: '',
          personOrganizationAr: '',
          personOrganizationEn: '',
          personRoleAr: '',
          personRoleEn: '',
          photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
          videoLink: ''
        };
      case 'case_study':
        return {
          ...base,
          challengeAr: '',
          challengeEn: '',
          contextAr: '',
          contextEn: '',
          methodologyAr: '',
          methodologyEn: '',
          findingsAr: '',
          findingsEn: '',
          lessonsLearnedAr: '',
          lessonsLearnedEn: '',
          dataVisualizations: []
        };
      case 'documentary_film':
      case 'short_doc':
      case 'success_story_video':
      case 'humanitarian_story_video':
      case 'interview':
        return {
          ...base,
          synopsisAr: '',
          synopsisEn: '',
          videoLink: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          trailerLink: '',
          director: '',
          producer: '',
          runtime: '',
          language: 'العربية / English',
          awardsAr: '',
          awardsEn: '',
          guestName: '',
          guestPosition: '',
          transcriptAr: '',
          transcriptEn: '',
          impactStatementAr: '',
          impactStatementEn: ''
        };
      case 'podcast_episode':
        return {
          ...base,
          audioLink: '',
          episodeNumber: '1',
          seasonNumber: '1',
          hosts: 'أكرم العمودي',
          guests: '',
          transcriptAr: '',
          transcriptEn: '',
          showNotesAr: '',
          showNotesEn: ''
        };
      case 'press_release':
        return {
          ...base,
          datelineAr: 'صنعاء، اليمن',
          datelineEn: 'Sanaa, Yemen',
          mediaContactsAr: 'المكتب الإعلامي - press@ph-ye.org',
          mediaContactsEn: 'Media Office - press@ph-ye.org'
        };
      case 'news_article':
        return {
          ...base,
          reporterAr: '',
          reporterEn: '',
          category: 'local_news',
          mediaAssets: []
        };
      case 'advocacy_brief':
      case 'policy_brief':
      case 'position_paper':
        return {
          ...base,
          issueAr: '',
          issueEn: '',
          keyMessagesAr: '',
          keyMessagesEn: '',
          recommendationsAr: '',
          recommendationsEn: '',
          stakeholdersAr: '',
          stakeholdersEn: ''
        };
      case 'campaign':
        return {
          ...base,
          campaignIdentityAr: '',
          campaignIdentityEn: '',
          objectivesAr: '',
          objectivesEn: '',
          timelineAr: '',
          timelineEn: '',
          ctaLink: '',
          ctaTextAr: 'شارك التضامن',
          ctaTextEn: 'Take Action Now'
        };
      case 'social_post':
        return {
          ...base,
          platform: 'facebook', // facebook, twitter, instagram, linkedin
          captionAr: '',
          captionEn: '',
          hashtags: '#PressHouseYemen #حرية_الصحافة',
          mediaUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=800'
        };
      case 'infographic':
      case 'fact_sheet':
      case 'one_pager':
        return {
          ...base,
          quickFactsAr: '',
          quickFactsEn: '',
          metrics: [] as { key: string; value: string }[],
          chartsDataAr: '',
          chartsDataEn: ''
        };
      default:
        return base;
    }
  };

  // Launch editing of existing product
  const handleEditProduct = (product: any) => {
    setSelectedProduct(product);
    setSelectedDivision(product.division);
    setSelectedType(product.contentType);
    setFormData({
      titleAr: product.title?.ar || '',
      titleEn: product.title?.en || '',
      slug: product.slug || '',
      status: product.status || 'draft',
      metadata: product.metadata || {}
    });
    setViewMode('editor');
  };

  // Update a metadata field
  const updateMetadataField = (field: string, val: any) => {
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [field]: val
      }
    }));
  };

  // Save changes to Database via backend API
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const slugValue = formData.slug || formData.titleEn.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `media-${Date.now()}`;
      
      const payload = {
        id: selectedProduct?.id || undefined,
        division: selectedDivision,
        contentType: selectedType,
        title: { ar: formData.titleAr, en: formData.titleEn },
        slug: slugValue,
        metadata: formData.metadata,
        status: formData.status
      };

      if (selectedProduct) {
        // PUT update
        await api.put(`/api/media-products/${selectedProduct.id}`, payload);
      } else {
        // POST create
        await api.post('/api/media-products', payload);
      }

      setViewMode('list');
      fetchMediaProducts();
    } catch (err) {
      console.error('Failed to save media product:', err);
      alert(isRtl ? 'حدث خطأ أثناء حفظ التحديثات المرجوة.' : 'An error occurred while saving the requested updates.');
    }
  };

  // Delete product
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(isRtl ? `هل أنت متأكد من حذف المنتج "${name}"؟` : `Are you sure you want to delete "${name}"?`)) {
      return;
    }
    try {
      await api.delete(`/api/media-products/${id}`);
      fetchMediaProducts();
    } catch (err) {
      console.error('Failed to delete media product:', err);
    }
  };

  // Quick helper to run AI Assistant generators inside Editor
  const handleCallAI = async () => {
    if (!aiPrompt) return;
    setAiLoading(true);
    setAiResponse('');
    try {
      const fullPrompt = `You are a professional NGO and investigative press agency editor for Yemen Press House (بيت الصحافة اليمني).
Please complete this task for our CMS:
"${aiPrompt}"

Output only the requested text draft. Make sure it is highly professional, objective, journalism style, and tailored to the context. Produce the output in both Arabic and English. Use clear marker tags like [ARABIC] and [ENGLISH] so we can split them if possible, or produce a beautifully completed piece of draft.`;
      
      const res = await api.post('/api/ai/chat', { prompt: fullPrompt });
      setAiResponse(res.data.text || res.data);
    } catch (err: any) {
      console.error('AI call failed:', err);
      setAiResponse(isRtl ? 'عذراً، فشل الاتصال بمزود الذكاء الاصطناعي.' : 'Sorry, failed to communicate with AI model.');
    } finally {
      setAiLoading(false);
    }
  };

  const applyAITextToField = (field: string, text: string) => {
    // Attempt to extract Arabic vs English if markers exist
    let arabicText = text;
    let englishText = text;

    if (text.includes('[ARABIC]') && text.includes('[ENGLISH]')) {
      const arPart = text.split('[ARABIC]')[1]?.split('[ENGLISH]')[0]?.trim();
      const enPart = text.split('[ENGLISH]')[1]?.trim();
      if (arPart) arabicText = arPart;
      if (enPart) englishText = enPart;
    }

    if (field === 'title') {
      setFormData(prev => ({
        ...prev,
        titleAr: arabicText,
        titleEn: englishText
      }));
    } else if (field === 'caption') {
      updateMetadataField('captionAr', arabicText);
      updateMetadataField('captionEn', englishText);
    } else if (field === 'body') {
      updateMetadataField('bodyAr', arabicText);
      updateMetadataField('bodyEn', englishText);
    } else if (field === 'summary') {
      updateMetadataField('summaryAr', arabicText);
      updateMetadataField('summaryEn', englishText);
    } else {
      updateMetadataField(field, text);
    }
    setAiResponse('');
    setAiPrompt('');
  };

  return (
    <div className="space-y-8" id="media-center-root">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
            {isRtl ? 'استديو ومستودع الإعلام الاحترافي' : 'Professional Media Studio & Repository'}
          </div>
          <h1 className="text-3xl font-black font-sans text-slate-900 tracking-tight">
            {isRtl ? 'بيت الصحافة - مركز الإنتاج والنشر' : 'PressHouse Publishing Hub'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {isRtl ? 'إدارة وتطوير قصص النجاح، أفلام الاستقصاء، أوراق السياسات، وتحليلات الرأي العام باليمن.' : 'Design, track, and publish success stories, documentaries, policy briefs, and surveys.'}
          </p>
        </div>

        {viewMode === 'list' && (
          <button 
            onClick={handleStartCreation}
            className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-900 transition-all shadow-lg hover:shadow-xl hover:translate-y-[-1px] cursor-pointer"
            id="btn-trigger-wizard"
          >
            <Plus size={20} />
            <span>{isRtl ? 'إضافة منتج إعلامي متقدم' : 'Create New Media Product'}</span>
          </button>
        )}

        {viewMode !== 'list' && (
          <button 
            onClick={() => setViewMode('list')}
            className="border border-slate-200 text-slate-600 bg-slate-50 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-100 transition-all cursor-pointer"
            id="btn-back-dashboard"
          >
            <ArrowRight size={18} className={isRtl ? '' : 'rotate-180'} />
            <span>{isRtl ? 'العودة للمستودع العام' : 'Back to Repository'}</span>
          </button>
        )}
      </div>

      {/* Main View Manager */}
      <AnimatePresence mode="wait">
        
        {/* LIST VIEW (Main Management Dashboard) */}
        {viewMode === 'list' && (
          <motion.div 
            key="list"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
              {contentDivisions.map(div => {
                const count = mediaProducts.filter(p => p.division === div.id).length;
                const DivIcon = div.icon;
                return (
                  <div key={div.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div className="p-2 bg-slate-50 text-slate-700 rounded-lg">
                        <DivIcon size={20} />
                      </div>
                      <span className="text-2xl font-black text-slate-900">{count}</span>
                    </div>
                    <div className="mt-4">
                      <p className="text-xs font-bold text-slate-800 line-clamp-1">{isRtl ? div.nameAr : div.nameEn}</p>
                      <p className="text-[10px] text-slate-400 font-medium">items logged</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
              <div className="relative">
                <input 
                  type="text"
                  placeholder={isRtl ? 'بحث في العناوين والروابط...' : 'Search titles and slugs...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm font-medium"
                />
                <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
              </div>

              <select
                value={filterDivision}
                onChange={(e) => setFilterDivision(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-semibold text-slate-700"
              >
                <option value="all">{isRtl ? 'كل الأقسام الرئيسية' : 'All Divisions'}</option>
                {contentDivisions.map(div => (
                  <option key={div.id} value={div.id}>{isRtl ? div.nameAr : div.nameEn}</option>
                ))}
              </select>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-semibold text-slate-700"
              >
                <option value="all">{isRtl ? 'كل أنواع المنتجات' : 'All Product Types'}</option>
                {contentDivisions.flatMap(d => d.types).map(t => (
                  <option key={t.id} value={t.id}>{isRtl ? t.nameAr : t.nameEn}</option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-semibold text-slate-700"
              >
                <option value="all">{isRtl ? 'كل الحالات' : 'All Statuses'}</option>
                <option value="published">{isRtl ? 'منشور للعامة' : 'Published'}</option>
                <option value="draft">{isRtl ? 'مسودة داخلية' : 'Draft'}</option>
              </select>

              <button 
                onClick={() => { setSearchTerm(''); setFilterDivision('all'); setFilterType('all'); setFilterStatus('all'); }}
                className="text-xs font-bold text-slate-400 hover:text-blue-600 flex items-center justify-center gap-1.5 cursor-pointer py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
              >
                <RefreshCw size={12} />
                <span>{isRtl ? 'إعادة التعيين' : 'Clear Filters'}</span>
              </button>
            </div>

            {/* Products Table/List */}
            {loading ? (
              <div className="bg-white py-20 rounded-2xl flex flex-col items-center justify-center border border-slate-100">
                <Loader2 className="animate-spin text-blue-600 mb-3" size={40} />
                <p className="text-slate-400 text-sm font-bold">{isRtl ? 'جاري تحميل مستودع الإنتاج المتقدم...' : 'Fetching advanced media products...'}</p>
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-start">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-extrabold border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4">{isRtl ? 'المنتج والمحتوى' : 'Media Product'}</th>
                        <th className="px-6 py-4">{isRtl ? 'القسم والعائلة الكبرى' : 'Division'}</th>
                        <th className="px-6 py-4">{isRtl ? 'النوع الفرعي' : 'Subtype'}</th>
                        <th className="px-6 py-4">{isRtl ? 'تاريخ الإنشاء' : 'Created At'}</th>
                        <th className="px-6 py-4">{isRtl ? 'الحالة' : 'Status'}</th>
                        <th className="px-6 py-4 text-center">{isRtl ? 'إجراءات ومحرر' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredProducts.map(p => {
                        const divisionInfo = contentDivisions.find(d => d.id === p.division);
                        const typeInfo = divisionInfo?.types?.find(t => t.id === p.contentType);
                        const ProductIcon = divisionInfo?.icon || FileText;

                        return (
                          <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold text-sm">
                                  <ProductIcon size={18} />
                                </div>
                                <div className="max-w-[320px]">
                                  <div className="font-extrabold text-slate-900 line-clamp-1">
                                    {p.title?.[isRtl ? 'ar' : 'en'] || p.title?.ar || p.title?.en || 'Untitled'}
                                  </div>
                                  <div className="text-xs text-slate-400 font-mono mt-0.5 line-clamp-1 select-all hover:text-blue-600">
                                    /{p.division}/{p.contentType}/{p.slug}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-xs font-extrabold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                                {isRtl ? divisionInfo?.nameAr : divisionInfo?.nameEn}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-xs font-bold text-slate-600 bg-blue-50/50 text-blue-800 px-2 py-1 rounded-lg border border-blue-100">
                                {isRtl ? typeInfo?.nameAr : typeInfo?.nameEn}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400 font-mono">
                              {new Date(p.createdAt).toLocaleDateString(isRtl ? 'ar-YE' : 'en-US')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                p.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {p.status === 'published' ? (isRtl ? 'منشور للجريدة' : 'Published') : (isRtl ? 'مسودة' : 'Draft')}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <div className="flex items-center justify-center gap-2">
                                {p.status === 'published' && p.slug && (
                                  <a 
                                    href={getProductUrl(p.contentType, p.slug)}
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer inline-flex items-center"
                                    title={isRtl ? 'عرض المادة المنشورة علناً' : 'View live published page'}
                                  >
                                    <Eye size={16} />
                                  </a>
                                )}
                                <button 
                                  onClick={() => handleEditProduct(p)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                  title={isRtl ? 'تحرير المادة والوسائط' : 'Edit content'}
                                >
                                  <Edit3 size={16} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteProduct(p.id, p.title?.[isRtl ? 'ar' : 'en'] || p.title?.ar || '')}
                                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title={isRtl ? 'حذف من المستودع' : 'Delete item'}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white py-16 rounded-2xl border border-slate-100 text-center shadow-xs">
                <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FileText size={24} />
                </div>
                <h3 className="font-bold text-slate-800 text-base">{isRtl ? 'لا توجد منتجات إعلامية مطابقة بعد' : 'No matching media products found'}</h3>
                <p className="text-slate-400 text-xs mt-1">{isRtl ? 'أنشئ أول مادة صحفية أو دراسة بضغط زر الإضافة.' : 'Create your first journalistic story, document, or assessment.'}</p>
              </div>
            )}

            {/* Media Ecosystem Guide Banner */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Sparkles className="text-amber-400" size={18} />
                  {isRtl ? 'مرونة نشر قصوى وغرفة تحرير مدعومة بالذكاء الاصطناعي' : 'Maximum flexibility with AI-powered publishing ecosystem'}
                </h2>
                <p className="text-xs text-slate-300 max-w-[700px]">
                  {isRtl 
                    ? 'هذا النظام يتيح تكييف الحقول لمطابقة متطلبات الجهات المانحة والمؤسسات التنموية الدولية وتوليد التنسيقات مخصصة للأجهزة المتنقلة.' 
                    : 'Configure dynamic schemas compliant with international donors requirements, generate rapid policy recommendations and social layouts.'}
                </p>
              </div>
              <button 
                onClick={handleStartCreation}
                className="bg-white text-slate-900 px-5 py-2.5 rounded-xl font-extrabold text-xs hover:bg-slate-100 transition-colors flex-shrink-0 cursor-pointer"
              >
                {isRtl ? 'جرب إضافة مادة إعلامية الآن' : 'Add Strategic Product Now'}
              </button>
            </div>

          </motion.div>
        )}

        {/* CREATE WIZARD (Step 1 & 2 Choice Selection) */}
        {viewMode === 'create_wizard' && (
          <motion.div 
            key="wizard"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-8"
          >
            <div className="text-center max-w-xl mx-auto space-y-2">
              <h2 className="text-2xl font-black text-slate-900">{isRtl ? 'منشئ المحتوى المتخصص للصحافة والمنظمات' : 'Custom Editorial Launch Wizard'}</h2>
              <p className="text-slate-500 text-sm">{isRtl ? 'اختر قسماً رئيسياً ثم حدد نوع المادة الإعلامية المراد بناؤها بخصائص حصرية.' : 'Select a general media category division, then select a dedicated content type.'}</p>
            </div>

            {/* Division Cards Step */}
            {!selectedDivision ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {contentDivisions.map(div => {
                  const DivIcon = div.icon;
                  return (
                    <div 
                      key={div.id} 
                      onClick={() => setSelectedDivision(div.id)}
                      className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer group flex flex-col justify-between text-start"
                    >
                      <div>
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <DivIcon size={24} />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 mt-4 group-hover:text-blue-600 transition-colors">{isRtl ? div.nameAr : div.nameEn}</h3>
                        <p className="text-xs text-slate-400 mt-2 line-clamp-3">{isRtl ? div.descAr : div.descEn}</p>
                      </div>
                      <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center text-xs font-bold text-slate-500 group-hover:text-blue-600 select-none">
                        <span>{isRtl ? `${div.types.length} أنواع فرعية` : `${div.types.length} specialized kinds`}</span>
                        <ArrowRight size={16} className={`group-hover:translate-x-1 transition-transform ${isRtl ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Step 2: Content types of selected division
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-slate-100 p-4 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">{isRtl ? 'القسم المختار:' : 'Selected Division:'}</span>
                    <span className="text-xs font-black text-slate-800">{isRtl ? contentDivisions.find(d => d.id === selectedDivision)?.nameAr : contentDivisions.find(d => d.id === selectedDivision)?.nameEn}</span>
                  </div>
                  <button 
                    onClick={() => setSelectedDivision('')}
                    className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    {isRtl ? 'تغيير القسم' : 'Change Division'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {contentDivisions.find(d => d.id === selectedDivision)?.types.map(t => (
                    <div 
                      key={t.id}
                      onClick={() => handleSelectType(selectedDivision, t.id)}
                      className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:border-blue-300 cursor-pointer transition-all flex flex-col justify-between text-start"
                    >
                      <div>
                        <h4 className="text-base font-extrabold text-slate-900">{isRtl ? t.nameAr : t.nameEn}</h4>
                        <p className="text-xs text-slate-400 mt-1">{isRtl ? t.descAr : t.descEn}</p>
                      </div>
                      <div className="mt-8 flex justify-end">
                        <span className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-blue-50">
                          <Plus size={14} />
                          {isRtl ? 'فتح المحرر المخصص' : 'Open Custom Editor'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ADVANCED MULTI-PANE EDITOR WIZARD & IMMERSIVE LIVE PREVIEW */}
        {viewMode === 'editor' && (
          <motion.div 
            key="editor"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 xl:grid-cols-12 gap-8"
          >
            
            {/* Left Pane: Multi-step Form & AI studio (Column Span 6) */}
            <div className="xl:col-span-6 space-y-6">
              
              <form onSubmit={handleSaveProduct} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden text-start">
                
                {/* Editor Header info */}
                <div className="bg-slate-900 text-white p-6">
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                    {isRtl ? 'استديو تحرير تفاعلي مخصص لـ:' : 'Specialized Editing Studio For:'}
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <h2 className="text-xl font-black">
                      {isRtl 
                        ? contentDivisions.find(d => d.id === selectedDivision)?.types.find(t => t.id === selectedType)?.nameAr 
                        : contentDivisions.find(d => d.id === selectedDivision)?.types.find(t => t.id === selectedType)?.nameEn}
                    </h2>
                    <span className="text-xs font-bold text-slate-300 bg-slate-800 px-2.5 py-1 rounded-md">
                      { (selectedType || '').toUpperCase() }
                    </span>
                  </div>
                </div>

                {/* Main Inputs tabbed */}
                <div className="p-6 space-y-6">
                  
                  {/* Common Titles & Slugs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">{isRtl ? 'العنوان بالعربية *' : 'Title Arabic *'}</label>
                      <input 
                        type="text" 
                        required
                        value={formData.titleAr}
                        onChange={(e) => setFormData({...formData, titleAr: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-extrabold text-sm"
                        placeholder="العنوان الرنان للمادة..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">{isRtl ? 'العنوان بالإنجليزية *' : 'Title English *'}</label>
                      <input 
                        type="text" 
                        required
                        value={formData.titleEn}
                        onChange={(e) => setFormData({...formData, titleEn: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-extrabold text-sm"
                        placeholder="Immersive English title..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Slug (الرابط الدائم)</label>
                      <input 
                        type="text" 
                        value={formData.slug}
                        onChange={(e) => setFormData({...formData, slug: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-xs font-mono text-slate-500"
                        placeholder="e.g. general-ngo-success-story-2026"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">{isRtl ? 'الحالة في الموقع' : 'Publishing Status'}</label>
                      <select 
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-semibold"
                      >
                        <option value="draft">{isRtl ? 'مسودة داخلية لحين المراجعة' : 'Draft / Internal'}</option>
                        <option value="published">{isRtl ? 'منشور علني مباشر' : 'Published / Live'}</option>
                      </select>
                    </div>
                  </div>

                  {/* CUSTOM FIELD RENDERING ENGINE BY PRODUCT TYPE */}
                  <div className="border-t border-slate-100 pt-6 space-y-6">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                      {isRtl ? 'المعطيات والحقول المخصصة للنوع' : 'Dedicated Type Variables'}
                    </h3>

                    {/* Success story layout */}
                    {selectedType === 'success_story' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">{isRtl ? 'اسم المستفيد' : 'Beneficiary Name'}</label>
                            <input 
                              type="text" 
                              value={formData.metadata.beneficiaryName || ''}
                              onChange={(e) => updateMetadataField('beneficiaryName', e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">{isRtl ? 'الموقع الجغرافي' : 'Location'}</label>
                            <input 
                              type="text" 
                              value={formData.metadata.location || ''}
                              onChange={(e) => updateMetadataField('location', e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">{isRtl ? 'اسم المشروع التابع' : 'Project Name'}</label>
                            <input 
                              type="text" 
                              value={formData.metadata.projectName || ''}
                              onChange={(e) => updateMetadataField('projectName', e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">{isRtl ? 'الوضع قبل التدخل (بالعربية)' : 'Situation Before (Ar)'}</label>
                          <textarea 
                            value={formData.metadata.beforeSituationAr || ''}
                            onChange={(e) => updateMetadataField('beforeSituationAr', e.target.value)}
                            rows={3}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">{isRtl ? 'التدخل المنفذ ونوعه (بالعربية)' : 'Intervention Done (Ar)'}</label>
                          <textarea 
                            value={formData.metadata.interventionAr || ''}
                            onChange={(e) => updateMetadataField('interventionAr', e.target.value)}
                            rows={3}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">{isRtl ? 'النتائج النهائية والأثر (بالعربية)' : 'Results & Outcome (Ar)'}</label>
                          <textarea 
                            value={formData.metadata.outcomeAr || ''}
                            onChange={(e) => updateMetadataField('outcomeAr', e.target.value)}
                            rows={3}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                          />
                        </div>
                      </div>
                    )}

                    {/* Testimonial fields */}
                    {selectedType === 'testimonial' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">{isRtl ? 'اسم صاحب الشهادة (بالعربية)' : 'Name (Ar)'}</label>
                            <input 
                              type="text" 
                              value={formData.metadata.personNameAr || ''}
                              onChange={(e) => updateMetadataField('personNameAr', e.target.value)}
                              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">{isRtl ? 'اسم الجهة/المؤسسة (بالعربية)' : 'Organization (Ar)'}</label>
                            <input 
                              type="text" 
                              value={formData.metadata.personOrganizationAr || ''}
                              onChange={(e) => updateMetadataField('personOrganizationAr', e.target.value)}
                              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">{isRtl ? 'نص الشهادة والبيان (بالعربية)' : 'Testimonial Text (Ar)'}</label>
                          <textarea 
                            value={formData.metadata.bodyAr || ''}
                            onChange={(e) => updateMetadataField('bodyAr', e.target.value)}
                            rows={4}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">{isRtl ? 'رابط الصورة الشخصية' : 'Photo URL'}</label>
                            <input 
                              type="text" 
                              value={formData.metadata.photoUrl || ''}
                              onChange={(e) => updateMetadataField('photoUrl', e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">{isRtl ? 'رابط الفيديو المرجعي إن وجد' : 'Video URL'}</label>
                            <input 
                              type="text" 
                              value={formData.metadata.videoLink || ''}
                              onChange={(e) => updateMetadataField('videoLink', e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Documentary Video fields */}
                    {['documentary_film', 'short_doc', 'success_story_video', 'humanitarian_story_video', 'interview'].includes(selectedType) && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">{isRtl ? 'رابط الفيديو الكامل (YouTube / Vimeo)' : 'Full Video URL'}</label>
                            <input 
                              type="text" 
                              value={formData.metadata.videoLink || ''}
                              onChange={(e) => updateMetadataField('videoLink', e.target.value)}
                              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">{isRtl ? 'المخرج' : 'Director'}</label>
                            <input 
                              type="text" 
                              value={formData.metadata.director || ''}
                              onChange={(e) => updateMetadataField('director', e.target.value)}
                              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">{isRtl ? 'المنتج المنفذ' : 'Producer'}</label>
                            <input 
                              type="text" 
                              value={formData.metadata.producer || ''}
                              onChange={(e) => updateMetadataField('producer', e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">{isRtl ? 'زمن التشغيل' : 'Runtime'}</label>
                            <input 
                              type="text" 
                              value={formData.metadata.runtime || ''}
                              placeholder="e.g. 24 mins"
                              onChange={(e) => updateMetadataField('runtime', e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">{isRtl ? 'اللغة' : 'Language'}</label>
                            <input 
                              type="text" 
                              value={formData.metadata.language || ''}
                              onChange={(e) => updateMetadataField('language', e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">{isRtl ? 'الملخص السينمائي للمادة (بالعربية)' : 'Synopsis (Ar)'}</label>
                          <textarea 
                            value={formData.metadata.synopsisAr || ''}
                            onChange={(e) => updateMetadataField('synopsisAr', e.target.value)}
                            rows={3}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                          />
                        </div>
                      </div>
                    )}

                    {/* Press release layout */}
                    {selectedType === 'press_release' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">{isRtl ? 'خط التاريخ باللغة العربية' : 'Dateline Arabic'}</label>
                            <input 
                              type="text" 
                              value={formData.metadata.datelineAr || ''}
                              onChange={(e) => updateMetadataField('datelineAr', e.target.value)}
                              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">{isRtl ? 'خط التاريخ بالإنجليزية' : 'Dateline English'}</label>
                            <input 
                              type="text" 
                              value={formData.metadata.datelineEn || ''}
                              onChange={(e) => updateMetadataField('datelineEn', e.target.value)}
                              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">{isRtl ? 'الملخص الاستباقي للبيان (العربية)' : 'Summary (Ar)'}</label>
                          <textarea 
                            value={formData.metadata.summaryAr || ''}
                            onChange={(e) => updateMetadataField('summaryAr', e.target.value)}
                            rows={3}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">{isRtl ? 'المتن الأساسي للخبر الصحفي (العربية)' : 'Press Body (Ar)'}</label>
                          <textarea 
                            value={formData.metadata.bodyAr || ''}
                            onChange={(e) => updateMetadataField('bodyAr', e.target.value)}
                            rows={6}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">{isRtl ? 'جهات الاتصال للإعلام الفوري' : 'Media Contacts'}</label>
                            <input 
                              type="text" 
                              value={formData.metadata.mediaContactsAr || ''}
                              onChange={(e) => updateMetadataField('mediaContactsAr', e.target.value)}
                              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Social Post layout */}
                    {selectedType === 'social_post' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">{isRtl ? 'المستهدف على شبكة:' : 'Target Platform'}</label>
                            <select 
                              value={formData.metadata.platform || 'facebook'}
                              onChange={(e) => updateMetadataField('platform', e.target.value)}
                              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                            >
                              <option value="facebook">Facebook (فيسبوك)</option>
                              <option value="twitter">X / Twitter (تويتر سابقاً)</option>
                              <option value="instagram">Instagram (انستغرام)</option>
                              <option value="linkedin">LinkedIn (لينكد إن)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">{isRtl ? 'رابط الوسائط المرفقة للمنشور' : 'Attachment Media URL'}</label>
                            <input 
                              type="text" 
                              value={formData.metadata.mediaUrl || ''}
                              onChange={(e) => updateMetadataField('mediaUrl', e.target.value)}
                              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">{isRtl ? 'نص المنشور (بالعربية)' : 'Caption / Text (Ar)'}</label>
                          <textarea 
                            value={formData.metadata.captionAr || ''}
                            onChange={(e) => updateMetadataField('captionAr', e.target.value)}
                            rows={4}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                            placeholder="اكتب شيئاً مؤثراً..."
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">{isRtl ? 'الوسوم والهاشتاجات المتبناة للمناصرة' : 'Hashtags'}</label>
                          <input 
                            type="text" 
                            value={formData.metadata.hashtags || ''}
                            onChange={(e) => updateMetadataField('hashtags', e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-blue-600"
                          />
                        </div>
                      </div>
                    )}

                    {/* Advocacy Policy brief layout */}
                    {['advocacy_brief', 'policy_brief', 'position_paper'].includes(selectedType) && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">{isRtl ? 'طبيعة المشكلة أو التحدي المرصود (العربية)' : 'Core Issue (Ar)'}</label>
                          <textarea 
                            value={formData.metadata.issueAr || ''}
                            onChange={(e) => updateMetadataField('issueAr', e.target.value)}
                            rows={3}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">{isRtl ? 'الرسائل الرئيسية والبيانات الداعمة (العربية)' : 'Key Messages (Ar)'}</label>
                          <textarea 
                            value={formData.metadata.keyMessagesAr || ''}
                            onChange={(e) => updateMetadataField('keyMessagesAr', e.target.value)}
                            rows={3}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">{isRtl ? 'التوصيات الموجهة لصناع القرار (العربية)' : 'Policy Recommendations (Ar)'}</label>
                          <textarea 
                            value={formData.metadata.recommendationsAr || ''}
                            onChange={(e) => updateMetadataField('recommendationsAr', e.target.value)}
                            rows={4}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    )}

                    {/* General default or fallbacks */}
                    {!['success_story', 'testimonial', 'documentary_film', 'short_doc', 'press_release', 'social_post', 'advocacy_brief', 'policy_brief', 'position_paper'].includes(selectedType) && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">{isRtl ? 'الملخص التعريفي للمادة (العربية)' : 'Abstract / Summary (Ar)'}</label>
                          <textarea 
                            value={formData.metadata.summaryAr || ''}
                            onChange={(e) => updateMetadataField('summaryAr', e.target.value)}
                            rows={3}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">{isRtl ? 'المحتوى أو التقارير الكاملة (العربية)' : 'Main Body/Content (Ar)'}</label>
                          <textarea 
                            value={formData.metadata.bodyAr || ''}
                            onChange={(e) => updateMetadataField('bodyAr', e.target.value)}
                            rows={6}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    )}

                  </div>

                  {/* ACTION CARD: DYNAMIC ASSETS (STATISTICS, TIMELINES AND DOWNLOAD MANAGER) */}
                  <div className="border-t border-slate-100 pt-6 space-y-6">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'مكونات مرئية وتفاعلية إضافية ومستندات' : 'Interactive Add-ons & Documents'}</h4>
                    
                    {/* Modular Assets Selection and Upload */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <label className="block text-xs font-bold text-slate-700 uppercase">{isRtl ? 'المجهر والرفع المركزي للملفات (Supabase/الخادم)' : 'Central File Storage Upload & Inject'}</label>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400">{isRtl ? 'حقن الرابط في:' : 'Inject URL to:'}</span>
                          <select 
                            value={formData.metadata.assetTargetField || 'heroImage'} 
                            onChange={(e) => updateMetadataField('assetTargetField', e.target.value)}
                            className="bg-white border border-slate-200 rounded px-2 py-0.5 text-[10px] font-bold text-slate-700"
                          >
                            <option value="heroImage">{isRtl ? 'بوستر الخلفية (heroImage)' : 'Hero Image'}</option>
                            <option value="mainImage">{isRtl ? 'الصورة المصغرة (mainImage)' : 'Thumbnail'}</option>
                            <option value="audioLink">{isRtl ? 'ملف الصوت / البودكاست (audioLink)' : 'Audio Link'}</option>
                            <option value="videoLink">{isRtl ? 'رابط الفيديو (videoLink)' : 'Video Link'}</option>
                          </select>
                        </div>
                      </div>

                      <AssetManagement 
                        currentValue={formData.metadata[formData.metadata.assetTargetField || 'heroImage'] || ''}
                        allowedTypes="all"
                        onSelectAsset={(url) => {
                          const target = formData.metadata.assetTargetField || 'heroImage';
                          updateMetadataField(target, url);
                        }}
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">{isRtl ? 'الرابط النشط المختار حالياً' : 'Current Active Target URL'}</label>
                          <input 
                            type="text" 
                            readOnly
                            value={formData.metadata[formData.metadata.assetTargetField || 'heroImage'] || ''}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-blue-600 outline-none"
                            placeholder="Selected asset url..."
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">{isRtl ? 'رابط الخلفية الإجرائية الفعلي' : 'Actual Hero Image'}</label>
                          <input 
                            type="text" 
                            value={formData.metadata.heroImage || ''}
                            onChange={(e) => updateMetadataField('heroImage', e.target.value)}
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Specialized statistics builder */}
                    {['success_story', 'infographic', 'fact_sheet', 'research_report', 'one_pager', 'annual_report'].includes(selectedType) && (
                      <StatisticsCardsBuilder 
                        stats={formData.metadata.stats || []}
                        onChange={(stats) => updateMetadataField('stats', stats)}
                      />
                    )}

                    {/* Specialized timeline builder */}
                    {['investigative_report', 'campaign', 'social_campaign', 'case_study'].includes(selectedType) && (
                      <TimelineBuilder 
                        timeline={formData.metadata.timeline || []}
                        onChange={(timeline) => updateMetadataField('timeline', timeline)}
                      />
                    )}
                  </div>

                </div>

                {/* Submit Action */}
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
                  <button 
                    type="button"
                    onClick={() => setViewMode('list')}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    {isRtl ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2 rounded-xl text-xs font-black bg-blue-600 text-white hover:bg-slate-900 transition-colors shadow-lg cursor-pointer"
                  >
                    {isRtl ? 'حفظ المادة ونشرها' : 'Publish Product'}
                  </button>
                </div>

              </form>

              {/* INTEGRATED CO-EDITION AI WRITING ASSISTANT */}
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 shadow-xs text-start space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">{isRtl ? 'استديو الذكاء الاصطناعي المدمج' : 'Embedded AI Editorial Studio'}</h4>
                    <p className="text-[10px] text-slate-400">{isRtl ? 'صمم العناوين، صغ قصصاً مترجمة، أو صمم رسائل حملة فورية.' : 'Translate narratives, outline tweets, or build policy results.'}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <textarea 
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    rows={2}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none"
                    placeholder={isRtl 
                      ? 'مثال: اكتب منشور فيسبوك تفاعلي وجذاب لدعم الصحفيات المعتقلات استناداً لعناصر الحملة المكتوبة' 
                      : 'Example: Draft an immersive human story outline based on this beneficiary...'
                    }
                  />

                  {/* Suggest Quick Action Prompts */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <button 
                      type="button"
                      onClick={() => setAiPrompt(isRtl ? 'صغ عنوان رنان بلغة عربية صحفية ممتازة وتغلب عليها النبرة الإنسانية' : 'Draft a highly compelling journalistic headline in Arabic')}
                      className="px-2 py-1 bg-white hover:bg-blue-50 hover:text-blue-600 text-[10px] text-slate-500 rounded-md border border-slate-200 transition-colors cursor-pointer"
                    >
                      💡 {isRtl ? 'توليد لقطة عنوان' : 'Draft Title'}
                    </button>
                    <button 
                      type="button"
                      onClick={() => setAiPrompt(isRtl ? 'ترجم هذه المخطوطات والملخص إلى لغة إنكليزية احترافية مطابقة لأسلوب الأمم المتحدة والمانحين' : 'Translate and optimize text into high standard professional NGO donor style English')}
                      className="px-2 py-1 bg-white hover:bg-blue-50 hover:text-blue-600 text-[10px] text-slate-500 rounded-md border border-slate-200 transition-colors cursor-pointer"
                    >
                      🌍 {isRtl ? 'ترجمة للمانحين' : 'Donor translation'}
                    </button>
                    <button 
                      type="button"
                      onClick={() => setAiPrompt(isRtl ? 'رتب هذا النص في شكل قصة نجاح كلاسيكية: الوضع قبل التدخل، المنهجية التي اتبعناها، والنتائج الاستثنائية' : 'Structure my draft into a standard Success Story timeline style')}
                      className="px-2 py-1 bg-white hover:bg-blue-50 hover:text-blue-600 text-[10px] text-slate-500 rounded-md border border-slate-200 transition-colors cursor-pointer"
                    >
                      📝 {isRtl ? 'هيكلة قصة نجاح' : 'Success Outline'}
                    </button>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400">{isRtl ? 'حقل الوجهة لتفريغ النتيجة:' : 'Apply output directly to:'}</span>
                      <select 
                        value={selectedFieldForAI} 
                        onChange={(e) => setSelectedFieldForAI(e.target.value)}
                        className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] text-slate-700 font-bold"
                      >
                        <option value="body">{isRtl ? 'متن القصة / البيان' : 'Story Body'}</option>
                        <option value="title">{isRtl ? 'العناوين المزدوجة' : 'Title Fields'}</option>
                        <option value="summary">{isRtl ? 'الخلاصة / الأثر' : 'Abstract'}</option>
                        <option value="caption">{isRtl ? 'المنشور وشبكات التواصل' : 'Social Post'}</option>
                      </select>
                    </div>

                    <button 
                      type="button"
                      onClick={handleCallAI}
                      disabled={aiLoading}
                      className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-blue-600 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      {aiLoading ? <Loader2 className="animate-spin" size={12} /> : <Send size={12} />}
                      <span>{isRtl ? 'استعن بالمساعد الذكي' : 'Generate'}</span>
                    </button>
                  </div>

                  {aiResponse && (
                    <div className="bg-white p-4 rounded-xl border border-blue-100 text-xs text-slate-700 space-y-3 shadow-xs">
                      <div className="flex justify-between items-center text-slate-400 pb-2 border-b border-slate-100">
                        <span className="font-bold flex items-center gap-1"><Sparkles size={12} className="text-amber-500" /> {isRtl ? 'رأي واقتراحات مساعد التحرير الأكاديمي:' : 'AI Suggestions:'}</span>
                        <button 
                          onClick={() => applyAITextToField(selectedFieldForAI || 'body', aiResponse)}
                          className="text-blue-600 hover:underline font-extrabold"
                        >
                          📥 {isRtl ? 'إدراج فوري للمحتوى' : 'Insert Content'}
                        </button>
                      </div>
                      <div className="whitespace-pre-line font-medium leading-relaxed max-h-[250px] overflow-y-auto">
                        {aiResponse}
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Right Pane: Specialized Live Screen Mockup (Column Span 6) */}
            <div className="xl:col-span-6 space-y-6">
              
              <div className="bg-slate-100 p-3 rounded-2xl flex items-center gap-2 select-none border border-slate-200">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[10px] font-extrabold text-slate-500 flex items-center gap-1.5">
                  <Eye size={12} />
                  {isRtl ? 'محاكاة حية للمنتج على الموقع والهواتف للعامة' : 'MOCKUP / PUBLIC IMMERSIVE LIVE PREVIEW'}
                </span>
              </div>

              {/* LIVE DEMO RENDERING BOX */}
              <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl overflow-hidden text-start min-h-[600px] flex flex-col justify-between">
                
                {/* 1. Header Hero Panel Preview */}
                <div 
                  className="relative h-64 bg-slate-800 flex flex-col justify-end p-8 text-white bg-cover bg-center transition-all duration-300"
                  style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.85)), url(${formData.metadata.heroImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=800'})` }}
                >
                  <div className="absolute top-6 left-6 flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] text-white font-black">
                    <span>{isRtl ? 'المعاينة الحية' : 'Live Preview'}</span>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-600 text-white font-black uppercase text-center">
                      {selectedType}
                    </span>
                    <h2 className="text-xl md:text-2xl font-black leading-tight tracking-tight">
                      {formData.titleAr || (isRtl ? 'عنوان المنتج المكتوب سيظهر هنا' : 'Your Arabic product title will show here')}
                    </h2>
                    {formData.titleEn && (
                      <p className="text-xs text-slate-300 font-bold tracking-tight">
                        {formData.titleEn}
                      </p>
                    )}
                  </div>
                </div>

                {/* 2. Body Area customized by Type */}
                <div className="p-8 flex-1 bg-white space-y-6">
                  
                  {/* TYPE: SUCCESS STORY PREVIEW */}
                  {selectedType === 'success_story' && (
                    <div className="space-y-6">
                      
                      {/* Summary box and core details */}
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 text-center">
                          <p className="text-[10px] text-slate-400 font-bold">{isRtl ? 'المستفيد الرئيس' : 'Beneficiary'}</p>
                          <p className="text-sm font-black text-slate-800 mt-1">{formData.metadata.beneficiaryName || 'سالم عبد الرحمن'}</p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 text-center">
                          <p className="text-[10px] text-slate-400 font-bold">{isRtl ? 'المحافظة المحتضنة' : 'Governorate'}</p>
                          <p className="text-sm font-black text-slate-800 mt-1">{formData.metadata.location || 'تعز، اليمن'}</p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 text-center">
                          <p className="text-[10px] text-slate-400 font-bold">{isRtl ? 'المشروع المهيكل' : 'Associated Project'}</p>
                          <p className="text-sm font-black text-blue-600 mt-1">{formData.metadata.projectName || 'الأصوات الصحفية المستقلة'}</p>
                        </div>
                      </div>

                      {/* Before situation and Intervention */}
                      <div className="space-y-4">
                        <div className="border-l-4 border-amber-400 pl-4 pr-1">
                          <h4 className="text-xs font-black text-amber-600">{isRtl ? 'قبل تدخل بيت الصحافة:' : 'Before Intervention:'}</h4>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            {formData.metadata.beforeSituationAr || 'كان يعاني الصحفيون المحليون في المنطقة من شلل في الحصول على المعدات وأدوات السلامة المهنية لحماية وتغطية الأوضاع الميدانية الصعبة.'}
                          </p>
                        </div>

                        <div className="border-l-4 border-blue-500 pl-4 pr-1">
                          <h4 className="text-xs font-black text-blue-600">{isRtl ? 'التدخل وبناء القدرات:' : 'The Integrated Intervention:'}</h4>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            {formData.metadata.interventionAr || 'قدم بيت الصحافة دورات حماية قانونية وسترات حماية ودعماً مالياً لتأسيس غرفة تحرير رقمية مهنية آمنة.'}
                          </p>
                        </div>

                        <div className="border-l-4 border-emerald-500 pl-4 pr-1">
                          <h4 className="text-xs font-black text-emerald-600">{isRtl ? 'الأثر المحقق والنتائج المباشرة:' : 'Results & Impact:'}</h4>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            {formData.metadata.outcomeAr || 'مكّن التدخل الصحفيين من معاودة البث وإنشاء 4 تحقيقات حثيثة كشفت عن انتهاكات واحتكرت الاهتمام العالمي بالإعلام اليمني.'}
                          </p>
                        </div>
                      </div>

                      {/* Mockup Quote inside Story */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex gap-3 relative overflow-hidden">
                        <Quote className="absolute right-3 top-3 text-blue-500/10" size={60} />
                        <div className="relative">
                          <p className="text-xs font-bold italic text-slate-700 leading-relaxed">
                            "لم يكن بإمكاني الاستمرار لولا الدعم الذي وفر سلامتي الشخصية وحريتي لتوثيق الكفاح المهني لزملائي."
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold mt-2">— {formData.metadata.beneficiaryName || 'سالم عبد الرحمن'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TYPE: TESTIMONIAL PREVIEW */}
                  {selectedType === 'testimonial' && (
                    <div className="flex flex-col items-center justify-center py-10 space-y-4 max-w-md mx-auto text-center">
                      <div className="w-20 h-20 rounded-full border-2 border-blue-600 overflow-hidden shadow-md">
                        <img 
                          src={formData.metadata.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300'} 
                          alt="" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      
                      <div className="relative">
                        <Quote className="text-blue-500/15 mx-auto" size={40} />
                        <p className="text-sm font-bold text-slate-800 leading-relaxed italic px-4 mt-2">
                          "{formData.metadata.bodyAr || 'البرامج التقنية والتحفيزية التي تشرف عليها مؤسسة بيت الصحافة أسهمت بفاعلية في تمكين الجيل الجديد من الصحفيين الاستقصائيين وسد الفجوة في إذكاء الشفافية والوعي المدني في اليمن.'}"
                        </p>
                      </div>

                      <div className="space-y-0.5 pt-2">
                        <p className="text-xs font-black text-slate-900">{formData.metadata.personNameAr || 'أ. سارة الكثيري'}</p>
                        <p className="text-[10px] text-slate-400 font-bold">
                          {formData.metadata.personRoleAr || 'مستشار حريات التعبير'} @ {formData.metadata.personOrganizationAr || 'منظمة الشفافية الوطنية'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* TYPE: PLATFORM FEED MOCKUP PREVIEW */}
                  {selectedType === 'social_post' && (
                    <div className="space-y-6">
                      
                      {/* Social Platform Toggle Card preview */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-4 font-sans text-xs">
                        
                        {/* Top Profile block */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-xs">
                              PH
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-900 text-[10px]">بيت الصحافة - اليمن | PressHouse</p>
                              <p className="text-[9px] text-slate-400 mt-0.5 flex items-center gap-1">
                                <Calendar size={10} />
                                {isRtl ? 'الآن على شبكتنا المعتمدة' : 'Just now on official feed'}
                              </p>
                            </div>
                          </div>
                          <span className="text-[9px] bg-blue-100 text-blue-600 font-bold px-2 py-0.5 rounded-full uppercase">
                            {formData.metadata.platform || 'facebook'}
                          </span>
                        </div>

                        {/* Content text */}
                        <div className="space-y-2">
                          <p className="text-slate-800 leading-relaxed font-semibold">
                            {formData.metadata.captionAr || 'يسعدنا الكشف عن الأرقام التوثيقية المريعة لحملة حريات التعبير للعام 2026 ودعم الزملاء المعتقلين في شتى البقاع اليمنية.'}
                          </p>
                          <p className="text-blue-600 font-black">
                            {formData.metadata.hashtags || '#PressHouseYemen #حرية_الصحافة'}
                          </p>
                        </div>

                        {/* Attached Image inside Social Feed */}
                        {formData.metadata.mediaUrl && (
                          <div className="rounded-xl overflow-hidden border border-slate-150 max-h-48">
                            <img 
                              src={formData.metadata.mediaUrl} 
                              alt="Post attach" 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}

                        {/* Social Interaction Buttons Mockup */}
                        <div className="flex items-center gap-4 text-slate-400 font-bold text-[10px] pt-2 border-t border-slate-100 select-none">
                          <span className="flex items-center gap-1 cursor-pointer hover:text-blue-600">👍 Likes (142)</span>
                          <span className="flex items-center gap-1 cursor-pointer hover:text-blue-600">💬 Comments (18)</span>
                          <span className="flex items-center gap-1 cursor-pointer hover:text-blue-600">🔁 Shares (45)</span>
                        </div>

                      </div>
                    </div>
                  )}

                  {/* DOCUMENTARY FILMS / PODCAST EPISODE CINEMATIC PREVIEW */}
                  {['documentary_film', 'short_doc', 'success_story_video', 'humanitarian_story_video', 'interview'].includes(selectedType) && (
                    <div className="space-y-6">
                      
                      {/* Video Player Mockup Container */}
                      <div className="relative bg-slate-900 aspect-video rounded-2xl overflow-hidden flex flex-col items-center justify-center text-white border border-slate-800">
                        {formData.metadata.videoLink ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                            <Video className="text-white/60 mb-2" size={32} />
                            <p className="text-[10px] text-slate-400 font-semibold">{isRtl ? 'رابط الفيديو المكتشف:' : 'Detected Video Link URL:'}</p>
                            <p className="text-[9px] text-blue-400 break-all select-all font-mono max-w-[80%] mt-1">{formData.metadata.videoLink}</p>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 font-bold">{isRtl ? 'اكتب رابط البث المباشر أو الفيديو لرؤية خط المشغل' : 'Enter a video URL to simulate player'}</p>
                        )}
                        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between select-none">
                          <span className="text-[10px] bg-black/60 px-2 py-1 rounded">00:00 / {formData.metadata.runtime || '24:00'}</span>
                          <div className="flex gap-2">
                            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
                          </div>
                        </div>
                      </div>

                      {/* Technical staff log */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 grid grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
                        <div>
                          <span className="text-[10px] text-slate-400 block">{isRtl ? 'المخرج الإبداعي' : 'Creative Director'}</span>
                          <span>{formData.metadata.director || 'أكرم العمودي'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">{isRtl ? 'المنتج الفني' : 'Executive Producer'}</span>
                          <span>{formData.metadata.producer || 'بيت الصحافة'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">{isRtl ? 'اللغة والبث والمستودع' : 'Language'}</span>
                          <span>{formData.metadata.language || 'العربية / الإنجليزية'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">{isRtl ? 'الأثر والمشاهدات' : 'Awards/Honors'}</span>
                          <span>{formData.metadata.awardsAr || 'جائزة حرية التعبير الإستراتيجية'}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* FORMAL PRESS RELEASE PREVIEW */}
                  {selectedType === 'press_release' && (
                    <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200 space-y-6 font-sans">
                      
                      {/* Logo and Dateline header block */}
                      <div className="text-center border-b border-dashed border-slate-300 pb-4 space-y-2">
                        <span className="text-xs font-extrabold text-blue-600 block uppercase tracking-wider">{isRtl ? 'غرفة الأخبار والبيانات الرسمية' : 'OFFICIAL NEWSROOM RELEASE'}</span>
                        <h3 className="text-lg font-black text-slate-900 leading-tight">
                          {formData.titleAr || 'بيان عاجل بشأن تقييد حريات العمل الصحفي والميداني'}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-mono italic">
                          {formData.metadata.datelineAr || 'صنعاء، اليمن'} - {new Date().toLocaleDateString(isRtl ? 'ar-YE' : 'en-US')}
                        </p>
                      </div>

                      {/* Summary block */}
                      <div className="p-3 bg-blue-50/50 border-r-4 border-blue-600 text-xs font-bold text-slate-800 leading-relaxed">
                        {formData.metadata.summaryAr || 'يدين بيت الصحافة اليمني كافة المضايقات والحملات التحريضية الممنهجة الموجهة ضد كوادره والصحفيات الحرات في المحافظات المختلفة.'}
                      </div>

                      {/* Release body */}
                      <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                        {formData.metadata.bodyAr || 'لقد رصدنا بقلق عميق خلال الأسابيع الأربعة الفائتة حظراً مستهدفاً لعدد من الأنشطة التدريبية، وبناء عليه نطالب المنظمات الصديقة بنشر الضغوط المشتركة وحماية المدنيين وأرواح الصحفيين.'}
                      </div>

                      {/* Release footer contacts */}
                      <div className="border-t border-slate-200 pt-4 text-[9px] text-slate-400 font-semibold space-y-0.5">
                        <p className="uppercase font-bold text-slate-500">{isRtl ? 'التصريح الإعلامي المعتمد:' : 'MEDIA CONTACT DETAILS:'}</p>
                        <p>{formData.metadata.mediaContactsAr || 'press@ph-ye.org / هاتف المكتب المعتمد'}</p>
                      </div>

                    </div>
                  )}

                  {/* UNIFIED ACADEMIC REPORT OR GENERAL PREVIEW */}
                  {!['success_story', 'testimonial', 'social_post', 'documentary_film', 'short_doc', 'press_release'].includes(selectedType) && (
                    <div className="space-y-6">
                      
                      {/* Executive summary style */}
                      <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-2 text-xs">
                        <span className="text-[10px] font-black text-blue-600 block uppercase">{isRtl ? 'الملخص والنتائج الرئيسية' : 'EXECUTIVE SUMMARY & MAIN FINDINGS'}</span>
                        <p className="text-slate-600 leading-relaxed font-medium">
                          {formData.metadata.summaryAr || 'دراسة معمقة وتحليلات رصدية موجهة تعنى بمستويات الأمان الرقمي ودروس التمكين الإعلامي المدني في اليمن للعام 2026.'}
                        </p>
                      </div>

                      {/* Analysis Body */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-black text-slate-800">{isRtl ? 'أثر التدخل وتحليل الوقائع:' : 'Structured Methodology & Findings:'}</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {formData.metadata.bodyAr || 'قمنا بمسح شامل لـ 450 صحفي يمني عبر استطلاع مقعد، وأشارت النتائج إلى أن 78٪ واجهوا تهديداً أمنياً مباشراً أو صعوبة الحصول على مصادر معلومات آمنة.'}
                        </p>
                      </div>

                      {/* Policy Recommendations list */}
                      {formData.metadata.recommendationsAr && (
                        <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 text-xs">
                          <h4 className="text-xs font-black text-emerald-800 mb-2">{isRtl ? 'التوصيات الإستراتيجية المسندة:' : 'Key Policy Recommendations:'}</h4>
                          <p className="text-slate-600 leading-relaxed whitespace-pre-line">{formData.metadata.recommendationsAr}</p>
                        </div>
                      )}
                    </div>
                  )}

                </div>

                {/* 3. Common Footer interactive panel */}
                <div className="bg-slate-50 px-8 py-5 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400 select-none">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="text-emerald-500" size={14} />
                    <span>{isRtl ? 'متوافق مع محركات البحث وجودة الويب 4' : 'SEO Schema & OpenGraph ready'}</span>
                  </div>
                  <span className="font-semibold text-slate-500">PressHouse Yemen</span>
                </div>

              </div>

            </div>

          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}
