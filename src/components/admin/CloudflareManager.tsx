import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Plus, Edit2, Trash2, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

interface DNSRecord {
  id: string;
  type: string;
  name: string;
  content: string;
  proxied: boolean;
  ttl: number;
}

export default function CloudflareManager() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  
  const [records, setRecords] = useState<DNSRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DNSRecord | null>(null);
  
  const [formData, setFormData] = useState({
    type: 'A',
    name: '',
    content: '',
    proxied: false,
    ttl: 1
  });

  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dns');
      const data = await res.json();
      if (data.success) {
        setRecords(data.result);
      } else {
        setError(data.errors?.[0]?.message || 'Failed to fetch DNS records');
      }
    } catch (err) {
      setError('Network error while fetching DNS records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const url = editingRecord ? `/api/dns/${editingRecord.id}` : '/api/dns';
    const method = editingRecord ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (data.success) {
        setSuccess(editingRecord ? 'Record updated successfully' : 'Record created successfully');
        setIsFormOpen(false);
        setEditingRecord(null);
        setFormData({ type: 'A', name: '', content: '', proxied: false, ttl: 1 });
        fetchRecords();
      } else {
        setError(data.errors?.[0]?.message || 'Failed to save record');
        setLoading(false);
      }
    } catch (err) {
      setError('Network error while saving DNS record');
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this DNS record?')) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/dns/${id}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (data.success) {
        setSuccess('Record deleted successfully');
        fetchRecords();
      } else {
        setError(data.errors?.[0]?.message || 'Failed to delete record');
        setLoading(false);
      }
    } catch (err) {
      setError('Network error while deleting DNS record');
      setLoading(false);
    }
  };

  const openEditForm = (record: DNSRecord) => {
    setEditingRecord(record);
    setFormData({
      type: record.type,
      name: record.name,
      content: record.content,
      proxied: record.proxied,
      ttl: record.ttl
    });
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Globe className="text-blue-500" />
            {isRtl ? 'إدارة نطاقات Cloudflare' : 'Cloudflare DNS Management'}
          </h2>
          <p className="text-slate-400 mt-1">
            {isRtl ? 'إدارة سجلات DNS الخاصة بالموقع' : 'Manage your website DNS records'}
          </p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={fetchRecords}
            className="p-2 bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={() => {
              setEditingRecord(null);
              setFormData({ type: 'A', name: '', content: '', proxied: false, ttl: 1 });
              setIsFormOpen(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
          >
            <Plus size={18} />
            {isRtl ? 'إضافة سجل' : 'Add Record'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 p-4 rounded-xl flex items-center gap-3">
          <CheckCircle2 size={20} />
          <p>{success}</p>
        </div>
      )}

      {isFormOpen && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <h3 className="text-lg font-bold text-white mb-4">
            {editingRecord ? (isRtl ? 'تعديل سجل' : 'Edit Record') : (isRtl ? 'إضافة سجل جديد' : 'Add New Record')}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Type</label>
                <select 
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="A">A</option>
                  <option value="AAAA">AAAA</option>
                  <option value="CNAME">CNAME</option>
                  <option value="TXT">TXT</option>
                  <option value="MX">MX</option>
                </select>
              </div>
              
              <div className="lg:col-span-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Name</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. www or @"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Content</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. 192.0.2.1"
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={formData.proxied}
                  onChange={(e) => setFormData({...formData, proxied: e.target.checked})}
                  className="w-4 h-4 rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-950"
                />
                <span className="text-sm font-medium text-slate-300">Proxied (Cloudflare)</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button 
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors font-medium"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl transition-colors font-bold disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Record'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/50 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-4">Type</th>
                <th className="p-4">Name</th>
                <th className="p-4">Content</th>
                <th className="p-4">Proxy Status</th>
                <th className="p-4">TTL</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading && records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
                    Loading records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No DNS records found.
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="p-4">
                      <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-xs font-bold">
                        {record.type}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-white">{record.name}</td>
                    <td className="p-4 text-slate-400 truncate max-w-xs">{record.content}</td>
                    <td className="p-4">
                      {record.proxied ? (
                        <span className="text-orange-400 flex items-center gap-1 text-sm font-medium">
                          <Globe size={14} /> Proxied
                        </span>
                      ) : (
                        <span className="text-slate-500 text-sm font-medium">DNS only</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-400 text-sm">
                      {record.ttl === 1 ? 'Auto' : record.ttl}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => openEditForm(record)}
                          className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(record.id)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
