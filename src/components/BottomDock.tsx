import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, Info, Newspaper, ShieldAlert, 
  GraduationCap, MessageSquare, Briefcase, 
  FileText, Mail, LayoutDashboard, Cpu, Calendar, Menu, X, Globe, LogIn, LogOut,
  Settings, User, HelpCircle, Link as LinkIcon, Award, Film, Play
} from 'lucide-react';

const ICON_MAP: Record<string, React.ReactNode> = {
  Home: <Home size={22} />,
  Info: <Info size={22} />,
  Newspaper: <Newspaper size={22} />,
  ShieldAlert: <ShieldAlert size={22} />,
  GraduationCap: <GraduationCap size={22} />,
  MessageSquare: <MessageSquare size={22} />,
  Briefcase: <Briefcase size={22} />,
  FileText: <FileText size={22} />,
  Mail: <Mail size={22} />,
  LayoutDashboard: <LayoutDashboard size={22} />,
  Calendar: <Calendar size={22} />,
  Globe: <Globe size={22} />,
  Cpu: <Cpu size={22} />,
  Settings: <Settings size={22} />,
  User: <User size={22} />,
  HelpCircle: <HelpCircle size={22} />,
  Link: <LinkIcon size={22} />,
  Award: <Award size={22} />,
  Film: <Film size={22} />,
  Play: <Play size={22} />,
};
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, type MotionValue } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../context/AuthContext';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NavItemProps {
  mouseX: MotionValue<number>;
  link: { name: string; path: string; icon: React.ReactNode };
  isActive: boolean;
  isRtl: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ mouseX, link, isActive, isRtl }) => {
  const ref = useRef<HTMLDivElement>(null);

  const distance = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distance, [-150, 0, 150], [44, 70, 44]);
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

  return (
    <Link to={link.path} className="relative group" onClick={() => window.scrollTo(0, 0)}>
      <motion.div
        ref={ref}
        style={{ width }}
        className={cn(
          "aspect-square rounded-2xl flex items-center justify-center transition-colors relative",
          isActive 
            ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
            : "bg-white/80 backdrop-blur-md text-slate-600 hover:bg-white hover:text-blue-600 border border-white/20 shadow-sm"
        )}
      >
        {link.icon}
        
        {isActive && (
          <motion.div 
            layoutId="active-dot"
            className="absolute -bottom-1.5 w-1 h-1 bg-blue-600 rounded-full"
          />
        )}
      </motion.div>

      <AnimatePresence>
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
          {link.name}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </div>
      </AnimatePresence>
    </Link>
  );
}

const ADMIN_PATH = import.meta.env.VITE_ADMIN_PATH || '/admin';
const ROOT_PATH = import.meta.env.VITE_ROOT_PATH || '/root';

