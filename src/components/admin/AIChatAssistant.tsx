import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bot, Send, X, User, Loader2, Sparkles, Check, Server } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../../services/api';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  action?: string;
  data?: any;
  timestamp: Date;
}

export function AIChatAssistant() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: isRtl 
        ? 'مرحباً بك في وحدة التحكم الذكية لبيت الصحافة! أنا مساعدك الإداري المدعوم بالذكاء الاصطناعي. يمكنك أن تطلب مني أي شيء، مثل:\n\n✍️ "انشر خبراً بعنوان (...) ومحتوى (...)"\n🌱 "أضف مشروعاً جديداً باسم (...)"\n📅 "أضف فعالية باسم (...) وتفاصيل (...)"\n👤 "أضف مستخدماً جديداً ببريد (...)"'
        : 'Welcome to PressHouse Smart Control! I am your AI admin assistant. You can ask me to perform tasks like creating articles, projects, events, or users directly.',
      timestamp: new Date()
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const prompt = textToSend || input;
    if (!prompt.trim() || loading) return;

    if (!textToSend) {
      setInput('');
    }

    const userMsg: Message = {
      id: Math.random().toString(),
      sender: 'user',
      text: prompt,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await api.post('/api/ai/admin-chat', { prompt });
      const data = response.data;

      const assistantMsg: Message = {
        id: Math.random().toString(),
        sender: 'assistant',
        text: data.text || data.response || (isRtl ? 'تمت معالجة الطلب بنجاح' : 'Request processed successfully'),
        action: data.action,
        data: data.data,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      const assistantMsg: Message = {
        id: Math.random().toString(),
        sender: 'assistant',
        text: isRtl 
          ? `⚠️ حدث خطأ أثناء تنفيذ الأمر الإداري: ${err.response?.data?.message || err.message}`
          : `⚠️ Error executing administrative command: ${err.response?.data?.message || err.message}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMsg]);
    } finally {
      setLoading(false);
    }
  };

  const suggestionChips = isRtl ? [
    { label: '✍️ نشر خبر صحفي سريع', prompt: 'انشر خبر صحفي سريع بعنوان "بيان عاجل حول حرية التعبير في تعز" وبمضمون "يعبر بيت الصحافة عن تطلعه لتعزيز الحريات الصحفية وحماية الصحفيين من كل أشكال الاستهداف والاضطهاد."' },
    { label: '🌱 إضافة مشروع جديد', prompt: 'أضف مشروعاً صحفياً متميزاً باسم "صندوق دعم الحريات والتقارير الاستقصائية باليمن" ويكون بحالةongoing' },
    { label: '📅 إضافة ندوة أو فعالية', prompt: 'أضف فعالية جديدة بعنوان "الندوة الوطنية لحماية البيئة الصحفية في عدن" وتفاصيل "ورشة نقاشية وحوارية مكثفة بمشاركة ممثلي الصحف المحلية والمنظمات الدولية."' },
    { label: '👤 إنشاء حساب موظف', prompt: 'أضف مستخدماً جديداً ببريد "ali.press@ph-ye.org" وباسم "علي الصحفي" وبصلاحيةjournalist' }
  ] : [
    { label: '✍️ Post quick news', prompt: 'Publish a quick news article titled "Urgent updates on media freedom in Taiz" with content "Press House expresses its commitment to fostering media protection and supporting independent journalists in Yemen."' },
    { label: '🌱 Add project', prompt: 'Add a new project titled "Yemeni Investigative Journalism Support Fund" with status ongoing' },
    { label: '📅 Create new event', prompt: 'Add a new event titled "National Summit for Press Protection in Aden" with details "Panel sessions with local journalists and global trainers."' }
  ];

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        id="ai-control-assistant-trigger"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 s-6 z-50 bg-slate-900 border border-slate-800 text-amber-400 hover:text-white p-4 rounded-full shadow-2xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all cursor-pointer group"
        style={{ left: isRtl ? '24px' : 'auto', right: isRtl ? 'auto' : '24px' }}
      >
        <Sparkles className="w-6 h-6 animate-pulse text-amber-400 group-hover:scale-110 transition-transform" />
        <span className="text-xs font-black tracking-wider uppercase hidden md:inline ml-1 text-slate-100">
          {isRtl ? 'المساعد الذكي' : 'AI Assistant'}
        </span>
      </button>

      {/* Sliding Slideover Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            {/* Sidebar Slide Panel */}
            <motion.div
              initial={{ x: isRtl ? '-100%' : '100%' }}
              animate={{ x: 0 }}
              exit={{ x: isRtl ? '-100%' : '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-lg bg-slate-900 border-l border-slate-800 text-slate-100 flex flex-col h-full shadow-2xl mr-auto"
              style={{ direction: isRtl ? 'rtl' : 'ltr' }}
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20 text-amber-400">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-base flex items-center gap-2">
                      {isRtl ? 'المساعد الإداري الذكي' : 'Smart Admin Assistant'}
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <Server className="w-2.5 h-2.5" />
                        CMS AI
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400">{isRtl ? 'تنفيذ تلقائي وتعديل المحتوى عبر الدردشة' : 'Automated task execution and content editor'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Messages Center */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-900/60 scrollbar-thin">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 max-w-[90%] ${
                      msg.sender === 'user' ? (isRtl ? 'mr-auto flex-row-reverse' : 'ml-auto flex-row-reverse') : ''
                    }`}
                  >
                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                      msg.sender === 'user' 
                        ? 'bg-slate-800 border-slate-700 text-slate-300' 
                        : 'bg-amber-950 border-amber-900/50 text-amber-400'
                    }`}>
                      {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    {/* Speech Text Box */}
                    <div className="space-y-2">
                      <div className={`p-4 rounded-2xl text-sm whitespace-pre-line leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-blue-600 text-white rounded-tr-none'
                          : 'bg-slate-800 text-slate-150 border border-slate-750 rounded-tl-none'
                      }`}>
                        {msg.text}
                      </div>

                      {/* Display Action Executed Metadata */}
                      {msg.action && msg.action !== 'none' && (
                        <div className="bg-slate-950/80 border border-slate-850 rounded-xl p-3 text-[11px] font-mono text-emerald-400 flex flex-col gap-1.5 shadow-inner">
                          <div className="flex items-center gap-1.5 font-bold uppercase text-slate-300 border-b border-slate-800/60 pb-1 mb-1">
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            {isRtl ? 'إجراء تم بنجاح في قاعدة البيانات' : 'Successfully Comitted Database Action'}
                          </div>
                          <div><b>Action:</b> {msg.action}</div>
                          {msg.data && (
                            <pre className="max-h-24 overflow-y-auto text-slate-400 text-[10px] scrollbar-thin">
                              {JSON.stringify(msg.data, null, 2)}
                            </pre>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-3 max-w-[90%]">
                    <div className="w-8 h-8 rounded-lg bg-amber-950 border border-amber-900/50 text-amber-400 flex items-center justify-center">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                    <div className="p-4 bg-slate-800 rounded-2xl rounded-tl-none text-slate-400 text-xs flex items-center gap-2 border border-slate-750">
                      <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                      {isRtl ? 'جاري تحليل الأمر الإداري وتنفيذه...' : 'Processing administrative task...'}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Suggestion Chips */}
              {messages.length <= 2 && (
                <div className="px-6 py-2 border-t border-slate-800 bg-slate-950/40">
                  <p className="text-xs text-slate-400 mb-2 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    {isRtl ? 'اقتراحات سريعة بنقرة واحدة:' : 'Quick tasks:'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestionChips.map((chip, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(chip.prompt)}
                        className="text-[11px] bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg transition-all text-right cursor-pointer"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Action Center */}
              <div className="p-4 border-t border-slate-800 bg-slate-950">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={loading}
                    placeholder={
                      isRtl 
                        ? 'اكتب أمرك الإداري هنا... (مثال: أضف خبراً جديداً)' 
                        : 'Ask me to perform any administrative action...'
                    }
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="bg-amber-500 hover:bg-amber-600 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 px-4 py-3 rounded-xl transition-all font-bold flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
