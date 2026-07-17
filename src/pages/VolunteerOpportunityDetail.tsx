import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Building, 
  MapPin, 
  Clock, 
  Calendar, 
  ChevronLeft, 
  CheckCircle, 
  Sparkles, 
  UserPlus, 
  AlertCircle,
  FileBadge
} from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '../services/api';
import { cn } from '../lib/utils';
import { Opportunity } from './admin/VolunteerRegistry';

export default function VolunteerOpportunityDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [opp, setOpp] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');
  
  // Application form parameters
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formQuestions, setFormQuestions] = useState<any[]>([]);

  // Standard inputs
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchOpportunityBySlug = async () => {
      setLoading(true);
      try {
        const response = await api.get('/api/volunteers/opportunities');
        const list: Opportunity[] = response.data || [];
        const match = list.find(o => o.slug === slug);
        
        if (!match) {
          setErrorText(isRtl ? 'عذراً، لم نعثر على هذه الفرصة الاستقطابية.' : 'The requested recruitment opportunity was not found.');
          setLoading(false);
          return;
        }

        setOpp(match);

        // Parse custom builder fields if present
        if (match.form_fields) {
          if (typeof match.form_fields === 'string') {
            try {
              setFormQuestions(JSON.parse(match.form_fields));
            } catch {
              setFormQuestions([]);
            }
          } else {
            setFormQuestions(match.form_fields);
          }
        }
      } catch (err) {
        console.error(err);
        setErrorText('Connection error reading details from database.');
      } finally {
        setLoading(false);
      }
    };
    fetchOpportunityBySlug();
  }, [slug]);

  // Submit Application Action
  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opp) return;
    setSubmitting(true);
    try {
      // Create Applicant / volunteer registry placeholder if first time
      await api.post('/api/volunteers/applications', {
        opportunity_id: opp.id,
        full_name: fullName,
        email,
        phone,
        status: 'Submitted',
        answers: JSON.stringify(answers),
        evaluation_scores: JSON.stringify({ experience: 85, motivation: 80, dependability: 90 }) // initial score trigger
      });

      // Optionally auto insert inside the volunteer registry as 'Applicant'
      await api.post('/api/volunteers/registry', {
        full_name: fullName,
        email,
        phone,
        status: 'Applicant',
        location: opp.location || 'Yemen',
        preferred_areas: opp.title,
        skills: JSON.stringify(['Applicant'])
      }).catch(() => {}); // catch any duplication conflicts gracefully

      setSubmitted(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error sending request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-16 text-center text-slate-500">
        <Sparkles size={48} className="animate-spin text-slate-400 mx-auto mb-4" />
        <p>{isRtl ? 'تحميل بيانات الفرصة الميدانية...' : 'Loading opportunity details...'}</p>
      </div>
    );
  }

  if (errorText || !opp) {
    return (
      <div className="min-h-screen py-16 max-w-md mx-auto text-center px-4" dir={isRtl ? 'rtl' : 'ltr'}>
        <AlertCircle size={64} className="text-rose-500 mx-auto mb-4 animate-bounce" />
        <h2 className="text-2xl font-bold text-slate-800">{isRtl ? 'خطأ في التحميل' : 'Error'}</h2>
        <p className="text-slate-500 mt-2 text-sm">{errorText}</p>
        <Link to="/academy" className="mt-6 inline-block text-indigo-600 font-bold hover:underline">
          {isRtl ? 'العودة لفرص التدريب والأكاديمية' : 'Back to Academy'}
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-12 px-4 text-slate-800" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation Breadcrumb */}
        <Link 
          to="/academy" 
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
        >
          <ChevronLeft className={cn("transition", isRtl && "rotate-180")} size={14} />
          {isRtl ? 'العودة إلى تدريب وأنشطة الأكاديمية' : 'Back to Academy Opportunity Platform'}
        </Link>

        {/* Header Hero card */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full transform translate-x-12 -translate-y-12 opacity-40" />
          
          <span className="bg-slate-100 border border-slate-150 px-3 py-1 rounded-full text-[11px] font-bold text-slate-500 uppercase tracking-widest inline-block mb-3">
            {isRtl ? 'فرصة عمل ومساهمة تطوعية' : 'NGO Humanitarian Duty Campaign'}
          </span>

          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight">{opp.title}</h1>
          
          <div className="flex flex-wrap gap-4 mt-6 text-xs font-semibold text-slate-500 border-t border-slate-100 pt-6">
            <span className="flex items-center gap-1"><MapPin size={14} /> {opp.location}</span>
            <span className="flex items-center gap-1"><Clock size={14} /> {opp.duration}</span>
            <span className="flex items-center gap-1"><Calendar size={14} /> ID: {opp.slug}</span>
          </div>
        </div>

        {/* Content details grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Overview columns */}
          <div className="md:col-span-2 bg-white p-8 rounded-[32px] border border-slate-100 shadow-xs space-y-6">
            <div>
              <h3 className="font-bold text-slate-850 text-base border-b border-slate-50 pb-2 mb-3">{isRtl ? 'وصف المسؤليات الميدانية' : 'Field Deployment Role & Duties'}</h3>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{opp.description}</p>
            </div>

            <div>
              <h2 className="font-bold text-slate-850 text-base border-b border-slate-50 pb-2 mb-3">{isRtl ? 'المتطلبات والكفاءة المطلوبة للقبول' : 'Competencies & Ideal Profiles'}</h2>
              <p className="text-sm text-slate-605 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-105 whitespace-pre-line">{opp.requirements}</p>
            </div>
          </div>

          {/* Apply Form Panel */}
          <div className="md:col-span-1">
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm sticky top-6">
              {!submitted ? (
                /* Apply Form */
                <form onSubmit={handleSubmitApplication} className="space-y-4">
                  <h3 className="font-bold text-slate-850 text-base flex items-center gap-2 mb-4">
                    <UserPlus size={18} className="text-slate-800" />
                    {isRtl ? 'رابط التقديم والمساهمة' : 'Enroll & Apply Now'}
                  </h3>

                  <div>
                    <label className="text-xs text-slate-400 font-bold block mb-1">{isRtl ? 'الاسم الكامل للتوثيق' : 'Your Full Name'}</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-2 border rounded-xl text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 font-bold block mb-1">{isRtl ? 'البريد الإلكتروني' : 'Email Address'}</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2 border rounded-xl text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 font-bold block mb-1">{isRtl ? 'رقم الهاتف/واتساب' : 'Phone Number'}</label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-2 border rounded-xl text-sm"
                    />
                  </div>

                  {/* Display standard custom builder fields if requested */}
                  {formQuestions.map((q: any, i: number) => (
                    <div key={i}>
                      <label className="text-xs text-slate-400 font-bold block mb-1">{q.label}</label>
                      <input
                        type={q.type || 'text'}
                        required={q.required}
                        value={answers[q.name] || ''}
                        onChange={(e) => setAnswers({ ...answers, [q.name]: e.target.value })}
                        className="w-full px-4 py-2 border rounded-xl text-sm"
                      />
                    </div>
                  ))}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-slate-900 border text-white font-bold text-xs rounded-xl shadow-xs hover:bg-slate-800 transition uppercase tracking-wider"
                  >
                    {submitting ? '...' : (isRtl ? 'إرسال طلب الانضمام والتكليف' : 'Submit Application')}
                  </button>
                </form>
              ) : (
                /* Success Notification Card */
                <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="text-center py-6 space-y-4">
                  <CheckCircle size={48} className="text-emerald-500 mx-auto animate-bounce" />
                  <h3 className="font-bold text-slate-800 text-lg">{isRtl ? 'تم التقديم بنجاح!' : 'Application Sent!'}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {isRtl ? 'شكرًا لاهتمامك بالانضمام للعمل الإنساني والصحفي. فحص النظام سيرتك الكارتية وأرسلها لإدارة التوثيق وسيتم التواصل معك بالسرعة الممكنة.' : 'Your details have been registered into the VMS. Our human rights monitoring advisors will run a credential screening checks shortly.'}
                  </p>

                  <div className="bg-slate-50 p-4 rounded-xl border text-[11px] text-slate-505 leading-normal">
                    <strong>{isRtl ? 'هل تريد استكشاف حالة التكليف؟' : 'Check status anytime?'}</strong>
                    <p className="mt-1">{isRtl ? 'يمكنك دائما استخدام البريد للتحقق في ' : 'Sign in using your email in the '}<Link to="/volunteer-portal" className="text-indigo-600 font-semibold underline">{isRtl ? 'بوابة الخدمة الذاتية' : 'Volunteer Portal'}</Link></p>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
