import pool from '../db';

export class UserRepository {
  static async findByEmail(email: string) {
    const [rows]: any = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows && rows.length > 0 ? rows[0] : null;
  }

  static async findByUid(uid: string) {
    const [rows]: any = await pool.query('SELECT * FROM users WHERE uid = ?', [uid]);
    return rows && rows.length > 0 ? rows[0] : null;
  }

  static async findByLinkedinId(linkedinId: string) {
    const [rows]: any = await pool.query('SELECT * FROM users WHERE linkedinId = ?', [linkedinId]);
    return rows && rows.length > 0 ? rows[0] : null;
  }

  static async findByGoogleId(googleId: string) {
    const [rows]: any = await pool.query('SELECT * FROM users WHERE googleId = ?', [googleId]);
    return rows && rows.length > 0 ? rows[0] : null;
  }

  static async create(userData: any) {
    const { uid, email, displayName, photoURL, role, linkedinId, googleId, password_hash } = userData;
    const [result] = await pool.query(
      'INSERT INTO users (uid, email, displayName, photoURL, role, linkedinId, googleId, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [uid, email, displayName || '', photoURL || '', role, linkedinId || null, googleId || null, password_hash || null]
    );
    return result;
  }

  static async update(uid: string, data: any) {
    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = Object.values(data);
    const [result] = await pool.query(`UPDATE users SET ${fields} WHERE uid = ?`, [...values, uid]);
    return result;
  }
}
