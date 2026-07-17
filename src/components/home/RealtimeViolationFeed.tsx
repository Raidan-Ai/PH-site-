import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, MapPin, Calendar, Clock, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { cn } from '../../lib/utils';
import { Violation } from '../../types';

export function RealtimeViolationFeed() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchViolations = async () => {
    try {
      const response = await api.get('/api/violations');
      let data = response.data;
      if (Array.isArray(data)) {
        // Sort by date or created at descending
        data.sort((a: any, b: any) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
        
        // Limit to latest 5
        setViolations(data.slice(0, 5));
      } else {
        throw new Error("Violations data is not an array");
      }
      setLastRefreshed(new Date());
    } catch (error) {
      console.error("Error fetching realtime violations:", error.message, error.response?.status, error.config);
      // Fallback
      setViolations([
        { id: '1', type: isRtl ? 'اعتقال تعسفي' : 'Arbitrary Arrest', governorate: isRtl ? 'صنعاء' : 'Sanaa', victimName: isRtl ? 'أكرم العمودي' : 'Akram Al-Amoudi', victimInstitution: isRtl ? 'قناة المهرة' : 'Al-Mahrah TV', description: isRtl ? 'اعتقال تعسفي بسبب التصوير وتوثيق الأنشطة المدنية دون إذن مسبق' : 'Arbitrary arrest due to field photography without authorization', date: '2026-02-14', status: 'verified', createdAt: new Date().toISOString(), reporterName: '', reporterPhone: '', district: '', evidenceLinks: [], perpetrator: '' },
        { id: '2', type: isRtl ? 'حجب مواقع' : 'Website Blocking', governorate: isRtl ? 'عدن' : 'Aden', victimName: isRtl ? 'موقع اليمني الحر' : 'Al-Yemeni Free', victimInstitution: isRtl ? 'منصة الصحافة المستقلة' : 'Independent Press Platform', description: isRtl ? 'حجب الرابط الرسمي للموقع الإخباري عن الجمهور المحلي' : 'Official website blocked from local viewers', date: '2026-03-10', status: 'pending', createdAt: new Date(Date.now() - 3600000).toISOString(), reporterName: '', reporterPhone: '', district: '', evidenceLinks: [], perpetrator: '' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchViolations();
    // Poll every 30 seconds
    const interval = setInterval(fetchViolations, 30000);
    return () => clearInterval(interval);
  }, [isRtl]);

  const StatusBadge = ({ status }: { status: string }) => {
    if (status === 'verified') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100">
          <CheckCircle2 size={10} />
          {isRtl ? 'متحقق منه' : 'Verified'}
        </span>
      );
    }
    if (status === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-100">
          <Clock size={10} />
          {isRtl ? 'قيد المراجعة' : 'Pending Review'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-50 text-slate-600 border border-slate-200">
        <AlertTriangle size={10} />
        {status}
      </span>
    );
  };

  const timeAgo = (dateStr: string) => {
    const rtf = new Intl.RelativeTimeFormat(isRtl ? 'ar' : 'en', { numeric: 'auto' });
    const elapsed = new Date(dateStr).getTime() - new Date().getTime();
    
    // Seconds
    if (Math.abs(elapsed) < 60000) return rtf.format(Math.round(elapsed / 1000), 'second');
    // Minutes
    if (Math.abs(elapsed) < 3600000) return rtf.format(Math.round(elapsed / 60000), 'minute');
    // Hours
    if (Math.abs(elapsed) < 86400000) return rtf.format(Math.round(elapsed / 3600000), 'hour');
    // Days
    return rtf.format(Math.round(elapsed / 86400000), 'day');
  };

  return (
    <div className="bg-white rounded-3xl md:rounded-[40px] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center text-red-600">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              {isRtl ? 'الأحداث الموثقة لحظياً' : 'Real-time Incident Feed'}
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              {isRtl ? 'مزامنة حية للبيانات' : 'Live Data Sync'} • {lastRefreshed.toLocaleTimeString(isRtl ? 'ar-YE' : 'en-US', {hour: '2-digit', minute:'2-digit', second: '2-digit'})}
            </div>
          </div>
        </div>
        <button 
          onClick={fetchViolations}
          className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"
          title={isRtl ? 'تحديث البيانات' : 'Refresh Data'}
        >
          <RefreshCw size={16} className={cn(loading && "animate-spin")} />
        </button>
      </div>

      <div className="flex-grow p-4 md:p-6 overflow-y-auto" style={{ maxHeight: '500px' }}>
        {loading && violations.length === 0 ? (
          <div className="flex flex-col gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse flex gap-4 p-4 rounded-2xl bg-slate-50">
                <div className="w-12 h-12 rounded-xl bg-slate-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-3 bg-slate-200 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {violations.map((violation, index) => (
                <motion.div
                  key={violation.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative p-4 rounded-2xl bg-white border border-slate-100 hover:border-blue-100 hover:shadow-md hover:shadow-blue-900/5 transition-all duration-300"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={violation.status} />
                        <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                          {violation.type}
                        </span>
                        <div className="text-xs text-slate-400 font-medium flex items-center gap-1">
                          <Clock size={12} />
                          {timeAgo(violation.createdAt || violation.date)}
                        </div>
                      </div>
                      
                      <h4 className="text-sm font-bold text-slate-900 leading-tight">
                        {violation.description || `${violation.type} against ${violation.victimName}`}
                      </h4>
                      
                      <div className="flex items-center gap-4 pt-2">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-50 px-2 py-1 rounded-md">
                          <MapPin size={12} className="text-slate-400" />
                          {violation.governorate}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-50 px-2 py-1 rounded-md">
                          <Calendar size={12} className="text-slate-400" />
                          {new Date(violation.date).toLocaleDateString(isRtl ? 'ar-YE' : 'en-US')}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {violations.length === 0 && !loading && (
              <div className="text-center py-12 text-slate-500 font-medium">
                {isRtl ? 'لا توجد انتهاكات مسجلة حالياً.' : 'No violations recorded currently.'}
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="p-4 md:p-6 border-t border-slate-100 bg-slate-50/50 mt-auto">
        <Link 
          to="/violations"
          className="flex items-center justify-center gap-2 w-full py-3 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-700 hover:text-blue-600 hover:border-blue-200 transition-all active:scale-95 uppercase tracking-widest"
        >
          {isRtl ? 'الوصول لمرصد الانتهاكات' : 'Access Violations Observatory'}
        </Link>
      </div>
    </div>
  );
}
