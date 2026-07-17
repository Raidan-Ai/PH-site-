import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, MapPin, Send, MessageSquare, Globe, Clock, ArrowRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '../services/api';

export default function Contact() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    setSuccess(false);

    try {
      await api.post('/api/contact', { name, email, subject, message });
      setSuccess(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      console.error(err);
      setError(isRtl ? 'عذراً، حدث خطأ أثناء إرسال الرسالة.' : 'Sorry, an error occurred while sending your message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Header */}
      <div className="bg-white border-b border-slate-200 pt-32 pb-16">
        <div className="container mx-auto px-4 text-center space-y-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-600 text-sm font-bold uppercase tracking-wider"
          >
            <MessageSquare size={18} />
            {isRtl ? 'نحن هنا للمساعدة' : 'We are here to help'}
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-bold text-slate-900 tracking-tight">
            {isRtl ? 'تواصل معنا' : 'Get in Touch'}
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
            {isRtl 
              ? 'سواء كان لديك استفسار، اقتراح، أو ترغب في الانضمام إلى مجتمعنا، يسعدنا دائماً سماع صوتك.' 
              : 'Whether you have an inquiry, a suggestion, or want to join our community, we are always happy to hear from you.'}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Contact Info */}
          <div className="lg:col-span-5 space-y-12">
            <div className="space-y-8">
              <h2 className="text-3xl font-bold text-slate-900">{isRtl ? 'معلومات الاتصال' : 'Contact Information'}</h2>
              <div className="grid grid-cols-1 gap-6">
                {[
                  { icon: Mail, label: isRtl ? 'البريد الإلكتروني' : 'Email', value: 'info@phye.org', color: 'text-blue-600', bg: 'bg-blue-50' },
                  { icon: Phone, label: isRtl ? 'الهاتف' : 'Phone', value: '04-210613', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { icon: MapPin, label: isRtl ? 'العنوان' : 'Address', value: isRtl ? 'تعز، اليمن' : 'Taiz, Yemen', color: 'text-rose-600', bg: 'bg-rose-50' },
                  { icon: Clock, label: isRtl ? 'ساعات العمل' : 'Working Hours', value: isRtl ? 'الأحد - الخميس: 8 صباحاً - 4 مساءً' : 'Sun - Thu: 8 AM - 4 PM', color: 'text-amber-600', bg: 'bg-amber-50' },
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-6 p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all group"
                  >
                    <div className={`w-16 h-16 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                      <item.icon size={28} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                      <p className="text-lg font-bold text-slate-900">{item.value}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Social Links */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-900">{isRtl ? 'تابعنا على' : 'Follow Us'}</h3>
              <div className="flex gap-4">
                {[
                  { name: 'Facebook', url: 'https://facebook.com/presshoue' },
                  { name: 'Twitter', url: 'https://twitter.com/presshoue' },
                  { name: 'Instagram', url: 'https://instagram.com/presshoue' },
                  { name: 'LinkedIn', url: 'https://linkedin.com/company/presshoue' }
                ].map((social, i) => (
                  <a 
                    key={i} 
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm"
                    title={social.name}
                  >
                    <Globe size={20} />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-7">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="bg-white p-10 md:p-16 rounded-[48px] shadow-2xl shadow-slate-200/50 border border-white relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 opacity-50" />
              
              <form onSubmit={handleSubmit} className="relative z-10 space-y-8">
                <div className="space-y-4">
                  <h3 className="text-3xl font-bold text-slate-900">{isRtl ? 'أرسل لنا رسالة' : 'Send us a Message'}</h3>
                  <p className="text-slate-500">{isRtl ? 'املأ النموذج أدناه وسنقوم بالرد عليك في أقرب وقت ممكن.' : 'Fill out the form below and we will get back to you as soon as possible.'}</p>
                </div>

                {success && (
                  <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-2xl flex items-center gap-3 text-sm animate-fade-in">
                    <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />
                    <span>{isRtl ? 'تم إرسال رسالتك بنجاح! شكراً لك.' : 'Your message has been sent successfully! Thank you.'}</span>
                  </div>
                )}

                {error && (
                  <div className="p-4 bg-rose-50 text-rose-800 border border-rose-100 rounded-2xl flex items-center gap-3 text-sm animate-fade-in">
                    <AlertCircle className="text-rose-500 shrink-0" size={20} />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-slate-700 ml-2">{isRtl ? 'الاسم الكامل' : 'Full Name'}</label>
                    <input 
                      type="text" 
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-blue-500 outline-none transition-all"
                      placeholder={isRtl ? 'أدخل اسمك هنا' : 'Enter your name'}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-slate-700 ml-2">{isRtl ? 'البريد الإلكتروني' : 'Email Address'}</label>
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-blue-500 outline-none transition-all"
                      placeholder="example@email.com"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-700 ml-2">{isRtl ? 'الموضوع' : 'Subject'}</label>
                  <input 
                    type="text" 
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-blue-500 outline-none transition-all"
                    placeholder={isRtl ? 'كيف يمكننا مساعدتك؟' : 'How can we help you?'}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-700 ml-2">{isRtl ? 'الرسالة' : 'Message'}</label>
                  <textarea 
                    rows={6} 
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-blue-500 outline-none transition-all resize-none"
                    placeholder={isRtl ? 'اكتب رسالتك هنا...' : 'Write your message here...'}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={sending}
                  className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold hover:bg-blue-600 transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-900/20 group disabled:opacity-50"
                >
                  {sending ? (
                    <Loader2 className="animate-spin text-white" size={20} />
                  ) : (
                    <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  )}
                  {isRtl ? 'إرسال الرسالة' : 'Send Message'}
                  <ArrowRight size={20} className={isRtl ? 'mr-auto rotate-180' : 'ml-auto'} />
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <section className="container mx-auto px-4 pb-24">
        <div className="h-[500px] bg-slate-200 rounded-[48px] overflow-hidden relative grayscale hover:grayscale-0 transition-all duration-1000">
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d3848.444738466104!2d44.013563!3d13.582813!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTPCsDM0JzU4LjEiTiA0NMKwMDAnNDkuMCJF!5e0!3m2!1sen!2sye!4v1710400000000"
            className="w-full h-full border-0"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <div className="absolute bottom-8 left-8 right-8 md:right-auto">
            <div className="bg-white p-6 rounded-3xl shadow-2xl border border-slate-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center shrink-0">
                <MapPin size={24} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">{isRtl ? 'مقرنا الرئيسي' : 'Our Headquarters'}</h4>
                <p className="text-sm text-slate-500">{isRtl ? 'H2H9+P9J، تعز، اليمن' : 'H2H9+P9J, Taiz, Yemen'}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
