import React from 'react';
import LegalPage from './LegalPage';
import { useTranslation } from 'react-i18next';

export default function Terms() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  return (
    <LegalPage titleAr="شروط الخدمة" titleEn="Terms of Service">
      {isRtl ? (
        <div className="space-y-12 text-justify text-slate-700 leading-relaxed">
          <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
            <p className="text-sm font-bold text-slate-500 mb-4">آخر تحديث: يونيو 2026</p>
            <h2 className="text-3xl font-black text-slate-900 mb-6">1. مقدمة</h2>
            <p className="text-lg">
              مرحباً بكم في منصة بيت الصحافة (“المنصة”، “الموقع”، “نحن”، “لنا”). باستخدامكم لهذا الموقع أو أي من خدماته الرقمية، فإنكم توافقون على الالتزام بشروط الخدمة هذه وجميع السياسات المرتبطة بها، بما في ذلك سياسة الخصوصية وسياسات النشر والاستخدام المقبول.
              <br /><br />
              إذا كنتم لا توافقون على هذه الشروط، يرجى عدم استخدام الموقع أو أي من خدماته.
            </p>
          </div>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-r-4 border-blue-600 pr-4">2. طبيعة المؤسسة والخدمات</h2>
            <p className="mb-4">بيت الصحافة مؤسسة إعلامية وتنموية مستقلة وغير ربحية تعمل على دعم الصحافة المهنية، وتعزيز الوصول إلى المعلومات، وبناء القدرات الإعلامية، وتطوير المعرفة والبحوث، ودعم حرية التعبير والمساءلة المجتمعية.</p>
            <p className="mb-2">قد تشمل خدماتنا:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
              <li>النشر الإعلامي والصحفي.</li>
              <li>قواعد المعرفة والمكتبات الرقمية.</li>
              <li>البرامج التدريبية والتأهيلية.</li>
              <li>مراكز البلاغات والرصد الإعلامي.</li>
              <li>منصات الذكاء الاصطناعي والأدوات البحثية.</li>
              <li>المشاريع البحثية والأكاديمية.</li>
              <li>خدمات العضوية والمجتمعات المهنية.</li>
              <li>الفعاليات والمؤتمرات وورش العمل.</li>
              <li>الخدمات الرقمية المقدمة للشركاء والمؤسسات.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-r-4 border-blue-600 pr-4">3. أهلية الاستخدام</h2>
            <p className="mb-2">يحق لكم استخدام الموقع إذا:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 mb-4">
              <li>كنتم قادرين قانونياً على إبرام اتفاقيات ملزمة وفق القوانين المعمول بها.</li>
              <li>استخدمتم الخدمات لأغراض مشروعة فقط.</li>
              <li>قدمتم معلومات صحيحة ودقيقة عند إنشاء الحسابات أو التسجيل في البرامج والخدمات.</li>
            </ul>
            <p>يحتفظ بيت الصحافة بحق رفض أو تعليق أو إنهاء أي حساب في حال وجود انتهاك لهذه الشروط.</p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-r-4 border-blue-600 pr-4">4. الحسابات والمستخدمون</h2>
            <p className="mb-2">يتحمل المستخدم المسؤولية الكاملة عن:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 mb-4">
              <li>حماية بيانات الدخول وكلمات المرور.</li>
              <li>جميع الأنشطة التي تتم من خلال حسابه.</li>
              <li>تحديث بياناته عند الحاجة.</li>
            </ul>
            <p>ويجب إخطار إدارة المنصة فوراً عند الاشتباه بأي استخدام غير مصرح به للحساب.</p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-r-4 border-blue-600 pr-4">5. المحتوى المقدم من المستخدمين</h2>
            <p className="mb-4">يحتفظ المستخدم بملكية المحتوى الذي يقوم برفعه أو نشره أو مشاركته عبر المنصة. وبتقديم هذا المحتوى، يمنح المستخدم بيت الصحافة ترخيصاً غير حصري ومحدوداً لاستخدام المحتوى بالقدر اللازم لتشغيل الخدمات وتقديمها وتحسينها وحفظها وأرشفتها وفق أهداف المؤسسة.</p>
            <p className="mb-2">يقر المستخدم بأنه:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
              <li>يمتلك الحقوق القانونية للمحتوى المقدم.</li>
              <li>لا ينتهك حقوق الملكية الفكرية أو الخصوصية أو أي حقوق قانونية أخرى.</li>
              <li>يتحمل المسؤولية الكاملة عن المحتوى الذي ينشره.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-r-4 border-blue-600 pr-4">6. الاستخدام المقبول</h2>
            <p className="mb-2">يُمنع استخدام المنصة لأي من الأغراض التالية:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
              <li>نشر المعلومات الكاذبة أو المضللة عمداً.</li>
              <li>التحريض على العنف أو الكراهية أو التمييز.</li>
              <li>التهديد أو المضايقة أو الإساءة للأفراد أو المؤسسات.</li>
              <li>انتهاك الخصوصية أو نشر البيانات الشخصية دون سند قانوني.</li>
              <li>القرصنة أو الهجمات الإلكترونية أو محاولات الوصول غير المصرح به.</li>
              <li>نشر البرمجيات الضارة أو الأكواد الخبيثة.</li>
              <li>انتحال الشخصية أو تزوير الهوية.</li>
              <li>استخدام المنصة في أنشطة مخالفة للقوانين المحلية أو الدولية.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-r-4 border-blue-600 pr-4">7. النزاهة الصحفية والمهنية</h2>
            <p className="mb-2">يُشجع بيت الصحافة على الالتزام بالمبادئ المهنية التالية:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 mb-4">
              <li>الدقة والتحقق من المعلومات.</li>
              <li>احترام المعايير الأخلاقية للصحافة.</li>
              <li>الشفافية في مصادر المعلومات متى أمكن.</li>
              <li>احترام حقوق الإنسان والكرامة الإنسانية.</li>
              <li>تجنب خطاب الكراهية والتحريض.</li>
            </ul>
            <p>ولا تتحمل المؤسسة المسؤولية عن الآراء أو المواد المنشورة من قبل المستخدمين أو الجهات الخارجية.</p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-r-4 border-blue-600 pr-4">8. خدمات الذكاء الاصطناعي</h2>
            <p className="mb-4">قد توفر المنصة أدوات تعتمد على تقنيات الذكاء الاصطناعي.</p>
            <p className="mb-2">ويقر المستخدم بأن:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 mb-4">
              <li>مخرجات الذكاء الاصطناعي قد تحتوي على أخطاء أو معلومات غير مكتملة.</li>
              <li>لا تشكل المخرجات استشارة قانونية أو مالية أو طبية أو مهنية.</li>
              <li>يتحمل المستخدم مسؤولية التحقق من النتائج قبل الاعتماد عليها أو نشرها.</li>
            </ul>
            <p>ويحتفظ بيت الصحافة بحق تحسين أو تعديل أو إيقاف أي خدمة تعتمد على الذكاء الاصطناعي في أي وقت.</p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-r-4 border-blue-600 pr-4">9. الملكية الفكرية</h2>
            <p className="mb-2">جميع الحقوق المتعلقة بالموقع، بما في ذلك:</p>
            <ul className="flex flex-wrap gap-2 text-slate-600 mb-4 list-none">
              <li className="bg-slate-100 px-3 py-1 rounded-full">التصميمات</li>
              <li className="bg-slate-100 px-3 py-1 rounded-full">الشعارات</li>
              <li className="bg-slate-100 px-3 py-1 rounded-full">قواعد البيانات</li>
              <li className="bg-slate-100 px-3 py-1 rounded-full">البرمجيات</li>
              <li className="bg-slate-100 px-3 py-1 rounded-full">المحتوى المؤسسي</li>
              <li className="bg-slate-100 px-3 py-1 rounded-full">العلامات التجارية</li>
            </ul>
            <p>مملوكة لبيت الصحافة أو لأصحاب الحقوق المرخصين لها، وتحميها القوانين الوطنية والدولية المتعلقة بالملكية الفكرية. ولا يجوز نسخ أو إعادة إنتاج أو توزيع أي جزء من المنصة دون موافقة خطية مسبقة.</p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-r-4 border-blue-600 pr-4">10. المحتوى والروابط الخارجية</h2>
            <p className="mb-2">قد تحتوي المنصة على روابط أو خدمات مقدمة من أطراف ثالثة. لا يتحمل بيت الصحافة أي مسؤولية عن:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 mb-4">
              <li>محتوى المواقع الخارجية.</li>
              <li>سياسات الخصوصية الخاصة بالأطراف الثالثة.</li>
              <li>الخدمات أو المنتجات المقدمة من جهات خارجية.</li>
            </ul>
            <p>ويكون استخدام تلك الخدمات على مسؤولية المستخدم الخاصة.</p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-r-4 border-blue-600 pr-4">11. حماية البيانات والخصوصية</h2>
            <p>تتم معالجة البيانات الشخصية وفق سياسة الخصوصية الخاصة بالمؤسسة. يلتزم بيت الصحافة باتخاذ تدابير تقنية وتنظيمية معقولة لحماية البيانات، مع الإقرار بأن أي نظام إلكتروني لا يمكن ضمان أمنه بشكل مطلق.</p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-r-4 border-blue-600 pr-4">12. إيقاف أو تعليق الخدمات</h2>
            <p className="mb-2">يحق للمؤسسة:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 mb-4">
              <li>تعليق الحسابات المخالفة.</li>
              <li>إزالة المحتوى المخالف.</li>
              <li>تقييد الوصول إلى بعض الخدمات.</li>
              <li>إنهاء استخدام أي مستخدم عند الضرورة.</li>
            </ul>
            <p>ويتم ذلك وفق تقدير المؤسسة وبما يحقق سلامة المنصة ومستخدميها.</p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-r-4 border-blue-600 pr-4">13. إخلاء المسؤولية</h2>
            <p className="mb-2">يتم توفير الموقع والخدمات على أساس “كما هي” (As Is) و”حسب التوفر” (As Available). ولا تقدم المؤسسة أي ضمانات صريحة أو ضمنية بشأن:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
              <li>استمرارية الخدمة دون انقطاع.</li>
              <li>خلو الخدمات من الأخطاء.</li>
              <li>دقة أو اكتمال جميع المعلومات المنشورة.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-r-4 border-blue-600 pr-4">14. حدود المسؤولية</h2>
            <p>إلى الحد المسموح به قانوناً، لا يتحمل بيت الصحافة أو موظفوه أو شركاؤه أو ممثلوه أي مسؤولية عن الأضرار المباشرة أو غير المباشرة أو العرضية أو التبعية الناتجة عن استخدام الموقع أو عدم القدرة على استخدامه.</p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-r-4 border-blue-600 pr-4">15. التعويض</h2>
            <p className="mb-2">يوافق المستخدم على تعويض وحماية بيت الصحافة وموظفيه وشركائه من أي مطالبات أو خسائر أو مسؤوليات أو تكاليف تنشأ نتيجة:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
              <li>انتهاك هذه الشروط.</li>
              <li>إساءة استخدام الخدمات.</li>
              <li>انتهاك حقوق الغير.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-r-4 border-blue-600 pr-4">16. التعديلات على الشروط</h2>
            <p>يجوز للمؤسسة تعديل هذه الشروط في أي وقت. وسيتم نشر النسخة المحدثة عبر الموقع مع تحديث تاريخ السريان، ويُعد استمرار استخدام الخدمات بعد التعديل موافقة على الشروط الجديدة.</p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-r-4 border-blue-600 pr-4">17. القانون الواجب التطبيق</h2>
            <p>تُفسر هذه الشروط وفق القوانين والاتفاقيات ذات الصلة التي تنظم عمل المؤسسة، مع مراعاة المعايير الدولية لحرية التعبير وحقوق الإنسان وحماية البيانات كلما كان ذلك مناسباً.</p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-r-4 border-blue-600 pr-4">18. التواصل</h2>
            <p>للاستفسارات المتعلقة بشروط الخدمة أو الحقوق القانونية أو الإبلاغ عن الانتهاكات، يمكن التواصل عبر القنوات الرسمية المعلنة على موقع بيت الصحافة.</p>
          </section>

          <div className="bg-slate-900 text-white p-10 rounded-[48px] shadow-2xl relative overflow-hidden mt-12 text-center">
            <div className="relative z-10">
              <p className="text-slate-300 text-lg mb-6 font-medium">باستخدامكم لمنصة بيت الصحافة، فإنكم تقرون بقراءة وفهم وقبول شروط الخدمة هذه بالكامل.</p>
              <a href="mailto:info@presshouse.org" className="inline-flex items-center justify-center px-8 py-4 text-sm font-bold tracking-wide text-slate-900 transition-all duration-200 bg-white border border-transparent rounded-full hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900">
                تواصل معنا للاستفسارات القانونية
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-12 text-justify text-slate-700 leading-relaxed">
          <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
            <p className="text-sm font-bold text-slate-500 mb-4">Last Update: June 2026</p>
            <h2 className="text-3xl font-black text-slate-900 mb-6">1. Introduction</h2>
            <p className="text-lg">
              Welcome to the Press House platform ("Platform", "Website", "We", "Us", "Our"). By using this website or any of its digital services, you agree to be bound by these Terms of Service and all related policies, including the Privacy Policy and Acceptable Use Policy.
              <br /><br />
              If you do not agree to these terms, please do not use the site or any of its services.
            </p>
          </div>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-l-4 border-blue-600 pl-4">2. Organization and Services</h2>
            <p className="mb-4">Press House is an independent non-profit media and development organization working to support professional journalism, enhance access to information, build media capacity, develop knowledge and research, and support freedom of expression and social accountability.</p>
            <p className="mb-2">Our services may include:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
              <li>Media and journalistic publishing.</li>
              <li>Knowledge bases and digital libraries.</li>
              <li>Training and qualification programs.</li>
              <li>Reporting centers and media monitoring.</li>
              <li>AI platforms and research tools.</li>
              <li>Research and academic projects.</li>
              <li>Membership services and professional communities.</li>
              <li>Events, conferences, and workshops.</li>
              <li>Digital services provided to partners and institutions.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-l-4 border-blue-600 pl-4">3. Eligibility</h2>
            <p className="mb-2">You may use the site if you:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 mb-4">
              <li>Are legally capable of entering into binding agreements according to applicable laws.</li>
              <li>Use the services for lawful purposes only.</li>
              <li>Provide correct and accurate information when creating accounts or registering for programs and services.</li>
            </ul>
            <p>Press House reserves the right to refuse, suspend, or terminate any account in case of a violation of these terms.</p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-l-4 border-blue-600 pl-4">4. Accounts and Users</h2>
            <p className="mb-2">The user is fully responsible for:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 mb-4">
              <li>Protecting login credentials and passwords.</li>
              <li>All activities carried out through their account.</li>
              <li>Updating their data when needed.</li>
            </ul>
            <p>You must notify the platform administration immediately upon suspecting any unauthorized use of the account.</p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-l-4 border-blue-600 pl-4">5. User Content</h2>
            <p className="mb-4">The user retains ownership of the content they upload, publish, or share via the platform. By submitting this content, the user grants Press House a non-exclusive, limited license to use the content to the extent necessary to operate, provide, improve, save, and archive the services in accordance with the organization's goals.</p>
            <p className="mb-2">The user acknowledges that they:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
              <li>Possess the legal rights to the submitted content.</li>
              <li>Do not violate intellectual property rights, privacy, or any other legal rights.</li>
              <li>Bear full responsibility for the content they publish.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-l-4 border-blue-600 pl-4">6. Acceptable Use</h2>
            <p className="mb-2">Using the platform for any of the following purposes is prohibited:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
              <li>Knowingly publishing false or misleading information.</li>
              <li>Incitement to violence, hatred, or discrimination.</li>
              <li>Threatening, harassing, or abusing individuals or institutions.</li>
              <li>Violating privacy or publishing personal data without a legal basis.</li>
              <li>Hacking, cyberattacks, or unauthorized access attempts.</li>
              <li>Publishing malware or malicious code.</li>
              <li>Impersonation or identity forgery.</li>
              <li>Using the platform for activities that violate local or international laws.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-l-4 border-blue-600 pl-4">7. Journalistic and Professional Integrity</h2>
            <p className="mb-2">Press House encourages adherence to the following professional principles:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 mb-4">
              <li>Accuracy and information verification.</li>
              <li>Respecting the ethical standards of journalism.</li>
              <li>Transparency in information sources when possible.</li>
              <li>Respecting human rights and human dignity.</li>
              <li>Avoiding hate speech and incitement.</li>
            </ul>
            <p>The organization is not responsible for opinions or materials published by users or third parties.</p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-l-4 border-blue-600 pl-4">8. AI Services</h2>
            <p className="mb-4">The platform may provide tools based on artificial intelligence technologies.</p>
            <p className="mb-2">The user acknowledges that:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 mb-4">
              <li>AI outputs may contain errors or incomplete information.</li>
              <li>Outputs do not constitute legal, financial, medical, or professional advice.</li>
              <li>The user is responsible for verifying the results before relying on or publishing them.</li>
            </ul>
            <p>Press House reserves the right to improve, modify, or suspend any AI-based service at any time.</p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-l-4 border-blue-600 pl-4">9. Intellectual Property</h2>
            <p className="mb-2">All rights related to the site, including:</p>
            <ul className="flex flex-wrap gap-2 text-slate-600 mb-4 list-none">
              <li className="bg-slate-100 px-3 py-1 rounded-full">Designs</li>
              <li className="bg-slate-100 px-3 py-1 rounded-full">Logos</li>
              <li className="bg-slate-100 px-3 py-1 rounded-full">Databases</li>
              <li className="bg-slate-100 px-3 py-1 rounded-full">Software</li>
              <li className="bg-slate-100 px-3 py-1 rounded-full">Institutional Content</li>
              <li className="bg-slate-100 px-3 py-1 rounded-full">Trademarks</li>
            </ul>
            <p>Are owned by Press House or its licensed rights holders and are protected by national and international intellectual property laws. No part of the platform may be copied, reproduced, or distributed without prior written consent.</p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-l-4 border-blue-600 pl-4">10. Content and External Links</h2>
            <p className="mb-2">The platform may contain links or services provided by third parties. Press House bears no responsibility for:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 mb-4">
              <li>The content of external websites.</li>
              <li>The privacy policies of third parties.</li>
              <li>Services or products provided by external parties.</li>
            </ul>
            <p>The use of these services is at the user's own risk.</p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-l-4 border-blue-600 pl-4">11. Data Protection and Privacy</h2>
            <p>Personal data is processed in accordance with the organization's Privacy Policy. Press House is committed to taking reasonable technical and organizational measures to protect data, acknowledging that no electronic system can guarantee absolute security.</p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-l-4 border-blue-600 pl-4">12. Suspension or Termination of Services</h2>
            <p className="mb-2">The organization has the right to:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 mb-4">
              <li>Suspend violating accounts.</li>
              <li>Remove violating content.</li>
              <li>Restrict access to certain services.</li>
              <li>Terminate any user's access when necessary.</li>
            </ul>
            <p>This is done at the discretion of the organization and to ensure the safety of the platform and its users.</p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-l-4 border-blue-600 pl-4">13. Disclaimer</h2>
            <p className="mb-2">The site and services are provided on an "As Is" and "As Available" basis. The organization makes no express or implied warranties regarding:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
              <li>Uninterrupted service continuity.</li>
              <li>Error-free services.</li>
              <li>The accuracy or completeness of all published information.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-l-4 border-blue-600 pl-4">14. Limitation of Liability</h2>
            <p>To the extent permitted by law, Press House, its employees, partners, or representatives shall not be liable for any direct, indirect, incidental, or consequential damages resulting from the use of the site or the inability to use it.</p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-l-4 border-blue-600 pl-4">15. Indemnification</h2>
            <p className="mb-2">The user agrees to indemnify and protect Press House, its employees, and partners from any claims, losses, liabilities, or costs arising as a result of:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
              <li>Violation of these terms.</li>
              <li>Misuse of the services.</li>
              <li>Violation of the rights of others.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-l-4 border-blue-600 pl-4">16. Amendments to the Terms</h2>
            <p>The organization may modify these terms at any time. The updated version will be published on the site with the effective date updated, and continued use of the services after the modification constitutes acceptance of the new terms.</p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-l-4 border-blue-600 pl-4">17. Governing Law</h2>
            <p>These terms shall be interpreted in accordance with the relevant laws and agreements governing the organization's work, taking into account international standards for freedom of expression, human rights, and data protection where appropriate.</p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-l-4 border-blue-600 pl-4">18. Communication</h2>
            <p>For inquiries related to the Terms of Service, legal rights, or reporting violations, you can communicate through the official channels announced on the Press House website.</p>
          </section>

          <div className="bg-slate-900 text-white p-10 rounded-[48px] shadow-2xl relative overflow-hidden mt-12 text-center">
            <div className="relative z-10">
              <p className="text-slate-300 text-lg mb-6 font-medium">By using the Press House platform, you acknowledge reading and accepting these Terms of Service in full.</p>
              <a href="mailto:info@presshouse.org" className="inline-flex items-center justify-center px-8 py-4 text-sm font-bold tracking-wide text-slate-900 transition-all duration-200 bg-white border border-transparent rounded-full hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900">
                Contact us for legal inquiries
              </a>
            </div>
          </div>
        </div>
      )}
    </LegalPage>
  );
}
