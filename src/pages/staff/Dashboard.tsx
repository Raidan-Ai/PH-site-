import React from 'react';
import { FileText, ShieldAlert, Briefcase, Settings, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useTranslation } from 'react-i18next';
import { SystemDocs } from '../admin/SystemDocs';
import { AdminFooter } from '../../components/admin/AdminFooter';
import { Book, User } from 'lucide-react';
import UserProfile from '../../components/UserProfile';

export default function StaffDashboard() {
  const { userData } = useAuth();
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const sidebarLinks = [
    { name: isRtl ? 'نظرة عامة' : 'Overview', path: '/staff', icon: <LayoutDashboard size={20} /> },
    { name: isRtl ? 'الملف الشخصي' : 'Profile', path: '/staff/profile', icon: <User size={20} /> },
    { name: isRtl ? 'إدارة المقالات' : 'Articles', path: '/admin/articles', icon: <FileText size={20} /> },
    { name: isRtl ? 'إدارة الانتهاكات' : 'Violations', path: '/admin/violations', icon: <ShieldAlert size={20} /> },
    { name: isRtl ? 'إدارة الوظائف' : 'Jobs', path: '/admin/jobs', icon: <Briefcase size={20} /> },
    { name: isRtl ? 'الإعدادات' : 'Settings', path: '/staff/settings', icon: <Settings size={20} /> },
    { name: isRtl ? 'التوثيق' : 'Documentation', path: '/staff/docs', icon: <Book size={20} /> },
  ];

  return (
    <AdminLayout 
      title={isRtl ? 'لوحة الموظفين' : 'Staff Panel'}
      links={sidebarLinks}
    >
      <Routes>
        <Route path="/" element={<StaffOverview isRtl={isRtl} name={userData?.name || ''} />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/settings" element={<div className="p-8 text-center text-slate-500">Settings coming soon</div>} />
        <Route path="/docs" element={<SystemDocs />} />
      </Routes>
      <AdminFooter />
    </AdminLayout>
  );
}

function StaffOverview({ isRtl, name }: { isRtl: boolean; name: string }) {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">{isRtl ? `مرحباً، ${name}` : `Welcome, ${name}`}</h1>
        <p className="text-slate-500">{isRtl ? 'لوحة تحكم الموظف - إدارة المهام اليومية' : 'Staff Dashboard - Manage daily tasks'}</p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-2">{isRtl ? 'المهام المعلقة' : 'Pending Tasks'}</h3>
          <p className="text-3xl font-bold text-blue-600">12</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-2">{isRtl ? 'المقالات المكتملة' : 'Completed Articles'}</h3>
          <p className="text-3xl font-bold text-emerald-600">45</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-2">{isRtl ? 'بلاغات جديدة' : 'New Reports'}</h3>
          <p className="text-3xl font-bold text-amber-600">3</p>
        </div>
      </div>
    </div>
  );
}
