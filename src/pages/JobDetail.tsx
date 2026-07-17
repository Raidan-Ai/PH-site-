import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Briefcase, MapPin, Calendar, ArrowLeft, Building2, DollarSign, CheckCircle2, Loader2 } from 'lucide-react';
import { JobApplicationModal } from '../components/JobApplicationModal';
import { api } from '../services/api';

export default function JobDetail() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await api.get('/api/jobs');
        const found = response.data?.find((item: any) => item.id === id);
        if (found) {
          const title = typeof found.title === 'string' ? JSON.parse(found.title) : found.title;
          const description = typeof found.description === 'string' ? JSON.parse(found.description) : found.description;
          const requirements = typeof found.requirements === 'string' ? JSON.parse(found.requirements) : found.requirements;
          
          let reqsParsed: string[] = [];
          if (Array.isArray(requirements)) {
            reqsParsed = requirements;
          } else if (requirements && typeof requirements === 'object') {
            const temp = requirements[isRtl ? 'ar' : 'en'] || requirements['ar'] || requirements['en'] || [];
            if (Array.isArray(temp)) {
              reqsParsed = temp;
            } else if (typeof temp === 'string') {
              reqsParsed = temp.split('\n').filter(Boolean);
            }
          } else if (typeof requirements === 'string') {
            try {
              const parsed = JSON.parse(requirements);
              reqsParsed = Array.isArray(parsed) ? parsed : [parsed];
            } catch {
              reqsParsed = requirements.split('\n').filter(Boolean);
            }
          }

          setJob({
            id: found.id,
            title: title[isRtl ? 'ar' : 'en'] || title['ar'] || title['en'],
            description: description[isRtl ? 'ar' : 'en'] || description['ar'] || description['en'],
            requirements: reqsParsed,
            location: isRtl ? 'تعز، اليمن' : 'Taiz, Yemen',
            type: isRtl ? 'دوام كامل' : 'Full-time',
            salary: isRtl ? 'تنافسي' : 'Competitive',
            category: isRtl ? 'تحرير' : 'Editorial',
            deadline: found.deadline ? new Date(found.deadline).toISOString().slice(0, 10) : '2026-12-31',
          });
        } else {
          setJob(null);
        }
      } catch (error) {
        console.error('Error fetching job details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id, isRtl]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-24">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!job) return <div className="container mx-auto px-4 py-24 text-center font-bold text-slate-800">{isRtl ? 'الوظيفة غير موجودة' : 'Job not found'}</div>;

  return (
    <div className="min-h-screen bg-slate-50 py-24">
      <div className="container mx-auto px-4">
        <button onClick={() => navigate('/jobs')} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 mb-8 font-bold">
          <ArrowLeft size={20} />
          {isRtl ? 'العودة للوظائف' : 'Back to Jobs'}
        </button>

        <div className="bg-white p-8 md:p-12 rounded-[40px] border border-slate-100 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
            <div className="space-y-4">
              <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider">
                {job.category}
              </span>
              <h1 className="text-4xl font-bold text-slate-900">{job.title}</h1>
              <div className="flex flex-wrap gap-6 text-sm font-bold text-slate-500">
                <div className="flex items-center gap-2"><MapPin size={18} className="text-slate-300" /> {job.location}</div>
                <div className="flex items-center gap-2"><DollarSign size={18} className="text-slate-300" /> {job.salary}</div>
                <div className="flex items-center gap-2 text-emerald-600"><CheckCircle2 size={18} /> {job.type}</div>
              </div>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 text-white px-10 py-5 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
            >
              {t('jobs.apply')}
            </button>
          </div>

          <div className="space-y-8 border-t border-slate-100 pt-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">{isRtl ? 'وصف الوظيفة' : 'Job Description'}</h2>
              <p className="text-slate-600 leading-relaxed">{job.description}</p>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">{isRtl ? 'المتطلبات' : 'Requirements'}</h2>
              <ul className="list-disc list-inside text-slate-600 space-y-2">
                {job.requirements.map((req, i) => <li key={i}>{req}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <JobApplicationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        jobTitle={job.title}
      />
    </div>
  );
}
