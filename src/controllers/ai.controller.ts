import { Request, Response } from 'express';
import { AIService } from '../services/ai/ai.service';

export class AIController {
  static async chat(req: Request, res: Response) {
    const { prompt, systemInstruction } = req.body;
    try {
      const response = await AIService.callAI(prompt, systemInstruction || 'You are a helpful assistant.');
      res.json({ response });
    } catch (error: any) {
      res.status(500).json({ message: 'AI Error', error: error.message });
    }
  }

  static async translate(req: Request, res: Response) {
    const { text, targetLang } = req.body;
    try {
      const prompt = `Translate the following text to ${targetLang}: "${text}"`;
      const response = await AIService.callAI(prompt, 'You are a professional translator.');
      res.json({ translatedText: response });
    } catch (error: any) {
      res.status(500).json({ message: 'Translation Error' });
    }
  }
}
