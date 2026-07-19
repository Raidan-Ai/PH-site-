import React from 'react';
import LegalPage from './LegalPage';
import { useTranslation } from 'react-i18next';

export default function Privacy() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  return (
    <LegalPage titleAr="سياسات الخصوصية والاستخدام والملكية" titleEn="Privacy, Usage & IP Policies">
      {isRtl ? (
        <div className="space-y-12 text-justify text-slate-700 leading-relaxed">
          <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
            <p className="text-sm font-bold text-slate-500 mb-4">آخر تحديث: يونيو 2026</p>
            <h2 className="text-3xl font-black text-slate-900 mb-6">مقدمة</h2>
            <p className="text-lg">
              يؤمن بيت الصحافة بأن حرية التعبير والصحافة المستقلة لا يمكن أن تزدهر دون حماية حقيقية للخصوصية والأمن الرقمي وحقوق الأفراد.
              <br /><br />
              تلتزم المؤسسة بتطبيق أعلى المعايير المهنية والأخلاقية والقانونية في جمع البيانات ومعالجتها وحفظها واستخدامها، مع الاسترشاد بمبادئ اللائحة العامة لحماية البيانات الأوروبية (GDPR)، والمعايير الدولية لحقوق الإنسان، وأفضل الممارسات المتبعة في المؤسسات الإعلامية والحقوقية الدولية.
              <br /><br />
              إن استخدامكم لمنصة بيت الصحافة أو أي من خدماتها يعني اطلاعكم على هذه السياسة وموافقتكم عليها.
            </p>
          </div>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-r-4 border-blue-600 pr-4">أولاً: ميثاق الحماية والالتزام الأخلاقي</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">1. مبدأ عدم التسبب بالضرر (Do No Harm)</h3>
                <p className="mb-3">سلامة الأفراد والمصادر والصحفيين والمبلغين والشهود تأتي قبل أي مصلحة إعلامية أو بحثية أو حقوقية.</p>
                <p className="mb-2">يلتزم بيت الصحافة بعدم نشر أو مشاركة أي معلومات قد تؤدي بشكل مباشر أو غير مباشر إلى:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-600 font-medium">
                  <li>تعريض الأفراد للخطر.</li>
                  <li>كشف هويات المصادر المحمية.</li>
                  <li>تهديد السلامة الجسدية أو النفسية.</li>
                  <li>الإضرار بالوضع القانوني أو المهني للأفراد.</li>
                </ul>
                <p className="mt-3">يجوز للمؤسسة حجب أو تأجيل أو إلغاء نشر أي محتوى إذا تبين أن النشر قد يؤدي إلى مخاطر أمنية أو إنسانية.</p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">2. سيادة صاحب البيانات على معلوماته</h3>
                <p className="mb-2">يحتفظ أصحاب البيانات بالحق الكامل في:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-600 font-medium">
                  <li>معرفة البيانات التي يتم جمعها.</li>
                  <li>طلب تصحيح البيانات.</li>
                  <li>طلب حذف البيانات متى كان ذلك ممكناً قانونياً.</li>
                  <li>سحب الموافقة الممنوحة سابقاً.</li>
                  <li>طلب تقييد المعالجة.</li>
                  <li>طلب نسخة من البيانات الشخصية الخاصة بهم.</li>
                </ul>
                <p className="mt-3">لا يتم نشر أو مشاركة المعلومات الحساسة إلا بناءً على موافقة مستنيرة وصريحة من صاحبها أو وفق مقتضيات قانونية ملزمة.</p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">3. الحماية الخاصة للضحايا والمبلغين</h3>
                <p className="mb-2">يتعامل بيت الصحافة مع:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-600 font-medium">
                  <li>الصحفيين المهددين.</li>
                  <li>ضحايا الانتهاكات.</li>
                  <li>المبلغين عن الفساد.</li>
                  <li>الشهود.</li>
                  <li>المصادر الحساسة.</li>
                </ul>
                <p className="mt-3">كفئات تتطلب حماية إضافية. ولهذا يتم تطبيق تدابير تقنية وتنظيمية مضاعفة لحماية هوياتهم وبياناتهم.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-r-4 border-blue-600 pr-4">ثانياً: البيانات التي نجمعها</h2>
            <p className="mb-4">قد نقوم بجمع البيانات التالية:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                <h3 className="font-bold text-slate-900 mb-3">بيانات الهوية</h3>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>الاسم</li>
                  <li>البريد الإلكتروني</li>
                  <li>رقم الهاتف</li>
                  <li>المؤسسة أو جهة العمل</li>
                </ul>
              </div>
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                <h3 className="font-bold text-slate-900 mb-3">بيانات الاستخدام</h3>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>عنوان IP</li>
                  <li>نوع المتصفح</li>
                  <li>نظام التشغيل</li>
                  <li>سجلات الدخول</li>
                  <li>نشاط المستخدم داخل المنصة</li>
                </ul>
              </div>
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                <h3 className="font-bold text-slate-900 mb-3">البيانات الصحفية والبحثية</h3>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>البلاغات</li>
                  <li>الشهادات</li>
                  <li>الوثائق</li>
                  <li>الصور والفيديوهات</li>
                  <li>التسجيلات الصوتية</li>
                  <li>ملفات التحقيقات</li>
                </ul>
              </div>
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                <h3 className="font-bold text-slate-900 mb-3">البيانات التقنية</h3>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>ملفات تعريف الارتباط Cookies</li>
                  <li>سجلات الأمان</li>
                  <li>بيانات مكافحة الاحتيال والهجمات الإلكترونية</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-r-4 border-blue-600 pr-4">ثالثاً: الأساس القانوني للمعالجة</h2>
            <p className="mb-2">نعالج البيانات بناءً على واحد أو أكثر من الأسس التالية:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
              <li>موافقة المستخدم.</li>
              <li>تنفيذ خدمة أو عقد.</li>
              <li>الامتثال للالتزامات القانونية.</li>
              <li>حماية المصالح الحيوية للأفراد.</li>
              <li>المصلحة العامة المتعلقة بحرية التعبير والصحافة والبحث.</li>
              <li>المصالح المشروعة للمؤسسة مع عدم المساس بحقوق الأفراد.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-r-4 border-blue-600 pr-4">رابعاً: كيف نستخدم البيانات</h2>
            <p className="mb-2">تستخدم البيانات من أجل:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 mb-4">
              <li>تشغيل المنصة.</li>
              <li>إدارة العضويات والحسابات.</li>
              <li>استقبال البلاغات والشكاوى.</li>
              <li>التوثيق والرصد الحقوقي.</li>
              <li>إعداد الدراسات والتقارير.</li>
              <li>تقديم الدعم القانوني أو الإعلامي أو الإنساني.</li>
              <li>تطوير الخدمات التقنية.</li>
              <li>تحسين أمن المنصة.</li>
              <li>منع الاحتيال والانتهاكات.</li>
            </ul>
            <p className="font-bold text-rose-600">ولا يتم بيع البيانات الشخصية لأي طرف ثالث تحت أي ظرف.</p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-r-4 border-blue-600 pr-4">خامساً: تخزين البيانات وأمنها</h2>
            <p className="mb-2">يعتمد بيت الصحافة سياسة أمن معلومات متعددة الطبقات تشمل:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 mb-4">
              <li>تشفير البيانات أثناء النقل والتخزين.</li>
              <li>التحكم الصارم في صلاحيات الوصول.</li>
              <li>التوثيق متعدد العوامل.</li>
              <li>النسخ الاحتياطي المشفر.</li>
              <li>سجلات تدقيق ومراقبة أمنية.</li>
              <li>مراجعات دورية للأمن السيبراني.</li>
            </ul>
            <p>
              تقتصر صلاحية الوصول إلى البيانات الحساسة على الموظفين المخولين فقط وفق مبدأ:
              <br /><span className="font-mono text-sm bg-slate-100 px-2 py-1 rounded inline-block mt-1 mb-1" dir="ltr">Least Privilege Access</span>
              <br />أي أقل صلاحية لازمة لأداء المهمة.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-r-4 border-blue-600 pr-4">سادساً: مشاركة البيانات مع أطراف ثالثة</h2>
            <p className="mb-2">لا تتم مشاركة البيانات إلا في الحالات التالية:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 mb-4">
              <li>موافقة صريحة من صاحب البيانات.</li>
              <li>متطلبات قانونية ملزمة.</li>
              <li>شراكات بحثية أو إعلامية بعد إزالة المعلومات التعريفية متى أمكن.</li>
              <li>حماية حياة أو سلامة شخص معرض لخطر وشيك.</li>
            </ul>
            <p>وفي جميع الحالات يتم تطبيق الحد الأدنى اللازم من مشاركة البيانات.</p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-r-4 border-blue-600 pr-4">سابعاً: حقوق المستخدمين</h2>
            <p className="mb-2">يحق لكم:</p>
            <ul className="grid grid-cols-2 md:grid-cols-4 gap-2 text-slate-600 mb-4 list-none list-inside">
              <li>• الوصول إلى بياناتكم</li>
              <li>• تصحيح البيانات</li>
              <li>• حذف البيانات</li>
              <li>• نقل البيانات</li>
              <li>• الاعتراض على المعالجة</li>
              <li>• تقييد المعالجة</li>
              <li>• سحب الموافقة</li>
              <li>• تقديم شكوى</li>
            </ul>
            <p>يمكن تقديم الطلبات عبر قنوات التواصل الرسمية للمؤسسة.</p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-r-4 border-blue-600 pr-4">ثامناً: سياسة الاستخدام المقبول (AUP)</h2>
            <p className="mb-4">يجب استخدام المنصة بصورة قانونية ومهنية وأخلاقية. يُحظر:</p>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-slate-900">المحتوى غير المشروع</h3>
                <p className="text-slate-600">التحريض على العنف، الإرهاب، الكراهية، التمييز، الاتجار بالبشر، الجرائم الإلكترونية.</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-900">التضليل الإعلامي</h3>
                <p className="text-slate-600">نشر معلومات مزيفة عن علم، تزوير الوثائق، فبركة الأدلة، انتحال الشخصيات.</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-900">انتهاك الخصوصية</h3>
                <p className="text-slate-600">نشر البيانات الشخصية دون إذن، كشف المصادر السرية، نشر معلومات قد تعرض الأفراد للخطر.</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-900">إساءة استخدام المنصة</h3>
                <p className="text-slate-600">محاولات الاختراق، جمع البيانات بطريقة غير مصرح بها، تعطيل الخدمات، إرسال الرسائل المزعجة.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-r-4 border-blue-600 pr-4">تاسعاً: سياسة استخدام الذكاء الاصطناعي</h2>
            <p className="mb-2">قد توفر المنصة أدوات ذكاء اصطناعي لأغراض: البحث، التحليل، الترجمة، التصنيف، استخراج المعلومات، والمساعدة الصحفية. ويلتزم المستخدمون بما يلي:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 mb-4">
              <li>التحقق من النتائج قبل النشر.</li>
              <li>الإفصاح عن استخدام الذكاء الاصطناعي عند الحاجة المهنية.</li>
              <li>عدم استخدام الأدوات لإنشاء معلومات مضللة.</li>
              <li>عدم إنتاج حملات تأثير أو تضليل أو تزوير ممنهج.</li>
            </ul>
            <p>كما تحتفظ المؤسسة بحق مراجعة أو حظر أي استخدام ضار أو غير أخلاقي لهذه الأدوات.</p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-r-4 border-blue-600 pr-4">عاشراً: الملكية الفكرية والترخيص المفتوح</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">ملكية المؤسسة</h3>
                <p className="mb-2">تعود ملكية ما يلي إلى بيت الصحافة ما لم يذكر خلاف ذلك:</p>
                <p className="text-slate-600">التصميمات، البرمجيات، قواعد البيانات، المنهجيات، العلامات التجارية، والمحتوى المؤسسي.</p>
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">ملكية المؤلفين والباحثين</h3>
                <p className="text-slate-600">يحتفظ المؤلفون والباحثون والصحفيون بحقوقهم الفكرية الأصلية في أعمالهم ما لم تنص الاتفاقيات الخاصة بالمشروعات على غير ذلك.</p>
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">الترخيص المفتوح للمحتوى المعرفي</h3>
                <p className="mb-2">يجوز للمؤسسة نشر أجزاء من إنتاجها المعرفي تحت رخصة:</p>
                <p className="font-mono text-sm bg-slate-100 px-3 py-2 rounded-lg inline-block mb-3" dir="ltr">Creative Commons Attribution 4.0 (CC BY 4.0)</p>
                <p className="mb-2">أو أي ترخيص مفتوح مشابه يحقق أهداف الوصول الحر للمعرفة. ويشترط في هذه الحالة:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>الإشارة للمصدر.</li>
                  <li>عدم تحريف المحتوى.</li>
                  <li>عدم الادعاء بملكية المحتوى.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">البيانات والأرشيفات الرقمية</h3>
                <p className="mb-2">تخضع الأرشيفات والبيانات التاريخية والوثائق الرقمية لسياسات وصول مختلفة بحسب:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-600 mb-2">
                  <li>درجة الحساسية.</li>
                  <li>حقوق الملكية.</li>
                  <li>اعتبارات الأمن والسلامة.</li>
                  <li>الاتفاقيات مع الجهات المودعة.</li>
                </ul>
                <p className="text-slate-600">وقد يتم تقييد بعض المجموعات الأرشيفية أو إتاحتها بشروط خاصة.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-r-4 border-blue-600 pr-4">الحادي عشر: الاحتفاظ بالبيانات</h2>
            <p className="mb-2">تحتفظ المؤسسة بالبيانات فقط للفترة اللازمة لتحقيق الأغراض المشروعة أو للامتثال للالتزامات القانونية أو الحقوقية أو الأرشيفية. وعند انتهاء الحاجة إليها يتم:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-600">
              <li>حذفها بشكل آمن.</li>
              <li>أو إخفاء هويتها.</li>
              <li>أو أرشفتها وفق ضوابط الحفظ المؤسسي.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-r-4 border-blue-600 pr-4">الثاني عشر: التعديلات</h2>
            <p className="text-slate-600">يجوز لبيت الصحافة تحديث هذه السياسة عند الحاجة. وسيتم نشر النسخة المحدثة عبر الموقع مع بيان تاريخ النفاذ.</p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-r-4 border-blue-600 pr-4">الثالث عشر: التواصل</h2>
            <p className="text-slate-600">للاستفسارات المتعلقة بالخصوصية أو حماية البيانات أو الحقوق القانونية أو طلبات الوصول والتصحيح والحذف، يرجى التواصل عبر القنوات الرسمية المعلنة في موقع بيت الصحافة.</p>
          </section>

          <div className="bg-blue-900 text-white p-10 rounded-[48px] shadow-2xl relative overflow-hidden mt-12">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-800 rounded-full blur-3xl opacity-50 -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-950 rounded-full blur-3xl opacity-50 -ml-20 -mb-20"></div>
            
            <div className="relative z-10">
              <h2 className="text-3xl font-black mb-6">رسالة المؤسسة</h2>
              <p className="text-blue-100/90 text-xl leading-relaxed italic mb-6 font-medium">
                "في بيت الصحافة، لا ننظر إلى البيانات باعتبارها مجرد معلومات، بل باعتبارها مسؤولية أخلاقية وقانونية ومهنية. نؤمن بأن حماية الصحفيين والمصادر والباحثين والضحايا ليست إجراءً تقنياً فحسب، بل جزءاً من رسالتنا في الدفاع عن الحقيقة والعدالة وحق المجتمع في المعرفة."
              </p>
              <p className="text-white text-xl font-bold">
                أنت لست مجرد مستخدم للمنصة، بل شريك في بناء ذاكرة اليمن وحماية حقه في رواية قصته بنفسه.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-12 text-justify text-slate-700 leading-relaxed">
          <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
            <p className="text-sm font-bold text-slate-500 mb-4">Last Update: June 2026</p>
            <h2 className="text-3xl font-black text-slate-900 mb-6">Introduction</h2>
            <p className="text-lg">
              Press House believes that freedom of expression and independent journalism cannot flourish without genuine protection for privacy, digital security, and individual rights.
              <br /><br />
              The organization is committed to applying the highest professional, ethical, and legal standards in data processing, guided by GDPR principles, international human rights standards, and best practices in global media and rights organizations.
              <br /><br />
              By using the Press House platform or any of its services, you acknowledge and agree to this policy.
            </p>
          </div>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-l-4 border-blue-600 pl-4">I. Protection and Ethical Commitment</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">1. Do No Harm Principle</h3>
                <p className="mb-3">The safety of individuals, sources, journalists, whistleblowers, and witnesses takes precedence over any media or research interest.</p>
                <p className="mb-2">Press House commits to not publishing or sharing any information that may directly or indirectly lead to:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-600 font-medium">
                  <li>Endangering individuals.</li>
                  <li>Revealing the identities of protected sources.</li>
                  <li>Threatening physical or psychological safety.</li>
                  <li>Harming the legal or professional status of individuals.</li>
                </ul>
                <p className="mt-3">The organization may withhold, delay, or cancel the publication of any content if it is found that publication may lead to security or humanitarian risks.</p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">2. Data Subject Sovereignty</h3>
                <p className="mb-2">Data subjects retain full rights to:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-600 font-medium">
                  <li>Know what data is collected.</li>
                  <li>Request data correction.</li>
                  <li>Request data deletion when legally possible.</li>
                  <li>Withdraw previously granted consent.</li>
                  <li>Request restriction of processing.</li>
                  <li>Request a copy of their personal data.</li>
                </ul>
                <p className="mt-3">Sensitive information is not published or shared without informed and explicit consent from its owner or under binding legal requirements.</p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">3. Special Protection for Victims and Whistleblowers</h3>
                <p className="mb-2">Press House treats:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-600 font-medium">
                  <li>Threatened journalists.</li>
                  <li>Victims of violations.</li>
                  <li>Whistleblowers reporting corruption.</li>
                  <li>Witnesses.</li>
                  <li>Sensitive sources.</li>
                </ul>
                <p className="mt-3">As categories requiring additional protection. Therefore, doubled technical and organizational measures are applied to protect their identities and data.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-l-4 border-blue-600 pl-4">II. Data We Collect</h2>
            <p className="mb-4">We may collect the following data:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                <h3 className="font-bold text-slate-900 mb-3">Identity Data</h3>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>Name</li>
                  <li>Email address</li>
                  <li>Phone number</li>
                  <li>Organization or workplace</li>
                </ul>
              </div>
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                <h3 className="font-bold text-slate-900 mb-3">Usage Data</h3>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>IP address</li>
                  <li>Browser type</li>
                  <li>Operating system</li>
                  <li>Login records</li>
                  <li>User activity within the platform</li>
                </ul>
              </div>
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                <h3 className="font-bold text-slate-900 mb-3">Journalistic & Research Data</h3>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>Reports and testimonies</li>
                  <li>Documents</li>
                  <li>Photos and videos</li>
                  <li>Audio recordings</li>
                  <li>Investigation files</li>
                </ul>
              </div>
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                <h3 className="font-bold text-slate-900 mb-3">Technical Data</h3>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>Cookies</li>
                  <li>Security logs</li>
                  <li>Anti-fraud and cyber-attack data</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-l-4 border-blue-600 pl-4">III. Legal Basis for Processing</h2>
            <p className="mb-2">We process data based on one or more of the following grounds:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
              <li>User consent.</li>
              <li>Execution of a service or contract.</li>
              <li>Compliance with legal obligations.</li>
              <li>Protection of vital interests of individuals.</li>
              <li>Public interest related to freedom of expression and research.</li>
              <li>Legitimate interests of the organization without prejudicing individual rights.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-l-4 border-blue-600 pl-4">IV. How We Use Data</h2>
            <p className="mb-2">Data is used for:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 mb-4">
              <li>Operating the platform.</li>
              <li>Managing memberships and accounts.</li>
              <li>Receiving reports and complaints.</li>
              <li>Human rights documentation and monitoring.</li>
              <li>Preparing studies and reports.</li>
              <li>Providing legal, media, or humanitarian support.</li>
              <li>Developing technical services.</li>
              <li>Improving platform security.</li>
              <li>Preventing fraud and violations.</li>
            </ul>
            <p className="font-bold text-rose-600">Personal data is NEVER sold to any third party under any circumstances.</p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-l-4 border-blue-600 pl-4">V. Data Storage and Security</h2>
            <p className="mb-2">Press House adopts a multi-layered information security policy that includes:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 mb-4">
              <li>Data encryption during transit and at rest.</li>
              <li>Strict access control.</li>
              <li>Multi-factor authentication (MFA).</li>
              <li>Encrypted backups.</li>
              <li>Security audit and monitoring logs.</li>
              <li>Periodic cybersecurity reviews.</li>
            </ul>
            <p>
              Access to sensitive data is restricted to authorized personnel only based on the principle of:
              <br /><span className="font-mono text-sm bg-slate-100 px-2 py-1 rounded inline-block mt-1 mb-1">Least Privilege Access</span>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-l-4 border-blue-600 pl-4">VI. Data Sharing with Third Parties</h2>
            <p className="mb-2">Data is only shared in the following cases:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 mb-4">
              <li>Explicit consent from the data subject.</li>
              <li>Binding legal requirements.</li>
              <li>Research or media partnerships after removing identifying information when possible.</li>
              <li>Protecting the life or safety of a person in imminent danger.</li>
            </ul>
            <p>In all cases, the minimum necessary data sharing is applied.</p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-l-4 border-blue-600 pl-4">VII. User Rights</h2>
            <p className="mb-2">You have the right to:</p>
            <ul className="grid grid-cols-2 md:grid-cols-4 gap-2 text-slate-600 mb-4 list-none list-inside">
              <li>• Access your data</li>
              <li>• Correct data</li>
              <li>• Delete data</li>
              <li>• Transfer data</li>
              <li>• Object to processing</li>
              <li>• Restrict processing</li>
              <li>• Withdraw consent</li>
              <li>• Submit a complaint</li>
            </ul>
            <p>Requests can be submitted through the official communication channels of the organization.</p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-l-4 border-blue-600 pl-4">VIII. Acceptable Use Policy (AUP)</h2>
            <p className="mb-4">The platform must be used legally, professionally, and ethically. The following are prohibited:</p>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-slate-900">Illegal Content</h3>
                <p className="text-slate-600">Incitement to violence, terrorism, hate speech, discrimination, human trafficking, cybercrimes.</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Disinformation</h3>
                <p className="text-slate-600">Knowingly publishing false information, forging documents, fabricating evidence, impersonation.</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Privacy Violation</h3>
                <p className="text-slate-600">Publishing personal data without permission, revealing confidential sources, publishing information that may endanger individuals.</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Platform Abuse</h3>
                <p className="text-slate-600">Hacking attempts, unauthorized data collection, service disruption, spamming.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-l-4 border-blue-600 pl-4">IX. AI Usage Policy</h2>
            <p className="mb-2">The platform may provide AI tools for: research, analysis, translation, classification, information extraction, and journalistic assistance. Users must:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 mb-4">
              <li>Verify results before publication.</li>
              <li>Disclose AI usage when professionally required.</li>
              <li>Not use tools to generate misleading information.</li>
              <li>Not produce systematic influence, disinformation, or forgery campaigns.</li>
            </ul>
            <p>The organization also reserves the right to review or block any harmful or unethical use of these tools.</p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-l-4 border-blue-600 pl-4">X. Intellectual Property & Open License</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Organization's Property</h3>
                <p className="mb-2">The following belong to Press House unless stated otherwise:</p>
                <p className="text-slate-600">Designs, software, databases, methodologies, trademarks, and institutional content.</p>
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Authors and Researchers' Property</h3>
                <p className="text-slate-600">Authors, researchers, and journalists retain their original intellectual property rights to their work unless specific project agreements state otherwise.</p>
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Open License for Knowledge Content</h3>
                <p className="mb-2">The organization may publish parts of its knowledge production under the license:</p>
                <p className="font-mono text-sm bg-slate-100 px-3 py-2 rounded-lg inline-block mb-3">Creative Commons Attribution 4.0 (CC BY 4.0)</p>
                <p className="mb-2">Or any similar open license that achieves the goals of open access to knowledge. In this case, the following is required:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>Attribution to the source.</li>
                  <li>No distortion of the content.</li>
                  <li>No claiming ownership of the content.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Digital Data and Archives</h3>
                <p className="mb-2">Archives, historical data, and digital documents are subject to different access policies based on:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-600 mb-2">
                  <li>Sensitivity level.</li>
                  <li>Property rights.</li>
                  <li>Security and safety considerations.</li>
                  <li>Agreements with depositing entities.</li>
                </ul>
                <p className="text-slate-600">Some archival collections may be restricted or made available under special conditions.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-l-4 border-blue-600 pl-4">XI. Data Retention</h2>
            <p className="mb-2">The organization retains data only for the period necessary to achieve legitimate purposes or to comply with legal, human rights, or archival obligations. Once no longer needed, it will be:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-600">
              <li>Deleted securely.</li>
              <li>Anonymized.</li>
              <li>Or archived according to institutional preservation guidelines.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-l-4 border-blue-600 pl-4">XII. Amendments</h2>
            <p className="text-slate-600">Press House may update this policy as needed. The updated version will be published on the website indicating the effective date.</p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-l-4 border-blue-600 pl-4">XIII. Contact</h2>
            <p className="text-slate-600">For inquiries regarding privacy, data protection, legal rights, or requests for access, correction, and deletion, please contact us via the official channels announced on the Press House website.</p>
          </section>

          <div className="bg-blue-900 text-white p-10 rounded-[48px] shadow-2xl relative overflow-hidden mt-12">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-800 rounded-full blur-3xl opacity-50 -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-950 rounded-full blur-3xl opacity-50 -ml-20 -mb-20"></div>
            
            <div className="relative z-10">
              <h2 className="text-3xl font-black mb-6">Our Mission</h2>
              <p className="text-blue-100/90 text-xl leading-relaxed italic mb-6 font-medium">
                "At Press House, we do not view data as mere information, but as an ethical, legal, and professional responsibility. We believe that protecting journalists, sources, researchers, and victims is not just a technical measure, but part of our mission to defend truth, justice, and society's right to know."
              </p>
              <p className="text-white text-xl font-bold">
                You are not just a user of the platform, but a partner in building Yemen's memory and protecting its right to tell its own story.
              </p>
            </div>
          </div>
        </div>
      )}
    </LegalPage>
  );
}

