import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FileText, Save, Loader2, Image as ImageIcon, 
  Upload, ChevronRight, Layout, Type, AlignLeft,
  Settings as SettingsIcon, Plus, Trash2, Globe
} from 'lucide-react';
import { api } from '../../services/api';
import { MediaLibraryModal } from '../../components/media/MediaLibraryModal';

interface ContentSection {
  id: string;
  page_name: string;
  section_name: string;
  content: any;
}

const PAGES = [
  { id: 'home', label_ar: 'الرئيسية', label_en: 'Home' },
  { id: 'about', label_ar: 'عن المنصة', label_en: 'About' },
  { id: 'contact', label_ar: 'اتصل بنا', label_en: 'Contact' },
  { id: 'services', label_ar: 'خدماتنا', label_en: 'Services' },
  { id: 'programs', label_ar: 'برامجنا', label_en: 'Programs' },
];

export default function PageContentManager() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [activePage, setActivePage] = useState('home');
  const [sections, setSections] = useState<ContentSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [activeMediaSection, setActiveMediaSection] = useState<{sectionIndex: number, field: string} | null>(null);
  const [pmisIndicators, setPmisIndicators] = useState<any[]>([]);

  useEffect(() => {
    fetchPageContent();
  }, [activePage]);

  useEffect(() => {
    const fetchIndicatorsList = async () => {
      try {
        const response = await api.get('/api/analytics/indicators');
        if (response.data && response.data.success) {
          setPmisIndicators(response.data.indicators || []);
        }
      } catch (err) {
        console.error("Error loading indicators for content manager:", err);
      }
    };
    fetchIndicatorsList();
  }, [activePage]);

  const fetchPageContent = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/page-content/${activePage}`);
      const data = (Array.isArray(response.data) ? response.data : []).map((s: any) => ({
        ...s,
        content: typeof s.content === 'string' ? JSON.parse(s.content) : s.content
      }));
      setSections(data);

      // If no sections found, add some defaults based on page
      if (data.length === 0) {
        initializeDefaultSections();
      }
    } catch (error) {
      console.error("Error fetching content:", error);
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaultSections = () => {
    let defaults: any[] = [];
    if (activePage === 'home') {
      defaults = [
        { section_name: 'hero', content: { title: { ar: '', en: '' }, subtitle: { ar: '', en: '' }, button: { ar: '', en: '' }, image: '' } },
        { section_name: 'about_brief', content: { title: { ar: '', en: '' }, text: { ar: '', en: '' }, image: '' } },
      ];
    } else if (activePage === 'about') {
      defaults = [
        { section_name: 'introduction', content: { title: { ar: 'صحافة من أجل الإنسان أولاً', en: 'Journalism for Humanity First' }, text: { ar: 'مؤسسة مجتمع مدني تهدف إلى تعزيز حرية الإعلام...', en: 'A civil society organization aiming to promote media freedom...' }, image: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=800' } },
        { section_name: 'mission', content: { title: { ar: 'رسالتنا', en: 'Our Mission' }, text: { ar: 'أن تصبح بيت الصحافة المؤسسة الأولى في تعزيز حرية الصحافة...', en: 'To become the leading institution in promoting press freedom...' } } },
        { section_name: 'vision', content: { title: { ar: 'رؤيتنا', en: 'Our Vision' }, text: { ar: 'صحافة مهنية حرة أولويتها الإنسان.', en: 'Free professional journalism that prioritizes humanity.' } } },
        { 
          section_name: 'goals', 
          content: { 
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
              }
            ]
          } 
        },
      ];
    }
    
    setSections(defaults.map(d => ({ ...d, page_name: activePage })));
  };

  const handleUpdateSection = (index: number, content: any) => {
    const newSections = [...sections];
    newSections[index].content = content;
    setSections(newSections);
  };

  const addNewSection = () => {
    const sectionName = prompt(isRtl ? 'أدخل اسم القسم (بالانجليزية):' : 'Enter section name (English):');
    if (!sectionName) return;
    
    setSections([...sections, {
      id: Date.now().toString(),
      page_name: activePage,
      section_name: sectionName,
      content: { title: { ar: '', en: '' }, text: { ar: '', en: '' } }
    }]);
  };

  const handleSave = async (index: number) => {
    const section = sections[index];
    setSaving(section.section_name);
    try {
      await api.post('/api/page-content', {
        page_name: activePage,
        section_name: section.section_name,
        content: section.content
      });
      // Optionally show a toast
    } catch (error) {
      console.error("Error saving section:", error);
      alert(isRtl ? 'فشل حفظ هذا القسم' : 'Failed to save this section');
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-8 pb-24">
      <MediaLibraryModal 
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelect={(url) => {
          if (activeMediaSection) {
            const { sectionIndex, field } = activeMediaSection;
            const newContent = { ...sections[sectionIndex].content, [field]: url };
            handleUpdateSection(sectionIndex, newContent);
          }
          setIsMediaModalOpen(false);
          setActiveMediaSection(null);
        }}
      />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{isRtl ? 'تحرير محتوى الصفحات' : 'Page Content Editor'}</h1>
          <p className="text-slate-500 text-sm mt-1">{isRtl ? 'تحرير النصوص والوسائط لكل صفحة في الموقع' : 'Edit text and media for every site page'}</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Page Selector Sidebar */}
        <aside className="w-full lg:w-64 space-y-1">
          <div className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {isRtl ? 'اختر الصفحة' : 'Select Page'}
          </div>
          {PAGES.map((page) => (
            <button
              key={page.id}
              onClick={() => setActivePage(page.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                activePage === page.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                  : 'text-slate-500 hover:bg-white hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Layout size={18} />
                {isRtl ? page.label_ar : page.label_en}
              </div>
              <ChevronRight size={14} className={activePage === page.id ? 'opacity-100' : 'opacity-0'} />
            </button>
          ))}
        </aside>

        {/* Content Editor Area */}
        <div className="flex-1 space-y-8">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={48} /></div>
          ) : (
            <>
              {sections.map((section, idx) => (
                <div key={section.section_name} className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="px-8 py-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 shadow-sm">
                        <Type size={18} />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 uppercase tracking-wider text-sm">{section.section_name.replace(/_/g, ' ')}</h3>
                        <p className="text-[10px] text-slate-500">{isRtl ? 'عنصر محتوى قابل للتحرير' : 'Editable content section'}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleSave(idx)}
                      disabled={saving === section.section_name}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
                    >
                      {saving === section.section_name ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                      {isRtl ? 'حفظ القسم' : 'Save Section'}
                    </button>
                  </div>

                  <div className="p-8 space-y-8">
                    {section.section_name === 'impact_stats' ? (
                      <div className="space-y-6">
                        <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-blue-800 text-xs">
                          <div>
                            <span className="font-extrabold text-sm block">💡 {isRtl ? 'إعداد بنية حائط المؤشرات الرئيسي' : 'Design Home Impactor KPIs'}</span>
                            <p className="opacity-80 mt-1">{isRtl ? 'أضف أي مؤشر في أي مرحلة لتظهر في الصفحة الرئيسية مدمجة إما بتعدادات تلقائية أو مؤشر من مشاريع PMIS أو مدخلة يدوياً.' : 'Add any live/manual indicator at any stage. Pick system telemetry, PMIS project objectives, or write fixed values.'}</p>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => {
                              const currentStats = section.content.stats || [];
                              const newItem = {
                                type: 'system',
                                metricId: 'total_violations',
                                ar: '0',
                                en: '0',
                                labelAr: isRtl ? 'مؤشر مضاف' : 'Added Metric',
                                labelEn: 'Added Metric',
                                descAr: '',
                                descEn: ''
                              };
                              handleUpdateSection(idx, {
                                ...section.content,
                                stats: [...currentStats, newItem]
                              });
                            }}
                            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-md transition-all self-start sm:self-auto cursor-pointer"
                          >
                            <Plus size={16} />
                            {isRtl ? 'إضافة بطاقة مؤشر' : 'Add KPI Card'}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {(section.content.stats || []).map((stat: any, sIdx: number) => (
                            <div key={sIdx} className="p-6 rounded-3xl border border-slate-200 bg-slate-50 relative space-y-4 shadow-sm">
                              <button
                                type="button"
                                onClick={() => {
                                  const filtered = (section.content.stats || []).filter((_: any, i: number) => i !== sIdx);
                                  handleUpdateSection(idx, { ...section.content, stats: filtered });
                                }}
                                className="absolute top-4 ltr:right-4 rtl:left-4 p-2 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-full cursor-pointer border-none bg-transparent transition-colors"
                                title={isRtl ? 'حذف هذا المؤشر' : 'Delete KPI'}
                              >
                                <Trash2 size={16} />
                              </button>

                              <h4 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wide">
                                <SettingsIcon size={14} className="text-blue-500" />
                                {isRtl ? `بطاقة المؤشر #${sIdx + 1}` : `KPI Card #${sIdx + 1}`}
                              </h4>

                              <div className="space-y-4 pt-1">
                                <div>
                                  <label className="text-[10px] uppercase font-black text-slate-400 block mb-1">{isRtl ? 'نوع مصدر المؤشر' : 'KPI Data Source Type'}</label>
                                  <select
                                    value={stat.type || 'system'}
                                    onChange={(e) => {
                                      const updatedStats = [...(section.content.stats || [])];
                                      updatedStats[sIdx] = { 
                                        ...updatedStats[sIdx], 
                                        type: e.target.value,
                                        metricId: e.target.value === 'system' ? 'total_violations' : undefined,
                                        indicatorId: e.target.value === 'pmis' ? (pmisIndicators[0]?.id || '') : undefined
                                      };
                                      handleUpdateSection(idx, { ...section.content, stats: updatedStats });
                                    }}
                                    className="w-full text-xs px-3 py-2.5 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    <option value="system">{isRtl ? 'مقياس إجمالي تلقائي من النظام (أرقام تراكمية)' : 'System Telemetry Metric (Automatic)'}</option>
                                    <option value="pmis">{isRtl ? 'مؤشر تشغيلي لمشروع من بنك PMIS' : 'Operational PMIS Project Indicator'}</option>
                                    <option value="manual">{isRtl ? 'إدخال قيمة ثابتة يدوية' : 'Manual / Static custom value'}</option>
                                  </select>
                                </div>

                                {stat.type === 'system' && (
                                  <div>
                                    <label className="text-[10px] uppercase font-black text-slate-400 block mb-1">{isRtl ? 'المقياس المطلوب' : 'Telemetry Variable'}</label>
                                    <select
                                      value={stat.metricId || 'total_violations'}
                                      onChange={(e) => {
                                        const updatedStats = [...(section.content.stats || [])];
                                        updatedStats[sIdx] = { ...updatedStats[sIdx], metricId: e.target.value };
                                        handleUpdateSection(idx, { ...section.content, stats: updatedStats });
                                      }}
                                      className="w-full text-xs px-3 py-2.5 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                      <option value="total_violations">{isRtl ? 'إجمالي الانتهاكات المرصودة' : 'Cumulative Documented Violations'}</option>
                                      <option value="total_beneficiaries">{isRtl ? 'إجمالي الصحفيين المستفيدين' : 'Supported Journalists'}</option>
                                      <option value="total_courses">{isRtl ? 'إجمالي محاور التدريب وأكاديمية المواد' : 'Training Courses Academy'}</option>
                                      <option value="total_reports">{isRtl ? 'إجمالي التقارير الحقوقية الصادرة' : 'Drafted Rights Reports'}</option>
                                      <option value="total_projects">{isRtl ? 'إجمالي المشاريع المفتوحة' : 'Total CSO Projects'}</option>
                                      <option value="total_volunteers">{isRtl ? 'إجمالي المتطوعين المسجلين' : 'Registered Volunteers (VMS)'}</option>
                                    </select>
                                  </div>
                                )}

                                {stat.type === 'pmis' && (
                                  <div>
                                    <label className="text-[10px] uppercase font-black text-slate-400 block mb-1">{isRtl ? 'اختر المؤشر من بنك PMIS' : 'Select Project Indicator'}</label>
                                    {pmisIndicators.length > 0 ? (
                                      <select
                                        value={stat.indicatorId || ''}
                                        onChange={(e) => {
                                          const updatedStats = [...(section.content.stats || [])];
                                          updatedStats[sIdx] = { ...updatedStats[sIdx], indicatorId: e.target.value };
                                          handleUpdateSection(idx, { ...section.content, stats: updatedStats });
                                        }}
                                        className="w-full text-xs px-3 py-2.5 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                      >
                                        <option value="">{isRtl ? '-- اختر مؤشراً --' : '-- Select Indicator --'}</option>
                                        {pmisIndicators.map(ind => (
                                          <option key={ind.id} value={ind.id}>
                                            {ind.project_title || 'Project'}: {ind.name} ({ind.current_value}/{ind.target_value} {ind.unit})
                                          </option>
                                        ))}
                                      </select>
                                    ) : (
                                      <p className="text-[11px] text-amber-600 block bg-amber-50 p-3 rounded-xl border border-amber-100 mt-1">
                                        ⚠️ {isRtl ? 'لا يوجد مؤشرات مسجلة في PMIS حالياً. يمكنك إضافتها من صفحة الأثر أولاً.' : 'No PMIS indicators found. Go to Admin -> Impact to create them.'}
                                      </p>
                                    )}
                                  </div>
                                )}

                                {stat.type === 'manual' && (
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="text-[10px] uppercase font-black text-slate-400 block mb-1">{isRtl ? 'القيمة بالعربية (مثال: +150)' : 'Value AR'}</label>
                                      <input
                                        type="text"
                                        value={stat.ar || ''}
                                        onChange={(e) => {
                                          const updatedStats = [...(section.content.stats || [])];
                                          updatedStats[sIdx] = { ...updatedStats[sIdx], ar: e.target.value };
                                          handleUpdateSection(idx, { ...section.content, stats: updatedStats });
                                        }}
                                        className="w-full text-xs px-3 py-2 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500 font-bold font-mono"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[10px] uppercase font-black text-slate-400 block mb-1">{isRtl ? 'القيمة بالإنجليزية' : 'Value EN'}</label>
                                      <input
                                        type="text"
                                        value={stat.en || ''}
                                        onChange={(e) => {
                                          const updatedStats = [...(section.content.stats || [])];
                                          updatedStats[sIdx] = { ...updatedStats[sIdx], en: e.target.value };
                                          handleUpdateSection(idx, { ...section.content, stats: updatedStats });
                                        }}
                                        className="w-full text-xs px-3 py-2 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500 font-bold font-mono"
                                      />
                                    </div>
                                  </div>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-[10px] uppercase font-black text-slate-400 block mb-1">{isRtl ? 'العنوان بالعربية (مثال: انتهاك موثق)' : 'Title AR'}</label>
                                    <input
                                      type="text"
                                      value={stat.labelAr || ''}
                                      onChange={(e) => {
                                        const updatedStats = [...(section.content.stats || [])];
                                        updatedStats[sIdx] = { ...updatedStats[sIdx], labelAr: e.target.value };
                                        handleUpdateSection(idx, { ...section.content, stats: updatedStats });
                                      }}
                                      className="w-full text-xs px-3 py-2 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] uppercase font-black text-slate-400 block mb-1">{isRtl ? 'العنوان بالإنجليزية' : 'Title EN'}</label>
                                    <input
                                      type="text"
                                      value={stat.labelEn || ''}
                                      onChange={(e) => {
                                        const updatedStats = [...(section.content.stats || [])];
                                        updatedStats[sIdx] = { ...updatedStats[sIdx], labelEn: e.target.value };
                                        handleUpdateSection(idx, { ...section.content, stats: updatedStats });
                                      }}
                                      className="w-full text-xs px-3 py-2 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-[10px] uppercase font-black text-slate-400 block mb-1">{isRtl ? 'شرح إضافي بالعربية' : 'Desc AR'}</label>
                                    <input
                                      type="text"
                                      value={stat.descAr || ''}
                                      onChange={(e) => {
                                        const updatedStats = [...(section.content.stats || [])];
                                        updatedStats[sIdx] = { ...updatedStats[sIdx], descAr: e.target.value };
                                        handleUpdateSection(idx, { ...section.content, stats: updatedStats });
                                      }}
                                      className="w-full text-xs px-3 py-2 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] uppercase font-black text-slate-400 block mb-1">{isRtl ? 'شرح بالإنجليزية' : 'Desc EN'}</label>
                                    <input
                                      type="text"
                                      value={stat.descEn || ''}
                                      onChange={(e) => {
                                        const updatedStats = [...(section.content.stats || [])];
                                        updatedStats[sIdx] = { ...updatedStats[sIdx], descEn: e.target.value };
                                        handleUpdateSection(idx, { ...section.content, stats: updatedStats });
                                      }}
                                      className="w-full text-xs px-3 py-2 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      Object.keys(section.content || {}).map((key) => {
                        const value = section.content[key];
                        
                        // Handle nested ar/en objects (Translations)
                        if (value && typeof value === 'object' && ('ar' in value || 'en' in value)) {
                          return (
                            <div key={key} className="space-y-4">
                              <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Globe size={14} />
                                {key.replace(/_/g, ' ')}
                              </label>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                  <span className="text-[10px] text-slate-400 font-bold px-3 py-1 bg-slate-50 rounded-lg border border-slate-100">ARABIC</span>
                                  {key.includes('description') || key.includes('text') || key.includes('content') ? (
                                     <textarea 
                                       rows={4}
                                       value={value.ar}
                                       onChange={(e) => handleUpdateSection(idx, { ...section.content, [key]: { ...value, ar: e.target.value } })}
                                       className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm leading-relaxed"
                                     />
                                  ) : (
                                    <input 
                                      type="text"
                                      value={value.ar}
                                      onChange={(e) => handleUpdateSection(idx, { ...section.content, [key]: { ...value, ar: e.target.value } })}
                                      className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold"
                                    />
                                  )}
                                </div>
                                <div className="space-y-2">
                                  <span className="text-[10px] text-slate-400 font-bold px-3 py-1 bg-slate-50 rounded-lg border border-slate-100">ENGLISH</span>
                                  {key.includes('description') || key.includes('text') || key.includes('content') ? (
                                     <textarea 
                                       rows={4}
                                       value={value.en}
                                       onChange={(e) => handleUpdateSection(idx, { ...section.content, [key]: { ...value, en: e.target.value } })}
                                       className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm leading-relaxed"
                                     />
                                  ) : (
                                    <input 
                                      type="text"
                                      value={value.en}
                                      onChange={(e) => handleUpdateSection(idx, { ...section.content, [key]: { ...value, en: e.target.value } })}
                                      className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold"
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        }
                        
                        // Handle Arrays of Objects (like goals or items)
                        if (Array.isArray(value)) {
                          return (
                            <div key={key} className="space-y-6">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{key.replace(/_/g, ' ')}</label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newItem = value.length > 0 ? { ...value[0] } : { title: { ar: '', en: '' }, desc: { ar: '', en: '' } };
                                    // Reset values in the new item
                                    Object.keys(newItem).forEach(k => {
                                      if (typeof newItem[k] === 'object' && newItem[k] !== null) {
                                        if ('ar' in newItem[k]) newItem[k].ar = '';
                                        if ('en' in newItem[k]) newItem[k].en = '';
                                      } else if (typeof newItem[k] === 'string') {
                                        if (!k.includes('color') && !k.includes('bg')) newItem[k] = '';
                                      }
                                    });
                                    handleUpdateSection(idx, { ...section.content, [key]: [...value, newItem] });
                                  }}
                                  className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                >
                                  <Plus size={16} />
                                </button>
                              </div>
                              <div className="space-y-4">
                                {value.map((item, itemIdx) => (
                                  <div key={itemIdx} className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-4 relative">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const filtered = value.filter((_, i) => i !== itemIdx);
                                        handleUpdateSection(idx, { ...section.content, [key]: filtered });
                                      }}
                                      className="absolute top-4 ltr:right-4 rtl:left-4 text-red-400 hover:text-red-600 p-1"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                    <div className="grid grid-cols-1 gap-4">
                                      {Object.keys(item).map(subKey => {
                                        const subVal = item[subKey];
                                        if (subVal && typeof subVal === 'object' && ('ar' in subVal || 'en' in subVal)) {
                                          return (
                                            <div key={subKey} className="grid grid-cols-2 gap-4">
                                              <div className="space-y-1">
                                                <span className="text-[10px] text-slate-400 font-bold uppercase">{subKey} (AR)</span>
                                                <input 
                                                  type="text"
                                                  value={subVal.ar}
                                                  onChange={(e) => {
                                                    const newItems = [...value];
                                                    newItems[itemIdx] = { ...item, [subKey]: { ...subVal, ar: e.target.value } };
                                                    handleUpdateSection(idx, { ...section.content, [key]: newItems });
                                                  }}
                                                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                                                />
                                              </div>
                                              <div className="space-y-1">
                                                <span className="text-[10px] text-slate-400 font-bold uppercase">{subKey} (EN)</span>
                                                <input 
                                                  type="text"
                                                  value={subVal.en}
                                                  onChange={(e) => {
                                                    const newItems = [...value];
                                                    newItems[itemIdx] = { ...item, [subKey]: { ...subVal, en: e.target.value } };
                                                    handleUpdateSection(idx, { ...section.content, [key]: newItems });
                                                  }}
                                                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                                                />
                                              </div>
                                            </div>
                                          );
                                        }
                                        return (
                                          <div key={subKey} className="space-y-1">
                                            <span className="text-[10px] text-slate-400 font-bold uppercase">{subKey}</span>
                                            <input 
                                              type="text"
                                              value={subVal}
                                              onChange={(e) => {
                                                const newItems = [...value];
                                                newItems[itemIdx] = { ...item, [subKey]: e.target.value };
                                                handleUpdateSection(idx, { ...section.content, [key]: newItems });
                                              }}
                                              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                                            />
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }

                        // Handle images
                        if (key.toLowerCase().includes('image') || key.toLowerCase().includes('url') || key.toLowerCase().includes('video')) {
                          return (
                            <div key={key} className="space-y-4">
                              <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{key.replace(/_/g, ' ')}</label>
                              <div className="flex gap-4">
                                <input 
                                  type="text"
                                  value={value}
                                  onChange={(e) => handleUpdateSection(idx, { ...section.content, [key]: e.target.value })}
                                  className="flex-1 px-5 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
                                  placeholder="https://..."
                                />
                                <button 
                                  onClick={() => {
                                    setActiveMediaSection({ sectionIndex: idx, field: key });
                                    setIsMediaModalOpen(true);
                                  }}
                                  className="px-6 py-4 bg-slate-100 text-slate-700 rounded-2xl hover:bg-slate-200 transition-all flex items-center gap-2 font-bold text-sm"
                                >
                                  <Upload size={18} />
                                  {isRtl ? 'المكتبة' : 'Library'}
                                </button>
                              </div>
                              {value && (
                                <div className="w-full max-w-sm h-48 rounded-2xl border border-slate-200 overflow-hidden bg-slate-50">
                                  <img src={value} alt="" className="w-full h-full object-cover" />
                                </div>
                              )}
                            </div>
                          );
                        }
  
                        // Handle simple strings
                        if (typeof value === 'string' || typeof value === 'number') {
                          return (
                            <div key={key} className="space-y-4">
                              <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{key.replace(/_/g, ' ')}</label>
                              <input 
                                type="text"
                                value={value}
                                onChange={(e) => handleUpdateSection(idx, { ...section.content, [key]: e.target.value })}
                                className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                              />
                            </div>
                          );
                        }
  
                        return null;
                      })
                    )}
                  </div>
                </div>
              ))}

              {/* Add Custom Section */}
              <button 
                onClick={addNewSection}
                className="w-full py-8 border-2 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/50 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <Plus size={24} />
                </div>
                <span className="font-bold">{isRtl ? 'إضافة قسم جديد مخصص لهذه الصفحة' : 'Add custom section to this page'}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
