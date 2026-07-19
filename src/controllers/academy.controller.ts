import { Request, Response } from 'express';
import { AcademyRepository } from '../repositories/academy.repository';

export class AcademyController {
  static async getAllCourses(req: Request, res: Response) {
    try {
      const courses = await AcademyRepository.findAllCourses();
      res.json(courses);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching courses' });
    }
  }

  static async createCourse(req: any, res: Response) {
    try {
      const id = Math.random().toString(36).substring(2, 11);
      const data = {
        ...req.body,
        id,
        title: typeof req.body.title === 'object' ? JSON.stringify(req.body.title) : req.body.title,
        description: typeof req.body.description === 'object' ? JSON.stringify(req.body.description) : req.body.description,
        videos: typeof req.body.videos === 'object' ? JSON.stringify(req.body.videos) : req.body.videos,
      };
      await AcademyRepository.createCourse(data);
      res.status(201).json({ id, success: true });
    } catch (error) {
      res.status(500).json({ message: 'Error creating course' });
    }
  }

  static async submitApplication(req: Request, res: Response) {
    try {
      await AcademyRepository.createApplication(req.body);
      res.json({ success: true, message: 'Application submitted successfully' });
    } catch (error: any) {
      res.status(500).json({ message: 'Failed to submit application', error: error.message });
    }
  }

  static async getApplications(req: Request, res: Response) {
    try {
      const apps = await AcademyRepository.findAllApplications(req.query.course_id as string);
      res.json(apps);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching applications' });
    }
  }
}
