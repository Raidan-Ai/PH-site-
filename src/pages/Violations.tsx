import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Map as MapIcon, BarChart3, PlusCircle, Filter, Search, ChevronRight, AlertTriangle, FileText, Download, Share2, Activity, Clock, Crosshair, Loader2 } from 'lucide-react';
import { AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { api } from '../services/api';
import IncidentTrendVisualizer from '../components/IncidentTrendVisualizer';
import ViolationForm from '../components/ViolationForm';
import YemenMap from '../components/YemenMap';
import LeafletViolationsMap from '../components/LeafletViolationsMap';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { useDocumentSEO } from '../hooks/useDocumentSEO';

export default function Violations() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  
  // Call dynamic SEO Hook based on Violations State
  useDocumentSEO({
    title: isRtl ? 'مرصد انتهاكات الحريات الإعلامية باليمن | بيت الصحافة' : 'Media Violations Observatory in Yemen | PressHouse',
    description: isRtl 
      ? 'رصد متكامل وتوثيق حي للانتهاكات والاعتداءات على الحريات الإعلامية والصحفية في مختلف المحافظات اليمنية.' 
      : 'Comprehensive real-time tracking, reporting, and statistics of violations against press and media freedoms in Yemen.',
    keywords: isRtl ? 'انتهاك الصحفيين, تكميم الأفواه, حريات الصحافة اليمنية, الرصد الحقوقي' : 'journalist violations, freedom of speech, yemen media records, human rights monitoring'
  });

  const [activeTab, setActiveTab ] = useState<'stats' | 'map' | 'report'>('stats');
  const [violations, setViolations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Advanced Filtering States
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all'); // all, month, year, custom
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedGovernorate, setSelectedGovernorate] = useState<string | null>(null);

  useEffect(() => {
    const fetchViolations = async () => {
      try {
        let rawData: any[] = [];
        
        const response = await api.get('/api/violations');
        rawData = response.data || [];
 
        let verifiedData = rawData.filter((v: any) => v.status === 'verified');
        if (verifiedData.length === 0) {
          verifiedData = [];
        }
        setViolations(verifiedData);
      } catch (error: any) {
        console.warn("Could not fetch latest live violations in tracker:", error?.message || error);
        setViolations([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchViolations();
    // Optional: Poll every 30 seconds for real-time updates
    const intervalId = setInterval(fetchViolations, 30000);
    return () => clearInterval(intervalId);
  }, [isRtl]);

  // Compute unique violation types dynamically from the database records
  const uniqueTypes = useMemo(() => {
    const types = new Set<string>();
    violations.forEach(v => {
      if (v.type) types.add(v.type);
    });
    return Array.from(types).sort();
  }, [violations]);

  // Compute unique governorates
  const uniqueGovernorates = useMemo(() => {
    const govs = new Set<string>();
    violations.forEach(v => {
      if (v.governorate) govs.add(v.governorate);
    });
    return Array.from(govs).sort();
  }, [violations]);

  // Unified Filter engine
  const filteredViolations = useMemo(() => {
    return violations.filter(v => {
      // 1. Keyword search matcher
      const victimLower = (v.victimName || '').toLowerCase();
      const institutionLower = (v.victimInstitution || '').toLowerCase();
      const descLower = (v.description || '').toLowerCase();
      const govLower = (v.governorate || '').toLowerCase();
      const typeLower = (v.type || '').toLowerCase();
      const query = searchTerm.toLowerCase();
      
      const matchesSearch = !searchTerm || 
        victimLower.includes(query) || 
        institutionLower.includes(query) || 
        descLower.includes(query) || 
        govLower.includes(query) ||
        typeLower.includes(query);

      // 2. Type matcher
      const matchesType = typeFilter === 'all' || v.type === typeFilter;

      // 3. Governorate matcher (from map selection)
      const isSana = selectedGovernorate === 'صنعاء' || selectedGovernorate === 'أمانة العاصمة صنعاء';
      const matchesGov = !selectedGovernorate || 
        (isSana ? (v.governorate === 'صنعاء' || v.governorate === 'أمانة العاصمة صنعاء') : v.governorate === selectedGovernorate);

      // 4. Date matcher
      let matchesDate = true;
      if (v.date) {
        const vDate = new Date(v.date);
        const now = new Date();
        
        if (dateRangeFilter === 'month') {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(now.getDate() - 30);
          matchesDate = vDate >= thirtyDaysAgo;
        } else if (dateRangeFilter === 'year') {
          const startOfYear = new Date(now.getFullYear(), 0, 1);
          matchesDate = vDate >= startOfYear;
        } else if (dateRangeFilter === 'custom') {
          if (startDate) {
            const sD = new Date(startDate);
            matchesDate = matchesDate && vDate >= sD;
          }
          if (endDate) {
            const eD = new Date(endDate);
            eD.setHours(23, 59, 59, 999);
            matchesDate = matchesDate && vDate <= eD;
          }
        }
      }

      return matchesSearch && matchesType && matchesGov && matchesDate;
    });
  }, [violations, searchTerm, typeFilter, selectedGovernorate, dateRangeFilter, startDate, endDate]);

  // Recalculates statsByGov dynamically using ONLY filtered violations
  const statsByGov = useMemo(() => {
    return filteredViolations.reduce((acc: any, curr: any) => {
      acc[curr.governorate] = (acc[curr.governorate] || 0) + 1;
      return acc;
    }, {});
  }, [filteredViolations]);

  const chartData = useMemo(() => {
    return Object.entries(statsByGov).map(([name, value]) => ({ name, value: value as number }));
  }, [statsByGov]);

  const typeData = useMemo(() => {
    const counts = filteredViolations.reduce((acc: any, curr: any) => {
      acc[curr.type] = (acc[curr.type] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value: value as number }))
      .sort((a, b) => b.value - a.value);
  }, [filteredViolations]);

  // Dynamic monthly trend computed on active dataset
  const currentYearTrend = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const monthlyCounts: Record<string, number> = {};
    const months = isRtl 
      ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    months.forEach(m => { monthlyCounts[m] = 0; });

    violations.forEach(v => {
      if (v.date) {
        const dateObj = new Date(v.date);
        if (!isNaN(dateObj.getTime()) && dateObj.getFullYear() === currentYear) {
          const monthIndex = dateObj.getMonth();
          const mName = months[monthIndex];
          monthlyCounts[mName] = (monthlyCounts[mName] || 0) + 1;
        }
      }
    });

    return months.map(m => ({ name: m, cases: monthlyCounts[m] }));
  }, [violations, isRtl]);

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#8b5cf6'];

  const handleDownloadReport = async () => {
    setIsGeneratingReport(true);
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      
      // Title
      doc.setFontSize(24);
      doc.text("Violation Documentation Report", 20, 20);
      
      doc.setFontSize(14);
      doc.text(`Total Records: ${filteredViolations.length}`, 20, 30);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 40);
      
      let currentY = 50;

      // Capture the Dashboard container (charts)
      const dashboardElement = document.getElementById('dashboard-charts');
      if (dashboardElement) {
        const canvas = await html2canvas(dashboardElement, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        
        const pdfWidth = doc.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        let finalHeight = pdfHeight;
        if (currentY + finalHeight > 280) {
          finalHeight = 280 - currentY;
        }

        doc.addImage(imgData, 'PNG', 0, currentY, pdfWidth, finalHeight);
        currentY += finalHeight + 10;
      }

      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }

      // Auto table for detailed stats or records
      autoTable(doc, {
        startY: currentY,
        head: [['Date', 'Type', 'Governorate', 'Status']],
        body: filteredViolations.map((v: any) => [
          v.date || 'N/A', 
          v.type || 'N/A', 
          v.governorate || 'N/A', 
          v.status || 'N/A'
        ]),
      });

      doc.save('violations-report.pdf');
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Hero Header - Command Center Style */}
      <header className="pt-32 pb-16 relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]" />
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-12">
            <div className="max-w-4xl space-y-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono uppercase tracking-widest"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                {isRtl ? 'نظام المراقبة المباشر' : 'Live Monitoring System'}
              </motion.div>
              <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-[1.1]">
                {isRtl ? 'مركز توثيق' : 'Violation Documentation'} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">
                  {isRtl ? 'الانتهاكات' : 'Center'}
                </span>
              </h1>
              <p className="text-lg text-slate-400 leading-relaxed max-w-2xl font-medium">
                {isRtl 
                  ? 'منصة رصد متقدمة لتوثيق وتحليل الانتهاكات ضد حرية الصحافة في اليمن، مدعومة بالبيانات المباشرة والتحليل الجغرافي.' 
                  : 'An advanced monitoring platform to document and analyze violations against press freedom in Yemen, powered by live data and geographic analysis.'}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              <button 
                onClick={() => setActiveTab('report')}
                className="bg-red-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-red-700 transition-all flex items-center justify-center gap-3 shadow-[0_0_40px_-10px_rgba(220,38,38,0.5)]"
              >
                <AlertTriangle size={20} />
                {t('violations.report')}
              </button>
              <button 
                onClick={handleDownloadReport}
                disabled={isGeneratingReport}
                className="bg-white/5 backdrop-blur-md text-white border border-white/10 px-8 py-4 rounded-2xl font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isGeneratingReport ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
                {isGeneratingReport ? (isRtl ? 'جاري التحميل...' : 'Generating...') : (isRtl ? 'تصدير البيانات' : 'Export Data')}
              </button>
            </div>
          </div>

          {/* Tab Navigation - Technical Style */}
          <div className="flex gap-2 mt-16 p-1.5 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 w-fit overflow-x-auto max-w-full">
            {[
              { id: 'stats', label: isRtl ? 'لوحة المؤشرات' : 'Dashboard', icon: Activity },
              { id: 'map', label: isRtl ? 'الخريطة التفاعلية' : 'Interactive Map', icon: Crosshair },
              { id: 'report', label: isRtl ? 'تقديم بلاغ' : 'Submit Report', icon: PlusCircle },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2.5 px-6 py-3 text-sm font-bold transition-all rounded-xl whitespace-nowrap",
                  activeTab === tab.id 
                    ? "bg-white text-slate-900 shadow-lg" 
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                <tab.icon size={18} className={activeTab === tab.id ? "text-blue-600" : ""} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className={activeTab === 'map' ? "w-full max-w-none px-4 md:px-10 py-12" : "container mx-auto px-6 py-12"}>
        <AnimatePresence mode="wait">
          {activeTab === 'stats' && (
            <motion.div 
              key="stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Interactive Data Filters */}
              <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 flex flex-col lg:flex-row gap-4 items-center">
                {/* Search */}
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={isRtl ? 'ابحث عن الضحية، الموقع، أو نوع الانتهاك...' : 'Search victim, location, or type...'}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                
                {/* Type Filter */}
                <div className="w-full lg:w-48">
                  <select 
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-3 outline-none focus:bg-white focus:border-blue-500"
                  >
                    <option value="all">{isRtl ? 'جميع الانتهاكات' : 'All Violations'}</option>
                    {uniqueTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Governorate Filter */}
                <div className="w-full lg:w-48">
                  <select 
                    value={selectedGovernorate || ''}
                    onChange={(e) => setSelectedGovernorate(e.target.value || null)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-3 outline-none focus:bg-white focus:border-blue-500"
                  >
                    <option value="">{isRtl ? 'جميع المحافظات' : 'All Governorates'}</option>
                    {uniqueGovernorates.map(gov => (
                      <option key={gov} value={gov}>{gov}</option>
                    ))}
                  </select>
                </div>

                {/* Date Range Filter */}
                <div className="w-full lg:w-48">
                  <select 
                    value={dateRangeFilter}
                    onChange={(e) => setDateRangeFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-3 outline-none focus:bg-white focus:border-blue-500"
                  >
                    <option value="all">{isRtl ? 'كل الوقت' : 'All Time'}</option>
                    <option value="month">{isRtl ? 'آخر 30 يوم' : 'Last 30 Days'}</option>
                    <option value="year">{isRtl ? 'هذا العام' : 'This Year'}</option>
                    <option value="custom">{isRtl ? 'تاريخ مخصص' : 'Custom Dates'}</option>
                  </select>
                </div>
              </div>

              {/* Custom Date Range Pickers */}
              {dateRangeFilter === 'custom' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 flex flex-col md:flex-row gap-4 items-end"
                >
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">{isRtl ? 'من تاريخ' : 'Start Date'}</label>
                    <input 
                      type="date" 
                      value={startDate} 
                      onChange={e => setStartDate(e.target.value)} 
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-3 outline-none focus:bg-white focus:border-blue-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">{isRtl ? 'إلى تاريخ' : 'End Date'}</label>
                    <input 
                      type="date" 
                      value={endDate} 
                      onChange={e => setEndDate(e.target.value)} 
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-3 outline-none focus:bg-white focus:border-blue-500"
                    />
                  </div>
                </motion.div>
              )}

              {/* Bento Grid Layout */}
              <div id="dashboard-charts" className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Big Stat Card */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="md:col-span-12 lg:col-span-4 bg-white border border-slate-200 shadow-sm rounded-[32px] p-8 relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700 text-slate-900">
                    <ShieldAlert size={150} />
                  </div>
                  <div className="relative z-10 h-full flex flex-col justify-between">
                    <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-red-50 text-red-600 text-xs font-mono uppercase tracking-widest mb-6 border border-red-100">
                        <Activity size={14} />
                        {isRtl ? 'إجمالي الحالات الموثقة' : 'Total Documented Cases'}
                      </div>
                      <div className="text-7xl font-black text-slate-900 tracking-tighter">
                        {violations.length}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-12">
                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{isRtl ? 'هذا الشهر' : 'This Month'}</div>
                        <div className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                          +12 <span className="text-red-500 text-sm">↑ 15%</span>
                        </div>
                      </div>
                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{isRtl ? 'نتائج التصفية' : 'Filtered Results'}</div>
                        <div className="text-2xl font-bold text-slate-900">
                          {filteredViolations.length}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Trend Chart - Interactive Recharts Visualizer */}
                <div className="md:col-span-12 lg:col-span-8">
                  <IncidentTrendVisualizer violations={violations} isRtl={isRtl} />
                </div>

                {/* Types Breakdown - Progress Bars */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="md:col-span-12 lg:col-span-12 bg-white border border-slate-200 shadow-sm rounded-[32px] p-8"
                >
                  <h3 className="text-xl font-bold text-slate-900 mb-8">{isRtl ? 'تصنيف الانتهاكات' : 'Violations Classification'}</h3>
                  <div className="space-y-6">
                    {typeData.slice(0, 5).map((item, i) => {
                      const percentage = Math.round((item.value / violations.length) * 100) || 0;
                      return (
                        <div key={i} className="space-y-2 cursor-pointer group" onClick={() => setTypeFilter(item.name)}>
                          <div className="flex justify-between text-sm">
                            <span className={cn("font-bold transition-colors", typeFilter === item.name ? "text-blue-600" : "text-slate-700 group-hover:text-blue-500")}>
                              {item.name}
                            </span>
                            <span className="text-slate-500 font-mono">{item.value} ({percentage}%)</span>
                          </div>
                          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              whileInView={{ width: `${percentage}%` }}
                              viewport={{ once: true }}
                              transition={{ duration: 1, delay: i * 0.1 }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: COLORS[i % COLORS.length] }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>

                {/* Geographic Distribution - Interactive Map */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="md:col-span-12 lg:col-span-12 bg-white border border-slate-200 shadow-sm rounded-[32px] p-8"
                >
                  <h3 className="text-xl font-bold text-slate-900 mb-8">{isRtl ? 'التوزيع الجغرافي' : 'Geographic Distribution'}</h3>
                  <div className="w-full">
                    <YemenMap 
                      data={statsByGov} 
                      violationsList={filteredViolations}
                      selectedGovernorate={selectedGovernorate}
                      onSelectGovernorate={setSelectedGovernorate}
                    />
                  </div>
                </motion.div>
              </div>

              {/* Recent Violations Table - Light Mode */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="bg-white border border-slate-200 shadow-sm rounded-[32px] overflow-hidden mt-8"
              >
                <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{isRtl ? 'سجل الرصد المباشر' : 'Live Monitoring Log'}</h3>
                    <p className="text-sm text-slate-500 mt-1">{isRtl ? 'أحدث الحالات الموثقة والمتحقق منها' : 'Latest verified and documented cases'}</p>
                  </div>
                  <div className="flex gap-3 w-full md:w-auto">
                    <button onClick={() => {
                        setSearchTerm('');
                        setTypeFilter('all');
                        setSelectedGovernorate(null);
                        setDateRangeFilter('all');
                      }} 
                      className="p-3 bg-slate-50 border border-slate-200 text-slate-500 rounded-xl hover:text-red-600 hover:border-red-200 transition-all font-bold text-sm px-6"
                    >
                      {isRtl ? 'مسح الفلاتر' : 'Clear Filters'}
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-start">
                    <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-mono tracking-widest border-b border-slate-100">
                      <tr>
                        <th className="px-8 py-5 text-start">{isRtl ? 'الضحية' : 'Victim'}</th>
                        <th className="px-8 py-5 text-start">{isRtl ? 'الموقع' : 'Location'}</th>
                        <th className="px-8 py-5 text-start">{isRtl ? 'التاريخ' : 'Date'}</th>
                        <th className="px-8 py-5 text-start">{isRtl ? 'النوع' : 'Type'}</th>
                        <th className="px-8 py-5 text-start">{isRtl ? 'الحالة' : 'Status'}</th>
                        <th className="px-8 py-5 text-start"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredViolations.slice(0, 10).map((v) => (
                        <tr key={v.id} className="hover:bg-slate-50 transition-colors cursor-pointer group">
                          <td className="px-8 py-6">
                            <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{v.victimName}</div>
                            <div className="text-xs text-slate-500 mt-1">{v.organization || (isRtl ? 'مستقل' : 'Freelance')}</div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-2 text-slate-600 text-sm">
                              <MapIcon size={14} className="text-slate-400" />
                              {v.governorate}
                            </div>
                          </td>
                          <td className="px-8 py-6 text-slate-500 text-sm font-mono">{v.date}</td>
                          <td className="px-8 py-6">
                            <span className="bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1 rounded-lg text-xs font-bold">
                              {v.type}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold bg-emerald-50 px-3 py-1 rounded-lg w-fit border border-emerald-100">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              {v.status}
                            </div>
                          </td>
                          <td className="px-8 py-6 text-end">
                            <button className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-all ml-auto">
                              <ChevronRight size={16} className={isRtl ? 'rotate-180' : ''} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </motion.div>
          )}

          {activeTab === 'map' && (
            <motion.div 
              key="map"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 shadow-sm p-6 md:p-10 rounded-[40px] min-h-[700px] flex flex-col items-center justify-center space-y-12 relative overflow-hidden w-full"
            >
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-5 mix-blend-overlay pointer-events-none" />
              
              <div className="text-center space-y-4 relative z-10 w-full">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 text-xs font-mono uppercase tracking-widest mb-2">
                  <Crosshair size={14} />
                  {isRtl ? 'تحليل مكاني' : 'Spatial Analysis'}
                </div>
                <h3 className="text-3xl md:text-5xl font-black text-slate-900">{isRtl ? 'خريطة الانتهاكات التفاعلية' : 'Interactive Violations Map'}</h3>
                <p className="text-slate-500 max-w-2xl mx-auto text-sm md:text-base">{isRtl ? 'انقر على نقاط الخريطة التفاعلية لعرض الإحصائيات الفورية والانتهاكات الخاصة بكل منطقة يمنية.' : 'Click on any province pin on the interactive map to inspect immediate metrics, recent incidents and type distributions.'}</p>
              </div>
              
              <div className="relative z-10 w-full bg-slate-50 p-4 md:p-8 rounded-[32px] border border-slate-200 min-h-[600px]">
                <LeafletViolationsMap 
                  violations={violations}
                />
              </div>
              
              <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11 gap-3 relative z-10">
                {Object.entries(statsByGov).map(([name, count]: any) => (
                  <div key={name} className="flex flex-col p-4 bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group cursor-pointer" onClick={() => setSelectedGovernorate(name)}>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight mb-1 group-hover:text-blue-600 transition-colors truncate">{name}</span>
                    <span className="text-xl font-black text-slate-900 font-mono">{count}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'report' && (
            <motion.div 
              key="report"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-white border border-slate-200 shadow-sm rounded-[40px] p-8 md:p-12">
                <ViolationForm onSuccess={() => setActiveTab('stats')} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

function MapPin(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
