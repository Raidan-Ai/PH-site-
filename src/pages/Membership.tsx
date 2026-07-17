import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Check, Award, FileText, Send, Clock, Sparkles, Building, UserCheck, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { SEO } from '../components/common/SEO';
import { Breadcrumbs } from '../components/common/Breadcrumbs';

interface Tier {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  price: number;
  benefits_ar: string; // JSON string or raw
  benefits_en: string; // JSON string or raw
  status: string;
}

interface UserMembership {
  id: number;
  tier_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  professional_title?: string;
  institution?: string;
  cv_url?: string;
  id_card_url?: string;
  notes?: string;
  tier_name_ar: string;
  tier_name_en: string;
  tier_desc_ar: string;
  tier_desc_en: string;
  createdAt: string;
}

export default function Membership() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { user } = useAuth();

  const [tiers, setTiers] = useState<Tier[]>([]);
  const [currentMembership, setCurrentMembership] = useState<UserMembership | null>(null);
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form Fields
  const [professionalTitle, setProfessionalTitle] = useState('');
  const [institution, setInstitution] = useState('');
  const [cvUrl, setCvUrl] = useState('');
  const [idCardUrl, setIdCardUrl] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const tiersRes = await api.get('/api/membership-tiers');
      setTiers(tiersRes.data || []);
      
      if (user) {
        const membershipRes = await api.get('/api/user-memberships/me');
        setCurrentMembership(membershipRes.data || null);
      }
    } catch (err) {
      console.error('Error fetching membership data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTier = (tier: Tier) => {
    if (!user) {
      setErrorMsg(isRtl ? 'يرجى تسجيل الدخول أولاً للتقدم بطلب العضوية.' : 'Please log in first to apply for a membership.');
      return;
    }
    setSelectedTier(tier);
    setErrorMsg('');
    setSuccessMsg('');
    // Clear form
    setProfessionalTitle('');
    setInstitution('');
    setCvUrl('');
    setIdCardUrl('');
    setNotes('');
  };

  const parseBenefits = (benefitsStr: string): string[] => {
    try {
      return JSON.parse(benefitsStr);
    } catch (e) {
      return [];
    }
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTier) return;

    // Validation for professional tiers
    if (selectedTier.id !== 'free') {
      if (!professionalTitle.trim()) {
        setErrorMsg(isRtl ? 'حقل المسمى الوظيفي/الأكاديمي مطلوب' : 'Professional/Academic Title is required');
        return;
      }
      if (!institution.trim()) {
        setErrorMsg(isRtl ? 'اسم المؤسسة/الجامعة مطلوب' : 'Institution/University name is required');
        return;
      }
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload = {
        tier_id: selectedTier.id,
        professional_title: professionalTitle,
        institution,
        cv_url: cvUrl,
        id_card_url: idCardUrl,
        notes
      };

      const response = await api.post('/api/user-memberships', payload);
      if (response.data.success) {
        setSuccessMsg(
          selectedTier.id === 'free'
            ? (isRtl ? 'تهانينا! تم تفعيل عضويتك المجانية فوراً بنجاح.' : 'Congratulations! Your free membership is activated instantly.')
            : (isRtl ? 'تم إرسال طلب العضوية بنجاح! سيقوم فريق بيت الصحافة بمراجعته والرد عليك قريباً.' : 'Application submitted successfully! Our team will review and reply soon.')
        );
        setSelectedTier(null);
        // Refresh membership status
        const membershipRes = await api.get('/api/user-memberships/me');
        setCurrentMembership(membershipRes.data || null);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || (isRtl ? 'فشل تقديم الطلب. يرجى المحاولة لاحقاً.' : 'Failed to submit application.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 space-y-4">
        <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest animate-pulse">
          {isRtl ? 'جاري تحميل برنامج العضوية...' : 'Loading Membership Module...'}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <SEO 
        title={isRtl ? 'برنامج العضوية والاشتراكات' : 'Membership & Subscriptions'} 
        description="انضم لشبكة بيت الصحافة اليمني واحصل على وصول حصري للمحتوى والتقارير والتدريب"
      />
      
      <div className="bg-slate-900 text-white pt-28 pb-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <Breadcrumbs 
            items={[
              { label: isRtl ? 'الرئيسية' : 'Home', path: '/' },
              { label: isRtl ? 'برنامج العضوية' : 'Membership Program' }
            ]}
            className="text-slate-400 mb-6"
          />
          <div className="max-w-3xl space-y-4">
            <span className="bg-blue-500/20 text-blue-300 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-blue-400/20">
              {isRtl ? 'عضوية بيت الصحافة' : 'PressHouse Network'}
            </span>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
              {isRtl ? 'منصة العضوية المهنية والإعلامية' : 'Professional Media Membership Portal'}
            </h1>
            <p className="text-slate-300 text-base md:text-lg font-medium leading-relaxed">
              {isRtl 
                ? 'ندعو الصحفيين، والطلاب، والمؤسسات الحقوقية للانضمام لشبكة بيت الصحافة للاستفادة من المحتوى الحصري، والدعم القانوني، وفرص التدريب والمناصرة المشتركة.'
                : 'Join the Yemeni PressHouse network. Gain access to restricted data, analytical reports, legal counseling, and priority training programs.'}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 -mt-8">
        {/* User Current Membership Status */}
        {user && currentMembership && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[32px] p-8 shadow-xl shadow-slate-100 border border-slate-200/60 mb-12"
          >
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase border ${
                    currentMembership.status === 'approved' 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-150' 
                      : currentMembership.status === 'pending'
                      ? 'bg-amber-50 text-amber-600 border-amber-150 animate-pulse'
                      : 'bg-rose-50 text-rose-600 border-rose-150'
                  }`}>
                    {currentMembership.status === 'approved' && (isRtl ? '✓ عضوية نشطة ومعتمدة' : '✓ Approved Active Member')}
                    {currentMembership.status === 'pending' && (isRtl ? '⏱ قيد المراجعة والتدقيق' : '⏱ Verification Pending')}
                    {currentMembership.status === 'rejected' && (isRtl ? '✗ مرفوض' : '✗ Application Declined')}
                  </span>
                  <span className="font-mono text-xs text-slate-400">ID: PH-MEMBER-{currentMembership.id}</span>
                </div>
                
                <h2 className="text-2xl font-black text-slate-900">
                  {isRtl ? 'وضعية العضوية الحالية' : 'Current Membership Status'}
                </h2>
                <p className="text-slate-500 font-medium">
                  {isRtl 
                    ? `أنت مسجل حالياً في فئة: ${currentMembership.tier_name_ar}` 
                    : `You are currently registered in: ${currentMembership.tier_name_en}`}
                </p>
              </div>

              {/* Digital Membership Card Preview */}
              {currentMembership.status === 'approved' && (
                <div className="w-full lg:w-96 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white rounded-2xl p-6 border border-slate-700/50 shadow-2xl relative overflow-hidden font-sans">
                  <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl" />
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="font-black text-xs tracking-widest text-blue-400">YEMEN PRESSHOUSE</h4>
                      <p className="text-[9px] text-slate-400">بيت الصحافة - اليمن</p>
                    </div>
                    <Shield className="text-blue-500" size={28} />
                  </div>
                  
                  <div className="space-y-1 mb-6">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">{isRtl ? 'الاسم بالكامل' : 'Full Name'}</p>
                    <h3 className="font-black text-lg tracking-wide text-white">{user.displayName}</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase tracking-wider">{isRtl ? 'فئة العضوية' : 'Membership Tier'}</p>
                      <span className="font-bold text-xs text-blue-300">
                        {isRtl ? currentMembership.tier_name_ar : currentMembership.tier_name_en}
                      </span>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase tracking-wider">{isRtl ? 'تاريخ الانتساب' : 'Joined Date'}</p>
                      <span className="font-mono text-xs text-slate-300">
                        {new Date(currentMembership.createdAt).toLocaleDateString(isRtl ? 'ar-YE' : 'en-US')}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-700/50 flex justify-between items-center">
                    <span className="text-[9px] text-emerald-400 tracking-widest uppercase font-black">✓ ACTIVE VERIFIED</span>
                    <span className="text-[9px] text-slate-500">M-{currentMembership.id}</span>
                  </div>
                </div>
              )}

              {currentMembership.status === 'pending' && (
                <div className="flex items-start gap-3 bg-amber-50/50 p-4 rounded-xl border border-amber-100 max-w-md">
                  <Clock className="text-amber-500 shrink-0 mt-0.5 animate-spin" size={18} />
                  <div className="text-xs text-slate-600 leading-relaxed">
                    <p className="font-bold text-amber-800 mb-1">{isRtl ? 'طلبك قيد المراجعة والتدقيق' : 'Reviewing Application'}</p>
                    {isRtl 
                      ? 'يقوم فريق بيت الصحافة حالياً بالتحقق من أوراقك الثبوتية ومسماك المهني لتفعيل العضوية الكاملة. سيتم إخطارك بالتحديثات فور اعتمادها.'
                      : 'Our committee is verifying your professional proofs and credentials. You will receive an email notice once approved.'}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Header Title */}
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
          <h2 className="text-3xl font-black text-slate-900">
            {isRtl ? 'اختر فئة العضوية المناسبة لك' : 'Select Your Membership Tier'}
          </h2>
          <p className="text-slate-500 font-medium">
            {isRtl 
              ? 'بادر بالتسجيل لفتح مميزات حصرية والانضمام لشبكة الإعلام اليمني.'
              : 'Register to unlock tailored benefits and coordinate joint press initiatives.'}
          </p>
        </div>

        {/* Error / Success Notifications */}
        {errorMsg && (
          <div className="bg-rose-50 text-rose-700 p-4 rounded-xl border border-rose-100 max-w-3xl mx-auto mb-8 flex items-center gap-3">
            <AlertCircle className="shrink-0" size={20} />
            <p className="text-sm font-bold">{errorMsg}</p>
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-150 max-w-3xl mx-auto mb-8 flex items-center gap-3">
            <UserCheck className="shrink-0" size={20} />
            <p className="text-sm font-bold">{successMsg}</p>
          </div>
        )}

        {/* Membership Tiers Cards Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {tiers.map((tier) => {
            const parsedBenefits = parseBenefits(isRtl ? tier.benefits_ar : tier.benefits_en);
            const isCurrent = currentMembership?.tier_id === tier.id;

            return (
              <motion.div 
                key={tier.id}
                whileHover={{ y: -6 }}
                className={`bg-white rounded-3xl p-6 border transition duration-300 relative flex flex-col justify-between ${
                  isCurrent 
                    ? 'border-blue-500 ring-2 ring-blue-100 shadow-xl' 
                    : 'border-slate-200/80 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-100'
                }`}
              >
                {isCurrent && (
                  <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {isRtl ? 'فئتك الحالية' : 'Current Tier'}
                  </div>
                )}

                <div className="space-y-6">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 block">
                      {tier.id === 'free' ? (isRtl ? 'دخول عام' : 'Public Entrance') : (isRtl ? 'طلب مهني' : 'Professional Application')}
                    </span>
                    <h3 className="text-xl font-black text-slate-900">
                      {isRtl ? tier.name_ar : tier.name_en}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed">
                      {isRtl ? tier.description_ar : tier.description_en}
                    </p>
                  </div>

                  <div className="py-2 border-y border-slate-100 flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-900">
                      {tier.price === 0 ? (isRtl ? 'مجاني' : 'Free') : `$${tier.price}`}
                    </span>
                    {tier.price > 0 && (
                      <span className="text-xs text-slate-400 font-medium">/{isRtl ? 'سنوياً' : 'yearly'}</span>
                    )}
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">
                      {isRtl ? 'المميزات والصلاحيات:' : 'Key Privileges:'}
                    </h4>
                    <ul className="space-y-2">
                      {parsedBenefits.map((benefit, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs font-medium text-slate-600 leading-relaxed">
                          <Check className="text-blue-500 shrink-0 mt-0.5" size={14} />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-50">
                  <button
                    onClick={() => handleSelectTier(tier)}
                    disabled={isCurrent}
                    className={`w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition duration-200 flex items-center justify-center gap-2 ${
                      isCurrent
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-slate-900 hover:bg-blue-600 text-white shadow-lg shadow-slate-100'
                    }`}
                  >
                    <Award size={14} />
                    {isCurrent 
                      ? (isRtl ? 'مشترك بالفعل' : 'Currently Subscribed') 
                      : (tier.id === 'free' ? (isRtl ? 'اشترك الآن مجاناً' : 'Join Now For Free') : (isRtl ? 'تقديم طلب انضمام' : 'Apply to Join'))
                    }
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Application Modal Form overlay */}
        <AnimatePresence>
          {selectedTier && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200"
              >
                {/* Header */}
                <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
                  <div className="space-y-1">
                    <h3 className="font-black text-lg">
                      {isRtl ? `طلب انتساب لـ ${selectedTier.name_ar}` : `Apply for ${selectedTier.name_en}`}
                    </h3>
                    <p className="text-slate-400 text-xs">
                      {isRtl ? 'يرجى تقديم بيانات صحيحة لتسريع عملية المراجعة' : 'Please provide accurate data to speed up approval'}
                    </p>
                  </div>
                  <button 
                    onClick={() => setSelectedTier(null)}
                    className="p-1.5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition"
                  >
                    <XIcon />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmitApplication} className="p-6 space-y-4">
                  {selectedTier.id === 'free' ? (
                    <div className="space-y-4 py-4 text-center">
                      <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                        <UserCheck size={32} />
                      </div>
                      <p className="text-sm font-medium text-slate-600 leading-relaxed max-w-md mx-auto">
                        {isRtl 
                          ? 'الاشتراك في العضوية المجانية يتم تفعيله فوراً وتلقائياً. ستتمكن من تصفح التقارير العامة وتلقي النشرة البريدية فور الضغط على تأكيد.'
                          : 'Signing up for Free Membership is processed instantly. You will gain immediate access to public newsletters and reports.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1.5">
                            {isRtl ? 'المسمى الوظيفي / التخصص المهني *' : 'Professional / Academic Title *'}
                          </label>
                          <input
                            type="text"
                            required
                            value={professionalTitle}
                            onChange={(e) => setProfessionalTitle(e.target.value)}
                            placeholder={isRtl ? 'مثال: صحفي استقصائي، طالب إعلام' : 'e.g. Investigative Journalist, Student'}
                            className="w-full p-3 text-sm rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1.5">
                            {isRtl ? 'الجهة / المؤسسة التابع لها *' : 'Affiliation / Institution *'}
                          </label>
                          <input
                            type="text"
                            required
                            value={institution}
                            onChange={(e) => setInstitution(e.target.value)}
                            placeholder={isRtl ? 'مثال: صحيفة الأيام، جامعة صنعاء' : 'e.g. Al-Ayyam Press, Sanaa University'}
                            className="w-full p-3 text-sm rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1.5">
                            {isRtl ? 'رابط السيرة الذاتية (CV Link)' : 'CV Document URL (Optional)'}
                          </label>
                          <input
                            type="url"
                            value={cvUrl}
                            onChange={(e) => setCvUrl(e.target.value)}
                            placeholder="https://drive.google.com/... (CV)"
                            className="w-full p-3 text-sm rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-medium font-mono"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1.5">
                            {isRtl ? 'رابط بطاقة الهوية / إثبات المهنة' : 'ID Card / Work Proof Link'}
                          </label>
                          <input
                            type="url"
                            value={idCardUrl}
                            onChange={(e) => setIdCardUrl(e.target.value)}
                            placeholder="https://drive.google.com/... (ID Card)"
                            className="w-full p-3 text-sm rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-medium font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1.5">
                          {isRtl ? 'ملاحظات إضافية للفريق' : 'Additional Notes (Optional)'}
                        </label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={3}
                          placeholder={isRtl ? 'اكتب أي معلومات ترغب في إضافتها...' : 'Write any extra notes you would like to share...'}
                          className="w-full p-3 text-sm rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                        />
                      </div>
                    </div>
                  )}

                  {/* Submit Actions */}
                  <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedTier(null)}
                      className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-black uppercase tracking-widest transition"
                    >
                      {isRtl ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-widest transition flex items-center gap-2 shadow-lg shadow-blue-100"
                    >
                      {submitting ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Send size={14} />
                      )}
                      {isRtl ? 'تأكيد التسجيل والطلب' : 'Confirm Application'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function XIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
