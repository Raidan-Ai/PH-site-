import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Check, X, Award, FileText, Search, Clock, CheckCircle2, XCircle, AlertCircle, RefreshCw, BarChart2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface UserMembership {
  id: number;
  user_uid: string;
  user_email: string;
  user_name: string;
  tier_id: string;
  tier_name_ar: string;
  tier_name_en: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  professional_title?: string;
  institution?: string;
  cv_url?: string;
  id_card_url?: string;
  notes?: string;
  createdAt: string;
}

export default function MembershipManager() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { user } = useAuth();

  const [memberships, setMemberships] = useState<UserMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');

  // Decision Modal States
  const [activeDecision, setActiveDecision] = useState<UserMembership | null>(null);
  const [decisionType, setDecisionType] = useState<'approved' | 'rejected' | null>(null);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [processingDecision, setProcessingDecision] = useState(false);

  useEffect(() => {
    fetchMemberships();
  }, []);

  const fetchMemberships = async () => {
    setRefreshing(true);
    try {
      const response = await api.get('/api/user-memberships');
      setMemberships(response.data || []);
    } catch (err) {
      console.error('Error fetching user memberships:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleOpenDecision = (membership: UserMembership, type: 'approved' | 'rejected') => {
    setActiveDecision(membership);
    setDecisionType(type);
    setDecisionNotes(membership.notes || '');
  };

  const handleConfirmDecision = async () => {
    if (!activeDecision || !decisionType) return;

    setProcessingDecision(true);
    try {
      await api.put(`/api/user-memberships/${activeDecision.id}/status`, {
        status: decisionType,
        notes: decisionNotes,
        approved_by: user?.uid || 'admin'
      });
      
      // Update list
      setMemberships(prev => 
        prev.map(m => m.id === activeDecision.id ? { ...m, status: decisionType, notes: decisionNotes } : m)
      );
      
      setActiveDecision(null);
      setDecisionType(null);
      setDecisionNotes('');
    } catch (err) {
      console.error('Error updating membership status:', err);
      alert(isRtl ? 'فشل تحديث حالة العضوية.' : 'Failed to update membership status.');
    } finally {
      setProcessingDecision(false);
    }
  };

  // Stats calculation
  const pendingCount = memberships.filter(m => m.status === 'pending').length;
  const approvedCount = memberships.filter(m => m.status === 'approved').length;
  const journalistCount = memberships.filter(m => m.status === 'approved' && m.tier_id === 'journalist').length;
  const studentCount = memberships.filter(m => m.status === 'approved' && m.tier_id === 'student').length;

  // Filter & Search logic
  const filteredMemberships = memberships.filter(m => {
    const matchesSearch = 
      (m.user_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.user_email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.professional_title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.institution || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    const matchesTier = tierFilter === 'all' || m.tier_id === tierFilter;

    return matchesSearch && matchesStatus && matchesTier;
  });

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest animate-pulse">
          {isRtl ? 'جاري تحميل لوحة العضويات...' : 'Loading memberships list...'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 font-sans">
      {/* Page Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Shield className="text-blue-600" size={24} />
            {isRtl ? 'إدارة عضويات الشبكة والاشتراكات' : 'Network Membership Management'}
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            {isRtl 
              ? 'مراجعة وتدقيق طلبات العضوية المهنية وتفعيل حسابات الصحفيين والطلاب المعتمدين.' 
              : 'Review professional credential claims, verify media files, and activate journalist features.'}
          </p>
        </div>

        <button
          onClick={fetchMemberships}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-slate-600 hover:text-slate-900 font-bold text-xs uppercase tracking-widest transition"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          {isRtl ? 'تحديث' : 'Refresh'}
        </button>
      </div>

      {/* Stats Cards Bento Block */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-black tracking-wider uppercase">{isRtl ? 'طلبات قيد المراجعة' : 'Pending Requests'}</p>
            <h3 className="text-xl font-black text-slate-800">{pendingCount}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-black tracking-wider uppercase">{isRtl ? 'العضويات النشطة' : 'Active Members'}</p>
            <h3 className="text-xl font-black text-slate-800">{approvedCount}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Award size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-black tracking-wider uppercase">{isRtl ? 'صحفيون معتمدون' : 'Verified Journalists'}</p>
            <h3 className="text-xl font-black text-slate-800">{journalistCount}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Shield size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-black tracking-wider uppercase">{isRtl ? 'طلاب إعلام' : 'Media Students'}</p>
            <h3 className="text-xl font-black text-slate-800">{studentCount}</h3>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar Row */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-80 relative">
          <Search className="absolute left-3 top-3.5 text-slate-400" size={16} />
          <input
            type="text"
            placeholder={isRtl ? 'البحث عن عضو بالاسم، الإيميل...' : 'Search members, emails...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-xs placeholder:text-slate-400"
          />
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none cursor-pointer"
          >
            <option value="all">{isRtl ? 'كل الحالات' : 'All Statuses'}</option>
            <option value="pending">{isRtl ? 'قيد المراجعة' : 'Pending'}</option>
            <option value="approved">{isRtl ? 'معتمد نشط' : 'Approved'}</option>
            <option value="rejected">{isRtl ? 'مرفوض' : 'Rejected'}</option>
          </select>

          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none cursor-pointer"
          >
            <option value="all">{isRtl ? 'كل الفئات' : 'All Tiers'}</option>
            <option value="free">{isRtl ? 'عضو مجاني' : 'Free'}</option>
            <option value="student">{isRtl ? 'عضو طالب' : 'Student'}</option>
            <option value="journalist">{isRtl ? 'صحفي محترف' : 'Professional Journalist'}</option>
            <option value="expert">{isRtl ? 'خبير إعلامي' : 'Media Expert'}</option>
            <option value="institution">{isRtl ? 'مؤسسة شريكة' : 'Partner Institution'}</option>
          </select>
        </div>
      </div>

      {/* Main Memberships Table View */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        {filteredMemberships.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
              <Shield size={32} />
            </div>
            <div>
              <h3 className="font-bold text-slate-700">{isRtl ? 'لا توجد طلبات عضوية' : 'No memberships found'}</h3>
              <p className="text-slate-400 text-xs mt-1">{isRtl ? 'لا تتطابق طلبات العضوية الحالية مع خيارات الفلترة المستخدمة.' : 'Adjust your search parameters or check filters.'}</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-right md:text-right">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-xs font-black uppercase tracking-wider">
                  <th className="p-4">{isRtl ? 'العضو الأساسي' : 'Member'}</th>
                  <th className="p-4">{isRtl ? 'الفئة المطلوبة' : 'Tier'}</th>
                  <th className="p-4">{isRtl ? 'الجهة والمسمى' : 'Title & Affiliation'}</th>
                  <th className="p-4">{isRtl ? 'المستندات المهنية' : 'Documents'}</th>
                  <th className="p-4">{isRtl ? 'الحالة والقرار' : 'Status'}</th>
                  <th className="p-4">{isRtl ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredMemberships.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/30 transition">
                    <td className="p-4">
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-800">{item.user_name || 'Anonymous User'}</p>
                        <p className="font-mono text-xs text-slate-400">{item.user_email}</p>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="font-bold text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                        {isRtl ? item.tier_name_ar : item.tier_name_en}
                      </span>
                    </td>

                    <td className="p-4">
                      {item.tier_id === 'free' ? (
                        <span className="text-slate-300 font-medium text-xs">N/A (عضوية عامة)</span>
                      ) : (
                        <div className="space-y-0.5 text-xs font-medium">
                          <p className="text-slate-700">{item.professional_title}</p>
                          <p className="text-slate-400">{item.institution}</p>
                        </div>
                      )}
                    </td>

                    <td className="p-4">
                      {item.tier_id === 'free' ? (
                        <span className="text-slate-300 text-xs">--</span>
                      ) : (
                        <div className="flex flex-wrap gap-2 text-xs font-bold">
                          {item.cv_url ? (
                            <a 
                              href={item.cv_url} 
                              target="_blank" 
                              referrerPolicy="no-referrer"
                              className="text-blue-600 hover:underline flex items-center gap-1 bg-slate-50 border p-1 rounded px-2"
                            >
                              <FileText size={12} /> CV
                            </a>
                          ) : (
                            <span className="text-slate-300 font-normal">No CV</span>
                          )}

                          {item.id_card_url ? (
                            <a 
                              href={item.id_card_url} 
                              target="_blank" 
                              referrerPolicy="no-referrer"
                              className="text-indigo-600 hover:underline flex items-center gap-1 bg-slate-50 border p-1 rounded px-2"
                            >
                              <Shield size={12} /> ID Card
                            </a>
                          ) : (
                            <span className="text-slate-300 font-normal">No ID</span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold tracking-wider ${
                        item.status === 'approved' 
                          ? 'bg-emerald-50 text-emerald-600' 
                          : item.status === 'pending'
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-rose-50 text-rose-600'
                      }`}>
                        {item.status === 'approved' && (isRtl ? 'معتمد' : 'Approved')}
                        {item.status === 'pending' && (isRtl ? 'قيد المراجعة' : 'Pending')}
                        {item.status === 'rejected' && (isRtl ? 'مرفوض' : 'Rejected')}
                      </span>
                    </td>

                    <td className="p-4">
                      {item.status === 'pending' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenDecision(item, 'approved')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-xl text-xs transition flex items-center gap-1 font-bold"
                            title={isRtl ? 'قبول واعتماد' : 'Approve'}
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => handleOpenDecision(item, 'rejected')}
                            className="bg-rose-600 hover:bg-rose-700 text-white p-2 rounded-xl text-xs transition flex items-center gap-1 font-bold"
                            title={isRtl ? 'رفض الطلب' : 'Reject'}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-medium text-xs">
                          {isRtl ? 'تم اتخاذ القرار' : 'Resolved'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Decision Action Overlay Modal */}
      <AnimatePresence>
        {activeDecision && decisionType && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200"
            >
              <div className={`p-6 text-white ${decisionType === 'approved' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                <h3 className="font-black text-lg">
                  {decisionType === 'approved' 
                    ? (isRtl ? 'الموافقة على طلب العضوية واعتماده' : 'Approve Membership Application') 
                    : (isRtl ? 'رفض طلب العضوية' : 'Reject Membership Application')}
                </h3>
                <p className="text-white/80 text-xs mt-1">
                  {isRtl 
                    ? `أنت بصدد اتخاذ إجراء لطلب العضوية المقدم من ${activeDecision.user_name}` 
                    : `Resolving credential request submitted by ${activeDecision.user_name}`}
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl text-xs font-medium space-y-1 text-slate-600 border border-slate-100">
                  <p><strong>{isRtl ? 'اسم المستخدم:' : 'User Name:'}</strong> {activeDecision.user_name}</p>
                  <p><strong>{isRtl ? 'الفئة المطلوبة:' : 'Target Tier:'}</strong> {isRtl ? activeDecision.tier_name_ar : activeDecision.tier_name_en}</p>
                  <p><strong>{isRtl ? 'المسمى الوظيفي:' : 'Job Title:'}</strong> {activeDecision.professional_title || 'N/A'}</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    {isRtl ? 'ملاحظات وتغذية راجعة للمستخدم (اختياري)' : 'Decision Notes / Feedback (Optional)'}
                  </label>
                  <textarea
                    rows={3}
                    value={decisionNotes}
                    onChange={(e) => setDecisionNotes(e.target.value)}
                    placeholder={isRtl ? 'اكتب تبريراً أو توجيهاً للمستخدم يظهر في ملفه الشخصي...' : 'Share feedback or context regarding the status...'}
                    className="w-full p-3 text-sm rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setActiveDecision(null);
                      setDecisionType(null);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl uppercase tracking-wider transition"
                  >
                    {isRtl ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    onClick={handleConfirmDecision}
                    disabled={processingDecision}
                    className={`px-5 py-2 text-white text-xs font-black rounded-xl uppercase tracking-wider transition flex items-center gap-2 ${
                      decisionType === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                    }`}
                  >
                    {processingDecision && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    {decisionType === 'approved' ? (isRtl ? 'تأكيد الموافقة والتفعيل' : 'Confirm & Approve') : (isRtl ? 'تأكيد الرفض' : 'Confirm & Reject')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
