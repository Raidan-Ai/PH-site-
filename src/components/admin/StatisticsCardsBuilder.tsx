import React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Hash, BarChart3 } from 'lucide-react';

interface MetricItem {
  labelAr: string;
  labelEn: string;
  value: string;
}

interface StatisticsCardsBuilderProps {
  stats: MetricItem[];
  onChange: (stats: MetricItem[]) => void;
}

export default function StatisticsCardsBuilder({ stats = [], onChange }: StatisticsCardsBuilderProps) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const handleAdd = () => {
    const newItem: MetricItem = {
      labelAr: '',
      labelEn: '',
      value: ''
    };
    onChange([...stats, newItem]);
  };

  const handleRemove = (index: number) => {
    const updated = stats.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleChange = (index: number, field: keyof MetricItem, value: string) => {
    const updated = stats.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value };
      }
      return item;
    });
    onChange(updated);
  };

  return (
    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4" id="statistics-cards-builder">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <BarChart3 className="text-blue-600" size={18} />
          <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
            {isRtl ? 'بناء وتشجير بطاقات المؤشرات الرقمية والبيانية' : 'Interactive Statistics & Indicators Builder'}
          </span>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="text-white bg-blue-600 hover:bg-slate-900 transition-colors px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
        >
          <Plus size={14} />
          <span>{isRtl ? 'إضافة مؤشر' : 'Add Metric'}</span>
        </button>
      </div>

      {stats.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl bg-white/50">
          {isRtl ? 'لا توجد بطاقات إحصائية مضافة بعد. اضغط "إضافة" لملء أرقام الأثر.' : 'No statistics added yet. Click "Add" to input positive impact numbers.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.map((item, index) => (
            <div key={index} className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs space-y-3 relative group">
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute top-3 right-3 text-red-500 hover:bg-red-50 p-1 rounded-md transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                title={isRtl ? 'حذف البطاقة' : 'Delete card'}
              >
                <Trash2 size={14} />
              </button>

              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                <Hash size={12} className="text-blue-500" />
                <span>{isRtl ? `بطاقة المؤشر #${index + 1}` : `Metric Indicator #${index + 1}`}</span>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">{isRtl ? 'القيمة الرقمية / الإنجاز (مثال: 94% أو 2,500)' : 'Numerical Value (e.g. 94% or 2,500)'}</label>
                  <input
                    type="text"
                    required
                    value={item.value}
                    onChange={(e) => handleChange(index, 'value', e.target.value)}
                    placeholder="e.g. 85% or 1,200"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black text-slate-800 focus:bg-white focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">{isRtl ? 'تسمية المؤشر (العربية)' : 'Ar Tag'}</label>
                    <input
                      type="text"
                      required
                      value={item.labelAr}
                      onChange={(e) => handleChange(index, 'labelAr', e.target.value)}
                      placeholder="جهة مستفيدة..."
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">{isRtl ? 'تسمية المؤشر (الأجنبية)' : 'En Tag'}</label>
                    <input
                      type="text"
                      required
                      value={item.labelEn}
                      onChange={(e) => handleChange(index, 'labelEn', e.target.value)}
                      placeholder="Beneficiaries..."
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-800"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
