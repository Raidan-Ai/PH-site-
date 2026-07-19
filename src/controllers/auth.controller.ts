import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/user.repository';
import { config } from '../config/env';

export class AuthController {
  static async login(req: Request, res: Response) {
    const { email, password } = req.body;
    try {
      const user = await UserRepository.findByEmail(email);
      if (!user || !user.password_hash) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { uid: user.uid, role: user.role },
        config.jwtSecret,
        { expiresIn: '7d' }
      );

      const { password_hash, ...userWithoutPassword } = user;
      res.json({ token, user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }

  static async getProfile(req: any, res: Response) {
    try {
      const user = await UserRepository.findByUid(req.user.uid);
      if (!user) return res.sendStatus(404);
      const { password_hash, ...userProfile } = user;
      res.json(userProfile);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }

  static async updateProfile(req: any, res: Response) {
    const { 
      displayName, age, gender, workplace, 
      work_samples, phone, whatsapp, social_pages, bio, specialization 
    } = req.body;

    try {
      await UserRepository.update(req.user.uid, {
        displayName, 
        age: age || null, 
        gender: gender || null, 
        workplace: workplace || null,
        work_samples: work_samples ? JSON.stringify(work_samples) : null,
        phone: phone || null,
        whatsapp: whatsapp || null,
        social_pages: social_pages ? JSON.stringify(social_pages) : null,
        bio: bio || null,
        specialization: specialization || null
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
}
