import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Users, 
  MapPin, 
  Calendar, 
  Clock, 
  Award, 
  Upload, 
  CheckCircle, 
  Sparkles, 
  ChevronRight, 
  Send, 
  FileText,
  UserCheck,
  ShieldCheck,
  LifeBuoy,
  AlertCircle,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import { cn } from '../lib/utils';
import { Volunteer, Assignment, HourLog, Recognition, Onboarding } from './admin/VolunteerRegistry';

export default function VolunteerPortal() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [emailInput, setEmailInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  
  // Logged-in state metrics
  const [profile, setProfile] = useState<Volunteer | null>(null);
  const [onboarding, setOnboarding] = useState<Onboarding | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [hours, setHours] = useState<HourLog[]>([]);
  const [badges, setBadges] = useState<Recognition[]>([]);
  const [mentors, setMentors] = useState<Volunteer[]>([]);

  // Mentorship connection request state
  const [mentorshipRequested, setMentorshipRequested] = useState(false);

  // Hours logging form state
  const [loggingHours, setLoggingHours] = useState(false);
  const [hoursForm, setHoursForm] = useState({
    activity: '',
    hours: 2,
    date: new Date().toISOString().split('T')[0]
  });

  // Action feedback
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Handle lookup / sign-in with email
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setLoading(true);
    setFeedbackMsg('');
    try {
      // Find matching volunteer registry profile by email
      const vRes = await api.get('/api/volunteers/registry');
      const allVolunteers: Volunteer[] = vRes.data || [];
      const match = allVolunteers.find(v => v.email?.toLowerCase() === emailInput.toLowerCase().trim());
      
      if (!match) {
        setFeedbackMsg(isRtl ? 'عذراً، هذا البريد غير مسجل بالسجل الرئيسي للمتطوعين.' : 'This email is not registered in the system registry.');
        setLoading(false);
        return;
      }

      setProfile(match);

      // Load related items
      const [asRes, hRes, rRes, onRes] = await Promise.all([
        api.get('/api/volunteers/assignments'),
        api.get('/api/volunteers/hours'),
        api.get('/api/volunteers/recognition'),
        api.get('/api/volunteers/onboarding')
      ]);

      setAssignments((asRes.data || []).filter((a: any) => a.volunteer_id === match.id));
      setHours((hRes.data || []).filter((h: any) => h.volunteer_id === match.id));
      setBadges((rRes.data || []).filter((b: any) => b.volunteer_id === match.id));
      
      const onbList: Onboarding[] = onRes.data || [];
      const matchOnboards = onbList.find(o => o.volunteer_id === match.id);
      setOnboarding(matchOnboards || null);

      // Mentors list
      setMentors(allVolunteers.filter(v => v.status === 'Alumni'));

      setLoggedIn(true);
    } catch (err) {
      console.error(err);
      setFeedbackMsg('Connection server error. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  // Log hours action
  const handleLogHours = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    try {
      await api.post('/api/volunteers/hours', {
        volunteer_id: profile.id,
        activity: hoursForm.activity,
        hours_worked: Number(hoursForm.hours),
        date: hoursForm.date,
        status: 'pending' // pending approval from admin dashboard
      });
      
      // Reload logged hours
      const hRes = await api.get('/api/volunteers/hours');
      setHours((hRes.data || []).filter((h: any) => h.volunteer_id === profile.id));

      setLoggingHours(false);
      setHoursForm({ activity: '', hours: 2, date: new Date().toISOString().split('T')[0] });
      alert(isRtl ? 'تم تقديم سجل الساعات بنجاح وهو بانتظار الاعتماد والموثوقية.' : 'Hours logged successfully, pending administrative verification.');
    } catch (err) {
      console.error(err);
    }
  };

  // Upload agreements (simulate digital completion)
  const handleSimulateSigning = async () => {
    if (!profile) return;
    try {
      // Create or update onboarding record
      if (onboarding) {
        await api.put(`/api/volunteers/onboarding/${onboarding.id}`, {
          ...onboarding,
          checklist: JSON.stringify({ conduct: true, safety: true, nda: true }),
          status: 'completed'
        });
      } else {
        await api.post('/api/volunteers/onboarding', {
          volunteer_id: profile.id,
          checklist: JSON.stringify({ conduct: true, safety: true, nda: true }),
          orientation_sessions: JSON.stringify(['Orientation Workshop']),
          status: 'completed'
        });
      }

      // Reload onboarding status
      const onRes = await api.get('/api/volunteers/onboarding');
      const latestOnb: Onboarding[] = onRes.data || [];
      setOnboarding(latestOnb.find(o => o.volunteer_id === profile.id) || null);
      
      alert(isRtl ? 'تم التوقيع بنجاح على كل النظم ومواثيق العمل وصون حماية المستضعفين!' : 'Simulated complete e-signing for child protection, code of conduct & NDA policies successfully!');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-12 px-4 text-slate-800" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-5xl mx-auto">
        {!loggedIn ? (
          /* Portal Login Entrance Page */
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto text-center mt-12 bg-white p-8 rounded-[32px] border border-slate-100 shadow-md">
            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center mx-auto mb-6">
              <Users size={32} />
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {isRtl ? 'بوابة الخدمة الذاتية للمتطوعين' : 'Volunteer Self-Service Portal'}
            </h1>
            <p className="text-slate-500 mt-2 text-sm leading-relaxed">
              {isRtl ? 'مرحبًا بك! سجل دخولك بالبريد الإلكتروني الممارس لإدارة تكليفاتك الميدانية، توقيع الأوراق، وتسجيل الساعات التراكمية.' : 'Welcome! Enter your registered humanitarian email to manage deployments, access certificates, download badges and log duty hours.'}
            </p>

            <form onSubmit={handleSignIn} className="mt-8 space-y-4 text-right">
              <div>
                <label className="text-xs uppercase text-slate-400 font-bold tracking-widest block mb-1.5">{isRtl ? 'البريد الإلكتروني الممارس' : 'Registered Email Address'}</label>
                <input
                  type="email"
                  required
                  placeholder="volunteer@example.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-205 focus:outline-none focus:ring-2 focus:ring-slate-500 text-left"
                />
              </div>

              {feedbackMsg && (
                <div className="flex gap-2 p-3 bg-rose-50 text-rose-600 rounded-xl text-xs font-semibold items-center">
                  <AlertCircle size={16} />
                  <span>{feedbackMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-sm"
              >
                {loading ? '...' : (isRtl ? 'الدخول الآمن للبوابة' : 'Verify & Enter Portal')}
                <ChevronRight size={16} className={cn("transition", isRtl && "rotate-180")} />
              </button>
            </form>
          </motion.div>
        ) : (
          /* Logged-In Self Service Dashboard Workspace */
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            {/* Header profile welcome block */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 text-white p-8 rounded-[36px] shadow-lg border border-slate-805 gap-6 relative overflow-hidden">
              <div className="absolute right-0 top-0 opacity-10 transform translate-x-8 -translate-y-8">
                <Users size={180} />
              </div>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-3xl font-extrabold text-white border-2 border-white/20">
                  {profile?.full_name?.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-200">{profile?.full_name}</h1>
                    <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                      {profile?.status}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm mt-1">{profile?.location} | ID: {profile?.volunteer_id}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setLoggingHours(true)}
                  className="px-5 py-2.5 bg-amber-400 text-slate-950 hover:bg-amber-380 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Clock size={14} />
                  {isRtl ? 'تسجيل ساعات اليوم' : 'Log Daily Hours'}
                </button>
                <button
                  onClick={() => {
                    setLoggedIn(false);
                    setProfile(null);
                  }}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition"
                >
                  {isRtl ? 'خروج' : 'Logout'}
                </button>
              </div>
            </div>

            {/* Main grid structure split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Stats & Checklist status */}
              <div className="lg:col-span-1 space-y-6">
                {/* Onboarding & Policies checks */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
                  <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
                    <ShieldCheck size={20} className="text-indigo-600" />
                    {isRtl ? 'حالة ميثاق السلوك والالتزام' : 'Onboarding & Codes'}
                  </h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span>{isRtl ? 'ميثاق السلوك المهني' : 'Professional Conduct'}</span>
                      {onboarding?.status === 'completed' ? (
                        <span className="text-emerald-600 flex items-center gap-0.5"><CheckCircle size={14} /> Signed</span>
                      ) : (
                        <span className="text-amber-500 flex items-center gap-0.5"><Clock size={14} /> Pending</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span>{isRtl ? 'سياسة الحماية وصون الطفولة' : 'Safeguarding Policies'}</span>
                      {onboarding?.status === 'completed' ? (
                        <span className="text-emerald-600 flex items-center gap-0.5"><CheckCircle size={14} /> Signed</span>
                      ) : (
                        <span className="text-amber-500 flex items-center gap-0.5"><Clock size={14} /> Pending</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs font-semibold border-b border-slate-100 pb-3">
                      <span>{isRtl ? 'اتفاقية عدم الإفصاح والسرية' : 'NDA Agreement'}</span>
                      {onboarding?.status === 'completed' ? (
                        <span className="text-emerald-600 flex items-center gap-0.5"><CheckCircle size={14} /> Signed</span>
                      ) : (
                        <span className="text-amber-500 flex items-center gap-0.5"><Clock size={14} /> Pending</span>
                      )}
                    </div>

                    {onboarding?.status !== 'completed' && (
                      <button
                        onClick={handleSimulateSigning}
                        className="w-full text-center py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs transition"
                      >
                        {isRtl ? 'توقيع الوثائق والمواثيق الآن' : 'Digitally Sign Documents Now'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Badges / Recognition cards */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
                  <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
                    <Award size={20} className="text-amber-500" />
                    {isRtl ? 'أوسمتك الرقمية وعقود التكريم' : 'Your Digital Badges'}
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    {badges.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4 col-span-2 italic">
                        {isRtl ? 'لم تمنح أوسمة بعد. ابدأ بنشاطك الميداني لتلقي التكريم!' : 'No badges awarded yet. Start logging duty hours to unlock tiers'}
                      </p>
                    ) : (
                      badges.map(b => (
                        <div key={b.id} className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-center flex flex-col items-center">
                          <Award className="text-amber-500 mb-1" size={24} />
                          <h4 className="text-[11px] font-bold text-slate-800 leading-snug">{b.category}</h4>
                          <span className="text-[9px] font-mono font-semibold uppercase text-slate-400 mt-1">{b.badge}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Right Columns: Deployment duties & Mentorship */}
              <div className="lg:col-span-2 space-y-8">
                {/* Assignments & deployments list */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
                  <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
                    <Calendar size={20} className="text-slate-800" />
                    {isRtl ? 'تكليفاتك ومهامك الحقوقية النشطة' : 'Your Active Target Assignments'}
                  </h3>

                  <div className="space-y-4">
                    {assignments.length === 0 ? (
                      <div className="p-6 bg-slate-50 rounded-2xl text-center text-slate-400 text-xs">
                        {isRtl ? 'لا يوجد تكليفات ميدانية مسندة إليك حالياً.' : 'You have no open deployment commands assigned'}
                      </div>
                    ) : (
                      assignments.map(as => (
                        <div key={as.id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center">
                          <div>
                            <h4 className="font-bold text-sm text-slate-800">{as.assignment_name}</h4>
                            <div className="flex gap-3 text-xs text-slate-400 mt-1">
                              <span><strong>Location: </strong> {as.duty_location || 'Field Office'}</span>
                              <span><strong>Duty dates: </strong> {as.start_date || 'Ongoing'}</span>
                            </div>
                          </div>

                          <span className={cn(
                            "px-2.5 py-0.5 rounded text-[10px] font-bold uppercase",
                            as.status === 'Active' ? "bg-emerald-50 text-emerald-600 animate-pulse" : "bg-slate-205 text-slate-600"
                          )}>
                            {as.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Mentorship directory connection request */}
                <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 rounded-3xl relative overflow-hidden shadow-md">
                  <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4">
                    <LifeBuoy size={112} />
                  </div>
                  
                  <span className="text-[10px] font-bold uppercase bg-white/10 px-2.5 py-0.5 rounded-full inline-block text-amber-300">
                    {isRtl ? 'الارتباط بشبكة الخريجين' : 'Alumni Mentorship Pathway'}
                  </span>
                  
                  <h3 className="font-bold text-lg mt-2">{isRtl ? 'طلب مرشد صحفي وحقوقي خريج' : 'Request Graduate Mentorship Guidance'}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed mt-2">
                    {isRtl ? 'انضم لمرشدي بيت الصحافة لتبادل المسارات، حماية التحقيقات، والتوجيه المهني المباشر:' : 'Connect directly with NGO advisors, media veterans and rights advocates for peer review and training career acceleration:'}
                  </p>

                  {mentorshipRequested ? (
                    <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="mt-4 p-3 bg-white/10 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5">
                      <CheckCircle size={16} />
                      {isRtl ? 'تم تقديم طلب الإرشاد وسيتم ربطك بالمرشد المناسب قريباً.' : 'Mentoring requested! A qualified advocate will inspect criteria and contact you shortly.'}
                    </motion.div>
                  ) : (
                    <div className="mt-4 flex gap-2">
                      <select className="bg-white/10 text-white text-xs rounded-xl px-3 py-2 border border-white/20 focus:outline-none focus:bg-white focus:text-slate-900 w-1/2">
                        {mentors.map(m => (
                          <option key={m.id} value={m.id} className="text-slate-900">{m.full_name} ({m.occupation})</option>
                        ))}
                      </select>
                      <button
                        onClick={() => setMentorshipRequested(true)}
                        className="px-4 py-2 bg-amber-400 hover:bg-amber-380 text-slate-900 font-bold text-xs rounded-xl transition"
                      >
                        {isRtl ? 'طلب التوجيه' : 'Request Peer Mentor'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Hour sheets history table */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
                  <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
                    <Clock size={20} className="text-slate-800" />
                    {isRtl ? 'سجل ساعات عملك التاريخي' : 'Your Logged Hours History'}
                  </h3>

                  <div className="overflow-x-auto max-h-[160px]">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase">
                          <th className="py-2 text-right">{isRtl ? 'النشاط المترجم' : 'Activity'}</th>
                          <th className="py-2">{isRtl ? 'التاريخ' : 'Date'}</th>
                          <th className="py-2">{isRtl ? 'ساعات المنجز' : 'Hours'}</th>
                          <th className="py-2">{isRtl ? 'الموثوقية' : 'Status'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hours.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-4 text-center text-slate-405">
                              {isRtl ? 'لم تسجل أي ساعات عمل حتى الآن.' : 'No activity records found'}
                            </td>
                          </tr>
                        ) : (
                          hours.map(h => (
                            <tr key={h.id} className="border-b border-slate-50 text-slate-600 hover:bg-slate-50/50">
                              <td className="py-2 font-medium text-right text-slate-800">{h.activity}</td>
                              <td className="py-2">{h.date}</td>
                              <td className="py-2 font-bold font-mono">{h.hours_worked} hrs</td>
                              <td className="py-2">
                                <span className={cn(
                                  "px-2 py-0.5 rounded text-[9px] font-bold",
                                  h.status === 'approved' ? "bg-emerald-50 text-emerald-600" : "bg-yellow-50 text-yellow-600"
                                )}>
                                  {h.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Log Hours Form Modal Overlay */}
      {loggingHours && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-[28px] p-6 max-w-sm w-full" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 text-base">{isRtl ? 'تسجيل ساعات المساهمة الميدانية' : 'Register Daily Contribution Hours'}</h3>
              <button onClick={() => setLoggingHours(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleLogHours} className="space-y-4">
              <div>
                <label className="text-xs text-slate-500 font-bold block mb-1">{isRtl ? 'تفاصيل النشاط (ماذا أنجزت؟)' : 'Activity Description'}</label>
                <input
                  type="text"
                  required
                  placeholder={isRtl ? 'مسح ورصد الانتهاكات في تعز' : 'e.g. Field monitoring and reporting in Sana\'a'}
                  value={hoursForm.activity}
                  onChange={(e) => setHoursForm({ ...hoursForm, activity: e.target.value })}
                  className="w-full px-4 py-2 border rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500 font-bold block mb-1">{isRtl ? 'عدد الساعات الملتزمة' : 'Hours'}</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={hoursForm.hours}
                    onChange={(e) => setHoursForm({ ...hoursForm, hours: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-slate-205 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-bold block mb-1">{isRtl ? 'التاريخ الكرونولوجي' : 'Date'}</label>
                  <input
                    type="date"
                    required
                    value={hoursForm.date}
                    onChange={(e) => setHoursForm({ ...hoursForm, date: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-205 rounded-xl text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition"
              >
                {isRtl ? 'تقديم بطاقة النشاط للاعتماد' : 'Submit Log Entry'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
