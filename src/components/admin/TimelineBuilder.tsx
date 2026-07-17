import React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Calendar, GitCommit } from 'lucide-react';

interface TimelineItem {
  date: string;
  eventAr: string;
  eventEn: string;
  descAr: string;
  descEn: string;
}

interface TimelineBuilderProps {
  timeline: TimelineItem[];
  onChange: (timeline: TimelineItem[]) => void;
}

export default function TimelineBuilder({ timeline = [], onChange }: TimelineBuilderProps) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const handleAdd = () => {
    const newItem: TimelineItem = {
      date: '',
      eventAr: '',
      eventEn: '',
      descAr: '',
      descEn: ''
    };
    onChange([...timeline, newItem]);
  };

  const handleRemove = (index: number) => {
    const updated = timeline.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleChange = (index: number, field: keyof TimelineItem, value: string) => {
    const updated = timeline.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value };
      }
      return item;
    });
    onChange(updated);
  };

  return (
    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4" id="timeline-builder">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <GitCommit className="text-blue-600" size={18} />
          <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
            {isRtl ? 'بناء مسار الأحداث والخط الزمني الاستقصائي/الترويجي' : 'Investigative & Campaign Timeline Builder'}
          </span>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="text-white bg-blue-600 hover:bg-slate-900 transition-colors px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
        >
          <Plus size={14} />
          <span>{isRtl ? 'إضافة حدث' : 'Add Event'}</span>
        </button>
      </div>

      {timeline.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl bg-white/50">
          {isRtl ? 'لا توجد أحداث زمنية مضافة بعد. اضغط "إضافة حدث" لتوثيق التسلسل.' : 'No timeline events added yet. Click "Add Event" to begin mapping the chronological logs.'}
        </div>
      ) : (
        <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
          {timeline.map((item, index) => (
            <div key={index} className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs relative group space-y-3">
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute top-3 right-3 text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                title={isRtl ? 'حذف الحدث' : 'Delete event'}
              >
                <Trash2 size={14} />
              </button>

              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black flex items-center justify-center">
                  {index + 1}
                </span>
                <span className="text-[10px] font-bold text-slate-400">{isRtl ? 'الحدث التسلسلي' : 'Event Block'}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">{isRtl ? 'الزمن/التاريخ (مثال: مايو ٢٠٢٦)' : 'Date/Time (e.g. May 2026)'}</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={item.date}
                      onChange={(e) => handleChange(index, 'date', e.target.value)}
                      placeholder="e.g. June 2026"
                      className="w-full pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                    />
                    <Calendar size={12} className="absolute left-2 top-2.5 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">{isRtl ? 'عنوان الحدث بالعربية' : 'Event Title Ar'}</label>
                  <input
                    type="text"
                    required
                    value={item.eventAr}
                    onChange={(e) => handleChange(index, 'eventAr', e.target.value)}
                    placeholder="التجاوز أو المؤتمر..."
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">{isRtl ? 'عنوان الحدث بالإنجليزية' : 'Event Title En'}</label>
                  <input
                    type="text"
                    required
                    value={item.eventEn}
                    onChange={(e) => handleChange(index, 'eventEn', e.target.value)}
                    placeholder="Brief headline..."
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-0.5">{isRtl ? 'شرح ووصف الحدث بالعربية' : 'Event Details Ar'}</label>
                  <textarea
                    value={item.descAr}
                    onChange={(e) => handleChange(index, 'descAr', e.target.value)}
                    rows={2}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    placeholder="اكتب شرحاً موجزاً وملخص للمرحلة..."
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-0.5">{isRtl ? 'شرح ووصف الحدث بالإنجليزية' : 'Event Details En'}</label>
                  <textarea
                    value={item.descEn}
                    onChange={(e) => handleChange(index, 'descEn', e.target.value)}
                    rows={2}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    placeholder="Write detailed english description..."
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
