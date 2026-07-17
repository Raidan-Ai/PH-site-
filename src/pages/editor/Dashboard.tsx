import React from 'react';
import { FileText, Briefcase, FileSignature, Settings, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Routes, Route } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useTranslation } from 'react-i18next';
import { AdminFooter } from '../../components/admin/AdminFooter';
import { TenderManager } from '../admin/TenderManager';

const ArticlesManager = () => <div className="p-8 text-center text-slate-500">Articles Management</div>;
const JobsManager = () => <div className="p-8 text-center text-slate-500">Jobs Management</div>;

export default function EditorDashboard() {
  const { userData } = useAuth();
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const sidebarLinks = [
    { name: isRtl ? 'نظرة عامة' : 'Overview', path: '/editor', icon: <LayoutDashboard size={20} /> },
    { name: isRtl ? 'المقالات والتقارير' : 'Articles & Reports', path: '/editor/articles', icon: <FileText size={20} /> },
    { name: isRtl ? 'الوظائف' : 'Jobs', path: '/editor/jobs', icon: <Briefcase size={20} /> },
    { name: isRtl ? 'المناقصات' : 'Tenders', path: '/editor/tenders', icon: <FileSignature size={20} /> },
    { name: isRtl ? 'الإعدادات' : 'Settings', path: '/editor/settings', icon: <Settings size={20} /> },
  ];

  return (
    <AdminLayout 
      title={isRtl ? 'لوحة المحرر' : 'Editor Panel'}
      links={sidebarLinks}
    >
      <Routes>
        <Route path="/" element={<EditorOverview isRtl={isRtl} name={userData?.name || ''} />} />
        <Route path="/articles" element={<ArticlesManager />} />
        <Route path="/jobs" element={<JobsManager />} />
        <Route path="/tenders" element={<TenderManager />} />
        <Route path="/settings" element={<div className="p-8 text-center text-slate-500">Settings coming soon</div>} />
      </Routes>
      <AdminFooter />
    </AdminLayout>
  );
}

function EditorOverview({ isRtl, name }: { isRtl: boolean; name: string }) {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">{isRtl ? `مرحباً، ${name}` : `Welcome, ${name}`}</h1>
        <p className="text-slate-500">{isRtl ? 'لوحة المحرر - إدارة المحتوى الإعلامي' : 'Editor Dashboard - Manage media content'}</p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-2">{isRtl ? 'مسودات معلقة' : 'Pending Drafts'}</h3>
          <p className="text-3xl font-bold text-blue-600">12</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-2">{isRtl ? 'مقالات منشورة' : 'Published Articles'}</h3>
          <p className="text-3xl font-bold text-emerald-600">430</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-2">{isRtl ? 'فرص نشطة' : 'Active Opportunities'}</h3>
          <p className="text-3xl font-bold text-amber-600">6</p>
        </div>
      </div>
    </div>
  );
}
