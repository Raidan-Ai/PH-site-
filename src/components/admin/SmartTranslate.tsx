import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Loader2, Check } from 'lucide-react';
import { api } from '../../services/api';

interface SmartTranslateProps {
  text: string;
  onTranslate: (translated: string) => void;
  targetLanguage?: 'en' | 'ar';
}

export const SmartTranslate: React.FC<SmartTranslateProps> = ({ 
  text, 
  onTranslate,
  targetLanguage = 'en'
}) => {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleTranslate = async () => {
    if (!text || !text.trim()) {
      alert(isRtl ? 'الرجاء إدخال نص أولاً لترجمته' : 'Please input text to translate first');
      return;
    }
    
    setLoading(true);
    setSuccess(false);
    try {
      const response = await api.post('/api/ai/translate', {
        text,
        targetLanguage
      });
      if (response.data && response.data.text) {
        onTranslate(response.data.text.trim());
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      }
    } catch (err) {
      console.error('AI translation error:', err);
      alert(isRtl ? 'عذراً، فشل الاتصال بمساعد الترجمة الذكي.' : 'AI Translation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleTranslate}
      disabled={loading || !text}
      className={`px-3 py-1.5 rounded-xl border text-[11px] font-black flex items-center gap-1.5 transition-all select-none active:scale-95 disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed ${
        success 
          ? 'bg-emerald-50 border-emerald-250 text-emerald-700' 
          : 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700'
      }`}
      title={isRtl ? 'ترجمة ذكية فورية عبر المساعد الذكي' : 'Smart AI instant translation'}
    >
      {loading ? (
        <Loader2 size={12} className="animate-spin text-indigo-600" />
      ) : success ? (
        <Check size={12} className="text-emerald-600" />
      ) : (
        <Sparkles size={12} className="text-indigo-500 animate-pulse" />
      )}
      <span>
        {loading 
          ? (isRtl ? 'جاري الصياغة...' : 'Translating...') 
          : success 
            ? (isRtl ? 'تمت الترجمة!' : 'Translated!') 
            : (isRtl ? 'ترجمة ذكية' : 'AI Translate')
        }
      </span>
    </button>
  );
};
