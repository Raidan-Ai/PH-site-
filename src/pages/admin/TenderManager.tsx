import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2, FileText, Loader2, Search } from 'lucide-react';
import { api } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';

export const TenderManager: React.FC = () => {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const navigate = useNavigate();
  const [tenders, setTenders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchTenders = async () => {
      try {
        const response = await api.get('/api/tenders');
        setTenders(response.data);
      } catch (error) {
        console.error("Error fetching tenders:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTenders();
  }, []);

  const deleteTender = async (id: string) => {
    if (window.confirm(isRtl ? 'هل أنت متأكد من حذف هذه المناقصة؟' : 'Are you sure you want to delete this tender?')) {
      try {
        await api.delete(`/api/tenders/${id}`);
        setTenders(tenders.filter(t => t.id !== id));
      } catch (error) {
        console.error("Error deleting tender:", error);
      }
    }
  };

  const filteredTenders = tenders.filter(t => {
    const title = typeof t.title === 'string' ? JSON.parse(t.title) : t.title;
    return (
      title?.ar?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      title?.en?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{isRtl ? 'إدارة المناقصات' : 'Tender Management'}</h1>
          <p className="text-slate-500 text-sm mt-1">{isRtl ? 'إدارة العطاءات والفرص الاستثمارية' : 'Manage bids and investment opportunities'}</p>
        </div>
        <button 
          onClick={() => navigate('/admin/tenders/new')}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg"
        >
          <Plus size={20} />
          {isRtl ? 'إضافة مناقصة' : 'Add Tender'}
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="relative">
          <input 
            type="text"
            placeholder={isRtl ? 'بحث في المناقصات...' : 'Search tenders...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
          <Search className="absolute left-3 top-3 text-slate-400" size={18} />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={48} /></div>
      ) : filteredTenders.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-start">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b">
              <tr>
                <th className="px-6 py-4">{isRtl ? 'المناقصة' : 'Tender'}</th>
                <th className="px-6 py-4">{isRtl ? 'الموعد النهائي' : 'Deadline'}</th>
                <th className="px-6 py-4">{isRtl ? 'الحالة' : 'Status'}</th>
                <th className="px-6 py-4 text-center">{isRtl ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTenders.map((t) => {
                const title = typeof t.title === 'string' ? JSON.parse(t.title) : t.title;
                return (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {title[isRtl ? 'ar' : 'en']}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {t.deadline ? new Date(t.deadline).toLocaleDateString(isRtl ? 'ar-YE' : 'en-US') : '---'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase",
                        t.status === 'open' ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                      )}>
                        {t.status === 'open' ? (isRtl ? 'مفتوح' : 'Open') : (isRtl ? 'مغلق' : 'Closed')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => navigate(`/admin/tenders/${t.id}`)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => deleteTender(t.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white p-20 rounded-2xl border-2 border-dashed border-slate-200 text-center text-slate-500">
          <FileText size={48} className="mx-auto mb-4 opacity-20" />
          {isRtl ? 'لا توجد مناقصات حالياً' : 'No tenders found'}
        </div>
      )}
    </div>
  );
};
