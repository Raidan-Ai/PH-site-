import { Request, Response } from 'express';
import { ArticleRepository } from '../repositories/article.repository';

export class ArticleController {
  static async getAll(req: Request, res: Response) {
    try {
      const articles = await ArticleRepository.findAll(req.query);
      res.json(articles);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching articles' });
    }
  }

  static async getOne(req: Request, res: Response) {
    try {
      const article = await ArticleRepository.findById(req.params.id);
      if (!article) return res.status(404).json({ message: 'Article not found' });
      res.json(article);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching article' });
    }
  }

  static async create(req: any, res: Response) {
    try {
      const id = Math.random().toString(36).substring(2, 11);
      const articleData = {
        ...req.body,
        id,
        authorId: req.user.uid,
        title: typeof req.body.title === 'object' ? JSON.stringify(req.body.title) : req.body.title,
        content: typeof req.body.content === 'object' ? JSON.stringify(req.body.content) : req.body.content,
      };
      await ArticleRepository.create(articleData);
      res.status(201).json({ id, success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error creating article' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const data = { ...req.body };
      if (data.title && typeof data.title === 'object') data.title = JSON.stringify(data.title);
      if (data.content && typeof data.content === 'object') data.content = JSON.stringify(data.content);
      
      await ArticleRepository.update(req.params.id, data);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Error updating article' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      await ArticleRepository.delete(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting article' });
    }
  }
}
