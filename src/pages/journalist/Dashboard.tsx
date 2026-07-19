import React from "react";
import {
  User,
  Briefcase,
  MessageSquare,
  GraduationCap,
  FileText,
  LayoutDashboard,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Routes, Route } from "react-router-dom";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { useTranslation } from "react-i18next";
import { api } from "../../services/api";
import JournalistViolations from "./JournalistViolations";
import { SystemDocs } from "../admin/SystemDocs";
import { AdminFooter } from "../../components/admin/AdminFooter";
import { Book } from "lucide-react";
import { ApplicationTracker } from "../../components/ApplicationTracker";
import { JournalistStats } from "../../components/journalist/JournalistStats";

import UserProfile from "../../components/UserProfile";

export default function JournalistDashboard() {
  const { userData } = useAuth();
  const { i18n } = useTranslation();
  const isRtl = i18n.language === "ar";

  const sidebarLinks = [
    {
      name: isRtl ? "نظرة عامة" : "Overview",
      path: "/profile",
      icon: <LayoutDashboard size={20} />,
    },
    {
      name: isRtl ? "توثيق الانتهاكات" : "Document Violations",
      path: "/profile/violations",
      icon: <ShieldAlert size={20} />,
    },
    {
      name: isRtl ? "الملف الشخصي" : "Profile",
      path: "/profile/edit",
      icon: <User size={20} />,
    },
    {
      name: isRtl ? "الوظائف" : "Jobs",
      path: "/profile/jobs",
      icon: <Briefcase size={20} />,
    },
    {
      name: isRtl ? "المنتدى" : "Forum",
      path: "/forum",
      icon: <MessageSquare size={20} />,
    },
    {
      name: isRtl ? "التدريب" : "Training",
      path: "/profile/training",
      icon: <GraduationCap size={20} />,
    },
    {
      name: isRtl ? "أعمالي" : "Portfolio",
      path: "/profile/portfolio",
      icon: <FileText size={20} />,
    },
    {
      name: isRtl ? "التوثيق" : "Documentation",
      path: "/profile/docs",
      icon: <Book size={20} />,
    },
  ];

  return (
    <AdminLayout
      title={isRtl ? "لوحة الصحفي" : "Journalist Panel"}
      links={sidebarLinks}
    >
      <Routes>
        <Route
          path="/"
          element={
            <JournalistOverview
              isRtl={isRtl}
              name={userData?.displayName || userData?.name || "صحفي"}
              violationsCount={0}
            />
          }
        />
        <Route path="/violations" element={<JournalistViolations />} />
        <Route path="/edit" element={<UserProfile />} />
        <Route path="/docs" element={<SystemDocs />} />
      </Routes>
      <AdminFooter />
    </AdminLayout>
  );
}

function JournalistOverview({
  isRtl,
  name,
}: {
  isRtl: boolean;
  name: string;
  violationsCount?: number;
}) {
  const [violationsCountState, setViolationsCountState] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get("/api/violations");
        setViolationsCountState(response.data?.length || 0);
      } catch (err) {
        console.error("Error loading overview stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">
          {isRtl ? `مرحباً، ${name}` : `Welcome, ${name}`}
        </h1>
        <p className="text-slate-500">
          {isRtl
            ? "لوحة تحكم الصحفي - رصد الانتهاكات وقائمة أعمال التدريب والتطوير"
            : "Journalist Dashboard - Monitor violations, portfolios, and training courses"}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
          <h3 className="font-bold text-slate-500 mb-2">
            {isRtl ? "الانتهاكات الموثقة" : "Documented Violations"}
          </h3>
          <p className="text-3xl font-bold text-rose-600">
            {loading ? "..." : violationsCountState}
          </p>
        </div>
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
          <h3 className="font-bold text-slate-500 mb-2">
            {isRtl ? "الدورات التدريبية" : "Training Courses"}
          </h3>
          <p className="text-3xl font-bold text-blue-600">4</p>
        </div>
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
          <h3 className="font-bold text-slate-500 mb-2">
            {isRtl ? "الأعمال المنشورة" : "Published Works"}
          </h3>
          <p className="text-3xl font-bold text-emerald-600">8</p>
        </div>
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
          <h3 className="font-bold text-slate-500 mb-2">
            {isRtl ? "الرسائل الجديدة" : "New Messages"}
          </h3>
          <p className="text-3xl font-bold text-amber-600">2</p>
        </div>
      </div>
      
      <div className="mt-8">
        <JournalistStats />
      </div>

      <div className="mt-8">
        <ApplicationTracker />
      </div>
    </div>
  );
}