export default function BottomDock() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [isOpen, setIsOpen] = React.useState(false);
  const { user, userData, signOut: handleLogout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const mouseX = useMotionValue(Infinity);
  const [navLinks, setNavLinks] = React.useState<any[]>([]);

  React.useEffect(() => {
    const fetchMenus = async () => {
      try {
        const response = await fetch('/api/menus');
        if (response.ok) {
          const data = await response.json();
          const dockLinks = data
            .filter((m: any) => m.location === 'dock' && (m.isActive === 1 || m.isActive === true))
            .map((m: any) => ({
              name: isRtl ? JSON.parse(m.title).ar : JSON.parse(m.title).en,
              path: m.path,
              icon: ICON_MAP[m.icon] || <LinkIcon size={22} />
            }));
          
          if (dockLinks.length > 0) {
            setNavLinks(dockLinks);
          } else {
            // Fallback
            setNavLinks([
              { name: t('nav.home'), path: '/', icon: <Home size={22} /> },
              { name: t('nav.about'), path: '/about', icon: <Info size={22} /> },
              { name: t('nav.news'), path: '/news', icon: <Newspaper size={22} /> },
              { name: isRtl ? 'الفعاليات' : 'Events', path: '/events', icon: <Calendar size={22} /> },
              { name: isRtl ? 'سينما الأربعاء' : 'Cinema', path: '/cinema', icon: <Film size={22} /> },
              { name: isRtl ? 'المشاريع' : 'Projects', path: '/projects', icon: <LayoutDashboard size={22} /> },
              { name: t('nav.violations'), path: '/violations', icon: <ShieldAlert size={22} /> },
              { name: t('nav.academy'), path: '/academy', icon: <GraduationCap size={22} /> },
              { name: t('nav.jobs'), path: '/jobs', icon: <Briefcase size={22} /> },
              { name: t('nav.tenders'), path: '/tenders', icon: <FileText size={22} /> },
              { name: t('nav.contact'), path: '/contact', icon: <Mail size={22} /> },
            ]);
          }
        }
      } catch (err) {
        console.error("Error fetching dock menus:", err);
      }
    };
    fetchMenus();
  }, [isRtl, t]);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  };

  return (
    <footer className="fixed bottom-6 left-0 right-0 z-[100] flex justify-center px-6 pointer-events-none">
      <div className="pointer-events-auto flex justify-center">
        <motion.nav 
          onMouseMove={(e) => mouseX.set(e.pageX)}
          onMouseLeave={() => mouseX.set(Infinity)}
          className="hidden lg:flex items-center gap-1.5 px-2 py-1.5 bg-white/40 backdrop-blur-xl border border-white/40 rounded-[20px] shadow-2xl shadow-black/5"
        >
          <div className="flex items-center gap-2">
            {navLinks.map((link) => (
              <NavItem key={link.path} mouseX={mouseX} link={link} isActive={location.pathname === link.path} isRtl={isRtl} />
            ))}
          </div>

          <div className="w-px h-8 bg-slate-200/50 mx-1" />

          <div className="flex items-center gap-2">
            <button onClick={toggleLanguage} className="w-11 h-11 rounded-2xl bg-white/80 backdrop-blur-md text-slate-600 hover:text-blue-600 flex flex-col items-center justify-center border border-white/20 shadow-sm transition-colors">
              <Globe size={18} />
              <span className="text-[8px] font-black uppercase leading-none mt-0.5">{i18n.language === 'ar' ? 'EN' : 'AR'}</span>
            </button>

            {user ? (
              <div className="flex items-center gap-2 ml-1">
                <button onClick={handleLogout} className="w-11 h-11 rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-colors">
                  <LogOut size={20} />
                </button>
                <Link to={userData?.role === 'root' ? ROOT_PATH : userData?.role === 'admin' ? ADMIN_PATH : userData?.role === 'staff' ? '/staff' : '/profile'} onClick={() => window.scrollTo(0, 0)}>
                  <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} alt="Avatar" className="w-11 h-11 rounded-2xl border-2 border-white shadow-sm object-cover" />
                </Link>
              </div>
            ) : (
              <button onClick={() => navigate('/login')} className="w-11 h-11 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center transition-colors shadow-lg shadow-blue-200">
                <LogIn size={20} />
              </button>
            )}
          </div>
        </motion.nav>

        <div className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-xl border border-white/40 rounded-full shadow-xl">
          <div className="flex-1" />
          <button onClick={toggleLanguage} className="p-2 text-slate-600"><Globe size={20} /></button>
          <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-full bg-slate-100 text-slate-600">{isOpen ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="fixed bottom-24 left-4 right-4 lg:hidden bg-white/90 backdrop-blur-2xl rounded-[32px] shadow-2xl border border-white/40 overflow-hidden pointer-events-auto">
            <div className="p-6 grid grid-cols-3 gap-4">
              {navLinks.map((link) => (
                <motion.div key={link.path} whileTap={{ scale: 0.9 }}>
                  <Link to={link.path} onClick={() => { setIsOpen(false); window.scrollTo(0, 0); }} className={cn("flex flex-col items-center gap-2 p-3 rounded-2xl transition-all w-full", location.pathname === link.path ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "bg-slate-50 text-slate-600 hover:bg-blue-50")}>
                    {link.icon}
                    <span className="text-[10px] font-bold text-center">{link.name}</span>
                  </Link>
                </motion.div>
              ))}
            </div>
            <div className="p-6 bg-slate-50/50 border-t border-slate-100 space-y-4">
              {user ? (
                <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <img src={user.photoURL} alt="Avatar" className="w-10 h-10 rounded-full" />
                    <div className="text-start">
                      <div className="text-sm font-bold text-slate-900">{user.displayName}</div>
                      <div className="text-[10px] text-slate-500">{user.email}</div>
                    </div>
                  </div>
                  <button onClick={handleLogout} className="p-2 text-red-600 hover:bg-red-50 rounded-xl"><LogOut size={20} /></button>
                </div>
              ) : (
                <button onClick={() => { setIsOpen(false); navigate('/login'); }} className="w-full py-4 rounded-2xl bg-blue-600 text-white font-bold">{isRtl ? 'تسجيل الدخول' : 'Login'}</button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </footer>
  );
}
