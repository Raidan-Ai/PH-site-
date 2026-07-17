import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2, Check, X, MoveUp, MoveDown, Save, Loader2, Image as ImageIcon, Video } from 'lucide-react';
import { HeroSlide } from '../../types';
import { MediaPicker } from '../../components/media/MediaPicker';
import { api } from '../../services/api';

export default function HeroSliderManager() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    try {
      const response = await api.get('/api/heroSlides').catch(() => ({ data: [] }));
      const data = (Array.isArray(response.data) ? response.data : []).map((s: any) => ({
        ...s,
        title: typeof s.title === 'string' ? JSON.parse(s.title) : s.title,
        subtitle: typeof s.subtitle === 'string' ? JSON.parse(s.subtitle) : s.subtitle,
        description: typeof s.description === 'string' ? JSON.parse(s.description) : s.description,
        primaryButton: typeof s.primaryButton === 'string' ? JSON.parse(s.primaryButton) : s.primaryButton,
        secondaryButton: typeof s.secondaryButton === 'string' ? JSON.parse(s.secondaryButton) : s.secondaryButton,
      }));
      data.sort((a: any, b: any) => a.order - b.order);
      setSlides(data as HeroSlide[]);
    } catch (error) {
      console.error("Error fetching slides:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (slide: HeroSlide) => {
    setSaving(true);
    try {
      const slideData = {
        ...slide, 
        id: slide.id && slide.id.length < 13 ? slide.id : undefined // if randomly generated temp id (Date.now()), then it will become a new record.
      };
      
      if (slide.id && slide.id.toString().length < 13) {
         // It exists
         await api.put(`/api/heroSlides/${slide.id}`, slideData);
      } else {
         await api.post('/api/heroSlides', slideData);
      }
      
      await fetchSlides();
      setEditingSlide(null);
    } catch (error) {
      console.error("Error saving slide:", error);
      alert(isRtl ? 'حدث خطأ أثناء الحفظ' : 'Error saving slide');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(isRtl ? 'هل أنت متأكد من حذف هذه الشريحة؟' : 'Are you sure you want to delete this slide?')) {
      try {
        if (id && id.toString().length < 13) {
            await api.delete(`/api/heroSlides/${id}`);
        }
        await fetchSlides();
      } catch (error) {
        console.error("Error deleting slide:", error);
      }
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === slides.length - 1)
    ) return;

    const newSlides = [...slides];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap orders
    const tempOrder = newSlides[index].order;
    newSlides[index].order = newSlides[targetIndex].order;
    newSlides[targetIndex].order = tempOrder;

    // Swap positions in array
    const temp = newSlides[index];
    newSlides[index] = newSlides[targetIndex];
    newSlides[targetIndex] = temp;

    setSlides(newSlides);

    // Save new orders to DB
    try {
      await Promise.all([
        api.put(`/api/heroSlides/${newSlides[index].id}`, newSlides[index]),
        api.put(`/api/heroSlides/${newSlides[targetIndex].id}`, newSlides[targetIndex])
      ]);
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  const handleAddNew = () => {
    const newSlide: HeroSlide = {
      id: Date.now().toString(), // Will be used as a client-side tracker, not DB id (see handleSave)
      title: { ar: '', en: '' },
      subtitle: { ar: '', en: '' },
      description: { ar: '', en: '' },
      mediaType: 'image',
      mediaUrl: '',
      animationType: 'fade',
      textAnimation: 'slide-up',
      titleSize: 'text-4xl md:text-6xl lg:text-7xl',
      subtitleSize: 'text-xs',
      descriptionSize: 'text-lg md:text-xl',
      buttonSize: 'px-8 py-4',
      overlayOpacity: 60,
      textAlign: 'left',
      primaryButton: { text: { ar: '', en: '' }, link: '', icon: 'ArrowRight' },
      secondaryButton: { text: { ar: '', en: '' }, link: '', icon: 'ArrowRight' },
      order: slides.length + 1,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    setEditingSlide(newSlide);
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{isRtl ? 'إدارة السلايدر' : 'Hero Slider Management'}</h1>
          <p className="text-slate-500 text-sm mt-1">{isRtl ? 'إدارة شرائح العرض في الصفحة الرئيسية' : 'Manage hero slides on the homepage'}</p>
        </div>
        {!editingSlide && (
          <button 
            onClick={handleAddNew}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            {isRtl ? 'إضافة شريحة' : 'Add Slide'}
          </button>
        )}
      </div>

      {editingSlide ? (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-900">
              {editingSlide.title.ar ? (isRtl ? 'تعديل الشريحة' : 'Edit Slide') : (isRtl ? 'شريحة جديدة' : 'New Slide')}
            </h2>
            <button onClick={() => setEditingSlide(null)} className="text-slate-400 hover:text-slate-600">
              <X size={24} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Arabic Content */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 border-b pb-2">المحتوى العربي</h3>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">العنوان</label>
                <input 
                  type="text" 
                  value={editingSlide.title.ar}
                  onChange={e => setEditingSlide({...editingSlide, title: {...editingSlide.title, ar: e.target.value}})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">العنوان الفرعي</label>
                <input 
                  type="text" 
                  value={editingSlide.subtitle.ar}
                  onChange={e => setEditingSlide({...editingSlide, subtitle: {...editingSlide.subtitle, ar: e.target.value}})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">الوصف</label>
                <textarea 
                  value={editingSlide.description.ar}
                  onChange={e => setEditingSlide({...editingSlide, description: {...editingSlide.description, ar: e.target.value}})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none"
                  rows={3}
                />
              </div>
            </div>

            {/* English Content */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 border-b pb-2">English Content</h3>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Title</label>
                <input 
                  type="text" 
                  value={editingSlide.title.en}
                  onChange={e => setEditingSlide({...editingSlide, title: {...editingSlide.title, en: e.target.value}})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Subtitle</label>
                <input 
                  type="text" 
                  value={editingSlide.subtitle.en}
                  onChange={e => setEditingSlide({...editingSlide, subtitle: {...editingSlide.subtitle, en: e.target.value}})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                <textarea 
                  value={editingSlide.description.en}
                  onChange={e => setEditingSlide({...editingSlide, description: {...editingSlide.description, en: e.target.value}})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none"
                  rows={3}
                  dir="ltr"
                />
              </div>
            </div>

            {/* Media Settings */}
            <div className="space-y-4 md:col-span-2 border-t border-slate-100 pt-6">
              <h3 className="font-bold text-slate-900">{isRtl ? 'الوسائط والحركة' : 'Media & Animation'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">{isRtl ? 'نوع الوسائط' : 'Media Type'}</label>
                  <select
                    value={editingSlide.mediaType}
                    onChange={e => setEditingSlide({...editingSlide, mediaType: e.target.value as 'image' | 'video'})}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none"
                  >
                    <option value="image">{isRtl ? 'صورة' : 'Image'}</option>
                    <option value="video">{isRtl ? 'فيديو' : 'Video'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">{isRtl ? 'طريقة الحركة' : 'Animation Type'}</label>
                  <select
                    value={editingSlide.animationType}
                    onChange={e => setEditingSlide({...editingSlide, animationType: e.target.value as 'fade' | 'slide' | 'zoom'})}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none"
                  >
                    <option value="fade">{isRtl ? 'تلاشي' : 'Fade'}</option>
                    <option value="slide">{isRtl ? 'انزلاق' : 'Slide'}</option>
                    <option value="zoom">{isRtl ? 'تكبير' : 'Zoom'}</option>
                    <option value="slide-up">{isRtl ? 'انزلاق للأعلى' : 'Slide Up'}</option>
                    <option value="slide-down">{isRtl ? 'انزلاق للأسفل' : 'Slide Down'}</option>
                    <option value="scale-up">{isRtl ? 'تكبير كامل' : 'Scale Up'}</option>
                    <option value="scale-down">{isRtl ? 'تصغير كامل' : 'Scale Down'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">{isRtl ? 'رابط الوسائط' : 'Media URL'}</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={editingSlide.mediaUrl}
                      onChange={e => setEditingSlide({...editingSlide, mediaUrl: e.target.value})}
                      className="flex-1 px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none"
                      dir="ltr"
                    />
                    <button 
                      type="button"
                      onClick={() => setIsMediaPickerOpen(true)}
                      className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium"
                    >
                      {isRtl ? 'اختيار' : 'Select'}
                    </button>
                  </div>
                </div>
              </div>
              {editingSlide.mediaUrl && (
                <div className="mt-4 aspect-video bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative max-w-md">
                  {editingSlide.mediaType === 'video' ? (
                    <video src={editingSlide.mediaUrl} controls className="w-full h-full object-cover" />
                  ) : (
                    <img src={editingSlide.mediaUrl} alt="Preview" className="w-full h-full object-cover" />
                  )}
                </div>
              )}
            </div>

            {/* Design & Typography */}
            <div className="space-y-4 md:col-span-2 border-t border-slate-100 pt-6">
              <h3 className="font-bold text-slate-900">{isRtl ? 'التصميم والخطوط' : 'Design & Typography'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">{isRtl ? 'حركة النص' : 'Text Animation'}</label>
                  <select
                    value={editingSlide.textAnimation}
                    onChange={e => setEditingSlide({...editingSlide, textAnimation: e.target.value as any})}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none"
                  >
                    <option value="fade-in">{isRtl ? 'تلاشي' : 'Fade In'}</option>
                    <option value="slide-up">{isRtl ? 'انزلاق للأعلى' : 'Slide Up'}</option>
                    <option value="slide-down">{isRtl ? 'انزلاق للأسفل' : 'Slide Down'}</option>
                    <option value="scale-in">{isRtl ? 'تكبير' : 'Scale In'}</option>
                    <option value="none">{isRtl ? 'بدون' : 'None'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">{isRtl ? 'محاذاة النص' : 'Text Align'}</label>
                  <select
                    value={editingSlide.textAlign}
                    onChange={e => setEditingSlide({...editingSlide, textAlign: e.target.value as any})}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none"
                  >
                    <option value="left">{isRtl ? 'يسار / بداية' : 'Left / Start'}</option>
                    <option value="center">{isRtl ? 'منتصف' : 'Center'}</option>
                    <option value="right">{isRtl ? 'يمين / نهاية' : 'Right / End'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">{isRtl ? 'شفافية الغطاء' : 'Overlay Opacity'}</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="range"
                      min="0"
                      max="100"
                      value={editingSlide.overlayOpacity}
                      onChange={e => setEditingSlide({...editingSlide, overlayOpacity: parseInt(e.target.value)})}
                      className="flex-1"
                    />
                    <span className="text-sm font-bold text-slate-500 w-8">{editingSlide.overlayOpacity}%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">{isRtl ? 'حجم الزر' : 'Button Size'}</label>
                  <select
                    value={editingSlide.buttonSize}
                    onChange={e => setEditingSlide({...editingSlide, buttonSize: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none"
                  >
                    <option value="px-6 py-3 text-sm">Small</option>
                    <option value="px-8 py-4">Medium (Default)</option>
                    <option value="px-10 py-5 text-lg">Large</option>
                    <option value="px-12 py-6 text-xl">Extra Large</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">{isRtl ? 'حجم العنوان' : 'Title Size'}</label>
                  <input 
                    type="text" 
                    value={editingSlide.titleSize}
                    onChange={e => setEditingSlide({...editingSlide, titleSize: e.target.value})}
                    placeholder="e.text-4xl md:text-6xl"
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">{isRtl ? 'حجم العنوان الفرعي' : 'Subtitle Size'}</label>
                  <input 
                    type="text" 
                    value={editingSlide.subtitleSize}
                    onChange={e => setEditingSlide({...editingSlide, subtitleSize: e.target.value})}
                    placeholder="e.g. text-xs"
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">{isRtl ? 'حجم الوصف' : 'Description Size'}</label>
                  <input 
                    type="text" 
                    value={editingSlide.descriptionSize}
                    onChange={e => setEditingSlide({...editingSlide, descriptionSize: e.target.value})}
                    placeholder="e.g. text-lg"
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            {/* Buttons Settings */}
            <div className="space-y-4 md:col-span-2 border-t border-slate-100 pt-6">
              <h3 className="font-bold text-slate-900">{isRtl ? 'الأزرار' : 'Buttons'}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Primary Button */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                  <h4 className="font-bold text-sm text-slate-700">{isRtl ? 'الزر الرئيسي' : 'Primary Button'}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="text" 
                      placeholder="Text (AR)"
                      value={editingSlide.primaryButton.text.ar}
                      onChange={e => setEditingSlide({...editingSlide, primaryButton: {...editingSlide.primaryButton, text: {...editingSlide.primaryButton.text, ar: e.target.value}}})}
                      className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
                    />
                    <input 
                      type="text" 
                      placeholder="Text (EN)"
                      value={editingSlide.primaryButton.text.en}
                      onChange={e => setEditingSlide({...editingSlide, primaryButton: {...editingSlide.primaryButton, text: {...editingSlide.primaryButton.text, en: e.target.value}}})}
                      className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
                      dir="ltr"
                    />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Link URL"
                    value={editingSlide.primaryButton.link}
                    onChange={e => setEditingSlide({...editingSlide, primaryButton: {...editingSlide.primaryButton, link: e.target.value}})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                    dir="ltr"
                  />
                  <select
                    value={editingSlide.primaryButton.icon}
                    onChange={e => setEditingSlide({...editingSlide, primaryButton: {...editingSlide.primaryButton, icon: e.target.value}})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  >
                    <option value="ArrowRight">ArrowRight</option>
                    <option value="ShieldAlert">ShieldAlert</option>
                    <option value="Zap">Zap</option>
                    <option value="Newspaper">Newspaper</option>
                    <option value="Globe2">Globe2</option>
                    <option value="Play">Play</option>
                  </select>
                </div>

                {/* Secondary Button */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                  <h4 className="font-bold text-sm text-slate-700">{isRtl ? 'الزر الثانوي' : 'Secondary Button'}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="text" 
                      placeholder="Text (AR)"
                      value={editingSlide.secondaryButton.text.ar}
                      onChange={e => setEditingSlide({...editingSlide, secondaryButton: {...editingSlide.secondaryButton, text: {...editingSlide.secondaryButton.text, ar: e.target.value}}})}
                      className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
                    />
                    <input 
                      type="text" 
                      placeholder="Text (EN)"
                      value={editingSlide.secondaryButton.text.en}
                      onChange={e => setEditingSlide({...editingSlide, secondaryButton: {...editingSlide.secondaryButton, text: {...editingSlide.secondaryButton.text, en: e.target.value}}})}
                      className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
                      dir="ltr"
                    />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Link URL"
                    value={editingSlide.secondaryButton.link}
                    onChange={e => setEditingSlide({...editingSlide, secondaryButton: {...editingSlide.secondaryButton, link: e.target.value}})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                    dir="ltr"
                  />
                  <select
                    value={editingSlide.secondaryButton.icon}
                    onChange={e => setEditingSlide({...editingSlide, secondaryButton: {...editingSlide.secondaryButton, icon: e.target.value}})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  >
                    <option value="ArrowRight">ArrowRight</option>
                    <option value="ShieldAlert">ShieldAlert</option>
                    <option value="Zap">Zap</option>
                    <option value="Newspaper">Newspaper</option>
                    <option value="Globe2">Globe2</option>
                    <option value="Play">Play</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="md:col-span-2 flex items-center gap-2 pt-4 border-t border-slate-100">
              <input 
                type="checkbox" 
                id="isActive"
                checked={editingSlide.isActive}
                onChange={e => setEditingSlide({...editingSlide, isActive: e.target.checked})}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="font-bold text-slate-700">{isRtl ? 'نشط (يظهر في الموقع)' : 'Active (Visible on site)'}</label>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
            <button 
              onClick={() => setEditingSlide(null)}
              className="px-6 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition-colors"
            >
              {isRtl ? 'إلغاء' : 'Cancel'}
            </button>
            <button 
              onClick={() => handleSave(editingSlide)}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
              {isRtl ? 'حفظ الشريحة' : 'Save Slide'}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-start">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
              <tr>
                <th className="px-6 py-4 w-16 text-center">#</th>
                <th className="px-6 py-4">{isRtl ? 'الوسائط' : 'Media'}</th>
                <th className="px-6 py-4">{isRtl ? 'العنوان' : 'Title'}</th>
                <th className="px-6 py-4">{isRtl ? 'الحالة' : 'Status'}</th>
                <th className="px-6 py-4 text-center">{isRtl ? 'ترتيب' : 'Order'}</th>
                <th className="px-6 py-4 text-center">{isRtl ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {slides.map((slide, index) => (
                <tr key={slide.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-center font-bold text-slate-400">{index + 1}</td>
                  <td className="px-6 py-4">
                    <div className="w-20 h-12 rounded-lg overflow-hidden bg-slate-100 relative">
                      {slide.mediaType === 'video' ? (
                        <>
                          <video src={slide.mediaUrl} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <Video size={16} className="text-white" />
                          </div>
                        </>
                      ) : (
                        <img src={slide.mediaUrl} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">{slide.title[isRtl ? 'ar' : 'en']}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${slide.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {slide.isActive ? (isRtl ? 'نشط' : 'Active') : (isRtl ? 'مخفي' : 'Hidden')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-1">
                      <button 
                        onClick={() => handleMove(index, 'up')}
                        disabled={index === 0}
                        className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-30"
                      >
                        <MoveUp size={18} />
                      </button>
                      <button 
                        onClick={() => handleMove(index, 'down')}
                        disabled={index === slides.length - 1}
                        className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-30"
                      >
                        <MoveDown size={18} />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      <button 
                        onClick={() => setEditingSlide(slide)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(slide.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {slides.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    {isRtl ? 'لا توجد شرائح حالياً' : 'No slides found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isMediaPickerOpen && editingSlide && (
        <MediaPicker
          onSelect={(url) => {
            setEditingSlide({ ...editingSlide, mediaUrl: url });
            setIsMediaPickerOpen(false);
          }}
          onClose={() => setIsMediaPickerOpen(false)}
        />
      )}
    </div>
  );
}
