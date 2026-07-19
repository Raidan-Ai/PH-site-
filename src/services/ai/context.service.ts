import pool from '../../db';

export class AIContextService {
  static async getSiteContext(): Promise<string> {
    try {
      const [articles] = await pool.query("SELECT title, category, status, createdAt FROM articles WHERE status='published' ORDER BY createdAt DESC LIMIT 15");
      const [projects] = await pool.query('SELECT title, status FROM projects LIMIT 6');
      const [jobs] = await pool.query('SELECT title, status FROM jobs LIMIT 6');
      const [events] = await pool.query('SELECT title, status, event_date FROM events LIMIT 6');
      
      let context = 'إليك أحدث المحتويات والبيانات المتاحة حالياً على موقع منصة بيت الصحافة (PressHouse):\n\n';
      
      context += '=== الأخبار والتقارير المنشورة مؤخراً ===\n';
      (articles as any[]).forEach((art, idx) => {
        let titleAr = '';
        try {
          const parsed = typeof art.title === 'string' ? JSON.parse(art.title) : art.title;
          titleAr = parsed?.ar || parsed?.en || art.title;
        } catch (e) { titleAr = art.title; }
        context += `${idx + 1}. الاسم: ${titleAr} (القسم: ${art.category}, بتاريخ: ${art.createdAt})\n`;
      });
      
      context += '\n=== المشاريع والبرامج ===\n';
      (projects as any[]).forEach((proj, idx) => {
        let titleAr = '';
        try {
          const parsed = typeof proj.title === 'string' ? JSON.parse(proj.title) : proj.title;
          titleAr = parsed?.ar || parsed?.en || proj.title;
        } catch (e) { titleAr = proj.title; }
        context += `${idx + 1}. الاسم: ${titleAr} (الحالة: ${proj.status})\n`;
      });

      context += '\n=== الوظائف المتاحة ===\n';
      (jobs as any[]).forEach((job, idx) => {
        let titleAr = '';
        try {
          const parsed = typeof job.title === 'string' ? JSON.parse(job.title) : job.title;
          titleAr = parsed?.ar || parsed?.en || job.title;
        } catch (e) { titleAr = job.title; }
        context += `${idx + 1}. الوظيفة: ${titleAr} (الحالة: ${job.status})\n`;
      });

      context += '\n=== الفعاليات القادمة ===\n';
      (events as any[]).forEach((evt, idx) => {
        let titleAr = '';
        try {
          const parsed = typeof evt.title === 'string' ? JSON.parse(evt.title) : evt.title;
          titleAr = parsed?.ar || parsed?.en || evt.title;
        } catch (e) { titleAr = evt.title; }
        context += `${idx + 1}. الفعالية: ${titleAr} (بتاريخ: ${evt.event_date})\n`;
      });

      return context;
    } catch (err) {
      console.error('getSiteContext error:', err);
      return 'موقع بيت الصحافة منصة متكاملة للصحفيين والتقارير اليمنية.';
    }
  }
}
