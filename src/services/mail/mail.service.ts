import nodemailer from 'nodemailer';
import { SettingsRepository } from '../../repositories/settings.repository';
import { config } from '../../config/env';

export class MailService {
  static async getTransporter() {
    try {
      const dbSettings = await SettingsRepository.getSMTPSettings();

      return nodemailer.createTransport({
        host: dbSettings?.smtpHost || config.smtp.host,
        port: dbSettings?.smtpPort || config.smtp.port,
        secure: false, 
        auth: {
          user: dbSettings?.smtpUser || config.smtp.user,
          pass: dbSettings?.smtpPass || config.smtp.pass
        },
        tls: {
          ciphers: 'SSLv3',
          rejectUnauthorized: false
        }
      });
    } catch (error) {
      console.error('Error creating mail transporter:', error);
      return null;
    }
  }

  static async getSmtpFrom() {
    const dbSettings = await SettingsRepository.getSMTPSettings();
    return dbSettings?.smtpFrom || config.smtp.from;
  }

  static async sendMail(to: string, subject: string, html: string) {
    const transporter = await this.getTransporter();
    const from = await this.getSmtpFrom();
    
    if (!transporter) throw new Error('Mail transporter not available');

    return transporter.sendMail({
      from,
      to,
      subject,
      html
    });
  }
}
