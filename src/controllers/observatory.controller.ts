import { Request, Response } from 'express';
import { ObservatoryRepository } from '../repositories/observatory.repository';
import { AIService } from '../services/ai/ai.service';

export class ObservatoryController {
  static async getAllViolations(req: Request, res: Response) {
    try {
      const violations = await ObservatoryRepository.findAllViolations();
      res.json(violations);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching violations' });
    }
  }

  static async submitViolation(req: any, res: Response) {
    try {
      const id = req.body.id || Date.now().toString();
      const data = { ...req.body, id };
      // Handle file if present
      if (req.file) {
        // Logic for saving evidence file...
      }
      await ObservatoryRepository.createViolation(data);
      res.json({ id, success: true });
    } catch (error: any) {
      res.status(500).json({ message: 'Error creating violation: ' + error.message });
    }
  }

  static async getCaseDraft(req: Request, res: Response) {
    try {
      const { originalText, victimName } = req.body;
      const prompt = `Draft a formal case file for victim: ${victimName}. Text: ${originalText}`;
      const responseText = await AIService.callAI(prompt, 'You are a Journalist Safety Intelligence Specialist.');
      res.json({ draft: responseText });
    } catch (error: any) {
      res.status(500).json({ message: 'Error generating draft' });
    }
  }
}
