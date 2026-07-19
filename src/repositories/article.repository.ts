import pool from '../db';

export class ArticleRepository {
  static async findAll(params: any = {}) {
    let query = `
      SELECT a.*, u.displayName as author 
      FROM articles a
      LEFT JOIN users u ON a.authorId = u.uid
    `;
    const values: any[] = [];
    
    if (params.status) {
      query += ' WHERE a.status = ?';
      values.push(params.status);
    }
    
    query += ' ORDER BY a.createdAt DESC';
    
    if (params.limit) {
      query += ' LIMIT ?';
      values.push(params.limit);
    }

    const [rows] = await pool.query(query, values);
    return rows;
  }

  static async findById(id: string) {
    const [rows]: any = await pool.query(`
      SELECT a.*, u.displayName as author 
      FROM articles a
      LEFT JOIN users u ON a.authorId = u.uid
      WHERE a.id = ?
    `, [id]);
    return rows && rows.length > 0 ? rows[0] : null;
  }

  static async create(data: any) {
    const fields = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);
    
    const [result] = await pool.query(
      `INSERT INTO articles (${fields}) VALUES (${placeholders})`,
      values
    );
    return result;
  }

  static async update(id: string, data: any) {
    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = Object.values(data);
    const [result] = await pool.query(`UPDATE articles SET ${fields} WHERE id = ?`, [...values, id]);
    return result;
  }

  static async incrementViews(id: string) {
    const [result] = await pool.query('UPDATE articles SET views = views + 1 WHERE id = ?', [id]);
    return result;
  }

  static async delete(id: string) {
    const [result] = await pool.query('DELETE FROM articles WHERE id = ?', [id]);
    return result;
  }

  static async getStatsByAuthor(authorId: string) {
    const query = `
      SELECT 
        strftime('%Y-%m-%d', createdAt) as date,
        COUNT(*) as count,
        SUM(views) as totalViews,
        SUM(engagement) as totalEngagement
      FROM articles 
      WHERE authorId = ? AND createdAt >= date('now', '-30 days')
      GROUP BY date
      ORDER BY date ASC
    `;
    const [rows] = await pool.query(query, [authorId]);
    return rows;
  }
}
