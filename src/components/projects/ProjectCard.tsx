import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ProjectCardProps {
  project: {
    id: string;
    title: { [key: string]: string };
    description: { [key: string]: string };
    image: string;
    status: 'ongoing' | 'completed' | 'seeking_funding';
    fundingGoal?: number;
    currentFunding?: number;
    indicators?: any[];
  };
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const { i18n, t } = useTranslation();
  const lang = i18n.language;
  const isRtl = lang === 'ar';

  const progress = project.fundingGoal 
    ? Math.min(100, (project.currentFunding || 0) / project.fundingGoal * 100) 
    : 0;

  const statusColors = {
    ongoing: 'bg-blue-100 text-blue-700',
    completed: 'bg-emerald-100 text-emerald-700',
    seeking_funding: 'bg-amber-100 text-amber-700',
  };

  const statusLabels = {
    ongoing: isRtl ? 'قيد التنفيذ' : 'Ongoing',
    completed: isRtl ? 'مكتمل' : 'Completed',
    seeking_funding: isRtl ? 'بانتظار التمويل' : 'Seeking Funding',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      className="group bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 ease-out"
    >
      <div className="aspect-[16/10] overflow-hidden relative">
        <img
          src={project.image}
          alt={project.title[lang]}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <div className={cn(
          "absolute top-6 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg backdrop-blur-md border border-white/20",
          isRtl ? "right-6" : "left-6",
          project.status === 'ongoing' ? 'bg-blue-600 text-white shadow-blue-500/20' : 
          project.status === 'completed' ? 'bg-emerald-600 text-white shadow-emerald-500/20' : 
          'bg-amber-500 text-white shadow-amber-500/20'
        )}>
          {statusLabels[project.status]}
        </div>
      </div>

      <div className="p-8 space-y-6">
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
            {project.title[lang]}
          </h3>
          <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed">
            {project.description[lang]}
          </p>
        </div>

        {project.status !== 'completed' && project.fundingGoal && (
          <div className="space-y-3 pt-2">
            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <span>{isRtl ? 'التمويل المحقق' : 'Funding Progress'}</span>
              <span className="text-blue-600">{Math.round(progress)}%</span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.5, ease: "circOut" }}
                className="h-full bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.4)]"
              />
            </div>
            <div className="flex justify-between text-xs font-bold text-slate-900">
              <span>${(project.currentFunding || 0).toLocaleString()}</span>
              <span className="text-slate-400">/ ${(project.fundingGoal).toLocaleString()}</span>
            </div>
          </div>
        )}

        {project.indicators && project.indicators.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-slate-100/50">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              {isRtl ? 'مؤشرات الأداء الحية (KPIs)' : 'Live KPIs'}
            </div>
            <div className="space-y-2">
              {project.indicators.slice(0, 2).map((ind, i) => {
                const indPercent = Math.min(100, Math.round((ind.current_value / (ind.target_value || 1)) * 100));
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-slate-700">
                      <span className="truncate max-w-[180px]">{ind.name}</span>
                      <span className="font-mono text-blue-600">{ind.current_value}/{ind.target_value} {ind.unit}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${indPercent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <Link to={`/projects/${project.id}`} className="w-full py-4 rounded-2xl bg-slate-50 text-slate-900 font-black text-xs uppercase tracking-widest hover:bg-blue-900 hover:text-white transition-all duration-300 shadow-sm text-center block">
          {isRtl ? 'عرض التفاصيل' : 'View Details'}
        </Link>
      </div>
    </motion.div>
  );
};
