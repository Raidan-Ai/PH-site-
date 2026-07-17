import pool from '../../db';

export class BaseService<T> {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  async getAll(): Promise<(T & { id: string })[]> {
    const [rows] = await pool.query(`SELECT * FROM ${this.tableName} ORDER BY createdAt DESC`);
    return rows as (T & { id: string })[];
  }

  async getById(id: string): Promise<(T & { id: string }) | null> {
    const [rows] = await pool.query(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
    const items = rows as any[];
    return items.length ? (items[0] as T & { id: string }) : null;
  }

  async create(data: Omit<T, 'id'>, id?: string): Promise<string> {
    const dataWithTimestamps = { ...data, createdAt: new Date().toISOString() };
    const keys = Object.keys(dataWithTimestamps);
    const values = Object.values(dataWithTimestamps);
    
    if (id) {
      const setClause = keys.map(k => `${k} = ?`).join(', ');
      await pool.query(
        `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`,
        [...values, id]
      );
      return id;
    }
    
    const placeholders = keys.map(() => '?').join(', ');
    const [result] = await pool.query(
      `INSERT INTO ${this.tableName} (${keys.join(', ')}) VALUES (${placeholders})`,
      values
    );
    return (result as any).insertId ? String((result as any).insertId) : Date.now().toString();
  }

  async update(id: string, data: Partial<T>): Promise<void> {
    const dataWithTimestamps = { ...data, updatedAt: new Date().toISOString() };
    const keys = Object.keys(dataWithTimestamps);
    const values = Object.values(dataWithTimestamps);
    
    const setClause = keys.map(k => `${k} = ?`).join(', ');
    await pool.query(
      `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`,
      [...values, id]
    );
  }

  async delete(id: string): Promise<void> {
    await pool.query(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
  }
}

