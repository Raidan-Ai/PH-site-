import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, Loader2, X, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateGroundedContent } from '../services/AIService';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  sources?: { title: string; uri: string }[];
}

export const AIAssistant: React.FC = () => {
  const { i18n } = useTranslation();
  const { userData } = useAuth();
  const isRtl = i18n.language === 'ar';
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Messages History List
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Scroll to bottom on updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Initial greeting
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'init',
          sender: 'bot',
          text: isRtl
            ? 'مرحباً بك! أنا مساعدك الذكي لمنصة بيت الصحافة (PressHouse). كيف يمكنني مساعدتك اليوم؟\n\n💬 يمكنك سؤالي عن الفعاليات والوظائف والتقارير المنشورة بالموقع.'
            : 'Welcome! I am your AI assistant for the PressHouse platform. How can I assist you today?\n\n💬 You can ask me about events, jobs, or reports published on our site.'
        }
      ]);
    }
  }, [isRtl, messages.length]);

  // Main Handle message submit
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    const userInput = prompt.trim();
    setPrompt('');

    // Append user query to chat history
    setMessages(prev => [
      ...prev,
      { id: `user-${Date.now()}`, sender: 'user', text: userInput }
    ]);

    // Normal AI Q&A Chat Mode
    setLoading(true);
    try {
      const data = await generateGroundedContent(userInput);
      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: data.text,
          sources: data.sources
        }
      ]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: 'bot',
          text: isRtl 
            ? 'عذراً، لم أتمكن من الاستجابة لطلبك في الوقت الحالي.' 
            : 'Sorry, I am unable to reply to your message right now.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Toggle Action Assistant Button */}
      <motion.button
        id="ai-assistant-toggle"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-[100] w-16 h-16 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-blue-700 transition-colors"
      >
        <Sparkles size={24} className="animate-pulse" />
      </motion.button>

      {/* Interactive Chat Board Portal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="ai-assistant-panel"
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="fixed bottom-28 right-8 z-[101] w-[460px] max-w-[calc(100vw-48px)] h-[620px] max-h-[calc(100vh-140px)] bg-white rounded-[32px] shadow-2xl border border-slate-100 flex flex-col overflow-hidden"
          >
            {/* Header branding */}
            <div className="p-6 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex justify-between items-center shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                  <Sparkles size={20} className="text-blue-200 fill-blue-200" />
                </div>
                <div>
                  <span className="font-black text-sm block">{isRtl ? 'المساعد التفاعلي الذكي' : 'Smart AI Assistant'}</span>
                  <span className="text-[10px] text-blue-200 block">{isRtl ? 'بوابتك للتواصل مع بيت الصحافة اليمنية' : 'Your gateway to PressHouse Yemen'}</span>
                </div>
              </div>
              <button 
                id="ai-assistant-close"
                onClick={() => setIsOpen(false)} 
                className="hover:bg-white/20 p-2 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content screen */}
            <div className="flex-1 p-6 overflow-y-auto bg-slate-50/50 space-y-4">
              <AnimatePresence>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-[24px] p-4 text-sm shadow-sm leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-white border border-slate-100 text-slate-800 rounded-bl-none'
                      }`}
                    >
                      <div className="whitespace-pre-line">{msg.text}</div>

                      {/* Display ground sources link references */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="space-y-2 pt-3 mt-3 border-t border-slate-100">
                          <p className="text-[10px] font-black uppercase text-slate-400">
                            {isRtl ? 'المصادر المرجعية' : 'Linked Sources'}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.sources.map((src, idx) => (
                              <a
                                key={idx}
                                href={src.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[11px] rounded-lg border border-slate-100 transition-colors"
                              >
                                <span className="max-w-[124px] truncate">{src.title}</span>
                                <ExternalLink size={10} />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {loading && (
                <div className="flex items-center justify-center py-4 space-y-2">
                  <Loader2 className="animate-spin text-blue-600" size={24} />
                  <span className="text-xs text-slate-400 font-medium ml-2">{isRtl ? 'جاري معالجة طلبك...' : 'Analyzing request...'}</span>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Footer Form Input fields */}
            <form onSubmit={handleSendMessage} className="p-6 border-t border-slate-100 bg-white shadow-inner">
              <div className="relative">
                <input
                  id="ai-assistant-input"
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={isRtl ? 'اسألني أي شيء عن المؤسسة...' : 'Ask me anything about PressHouse...'}
                  className={`w-full py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none text-sm transition-all shadow-sm ${isRtl ? 'pl-12 pr-4' : 'pr-12 pl-4'}`}
                />
                <button
                  id="ai-assistant-send"
                  type="submit"
                  disabled={loading || !prompt.trim()}
                  className={`absolute top-1/2 -translate-y-1/2 w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-40 transition-all ${isRtl ? 'left-2' : 'right-2'}`}
                >
                  <Send size={16} className={isRtl ? 'rotate-180' : ''} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
