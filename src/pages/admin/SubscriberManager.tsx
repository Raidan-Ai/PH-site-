import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Trash2, Loader2, Download, Search } from 'lucide-react';
import { api } from '../../services/api';

export const SubscriberManager: React.FC = () => {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchSubscribers = async () => {
      try {
        const response = await api.get('/api/subscribers');
        setSubscribers(response.data);
      } catch (error) {
        console.error("Error fetching subscribers:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSubscribers();
  }, []);

  const deleteSubscriber = async (id: number) => {
    if (window.confirm(isRtl ? 'هل أنت متأكد من حذف هذا المشترك؟' : 'Are you sure you want to delete this subscriber?')) {
      try {
        await api.delete(`/api/subscribers/${id}`);
        setSubscribers(subscribers.filter(s => s.id !== id));
      } catch (error) {
        console.error("Error deleting subscriber:", error);
      }
    }
  };

  const exportCSV = () => {
    const headers = ['Email', 'Source', 'Date'];
    const rows = subscribers.map(s => [s.email, s.source, s.createdAt]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "subscribers_list.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredSubscribers = subscribers.filter(s => 
    s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.source?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{isRtl ? 'المشتركون في النشرة' : 'Newsletter Subscribers'}</h1>
          <p className="text-slate-500 text-sm mt-1">{isRtl ? 'إدارة قائمة البريد الإلكتروني للمهتمين بأخبار المؤسسة' : 'Manage email list for those interested in organization news'}</p>
        </div>
        <button 
          onClick={exportCSV}
          className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg"
        >
          <Download size={20} />
          {isRtl ? 'تصدير CSV' : 'Export CSV'}
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="relative">
          <input 
            type="text"
            placeholder={isRtl ? 'بحث في القائمة...' : 'Search in list...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
          <Search className="absolute left-3 top-3 text-slate-400" size={18} />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={48} /></div>
      ) : filteredSubscribers.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-start">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b">
              <tr>
                <th className="px-6 py-4">{isRtl ? 'البريد الإلكتروني' : 'Email Address'}</th>
                <th className="px-6 py-4">{isRtl ? 'المصدر' : 'Source'}</th>
                <th className="px-6 py-4">{isRtl ? 'تاريخ الاشتراك' : 'Subscription Date'}</th>
                <th className="px-6 py-4 text-center">{isRtl ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSubscribers.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-blue-500" />
                      {s.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg uppercase">
                      {s.source || 'website'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(s.createdAt).toLocaleDateString(isRtl ? 'ar-YE' : 'en-US')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <button 
                        onClick={() => deleteSubscriber(s.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white p-20 rounded-2xl border-2 border-dashed border-slate-200 text-center text-slate-500">
          <Mail size={48} className="mx-auto mb-4 opacity-20" />
          {isRtl ? 'لا يوجد مشتركين حالياً' : 'No subscribers found'}
        </div>
      )}
    </div>
  );
};
