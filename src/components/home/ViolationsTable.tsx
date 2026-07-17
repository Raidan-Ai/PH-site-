import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Filter, 
  Calendar, 
  MapPin, 
  RefreshCw, 
  Eye, 
  ShieldAlert, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Info,
  AlertTriangle,
  X
} from 'lucide-react';

interface ViolationsTableProps {
  violations: any[];
  selectedGovernorate: string | null;
  onSelectGovernorate: (gov: string | null) => void;
  onRefresh: () => void;
  isSyncing: boolean;
  lastUpdated: Date | null;
}

export default function ViolationsTable({
  violations,
  selectedGovernorate,
  onSelectGovernorate,
  onRefresh,
  isSyncing,
  lastUpdated
}: ViolationsTableProps) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | '30days' | 'year' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | number | null>(null);

  // List of all governorates with violations to populate filter
  const governorates = useMemo(() => {
    const list = new Set<string>();
    violations.forEach(v => {
      if (v.governorate) list.add(v.governorate);
    });
    return Array.from(list).sort();
  }, [violations]);

  // Handle row expansion
  const toggleRow = (id: string | number) => {
    setExpandedRow(prev => prev === id ? null : id);
  };

  // Filter Logic
  const filteredViolations = useMemo(() => {
    return violations.filter(v => {
      // 1. Keyword search matcher
      const victimLower = (v.victimName || '').toLowerCase();
      const institutionLower = (v.victimInstitution || '').toLowerCase();
      const descLower = (v.description || '').toLowerCase();
      const typeLower = (v.type || '').toLowerCase();
      const query = searchTerm.toLowerCase();
      
      const matchesSearch = !searchTerm || 
        victimLower.includes(query) || 
        institutionLower.includes(query) || 
        descLower.includes(query) || 
        typeLower.includes(query);

      // 2. Governorate matcher (synchronized with map)
      const isSana = selectedGovernorate === 'صنعاء' || selectedGovernorate === 'أمانة العاصمة صنعاء';
      const matchesGov = !selectedGovernorate || 
        (isSana 
          ? (v.governorate === 'صنعاء' || v.governorate === 'أمانة العاصمة صنعاء') 
          : v.governorate === selectedGovernorate);

      // 3. Date matcher
      let matchesDate = true;
      if (v.date) {
        const vDate = new Date(v.date);
        const now = new Date();
        
        if (dateFilter === '30days') {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(now.getDate() - 30);
          matchesDate = vDate >= thirtyDaysAgo;
        } else if (dateFilter === 'year') {
          const startOfYear = new Date(now.getFullYear(), 0, 1);
          matchesDate = vDate >= startOfYear;
        } else if (dateFilter === 'custom') {
          if (startDate) {
            const sD = new Date(startDate);
            matchesDate = matchesDate && vDate >= sD;
          }
          if (endDate) {
            const eD = new Date(endDate);
            matchesDate = matchesDate && vDate <= eD;
          }
        }
      }

      return matchesSearch && matchesGov && matchesDate;
    });
  }, [violations, searchTerm, selectedGovernorate, dateFilter, startDate, endDate]);

  // Format Date for Arabic/English
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(isRtl ? 'ar-YE' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusColor = (type: string) => {
    const typeStr = type.toLowerCase();
    if (typeStr.includes('قتل') || typeStr.includes('death') || typeStr.includes('severe') || typeStr.includes('جسيم')) {
      return 'bg-red-50 text-red-700 border-red-150';
    }
    if (typeStr.includes('اعتقال') || typeStr.includes('arrest') || typeStr.includes('detention') || typeStr.includes('تهديد')) {
      return 'bg-amber-50 text-amber-700 border-amber-150';
    }
    return 'bg-slate-50 text-slate-700 border-slate-150';
  };

  return (
    <div className="flex flex-col h-full min-h-[600px] bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden" id="violations-dashboard-table">
      {/* Header & Connection Status */}
      <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex flex-wrap gap-4 items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-lg">
              {isRtl ? 'سجل الانتهاكات الموثقة' : 'Documented Violations Registry'}
            </h3>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-[11px] font-bold text-slate-600 font-mono">
              {filteredViolations.length}
            </span>
          </div>
          <p className="text-slate-400 text-xs">
            {isRtl ? 'البيانات مستخرجة مباشرة من قاعدة بيانات المرصد' : 'Direct certified telemetry from observatory ledger'}
          </p>
        </div>

        {/* Realtime API status */}
        <div className="flex items-center gap-3 bg-white border border-slate-100 px-3 py-1.5 rounded-2xl shadow-xs">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider font-sans">
              {isRtl ? 'اتصال حي' : 'Live Synced'}
            </span>
          </div>
          
          {lastUpdated && (
            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 border-l border-slate-100 pl-2 rtl:border-l-0 rtl:border-r rtl:pl-0 rtl:pr-2">
              <Clock size={10} />
              {lastUpdated.toLocaleTimeString(isRtl ? 'ar-YE' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          )}

          <button 
            onClick={onRefresh}
            disabled={isSyncing}
            className={`text-slate-500 hover:text-slate-800 hover:bg-slate-50 p-1.5 rounded-lg transition-all ${isSyncing ? 'animate-spin text-blue-600' : ''}`}
            title={isRtl ? 'تحديث البيانات' : 'Sync Leads'}
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Advanced Filters Toolbar */}
      <div className="p-4 border-b border-slate-50 bg-white grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 z-10">
        {/* Keyword Search */}
        <div className="relative lg:col-span-4">
          <Search className="absolute left-3 top-2.5 rtl:left-auto rtl:right-3 text-slate-400" size={15} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isRtl ? 'ابحث باسم الصحفي، الوسيلة، التفاصيل...' : 'Search victim, medium, keywords...'}
            className="w-full pl-9 pr-4 rtl:pl-4 rtl:pr-9 py-2 border border-slate-200 rounded-2xl text-xs text-slate-700 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all placeholder:text-slate-400"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              className="absolute right-3 top-2.5 rtl:right-auto rtl:left-3 text-slate-400 hover:text-slate-600"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Governorate Select Sync */}
        <div className="relative lg:col-span-3">
          <MapPin className="absolute left-3 top-2.5 rtl:left-auto rtl:right-3 text-slate-400" size={14} />
          <select
            value={selectedGovernorate || ''}
            onChange={(e) => onSelectGovernorate(e.target.value || null)}
            className="w-full pl-9 pr-6 rtl:pl-6 rtl:pr-9 py-2 border border-slate-200 rounded-2xl text-xs text-slate-700 bg-slate-50/50 hover:bg-slate-50 cursor-pointer focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 appearance-none"
          >
            <option value="">{isRtl ? 'كل المحافظات' : 'All Governorates'}</option>
            {governorates.map(gov => (
              <option key={gov} value={gov}>{gov}</option>
            ))}
          </select>
        </div>

        {/* Date Filter Preset Selector */}
        <div className="relative lg:col-span-3">
          <Filter className="absolute left-3 top-2.5 rtl:left-auto rtl:right-3 text-slate-400" size={14} />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="w-full pl-9 pr-6 rtl:pl-6 rtl:pr-9 py-2 border border-slate-200 rounded-2xl text-xs text-slate-700 bg-slate-50/50 hover:bg-slate-50 cursor-pointer focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 appearance-none"
          >
            <option value="all">{isRtl ? 'كل التواريخ' : 'All Timelines'}</option>
            <option value="30days">{isRtl ? 'آخر 30 يوماً' : 'Last 30 Days'}</option>
            <option value="year">{isRtl ? 'هذا العام (2026)' : 'This Year (2026)'}</option>
            <option value="custom">{isRtl ? 'فترة مخصصة' : 'Custom Interval'}</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        <div className="lg:col-span-2 flex items-center justify-end">
          {(selectedGovernorate || searchTerm || dateFilter !== 'all') && (
            <button
              onClick={() => {
                onSelectGovernorate(null);
                setSearchTerm('');
                setDateFilter('all');
                setStartDate('');
                setEndDate('');
              }}
              className="text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-100 rounded-2xl px-3 py-2 text-xs font-bold transition-colors w-full flex items-center justify-center gap-1.5"
            >
              <X size={12} />
              {isRtl ? 'تصفية الفلاتر' : 'Clear Filter'}
            </button>
          )}
        </div>
      </div>

      {/* Custom Date Range Picker Block (Animated) */}
      <AnimatePresence>
        {dateFilter === 'custom' && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-6 py-4 border-b border-slate-50 bg-slate-50/20 grid grid-cols-2 gap-4"
          >
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                {isRtl ? 'من تاريخ' : 'Start Date'}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-700 bg-white focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                {isRtl ? 'إلى تاريخ' : 'End Date'}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-700 bg-white focus:outline-none"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Synchronized Governorate Highlight Message */}
      {selectedGovernorate && (
        <div className="px-6 py-2.5 bg-blue-50/50 border-b border-blue-100/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-1.5 w-1.5 rounded-full bg-blue-600"></span>
            <span className="text-[11px] text-blue-800 font-bold">
              {isRtl 
                ? `تصفية نشطة للمحافظة: ${selectedGovernorate}` 
                : `Filtered map selection: ${selectedGovernorate}`}
            </span>
          </div>
          <button
            onClick={() => onSelectGovernorate(null)}
            className="text-blue-500 hover:text-blue-700 text-[10px] font-bold"
          >
            {isRtl ? 'إلغاء التحديد' : 'Deselect'}
          </button>
        </div>
      )}

      {/* Main Table List Body */}
      <div className="flex-1 overflow-y-auto max-h-[500px] divide-y divide-slate-50 scrollbar-thin">
        {filteredViolations.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <div className="p-4 rounded-full bg-slate-50 border border-slate-100 text-slate-400">
              <AlertTriangle size={30} />
            </div>
            <h4 className="font-bold text-slate-700 text-sm">
              {isRtl ? 'لم يتم العثور على انتهاكات' : 'No Incidents Found'}
            </h4>
            <p className="text-slate-400 text-xs max-w-sm">
              {isRtl 
                ? 'لا توجد انتهاكات تتطابق مع الفلاتر المحددة حالياً. يرجى تعديل خيارات البحث.' 
                : 'We couldn\'t find any records meeting your exact filters.'}
            </p>
          </div>
        ) : (
          filteredViolations.map((violation) => {
            const isExpanded = expandedRow === violation.id;
            return (
              <div 
                key={violation.id}
                className={`transition-all duration-150 ${isExpanded ? 'bg-slate-50/40' : 'hover:bg-slate-50/20'}`}
              >
                {/* Standard Card Row */}
                <div 
                  onClick={() => toggleRow(violation.id)}
                  className="p-4 flex gap-4 items-start cursor-pointer group"
                >
                  {/* Status Indicator */}
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 border ${
                    violation.type?.includes('قتل') || violation.type?.toLowerCase().includes('death') || violation.type?.includes('جسيم')
                      ? 'bg-red-500 border-red-200'
                      : 'bg-amber-500 border-amber-200'
                  }`} />

                  {/* Main Content Info */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border uppercase tracking-wider ${getStatusColor(violation.type || '')}`}>
                        {violation.type}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <Calendar size={10} />
                        {formatDate(violation.date)}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-800 leading-snug group-hover:text-blue-600 transition-colors">
                      {violation.victimName} 
                      {violation.victimInstitution && (
                        <span className="text-slate-400 font-normal">
                          {' '}({violation.victimInstitution})
                        </span>
                      )}
                    </h4>

                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <MapPin size={10} className="text-slate-400" />
                      <span>{violation.governorate}</span>
                      {violation.district && (
                        <>
                          <span className="text-slate-200">|</span>
                          <span>{violation.district}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Expand Chevron */}
                  <div className="text-slate-400 group-hover:text-slate-700 transition-colors mt-1">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {/* Animated Expanded Panel */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-slate-50 bg-slate-50/50"
                    >
                      <div className="p-4 space-y-4 text-xs text-slate-600 leading-relaxed border-l-2 border-slate-400 rtl:border-l-0 rtl:border-r-2 ml-4 mr-4 mb-4 mt-2">
                        <div className="space-y-1">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                            {isRtl ? 'تفاصيل الواقعة والانتهاك' : 'Incident Specifics'}
                          </span>
                          <p className="text-slate-700 font-medium leading-relaxed bg-white/70 p-3 rounded-2xl border border-slate-100 shadow-3xs">
                            {violation.description}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                          {violation.perpetrator && (
                            <div className="space-y-0.5">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                                {isRtl ? 'الجهة المرتكبة للانتهاك' : 'Perpetrator'}
                              </span>
                              <span className="text-slate-800 font-bold bg-red-50/40 text-red-700 border border-red-100/50 px-2.5 py-1 rounded-xl inline-block">
                                {violation.perpetrator}
                              </span>
                            </div>
                          )}

                          {violation.evidenceLinks && (
                            <div className="space-y-0.5">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                                {isRtl ? 'روابط التوثيق والإثبات' : 'Evidence Logs'}
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {(() => {
                                  try {
                                    const parsed = typeof violation.evidenceLinks === 'string' 
                                      ? JSON.parse(violation.evidenceLinks) 
                                      : violation.evidenceLinks;
                                    
                                    if (Array.isArray(parsed) && parsed.length > 0) {
                                      return parsed.map((link: string, idx: number) => (
                                        <a 
                                          key={idx} 
                                          href={link} 
                                          target="_blank" 
                                          rel="noreferrer noopener" 
                                          className="text-blue-600 hover:underline bg-blue-50/30 border border-blue-100/50 px-2.5 py-1 rounded-xl inline-block"
                                        >
                                          {isRtl ? `مستند إثبات ${idx + 1}` : `Evidence Link ${idx + 1}`}
                                        </a>
                                      ));
                                    }
                                  } catch (e) {
                                    // if it's just a string link
                                    if (violation.evidenceLinks && String(violation.evidenceLinks).startsWith('http')) {
                                      return (
                                        <a 
                                          href={violation.evidenceLinks} 
                                          target="_blank" 
                                          rel="noreferrer noopener" 
                                          className="text-blue-600 hover:underline bg-blue-50/30 border border-blue-100/50 px-2.5 py-1 rounded-xl inline-block"
                                        >
                                          {isRtl ? 'عرض مستند الإثبات' : 'Evidence Documentation'}
                                        </a>
                                      );
                                    }
                                  }
                                  return <span className="text-slate-400 italic font-medium">{isRtl ? 'لا توجد مستندات عامة ملحقة' : 'No public files attached'}</span>;
                                })()}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info Summary */}
      <div className="p-4 bg-slate-50/40 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-400">
        <div className="flex items-center gap-1">
          <Info size={11} className="text-slate-400" />
          <span>
            {isRtl 
              ? 'انقر على الصف لعرض تفاصيل الواقعة كاملة والجهات المتهمة' 
              : 'Expand rows to audit legal descriptions and evidence.'}
          </span>
        </div>
        <div className="font-mono">
          {filteredViolations.length} / {violations.length} {isRtl ? 'مدرج' : 'listed'}
        </div>
      </div>
    </div>
  );
}
