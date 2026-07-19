import pool from '../db';

export class AcademyRepository {
  static async findAllCourses() {
    const [rows] = await pool.query('SELECT * FROM courses ORDER BY createdAt DESC');
    return rows;
  }

  static async findCourseById(id: string) {
    const [rows]: any = await pool.query('SELECT * FROM courses WHERE id = ?', [id]);
    return rows && rows.length > 0 ? rows[0] : null;
  }

  static async createCourse(data: any) {
    const fields = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);
    const [result] = await pool.query(`INSERT INTO courses (${fields}) VALUES (${placeholders})`, values);
    return result;
  }

  static async updateCourse(id: string, data: any) {
    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = Object.values(data);
    const [result] = await pool.query(`UPDATE courses SET ${fields} WHERE id = ?`, [...values, id]);
    return result;
  }

  static async deleteCourse(id: string) {
    const [result] = await pool.query('DELETE FROM courses WHERE id = ?', [id]);
    return result;
  }

  static async findAllApplications(courseId?: string) {
    let query = 'SELECT * FROM academy_applications';
    const values = [];
    if (courseId) {
      query += ' WHERE course_id = ?';
      values.push(courseId);
    }
    query += ' ORDER BY createdAt DESC';
    const [rows] = await pool.query(query, values);
    return rows;
  }

  static async createApplication(data: any) {
    const fields = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);
    const [result] = await pool.query(`INSERT INTO academy_applications (${fields}) VALUES (${placeholders})`, values);
    return result;
  }
}
