import pool from '../db';

export class TenderRepository {
  static async findAll() {
    const [rows] = await pool.query('SELECT * FROM tenders ORDER BY createdAt DESC');
    return rows;
  }

  static async findById(id: string) {
    const [rows]: any = await pool.query('SELECT * FROM tenders WHERE id = ?', [id]);
    return rows && rows.length > 0 ? rows[0] : null;
  }

  static async create(data: any) {
    const fields = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);
    const [result] = await pool.query(`INSERT INTO tenders (${fields}) VALUES (${placeholders})`, values);
    return result;
  }

  static async update(id: string, data: any) {
    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = Object.values(data);
    const [result] = await pool.query(`UPDATE tenders SET ${fields} WHERE id = ?`, [...values, id]);
    return result;
  }

  static async delete(id: string) {
    const [result] = await pool.query('DELETE FROM tenders WHERE id = ?', [id]);
    return result;
  }
}
