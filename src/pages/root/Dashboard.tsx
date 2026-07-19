import React from 'react';
import { Server, Database, Shield, Settings, Activity, LayoutDashboard, Globe, Users, Book, Mail, User } from 'lucide-react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useTranslation } from 'react-i18next';
import CloudflareManager from '../../components/admin/CloudflareManager';
import UserManager from './UserManager';
import SystemSettings from './SystemSettings';
import EmailTemplates from './EmailTemplates';
import { useAuth } from '../../context/AuthContext';
import { SystemMonitoring, DatabaseManager, SecurityHardening, ServerLogs } from './SystemModules';
import { SystemDocs } from '../admin/SystemDocs';
import { AdminFooter } from '../../components/admin/AdminFooter';
import UserProfile from '../../components/UserProfile';

export default function RootDashboard() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { userData, loading } = useAuth();

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-950">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
  </div>;

  if (userData?.role !== 'root') {
    return <Navigate to="/" />;
  }

  const sidebarLinks = [
    { name: isRtl ? 'نظرة عامة' : 'Overview', path: '/root', icon: <LayoutDashboard size={20} /> },
    { name: isRtl ? 'الملف الشخصي' : 'Profile', path: '/root/profile', icon: <User size={20} /> },
    { name: isRtl ? 'إدارة المستخدمين' : 'Users', path: '/root/users', icon: <Users size={20} /> },
    { name: isRtl ? 'قوالب المراسلات' : 'Emails', path: '/root/emails', icon: <Mail size={20} /> },
    { name: isRtl ? 'إعدادات النظام' : 'System Settings', path: '/root/settings', icon: <Settings size={20} /> },
    { name: isRtl ? 'إدارة النطاقات' : 'DNS Management', path: '/root/dns', icon: <Globe size={20} /> },
    { name: isRtl ? 'مراقبة النظام' : 'Monitoring', path: '/root/monitoring', icon: <Activity size={20} /> },
    { name: isRtl ? 'قاعدة البيانات' : 'Database', path: '/root/database', icon: <Database size={20} /> },
    { name: isRtl ? 'إعدادات الأمان' : 'Security', path: '/root/security', icon: <Shield size={20} /> },
    { name: isRtl ? 'سجلات الخادم' : 'Server Logs', path: '/root/logs', icon: <Server size={20} /> },
    { name: isRtl ? 'التوثيق' : 'Documentation', path: '/root/docs', icon: <Book size={20} /> },
  ];

  return (
    <AdminLayout 
      title={isRtl ? 'لوحة المطورين' : 'Root Panel'}
      links={sidebarLinks}
      theme="dark"
    >
      <Routes>
        <Route path="/" element={<RootOverview isRtl={isRtl} />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/users" element={<UserManager />} />
        <Route path="/emails" element={<EmailTemplates />} />
        <Route path="/settings" element={<SystemSettings />} />
        <Route path="/dns" element={<CloudflareManager />} />
        <Route path="/monitoring" element={<SystemMonitoring isRtl={isRtl} />} />
        <Route path="/database" element={<DatabaseManager isRtl={isRtl} />} />
        <Route path="/security" element={<SecurityHardening isRtl={isRtl} />} />
        <Route path="/logs" element={<ServerLogs isRtl={isRtl} />} />
        <Route path="/docs" element={<SystemDocs />} />
        <Route path="/*" element={<div className="p-16 flex items-center justify-center text-center"><div className="text-slate-500 font-medium text-lg">{isRtl ? 'الصفحة غير موجودة 404' : '404 - Page Not Found'}</div></div>} />
      </Routes>
      <AdminFooter />
    </AdminLayout>
  );
}

function RootOverview({ isRtl }: { isRtl: boolean }) {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-white">{isRtl ? 'نظرة عامة على النظام' : 'System Overview'}</h1>
        <p className="text-slate-400">{isRtl ? 'حالة الخادم والخدمات المتصلة' : 'Server status and connected services'}</p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg">
          <h3 className="font-bold text-slate-400 mb-2">{isRtl ? 'استهلاك المعالج' : 'CPU Usage'}</h3>
          <p className="text-3xl font-bold text-blue-400">12%</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg">
          <h3 className="font-bold text-slate-400 mb-2">{isRtl ? 'الذاكرة' : 'Memory'}</h3>
          <p className="text-3xl font-bold text-emerald-400">1.2 GB</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg">
          <h3 className="font-bold text-slate-400 mb-2">{isRtl ? 'وقت التشغيل' : 'Uptime'}</h3>
          <p className="text-3xl font-bold text-amber-400">14d 2h</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg">
          <h3 className="font-bold text-slate-400 mb-2">{isRtl ? 'قاعدة البيانات' : 'Database'}</h3>
          <p className="text-3xl font-bold text-purple-400">Online</p>
        </div>
      </div>
    </div>
  );
}
