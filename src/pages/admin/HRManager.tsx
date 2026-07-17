import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2, CheckCircle, XCircle, Mail, Phone, Loader2, Save, User, UserCheck, Shield, Sparkles } from 'lucide-react';
import { api } from '../../services/api';
import { ImagePicker } from '../../components/admin/ImagePicker';
import { SmartTranslate } from '../../components/admin/SmartTranslate';

interface Employee {
  id: string;
  full_name: string;
  employee_id: string;
  position: string;
  department: string;
  photo_url: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
}

interface BoardMember {
  id: string;
  full_name: string;
  position: string;
  photo_url: string;
  bio: string;
  sort_order: number;
  category?: 'leadership' | 'advisory';
}

export default function HRManager() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [activeSubTab, setActiveSubTab] = useState<'employees' | 'board'>('employees');
  const [loading, setLoading] = useState(true);

  // Lists
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>([]);

  // Modals / Editors state
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Partial<Employee & {
    gender?: string;
    degree?: string;
    start_date?: string;
    contract_type?: string;
    scope_ar?: string;
    scope_en?: string;
  }> | null>(null);

  const [showBoardModal, setShowBoardModal] = useState(false);
  const [editingBoard, setEditingBoard] = useState<Partial<BoardMember> | null>(null);
  const [uploadingEmpPhoto, setUploadingEmpPhoto] = useState(false);
  const [uploadingBoardPhoto, setUploadingBoardPhoto] = useState(false);
  const [translatingField, setTranslatingField] = useState<string | null>(null);

  const handleTranslateField = async (text: string, fieldType: 'position') => {
    if (!text) return;
    setTranslatingField(fieldType);
    try {
      const res = await api.post('/api/ai/translate', { text, targetLanguage: 'en' });
      const translated = res.data.text || text;
      setEditingEmployee(prev => prev ? ({ ...prev, [fieldType]: translated }) : null);
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setTranslatingField(null);
    }
  };

  const handleEmpPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploadingEmpPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', e.target.files[0]);
      const res = await api.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setEditingEmployee(prev => prev ? ({ ...prev, photo_url: res.data.url }) : null);
    } catch (err) {
      console.error(err);
      alert('Photo upload failed');
    } finally {
      setUploadingEmpPhoto(false);
    }
  };

  const handleBoardPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploadingBoardPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', e.target.files[0]);
      const res = await api.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setEditingBoard(prev => prev ? ({ ...prev, photo_url: res.data.url }) : null);
    } catch (err) {
      console.error(err);
      alert('Photo upload failed');
    } finally {
      setUploadingBoardPhoto(false);
    }
  };

  const departments = [
    { value: 'Administration', label: isRtl ? 'الإدارة العامة والقيادة' : 'General Administration' },
    { value: 'Media', label: isRtl ? 'قسم الإعلام والنشر' : 'Media & Publishing' },
    { value: 'Human Rights', label: isRtl ? 'مرصد الحقوق والحريات' : 'Human Rights Monitor' },
    { value: 'Training', label: isRtl ? 'الأكاديمية والتدريب' : 'Academy & Training' },
    { value: 'Tech', label: isRtl ? 'قسم التقنية والتطوير' : 'Technology & IT' },
    { value: 'Finance', label: isRtl ? 'الشؤون المالية والإدارية' : 'Finance & Operations' }
  ];

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [empRes, boardRes] = await Promise.all([
        api.get('/api/employees'),
        api.get('/api/board-members')
      ]);
      setEmployees(empRes.data || []);
      setBoardMembers(boardRes.data || []);
    } catch (error) {
      console.error('Error fetching HR lists:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee || !editingEmployee.full_name) return;

    try {
      if (editingEmployee.id) {
        await api.put(`/api/employees/${editingEmployee.id}`, editingEmployee);
      } else {
        await api.post('/api/employees', editingEmployee);
      }
      setShowEmployeeModal(false);
      setEditingEmployee(null);
      fetchAllData();
    } catch (error) {
      console.error('Error saving employee:', error);
      alert('Error saving record');
    }
  };

  const handleSaveBoardMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBoard || !editingBoard.full_name) return;

    try {
      if (editingBoard.id) {
        await api.put(`/api/board-members/${editingBoard.id}`, editingBoard);
      } else {
        await api.post('/api/board-members', editingBoard);
      }
      setShowBoardModal(false);
      setEditingBoard(null);
      fetchAllData();
    } catch (error) {
      console.error('Error saving board member:', error);
      alert('Error saving record');
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (window.confirm(isRtl ? 'هل أنت متأكد من حذف هذا الموظف؟' : 'Are you sure you want to delete this employee?')) {
      try {
        await api.delete(`/api/employees/${id}`);
        fetchAllData();
      } catch (error) {
        console.error('Error deleting employee:', error);
      }
    }
  };

  const handleDeleteBoardMember = async (id: string) => {
    if (window.confirm(isRtl ? 'هل أنت متأكد من الحساب من مجلس الإدارة؟' : 'Are you sure you want to remove this board member?')) {
      try {
        await api.delete(`/api/board-members/${id}`);
        fetchAllData();
      } catch (error) {
        console.error('Error deleting board member:', error);
      }
    }
  };

  return (
    <div className="space-y-8" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isRtl ? 'إدارة الموارد البشرية' : 'HR & Staff Management'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {isRtl
              ? 'إدارة الهيكل الإداري للمؤسسة، الموظفين التنفيذيين، وأعضاء مجلس الإدارة مع التحكم بالرتب والتصنيفات.'
              : 'Configure board of directors, staff members, official IDs, and departments.'}
          </p>
        </div>
        <button
          onClick={() => {
            if (activeSubTab === 'employees') {
              setEditingEmployee({ full_name: '', employee_id: '', position: '', department: 'Administration', status: 'active', email: '', phone: '', photo_url: '' });
              setShowEmployeeModal(true);
            } else {
              setEditingBoard({ full_name: '', position: '', bio: '', photo_url: '', sort_order: 0, category: 'leadership' });
              setShowBoardModal(true);
            }
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-blue-100 flex items-center gap-2 cursor-pointer transition-all"
        >
          <Plus size={18} />
          {activeSubTab === 'employees' 
            ? (isRtl ? 'إضافة موظف جديد' : 'Add New Employee') 
            : (isRtl ? 'إضافة عضو الهيئة الإدارية/الاستشارية' : 'Add Team/Advisory Member')}
        </button>
      </div>

      <div className="flex gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab('employees')}
          className={`pb-4 px-4 font-bold text-sm transition-colors border-b-2 flex items-center gap-2 ${
            activeSubTab === 'employees' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <UserCheck size={18} />
          {isRtl ? 'الطاقم التنفيذي والموظفون' : 'Executive Staff & Employees'}
        </button>
        <button
          onClick={() => setActiveSubTab('board')}
          className={`pb-4 px-4 font-bold text-sm transition-colors border-b-2 flex items-center gap-2 ${
            activeSubTab === 'board' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Shield size={18} />
          {isRtl ? 'الهيئة الإدارية والاستشارية' : 'Administrative & Advisory Board'}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-blue-600" size={48} />
        </div>
      ) : activeSubTab === 'employees' ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-start">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">{isRtl ? 'الموظف' : 'Employee'}</th>
                  <th className="px-6 py-4">{isRtl ? 'الرقم الوظيفي' : 'Employee ID'}</th>
                  <th className="px-6 py-4">{isRtl ? 'المنصب والقسم' : 'Position & Dept'}</th>
                  <th className="px-6 py-4">{isRtl ? 'الاتصال' : 'Contacts'}</th>
                  <th className="px-6 py-4">{isRtl ? 'الحالة' : 'Status'}</th>
                  <th className="px-6 py-4 text-center">{isRtl ? 'خيارات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden border border-slate-200 flex-shrink-0">
                          {emp.photo_url ? (
                            <img src={emp.photo_url} alt={emp.full_name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">
                              <User size={18} />
                            </div>
                          )}
                        </div>
                        <span className="font-bold text-slate-900">{emp.full_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-500">
                      {emp.employee_id || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-800">{emp.position}</p>
                      <p className="text-xs text-slate-400">
                        {departments.find(d => d.value === emp.department)?.label || emp.department}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-xs space-y-1 text-slate-600">
                      {emp.email && (
                        <p className="flex items-center gap-1.5">
                          <Mail size={12} className="text-slate-400" /> {emp.email}
                        </p>
                      )}
                      {emp.phone && (
                        <p className="flex items-center gap-1.5">
                          <Phone size={12} className="text-slate-400" /> {emp.phone}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                        emp.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {emp.status === 'active' ? (isRtl ? 'نشط' : 'Active') : (isRtl ? 'غير نشط' : 'Inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingEmployee(emp);
                            setShowEmployeeModal(true);
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteEmployee(emp.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {employees.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                      {isRtl ? 'لا يوجد موظفون مضافون حالياً.' : 'No employees configured yet.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-start">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">{isRtl ? 'العضو' : 'Member'}</th>
                  <th className="px-6 py-4">{isRtl ? 'المنصب / الصفة' : 'Role'}</th>
                  <th className="px-6 py-4">{isRtl ? 'الهيئة / التصنيف' : 'Category'}</th>
                  <th className="px-6 py-4">{isRtl ? 'النبذة التعريفية' : 'Biography'}</th>
                  <th className="px-6 py-4">{isRtl ? 'ترتيب الظهور' : 'Sort Order'}</th>
                  <th className="px-6 py-4 text-center">{isRtl ? 'خيارات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {boardMembers.map(member => (
                  <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden border border-slate-200 flex-shrink-0">
                          {member.photo_url ? (
                            <img src={member.photo_url} alt={member.full_name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">
                              <User size={18} />
                            </div>
                          )}
                        </div>
                        <span className="font-bold text-slate-900">{member.full_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-800">
                      {member.position || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-black rounded-lg ${
                        member.category === 'advisory' 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {member.category === 'advisory' 
                          ? (isRtl ? 'هيئة استشارية' : 'Advisory Board') 
                          : (isRtl ? 'هيئة إدارية' : 'Executive Team')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 max-w-xs line-clamp-2 mt-4">
                      {member.bio || 'None'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-600 font-mono">
                      {member.sort_order}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingBoard(member);
                            setShowBoardModal(true);
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteBoardMember(member.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {boardMembers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400">
                      {isRtl ? 'لا يوجد أعضاء مضافون لمجلس الإدارة.' : 'No board members configured yet.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Employee Modal Form - Rich & Professional */}
      {showEmployeeModal && editingEmployee && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden max-h-[95vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-lg text-slate-950 flex items-center gap-2">
                <span className="p-1.5 bg-blue-100 rounded-lg text-blue-600">👤</span>
                {editingEmployee.id ? (isRtl ? 'تعديل سيرة موظف تفصيلية' : 'Edit Employee Profile') : (isRtl ? 'إضافة موظف جديد تفصيلي' : 'New Employee Profile')}
              </h3>
              <button onClick={() => setShowEmployeeModal(false)} className="text-slate-400 hover:text-slate-800 font-bold text-xl">&times;</button>
            </div>
            
            <form onSubmit={handleSaveEmployee} className="p-6 space-y-4 overflow-y-auto flex-1 text-start">
              {/* Primary Personal Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{isRtl ? 'الاسم الكامل للموظف (ثنائي/رباعي)' : 'Full Name'}</label>
                  <input
                    type="text"
                    required
                    value={editingEmployee.full_name || ''}
                    onChange={e => setEditingEmployee({ ...editingEmployee, full_name: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none text-sm font-bold focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{isRtl ? 'الرقم الوظيفي (ID)' : 'Employee ID'}</label>
                  <input
                    type="text"
                    value={editingEmployee.employee_id || ''}
                    onChange={e => setEditingEmployee({ ...editingEmployee, employee_id: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none text-sm font-mono"
                    placeholder="PH-2026-X"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold uppercase text-slate-500">{isRtl ? 'المنصب الوظيفي' : 'Position'}</label>
                    <button
                      type="button"
                      onClick={() => handleTranslateField(editingEmployee.position || '', 'position')}
                      className="text-[10px] bg-sky-50 text-sky-700 border border-sky-100 px-2 py-0.5 rounded-md hover:bg-sky-100 font-bold flex items-center gap-1"
                    >
                      {translatingField === 'position' ? <Loader2 size={10} className="animate-spin" /> : '✨ '+ (isRtl ? 'ترجمة ذكية' : 'Translate')}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={editingEmployee.position || ''}
                    onChange={e => setEditingEmployee({ ...editingEmployee, position: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none text-sm"
                    placeholder={isRtl ? 'مثال: باحث حقوقي أول' : 'e.g. Senior Researcher'}
                  />
                </div>
              </div>

              {/* Advanced Corporate Details */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{isRtl ? 'القسم والمصلحة' : 'Department'}</label>
                  <select
                    value={editingEmployee.department || 'Administration'}
                    onChange={e => setEditingEmployee({ ...editingEmployee, department: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none text-sm bg-white font-bold"
                  >
                    {departments.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{isRtl ? 'نوع التعاقد' : 'Contract Type'}</label>
                  <select
                    value={editingEmployee.contract_type || 'Full-time'}
                    onChange={e => setEditingEmployee({ ...editingEmployee, contract_type: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none text-sm bg-white"
                  >
                    <option value="Full-time">{isRtl ? 'دوام كامل (Full-time)' : 'Full-time'}</option>
                    <option value="Part-time">{isRtl ? 'دوام جزئي (Part-time)' : 'Part-time'}</option>
                    <option value="Consultant">{isRtl ? 'مستشار خارجي (Consultant)' : 'Consultant'}</option>
                    <option value="Volunteer">{isRtl ? 'متطوع (Volunteer)' : 'Volunteer'}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{isRtl ? 'المؤهل الأكاديمي والشهادة' : 'Degree / Qualification'}</label>
                  <input
                    type="text"
                    value={editingEmployee.degree || ''}
                    onChange={e => setEditingEmployee({ ...editingEmployee, degree: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none text-sm"
                    placeholder={isRtl ? 'ماجستير صحافة وإعلام، بكالوريوس قانون' : 'e.g. MA Journalism'}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{isRtl ? 'تاريخ مباشرة العمل / العقد' : 'Commencement Date'}</label>
                  <input
                    type="date"
                    value={editingEmployee.start_date || ''}
                    onChange={e => setEditingEmployee({ ...editingEmployee, start_date: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none text-sm"
                  />
                </div>
              </div>

              {/* Status & Gender */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{isRtl ? 'الجندر / الجنس' : 'Gender'}</label>
                  <select
                    value={editingEmployee.gender || 'male'}
                    onChange={e => setEditingEmployee({ ...editingEmployee, gender: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none text-sm bg-white"
                  >
                    <option value="male">{isRtl ? 'ذكر' : 'Male'}</option>
                    <option value="female">{isRtl ? 'أنثى' : 'Female'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{isRtl ? 'الحالة الإدارية' : 'Administrative Status'}</label>
                  <select
                    value={editingEmployee.status || 'active'}
                    onChange={e => setEditingEmployee({ ...editingEmployee, status: e.target.value as 'active' | 'inactive' })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none text-sm bg-white font-bold"
                  >
                    <option value="active">{isRtl ? 'نشط / يداوم' : 'Active'}</option>
                    <option value="inactive">{isRtl ? 'غير نشط' : 'Inactive'}</option>
                  </select>
                </div>
              </div>

              {/* Photo Upload Input with file picker inline */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase text-slate-500">{isRtl ? 'الصورة الشخصية الرسمية للموظف' : 'Official Portrait Photo'}</label>
                <ImagePicker 
                  value={editingEmployee.photo_url || ''} 
                  onChange={(url) => setEditingEmployee({ ...editingEmployee, photo_url: url })} 
                />
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{isRtl ? 'البريد الإلكتروني الرسمي' : 'Official Email'}</label>
                  <input
                    type="email"
                    value={editingEmployee.email || ''}
                    onChange={e => setEditingEmployee({ ...editingEmployee, email: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none text-sm"
                    placeholder="name@presshouse.org"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{isRtl ? 'رقم الهاتف الرسمي' : 'Official Phone'}</label>
                  <input
                    type="text"
                    value={editingEmployee.phone || ''}
                    onChange={e => setEditingEmployee({ ...editingEmployee, phone: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none text-sm"
                    placeholder="+967..."
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50/50 p-4 -mx-6 -mb-6">
                <button
                  type="button"
                  onClick={() => setShowEmployeeModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-sm cursor-pointer"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm cursor-pointer shadow-md shadow-blue-100"
                >
                  {isRtl ? 'حفظ البيانات' : 'Save Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Board Modal Form */}
      {showBoardModal && editingBoard && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-950">
                {editingBoard.id ? (isRtl ? 'تعديل عضو القيادة' : 'Edit Board Member') : (isRtl ? 'إضافة عضو مجلس إدارة جديد' : 'New Board Member')}
              </h3>
              <button onClick={() => setShowBoardModal(false)} className="text-slate-400 hover:text-slate-800 font-bold text-xl">&times;</button>
            </div>
            
            <form onSubmit={handleSaveBoardMember} className="p-6 space-y-4 text-start">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">الاسم الكامل</label>
                <input
                  type="text"
                  required
                  value={editingBoard.full_name || ''}
                  onChange={e => setEditingBoard({ ...editingBoard, full_name: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{isRtl ? 'المنصب / الصفة' : 'Role / Position'}</label>
                  <input
                    type="text"
                    value={editingBoard.position || ''}
                    onChange={e => setEditingBoard({ ...editingBoard, position: e.target.value })}
                    placeholder="رئيس مجلس الإدارة"
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{isRtl ? 'ترتيب الظهور' : 'Sort Order'}</label>
                  <input
                    type="number"
                    value={editingBoard.sort_order || 0}
                    onChange={e => setEditingBoard({ ...editingBoard, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{isRtl ? 'الفئة / الهيئة التابع لها' : 'Division / Categorization'}</label>
                <select
                  value={editingBoard.category || 'leadership'}
                  onChange={e => setEditingBoard({ ...editingBoard, category: e.target.value as any })}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none text-sm bg-white"
                >
                  <option value="leadership">{isRtl ? 'الهيئة الإدارية (فريق المؤسسة)' : 'Administrative/Executive Team'}</option>
                  <option value="advisory">{isRtl ? 'الهيئة الاستشارية' : 'Advisory Board'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{isRtl ? 'صورة العضو الرسمية' : 'Portrait Photo'}</label>
                <ImagePicker 
                  value={editingBoard.photo_url || ''} 
                  onChange={(url) => setEditingBoard({ ...editingBoard, photo_url: url })} 
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">نبذة تعريفية مختصرة (Biography / Bio)</label>
                <textarea
                  value={editingBoard.bio || ''}
                  onChange={e => setEditingBoard({ ...editingBoard, bio: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none text-sm"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBoardModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-sm cursor-pointer"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm cursor-pointer"
                >
                  {isRtl ? 'حفظ البيانات' : 'Save Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
