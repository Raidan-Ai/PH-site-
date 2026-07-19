import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { api } from '../../services/api';
import { useTranslation } from 'react-i18next';
import { Loader2, TrendingUp, Users, FileText } from 'lucide-react';

interface StatsData {
  date: string;
  count: number;
  totalViews: number;
  totalEngagement: number;
}

export const JournalistStats: React.FC = () => {
  const [data, setData] = useState<StatsData[]>([]);
  const [loading, setLoading] = useState(true);
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/api/articles/author/stats');
        setData(response.data);
      } catch (error) {
        console.error('Error fetching journalist stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white border border-slate-200 rounded-2xl">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white border border-slate-200 p-8 rounded-2xl text-center">
        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-900">
          {isRtl ? 'لا توجد بيانات متاحة حالياً' : 'No data available yet'}
        </h3>
        <p className="text-slate-500">
          {isRtl ? 'ابدأ بنشر مقالاتك لتظهر الإحصائيات هنا.' : 'Start publishing articles to see statistics here.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
      {/* Articles Published Chart */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <FileText size={20} />
          </div>
          <h3 className="font-bold text-slate-900">
            {isRtl ? 'المقالات المنشورة (آخر 30 يوم)' : 'Published Articles (Last 30 Days)'}
          </h3>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickFormatter={(value) => value.split('-').slice(1).join('/')}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                cursor={{ fill: '#f8fafc' }}
              />
              <Bar 
                dataKey="count" 
                name={isRtl ? 'عدد المقالات' : 'Articles Count'} 
                fill="#3b82f6" 
                radius={[4, 4, 0, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Engagement Chart */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
            <TrendingUp size={20} />
          </div>
          <h3 className="font-bold text-slate-900">
            {isRtl ? 'تفاعل الجمهور والمشاهدات' : 'Audience Engagement & Views'}
          </h3>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickFormatter={(value) => value.split('-').slice(1).join('/')}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="top" align="right" height={36}/>
              <Area 
                type="monotone" 
                dataKey="totalViews" 
                name={isRtl ? 'المشاهدات' : 'Views'} 
                stroke="#10b981" 
                fillOpacity={1} 
                fill="url(#colorViews)" 
              />
              <Area 
                type="monotone" 
                dataKey="totalEngagement" 
                name={isRtl ? 'التفاعل' : 'Engagement'} 
                stroke="#f59e0b" 
                fillOpacity={1} 
                fill="url(#colorEngagement)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
