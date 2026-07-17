import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, roles }: { children: React.ReactNode, roles?: string[] }) {
  const { user, userData, loading } = useAuth();

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-950 text-blue-500">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
  </div>;

  if (!user) return <Navigate to="/login" />;

  if (roles && !roles.includes(userData?.role || '')) {
    console.warn(`Access denied. Role "${userData?.role}" not in allowed roles:`, roles);
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}
