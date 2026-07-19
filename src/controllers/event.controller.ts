import { Request, Response } from 'express';
import { EventRepository } from '../repositories/event.repository';

export class EventController {
  static async getAll(req: Request, res: Response) {
    try {
      const events = await EventRepository.findAll();
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching events' });
    }
  }

  static async create(req: any, res: Response) {
    try {
      const id = Math.random().toString(36).substring(2, 11);
      const data = {
        ...req.body,
        id,
        title: typeof req.body.title === 'object' ? JSON.stringify(req.body.title) : req.body.title,
        description: typeof req.body.description === 'object' ? JSON.stringify(req.body.description) : req.body.description,
      };
      await EventRepository.create(data);
      res.status(201).json({ id, success: true });
    } catch (error) {
      res.status(500).json({ message: 'Error creating event' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const data = { ...req.body };
      if (data.title && typeof data.title === 'object') data.title = JSON.stringify(data.title);
      if (data.description && typeof data.description === 'object') data.description = JSON.stringify(data.description);
      
      await EventRepository.update(req.params.id, data);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Error updating event' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      await EventRepository.delete(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting event' });
    }
  }
}
