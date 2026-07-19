import pool from '../db';

export class ObservatoryRepository {
  static async findAllViolations() {
    const [rows] = await pool.query('SELECT * FROM violations ORDER BY createdAt DESC');
    return rows;
  }

  static async createViolation(data: any) {
    const fields = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);
    const [result] = await pool.query(`INSERT INTO violations (${fields}) VALUES (${placeholders})`, values);
    return result;
  }

  static async updateViolation(id: string, data: any) {
    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = Object.values(data);
    const [result] = await pool.query(`UPDATE violations SET ${fields} WHERE id = ?`, [...values, id]);
    return result;
  }

  static async deleteViolation(id: string) {
    const [result] = await pool.query('DELETE FROM violations WHERE id = ?', [id]);
    return result;
  }

  // JPT Potential Incidents
  static async findAllPotentialIncidents() {
    const [rows] = await pool.query('SELECT * FROM jpt_potential_incidents ORDER BY createdAt DESC');
    return rows;
  }

  static async createPotentialIncident(data: any) {
    const fields = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);
    const [result] = await pool.query(`INSERT INTO jpt_potential_incidents (${fields}) VALUES (${placeholders})`, values);
    return result;
  }

  static async updatePotentialIncident(id: string, data: any) {
    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = Object.values(data);
    const [result] = await pool.query(`UPDATE jpt_potential_incidents SET ${fields} WHERE id = ?`, [...values, id]);
    return result;
  }
}
