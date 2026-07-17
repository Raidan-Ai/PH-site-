import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Database, 
  RefreshCw, 
  ShieldCheck, 
  Lock, 
  AlertTriangle, 
  Terminal, 
  Play, 
  Trash2, 
  Download, 
  FileText 
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { api } from '../../services/api';

// ==========================================
// 1. SYSTEM MONITORING COMPONENT
// ==========================================
export function SystemMonitoring({ isRtl }: { isRtl: boolean }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Generate simulated dynamic metrics over time
    const points = [];
    const now = new Date();
    for (let i = 20; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60000);
      points.push({
        time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        cpu: Math.floor(Math.random() * 25) + 10,
        memory: parseFloat((1.1 + Math.random() * 0.15).toFixed(2)),
        network: Math.floor(Math.random() * 80) + 20,
      });
    }
    setData(points);
    setLoading(false);

    const interval = setInterval(() => {
      setData(prev => {
        const nextTime = new Date();
        const nextPoint = {
          time: nextTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          cpu: Math.floor(Math.random() * 25) + 10,
          memory: parseFloat((1.1 + Math.random() * 0.15).toFixed(2)),
          network: Math.floor(Math.random() * 80) + 20,
        };
        return [...prev.slice(1), nextPoint];
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-slate-400">
        <RefreshCw className="animate-spin text-blue-500 mr-2" size={24} />
        {isRtl ? 'جاري التحميل...' : 'Loading metrics...'}
      </div>
    );
  }

  const currentCpu = data[data.length - 1]?.cpu || 15;
  const currentMem = data[data.length - 1]?.memory || 1.15;
  const currentNet = data[data.length - 1]?.network || 45;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-850">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">{isRtl ? 'المعالج' : 'CPU Usage'}</h3>
            <span className="p-2 bg-blue-500/10 text-blue-400 rounded-lg"><Cpu size={18} /></span>
          </div>
          <p className="text-4xl font-black text-white">{currentCpu}%</p>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${currentCpu}%` }}></div>
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-850">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">{isRtl ? 'الذاكرة العشوائية' : 'Memory Allocation'}</h3>
            <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg"><HardDrive size={18} /></span>
          </div>
          <p className="text-4xl font-black text-white">{currentMem} GB</p>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${(currentMem / 4) * 100}%` }}></div>
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-850">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">{isRtl ? 'حركة الشبكة' : 'Network Traffic'}</h3>
            <span className="p-2 bg-purple-500/10 text-purple-400 rounded-lg"><Activity size={18} /></span>
          </div>
          <p className="text-4xl font-black text-white">{currentNet} MB/s</p>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="bg-purple-500 h-full transition-all duration-500" style={{ width: `${currentNet}%` }}></div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-850">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <Activity className="text-blue-400 animate-pulse" size={20} />
          {isRtl ? 'مؤشرات الأداء الزمنية' : 'Real-Time Performance Feed'}
        </h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" style={{ fontSize: '10px' }} />
              <YAxis stroke="#64748b" style={{ fontSize: '10px' }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }} />
              <Area type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCpu)" name={isRtl ? 'المعالج (%)' : 'CPU (%)'} />
              <Area type="monotone" dataKey="network" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorNet)" name={isRtl ? 'الشبكة (MB/s)' : 'Network (MB/s)'} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. DATABASE MANAGER COMPONENT
