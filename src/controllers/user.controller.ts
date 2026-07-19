import { Request, Response } from 'express';
import pool from '../db';
import { UserRepository } from '../repositories/user.repository';

export class UserController {
  static async getAllUsers(req: Request, res: Response) {
    try {
      const [rows] = await pool.query('SELECT * FROM users ORDER BY createdAt DESC');
      res.json(rows);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching users' });
    }
  }

  static async updateUserRole(req: Request, res: Response) {
    const { role } = req.body;
    try {
      await UserRepository.update(req.params.uid, { role });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Error updating role' });
    }
  }

  static async deleteUser(req: Request, res: Response) {
    try {
      await pool.query('DELETE FROM users WHERE uid = ?', [req.params.uid]);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting user' });
    }
  }
}
