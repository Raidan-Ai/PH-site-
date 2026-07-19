import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { MediaRepository } from '../repositories/media.repository';

export class MediaController {
  static async getAll(req: Request, res: Response) {
    try {
      const media = await MediaRepository.findAll();
      res.json(media);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching media' });
    }
  }

  static async upload(req: any, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      let folder = 'others';
      if (req.file.mimetype.startsWith('image/')) folder = 'images';
      else if (req.file.mimetype.startsWith('video/')) folder = 'videos';
      else if (req.file.mimetype.startsWith('audio/')) folder = 'audio';
      else if (req.file.mimetype.includes('pdf') || req.file.mimetype.includes('document')) folder = 'documents';
      
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = uniqueSuffix + path.extname(req.file.originalname);
      
      const uploadDir = path.join(process.cwd(), 'uploads');
      const targetDir = path.join(uploadDir, folder);
      
      if (!fs.existsSync(targetDir)) {
         fs.mkdirSync(targetDir, { recursive: true });
      }
      
      const filePath = path.join(targetDir, filename);
      fs.writeFileSync(filePath, req.file.buffer);
      const url = `/uploads/${folder}/${filename}`;
      
      const result = await MediaRepository.create({
        name: req.file.originalname,
        url,
        type: req.file.mimetype,
        size: req.file.size,
        uploadedBy: req.user?.uid || 'admin'
      });

      res.json({ 
        id: (result as any).insertId, 
        name: req.file.originalname, 
        url, 
        type: req.file.mimetype, 
        size: req.file.size 
      });
    } catch (error) {
      console.error('Upload Error:', error);
      res.status(500).json({ message: 'Error uploading file' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const media = await MediaRepository.findById(req.params.id);
      if (media) {
        const filePath = path.join(process.cwd(), media.url.startsWith('/') ? media.url.substring(1) : media.url);
        if (fs.existsSync(filePath)) {
           fs.unlinkSync(filePath);
        }
        await MediaRepository.delete(req.params.id);
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting media' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { fileData, ...updateData } = req.body;
      
      if (fileData && fileData.startsWith('data:image/')) {
        const media = await MediaRepository.findById(req.params.id);
        if (media && media.url) {
          const filePath = path.join(process.cwd(), media.url.startsWith('/') ? media.url.substring(1) : media.url);
          const matches = fileData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            const buffer = Buffer.from(matches[2], 'base64');
            fs.writeFileSync(filePath, buffer);
            updateData.size = buffer.length;
          }
        }
      }
      
      await MediaRepository.update(req.params.id, updateData);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Error updating media' });
    }
  }
}
