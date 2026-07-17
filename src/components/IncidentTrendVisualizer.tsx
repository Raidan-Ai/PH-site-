import React, { useState, useMemo } from 'react';
import { 
  AreaChart, Area, LineChart, Line, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { 
  Calendar, Filter, Sliders, MapPin, 
  AlertOctagon, CheckCircle2, TrendingUp, TrendingDown, Minus, 
  LayoutGrid, Activity, HelpCircle, BarChart3, LineChart as LineIcon, AreaChart as AreaIcon
} from 'lucide-react';

interface IncidentTrendVisualizerProps {
  violations: any[];
  isRtl: boolean;
}

export default function IncidentTrendVisualizer({ violations, isRtl }: IncidentTrendVisualizerProps) {
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('area');
  const [localTypeFilter, setLocalTypeFilter] = useState<string>('all');
  const [localRegionFilter, setLocalRegionFilter] = useState<string>('all');
  const [timeResolution, setTimeResolution] = useState<'monthly' | 'quarterly'>('monthly');

  // Compute unique types and regions from the violations
  const uniqueTypes = useMemo(() => {
    const types = new Set<string>();
    violations.forEach(v => {
      if (v.type) types.add(v.type);
    });
    return Array.from(types).sort();
  }, [violations]);

  const uniqueRegions = useMemo(() => {
    const regions = new Set<string>();
    violations.forEach(v => {
      if (v.governorate) regions.add(v.governorate);
    });
    return Array.from(regions).sort();
  }, [violations]);

  // Apply filters locally for the visualization component
  const filteredData = useMemo(() => {
    return violations.filter(v => {
      const matchesType = localTypeFilter === 'all' || v.type === localTypeFilter;
      const matchesRegion = localRegionFilter === 'all' || v.governorate === localRegionFilter;
      return matchesType && matchesRegion;
    });
  }, [violations, localTypeFilter, localRegionFilter]);

  // Build timeline labels and counts
  const timelineData = useMemo(() => {
    const monthsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const quartersAr = ['الربع الأول', 'الربع الثاني', 'الربع الثالث', 'الربع الرابع'];
    const quartersEn = ['Q1 (Jan-Mar)', 'Q2 (Apr-Jun)', 'Q3 (Jul-Sep)', 'Q4 (Oct-Dec)'];

    if (timeResolution === 'monthly') {
      const counts = Array.from({ length: 12 }, (_, i) => ({
        index: i,
        name: isRtl ? monthsAr[i] : monthsEn[i],
        incidents: 0,
        // Keep detail breakdowns for custom tooltip
        types: {} as Record<string, number>,
        regions: {} as Record<string, number>,
      }));

      filteredData.forEach(v => {
        if (v.date) {
          const dateObj = new Date(v.date);
          if (!isNaN(dateObj.getTime())) {
            const m = dateObj.getMonth();
            counts[m].incidents += 1;
            
            if (v.type) {
              counts[m].types[v.type] = (counts[m].types[v.type] || 0) + 1;
            }
            if (v.governorate) {
              counts[m].regions[v.governorate] = (counts[m].regions[v.governorate] || 0) + 1;
            }
          }
        }
      });

      return counts;
    } else {
      // Quarterly
      const counts = Array.from({ length: 4 }, (_, i) => ({
        index: i,
        name: isRtl ? quartersAr[i] : quartersEn[i],
        incidents: 0,
        types: {} as Record<string, number>,
        regions: {} as Record<string, number>,
      }));

      filteredData.forEach(v => {
        if (v.date) {
          const dateObj = new Date(v.date);
          if (!isNaN(dateObj.getTime())) {
            const m = dateObj.getMonth();
            const q = Math.floor(m / 3);
            if (q >= 0 && q < 4) {
              counts[q].incidents += 1;
              if (v.type) {
                counts[q].types[v.type] = (counts[q].types[v.type] || 0) + 1;
              }
              if (v.governorate) {
                counts[q].regions[v.governorate] = (counts[q].regions[v.governorate] || 0) + 1;
              }
            }
          }
        }
      });

      return counts;
    }
  }, [filteredData, timeResolution, isRtl]);

  // Statistics summaries
  const statsSummary = useMemo(() => {
    let total = filteredData.length;
    let avg = 0;
    let peakVal = 0;
    let peakLabel = isRtl ? 'لا يوجد' : 'None';

    if (timelineData.length > 0) {
      const vals = timelineData.map(d => d.incidents);
      avg = total / timelineData.length;
      peakVal = Math.max(...vals);
      const peakItem = timelineData.find(d => d.incidents === peakVal);
      if (peakItem && peakVal > 0) {
        peakLabel = peakItem.name;
      }
    }

    // Trend Direction: Compare last half vs first half
    let trendDirection: 'up' | 'down' | 'stable' = 'stable';
    const midPoint = Math.floor(timelineData.length / 2);
    const firstHalfSum = timelineData.slice(0, midPoint).reduce((sum, item) => sum + item.incidents, 0);
    const secondHalfSum = timelineData.slice(midPoint).reduce((sum, item) => sum + item.incidents, 0);

    if (secondHalfSum > firstHalfSum) {
      trendDirection = 'up';
    } else if (secondHalfSum < firstHalfSum) {
      trendDirection = 'down';
    }

    return {
      total,
      avg: avg.toFixed(1),
      peakVal,
      peakLabel,
      trendDirection
    };
  }, [timelineData, filteredData, isRtl]);

  // Custom Interactive Tooltip Content
  const CustomTooltipContent = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const typesList = Object.entries(data.types || {}).sort((a: any, b: any) => b[1] - a[1]);
      const regionsList = Object.entries(data.regions || {}).sort((a: any, b: any) => b[1] - a[1]);

      return (
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl shadow-xl max-w-sm text-xs text-slate-300">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-2">
            <span className="font-bold text-sm text-white">{label}</span>
            <span className="bg-red-500/10 text-red-400 px-2 py-0.5 rounded-lg font-mono font-bold">
              {data.incidents} {isRtl ? 'بلاغات' : 'cases'}
            </span>
          </div>

          {data.incidents > 0 ? (
            <div className="space-y-2">
              {typesList.length > 0 && (
                <div>
                  <div className="text-slate-500 font-bold mb-1 uppercase tracking-wider text-[10px] flex items-center gap-1">
                    <AlertOctagon size={10} className="text-red-400" />
                    {isRtl ? 'حسب نوع الانتهاك:' : 'By Type:'}
                  </div>
                  <div className="space-y-1 pl-2">
                    {typesList.slice(0, 3).map(([type, count]: any) => (
                      <div key={type} className="flex justify-between text-slate-400">
                        <span>• {type}</span>
                        <span className="font-mono font-bold">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {regionsList.length > 0 && (
                <div>
                  <div className="text-slate-500 font-bold mb-1 uppercase tracking-wider text-[10px] flex items-center gap-1">
                    <MapPin size={10} className="text-blue-400" />
                    {isRtl ? 'حسب المحافظة:' : 'By Province:'}
                  </div>
                  <div className="space-y-1 pl-2">
                    {regionsList.slice(0, 3).map(([region, count]: any) => (
                      <div key={region} className="flex justify-between text-slate-400">
                        <span>• {region}</span>
                        <span className="font-mono font-bold">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-slate-500 italic py-1 text-center">
              {isRtl ? 'لا توجد حوادث مسجلة' : 'No recorded incidents'}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border border-slate-200 shadow-md rounded-[32px] p-6 lg:p-8 space-y-8">
      {/* Visualizer Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 pb-6">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-xs font-mono uppercase tracking-wider mb-2">
            <Activity size={14} className="text-red-500 animate-pulse" />
            {isRtl ? 'محلل الاتجاهات الإحصائي' : 'Statistical Trend Analyzer'}
          </div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">
            {isRtl ? 'مؤشر أمن الصحفيين وتحليل الحوادث' : 'Journalists Security & Incident Trends'}
          </h3>
          <p className="text-slate-500 text-sm mt-1">
            {isRtl 
              ? 'تحليل زمني تفاعلي لتغير نمط ومعدل الحوادث الأمنية المسجلة ضد الصحفيين.' 
              : 'Interactive chronological analysis of security safety incident patterns recorded against journalists.'}
          </p>
        </div>

        {/* Chart type controls & Time granularity */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Chart type buttons */}
          <div className="bg-slate-100 p-1.5 rounded-xl border border-slate-200 flex gap-1">
            <button
              onClick={() => setChartType('area')}
              className={`p-2 rounded-lg transition-all ${chartType === 'area' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              title={isRtl ? 'مساحة مغطاة' : 'Area Chart'}
            >
              <AreaIcon size={16} />
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`p-2 rounded-lg transition-all ${chartType === 'line' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              title={isRtl ? 'منحنى بياني' : 'Line Chart'}
            >
              <LineIcon size={16} />
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`p-2 rounded-lg transition-all ${chartType === 'bar' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              title={isRtl ? 'أعمدة بيانية' : 'Bar Chart'}
            >
              <BarChart3 size={16} />
            </button>
          </div>

          {/* Time Resolution button */}
          <div className="bg-slate-100 p-1.5 rounded-xl border border-slate-200 flex gap-1 text-xs font-bold">
            <button
              onClick={() => setTimeResolution('monthly')}
              className={`px-3 py-1.5 rounded-lg transition-all ${timeResolution === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              {isRtl ? 'شهري' : 'Monthly'}
            </button>
            <button
              onClick={() => setTimeResolution('quarterly')}
              className={`px-3 py-1.5 rounded-lg transition-all ${timeResolution === 'quarterly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              {isRtl ? 'ربع سنوي' : 'Quarterly'}
            </button>
          </div>
        </div>
      </div>

      {/* Embedded Filters specific to Data Visualization */}
      <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <div className="flex items-center gap-3">
          <Sliders size={16} className="text-slate-400 shrink-0" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            {isRtl ? 'فلاتر الرسم البياني:' : 'Chart Filters:'}
          </span>
        </div>

        {/* Filter Type */}
        <div className="relative">
          <select
            value={localTypeFilter}
            onChange={(e) => setLocalTypeFilter(e.target.value)}
            className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 appearance-none shadow-sm cursor-pointer"
          >
            <option value="all">⚡ {isRtl ? 'جميع أنواع الانتهاكات' : 'All Violation Types'}</option>
            {uniqueTypes.map(type => (
              <option key={type} value={type}>🚨 {type}</option>
            ))}
          </select>
          <div className={`absolute inset-y-0 ${isRtl ? 'left-3' : 'right-3'} flex items-center pointer-events-none text-slate-400`}>
            ▼
          </div>
        </div>

        {/* Filter Region */}
        <div className="relative">
          <select
            value={localRegionFilter}
            onChange={(e) => setLocalRegionFilter(e.target.value)}
            className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 appearance-none shadow-sm cursor-pointer"
          >
            <option value="all">📍 {isRtl ? 'جميع المحافظات' : 'All Governorates'}</option>
            {uniqueRegions.map(region => (
              <option key={region} value={region}>🏷️ {region}</option>
            ))}
          </select>
          <div className={`absolute inset-y-0 ${isRtl ? 'left-3' : 'right-3'} flex items-center pointer-events-none text-slate-400`}>
            ▼
          </div>
        </div>
      </div>

      {/* Summary KPI Cards inside Visualizer */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
          <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
            {isRtl ? 'الحالات المشمولة بالرسم' : 'Cases in Chart'}
          </div>
          <div className="text-2xl font-black text-slate-900 flex items-baseline gap-1">
            {statsSummary.total}
            <span className="text-xs font-normal text-slate-400">
              / {violations.length}
            </span>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
          <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
            {isRtl ? 'المعدل الدوري' : 'Periodic Average'}
          </div>
          <div className="text-2xl font-black text-slate-900">
            {statsSummary.avg}
            <span className="text-xs font-normal text-slate-400 ml-1">
              {isRtl ? 'بلاغ' : 'cases'}
            </span>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
          <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
            {isRtl ? 'فترة الذروة' : 'Peak Period'}
          </div>
          <div className="text-sm font-black text-slate-900 flex items-center gap-1">
            <span className="truncate">{statsSummary.peakLabel}</span>
            <span className="text-xs font-mono font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded ml-1">
              ({statsSummary.peakVal})
            </span>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
              {isRtl ? 'اتجاه المنحنى' : 'Trend Indicator'}
            </div>
            <div className="text-sm font-black text-slate-900">
              {statsSummary.trendDirection === 'up' && (isRtl ? 'تصاعدي' : 'Upward')}
              {statsSummary.trendDirection === 'down' && (isRtl ? 'تنازلي' : 'Downward')}
              {statsSummary.trendDirection === 'stable' && (isRtl ? 'مستقر' : 'Stable')}
            </div>
          </div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            statsSummary.trendDirection === 'up' ? 'bg-red-50 text-red-500' :
            statsSummary.trendDirection === 'down' ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-100 text-slate-500'
          }`}>
            {statsSummary.trendDirection === 'up' && <TrendingUp size={16} />}
            {statsSummary.trendDirection === 'down' && <TrendingDown size={16} />}
            {statsSummary.trendDirection === 'stable' && <Minus size={16} />}
          </div>
        </div>
      </div>

      {/* Main Recharts Graph */}
      <div className="h-80 w-full relative">
        {statsSummary.total === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <HelpCircle size={40} className="text-slate-300 mb-2" />
            <p className="text-slate-500 text-sm font-medium">
              {isRtl ? 'لا توجد بيانات تطابق الفلاتر المحددة' : 'No data match the specified filters'}
            </p>
            <button
              onClick={() => {
                setLocalTypeFilter('all');
                setLocalRegionFilter('all');
              }}
              className="text-xs text-blue-600 font-bold hover:underline mt-2"
            >
              {isRtl ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}
            </button>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncidents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 11 }} 
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltipContent />} />
                <Area 
                  type="monotone" 
                  dataKey="incidents" 
                  stroke="#ef4444" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorIncidents)" 
                  dot={{ r: 4, strokeWidth: 2, fill: '#ef4444', stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 2, fill: '#ef4444', stroke: '#fff' }}
                />
              </AreaChart>
            ) : chartType === 'line' ? (
              <LineChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 11 }} 
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="incidents" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  dot={{ r: 4, strokeWidth: 2, fill: '#3b82f6', stroke: '#fff' }} 
                  activeDot={{ r: 6, strokeWidth: 2, fill: '#3b82f6', stroke: '#fff' }} 
                />
              </LineChart>
            ) : (
              <BarChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 11 }} 
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltipContent />} />
                <Bar 
                  dataKey="incidents" 
                  fill="#ef4444" 
                  radius={[6, 6, 0, 0]}
                  maxBarSize={45}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      {/* Visualizer Footer Helper */}
      <div className="flex items-center justify-between bg-blue-50/40 border border-blue-100/40 p-4 rounded-2xl text-[11px] text-blue-800">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={14} className="text-blue-600" />
          <span>
            {isRtl 
              ? 'يتم تحديث الرسوم الإحصائية تلقائياً وتفاعل كلياً مع الفلاتر المحلية المحددة.' 
              : 'Statistical graphs update automatically and are fully interactive with specified local filters.'}
          </span>
        </div>
      </div>
    </div>
  );
}
