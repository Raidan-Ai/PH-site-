import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ShieldAlert, 
  Plus, 
  Search, 
  MapPin, 
  Upload, 
  Image as ImageIcon, 
  Loader2, 
  Check, 
  FileText, 
  Trash2, 
  X, 
  Compass, 
  Clock, 
  User, 
  Phone, 
  AlertTriangle, 
  Building 
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function JournalistViolations() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { userData } = useAuth();

  const [violations, setViolations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [reporterName, setReporterName] = useState(userData?.displayName || userData?.name || 'صحفي بيت الصحافة');
  const [reporterPhone, setReporterPhone] = useState('');
  const [victimName, setVictimName] = useState('');
  const [victimInstitution, setVictimInstitution] = useState('');
  const [governorate, setGovernorate] = useState('');
  const [district, setDistrict] = useState('');
  const [date, setDate] = useState('');
  const [perpetrator, setPerpetrator] = useState('');
  const [violationType, setViolationType] = useState('');
  const [description, setDescription] = useState('');
  
  // Spatial/Coordinates state
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [fetchingGeo, setFetchingGeo] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Image upload states
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const governorates = [
    'أمانة العاصمة صنعاء', 'عدن', 'تعز', 'الحديدة', 'مأرب', 'حضرموت', 'شبوة', 'إب', 'ذمار', 'لحج', 'الضالع', 'أبين', 'صعدة', 'عمران', 'حجة', 'البيضاء', 'المهرة', 'سقطرى', 'المحويت', 'ريمة', 'الجوف'
  ];

  const violationTypes = isRtl ? [
    'اعتقال واحتجاز تعسفي',
    'اعتداء جسدي',
    'تهديد وملاحقة',
    'منع من التغطية / مصادرة معدات',
    'إيقاف وسائل إعلام عن العمل',
    'حكم قضائي جائر',
    'حجب مواقع إلكترونية',
    'انتهاك آخر'
  ] : [
    'Arbitrary Arrest & Detention',
    'Physical Assault',
    'Threats & Harassment',
    'Coverage Ban / Equipment Confiscation',
    'Suspension of Media Outlets',
    'Unjust Judicial Rulings',
    'Website Censorship',
    'Other Violation'
  ];

  const fetchViolations = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/violations');
      setViolations(response.data || []);
    } catch (error) {
      console.error('Error fetching violations', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchViolations();
  }, []);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setGeoError(isRtl ? 'تحديد الموقع الجغرافي غير مدعوم في متصفحك' : 'Geolocation is not supported by your browser');
      return;
    }
    setFetchingGeo(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        setFetchingGeo(false);
      },
      (error) => {
        console.error(error);
        setGeoError(isRtl ? 'فشل الحصول على إحداثيات الموقع الحالي' : 'Failed to retrieve current coordinates');
        setFetchingGeo(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uploadedBy', userData?.email || 'journalist');

      const response = await api.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data && response.data.url) {
        setUploadedImages([...uploadedImages, response.data.url]);
      }
    } catch (error) {
      console.error('Error uploading file', error);
      alert(isRtl ? 'فشل رفع الصورة' : 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
  };

  const deleteViolation = async (id: string) => {
    if (window.confirm(isRtl ? 'هل أنت متأكد من حذف هذا الانتهاك؟' : 'Are you sure you want to delete this documented violation?')) {
      try {
        await api.delete(`/api/violations/${id}`);
        setViolations(violations.filter(v => v.id !== id));
      } catch (error) {
        console.error('Error deleting violation', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!victimName || !governorate || !date || !violationType || !description) {
      alert(isRtl ? 'يرجى ملء جميع الحقول الإلزامية المطلوبة' : 'Please fill out all mandatory fields');
      return;
    }

    setSubmitLoading(true);

    const payload = {
      reporterName,
      reporterPhone,
      victimName,
      victimInstitution,
      governorate,
      district,
      date,
      perpetrator,
      type: violationType,
      description,
      evidenceLinks: uploadedImages,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      status: 'pending' // Default status for approval
    };

    try {
      await api.post('/api/violations', payload);
      alert(isRtl ? 'تم تسجيل وتوثيق الانتهاك بنجاح بانتظار موافقة الإدارة' : 'Violation documented successfully, pending admin review');
      
      // Reset form fields
      setVictimName('');
      setVictimInstitution('');
      setGovernorate('');
      setDistrict('');
      setDate('');
      setPerpetrator('');
      setViolationType('');
      setDescription('');
      setLatitude('');
      setLongitude('');
      setUploadedImages([]);
      setShowAddForm(false);
      fetchViolations();
    } catch (error) {
      console.error('Error recording violation', error);
      alert(isRtl ? 'حدث خطأ أثناء إرسال تقرير الانتهاك' : 'An error occurred while submitting the violation report');
    } finally {
      setSubmitLoading(false);
    }
  };

  const filteredViolations = violations.filter(v => {
    const matchesSearch = 
      (v.victimName && v.victimName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (v.type && v.type.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (v.governorate && v.governorate.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <ShieldAlert size={32} className="text-rose-600 animate-pulse" />
            {isRtl ? 'توثيق الانتهاكات الصحفية' : 'Document Press Violations'}
          </h1>
          <p className="text-slate-500 mt-1">
            {isRtl 
              ? 'نظام داخلي مخصص للصحفيين لرصد وتوثيق الانتهاكات في المحافظات اليمنية مدعوماً بالبيانات والموقع الجغرافي والوثائق مادية.' 
              : 'Internal reporting system for journalists to monitor, track, and document press freedom violations in Yemen.'}
          </p>
        </div>
        
        {!showAddForm && (
          <button 
            onClick={() => setShowAddForm(true)}
            className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-rose-100 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Plus size={20} />
            {isRtl ? 'بلاغ ورصد جديد' : 'New Report'}
          </button>
        )}
      </div>

      {showAddForm ? (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden animate-fade-in">
          <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg">{isRtl ? 'ملف توثيق انتهاك جديد' : 'New Violation File Record'}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{isRtl ? 'يرجى تحري الدقة الكاملة وتضمين الشواهد' : 'Please provide accurate data with evidence'}</p>
            </div>
            <button 
              type="button" 
              onClick={() => setShowAddForm(false)}
              className="p-2 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-8 space-y-8">
            {/* Reporter Profile Block */}
            <div className="p-6 bg-slate-50 border border-slate-200/60 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <User size={14} className="text-slate-400" />
                  {isRtl ? 'اسم المستلم والموثق' : 'Reporter / Documenter Name'}
                </label>
                <input 
                  type="text"
                  required
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 font-medium text-slate-800 focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Phone size={14} className="text-slate-400" />
                  {isRtl ? 'هاتف التواصل الخاص بك' : 'Reporter Contact Phone'}
                </label>
                <input 
                  type="tel"
                  placeholder="00967..."
                  value={reporterPhone}
                  onChange={(e) => setReporterPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 text-slate-800 focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>
            </div>

            {/* Victim & Basic details */}
            <div>
              <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-3 mb-6">{isRtl ? '1. تفاصيل الضحية ومكان الحدث' : '1. Victim & Location'}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">{isRtl ? 'اسم الضحية (الصحفي / المؤسسة) *' : 'Victim Name (Journalist or Entity) *'}</label>
                  <input 
                    type="text" 
                    required
                    placeholder={isRtl ? 'مثال: أحمد عبد الله اليماني' : 'e.g., Ahmed Abdullah Al-Yamani'}
                    value={victimName}
                    onChange={(e) => setVictimName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-transparent focus:bg-white focus:border-rose-500 focus:ring-0 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">{isRtl ? 'المؤسسة الإعلامية التي يعمل بها' : 'Affiliation Media Org'}</label>
                  <input 
                    type="text" 
                    placeholder={isRtl ? 'الصحيفة، القناة، الموقع الإلكتروني...' : 'Newspaper, Channel, Website...'}
                    value={victimInstitution}
                    onChange={(e) => setVictimInstitution(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-transparent focus:bg-white focus:border-rose-500 focus:ring-0 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">{isRtl ? 'المحافظة *' : 'Governorate *'}</label>
                  <select 
                    required
                    value={governorate}
                    onChange={(e) => setGovernorate(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-transparent focus:bg-white focus:border-rose-500 focus:ring-0 outline-none transition-all font-medium"
                  >
                    <option value="">{isRtl ? 'اختر المحافظة' : 'Select Governorate'}</option>
                    {governorates.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">{isRtl ? 'المديرية / المنطقة' : 'District / Area'}</label>
                  <input 
                    type="text" 
                    placeholder={isRtl ? 'مثال: المعلا، الحصبة...' : 'e.g., Crater, Al-Hasaba...'}
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-transparent focus:bg-white focus:border-rose-500 focus:ring-0 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">{isRtl ? 'تاريخ وقوع الانتهاك *' : 'Date of Occurrence *'}</label>
                  <input 
                    type="date" 
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-transparent focus:bg-white focus:border-rose-500 focus:ring-0 outline-none transition-all font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">{isRtl ? 'الجهة الفاعلة / الجاني' : 'Perpetrator / Committer'}</label>
                  <input 
                    type="text" 
                    placeholder={isRtl ? 'قوات أمنية، مسلحين، حزام أمني...' : 'Security forces, armed groups, militia...'}
                    value={perpetrator}
                    onChange={(e) => setPerpetrator(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-transparent focus:bg-white focus:border-rose-500 focus:ring-0 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Spatial Location Block */}
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl text-white space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <h4 className="font-bold text-white flex items-center gap-2">
                    <MapPin className="text-rose-400" size={20} />
                    {isRtl ? 'البيانات المكانية الدقيقة (GPS/Spatial Coordinates)' : 'Precise Spatial data (GPS Coordinates)'}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    {isRtl 
                      ? 'يوصى بتسجيل إحداثيات خطوط العرض والطول لتوثيق مكان الحدث بشكل دقيق على الخريطة الوطنية التفاعلية.' 
                      : 'Recommended to record latitude and longitude coordinates for accurate interactive mapping.'}
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={fetchingGeo}
                  className="bg-white hover:bg-slate-100 text-slate-900 px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 self-start transition-all cursor-pointer"
                >
                  {fetchingGeo ? <Loader2 size={14} className="animate-spin text-rose-500" /> : <Compass size={14} className="text-blue-600 animate-spin-slow" />}
                  {isRtl ? 'التقاط إحداثياتي الحالية' : 'Capture Current GPS'}
                </button>
              </div>

              {geoError && (
                <div className="p-3 bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle size={16} />
                  <span>{geoError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{isRtl ? 'خط العرض (Latitude)' : 'Latitude'}</label>
                  <input 
                    type="text" 
                    placeholder="E.g., 12.78500" 
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 rounded-xl border border-slate-700 text-white focus:border-rose-500 outline-none font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{isRtl ? 'خط الطول (Longitude)' : 'Longitude'}</label>
                  <input 
                    type="text" 
                    placeholder="E.g., 44.98100" 
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 rounded-xl border border-slate-700 text-white focus:border-rose-500 outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Violation Classification & Incident description */}
            <div>
              <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-3 mb-6">{isRtl ? '2. تصنيف سردية التفاصيل' : '2. Classification & Narrative'}</h4>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">{isRtl ? 'نوع الانتهاك الرئيسي *' : 'Violation Classification Type *'}</label>
                  <select 
                    required
                    value={violationType}
                    onChange={(e) => setViolationType(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-transparent focus:bg-white focus:border-rose-500 focus:ring-0 outline-none transition-all font-medium"
                  >
                    <option value="">{isRtl ? 'اختر نوع الانتهاك' : 'Choose violation type'}</option>
                    {violationTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">{isRtl ? 'تفاصيل الواقعة الكاملة (سرد مفصل) *' : 'Detailed Story Narrative *'}</label>
                  <textarea 
                    required
                    rows={6}
                    placeholder={isRtl ? 'اكتب هنا تفاصيل الحادث بالتاريخ والوقت والحي والملابسات الكاملة...' : 'Write complete incident report narrative describing context...'}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-transparent focus:bg-white focus:border-rose-500 focus:ring-0 outline-none resize-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Evidence File attachment & Pictures */}
            <div>
              <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-3 mb-6">{isRtl ? '3. الملاحق والوثائق والمستندات المصورة' : '3. Photo Evidence & Documents'}</h4>
              <div className="space-y-6">
                <label className="text-sm font-bold text-slate-700 block">{isRtl ? 'صور الدلائل كشهادات أو آثار الاعتداء أو وثائق رسمية' : 'Images of evidence, official papers or physical damages'}</label>
                
                <div className="flex flex-wrap gap-4">
                  {uploadedImages.map((img, index) => (
                    <div key={index} className="relative w-28 h-28 rounded-2xl overflow-hidden border border-slate-200 group">
                      <img 
                        src={img} 
                        alt="Evidence Preview" 
                        loading="lazy"
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                        title={isRtl ? 'إزالة' : 'Remove'}
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ))}

                  <label className="w-28 h-28 rounded-2xl border-2 border-dashed border-slate-300 hover:border-rose-500 bg-slate-50 flex flex-col justify-center items-center gap-1 cursor-pointer transition-all hover:bg-slate-100">
                    {uploading ? (
                      <Loader2 className="animate-spin text-rose-500" size={24} />
                    ) : (
                      <>
                        <Upload size={24} className="text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-500">{isRtl ? 'إرفاق صورة' : 'Upload Image'}</span>
                      </>
                    )}
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-4 border-t border-slate-100 pt-8">
              <button 
                type="button"
                onClick={() => setShowAddForm(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-4 rounded-2xl transition-all text-center cursor-pointer"
              >
                {isRtl ? 'إلغاء الأمر' : 'Cancel'}
              </button>
              
              <button 
                type="submit"
                disabled={submitLoading || uploading}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-rose-100 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {submitLoading ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                {isRtl ? 'تسجيل البلاغ في لوحة المراقبة' : 'Commit Record to Monitor'}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            <div className="bg-white p-6 border border-slate-200 shadow-sm rounded-2xl">
              <h4 className="text-slate-500 text-xs font-bold uppercase tracking-wider">{isRtl ? 'الانتهاكات الإجمالية' : 'All Violations'}</h4>
              <p className="text-3xl font-black text-slate-900 mt-1">{violations.length}</p>
            </div>
            <div className="bg-white p-6 border border-slate-200 shadow-sm rounded-2xl">
              <h4 className="text-slate-500 text-xs font-bold uppercase tracking-wider">{isRtl ? 'موافقة معلقة' : 'Pending Verification'}</h4>
              <p className="text-3xl font-black text-amber-600 mt-1">{violations.filter(v => v.status === 'pending').length}</p>
            </div>
            <div className="bg-white p-6 border border-slate-200 shadow-sm rounded-2xl">
              <h4 className="text-slate-500 text-xs font-bold uppercase tracking-wider">{isRtl ? 'معتمدة ومنشورة' : 'Verified & Live'}</h4>
              <p className="text-3xl font-black text-emerald-600 mt-1">{violations.filter(v => v.status === 'verified').length}</p>
            </div>
            <div className="bg-white p-6 border border-slate-200 shadow-sm rounded-2xl">
              <h4 className="text-slate-500 text-xs font-bold uppercase tracking-wider">{isRtl ? 'بلاغات مرفوضة' : 'Rejected Reports'}</h4>
              <p className="text-3xl font-black text-rose-600 mt-1">{violations.filter(v => v.status === 'rejected').length}</p>
            </div>
          </div>

          {/* Search & filters */}
          <div className="bg-white p-4 border border-slate-200 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder={isRtl ? 'البحث عن ضحية، نوع اعتداء أو محافظة...' : 'Search victim, type or governorate...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-rose-500 transition-all font-medium"
              />
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              {['all', 'pending', 'verified', 'rejected'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`flex-1 md:flex-initial px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === st 
                      ? 'bg-slate-900 border-slate-900 text-white shadow-sm' 
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {st === 'all' && (isRtl ? 'كل البلاغات' : 'All')}
                  {st === 'pending' && (isRtl ? 'معلقة' : 'Pending')}
                  {st === 'verified' && (isRtl ? 'معتمدة' : 'Verified')}
                  {st === 'rejected' && (isRtl ? 'مرفوضة' : 'Rejected')}
                </button>
              ))}
            </div>
          </div>

          {/* Violations Directory Panel */}
          {loading ? (
            <div className="flex justify-center items-center py-24">
              <Loader2 className="animate-spin text-rose-600" size={48} />
            </div>
          ) : filteredViolations.length > 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-start">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-bold uppercase font-mono tracking-wider">
                    <tr>
                      <th className="px-6 py-4 text-start">{isRtl ? 'الصحفي الضحية' : 'Victim'}</th>
                      <th className="px-6 py-4 text-start">{isRtl ? 'التصنيف' : 'Type'}</th>
                      <th className="px-6 py-4 text-start">{isRtl ? 'الموقع والمحافظة' : 'Location'}</th>
                      <th className="px-6 py-4 text-start">{isRtl ? 'الموقع الجغرافي دقيق' : 'Coordinates'}</th>
                      <th className="px-6 py-4 text-start">{isRtl ? 'الحالة' : 'Status'}</th>
                      <th className="px-6 py-4 text-center">{isRtl ? 'إجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredViolations.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">
                          <div>{v.victimName}</div>
                          {v.victimInstitution && <div className="text-xs text-slate-400 font-normal mt-0.5">{v.victimInstitution}</div>}
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-slate-150 border border-slate-200 text-slate-700 px-3 py-1 rounded-xl text-xs font-bold">
                            {v.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-slate-700 text-xs font-medium">
                            <MapPin size={14} className="text-rose-400" />
                            <span>{v.governorate}</span>
                            {v.district && <span className="text-slate-400 font-normal"> - {v.district}</span>}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{v.date}</div>
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-500 text-xs">
                          {v.latitude && v.longitude ? (
                            <span className="text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-emerald-100">
                              Lat: {v.latitude}, Lng: {v.longitude}
                            </span>
                          ) : (
                            <span className="text-slate-300">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase border ${
                            v.status === 'verified' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            v.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                            'bg-amber-50 text-amber-700 border-amber-100'
                          }`}>
                            {v.status === 'verified' && (isRtl ? 'معتمد' : 'Verified')}
                            {v.status === 'rejected' && (isRtl ? 'مرفوض' : 'Rejected')}
                            {v.status === 'pending' && (isRtl ? 'معلق' : 'Pending')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => {
                                alert(`
                                  -- تفاصيل التقرير --
                                  موثق البلاغ: ${v.reporterName} (${v.reporterPhone || 'بدون هاتف'})
                                  الضحية: ${v.victimName} (${v.victimInstitution || 'مستقل'})
                                  المحافظة: ${v.governorate} - ${v.district || 'كامل المديرية'}
                                  الجهة الفاعلة: ${v.perpetrator || 'مجهول'}
                                  التاريخ: ${v.date}
                                  القصة الكاملة:
                                  ${v.description}
                                  ${v.latitude && v.longitude ? `الإحداثيات: ${v.latitude}, ${v.longitude}` : ''}
                                `);
                              }}
                              className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                              title={isRtl ? 'عرض التفاصيل' : 'See Details'}
                            >
                              <FileText size={18} />
                            </button>
                            <button
                              onClick={() => deleteViolation(v.id)}
                              className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                              title={isRtl ? 'حذف' : 'Delete'}
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white py-24 rounded-3xl border border-slate-200 text-center">
              <ShieldAlert className="mx-auto text-slate-300 mb-4 animate-bounce-slow" size={48} />
              <h3 className="text-lg font-bold text-slate-950">{isRtl ? 'لا يوجد انتهاكات مسجلة' : 'No recorded violations'}</h3>
              <p className="text-slate-500 text-sm mt-1">{isRtl ? 'انقر على "بلاغ ورصد جديد" لتوثيق أول انتهاك' : 'Click "New Report" to document a press violation'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
