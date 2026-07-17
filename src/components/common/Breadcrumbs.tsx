import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[]; // Optional manual override
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className }) => {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const location = useLocation();

  const generateItems = (): BreadcrumbItem[] => {
    const paths = location.pathname.split('/').filter((p) => p !== '');
    if (paths.length === 0) return [];

    return paths.map((path, index) => {
      const url = `/${paths.slice(0, index + 1).join('/')}`;
      return {
        label: path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' '),
        path: index === paths.length - 1 ? undefined : url,
      };
    });
  };

  const breadcrumbs = items || generateItems();

  if (breadcrumbs.length === 0) return null;

  return (
    <nav className={cn("flex text-sm text-slate-500", className)} aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 rtl:space-x-reverse overflow-hidden whitespace-nowrap">
        <li className="inline-flex items-center">
          <Link to="/" className="inline-flex items-center hover:text-blue-600 transition-colors">
            <Home className="w-4 h-4" />
            <span className="sr-only">Home</span>
          </Link>
        </li>
        
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;
          
          return (
            <li key={index} className="inline-flex items-center">
              {isRtl ? (
                <ChevronLeft className="w-4 h-4 mx-1 text-slate-400 shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 mx-1 text-slate-400 shrink-0" />
              )}
              {isLast || !item.path ? (
                <span className="font-medium text-slate-900 truncate max-w-[200px]" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.path}
                  className="hover:text-blue-600 transition-colors truncate max-w-[150px]"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
