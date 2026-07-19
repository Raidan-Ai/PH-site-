import axios from 'axios';
import { GoogleGenAI } from '@google/genai';
import { SettingsRepository } from '../../repositories/settings.repository';
import { config } from '../../config/env';

export class AIService {
  static async callAI(prompt: string, systemInstruction: string): Promise<string> {
    const dbSettings = await SettingsRepository.getAISettings();

    if (dbSettings && (dbSettings.aiEnabled === 0 || dbSettings.aiEnabled === false)) {
      return "AI is disabled by the administrator.";
    }

    const finalSystemInstruction = dbSettings?.aiSystemInstruction 
      ? `${dbSettings.aiSystemInstruction}\n\nAdditional Context:\n${systemInstruction}`
      : systemInstruction;

    const provider = dbSettings?.aiProvider || 'openai';

    // 1. Gemini Provider
    if (provider === 'gemini' || (provider === 'openai' && !dbSettings?.aiApiKey && config.ai.geminiKey)) {
      const key = dbSettings?.aiApiKey || config.ai.geminiKey;
      if (key) {
        try {
          const ai = new GoogleGenAI({
            apiKey: key,
            httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
          });
          const response = await ai.models.generateContent({
            model: dbSettings?.aiModel || 'gemini-2.5-flash',
            contents: prompt,
            config: {
              systemInstruction: finalSystemInstruction,
              temperature: dbSettings?.aiTemperature || 0.3,
            }
          });
          if (response && response.text) return response.text;
        } catch (err: any) {
          console.error('Gemini API Error:', err.message);
          if (provider === 'gemini') return "AI Assistant Error: " + err.message;
        }
      } else if (provider === 'gemini') {
        return "AI Assistant is offline. Please configure your Gemini API Key.";
      }
    }

    // 2. OpenAI/NVIDIA Compatible API
    const token = dbSettings?.aiApiKey || config.ai.apiKey || '';
    if (!token || token.includes('your-api-key')) {
      return "AI Assistant is offline. Please configure your AI API Key.";
    }

    const baseUrl = dbSettings?.aiBaseUrl || config.ai.baseUrl;
    const url = `${baseUrl}/chat/completions`.replace(/([^:])\/\//g, '$1/');
    
    const modelsToTry = dbSettings?.aiModel ? [dbSettings.aiModel] : [
      config.ai.primaryModel,
      'gpt-3.5-turbo',
      'nvidia/qwen-2.5-coder-32b-instruct'
    ];

    for (const model of modelsToTry) {
      try {
        const response = await axios.post(url, {
          model,
          messages: [
            { role: 'system', content: finalSystemInstruction },
            { role: 'user', content: prompt }
          ],
          temperature: dbSettings?.aiTemperature || 0.3,
          max_tokens: dbSettings?.aiMaxTokens || 1524
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 20000
        });
        return response.data?.choices?.[0]?.message?.content || "No response content";
      } catch (err: any) {
        console.error(`Error with model ${model}:`, err.response?.data || err.message);
        if (modelsToTry.indexOf(model) === modelsToTry.length - 1) throw err;
      }
    }
    return "AI service temporarily unavailable.";
  }
}
