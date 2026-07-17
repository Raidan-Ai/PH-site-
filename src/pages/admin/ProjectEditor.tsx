import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Save, ArrowLeft, Loader2, Image as ImageIcon, 
  Plus, Trash2, LayoutDashboard, Target,
  TrendingUp, DollarSign, Globe, Wand2, Users, Calendar, HelpCircle, Handshake
} from 'lucide-react';
import { Project } from '../../types';
import { api } from '../../services/api';
import { ImagePicker } from '../../components/admin/ImagePicker';
import { SmartTranslate } from '../../components/admin/SmartTranslate';

export default function ProjectEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const isNew = id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [activeFormTab, setActiveFormTab] = useState<'info' | 'goals' | 'beneficiaries' | 'activities' | 'partners'>('info');

  const [project, setProject] = useState<Partial<any>>({
    title: { ar: '', en: '' },
    description: { ar: '', en: '' },
    image: '',
    status: 'ongoing',
    fundingGoal: 0,
    currentFunding: 0,
    isFeatured: false,
    show_in_slider: false,
    slider_caption: { ar: '', en: '' },
    slider_button_text: { ar: '', en: '' },
    slider_image: '',
    beneficiaries_count: 0,
    start_date: '',
    end_date: '',
    goals: '[]',
    activities: '[]',
    partner_id: '',
    seo: {
      title: { ar: '', en: '' },
      description: { ar: '', en: '' },
      keywords: { ar: '', en: '' }
    },
    createdAt: new Date().toISOString()
  });

  const [goalsList, setGoalsList] = useState<string[]>([]);
  const [activitiesList, setActivitiesList] = useState<{name: string, date: string}[]>([]);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);

  useEffect(() => {
    if (!isNew && id) {
      const fetchProject = async () => {
        try {
          const res = await api.get('/api/projects');
          const data = res.data.find((p: any) => String(p.id) === String(id));
          if (data) {
            setProject({
              ...data,
              show_in_slider: data.show_in_slider === 1 || data.show_in_slider === true,
              slider_caption: typeof data.slider_caption === 'string' ? JSON.parse(data.slider_caption) : (data.slider_caption || {ar: '', en: ''}),
              slider_button_text: typeof data.slider_button_text === 'string' ? JSON.parse(data.slider_button_text) : (data.slider_button_text || {ar: '', en: ''}),
              title: typeof data.title === 'string' ? JSON.parse(data.title) : (data.title || {ar: '', en: ''}),
              description: typeof data.description === 'string' ? JSON.parse(data.description) : (data.description || {ar: '', en: ''}),
              seo: typeof data.seo === 'string' ? JSON.parse(data.seo) : (data.seo || {title: {ar: '', en: ''}, description: {ar: '', en: ''}, keywords: {ar: '', en: ''}}),
              goals: data.goals || '[]',
              activities: data.activities || '[]',
              partner_id: data.partner_id || '',
              beneficiaries_count: data.beneficiaries_count || 0,
              start_date: data.start_date || '',
              end_date: data.end_date || ''
            });
          }
        } catch (error) {
          console.error("Error fetching project:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchProject();
    }
  }, [id, isNew]);

  // Synchronize dynamic JSON fields to local arrays on project change
  useEffect(() => {
    try {
      if (project.goals) {
        setGoalsList(JSON.parse(project.goals));
      } else {
        setGoalsList([]);
      }
    } catch {
      setGoalsList(project.goals ? [project.goals] : []);
    }

    try {
      if (project.activities) {
        setActivitiesList(JSON.parse(project.activities));
      } else {
        setActivitiesList([]);
      }
    } catch {
      setActivitiesList([]);
    }
  }, [project.goals, project.activities]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldKey: 'image' | 'slider_image') => {
    if (!e.target.files?.length) return;
    setUploadingImage(fieldKey);
    try {
      const formData = new FormData();
      formData.append('file', e.target.files[0]);
      const res = await api.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProject(prev => ({ ...prev, [fieldKey]: res.data.url }));
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setUploadingImage(null);
    }
  };

  const handleTranslateSEO = async (field: 'title' | 'description' | 'keywords', sourceLang: 'ar' | 'en') => {
    const textToTranslate = project.seo?.[field]?.[sourceLang];
    if (!textToTranslate) return;

    setTranslating(true);
    try {
      const targetLang = sourceLang === 'ar' ? 'en' : 'ar';
      const { translateText } = await import('../../services/AIService');
      const translated = await translateText(textToTranslate, targetLang);
      
      setProject({ 
        ...project, 
        seo: { 
          ...project.seo!, 
          [field]: { 
            ...(project.seo?.[field] || { ar: '', en: '' }), 
            [targetLang]: translated 
          } 
        } 
      });
    } catch (error) {
      alert(isRtl ? 'فشل الترجمة' : 'Translation failed');
    } finally {
      setTranslating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      ...project,
      isFeatured: !!project.isFeatured,
      goals: JSON.stringify(goalsList),
      activities: JSON.stringify(activitiesList)
    };
    try {
      if (isNew) {
        await api.post('/api/projects', payload);
      } else {
        await api.put(`/api/projects/${id}`, payload);
      }
      navigate('/admin/projects');
    } catch (error) {
      console.error("Error saving project:", error);
      alert(isRtl ? 'حدث خطأ أثناء الحفظ' : 'Error saving project');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  return (
    <div className="space-y-8 pb-24 text-start" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center">
        <button 
          onClick={() => navigate('/admin/projects')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-colors cursor-pointer"
        >
          <ArrowLeft size={20} className={isRtl ? 'rotate-180' : ''} />
          {isRtl ? 'العودة للمشاريع' : 'Back to Projects'}
        </button>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 cursor-pointer"
        >
          {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          {isRtl ? 'حفظ كافة تفاصيل المشروع' : 'Save Project Details'}
        </button>
      </div>

      {/* Tabs Menu Indicator */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto">
        <button 
          type="button"
          onClick={() => setActiveFormTab('info')}
          className={`px-5 py-3 font-bold text-sm transition-all rounded-t-xl cursor-pointer border-b-2 flex items-center gap-2 ${activeFormTab === 'info' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <LayoutDashboard size={16} />
          {isRtl ? 'معلومات الهوية وميديا' : 'General & Media'}
        </button>
        <button 
          type="button"
          onClick={() => setActiveFormTab('goals')}
          className={`px-5 py-3 font-bold text-sm transition-all rounded-t-xl cursor-pointer border-b-2 flex items-center gap-2 ${activeFormTab === 'goals' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <Target size={16} />
          {isRtl ? 'أهداف المبادرة' : 'Core Objectives'}
        </button>
        <button 
          type="button"
          onClick={() => setActiveFormTab('beneficiaries')}
          className={`px-5 py-3 font-bold text-sm transition-all rounded-t-xl cursor-pointer border-b-2 flex items-center gap-2 ${activeFormTab === 'beneficiaries' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <Users size={16} />
          {isRtl ? 'المستهدفون وحجم الأثر' : 'Beneficiaries & Impact'}
        </button>
        <button 
          type="button"
          onClick={() => setActiveFormTab('activities')}
          className={`px-5 py-3 font-bold text-sm transition-all rounded-t-xl cursor-pointer border-b-2 flex items-center gap-2 ${activeFormTab === 'activities' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <Calendar size={16} />
          {isRtl ? 'الأنشطة والجدول الزمني' : 'Activities & Dates'}
        </button>
        <button 
          type="button"
          onClick={() => setActiveFormTab('partners')}
          className={`px-5 py-3 font-bold text-sm transition-all rounded-t-xl cursor-pointer border-b-2 flex items-center gap-2 ${activeFormTab === 'partners' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <Handshake size={16} />
          {isRtl ? 'الشركاء والمانحون' : 'Partners & Donors'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left main pane (Changes based on activeFormTab) */}
        <div className="lg:col-span-2 space-y-8">
          {activeFormTab === 'info' && (
            <div className="space-y-8">
              {/* Basic Details */}
              <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <LayoutDashboard className="text-blue-600" size={24} />
                  {isRtl ? 'البيانات الصحفية العامة للمشروع' : 'General Project Metadata'}
                </h3>

                <div className="space-y-4 text-start">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-500 uppercase">{isRtl ? 'العنوان (بالعربية)' : 'Title (Arabic)'}</label>
                        <SmartTranslate 
                          text={project.title?.ar || ''} 
                          onTranslate={(translated) => setProject(p => ({ ...p, title: { ...p.title!, en: translated } }))} 
                        />
                      </div>
                      <input 
                        type="text"
                        value={project.title?.ar || ''}
                        onChange={(e) => setProject({ ...project, title: { ...project.title!, ar: e.target.value } })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-xs"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">{isRtl ? 'العنوان (بالإنجليزية)' : 'Title (English)'}</label>
                      <input 
                        type="text"
                        value={project.title?.en || ''}
                        onChange={(e) => setProject({ ...project, title: { ...project.title!, en: e.target.value } })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-500 uppercase">{isRtl ? 'الوصف والتفاصيل (بالعربية)' : 'Description (Arabic)'}</label>
                      <SmartTranslate 
                        text={project.description?.ar || ''} 
                        onTranslate={(translated) => setProject(p => ({ ...p, description: { ...p.description!, en: translated } }))} 
                      />
                    </div>
                    <textarea 
                      rows={6}
                      value={project.description?.ar || ''}
                      onChange={(e) => setProject({ ...project, description: { ...project.description!, ar: e.target.value } })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">{isRtl ? 'الوصف والتفاصيل (بالإنجليزية)' : 'Description (English)'}</label>
                    <textarea 
                      rows={6}
                      value={project.description?.en || ''}
                      onChange={(e) => setProject({ ...project, description: { ...project.description!, en: e.target.value } })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* SEO Dynamic Generation */}
              <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Globe className="text-blue-600" size={24} />
                  {isRtl ? 'تهيئة وتحسين محركات البحث للفصل الصحفي (SEO)' : 'SEO Metadata Optimization'}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4" dir="rtl">
                    <h4 className="font-bold text-slate-600 text-sm border-b pb-2">العربية</h4>
                    <div className="space-y-3">
                      <div className="relative">
                        <input 
                          type="text"
                          placeholder="عنوان الميتا"
                          value={project.seo?.title?.ar || ''}
                          onChange={(e) => setProject({ ...project, seo: { ...project.seo!, title: { ...project.seo!.title, ar: e.target.value } } })}
                          className="w-full px-4 py-3 pr-10 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold"
                        />
                        <button type="button" onClick={() => handleTranslateSEO('title', 'ar')} className="absolute right-3 top-3.5 text-slate-400 hover:text-blue-600 pointer-events-auto">
                          {translating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                        </button>
                      </div>
                      <div className="relative">
                        <textarea 
                          placeholder="وصف الميتا"
                          rows={3}
                          value={project.seo?.description?.ar || ''}
                          onChange={(e) => setProject({ ...project, seo: { ...project.seo!, description: { ...project.seo!.description, ar: e.target.value } } })}
                          className="w-full px-4 py-3 pr-10 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
                        />
                        <button type="button" onClick={() => handleTranslateSEO('description', 'ar')} className="absolute right-3 top-3.5 text-slate-400 hover:text-blue-600 pointer-events-auto">
                          {translating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-600 text-sm border-b pb-2">English</h4>
                    <div className="space-y-3">
                      <div className="relative">
                        <input 
                          type="text"
                          placeholder="Meta Title"
                          value={project.seo?.title?.en || ''}
                          onChange={(e) => setProject({ ...project, seo: { ...project.seo!, title: { ...project.seo!.title, en: e.target.value } } })}
                          className="w-full px-4 py-3 pl-10 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        />
                        <button type="button" onClick={() => handleTranslateSEO('title', 'en')} className="absolute left-3 top-3.5 text-slate-400 hover:text-blue-600 pointer-events-auto">
                          {translating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                        </button>
                      </div>
                      <div className="relative">
                        <textarea 
                          placeholder="Meta Description"
                          rows={3}
                          value={project.seo?.description?.en || ''}
                          onChange={(e) => setProject({ ...project, seo: { ...project.seo!, description: { ...project.seo!.description, en: e.target.value } } })}
                          className="w-full px-4 py-3 pl-10 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
                        />
                        <button type="button" onClick={() => handleTranslateSEO('description', 'en')} className="absolute left-3 top-3.5 text-slate-400 hover:text-blue-600 pointer-events-auto">
                          {translating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeFormTab === 'goals' && (
            <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Target className="text-red-500" size={24} />
                    {isRtl ? 'الأهداف الاستراتيجية للمشروع' : 'Strategic Project Objectives'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">{isRtl ? 'قم بإضافة غايات واضحة وقابلة للقياس للمشروع.' : 'Define core milestones and target goal statements.'}</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setGoalsList([...goalsList, ''])}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={14} />
                  {isRtl ? 'إضافة هدف جديد' : 'Add Goal'}
                </button>
              </div>

              <div className="space-y-3">
                {goalsList.map((goal, idx) => (
                  <div key={idx} className="flex gap-2 items-center animate-in fade-in slide-in-from-top-1 duration-200">
                    <span className="w-8 h-8 rounded-full bg-red-50 text-red-600 font-bold flex items-center justify-center font-mono text-xs">{idx + 1}</span>
                    <input 
                      type="text"
                      value={goal}
                      onChange={(e) => {
                        const copy = [...goalsList];
                        copy[idx] = e.target.value;
                        setGoalsList(copy);
                      }}
                      placeholder={isRtl ? 'مثال: تمكين 50 صحفية يمنية من أدوات السلامة المهنية الرقمية.' : 'e.g. Train journalists on digital risk assessment.'}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        setGoalsList(goalsList.filter((_, gIdx) => gIdx !== idx));
                      }}
                      className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                
                {goalsList.length === 0 && (
                  <div className="text-center py-12 text-slate-300 border border-dashed rounded-2xl flex flex-col items-center justify-center gap-2">
                    <Target size={36} />
                    <span className="text-xs font-bold">{isRtl ? 'لم يتم إضافة أهداف بعد. انقر على الزر بالأعلى لإضافة هدفك الأول.' : 'No goals found. Click the button to configure project targets.'}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeFormTab === 'beneficiaries' && (
            <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Users className="text-indigo-500" size={24} />
                {isRtl ? 'المستفيدون المباشرون وحجم التأثير' : 'Target Beneficiaries & Target Count'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{isRtl ? 'إجمالي عدد المستفيدين الكلي المستهدف (الرقم الإحصائي للتقرير البصري)' : 'Total direct beneficiaries count'}</label>
                  <div className="relative">
                    <input 
                      type="number"
                      required
                      value={project.beneficiaries_count || 0}
                      onChange={(e) => setProject({ ...project, beneficiaries_count: Number(e.target.value) })}
                      placeholder="150"
                      className="w-full px-4 py-3 pl-10 rounded-xl border border-slate-200 outline-none text-sm font-bold font-mono"
                    />
                    <Users className="absolute left-3 top-3.5 text-slate-400" size={16} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{isRtl ? 'النطاق والموقع الجغرافي (المحافظة)' : 'Governorate Location Scope'}</label>
                  <input 
                    type="text"
                    value={project.location_governorate || ''}
                    onChange={(e) => setProject({ ...project, location_governorate: e.target.value })}
                    placeholder={isRtl ? 'صنعاء، عدن، تعز، مأرب' : 'Sanaa, Aden, Taiz, Marib'}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{isRtl ? 'الفئات المستفيدة بالتفصيل' : 'Beneficiary Target Demographics'}</label>
                <textarea 
                  rows={4}
                  value={project.deliverables || ''}
                  onChange={(e) => setProject({ ...project, deliverables: e.target.value })}
                  placeholder={isRtl ? 'صحفيون مستقلون، مراسلون حقوقيون ونشطاء المجتمع المدني في اليمن...' : 'Journalists, community monitors, female field correspondents...'}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none text-sm resize-none"
                />
              </div>
            </div>
          )}

          {activeFormTab === 'activities' && (
            <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Calendar className="text-green-500" size={24} />
                    {isRtl ? 'موعد الأنشطة والجدول الزمني لتنفيذها' : 'Project Activities & Dates'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">{isRtl ? 'قم برصد وتدوين خطة الأنشطة التنفيذية ومواعيد العمل المجدولة.' : 'Log specific events, workshops, or activities by date.'}</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setActivitiesList([...activitiesList, { name: '', date: '' }])}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={14} />
                  {isRtl ? 'إضافة نشاط مجدول' : 'Add Activity'}
                </button>
              </div>

              <div className="space-y-4">
                {activitiesList.map((act, idx) => (
                  <div key={idx} className="flex flex-col md:flex-row gap-3 items-start md:items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 animate-in fade-in slide-in-from-top-1 duration-200">
                    <span className="w-8 h-8 rounded-full bg-green-100 text-green-700 font-bold flex items-center justify-center font-mono text-xs shrink-0">{idx + 1}</span>
                    <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <input 
                          type="text"
                          value={act.name}
                          onChange={(e) => {
                            const copy = [...activitiesList];
                            copy[idx].name = e.target.value;
                            setActivitiesList(copy);
                          }}
                          placeholder={isRtl ? 'عنوان النشاط (مثال: ورش تدريبية للصحافة الإنسانية)' : 'Activity title'}
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white outline-none text-sm"
                        />
                      </div>
                      <div>
                        <input 
                          type="text"
                          value={act.date}
                          onChange={(e) => {
                            const copy = [...activitiesList];
                            copy[idx].date = e.target.value;
                            setActivitiesList(copy);
                          }}
                          placeholder={isRtl ? 'الفترة المجدولة (مثال: يونيو - أغسطس 2026)' : 'Scheduled dates/range'}
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white outline-none text-sm font-bold text-slate-700"
                        />
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        setActivitiesList(activitiesList.filter((_, aIdx) => aIdx !== idx));
                      }}
                      className="p-2 text-red-500 hover:bg-red-100/50 rounded-xl transition-colors cursor-pointer self-end md:self-auto"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}

                {activitiesList.length === 0 && (
                  <div className="text-center py-12 text-slate-300 border border-dashed rounded-2xl flex flex-col items-center justify-center gap-2">
                    <Calendar size={36} />
                    <span className="text-xs font-bold">{isRtl ? 'لا يوجد أنشطة مضافة لهذا المشروع.' : 'No scheduled activities found.'}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeFormTab === 'partners' && (
            <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Handshake className="text-amber-500" size={24} />
                {isRtl ? 'الشركاء والجهات الدولية والمحلية الداعمة للمشروع' : 'Partners & Sponsoring Bodies'}
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{isRtl ? 'أسماء الجهات الشريكة والشركاء الرئيسيين (مفصولة بفاصلة)' : 'Partner names or donor agencies (comma separated)'}</label>
                  <textarea 
                    rows={4}
                    value={project.partner_id || ''}
                    onChange={(e) => setProject({ ...project, partner_id: e.target.value })}
                    placeholder={isRtl ? 'مثال: بعثة الاتحاد الأوروبي، نقابة الصحفيين اليمنيين، مؤسسة شركاء اليمن...' : 'e.g. European Union Delegation, UNESCO, Yemen Journalists Syndicate'}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none text-sm font-bold text-slate-800"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right side static configuration pane */}
        <div className="space-y-8">
          {/* Slider and Home screen publishing */}
          <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ImageIcon className="text-blue-600" size={20} />
                {isRtl ? 'خيارات الجبهة الرئيسية السلايدر' : 'Slider & Spotlight'}
              </h3>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={project.show_in_slider}
                  onChange={(e) => setProject({...project, show_in_slider: e.target.checked})}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {project.show_in_slider && (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300 border-t pt-4 text-start">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'صورة السلايدر المخصصة' : 'Slider Image'}</label>
                  <ImagePicker 
                    value={project.slider_image || ''} 
                    onChange={(url) => setProject({...project, slider_image: url})} 
                  />
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'العنوان العربي البارز للسلايدر' : 'Arabic Caption'}</label>
                    <input 
                      type="text"
                      value={project.slider_caption?.ar || ''}
                      onChange={(e) => setProject({...project, slider_caption: { ...project.slider_caption!, ar: e.target.value }})}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Budget, Goals, and Current statuses */}
          <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                <div className="space-y-0.5">
                  <label className="text-sm font-bold text-slate-900">{isRtl ? 'مشروع مميز ومثبت' : 'Featured Project'}</label>
                  <p className="text-[10px] text-slate-500">{isRtl ? 'سيظهر بامتياز في صدارة الصفحة الرئيسية.' : 'Highly featured project indicators.'}</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setProject({ ...project, isFeatured: !project.isFeatured })}
                  className={`w-12 h-6 rounded-full transition-all duration-300 relative ${project.isFeatured ? 'bg-blue-600' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${project.isFeatured ? (isRtl ? 'translate-x-[-24px]' : 'translate-x-6') : 'translate-x-0'} ${isRtl ? 'right-1' : 'left-1'}`} />
                </button>
              </div>

              <label className="block text-sm font-bold text-slate-700">{isRtl ? 'حالة التفعيل والإنجاز الحالية' : 'Project Status'}</label>
              <select 
                value={project.status || 'ongoing'}
                onChange={(e) => setProject({ ...project, status: e.target.value as any })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold bg-white"
              >
                <option value="ongoing">{isRtl ? 'قيد التنفيذ والمستمر' : 'Ongoing'}</option>
                <option value="completed">{isRtl ? 'مكتمل ومنتهي بنجاح' : 'Completed'}</option>
                <option value="seeking_funding">{isRtl ? 'بانتظار وتنسيق التمويل' : 'Seeking Funding'}</option>
              </select>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-700">{isRtl ? 'موازنة المشروع الكلية المستهدفة ($)' : 'Project Budget Goal ($)'}</label>
              <div className="relative">
                <input 
                  type="number"
                  value={project.fundingGoal || 0}
                  onChange={(e) => setProject({ ...project, fundingGoal: Number(e.target.value) })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold font-mono"
                />
                <DollarSign className="absolute left-3 top-3.5 text-slate-400" size={18} />
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-700">{isRtl ? 'التمويل الكلي المحقق حتى اليوم ($)' : 'Confirmed Received Funds ($)'}</label>
              <div className="relative">
                <input 
                  type="number"
                  value={project.currentFunding || 0}
                  onChange={(e) => setProject({ ...project, currentFunding: Number(e.target.value) })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold font-mono"
                />
                <TrendingUp className="absolute left-3 top-3.5 text-slate-400" size={18} />
              </div>
            </div>
          </div>

          {/* Project Featured Image */}
          <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ImageIcon className="text-blue-600" size={20} />
              {isRtl ? 'غلاف الملف البصري للمشروع' : 'Primary Project Banner'}
            </h3>
            <div className="space-y-4 text-start">
              <ImagePicker 
                value={project.image || ''} 
                onChange={(url) => setProject({...project, image: url})} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
