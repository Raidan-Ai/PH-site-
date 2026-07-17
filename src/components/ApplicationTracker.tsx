import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { CheckCircle2, Clock, XCircle, FileText } from 'lucide-react';

interface Application {
  id: string;
  type: 'job' | 'course';
  title: string;
  date: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
}

export function ApplicationTracker() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  // Mock data for applications
  const [applications] = useState<Application[]>([
    { id: '1', type: 'course', title: isRtl ? 'دورة الصحافة الاستقصائية' : 'Investigative Journalism Course', date: '2026-06-15', status: 'accepted' },
    { id: '2', type: 'job', title: isRtl ? 'مراسل صحفي ميداني' : 'Field Reporter', date: '2026-07-02', status: 'pending' },
    { id: '3', type: 'course', title: isRtl ? 'أساسيات التصوير الفوتوغرافي' : 'Photography Basics', date: '2025-12-10', status: 'completed' },
  ]);

  const getStatusConfig = (status: Application['status']) => {
    switch (status) {
      case 'accepted':
        return { icon: <CheckCircle2 size={20} />, color: 'text-emerald-600 bg-emerald-50 border-emerald-200', text: isRtl ? 'مقبول' : 'Accepted' };
      case 'pending':
        return { icon: <Clock size={20} />, color: 'text-amber-600 bg-amber-50 border-amber-200', text: isRtl ? 'تحت المراجعة' : 'Under Review' };
      case 'rejected':
        return { icon: <XCircle size={20} />, color: 'text-rose-600 bg-rose-50 border-rose-200', text: isRtl ? 'مرفوض' : 'Rejected' };
      case 'completed':
        return { icon: <CheckCircle2 size={20} />, color: 'text-blue-600 bg-blue-50 border-blue-200', text: isRtl ? 'مكتمل' : 'Completed' };
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
          <FileText size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">{isRtl ? 'تتبع طلباتي' : 'My Applications'}</h2>
          <p className="text-sm text-slate-500">{isRtl ? 'حالة الطلبات للوظائف والدورات التدريبية' : 'Status of job and course applications'}</p>
        </div>
      </div>

      <div className="space-y-4">
        {applications.map((app, index) => {
          const statusConfig = getStatusConfig(app.status);
          return (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">
                  {app.type === 'job' ? (isRtl ? 'وظيفة' : 'Job') : (isRtl ? 'دورة تدريبية' : 'Course')}
                </span>
                <span className="font-bold text-slate-900">{app.title}</span>
                <span className="text-xs text-slate-500 mt-1">{app.date}</span>
              </div>
              <div className={`px-4 py-2 rounded-lg border flex items-center gap-2 font-bold text-sm ${statusConfig.color}`}>
                {statusConfig.icon}
                {statusConfig.text}
              </div>
            </motion.div>
          );
        })}
        {applications.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            {isRtl ? 'لا توجد طلبات سابقة' : 'No previous applications'}
          </div>
        )}
      </div>
    </div>
  );
}
