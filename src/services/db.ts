import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

// Mock pool.query to maintain compatibility with mysql2
const pool = {
  query: async (sql: string, params: any[] = []) => {
    try {
      const trimmedSql = sql.trim().toUpperCase();
      if (trimmedSql.startsWith('SELECT')) {
        const stmt = db.prepare(sql);
        const rows = stmt.all(...params);
        return [rows, null];
      } else {
        const stmt = db.prepare(sql);
        const result = stmt.run(...params);
        return [{
          insertId: result.lastInsertRowid,
          affectedRows: result.changes
        }, null];
      }
    } catch (error) {
      console.error('Database Error:', error);
      throw error;
    }
  },
  execute: async (sql: string, params: any[] = []) => {
    return pool.query(sql, params);
  },
  getConnection: async () => {
    return {
      query: pool.query,
      release: () => {}
    };
  }
};

// The original initDb in this file was redundant with the main one but we'll keep the exported pool
export default pool;
