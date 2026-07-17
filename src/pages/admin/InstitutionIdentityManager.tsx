import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, Loader2, Plus, Trash2, Palette, Type, Globe, Layout, Shield, Sparkles, Image as ImageIcon } from 'lucide-react';
import { api } from '../../services/api';
import { ImagePicker } from '../../components/admin/ImagePicker';
import { SmartTranslate } from '../../components/admin/SmartTranslate';

export default function InstitutionIdentityManager() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'visual' | 'colors' | 'fonts'>('general');
  const [aiColorLoading, setAiColorLoading] = useState(false);
  const [aiColorReasoning, setAiColorReasoning] = useState<{ ar: string, en: string } | null>(null);

  // Fields state
  const [identity, setIdentity] = useState({
    name_ar: '',
    name_en: '',
    description_ar: '',
    description_en: '',
    vision_ar: '',
    vision_en: '',
    mission_ar: '',
    mission_en: '',
    goals: [] as string[],
    work_fields: [] as string[],
    logo_main: '',
    logo_colored: '',
    logo_dark: '',
    logo_white: '',
    favicon: '',
    primaryColor: '#0f172a',
    secondaryColor: '#3b82f6',
    accentColor: '#10b981',
    fontArPrimary: 'Inter',
    fontArSecondary: 'Inter',
    fontEnPrimary: 'Inter',
    fontEnSecondary: 'Inter'
  });

  // Local helper states
  const [newGoal, setNewGoal] = useState('');
  const [newTag, setNewTag] = useState('');
  const [customFonts, setCustomFonts] = useState<{name: string, url: string}[]>([]);
  const [fontFileLoading, setFontFileLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState<Record<string, boolean>>({});

  // Helper to extract primary/secondary colors from uploaded logo using HTML5 Canvas
  const detectPaletteFromImage = (imageUrl: string) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = 40;
        canvas.height = 40;
        ctx.drawImage(img, 0, 0, 40, 40);
        const data = ctx.getImageData(0, 0, 40, 40).data;
        
        const colorCounts: Record<string, number> = {};
        let maxCount = 0;
        let dominantHex = "#0f172a";
        let secondaryHex = "#2563eb";
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i+1];
          const b = data[i+2];
          const a = data[i+3];
          if (a < 220) continue; // Skip semi-transparent colors
          
          const brightness = (r * 299 + g * 587 + b * 114) / 1000;
          if (brightness > 215 || brightness < 40) continue; // Skip extremes
          
          // Saturation filter (ensures colorful branding colors are prioritized over neutral grays)
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const saturation = max === 0 ? 0 : (max - min) / max;
          if (saturation < 0.15) continue;
          
          const hex = "#" + [r, g, b].map(x => {
            const hexStr = x.toString(16);
            return hexStr.length === 1 ? '0' + hexStr : hexStr;
          }).join('');
          
          colorCounts[hex] = (colorCounts[hex] || 0) + 1;
          if (colorCounts[hex] > maxCount) {
            maxCount = colorCounts[hex];
            dominantHex = hex;
          }
        }
        
        const sortedColors = Object.entries(colorCounts).sort((a,b) => b[1] - a[1]);
        const primaryR = parseInt(dominantHex.slice(1,3), 16);
        const primaryG = parseInt(dominantHex.slice(3,5), 16);
        const primaryB = parseInt(dominantHex.slice(5,7), 16);
        
        let secondMaxCount = 0;
        for (const [hex, count] of sortedColors) {
          const r2 = parseInt(hex.slice(1,3), 16);
          const g2 = parseInt(hex.slice(3,5), 16);
          const b2 = parseInt(hex.slice(5,7), 16);
          const distance = Math.sqrt((r2-primaryR)**2 + (g2-primaryG)**2 + (b2-primaryB)**2);
          if (distance > 70 && count > secondMaxCount) {
            secondMaxCount = count;
            secondaryHex = hex;
          }
        }
        
        setIdentity(prev => ({
          ...prev,
          primaryColor: dominantHex,
          secondaryColor: secondaryHex,
          accentColor: prev.accentColor === '#10b981' ? secondaryHex : prev.accentColor
        }));
        
        alert(isRtl 
          ? `تم استكشاف نظام الألوان للشعار تلقائياً في ثوانٍ وتطبيقه للعلامة:\nاللون الأساسي: ${dominantHex}\nاللون الثانوي المتناسق: ${secondaryHex}` 
          : `Main colors detected from logo! Primary: ${dominantHex}, Secondary: ${secondaryHex}`
        );
      } catch (e) {
        console.error("Color detection failed", e);
      }
    };
    img.src = imageUrl;
  };

  const handleAIColorAnalyze = async () => {
    const logoToAnalyze = identity.logo_main || identity.logo_colored;
    if (!logoToAnalyze) {
      alert(isRtl
        ? 'عذراً، يجب أولاً رفع شعار في تبويب الهوية البصرية ليتسنى للمساعد تحليله.'
        : 'Please upload a logo first so the AI assistant can analyze it.'
      );
      return;
    }

    setAiColorLoading(true);
    setAiColorReasoning(null);
    try {
      const res = await api.post('/api/ai/analyze-logo-colors', { logoUrl: logoToAnalyze });
      const data = res.data;
      if (data.primaryColor && data.secondaryColor && data.accentColor) {
        setIdentity(prev => ({
          ...prev,
          primaryColor: data.primaryColor,
          secondaryColor: data.secondaryColor,
          accentColor: data.accentColor
        }));

        setAiColorReasoning({
          ar: data.reasoning_ar || 'تم التحليل بنجاح واشتقاق الألوان المناسبة للعلامة التجارية.',
          en: data.reasoning_en || 'Extracted ideal palette from the provided brand logo successfully.'
        });

        // Try dynamically applying instantly to live session CSS variables as well!
        document.documentElement.style.setProperty('--primary-color-dyn', data.primaryColor);
        document.documentElement.style.setProperty('--secondary-color-dyn', data.secondaryColor);
        document.documentElement.style.setProperty('--accent-color-dyn', data.accentColor);
      }
    } catch (err: any) {
      console.error('Error in AI Logo analysis:', err);
      alert(isRtl ? 'فشل تحليل ألوان الشعار بالذكاء الاصطناعي.' : 'AI Logo color analysis failed');
    } finally {
      setAiColorLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    if (!e.target.files?.length) return;
    setLogoUploading(prev => ({ ...prev, [key]: true }));
    try {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await api.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const url = res.data.url;
      
      setIdentity(prev => ({ ...prev, [key]: url }));
      
      // Auto-color detection logic if uploading main or colored logo
      if (key === 'logo_main' || key === 'logo_colored') {
        detectPaletteFromImage(url);
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setLogoUploading(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setFontFileLoading(true);
    try {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await api.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const fontUrl = res.data.url;
      const fontName = file.name.split('.')[0].replace(/[^a-zA-Z0-9]/g, '');
      
      // Load dynamically in browser tab for direct beautiful WYSIWYG previewing
      const styleRule = `
        @font-face {
          font-family: '${fontName}';
          src: url('${fontUrl}');
        }
      `;
      const styleTag = document.createElement('style');
      styleTag.appendChild(document.createTextNode(styleRule));
      document.head.appendChild(styleTag);
      
      setCustomFonts(prev => [...prev, { name: fontName, url: fontUrl }]);
      setIdentity(prev => ({
        ...prev,
        fontArPrimary: fontName,
        fontEnPrimary: fontName
      }));
      
      alert(isRtl 
        ? `تم رفع وتثبيت الخط بنجاح باسم: ${fontName}\nوتعريفه في كافة اقسام لوحة التحكم.` 
        : `Custom Font uploaded and configured as: ${fontName}`
      );
    } catch (err) {
      console.error(err);
      alert('Font upload failed');
    } finally {
      setFontFileLoading(false);
    }
  };

  useEffect(() => {
    const fetchIdentity = async () => {
      try {
        const res = await api.get('/api/institution-identity');
        if (res.data && res.data.id) {
          setIdentity({
            ...res.data,
            goals: typeof res.data.goals === 'string' ? JSON.parse(res.data.goals) : (res.data.goals || []),
            work_fields: typeof res.data.work_fields === 'string' ? JSON.parse(res.data.work_fields) : (res.data.work_fields || []),
            primaryColor: res.data.primaryColor || '#0f172a',
            secondaryColor: res.data.secondaryColor || '#3b82f6',
            accentColor: res.data.accentColor || '#10b981',
            fontArPrimary: res.data.fontArPrimary || 'Inter',
            fontArSecondary: res.data.fontArSecondary || 'Inter',
            fontEnPrimary: res.data.fontEnPrimary || 'Inter',
            fontEnSecondary: res.data.fontEnSecondary || 'Inter'
          });
        }
      } catch (error) {
        console.error('Error fetching identity:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchIdentity();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/api/institution-identity', identity);
      alert(isRtl ? 'تم حفظ الهوية المؤسسية بنجاح!' : 'Institution identity saved successfully!');
    } catch (error) {
      console.error('Error saving identity:', error);
      alert(isRtl ? 'فشل حفظ الهوية' : 'Saving identity failed');
    } finally {
      setSaving(false);
    }
  };

  const addGoal = () => {
    if (newGoal.trim()) {
      setIdentity({ ...identity, goals: [...identity.goals, newGoal.trim()] });
      setNewGoal('');
    }
  };

  const removeGoal = (index: number) => {
    setIdentity({ ...identity, goals: identity.goals.filter((_, idx) => idx !== index) });
  };

  const addWorkField = () => {
    if (newTag.trim() && !identity.work_fields.includes(newTag.trim())) {
      setIdentity({ ...identity, work_fields: [...identity.work_fields, newTag.trim()] });
      setNewTag('');
    }
  };

  const removeWorkField = (tag: string) => {
    setIdentity({ ...identity, work_fields: identity.work_fields.filter(t => t !== tag) });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-8" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isRtl ? 'إدارة هوية المؤسسة' : 'Institution Identity Module'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {isRtl
              ? 'التعريف الاستراتيجي للمؤسسة، الهوية البصرية، ألوان الموقع، والخطوط والبروتوكولات الرسمية.'
              : 'Strategic def, branding logos, site pallet colors, and official typographies.'}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-blue-100 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          {isRtl ? 'حفظ التغييرات' : 'Save Changes'}
        </button>
      </div>

      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('general')}
          className={`pb-4 px-4 font-bold text-sm transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'general' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Globe size={18} />
          {isRtl ? 'التعريف العام والهيكل المعرفي' : 'Definition & Vision'}
        </button>
        <button
          onClick={() => setActiveTab('visual')}
          className={`pb-4 px-4 font-bold text-sm transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'visual' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Layout size={18} />
          {isRtl ? 'الهوية البصرية والشعارات' : 'Visual Brand'}
        </button>
        <button
          onClick={() => setActiveTab('colors')}
          className={`pb-4 px-4 font-bold text-sm transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'colors' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Palette size={18} />
          {isRtl ? 'نظام لوحة الألوان' : 'Color Palette'}
        </button>
        <button
          onClick={() => setActiveTab('fonts')}
          className={`pb-4 px-4 font-bold text-sm transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'fonts' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Type size={18} />
          {isRtl ? 'الخطوط الرسمية' : 'Typography Settings'}
        </button>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-slate-700 font-bold mb-2">اسم المؤسسة (بالعربية)</label>
                <input
                  type="text"
                  value={identity.name_ar}
                  onChange={e => setIdentity({ ...identity, name_ar: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-2">اسم المؤسسة (بالإنجليزية)</label>
                <input
                  type="text"
                  value={identity.name_en}
                  onChange={e => setIdentity({ ...identity, name_en: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-slate-700 font-bold mb-2">التعريف العام (بالعربية)</label>
                <textarea
                  value={identity.description_ar}
                  onChange={e => setIdentity({ ...identity, description_ar: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-2">التعريف العام (بالإنجليزية)</label>
                <textarea
                  value={identity.description_en}
                  onChange={e => setIdentity({ ...identity, description_en: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
              <div>
                <label className="block text-slate-700 font-bold mb-2">الرؤية (Vision) - بالعربية</label>
                <textarea
                  value={identity.vision_ar}
                  onChange={e => setIdentity({ ...identity, vision_ar: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-2">الرؤية (Vision) - بالإنجليزية</label>
                <textarea
                  value={identity.vision_en}
                  onChange={e => setIdentity({ ...identity, vision_en: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
              <div>
                <label className="block text-slate-700 font-bold mb-2">الرسالة (Mission) - بالعربية</label>
                <textarea
                  value={identity.mission_ar}
                  onChange={e => setIdentity({ ...identity, mission_ar: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-2">الرسالة (Mission) - بالإنجليزية</label>
                <textarea
                  value={identity.mission_en}
                  onChange={e => setIdentity({ ...identity, mission_en: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                />
              </div>
            </div>

            {/* Dynamic goals list */}
            <div className="pt-6 border-t border-slate-100 space-y-4">
              <label className="block text-slate-700 font-bold mb-1">
                {isRtl ? 'أهداف المؤسسة الاستراتيجية' : 'Strategic Institution Goals'}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newGoal}
                  onChange={e => setNewGoal(e.target.value)}
                  placeholder={isRtl ? 'مثال: رصد الانتهاكات ودعم الصحافة المستقلة' : 'e.g. Monitoring human rights and supporting journalism'}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                />
                <button
                  type="button"
                  onClick={addGoal}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors text-sm"
                >
                  <Plus size={16} />
                  {isRtl ? 'إضافة' : 'Add'}
                </button>
              </div>
              <ul className="space-y-2">
                {identity.goals.map((val, idx) => (
                  <li key={idx} className="flex justify-between items-center bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                    <span className="text-sm font-bold text-slate-800">{val}</span>
                    <button
                      type="button"
                      onClick={() => removeGoal(idx)}
                      className="text-red-500 p-1 bg-red-50 hover:bg-red-100 rounded-lg cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tags for work fields */}
            <div className="pt-6 border-t border-slate-100 space-y-4">
              <label className="block text-slate-700 font-bold mb-1">
                {isRtl ? 'مجالات العمل والتأثير' : 'Work Fields & Sectors'}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={e => setNewTag(e.target.value)}
                  placeholder={isRtl ? 'مثال: حماية الصحفيين، الدعم القانوني' : 'e.g. Legal defense, Journalist support'}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                />
                <button
                  type="button"
                  onClick={addWorkField}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors text-sm"
                >
                  <Plus size={16} />
                  {isRtl ? 'إضافة وسم' : 'Add Tag'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {identity.work_fields.map((tag, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full border border-blue-100">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeWorkField(tag)}
                      className="text-blue-500 hover:text-blue-900 font-bold cursor-pointer"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'visual' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-slate-700 font-bold mb-1">الشعار الرئيسي (Main Logo SVG/PNG)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={identity.logo_main}
                    onChange={e => setIdentity({ ...identity, logo_main: e.target.value })}
                    placeholder="https://example.com/logo-main.png"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                  />
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleLogoUpload(e, 'logo_main')}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <button type="button" className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-colors min-w-[100px] flex items-center justify-center">
                      {logoUploading['logo_main'] ? <Loader2 className="animate-spin" size={16} /> : (isRtl ? 'رفع الشعار' : 'Upload')}
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500">{isRtl ? '💡 سيقوم النظام تلقائياً بتحليل الشعار المرفوع واستخلاص نظام الألوان الافتراضي للموقع بالذكاء الاصطناعي.' : '💡 Uploading will automatically crawl and detect your primary branding palette colors.'}</p>
              </div>

              <div className="space-y-2">
                <label className="block text-slate-700 font-bold mb-1">الشعار الملون (Colored Brand Logo)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={identity.logo_colored}
                    onChange={e => setIdentity({ ...identity, logo_colored: e.target.value })}
                    placeholder="https://example.com/logo-colored.png"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                  />
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleLogoUpload(e, 'logo_colored')}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <button type="button" className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-colors min-w-[100px] flex items-center justify-center">
                      {logoUploading['logo_colored'] ? <Loader2 className="animate-spin" size={16} /> : (isRtl ? 'رفع ملون' : 'Upload Color')}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-slate-700 font-bold mb-1">الشعار الداكن (Dark Logo)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={identity.logo_dark}
                    onChange={e => setIdentity({ ...identity, logo_dark: e.target.value })}
                    placeholder="https://example.com/logo-dark.png"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                  />
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleLogoUpload(e, 'logo_dark')}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <button type="button" className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors min-w-[80px] flex items-center justify-center">
                      {logoUploading['logo_dark'] ? <Loader2 className="animate-spin" size={16} /> : (isRtl ? 'رفع' : 'Upload')}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-slate-700 font-bold mb-1">الشعار الأبيض (White Logo)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={identity.logo_white}
                    onChange={e => setIdentity({ ...identity, logo_white: e.target.value })}
                    placeholder="https://example.com/logo-white.png"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                  />
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleLogoUpload(e, 'logo_white')}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <button type="button" className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors min-w-[80px] flex items-center justify-center">
                      {logoUploading['logo_white'] ? <Loader2 className="animate-spin" size={16} /> : (isRtl ? 'رفع' : 'Upload')}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-slate-700 font-bold mb-1">أيقونة الموقع (Favicon)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={identity.favicon}
                    onChange={e => setIdentity({ ...identity, favicon: e.target.value })}
                    placeholder="https://example.com/favicon.ico"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                  />
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/x-icon,image/png"
                      onChange={e => handleLogoUpload(e, 'favicon')}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <button type="button" className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors min-w-[80px] flex items-center justify-center">
                      {logoUploading['favicon'] ? <Loader2 className="animate-spin" size={16} /> : (isRtl ? 'رفع' : 'Upload')}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
              <h4 className="font-bold text-slate-800 text-sm">{isRtl ? 'معاينة الشعارات الرسمية' : 'Brand Preview'}</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col items-center justify-center">
                  <span className="text-xs text-slate-400 mb-2">Main</span>
                  {identity.logo_main ? <img src={identity.logo_main} className="h-10 object-contain" alt="main" /> : <div className="h-10 text-slate-300 font-bold text-xs">None</div>}
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col items-center justify-center">
                  <span className="text-xs text-slate-400 mb-2">Colored</span>
                  {identity.logo_colored ? <img src={identity.logo_colored} className="h-10 object-contain" alt="colored" /> : <div className="h-10 text-slate-300 font-bold text-xs">None</div>}
                </div>
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-white">
                  <span className="text-xs text-slate-500 mb-2">Dark Contrast</span>
                  {identity.logo_white ? <img src={identity.logo_white} className="h-10 object-contain" alt="white" /> : <div className="h-10 text-slate-600 font-bold text-xs">None</div>}
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col items-center justify-center">
                  <span className="text-xs text-slate-400 mb-2">Favicon</span>
                  {identity.favicon ? <img src={identity.favicon} className="h-8 w-8 object-contain" alt="favicon" /> : <div className="h-8 text-slate-300 font-bold text-xs">None</div>}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'colors' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                  <Palette size={20} className="text-blue-500" />
                  {isRtl ? 'إدارة المظهر ونظام الألوان' : 'Color Scheme Management'}
                </h3>
                <p className="text-xs text-slate-500">{isRtl ? 'حدد ألوان خط الترويسة والتمييز للموقع، أو استعن بالذكاء الاصطناعي لاستخراجها من الشعار.' : 'Define main branding colors or invoke AI assistant to extract them from your logo.'}</p>
              </div>
            </div>

            {/* Smart Logo Selector & AI Analyzer Form */}
            <div className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-150 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100/50 rounded-xl text-indigo-700">
                  <Sparkles size={20} className="animate-pulse" />
                </div>
                <div>
                  <h4 className="font-black text-xs text-indigo-900 tracking-wider uppercase">
                    {isRtl ? 'المساعد الذكي: توليد الألوان التلقائي' : 'AI Assistant: Smart Branding Colors'}
                  </h4>
                  <p className="text-[11px] text-indigo-700 font-semibold mt-0.5">
                    {isRtl 
                      ? 'اختر الشعار المطلوب وسيتم إرساله للمساعد الذكي لتحليل الصبغات واقتراح أفضل الألوان المهنية المتناسقة للـ CSS.' 
                      : 'Provide your logo path and the assistant will read, detect and apply primary/secondary colors.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                    {isRtl ? 'شعار التحليل الفوري' : 'Logo for Analysis'}
                  </span>
                  <ImagePicker 
                    value={identity.logo_main} 
                    onChange={(url) => setIdentity({...identity, logo_main: url, logo_colored: identity.logo_colored || url})} 
                  />
                </div>

                <div className="pb-2 text-start">
                  <button
                    type="button"
                    onClick={handleAIColorAnalyze}
                    disabled={aiColorLoading || !identity.logo_main}
                    className="w-full md:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-55 disabled:cursor-not-allowed text-white text-xs font-black rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    {aiColorLoading ? (
                      <Loader2 size={16} className="animate-spin text-white" />
                    ) : (
                      <Sparkles size={16} />
                    )}
                    {isRtl ? 'تحليل الشعار وتثبيت نظام الألوان ذكياً' : 'Analyze Logo & Apply Colors'}
                  </button>
                </div>
              </div>

              {aiColorReasoning && (
                <div className="mt-4 p-4 rounded-2xl bg-white border border-indigo-100 text-xs text-indigo-950 font-bold space-y-1 text-start">
                  <div className="flex items-center gap-1.5 text-[11px] text-indigo-600">
                    <Sparkles size={12} />
                    <span>{isRtl ? 'تقرير المساعد الذكي حول اختيارات الهوية:' : 'AI Brand Identity Report:'}</span>
                  </div>
                  <p className="leading-relaxed whitespace-pre-line">
                    {isRtl ? aiColorReasoning.ar : aiColorReasoning.en}
                  </p>
                </div>
              )}
            </div>

            {/* Colors picker controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-3">
                <label className="block text-slate-700 font-bold">{isRtl ? 'اللون الأساسي' : 'Primary Color'}</label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={identity.primaryColor}
                    onChange={e => {
                      setIdentity({ ...identity, primaryColor: e.target.value });
                      document.documentElement.style.setProperty('--primary-color-dyn', e.target.value);
                    }}
                    className="w-12 h-12 rounded-xl cursor-pointer border-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={identity.primaryColor}
                    onChange={e => {
                      setIdentity({ ...identity, primaryColor: e.target.value });
                      document.documentElement.style.setProperty('--primary-color-dyn', e.target.value);
                    }}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 outline-none text-xs font-mono"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-3">
                <label className="block text-slate-700 font-bold">{isRtl ? 'اللون الثانوي' : 'Secondary Color'}</label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={identity.secondaryColor}
                    onChange={e => {
                      setIdentity({ ...identity, secondaryColor: e.target.value });
                      document.documentElement.style.setProperty('--secondary-color-dyn', e.target.value);
                    }}
                    className="w-12 h-12 rounded-xl cursor-pointer border-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={identity.secondaryColor}
                    onChange={e => {
                      setIdentity({ ...identity, secondaryColor: e.target.value });
                      document.documentElement.style.setProperty('--secondary-color-dyn', e.target.value);
                    }}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 outline-none text-xs font-mono"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-3">
                <label className="block text-slate-700 font-bold">{isRtl ? 'لون التمييز' : 'Accent Color'}</label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={identity.accentColor}
                    onChange={e => {
                      setIdentity({ ...identity, accentColor: e.target.value });
                      document.documentElement.style.setProperty('--accent-color-dyn', e.target.value);
                    }}
                    className="w-12 h-12 rounded-xl cursor-pointer border-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={identity.accentColor}
                    onChange={e => {
                      setIdentity({ ...identity, accentColor: e.target.value });
                      document.documentElement.style.setProperty('--accent-color-dyn', e.target.value);
                    }}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 outline-none text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
              <h4 className="font-bold text-slate-800 text-sm">{isRtl ? 'معاينة تباين المظهر والألوان الحية' : 'Live Contrast Preview'}</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl text-white font-bold flex flex-col justify-between h-28" style={{ backgroundColor: identity.primaryColor }}>
                  <span className="text-xs text-white/70">Primary (Backbone)</span>
                  <span className="text-xl">PressHouse</span>
                </div>
                <div className="p-4 rounded-xl text-white font-bold flex flex-col justify-between h-28" style={{ backgroundColor: identity.secondaryColor }}>
                  <span className="text-xs text-white/70">Secondary (Interactive)</span>
                  <span className="text-xl">Action UI</span>
                </div>
                <div className="p-4 rounded-xl text-white font-bold flex flex-col justify-between h-28" style={{ backgroundColor: identity.accentColor }}>
                  <span className="text-xs text-white/70">Accent (Impact/States)</span>
                  <span className="text-xl">Verified Badge</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'fonts' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
              <div>
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                  <Type size={20} className="text-blue-500" />
                  {isRtl ? 'إدارة الخطوط والمظهر المطبعي' : 'Typography Configuration'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">{isRtl ? 'اختر خطوط الويب المدرجة أو قم برفع باقة خطوط مخصصة للمؤسسة (TTF, OTF, WOFF)' : 'Select default webfonts or upload actual typography files.'}</p>
              </div>

              <div className="relative">
                <input
                  type="file"
                  accept=".ttf,.otf,.woff,.woff2"
                  disabled={fontFileLoading}
                  onChange={handleFontUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <button type="button" disabled={fontFileLoading} className="px-5 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-bold shadow-sm rounded-xl text-sm transition-colors flex items-center gap-2">
                  {fontFileLoading ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                  {isRtl ? 'رفع خط جديد مخصص' : 'Upload New Custom Font'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="font-bold text-slate-900 text-sm border-b pb-2">{isRtl ? 'الخطوط العربية' : 'Arabic Font Stack'}</h4>
                <div>
                  <label className="block text-slate-700 font-bold mb-2">خط عربي رئيسي (العناوين)</label>
                  <select
                    value={identity.fontArPrimary}
                    onChange={e => setIdentity({ ...identity, fontArPrimary: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none text-sm font-bold bg-white"
                  >
                    <option value="Inter">Inter (System Default)</option>
                    <option value="Cairo">Cairo</option>
                    <option value="Tajawal">Tajawal</option>
                    <option value="Almarai">Almarai</option>
                    {customFonts.map(f => (
                      <option key={f.name} value={f.name}>{f.name} (Uploaded)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-2">خط عربي ثانوي (النصوص والمحتوى)</label>
                  <select
                    value={identity.fontArSecondary}
                    onChange={e => setIdentity({ ...identity, fontArSecondary: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none text-sm font-bold bg-white"
                  >
                    <option value="Inter">Inter (System Default)</option>
                    <option value="Cairo">Cairo</option>
                    <option value="Tajawal">Tajawal</option>
                    <option value="Almarai">Almarai</option>
                    {customFonts.map(f => (
                      <option key={f.name} value={f.name}>{f.name} (Uploaded)</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="font-bold text-slate-900 text-sm border-b pb-2">{isRtl ? 'الخطوط الإنجليزية' : 'English Font Stack'}</h4>
                <div>
                  <label className="block text-slate-700 font-bold mb-2">خط إنجليزي رئيسي (Headings)</label>
                  <select
                    value={identity.fontEnPrimary}
                    onChange={e => setIdentity({ ...identity, fontEnPrimary: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none text-sm font-bold bg-white"
                  >
                    <option value="Inter">Inter</option>
                    <option value="Space Grotesk">Space Grotesk</option>
                    <option value="Outfit">Outfit</option>
                    <option value="Playfair Display">Playfair Display (Serif)</option>
                    {customFonts.map(f => (
                      <option key={f.name} value={f.name}>{f.name} (Uploaded)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-2">خط إنجليزي ثانوي (Body Paragraphs)</label>
                  <select
                    value={identity.fontEnSecondary}
                    onChange={e => setIdentity({ ...identity, fontEnSecondary: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none text-sm font-bold bg-white"
                  >
                    <option value="Inter">Inter</option>
                    <option value="JetBrains Mono">JetBrains Mono (Technical)</option>
                    <option value="Roboto">Roboto</option>
                    {customFonts.map(f => (
                      <option key={f.name} value={f.name}>{f.name} (Uploaded)</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
