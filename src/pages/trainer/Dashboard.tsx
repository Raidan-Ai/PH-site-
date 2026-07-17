import React from 'react';
import { BookOpen, Users, GraduationCap, Settings, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Routes, Route } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useTranslation } from 'react-i18next';
import { AdminFooter } from '../../components/admin/AdminFooter';
import CourseManager from '../admin/CourseManager';

export default function TrainerDashboard() {
  const { userData } = useAuth();
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const sidebarLinks = [
    { name: isRtl ? 'نظرة عامة' : 'Overview', path: '/trainer', icon: <LayoutDashboard size={20} /> },
    { name: isRtl ? 'إدارة الدورات' : 'Courses', path: '/trainer/courses', icon: <BookOpen size={20} /> },
    { name: isRtl ? 'الطلاب المتقدمين' : 'Applicants', path: '/trainer/applicants', icon: <Users size={20} /> },
    { name: isRtl ? 'الإعدادات' : 'Settings', path: '/trainer/settings', icon: <Settings size={20} /> },
  ];

  return (
    <AdminLayout 
      title={isRtl ? 'لوحة المدرب' : 'Trainer Panel'}
      links={sidebarLinks}
    >
      <Routes>
        <Route path="/" element={<TrainerOverview isRtl={isRtl} name={userData?.name || ''} />} />
        <Route path="/courses" element={<CourseManager />} />
        <Route path="/applicants" element={<div className="p-8 text-center text-slate-500">Applicants Management Coming Soon</div>} />
        <Route path="/settings" element={<div className="p-8 text-center text-slate-500">Settings coming soon</div>} />
      </Routes>
      <AdminFooter />
    </AdminLayout>
  );
}

function TrainerOverview({ isRtl, name }: { isRtl: boolean; name: string }) {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">{isRtl ? `مرحباً، ${name}` : `Welcome, ${name}`}</h1>
        <p className="text-slate-500">{isRtl ? 'لوحة الأكاديمية والتدريب' : 'Academy & Training Dashboard'}</p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-2">{isRtl ? 'الدورات النشطة' : 'Active Courses'}</h3>
          <p className="text-3xl font-bold text-blue-600">4</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-2">{isRtl ? 'الطلاب المسجلين' : 'Enrolled Students'}</h3>
          <p className="text-3xl font-bold text-emerald-600">156</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-2">{isRtl ? 'طلبات جديدة' : 'New Applications'}</h3>
          <p className="text-3xl font-bold text-amber-600">23</p>
        </div>
      </div>
    </div>
  );
}
