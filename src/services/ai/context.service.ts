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
      
      // ... same logic for projects, jobs, events
      
      return context;
    } catch (err) {
      console.error('getSiteContext error:', err);
      return 'موقع بيت الصحافة منصة متكاملة للصحفيين والتقارير اليمنية.';
    }
  }
}
