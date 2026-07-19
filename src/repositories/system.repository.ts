import pool from '../db';

export class SystemRepository {
  static async getMenus(location?: string) {
    try {
      let query = 'SELECT * FROM menus';
      const values = [];
      if (location) {
        query += ' WHERE location = ?';
        values.push(location);
      }
      query += ' ORDER BY "order" ASC';
      const [rows] = await pool.query(query, values);
      return rows;
    } catch (error) {
      console.error('getMenus error:', error);
      return [];
    }
  }

  static async getPageContent(pageName: string) {
    try {
      const [rows] = await pool.query('SELECT * FROM page_content WHERE page_name = ?', [pageName]);
      return rows;
    } catch (error) {
      console.error('getPageContent error:', error);
      return [];
    }
  }

  static async getComprehensiveStats() {
    try {
      const [artCount]: any = await pool.query("SELECT COUNT(*) as count FROM articles WHERE status='published'");
      const [prjCount]: any = await pool.query('SELECT COUNT(*) as count FROM projects');
      const [userCount]: any = await pool.query('SELECT COUNT(*) as count FROM users');
      const [vialCount]: any = await pool.query('SELECT COUNT(*) as count FROM violations');

      return {
        success: true,
        stats: {
          totalArticles: artCount[0].count,
          totalProjects: prjCount[0].count,
          totalUsers: userCount[0].count,
          totalViolations: vialCount[0].count,
          totalBeneficiaries: 1250,
          totalCourses: 45,
          totalReports: 89,
          totalVolunteers: 12
        }
      };
    } catch (err) {
      return { success: false, stats: {} };
    }
  }

  static async getLiveIndicators() {
    return {
      success: true,
      indicators: [
        { id: 1, label: { ar: 'مؤشر حرية الصحافة', en: 'Press Freedom' }, value: 34, trend: 'up' },
        { id: 2, label: { ar: 'الانتهاكات المرصودة', en: 'Monitored Violations' }, value: 12, trend: 'down' }
      ]
    };
  }

  static async getInstitutionIdentity() {
    try {
      const [rows]: any = await pool.query('SELECT * FROM institution_identity WHERE id = 1 LIMIT 1');
      return rows && rows.length > 0 ? rows[0] : {};
    } catch (error) {
      console.error('getInstitutionIdentity error:', error);
      return {};
    }
  }

  static async getHeroSlides() {
    try {
      const [rows] = await pool.query('SELECT * FROM hero_slides ORDER BY `order` ASC');
      return rows;
    } catch (error) {
      console.error('getHeroSlides error:', error);
      return [];
    }
  }

  static async getDynamicHeroSlides() {
    try {
      const queries = [
        { table: 'articles', type: 'article' },
        { table: 'projects', type: 'project' },
        { table: 'courses', type: 'course' },
        { table: 'events', type: 'event' }
      ];

      let allSlides: any[] = [];
      for (const q of queries) {
        try {
          const [rows]: any = await pool.query(`SELECT id, title, show_in_slider, slider_caption, slider_button_text, slider_image FROM ${q.table} WHERE show_in_slider = 1 OR show_in_slider = TRUE`);
          allSlides = [...allSlides, ...rows.map((r: any) => ({ ...r, type: q.type }))];
        } catch (e) {
          // Table might not exist or column missing, skip
        }
      }
      return allSlides;
    } catch (error) {
      console.error('getDynamicHeroSlides error:', error);
      return [];
    }
  }
}
