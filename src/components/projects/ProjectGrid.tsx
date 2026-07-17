import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ProjectCard } from './ProjectCard';
import { motion, AnimatePresence } from 'motion/react';
import { Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../../services/api';

import { LoadingSpinner } from '../Loading';

const ITEMS_PER_PAGE = 6;

export const ProjectGrid: React.FC = () => {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [projects, setProjects] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'ongoing' | 'completed' | 'seeking_funding'>('all');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await api.get('/api/projects');
        let indicatorList: any[] = [];
        try {
          const indicatorsRes = await api.get('/api/analytics/indicators');
          indicatorList = indicatorsRes.data.indicators || [];
        } catch (indErr) {
          console.error("Error fetching project indicators:", indErr);
        }

        const fetchedProjects = (Array.isArray(response.data) ? response.data : []).map((doc: any) => {
          const projIndicators = indicatorList.filter((ind: any) => String(ind.project_id) === String(doc.id));
          return {
            ...doc,
            title: typeof doc.title === 'string' ? JSON.parse(doc.title) : doc.title,
            shortDescription: typeof doc.shortDescription === 'string' ? JSON.parse(doc.shortDescription) : doc.shortDescription,
            content: typeof doc.content === 'string' ? JSON.parse(doc.content) : doc.content,
            location: typeof doc.location === 'string' ? JSON.parse(doc.location) : doc.location,
            impact: typeof doc.impact === 'string' ? JSON.parse(doc.impact) : doc.impact,
            indicators: projIndicators
          };
        });
        setProjects(fetchedProjects);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const filteredProjects = filter === 'all' 
    ? projects 
    : projects.filter(p => p.status === filter);

  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const filters = [
    { id: 'all', label: isRtl ? 'الكل' : 'All' },
    { id: 'ongoing', label: isRtl ? 'قيد التنفيذ' : 'Ongoing' },
    { id: 'completed', label: isRtl ? 'مكتمل' : 'Completed' },
    { id: 'seeking_funding', label: isRtl ? 'بانتظار التمويل' : 'Seeking Funding' },
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold text-slate-900">
            {isRtl ? 'مشاريعنا' : 'Our Projects'}
          </h2>
          <p className="text-slate-500">
            {isRtl ? 'اكتشف المبادرات التي نعمل عليها حالياً' : 'Explore the initiatives we are currently working on'}
          </p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          <div className="p-2 bg-slate-100 rounded-lg text-slate-400">
            <Filter size={18} />
          </div>
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={`px-6 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                filter === f.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <motion.div 
        layout
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        <AnimatePresence mode="popLayout">
          {paginatedProjects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </AnimatePresence>
      </motion.div>

      {filteredProjects.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
          <p className="text-slate-400 font-medium">
            {isRtl ? 'لا توجد مشاريع في هذا القسم حالياً' : 'No projects found in this category'}
          </p>
        </div>
      ) : totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-8">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={20} className={isRtl ? 'rotate-180' : ''} />
          </button>
          
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${
                  currentPage === page
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight size={20} className={isRtl ? 'rotate-180' : ''} />
          </button>
        </div>
      )}
    </div>
  );
};
