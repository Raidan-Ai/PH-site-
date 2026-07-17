import React from 'react';
import { X, Facebook, Twitter, Linkedin, Link as LinkIcon, Mail, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
  description?: string;
  thumbnail?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, title, url, description, thumbnail }) => {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const shareLinks = [
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-[#1877F2]',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
      name: 'Twitter',
      icon: Twitter,
      color: 'bg-[#1DA1F2]',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-[#25D366]',
      href: `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`,
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'bg-[#0077B5]',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'bg-slate-600',
      href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(description ? description + '\n\n' + url : url)}`,
    },
  ];

  const copyToClipboard = () => {
    navigator.clipboard.writeText(url);
    alert(isRtl ? 'تم نسخ الرابط!' : 'Link copied to clipboard!');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden"
          >
            <div className="p-8 space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-slate-900">
                  {isRtl ? 'مشاركة الفعالية' : 'Share Event'}
                </h3>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              {thumbnail && (
                <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-inner border border-slate-100">
                  <img src={thumbnail} alt={title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                {shareLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-3 group"
                  >
                    <div className={`w-14 h-14 ${link.color} text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <link.icon size={24} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      {link.name}
                    </span>
                  </a>
                ))}
                <button
                  onClick={copyToClipboard}
                  className="flex flex-col items-center gap-3 group"
                >
                  <div className="w-14 h-14 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <LinkIcon size={24} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {isRtl ? 'نسخ الرابط' : 'Copy Link'}
                  </span>
                </button>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  {isRtl ? 'رابط الفعالية' : 'Event Link'}
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={url}
                    className="flex-1 bg-transparent text-xs font-medium text-slate-600 outline-none"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
