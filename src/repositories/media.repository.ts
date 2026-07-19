import pool from '../db';

export class MediaRepository {
  static async findAll() {
    const [rows] = await pool.query('SELECT * FROM media ORDER BY createdAt DESC');
    return rows;
  }

  static async findById(id: string | number) {
    const [rows]: any = await pool.query('SELECT * FROM media WHERE id = ?', [id]);
    return rows && rows.length > 0 ? rows[0] : null;
  }

  static async create(data: any) {
    const [result] = await pool.query(
      'INSERT INTO media (name, url, type, size, uploadedBy, album_id) VALUES (?, ?, ?, ?, ?, ?)',
      [data.name, data.url, data.type, data.size, data.uploadedBy || 'admin', data.album_id || null]
    );
    return result;
  }

  static async delete(id: string | number) {
    const [result] = await pool.query('DELETE FROM media WHERE id = ?', [id]);
    return result;
  }

  static async update(id: string | number, data: any) {
    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = Object.values(data);
    const [result] = await pool.query(`UPDATE media SET ${fields} WHERE id = ?`, [...values, id]);
    return result;
  }
  
  static async findAllAlbums() {
    const [rows] = await pool.query('SELECT * FROM media_albums ORDER BY createdAt DESC');
    return rows;
  }
}
