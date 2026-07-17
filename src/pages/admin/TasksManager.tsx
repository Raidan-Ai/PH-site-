import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckSquare, Plus, Clock, PlayCircle, CheckCircle, AlertCircle, Edit, Trash2, Loader2, User, Calendar
} from 'lucide-react';
import { api } from '../../services/api';
import { Task } from '../../types';

export default function TasksManager() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Partial<Task>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tasksRes, usersRes, projectsRes] = await Promise.all([
        api.get('/api/tasks'),
        api.get('/api/users'),
        api.get('/api/projects')
      ]);
      setTasks(tasksRes.data || []);
      setUsers(usersRes.data || []);
      setProjects(projectsRes.data || []);
    } catch (error) {
      console.error('Error fetching data for tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentTask.id) {
        // We only have status update currently in API, but lets simulate full save
        await api.put(`/api/tasks/${currentTask.id}/status`, { status: currentTask.status });
      } else {
        await api.post('/api/tasks', { ...currentTask, status: 'pending' });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
       console.error("Error saving task", error);
    }
  };

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} className="text-emerald-500" />;
      case 'in_progress': return <PlayCircle size={16} className="text-blue-500" />;
      case 'overdue': return <AlertCircle size={16} className="text-red-500" />;
      default: return <Clock size={16} className="text-amber-500" />;
    }
  };

  if (loading) {
     return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;
  }

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CheckSquare className="text-blue-600" />
            {isRtl ? 'إدارة المهام والتكليفات' : 'Tasks & Assignments'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">{isRtl ? 'ربط الأنشطة والمهام بفرق العمل' : 'Assign activities and tasks to teams'}</p>
        </div>
        <button
          onClick={() => { setCurrentTask({ status: 'pending' }); setIsModalOpen(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors"
        >
          <Plus size={18} />
          {isRtl ? 'تكليف جديد' : 'New Assignment'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {['pending', 'in_progress', 'completed', 'overdue'].map(statusLayer => (
           <div key={statusLayer} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-3">
              <h3 className="font-bold text-slate-700 uppercase text-xs flex items-center gap-2 border-b pb-2">
                 <StatusIcon status={statusLayer} />
                 {statusLayer.replace('_', ' ')}
              </h3>
              {tasks.filter(t => t.status === statusLayer).map(task => {
                 const assignedUser = users.find(u => u.uid === task.assigned_to);
                 const project = projects.find(p => p.id === task.project_id);
                 return (
                   <div key={task.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 hover:shadow-md transition-shadow">
                     <h4 className="font-bold text-sm text-slate-800">{task.title}</h4>
                     
                     <div className="flex flex-col gap-1 text-xs text-slate-500">
                        {project && (
                          <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded inline-block w-fit truncate max-w-full">
                            {typeof project.title === 'string' ? JSON.parse(project.title || '{}')?.ar : project.title?.ar || 'Project'}
                          </span>
                        )}
                        <span className="flex items-center gap-1 mt-1"><Calendar size={12}/> {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}</span>
                     </div>

                     <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
                       <div className="flex items-center gap-2">
                         {assignedUser?.photoURL ? (
                           <img src={assignedUser.photoURL} alt="" className="w-6 h-6 rounded-full" />
                         ) : (
                           <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-[10px]"><User size={12}/></div>
                         )}
                         <span className="text-xs font-bold text-slate-600">{assignedUser?.displayName || 'Unassigned'}</span>
                       </div>
                       
                       <div className="flex gap-1">
                         <button onClick={() => { setCurrentTask(task); setIsModalOpen(true); }} className="text-slate-400 hover:text-blue-600"><Edit size={14}/></button>
                       </div>
                     </div>
                   </div>
                 )
              })}
           </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-in slide-in-from-bottom-4 shadow-xl text-slate-900 border border-slate-100">
            <h2 className="text-xl font-bold mb-4">{isRtl ? 'تكليف مهمة' : 'Assign Task'}</h2>
            <form onSubmit={handleSaveTask} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 block">{isRtl ? 'العنوان' : 'Title'}</label>
                <input required type="text" value={currentTask.title || ''} onChange={e => setCurrentTask({ ...currentTask, title: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-500 block">{isRtl ? 'المشروع المرتبط' : 'Related Project'}</label>
                 <select value={currentTask.project_id || ''} onChange={e => setCurrentTask({...currentTask, project_id: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                   <option value="">{isRtl ? '-- عام --' : '-- General --'}</option>
                   {projects.map(p => {
                      const t = typeof p.title === 'string' ? JSON.parse(p.title || '{}') : p.title;
                      return <option key={p.id} value={p.id}>{t?.ar || p.id}</option>
                   })}
                 </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block">{isRtl ? 'الموظف / المسؤول' : 'Assignee'}</label>
                  <select value={currentTask.assigned_to || ''} onChange={e => setCurrentTask({...currentTask, assigned_to: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                    <option value="">--</option>
                    {users.map(u => <option key={u.uid} value={u.uid}>{u.displayName || u.email}</option>)}
                  </select>
                </div>
                <div>
                   <label className="text-xs font-bold text-slate-500 block">{isRtl ? 'تاريخ الاستحقاق' : 'Due Date'}</label>
                   <input type="date" value={currentTask.due_date?.substring(0,10) || ''} onChange={e => setCurrentTask({...currentTask, due_date: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                </div>
              </div>

              {currentTask.id && (
                 <div>
                   <label className="text-xs font-bold text-slate-500 block">{isRtl ? 'تغيير الحالة' : 'Change Status'}</label>
                   <select value={currentTask.status || ''} onChange={e => setCurrentTask({...currentTask, status: e.target.value as any})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold">
                     <option value="pending">Pending</option>
                     <option value="in_progress">In Progress</option>
                     <option value="completed">Completed</option>
                     <option value="overdue">Overdue</option>
                   </select>
                 </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold">{isRtl ? 'إلغاء' : 'Cancel'}</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20">{isRtl ? 'حفظ' : 'Save Task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
