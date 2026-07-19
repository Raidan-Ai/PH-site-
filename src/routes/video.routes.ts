import { Router, Request, Response } from 'express';
import pool from '../db';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.query('SELECT * FROM videos WHERE status = 'published' ORDER BY createdAt DESC');
    res.json(rows.map((v: any) => {
      let parsedTitle = { ar: '', en: '' };
      let parsedDesc = { ar: '', en: '' };
      let parsedTags = [];
      try { parsedTitle = v.title ? JSON.parse(v.title) : { ar: '', en: '' }; } catch (e) {}
      try { parsedDesc = v.description ? JSON.parse(v.description) : { ar: '', en: '' }; } catch (e) {}
      try { parsedTags = v.tags ? JSON.parse(v.tags) : []; } catch (e) {}
      return {
        ...v,
        title: parsedTitle,
        description: parsedDesc,
        tags: parsedTags
      };
    }));
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id, title, description, url, thumbnail, category, tags, duration, authorId } = req.body;
      
    // Automatic thumbnail generation if missing
    let finalThumbnail = thumbnail;
    if (!finalThumbnail && url) {
      const ytMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(.+)/);
      if (ytMatch && ytMatch[1]) {
        finalThumbnail = `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg`;
      } else {
        finalThumbnail = `https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?auto=format&fit=crop&q=80&w=800`;
      }
    }

    await pool.query(
      'INSERT INTO videos (id, title, description, url, thumbnail, category, tags, duration, authorId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, title, description, url, finalThumbnail, category, tags, duration, authorId]
    );
    res.json({ success: true, thumbnail: finalThumbnail });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { title, description, url, thumbnail, category, tags, duration, status } = req.body;
    await pool.query(
      'UPDATE videos SET title=?, description=?, url=?, thumbnail=?, category=?, tags=?, duration=?, status=?, updatedAt=CURRENT_TIMESTAMP WHERE id=?',
      [title, description, url, thumbnail, category, tags, duration, status, req.params.id]
    );
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM videos WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
