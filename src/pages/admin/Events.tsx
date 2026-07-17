import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Plus, Trash2, Edit2 } from 'lucide-react';

export default function EventsAdmin() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    const response = await fetch('/api/events');
    const data = await response.json();
    setEvents(data);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure?')) {
      await fetch(`/api/events/${id}`, { method: 'DELETE' });
      fetchEvents();
    }
  };

  if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Events</h1>
        <button 
          onClick={() => navigate('/admin/events/new')}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2"
        >
          <Plus size={20} /> Add Event
        </button>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
        {events.map(event => (
          <div key={event.id} className="p-4 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h2 className="font-bold">{event.title?.en || 'No Title'}</h2>
              <p className="text-sm text-slate-500">{event.date}</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => navigate(`/admin/events/${event.id}`)}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <Edit2 size={18} />
              </button>
              <button onClick={() => handleDelete(event.id)} className="p-2 hover:bg-red-50 text-red-600 rounded-lg"><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
