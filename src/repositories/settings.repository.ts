import pool from '../db';

export class SettingsRepository {
  static async getSettings() {
    try {
      const [rows]: any = await pool.query('SELECT * FROM site_settings LIMIT 1');
      if (rows && rows.length > 0) return rows[0];
      return {
        siteName: JSON.stringify({ ar: 'بيت الصحافة', en: 'Press House' }),
        siteDescription: JSON.stringify({ ar: 'مؤسسة إعلامية مستقلة', en: 'Independent Media Institution' }),
        logo: '',
        favicon: '',
        contactEmail: 'info@presshouse-ye.org',
        contactPhone: '',
        address: JSON.stringify({ ar: 'اليمن', en: 'Yemen' }),
        socialLinks: JSON.stringify({ facebook: '', twitter: '', instagram: '', youtube: '' }),
        footerText: JSON.stringify({ ar: 'جميع الحقوق محفوظة', en: 'All rights reserved' }),
        maintenanceMode: 0
      };
    } catch (err) {
      return {};
    }
  }

  static async getAISettings() {
    const [rows]: any = await pool.query(
      'SELECT aiEnabled, aiProvider, aiModel, aiBaseUrl, aiApiKey, aiTemperature, aiMaxTokens, aiSystemInstruction FROM site_settings LIMIT 1'
    );
    return rows && rows.length > 0 ? rows[0] : null;
  }

  static async getSMTPSettings() {
    const [rows]: any = await pool.query(
      'SELECT smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom FROM site_settings LIMIT 1'
    );
    return rows && rows.length > 0 ? rows[0] : null;
  }
}
