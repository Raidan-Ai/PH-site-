import { Request, Response } from 'express';
import { SystemRepository } from '../repositories/system.repository';

export class SystemController {
  static async getMenus(req: Request, res: Response) {
    try {
      const location = (req.query.position || req.query.location) as string;
      console.log(`[SystemController] getMenus, location: ${location}`);
      const menus = await SystemRepository.getMenus(location);
      res.json(menus);
    } catch (error) {
      console.error('[SystemController] getMenus error:', error);
      res.status(500).json({ message: 'Error fetching menus' });
    }
  }

  static async getPageContent(req: Request, res: Response) {
    try {
      console.log(`[SystemController] getPageContent, page: ${req.params.page}`);
      const content = await SystemRepository.getPageContent(req.params.page);
      res.json(content);
    } catch (error) {
      console.error('[SystemController] getPageContent error:', error);
      res.status(500).json({ message: 'Error fetching page content' });
    }
  }

  static async getStats(req: Request, res: Response) {
    try {
      console.log('[SystemController] getStats');
      const stats = await SystemRepository.getComprehensiveStats();
      res.json(stats);
    } catch (error) {
      console.error('[SystemController] getStats error:', error);
      res.status(500).json({ message: 'Error fetching stats' });
    }
  }

  static async getIndicators(req: Request, res: Response) {
    try {
      console.log('[SystemController] getIndicators');
      const indicators = await SystemRepository.getLiveIndicators();
      res.json(indicators);
    } catch (error) {
      console.error('[SystemController] getIndicators error:', error);
      res.status(500).json({ message: 'Error fetching indicators' });
    }
  }

  static async getIdentity(req: Request, res: Response) {
    try {
      console.log('[SystemController] getIdentity');
      const identity = await SystemRepository.getInstitutionIdentity();
      res.json(identity);
    } catch (error) {
      console.error('[SystemController] getIdentity error:', error);
      res.status(500).json({ message: 'Error fetching identity' });
    }
  }

  static async getHeroSlides(req: Request, res: Response) {
    try {
      console.log('[SystemController] getHeroSlides');
      const slides = await SystemRepository.getHeroSlides();
      res.json(slides);
    } catch (error) {
      console.error('[SystemController] getHeroSlides error:', error);
      res.status(500).json({ message: 'Error fetching hero slides' });
    }
  }

  static async getDynamicHeroSlides(req: Request, res: Response) {
    try {
      console.log('[SystemController] getDynamicHeroSlides');
      const slides = await SystemRepository.getDynamicHeroSlides();
      res.json(slides);
    } catch (error) {
      console.error('[SystemController] getDynamicHeroSlides error:', error);
      res.status(500).json({ message: 'Error fetching dynamic slides' });
    }
  }
}
