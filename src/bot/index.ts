import { Telegraf, Scenes, session } from 'telegraf';
import { config } from '../config/env';

// We will import wizards and handlers later
// import { articleWizard } from './wizard/articleWizard';

export class TelegramBot {
  private bot: Telegraf<Scenes.WizardContext>;

  constructor() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.warn('TELEGRAM_BOT_TOKEN is not set. Bot is disabled.');
      this.bot = new Telegraf(''); // Dummy
      return;
    }

    this.bot = new Telegraf<Scenes.WizardContext>(token);

    // Setup Sessions
    this.bot.use(session());

    // Setup Scenes
    const stage = new Scenes.Stage<Scenes.WizardContext>([
      // articleWizard,
    ]);
    this.bot.use(stage.middleware());

    this.setupHandlers();
  }

  private setupHandlers() {
    this.bot.start((ctx) => ctx.reply('Welcome to PressHouse Bot!'));
    this.bot.help((ctx) => ctx.reply('Send me a message or use commands.'));
    
    // Command handlers
    // this.bot.command('stats', statsCommand);
  }

  public launch() {
    if (!process.env.TELEGRAM_BOT_TOKEN) return;
    this.bot.launch().then(() => {
      console.log('Telegram Bot launched successfully');
    });

    // Enable graceful stop
    process.once('SIGINT', () => this.bot.stop('SIGINT'));
    process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
  }
}

export const telegramBot = new TelegramBot();
