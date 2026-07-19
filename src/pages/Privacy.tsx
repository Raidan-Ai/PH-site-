import React from 'react';
import LegalPage from './LegalPage';

export default function Privacy() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  return (
    <LegalPage titleAr="سياسة الخصوصية وحماية البيانات" titleEn="Privacy Policy">
      {isRtl ? (
        <div className="space-y-8 text-justify">
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <p className="text-sm font-bold text-slate-500 mb-2">آخر تحديث: يونيو 2026</p>
            <h2 className="text-2xl font-black text-slate-900">مقدمة</h2>
            <p className="mt-4">
              يؤمن بيت الصحافة بأن حرية التعبير والصحافة المستقلة لا يمكن أن تزدهر دون حماية حقيقية للخصوصية والأمن الرقمي وحقوق الأفراد.
              تلتزم المؤسسة بتطبيق أعلى المعايير المهنية والأخلاقية والقانونية في جمع البيانات ومعالجتها وحفظها واستخدامها، مع الاسترشاد بمبادئ اللائحة العامة لحماية البيانات الأوروبية (GDPR)، والمعايير الدولية لحقوق الإنسان، وأفضل الممارسات المتبعة في المؤسسات الإعلامية والحقوقية الدولية.
              إن استخدامكم لمنصة بيت الصحافة أو أي من خدماتها يعني اطلاعكم على هذه السياسة وموافقتكم عليها.
            </p>
          </div>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 border-r-4 border-blue-600 pr-4">أولاً: ميثاق الحماية والالتزام الأخلاقي</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-slate-800">1. مبدأ عدم التسبب بالضرر (Do No Harm)</h3>
                <p>سلامة الأفراد والمصادر والصحفيين والمبلغين والشهود تأتي قبل أي مصلحة إعلامية أو بحثية أو حقوقية. يلتزم بيت الصحافة بعدم نشر أو مشاركة أي معلومات قد تؤدي بشكل مباشر أو غير مباشر إلى تعريض الأفراد للخطر.</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-800">2. سيادة صاحب البيانات على معلوماته</h3>
                <p>يحتفظ أصحاب البيانات بالحق الكامل في معرفة البيانات التي يتم جمعها، طلب تصحيحها، حذفها متى كان ذلك ممكناً، سحب الموافقة، وطلب نسخة منها.</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-800">3. الحماية الخاصة للضحايا والمبلغين</h3>
                <p>يتعامل بيت الصحافة مع الصحفيين المهددين وضحايا الانتهاكات والمبلغين والشهود كفئات تتطلب حماية إضافية، ويتم تطبيق تدابير تقنية وتنظيمية مضاعفة لحمايتهم.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 border-r-4 border-blue-600 pr-4">ثانياً: البيانات التي نجمعها</h2>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>بيانات الهوية:</strong> الاسم، البريد الإلكتروني، رقم الهاتف، المؤسسة.</li>
              <li><strong>بيانات الاستخدام:</strong> عنوان IP، نوع المتصفح، نظام التشغيل، سجلات الدخول.</li>
              <li><strong>البيانات الصحفية والبحثية:</strong> البلاغات، الشهادات، الوثائق، الصور، التسجيلات.</li>
              <li><strong>البيانات التقنية:</strong> ملفات تعريف الارتباط، سجلات الأمان.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 border-r-4 border-blue-600 pr-4">ثالثاً: الأساس القانوني للمعالجة</h2>
            <p>نعالج البيانات بناءً على موافقة المستخدم، تنفيذ عقد، الامتثال للالتزامات القانونية، حماية المصالح الحيوية، أو المصلحة العامة المتعلقة بحرية التعبير.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 border-r-4 border-blue-600 pr-4">رابعاً: كيف نستخدم البيانات</h2>
            <p>تستخدم لتشغيل المنصة، إدارة العضويات، استقبال البلاغات، التوثيق الحقوقي، إعداد الدراسات، وتقديم الدعم. لا يتم بيع البيانات الشخصية لأي طرف ثالث تحت أي ظرف.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 border-r-4 border-blue-600 pr-4">خامساً: تخزين البيانات وأمنها</h2>
            <p>نعتمد سياسة أمنية متعددة الطبقات تشمل التشفير، التحكم في الصلاحيات، التوثيق متعدد العوامل، والنسخ الاحتياطي المشفر.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 border-r-4 border-blue-600 pr-4">سادساً: مشاركة البيانات مع أطراف ثالثة</h2>
            <p>لا تتم المشاركة إلا بموافقة صريحة، أو متطلبات قانونية ملزمة، أو شراكات بحثية بعد إزالة المعلومات التعريفية.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 border-r-4 border-blue-600 pr-4">سابعاً: حقوق المستخدمين</h2>
            <p>يحق لكم الوصول، التصحيح، الحذف، النقل، الاعتراض، وسحب الموافقة عبر قنوات التواصل الرسمية.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 border-r-4 border-blue-600 pr-4">ثامناً: سياسة الاستخدام المقبول (AUP)</h2>
            <p>يُحظر نشر المحتوى غير المشروع، التحريض، التضليل الإعلامي، تزوير الوثائق، انتهاك الخصوصية، أو محاولات الاختراق.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 border-r-4 border-blue-600 pr-4">تاسعاً: سياسة استخدام الذكاء الاصطناعي</h2>
            <p>يجب التحقق من النتائج قبل النشر، الإفصاح عن استخدام الذكاء الاصطناعي، وعدم استخدامه لإنشاء معلومات مضللة.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 border-r-4 border-blue-600 pr-4">عاشراً: الملكية الفكرية والترخيص المفتوح</h2>
            <p>تعود الملكية المؤسسية لبيت الصحافة، بينما يحتفظ المؤلفون بحقوقهم الفكرية. يتم نشر المحتوى المعرفي غالباً تحت رخصة المشاع الإبداعي (CC BY 4.0).</p>
          </section>

          <div className="bg-blue-900 text-white p-8 rounded-[32px]">
            <h2 className="text-2xl font-black mb-4">رسالة المؤسسة</h2>
            <p className="text-blue-100 italic">
              "في بيت الصحافة، لا ننظر إلى البيانات باعتبارها مجرد معلومات، بل باعتبارها مسؤولية أخلاقية وقانونية ومهنية. نؤمن بأن حماية الصحفيين والمصادر والباحثين والضحايا ليست إجراءً تقنياً فحسب، بل جزءاً من رسالتنا في الدفاع عن الحقيقة والعدالة وحق المجتمع في المعرفة."
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-8 text-justify">
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <p className="text-sm font-bold text-slate-500 mb-2">Last Update: June 2026</p>
            <h2 className="text-2xl font-black text-slate-900">Introduction</h2>
            <p className="mt-4">
              Press House believes that freedom of expression and independent journalism cannot flourish without genuine protection for privacy, digital security, and individual rights.
              The organization is committed to applying the highest professional, ethical, and legal standards in data processing, guided by GDPR principles and international human rights standards.
            </p>
          </div>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 border-l-4 border-blue-600 pl-4">I. Protection and Ethical Commitment</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-slate-800">1. Do No Harm Principle</h3>
                <p>The safety of individuals, sources, and journalists comes before any media or research interest. We commit to not sharing information that may directly or indirectly endanger individuals.</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-800">2. Data Subject Sovereignty</h3>
                <p>Data subjects retain full rights to access, correct, delete, and withdraw consent for their personal information.</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-800">3. Special Protection</h3>
                <p>Threatened journalists and victims of violations are treated as priority groups requiring additional technical and organizational protection.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 border-l-4 border-blue-600 pl-4">II. Data We Collect</h2>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Identity Data:</strong> Name, Email, Phone, Organization.</li>
              <li><strong>Usage Data:</strong> IP address, Browser type, OS, Login records.</li>
              <li><strong>Research Data:</strong> Reports, Testimonies, Documents, Media files.</li>
              <li><strong>Technical Data:</strong> Cookies, Security logs.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 border-l-4 border-blue-600 pl-4">III. Legal Basis</h2>
            <p>We process data based on consent, contract execution, legal compliance, or public interest related to freedom of expression.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 border-l-4 border-blue-600 pl-4">IV. Data Usage</h2>
            <p>Used for platform operation, membership management, documentation, and support. We NEVER sell personal data to third parties.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 border-l-4 border-blue-600 pl-4">V. Storage and Security</h2>
            <p>Multi-layered security including encryption, access controls, and multi-factor authentication (MFA).</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 border-l-4 border-blue-600 pl-4">VI. Data Sharing</h2>
            <p>Only shared with explicit consent, legal mandate, or research partnerships with anonymized data.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 border-l-4 border-blue-600 pl-4">VII. User Rights</h2>
            <p>You have the right to access, correct, delete, transfer, and object to processing via our official channels.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 border-l-4 border-blue-600 pl-4">VIII. Acceptable Use (AUP)</h2>
            <p>Prohibited: Illegal content, incitement, disinformation, document forgery, privacy violations, or hacking.</p>
          </section>

          <div className="bg-blue-900 text-white p-8 rounded-[32px]">
            <h2 className="text-2xl font-black mb-4">Our Mission</h2>
            <p className="text-blue-100 italic">
              "At Press House, we do not view data as mere information, but as an ethical and professional responsibility. We believe that protecting journalists and sources is part of our mission to defend truth and justice."
            </p>
          </div>
        </div>
      )}
    </LegalPage>
  );
}
