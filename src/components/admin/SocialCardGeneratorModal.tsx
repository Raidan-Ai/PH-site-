import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Download, RefreshCw, Image as ImageIcon, Eye, Type, Palette, Layout, Settings } from 'lucide-react';
import { generateSocialCardAI } from '../../services/AIService';
import html2canvas from 'html2canvas';

interface SocialCardGeneratorModalProps {
  article: any;
  isOpen: boolean;
  onClose: () => void;
  isRtl: boolean;
}

export default function SocialCardGeneratorModal({ article, isOpen, onClose, isRtl }: SocialCardGeneratorModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Custom states pre-populated from Article
  const [headlineAr, setHeadlineAr] = useState('');
  const [headlineEn, setHeadlineEn] = useState('');
  const [taglineAr, setTaglineAr] = useState('');
  const [taglineEn, setTaglineEn] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#0f172a');
  const [accentColor, setAccentColor] = useState('#ef4444');
  const [searchQuery, setSearchQuery] = useState('');
  const [fontSize, setFontSize] = useState('text-2xl');
  const [overlayOpacity, setOverlayOpacity] = useState(0.4);
  const [showLogo, setShowLogo] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [bgType, setBgType] = useState<'gradient' | 'image'>('gradient');
  const [bgImageUrl, setBgImageUrl] = useState('');
  const [activeLang, setActiveLang] = useState<'ar' | 'en'>('ar');

  // Trigger loading initial values
  useEffect(() => {
    if (article) {
      const artTitleAr = article.title?.ar || '';
      const artTitleEn = article.title?.en || '';
      setHeadlineAr(artTitleAr);
      setHeadlineEn(artTitleEn);
      
      // Default taglines
      setTaglineAr('مرصد بيت الصحافة للحريات الإعلامية - اليمن');
      setTaglineEn('PressHouse Media Freedom Observatory - Yemen');
      
      // Default color presets based on category
      if (article.category === 'report') {
        setPrimaryColor('#1e1b4b'); // Deep indigo
        setAccentColor('#f59e0b'); // Amber
        setSearchQuery('journalism report data');
      } else if (article.category === 'press_release') {
        setPrimaryColor('#1c1917'); // Dark stone
        setAccentColor('#3b82f6'); // Blue
        setSearchQuery('official announcement board');
      } else {
        setPrimaryColor('#0f172a'); // Slate
        setAccentColor('#ef4444'); // Crimson
        setSearchQuery('news headline papers');
      }

      setBgType('gradient');
      setBgImageUrl('');
      setActiveLang(isRtl ? 'ar' : 'en');
    }
  }, [article, isOpen, isRtl]);

  if (!isOpen || !article) return null;

  // AI Generation handler using server-side Gemini
  const handleAiGeneration = async () => {
    setIsAiLoading(true);
    try {
      const aiData = await generateSocialCardAI(article.title, article.category);
      if (aiData) {
        if (aiData.primaryColor) setPrimaryColor(aiData.primaryColor);
        if (aiData.accentColor) setAccentColor(aiData.accentColor);
        if (aiData.searchQuery) {
          setSearchQuery(aiData.searchQuery);
          // Set to Unsplash placeholder with the generated keyword
          const encodedKeyword = encodeURIComponent(aiData.searchQuery);
          setBgImageUrl(`https://picsum.photos/seed/${encodedKeyword}/1200/630`);
          setBgType('image');
        }
        if (aiData.punchline) {
          if (aiData.punchline.ar) setTaglineAr(aiData.punchline.ar);
          if (aiData.punchline.en) setTaglineEn(aiData.punchline.en);
        }
      }
    } catch (err) {
      console.error("AI social card generation error:", err);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Render bg image with custom term manually entered
  const handleApplyCustomSearch = () => {
    if (searchQuery.trim()) {
      const encoded = encodeURIComponent(searchQuery.trim());
      setBgImageUrl(`https://picsum.photos/seed/${encoded}/1200/630`);
      setBgType('image');
    }
  };

  // Convert visual element to PNG for download
  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      // Create high-DPI export canvas
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        allowTaint: true,
        scale: 2, // 2x density for stunning high-res results
        backgroundColor: null
      });
      
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `presshouse-card-${article.id?.slice(0, 8) || 'social'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Could not capture card image:", err);
      alert(isRtl ? 'عذراً، حدث خطأ أثناء تصدير الصورة.' : 'Sorry, failed to export card image.');
    }
  };

  // Preset Colors
  const colorPresets = [
    { primary: '#0f172a', accent: '#ef4444', label: 'Slate Crimson' },
    { primary: '#1e1b4b', accent: '#f59e0b', label: 'Indigo Amber' },
    { primary: '#111827', accent: '#10b981', label: 'Carbon Emerald' },
    { primary: '#1c1917', accent: '#3b82f6', label: 'Stone Sapphire' },
    { primary: '#4c0519', accent: '#fb7185', label: 'Rose Gold' },
    { primary: '#022c22', accent: '#34d399', label: 'Forest Green' },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
        
        {/* Left Column: Interactive Settings Form */}
        <div className="w-full md:w-5/12 border-e border-slate-100 p-6 overflow-y-auto flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Palette className="text-blue-600" size={20} />
                <h3 className="font-extrabold text-slate-900 text-lg">
                  {isRtl ? 'تصميم كرت المشاركة' : 'Share Card Designer'}
                </h3>
              </div>
              <button 
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Language Selector for Edit */}
            <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
              <button
                onClick={() => setActiveLang('ar')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeLang === 'ar' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                العربية (AR)
              </button>
              <button
                onClick={() => setActiveLang('en')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeLang === 'en' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                English (EN)
              </button>
            </div>

            {/* Headline and Tagline Edit */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {isRtl ? 'عنوان الكرت' : 'Card Headline'} ({activeLang === 'ar' ? 'عربي' : 'English'})
                </label>
                <textarea
                  rows={2}
                  value={activeLang === 'ar' ? headlineAr : headlineEn}
                  onChange={(e) => activeLang === 'ar' ? setHeadlineAr(e.target.value) : setHeadlineEn(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={isRtl ? 'اكتب عنوان الكرت هنا...' : 'Enter card headline...'}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {isRtl ? 'العنوان الفرعي / الشعار' : 'Card Subtitle / Tagline'}
                </label>
                <textarea
                  rows={2}
                  value={activeLang === 'ar' ? taglineAr : taglineEn}
                  onChange={(e) => activeLang === 'ar' ? setTaglineAr(e.target.value) : setTaglineEn(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={isRtl ? 'اكتب العنوان الفرعي...' : 'Enter tagline...'}
                />
              </div>
            </div>

            {/* Design Presets and AI Generator */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {isRtl ? 'التصميم المدعوم بالذكاء الاصطناعي' : 'AI-Powered Styling'}
                </span>
                <button
                  type="button"
                  onClick={handleAiGeneration}
                  disabled={isAiLoading}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-50"
                >
                  <Sparkles size={14} className={isAiLoading ? "animate-spin" : ""} />
                  {isAiLoading ? (isRtl ? 'جاري التوليد...' : 'Generating...') : (isRtl ? 'توليد ذكي' : 'Smart Generate')}
                </button>
              </div>

              {/* Background Style Type */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {isRtl ? 'نوع الخلفية' : 'Background Type'}
                </label>
                <div className="flex bg-slate-50 p-1 rounded-xl gap-1 border border-slate-100">
                  <button
                    onClick={() => setBgType('gradient')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${bgType === 'gradient' ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50' : 'text-slate-500'}`}
                  >
                    {isRtl ? 'تدرج لوني' : 'Color Gradient'}
                  </button>
                  <button
                    onClick={() => { setBgType('image'); if (!bgImageUrl) handleApplyCustomSearch(); }}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${bgType === 'image' ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50' : 'text-slate-500'}`}
                  >
                    {isRtl ? 'صورة تعبيرية' : 'Thematic Photo'}
                  </button>
                </div>
              </div>

              {/* Dynamic Photo Search Query Input */}
              {bgType === 'image' && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {isRtl ? 'البحث عن صورة تعبيرية' : 'Thematic Concept Search'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. abstract journalism, freedom"
                    />
                    <button
                      onClick={handleApplyCustomSearch}
                      className="bg-slate-900 text-white hover:bg-slate-800 p-2 rounded-xl transition-all"
                      title={isRtl ? 'تطبيق' : 'Apply'}
                    >
                      <RefreshCw size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Color Preset Selectors */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  {isRtl ? 'لوحة الألوان المفضلة' : 'Palette Preset'}
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {colorPresets.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setPrimaryColor(p.primary);
                        setAccentColor(p.accent);
                      }}
                      className="h-8 rounded-lg relative overflow-hidden border border-slate-200 shadow-sm group hover:scale-110 transition-transform"
                      style={{ background: `linear-gradient(135deg, ${p.primary} 50%, ${p.accent} 50%)` }}
                      title={p.label}
                    >
                      {primaryColor === p.primary && accentColor === p.accent && (
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center text-white text-[10px] font-bold">✓</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fine Controls Slider */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    {isRtl ? 'حجم الخط' : 'Font Size'}
                  </label>
                  <select
                    value={fontSize}
                    onChange={(e) => setFontSize(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs outline-none"
                  >
                    <option value="text-lg">Small</option>
                    <option value="text-xl">Medium</option>
                    <option value="text-2xl">Large</option>
                    <option value="text-3xl">Extra Large</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    {isRtl ? 'تعتيم الخلفية' : 'Overlay Dim'}
                  </label>
                  <select
                    value={overlayOpacity}
                    onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs outline-none"
                  >
                    <option value="0.2">Light (20%)</option>
                    <option value="0.4">Medium (40%)</option>
                    <option value="0.6">Dark (60%)</option>
                    <option value="0.8">Heavy (80%)</option>
                  </select>
                </div>
              </div>

              {/* Toggle Logo Branding */}
              <div className="flex items-center justify-between py-1 bg-slate-50 px-3 rounded-lg border border-slate-100">
                <span className="text-xs font-bold text-slate-600">{isRtl ? 'عرض شعار بيت الصحافة' : 'Show PressHouse branding'}</span>
                <input
                  type="checkbox"
                  checked={showLogo}
                  onChange={(e) => setShowLogo(e.target.checked)}
                  className="rounded text-blue-600 border-slate-300 focus:ring-blue-500 h-4 w-4"
                />
              </div>

            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              {isRtl ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-100"
            >
              <Download size={16} />
              {isRtl ? 'تنزيل الكرت' : 'Download Card'}
            </button>
          </div>
        </div>

        {/* Right Column: Live Share Card Preview */}
        <div className="w-full md:w-7/12 bg-slate-50 p-8 flex flex-col justify-center items-center">
          <div className="text-center mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 justify-center">
              <Eye size={12} />
              {isRtl ? 'معاينة مباشرة للكرت (1200 × 630)' : 'Live Card Preview (1200 × 630)'}
            </span>
          </div>

          {/* Social Card Aspect Container (1.91:1 Social Ratio) */}
          <div className="relative w-full max-w-lg aspect-[1.91/1] bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 select-none">
            
            {/* Capture Area Element */}
            <div 
              ref={cardRef}
              id="presshouse-social-card"
              className="w-full h-full relative overflow-hidden flex flex-col justify-between p-8 text-white text-right font-sans"
              dir={activeLang === 'ar' ? 'rtl' : 'ltr'}
              style={{ 
                backgroundColor: primaryColor,
                background: bgType === 'gradient' 
                  ? `linear-gradient(135deg, ${primaryColor} 0%, #030712 100%)` 
                  : `linear-gradient(135deg, ${primaryColor} 0%, #030712 100%)`
              }}
            >
              {/* Background image & gradient overlay */}
              {bgType === 'image' && bgImageUrl && (
                <>
                  <img 
                    src={bgImageUrl}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover mix-blend-overlay"
                    style={{ opacity: 1 - overlayOpacity }}
                  />
                  {/* Subtle dark gradient overlay to ensure readable typography */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />
                </>
              )}

              {/* Decorative Geometric Grid & Accents for PressHouse Aesthetic */}
              <div className="absolute inset-0 border-[16px] border-white/5 pointer-events-none" />
              <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-white/20 pointer-events-none" />
              <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-white/20 pointer-events-none" />
              <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-white/20 pointer-events-none" />
              <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-white/20 pointer-events-none" />

              {/* Header: Category and Logo Watermark */}
              <div className={`flex items-center justify-between relative z-10 ${activeLang === 'en' ? 'flex-row-reverse' : 'flex-row'}`}>
                {showLogo ? (
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center border-2" style={{ borderColor: accentColor }}>
                      <span className="text-[10px] font-black" style={{ color: accentColor }}>PH</span>
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/80 font-mono">
                      {activeLang === 'ar' ? 'بيت الصحافة' : 'PressHouse'}
                    </span>
                  </div>
                ) : <div />}

                <span 
                  className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border"
                  style={{ borderColor: `${accentColor}50`, color: accentColor, backgroundColor: `${accentColor}15` }}
                >
                  {article.category === 'news' ? (activeLang === 'ar' ? 'أخبار عاجلة' : 'Breaking News') :
                   article.category === 'report' ? (activeLang === 'ar' ? 'تقرير خاص' : 'Special Report') :
                   (activeLang === 'ar' ? 'بيان صحفي' : 'Press Release')}
                </span>
              </div>

              {/* Body Content */}
              <div className="space-y-3 relative z-10 text-start">
                <h1 className={`font-black leading-tight tracking-tight text-white ${fontSize} line-clamp-3`}>
                  {activeLang === 'ar' ? (headlineAr || 'عنوان كرت التحرير') : (headlineEn || 'Card Headline Text')}
                </h1>
                
                <p className="text-xs font-bold opacity-85 line-clamp-2 border-s-2 pl-3 rtl:border-r-2 rtl:pl-0 rtl:pr-3" style={{ borderColor: accentColor }}>
                  {activeLang === 'ar' ? (taglineAr || 'تغطية مستمرة ومستقلة لأهم الأحداث والقضايا') : (taglineEn || 'Independent and continuous coverage of key media events')}
                </p>
              </div>

              {/* Footer: Date and URL */}
              <div className={`flex items-center justify-between text-[10px] text-white/50 relative z-10 pt-2 border-t border-white/10 ${activeLang === 'en' ? 'flex-row-reverse' : 'flex-row'}`}>
                <span className="font-mono">
                  {new Date(article.createdAt || Date.now()).toLocaleDateString(activeLang === 'ar' ? 'ar-YE' : 'en-US')}
                </span>
                <span className="font-mono tracking-wider opacity-80">
                  {activeLang === 'ar' ? 'yemen.presshouse.org' : 'presshouse.org/ye'}
                </span>
              </div>

            </div>
          </div>

          <div className="mt-6 flex items-center gap-2 bg-slate-100 text-slate-500 rounded-2xl px-4 py-2 text-xs font-medium max-w-sm text-center">
            <span className="text-blue-500 font-extrabold">📌 Tip:</span>
            {isRtl 
              ? 'يمكنك التبديل بين اللغتين وتعديل النصوص مباشرة قبل الحفظ لتخصيص محتوى الكرت.' 
              : 'You can swap languages and edit the headline texts directly to customize the generated layout.'}
          </div>
        </div>

      </div>
    </div>
  );
}
