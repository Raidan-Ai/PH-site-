import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;

    const fetchNotifications = async () => {
       try {
           const res = await api.get('/api/notifications');
           setNotifications(res.data || []);
       } catch (err) {
           console.error(err);
       }
    };
    
    fetchNotifications();
    const int = setInterval(fetchNotifications, 60000);
    return () => clearInterval(int);
  }, [user?.uid]);

  const markAsRead = async (id: string) => {
    try {
        await api.put(`/api/notifications/${id}`, { read: true });
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {}
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-blue-900 transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 p-4 z-50">
          <h3 className="font-bold text-slate-900 mb-4">التنبيهات</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-slate-500 text-sm">لا توجد تنبيهات</p>
            ) : (
              notifications.map(n => (
                <div 
                  key={n.id} 
                  className={`p-3 rounded-lg text-sm ${n.read ? 'bg-slate-50' : 'bg-blue-50'}`}
                  onClick={() => n.id && markAsRead(n.id)}
                >
                  <p className="font-bold text-slate-900">{n.title}</p>
                  <p className="text-slate-600">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
