import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { api } from '../../services/api';
import { Loader2 } from 'lucide-react';

export default function AcademyPerformanceChart() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const appsRes = await api.get('/api/academy/applications');
        const certsRes = await api.get('/api/academy/certificates');
        
        // Aggregate data (mocked aggregation for now based on available endpoints)
        const aggregatedData = [
          { name: 'Applications', count: appsRes.data.length },
          { name: 'Certificates', count: certsRes.data.length },
        ];
        setData(aggregatedData);
      } catch (error) {
        console.error('Error fetching academy data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <Loader2 className="animate-spin" />;

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