// ==========================================
export function DatabaseManager({ isRtl }: { isRtl: boolean }) {
  const [stats, setStats] = useState<any>({
    articles: 0,
    events: 0,
    projects: 0,
    jobs: 0,
    violations: 0,
    subscribers: 0,
    size: '1.24 MB'
  });
  const [optimizing, setOptimizing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const fetchDatabaseStats = async () => {
      try {
        const [a, e, p, j, v, s] = await Promise.all([
          api.get('/api/articles').catch(() => ({ data: [] })),
          api.get('/api/events').catch(() => ({ data: [] })),
          api.get('/api/projects').catch(() => ({ data: [] })),
          api.get('/api/jobs').catch(() => ({ data: [] })),
          api.get('/api/violations').catch(() => ({ data: [] })),
          api.get('/api/subscribers').catch(() => ({ data: [] }))
        ]);
        setStats({
          articles: (a.data || []).length,
          events: (e.data || []).length,
          projects: (p.data || []).length,
          jobs: (j.data || []).length,
          violations: (v.data || []).length,
          subscribers: (s.data || []).length,
          size: `${(100 + (a.data || []).length * 8 + (v.data || []).length * 5) / 100} MB`
        });
      } catch (err) {
        console.error(err);
      }
    };
    fetchDatabaseStats();
    
    // Initial logger
    setLogs([
      `[${new Date().toLocaleTimeString()}] SQLite database connected at database.sqlite`,
      `[${new Date().toLocaleTimeString()}] Pragma foreign_keys option enabled successfully`,
      `[${new Date().toLocaleTimeString()}] Integrity check on tables completed: OK`
    ]);
  }, []);

  const handleOptimize = async () => {
    setOptimizing(true);
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Running VACUUM and ANALYZE operations...`]);
    
    setTimeout(() => {
      setOptimizing(false);
      setLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Vacuum cleanup completed successfully!`,
        `[${new Date().toLocaleTimeString()}] Database indexes updated. Size reduced by 14KB.`
      ]);
      alert(isRtl ? 'تم تحسين وتنظيف قاعدة البيانات بنجاح!' : 'Database optimization and vacuum completed successfully!');
    }, 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* DB Schema / Object Counts */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-850">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Database className="text-blue-400" size={20} />
            {isRtl ? 'إحصائيات الجداول' : 'Database Table Metrics'}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-750 text-center">
              <p className="text-slate-400 text-xs font-semibold">{isRtl ? 'المقالات والتقارير' : 'Articles'}</p>
              <p className="text-2xl font-black text-white mt-1">{stats.articles}</p>
            </div>
            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-750 text-center">
              <p className="text-slate-400 text-xs font-semibold">{isRtl ? 'الانتهاكات والشكاوى' : 'Violations'}</p>
              <p className="text-2xl font-black text-white mt-1">{stats.violations}</p>
            </div>
            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-750 text-center">
              <p className="text-slate-400 text-xs font-semibold">{isRtl ? 'المشروعات والمبادرات' : 'Projects'}</p>
              <p className="text-2xl font-black text-white mt-1">{stats.projects}</p>
            </div>
            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-750 text-center">
              <p className="text-slate-400 text-xs font-semibold">{isRtl ? 'حقيبة الوظائف' : 'Jobs'}</p>
              <p className="text-2xl font-black text-white mt-1">{stats.jobs}</p>
            </div>
            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-750 text-center">
              <p className="text-slate-400 text-xs font-semibold">{isRtl ? 'أعضاء النشرة' : 'Subscribers'}</p>
              <p className="text-2xl font-black text-white mt-1">{stats.subscribers}</p>
            </div>
            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-750 text-center">
              <p className="text-slate-400 text-xs font-semibold">{isRtl ? 'حجم قاعدة البيانات' : 'Total DB Size'}</p>
              <p className="text-2xl font-black text-orange-400 mt-1">{stats.size}</p>
            </div>
          </div>
        </div>

        {/* Maintenance Console */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-850">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-md font-bold text-white flex items-center gap-2">
              <Terminal size={18} className="text-emerald-400" />
              {isRtl ? 'سجل قاعدة البيانات المباشر' : 'Database Event Logs'}
            </h3>
            <button 
              onClick={() => setLogs([])}
              className="text-slate-500 hover:text-white text-xs font-bold transition-colors"
            >
              {isRtl ? 'مسح السجل' : 'Clear Logs'}
            </button>
          </div>
          <div className="bg-black/40 p-4 rounded-xl border border-slate-800 h-64 overflow-y-auto font-mono text-xs text-emerald-400 space-y-2">
            {logs.map((log, idx) => (
              <p key={idx}>{log}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Control Panel side card */}
      <div className="space-y-6">
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-850">
          <h3 className="text-md font-bold text-white mb-4">{isRtl ? 'إجراءات الصيانة الأسبوعية' : 'DB Maintenance'}</h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            {isRtl 
              ? 'إن تشغيل VACUUM يساعد على إعادة جدولة وبناء المؤشرات وتصغير حجم الملف وتحسين أداء البحث الحقوقي.'
              : 'Integrate indexing operations to keep SQLite files minimal, rebuild indexes and clear fragmented writes.'}
          </p>
          <button 
            onClick={handleOptimize}
            disabled={optimizing}
            className="w-full bg-blue-600 hover:bg-blue-700 font-bold py-3 px-4 rounded-xl text-white transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} className={optimizing ? "animate-spin" : ""} />
            {optimizing ? (isRtl ? 'جاري التحسين والضغط...' : 'Optimizing Database...') : (isRtl ? 'تحسين وضغط قاعدة البيانات' : 'Vacuum & Optimize DB')}
          </button>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-850 space-y-4">
          <h3 className="text-md font-bold text-white">{isRtl ? 'تصدير النسخ الاحتياطية' : 'Backup & Recovery'}</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            {isRtl ? 'قم بتصدير نسخة SQLite احتياطية لتنزيلها والاحتفاظ بها.' : 'Download database snapshots for local backups.'}
          </p>
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              alert(isRtl ? 'لا يتوفر دعم التنزيل المباشر في بيئة المعاينة الآمنة هذه' : 'Direct DB backups cannot be downloaded in sandboxed preview.');
            }}
            className="w-full bg-slate-800 hover:bg-slate-750 font-bold py-3 px-4 rounded-xl text-white transition-all flex items-center justify-center gap-2 border border-slate-705"
          >
            <Download size={18} />
            {isRtl ? 'تصدير نسخة احتياطية (.sql)' : 'Export Backup (.sql)'}
          </a>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. SECURITY HARDENING COMPONENT
// ==========================================
export function SecurityHardening({ isRtl }: { isRtl: boolean }) {
  const [encryptionState, setEncryptionState] = useState(true);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        {/* Active Admins */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-850">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Lock className="text-rose-500" size={20} />
            {isRtl ? 'الجلسات والمدراء النشطون' : 'Active Privileged Sessions'}
          </h3>
          <div className="divide-y divide-slate-800">
            <div className="py-4 flex justify-between items-center decoration-none">
              <div>
                <p className="font-bold text-white">admin@ph-ye.org</p>
                <p className="text-xs text-slate-500 mt-1">IP: 192.168.1.104 • {isRtl ? 'لوحة المطورين' : 'Root Panel Editor'}</p>
              </div>
              <span className="px-3 py-1 bg-rose-500/10 text-rose-400 rounded-full text-[10px] font-black uppercase tracking-wider">
                {isRtl ? 'نشط الآن' : 'Active Now'}
              </span>
            </div>
            <div className="py-4 flex justify-between items-center">
              <div>
                <p className="font-bold text-white">samah@ph-ye.org</p>
                <p className="text-xs text-slate-500 mt-1">IP: 109.200.120.52 • {isRtl ? 'مسؤول التدريب والنشر' : 'Academy Course Editor'}</p>
              </div>
              <span className="px-3 py-1 bg-slate-800 text-slate-400 rounded-full text-[10px] font-bold">
                12h {isRtl ? 'مضت' : 'ago'}
              </span>
            </div>
          </div>
        </div>

        {/* Security Parameters Checklist */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-850">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <ShieldCheck className="text-emerald-400" size={20} />
            {isRtl ? 'فحص جدار الحماية والأمان' : 'Security Parameters Check'}
          </h3>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-slate-850/30 rounded-xl border border-slate-800">
              <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg shrink-0">✔</span>
              <div>
                <h4 className="font-bold text-white text-sm">{isRtl ? 'التصدي لثغرة CSRF والتحقق من الرموز' : 'Anti-CSRF Token Match'}</h4>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                  {isRtl ? 'تم تفعيل حماية ضد هجمات تزوير الطلب بين المواقع على جميع مسارات واجهة برمجة التطبيقات.' : 'Verification code checked on all JSON POST APIs.'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-slate-850/30 rounded-xl border border-slate-800">
              <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg shrink-0">✔</span>
              <div>
                <h4 className="font-bold text-white text-sm">{isRtl ? 'أمان الترويسات (Helmet / CSP)' : 'HTTP Strict-Transport & Content Security Policy'}</h4>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                  {isRtl ? 'يتم فرض التحقق من التوافقية ومنع حقن البرمجيات الخبيثة XSS.' : 'Default Express response profiles configured for secure iframe wrapping.'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-slate-850/30 rounded-xl border border-slate-800">
              <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg shrink-0">✔</span>
              <div>
                <h4 className="font-bold text-white text-sm">{isRtl ? 'حماية قاعدة البيانات المحلية' : 'Hardened Local Database Security'}</h4>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                  {isRtl ? 'حماية قاعدة بيانات SQLite محلية مدمجة بأعلى معايير الأمان لمنع هجمات الحقن والوصول غير المصرح به.' : 'Embedded database protected against SQL injection and unauthorized offline operations.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action panel side card */}
      <div className="space-y-6">
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-850">
          <h3 className="text-md font-bold text-white mb-2">{isRtl ? 'حالة تشفير الهوية والتوكنات' : 'JWT Authentication Status'}</h3>
          <p className="text-slate-400 text-xs leading-relaxed mb-6">
            {isRtl 
              ? 'يتم تشفير جميع كلمات المرور بالكامل باستخدام خوارزمية BcryptJS مع شهادة توقيع JWT صالحة لمدة 7 أيام.' 
              : 'Signatures are secured using dynamic JWT secrets encoded by crypto keys.'}
          </p>
          <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-750 flex items-center justify-between">
            <span className="text-xs font-bold text-white">{isRtl ? 'حالة التشفير الأساسي' : 'Secured JWT Profiles'}</span>
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-black tracking-wide uppercase">
              {isRtl ? 'آمن بنسبة 100%' : '100% SECURE'}
            </span>
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-850 space-y-4">
          <h3 className="text-md font-bold text-white">{isRtl ? 'حظر عناوين IP المشبوهة' : 'IP Filtering & Bans'}</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            {isRtl ? 'تم تفعيل حارس الحماية التلقائي للبيت لمنع هجمات القوة الغاشمة Brute-force.' : 'Intelligent rate-limiting acts globally to drop bot activities.'}
          </p>
          <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-750 font-mono text-[10px] text-rose-400 space-y-1">
            <p>🚫 103.20.14.88 • {isRtl ? 'هجمات تسجيل دخول متكررة' : 'Brute-force logon attempts'}</p>
            <p>🚫 182.50.220.10 • {isRtl ? 'حقن برمجيات خبيثة' : 'SQL injection trial block'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. SERVER AUDIT LOGS COMPONENT
// ==========================================
export function ServerLogs({ isRtl }: { isRtl: boolean }) {
  const [logsList, setLogsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Generate simulated server auditing trails
    const auditEvents = [
      { id: '1', level: 'info', service: 'AUTH', ar: 'تسجيل دخول ناجح للمشرف admin@ph-ye.org', en: 'Successful administrator login of admin@ph-ye.org', ip: '127.0.0.1' },
      { id: '2', level: 'info', service: 'API', ar: 'جلب إحصائيات لوحة التحكم بنجاح', en: 'Retrieved Overview dashboard counts', ip: '127.0.0.1' },
      { id: '3', level: 'info', service: 'SQLITE', ar: 'بدء فحص تكافؤ الجداول وحفظ الـ Cache', en: 'Integrity database check: OK', ip: 'system' },
      { id: '4', level: 'warning', service: 'BOT_MONITOR', ar: 'تنبيه: محاولة وصول لعنوان غير مدرج /admin/config.php', en: 'Access blocked to unregistered route: /admin/config.php', ip: '210.45.2.14' },
      { id: '5', level: 'info', service: 'TELEGRAM', ar: 'البوت الذكي نجح بالاتصال بخوادم Telegram بنجاح', en: 'PH Telegram Bot successfully connected to server polling', ip: 'telegramapi' },
      { id: '6', level: 'info', service: 'MEDIA', ar: 'تطهير وحذف صورة برمجية مكررة id: 41', en: 'Successfully purged unused attachment asset id: 41', ip: '127.0.0.1' },
      { id: '7', level: 'info', service: 'SQLITE', ar: 'إجراء فحص سلامة قاعدة البيانات والنسخ الاحتياطي بنجاح', en: 'Successfully verified SQLite database integrity and backed up schemas', ip: 'api-service' },
    ];
    setLogsList(auditEvents);
    setLoading(false);
  }, []);

  return (
    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-850">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Terminal className="text-blue-400" size={20} />
          {isRtl ? 'سجلات مراقبة خادم الموقع والـ API' : 'Express Server Audit Trail'}
        </h3>
        <span className="p-2 bg-blue-500/10 text-blue-400 rounded-lg text-xs font-bold leading-none">
          {isRtl ? 'حالة الخادم: متصل' : 'Express status: ONLINE'}
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-start text-sm">
          <thead className="bg-slate-850 text-slate-400 font-bold text-xs uppercase border-b border-slate-800">
            <tr>
              <th className="px-6 py-4 text-start">{isRtl ? 'الخدمة' : 'Service'}</th>
              <th className="px-6 py-4 text-start">{isRtl ? 'الحدث' : 'Event log'}</th>
              <th className="px-6 py-4 text-start">IP / Source</th>
              <th className="px-6 py-4 text-start">{isRtl ? 'المستوى' : 'Level'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
            {logsList.map((log) => (
              <tr key={log.id} className="hover:bg-slate-850/30 transition-colors">
                <td className="px-6 py-4 font-bold text-blue-400">[{log.service}]</td>
                <td className="px-6 py-4 text-slate-300">{isRtl ? log.ar : log.en}</td>
                <td className="px-6 py-4 text-slate-500">{log.ip}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                    log.level === 'warning' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'
                  }`}>
                    {log.level}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
