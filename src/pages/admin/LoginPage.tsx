import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMSG, setErrorMSG] = useState('');
  const navigate = useNavigate();
  const { updateUserContext } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMSG('');
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { token, user } = response.data;
      updateUserContext(token, user);
      if (user.role === 'root') {
        navigate('/root');
      } else if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'lawyer') {
        navigate('/lawyer');
      } else if (user.role === 'trainer') {
        navigate('/trainer');
      } else if (user.role === 'editor') {
        navigate('/editor');
      } else if (user.role === 'staff') {
        navigate('/staff');
      } else if (user.role === 'journalist' || user.role === 'content_creator') {
        navigate('/profile');
      } else {
        navigate('/');
      }
    } catch (error: any) {
      setErrorMSG(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-96 space-y-4">
        <h1 className="text-2xl font-bold text-slate-900 text-center">Admin Login</h1>
        {errorMSG && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{errorMSG}</div>}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
