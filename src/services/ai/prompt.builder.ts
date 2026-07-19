export class PromptBuilder {
  static buildArticleDraftPrompt(topic: string, details: string) {
    return `Generate a professional article about "${topic}". Details: ${details}. Format in Arabic.`;
  }

  static buildSocialCardPrompt(content: string) {
    return `Generate a catchy social media card text for the following: ${content}. Include emojis.`;
  }

  static buildSEOPrompt(title: string, body: string) {
    return `Generate SEO Meta Tags (Title, Description, Keywords) in both Arabic and English for:
Title: ${title}
Body: ${body}`;
  }
}
