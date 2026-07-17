import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Users, Search, Shield, ShieldAlert, ShieldCheck, 
  Trash2, Mail, Calendar, Loader2, MoreVertical,
  UserPlus, UserMinus, UserCheck, ShieldQuestion,
  Check, X, Eye, Edit, Trash, PlusCircle, Globe, Play, Lock, AlertTriangle
} from 'lucide-react';
import { User } from '../../types';
import { clsx } from 'clsx';
import { api } from '../../services/api';
import { ROLE_PERMISSIONS_MATRIX, AppRoleName, getAppRoleForDbRole, hasCapability, canManage } from '../../utils/permissions';

export default function UserManager() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'managers' | 'staff' | 'journalists' | 'subscribers'>('all');
  
  // High-level main tab state
  const [managerView, setManagerView] = useState<'accounts' | 'permissions'>('accounts');
  
  // Simulator Sandbox State
  const [selectedSimRole, setSelectedSimRole] = useState<AppRoleName>('Content Editor');
  const [selectedSimModule, setSelectedSimModule] = useState<'news' | 'violations' | 'tenders' | 'jobs' | 'forum'>('news');
  const [selectedSimAction, setSelectedSimAction] = useState<'create' | 'edit' | 'publish' | 'delete' | 'view'>('publish');
  const [simLogs, setSimLogs] = useState<string[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/api/users').catch(() => ({ data: [] }));
        const usersData = response.data;
        usersData.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setUsers(usersData as User[]);
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

  const handleStatusToggle = async (uid: string, currentDisabled: boolean) => {
    try {
      const nextDisabled = !currentDisabled;
      await api.put(`/api/users/${uid}`, { disabled: nextDisabled });
      setUsers(users.map(u => u.uid === uid ? { ...u, disabled: nextDisabled } : u));
    } catch (error) {
      console.error("Error toggling user status:", error);
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

  // Run Simulation Event Handler
  const runSimulation = () => {
    const perm = ROLE_PERMISSIONS_MATRIX[selectedSimRole];
    const databaseRoles = perm.dbRoles.join(' / ');
    const authorized = hasCapability(perm.dbRoles[0], selectedSimModule, selectedSimAction);
    
    let message = '';
    if (authorized) {
      message = isRtl 
        ? `✅ [نجاح المحاكاة]: الدور "${selectedSimRole}" (قاعدة البيانات: ${databaseRoles}) مخول لاتخاذ الإجراء [${selectedSimAction}] على وحدة [${selectedSimModule}]. تم منح صلاحية الوصول بنجاح.`
        : `✅ [SIMULATION SUCCESS]: App Role "${selectedSimRole}" (Database: ${databaseRoles}) is fully authorized to trigger action [${selectedSimAction}] on domain [${selectedSimModule}]. Access permitted.`;
    } else {
      message = isRtl
        ? `❌ [محاكاة مرفوضة]: الدور "${selectedSimRole}" (قاعدة البيانات: ${databaseRoles}) لا يملك الصلاحية لاتخاذ الإجراء [${selectedSimAction}] على وحدة [${selectedSimModule}]. تم رفض الوصول وحظر المحاولة!`
        : `❌ [SIMULATION DENIED]: App Role "${selectedSimRole}" (Database: ${databaseRoles}) does not possess clearance for action [${selectedSimAction}] on domain [${selectedSimModule}]. Request blocked.`;
    }
    
    setSimLogs(prev => [message, ...prev.slice(0, 7)]);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesTab = true;
    switch (activeTab) {
      case 'managers':
        matchesTab = ['root', 'admin', 'developer'].includes(user.role);
        break;
      case 'staff':
        matchesTab = ['staff', 'editor', 'content_creator', 'lawyer', 'trainer'].includes(user.role);
        break;
      case 'journalists':
        matchesTab = user.role === 'journalist';
        break;
      case 'subscribers':
        matchesTab = ['user', 'viewer', 'guest'].includes(user.role);
        break;
      default:
        matchesTab = true;
    }

    return matchesSearch && matchesTab;
  });

  const getRoleIcon = (role: User['role']) => {
    switch (role) {
      case 'root':
      case 'admin': return <ShieldCheck className="text-blue-600" size={18} />;
      case 'staff': return <Shield className="text-emerald-600" size={18} />;
      case 'journalist': return <UserCheck className="text-amber-600" size={18} />;
      default: return <Users className="text-slate-400" size={18} />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in-50">
      {/* Page Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">{isRtl ? 'إدارية العضوية والصلاحيات المتقدمة' : 'Membership & Advanced Authorization Control'}</h1>
          <p className="text-slate-500 text-sm mt-1">
            {isRtl 
              ? 'تخصيص الأدوار، مراجعة مصفوفة الصلاحيات لجميع الأقسام، وفحص الوصول الفوري لنظام بيت الصحافة.' 
              : 'Allocate roles, audit authorization matrices for all system segments, and run access flow sandboxes.'}
          </p>
        </div>
      </div>

      {/* Primary Toggle View Buttons */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit border border-slate-200">
        <button
          onClick={() => setManagerView('accounts')}
          className={clsx(
            "px-6 py-2.5 rounded-lg text-xs font-black transition-all cursor-pointer",
            managerView === 'accounts' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
          )}
        >
          {isRtl ? 'حسابات الأعضاء' : 'User Accounts Log'}
        </button>
        <button
          onClick={() => setManagerView('permissions')}
          className={clsx(
            "px-6 py-2.5 rounded-lg text-xs font-black transition-all cursor-pointer",
            managerView === 'permissions' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
          )}
        >
          {isRtl ? 'مصفوفة الصلاحيات والمحاكاة' : 'Permissions Grid & Sandbox Simulator'}
        </button>
      </div>

      {managerView === 'accounts' ? (
        <>
          {/* Search Bar and Tabs */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-4">
              <button
                onClick={() => setActiveTab('all')}
                className={clsx(
                  "px-4 py-2 rounded-xl text-sm font-bold transition-colors",
                  activeTab === 'all' ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-50"
                )}
              >
                {isRtl ? 'الكل' : 'All'}
              </button>
              <button
                onClick={() => setActiveTab('managers')}
                className={clsx(
                  "px-4 py-2 rounded-xl text-sm font-bold transition-colors",
                  activeTab === 'managers' ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-50"
                )}
              >
                {isRtl ? 'المدراء' : 'Managers'}
              </button>
              <button
                onClick={() => setActiveTab('staff')}
                className={clsx(
                  "px-4 py-2 rounded-xl text-sm font-bold transition-colors",
                  activeTab === 'staff' ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-50"
                )}
              >
                {isRtl ? 'الموظفين' : 'Staff'}
              </button>
              <button
                onClick={() => setActiveTab('journalists')}
                className={clsx(
                  "px-4 py-2 rounded-xl text-sm font-bold transition-colors",
                  activeTab === 'journalists' ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-50"
                )}
              >
                {isRtl ? 'الصحفيين' : 'Journalists'}
              </button>
              <button
                onClick={() => setActiveTab('subscribers')}
                className={clsx(
                  "px-4 py-2 rounded-xl text-sm font-bold transition-colors",
                  activeTab === 'subscribers' ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-50"
                )}
              >
                {isRtl ? 'المشتركين' : 'Subscribers'}
              </button>
            </div>

            <div className="relative">
              <input 
                type="text"
                placeholder={isRtl ? 'بحث بالاسم أو البريد الإلكتروني...' : 'Search by name or email...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-slate-50"
              />
              <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={48} /></div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-start">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4">{isRtl ? 'المستخدم' : 'User'}</th>
                      <th className="px-6 py-4">{isRtl ? 'الدور المخصص' : 'Mapped Database Role'}</th>
                      <th className="px-6 py-4">{isRtl ? 'الفئة العامة' : 'Logical App Role'}</th>
                      <th className="px-6 py-4">{isRtl ? 'تاريخ الانضمام' : 'Joined'}</th>
                      <th className="px-6 py-4 text-center">{isRtl ? 'إجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((user) => {
                      const appRole = getAppRoleForDbRole(user.role);
                      return (
                        <tr key={user.uid} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                                {user.photoURL ? (
                                  <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <Users size={20} className="text-slate-400" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                   <p className="font-bold text-slate-900">{user.displayName || (isRtl ? 'مستخدم جديد' : 'New User')}</p>
                                   {user.emailVerified && <ShieldCheck size={14} className="text-blue-500" title="Verified" />}
                                </div>
                                <p className="text-xs text-slate-400">{user.email}</p>
                                <div className="mt-1 flex gap-1">
                                   <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase ${user.disabled ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                      {user.disabled ? (isRtl ? 'معطل' : 'Disabled') : (isRtl ? 'نشط' : 'Active')}
                                   </span>
                                   {user.lastLoginAt && (
                                     <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md">
                                       {isRtl ? 'آخر دخول: ' : 'Last: '} {new Date(user.lastLoginAt).toLocaleDateString(isRtl ? 'ar-YE' : 'en-US')}
                                     </span>
                                   )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {getRoleIcon(user.role)}
                              <select 
                                value={user.role}
                                onChange={(e) => handleRoleChange(user.uid, e.target.value as any)}
                                disabled={user.role === 'root'}
                                className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer disabled:cursor-not-allowed border-none focus:ring-0"
                              >
                                <option value="admin">Admin / Super Admin</option>
                                <option value="developer">Developer</option>
                                <option value="editor">Editor</option>
                                <option value="staff">Staff</option>
                                <option value="lawyer">Legal Lawyer</option>
                                <option value="trainer">Academy Trainer</option>
                                <option value="journalist">Journalist</option>
                                <option value="guest">Guest</option>
                                <option value="user">User</option>
                                <option value="viewer">Viewer</option>
                              </select>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={clsx(
                              "text-xs px-2.5 py-1 rounded-full font-bold whitespace-nowrap",
                              appRole === 'Super Admin' ? "bg-blue-100 text-blue-700" :
                              appRole === 'Developer' ? "bg-purple-100 text-purple-700" :
                              appRole === 'Content Editor' ? "bg-emerald-100 text-emerald-700" :
                              appRole === 'Legal Lawyer' ? "bg-red-100 text-red-700" :
                              appRole === 'Academy Trainer' ? "bg-teal-100 text-teal-700" :
                              appRole === 'Reporter' ? "bg-amber-100 text-amber-700" :
                              appRole === 'Guest' ? "bg-indigo-100 text-indigo-700" :
                              "bg-slate-100 text-slate-600"
                            )}>
                              {appRole}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500">
                            {new Date(user.createdAt).toLocaleDateString(isRtl ? 'ar-YE' : 'en-US')}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center gap-2">
                              {user.role !== 'root' && (
                                <button
                                  onClick={() => handleStatusToggle(user.uid, !!user.disabled)}
                                  className={clsx(
                                    "p-2 rounded-xl transition-colors",
                                    user.disabled 
                                      ? "text-green-600 hover:bg-green-50" 
                                      : "text-amber-600 hover:bg-amber-50"
                                  )}
                                  title={user.disabled ? (isRtl ? 'تنشيط الحساب' : 'Activate Account') : (isRtl ? 'تجميد وحظر الحساب' : 'Suspend Account')}
                                >
                                  {user.disabled ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
                                </button>
                              )}
                              <button 
                                onClick={() => handleDelete(user.uid)}
                                disabled={user.role === 'root'}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-30"
                                title={isRtl ? 'حذف المستخدم نهائياً' : 'Delete User'}
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
            </div>
          )}
        </>
      ) : (
        // Advanced Fine-Grained Role Permissions Matrix Panel
        <div className="space-y-8 animate-in slide-in-from-bottom-5">
          {/* Overview Statement */}
          <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-4">
            <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-1.5">
              <ShieldCheck className="text-blue-600" size={20} />
              {isRtl ? 'مصفوفة التحكم بالصلاحيات الدقيقة لكافة أقسام المنصة' : 'Fine-Grained Capabilities Mapping Matrix'}
            </h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              {isRtl 
                ? 'يوضح الجدول التالي الصلاحيات الدقيقة لكل دور مستخدم على أقسام: المقالات الإخبارية، بلاغات الانتهاكات، المناقصات الاستراتيجية، إعلانات التوظيف والفرص، والمنتدى المفتوح. يحافظ هذا النظام على سلامة بيانات مرصد بيت الصحافة.' 
                : 'The following grid illustrates each specific role capability across crucial site sections. The values are automatically applied to the active database role of members.'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
              {(Object.keys(ROLE_PERMISSIONS_MATRIX) as AppRoleName[]).map((roleName) => {
                const info = ROLE_PERMISSIONS_MATRIX[roleName];
                return (
                  <div key={roleName} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-slate-800 text-xs">{roleName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({info.dbRoles.join(', ')})</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                      {isRtl ? info.descriptionAr : info.descriptionEn}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Matrix Grid Excel-Style */}
          <div className="bg-white border border-slate-200 rounded-[32px] shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">{isRtl ? 'عرض الصلاحيات حسب الأقسام والإجراءات' : "Grid Mapping Breakdown"}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-start border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase font-black tracking-wider border-b border-slate-100">
                    <th className="px-6 py-4 border-r border-slate-100">{isRtl ? 'دور التطبيق' : 'App Role'}</th>
                    <th className="px-6 py-4 border-r border-slate-100">{isRtl ? 'المقالات الإخبارية (News)' : 'News articles'}</th>
                    <th className="px-6 py-4 border-r border-slate-100">{isRtl ? 'مرصد الانتهاكات (Violations)' : 'Violation Reports'}</th>
                    <th className="px-6 py-4 border-r border-slate-100">{isRtl ? 'المناقصات (Tenders)' : 'Tenders Listings'}</th>
                    <th className="px-6 py-4 border-r border-slate-100">{isRtl ? 'فرص العمل والتدريب (Jobs)' : 'Job Postings'}</th>
                    <th className="px-6 py-4 border-r border-slate-100">{isRtl ? 'منتدى حرية الصحافة (Forum)' : 'Open Forums'}</th>
                    <th className="px-6 py-4 border-r border-slate-100">{isRtl ? 'المستخدمين' : 'User Accounts'}</th>
                    <th className="px-6 py-4">{isRtl ? 'الإعدادات' : 'System Settings'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {(Object.keys(ROLE_PERMISSIONS_MATRIX) as AppRoleName[]).map((roleName) => {
                    const info = ROLE_PERMISSIONS_MATRIX[roleName];
                    const renderActions = (actions: { create: boolean; edit: boolean; publish: boolean; delete: boolean; view: boolean }) => {
                      return (
                        <div className="flex flex-col gap-1 text-[10px] py-1">
                          <div className="flex items-center gap-1">
                            {actions.view ? <Check className="text-emerald-500" size={12} /> : <X className="text-rose-400" size={12} />}
                            <span className="text-[9px] text-slate-400">{isRtl ? 'قراءة' : 'Read'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {actions.create ? <Check className="text-emerald-500" size={12} /> : <X className="text-rose-400" size={12} />}
                            <span className="text-[9px] text-slate-400">{isRtl ? 'إنشاء' : 'Write'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {actions.edit ? <Check className="text-emerald-500" size={12} /> : <X className="text-rose-400" size={12} />}
                            <span className="text-[9px] text-slate-400">{isRtl ? 'تعديل' : 'Modify'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {actions.publish ? <Check className="text-emerald-500" size={12} /> : <X className="text-rose-400" size={12} />}
                            <span className="text-[9px] text-slate-400">{isRtl ? 'نشر مباشر' : 'Publish'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {actions.delete ? <Check className="text-emerald-500" size={12} /> : <X className="text-rose-400" size={12} />}
                            <span className="text-[9px] text-slate-400">{isRtl ? 'حذف' : 'Destroy'}</span>
                          </div>
                        </div>
                      );
                    };

                    return (
                      <tr key={roleName} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-black text-slate-900 border-r border-slate-100 bg-slate-50/20">{roleName}</td>
                        <td className="px-6 py-4 border-r border-slate-100">{renderActions(info.capabilities.news)}</td>
                        <td className="px-6 py-4 border-r border-slate-100">{renderActions(info.capabilities.violations)}</td>
                        <td className="px-6 py-4 border-r border-slate-100">{renderActions(info.capabilities.tenders)}</td>
                        <td className="px-6 py-4 border-r border-slate-100">{renderActions(info.capabilities.jobs)}</td>
                        <td className="px-6 py-4 border-r border-slate-100">{renderActions(info.capabilities.forum)}</td>
                        <td className="px-6 py-4 border-r border-slate-100">
                          <div className="flex items-center gap-1">
                            {info.capabilities.users.manage ? (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-md text-[9px] font-bold">{isRtl ? 'إدارة كاملة' : 'Full Manager'}</span>
                            ) : (
                              <span className="bg-rose-50 text-rose-600 border border-rose-100 px-2 py-0.5 rounded-md text-[9px] font-bold">{isRtl ? 'محجوب' : 'Blind'}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 col-span-1">
                            {info.capabilities.settings.manage ? (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-md text-[9px] font-bold">{isRtl ? 'تعديل كامل' : 'Editable'}</span>
                            ) : (
                              <span className="bg-rose-50 text-rose-600 border border-rose-100 px-2 py-0.5 rounded-md text-[9px] font-bold">{isRtl ? 'محجوب' : 'Blind'}</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* SIMULATION SANDBOX CONTROLS */}
          <div className="bg-slate-950 border border-slate-800 p-8 rounded-[36px] text-white space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 text-white/5 pointer-events-none">
              <Lock size={150} />
            </div>
            
            <div className="relative z-10">
              <h3 className="text-lg font-black tracking-tight flex items-center gap-2 mb-2">
                <Play className="text-blue-500 fill-blue-500" size={18} />
                {isRtl ? 'محاكاة اختبار الصلاحية الفورية (Gatekeeper Sandbox)' : 'Live Authorization Simulator'}
              </h3>
              <p className="text-slate-400 text-xs max-w-2xl leading-relaxed">
                {isRtl
                  ? 'اختر دور المستخدم، الوحدة المستهدفة، والإجراء المطلوب لفحص هل سيسمح حارس البوابة البرمجي (Backend Middleware Checker) بمرور الطلب أم سيرفضه. هذا الفحص يماثل عمل كود الحماية الفعلي.'
                  : 'Select any role, section, and CRUD action. Click run to evaluate dynamic gatekeeper parameters and ensure complete architectural isolation.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10 pt-4">
              <div>
                <label className="block text-slate-400 text-[10px] font-extrabold uppercase mb-1.5">{isRtl ? 'محاكاة دور:' : 'Evaluate Role:'}</label>
                <select
                  value={selectedSimRole}
                  onChange={(e) => setSelectedSimRole(e.target.value as AppRoleName)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none cursor-pointer focus:border-blue-500"
                >
                  {(Object.keys(ROLE_PERMISSIONS_MATRIX) as AppRoleName[]).map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] font-extrabold uppercase mb-1.5">{isRtl ? 'على قسم:' : 'On Location Section:'}</label>
                <select
                  value={selectedSimModule}
                  onChange={(e) => setSelectedSimModule(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none cursor-pointer focus:border-blue-500"
                >
                  <option value="news">{isRtl ? 'المقالات الإخبارية (News)' : 'News articles'}</option>
                  <option value="violations">{isRtl ? 'بلاغات الانتهاكات (Violations)' : 'Violation Reports'}</option>
                  <option value="tenders">{isRtl ? 'المناقصات (Tenders)' : 'Tenders Listings'}</option>
                  <option value="jobs">{isRtl ? 'فرص العمل (Jobs)' : 'Job Listings'}</option>
                  <option value="forum">{isRtl ? 'المنتدى (Forums)' : 'Forum Posts'}</option>
                </select>
              </div>

              <div className="flex flex-col justify-end">
                <label className="block text-slate-400 text-[10px] font-extrabold uppercase mb-1.5">{isRtl ? 'للإجراء:' : 'Action to Simulate:'}</label>
                <div className="flex gap-2">
                  <select
                    value={selectedSimAction}
                    onChange={(e) => setSelectedSimAction(e.target.value as any)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none cursor-pointer focus:border-blue-500"
                  >
                    <option value="view">{isRtl ? 'عرض (View)' : 'View'}</option>
                    <option value="create">{isRtl ? 'إدخال / إنشاء (Create)' : 'Create'}</option>
                    <option value="edit">{isRtl ? 'تعديل (Edit)' : 'Edit'}</option>
                    <option value="publish">{isRtl ? 'نشر فوري (Publish)' : 'Publish'}</option>
                    <option value="delete">{isRtl ? 'حذف للنهائي (Delete)' : 'Delete'}</option>
                  </select>
                  <button
                    onClick={runSimulation}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-3 rounded-xl cursor-pointer transition-colors"
                  >
                    {isRtl ? 'اختبر الفحص' : 'Evaluate'}
                  </button>
                </div>
              </div>
            </div>

            {/* Simulated Stream Console */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-3 relative z-10">
              <span className="text-[10px] font-bold text-slate-500 font-mono tracking-wider block uppercase">{isRtl ? 'شاشة مراقبة حارس البوابة (Gatekeeper Monitor Output)' : 'Sandbox Evaluator Terminal'}</span>
              
              <div className="space-y-2 max-h-48 overflow-y-auto font-mono text-xs leading-relaxed">
                {simLogs.length === 0 ? (
                  <p className="text-slate-600 italic">{isRtl ? '> انقر على الزر بالأعلى لتجربة محاكاة فحص الوصول...' : '> Click Evaluate triggers to check permission logic...'}</p>
                ) : (
                  simLogs.map((log, index) => (
                    <div key={index} className="p-2.5 bg-slate-950/80 rounded-lg text-slate-300 border border-slate-800/80 animate-in slide-in-from-top-1">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

