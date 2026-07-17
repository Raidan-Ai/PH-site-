import React from 'react';
import { ShieldAlert, FileText, Settings, LayoutDashboard, Scale } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Routes, Route } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useTranslation } from 'react-i18next';
import { AdminFooter } from '../../components/admin/AdminFooter';

const ViolationsManager = () => <div className="p-8 text-center text-slate-500">Violations Management</div>;

export default function LawyerDashboard() {
  const { userData } = useAuth();
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const sidebarLinks = [
    { name: isRtl ? 'نظرة عامة' : 'Overview', path: '/lawyer', icon: <LayoutDashboard size={20} /> },
    { name: isRtl ? 'ملفات الانتهاكات' : 'Violations', path: '/lawyer/violations', icon: <ShieldAlert size={20} /> },
    { name: isRtl ? 'الدعم القانوني' : 'Legal Support', path: '/lawyer/support', icon: <Scale size={20} /> },
    { name: isRtl ? 'الإعدادات' : 'Settings', path: '/lawyer/settings', icon: <Settings size={20} /> },
  ];

  return (
    <AdminLayout 
      title={isRtl ? 'لوحة المستشار القانوني' : 'Lawyer Panel'}
      links={sidebarLinks}
    >
      <Routes>
        <Route path="/" element={<LawyerOverview isRtl={isRtl} name={userData?.name || ''} />} />
        <Route path="/violations" element={<ViolationsManager />} />
        <Route path="/support" element={<div className="p-8 text-center text-slate-500">Legal Support Management Coming Soon</div>} />
        <Route path="/settings" element={<div className="p-8 text-center text-slate-500">Settings coming soon</div>} />
      </Routes>
      <AdminFooter />
    </AdminLayout>
  );
}

function LawyerOverview({ isRtl, name }: { isRtl: boolean; name: string }) {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">{isRtl ? `مرحباً، ${name}` : `Welcome, ${name}`}</h1>
        <p className="text-slate-500">{isRtl ? 'لوحة المستشار القانوني - إدارة الانتهاكات والدعم' : 'Lawyer Dashboard - Manage violations and support'}</p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-2">{isRtl ? 'انتهاكات قيد المراجعة' : 'Violations Under Review'}</h3>
          <p className="text-3xl font-bold text-blue-600">8</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-2">{isRtl ? 'قضايا مكتملة' : 'Completed Cases'}</h3>
          <p className="text-3xl font-bold text-emerald-600">24</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-2">{isRtl ? 'طلبات استشارة' : 'Consultation Requests'}</h3>
          <p className="text-3xl font-bold text-amber-600">5</p>
        </div>
      </div>
    </div>
  );
}
