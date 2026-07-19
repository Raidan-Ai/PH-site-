import React from 'react';
import LegalPage from './LegalPage';

export default function Terms() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  return (
    <LegalPage titleAr="شروط الخدمة لموقع بيت الصحافة" titleEn="Terms of Service">
      {isRtl ? (
        <div className="space-y-8 text-justify">
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <p className="text-sm font-bold text-slate-500 mb-2">آخر تحديث: يونيو 2026</p>
            <h2 className="text-2xl font-black text-slate-900">1. مقدمة</h2>
            <p className="mt-4">
              مرحباً بكم في منصة بيت الصحافة (“المنصة”، “الموقع”، “نحن”، “لنا”). باستخدامكم لهذا الموقع أو أي من خدماته الرقمية، فإنكم توافقون على الالتزام بشروط الخدمة هذه وجميع السياسات المرتبطة بها، بما في ذلك سياسة الخصوصية وسياسات النشر والاستخدام المقبول.
              إذا كنتم لا توافقون على هذه الشروط، يرجى عدم استخدام الموقع أو أي من خدماته.
            </p>
          </div>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 border-r-4 border-blue-600 pr-4">2. طبيعة المؤسسة والخدمات</h2>
            <p>بيت الصحافة مؤسسة إعلامية وتنموية مستقلة وغير ربحية تعمل على دعم الصحافة المهنية، وتعزيز الوصول إلى المعلومات، وبناء القدرات الإعلامية، وتطوير المعرفة والبحوث، ودعم حرية التعبير والمساءلة المجتمعية.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 border-r-4 border-blue-600 pr-4">3. أهلية الاستخدام</h2>
            <p>يحق لكم استخدام الموقع إذا كنتم قادرين قانونياً على إبرام اتفاقيات ملزمة، واستخدمتم الخدمات لأغراض مشروعة فقط، وقدمتم معلومات صحيحة ودقيقة.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 border-r-4 border-blue-600 pr-4">4. الحسابات والمستخدمون</h2>
            <p>يتحمل المستخدم المسؤولية الكاملة عن حماية بيانات الدخول، وجميع الأنشطة التي تتم من خلال حسابه، ويجب إخطارنا فوراً عند الاشتباه بأي استخدام غير مصرح به.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 border-r-4 border-blue-600 pr-4">5. المحتوى المقدم من المستخدمين</h2>
            <p>يحتفظ المستخدم بملكية المحتوى الذي ينشره، وبتقديم هذا المحتوى يمنح بيت الصحافة ترخيصاً غير حصري لاستخدامه بالقدر اللازم لتشغيل الخدمات وتحسينها وحفظها.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 border-r-4 border-blue-600 pr-4">6. الاستخدام المقبول</h2>
            <p>يُمنع نشر المعلومات الكاذبة، التحريض على العنف أو الكراهية، التهديد أو المضايقة، انتهاك الخصوصية، الهجمات الإلكترونية، أو انتحال الشخصية.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 border-r-4 border-blue-600 pr-4">7. النزاهة الصحفية والمهنية</h2>
            <p>يُشجع بيت الصحافة على الالتزام بالدقة، المعايير الأخلاقية، الشفافية، واحترام حقوق الإنسان والكرامة الإنسانية.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 border-r-4 border-blue-600 pr-4">8. خدمات الذكاء الاصطناعي</h2>
            <p>يقر المستخدم بأن مخرجات الذكاء الاصطناعي قد تحتوي على أخطاء، ولا تشكل استشارة مهنية، ويتحمل المستخدم مسؤولية التحقق من النتائج قبل الاعتماد عليها.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 border-r-4 border-blue-600 pr-4">9. الملكية الفكرية</h2>
            <p>جميع الحقوق المتعلقة بالموقع من تصميمات وشعارات وبرمجيات مملوكة لبيت الصحافة، ولا يجوز نسخها أو توزيعها دون موافقة خطية.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 border-r-4 border-blue-600 pr-4">13. إخلاء المسؤولية</h2>
            <p>يتم توفير الموقع والخدمات على أساس "كما هي" و "حسب التوفر"، ولا تقدم المؤسسة ضمانات بشأن استمرارية الخدمة دون انقطاع.</p>
          </section>

          <div className="bg-slate-900 text-white p-8 rounded-[32px] text-center">
            <p className="text-slate-400 text-sm mb-4">باستخدامكم لمنصة بيت الصحافة، فإنكم تقرون بقراءة وفهم وقبول شروط الخدمة هذه بالكامل.</p>
            <a href="mailto:info@presshouse.org" className="text-blue-400 font-bold hover:underline">تواصل معنا للاستفسارات القانونية</a>
          </div>
        </div>
      ) : (
        <div className="space-y-8 text-justify">
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <p className="text-sm font-bold text-slate-500 mb-2">Last Update: June 2026</p>
            <h2 className="text-2xl font-black text-slate-900">1. Introduction</h2>
            <p className="mt-4">
              Welcome to the Press House platform ("Platform", "Website", "We", "Us", "Our"). By using this website, you agree to be bound by these Terms of Service and all related policies, including the Privacy Policy and Acceptable Use policies.
            </p>
          </div>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 border-l-4 border-blue-600 pl-4">2. Organization and Services</h2>
            <p>Press House is an independent non-profit media organization supporting professional journalism, access to information, media capacity building, and freedom of expression.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 border-l-4 border-blue-600 pl-4">3. Eligibility</h2>
            <p>You may use the site if you are legally capable of entering into binding agreements and use the services for lawful purposes only.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 border-l-4 border-blue-600 pl-4">4. Accounts</h2>
            <p>Users are fully responsible for protecting login credentials and all activities through their accounts.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 border-l-4 border-blue-600 pl-4">5. User Content</h2>
            <p>Users retain ownership of their content. By publishing, you grant Press House a license to use it as necessary to operate and improve the platform.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 border-l-4 border-blue-600 pl-4">6. Acceptable Use</h2>
            <p>Prohibited: False information, incitement, harassment, privacy violations, cyberattacks, or impersonation.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 border-l-4 border-blue-600 pl-4">7. Integrity</h2>
            <p>Press House encourages commitment to accuracy, ethical standards, and human rights.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 border-l-4 border-blue-600 pl-4">8. AI Services</h2>
            <p>AI outputs may contain errors and do not constitute professional advice. Users are responsible for verifying results.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 border-l-4 border-blue-600 pl-4">9. Intellectual Property</h2>
            <p>All site-related rights are owned by Press House or its licensors. Reproduction is prohibited without prior consent.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 border-l-4 border-blue-600 pl-4">13. Disclaimer</h2>
            <p>The site is provided "As Is" without warranties regarding service continuity or error-free operation.</p>
          </section>

          <div className="bg-slate-900 text-white p-8 rounded-[32px] text-center">
            <p className="text-slate-400 text-sm mb-4">By using the Press House platform, you acknowledge reading and accepting these Terms of Service in full.</p>
            <a href="mailto:info@presshouse.org" className="text-blue-400 font-bold hover:underline">Contact us for legal inquiries</a>
          </div>
        </div>
      )}
    </LegalPage>
  );
}
