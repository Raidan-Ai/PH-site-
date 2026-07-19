import axios from 'axios';
import { config } from '../../config/env';

export class NvidiaAIProvider {
  static async chat(prompt: string, systemInstruction: string, options: any = {}) {
    const token = options.apiKey || config.ai.apiKey;
    const baseUrl = options.baseUrl || config.ai.baseUrl;
    const url = `${baseUrl}/chat/completions`.replace(/([^:])\/\//g, '$1/');
    
    const response = await axios.post(url, {
      model: options.model || config.ai.primaryModel,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: prompt }
      ],
      temperature: options.temperature || 0.3,
      max_tokens: options.maxTokens || 1524
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 20000
    });

    return response.data?.choices?.[0]?.message?.content || "No response content";
  }
}
