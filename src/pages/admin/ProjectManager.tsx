import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, Plus, Search, Edit, Trash2, 
  Target, TrendingUp, DollarSign, Loader2,
  CheckCircle2, Clock, AlertCircle, Star
} from 'lucide-react';
import { Project } from '../../types';
import { clsx } from 'clsx';
import { api } from '../../services/api';

export default function ProjectManager() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await api.get('/api/projects');
        const data = (Array.isArray(response.data) ? response.data : []).map((doc: any) => ({
          ...doc,
          title: typeof doc.title === 'string' ? JSON.parse(doc.title) : doc.title,
          description: typeof doc.description === 'string' ? JSON.parse(doc.description) : doc.description,
        }));
        data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setProjects(data as Project[]);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm(isRtl ? 'هل أنت متأكد من حذف هذا المشروع؟' : 'Are you sure you want to delete this project?')) {
      try {
        await api.delete(`/api/projects/${id}`);
        setProjects(projects.filter(p => p.id !== id));
      } catch (error) {
        console.error("Error deleting project:", error);
      }
    }
  };

  const filteredProjects = projects.filter(project => 
    project.title[isRtl ? 'ar' : 'en']?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{isRtl ? 'إدارة المشاريع' : 'Project Management'}</h1>
          <p className="text-slate-500 text-sm mt-1">{isRtl ? 'إدارة مشاريع بيت الصحافة، التمويل، والإنجازات' : 'Manage Press House projects, funding, and achievements'}</p>
        </div>
        <button 
          onClick={() => navigate('/admin/projects/new')}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
        >
          <Plus size={20} />
          {isRtl ? 'إضافة مشروع جديد' : 'Add New Project'}
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="relative">
          <input 
            type="text"
            placeholder={isRtl ? 'بحث في المشاريع...' : 'Search projects...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={48} /></div>
      ) : filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div key={project.id} className="bg-white rounded-[32px] border border-slate-200 shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col">
              <div className="relative aspect-video">
                <img 
                  src={project.image || 'https://picsum.photos/seed/project/800/450'} 
                  alt="" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 right-4">
                  <span className={clsx(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border",
                    project.status === 'completed' ? "bg-emerald-500/80 text-white border-emerald-400" :
                    project.status === 'ongoing' ? "bg-blue-500/80 text-white border-blue-400" :
                    "bg-amber-500/80 text-white border-amber-400"
                  )}>
                    {project.status.replace('_', ' ')}
                  </span>
                </div>
                {(project.isFeatured === 1 || project.isFeatured === true) && (
                  <div className="absolute top-4 left-4">
                    <span className="bg-amber-400/90 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border border-amber-300 shadow-xl flex items-center gap-1">
                      <Star size={10} fill="currentColor" />
                      {isRtl ? 'مميز' : 'Featured'}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-6 space-y-4 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-slate-900 line-clamp-2">
                  {project.title[isRtl ? 'ar' : 'en']}
                </h3>

                {project.fundingGoal && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                      <span className="text-slate-400">{isRtl ? 'التمويل' : 'Funding'}</span>
                      <span className="text-blue-600">
                        {Math.round(((project.currentFunding || 0) / project.fundingGoal) * 100)}%
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min(100, ((project.currentFunding || 0) / project.fundingGoal) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                      <span>${project.currentFunding?.toLocaleString() || 0}</span>
                      <span>${project.fundingGoal.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                <div className="pt-4 mt-auto border-t border-slate-100 flex items-center justify-between">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => navigate(`/admin/projects/${project.id}`)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(project.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {new Date(project.createdAt).toLocaleDateString(isRtl ? 'ar-YE' : 'en-US')}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-20 rounded-2xl border-2 border-dashed border-slate-200 text-center">
          <LayoutDashboard size={40} className="text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900">{isRtl ? 'لا توجد مشاريع' : 'No projects found'}</h3>
          <button 
            onClick={() => navigate('/admin/projects/new')}
            className="mt-4 text-blue-600 font-bold hover:underline"
          >
            {isRtl ? 'أضف مشروع الآن' : 'Add a project now'}
          </button>
        </div>
      )}
    </div>
  );
}
