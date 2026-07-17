import React from 'react';
import LegalPage from './LegalPage';

export default function Terms() {
  return (
    <LegalPage titleAr="شروط الخدمة لموقع بيت الصحافة" titleEn="Terms of Service">
      <p>آخر تحديث: يونيو 2026</p>
      <h2 className="text-2xl font-bold mt-8 mb-4">1. مقدمة</h2>
      <p>مرحباً بكم في منصة بيت الصحافة (“المنصة”، “الموقع”، “نحن”، “لنا”). باستخدامكم لهذا الموقع أو أي من خدماته الرقمية، فإنكم توافقون على الالتزام بشروط الخدمة هذه وجميع السياسات المرتبطة بها، بما في ذلك سياسة الخصوصية وسياسات النشر والاستخدام المقبول.</p>
      <p>إذا كنتم لا توافقون على هذه الشروط، يرجى عدم استخدام الموقع أو أي من خدماته.</p>
      {/* ... insert rest of content here ... */}
    </LegalPage>
  );
}
