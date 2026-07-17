import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

interface AdminLink {
  name: string;
  path?: string;
  icon?: React.ReactNode;
  children?: { name: string; path: string; icon?: React.ReactNode }[];
}

interface AdminLayoutProps {
  title: string;
  links: AdminLink[];
  children: React.ReactNode;
  theme?: 'dark' | 'light';
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ title, links, children, theme = 'light' }) => {
  const { i18n } = useTranslation();
  const { signOut } = useAuth();
  const isRtl = i18n.language === 'ar';
  const location = useLocation();

  const isDark = theme === 'dark';

  // State to track open dropdown groups
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // Auto-expand groups that contain the currently active route
  useEffect(() => {
    const updatedGroups = { ...openGroups };
    let changed = false;
    links.forEach((link) => {
      if (link.children) {
        const hasActiveChild = link.children.some(child => location.pathname === child.path);
        if (hasActiveChild && !openGroups[link.name]) {
          updatedGroups[link.name] = true;
          changed = true;
        }
      }
    });
    if (changed) {
      setOpenGroups(updatedGroups);
    }
  }, [location.pathname, links]);

  const toggleGroup = (name: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  return (
    <div className={`flex min-h-screen ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
      {/* Sidebar */}
      <aside className={`w-64 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} border-e flex flex-col sticky top-0 h-screen`}>
        <div className={`p-6 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          <h2 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</h2>
        </div>
        <nav className="flex-1 p-4 overflow-y-auto space-y-1 scrollbar-thin">
          {links.map((link) => {
            const hasChildren = !!link.children && link.children.length > 0;
            const isOpen = !!openGroups[link.name];

            if (hasChildren) {
              const isChildActive = link.children?.some(child => location.pathname === child.path);
              return (
                <div key={link.name} className="space-y-1">
                  <button
                    onClick={() => toggleGroup(link.name)}
                    className={cn(
                      "flex items-center justify-between w-full px-4 py-2.5 rounded-xl transition-all font-bold text-sm cursor-pointer border-none bg-transparent outline-none text-start",
                      isChildActive
                        ? (isDark ? 'bg-slate-800/50 text-white' : 'bg-slate-50 text-slate-900')
                        : (isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900')
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {link.icon}
                      <span>{link.name}</span>
                    </div>
                    <ChevronDown
                      size={16}
                      className={cn(
                        "transition-transform duration-200",
                        isOpen && "rotate-180",
                        isRtl ? "mr-auto" : "ml-auto"
                      )}
                    />
                  </button>
                  {isOpen && (
                    <div className={cn(
                      "pb-2 space-y-1",
                      isRtl ? "pr-6 border-r mr-4 border-dashed" : "pl-6 border-l ml-4 border-dashed",
                      isDark ? "border-slate-800/50" : "border-slate-100"
                    )}>
                      {link.children?.map((child) => {
                        const isChildLinkActive = location.pathname === child.path;
                        return (
                          <Link
                            key={child.path}
                            to={child.path}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-xs font-semibold",
                              isChildLinkActive
                                ? (isDark ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600')
                                : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900')
                            )}
                          >
                            {child.icon}
                            <span>{child.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path!}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? (isDark ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600') 
                    : (isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900')
                }`}
              >
                {link.icon}
                <span className="font-bold text-sm">{link.name}</span>
              </Link>
            );
          })}
        </nav>
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
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-500 hover:bg-red-50 transition-all font-bold text-sm"
          >
            <LogOut size={18} />
            <span>{isRtl ? 'تسجيل الخروج' : 'Logout'}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
