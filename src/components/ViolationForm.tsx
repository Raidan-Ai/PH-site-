import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Send, AlertCircle, CheckCircle2, Loader2, Calendar, MapPin, User, ShieldAlert, FileText, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { api } from '../services/api';

interface ViolationFormProps {
  onSuccess: () => void;
}

export default function ViolationForm({ onSuccess }: ViolationFormProps) {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    reporterType: 'victim', // victim | reporter
    reporterName: '',
    reporterPhone: '',
    reporterRelation: '', // colleague | lawyer | family | witness | other
    victimName: '',
    victimPenName: '',
    victimInstitution: '',
    victimSocials: '',
    victimPhone: '',
    governorate: '',
    district: '',
    date: '',
    perpetrator: [] as string[], // array of string values
    violationReason: '',
    type: '', // violation main category
    description: '',
    evidenceTypes: [] as string[],
    evidenceLinks: '',
    needs: [] as string[],
    privacyPolicy: 'anonymous', // public | anonymous | secret
    status: 'pending',
  });

  const governorates = [
    'أمانة العاصمة صنعاء', 'عدن', 'تعز', 'الحديدة', 'مأرب', 'حضرموت', 'شبوة', 'إب', 'ذمار', 'لحج', 'الضالع', 'أبين', 'صعدة', 'عمران', 'حجة', 'البيضاء', 'المهرة', 'سقطرى', 'المحويت', 'ريمة', 'الجوف'
  ];

  const violationCategories = [
    { ar: 'اعتقال واحتجاز تعسفي', en: 'Arbitrary Arrest & Detention' },
    { ar: 'اعتداء جسدي أو تعذيب', en: 'Physical Assault or Torture' },
    { ar: 'تهديد مباشر وترهيب', en: 'Direct Threat & Intimidation' },
    { ar: 'حجب مواقع ومنصات إلكترونية', en: 'Website Blocking & Censorship' },
    { ar: 'اقتحام مقر أو مصادرة معدات', en: 'Raid on Office or Equipment Seizure' },
    { ar: 'ملاحقة قضائية ومحاكمة غير عادلة', en: 'Prosecution & Unfair Trial' },
    { ar: 'إخفاء قسري واختطاف', en: 'Enforced Disappearance / Abduction' },
    { ar: 'فصل تعسفي وإيقاف الراتب', en: 'Arbitrary Dismissal & Salary Suspension' },
    { ar: 'اعتداء لفظي وحملات تشهير', en: 'Verbal Abuse & Smear Campaigns' },
    { ar: 'أخرى', en: 'Other' }
  ];

  const perpetratorsList = [
    { key: 'ansar_allah', ar: 'جماعة أنصار الله الحوثيين', en: 'Ansar Allah Houthi Group' },
    { key: 'stc', ar: 'قوات المجلس الانتقالي الجنوبي والحزام الأمني', en: 'Southern Transitional Council & Security Belt' },
    { key: 'government', ar: 'قوات الحكومة الشرعية والأمن العام', en: 'Legitimate Government Forces & Public Security' },
    { key: 'national_resistance', ar: 'قوات المقاومة الوطنية في الساحل الغربي', en: 'National Resistance Forces (West Coast)' },
    { key: 'coalition_backed', ar: 'تشكيلات عسكرية مدعومة من التحالف', en: 'Coalition-Supported Military Formations' },
    { key: 'extremists', ar: 'تنظيمات متطرفة القاعدة أو داعش', en: 'Extremist Groups (Al-Qaeda / ISIS)' },
    { key: 'tribal', ar: 'مسلحون قبليون', en: 'Tribal Gunmen' },
    { key: 'unknown', ar: 'عصابات مجهولة أو قطاع طرق', en: 'Unknown Gangs or Highwaymen' },
    { key: 'employer', ar: 'جهة العمل المؤسسة الإعلامية نفسها', en: 'The Employer Media Institution itself' }
  ];

  const evidenceTypesList = [
    { key: 'photos', ar: 'صور إصابات', en: 'Injury Photos' },
    { key: 'threats', ar: 'رسائل تهديد', en: 'Threat Messages' },
    { key: 'judicial', ar: 'وثائق قضائية', en: 'Judicial Documents' },
    { key: 'video', ar: 'فيديو', en: 'Video' },
    { key: 'none', ar: 'لا يوجد حالياً', en: 'None at the moment' }
  ];

  const needsList = [
    { key: 'legal', ar: 'دعم قانوني ومحام', en: 'Legal Support & Lawyer' },
    { key: 'medical', ar: 'تدخل طبي عاجل', en: 'Urgent Medical Intervention' },
    { key: 'safety', ar: 'نقل لمكان آمن', en: 'Transfer to a Safe Place' },
    { key: 'psychological', ar: 'دعم نفسي', en: 'Psychological Support' },
    { key: 'documentation', ar: 'مجرد توثيق للواقعة', en: 'Just Documentation' },
    { key: 'solidarity', ar: 'نشر وتضامن إعلامي', en: 'Publishing & Media Solidarity' }
  ];

  const privacyPolicies = [
    { key: 'public', ar: 'نشر القصة كاملة للرأي العام', en: 'Publish the full story to the general public' },
    { key: 'anonymous', ar: 'النشر مع إخفاء هوية الصحفي', en: 'Publish with the journalist\'s identity hidden' },
    { key: 'secret', ar: 'حفظها في الأرشيف السري وعدم النشر نهائياً', en: 'Keep in the secret archives and do not publish at all' }
  ];

  // Helper toggle functions
  const handleCheckboxChange = (field: 'perpetrator' | 'evidenceTypes' | 'needs', value: string) => {
    const current = [...formData[field]] as string[];
    if (current.includes(value)) {
      setFormData({ ...formData, [field]: current.filter(item => item !== value) });
    } else {
      setFormData({ ...formData, [field]: [...current, value] });
    }
  };

  const handleNext = () => {
    // Basic step validation
    if (step === 1) {
      if (formData.reporterType === 'reporter' && (!formData.reporterName || !formData.reporterPhone)) {
        alert(isRtl ? 'الرجاء ملء جميع بيانات المبلّغ المطلوبة.' : 'Please fill all required reporter information.');
        return;
      }
    } else if (step === 2) {
      if (!formData.victimName) {
        alert(isRtl ? 'الرجاء إدخال الاسم الرباعي للصحفي.' : 'Please enter the quadruple name of the journalist.');
        return;
      }
    } else if (step === 3) {
      if (!formData.governorate) {
        alert(isRtl ? 'الرجاء اختيار المحافظة.' : 'Please select the governorate.');
        return;
      }
      if (!formData.date) {
        alert(isRtl ? 'الرجاء تحديد تاريخ الانتهاك.' : 'Please select the date of violation.');
        return;
      }
      if (!formData.type) {
        alert(isRtl ? 'الرجاء اختيار تصنيف الانتهاك.' : 'Please select the violation category.');
        return;
      }
    } else if (step === 4) {
      if (formData.perpetrator.length === 0) {
        alert(isRtl ? 'الرجاء اختيار جهة واحدة على الأقل قامت بالانتهاك.' : 'Please select at least one violating entity.');
        return;
      }
      if (!formData.description) {
        alert(isRtl ? 'الرجاء سرد تفاصيل القصة الكاملة.' : 'Please provide the full story description.');
        return;
      }
    }
    setStep(step + 1);
  };

  const handlePrev = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          data.append(key, JSON.stringify(value));
        } else {
          data.append(key, value as string);
        }
      });
      if (file) {
        data.append('evidenceFile', file);
      }
      
      await api.post('/api/violations', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSubmitted(true);
      setTimeout(onSuccess, 4000);
    } catch (error) {
      console.error("Error submitting violation", error);
      alert(isRtl ? "حدث خطأ أثناء الإرسال" : "Error submitting report");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-white p-12 rounded-[32px] shadow-sm border border-slate-200 text-center space-y-6 max-w-2xl mx-auto">
        <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
          <CheckCircle2 size={40} className="animate-bounce" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">
          {isRtl ? 'تم استقبال البلاغ بنجاح وتوثيقه' : 'Report Logged Successfully'}
        </h2>
        <p className="text-slate-500 leading-relaxed max-w-md mx-auto">
          {isRtl 
            ? 'نشكرك على شجاعتك وثقتك بمرصد بيت الصحافة للحريات. سيقوم فريق تقصي الحقائق ووحدة الرصد القانوني بالتعامل مع البيانات بسرية تامة ومطابقتها طبقاً لسياسة الخصوصية التي حددتها.' 
            : 'Thank you for your courage. Our fact-checking unit and legal observatory will handle your data in strict confidentiality and align with the privacy policies you assigned.'}
        </p>
        <div className="text-xs text-slate-400 font-mono mt-4">
          {isRtl ? 'جاري إعادة تحويلك للرئيسية...' : 'Redirecting back to dashboard...'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Progress Header */}
        <div className="bg-slate-50 px-8 py-5 flex justify-between items-center border-b border-slate-100 select-none">
          <div className="flex gap-2.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <div 
                key={s} 
                className={cn(
                  "h-2.5 rounded-full transition-all",
                  step === s ? "w-10 bg-blue-600" : step > s ? "w-6 bg-blue-400" : "w-2.5 bg-slate-200"
                )} 
              />
            ))}
          </div>
          <span className="text-xs font-black text-slate-500 uppercase tracking-widest font-mono">
            {isRtl ? `الخطوة ${step} من 5` : `Step ${step} of 5`}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          
          {/* STEP 1: Reporter Role & Contacts */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: isRtl ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <User className="text-blue-600" size={20} />
                  {isRtl ? 'من يكتب هذه السطور؟' : 'Who is submitting this report?'}
                </h3>
                <p className="text-slate-500 text-xs">
                  {isRtl ? 'اختر صفتك لتحديد طريقة المتابعة والتوثيق الآمن للبلاغ.' : 'Select your capacity to help us process the incident securely.'}
                </p>
              </div>

              {/* Radio Group for Reporter Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label 
                  className={cn(
                    "border-2 rounded-2xl p-5 cursor-pointer flex flex-col justify-between transition-all hover:border-blue-400",
                    formData.reporterType === 'victim' ? "border-blue-600 bg-blue-50/20" : "border-slate-200"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-800 text-sm">{isRtl ? 'أنا الصحفي المتضرر شخصياً' : 'I am the victim journalist myself'}</span>
                    <input 
                      type="radio" 
                      name="reporterType" 
                      value="victim" 
                      checked={formData.reporterType === 'victim'}
                      onChange={() => setFormData({ ...formData, reporterType: 'victim' })}
                      className="text-blue-600 h-4 w-4 border-slate-300 focus:ring-blue-500"
                    />
                  </div>
                  <span className="text-xs text-slate-400 mt-3 leading-relaxed">
                    {isRtl ? 'سيتخطى البلاغ قسم بيانات الاتصال بالمبلغ الخارجي وينتقل مباشرة لهويتك وتفاصيل الانتهاك.' : 'The form will skip external notifier details and directly move to your incident identity details.'}
                  </span>
                </label>

                <label 
                  className={cn(
                    "border-2 rounded-2xl p-5 cursor-pointer flex flex-col justify-between transition-all hover:border-blue-400",
                    formData.reporterType === 'reporter' ? "border-blue-600 bg-blue-50/20" : "border-slate-200"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-800 text-sm">{isRtl ? 'أنا زميل / محامي / قريب أبلغ نيابة عنه' : 'I am reporting on behalf of the journalist'}</span>
                    <input 
                      type="radio" 
                      name="reporterType" 
                      value="reporter" 
                      checked={formData.reporterType === 'reporter'}
                      onChange={() => setFormData({ ...formData, reporterType: 'reporter' })}
                      className="text-blue-600 h-4 w-4 border-slate-300 focus:ring-blue-500"
                    />
                  </div>
                  <span className="text-xs text-slate-400 mt-3 leading-relaxed">
                    {isRtl ? 'سنطلب بعض تفاصيل الاتصال بك لنتمكن من مطابقة الأدلة والتحقق من التفاصيل الإضافية بمهنية.' : 'We will request your name and contact details to verify credentials and check additional facts.'}
                  </span>
                </label>
              </div>

              {/* Conditional Reporter Fields */}
              <AnimatePresence>
                {formData.reporterType === 'reporter' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-6 pt-4 border-t border-slate-100 overflow-hidden"
                  >
                    <h4 className="font-bold text-slate-800 text-sm">{isRtl ? 'بيانات الُمَبِّلغ نيابة عن الضحية:' : 'Notifier/Reporter Details:'}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{isRtl ? 'اسمك الكامل *' : 'Your Full Name *'}</label>
                        <input 
                          type="text" 
                          required
                          value={formData.reporterName}
                          onChange={(e) => setFormData({...formData, reporterName: e.target.value})}
                          placeholder={isRtl ? 'الاسم الثلاثي أو الرباعي' : 'Enter your full name'}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm font-semibold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{isRtl ? 'رقم هاتفك للتواصل *' : 'Your Contact Phone *'}</label>
                        <input 
                          type="tel" 
                          required
                          value={formData.reporterPhone}
                          onChange={(e) => setFormData({...formData, reporterPhone: e.target.value})}
                          placeholder="+967..."
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm font-semibold font-mono"
                        />
                        <span className="text-[10px] text-slate-400 block">{isRtl ? 'يرجى وضع مفتاح الدولة وكتابة الرقم الذي عليه واتساب.' : 'Please write your number with country code (WhatsApp preferred).'}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">{isRtl ? 'ما هي صلة القرابة أو العلاقة بالصحفي؟' : 'What is your relationship to the journalist?'}</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                        {[
                          { key: 'colleague', ar: 'زميل عمل', en: 'Colleague' },
                          { key: 'lawyer', ar: 'محامي العائلة', en: 'Family Lawyer' },
                          { key: 'family', ar: 'أحد أفراد الأسرة', en: 'Family Member' },
                          { key: 'witness', ar: 'شاهد عيان', en: 'Eye Witness' },
                          { key: 'other', ar: 'أخرى', en: 'Other' }
                        ].map((rel) => (
                          <button
                            type="button"
                            key={rel.key}
                            onClick={() => setFormData({ ...formData, reporterRelation: rel.key })}
                            className={cn(
                              "py-2.5 px-2 rounded-xl text-xs font-bold border transition-all text-center",
                              formData.reporterRelation === rel.key ? "bg-slate-900 border-slate-900 text-white" : "border-slate-200 hover:border-slate-400 text-slate-600"
                            )}
                          >
                            {isRtl ? rel.ar : rel.en}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3 text-blue-800 text-xs leading-relaxed">
                <AlertCircle size={20} className="shrink-0 text-blue-600" />
                <p>
                  {isRtl 
                    ? 'ميثاق الحماية والالتزام الأخلاقي ببيت الصحافة: جميع البيانات والأسماء والوثائق تعامل بالسرية الرقمية والحماية التامة ويقتصر الرصد لتوثيق وإعداد الملاحقة الجنائية والعدالة والمناصرة القانونية.' 
                    : 'Ethical Commitment & Safety Pact: All reporting files are strictly guarded with zero leakage policies, shared solely for the purpose of international advocacy, legal defense and historical preservation.'}
                </p>
              </div>

              <button 
                type="button" 
                onClick={handleNext}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-100 flex items-center justify-center gap-2"
              >
                {isRtl ? 'التالي' : 'Next'}
                <ArrowRight size={16} className={isRtl ? 'rotate-180' : ''} />
              </button>
            </motion.div>
          )}

          {/* STEP 2: Victim Identity Details */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: isRtl ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <User className="text-blue-600" size={20} />
                  {isRtl ? 'هوية الصحفي الضحية' : 'Identity of the Victim Journalist'}
                </h3>
                <p className="text-slate-500 text-xs">
                  {isRtl ? 'تحديد هوية الصحفي المستهدف بدقة يدعم فحص الأدلة وتوثيق الجرائم أمام لجان الرصد الدولية.' : 'Accurately detailing the target journalist credentials is key for validation before human rights committees.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{isRtl ? 'الاسم الرباعي للصحفي الضحية *' : 'Yemeni Quadruple Full Name *'}</label>
                  <input 
                    type="text" 
                    required
                    value={formData.victimName}
                    onChange={(e) => setFormData({...formData, victimName: e.target.value})}
                    placeholder={isRtl ? 'الاسم الكامل كما هو في الهوية' : 'Enter complete quadruple name'}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{isRtl ? 'الاسم الصحفي أو اسم الشهرة' : 'Journalistic / Pen Name'}</label>
                  <input 
                    type="text" 
                    value={formData.victimPenName}
                    onChange={(e) => setFormData({...formData, victimPenName: e.target.value})}
                    placeholder={isRtl ? 'اللقب الصحفي إن وجد' : 'e.g. Al-Yemeni, Pen name'}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{isRtl ? 'المؤسسة الإعلامية التي يعمل لصالحها' : 'Media Institution / Employer'}</label>
                  <input 
                    type="text" 
                    value={formData.victimInstitution}
                    onChange={(e) => setFormData({...formData, victimInstitution: e.target.value})}
                    placeholder={isRtl ? 'اسم القناة، الصحيفة، الموقع الإلكتروني' : 'Media outlet, channel, website'}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{isRtl ? 'رقم واتساب الصحفي المستهدف' : 'Journalist WhatsApp (Secure)'}</label>
                  <input 
                    type="tel" 
                    value={formData.victimPhone}
                    onChange={(e) => setFormData({...formData, victimPhone: e.target.value})}
                    placeholder="+967..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 text-sm font-semibold font-mono"
                  />
                  <span className="text-[10px] text-slate-400 block">{isRtl ? 'إذا كان متاحاً وآمناً للتواصل معه مباشرة.' : 'Only if available and safe for direct secure contacts.'}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">{isRtl ? 'روابط حسابات التواصل الاجتماعي للصحفي' : 'Journalist Social Media Accounts'}</label>
                <textarea 
                  rows={2}
                  value={formData.victimSocials}
                  onChange={(e) => setFormData({...formData, victimSocials: e.target.value})}
                  placeholder={isRtl ? 'مثال: فيسبوك، إكس، لينكد إن، أو روابط مقالات منشورة له...' : 'e.g., Facebook, X, LinkedIn, or sample articles authored...'}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 text-xs font-semibold"
                />
              </div>

              <div className="flex gap-4">
                <button 
                  type="button" 
                  onClick={handlePrev}
                  className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all border border-slate-200 flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={16} className={isRtl ? 'rotate-180' : ''} />
                  {isRtl ? 'السابق' : 'Back'}
                </button>
                <button 
                  type="button" 
                  onClick={handleNext}
                  className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  {isRtl ? 'التالي' : 'Next'}
                  <ArrowRight size={16} className={isRtl ? 'rotate-180' : ''} />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Geography, Date & Timing */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: isRtl ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="text-blue-600" size={20} />
                  {isRtl ? 'جغرافيا الحدث وتفاصيله' : 'Event Geography & Timeline'}
                </h3>
                <p className="text-slate-500 text-xs">
                  {isRtl ? 'يتم مطابقة البيانات جغرافياً ورسم مؤشرات الانتهاكات لرسم خرائط المخاطر والتهديدات في اليمن.' : 'Helps map hot zones, regional safety indexes and track systemic threat waves across Yemen.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{isRtl ? 'المحافظة التي وقع فيها الانتهاك *' : 'Governorate of Violation *'}</label>
                  <select 
                    required
                    value={formData.governorate}
                    onChange={(e) => setFormData({...formData, governorate: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
                  >
                    <option value="">{isRtl ? 'اختر المحافظة' : 'Select Governorate'}</option>
                    {governorates.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{isRtl ? 'المديرية أو المنطقة المحددة' : 'Specific District / Village'}</label>
                  <input 
                    type="text" 
                    value={formData.district}
                    onChange={(e) => setFormData({...formData, district: e.target.value})}
                    placeholder={isRtl ? 'المدينة، الحارة، أو اسم الشارع والمديرية' : 'e.g. Al-Tahrir, street or area name'}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{isRtl ? 'متى حدث ذلك؟ *' : 'When did this occur? *'}</label>
                  <input 
                    type="date" 
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 text-sm font-semibold font-mono"
                  />
                  <span className="text-[10px] text-slate-400 block">{isRtl ? 'مثال: 7 يناير 2025' : 'Select exact date of incident.'}</span>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{isRtl ? 'تصنيف نوع الانتهاك *' : 'Violation Class / Type *'}</label>
                  <select 
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
                  >
                    <option value="">{isRtl ? 'اختر نوع الانتهاك الرئيسي' : 'Select Violation Class'}</option>
                    {violationCategories.map(cat => (
                      <option key={cat.ar} value={cat.ar}>{isRtl ? cat.ar : cat.en}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  type="button" 
                  onClick={handlePrev}
                  className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all border border-slate-200 flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={16} className={isRtl ? 'rotate-180' : ''} />
                  {isRtl ? 'السابق' : 'Back'}
                </button>
                <button 
                  type="button" 
                  onClick={handleNext}
                  className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  {isRtl ? 'التالي' : 'Next'}
                  <ArrowRight size={16} className={isRtl ? 'rotate-180' : ''} />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Violating Entity (Perpetrators) & Narrative */}
          {step === 4 && (
            <motion.div initial={{ opacity: 0, x: isRtl ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <ShieldAlert className="text-blue-600" size={20} />
                  {isRtl ? 'الجهة المنتهكة والسياق' : 'Violating Entity & Context'}
                </h3>
                <p className="text-slate-500 text-xs">
                  {isRtl ? 'رصد دقيق للفاعلين والجهات المسؤولة عن الانتهاكات لتعزيز المساءلة الجنائية والعدالة والمحاسبة.' : 'Identify the precise forces responsible for the offense to support rule-of-law and future trials.'}
                </p>
              </div>

              {/* Checkboxes for Perpetrators */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">{isRtl ? 'من هي الجهة التي قامت بالانتهاك؟ (حدد كل الإجابات الملائمة) *' : 'Who is the entity that committed the violation? (Check all applicable) *'}</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {perpetratorsList.map((p) => {
                    const isChecked = formData.perpetrator.includes(p.ar);
                    return (
                      <button
                        type="button"
                        key={p.key}
                        onClick={() => handleCheckboxChange('perpetrator', p.ar)}
                        className={cn(
                          "p-4 rounded-2xl text-start border transition-all text-xs flex items-center justify-between gap-3 hover:border-slate-400 font-semibold leading-normal",
                          isChecked ? "bg-red-50/10 border-red-500 text-red-900 shadow-sm" : "bg-white border-slate-200 text-slate-700"
                        )}
                      >
                        <span>{isRtl ? p.ar : p.en}</span>
                        <div className={cn(
                          "w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all",
                          isChecked ? "border-red-600 bg-red-600 text-white" : "border-slate-300"
                        )}>
                          {isChecked && <Check size={12} strokeWidth={3} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">{isRtl ? 'لماذا حدث هذا الانتهاك برأيك؟' : 'Why did this violation happen in your opinion?'}</label>
                <textarea 
                  rows={2}
                  value={formData.violationReason}
                  onChange={(e) => setFormData({...formData, violationReason: e.target.value})}
                  placeholder={isRtl ? 'اشرح لنا السبب كما يراه الصحفي (مثال: بسبب تحقيق استقصائي، تغطية تظاهرات...)' : 'Explain the backdrop or context (e.g. investigative coverage, reporting protests...)'}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 text-xs font-semibold leading-relaxed"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">{isRtl ? 'سرد القصة الكاملة بالتفصيل *' : 'Detailed Full Story Narrative *'}</label>
                <textarea 
                  required
                  rows={5}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder={isRtl ? 'يرجى سرد الأحداث بالتفصيل الزمني ومكان وزمان وطبيعة التعدي والمشاركين، والوضع الحالي للصحفي.' : 'Detail the sequence of events, exact locations, threat mechanisms, actors involved and current state of the journalist.'}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 text-xs font-semibold leading-relaxed"
                />
              </div>

              <div className="flex gap-4">
                <button 
                  type="button" 
                  onClick={handlePrev}
                  className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all border border-slate-200 flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={16} className={isRtl ? 'rotate-180' : ''} />
                  {isRtl ? 'السابق' : 'Back'}
                </button>
                <button 
                  type="button" 
                  onClick={handleNext}
                  className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  {isRtl ? 'التالي' : 'Next'}
                  <ArrowRight size={16} className={isRtl ? 'rotate-180' : ''} />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 5: Evidence, Safety & Privacy Policy */}
          {step === 5 && (
            <motion.div initial={{ opacity: 0, x: isRtl ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="text-blue-600" size={20} />
                  {isRtl ? 'الأدلة والتوثيق والخصوصية' : 'Evidence, Recommendations & Privacy'}
                </h3>
                <p className="text-slate-500 text-xs">
                  {isRtl ? 'السرية والأمان هما ركائز توثيق الانتهاكات في اليمن. تحكم بسياسة نشر معلوماتك تماماً.' : 'Secure processing, strict confidentiality and direct alignment with your selected privacy tier.'}
                </p>
              </div>

              {/* Evidence Types Checkboxes */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">{isRtl ? 'هل تتوفر لديكم وثائق أو أدلة؟ (حدد كل الإجابات الملائمة)' : 'Do you have documents or evidence? (Select all applicable)'}</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {evidenceTypesList.map((e) => {
                    const isChecked = formData.evidenceTypes.includes(e.ar);
                    return (
                      <button
                        type="button"
                        key={e.key}
                        onClick={() => handleCheckboxChange('evidenceTypes', e.ar)}
                        className={cn(
                          "py-3 px-2 rounded-xl text-xs font-bold border transition-all text-center flex flex-col justify-center items-center gap-2",
                          isChecked ? "bg-blue-50/20 border-blue-600 text-blue-900" : "bg-white border-slate-200 text-slate-600 hover:border-slate-400"
                        )}
                      >
                        <span>{isRtl ? e.ar : e.en}</span>
                        {isChecked && <span className="w-2 h-2 rounded-full bg-blue-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">{isRtl ? 'إرفاق صور أو وثائق المعاينة' : 'Attach evidence files/images'}</label>
                <input 
                  type="file" 
                  onChange={handleFileChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs"
                />
              </div>

              {/* Evidence Drive Link */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">{isRtl ? 'رابط للملفات والأدلة' : 'Link to Files & Evidence'}</label>
                <input 
                  type="url" 
                  value={formData.evidenceLinks}
                  onChange={(e) => setFormData({...formData, evidenceLinks: e.target.value})}
                  placeholder="https://drive.google.com/..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 text-xs font-semibold font-mono"
                />
                <span className="text-[10px] text-slate-400 block">{isRtl ? 'يرجى وضع رابط جوجل درايف أو ون درايف أو إشارة لوجود ملفات وسيقوم فريق التوثيق بالتواصل الآمن معكم لطلبها.' : 'Provide Google Drive / OneDrive link, or outline existence so our safety teams can query them securely.'}</span>
              </div>

              {/* Needs Checkboxes */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">{isRtl ? 'ماذا يحتاج الصحفي الآن بشكل عاجل؟ (حدد كل الإجابات الملائمة)' : 'What does the journalist urgently need right now? (Select all applicable)'}</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {needsList.map((n) => {
                    const isChecked = formData.needs.includes(n.ar);
                    return (
                      <button
                        type="button"
                        key={n.key}
                        onClick={() => handleCheckboxChange('needs', n.ar)}
                        className={cn(
                          "p-3 rounded-xl border text-start text-xs font-semibold flex items-center justify-between gap-3 hover:border-slate-400",
                          isChecked ? "bg-amber-50/20 border-amber-500 text-amber-900" : "bg-white border-slate-200 text-slate-700"
                        )}
                      >
                        <span>{isRtl ? n.ar : n.en}</span>
                        <div className={cn(
                          "w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all",
                          isChecked ? "border-amber-600 bg-amber-600 text-white" : "border-slate-300"
                        )}>
                          {isChecked && <Check size={10} strokeWidth={3} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Privacy Policy Radio Grid */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">{isRtl ? 'سياسة النشر والخصوصية *' : 'Publishing & Privacy Policy *'}</label>
                <div className="flex flex-col gap-3">
                  {privacyPolicies.map((policy) => {
                    const isSelected = formData.privacyPolicy === policy.key;
                    return (
                      <label 
                        key={policy.key}
                        className={cn(
                          "border-2 rounded-2xl p-4 cursor-pointer flex items-center justify-between transition-all hover:border-blue-400",
                          isSelected ? "border-blue-600 bg-blue-50/10" : "border-slate-100"
                        )}
                      >
                        <div className="flex flex-col text-start">
                          <span className="font-extrabold text-slate-800 text-xs">{isRtl ? policy.ar : policy.en}</span>
                        </div>
                        <input 
                          type="radio" 
                          name="privacyPolicy" 
                          value={policy.key} 
                          checked={isSelected}
                          onChange={() => setFormData({ ...formData, privacyPolicy: policy.key })}
                          className="text-blue-600 h-4 w-4 border-slate-300 focus:ring-blue-500"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  type="button" 
                  onClick={handlePrev}
                  className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all border border-slate-200 flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={16} className={isRtl ? 'rotate-180' : ''} />
                  {isRtl ? 'السابق' : 'Back'}
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <Send size={18} />}
                  {isRtl ? 'إرسال البلاغ النهائي' : 'Submit Final Report'}
                </button>
              </div>
            </motion.div>
          )}

        </form>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
