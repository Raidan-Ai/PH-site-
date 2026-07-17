import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, X, Calendar, FileText, Briefcase, 
  Newspaper, MessageSquare, Sliders, HelpCircle, ArrowRight, CornerDownLeft
} from 'lucide-react';
import { api } from '../services/api';

interface SpotlightSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SpotlightSearch: React.FC<SpotlightSearchProps> = ({ isOpen, onClose }) => {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle hotkeys (Cmd+K / Ctrl+K, Esc, Arrow keys, Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
      
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        handleNavigate(results[selectedIndex].path);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  // Live search debounced
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await api.get('/api/search', {
          params: { q: query, category: 'all', timeframe: 'all' }
        });
        setResults(response.data || []);
        setSelectedIndex(0);
      } catch (err) {
        console.error('Spotlight search API error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
    window.scrollTo(0, 0);
  };

  const getSectionBadge = (section: string) => {
    switch (section) {
      case 'news':
        return { 
          label: isRtl ? 'خبر' : 'News', 
          style: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
          icon: <Newspaper size={12} />
        };
      case 'report':
        return { 
          label: isRtl ? 'تقرير' : 'Report', 
          style: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
          icon: <FileText size={12} />
        };
      case 'event':
        return { 
          label: isRtl ? 'فعالية' : 'Event', 
          style: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          icon: <Calendar size={12} />
        };
      case 'job':
        return { 
          label: isRtl ? 'وظيفة' : 'Job', 
          style: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
          icon: <Briefcase size={12} />
        };
      case 'tender':
        return { 
          label: isRtl ? 'مناقصة' : 'Tender', 
          style: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
          icon: <FileText size={12} />
        };
      case 'project':
        return { 
          label: isRtl ? 'مشروع' : 'Project', 
          style: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          icon: <Sliders size={12} />
        };
      case 'forum':
        return { 
          label: isRtl ? 'منتدى' : 'Forum', 
          style: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
          icon: <MessageSquare size={12} />
        };
      default:
        return { 
          label: isRtl ? 'محتوى' : 'Content', 
          style: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
          icon: <HelpCircle size={12} />
        };
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (resultsRef.current && results.length > 0) {
      const activeEl = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        const container = resultsRef.current;
        const elemTop = activeEl.offsetTop;
        const elemBottom = elemTop + activeEl.clientHeight;
        const containerTop = container.scrollTop;
        const containerBottom = containerTop + container.clientHeight;

        if (elemTop < containerTop) {
          container.scrollTop = elemTop;
        } else if (elemBottom > containerBottom) {
          container.scrollTop = elemBottom - container.clientHeight;
        }
      }
    }
  }, [selectedIndex, results]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-start justify-center pt-16 md:pt-28 px-4" dir={isRtl ? 'rtl' : 'ltr'}>
          {/* Backdrop Blur Focus */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md"
          />

          {/* Centered Spotlight Box */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ type: "spring", duration: 0.3, bounce: 0.1 }}
            className="bg-white/40 border border-white/40 backdrop-blur-2xl rounded-3xl w-full max-w-2xl overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.12)] relative z-10"
          >
            {/* Input Bar */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/20">
              <Search className="text-slate-500 shrink-0" size={20} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={isRtl ? 'ابحث عن المقالات، التقارير، الفعاليات، الوظائف، المناقصات...' : 'Search articles, reports, activities, careers, tenders...'}
                className="w-full bg-transparent text-slate-900 placeholder:text-slate-450 outline-none border-none text-sm md:text-base font-bold"
              />
              {loading ? (
                <div className="w-5 h-5 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin shrink-0" />
              ) : (
                query && (
                  <button 
                    onClick={() => setQuery('')}
                    className="p-1 hover:bg-black/5 text-slate-500 hover:text-black rounded-full transition-colors border-none bg-transparent cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                )
              )}
            </div>

            {/* Results Area */}
            <div className="max-h-[360px] overflow-y-auto bg-white/10" ref={resultsRef}>
              {results.length > 0 ? (
                results.map((item, index) => {
                  const isSelected = index === selectedIndex;
                  const badge = getSectionBadge(item.section);
                  return (
                    <div
                      key={`${item.section}-${item.id}-${index}`}
                      onClick={() => handleNavigate(item.path)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`flex items-start gap-4 px-5 py-3.5 transition-all cursor-pointer border-b border-white/10 last:border-none ${
                        isSelected 
                          ? 'bg-blue-600 text-white shadow-lg' 
                          : 'text-slate-800 hover:bg-white/60'
                      }`}
                    >
                      {item.image ? (
                        <img 
                          src={item.image} 
                          alt="" 
                          className="w-12 h-12 object-cover rounded-xl shrink-0 border border-slate-200" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className={`w-12 h-12 flex items-center justify-center rounded-xl shrink-0 ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                          {badge.icon}
                        </div>
                      )}

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-wide border uppercase ${
                            isSelected ? 'bg-white/20 text-white border-white/30' : badge.style
                          }`}>
                            {badge.label}
                          </span>
                          <span className={`text-[10px] font-mono ${isSelected ? 'text-white/80' : 'text-slate-450'}`}>
                            {new Date(item.date).toLocaleDateString(isRtl ? 'ar-YE' : 'en-US')}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold truncate">
                          {item.title[i18n.language] || item.title.ar || item.title.en}
                        </h4>
                      </div>

                      {isSelected && (
                        <span className="text-white/85 flex items-center gap-1.5 text-[10px] font-bold font-mono">
                          {isRtl ? 'انقر أو انتر' : 'Enter'}
                          <CornerDownLeft size={12} />
                        </span>
                      )}
                    </div>
                  );
                })
              ) : query.trim() ? (
                <div className="px-5 py-10 text-center text-slate-600 space-y-2">
                  <p className="text-sm font-bold">{isRtl ? 'لا توجد نتائج تطابق بحثك' : 'No results found'}</p>
                  <p className="text-xs text-slate-500">{isRtl ? 'حاول استخدام مصطلحات أدق أو أشمل.' : 'Try search keywords that are more generic.'}</p>
                </div>
              ) : (
                <div className="px-5 py-8 text-slate-600 text-center space-y-1">
                  <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                    {isRtl ? 'خدمة البحث الفوري الممتازة' : 'Spotlight Search'}
                  </p>
                  <p className="text-[11px] max-w-sm mx-auto leading-relaxed text-slate-500">
                    {isRtl 
                      ? 'بحث متكامل في الوقت الفعلي في الأخبار، التقارير، الفعاليات والمستندات.' 
                      : 'Real-time database queries across columns of events, reports, tenders and jobs.'}
                  </p>
                </div>
              )}
            </div>

            {/* Footer Commands Guide */}
            <div className="bg-white/30 backdrop-blur-md px-5 py-3 flex justify-between items-center text-[10px] text-slate-500 font-black border-t border-white/20">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="bg-white/80 border border-slate-200 px-1 py-0.5 rounded-md text-[9px] shadow-sm">↑↓</kbd>
                  {isRtl ? 'للتنقل' : 'Navigate'}
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="bg-white/80 border border-slate-200 px-1 py-0.5 rounded-md text-[9px] shadow-sm">Enter</kbd>
                  {isRtl ? 'للاختيار' : 'Select'}
                </span>
              </div>
              <span className="flex items-center gap-1">
                <kbd className="bg-white/80 border border-slate-200 px-1 py-0.5 rounded-md text-[9px] shadow-sm">Esc</kbd>
                {isRtl ? 'للإغلاق' : 'Close'}
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
