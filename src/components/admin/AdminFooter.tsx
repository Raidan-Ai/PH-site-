import React from 'react';
import { useTranslation } from 'react-i18next';

export const AdminFooter = () => {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  return (
    <footer className="mt-auto py-8 border-t border-slate-100 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-400">
        <p className="font-medium">
          © 2026 Press House. All rights reserved.
        </p>
        <div className="flex items-center gap-1">
          <span>Powered by</span>
          <a 
            href="#" 
            className="font-bold text-slate-900 hover:text-blue-600 transition-colors"
          >
            RaidanPro
          </a>
        </div>
      </div>
    </footer>
  );
};
