import React from 'react';
import { useTranslation } from 'react-i18next';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin, Globe, ArrowUpRight, Heart, Newspaper, ShieldAlert, GraduationCap, Briefcase } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import NewsletterSignup from './NewsletterSignup';

export default function Footer() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [footerLinks, setFooterLinks] = React.useState<any[]>([]);

  React.useEffect(() => {
    const fetchMenus = async () => {
      try {
        const response = await fetch('/api/menus');
        if (response.ok) {
          const data = await response.json();
          const links = data
            .filter((m: any) => m.location === 'footer' && (m.isActive === 1 || m.isActive === true))
            .map((m: any) => {
              const Icon = m.icon === 'Newspaper' ? Newspaper : m.icon === 'ShieldAlert' ? ShieldAlert : m.icon === 'GraduationCap' ? GraduationCap : m.icon === 'Briefcase' ? Briefcase : Globe;
              return {
                name: isRtl ? JSON.parse(m.title).ar : JSON.parse(m.title).en,
                path: m.path,
                icon: Icon
              };
            });
          
          if (links.length > 0) {
            setFooterLinks(links);
          } else {
            setFooterLinks([
              { name: t('nav.news'), path: '/news', icon: Newspaper },
              { name: t('nav.violations'), path: '/violations', icon: ShieldAlert },
              { name: t('nav.academy'), path: '/academy', icon: GraduationCap },
              { name: t('nav.jobs'), path: '/jobs', icon: Briefcase },
            ]);
          }
        }
      } catch (err) {
        console.error("Error fetching footer menus:", err);
      }
    };
    fetchMenus();
  }, [isRtl, t]);

  const socialLinks = [
    { icon: Facebook, color: 'hover:text-blue-500', path: 'https://facebook.com/presshoue' },
    { icon: Twitter, color: 'hover:text-sky-400', path: 'https://twitter.com/presshoue' },
    { icon: Instagram, color: 'hover:text-pink-500', path: 'https://instagram.com/presshoue' },
  ];

  return (
    <footer className="bg-slate-950 text-slate-400 pt-20 pb-40 overflow-hidden relative border-t border-white/5">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-[120px]" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-16 mb-16">
          {/* Brand Section */}
          <div className="lg:col-span-4 space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-2xl shadow-blue-600/20">
                P
              </div>
              <div>
                <h2 className="text-white font-black text-2xl tracking-tight">بيت الصحافة</h2>
                <p className="text-[10px] text-blue-500 font-black uppercase tracking-[0.3em]">Press House Foundation</p>
              </div>
            </div>
            
            <p className="text-base leading-relaxed font-medium max-w-sm">
              {isRtl 
                ? "مؤسسة مجتمع مدني تهدف إلى تعزيز حرية الإعلام وخلق مساحة نقاش مهني وعملي للصحفيين والصحفيات، وتبني قضاياهم والعمل على تطوير ودعم الصحافة في اليمن."
                : "A civil society organization aiming to promote media freedom and create a professional space for journalists, adopting their causes and supporting journalism in Yemen."}
            </p>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-white font-black text-xs uppercase tracking-[0.3em]">{isRtl ? "روابط سريعة" : "Quick Links"}</h3>
            <ul className="space-y-3">
              {footerLinks.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="group flex items-center gap-3 hover:text-white transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <link.icon size={12} />
                    </div>
                    <span className="text-sm font-bold">{link.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Newsletter */}
          <div className="lg:col-span-6 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="text-white font-black text-xs uppercase tracking-[0.3em]">{isRtl ? "اتصل بنا" : "Contact Us"}</h3>
                <ul className="space-y-5">
                  <li className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-blue-500 shrink-0">
                      <Mail size={18} />
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Email</div>
                      <a href="mailto:info@phye.org" className="text-sm font-bold text-slate-300 hover:text-white transition-colors">info@phye.org</a>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-blue-500 shrink-0">
                      <Phone size={18} />
                    </div>
                    <div className="space-y-4">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Phone</div>
                        <a href="tel:04210613" className="text-sm font-bold text-slate-300 hover:text-white transition-colors" dir="ltr">04-210613</a>
                      </div>
                      
                      <div className="flex gap-3 pt-2">
                        {socialLinks.map((social, i) => (
                          <a 
                            key={i} 
                            href={social.path} 
                            className={`w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 transition-all duration-300 ${social.color} hover:bg-white/10 hover:scale-110`}
                          >
                            <social.icon size={14} />
                          </a>
                        ))}
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
              
              <div className="space-y-6">
                <h3 className="text-white font-black text-xs uppercase tracking-[0.3em]">{isRtl ? "النشرة البريدية" : "Newsletter"}</h3>
                <NewsletterSignup source="Footer" variant="footer" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 text-xs font-medium text-slate-500">
            <p>© {new Date().getFullYear()} Press House. All rights reserved.</p>
          </div>

          <div className="flex items-center gap-6 text-xs font-medium text-slate-500">
            <Link to="/terms" className="hover:text-white transition-colors">{t('nav.terms')}</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">{t('nav.privacy')}</Link>
            <Link to="/policy" className="hover:text-white transition-colors">{t('nav.workplace')}</Link>
          </div>

          <div className="flex items-center gap-6 text-xs font-medium text-slate-500">
            <p className="flex items-center gap-1">
              Powered by 
              <a href="https://raidan.pro" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400 font-bold transition-colors">RaidanPro</a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
