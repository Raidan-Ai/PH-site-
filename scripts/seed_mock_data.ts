import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../database.sqlite');
const db = new Database(dbPath);

console.log('Seeding data...');

// Add a news article if empty
const checkArticles = db.prepare('SELECT count(*) as count FROM articles').get() as { count: number };
if (checkArticles.count === 0) {
  db.prepare(`INSERT INTO articles (title, excerpt, content, cover_image, status, author_id, published_at, show_in_slider) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
    JSON.stringify({ ar: 'المجتمع المدني يدعو لحماية الصحفيين', en: 'Civil Society Calls for Journalist Protection' }),
    JSON.stringify({ ar: 'دعت منظمات المجتمع المدني إلى تعزيز الحماية للصحفيين في مناطق النزاع...', en: 'Civil society organizations called for enhanced protection for journalists...' }),
    JSON.stringify({ ar: '<p>محتوى الخبر هنا</p>', en: '<p>News content here</p>' }),
    'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&q=80&w=1000',
    'published',
    1,
    new Date().toISOString(),
    1
  );
  console.log('Inserted news article.');
}

// Add a project if empty
const checkProjects = db.prepare('SELECT count(*) as count FROM projects').get() as { count: number };
if (checkProjects.count === 0) {
  db.prepare(`INSERT INTO projects (title, description, content, mainImage, status, show_in_slider, category) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
    JSON.stringify({ ar: 'مشروع الصحافة الاستقصائية', en: 'Investigative Journalism Project' }),
    JSON.stringify({ ar: 'تدريب 50 صحفياً على مهارات الصحافة الاستقصائية المتقدمة', en: 'Training 50 journalists on advanced investigative skills' }),
    JSON.stringify({ ar: '<p>محتوى</p>', en: '<p>Content</p>' }),
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=1000',
    'active',
    1,
    'training'
  );
  console.log('Inserted project.');
}

// Add a course if empty
const checkCourses = db.prepare('SELECT count(*) as count FROM courses').get() as { count: number };
if (checkCourses.count === 0) {
  db.prepare(`INSERT INTO courses (title, description, content, image, status, instructor, start_date, duration, location, capacity, is_online, show_in_slider) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    JSON.stringify({ ar: 'الأمن الرقمي للصحفيين', en: 'Digital Security for Journalists' }),
    JSON.stringify({ ar: 'دورة مكثفة في أمن المعلومات والتشفير وحماية المصادر', en: 'Intensive course on info security, encryption and source protection' }),
    JSON.stringify({ ar: '<p>محتوى</p>', en: '<p>Content</p>' }),
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1000',
    'upcoming',
    'أحمد اليمني',
    new Date().toISOString(),
    '5 أيام',
    'مقر بيت الصحافة',
    20,
    0,
    1
  );
  console.log('Inserted course.');
}

// Add a violation if empty
const checkViolations = db.prepare('SELECT count(*) as count FROM violations').get() as { count: number };
if (checkViolations.count === 0) {
  const statement = db.prepare(`INSERT INTO violations (
    violation_date, governorate, violation_type, victim_name, victim_institution, description, status, verification_notes, severity
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  
  statement.run(
    '2026-02-14',
    'صنعاء',
    JSON.stringify({ ar: 'اعتقال تعسفي', en: 'Arbitrary Arrest' }),
    JSON.stringify({ ar: 'أكرم العمودي', en: 'Akram Al-Amoudi' }),
    JSON.stringify({ ar: 'قناة المهرة', en: 'Al-Mahrah TV' }),
    JSON.stringify({ ar: 'اعتقال تعسفي بسبب التصوير وتوثيق الأنشطة المدنية دون إذن مسبق', en: 'Arbitrary arrest due to field photography without authorization' }),
    'verified',
    'تم التحقق من مصادر محلية',
    'high'
  );
  console.log('Inserted violation.');
}

console.log('Done seeding mock data to DB.');
