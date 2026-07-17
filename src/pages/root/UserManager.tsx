import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Users, Search, Shield, ShieldCheck, 
  Trash2, Loader2, UserCheck
} from 'lucide-react';
import { User } from '../../types';
import { clsx } from 'clsx';
import { api } from '../../services/api';

export default function UserManager() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'managers' | 'staff' | 'journalists' | 'subscribers'>('all');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/api/users');
        setUsers(response.data as User[]);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleRoleChange = async (uid: string, newRole: User['role']) => {
    try {
      await api.put(`/api/users/${uid}`, { role: newRole });
      setUsers(users.map(u => u.uid === uid ? { ...u, role: newRole } : u));
    } catch (error) {
      console.error("Error updating role:", error);
    }
  };

  const handleDelete = async (uid: string) => {
    if (window.confirm(isRtl ? 'هل أنت متأكد من حذف هذا المستخدم؟' : 'Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/api/users/${uid}`);
        setUsers(users.filter(u => u.uid !== uid));
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  const filteredUsers = users.filter(user => {
    const displayName = user.name?.[isRtl ? 'ar' : 'en'] || user.displayName || '';
    const matchesSearch = displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesTab = true;
    switch (activeTab) {
      case 'managers':
        matchesTab = ['root', 'admin'].includes(user.role);
        break;
      case 'staff':
        matchesTab = ['staff', 'editor', 'content_creator'].includes(user.role);
        break;
      case 'journalists':
        matchesTab = user.role === 'journalist';
        break;
      case 'subscribers':
        matchesTab = ['user', 'viewer'].includes(user.role);
        break;
      default:
        matchesTab = true;
    }

    return matchesSearch && matchesTab;
  });

  const getRoleIcon = (role: User['role']) => {
    switch (role) {
      case 'root':
      case 'admin': return <ShieldCheck className="text-blue-400" size={18} />;
      case 'staff': return <Shield className="text-emerald-400" size={18} />;
      case 'journalist': return <UserCheck className="text-amber-400" size={18} />;
      default: return <Users className="text-slate-500" size={18} />;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-slate-200">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{isRtl ? 'إدارة المستخدمين' : 'User Management'}</h1>
          <p className="text-slate-400 text-sm mt-1">{isRtl ? 'إدارة الصلاحيات والأدوار للنظام' : 'Manage system permissions and roles'}</p>
        </div>
      </div>

      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-4">
          {(['all', 'managers', 'staff', 'journalists', 'subscribers'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                "px-4 py-2 rounded-xl text-sm font-bold transition-colors",
                activeTab === tab ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800"
              )}
            >
              {isRtl ? (tab === 'all' ? 'الكل' : tab === 'managers' ? 'المدراء' : tab === 'staff' ? 'الموظفين' : tab === 'journalists' ? 'الصحفيين' : 'المشتركين') 
                     : (tab.charAt(0).toUpperCase() + tab.slice(1))}
            </button>
          ))}
        </div>

        <div className="relative text-slate-900 font-bold">
          <input 
            type="text"
            placeholder={isRtl ? 'بحث بالاسم أو البريد الإلكتروني...' : 'Search by name or email...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-700 bg-slate-800 text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm placeholder:text-slate-500"
          />
          <Search className="absolute left-3 top-2.5 text-slate-500" size={18} />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={48} /></div>
      ) : (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-start">
              <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase font-bold border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4 text-start">{isRtl ? 'المستخدم' : 'User'}</th>
                  <th className="px-6 py-4 text-start">{isRtl ? 'الدور' : 'Role'}</th>
                  <th className="px-6 py-4 text-start">{isRtl ? 'تاريخ الانضمام' : 'Joined'}</th>
                  <th className="px-6 py-4 text-center">{isRtl ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredUsers.map((user) => (
                   <tr key={user.uid || user.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 text-bold">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-700 text-bold">
                          {user.photoURL ? (
                            <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Users size={20} className="text-slate-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-white">{user.name?.[isRtl ? 'ar' : 'en'] || user.displayName || (isRtl ? 'مستخدم جديد' : 'New User')}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(user.role)}
                        <select 
                          value={user.role}
                          onChange={(e) => handleRoleChange((user.uid || user.id)!, e.target.value as any)}
                          disabled={user.role === 'root'}
                          className="bg-transparent text-sm font-bold text-slate-300 outline-none cursor-pointer disabled:cursor-not-allowed border-none focus:ring-0"
                        >
                          <option value="root" className="bg-slate-900">Root</option>
                          <option value="admin" className="bg-slate-900">Admin</option>
                          <option value="editor" className="bg-slate-900">Editor</option>
                          <option value="content_creator" className="bg-slate-900">Content Creator</option>
                          <option value="viewer" className="bg-slate-900">Viewer</option>
                          <option value="staff" className="bg-slate-900">Staff</option>
                          <option value="journalist" className="bg-slate-900">Journalist</option>
                          <option value="user" className="bg-slate-900">User</option>
                        </select>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString(isRtl ? 'ar-YE' : 'en-US') : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => handleDelete((user.uid || user.id)!)}
                          disabled={user.role === 'root'}
                          className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors disabled:opacity-20"
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
        </div>
      )}
    </div>
  );
}
