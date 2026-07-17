import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  User,
  Landmark, 
  FileText, 
  Briefcase, 
  ShieldAlert, 
  Shield,
  Settings, 
  ChevronDown, 
  LogOut,
  Users,
  Handshake,
  Calendar,
  ImageIcon,
  Globe,
  Layers,
  GraduationCap,
  BarChart3,
  Mail,
  Book,
  Menu,
  Quote,
  Mic,
  Play
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { hasCapability, canManage } from '../../utils/permissions';

interface SidebarLayoutProps {
  title?: string;
  children: React.ReactNode;
  theme?: 'dark' | 'light';
}

export const SidebarLayout: React.FC<SidebarLayoutProps> = ({ 
  title, 
  children, 
  theme = 'light' 
}) => {
  const { i18n } = useTranslation();
  const { signOut, userData } = useAuth();
  const isRtl = i18n.language === 'ar';
  const location = useLocation();
  const isDark = theme === 'dark';

  const defaultTitle = title || (isRtl ? 'لوحة الإدارة' : 'Admin Panel');

  // Hardcoded 5-category structure for administrative consistency
  const navigationCategories = [
    {
      id: 'institution',
      name: isRtl ? 'المؤسسة' : 'Institution',
      icon: <Landmark size={20} />,
      items: [
        { name: isRtl ? 'الهوية' : 'Identity', path: '/admin/identity', icon: <Landmark size={16} /> },
        { name: isRtl ? 'القطاعات' : 'Sectors', path: '/admin/sectors', icon: <Layers size={16} /> },
        { name: isRtl ? 'الكوادر' : 'Staff', path: '/admin/hr', icon: <Users size={16} /> },
        { name: isRtl ? 'المهام والتكليفات' : 'Tasks', path: '/admin/tasks', icon: <Briefcase size={16} /> },
        { name: isRtl ? 'المتطوعين' : 'Volunteers', path: '/admin/volunteers', icon: <Users size={16} /> },
        { name: isRtl ? 'الشركاء' : 'Partners', path: '/admin/partners', icon: <Handshake size={16} /> },
      ]
    },
    {
      id: 'content',
      name: isRtl ? 'المحتوى' : 'Content',
      icon: <FileText size={20} />,
      items: [
        { name: isRtl ? 'الأخبار' : 'Articles', path: '/admin/articles', icon: <FileText size={16} /> },
        { name: isRtl ? 'الإنتاج الإعلامي' : 'Media Studio', path: '/admin/media-center', icon: <Layers size={16} /> },
        { name: isRtl ? 'البودكاست' : 'Podcasts', path: '/admin/podcasts', icon: <Mic size={16} /> },
        { name: isRtl ? 'الفيديوهات' : 'Videos', path: '/admin/videos', icon: <Play size={16} /> },
        { name: isRtl ? 'الفعاليات' : 'Events', path: '/admin/events', icon: <Calendar size={16} /> },
        { name: isRtl ? 'سينما الأربعاء' : 'Cinema', path: '/admin/cinema', icon: <Play size={16} /> },
        { name: isRtl ? 'المكتبة' : 'Media', path: '/admin/media', icon: <ImageIcon size={16} /> },
        { name: isRtl ? 'الصفحات' : 'Pages', path: '/admin/pages', icon: <FileText size={16} /> },
        { name: isRtl ? 'قصص النجاح' : 'Success Stories', path: '/admin/success-stories', icon: <Book size={16} /> },
        { name: isRtl ? 'الشهادات' : 'Testimonials', path: '/admin/testimonials', icon: <Quote size={16} /> },
        { name: isRtl ? 'سلايدر الرئيسية' : 'Hero Slider', path: '/admin/hero-slider', icon: <ImageIcon size={16} /> },
        { name: isRtl ? 'البرامج' : 'Programs', path: '/admin/programs', icon: <Layers size={16} /> },
      ]
    },
    {
      id: 'operations',
      name: isRtl ? 'المشاريع' : 'Projects',
      icon: <Briefcase size={20} />,
      items: [
        { name: isRtl ? 'المشاريع' : 'Plans', path: '/admin/projects', icon: <LayoutDashboard size={16} /> },
        { name: isRtl ? 'الأثر والـ KPIs' : 'Impact & KPIs', path: '/admin/impact', icon: <BarChart3 size={16} /> },
        { name: isRtl ? 'إحصائيات الأداء' : 'Performance Stats', path: '/admin/stats', icon: <BarChart3 size={16} /> },
        { name: isRtl ? 'التدريب' : 'Courses', path: '/admin/courses', icon: <GraduationCap size={16} /> },
        { name: isRtl ? 'الوظائف' : 'Jobs', path: '/admin/jobs', icon: <Briefcase size={16} /> },
        { name: isRtl ? 'المناقصات' : 'Tenders', path: '/admin/tenders', icon: <FileText size={16} /> },
      ]
    },
    {
      id: 'monitoring',
      name: isRtl ? 'الرصد' : 'Advocacy',
      icon: <ShieldAlert size={20} />,
      items: [
        { name: isRtl ? 'الانتهاكات' : 'Violations', path: '/admin/violations', icon: <ShieldAlert size={16} /> },
        { name: isRtl ? 'النشرة' : 'Newsletter', path: '/admin/newsletter', icon: <Mail size={16} /> },
        { name: isRtl ? 'المشتركون' : 'Subscribers', path: '/admin/subscribers', icon: <Users size={16} /> },
        { name: isRtl ? 'إدارة المستخدمين' : 'User Management', path: '/admin/users', icon: <Users size={16} /> },
        { name: isRtl ? 'الآراء والتقييمات' : 'User Feedback', path: '/admin/feedback', icon: <Quote size={16} /> },
        { name: isRtl ? 'البث' : 'Live', path: '/admin/live', icon: <Globe size={16} /> },
      ]
    },
    {
      id: 'settings',
      name: isRtl ? 'الإعدادات' : 'Settings',
      icon: <Settings size={20} />,
      items: [
        { name: isRtl ? 'قوائم النظام' : 'System Lists', path: '/admin/custom-lists', icon: <Settings size={16} /> },
        { name: isRtl ? 'القوائم' : 'Menus', path: '/admin/menus', icon: <Menu size={16} /> },
        { name: isRtl ? 'بوابة جوجل' : 'Google Workspace', path: '/admin/workspace', icon: <Globe size={16} /> },
        { name: isRtl ? 'واجهة الـ API' : 'Publishing API', path: '/admin/api-settings', icon: <Settings size={16} /> },
        { name: isRtl ? 'الدليل' : 'Guides', path: '/admin/docs', icon: <Book size={16} /> },
      ]
    }
  ];

  const userRole = userData?.role || 'user';

  const filteredCategories = navigationCategories.map(category => {
    const allowedItems = category.items.filter(item => {
      const path = item.path;
      
      // Use the centralized robust permission matrix for route access
      if (canManage(userRole, 'settings')) return true; // Super Admins see everything
      
      // Map specific paths to their required capabilities
      if (path === '/admin/articles') return hasCapability(userRole, 'news', 'view');
      if (path === '/admin/violations') return hasCapability(userRole, 'violations', 'view');
      if (path === '/admin/tenders') return hasCapability(userRole, 'tenders', 'view');
      if (path === '/admin/jobs') return hasCapability(userRole, 'jobs', 'view');
      if (path === '/admin/users' || path === '/admin/subscribers') return canManage(userRole, 'users');
      if (path === '/admin/api-settings' || path === '/admin/identity') return canManage(userRole, 'settings');

      // Staff specific restrictions
      if (userRole === 'staff') {
        const restrictedStaffPaths = [
          '/admin/identity',
          '/admin/sectors',
          '/admin/hr',
          '/admin/partners',
          '/admin/custom-lists',
          '/admin/menus'
        ];
        return !restrictedStaffPaths.includes(path);
      }

      // Journalist specific restrictions
      if (userRole === 'journalist') {
        const journalistPaths = [
          '/admin/articles', 
          '/admin/media-center',
          '/admin/podcasts',
          '/admin/videos',
          '/admin/success-stories', 
          '/admin/testimonials', 
          '/admin/media', 
          '/admin/violations',
          '/admin/jobs',
          '/admin/tasks',
          '/admin/volunteers'
        ];
        return journalistPaths.includes(path);
      }

      return true; // Default fallback, but restricted by the above
    });

    return {
      ...category,
      items: allowedItems
    };
  }).filter(category => category.items.length > 0);

  // State to track open dropdown groups
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // Auto-expand groups that contain the currently active route
  useEffect(() => {
    const updatedGroups = { ...openGroups };
    let changed = false;
    filteredCategories.forEach((cat) => {
      const hasActiveChild = cat.items.some(item => location.pathname === item.path);
      if (hasActiveChild && !openGroups[cat.id]) {
        updatedGroups[cat.id] = true;
        changed = true;
      }
    });
    if (changed) {
      setOpenGroups(updatedGroups);
    }
  }, [location.pathname, userRole]);

  const toggleGroup = (id: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const isOverviewActive = location.pathname === '/admin';

  return (
    <div className={`flex min-h-screen ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Sidebar Navigation */}
      <aside className={`w-64 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} border-e flex flex-col sticky top-0 h-screen transition-colors duration-200 shadow-sm z-20`}>
        {/* Sidebar Header */}
        <div className={`p-6 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'} flex items-center justify-between`}>
          <h2 className={`font-black text-lg ${isDark ? 'text-white' : 'text-slate-900'} tracking-tight`}>
            {defaultTitle}
          </h2>
        </div>

        {/* Sidebar Body (Scrollable) */}
        <nav className="flex-1 p-4 overflow-y-auto space-y-1.5 scrollbar-thin">
          {/* Overview Link */}
          <Link
            to="/admin"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
              isOverviewActive 
                ? (isDark ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/10' : 'bg-blue-50 text-blue-600') 
                : (isDark ? 'text-slate-400 hover:bg-slate-800/60 hover:text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900')
            }`}
          >
            <LayoutDashboard size={20} />
            <span>{isRtl ? 'نظرة عامة' : 'Overview'}</span>
          </Link>

          {/* Profile Link */}
          <Link
            to="/admin/profile"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
              location.pathname === '/admin/profile'
                ? (isDark ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/10' : 'bg-blue-50 text-blue-600') 
                : (isDark ? 'text-slate-400 hover:bg-slate-800/60 hover:text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900')
            }`}
          >
            <User size={20} />
            <span>{isRtl ? 'الملف الشخصي' : 'Profile'}</span>
          </Link>

          {/* Spacer */}
          <div className="h-2" />

          {/* Render filtered categories */}
          {filteredCategories.map((category) => {
            const isOpen = !!openGroups[category.id];
            const isChildActive = category.items.some(item => location.pathname === item.path);

            return (
              <div key={category.id} className="space-y-1">
                <button
                  onClick={() => toggleGroup(category.id)}
                  className={cn(
                    "flex items-center justify-between w-full px-4 py-2.5 rounded-xl transition-all font-bold text-sm cursor-pointer border-none bg-transparent outline-none text-start",
                    isChildActive
                      ? (isDark ? 'bg-slate-800/60 text-white border border-slate-700/50' : 'bg-slate-100/60 text-slate-900 border border-slate-100')
                      : (isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900')
                  )}
                >
                  <div className="flex items-center gap-3">
                    {category.icon}
                    <span>{category.name}</span>
                  </div>
                  <ChevronDown
                    size={16}
                    className={cn(
                      "transition-transform duration-200 shrink-0",
                      isOpen && "rotate-180",
                      isRtl ? "mr-auto" : "ml-auto"
                    )}
                  />
                </button>

                {isOpen && (
                  <div className={cn(
                    "pb-1 pt-0.5 space-y-1",
                    isRtl ? "pr-5 border-r mr-4 border-dashed" : "pl-5 border-l ml-4 border-dashed",
                    isDark ? "border-slate-800" : "border-slate-100"
                  )}>
                    {category.items.map((item) => {
                      const isItemActive = location.pathname === item.path;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={cn(
                            "flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-xs font-semibold",
                            isItemActive
                              ? (isDark ? 'bg-blue-600 text-white shadow-md' : 'bg-blue-50 text-blue-600')
                              : (isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800/40' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50')
                          )}
                        >
                          <span className="shrink-0">{item.icon}</span>
                          <span className="truncate">{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className={`p-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          <div className="px-4 py-3 mb-2">
            <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              © 2026 Press House
            </p>
            <p className={`text-[10px] font-bold ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
              All rights reserved.
            </p>
            <div className="mt-2 pt-2 border-t border-slate-100/5">
              <p className={`text-[10px] font-medium ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Powered by</p>
              <p className="text-[11px] font-black text-blue-600 tracking-tight">RaidanPro</p>
            </div>
          </div>
          <button 
            onClick={() => signOut()}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-500 hover:bg-rose-50/50 hover:text-red-600 transition-all font-bold text-sm border-none bg-transparent cursor-pointer text-start outline-none"
          >
            <LogOut size={18} />
            <span>{isRtl ? 'تسجيل الخروج' : 'Logout'}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
