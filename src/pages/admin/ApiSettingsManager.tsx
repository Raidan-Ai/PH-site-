import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Key, Plus, Trash2, Shield, RefreshCw, Copy, CheckCircle2, AlertTriangle, 
  Terminal, Globe, Cpu, Loader2, ListFilter, Activity, FileCode, Check
} from 'lucide-react';
import { api } from '../../services/api';

interface ApiKeyData {
  id: number;
  name: string;
  token: string;
  role: string;
  scopes: string;
  isActive: number;
  createdAt: string;
  lastUsedAt: string | null;
}

interface ApiLogData {
  id: number;
  api_key_id: number;
  endpoint: string;
  method: string;
  status: number;
  ipAddress: string;
  createdAt: string;
  keyName: string | null;
}

export default function ApiSettingsManager() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  
  const [activeTab, setActiveTab] = useState<'keys' | 'docs' | 'logs'>('keys');
  const [keys, setKeys] = useState<ApiKeyData[]>([]);
  const [logs, setLogs] = useState<ApiLogData[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  
  // New API Key form state
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyRole, setNewKeyRole] = useState('publisher');
  const [newKeyScopes, setNewKeyScopes] = useState({
    articles: true,
    violations: true,
  });

  const [createdToken, setCreatedToken] = useState<string | null>(null);

  useEffect(() => {
    fetchKeys();
    fetchLogs();
  }, []);

  const fetchKeys = async () => {
    try {
      const response = await api.get('/api/admin/api-keys');
      setKeys(response.data || []);
    } catch (error) {
      console.error('Error fetching API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await api.get('/api/admin/api-logs');
      setLogs(response.data || []);
    } catch (error) {
      console.error('Error fetching API logs:', error);
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    setCreating(true);
    setCreatedToken(null);
    try {
      const scopesString = Object.entries(newKeyScopes)
        .filter(([_, enabled]) => enabled)
        .map(([name]) => name)
        .join(',');

      const response = await api.post('/api/admin/api-keys', {
        name: newKeyName,
        role: newKeyRole,
        scopes: scopesString
      });

      if (response.data && response.data.token) {
        setCreatedToken(response.data.token);
        setNewKeyName('');
        fetchKeys();
      }
    } catch (error) {
      console.error('Error creating API key:', error);
      alert(isRtl ? 'حدث خطأ أثناء إنشاء مفتاح الـ API' : 'Error creating API key');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteKey = async (id: number) => {
    const confirmMsg = isRtl 
      ? 'هل أنت متأكد من حذف وإبطال مفتاح الـ API هذا نهائياً؟ جميع الأنظمة المتصلة به ستفقد القدرة على الوصول.' 
      : 'Are you sure you want to revoke and delete this API key? Connected applications will lose access immediately.';
    
    if (!window.confirm(confirmMsg)) return;

    try {
      await api.delete(`/api/admin/api-keys/${id}`);
      setKeys(keys.filter(k => k.id !== id));
      fetchLogs(); // Refresh logs to reflect revocation
    } catch (error) {
      console.error('Error deleting API key:', error);
    }
  };

  const handleToggleKey = async (id: number) => {
    try {
      const response = await api.put(`/api/admin/api-keys/${id}/toggle`);
      setKeys(keys.map(k => k.id === id ? { ...k, isActive: response.data.isActive } : k));
    } catch (error) {
      console.error('Error toggling API key:', error);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(text);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const hostUrl = window.location.origin;

  return (
    <div className="space-y-8 pb-24 text-start" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Cpu className="text-blue-600" size={28} />
            {isRtl ? 'إدارة واجهات النشر والـ API' : 'API Publishing & Keys'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {isRtl 
              ? 'توليد مفاتيح برمجية، مراقبة طلبات الاتصال الخارجية، وقراءة دليل التكامل البرمجي للنشر التلقائي.' 
              : 'Generate secure tokens, monitor incoming publishing requests, and read integration guides.'}
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => { fetchKeys(); fetchLogs(); }}
            className="p-3 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 transition-all active:scale-95 flex items-center gap-2 font-bold text-xs"
          >
            <RefreshCw size={16} />
            {isRtl ? 'تحديث البيانات' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('keys')}
          className={`pb-4 px-2 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'keys' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Key size={16} />
          {isRtl ? 'مفاتيح الوصول (Tokens)' : 'Access Keys'}
        </button>
        <button
          onClick={() => setActiveTab('docs')}
          className={`pb-4 px-2 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'docs' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCode size={16} />
          {isRtl ? 'دليل التكامل البرمجي (Docs)' : 'API Documentation'}
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-4 px-2 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'logs' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity size={16} />
          {isRtl ? 'سجل العمليات والطلبات (Logs)' : 'Activity Logs'}
        </button>
      </div>

      {/* Keys Tab */}
      {activeTab === 'keys' && (
        <div className="space-y-8">
          {/* Create Key Card */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Plus className="text-blue-600" size={20} />
              {isRtl ? 'توليد مفتاح وصول جديد للناشر الذكي' : 'Generate New API Access Token'}
            </h3>

            <form onSubmit={handleCreateKey} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    {isRtl ? 'اسم التطبيق / الجهة المتصلة' : 'Application / Client Name'}
                  </label>
                  <input 
                    type="text" 
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder={isRtl ? 'مثال: نظام رصد انتهاكات جامعة تعز' : 'e.g. External News Broadcaster'}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none text-xs font-bold shadow-inner"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    {isRtl ? 'الصلاحية البرمجية' : 'Key Role'}
                  </label>
                  <select
                    value={newKeyRole}
                    onChange={(e) => setNewKeyRole(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none text-xs font-bold"
                  >
                    <option value="publisher">{isRtl ? 'ناشر محتوى (قراءة وكتابة)' : 'Content Publisher (Read & Write)'}</option>
                    <option value="readonly">{isRtl ? 'قراءة فقط (Read-only)' : 'Read-only Access'}</option>
                  </select>
                </div>
              </div>

              {/* Scopes Selector */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  {isRtl ? 'نطاقات الوصول المتاحة (Scopes)' : 'Allowed Scopes (Permissions)'}
                </label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors">
                    <input 
                      type="checkbox"
                      checked={newKeyScopes.articles}
                      onChange={(e) => setNewKeyScopes({ ...newKeyScopes, articles: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span>{isRtl ? 'المقالات والأخبار (articles)' : 'Articles & News'}</span>
                  </label>
                  <label className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors">
                    <input 
                      type="checkbox"
                      checked={newKeyScopes.violations}
                      onChange={(e) => setNewKeyScopes({ ...newKeyScopes, violations: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span>{isRtl ? 'الانتهاكات والبلاغات (violations)' : 'Violations & Reports'}</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-start">
                <button
                  type="submit"
                  disabled={creating || !newKeyName.trim()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 text-xs flex items-center gap-2 shadow-md hover:shadow-blue-200"
                >
                  {creating ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                  {isRtl ? 'توليد المفتاح البرمجي' : 'Generate API Key'}
                </button>
              </div>
            </form>

            {/* Generated Token Alert Box */}
            {createdToken && (
              <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl space-y-3 animation-fade-in">
                <div className="flex items-center gap-2 text-emerald-800">
                  <CheckCircle2 size={20} />
                  <p className="text-xs font-black">{isRtl ? 'تم إنشاء المفتاح بنجاح! انسخه الآن قبل إغلاق الصفحة:' : 'API Token generated successfully! Copy it now as you won\'t see it again:'}</p>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 bg-white border border-emerald-100 font-mono text-xs p-3.5 rounded-xl break-all select-all flex items-center text-slate-800">
                    {createdToken}
                  </div>
                  <button
                    onClick={() => handleCopy(createdToken)}
                    className="px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors"
                  >
                    {copiedToken === createdToken ? <Check size={16} /> : <Copy size={16} />}
                    {isRtl ? 'نسخ' : 'Copy'}
                  </button>
                </div>
                <p className="text-[10px] text-emerald-700 font-bold leading-relaxed">
                  ⚠️ {isRtl 
                    ? 'الأمان: يتم حفظ المفاتيح مشفرة ومحجبة ولا يمكن قراءتها لاحقاً. يرجى تخزينها بأمان.' 
                    : 'Security: Token is hashed and can never be retrieved again. Store it safely in your env file.'}
                </p>
              </div>
            )}
          </div>

          {/* Tokens List Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Key className="text-blue-600" size={18} />
                {isRtl ? 'مفاتيح الوصول البرمجية النشطة' : 'Active API Tokens'}
              </h3>
              <span className="text-[10px] bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-black">
                {keys.length} {isRtl ? 'مفاتيح' : 'Keys'}
              </span>
            </div>

            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
            ) : keys.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-start">
                  <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4">{isRtl ? 'اسم التطبيق / العميل' : 'Client Name'}</th>
                      <th className="px-6 py-4">{isRtl ? 'صلاحية الوصول' : 'Role'}</th>
                      <th className="px-6 py-4">{isRtl ? 'النطاقات (Scopes)' : 'Scopes'}</th>
                      <th className="px-6 py-4">{isRtl ? 'آخر استخدام' : 'Last Used'}</th>
                      <th className="px-6 py-4">{isRtl ? 'تاريخ الإنشاء' : 'Created At'}</th>
                      <th className="px-6 py-4 text-center">{isRtl ? 'الحالة' : 'Status'}</th>
                      <th className="px-6 py-4 text-center">{isRtl ? 'إجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                    {keys.map((key) => (
                      <tr key={key.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-bold text-slate-900">{key.name}</span>
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">token: ph_****{key.token.slice(-6)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            key.role === 'readonly' ? 'bg-slate-100 text-slate-600' : 'bg-blue-50 text-blue-700'
                          }`}>
                            {key.role === 'readonly' ? (isRtl ? 'قراءة فقط' : 'Read-only') : (isRtl ? 'ناشر' : 'Publisher')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-1 flex-wrap">
                            {key.scopes.split(',').map(scope => (
                              <span key={scope} className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono">
                                {scope}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-500 text-[11px]">
                          {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString(isRtl ? 'ar-YE' : 'en-US') : (isRtl ? 'لم يستعمل بعد' : 'Never Used')}
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-400 text-[11px]">
                          {new Date(key.createdAt).toLocaleDateString(isRtl ? 'ar-YE' : 'en-US')}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleToggleKey(key.id)}
                            className={`w-12 h-6 rounded-full transition-all relative inline-block ${key.isActive === 1 ? 'bg-blue-600' : 'bg-slate-200'}`}
                          >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                              isRtl 
                                ? (key.isActive === 1 ? 'left-1' : 'right-1') 
                                : (key.isActive === 1 ? 'right-1' : 'left-1')
                            }`} />
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            <button
                              onClick={() => handleDeleteKey(key.id)}
                              className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                              title={isRtl ? 'سحب المفتاح وحذفه' : 'Revoke Key'}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-16 text-center border-t border-slate-100">
                <Key size={40} className="mx-auto text-slate-300 mb-4 animate-pulse" />
                <h4 className="font-bold text-slate-900">{isRtl ? 'لا توجد مفاتيح وصول برمجية' : 'No API Keys Generated'}</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                  {isRtl 
                    ? 'لم يتم إنشاء أي مفاتيح برمجية بعد. قم بتوليد مفتاح وصول بالنموذج أعلاه للبدء بربط المنصة والأنظمة الخارجية.' 
                    : 'Create your first API Token using the generator above to establish external integration routes.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* API Documentation Tab */}
      {activeTab === 'docs' && (
        <div className="space-y-8 max-w-4xl">
          {/* Introduction Card */}
          <div className="bg-slate-900 text-slate-100 p-6 md:p-8 rounded-[32px] space-y-4 shadow-xl border border-slate-800">
            <div className="flex items-center gap-3">
              <Terminal className="text-blue-400" size={24} />
              <h3 className="text-lg font-black">{isRtl ? 'واجهة برمجة التطبيقات الموحدة لبيت الصحافة' : 'PressHouse REST API Documentation'}</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
              {isRtl 
                ? 'توفر منصة بيت الصحافة واجهات API موحدة وموثقة متوافقة مع S3 و SQLite/Postgres. تسمح هذه الواجهات بنشر الأخبار ورفع الانتهاكات الصحفية والحقوقية تلقائياً من الأنظمة الخارجية والشركاء.' 
                : 'Exposes clean RESTful publishing nodes that authenticate via Bearer Token. All endpoints receive and return standard application/json payloads.'}
            </p>
            <div className="pt-2 flex flex-col sm:flex-row gap-4 font-mono text-[10px]">
              <div>
                <span className="text-slate-400 font-bold">API Base URL: </span>
                <span className="text-blue-400 font-bold bg-slate-950 px-2 py-1 rounded">{hostUrl}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold">Authentication: </span>
                <span className="text-teal-400 font-bold bg-slate-950 px-2 py-1 rounded">Bearer Token / x-api-key</span>
              </div>
            </div>
          </div>

          {/* Endpoints */}
          <div className="space-y-6">
            <h4 className="text-sm font-black text-slate-900 border-b pb-2 uppercase tracking-wider">{isRtl ? 'واجهات النشر المتاحة' : 'Available Publishing Nodes'}</h4>

            {/* Post Article Doc */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="bg-emerald-600 text-white font-bold text-[10px] px-2.5 py-1 rounded font-mono uppercase">POST</span>
                  <span className="font-mono text-xs font-black text-slate-800">/api/v1/publish/article</span>
                </div>
                <span className="text-xs text-slate-500 font-bold">{isRtl ? 'نشر خبر أو مقال صحفي' : 'Publish an Article / News'}</span>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <h5 className="text-[11px] font-black uppercase text-slate-400 tracking-wider mb-2">{isRtl ? 'أعمدة ومحتوى الطلب (Payload Structure)' : 'Request Payload'}</h5>
                  <pre className="bg-slate-900 text-slate-300 p-4 rounded-xl font-mono text-[11px] overflow-x-auto whitespace-pre leading-relaxed">
{`{
  "title": {
    "ar": "عنوان الخبر باللغة العربية",
    "en": "Article Title in English (Optional)"
  },
  "content": {
    "ar": "المحتوى النصي المفصل أو كود Markdown",
    "en": "Detailed article contents in English (Optional)"
  },
  "category": "news", // news | report | press_release
  "language": "ar", // ar | en | both
  "mainImage": "https://example.com/cover-image.jpg", // Optional
  "status": "published" // published | draft
}`}
                  </pre>
                </div>

                <div>
                  <h5 className="text-[11px] font-black uppercase text-slate-400 tracking-wider mb-2">{isRtl ? 'مثال استدعاء برمجى (CURL Example)' : 'cURL Integration Example'}</h5>
                  <pre className="bg-slate-950 text-emerald-400 p-4 rounded-xl font-mono text-[11px] overflow-x-auto whitespace-pre leading-relaxed">
{`curl -X POST "${hostUrl}/api/v1/publish/article" \\
  -H "Authorization: Bearer ph_YOUR_TOKEN_HERE" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": { "ar": "خبر عاجل من واجهة النشر" },
    "content": { "ar": "محتوى برمجى كامل تم نشره تلقائياً." },
    "category": "news",
    "status": "published"
  }'`}
                  </pre>
                </div>
              </div>
            </div>

            {/* Post Violation Doc */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="bg-emerald-600 text-white font-bold text-[10px] px-2.5 py-1 rounded font-mono uppercase">POST</span>
                  <span className="font-mono text-xs font-black text-slate-800">/api/v1/publish/violation</span>
                </div>
                <span className="text-xs text-slate-500 font-bold">{isRtl ? 'تسجيل بلاغ انتهاك في المرصد' : 'Report a Violation to Observatory'}</span>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <h5 className="text-[11px] font-black uppercase text-slate-400 tracking-wider mb-2">{isRtl ? 'أعمدة ومحتوى الطلب (Payload Structure)' : 'Request Payload'}</h5>
                  <pre className="bg-slate-900 text-slate-300 p-4 rounded-xl font-mono text-[11px] overflow-x-auto whitespace-pre leading-relaxed">
{`{
  "victimName": "اسم الضحية أو الصحفي",
  "victimInstitution": "المؤسسة الصحفية التي يعمل بها الضحية",
  "governorate": "تعز", // المحافظة
  "district": "المظفر", // المديرية
  "perpetrator": "الجهة المنتهكة",
  "type": "الاعتداء بالضرب والتهديد بالقتل", // نوع الانتهاك
  "description": "تفصيل الواقعة بالكامل وظروف الانتهاك",
  "evidenceLinks": [
    "https://example.com/evidence-document-pdf-or-image"
  ],
  "latitude": 13.5783, // الإحداثيات الجغرافية (اختياري)
  "longitude": 44.0133,
  "status": "pending" // pending | approved | rejected
}`}
                  </pre>
                </div>

                <div>
                  <h5 className="text-[11px] font-black uppercase text-slate-400 tracking-wider mb-2">{isRtl ? 'مثال استدعاء برمجى (CURL Example)' : 'cURL Integration Example'}</h5>
                  <pre className="bg-slate-950 text-emerald-400 p-4 rounded-xl font-mono text-[11px] overflow-x-auto whitespace-pre leading-relaxed">
{`curl -X POST "${hostUrl}/api/v1/publish/violation" \\
  -H "x-api-key: ph_YOUR_TOKEN_HERE" \\
  -H "Content-Type: application/json" \\
  -d '{
    "victimName": "صحفي ميداني",
    "governorate": "تعز",
    "type": "مصادرة الكاميرا ومعدات التصوير",
    "description": "تمت المصادرة أثناء تغطية الفعاليات الحقوقية."
  }'`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-slate-50 border border-slate-200/80 p-5 rounded-2xl">
            <div className="flex gap-3 items-center">
              <Activity className="text-blue-600" size={20} />
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">{isRtl ? 'سجل الاتصال بالـ API الحى' : 'Live Request Stream'}</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">{isRtl ? 'يعرض آخر 100 طلب اتصال تم تلقيه بواسطة واجهة النشر.' : 'Live request log capture showing status codes and caller details.'}</p>
              </div>
            </div>
            <button 
              onClick={fetchLogs}
              className="p-2 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 transition-colors"
              title={isRtl ? 'تحديث السجلات' : 'Refresh logs'}
            >
              <RefreshCw size={14} className="animate-hover" />
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {logs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-start">
                  <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4">{isRtl ? 'المفتاح المستخدم' : 'API Key Caller'}</th>
                      <th className="px-6 py-4">{isRtl ? 'الرابط المطلب' : 'Endpoint Requested'}</th>
                      <th className="px-6 py-4 text-center">{isRtl ? 'طريقة الاستدعاء' : 'Method'}</th>
                      <th className="px-6 py-4 text-center">{isRtl ? 'رمز الحالة (Status)' : 'Status Code'}</th>
                      <th className="px-6 py-4">{isRtl ? 'عنوان الـ IP' : 'IP Address'}</th>
                      <th className="px-6 py-4">{isRtl ? 'تاريخ الاستدعاء' : 'Requested At'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700 font-mono">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-sans font-bold text-slate-900">
                          {log.keyName || (isRtl ? 'مفتاح مجهول أو محذوف' : 'Deleted Key')}
                        </td>
                        <td className="px-6 py-4 text-slate-600 text-[11px]">
                          {log.endpoint}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[10px] font-black uppercase">
                            {log.method}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            log.status >= 200 && log.status < 300 
                              ? 'bg-emerald-50 text-emerald-700' 
                              : 'bg-rose-50 text-rose-700'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-[11px]">
                          {log.ipAddress || '127.0.0.1'}
                        </td>
                        <td className="px-6 py-4 text-slate-400 text-[11px] font-sans">
                          {new Date(log.createdAt).toLocaleString(isRtl ? 'ar-YE' : 'en-US')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-16 text-center">
                <Activity size={40} className="mx-auto text-slate-300 mb-4 animate-pulse" />
                <h4 className="font-bold text-slate-900">{isRtl ? 'لا توجد طلبات اتصال بعد' : 'No Request Logs Yet'}</h4>
                <p className="text-xs text-slate-500 mt-1">
                  {isRtl 
                    ? 'ستظهر هنا السجلات فورا بمجرد أن تبدأ التطبيقات والمنصات الخارجية بالتواصل مع الـ API الخاص ببيت الصحافة.' 
                    : 'Incoming client connections will be logged in real-time here.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
