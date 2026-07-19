import app from './app';
import { createServer as createViteServer } from 'vite';
import { config } from './config/env';
import path from 'path';
import express from 'express';
import { telegramBot } from './bot';

async function bootstrap() {
  // 1. Setup Telegram Bot (if configured)
  try {
    telegramBot.launch();
  } catch (err) {
    console.error('Failed to launch Telegram Bot:', err);
  }

  // 2. Vite middleware for development
  if (!config.isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // 3. Start Server
  app.listen(config.port, '0.0.0.0', () => {
    console.log(`[PressHouse] Server running on http://localhost:${config.port}`);
  });
}

bootstrap().catch(err => {
  console.error('Bootstrap Error:', err);
});
