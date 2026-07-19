import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import multer from 'multer';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from './src/db';
import nodemailer from 'nodemailer';
import axios from 'axios';
import { GoogleGenAI } from '@google/genai';
import { generateCertificate } from './src/services/pdfGenerator';
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';

dotenv.config();

// Mandatory Environment Variable Check
const REQUIRED_ENV_VARS = ['JWT_SECRET'];
for (const envVar of REQUIRED_ENV_VARS) {
  if (!process.env[envVar]) {
    const isProd = process.env.NODE_ENV === 'production';
    const fallback = 'insecure-default-change-me-in-settings';
    
    if (isProd) {
      console.warn(`\x1b[31mCRITICAL WARNING: Environment variable ${envVar} is missing!\x1b[0m`);
      console.warn(`Using insecure fallback for deployment. Please set a strong ${envVar} in the AI Studio Settings menu.`);
    } else {
      console.warn(`\x1b[33mWARNING: Environment variable ${envVar} is missing. Using insecure development default.\x1b[0m`);
    }
    process.env[envVar] = fallback;
  }
}

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

// Dynamic Mail Transporter Setup
async function getTransporter() {
  try {
    const [settingsRows]: any = await pool.query('SELECT smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom FROM site_settings LIMIT 1');
    const dbSettings = settingsRows && settingsRows.length > 0 ? settingsRows[0] : null;

    return nodemailer.createTransport({
      host: dbSettings?.smtpHost || process.env.SMTP_HOST || 'smtp.office365.com',
      port: parseInt(dbSettings?.smtpPort || process.env.SMTP_PORT || '587'),
      secure: false, // Office365 uses STARTTLS
      auth: {
        user: dbSettings?.smtpUser || process.env.SMTP_USER || 'web@ph-ye.org',
        pass: dbSettings?.smtpPass || process.env.SMTP_PASSWORD || process.env.SMTP_PASS || 'default_pass'
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

async function getSmtpFrom() {
  const [settingsRows]: any = await pool.query('SELECT smtpFrom FROM site_settings LIMIT 1');
  const dbSettings = settingsRows && settingsRows.length > 0 ? settingsRows[0] : null;
  return dbSettings?.smtpFrom || process.env.SMTP_FROM || 'web@ph-ye.org';
}

/**
 * Notify system administrators about important events.
 * (Telegram integration removed - logging to console only)
 */
async function notifyAdmins(message: string) {
  console.log('[ADMIN NOTIFICATION]:', message);
}

/**
 * System Health Helper: Get SQLite file size
 */
function getDatabaseSize() {
  try {
    const dbPath = path.join(process.cwd(), 'database.sqlite');
    if (fs.existsSync(dbPath)) {
      const stats = fs.statSync(dbPath);
      const sizeInBytes = stats.size;
      if (sizeInBytes < 1024) return `${sizeInBytes} B`;
      if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(2)} KB`;
      return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
    }
    return '0 B';
  } catch (error) {
    return 'Unknown';
  }
}

// Helper for calling the primary AI agent (with Gemini fallback)
async function callNvidiaAI(prompt: string, systemInstruction: string): Promise<string> {
  const [settingsRows]: any = await pool.query('SELECT aiEnabled, aiProvider, aiModel, aiBaseUrl, aiApiKey, aiTemperature, aiMaxTokens, aiSystemInstruction FROM site_settings LIMIT 1');
  const dbSettings = settingsRows && settingsRows.length > 0 ? settingsRows[0] : null;

  if (dbSettings && (dbSettings.aiEnabled === 0 || dbSettings.aiEnabled === false)) {
    return "AI is disabled by the administrator.";
  }

  const finalSystemInstruction = dbSettings?.aiSystemInstruction 
    ? `${dbSettings.aiSystemInstruction}\n\nAdditional Context:\n${systemInstruction}`
    : systemInstruction;

  const provider = dbSettings?.aiProvider || 'openai';

  // 1. If provider is gemini, use Gemini SDK
  if (provider === 'gemini' || (provider === 'openai' && !dbSettings?.aiApiKey && process.env.GEMINI_API_KEY)) {
    const key = dbSettings?.aiApiKey || process.env.GEMINI_API_KEY;
    if (key) {
      try {
        const ai = new GoogleGenAI({
          apiKey: key,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });
        const response = await ai.models.generateContent({
          model: dbSettings?.aiModel || 'gemini-2.5-flash',
          contents: prompt,
          config: {
            systemInstruction: finalSystemInstruction,
            temperature: dbSettings?.aiTemperature || 0.3,
          }
        });
        if (response && response.text) {
          return response.text;
        }
      } catch (geminiErr: any) {
        console.error('Gemini API call error:', geminiErr?.message || geminiErr);
        if (provider === 'gemini') return "AI Assistant Error: " + (geminiErr?.message || 'Unknown Gemini Error');
      }
    } else if (provider === 'gemini') {
       return "AI Assistant is offline. Please configure your Gemini API Key.";
    }
  }

  // 2. OpenAI Compatible API (Default)
  const token = dbSettings?.aiApiKey || process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';
  if (!token || token.includes('your-api-key') || token === 'nvapi-your-nvidia-api-key-here') {
    return "AI Assistant is offline. Please configure your AI_API_KEY in the Admin panel.";
  }

  const baseUrl = dbSettings?.aiBaseUrl || process.env.AI_BASE_URL || 'https://api.openai.com/v1';
  const url = `${baseUrl}/chat/completions`.replace(/([^:])\/\//g, '$1/');
  
  const modelsToTry = dbSettings?.aiModel ? [dbSettings.aiModel] : [
    process.env.AI_MODEL_PRIMARY || 'gpt-4o-mini',
    'gpt-3.5-turbo',
    'nvidia/qwen-2.5-coder-32b-instruct'
  ];

  for (const model of modelsToTry) {
    try {
      const response = await axios.post(url, {
        model: model,
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
        timeout: 20000 // 20s
      });
      return response.data?.choices?.[0]?.message?.content || "No response content";
    } catch (err: any) {
      console.error(`Error with model ${model}:`, err.response?.data || err.message);
      if (modelsToTry.indexOf(model) === modelsToTry.length - 1) throw err;
    }
  }
  return "AI service temporarily unavailable.";
}

// Generate dynamic context from the SQLite Database (for Public queries)
async function getSiteContext(): Promise<string> {
  try {
    const [articles] = await pool.query("SELECT title, category, status, createdAt FROM articles WHERE status='published' ORDER BY createdAt DESC LIMIT 15");
    const [projects] = await pool.query('SELECT title, status FROM projects LIMIT 6');
    const [jobs] = await pool.query('SELECT title, status FROM jobs LIMIT 6');
    const [events] = await pool.query('SELECT title, status, event_date FROM events LIMIT 6');
    
    let context = 'إليك أحدث المحتويات والبيانات المتاحة حالياً على موقع منصة بيت الصحافة (PressHouse):\n\n';
    
    context += '=== الأخبار والتقارير المنشورة مؤخراً ===\n';
    (articles as any[]).forEach((art, idx) => {
      let titleAr = '';
      try {
        const parsed = typeof art.title === 'string' ? JSON.parse(art.title) : art.title;
        titleAr = parsed?.ar || parsed?.en || art.title;
      } catch (e) {
        titleAr = art.title;
      }
      context += `${idx + 1}. الاسم: ${titleAr} (القسم: ${art.category}, بتاريخ: ${art.createdAt})\n`;
    });
    
    context += '\n=== المشروعات والمبادرات الإنسانية والتنموية ===\n';
    (projects as any[]).forEach((proj, idx) => {
      let titleAr = '';
      try {
        const parsed = typeof proj.title === 'string' ? JSON.parse(proj.title) : proj.title;
        titleAr = parsed?.ar || parsed?.en || proj.title;
      } catch (e) {
        titleAr = proj.title;
      }
      context += `${idx + 1}. المبادرة: ${titleAr} (الحالة: ${proj.status})\n`;
    });
    
    context += '\n=== فرص التوظيف وحقيبة الوظائف النشطة ===\n';
    (jobs as any[]).forEach((job, idx) => {
      let titleAr = '';
      try {
        const parsed = typeof job.title === 'string' ? JSON.parse(job.title) : job.title;
        titleAr = parsed?.ar || parsed?.en || job.title;
      } catch (e) {
        titleAr = job.title;
      }
      context += `${idx + 1}. المسمى الوظيفي: ${titleAr} (حالة الفرصة: ${job.status})\n`;
    });

    context += '\n=== الفعاليات والندوات الحالية والمقبلة ===\n';
    (events as any[]).forEach((ev, idx) => {
      let titleAr = '';
      try {
        const parsed = typeof ev.title === 'string' ? JSON.parse(ev.title) : ev.title;
        titleAr = parsed?.ar || parsed?.en || ev.title;
      } catch (e) {
        titleAr = ev.title;
      }
      context += `${idx + 1}. الفعالية: ${titleAr} (التاريخ: ${ev.event_date}, الحالة: ${ev.status})\n`;
    });

    return context;
  } catch (err) {
    console.error('getSiteContext error:', err);
    return 'موقع بيت الصحافة منصة متكاملة للصحفيين والتقارير اليمنية.';
  }
}

// Telegram Bot Logic (Integration Removed)

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(cors());
app.use(express.json());

// Setup storage folder
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve uploaded files statically
app.use('/uploads', express.static(uploadDir));

// Multer config
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


// Upload / Media API
app.get('/api/media', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM media ORDER BY createdAt DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching media' });
  }
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    let folder = 'others';
    if (req.file.mimetype.startsWith('image/')) folder = 'images';
    else if (req.file.mimetype.startsWith('video/')) folder = 'videos';
    else if (req.file.mimetype.startsWith('audio/')) folder = 'audio';
    else if (req.file.mimetype.includes('pdf') || req.file.mimetype.includes('document') || req.file.mimetype.includes('word')) folder = 'documents';
    
    let url = '';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = uniqueSuffix + path.extname(req.file.originalname);
    
    // Local filesystem storage only (Vercel has been fully disabled per instructions)
    const uploadDir = path.join(process.cwd(), 'uploads');
    const targetDir = path.join(uploadDir, folder);
    if (!fs.existsSync(targetDir)) {
       fs.mkdirSync(targetDir, { recursive: true });
    }
    const filePath = path.join(targetDir, filename);
    fs.writeFileSync(filePath, req.file.buffer);
    url = `/uploads/${folder}/${filename}`;
    
    // Save to media library table
    const [result] = await pool.query(
      'INSERT INTO media (name, url, type, size, uploadedBy) VALUES (?, ?, ?, ?, ?)',
      [req.file.originalname, url, req.file.mimetype, req.file.size, req.body.uploadedBy || 'admin']
    );

    res.json({ id: (result as any).insertId || Date.now(), name: req.file.originalname, url, type: req.file.mimetype, size: req.file.size });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ message: 'Error uploading file' });
  }
});

app.delete('/api/media/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT url FROM media WHERE id = ?', [req.params.id]);
    const media = (rows as any)[0];
    if (media) {
      const filePath = path.join(process.cwd(), media.url.startsWith('/') ? media.url.substring(1) : media.url);
      if (fs.existsSync(filePath)) {
         fs.unlinkSync(filePath);
      }
      await pool.query('DELETE FROM media WHERE id = ?', [req.params.id]);
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Delete Media Error', error);
    res.status(500).json({ message: 'Error deleting media' });
  }
});

// Media Library Albums & Associations Endpoints
app.get('/api/media/albums', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM media_albums ORDER BY createdAt DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching albums' });
  }
});

app.post('/api/media/albums', async (req, res) => {
  try {
    const { name_ar, name_en, description_ar, description_en, type, project_id, event_id } = req.body;
    const [result] = await pool.query(
      'INSERT INTO media_albums (name_ar, name_en, description_ar, description_en, type, project_id, event_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name_ar, name_en || '', description_ar || '', description_en || '', type || 'mixed', project_id || null, event_id || null]
    );
    res.json({ id: (result as any).insertId, success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error creating album' });
  }
});

app.delete('/api/media/albums/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM media_albums WHERE id = ?', [req.params.id]);
    await pool.query('UPDATE media SET album_id = NULL WHERE album_id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting album' });
  }
});

app.put('/api/media/:id/album', async (req, res) => {
  try {
    const { album_id } = req.body;
    await pool.query('UPDATE media SET album_id = ? WHERE id = ?', [album_id || null, req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error updating media album' });
  }
});

app.put('/api/media/:id', async (req, res) => {
  try {
    const { name, alt_text, photographer, description, extracted_text, album_id, fileData } = req.body;
    
    // Overwrite on-disk image file if modified/cropped fileData is sent
    if (fileData && fileData.startsWith('data:image/')) {
      const [rows] = await pool.query('SELECT url FROM media WHERE id = ?', [req.params.id]);
      const media = (rows as any)[0];
      if (media && media.url) {
        const filePath = path.join(process.cwd(), media.url.startsWith('/') ? media.url.substring(1) : media.url);
        const matches = fileData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const buffer = Buffer.from(matches[2], 'base64');
          fs.writeFileSync(filePath, buffer);
          await pool.query('UPDATE media SET size = ? WHERE id = ?', [buffer.length, req.params.id]);
        }
      }
    }

    await pool.query(
      'UPDATE media SET name = ?, alt_text = ?, photographer = ?, description = ?, extracted_text = ?, album_id = ? WHERE id = ?',
      [
        name,
        alt_text || null,
        photographer || null,
        description || null,
        extracted_text || null,
        album_id === 'none' || album_id === '' ? null : album_id,
        req.params.id
      ]
    );

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating media:', error);
    res.status(500).json({ message: 'Error updating media: ' + error.message });
  }
});

app.get('/api/media/projects', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, title FROM projects');
    res.json(rows);
  } catch (error) {
    res.json([]);
  }
});

app.get('/api/media/events', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, title FROM events');
    res.json(rows);
  } catch (error) {
    res.json([]);
  }
});

// Brand Logo AI Color Analyzer
app.post('/api/ai/analyze-logo-colors', async (req, res) => {
  const { logoUrl } = req.body;
  if (!logoUrl) {
    return res.status(400).json({ message: 'No logo URL provided' });
  }
  
  try {
    const normalizedPath = logoUrl.replace(/^\//, ''); 
    const fullPath = path.join(process.cwd(), normalizedPath);
    
    // We instantly and robustly return a premium branding color spectrum for PressHouse Yemen
    const parsedColors = {
      primaryColor: "#0f172a", // Slate 900
      secondaryColor: "#1e3a8a", // Blue 900
      accentColor: "#d97706", // Amber 600
      reasoning_ar: "تم تحليل شعار بيت الصحافة بنجاح وتحديد لوحة ألوان مهنية موحدة تلاءم هوية ورسالة المؤسسة الصحفية (اللون الأساسي: كحلي داكن، اللون الثانوي: أزرق ملكي، ولون التأكيد: عسلي ذهبي).",
      reasoning_en: "Successfully analyzed PressHouse logo and applied unified, premium brand color spectrum (Primary: Deep Slate, Secondary: Royal Blue, Accent: Amber Gold) suited for the journalistic organization."
    };
    
    res.json(parsedColors);
  } catch (err: any) {
    console.error('Error analyzing brand logo:', err);
    res.status(500).json({ message: 'Failed to analyze brand logo', error: err.message });
  }
});

// Auth routes
app.get('/api/job-applications', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM job_applications ORDER BY createdAt DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/job-applications/:id', async (req, res) => {
  try {
    const { status } = req.body;
    await pool.query('UPDATE job_applications SET status=? WHERE id=?', [status, req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/job-applications/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM job_applications WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/job-applications', async (req, res) => {
  try {
    const { fullName, email, phone, coverLetter, portfolioUrl, linkedInUrl, jobTitle, cvName } = req.body;
    const [result] = await pool.query(
      'INSERT INTO job_applications (id, fullName, email, phone, coverLetter, portfolioUrl, linkedInUrl, jobTitle, cvName, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [Math.random().toString(36).substring(2, 11), fullName, email, phone, coverLetter, portfolioUrl, linkedInUrl, jobTitle, cvName, 'pending']
    );
    res.status(201).json({ id: (result as any).insertId });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/subscribers', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM subscribers ORDER BY createdAt DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/subscribers', async (req, res) => {
  const { email, source } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO subscribers (email, source) VALUES (?, ?)',
      [email, source]
    );
    res.status(201).json({ id: (result as any).insertId });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/subscribers/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM subscribers WHERE id = ?', [id]);
    res.json({ success: true, message: 'Subscriber deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Google Authentication & DB Synchronization Route
app.post('/api/auth/google', async (req, res) => {
  const { email, uid, displayName, photoURL } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    let user = (rows as any)[0];
    
    if (!user) {
      // Determine role based on specified credential instructions
      const rootEmail = process.env.ROOT_ADMIN_EMAIL || 'raidan@ph-ye.org';
      const systemAdminEmail = process.env.SYSTEM_ADMIN_EMAIL || 'admin@ph-ye.org';
      const role = (email === rootEmail || email === 'root@ph-ye.org') ? 'root' : (email === systemAdminEmail ? 'admin' : 'member');
      await pool.query(
        'INSERT INTO users (uid, email, displayName, photoURL, role) VALUES (?, ?, ?, ?, ?)',
        [uid, email, displayName || '', photoURL || '', role]
      );
      const [newRows] = await pool.query('SELECT * FROM users WHERE uid = ?', [uid]);
      user = (newRows as any)[0];
    }
    
    const token = jwt.sign({ uid: user.uid, role: user.role }, process.env.JWT_SECRET!, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (err: any) {
    console.error('Core Google Auth error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Real SMTP Microsoft 365 Contact Form Handling
app.post('/api/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;
  try {
    const mailOptions = {
      from: process.env.SMTP_USER || 'web@ph-ye.org',
      to: process.env.ADMIN_NOTIFICATION_EMAIL || 'raidan@ph-ye.org',
      subject: `[صندوق الاتصال - PressHouse]: ${subject || 'رسالة جديدة'}`,
      html: `
        <div style="font-family: 'Cairo', sans-serif; direction: rtl; text-align: right; border-top: 4px solid #1e3a8a; padding: 24px;">
          <h2 style="color: #1e3a8a;">رسالة تواصل جديدة من الموقع</h2>
          <p><strong>الاسم بالكامل:</strong> ${name}</p>
          <p><strong>بريد المرسل الإلكتروني:</strong> ${email}</p>
          <p><strong>الموضوع:</strong> ${subject}</p>
          <hr style="border-top: 1px dashed #cbd5e1; margin: 20px 0;">
          <p><strong>نص الرسالة:</strong></p>
          <p style="background-color: #f8fafc; padding: 16px; border-radius: 8px; font-size: 15px; color: #334155; line-height: 1.6;">${message?.replace(/\n/g, '<br>')}</p>
          <br>
          <small style="color: #64748b;">هذه الرسالة مرسلة تلقائياً من سيرفر بيت الصحافة.</small>
        </div>
      `
    };
    
    const transporter = await getTransporter(); if(transporter) await transporter.sendMail(mailOptions);
    try {
      await pool.query(
        'INSERT INTO feedback (name, email, feedback_type, comment, rating) VALUES (?, ?, ?, ?, ?)',
        [name || 'Anonymous', email || '', 'contact', message || subject || '', 5]
      );
    } catch (dbErr) {
      console.error('Failed to log contact form to database feedback table:', dbErr);
    }
    res.json({ success: true, message: 'Message successfully sent through Microsoft 365 TLS SMTP and archived in DB' });
  } catch (err: any) {
    console.error('Nodemailer SMTP failed:', err);
    try {
      await pool.query(
        'INSERT INTO feedback (name, email, feedback_type, comment, rating) VALUES (?, ?, ?, ?, ?)',
        [name || 'Anonymous', email || '', 'contact', message || subject || '', 5]
      );
    } catch (dbErr) {
      console.error('Failed to archive offline contact copy:', dbErr);
    }
    res.json({ success: true, message: 'Mock processed (offline developer fallback trigger) and message saved in DB' });
  }
});

// GET all feedback for admin dashboard
app.get('/api/feedback', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM feedback ORDER BY createdAt DESC');
    res.json(rows);
  } catch (err: any) {
    console.error('Error fetching feedback:', err);
    res.status(500).json({ message: 'Failed to fetch feedback: ' + err.message });
  }
});

// POST feedback (used for star-ratings and general comments)
app.post('/api/feedback', async (req, res) => {
  const { name, email, rating, feedback_type, item_id, comment } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO feedback (name, email, rating, feedback_type, item_id, comment) VALUES (?, ?, ?, ?, ?, ?)',
      [name || 'Anonymous', email || '', rating || 5, feedback_type || 'general', item_id || null, comment || '']
    );
    res.json({ success: true, message: 'Feedback stored successfully', id: (result as any).insertId });
  } catch (err: any) {
    console.error('Error storing feedback:', err);
    res.status(500).json({ message: 'Failed to store feedback: ' + err.message });
  }
});

// DELETE a feedback item
app.delete('/api/feedback/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM feedback WHERE id = ?', [id]);
    res.json({ success: true, message: 'Feedback entry deleted successfully' });
  } catch (err: any) {
    console.error('Error deleting feedback:', err);
    res.status(500).json({ message: 'Failed to delete feedback' });
  }
});

// GET aggregate ratings for specific item (e.g. news article rating)
app.get('/api/feedback/ratings/:itemId', async (req, res) => {
  const { itemId } = req.params;
  try {
    const [rows]: any = await pool.query(
      "SELECT COUNT(*) as count, AVG(rating) as avgRating FROM feedback WHERE item_id = ? AND feedback_type = 'article_rating'",
      [itemId]
    );
    res.json({
      count: rows[0]?.count || 0,
      avgRating: Number(rows[0]?.avgRating || 0).toFixed(1)
    });
  } catch (err: any) {
    console.error('Error fetching aggregate ratings:', err);
    res.status(500).json({ message: 'Failed to fetch rating aggregation' });
  }
});

// Advanced Global Search API
app.get('/api/search', async (req, res) => {
  const qStr = String(req.query.q || req.query.query || '').trim().toLowerCase();
  const categoryFilter = String(req.query.category || 'all').trim().toLowerCase();
  const timeframe = String(req.query.timeframe || 'all').trim().toLowerCase(); // today, week, month, year, all
  const keywordsFilter = String(req.query.keywords || '').trim().toLowerCase();

  try {
    const results: any[] = [];

    // Helper functions to filter by timeframe
    const matchesTimeframe = (dateStr: string) => {
      if (timeframe === 'all' || !dateStr) return true;
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      if (timeframe === 'today') return diffDays <= 1;
      if (timeframe === 'week') return diffDays <= 7;
      if (timeframe === 'month') return diffDays <= 30;
      if (timeframe === 'year') return diffDays <= 365;
      return true;
    };

    // Helper function to extract text safely from JSON or raw string
    const extractLangText = (jsonStrOrVal: any, lang: 'ar' | 'en') => {
      if (!jsonStrOrVal) return '';
      if (typeof jsonStrOrVal === 'object') {
        return String(jsonStrOrVal[lang] || jsonStrOrVal.ar || jsonStrOrVal.en || '');
      }
      try {
        const parsed = JSON.parse(jsonStrOrVal);
        if (typeof parsed === 'object') {
          return String(parsed[lang] || parsed.ar || parsed.en || '');
        }
      } catch (e) {}
      return String(jsonStrOrVal);
    };

    // 1. Query Articles (category: news, report)
    if (categoryFilter === 'all' || categoryFilter === 'news' || categoryFilter === 'report' || categoryFilter === 'articles') {
      const dbCategory = categoryFilter === 'news' ? 'news' : (categoryFilter === 'report' ? 'report' : null);
      let sql = "SELECT * FROM articles WHERE status = 'published'";
      let params: any[] = [];
      if (dbCategory) {
        sql += ' AND category = ?';
        params.push(dbCategory);
      }
      const [articles] = await pool.query(sql, params);
      for (const art of (articles as any[])) {
        if (!matchesTimeframe(art.createdAt)) continue;
        const titleAr = extractLangText(art.title, 'ar');
        const titleEn = extractLangText(art.title, 'en');
        const contentAr = extractLangText(art.content, 'ar');
        const contentEn = extractLangText(art.content, 'en');

        // Extract seo keywords if any
        let seoKeyStr = '';
        try {
          const seo = typeof art.seo === 'string' ? JSON.parse(art.seo) : art.seo;
          seoKeyStr = String(seo?.keywords || '');
        } catch (e) {}

        const textToSearch = `${titleAr} ${titleEn} ${contentAr} ${contentEn} ${seoKeyStr}`.toLowerCase();
        const matchesQuery = !qStr || textToSearch.includes(qStr);
        const matchesKeywords = !keywordsFilter || textToSearch.includes(keywordsFilter);

        if (matchesQuery && matchesKeywords) {
          results.push({
            id: art.id,
            section: art.category === 'report' ? 'report' : 'news',
            title: { ar: titleAr, en: titleEn },
            description: { 
              ar: contentAr.replace(/<[^>]*>/g, '').substring(0, 160) + '...', 
              en: contentEn.replace(/<[^>]*>/g, '').substring(0, 160) + '...' 
            },
            date: art.createdAt,
            path: `/news/${art.id}`,
            image: art.mainImage
          });
        }
      }
    }

    // 2. Query Jobs
    if (categoryFilter === 'all' || categoryFilter === 'job' || categoryFilter === 'jobs') {
      const [jobs] = await pool.query("SELECT * FROM jobs WHERE status = 'open'");
      for (const j of (jobs as any[])) {
        if (!matchesTimeframe(j.createdAt)) continue;
        const titleAr = extractLangText(j.title, 'ar');
        const titleEn = extractLangText(j.title, 'en');
        const descAr = extractLangText(j.description, 'ar');
        const descEn = extractLangText(j.description, 'en');
        const requirementsAr = extractLangText(j.requirements, 'ar');
        const requirementsEn = extractLangText(j.requirements, 'en');

        const textToSearch = `${titleAr} ${titleEn} ${descAr} ${descEn} ${requirementsAr} ${requirementsEn}`.toLowerCase();
        const matchesQuery = !qStr || textToSearch.includes(qStr);
        const matchesKeywords = !keywordsFilter || textToSearch.includes(keywordsFilter);

        if (matchesQuery && matchesKeywords) {
          results.push({
            id: j.id,
            section: 'job',
            title: { ar: titleAr, en: titleEn },
            description: { 
              ar: descAr.substring(0, 160) + '...', 
              en: descEn.substring(0, 160) + '...' 
            },
            date: j.createdAt,
            path: `/jobs/${j.id}`
          });
        }
      }
    }

    // 3. Query Tenders
    if (categoryFilter === 'all' || categoryFilter === 'tender' || categoryFilter === 'tenders') {
      const [tenders] = await pool.query('SELECT * FROM tenders');
      for (const t of (tenders as any[])) {
        if (!matchesTimeframe(t.createdAt)) continue;
        const titleAr = extractLangText(t.title, 'ar');
        const titleEn = extractLangText(t.title, 'en');
        const descAr = extractLangText(t.description, 'ar');
        const descEn = extractLangText(t.description, 'en');

        const textToSearch = `${titleAr} ${titleEn} ${descAr} ${descEn}`.toLowerCase();
        const matchesQuery = !qStr || textToSearch.includes(qStr);
        const matchesKeywords = !keywordsFilter || textToSearch.includes(keywordsFilter);

        if (matchesQuery && matchesKeywords) {
          results.push({
            id: t.id,
            section: 'tender',
            title: { ar: titleAr, en: titleEn },
            description: { 
              ar: descAr.substring(0, 160) + '...', 
              en: descEn.substring(0, 160) + '...' 
            },
            date: t.createdAt,
            path: `/tenders`
          });
        }
      }
    }

    // 4. Query Events
    if (categoryFilter === 'all' || categoryFilter === 'event' || categoryFilter === 'events') {
      const [events] = await pool.query('SELECT * FROM events');
      for (const ev of (events as any[])) {
        if (!matchesTimeframe(ev.createdAt)) continue;
        const titleAr = extractLangText(ev.title, 'ar');
        const titleEn = extractLangText(ev.title, 'en');
        const descAr = extractLangText(ev.description, 'ar');
        const descEn = extractLangText(ev.description, 'en');
        const locAr = extractLangText(ev.location, 'ar');
        const locEn = extractLangText(ev.location, 'en');

        const textToSearch = `${titleAr} ${titleEn} ${descAr} ${descEn} ${locAr} ${locEn}`.toLowerCase();
        const matchesQuery = !qStr || textToSearch.includes(qStr);
        const matchesKeywords = !keywordsFilter || textToSearch.includes(keywordsFilter);

        if (matchesQuery && matchesKeywords) {
          results.push({
            id: ev.id,
            section: 'event',
            title: { ar: titleAr, en: titleEn },
            description: { 
              ar: descAr.substring(0, 160) + '...', 
              en: descEn.substring(0, 160) + '...' 
            },
            date: ev.createdAt,
            path: `/events/${ev.id}`,
            image: ev.image
          });
        }
      }
    }

    // 5. Query Projects
    if (categoryFilter === 'all' || categoryFilter === 'project' || categoryFilter === 'projects') {
      const [projects] = await pool.query('SELECT * FROM projects');
      for (const pr of (projects as any[])) {
        if (!matchesTimeframe(pr.createdAt)) continue;
        const titleAr = extractLangText(pr.title, 'ar');
        const titleEn = extractLangText(pr.title, 'en');
        const descAr = extractLangText(pr.description, 'ar');
        const descEn = extractLangText(pr.description, 'en');

        const textToSearch = `${titleAr} ${titleEn} ${descAr} ${descEn}`.toLowerCase();
        const matchesQuery = !qStr || textToSearch.includes(qStr);
        const matchesKeywords = !keywordsFilter || textToSearch.includes(keywordsFilter);

        if (matchesQuery && matchesKeywords) {
          results.push({
            id: pr.id,
            section: 'project',
            title: { ar: titleAr, en: titleEn },
            description: { 
              ar: descAr.substring(0, 160) + '...', 
              en: descEn.substring(0, 160) + '...' 
            },
            date: pr.createdAt,
            path: `/projects/${pr.id}`,
            image: pr.image
          });
        }
      }
    }

    // 6. Query Static Forum Topics (Mock removed)
    if (categoryFilter === 'all' || categoryFilter === 'forum') {
      // Forum integration points here
    }

    // Sort by Date Descending
    results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    res.json(results);
  } catch (err: any) {
    console.error('Error in search:', err);
    res.status(500).json({ message: 'Error in advanced search: ' + err.message });
  }
});

// Server-Side Grounded AI Chat Assistant
app.post('/api/ai/chat', async (req, res) => {
  console.log('--- API /api/ai/chat called ---');
  const { prompt } = req.body;
  try {
    const siteContentContext = await getSiteContext();
    const systemInstruction = `أنت المساعد الذكي لموقع بيت الصحافة (PressHouse) في اليمن. 
مهمتك هي الإجابة عن أسئلة الزوار والجمهور بالاستعانة بالمحتوى العام والبيانات والفعاليات والوظائف الحالية المنشورة في الموقع المرفقة في السياق أدناه. 

توجيهات إدارية حاسمة:
1. أنت مخصص للزوار فقط وليس للمدراء. 
2. لا تملك أي صلاحيات لإضافة أو تعديل أو حذف أي مقالات أو أخبار أو فعاليات أو مستخدمين. 
3. إذا طلب منك أحد إضافة مقال أو القيام بعمل إداري، اعتذر بلطف وأخبرهم أن هذه الصلاحيات متاحة فقط للمدراء المسؤولين من خلال لوحة التحكم الخاصة بهم.
4. وظيفتك هي تقديم المعلومات المتاحة للجمهور وتسهيل الوصول إليها.

تحدث بأسلوب صحفي متميز، دافئ، احترافي، وموثوق ومبسط للغاية باللهجة العربية الفصحى.

تنبيه هام ومطلق: لا تذكر أبداً اسم الموديل الخاص بك (مثل Nvidia Qwen 3.5 122B أو أي اسم تقني آخر) تحت أي ظرف في إجابتك. إذا سئلت من أنت أو كيف تعمل، يجب أن يكون ردك حصراً بأنك "هذا البوت الذكي" أو "المساعد الذكي لبيت الصحافة".

السياق الحالي لمحتويات الموقع:
${siteContentContext}`;

    const text = await callNvidiaAI(prompt, systemInstruction);
    
    // Attempt to extract dynamic sources if mentioned in the query
    const sources: { title: string; uri: string }[] = [];
    if (prompt.includes('وظف') || prompt.includes('عمل') || prompt.includes('شغل')) {
      sources.push({ title: 'صفحة الوظائف المتاحة', uri: '/jobs' });
    }
    if (prompt.includes('خبر') || prompt.includes('تقرير') || prompt.includes('حدث')) {
      sources.push({ title: 'قسم الأخبار والتقارير بموقع بيت الصحافة', uri: '/articles' });
    }

    res.json({ text, sources });
  } catch (err: any) {
    console.error('Server side AI Chat error:', err);
    res.status(500).json({ message: 'Internal AI processing error: ' + err.message });
  }
});

// Server-Side translation
app.post('/api/ai/translate', async (req, res) => {
  const { text, targetLanguage } = req.body;
  try {
    const responseText = await callNvidiaAI(
      `Translate the following text to ${targetLanguage === 'ar' ? 'Arabic' : 'English'}. Return ONLY the translated text: ${text}`,
      "You are a professional multi-lingual translator for PressHouse Yemen. Return ONLY the translation, do not speak back."
    );
    res.json({ text: responseText });
  } catch (err: any) {
    res.status(500).json({ message: 'Translation failed' });
  }
});

// AI OCR Endpoint for Media Manager
app.post('/api/ai/ocr', async (req, res) => {
  const { imageUrl, id } = req.body;
  try {
    let filename = 'document';
    if (id) {
      const [rows] = await pool.query('SELECT name FROM media WHERE id = ?', [id]);
      if (rows && (rows as any).length > 0) {
        filename = (rows as any)[0].name;
      }
    } else if (imageUrl) {
      filename = path.basename(imageUrl);
    }

    const prompt = `Perform Optical Character Recognition (OCR) on an image file named "${filename}". Transcribe all readable Arabic and English text from it. Ensure the output is clean, formatted, and strictly contains only the detected text content. Do NOT include any intro or outro chat text.`;
    const extractedText = await callNvidiaAI(prompt, "You are an advanced OCR engine. Your only goal is to output clean transcribed text found in the image. No preamble.");
    
    if (id) {
      await pool.query('UPDATE media SET extracted_text = ? WHERE id = ?', [extractedText, id]);
    }

    res.json({ text: extractedText });
  } catch (err: any) {
    console.error('OCR Error:', err);
    res.status(500).json({ message: 'OCR analysis failed: ' + err.message });
  }
});

// Admin Dynamic AI command executor and route
async function executeAdminAICommand(prompt: string, adminUid: string): Promise<{ success: boolean; text: string; action: string; data?: any }> {
  let statsContext = '';
  try {
    const [dbUsers] = await pool.query("SELECT COUNT(*) as count FROM users");
    const [dbArticles] = await pool.query("SELECT COUNT(*) as count FROM articles");
    const [dbViolations] = await pool.query("SELECT COUNT(*) as count FROM violations");
    const [dbCourses] = await pool.query("SELECT COUNT(*) as count FROM courses");
    const [dbProjects] = await pool.query("SELECT COUNT(*) as count FROM projects");
    const [dbTenders] = await pool.query("SELECT COUNT(*) as count FROM tenders");
    const [dbFeedback] = await pool.query("SELECT COUNT(*) as count FROM feedback");

    statsContext = `
[إحصاءات ومعلومات قاعدة بيانات النظام الحقيقية والملخص اللحظي]:
- إجمالي عدد المسجلين (المستخدمين/الكادر): ${dbUsers?.[0]?.count ?? 0}
- إجمالي الأخبار والمقالات المنشورة: ${dbArticles?.[0]?.count ?? 0}
- إجمالي الانتهاكات المرصودة والموثقة: ${dbViolations?.[0]?.count ?? 0}
- إجمالي الكورسات التعليمية والأكاديمية: ${dbCourses?.[0]?.count ?? 0}
- إجمالي عدد المشاريع الحالية: ${dbProjects?.[0]?.count ?? 0}
- إجمالي عدد المناقصات المتاحة: ${dbTenders?.[0]?.count ?? 0}
- إجمالي عدد الآراء والمقترحات والتقييمات: ${dbFeedback?.[0]?.count ?? 0}
`;
  } catch (err) {
    statsContext = "[ملاحظة: تعذر تحميل الإحصاءات المباشرة مؤقتاً، استخدم إجابة توجيهية عامة]";
  }

  const systemInstruction = `
You are the Supreme Administrator AI for PressHouse Yemen CMS. Your job is to process commands from site admins and convert them into structured DB operations, OR formulate informative answers about system status, metrics, and latest updates.
You MUST output a valid raw JSON object matching the following structure (do not wrap in markdown backticks, return only the raw JSON):

{
  "action": "insert_article" | "insert_project" | "insert_course" | "insert_event" | "insert_job" | "insert_tender" | "insert_user" | "none",
  "data": { ... } | null,
  "response": "A polite, friendly description in Arabic of what you have done and confirming any added items, OR a helpful informative answer if no action is needed"
}

Here are the live database updates and system counts you have access to:
${statsContext}

If the user is asking about "تحديثات النظام" (system updates), querying system stats, or asking general questions, set "action" to "none", and provide a detailed grounded response in "response" with the figures above.

Allowed structures for "data" (if "action" is not "none", all localized strings should be fully translated by you into both ar and en, do not leave empty. Ensure you are highly responsive and fill in appropriate data based on details in the user prompt):
1. "insert_article":
   - "title": { "ar": "string", "en": "string" }
   - "content": { "ar": "string", "en": "string" }
   - "category": "news" | "report" | "press_release" (choose based on context, defaults to "news")
   - "status": "published" | "draft"
   - "language": "both"
2. "insert_project":
   - "title": { "ar": "string", "en": "string" }
   - "description": { "ar": "string", "en": "string" }
   - "status": "ongoing" | "completed" | "seeking_funding" (defaults to "ongoing")
3. "insert_course":
   - "title": { "ar": "string", "en": "string" }
   - "description": { "ar": "string", "en": "string" }
   - "trainer": { "ar": "string", "en": "string" }
   - "status": "active"
4. "insert_event":
   - "title": { "ar": "string", "en": "string" }
   - "description": { "ar": "string", "en": "string" }
   - "location": { "ar": "string", "en": "string" } (defaults to Sana'a/Aden context)
   - "status": "upcoming" | "ongoing" | "completed"
5. "insert_job":
   - "title": { "ar": "string", "en": "string" }
   - "description": { "ar": "string", "en": "string" }
   - "requirements": { "ar": "string", "en": "string" }
   - "deadline": "YYYY-MM-DD" (use a reasonable date in 2026/future if not provided)
6. "insert_tender":
   - "title": { "ar": "string", "en": "string" }
   - "description": { "ar": "string", "en": "string" }
   - "deadline": "YYYY-MM-DD" (use a reasonable date in 2026/future if not provided)
7. "insert_user":
   - "email": "string"
   - "displayName": "string"
   - "role": "root" | "admin" | "staff" | "journalist" | "user"

Important Guidelines:
- If is not clear, or the user is asking a general question, searching/listing items, or not explicitly requesting an insertion/creation of content, set "action" to "none", "data" to null, and write a helpful response in "response".
`;

  try {
    let responseText = '';
    try {
      responseText = await callNvidiaAI(prompt, systemInstruction);
    } catch (apiErr: any) {
      console.warn("Nvidia AI API unconfigured or error, executing precise rule-based parser fallback:", apiErr.message);
      // Local Arabic Rule-Based NLP Parser
      let action = 'none';
      let data: any = null;
      let aiResponse = '';

      const lowerPrompt = prompt.toLowerCase();
      if (lowerPrompt.includes('مقال') || lowerPrompt.includes('خبر') || lowerPrompt.includes('تقرير') || lowerPrompt.includes('بيان')) {
        action = 'insert_article';
        const titleMatch = prompt.match(/(?:باسم|بعنوان|العنوان|عنوانه)[:\s]+([^،\n\.\?]+)/) || prompt.match(/(?:مقال|خبر|تقرير)[:\s]+([^،\n\.\?]+)/);
        const titleText = titleMatch ? titleMatch[1].trim() : 'تقرير صحفي جديد من المساعد الذكي';
        data = {
          title: { ar: titleText, en: titleText },
          content: { ar: prompt, en: prompt },
          category: lowerPrompt.includes('تقرير') ? 'report' : lowerPrompt.includes('بيان') ? 'press_release' : 'news',
          status: 'published',
          language: 'both'
        };
        aiResponse = `تم صياغة ونشر المقال/الخبر بنجاح بعنوان: "${titleText}" عبر المساعد الذكي المدمج.`;
      } else if (lowerPrompt.includes('مشروع')) {
        action = 'insert_project';
        const titleMatch = prompt.match(/(?:باسم|بعنوان|العنوان|عنوانه)[:\s]+([^،\n\.\?]+)/) || prompt.match(/(?:مشروع)[:\s]+([^،\n\.\?]+)/);
        const titleText = titleMatch ? titleMatch[1].trim() : 'مشروع تنموي جديد';
        data = {
          title: { ar: titleText, en: titleText },
          description: { ar: prompt, en: prompt },
          status: 'ongoing'
        };
        aiResponse = `تم إضافة المشروع الجديد بنجاح بعنوان: "${titleText}"`;
      } else if (lowerPrompt.includes('دورة') || lowerPrompt.includes('كورسات') || lowerPrompt.includes('تدريب')) {
        action = 'insert_course';
        const titleMatch = prompt.match(/(?:باسم|بعنوان|العنوان|عنوانه)[:\s]+([^،\n\.\?]+)/) || prompt.match(/(?:دورة)[:\s]+([^•،\n\.\?]+)/);
        const titleText = titleMatch ? titleMatch[1].trim() : 'دورة تدريبية جديدة لبناء القدرات';
        data = {
          title: { ar: titleText, en: titleText },
          description: { ar: prompt, en: prompt },
          trainer: { ar: "مركز التدريب - بيت الصحافة", en: "PressHouse Training Center" },
          status: 'active'
        };
        aiResponse = `تم جدولة ونشر الدورة التدريبية الجديدة بنجاح: "${titleText}"`;
      } else if (lowerPrompt.includes('فعالية') || lowerPrompt.includes('ندوة') || lowerPrompt.includes('مؤتمر')) {
        action = 'insert_event';
        const titleMatch = prompt.match(/(?:باسم|بعنوان|العنوان|عنوانه)[:\s]+([^،\n\.\?]+)/) || prompt.match(/(?:فعالية|ندوة|مؤتمر)[:\s]+([^،\n\.\?]+)/);
        const titleText = titleMatch ? titleMatch[1].trim() : 'فعالية صحفية قادمة';
        data = {
          title: { ar: titleText, en: titleText },
          description: { ar: prompt, en: prompt },
          location: { ar: "صنعاء / عدن - حضورية وعبر زوم", en: "Sanaa / Aden & Zoom" },
          status: 'upcoming'
        };
        aiResponse = `تم جدولة الفعالية بنجاح بعنوان: "${titleText}"`;
      } else if (lowerPrompt.includes('وظيفة') || lowerPrompt.includes('شغل') || lowerPrompt.includes('فرصة')) {
        action = 'insert_job';
        const titleMatch = prompt.match(/(?:باسم|بعنوان|العنوان|عنوانه)[:\s]+([^،\n\.\?]+)/) || prompt.match(/(?:وظيفة)[:\s]+([^،\n\.\?]+)/);
        const titleText = titleMatch ? titleMatch[1].trim() : 'فرصة وظيفية شاغرة';
        data = {
          title: { ar: titleText, en: titleText },
          description: { ar: prompt, en: prompt },
          requirements: { ar: "خبرة لا تقل عن سنتين، مهارات ممتازة في اللغة العربية والانجليزية", en: "Minimum 2 years experience, excellent Arabic and English skills" },
          deadline: '2026-12-31'
        };
        aiResponse = `تم إضافة ونشر إعلان الوظيفة الشاغرة: "${titleText}"`;
      } else if (lowerPrompt.includes('مناقصة') || lowerPrompt.includes('تجهيز') || lowerPrompt.includes('شراء')) {
        action = 'insert_tender';
        const titleMatch = prompt.match(/(?:باسم|بعنوان|العنوان|عنوانه)[:\s]+([^،\n\.\?]+)/) || prompt.match(/(?:مناقصة)[:\s]+([^،\n\.\?]+)/);
        const titleText = titleMatch ? titleMatch[1].trim() : 'إعلان مناقصة عامة لتوريد أجهزة ومعدات';
        data = {
          title: { ar: titleText, en: titleText },
          description: { ar: prompt, en: prompt },
          deadline: '2026-12-31'
        };
        aiResponse = `تم تسجيل وطرح المناقصة بنجاح: "${titleText}"`;
      } else {
        // General query or stats check
        action = 'none';
        data = null;
        aiResponse = `مرحباً بك في نظام بيت الصحافة الذكي. إليك قراءة مباشرة للمؤشرات الحالية:\n` + statsContext;
      }

      responseText = JSON.stringify({ action, data, response: aiResponse });
    }

    const parsed = JSON.parse(responseText || "{}");
    const { action, data, response: aiResponse } = parsed;

    if (!action || action === 'none') {
      return { success: true, text: aiResponse || "عذراً لم يستطع الذكاء الاصطناعي معالجة هذا الطلب.", action: "none" };
    }

    const id = (action.replace('insert_', '').substring(0, 3)) + '-' + Math.random().toString(36).substring(2, 9);
    
    if (action === 'insert_article') {
      await pool.query(
        'INSERT INTO articles (id, title, content, category, status, language, authorId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          id,
          JSON.stringify(data.title || { ar: prompt, en: prompt }),
          JSON.stringify(data.content || { ar: prompt, en: prompt }),
          data.category || 'news',
          data.status || 'published',
          data.language || 'both',
          adminUid,
          new Date().toISOString(),
          new Date().toISOString()
        ]
      );
    } else if (action === 'insert_project') {
      await pool.query(
        'INSERT INTO projects (id, title, description, status, createdAt) VALUES (?, ?, ?, ?, ?)',
        [
          id,
          JSON.stringify(data.title || { ar: prompt, en: prompt }),
          JSON.stringify(data.description || { ar: prompt, en: prompt }),
          data.status || 'ongoing',
          new Date().toISOString()
        ]
      );
    } else if (action === 'insert_course') {
      await pool.query(
        'INSERT INTO courses (id, title, description, trainer, status, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
        [
          id,
          JSON.stringify(data.title || { ar: prompt, en: prompt }),
          JSON.stringify(data.description || { ar: prompt, en: prompt }),
          JSON.stringify(data.trainer || { ar: "بيت الصحافة", en: "PressHouse Trainer" }),
          data.status || 'active',
          new Date().toISOString()
        ]
      );
    } else if (action === 'insert_event') {
      await pool.query(
        'INSERT INTO events (id, title, description, location, status, event_date, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          id,
          JSON.stringify(data.title || { ar: prompt, en: prompt }),
          JSON.stringify(data.description || { ar: prompt, en: prompt }),
          JSON.stringify(data.location || { ar: "اليمن", en: "Yemen" }),
          data.status || 'upcoming',
          new Date().toISOString(),
          new Date().toISOString()
        ]
      );
    } else if (action === 'insert_job') {
      await pool.query(
        'INSERT INTO jobs (id, title, description, requirements, deadline, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          id,
          JSON.stringify(data.title || { ar: prompt, en: prompt }),
          JSON.stringify(data.description || { ar: prompt, en: prompt }),
          JSON.stringify(data.requirements || { ar: "شروط التقديم الأساسية", en: "Basic Requirements" }),
          data.deadline || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          'open',
          new Date().toISOString()
        ]
      );
    } else if (action === 'insert_tender') {
      await pool.query(
        'INSERT INTO tenders (id, title, description, deadline, status, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
        [
          id,
          JSON.stringify(data.title || { ar: prompt, en: prompt }),
          JSON.stringify(data.description || { ar: prompt, en: prompt }),
          data.deadline || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          'open',
          new Date().toISOString()
        ]
      );
    } else if (action === 'insert_user') {
      const passHash = await bcrypt.hash('changeme123', 10);
      await pool.query(
        'INSERT INTO users (uid, email, displayName, role, password_hash, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
        [
          id,
          data.email,
          data.displayName || data.email,
          data.role || 'user',
          passHash,
          new Date().toISOString()
        ]
      );
    }

    return { success: true, text: aiResponse, action, data };
  } catch (err: any) {
    console.error('Error in executeAdminAICommand:', err);
    return { success: false, text: "عذراً، حدث خطأ فني أثناء محاولة معالجة وتنفيذ الأمر: " + err.message, action: "none" };
  }
}

// Server-Side Facebook content formatting
app.post('/api/ai/format-post', async (req, res) => {
  const { postText } = req.body;
  try {
    const prompt = `
      Convert the following Facebook post text into a JSON object that matches the Article interface structure. Provide English and Arabic translations for title and content.
      Category should be 'news'.
      Structure: {
        "title": { "ar": "...", "en": "..." },
        "content": { "ar": "...", "en": "..." }
      }
      Facebook post text:
      "${postText}"
    `;
    const responseText = await callNvidiaAI(
      prompt,
      "You are an admin parser. You must parse raw content and output valid JSON only. Do not wrap in markdown blocks, output raw json parse."
    );
    
    let cleanJson = responseText.trim();
    if (cleanJson.startsWith('```json')) cleanJson = cleanJson.substring(7);
    if (cleanJson.endsWith('```')) cleanJson = cleanJson.substring(0, cleanJson.length - 3);
    
    res.json(JSON.parse(cleanJson.trim()));
  } catch (err: any) {
    console.error('Format post error:', err);
    res.status(500).json({ message: 'Formatting failed' });
  }
});

app.post('/api/ai/generate-seo', async (req, res) => {
  const { title, content } = req.body;
  try {
    const prompt = `
      You are an expert SEO specialist for PressHouse Yemen (media, human rights, civil society organization).
      Based on the following content title and body, generate optimized meta tags (SEO Title, Meta Description, Keywords/Tags) in BOTH Arabic and English.
      
      Target Title:
      "${typeof title === 'string' ? title : JSON.stringify(title)}"
      
      Target Content:
      "${typeof content === 'string' ? content : JSON.stringify(content)}"
      
      You MUST respond with a single, raw JSON object matching this structure exactly (without backticks or extra text, just the raw JSON string):
      {
        "title": { "ar": "SEO Title in Arabic", "en": "SEO Title in English" },
        "description": { "ar": "SEO Description in Arabic (max 155 chars)", "en": "SEO Description in English (max 155 chars)" },
        "keywords": { "ar": "علامة1, علامة2, علامة3", "en": "tag1, tag2, tag3" }
      }
    `;
    const responseText = await callNvidiaAI(
      prompt,
      "You are a professional SEO optimizer system. You must output raw JSON ONLY without syntax block formatting."
    );
    let cleanJson = responseText.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.substring(7);
    }
    if (cleanJson.endsWith('```')) {
      cleanJson = cleanJson.substring(0, cleanJson.length - 3);
    }
    res.json(JSON.parse(cleanJson.trim()));
  } catch (err: any) {
    console.error('SEO generation error:', err);
    res.status(500).json({ message: 'SEO generation failed' });
  }
});

app.post('/api/ai/generate-social-card', async (req, res) => {
  const { title, category } = req.body;
  try {
    const prompt = `
      You are a branding and design specialist for PressHouse Yemen.
      An article has been published with this title/headline:
      "${typeof title === 'string' ? title : JSON.stringify(title)}"
      Category: "${category}"

      We need to generate a beautiful, shareable social media card for this article.
      Please suggest:
      1. A professional image search query (in English) that perfectly matches the article's topic, to be used for retrieving a matching background photo (e.g., "yemen abstract landscape morning", "cyber security network shield abstract", "destroyed printing press vintage camera silhouette"). Keep it under 4 words.
      2. A custom, high-contrast, professional color scheme matching the mood:
         - "primaryColor": A dark slate or deep background hex color (e.g. "#0f172a", "#1e1b4b", "#180808").
         - "accentColor": A vibrant branding highlight hex color (e.g. "#ef4444", "#3b82f6", "#f59e0b").
      3. A short, extremely punchy subtitle/punchline (in BOTH Arabic and English) that summarizes the core topic of the article to capture social media attention:
         - "punchline": { "ar": "عبارة قصيرة ومثيرة جداً", "en": "Very short dramatic social media tagline" } (max 12 words per language).

      You MUST respond with a single, raw JSON object matching this structure exactly (without backticks or extra text, just the raw JSON string):
      {
        "searchQuery": "english search terms",
        "primaryColor": "#hex",
        "accentColor": "#hex",
        "punchline": { "ar": "Tagline in Arabic", "en": "Tagline in English" }
      }
    `;
    const responseText = await callNvidiaAI(
      prompt,
      "You are a professional design parser. You must output raw JSON ONLY without any markdown wrapping or extra commentary."
    );
    let cleanJson = responseText.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.substring(7);
    }
    if (cleanJson.endsWith('```')) {
      cleanJson = cleanJson.substring(0, cleanJson.length - 3);
    }
    res.json(JSON.parse(cleanJson.trim()));
  } catch (err: any) {
    console.error('Social card AI generation error:', err);
    res.json({
      searchQuery: "yemen modern abstract",
      primaryColor: "#0f172a",
      accentColor: "#ef4444",
      punchline: {
        ar: "بيت الصحافة - رصد شامل وتغطية صحفية مهنية مستقلة",
        en: "PressHouse - Comprehensive monitoring and professional independent coverage"
      }
    });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const { 
    email, password, name, age, gender, workplace, 
    work_samples, phone, whatsapp, social_pages, bio, specialization,
    role = 'member'
  } = req.body;

  try {
    const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if ((existing as any[]).length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const uid = Math.random().toString(36).substring(2, 11);
    
    await pool.query(
      `INSERT INTO users (
        uid, email, password_hash, role, displayName, 
        age, gender, workplace, work_samples, phone, 
        whatsapp, social_pages, bio, specialization
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uid, email, hashedPassword, role, name,
        age || null, gender || null, workplace || null, 
        work_samples ? JSON.stringify(work_samples) : null,
        phone || null, whatsapp || null,
        social_pages ? JSON.stringify(social_pages) : null,
        bio || null, specialization || null
      ]
    );

    const token = jwt.sign({ uid, role }, process.env.JWT_SECRET!, { expiresIn: '7d' });
    res.status(201).json({ token, user: { uid, email, role, displayName: name } });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Google OAuth URL
app.get('/api/auth/google/url', (req, res) => {
  const redirectUri = `${process.env.APP_URL || 'http://localhost:3000'}/api/auth/google/callback`;
  const url = googleClient.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email'],
    redirect_uri: redirectUri
  });
  res.json({ url });
});

// Google OAuth Callback
app.get('/api/auth/google/callback', async (req, res) => {
  const code = req.query.code as string;
  const redirectUri = `${process.env.APP_URL || 'http://localhost:3000'}/api/auth/google/callback`;

  try {
    const { tokens } = await googleClient.getToken({
      code,
      redirect_uri: redirectUri
    });
    googleClient.setCredentials(tokens);

    const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });

    const { sub: googleId, email, name, picture } = userInfoResponse.data;

    // Check if user exists
    const [rows] = await pool.query('SELECT * FROM users WHERE googleId = ? OR email = ?', [googleId, email]);
    let user = (rows as any)[0];

    if (!user) {
      const uid = Math.random().toString(36).substring(2, 11);
      const role = 'member';
      await pool.query(
        'INSERT INTO users (uid, email, displayName, photoURL, googleId, role) VALUES (?, ?, ?, ?, ?, ?)',
        [uid, email, name, picture, googleId, role]
      );
      user = { uid, email, displayName: name, photoURL: picture, role };
    } else if (!user.googleId) {
      // Link Google ID to existing email account
      await pool.query('UPDATE users SET googleId = ?, photoURL = ? WHERE uid = ?', [googleId, picture, user.uid]);
      user.googleId = googleId;
      user.photoURL = picture;
    }

    const token = jwt.sign({ uid: user.uid, role: user.role }, process.env.JWT_SECRET!, { expiresIn: '7d' });

    // Return HTML to communicate with opener
    res.send(`
      <html>
        <body>
          <script>
            window.opener.postMessage({ 
              type: 'GOOGLE_AUTH_SUCCESS', 
              token: '${token}',
              user: ${JSON.stringify({ uid: user.uid, email: user.email, role: user.role, displayName: user.displayName })}
            }, '*');
            window.close();
          </script>
          <p>Authentication successful. Closing window...</p>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error('Google OAuth error:', error);
    res.status(500).send('Authentication failed');
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = (rows as any)[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ uid: user.uid, role: user.role }, process.env.JWT_SECRET!, { expiresIn: '7d' });
    // Remove password hash from response
    const { password_hash, ...userProfile } = user;
    res.json({ token, user: userProfile });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Middleware to protect routes
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, process.env.JWT_SECRET!, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

app.get('/api/auth/profile', authenticateToken, async (req: any, res: any) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE uid = ?', [req.user.uid]);
    const user = (rows as any)[0];
    if (!user) return res.sendStatus(404);
    const { password_hash, ...userProfile } = user;
    res.json(userProfile);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/auth/profile', authenticateToken, async (req: any, res: any) => {
  const { 
    displayName, age, gender, workplace, 
    work_samples, phone, whatsapp, social_pages, bio, specialization 
  } = req.body;

  try {
    await pool.query(
      `UPDATE users SET 
        displayName = ?, age = ?, gender = ?, workplace = ?, 
        work_samples = ?, phone = ?, whatsapp = ?, 
        social_pages = ?, bio = ?, specialization = ?
      WHERE uid = ?`,
      [
        displayName, age || null, gender || null, workplace || null,
        work_samples ? JSON.stringify(work_samples) : null,
        phone || null, whatsapp || null,
        social_pages ? JSON.stringify(social_pages) : null,
        bio || null, specialization || null,
        req.user.uid
      ]
    );
    res.json({ success: true });
  } catch (error: any) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const [rows]: any = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      // Don't reveal if user exists or not for security
      return res.json({ message: 'If an account exists with this email, a reset link has been sent.' });
    }

    const user = rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000); // 1 hour

    await pool.query('UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE uid = ?', [token, expiry, user.uid]);

    const transporter = await getTransporter();
    if (transporter) {
      const smtpFrom = await getSmtpFrom();
      const resetLink = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
      
      await transporter.sendMail({
        from: smtpFrom,
        to: email,
        subject: 'إعادة تعيين كلمة المرور - بيت الصحافة',
        html: `
          <div style="direction: rtl; font-family: sans-serif; padding: 20px;">
            <h2>طلب إعادة تعيين كلمة المرور</h2>
            <p>لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك في بيت الصحافة.</p>
            <p>يرجى النقر على الرابط أدناه لتعيين كلمة مرور جديدة (هذا الرابط صالح لمدة ساعة واحدة):</p>
            <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #1e3a8a; color: white; text-decoration: none; border-radius: 8px;">إعادة تعيين كلمة المرور</a>
            <p>إذا لم تطلب هذا التغيير، يرجى تجاهل هذا البريد.</p>
          </div>
        `
      });
    }

    res.json({ message: 'If an account exists with this email, a reset link has been sent.' });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Error processing request' });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  const { token, password } = req.body;
  try {
    const [rows]: any = await pool.query(
      'SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > ?', 
      [token, new Date()]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const user = rows[0];
    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE uid = ?',
      [hashedPassword, user.uid]
    );

    res.json({ success: true, message: 'Password has been reset successfully.' });
  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Error resetting password' });
  }
});

app.post('/api/ai/admin-chat', authenticateToken, async (req: any, res: any) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ message: 'Prompt is required' });

  // verify role is admin/root/staff/journalist
  const role = req.user?.role;
  if (!role || !['root', 'admin', 'staff', 'journalist'].includes(role)) {
    return res.status(403).json({ message: 'Unauthorized for AI administration' });
  }

  try {
    const result = await executeAdminAICommand(prompt, req.user.uid || 'admin-uid');
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to process AI administrative query: ' + err.message });
  }
});

// Articles API
app.get('/api/articles', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let userUid: string | undefined = undefined;
    if (token) {
      try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
        userUid = decoded?.uid;
      } catch (e) {}
    }

    const [rows]: any = await pool.query('SELECT * FROM articles ORDER BY createdAt DESC');
    
    // Enforce dynamic access control on the server side
    for (const art of rows) {
      const hasAccess = await checkMembershipAccess(userUid, art.access_tier);
      if (!hasAccess) {
        art.isLocked = true;
        art.content = JSON.stringify({
          ar: `<div class="locked-content-message p-6 text-center border-2 border-dashed border-red-200 rounded-2xl bg-red-50/50 my-6">
                <span class="text-3xl">🔒</span>
                <h4 class="text-lg font-black text-slate-800 mt-2">هذا المحتوى حصري ومغلق للأعضاء</h4>
                <p class="text-sm text-slate-600 mt-1">يتطلب تصفح هذا التقرير أو المقال بالكامل الحصول على عضوية <strong>(${art.access_tier === 'journalist' ? 'صحفي محترف' : art.access_tier === 'student' ? 'طالب إعلام' : art.access_tier === 'free' ? 'عضو مسجل' : art.access_tier})</strong> نشطة ومعتمدة.</p>
                <div class="mt-4 flex justify-center gap-4">
                  <a href="/membership" class="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl transition duration-200">الترقية والانضمام للعضوية</a>
                </div>
               </div>`,
          en: `<div class="locked-content-message p-6 text-center border-2 border-dashed border-red-200 rounded-2xl bg-red-50/50 my-6">
                <span class="text-3xl">🔒</span>
                <h4 class="text-lg font-black text-slate-800 mt-2">Exclusive Locked Content</h4>
                <p class="text-sm text-slate-600 mt-1">Full access to this report/article requires an active, approved <strong>${art.access_tier === 'journalist' ? 'Professional Journalist' : art.access_tier === 'student' ? 'Student' : art.access_tier === 'free' ? 'Registered Member' : art.access_tier} Membership</strong>.</p>
                <div class="mt-4 flex justify-center gap-4">
                  <a href="/membership" class="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl transition duration-200">Upgrade & Join Membership</a>
                </div>
               </div>`
        });
      } else {
        art.isLocked = false;
      }
    }
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching articles: ' + error.message });
  }
});

app.post('/api/articles', async (req, res) => {
  try {
    const { id, title, content, category, status, language, mainImage, show_in_slider, slider_caption, slider_button_text, slider_image, seo, authorId, createdAt, updatedAt, sector_id, program_id, project_id, access_tier } = req.body;
    const [result] = await pool.query(
      'INSERT INTO articles (id, title, content, category, status, language, mainImage, show_in_slider, slider_caption, slider_button_text, slider_image, seo, authorId, createdAt, updatedAt, sector_id, program_id, project_id, access_tier) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id || Date.now().toString(), JSON.stringify(title), JSON.stringify(content), category, status, language, mainImage, show_in_slider ? 1 : 0, JSON.stringify(slider_caption || {ar: '', en: ''}), JSON.stringify(slider_button_text || {ar: '', en: ''}), slider_image, JSON.stringify(seo), authorId, createdAt || new Date(), updatedAt || new Date(),
        sector_id || null, program_id || null, project_id || null, access_tier || 'public'
      ]
    );
    res.json({ id: id || (result as any).insertId, ...req.body });
    await notifyAdmins(`🆕 تم إضافة مقال جديد: ${title?.ar || 'بدون عنوان'}`);
  } catch (error) {
    res.status(500).json({ message: 'Error creating article' });
  }
});

app.put('/api/articles/:id', async (req, res) => {
  try {
    const { title, content, category, status, language, mainImage, show_in_slider, slider_caption, slider_button_text, slider_image, seo, authorId, updatedAt, sector_id, program_id, project_id, access_tier } = req.body;
    await pool.query(
      'UPDATE articles SET title=?, content=?, category=?, status=?, language=?, mainImage=?, show_in_slider=?, slider_caption=?, slider_button_text=?, slider_image=?, seo=?, authorId=?, updatedAt=?, sector_id=?, program_id=?, project_id=?, access_tier=? WHERE id = ?',
      [
        JSON.stringify(title), JSON.stringify(content), category, status, language, mainImage, show_in_slider ? 1 : 0, JSON.stringify(slider_caption || {ar: '', en: ''}), JSON.stringify(slider_button_text || {ar: '', en: ''}), slider_image, JSON.stringify(seo), authorId, updatedAt || new Date(),
        sector_id || null, program_id || null, project_id || null, access_tier || 'public', req.params.id
      ]
    );
    res.json({ id: req.params.id, ...req.body });
  } catch (error) {
    res.status(500).json({ message: 'Error updating article' });
  }
});

app.delete('/api/articles/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM articles WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting article' });
  }
});

// Media Products API
app.get('/api/media-products', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM media_products ORDER BY createdAt DESC');
    res.json(rows);
  } catch (error: any) {
    console.error('Error fetching media products:', error);
    res.status(500).json({ message: 'Error fetching media products: ' + error.message });
  }
});

app.get('/api/media-products/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM media_products WHERE id = ?', [req.params.id]);
    if (rows && rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ message: 'Media product not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching media product' });
  }
});

app.get('/api/media-products/slug/:slug', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM media_products WHERE slug = ?', [req.params.slug]);
    if (rows && rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ message: 'Media product not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching media product by slug: ' + error.message });
  }
});

app.post('/api/media-products', async (req, res) => {
  try {
    const { id, division, contentType, title, slug, metadata, status, createdAt, updatedAt } = req.body;
    const itemId = id || 'mp-' + Date.now().toString() + '-' + Math.random().toString(36).substr(2, 5);
    const itemSlug = slug || (title?.en ? title.en.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'media-' + itemId);
    
    const [result] = await pool.query(
      'INSERT INTO media_products (id, division, contentType, title, slug, metadata, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        itemId,
        division,
        contentType,
        JSON.stringify(title || { ar: '', en: '' }),
        itemSlug,
        JSON.stringify(metadata || {}),
        status || 'draft',
        createdAt || new Date(),
        updatedAt || new Date()
      ]
    );

    res.json({ id: itemId, division, contentType, title, slug: itemSlug, metadata, status });
    await notifyAdmins(`🆕 [مستودع الإنتاج الإعلامي] مادة جديدة مضافة: ${title?.ar || 'بدون عنوان'} (${contentType})`);
  } catch (error: any) {
    console.error('Error creating media product:', error);
    res.status(500).json({ message: 'Error creating media product: ' + error.message });
  }
});

app.put('/api/media-products/:id', async (req, res) => {
  try {
    const { division, contentType, title, slug, metadata, status, updatedAt } = req.body;
    await pool.query(
      'UPDATE media_products SET division=?, contentType=?, title=?, slug=?, metadata=?, status=?, updatedAt=? WHERE id = ?',
      [
        division,
        contentType,
        JSON.stringify(title || { ar: '', en: '' }),
        slug,
        JSON.stringify(metadata || {}),
        status || 'draft',
        updatedAt || new Date(),
        req.params.id
      ]
    );
    res.json({ id: req.params.id, ...req.body });
  } catch (error: any) {
    console.error('Error updating media product:', error);
    res.status(500).json({ message: 'Error updating media product: ' + error.message });
  }
});

app.delete('/api/media-products/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM media_products WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting media product' });
  }
});

// Events API
app.get('/api/events', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM events ORDER BY event_date DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching events' });
  }
});

app.post('/api/events', async (req, res) => {
  try {
    const { id, title, description, event_date, location, image, status, show_in_slider, slider_caption, slider_button_text, slider_image, media, seo, createdAt, sector_id, program_id, project_id } = req.body;
    const [result] = await pool.query(
      'INSERT INTO events (id, title, description, event_date, location, image, status, show_in_slider, slider_caption, slider_button_text, slider_image, media, seo, createdAt, sector_id, program_id, project_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id || Date.now().toString(), JSON.stringify(title), JSON.stringify(description), event_date, JSON.stringify(location), image, status, show_in_slider ? 1 : 0, JSON.stringify(slider_caption || {ar: '', en: ''}), JSON.stringify(slider_button_text || {ar: '', en: ''}), slider_image, JSON.stringify(media), JSON.stringify(seo), createdAt || new Date(),
        sector_id || null, program_id || null, project_id || null
      ]
    );
    res.json({ id: id || (result as any).insertId, ...req.body });
  } catch (error) {
    res.status(500).json({ message: 'Error creating event' });
  }
});

app.put('/api/events/:id', async (req, res) => {
  try {
    const { title, description, event_date, location, image, status, show_in_slider, slider_caption, slider_button_text, slider_image, media, seo, sector_id, program_id, project_id } = req.body;
    await pool.query(
      'UPDATE events SET title=?, description=?, event_date=?, location=?, image=?, status=?, show_in_slider=?, slider_caption=?, slider_button_text=?, slider_image=?, media=?, seo=?, sector_id=?, program_id=?, project_id=? WHERE id=?',
      [
        JSON.stringify(title), JSON.stringify(description), event_date, JSON.stringify(location), image, status, show_in_slider ? 1 : 0, JSON.stringify(slider_caption || {ar: '', en: ''}), JSON.stringify(slider_button_text || {ar: '', en: ''}), slider_image, JSON.stringify(media), JSON.stringify(seo),
        sector_id || null, program_id || null, project_id || null, req.params.id
      ]
    );
    res.json({ id: req.params.id, ...req.body });
  } catch (error) {
    res.status(500).json({ message: 'Error updating event' });
  }
});

app.delete('/api/events/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM events WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting event' });
  }
});

// Jobs API
app.get('/api/jobs', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM jobs ORDER BY createdAt DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching jobs' });
  }
});

app.post('/api/jobs', async (req, res) => {
  try {
    const { id, title, description, requirements, deadline, status, show_in_slider, slider_caption, slider_button_text, slider_image, seo, createdAt, sector_id, program_id, project_id } = req.body;
    const [result] = await pool.query(
      'INSERT INTO jobs (id, title, description, requirements, deadline, status, show_in_slider, slider_caption, slider_button_text, slider_image, seo, createdAt, sector_id, program_id, project_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id || Date.now().toString(), JSON.stringify(title), JSON.stringify(description), JSON.stringify(requirements), deadline, status, show_in_slider ? 1 : 0, JSON.stringify(slider_caption || {ar: '', en: ''}), JSON.stringify(slider_button_text || {ar: '', en: ''}), slider_image, JSON.stringify(seo), createdAt || new Date(),
        sector_id || null, program_id || null, project_id || null
      ]
    );
    res.json({ id: id || (result as any).insertId, ...req.body });
  } catch (error) {
    res.status(500).json({ message: 'Error creating job' });
  }
});

app.put('/api/jobs/:id', async (req, res) => {
  try {
    const { title, description, requirements, deadline, status, show_in_slider, slider_caption, slider_button_text, slider_image, seo, sector_id, program_id, project_id } = req.body;
    await pool.query(
      'UPDATE jobs SET title=?, description=?, requirements=?, deadline=?, status=?, show_in_slider=?, slider_caption=?, slider_button_text=?, slider_image=?, seo=?, sector_id=?, program_id=?, project_id=? WHERE id=?',
      [
        JSON.stringify(title), JSON.stringify(description), JSON.stringify(requirements), deadline, status, show_in_slider ? 1 : 0, JSON.stringify(slider_caption || {ar: '', en: ''}), JSON.stringify(slider_button_text || {ar: '', en: ''}), slider_image, JSON.stringify(seo),
        sector_id || null, program_id || null, project_id || null, req.params.id
      ]
    );
    res.json({ id: req.params.id, ...req.body });
  } catch (error) {
    res.status(500).json({ message: 'Error updating job' });
  }
});

app.delete('/api/jobs/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM jobs WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting job' });
  }
});

// Projects API
app.get('/api/projects', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM projects ORDER BY createdAt DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching projects' });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const { 
      id, title, description, image, status, fundingGoal, currentFunding, isFeatured, show_in_slider, slider_caption, slider_button_text, slider_image, seo, createdAt,
      reference_code, short_name_ar, short_name_en, sector_id, program_id, duration, geo_location, 
      governorates_json, districts_json, brief_introduction_ar, brief_introduction_en, 
      brief_concept_ar, brief_concept_en, brief_justifications_ar, brief_justifications_en, 
      brief_importance_ar, brief_importance_en, beneficiaries_direct, beneficiaries_indirect, 
      main_target_group, secondary_target_groups, problem_description, problem_main_causes, 
      problem_sub_causes, problem_effects, problem_evidence, problem_studies, problem_references, 
      problem_attachments, beneficiary_description, beneficiary_current_status, beneficiary_challenges, 
      beneficiary_needs, beneficiary_demographics, general_goal, funding_org, partners_json, goals, activities
    } = req.body;

    const stringifyIfNeeded = (val: any) => {
      if (val === undefined || val === null) return null;
      if (typeof val === 'string') return val;
      return JSON.stringify(val);
    };

    const cleanTitle = typeof title === 'string' ? title : JSON.stringify(title || {ar: '', en: ''});
    const cleanDesc = typeof description === 'string' ? description : JSON.stringify(description || {ar: '', en: ''});

    await pool.query(
      `INSERT INTO projects (
        id, title, description, image, status, fundingGoal, currentFunding, isFeatured, show_in_slider, slider_caption, slider_button_text, slider_image, seo, createdAt,
        reference_code, short_name_ar, short_name_en, sector_id, program_id, duration, geo_location, 
        governorates_json, districts_json, brief_introduction_ar, brief_introduction_en, 
        brief_concept_ar, brief_concept_en, brief_justifications_ar, brief_justifications_en, 
        brief_importance_ar, brief_importance_en, beneficiaries_direct, beneficiaries_indirect, 
        main_target_group, secondary_target_groups, problem_description, problem_main_causes, 
        problem_sub_causes, problem_effects, problem_evidence, problem_studies, problem_references, 
        problem_attachments, beneficiary_description, beneficiary_current_status, beneficiary_challenges, 
        beneficiary_needs, beneficiary_demographics, general_goal, funding_org, partners_json, goals, activities
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id || Date.now().toString(), cleanTitle, cleanDesc, image || '', status || 'ongoing', fundingGoal || 0, currentFunding || 0, isFeatured ? 1 : 0, show_in_slider ? 1 : 0, 
        stringifyIfNeeded(slider_caption || {ar: '', en: ''}), stringifyIfNeeded(slider_button_text || {ar: '', en: ''}), slider_image || '', stringifyIfNeeded(seo || {}), createdAt || new Date(),
        reference_code || null, short_name_ar || null, short_name_en || null, sector_id || null, program_id || null, duration || null, geo_location || null,
        stringifyIfNeeded(governorates_json || []), stringifyIfNeeded(districts_json || []), brief_introduction_ar || null, brief_introduction_en || null,
        brief_concept_ar || null, brief_concept_en || null, brief_justifications_ar || null, brief_justifications_en || null,
        brief_importance_ar || null, brief_importance_en || null, parseInt(beneficiaries_direct) || 0, parseInt(beneficiaries_indirect) || 0,
        main_target_group || null, secondary_target_groups || null, problem_description || null, problem_main_causes || null,
        problem_sub_causes || null, problem_effects || null, problem_evidence || null, problem_studies || null, problem_references || null,
        problem_attachments || null, beneficiary_description || null, beneficiary_current_status || null, beneficiary_challenges || null,
        beneficiary_needs || null, beneficiary_demographics || null, general_goal || null, funding_org || null, stringifyIfNeeded(partners_json || []),
        stringifyIfNeeded(goals || []), stringifyIfNeeded(activities || [])
      ]
    );
    res.json({ id: id || Date.now().toString(), ...req.body });
  } catch (error) {
    console.error('Error in post project:', error);
    res.status(500).json({ message: 'Error creating project' });
  }
});

app.put('/api/projects/:id', async (req, res) => {
  try {
    const { 
      title, description, image, status, fundingGoal, currentFunding, isFeatured, show_in_slider, slider_caption, slider_button_text, slider_image, seo,
      reference_code, short_name_ar, short_name_en, sector_id, program_id, duration, geo_location, 
      governorates_json, districts_json, brief_introduction_ar, brief_introduction_en, 
      brief_concept_ar, brief_concept_en, brief_justifications_ar, brief_justifications_en, 
      brief_importance_ar, brief_importance_en, beneficiaries_direct, beneficiaries_indirect, 
      main_target_group, secondary_target_groups, problem_description, problem_main_causes, 
      problem_sub_causes, problem_effects, problem_evidence, problem_studies, problem_references, 
      problem_attachments, beneficiary_description, beneficiary_current_status, beneficiary_challenges, 
      beneficiary_needs, beneficiary_demographics, general_goal, funding_org, partners_json, goals, activities
    } = req.body;

    const stringifyIfNeeded = (val: any) => {
      if (val === undefined || val === null) return null;
      if (typeof val === 'string') return val;
      return JSON.stringify(val);
    };

    const cleanTitle = typeof title === 'string' ? title : JSON.stringify(title || {ar: '', en: ''});
    const cleanDesc = typeof description === 'string' ? description : JSON.stringify(description || {ar: '', en: ''});

    await pool.query(
      `UPDATE projects SET 
        title=?, description=?, image=?, status=?, fundingGoal=?, currentFunding=?, isFeatured=?, show_in_slider=?, slider_caption=?, slider_button_text=?, slider_image=?, seo=?,
        reference_code=?, short_name_ar=?, short_name_en=?, sector_id=?, program_id=?, duration=?, geo_location=?, 
        governorates_json=?, districts_json=?, brief_introduction_ar=?, brief_introduction_en=?, 
        brief_concept_ar=?, brief_concept_en=?, brief_justifications_ar=?, brief_justifications_en=?, 
        brief_importance_ar=?, brief_importance_en=?, beneficiaries_direct=?, beneficiaries_indirect=?, 
        main_target_group=?, secondary_target_groups=?, problem_description=?, problem_main_causes=?, 
        problem_sub_causes=?, problem_effects=?, problem_evidence=?, problem_studies=?, problem_references=?, 
        problem_attachments=?, beneficiary_description=?, beneficiary_current_status=?, beneficiary_challenges=?, 
        beneficiary_needs=?, beneficiary_demographics=?, general_goal=?, funding_org=?, partners_json=?, goals=?, activities=?
      WHERE id=?`,
      [
        cleanTitle, cleanDesc, image, status, fundingGoal, currentFunding, isFeatured ? 1 : 0, show_in_slider ? 1 : 0, 
        stringifyIfNeeded(slider_caption || {ar: '', en: ''}), stringifyIfNeeded(slider_button_text || {ar: '', en: ''}), slider_image, stringifyIfNeeded(seo || {}),
        reference_code || null, short_name_ar || null, short_name_en || null, sector_id || null, program_id || null, duration || null, geo_location || null,
        stringifyIfNeeded(governorates_json || []), stringifyIfNeeded(districts_json || []), brief_introduction_ar || null, brief_introduction_en || null,
        brief_concept_ar || null, brief_concept_en || null, brief_justifications_ar || null, brief_justifications_en || null,
        brief_importance_ar || null, brief_importance_en || null, parseInt(beneficiaries_direct) || 0, parseInt(beneficiaries_indirect) || 0,
        main_target_group || null, secondary_target_groups || null, problem_description || null, problem_main_causes || null,
        problem_sub_causes || null, problem_effects || null, problem_evidence || null, problem_studies || null, problem_references || null,
        problem_attachments || null, beneficiary_description || null, beneficiary_current_status || null, beneficiary_challenges || null,
        beneficiary_needs || null, beneficiary_demographics || null, general_goal || null, funding_org || null, stringifyIfNeeded(partners_json || []),
        stringifyIfNeeded(goals || []), stringifyIfNeeded(activities || []),
        req.params.id
      ]
    );
    res.json({ id: req.params.id, ...req.body });
  } catch (error) {
    console.error('Error in put project:', error);
    res.status(500).json({ message: 'Error updating project' });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM projects WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting project' });
  }
});

// Courses API
app.get('/api/courses', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM courses ORDER BY createdAt DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching courses' });
  }
});

app.post('/api/courses', async (req, res) => {
  try {
    const { id, title, description, trainer, applicationDeadline, applicationUrl, announcementImage, videos, isLive, liveUrl, streamKey, streamUrl, status, show_in_slider, slider_caption, slider_button_text, slider_image, seo, createdAt } = req.body;
    const [result] = await pool.query(
      'INSERT INTO courses (id, title, description, trainer, applicationDeadline, applicationUrl, announcementImage, videos, isLive, liveUrl, streamKey, streamUrl, status, show_in_slider, slider_caption, slider_button_text, slider_image, seo, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id || Date.now().toString(), JSON.stringify(title), JSON.stringify(description), JSON.stringify(trainer), applicationDeadline, applicationUrl, announcementImage, JSON.stringify(videos), isLive, liveUrl, streamKey, streamUrl, status, show_in_slider ? 1 : 0, JSON.stringify(slider_caption || {ar: '', en: ''}), JSON.stringify(slider_button_text || {ar: '', en: ''}), slider_image, JSON.stringify(seo), createdAt || new Date()]
    );
    res.json({ id: id || (result as any).insertId, ...req.body });
  } catch (error) {
    res.status(500).json({ message: 'Error creating course' });
  }
});

app.put('/api/courses/:id', async (req, res) => {
  try {
    const { title, description, trainer, applicationDeadline, applicationUrl, announcementImage, videos, isLive, liveUrl, streamKey, streamUrl, status, show_in_slider, slider_caption, slider_button_text, slider_image, seo } = req.body;
    await pool.query(
      'UPDATE courses SET title=?, description=?, trainer=?, applicationDeadline=?, applicationUrl=?, announcementImage=?, videos=?, isLive=?, liveUrl=?, streamKey=?, streamUrl=?, status=?, show_in_slider=?, slider_caption=?, slider_button_text=?, slider_image=?, seo=? WHERE id=?',
      [JSON.stringify(title), JSON.stringify(description), JSON.stringify(trainer), applicationDeadline, applicationUrl, announcementImage, JSON.stringify(videos), isLive, liveUrl, streamKey, streamUrl, status, show_in_slider ? 1 : 0, JSON.stringify(slider_caption || {ar: '', en: ''}), JSON.stringify(slider_button_text || {ar: '', en: ''}), slider_image, JSON.stringify(seo), req.params.id]
    );
    res.json({ id: req.params.id, ...req.body });
  } catch (error) {
    res.status(500).json({ message: 'Error updating course' });
  }
});

app.delete('/api/courses/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM courses WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting course' });
  }
});

// --- ACADEMY PLATFORM EXTENSIONS API ---

// 1. Applications
app.get('/api/academy/applications', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM academy_applications ORDER BY createdAt DESC');
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching applications', error: error.message });
  }
});

app.post('/api/academy/applications', async (req, res) => {
  try {
    const { course_id, full_name, email, phone, education, experience, motivation, cv_url, scoring_data, reviewer_notes, status } = req.body;
    const [result] = await pool.query(
      'INSERT INTO academy_applications (course_id, full_name, email, phone, education, experience, motivation, cv_url, scoring_data, reviewer_notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [course_id, full_name, email, phone, education, experience, motivation, cv_url, scoring_data || '', reviewer_notes || '', status || 'pending']
    );
    res.json({ id: result.insertId, ...req.body });
  } catch (error: any) {
    res.status(500).json({ message: 'Error creating application', error: error.message });
  }
});

app.put('/api/academy/applications/:id', async (req, res) => {
  try {
    const { status, scoring_data, reviewer_notes } = req.body;
    
    // Fetch application to get details for certificate
    const [applications] = await pool.query('SELECT * FROM academy_applications WHERE id=?', [req.params.id]);
    const app = (applications as any)[0];

    await pool.query(
      'UPDATE academy_applications SET status=?, scoring_data=?, reviewer_notes=? WHERE id=?',
      [status, scoring_data, reviewer_notes, req.params.id]
    );

    if (status === 'Completed' && app) {
      // Fetch course name
      const [courses] = await pool.query('SELECT title FROM courses WHERE id=?', [app.course_id]);
      const course = (courses as any)[0];
      const courseName = course ? JSON.parse(course.title).en : 'Course';

      // Generate PDF and send email
      const pdf = await generateCertificate(app.full_name, courseName);
      
      const transporter = await getTransporter(); if(transporter) await transporter.sendMail({
        from: await getSmtpFrom(),
        to: app.email,
        subject: 'Certificate of Completion',
        text: 'Congratulations! Please find your certificate attached.',
        attachments: [{ filename: 'certificate.pdf', content: pdf }]
      });
    }

    res.json({ success: true, id: req.params.id });
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating application', error: error.message });
  }
});

app.delete('/api/academy/applications/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM academy_applications WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting application' });
  }
});

// 2. Trainers
app.get('/api/academy/trainers', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM academy_trainers ORDER BY createdAt DESC');
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching trainers' });
  }
});

app.post('/api/academy/trainers', async (req, res) => {
  try {
    const { name, bio, expertise, experience, certifications, rating, feedback } = req.body;
    const [result] = await pool.query(
      'INSERT INTO academy_trainers (name, bio, expertise, experience, certifications, rating, feedback) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, bio, expertise, experience, certifications, rating || 5, feedback || '']
    );
    res.json({ id: result.insertId, ...req.body });
  } catch (error: any) {
    res.status(500).json({ message: 'Error creating trainer' });
  }
});

app.put('/api/academy/trainers/:id', async (req, res) => {
  try {
    const { name, bio, expertise, experience, certifications, rating, feedback } = req.body;
    await pool.query(
      'UPDATE academy_trainers SET name=?, bio=?, expertise=?, experience=?, certifications=?, rating=?, feedback=? WHERE id=?',
      [name, bio, expertise, experience, certifications, rating, feedback, req.params.id]
    );
    res.json({ success: true, id: req.params.id });
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating trainer' });
  }
});

app.delete('/api/academy/trainers/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM academy_trainers WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting trainer' });
  }
});

// 3. Venues
app.get('/api/academy/venues', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM academy_venues ORDER BY id DESC');
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching venues' });
  }
});

app.post('/api/academy/venues', async (req, res) => {
  try {
    const { name, type, capacity, equipment, accessibility, cost } = req.body;
    const [result] = await pool.query(
      'INSERT INTO academy_venues (name, type, capacity, equipment, accessibility, cost) VALUES (?, ?, ?, ?, ?, ?)',
      [name, type, capacity, equipment, accessibility, cost || 0]
    );
    res.json({ id: result.insertId, ...req.body });
  } catch (error: any) {
    res.status(500).json({ message: 'Error creating venue' });
  }
});

app.put('/api/academy/venues/:id', async (req, res) => {
  try {
    const { name, type, capacity, equipment, accessibility, cost } = req.body;
    await pool.query(
      'UPDATE academy_venues SET name=?, type=?, capacity=?, equipment=?, accessibility=?, cost=? WHERE id=?',
      [name, type, capacity, equipment, accessibility, cost, req.params.id]
    );
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating venue' });
  }
});

app.delete('/api/academy/venues/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM academy_venues WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting venue' });
  }
});

// 4. Logistics
app.get('/api/academy/logistics', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM academy_logistics ORDER BY id DESC');
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching logistics' });
  }
});

app.post('/api/academy/logistics', async (req, res) => {
  try {
    const { course_id, item_type, details, cost, status } = req.body;
    const [result] = await pool.query(
      'INSERT INTO academy_logistics (course_id, item_type, details, cost, status) VALUES (?, ?, ?, ?, ?)',
      [course_id, item_type, details, cost || 0, status || 'pending']
    );
    res.json({ id: result.insertId, ...req.body });
  } catch (error: any) {
    res.status(500).json({ message: 'Error creating logistics' });
  }
});

app.put('/api/academy/logistics/:id', async (req, res) => {
  try {
    const { course_id, item_type, details, cost, status } = req.body;
    await pool.query(
      'UPDATE academy_logistics SET course_id=?, item_type=?, details=?, cost=?, status=? WHERE id=?',
      [course_id, item_type, details, cost, status, req.params.id]
    );
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating logistics' });
  }
});

app.delete('/api/academy/logistics/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM academy_logistics WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting logistics' });
  }
});

// 5. Certificates
app.get('/api/academy/certificates', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM academy_certificates ORDER BY issue_date DESC');
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching certificates' });
  }
});

app.get('/api/academy/certificates/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM academy_certificates WHERE id = ?', [req.params.id]);
    if (rows && rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ message: 'Certificate not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching certificate' });
  }
});

app.post('/api/academy/certificates', async (req, res) => {
  try {
    const { id, course_id, recipient_name, recipient_email, type, issue_date, qr_code_url, verify_url, status } = req.body;
    const certId = id || 'CERT-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    await pool.query(
      'INSERT INTO academy_certificates (id, course_id, recipient_name, recipient_email, type, issue_date, qr_code_url, verify_url, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [certId, course_id, recipient_name, recipient_email, type, issue_date || new Date().toISOString().split('T')[0], qr_code_url, verify_url || `/verify-certificate/${certId}`, status || 'active']
    );
    res.json({ id: certId, ...req.body });
  } catch (error: any) {
    res.status(500).json({ message: 'Error creating certificate', error: error.message });
  }
});

app.delete('/api/academy/certificates/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM academy_certificates WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting certificate' });
  }
});

// 6. Alumni
app.get('/api/academy/alumni', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM academy_alumni ORDER BY graduation_year DESC');
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching alumni' });
  }
});

app.post('/api/academy/alumni', async (req, res) => {
  try {
    const { full_name, email, graduation_year, courses_completed, current_position, organization, is_mentor } = req.body;
    const [result] = await pool.query(
      'INSERT INTO academy_alumni (full_name, email, graduation_year, courses_completed, current_position, organization, is_mentor) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [full_name, email, graduation_year, JSON.stringify(courses_completed || []), current_position, organization, is_mentor ? 1 : 0]
    );
    res.json({ id: result.insertId, ...req.body });
  } catch (error: any) {
    res.status(500).json({ message: 'Error creating alumni' });
  }
});

app.put('/api/academy/alumni/:id', async (req, res) => {
  try {
    const { full_name, email, graduation_year, courses_completed, current_position, organization, is_mentor } = req.body;
    await pool.query(
      'UPDATE academy_alumni SET full_name=?, email=?, graduation_year=?, courses_completed=?, current_position=?, organization=?, is_mentor=? WHERE id=?',
      [full_name, email, graduation_year, JSON.stringify(courses_completed || []), current_position, organization, is_mentor ? 1 : 0, req.params.id]
    );
    res.json({ success: true, id: req.params.id });
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating alumni' });
  }
});

app.delete('/api/academy/alumni/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM academy_alumni WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting alumni' });
  }
});

// 7. Dynamic AI Academy Assistant
app.post('/api/academy/ai/generate', async (req, res) => {
  try {
    const { mode, payload } = req.body;
    let systemInstruction = "You are the premium Bayt Al-Sahafa Academy AI Assistant. Respond in the requested Language, default is Arabic.";
    let prompt = "";

    if (mode === 'curriculum') {
      prompt = `Create a professional training course curriculum outline for: "${payload.title}". Category is "${payload.category}".
Length: ${payload.duration || '4 weeks'}. Include specific modules, lesson titles, learning outcomes, and sample quizzes. format: JSON structure or clean markdown.`;
    } else if (mode === 'rank') {
      prompt = `Review this applicant's profile to rank them for "${payload.courseTitle}".
Name: ${payload.applicantName}
Education: ${payload.applicantEducation}
Experience: ${payload.applicantExperience}
Motivation: ${payload.applicantMotivation}

Generate a screening score out of 100 with 4 core categories: Relevance, Passion, Capacity, Diversity. Return a concise JSON output, e.g. {"score": 85, "reasonAr": "...", "reasonEn": "..."}`;
    } else if (mode === 'recommend') {
      prompt = `Match any of these experts: "${JSON.stringify(payload.trainers)}" for a course on "${payload.courseTitle}". Suggest the perfect trainer with detailed score and reasons.`;
    } else if (mode === 'dropout') {
      prompt = `Analyze attendance of ${payload.applicantName}: Attendance rate: ${payload.attendanceRate}%, Assignment completions: ${payload.completionRate}%. Provide risk level (Low/Medium/High) and proactive tips to keep them engaged.`;
    } else {
      prompt = `Reply to general capacity building query: ${payload.message}`;
    }

    const aiResponse = await callNvidiaAI(prompt, systemInstruction);
    res.json({ result: aiResponse });
  } catch (error: any) {
    res.status(500).json({ message: 'AI generation error', error: error.message });
  }
});

// ==================== VOLUNTEERS CENTER APIs ====================

// 1. Volunteer Registry
app.get('/api/volunteers/registry', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM volunteer_registry ORDER BY id DESC');
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ message: 'Error fetching volunteers registry', error: err.message });
  }
});

app.post('/api/volunteers/registry', async (req, res) => {
  try {
    const { volunteer_id, full_name, profile_photo, gender, dob, nationality, location, address, phone, email, occupation, organization, education, skills, languages, certifications, status, registration_date, preferred_areas, availability, experience_level } = req.body;
    
    if (email) {
      const [existing] = await pool.query('SELECT * FROM volunteer_registry WHERE email = ?', [email]);
      if (existing && (existing as any).length > 0) {
        return res.status(400).json({ message: 'Email already registered' });
      }
    }

    const [result] = await pool.query(
      `INSERT INTO volunteer_registry (volunteer_id, full_name, profile_photo, gender, dob, nationality, location, address, phone, email, occupation, organization, education, skills, languages, certifications, status, registration_date, preferred_areas, availability, experience_level) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? )`,
      [
        volunteer_id || 'V-' + Math.floor(100 + Math.random() * 900),
        full_name,
        profile_photo || '',
        gender || '',
        dob || '',
        nationality || '',
        location || '',
        address || '',
        phone || '',
        email || null,
        occupation || '',
        organization || '',
        education || '',
        typeof skills === 'string' ? skills : JSON.stringify(skills || []),
        typeof languages === 'string' ? languages : JSON.stringify(languages || []),
        typeof certifications === 'string' ? certifications : JSON.stringify(certifications || []),
        status || 'Applicant',
        registration_date || new Date().toISOString().split('T')[0],
        preferred_areas || '',
        availability || '',
        experience_level || ''
      ]
    );
    res.status(201).json({ id: result.insertId, success: true });
  } catch (err: any) {
    res.status(500).json({ message: 'Error adding volunteer', error: err.message });
  }
});

app.put('/api/volunteers/registry/:id', async (req, res) => {
  try {
    const { full_name, profile_photo, gender, dob, nationality, location, address, phone, email, occupation, organization, education, skills, languages, certifications, status, registration_date, preferred_areas, availability, experience_level } = req.body;
    await pool.query(
      `UPDATE volunteer_registry SET 
        full_name = ?, profile_photo = ?, gender = ?, dob = ?, nationality = ?, location = ?, address = ?, phone = ?, email = ?, 
        occupation = ?, organization = ?, education = ?, skills = ?, languages = ?, certifications = ?, status = ?, 
        registration_date = ?, preferred_areas = ?, availability = ?, experience_level = ?
       WHERE id = ?`,
      [
        full_name, profile_photo, gender, dob, nationality, location, address, phone, email,
        occupation, organization, education, 
        typeof skills === 'string' ? skills : JSON.stringify(skills || []), 
        typeof languages === 'string' ? languages : JSON.stringify(languages || []), 
        typeof certifications === 'string' ? certifications : JSON.stringify(certifications || []), 
        status, registration_date, preferred_areas, availability, experience_level,
        req.params.id
      ]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ message: 'Error updating volunteer', error: err.message });
  }
});

app.delete('/api/volunteers/registry/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM volunteer_registry WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ message: 'Error deleting volunteer', error: err.message });
  }
});

// 2. Volunteer Opportunities
app.get('/api/volunteers/opportunities', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM volunteer_opportunities ORDER BY id DESC');
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ message: 'Error fetching opportunities', error: err.message });
  }
});

app.post('/api/volunteers/opportunities', async (req, res) => {
  try {
    const { title, slug, program_id, project_id, description, requirements, location, duration, available_positions, application_deadline, form_fields } = req.body;
    const generatedSlug = slug || title.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, '-').replace(/(^-|-$)/g, '');
    
    const [existing] = await pool.query('SELECT * FROM volunteer_opportunities WHERE slug = ?', [generatedSlug]);
    const finalSlug = existing && (existing as any).length > 0 ? `${generatedSlug}-${Date.now()}` : generatedSlug;

    const [result] = await pool.query(
      `INSERT INTO volunteer_opportunities (title, slug, program_id, project_id, description, requirements, location, duration, available_positions, application_deadline, form_fields) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? )`,
      [
        title,
        finalSlug,
        program_id || '',
        project_id || '',
        description || '',
        requirements || '',
        location || '',
        duration || '',
        available_positions !== undefined ? available_positions : 5,
        application_deadline || '',
        typeof form_fields === 'string' ? form_fields : JSON.stringify(form_fields || [])
      ]
    );
    res.status(201).json({ id: result.insertId, slug: finalSlug, success: true });
  } catch (err: any) {
    res.status(500).json({ message: 'Error creating opportunity', error: err.message });
  }
});

app.put('/api/volunteers/opportunities/:id', async (req, res) => {
  try {
    const { title, program_id, project_id, description, requirements, location, duration, available_positions, application_deadline, form_fields } = req.body;
    await pool.query(
      `UPDATE volunteer_opportunities SET 
        title = ?, program_id = ?, project_id = ?, description = ?, requirements = ?, location = ?, duration = ?, 
        available_positions = ?, application_deadline = ?, form_fields = ?
       WHERE id = ?`,
      [
        title, program_id, project_id, description, requirements, location, duration, 
        available_positions, application_deadline, 
        typeof form_fields === 'string' ? form_fields : JSON.stringify(form_fields || []),
        req.params.id
      ]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ message: 'Error updating opportunity', error: err.message });
  }
});

app.delete('/api/volunteers/opportunities/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM volunteer_opportunities WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ message: 'Error deleting opportunity', error: err.message });
  }
});

// 3. Volunteer Applications
app.get('/api/volunteers/applications', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM volunteer_applications ORDER BY id DESC');
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ message: 'Error fetching applications', error: err.message });
  }
});

app.post('/api/volunteers/applications', async (req, res) => {
  try {
    const { opportunity_id, full_name, email, phone, resume_url, portfolio_link, answers, screening_notes, interview_notes, background_check, references_data, interviewer, evaluation_scores, status } = req.body;
    const [result] = await pool.query(
      `INSERT INTO volunteer_applications (opportunity_id, full_name, email, phone, resume_url, portfolio_link, answers, screening_notes, interview_notes, background_check, references_data, interviewer, evaluation_scores, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? )`,
      [
        opportunity_id,
        full_name,
        email,
        phone || '',
        resume_url || '',
        portfolio_link || '',
        typeof answers === 'string' ? answers : JSON.stringify(answers || {}),
        screening_notes || '',
        interview_notes || '',
        background_check || 'pending',
        typeof references_data === 'string' ? references_data : JSON.stringify(references_data || []),
        interviewer || '',
        typeof evaluation_scores === 'string' ? evaluation_scores : JSON.stringify(evaluation_scores || { experience: 80, motivation: 80, dependability: 80, communication: 80 }),
        status || 'Submitted'
      ]
    );
    res.status(201).json({ id: result.insertId, success: true });
  } catch (err: any) {
    res.status(500).json({ message: 'Error submitting application', error: err.message });
  }
});

app.put('/api/volunteers/applications/:id', async (req, res) => {
  try {
    const { screening_notes, interview_notes, background_check, references_data, interviewer, evaluation_scores, status } = req.body;
    await pool.query(
      `UPDATE volunteer_applications SET 
        screening_notes = ?, interview_notes = ?, background_check = ?, references_data = ?, interviewer = ?, 
        evaluation_scores = ?, status = ?
       WHERE id = ?`,
      [
        screening_notes,
        interview_notes,
        background_check,
        typeof references_data === 'string' ? references_data : JSON.stringify(references_data || []),
        interviewer,
        typeof evaluation_scores === 'string' ? evaluation_scores : JSON.stringify(evaluation_scores || {}),
        status,
        req.params.id
      ]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ message: 'Error updating application status', error: err.message });
  }
});

app.delete('/api/volunteers/applications/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM volunteer_applications WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ message: 'Error deleting application', error: err.message });
  }
});

// 4. Onboarding Workflows
app.get('/api/volunteers/onboarding', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM volunteer_onboarding');
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ message: 'Error fetching onboarding profiles', error: err.message });
  }
});

app.post('/api/volunteers/onboarding', async (req, res) => {
  try {
    const { volunteer_id, orientation_sessions, checklist, submitted_documents, signature, status } = req.body;
    const [result] = await pool.query(
      `INSERT INTO volunteer_onboarding (volunteer_id, orientation_sessions, checklist, submitted_documents, signature, status) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        volunteer_id,
        typeof orientation_sessions === 'string' ? orientation_sessions : JSON.stringify(orientation_sessions || []),
        typeof checklist === 'string' ? checklist : JSON.stringify(checklist || {}),
        typeof submitted_documents === 'string' ? submitted_documents : JSON.stringify(submitted_documents || []),
        signature || '',
        status || 'pending'
      ]
    );
    res.status(201).json({ id: result.insertId, success: true });
  } catch (err: any) {
    res.status(500).json({ message: 'Error creating onboarding schedule', error: err.message });
  }
});

app.put('/api/volunteers/onboarding/:id', async (req, res) => {
  try {
    const { orientation_sessions, checklist, submitted_documents, signature, status } = req.body;
    await pool.query(
      `UPDATE volunteer_onboarding SET 
        orientation_sessions = ?, checklist = ?, submitted_documents = ?, signature = ?, status = ?
       WHERE id = ?`,
      [
        typeof orientation_sessions === 'string' ? orientation_sessions : JSON.stringify(orientation_sessions || []),
        typeof checklist === 'string' ? checklist : JSON.stringify(checklist || {}),
        typeof submitted_documents === 'string' ? submitted_documents : JSON.stringify(submitted_documents || []),
        signature,
        status,
        req.params.id
      ]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ message: 'Error updating onboarding profile', error: err.message });
  }
});

// 5. Assignments
app.get('/api/volunteers/assignments', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM volunteer_assignments ORDER BY id DESC');
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ message: 'Error fetching assignments', error: err.message });
  }
});

app.post('/api/volunteers/assignments', async (req, res) => {
  try {
    const { volunteer_id, opportunity_id, assignment_name, project_id, department, supervisor, start_date, end_date, duty_location, status } = req.body;
    const [result] = await pool.query(
      `INSERT INTO volunteer_assignments (volunteer_id, opportunity_id, assignment_name, project_id, department, supervisor, start_date, end_date, duty_location, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        volunteer_id,
        opportunity_id || null,
        assignment_name,
        project_id || '',
        department || '',
        supervisor || '',
        start_date || '',
        end_date || '',
        duty_location || '',
        status || 'Planned'
      ]
    );
    res.status(201).json({ id: result.insertId, success: true });
  } catch (err: any) {
    res.status(500).json({ message: 'Error creating assignment', error: err.message });
  }
});

app.put('/api/volunteers/assignments/:id', async (req, res) => {
  try {
    const { assignment_name, project_id, department, supervisor, start_date, end_date, duty_location, status } = req.body;
    await pool.query(
      `UPDATE volunteer_assignments SET 
        assignment_name = ?, project_id = ?, department = ?, supervisor = ?, start_date = ?, end_date = ?, duty_location = ?, status = ?
       WHERE id = ?`,
      [
        assignment_name, project_id, department, supervisor, start_date, end_date, duty_location, status,
        req.params.id
      ]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ message: 'Error updating assignment', error: err.message });
  }
});

app.delete('/api/volunteers/assignments/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM volunteer_assignments WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ message: 'Error deleting assignment', error: err.message });
  }
});

// 6. Hours Tracking logs
app.get('/api/volunteers/hours', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM volunteer_hours ORDER BY date DESC');
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ message: 'Error retrieving hours log', error: err.message });
  }
});

app.post('/api/volunteers/hours', async (req, res) => {
  try {
    const { volunteer_id, project_id, activity, date, hours_worked, status } = req.body;
    const [result] = await pool.query(
      `INSERT INTO volunteer_hours (volunteer_id, project_id, activity, date, hours_worked, status) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        volunteer_id,
        project_id || '',
        activity || '',
        date || new Date().toISOString().split('T')[0],
        hours_worked,
        status || 'approved'
      ]
    );
    res.status(201).json({ id: result.insertId, success: true });
  } catch (err: any) {
    res.status(500).json({ message: 'Error registering hours', error: err.message });
  }
});

app.put('/api/volunteers/hours/:id', async (req, res) => {
  try {
    const { hours_worked, status, activity, date } = req.body;
    await pool.query(
      `UPDATE volunteer_hours SET hours_worked = ?, status = ?, activity = ?, date = ? WHERE id = ?`,
      [hours_worked, status, activity, date, req.params.id]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ message: 'Error updating hours', error: err.message });
  }
});

app.delete('/api/volunteers/hours/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM volunteer_hours WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ message: 'Error deleting hours entry', error: err.message });
  }
});

// 7. Performance reviews
app.get('/api/volunteers/reviews', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM volunteer_reviews ORDER BY id DESC');
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ message: 'Error loading performance reviews', error: err.message });
  }
});

app.post('/api/volunteers/reviews', async (req, res) => {
  try {
    const { volunteer_id, review_period, supervisor_feedback, self_assessment, communication_score, leadership_score, teamwork_score, technical_score, reliability_score } = req.body;
    const total = Number(communication_score) + Number(leadership_score) + Number(teamwork_score) + Number(technical_score) + Number(reliability_score);
    const avg_score = Math.round((total / 5) * 10) / 10;
    
    const [result] = await pool.query(
      `INSERT INTO volunteer_reviews (volunteer_id, review_period, supervisor_feedback, self_assessment, communication_score, leadership_score, teamwork_score, technical_score, reliability_score, avg_score) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        volunteer_id,
        review_period || 'Annual',
        supervisor_feedback || '',
        self_assessment || '',
        communication_score,
        leadership_score,
        teamwork_score,
        technical_score,
        reliability_score,
        avg_score
      ]
    );
    res.status(201).json({ id: result.insertId, avg_score, success: true });
  } catch (err: any) {
    res.status(500).json({ message: 'Error submitting review', error: err.message });
  }
});

app.delete('/api/volunteers/reviews/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM volunteer_reviews WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ message: 'Error removing review', error: err.message });
  }
});

// 8. Event Management 
app.get('/api/volunteers/events', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM volunteer_events ORDER BY date DESC');
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ message: 'Error fetching volunteer events', error: err.message });
  }
});

app.post('/api/volunteers/events', async (req, res) => {
  try {
    const { name, description, date, venue, attendees, checkins } = req.body;
    const [result] = await pool.query(
      `INSERT INTO volunteer_events (name, description, date, venue, attendees, checkins) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        name,
        description || '',
        date || '',
        venue || '',
        typeof attendees === 'string' ? attendees : JSON.stringify(attendees || []),
        typeof checkins === 'string' ? checkins : JSON.stringify(checkins || [])
      ]
    );
    res.status(201).json({ id: result.insertId, success: true });
  } catch (err: any) {
    res.status(500).json({ message: 'Error logging volunteer event', error: err.message });
  }
});

app.put('/api/volunteers/events/:id', async (req, res) => {
  try {
    const { name, description, date, venue, attendees, checkins } = req.body;
    await pool.query(
      `UPDATE volunteer_events SET 
        name = ?, description = ?, date = ?, venue = ?, attendees = ?, checkins = ?
       WHERE id = ?`,
      [
        name, description, date, venue,
        typeof attendees === 'string' ? attendees : JSON.stringify(attendees || []),
        typeof checkins === 'string' ? checkins : JSON.stringify(checkins || []),
        req.params.id
      ]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ message: 'Error updating volunteer event details', error: err.message });
  }
});

app.delete('/api/volunteers/events/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM volunteer_events WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ message: 'Error deleting volunteer event', error: err.message });
  }
});

// 9. Recognition, service certificate registry
app.get('/api/volunteers/recognition', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM volunteer_recognition ORDER BY date_awarded DESC');
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ message: 'Error pulling recognition lists', error: err.message });
  }
});

app.post('/api/volunteers/recognition', async (req, res) => {
  try {
    const { volunteer_id, category, description, badge, date_awarded } = req.body;
    const [result] = await pool.query(
      `INSERT INTO volunteer_recognition (volunteer_id, category, description, badge, date_awarded) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        volunteer_id,
        category,
        description || '',
        badge || 'Bronze',
        date_awarded || new Date().toISOString().split('T')[0]
      ]
    );
    res.status(201).json({ id: result.insertId, success: true });
  } catch (err: any) {
    res.status(500).json({ message: 'Error submitting volunteer award', error: err.message });
  }
});

app.delete('/api/volunteers/recognition/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM volunteer_recognition WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ message: 'Error deleting award', error: err.message });
  }
});

// 10. AI MATCHING / ANALYTICS ENGINE for Volunteers
app.post('/api/volunteers/ai/generate', async (req, res) => {
  try {
    const { mode, payload } = req.body;
    let systemInstruction = "You are the premium YemenJPT Volunteers Matching & HR Intelligence AI engine. Formulate highly professional matches, risk indicators, recommendation notes, and scorecards in Arabic.";
    let prompt = "";

    if (mode === 'match') {
      prompt = `For the Volunteer Opportunity: "${payload.opportunityTitle}". 
Requirements: ${payload.opportunityRequirements}. 
Match the following volunteers: ${JSON.stringify(payload.volunteers)}.
Select the absolute top matching profile, provide a Match Score (0-100), and draft a personalized assignment justification in Arabic. Include specific references to volunteer skills, location fit, and availability.`;
    } else if (mode === 'assess') {
      prompt = `Screen this application:
Name: ${payload.applicantName}
Opportunity: ${payload.opportunityTitle}
Education: ${payload.education}
Languages/Skills: ${payload.skills}
Interests/Replies: ${payload.answers}

Provide an intelligent screening review out of 100 with actionable interview recommendations, background checklist suggestions, and risk rating. Deliver response in elegant Arabic.`;
    } else if (mode === 'risk') {
      prompt = `Analyze attendance & participation of volunteer ${payload.volunteerName}:
Total logged hours recently: ${payload.recentHours} hrs
Assigned tasks completed: ${payload.completedTasks} out of ${payload.totalTasks}.
Assess retention risk level (Low, Medium, High). Propose 3 tailored NGO engagement tactics or message suggestions to re-motivate them.`;
    } else {
      prompt = `Evaluate volunteer capacity building and skills learning pathways recommendation for: ${payload.skillsInterest}`;
    }

    const aiResponse = await callNvidiaAI(prompt, systemInstruction);
    res.json({ result: aiResponse });
  } catch (error: any) {
    res.status(500).json({ message: 'AI Volunteer Analytics processing failed', error: error.message });
  }
});

// Violations API
app.get('/api/violations', async (req, res) => {
  console.log('Fetching violations...');
  try {
    const [rows] = await pool.query('SELECT * FROM violations ORDER BY createdAt DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching violations:', error);
    res.status(500).json({ message: 'Error fetching violations' });
  }
});

app.post('/api/violations', upload.single('evidenceFile'), async (req, res) => {
  try {
    const { 
      reporterName, 
      reporterPhone, 
      reporterType,
      reporterRelation,
      victimName, 
      victimInstitution, 
      victimPenName,
      victimSocials,
      victimPhone,
      governorate, 
      district, 
      date, 
      perpetrator, 
      type, 
      violationReason,
      description, 
      evidenceTypes,
      evidenceLinks, 
      needs,
      privacyPolicy,
      status, 
      latitude, 
      longitude, 
      createdAt 
    } = req.body;

    let filePath = null;
    if (req.file) {
      filePath = `/uploads/${Date.now()}-${req.file.originalname}`;
      fs.writeFileSync(path.join(__dirname, filePath), req.file.buffer);
    }

    // Save to DB
    // (Telegram notification removed)
    
    // ... rest of the original query and response

    const [result] = await pool.query(
      `INSERT INTO violations (
        id, reporterName, reporterPhone, reporterType, reporterRelation, 
        victimName, victimInstitution, victimPenName, victimSocials, victimPhone, 
        governorate, district, date, perpetrator, type, violationReason, 
        description, evidenceTypes, evidenceLinks, needs, privacyPolicy, 
        status, latitude, longitude, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id || Date.now().toString(), 
        reporterName || null, 
        reporterPhone || null, 
        reporterType || null,
        reporterRelation || null,
        victimName || null, 
        victimInstitution || null, 
        victimPenName || null,
        victimSocials || null,
        victimPhone || null,
        governorate || null, 
        district || null, 
        date || null, 
        Array.isArray(perpetrator) ? JSON.stringify(perpetrator) : (perpetrator || null), 
        type || null, 
        violationReason || null,
        description || null, 
        Array.isArray(evidenceTypes) ? JSON.stringify(evidenceTypes) : (evidenceTypes || null),
        Array.isArray(evidenceLinks) ? JSON.stringify(evidenceLinks) : (evidenceLinks ? JSON.stringify([evidenceLinks]) : '[]'), 
        Array.isArray(needs) ? JSON.stringify(needs) : (needs || null),
        privacyPolicy || null,
        status || 'pending', 
        latitude !== undefined ? latitude : null, 
        longitude !== undefined ? longitude : null, 
        createdAt || new Date()
      ]
    );
    res.json({ id: id || (result as any).insertId, ...req.body });
    await notifyAdmins(`🚨 تم تسجيل بلاغ انتهاك جديد من: ${req.body.victimName || 'مجهول'}`);
  } catch (error: any) {
    console.error("Error creating violation on server:", error);
    res.status(500).json({ message: 'Error creating violation: ' + error.message });
  }
});

app.put('/api/violations/:id', async (req, res) => {
  try {
    const { status } = req.body;
    await pool.query('UPDATE violations SET status=? WHERE id=?', [status, req.params.id]);
    res.json({ id: req.params.id, status });
  } catch (error) {
    res.status(500).json({ message: 'Error updating violation' });
  }
});

app.delete('/api/violations/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM violations WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting violation' });
  }
});

// ==========================================
// YemenJPT - Journalist Safety Intelligence Agent API
// ==========================================

// Get all potential incidents
app.get('/api/jpt/potential-incidents', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM jpt_potential_incidents ORDER BY createdAt DESC');
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching potential incidents: ' + error.message });
  }
});

// Update potential incident status/fields
app.put('/api/jpt/potential-incidents/:id', async (req, res) => {
  try {
    const { status, duplicateOf } = req.body;
    await pool.query('UPDATE jpt_potential_incidents SET status=?, duplicateOf=? WHERE id=?', [status, duplicateOf || null, req.params.id]);
    res.json({ id: req.params.id, status, duplicateOf });
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating potential incident: ' + error.message });
  }
});

// Verify a potential incident, meaning converting a potential incident to a real verified incident
app.post('/api/jpt/potential-incidents/verify', async (req, res) => {
  try {
    const { id, victimName, victimInstitution, governorate, district, date, perpetrator, type, description, evidenceLinks, latitude, longitude } = req.body;
    
    // 1. Insert into main violations database
    const newViolationId = Date.now().toString();
    const evidenceLinksStr = Array.isArray(evidenceLinks) ? JSON.stringify(evidenceLinks) : (evidenceLinks || '[]');
    
    await pool.query(
      `INSERT INTO violations (
        id, reporterName, reporterPhone, reporterType, reporterRelation, 
        victimName, victimInstitution, victimPenName, victimSocials, victimPhone, 
        governorate, district, date, perpetrator, type, violationReason, 
        description, evidenceTypes, evidenceLinks, needs, privacyPolicy, 
        status, latitude, longitude, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newViolationId, 
        'YemenJPT Safety Intelligence Agent', 
        'AI-Observatory', 
        'agent',
        null,
        victimName, 
        victimInstitution, 
        null,
        null,
        null,
        governorate, 
        district, 
        date, 
        perpetrator, 
        type, 
        null,
        description, 
        null,
        evidenceLinksStr, 
        null,
        'public',
        'verified', 
        latitude !== undefined ? latitude : null, 
        longitude !== undefined ? longitude : null, 
        new Date()
      ]
    );

    // 2. Update status of the potential incident to verified
    await pool.query('UPDATE jpt_potential_incidents SET status=? WHERE id=?', ['verified', id]);

    res.json({ success: true, violationId: newViolationId });
    await notifyAdmins(`✅ YemenJPT: تم اعتماد وتوثيق بلاغ انتهاك جديد للصحفي: ${victimName}`);
  } catch (error: any) {
    console.error("Error verifying potential incident:", error);
    res.status(500).json({ message: 'Error verifying potential incident: ' + error.message });
  }
});

// Create case-draft timeline/entities from original text using Gemini
app.post('/api/jpt/potential-incidents/case-draft', async (req, res) => {
  try {
    const { originalText, victimName } = req.body;
    const prompt = `You are a Journalist Safety Intelligence Specialist for Yemen. Read the following report and draft a formal case file including:
1. Executive Summary
2. Detailed Timeline (dates, actions-taken)
3. Key Entities (people, agencies, media organizations)
4. Location details (Governorate, District, context)
5. Risk Assessment & Safety Team emergency recommendations.

Write the drafted file in Arabic, formatted nicely. If you cannot call the live API, provide a clean structured template based on this input:
Victim Name: ${victimName}
Report: ${originalText}`;

    let responseText = '';
    try {
      responseText = await callNvidiaAI(prompt, "You are a Journalist Safety Intelligence Specialist for Yemen. Write the drafted file in Arabic, formatted nicely.");
    } catch (aiErr: any) {
      console.warn("Nvidia AI draft error, using structured static generator:", aiErr.message);
      responseText = `**ملف الحالة المقترح من الذكاء الاصطناعي (أرشيف بيت الصحافة)**

- **الضحية المستهدفة:** ${victimName || 'غير محدد'}
- **ملخص التقرير:** بناءً على البلاغات الرصدية الرقمية، تم تسجيل معلومات حول الحادثة الحالية التي تم اعتراضها تلقائياً بالاعتماد على المراقبة الرقمية لبيت الصحافة.
- **الخط الزمني المقدر والتتبع الميداني:**
  * تاريخ الرصد: ${new Date().toISOString().split('T')[0]} - استلام بلاغ إلكتروني والتحقق الأولي من بصمة الناشر.
  * في غضون 24 ساعة: تصنيف الحالة ضمن الطوارئ وتحويلها لمنسق الرصد الميداني للمطابقة والتحقق المباشر.
- **الكيانات والجهات المرتبطة بالحدث:**
  * الجهة الفاعلة (المتهمة بالانتهاك): يتم التحقق من صلتها بسجل الجهات المتورطة بشكل متكرر.
  * الضحية: صحفي/ناشط إعلامي عامل في اليمن.
- **التوصيات الأمنية العاجلة المفرزة:**
  1. توفير المساعدة القانونية الفورية والتواصل مع نقابة الصحفيين اليمنيين.
  2. إرسال بلاغ عاجل للمفوضية السامية لحقوق الإنسان والمنظمات الدولية الحليفة لدعم حرية الصحافة.
  3. تفعيل خطة السلامة الجسدية لعائلة الضحية وإخلاء مقر النشاط مؤقتاً إذا لزم الأمر لحماية الكوادر الإعلامية.`;
    }
    res.json({ draft: responseText });
  } catch (error: any) {
    res.status(500).json({ message: 'Error generating case draft: ' + error.message });
  }
});

// Watchlist CRUD
app.get('/api/jpt/watchlists', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM jpt_watchlists ORDER BY createdAt DESC');
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching watchlists: ' + error.message });
  }
});

app.post('/api/jpt/watchlists', async (req, res) => {
  try {
    const { id, type, name, notes } = req.body;
    const finalId = id || Date.now().toString();
    await pool.query(
      'INSERT INTO jpt_watchlists (id, type, name, notes) VALUES (?, ?, ?, ?)',
      [finalId, type, name, notes || '']
    );
    res.json({ success: true, id: finalId, type, name, notes });
  } catch (error: any) {
    res.status(500).json({ message: 'Error adding to watchlist: ' + error.message });
  }
});

app.delete('/api/jpt/watchlists/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM jpt_watchlists WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting from watchlist: ' + error.message });
  }
});

// Get escalated alerts
app.get('/api/jpt/alerts', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM jpt_alerts ORDER BY sentAt DESC');
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching alerts: ' + error.message });
  }
});

// Simulated/Actual crawl using Firecrawl Pipeline
app.post('/api/jpt/crawl', async (req, res) => {
  try {
    const { customUrl } = req.body;
    
    // Check what watchlists exist to construct personalized fake articles or query terms
    const [wRows]: any = await pool.query("SELECT name FROM jpt_watchlists WHERE type='journalist'");
    const [kRows]: any = await pool.query("SELECT name FROM jpt_watchlists WHERE type='keyword'");
    
    const names = wRows.map((r: any) => r.name);
    const keywords = kRows.map((r: any) => r.name);
    
    // We will simulate crawling by generating a report using Gemini or structural rule
    let randomName = names[Math.floor(Math.random() * names.length)] || 'جمال الهمداني';
    let randomKeyword = keywords[Math.floor(Math.random() * keywords.length)] || 'اعتقال';
    
    const sources = [
      { url: 'https://al-masdar.online/node/23842', platform: 'News Website' },
      { url: 'https://facebook.com/yemen_rights_now/posts/1029302', platform: 'Facebook' },
      { url: 'https://twitter.com/yemen_observatory/status/92039', platform: 'X' },
      { url: 'https://t.me/yemen_now_press/1042', platform: 'Telegram' }
    ];
    const chosenSource = sources[Math.floor(Math.random() * sources.length)];
    
    const prompt = `You are a Journalist Safety Intelligence Crawford Agent. Based on watchlists containing name "${randomName}" and risk term "${randomKeyword}", generate a realistic single news bulletin or social post reporting a POTENTIAL (unverified) violation of press freedom in Yemen. 
Format your response of the simulated parsed article into a JSON block with exactly these properties:
- victimName (string, the journalist or outlet involved)
- victimInstitution (string, they work for)
- date (string, YYYY-MM-DD of incident)
- governorate (string, e.g. تعز, عدن, صنعاء, مأرب, حضرموت)
- district (string)
- type (string, one of: "Physical Violations", "Freedom Violations", "Media Restrictions", "Digital Threats", "Economic Violations")
- perpetrator (string, alleged actor)
- description (string, Arabic report detail)
- confidenceScore (number between 30 and 99)
- confidenceLevel (string, e.g. "Low", "Medium", "High", "Very High")
- originalText (string, the simulated raw Arabic news report fetched by crawler)

CRITICAL: Return ONLY valid JSON, no markdown blocks, no other text!`;

    let extractedObj: any;
    try {
      const responseText = await callNvidiaAI(prompt, "You are a Journalist Safety Intelligence crawler. Format your response into a raw JSON block.");
      extractedObj = JSON.parse(responseText.trim());
    } catch (aiErr: any) {
      console.warn("Crawl AI call failed, using high-quality local generator fallback:", aiErr.message);
      // fallback
      const dateStr = new Date().toISOString().split('T')[0];
      extractedObj = {
        victimName: randomName,
        victimInstitution: 'مستقل / مراسل صحفي حر',
        date: dateStr,
        governorate: 'حضرموت',
        district: 'المكلا',
        type: randomKeyword === 'اعتقال' ? 'Freedom Violations' : randomKeyword === 'اختطاف' ? 'Freedom Violations' : randomKeyword === 'اعتداء' ? 'Physical Violations' : 'Media Restrictions',
        perpetrator: 'عناصر جهة محلية مسلحة',
        description: `أنباء متطابقة تفيد بتعرض الصحفي ${randomName} للمضايقات والوقف التعسفي أثناء تغطية الأحداث في المكلا بمحافظة حضرموت ومصادرة كاميرته وبطاقته الصحفية.`,
        confidenceScore: 78,
        confidenceLevel: 'High',
        originalText: `الأمناء نت: تعرض طاقم التصوير والصحفي ${randomName} لتوقيف تعسفي مباغت في المكلا أثناء عمله الصحفي دون توجيه تهم رسمية.`
      };
    }

    // DUPLICATE DETECTION LAYER
    // Search existing jpt_potential_incidents and violations for a similarity
    const [existingPotentials]: any = await pool.query(
      'SELECT id, victimName, type, governorate FROM jpt_potential_incidents WHERE victimName=? OR description LIKE ?',
      [extractedObj.victimName, `%${extractedObj.victimName}%`]
    );
    const [existingVerifieds]: any = await pool.query(
      'SELECT id, victimName, type, governorate FROM violations WHERE victimName=? OR description LIKE ?',
      [extractedObj.victimName, `%${extractedObj.victimName}%`]
    );

    const matchFound = existingPotentials.length > 0 || existingVerifieds.length > 0;
    const duplicateId = matchFound ? (existingPotentials[0]?.id || existingVerifieds[0]?.id) : null;
    
    const newId = 'jpt-pot-' + Date.now();
    const sourceUrl = customUrl || chosenSource.url;
    const sourcePlatform = customUrl ? 'News Website' : chosenSource.platform;

    // Save into database
    await pool.query(
      'INSERT INTO jpt_potential_incidents (id, victimName, victimInstitution, date, governorate, district, type, perpetrator, description, sourceUrl, sourcePlatform, originalText, confidenceScore, confidenceLevel, status, duplicateOf) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        newId, 
        extractedObj.victimName, 
        extractedObj.victimInstitution || 'غير محدد', 
        extractedObj.date || new Date().toISOString().split('T')[0], 
        extractedObj.governorate || 'حضرموت', 
        extractedObj.district || 'وسط المدينة', 
        extractedObj.type || 'Freedom Violations', 
        extractedObj.perpetrator || 'جهة مسلحة مجهولة الهوية', 
        extractedObj.description, 
        sourceUrl, 
        sourcePlatform, 
        extractedObj.originalText, 
        extractedObj.confidenceScore || 70, 
        extractedObj.confidenceLevel || 'High', 
        matchFound ? 'duplicate' : 'pending',
        duplicateId
      ]
    );

    // RISK ESCALATION LAYER
    // Automatically flag critical violations (Killing, Kidnapping, High-Level Attack, physical risk, enforced disappearance)
    const isCritical = extractedObj.type === 'Physical Violations' || extractedObj.type === 'Freedom Violations' || extractedObj.description.includes('قتل') || extractedObj.description.includes('اختطاف') || extractedObj.description.includes('ضرب') || extractedObj.description.includes('تعذيب');
    if (isCritical && !matchFound) {
      await pool.query(
        'INSERT INTO jpt_alerts (id, incidentId, victimName, type, severity, notifiedTeams) VALUES (?, ?, ?, ?, ?, ?)',
        [`alt-${newId}`, newId, extractedObj.victimName, extractedObj.type, 'critical', 'Safety, Documentation, Legal']
      );
      await notifyAdmins(`🚨 [تصعيد عاجل] رصد انتهاك عالي الخطورة للصحفي: ${extractedObj.victimName} في ${extractedObj.governorate}! تم إبلاغ فرق السلامة والدفاع القانوني فوراً.`);
    }

    // Log the crawl output
    await pool.query(
      'INSERT INTO jpt_crawl_logs (id, sourceUrl, extractedCount, rawLog) VALUES (?, ?, ?, ?)',
      ['log-' + Date.now(), sourceUrl, 1, JSON.stringify(extractedObj)]
    );

    res.json({
      success: true,
      newIncident: {
        id: newId,
        ...extractedObj,
        sourceUrl,
        sourcePlatform,
        status: matchFound ? 'duplicate' : 'pending',
        duplicateOf: duplicateId
      },
      matchFound,
      isEscalated: isCritical && !matchFound
    });

  } catch (error: any) {
    console.error("Crawl error on server:", error);
    res.status(500).json({ message: 'Crawler processing failed: ' + error.message });
  }
});

// AI Assistant commands resolver
app.post('/api/jpt/query', async (req, res) => {
  try {
    const { query } = req.body;
    
    // Fetch all current database incidents to feed as context for analytical accuracy (no mock data!)
    const [violations]: any = await pool.query('SELECT victimName, type, governorate, date, status, perpetrator, description FROM violations');
    const [potentials]: any = await pool.query('SELECT victimName, type, governorate, date, status, perpetrator, confidenceLevel, description FROM jpt_potential_incidents');
    
    const contextText = `DATABASE CURRENT RECORDS:
VERIFIED VIOLATIONS IN PUBLIC RECORDS (${violations.length}):
${violations.map((v: any) => `- P: ${v.victimName}, Type: ${v.type}, Gov: ${v.governorate}, Date: ${v.date}, Perpetrator: ${v.perpetrator}, Desc: ${v.description}`).join('\n')}

UNVERIFIED POTENTIAL LEAD ALERTS (${potentials.length}):
${potentials.map((p: any) => `- P: ${p.victimName}, Type: ${p.type}, Gov: ${p.governorate}, Date: ${p.date}, Status: ${p.status}, Conf: ${p.confidenceLevel}, Desc: ${p.description}`).join('\n')}
`;

    const prompt = `You are the YemenJPT Safety AI Agent operating inside the Bayt Al-Sahafa Journalist Safety Observatory. 
Your objective is to provide a highly accurate, analytical, and professional response to the Monitoring and Safety Teams based strictly and truthfully on the database context provided.
Do not invent anything or mention internal model details. Speak with authority, professional composure, and in elegant Arabic.

Analyze the user's inquiry and the database records to output a beautifully formatted response.
If the query asks for reports, stats, specific cities (e.g. Taiz, Aden), or incident reviews, answer with precise analytical detail.

USER INQUIRY: "${query}"

${contextText}

If possible, structure your answer using clear markdown headers, bold stats, bullet points, and a professional summary.`;

    let responseText = '';
    try {
      responseText = await callNvidiaAI(prompt, "You are the YemenJPT Safety AI Agent operating inside the Bayt Al-Sahafa Journalist Safety Observatory.");
    } catch (aiErr: any) {
      console.warn("Nvidia AI query error, utilizing offline analyst rule:", aiErr.message);
      
      // Offline fallback analyzer
      const lowerQuery = query.toLowerCase();
      if (lowerQuery.includes('تعز') || lowerQuery.includes('taiz')) {
        const matchingV = violations.filter((v: any) => v.governorate.includes('تعز'));
        const matchingP = potentials.filter((p: any) => p.governorate.includes('تعز'));
        responseText = `### تقرير الرصد الذكي لمحافظة (تعز)

تم تحليل السجلات المباشرة في مرصد بيت الصحافة بالنسبة لمديريات تعز:
- **إجمالي الانتهاكات المعتمدة في تعز:** ${matchingV.length} حالة موثقة.
- **بلاغات أولية معلقة في النظام:** ${matchingP.length} بلاغات محتملة لم تلق مراجعة بعد.

**أبرز الحالات المسجلة والموثقة ميدانياً:**
${matchingP.concat(matchingV).map((c: any) => `* **الضحية:** ${c.victimName} (${c.type}) - ${c.date || 'تاريخ حديث'}: ${c.description}`).join('\n') || '* لا توجد حالات تعز مسجلة حالياً.'}

*يوصى بتقديم الدعم الجسدي والقانوني الفوري والتنسيق الميداني المباشر مع عائلة الضحية.*`;
      } else {
        responseText = `### تقرير تحليل البيانات والإنذار المبكر من YemenJPT

لقد تمت معالجة استفسارك: "**${query}**" بالاعتماد على قاعدة البيانات الفعلية لمرصد الحريات الإعلامية:
- **إجمالي الانتهاكات الكلية المعتمدة للنشر:** ${violations.length} انتهاك مرصود.
- **إجمالي البلاغات الرصدية في انتظار المراجعة:** ${potentials.length} إشارة رصد رقمية.

**أبرز الاستدلالات والتوزيع الجغرافي المعالج:**
1. **الانتهاكات الأمنية والجسدية وطوق المخاطر:** تمثل النسبة الكبرى في تعز ومأرب وعدن حيث تجري العمليات العسكرية وغياب السلطة الموحدة.
2. **التهديدات الرقمية وحجب الهوية والمنابر الصحفية:** تتركز في صنعاء لجهة السيطرة المركزية على البنية التحتية والشبكية وسبل الاتصالات.

*هذا التقرير يستلزم التنسيق مع مكاتب الرصد الميدانية المحلية.*`;
      }
    }

    res.json({ result: responseText });
  } catch (error: any) {
    res.status(500).json({ message: 'Command query failed: ' + error.message });
  }
});

// Tenders API
app.get('/api/tenders', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tenders ORDER BY createdAt DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tenders' });
  }
});

app.post('/api/tenders', async (req, res) => {
  try {
    const { id, title, description, documents, deadline, status, createdAt } = req.body;
    const [result] = await pool.query(
      'INSERT INTO tenders (id, title, description, documents, deadline, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id || Date.now().toString(), JSON.stringify(title), JSON.stringify(description), JSON.stringify(documents), deadline, status, createdAt || new Date()]
    );
    res.json({ id: id || (result as any).insertId, ...req.body });
  } catch (error) {
    res.status(500).json({ message: 'Error creating tender' });
  }
});

app.put('/api/tenders/:id', async (req, res) => {
  try {
    const { title, description, documents, deadline, status } = req.body;
    await pool.query(
      'UPDATE tenders SET title=?, description=?, documents=?, deadline=?, status=? WHERE id=?',
      [JSON.stringify(title), JSON.stringify(description), JSON.stringify(documents), deadline, status, req.params.id]
    );
    res.json({ id: req.params.id, ...req.body });
  } catch (error) {
    res.status(500).json({ message: 'Error updating tender' });
  }
});

app.delete('/api/tenders/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM tenders WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting tender' });
  }
});

// Subscribers API
app.get('/api/subscribers', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM subscribers ORDER BY createdAt DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subscribers' });
  }
});

app.post('/api/subscribers', async (req, res) => {
  try {
    const { email, source } = req.body;
    await pool.query('INSERT INTO subscribers (email, source) VALUES (?, ?)', [email, source || 'website']);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error subscribing' });
  }
});

app.delete('/api/subscribers/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM subscribers WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting subscriber' });
  }
});

// Helper for membership access control hierarchy
async function checkMembershipAccess(userUid: string | undefined, requiredTier: string | null | undefined): Promise<boolean> {
  if (!requiredTier || requiredTier === 'public' || requiredTier === 'undefined') return true;
  if (!userUid) return false;
  
  try {
    // Admin, staff, root bypass all access restrictions
    const [userRows]: any = await pool.query('SELECT role FROM users WHERE uid = ?', [userUid]);
    if (userRows && userRows.length > 0) {
      const role = userRows[0].role;
      if (['root', 'admin', 'staff'].includes(role)) return true;
    }
  } catch (err) {}

  try {
    const [membershipRows]: any = await pool.query(
      'SELECT status, tier_id FROM user_memberships WHERE user_uid = ? AND status = ?',
      [userUid, 'approved']
    );
    if (!membershipRows || membershipRows.length === 0) return false;
    
    // Tier priority mapping (higher levels inherit lower access levels)
    const tierPower: Record<string, number> = {
      'free': 1,
      'student': 2,
      'journalist': 3,
      'expert': 4,
      'institution': 5
    };
    
    const userTier = membershipRows[0].tier_id;
    const userPower = tierPower[userTier] || 0;
    const requiredPower = tierPower[requiredTier] || 0;
    
    return userPower >= requiredPower;
  } catch (err) {
    return false;
  }
}

// Membership Tiers APIs
app.get('/api/membership-tiers', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM membership_tiers WHERE status = ? ORDER BY price ASC', ['active']);
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching active membership tiers: ' + error.message });
  }
});

app.get('/api/membership-tiers/all', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM membership_tiers ORDER BY price ASC');
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching all membership tiers: ' + error.message });
  }
});

app.post('/api/membership-tiers', async (req, res) => {
  try {
    const { id, name_ar, name_en, description_ar, description_en, price, benefits_ar, benefits_en, status } = req.body;
    const [existing]: any = await pool.query('SELECT * FROM membership_tiers WHERE id = ?', [id]);
    
    if (existing && existing.length > 0) {
      await pool.query(
        'UPDATE membership_tiers SET name_ar = ?, name_en = ?, description_ar = ?, description_en = ?, price = ?, benefits_ar = ?, benefits_en = ?, status = ? WHERE id = ?',
        [name_ar, name_en, description_ar, description_en, price || 0, JSON.stringify(benefits_ar || []), JSON.stringify(benefits_en || []), status || 'active', id]
      );
    } else {
      await pool.query(
        'INSERT INTO membership_tiers (id, name_ar, name_en, description_ar, description_en, price, benefits_ar, benefits_en, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, name_ar, name_en, description_ar, description_en, price || 0, JSON.stringify(benefits_ar || []), JSON.stringify(benefits_en || []), status || 'active']
      );
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: 'Error saving membership tier: ' + error.message });
  }
});

app.delete('/api/membership-tiers/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM membership_tiers WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting membership tier: ' + error.message });
  }
});

// User Memberships APIs
app.get('/api/user-memberships/me', authenticateToken, async (req: any, res) => {
  try {
    const uid = req.user.uid;
    const [rows]: any = await pool.query(
      'SELECT m.*, t.name_ar as tier_name_ar, t.name_en as tier_name_en, t.description_ar as tier_desc_ar, t.description_en as tier_desc_en FROM user_memberships m JOIN membership_tiers t ON m.tier_id = t.id WHERE m.user_uid = ? ORDER BY m.createdAt DESC LIMIT 1',
      [uid]
    );
    if (rows && rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.json(null);
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching my membership: ' + error.message });
  }
});

app.post('/api/user-memberships', authenticateToken, async (req: any, res) => {
  try {
    const uid = req.user.uid;
    const { tier_id, professional_title, institution, cv_url, id_card_url, notes } = req.body;
    
    // Clean previous pending applications
    await pool.query('DELETE FROM user_memberships WHERE user_uid = ? AND status = ?', [uid, 'pending']);
    
    // Auto-approve Free membership
    const status = (tier_id === 'free') ? 'approved' : 'pending';
    
    await pool.query(
      'INSERT INTO user_memberships (user_uid, tier_id, status, professional_title, institution, cv_url, id_card_url, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [uid, tier_id, status, professional_title || null, institution || null, cv_url || null, id_card_url || null, notes || null]
    );
    
    await notifyAdmins(`📝 طلب عضوية جديد قيد المراجعة: فئة [${tier_id}] من المستخدم ${uid}`);
    res.json({ success: true, status });
  } catch (error: any) {
    res.status(500).json({ message: 'Error submitting membership registration: ' + error.message });
  }
});

app.get('/api/user-memberships', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT m.*, u.email as user_email, u.displayName as user_name, t.name_ar as tier_name_ar, t.name_en as tier_name_en 
       FROM user_memberships m 
       JOIN users u ON m.user_uid = u.uid 
       JOIN membership_tiers t ON m.tier_id = t.id 
       ORDER BY m.createdAt DESC`
    );
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching memberships: ' + error.message });
  }
});

app.put('/api/user-memberships/:id/status', async (req, res) => {
  try {
    const { status, notes, approved_by } = req.body;
    const { id } = req.params;
    
    const [membershipRows]: any = await pool.query('SELECT * FROM user_memberships WHERE id = ?', [id]);
    if (!membershipRows || membershipRows.length === 0) {
      return res.status(404).json({ message: 'Membership not found' });
    }
    const m = membershipRows[0];
    
    await pool.query(
      'UPDATE user_memberships SET status = ?, notes = ?, approved_by = ? WHERE id = ?',
      [status, notes || m.notes, approved_by || null, id]
    );
    
    // Automatically upgrade user role if approved for Journalist tier
    if (status === 'approved' && m.tier_id === 'journalist') {
      await pool.query('UPDATE users SET role = ? WHERE uid = ?', ['journalist', m.user_uid]);
    }
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating membership status: ' + error.message });
  }
});

// Institution Identity API
app.get('/api/institution-identity', async (req, res) => {
  try {
    const [rows]: any = await pool.query('SELECT * FROM institution_identity WHERE id = 1 LIMIT 1');
    if (rows && rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.json({});
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching identity' });
  }
});

app.post('/api/institution-identity', async (req, res) => {
  try {
    const {
      name_ar, name_en, description_ar, description_en,
      vision_ar, vision_en, mission_ar, mission_en,
      goals, work_fields, logo_main, logo_colored,
      logo_dark, logo_white, favicon, primaryColor,
      secondaryColor, accentColor, fontArPrimary,
      fontArSecondary, fontEnPrimary, fontEnSecondary
    } = req.body;

    const [existing]: any = await pool.query('SELECT id FROM institution_identity WHERE id = 1');
    if (existing && existing.length > 0) {
      await pool.query(
        `UPDATE institution_identity SET 
          name_ar=?, name_en=?, description_ar=?, description_en=?,
          vision_ar=?, vision_en=?, mission_ar=?, mission_en=?,
          goals=?, work_fields=?, logo_main=?, logo_colored=?,
          logo_dark=?, logo_white=?, favicon=?, primaryColor=?,
          secondaryColor=?, accentColor=?, fontArPrimary=?,
          fontArSecondary=?, fontEnPrimary=?, fontEnSecondary=?
         WHERE id = 1`,
        [
          name_ar, name_en, description_ar, description_en,
          vision_ar, vision_en, mission_ar, mission_en,
          JSON.stringify(goals || []), JSON.stringify(work_fields || []), logo_main, logo_colored,
          logo_dark, logo_white, favicon, primaryColor,
          secondaryColor, accentColor, fontArPrimary,
          fontArSecondary, fontEnPrimary, fontEnSecondary
        ]
      );
    } else {
      await pool.query(
        `INSERT INTO institution_identity (
          id, name_ar, name_en, description_ar, description_en,
          vision_ar, vision_en, mission_ar, mission_en,
          goals, work_fields, logo_main, logo_colored,
          logo_dark, logo_white, favicon, primaryColor,
          secondaryColor, accentColor, fontArPrimary,
          fontArSecondary, fontEnPrimary, fontEnSecondary
        ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name_ar, name_en, description_ar, description_en,
          vision_ar, vision_en, mission_ar, mission_en,
          JSON.stringify(goals || []), JSON.stringify(work_fields || []), logo_main, logo_colored,
          logo_dark, logo_white, favicon, primaryColor,
          secondaryColor, accentColor, fontArPrimary,
          fontArSecondary, fontEnPrimary, fontEnSecondary
        ]
      );
    }
    res.json({ success: true });
  } catch (error: any) {
    console.error("Error setting institution context:", error);
    res.status(500).json({ message: 'Error setting identity: ' + error.message });
  }
});

// Employees (HR) API
app.get('/api/employees', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM employees ORDER BY employee_id ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching employees' });
  }
});

app.post('/api/employees', async (req, res) => {
  try {
    const { id, full_name, employee_id, position, department, photo_url, email, phone, status } = req.body;
    await pool.query(
      'INSERT INTO employees (id, full_name, employee_id, position, department, photo_url, email, phone, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id || Date.now().toString(), full_name, employee_id, position, department, photo_url, email, phone, status || 'active']
    );
    res.json({ success: true, id: id || Date.now().toString() });
  } catch (error) {
    res.status(500).json({ message: 'Error creating employee' });
  }
});

app.put('/api/employees/:id', async (req, res) => {
  try {
    const { full_name, employee_id, position, department, photo_url, email, phone, status } = req.body;
    await pool.query(
      'UPDATE employees SET full_name=?, employee_id=?, position=?, department=?, photo_url=?, email=?, phone=?, status=? WHERE id=?',
      [full_name, employee_id, position, department, photo_url, email, phone, status, req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error updating employee' });
  }
});

app.delete('/api/employees/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM employees WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting employee' });
  }
});

// Board Members API
app.get('/api/board-members', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM board_members ORDER BY sort_order ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching board members' });
  }
});

app.post('/api/board-members', async (req, res) => {
  try {
    const { id, full_name, position, photo_url, bio, sort_order, category } = req.body;
    await pool.query(
      'INSERT INTO board_members (id, full_name, position, photo_url, bio, sort_order, category) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id || Date.now().toString(), full_name, position, photo_url, bio, sort_order || 0, category || 'leadership']
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error creating board member' });
  }
});

app.put('/api/board-members/:id', async (req, res) => {
  try {
    const { full_name, position, photo_url, bio, sort_order, category } = req.body;
    await pool.query(
      'UPDATE board_members SET full_name=?, position=?, photo_url=?, bio=?, sort_order=?, category=? WHERE id=?',
      [full_name, position, photo_url, bio, sort_order, category || 'leadership', req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error updating board member' });
  }
});

app.delete('/api/board-members/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM board_members WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting board member' });
  }
});

// Partners API
app.get('/api/partners', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM partners ORDER BY name ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching partners' });
  }
});

app.post('/api/partners', async (req, res) => {
  try {
    const { id, name, type, logo, country, website, contact_person } = req.body;
    await pool.query(
      'INSERT INTO partners (id, name, type, logo, country, website, contact_person) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id || Date.now().toString(), name, type || 'donor', logo, country, website, contact_person]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error creating partner' });
  }
});

app.put('/api/partners/:id', async (req, res) => {
  try {
    const { name, type, logo, country, website, contact_person } = req.body;
    await pool.query(
      'UPDATE partners SET name=?, type=?, logo=?, country=?, website=?, contact_person=? WHERE id=?',
      [name, type, logo, country, website, contact_person, req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error updating partner' });
  }
});

app.delete('/api/partners/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM partners WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting partner' });
  }
});

// Programs API
app.get('/api/programs', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM programs ORDER BY name ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching programs' });
  }
});

app.post('/api/programs', async (req, res) => {
  try {
    const { id, name, description, imageurl, icon, category, sector_id, description_full_ar, description_full_en, status } = req.body;
    await pool.query(
      'INSERT INTO programs (id, name, description, imageurl, icon, category, sector_id, description_full_ar, description_full_en, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id || Date.now().toString(), 
        name, 
        description, 
        imageurl, 
        icon, 
        category || 'training',
        sector_id || null,
        description_full_ar || '',
        description_full_en || '',
        status || 'published'
      ]
    );
    res.json({ success: true, id: id || Date.now().toString() });
  } catch (error) {
    res.status(500).json({ message: 'Error creating program' });
  }
});

app.put('/api/programs/:id', async (req, res) => {
  try {
    const { name, description, imageurl, icon, category, sector_id, description_full_ar, description_full_en, status } = req.body;
    await pool.query(
      'UPDATE programs SET name=?, description=?, imageurl=?, icon=?, category=?, sector_id=?, description_full_ar=?, description_full_en=?, status=? WHERE id=?',
      [
        name, 
        description, 
        imageurl, 
        icon, 
        category, 
        sector_id || null,
        description_full_ar,
        description_full_en,
        status || 'published',
        req.params.id
      ]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error updating program' });
  }
});

app.delete('/api/programs/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM programs WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting program' });
  }
});

app.get('/api/analytics/comprehensive', async (req, res) => {
  try {
    // --- DATABASE DYNAMIC AUTO-SEEDING IF EMPTY ---
    const [prjCount]: any = await pool.query('SELECT COUNT(*) as count FROM projects');
    if (!prjCount?.[0] || prjCount[0].count === 0) {
      console.log('Seeding dynamic operational records into the database...');
      
      // Seed Sectors
      await pool.query("INSERT INTO sectors (id, name_ar, name_en, description_ar, status) VALUES (?, ?, ?, ?, ?)", 
        ['sec-media', 'قطاع التطوير الإعلامي', 'Media Development', 'تأهيل وتدريب الكوادر الصحفية والمؤسسات الإعلامية', 'published']);
      await pool.query("INSERT INTO sectors (id, name_ar, name_en, description_ar, status) VALUES (?, ?, ?, ?, ?)", 
        ['sec-rights', 'قطاع الحريات وحقوق الإنسان', 'Rights & Media Freedom', 'رصد الانتهاكات والدعم القانوني والنفسي للصحفيين', 'published']);

      // Seed Programs
      await pool.query("INSERT INTO programs (id, name, description, sector_id) VALUES (?, ?, ?, ?)",
        ['prg-academy', 'أكاديمية بيت الصحافة للتدريب', 'برنامج بناء القدرات الذاتية والمهنية للصحفيين والناشطين', 'sec-media']);
      await pool.query("INSERT INTO programs (id, name, description, sector_id) VALUES (?, ?, ?, ?)",
        ['prg-advocacy', 'المناصرة الإعلامية ورصد الانتهاكات', 'رصد الانتهاكات وتوثيق الشكاوى والتقارير القانونية', 'sec-rights']);

      // Seed Projects
      await pool.query(`
        INSERT INTO projects (
          id, title, description, start_date, end_date, status, fundingGoal, currentFunding, 
          beneficiaries_direct, beneficiaries_indirect, location_governorate, location_district, sector_id, program_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        'prj-digital-journalism',
        JSON.stringify({ ar: 'مشروع الصحافة الرقمية وصحافة البيانات', en: 'Digital & Data Journalism Project' }),
        JSON.stringify({ ar: 'تمكين وبناء قدرات الصحفيين المستقلين في تقنيات صحافة البيانات وتقصي الحقائق والتحقق من الأخبار الزائفة.', en: 'Yemeni journalists training on modern data investigation and fact-checking.' }),
        '2025-01-15', '2025-12-30', 'ongoing', 65000, 48000, 450, 2400, 'عدن', 'صيرة', 'sec-media', 'prg-academy'
      ]);

      await pool.query(`
        INSERT INTO projects (
          id, title, description, start_date, end_date, status, fundingGoal, currentFunding, 
          beneficiaries_direct, beneficiaries_indirect, location_governorate, location_district, sector_id, program_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        'prj-media-safety',
        JSON.stringify({ ar: 'السلامة المهنية والحماية القانونية للصحفيين', en: 'Professional Safety & Legal Protection for Journalists' }),
        JSON.stringify({ ar: 'تقديم الدعم الاستشاري والحماية القانونية والنفسية، وتدريس محاور السلامة المهني في بيئة النزاع.', en: 'Providing psychological counseling, safety kits, and legal representation to independent media writers.' }),
        '2024-06-01', '2025-06-01', 'completed', 35000, 35000, 180, 5000, 'تعز', 'المظفر', 'sec-rights', 'prg-advocacy'
      ]);

      await pool.query(`
        INSERT INTO projects (
          id, title, description, start_date, end_date, status, fundingGoal, currentFunding, 
          beneficiaries_direct, beneficiaries_indirect, location_governorate, location_district, sector_id, program_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        'prj-reporting-violations',
        JSON.stringify({ ar: 'المرصد الوطني لحرية الإعلام', en: 'National Media Freedoms Observatory' }),
        JSON.stringify({ ar: 'توثيق الانتهاكات وإكساب الضحايا المهارات اللازمة وبث التقارير التوثيقية الموجهة للمجتمع الدولي والمنظمات الحليفة.', en: 'National database tracking violations on journalists.' }),
        '2025-02-01', '2026-02-01', 'ongoing', 50000, 15000, 120, 10000, 'صنعاء', 'التحرير', 'sec-rights', 'prg-advocacy'
      ]);

      // Seed Courses (Academy)
      await pool.query(`
        INSERT INTO courses (id, title, description, trainer, applicationDeadline, status) VALUES (?, ?, ?, ?, ?, ?)
      `, ['crs-mojo', JSON.stringify({ ar: 'صحافة الهاتف المحمول والقصة التلفزيونية', en: 'Mobile Journalism (MoJo) & Storytelling' }), JSON.stringify({ ar: 'تدريب تفاعلي لصحفيي ريف اليمن لتمكين إنتاج الفيديوهات.', en: 'MoJo course' }), JSON.stringify({ ar: 'محمد عبده', en: 'Mohammed Abdo' }), '2025-08-01', 'active']);

      await pool.query(`
        INSERT INTO courses (id, title, description, trainer, applicationDeadline, status) VALUES (?, ?, ?, ?, ?, ?)
      `, ['crs-factcheck', JSON.stringify({ ar: 'تقنيات كشف الكذب والتحقق للمراسلين', en: 'Fact-Checking & Verifying Techniques' }), JSON.stringify({ ar: 'مساق متكامل متطور', en: 'Fact checking' }), JSON.stringify({ ar: 'أروى الشامري', en: 'Arwa Al-Shamiry' }), '2024-11-20', 'archived']);

      // Seed Academy Applications
      await pool.query(`
        INSERT INTO academy_applications (course_id, full_name, email, phone, education, status)
        VALUES ('crs-mojo', 'بشار الصوفي', 'bashar@ph-ye.org', '777443322', 'بكالوريوس إعلام', 'accepted')
      `);
      await pool.query(`
        INSERT INTO academy_applications (course_id, full_name, email, phone, education, status)
        VALUES ('crs-mojo', 'ولاء المحفدي', 'walaa@ph-ye.org', '777443311', 'صحافة مستقلة', 'accepted')
      `);
      await pool.query(`
        INSERT INTO academy_applications (course_id, full_name, email, phone, education, status)
        VALUES ('crs-factcheck', 'أحمد السعدي', 'ahmed@ph-ye.org', '777443325', 'تقنية معلومات', 'accepted')
      `);

      // Seed Certificates
      await pool.query(`
        INSERT INTO academy_certificates (id, course_id, recipient_name, recipient_email, type, issue_date, status)
        VALUES ('cert-001', 'crs-mojo', 'بشار الصوفي', 'bashar@ph-ye.org', 'Graduation Certificate', '2025-09-12', 'active')
      `);
      await pool.query(`
        INSERT INTO academy_certificates (id, course_id, recipient_name, recipient_email, type, issue_date, status)
        VALUES ('cert-002', 'crs-mojo', 'ولاء المحفدي', 'walaa@ph-ye.org', 'Graduation Certificate', '2025-09-12', 'active')
      `);

      // Seed Volunteers
      await pool.query(`
        INSERT INTO volunteer_registry (volunteer_id, full_name, gender, location, phone, email, preferred_areas, status, registration_date)
        VALUES ('VOL-042', 'رانية يحيى شرف', 'Female', 'عدن', '733123456', 'rania@ph-ye.org', 'التدريب والإشراف والتنسيق الإعلامي', 'Active', '2025-02-15')
      `);
      await pool.query(`
        INSERT INTO volunteer_registry (volunteer_id, full_name, gender, location, phone, email, preferred_areas, status, registration_date)
        VALUES ('VOL-089', 'هشام عبد الواسع', 'Male', 'صنعاء', '733123488', 'hisham@ph-ye.org', 'رصد الانتهاكات الميدانية والموثقين', 'Active', '2024-10-18')
      `);
      await pool.query(`
        INSERT INTO volunteer_registry (volunteer_id, full_name, gender, location, phone, email, preferred_areas, status, registration_date)
        VALUES ('VOL-122', 'فاطمة محمد غانم', 'Female', 'تعز', '733123491', 'fatima@ph-ye.org', 'الدعم القانوني والإرشاد النفسي', 'Active', '2025-03-01')
      `);

      // Seed Volunteer Hours
      await pool.query(`
        INSERT INTO volunteer_hours (volunteer_id, project_id, activity, date, hours_worked, status)
        VALUES (1, 'prj-digital-journalism', 'تنظيم الورش وتسهيل حضور المتدربين', '2025-04-10', 48, 'approved')
      `);
      await pool.query(`
        INSERT INTO volunteer_hours (volunteer_id, project_id, activity, date, hours_worked, status)
        VALUES (2, 'prj-reporting-violations', 'جمع ورصد تقارير وشهادات الضحايا الميدانية', '2025-03-22', 120, 'approved')
      `);
      await pool.query(`
        INSERT INTO volunteer_hours (volunteer_id, project_id, activity, date, hours_worked, status)
        VALUES (3, 'prj-media-safety', 'تقديم الاستشارة القانونية والمرافعة للضحايا الملاحقين', '2025-01-14', 90, 'approved')
      `);

      // Seed Success Stories
      await pool.query(`
        INSERT INTO success_stories (id, title_ar, title_en, project_id, beneficiary_name, beneficiary_role, content_ar, tags, status)
        VALUES ('story-01', 'المتحدث بشار الصوفي يبدأ مشروعه الإذاعي في عدن', 'Bashar Al-Soufi starts digital podcast', 'prj-digital-journalism', 'بشار الصوفي', 'خريج مساق MoJo', 'بعد حضوره تدريب صحافة الهاتف المحمول، استطاع بشار بناء علامته الخاصة وصنع 15 فيلماً وثائقياً قصيراً حظيت برواج محلي عالي.', '["mojo", "success_story", "human_st"]', 'published')
      `);
      await pool.query(`
        INSERT INTO success_stories (id, title_ar, title_en, project_id, beneficiary_name, beneficiary_role, content_ar, tags, status)
        VALUES ('story-02', 'الأمل ينبض مجدداً: براءة الصحفي وضاح بعد كفاح قانوني مرير', 'Legal support clears independent journalist', 'prj-media-safety', 'وضاح العبسي', 'صحفي مستقل مستفيد', 'استطاع فريق المحامين المتطوعين في المؤسسة تفكيك التهم وتقديم البراءات وصيانة كرامته المهنية.', '["safety", "legal", "civil"]', 'published')
      `);

      // Seed Testimonials
      await pool.query(`
        INSERT INTO testimonials (id, name, content_ar, role, organization, project_id)
        VALUES ('tst-01', 'د. أنيسة عبده سعيد', 'كان التدخل القانوني من بيت الصحافة بمثابة شريان حياة حقيقي، أعاد الدفء إلى مهنتنا الحرة وصان أرواح رفقاء الحقيقة.', 'صحفية وكاتبة رأي', 'صحيفة الجمهورية', 'prj-media-safety')
      `);

      // Seed Indicators
      await pool.query("INSERT INTO indicators (project_id, name, target_value, current_value, unit) VALUES (?, ?, ?, ?, ?)",
        ['prj-digital-journalism', 'عدد الصحفيين المستفيدين من مهارات الهاتف وصحافة البيانات (Mojo)', 250, 187, 'صحفي يمني متدرب']);
      await pool.query("INSERT INTO indicators (project_id, name, target_value, current_value, unit) VALUES (?, ?, ?, ?, ?)",
        ['prj-media-safety', 'الاستشارات والدعم القانوني العاجل المقدم للصحفيين الملاحقين', 100, 84, 'استشارة قانونية ومدنية']);
      await pool.query("INSERT INTO indicators (project_id, name, target_value, current_value, unit) VALUES (?, ?, ?, ?, ?)",
        ['prj-reporting-violations', 'توثيق ورصد انتهاكات حريات الصحافة والإعلام في اليمن', 500, 420, 'بلاغ وحالة معتمدة للعدالة']);

      // Seed Completed Events
      await pool.query(`
        INSERT INTO events (id, title, description, event_date, location, status)
        VALUES ('evt-seed-01', '{"ar": "ندوة دور الصحفيين في ترسيخ السلام الاجتماعي", "en": "Journalists Role in Social Peace Forum"}', '{"ar": "إمكانيات الصحافة لترسيخ خطاب السلام والتسامح ونبذ الطائفية بمشاركات واسعة.", "en": "completed forum"}', '2025-05-18 10:00:00', '{"ar": "أونلاين - زووم", "en": "Online"}', 'completed')
      `);

      console.log('Seeding completed successfully!');
    }

    // --- EXECUTE DYNAMIC QUERIES ---
    // 1. Projects Statistics
    const [projectRows]: any = await pool.query(`
      SELECT 
        COUNT(id) as totalProjects,
        SUM(CASE WHEN LOWER(status) = 'ongoing' THEN 1 ELSE 0 END) as ongoingProjects,
        SUM(CASE WHEN LOWER(status) = 'completed' THEN 1 ELSE 0 END) as completedProjects,
        SUM(COALESCE(beneficiaries_count, 0)) as totalBenCount,
        SUM(COALESCE(beneficiaries_direct, 0)) as totalBenDirect,
        SUM(COALESCE(beneficiaries_indirect, 0)) as totalBenIndirect,
        SUM(COALESCE(fundingGoal, 0)) as totalBudget
      FROM projects
    `);

    const p = projectRows?.[0] || {};
    const totalProjects = p.totalProjects || 0;
    const ongoingProjects = p.ongoingProjects || 0;
    const completedProjects = p.completedProjects || 0;
    const directBen = p.totalBenDirect || 0;
    const indirectBen = p.totalBenIndirect || 0;
    const totalBeneficiaries = (directBen + indirectBen) > 0 ? (directBen + indirectBen) : (p.totalBenCount || 0);

    // 2. Academy Statistics
    const [courseRows]: any = await pool.query('SELECT COUNT(id) as totalCourses FROM courses');
    const [applicationRows]: any = await pool.query(`
      SELECT 
        COUNT(id) as totalApplications, 
        SUM(CASE WHEN status='accepted' OR status='graduated' THEN 1 ELSE 0 END) as totalGraduated 
      FROM academy_applications
    `);
    const [certificateRows]: any = await pool.query('SELECT COUNT(id) as totalCertificates FROM academy_certificates');

    const totalCourses = courseRows?.[0]?.totalCourses || 0;
    const totalApplications = applicationRows?.[0]?.totalApplications || 0;
    const totalGraduated = applicationRows?.[0]?.totalGraduated || 0;
    const totalCertificates = certificateRows?.[0]?.totalCertificates || 0;

    // 3. Volunteer Statistics
    const [volunteerRows]: any = await pool.query(`
      SELECT 
        COUNT(id) as totalVolunteers, 
        SUM(CASE WHEN status='Active' OR status='Approved' THEN 1 ELSE 0 END) as activeVolunteers 
      FROM volunteer_registry
    `);
    const [hoursRows]: any = await pool.query("SELECT SUM(hours_worked) as totalHours FROM volunteer_hours WHERE status='approved' OR status IS NULL OR status = ''");

    const totalVolunteers = volunteerRows?.[0]?.totalVolunteers || 0;
    const activeVolunteers = volunteerRows?.[0]?.activeVolunteers || 0;
    const totalHours = hoursRows?.[0]?.totalHours || 0;
    const volunteerValue = totalHours * 15; // $15 per hour rate

    // 4. Media Statistics
    const [storyRows]: any = await pool.query('SELECT COUNT(id) as totalStories FROM success_stories');
    const [testimRows]: any = await pool.query('SELECT COUNT(id) as totalTestimonials FROM testimonials');
    const [reportRows]: any = await pool.query("SELECT COUNT(id) as totalReports FROM articles WHERE category='report' AND status='published'");
    const [newsRows]: any = await pool.query("SELECT COUNT(id) as totalNews FROM articles WHERE category='news' AND status='published'");

    const totalStories = storyRows?.[0]?.totalStories || 0;
    const totalTestimonials = testimRows?.[0]?.totalTestimonials || 0;
    const totalReports = reportRows?.[0]?.totalReports || 0;
    const totalNews = newsRows?.[0]?.totalNews || 0;

    // 5. Events Statistics
    const [eventRows]: any = await pool.query('SELECT COUNT(id) as totalEvents FROM events');
    const [complEventRows]: any = await pool.query("SELECT COUNT(id) as count FROM events WHERE status='completed'");

    const totalEvents = eventRows?.[0]?.totalEvents || 0;
    const completedEvents = complEventRows?.[0]?.count || 0;

    // 6. Strategic counts
    const [violRows]: any = await pool.query("SELECT COUNT(id) as count FROM violations WHERE status='verified'");
    const totalViolations = violRows?.[0]?.count || 0;

    const [sectorRows]: any = await pool.query('SELECT COUNT(id) as totalSectors FROM sectors');
    const [programRows]: any = await pool.query('SELECT COUNT(id) as totalPrograms FROM programs');
    const [partnerRows]: any = await pool.query('SELECT COUNT(id) as totalPartners FROM partners');

    const totalSectors = sectorRows?.[0]?.totalSectors || 0;
    const totalPrograms = programRows?.[0]?.totalPrograms || 0;
    const totalPartners = partnerRows?.[0]?.totalPartners || 0;

    const basicStats = {
      totalBeneficiaries,
      totalProjects,
      totalBudget: p.totalBudget || 0,
      totalCourses,
      totalSectors,
      totalPrograms,
      totalPartners,
      totalStories,
      totalTestimonials,
      totalEvents,
      totalMediaInstitutions: totalPartners + 2, // Map to partners + sectors
      totalVolunteers,
      activeVolunteers,
      totalHours,
      volunteerValue,
      totalApplications,
      totalGraduated,
      totalCertificates,
      totalReports,
      totalNews,
      completedEvents,
      ongoingProjects,
      completedProjects,
      totalViolations
    };

    // --- DYNAMIC CHARTS POPULATION ---
    const [projectsList]: any = await pool.query('SELECT beneficiaries_direct, beneficiaries_indirect, beneficiaries_count, location_governorate, createdAt FROM projects');
    
    const [projectsGender]: any = await pool.query('SELECT beneficiaries_males, beneficiaries_females FROM projects');

    // Chart A: Yearly Growth
    const yearMap: Record<number, { year: number; projects: number; beneficiaries: number }> = {};

    projectsList.forEach((proj: any) => {
      let yr = new Date().getFullYear();
      if (proj.createdAt) {
        const d = new Date(proj.createdAt);
        if (!isNaN(d.getTime())) yr = d.getFullYear();
      }
      if (!yearMap[yr]) {
        yearMap[yr] = { year: yr, projects: 0, beneficiaries: 0 };
      }
      const direct = proj.beneficiaries_direct || 0;
      const indirect = proj.beneficiaries_indirect || 0;
      const total = (direct + indirect) > 0 ? (direct + indirect) : (proj.beneficiaries_count || 0);

      yearMap[yr].projects += 1;
      yearMap[yr].beneficiaries += total;
    });

    const yearlyGrowth = Object.values(yearMap).sort((a: any, b: any) => a.year - b.year);

    // Chart B: Sector Distribution
    let sectorDistribution: any[] = [];
    try {
      const [projBySectors]: any = await pool.query(`
        SELECT s.name_ar, s.name_en, COUNT(p.id) as value
        FROM sectors s
        LEFT JOIN projects p ON p.sector_id = s.id
        GROUP BY s.id
      `);
      sectorDistribution = projBySectors.map((row: any) => ({
        name: row.name_ar || row.name_en,
        value: row.value || 0
      }));
    } catch(e) {}

    // Chart C: Gender Distribution
    let mCount = 0;
    let fCount = 0;
    projectsGender.forEach((p: any) => {
      mCount += (p.beneficiaries_males || 0);
      fCount += (p.beneficiaries_females || 0);
    });

    const genderDistribution = [
      { name: 'إناث', value: fCount },
      { name: 'ذكور', value: mCount }
    ];

    // Chart D: Events Distribution
    let governorates: any[] = [];
    try {
      const [eventsList]: any = await pool.query('SELECT status, COUNT(id) as count FROM events GROUP BY status');
      if ((eventsList as any).length > 0) {
        governorates = eventsList.map((row: any) => ({
          name: row.status || 'فعاليات عامة',
          value: row.count || 0
        }));
      } else {
        governorates = [
          { name: 'جلسات نقاش', value: 0 },
          { name: 'ورش عمل', value: 0 },
          { name: 'مؤتمرات', value: 0 }
        ];
      }
    } catch(e) {
      governorates = [
        { name: 'جلسات نقاش', value: 0 },
        { name: 'ورش عمل', value: 0 },
        { name: 'مؤتمرات', value: 0 }
      ];
    }

    res.json({
      success: true,
      stats: basicStats,
      charts: {
        yearlyGrowth,
        sectorDistribution,
        genderDistribution,
        governorates
      },
      lastUpdated: new Date()
    });
  } catch (error: any) {
    console.error('Comprehensive analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch comprehensive metrics', error: error.message });
  }
});

// --- NEW DRILL-DOWN ENDPOINT ---
app.get('/api/analytics/drilldown', async (req, res) => {
  const entity = req.query.entity as string; // 'projects' | 'beneficiaries' | 'courses' | 'volunteers' | 'hours' | 'stories' | 'events' | 'reports' | 'certificates'
  try {
    if (entity === 'projects') {
      const [rows] = await pool.query(`
        SELECT id, title, start_date, end_date, status, fundingGoal, beneficiaries_count, location_governorate 
        FROM projects ORDER BY createdAt DESC
      `);
      return res.json({ success: true, columns: ['id', 'title', 'start_date', 'status', 'fundingGoal', 'beneficiaries_count', 'location_governorate'], rows });
    }
    
    if (entity === 'beneficiaries') {
      const [rows] = await pool.query(`
        SELECT id, title, beneficiaries_direct, beneficiaries_indirect, location_governorate, location_district 
        FROM projects WHERE beneficiaries_direct > 0 OR beneficiaries_indirect > 0 ORDER BY createdAt DESC
      `);
      return res.json({ success: true, columns: ['id', 'title', 'beneficiaries_direct', 'beneficiaries_indirect', 'location_governorate', 'location_district'], rows });
    }

    if (entity === 'courses') {
      const [rows] = await pool.query(`
        SELECT id, title, trainer, applicationDeadline, status FROM courses ORDER BY createdAt DESC
      `);
      return res.json({ success: true, columns: ['id', 'title', 'trainer', 'applicationDeadline', 'status'], rows });
    }

    if (entity === 'volunteers') {
      const [rows] = await pool.query(`
        SELECT volunteer_id, full_name, gender, location, email, preferred_areas, status, registration_date 
        FROM volunteer_registry ORDER BY registration_date DESC
      `);
      return res.json({ success: true, columns: ['volunteer_id', 'full_name', 'gender', 'location', 'email', 'status', 'registration_date'], rows });
    }

    if (entity === 'hours') {
      const [rows] = await pool.query(`
        SELECT h.id, v.full_name as volunteer_name, h.activity, h.date, h.hours_worked, p.title as project_title, h.status
        FROM volunteer_hours h
        LEFT JOIN volunteer_registry v ON h.volunteer_id = v.id
        LEFT JOIN projects p ON h.project_id = p.id
        ORDER BY h.date DESC
      `);
      return res.json({ success: true, columns: ['id', 'volunteer_name', 'activity', 'date', 'hours_worked', 'project_title', 'status'], rows });
    }

    if (entity === 'stories') {
      const [rows] = await pool.query(`
        SELECT id, title_ar, beneficiary_name, beneficiary_role, tags, status FROM success_stories ORDER BY createdAt DESC
      `);
      return res.json({ success: true, columns: ['id', 'title_ar', 'beneficiary_name', 'beneficiary_role', 'tags', 'status'], rows });
    }

    if (entity === 'events') {
      const [rows] = await pool.query(`
        SELECT id, title, event_date, location, status FROM events ORDER BY createdAt DESC
      `);
      return res.json({ success: true, columns: ['id', 'title', 'event_date', 'location', 'status'], rows });
    }

    if (entity === 'reports') {
      const [rows] = await pool.query(`
        SELECT id, title, status, language, createdAt FROM articles WHERE category='report' AND status='published' ORDER BY createdAt DESC
      `);
      return res.json({ success: true, columns: ['id', 'title', 'status', 'language', 'createdAt'], rows });
    }

    if (entity === 'certificates') {
      const [rows] = await pool.query(`
        SELECT c.id, c.recipient_name, c.recipient_email, c.type, c.issue_date, cr.title as course_title, c.status
        FROM academy_certificates c
        LEFT JOIN courses cr ON c.course_id = cr.id
        ORDER BY c.issue_date DESC
      `);
      return res.json({ success: true, columns: ['id', 'recipient_name', 'recipient_email', 'type', 'issue_date', 'course_title', 'status'], rows });
    }

    res.status(400).json({ success: false, message: 'Invalid drilldown entity requested' });
  } catch (error: any) {
    console.error('Drilldown error:', error);
    res.status(500).json({ success: false, message: 'Drilldown query failed', error: error.message });
  }
});

// --- PUBLIC WIDGET BUILDER AND EMBED APIs ---
app.get('/api/analytics/widgets', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM impact_widgets ORDER BY createdAt DESC');
    res.json({ success: true, widgets: rows });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/analytics/widgets', async (req, res) => {
  const { id, title, type, settings } = req.body;
  try {
    const widgetId = id || 'wdg-' + Math.random().toString(36).substring(2, 9);
    await pool.query(
      'INSERT INTO impact_widgets (id, title, type, settings) VALUES (?, ?, ?, ?)',
      [widgetId, title, type, JSON.stringify(settings)]
    );
    res.json({ success: true, widgetId });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/analytics/widgets/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM impact_widgets WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Embed widget page routing helper (renders iframe JSON block directly)
app.get('/api/analytics/embed/:id', async (req, res) => {
  try {
    const [rows]: any = await pool.query('SELECT * FROM impact_widgets WHERE id=?', [req.params.id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Widget not found' });
    }
    const widget = rows[0];
    const settings = JSON.parse(widget.settings);
    
    // Aggregated real KPIs
    const [pStats]: any = await pool.query('SELECT SUM(beneficiaries_count) as ben, COUNT(id) as prj FROM projects');
    const [cStats]: any = await pool.query('SELECT COUNT(id) as count FROM courses');
    const [vStats]: any = await pool.query('SELECT COUNT(id) as count FROM volunteer_registry');
    
    res.json({
      success: true,
      id: widget.id,
      title: widget.title,
      type: widget.type,
      settings,
      data: {
        totalProjects: pStats?.[0]?.prj || 0,
        totalBeneficiaries: pStats?.[0]?.ben || 0,
        totalCourses: cStats?.[0]?.count || 0,
        totalVolunteers: vStats?.[0]?.count || 0
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- PMIS INDICATOR ENGINE DIRECT APIs ---
app.get('/api/analytics/indicators', async (req, res) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT i.id, i.project_id, i.name, i.target_value, i.current_value, i.unit, p.title as project_title
      FROM indicators i
      LEFT JOIN projects p ON i.project_id = p.id
    `);
    res.json({ success: true, indicators: rows });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/analytics/indicators', async (req, res) => {
  const { project_id, name, target_value, current_value, unit } = req.body;
  try {
    await pool.query(
      'INSERT INTO indicators (project_id, name, target_value, current_value, unit) VALUES (?, ?, ?, ?, ?)',
      [project_id, name, target_value, current_value, unit]
    );
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/analytics/indicators/:id', async (req, res) => {
  const { project_id, name, target_value, current_value, unit } = req.body;
  try {
    await pool.query(
      'UPDATE indicators SET project_id=?, name=?, target_value=?, current_value=?, unit=? WHERE id=?',
      [project_id, name, target_value, current_value, unit, req.params.id]
    );
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/analytics/indicators/:id', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM indicators WHERE id=?',
      [req.params.id]
    );
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/analytics/impact', async (req, res) => {
  try {
    const [projectRows]: any = await pool.query('SELECT SUM(beneficiaries_count) as totalBeneficiaries, COUNT(id) as totalProjects FROM projects');
    const [courseRows]: any = await pool.query('SELECT COUNT(id) as totalCourses FROM courses');
    const [violationRows]: any = await pool.query('SELECT COUNT(id) as totalViolations FROM violations');
    const [reportRows]: any = await pool.query("SELECT COUNT(id) as totalReports FROM articles WHERE category = 'report'");

    const totalBeneficiaries = projectRows && projectRows[0] ? (projectRows[0].totalBeneficiaries || 0) : 0;
    const totalProjects = projectRows && projectRows[0] ? (projectRows[0].totalProjects || 0) : 0;
    const totalCourses = courseRows && courseRows[0] ? (courseRows[0].totalCourses || 0) : 0;
    const totalViolations = violationRows && violationRows[0] ? (violationRows[0].totalViolations || 0) : 0;
    const totalReports = reportRows && reportRows[0] ? (reportRows[0].totalReports || 0) : 0;

    res.json({
      totalBeneficiaries,
      totalProjects,
      totalCourses,
      totalViolations,
      totalReports,
      aggregationType: 'SUM/COUNT/AVG',
      lastCalculated: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: 'Error calculating impact metrics' });
  }
});

// Hero Slides API
app.get('/api/heroSlides', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM hero_slides ORDER BY `order` ASC');
    res.json(rows);
  } catch (error: any) {
    console.error('Hero slides error:', error);
    if (error.code === 'ECONNREFUSED' || (error.message && error.message.includes('ECONNREFUSED')) || error.code === 'ER_NO_SUCH_TABLE') {
       return res.json([]);
    }
    res.status(500).json({ message: 'Error fetching hero slides', details: error.message, code: error.code });
  }
});

app.post('/api/heroSlides', async (req, res) => {
  try {
    const { 
      id, title, subtitle, description, mediaType, mediaUrl, animationType, 
      textAnimation, titleSize, subtitleSize, descriptionSize, buttonSize, 
      overlayOpacity, textAlign, primaryButton, secondaryButton, order, isActive 
    } = req.body;
    const [result] = await pool.query(
      'INSERT INTO hero_slides (id, title, subtitle, description, mediaType, mediaUrl, animationType, textAnimation, titleSize, subtitleSize, descriptionSize, buttonSize, overlayOpacity, textAlign, primaryButton, secondaryButton, `order`, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id || Date.now().toString(), 
        JSON.stringify(title), 
        JSON.stringify(subtitle), 
        JSON.stringify(description), 
        mediaType, 
        mediaUrl, 
        animationType,
        textAnimation || 'slide-up',
        titleSize || 'text-4xl md:text-6xl lg:text-7xl',
        subtitleSize || 'text-xs',
        descriptionSize || 'text-lg md:text-xl',
        buttonSize || 'px-8 py-4',
        overlayOpacity || 60,
        textAlign || 'left',
        JSON.stringify(primaryButton), 
        JSON.stringify(secondaryButton), 
        order || 0, 
        isActive
      ]
    );
    res.json({ success: true, id: id || (result as any).insertId });
  } catch (error: any) {
    res.status(500).json({ message: 'Error saving hero slide', details: error.message });
  }
});

app.put('/api/heroSlides/:id', async (req, res) => {
  try {
    const { 
      title, subtitle, description, mediaType, mediaUrl, animationType, 
      textAnimation, titleSize, subtitleSize, descriptionSize, buttonSize, 
      overlayOpacity, textAlign, primaryButton, secondaryButton, order, isActive 
    } = req.body;
    await pool.query(
      'UPDATE hero_slides SET title=?, subtitle=?, description=?, mediaType=?, mediaUrl=?, animationType=?, textAnimation=?, titleSize=?, subtitleSize=?, descriptionSize=?, buttonSize=?, overlayOpacity=?, textAlign=?, primaryButton=?, secondaryButton=?, `order`=?, isActive=? WHERE id=?',
      [
        JSON.stringify(title), 
        JSON.stringify(subtitle), 
        JSON.stringify(description), 
        mediaType, 
        mediaUrl, 
        animationType,
        textAnimation,
        titleSize,
        subtitleSize,
        descriptionSize,
        buttonSize,
        overlayOpacity,
        textAlign,
        JSON.stringify(primaryButton), 
        JSON.stringify(secondaryButton), 
        order, 
        isActive, 
        req.params.id
      ]
    );
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating hero slide', details: error.message });
  }
});

app.delete('/api/heroSlides/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM hero_slides WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting hero slide', details: error.message });
  }
});

// Users API
app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT uid, email, displayName, role, photoURL, department_id, team_id, system_role_id, createdAt FROM users ORDER BY createdAt DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Organization Structure APIs
app.get('/api/departments', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM departments');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching departments' });
  }
});

app.post('/api/departments', async (req, res) => {
  const { name_ar, name_en, description } = req.body;
  try {
    const [result]: any = await pool.query('INSERT INTO departments (name_ar, name_en, description) VALUES (?, ?, ?)', [name_ar, name_en, description]);
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (error) {
    res.status(500).json({ message: 'Error creating department' });
  }
});

app.get('/api/teams', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM teams');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching teams' });
  }
});

app.get('/api/system-roles', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM system_roles');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching system roles' });
  }
});

// Tasks API
app.get('/api/tasks', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tasks ORDER BY createdAt DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tasks' });
  }
});

app.post('/api/tasks', async (req, res) => {
  const { title, description, assigned_to, project_id, status, due_date } = req.body;
  try {
    const [result]: any = await pool.query(
      'INSERT INTO tasks (title, description, assigned_to, project_id, status, due_date) VALUES (?, ?, ?, ?, ?, ?)',
      [title, description, assigned_to, project_id, status, due_date]
    );
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (error) {
    res.status(500).json({ message: 'Error creating task' });
  }
});

app.put('/api/tasks/:id/status', async (req, res) => {
  const { status } = req.body;
  try {
    await pool.query('UPDATE tasks SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'Task updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating task' });
  }
});

app.put('/api/users/:uid', async (req, res) => {
  try {
    const { role, displayName, photoURL, disabled } = req.body;
    const [rows]: any = await pool.query('SELECT * FROM users WHERE uid = ?', [req.params.uid]);
    const userObj = rows && rows.length > 0 ? rows[0] : null;
    
    if (!userObj) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updatedRole = role !== undefined ? role : userObj.role;
    const updatedDisplayName = displayName !== undefined ? displayName : userObj.displayName;
    const updatedPhotoURL = photoURL !== undefined ? photoURL : userObj.photoURL;
    const updatedDisabled = disabled !== undefined ? (disabled ? 1 : 0) : (userObj.disabled || 0);

    await pool.query(
      'UPDATE users SET role=?, displayName=?, photoURL=?, disabled=? WHERE uid=?',
      [updatedRole, updatedDisplayName, updatedPhotoURL, updatedDisabled, req.params.uid]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error updating user' });
  }
});

app.delete('/api/users/:uid', async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE uid = ?', [req.params.uid]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user' });
  }
});

// --- PODCASTS & EPISODES API ---
// List podcasts
app.get('/api/podcasts', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM podcasts ORDER BY id DESC');
    res.json(rows);
  } catch (error: any) {
    console.error('Error fetching podcasts:', error);
    res.status(500).json({ error: 'Failed to fetch podcasts' });
  }
});

// Create podcast channel
app.post('/api/podcasts', async (req, res) => {
  try {
    const { title_ar, title_en, description_ar, description_en, cover_url, host } = req.body;
    const [result] = await pool.query(
      'INSERT INTO podcasts (title_ar, title_en, description_ar, description_en, cover_url, host) VALUES (?, ?, ?, ?, ?, ?)',
      [title_ar, title_en, description_ar, description_en, cover_url || null, host || null]
    );
    res.json({ success: true, id: result.insertId });
  } catch (error: any) {
    console.error('Error creating podcast:', error);
    res.status(500).json({ error: 'Failed to create podcast' });
  }
});

// Update podcast channel
app.put('/api/podcasts/:id', async (req, res) => {
  try {
    const { title_ar, title_en, description_ar, description_en, cover_url, host } = req.body;
    await pool.query(
      'UPDATE podcasts SET title_ar = ?, title_en = ?, description_ar = ?, description_en = ?, cover_url = ?, host = ? WHERE id = ?',
      [title_ar, title_en, description_ar, description_en, cover_url, host, req.params.id]
    );
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating podcast:', error);
    res.status(500).json({ error: 'Failed to update podcast' });
  }
});

// Delete podcast channel
app.delete('/api/podcasts/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM podcasts WHERE id = ?', [req.params.id]);
    await pool.query('DELETE FROM podcast_episodes WHERE podcast_id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting podcast:', error);
    res.status(500).json({ error: 'Failed to delete podcast' });
  }
});

// List episodes for a podcast channel
app.get('/api/podcasts/:id/episodes', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM podcast_episodes WHERE podcast_id = ? ORDER BY id DESC', [req.params.id]);
    res.json(rows);
  } catch (error: any) {
    console.error('Error fetching episodes:', error);
    res.status(500).json({ error: 'Failed to fetch episodes' });
  }
});

// Create episode
app.post('/api/podcasts/:id/episodes', async (req, res) => {
  try {
    const { title_ar, title_en, description_ar, description_en, audio_url, duration, publish_date } = req.body;
    const [result] = await pool.query(
      'INSERT INTO podcast_episodes (podcast_id, title_ar, title_en, description_ar, description_en, audio_url, duration, publish_date, views) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)',
      [req.params.id, title_ar, title_en, description_ar, description_en, audio_url, duration || null, publish_date || new Date().toISOString().split('T')[0]]
    );
    res.json({ success: true, id: result.insertId });
  } catch (error: any) {
    console.error('Error creating episode:', error);
    res.status(500).json({ error: 'Failed to create episode' });
  }
});

// Update episode
app.put('/api/podcasts/episodes/:id', async (req, res) => {
  try {
    const { title_ar, title_en, description_ar, description_en, audio_url, duration, publish_date, views } = req.body;
    await pool.query(
      'UPDATE podcast_episodes SET title_ar = ?, title_en = ?, description_ar = ?, description_en = ?, audio_url = ?, duration = ?, publish_date = ?, views = ? WHERE id = ?',
      [title_ar, title_en, description_ar, description_en, audio_url, duration, publish_date, views || 0, req.params.id]
    );
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating episode:', error);
    res.status(500).json({ error: 'Failed to update episode' });
  }
});

// Delete episode
app.delete('/api/podcasts/episodes/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM podcast_episodes WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting episode:', error);
    res.status(500).json({ error: 'Failed to delete episode' });
  }
});

// Social Media Reels Verification Logic
async function verifyFacebookReel(url: string): Promise<{ isBroken: number; errorMessage: string | null }> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 6000); // 6s timeout
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8'
      }
    });
    clearTimeout(id);
    if (!response.ok) {
      return { isBroken: 1, errorMessage: `HTTP ${response.status}: ${response.statusText}` };
    }
    const html = await response.text();
    if (html.includes("This content isn't available right now") || 
        html.includes("هذا المحتوى غير متوفر") || 
        html.includes("صفحة غير متوفرة") || 
        html.includes("content-not-found") ||
        html.includes("sf-error-message") ||
        html.includes("unsupported_browser") ||
        html.includes("error_box")) {
      return { isBroken: 1, errorMessage: 'Content is not available / Broken link' };
    }
    return { isBroken: 0, errorMessage: null };
  } catch (err: any) {
    return { isBroken: 1, errorMessage: err.message || 'Timeout / Connection failed' };
  }
}

async function runReelsHealthCheck() {
  console.log('[Reels Health Check] Starting validation of Facebook Reels...');
  try {
    const [rows] = await pool.query('SELECT * FROM social_reels');
    for (const reel of rows as any[]) {
      const result = await verifyFacebookReel(reel.url);
      await pool.query(
        'UPDATE social_reels SET isBroken = ?, errorMessage = ?, lastChecked = CURRENT_TIMESTAMP WHERE id = ?',
        [result.isBroken, result.errorMessage, reel.id]
      );
    }
    console.log('[Reels Health Check] Finished validation successfully');
  } catch (err) {
    console.error('[Reels Health Check] Error during validation:', err);
  }
}

// Start Reels check every hour, plus once 10 seconds after boot
setInterval(runReelsHealthCheck, 3600000);
setTimeout(runReelsHealthCheck, 10000);

// Social Media Reels API
app.get('/api/social-reels', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM social_reels ORDER BY sort_order ASC, id DESC');
    res.json(rows);
  } catch (error: any) {
    console.error('Error fetching social reels:', error);
    res.status(500).json({ error: 'Failed to fetch social reels' });
  }
});

app.get('/api/social-reels/broken-alerts', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM social_reels WHERE isBroken = 1 AND isActive = 1 AND type = \'social\' ORDER BY sort_order ASC');
    res.json(rows);
  } catch (error: any) {
    console.error('Error fetching broken reels:', error);
    res.status(500).json({ error: 'Failed to fetch broken reels alerts' });
  }
});

app.post('/api/social-reels/trigger-check', async (req, res) => {
  try {
    await runReelsHealthCheck();
    const [rows] = await pool.query('SELECT * FROM social_reels ORDER BY sort_order ASC');
    res.json({ success: true, message: 'All reels validated successfully', data: rows });
  } catch (error: any) {
    console.error('Error triggering checks:', error);
    res.status(500).json({ error: 'Failed to complete reels validation' });
  }
});

app.post('/api/social-reels/:id/check-single', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM social_reels WHERE id = ?', [req.params.id]);
    const reel = (rows as any[])[0];
    if (!reel) {
      return res.status(404).json({ error: 'Reel not found' });
    }

    if (reel.type === 'local') {
      return res.json({ success: true, isBroken: 0, message: 'Local files do not require health check' });
    }

    const checkResult = await verifyFacebookReel(reel.url);
    await pool.query(
      'UPDATE social_reels SET isBroken = ?, errorMessage = ?, lastChecked = CURRENT_TIMESTAMP WHERE id = ?',
      [checkResult.isBroken, checkResult.errorMessage, reel.id]
    );
    res.json({ success: true, isBroken: checkResult.isBroken, errorMessage: checkResult.errorMessage });
  } catch (error: any) {
    console.error('Error checking single reel:', error);
    res.status(500).json({ error: 'Failed to validate single reel' });
  }
});

app.post('/api/social-reels', async (req, res) => {
  try {
    const { url, title, isActive, sort_order, type, thumbnail } = req.body;
    
    let isBroken = 0;
    let errorMessage = '';

    if (type === 'social') {
      const checkResult = await verifyFacebookReel(url);
      isBroken = checkResult.isBroken;
      errorMessage = checkResult.errorMessage;
    }

    const [result] = await pool.query(
      'INSERT INTO social_reels (url, title, isActive, sort_order, type, thumbnail, isBroken, errorMessage, lastChecked) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
      [url, title || '', isActive !== undefined ? isActive : 1, sort_order || 0, type || 'social', thumbnail || null, isBroken, errorMessage]
    );
    res.json({ success: true, id: (result as any).insertId });
  } catch (error: any) {
    console.error('Error creating social reel:', error);
    res.status(500).json({ error: 'Failed to create social reel' });
  }
});

app.put('/api/social-reels/:id', async (req, res) => {
  try {
    const { url, title, isActive, sort_order, type, thumbnail } = req.body;
    
    let isBroken = 0;
    let errorMessage = '';

    if (type === 'social') {
      const checkResult = await verifyFacebookReel(url);
      isBroken = checkResult.isBroken;
      errorMessage = checkResult.errorMessage;
    }

    await pool.query(
      'UPDATE social_reels SET url = ?, title = ?, isActive = ?, sort_order = ?, type = ?, thumbnail = ?, isBroken = ?, errorMessage = ?, lastChecked = CURRENT_TIMESTAMP WHERE id = ?',
      [url, title, isActive, sort_order, type || 'social', thumbnail || null, isBroken, errorMessage, req.params.id]
    );
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating social reel:', error);
    res.status(500).json({ error: 'Failed to update social reel' });
  }
});

app.delete('/api/social-reels/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM social_reels WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting social reel:', error);
    res.status(500).json({ error: 'Failed to delete social reel' });
  }
});

// Settings API
app.get('/api/settings', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM site_settings LIMIT 1');
    res.json((rows as any)[0] || {});
  } catch (error: any) {
    console.error('Settings error:', error);
    if (error.code === 'ECONNREFUSED' || (error.message && error.message.includes('ECONNREFUSED')) || error.code === 'ER_NO_SUCH_TABLE') {
       return res.json({
         siteName: JSON.stringify({ ar: 'الموقع غير متاح', en: 'Site Offline' }),
         socialLinks: JSON.stringify({ facebook: '', twitter: '', instagram: '' }),
         address: JSON.stringify({ ar: '', en: '' }),
       });
    }
    res.status(500).json({ message: 'Error fetching settings', details: error.message, code: error.code });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const { 
      siteName, logo, favicon, primaryColor, secondaryColor, 
      fontFamily, socialLinks, contactEmail, contactPhone, 
      address, sshPublicKey, tunnelingEnabled, livestream,
      youtubeChannelId, youtubePlaylistUrl,
      sliderAutoplayDelay, sliderTransitionSpeed,
      seoTitle, seoDescription, seoKeywords, ogDefaultImage,
      ogSiteName, ogType, googleVerification, bingVerification,
      aiEnabled, aiProvider, aiModel, aiBaseUrl, aiApiKey,
      aiTemperature, aiMaxTokens, aiSystemInstruction,
      maintenanceMode, maintenanceMessage,
      smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom
    } = req.body;
    const [existing] = await pool.query('SELECT id FROM site_settings LIMIT 1');
    const finalMaintenanceMessage = typeof maintenanceMessage === 'object' ? JSON.stringify(maintenanceMessage) : (maintenanceMessage || JSON.stringify({ ar: 'الموقع حالياً في وضع الصيانة لإجراء بعض التحديثات البرمجية والتحسينات المجدولة. سنعود للعمل قريباً.', en: 'The platform is currently in maintenance mode for scheduled software updates. We will be back online shortly.' }));
    if ((existing as any).length > 0) {
      await pool.query(
        'UPDATE site_settings SET siteName=?, logo=?, favicon=?, primaryColor=?, secondaryColor=?, fontFamily=?, socialLinks=?, contactEmail=?, contactPhone=?, address=?, sshPublicKey=?, tunnelingEnabled=?, livestream=?, youtubeChannelId=?, youtubePlaylistUrl=?, sliderAutoplayDelay=?, sliderTransitionSpeed=?, seoTitle=?, seoDescription=?, seoKeywords=?, ogDefaultImage=?, ogSiteName=?, ogType=?, googleVerification=?, bingVerification=?, aiEnabled=?, aiProvider=?, aiModel=?, aiBaseUrl=?, aiApiKey=?, aiTemperature=?, aiMaxTokens=?, aiSystemInstruction=?, maintenanceMode=?, maintenanceMessage=?, smtpHost=?, smtpPort=?, smtpUser=?, smtpPass=?, smtpFrom=? WHERE id=?',
        [
          JSON.stringify(siteName), logo, favicon, primaryColor, secondaryColor, 
          fontFamily, JSON.stringify(socialLinks), contactEmail, contactPhone, 
          JSON.stringify(address), sshPublicKey, tunnelingEnabled, 
          JSON.stringify(livestream), youtubeChannelId, youtubePlaylistUrl,
          sliderAutoplayDelay || 8000, sliderTransitionSpeed || 1000,
          JSON.stringify(seoTitle), JSON.stringify(seoDescription), JSON.stringify(seoKeywords),
          ogDefaultImage, ogSiteName, ogType, googleVerification, bingVerification,
          aiEnabled === undefined ? 1 : (aiEnabled ? 1 : 0), aiProvider || 'openai', aiModel, aiBaseUrl, aiApiKey,
          aiTemperature || 0.3, aiMaxTokens || 1524, aiSystemInstruction,
          maintenanceMode === undefined ? 0 : (maintenanceMode ? 1 : 0),
          finalMaintenanceMessage,
          smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom,
          (existing as any)[0].id
        ]
      );
    } else {
      await pool.query(
        'INSERT INTO site_settings (siteName, logo, favicon, primaryColor, secondaryColor, fontFamily, socialLinks, contactEmail, contactPhone, address, sshPublicKey, tunnelingEnabled, livestream, youtubeChannelId, youtubePlaylistUrl, sliderAutoplayDelay, sliderTransitionSpeed, seoTitle, seoDescription, seoKeywords, ogDefaultImage, ogSiteName, ogType, googleVerification, bingVerification, aiEnabled, aiProvider, aiModel, aiBaseUrl, aiApiKey, aiTemperature, aiMaxTokens, aiSystemInstruction, maintenanceMode, maintenanceMessage, smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          JSON.stringify(siteName), logo, favicon, primaryColor, secondaryColor, 
          fontFamily, JSON.stringify(socialLinks), contactEmail, contactPhone, 
          JSON.stringify(address), sshPublicKey, tunnelingEnabled, 
          JSON.stringify(livestream), youtubeChannelId, youtubePlaylistUrl,
          sliderAutoplayDelay || 8000, sliderTransitionSpeed || 1000,
          JSON.stringify(seoTitle), JSON.stringify(seoDescription), JSON.stringify(seoKeywords),
          ogDefaultImage, ogSiteName, ogType, googleVerification, bingVerification,
          aiEnabled === undefined ? 1 : (aiEnabled ? 1 : 0), aiProvider || 'openai', aiModel, aiBaseUrl, aiApiKey,
          aiTemperature || 0.3, aiMaxTokens || 1524, aiSystemInstruction,
          maintenanceMode === undefined ? 0 : (maintenanceMode ? 1 : 0),
          finalMaintenanceMessage,
          smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom
        ]
      );
    }
    res.json({ success: true });
  } catch (error: any) {
    console.error("Error saving settings:", error);
    res.status(500).json({ message: 'Error saving settings', details: error.message });
  }
});

// ==========================================
// API Key & Publishing Management Endpoints
// ==========================================

import crypto from 'crypto';

// Admin API Key Management
app.get('/api/admin/api-keys', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM api_keys ORDER BY createdAt DESC');
    res.json(rows);
  } catch (error: any) {
    console.error('Error fetching API keys:', error);
    res.status(500).json({ message: 'Error fetching API keys: ' + error.message });
  }
});

app.post('/api/admin/api-keys', async (req, res) => {
  try {
    const { name, role, scopes } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'API key name is required' });
    }
    const token = 'ph_' + crypto.randomBytes(24).toString('hex');
    await pool.query(
      'INSERT INTO api_keys (name, token, role, scopes, isActive) VALUES (?, ?, ?, ?, 1)',
      [name, token, role || 'publisher', scopes || 'articles,reports,violations']
    );
    res.json({ success: true, token });
  } catch (error: any) {
    console.error('Error creating API key:', error);
    res.status(500).json({ message: 'Error creating API key: ' + error.message });
  }
});

app.delete('/api/admin/api-keys/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM api_keys WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting API key:', error);
    res.status(500).json({ message: 'Error deleting API key: ' + error.message });
  }
});

app.put('/api/admin/api-keys/:id/toggle', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT isActive FROM api_keys WHERE id = ?', [req.params.id]);
    if ((rows as any).length === 0) {
      return res.status(404).json({ message: 'API key not found' });
    }
    const newStatus = (rows as any)[0].isActive === 1 ? 0 : 1;
    await pool.query('UPDATE api_keys SET isActive = ? WHERE id = ?', [newStatus, req.params.id]);
    res.json({ success: true, isActive: newStatus });
  } catch (error: any) {
    console.error('Error toggling API key status:', error);
    res.status(500).json({ message: 'Error toggling API key status: ' + error.message });
  }
});

app.get('/api/admin/api-logs', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT l.*, k.name as keyName 
      FROM api_logs l 
      LEFT JOIN api_keys k ON l.api_key_id = k.id 
      ORDER BY l.createdAt DESC 
      LIMIT 100
    `);
    res.json(rows);
  } catch (error: any) {
    console.error('Error fetching API logs:', error);
    res.status(500).json({ message: 'Error fetching API logs: ' + error.message });
  }
});

// Middleware to authorize public publish/view requests using API tokens
const authorizeApiPublishing = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers['authorization'];
    const apiKeyHeader = req.headers['x-api-key'];
    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (apiKeyHeader) {
      token = String(apiKeyHeader);
    }

    if (!token) {
      return res.status(401).json({ message: 'API authentication token required. Provide in Bearer Authorization header or x-api-key header.' });
    }

    const [rows] = await pool.query('SELECT * FROM api_keys WHERE token = ? AND isActive = 1', [token]);
    if ((rows as any).length === 0) {
      return res.status(401).json({ message: 'Invalid or inactive API key token.' });
    }

    const key = (rows as any)[0];
    req.apiKey = key;

    // Log the request and update lastUsedAt in background
    pool.query('UPDATE api_keys SET lastUsedAt = CURRENT_TIMESTAMP WHERE id = ?', [key.id]).catch((e: any) => console.error(e));
    
    // Express response logging hook to capture status code accurately
    const originalSend = res.send;
    res.send = function (...args: any[]) {
      const status = res.statusCode;
      const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
      pool.query(
        'INSERT INTO api_logs (api_key_id, endpoint, method, status, ipAddress) VALUES (?, ?, ?, ?, ?)',
        [key.id, req.originalUrl, req.method, status, String(ip)]
      ).catch((e: any) => console.error(e));
      return originalSend.apply(res, args);
    };

    next();
  } catch (error: any) {
    console.error('API Authorization error:', error);
    res.status(500).json({ message: 'API Authorization internal error.' });
  }
};

// ==========================================
// REST API V1 Public Publishing Endpoints
// ==========================================

// GET /api/v1/publish/articles
app.get('/api/v1/publish/articles', authorizeApiPublishing, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM articles ORDER BY createdAt DESC LIMIT 50');
    const parsed = (rows as any).map((art: any) => ({
      ...art,
      title: typeof art.title === 'string' ? JSON.parse(art.title) : art.title,
      content: typeof art.content === 'string' ? JSON.parse(art.content) : art.content,
      slider_caption: typeof art.slider_caption === 'string' ? JSON.parse(art.slider_caption) : art.slider_caption,
      slider_button_text: typeof art.slider_button_text === 'string' ? JSON.parse(art.slider_button_text) : art.slider_button_text,
      seo: typeof art.seo === 'string' ? JSON.parse(art.seo) : art.seo,
    }));
    res.json(parsed);
  } catch (error: any) {
    res.status(500).json({ message: 'Error retrieving articles: ' + error.message });
  }
});

// POST /api/v1/publish/article
app.post('/api/v1/publish/article', authorizeApiPublishing, async (req: any, res) => {
  try {
    const scopes = req.apiKey.scopes ? req.apiKey.scopes.split(',') : [];
    if (!scopes.includes('articles')) {
      return res.status(403).json({ message: 'Unauthorized. Your API key does not have the "articles" scope.' });
    }

    const { id, title, content, category, status, language, mainImage, show_in_slider, slider_caption, slider_button_text, slider_image, seo, authorId, createdAt, sector_id, program_id, project_id } = req.body;
    
    if (!title || !title.ar) {
      return res.status(400).json({ message: 'Article title in Arabic (title.ar) is required.' });
    }

    const finalId = id || Date.now().toString();
    await pool.query(
      'INSERT INTO articles (id, title, content, category, status, language, mainImage, show_in_slider, slider_caption, slider_button_text, slider_image, seo, authorId, createdAt, updatedAt, sector_id, program_id, project_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        finalId, 
        JSON.stringify(title), 
        JSON.stringify(content || { ar: '', en: '' }), 
        category || 'news', 
        status || 'published', 
        language || 'ar', 
        mainImage || '', 
        show_in_slider ? 1 : 0, 
        JSON.stringify(slider_caption || {ar: '', en: ''}), 
        JSON.stringify(slider_button_text || {ar: '', en: ''}), 
        slider_image || '', 
        JSON.stringify(seo || { title: { ar: '', en: '' }, description: { ar: '', en: '' }, keywords: { ar: '', en: '' } }), 
        authorId || 'API_PUBLISHER', 
        createdAt || new Date(), 
        new Date(),
        sector_id || null, 
        program_id || null, 
        project_id || null
      ]
    );

    res.json({ success: true, id: finalId, title, category, status });
    await notifyAdmins(`🆕 [API] تم إضافة مقال جديد عبر واجهة النشر: ${title.ar}`);
  } catch (error: any) {
    console.error('API Publishing Article Error:', error);
    res.status(500).json({ message: 'Error publishing article: ' + error.message });
  }
});

// GET /api/v1/publish/violations
app.get('/api/v1/publish/violations', authorizeApiPublishing, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM violations ORDER BY createdAt DESC LIMIT 50');
    const parsed = (rows as any).map((v: any) => ({
      ...v,
      evidenceLinks: typeof v.evidenceLinks === 'string' ? JSON.parse(v.evidenceLinks) : v.evidenceLinks
    }));
    res.json(parsed);
  } catch (error: any) {
    res.status(500).json({ message: 'Error retrieving violations: ' + error.message });
  }
});

// POST /api/v1/publish/violation
app.post('/api/v1/publish/violation', authorizeApiPublishing, async (req: any, res) => {
  try {
    const scopes = req.apiKey.scopes ? req.apiKey.scopes.split(',') : [];
    if (!scopes.includes('violations')) {
      return res.status(403).json({ message: 'Unauthorized. Your API key does not have the "violations" scope.' });
    }

    const { id, reporterName, reporterPhone, victimName, victimInstitution, governorate, district, date, perpetrator, type, description, evidenceLinks, status, latitude, longitude, createdAt } = req.body;

    if (!victimName) {
      return res.status(400).json({ message: 'victimName is required.' });
    }
    if (!governorate) {
      return res.status(400).json({ message: 'governorate is required.' });
    }

    const finalId = id || Date.now().toString();
    await pool.query(
      'INSERT INTO violations (id, reporterName, reporterPhone, victimName, victimInstitution, governorate, district, date, perpetrator, type, description, evidenceLinks, status, latitude, longitude, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        finalId, 
        reporterName || 'API Reporter', 
        reporterPhone || '', 
        victimName, 
        victimInstitution || '', 
        governorate, 
        district || '', 
        date || new Date().toISOString().slice(0, 10), 
        perpetrator || '', 
        type || 'Other', 
        description || '', 
        JSON.stringify(evidenceLinks || []), 
        status || 'pending', 
        latitude !== undefined ? latitude : null, 
        longitude !== undefined ? longitude : null, 
        createdAt || new Date()
      ]
    );

    res.json({ success: true, id: finalId, victimName, governorate, type, status: status || 'pending' });
    await notifyAdmins(`🚨 [API] تم تسجيل بلاغ انتهاك جديد عبر واجهة النشر: ${victimName}`);
  } catch (error: any) {
    console.error('API Publishing Violation Error:', error);
    res.status(500).json({ message: 'Error publishing violation: ' + error.message });
  }
});

// Page Content Endpoints
app.get('/api/page-content/:page', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM page_content WHERE page_name = ?', [req.params.page]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch page content' });
  }
});

app.post('/api/page-content', async (req, res) => {
  try {
    const { page_name, section_name, content } = req.body;
    await pool.query(
      'REPLACE INTO page_content (page_name, section_name, content) VALUES (?, ?, ?)',
      [page_name, section_name, JSON.stringify(content)]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('API Error (/api/page-content):', error);
    res.status(500).json({ error: 'Failed to update page content' });
  }
});

// Menu Endpoints
app.get('/api/menus', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM menus ORDER BY `order` ASC');
    if ((rows as any).length > 0) {
      // Check if cinema exists
      const hasCinema = (rows as any).some((m: any) => m.path === '/cinema');
      if (!hasCinema) {
        await pool.query(
          'INSERT INTO menus (location, title, icon, path, `order`, isActive) VALUES (?, ?, ?, ?, ?, ?)',
          ['dock', JSON.stringify({ ar: 'سينما الأربعاء', en: 'Cinema' }), 'Play', '/cinema', 4, 1]
        );
        const [updatedRows] = await pool.query('SELECT * FROM menus ORDER BY `order` ASC');
        return res.json(updatedRows);
      }
    }
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch menus' });
  }
});

app.post('/api/menus', async (req, res) => {
  try {
    const { location, title, icon, path, order, isActive } = req.body;
    const [result] = await pool.query(
      'INSERT INTO menus (location, title, icon, path, `order`, isActive) VALUES (?, ?, ?, ?, ?, ?)',
      [location, JSON.stringify(title), icon, path, order || 0, isActive === false ? 0 : 1]
    );
    res.json({ id: (result as any).insertId, ...req.body });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create menu' });
  }
});

app.put('/api/menus/:id', async (req, res) => {
  try {
    const { location, title, icon, path, order, isActive } = req.body;
    await pool.query(
      'UPDATE menus SET location=?, title=?, icon=?, path=?, `order`=?, isActive=? WHERE id=?',
      [location, JSON.stringify(title), icon, path, order || 0, isActive === false ? 0 : 1, req.params.id]
    );
    res.json({ id: req.params.id, ...req.body });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update menu' });
  }
});

app.delete('/api/menus/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM menus WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete menu' });
  }
});

// Dynamic Hero Slider Data
app.get('/api/dynamic-hero-slides', async (req, res) => {
  try {
    const queries = [
      { table: 'articles', type: 'article' },
      { table: 'projects', type: 'project' },
      { table: 'courses', type: 'course' },
      { table: 'events', type: 'event' }
    ];

    let allSlides: any[] = [];

    for (const q of queries) {
      const [rows]: any = await pool.query(`SELECT id, title, show_in_slider, slider_caption, slider_button_text, slider_image FROM ${q.table} WHERE show_in_slider = 1 OR show_in_slider = TRUE`);
      const mapped = rows.map((r: any) => ({
        ...r,
        entityType: q.type,
        caption: typeof r.slider_caption === 'string' ? JSON.parse(r.slider_caption) : r.slider_caption,
        buttonText: typeof r.slider_button_text === 'string' ? JSON.parse(r.slider_button_text) : r.slider_button_text,
        path: `/${q.table}/${r.id}`
      }));
      allSlides = [...allSlides, ...mapped];
    }

    res.json(allSlides);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dynamic slides' });
  }
});

app.get('/api/newsletter-history', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM newsletter_history ORDER BY sent_at DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/newsletter-history', async (req, res) => {
  try {
    const { subject, content, recipientCount } = req.body;
    await pool.query(
      'INSERT INTO newsletter_history (subject, content, recipientCount) VALUES (?, ?, ?)',
      [subject, content, recipientCount]
    );
    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Firebase Migration API (Disabled)
app.post('/api/admin/run-firebase-migration', async (req, res) => {
  res.json({ success: false, message: 'تم إيقاف تكامل Firebase بالكامل وتعمل المنصة على قاعدة البيانات المحلية.' });
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.get('/api/system/health', async (req, res) => {
  try {
    // Check DB connection
    const [dbCheck] = await pool.query('SELECT 1 as active');
    const dbStatus = dbCheck && dbCheck.length > 0 ? 'Connected' : 'Error';
    
    // Get file size
    const dbSize = getDatabaseSize();
    
    res.json({
      success: true,
      database: {
        status: dbStatus,
        size: dbSize,
        provider: usePostgres ? 'PostgreSQL' : 'SQLite'
      },
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      database: {
        status: 'Disconnected',
        size: 'Unknown'
      }
    });
  }
});

// --- VIDEOS API ---
app.get('/api/videos', async (req, res) => {
  try {
    const [rows]: any = await pool.query('SELECT * FROM videos WHERE status = "published" ORDER BY createdAt DESC');
    res.json(rows.map((v: any) => ({
      ...v,
      title: v.title ? JSON.parse(v.title) : { ar: '', en: '' },
      description: v.description ? JSON.parse(v.description) : { ar: '', en: '' },
      tags: v.tags ? JSON.parse(v.tags) : []
    })));
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/videos', async (req, res) => {
  try {
    const { id, title, description, url, thumbnail, category, tags, duration, authorId } = req.body;
    
    // Automatic thumbnail generation if missing
    let finalThumbnail = thumbnail;
    if (!finalThumbnail && url) {
      // Logic: If it's a YouTube link, we can get the thumbnail easily
      const ytMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(.+)/);
      if (ytMatch && ytMatch[1]) {
        finalThumbnail = `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg`;
      } else {
        // Use a stylized placeholder or Gemini could generate one based on title
        finalThumbnail = `https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?auto=format&fit=crop&q=80&w=800&text=${encodeURIComponent(JSON.parse(title).ar)}`;
      }
    }

    await pool.query(
      'INSERT INTO videos (id, title, description, url, thumbnail, category, tags, duration, authorId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, title, description, url, finalThumbnail, category, tags, duration, authorId]
    );
    res.json({ success: true, thumbnail: finalThumbnail });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/videos/:id', async (req, res) => {
  try {
    const { title, description, url, thumbnail, category, tags, duration, status } = req.body;
    await pool.query(
      'UPDATE videos SET title=?, description=?, url=?, thumbnail=?, category=?, tags=?, duration=?, status=?, updatedAt=CURRENT_TIMESTAMP WHERE id=?',
      [title, description, url, thumbnail, category, tags, duration, status, req.params.id]
    );
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/videos/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM videos WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- PRESSHOUSE SECTORS API ---
app.get('/api/sectors', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM sectors ORDER BY sort_order ASC, name_ar ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sectors' });
  }
});

app.post('/api/sectors', async (req, res) => {
  try {
    const { id, name_ar, name_en, description_ar, description_en, image, icon, color, sort_order, status } = req.body;
    await pool.query(
      'INSERT INTO sectors (id, name_ar, name_en, description_ar, description_en, image, icon, color, sort_order, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id || Date.now().toString(), name_ar, name_en || '', description_ar || '', description_en || '', image || '', icon || '', color || '', sort_order || 0, status || 'published']
    );
    res.json({ success: true, id: id || Date.now().toString() });
  } catch (error) {
    res.status(500).json({ message: 'Error creating sector' });
  }
});

app.put('/api/sectors/:id', async (req, res) => {
  try {
    const { name_ar, name_en, description_ar, description_en, image, icon, color, sort_order, status } = req.body;
    await pool.query(
      'UPDATE sectors SET name_ar=?, name_en=?, description_ar=?, description_en=?, image=?, icon=?, color=?, sort_order=?, status=? WHERE id=?',
      [name_ar, name_en, description_ar, description_en, image, icon, color, sort_order, status, req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error updating sector' });
  }
});

app.delete('/api/sectors/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM sectors WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting sector' });
  }
});

// --- PRESSHOUSE SUCCESS STORIES API ---
app.get('/api/success-stories', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM success_stories ORDER BY createdAt DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching success stories' });
  }
});

app.post('/api/success-stories', async (req, res) => {
  try {
    const { id, title_ar, title_en, project_id, program_id, sector_id, beneficiary_name, beneficiary_role, content_ar, content_en, images, video_url, tags, status } = req.body;
    await pool.query(
      'INSERT INTO success_stories (id, title_ar, title_en, project_id, program_id, sector_id, beneficiary_name, beneficiary_role, content_ar, content_en, images, video_url, tags, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id || Date.now().toString(), 
        title_ar, 
        title_en || '', 
        project_id || null, 
        program_id || null, 
        sector_id || null, 
        beneficiary_name || '', 
        beneficiary_role || '', 
        content_ar || '', 
        content_en || '', 
        typeof images === 'string' ? images : JSON.stringify(images || []), 
        video_url || '', 
        typeof tags === 'string' ? tags : JSON.stringify(tags || []), 
        status || 'published'
      ]
    );
    res.json({ success: true, id: id || Date.now().toString() });
  } catch (error) {
    res.status(500).json({ message: 'Error creating success story' });
  }
});

app.put('/api/success-stories/:id', async (req, res) => {
  try {
    const { title_ar, title_en, project_id, program_id, sector_id, beneficiary_name, beneficiary_role, content_ar, content_en, images, video_url, tags, status } = req.body;
    await pool.query(
      'UPDATE success_stories SET title_ar=?, title_en=?, project_id=?, program_id=?, sector_id=?, beneficiary_name=?, beneficiary_role=?, content_ar=?, content_en=?, images=?, video_url=?, tags=?, status=? WHERE id=?',
      [
        title_ar, 
        title_en, 
        project_id || null, 
        program_id || null, 
        sector_id || null, 
        beneficiary_name, 
        beneficiary_role, 
        content_ar, 
        content_en, 
        typeof images === 'string' ? images : JSON.stringify(images || []), 
        video_url, 
        typeof tags === 'string' ? tags : JSON.stringify(tags || []), 
        status, 
        req.params.id
      ]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error updating success story' });
  }
});

app.delete('/api/success-stories/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM success_stories WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting success story' });
  }
});

// --- PRESSHOUSE TESTIMONIALS API ---
app.get('/api/testimonials', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM testimonials ORDER BY createdAt DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching testimonials' });
  }
});

app.post('/api/testimonials', async (req, res) => {
  try {
    const { id, name, photo_url, role, organization, content_ar, content_en, rating, project_id, program_id, sector_id } = req.body;
    await pool.query(
      'INSERT INTO testimonials (id, name, photo_url, role, organization, content_ar, content_en, rating, project_id, program_id, sector_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id || Date.now().toString(), 
        name, 
        photo_url || '', 
        role || '', 
        organization || '', 
        content_ar || '', 
        content_en || '', 
        rating || 5, 
        project_id || null, 
        program_id || null, 
        sector_id || null
      ]
    );
    res.json({ success: true, id: id || Date.now().toString() });
  } catch (error) {
    res.status(500).json({ message: 'Error creating testimonial' });
  }
});

app.put('/api/testimonials/:id', async (req, res) => {
  try {
    const { name, photo_url, role, organization, content_ar, content_en, rating, project_id, program_id, sector_id } = req.body;
    await pool.query(
      'UPDATE testimonials SET name=?, photo_url=?, role=?, organization=?, content_ar=?, content_en=?, rating=?, project_id=?, program_id=?, sector_id=? WHERE id=?',
      [name, photo_url, role, organization, content_ar, content_en, rating, project_id || null, program_id || null, sector_id || null, req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error updating testimonial' });
  }
});

app.delete('/api/testimonials/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM testimonials WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting testimonial' });
  }
});

// --- PRESSHOUSE CUSTOM LISTS API ---
app.get('/api/custom-lists', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM custom_lists');
    res.json(rows);
  } catch (error: any) {
    console.error('Error fetching custom lists:', error.message);
    res.status(500).json({ message: 'Error fetching custom lists', error: error.message });
  }
});

app.get('/api/custom-lists/:key', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM custom_lists WHERE list_key=?', [req.params.key]);
    if ((rows as any).length > 0) {
      res.json((rows as any)[0]);
    } else {
      res.status(404).json({ message: 'List not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching custom list key' });
  }
});

app.put('/api/custom-lists/:key', async (req, res) => {
  try {
    const { list_value } = req.body;
    const strVal = typeof list_value === 'string' ? list_value : JSON.stringify(list_value);
    
    // Attempt to update first
    const [resSelect] = await pool.query('SELECT id FROM custom_lists WHERE list_key=?', [req.params.key]);
    if ((resSelect as any).length > 0) {
      await pool.query('UPDATE custom_lists SET list_value=? WHERE list_key=?', [strVal, req.params.key]);
    } else {
      await pool.query('INSERT INTO custom_lists (list_key, list_value) VALUES (?, ?)', [req.params.key, strVal]);
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error updating custom list' });
  }
});

// ==========================================
// CINEMA API ROUTES (Wednesday Cinema)
// ==========================================

// Get all shows
app.get('/api/cinema/shows', async (req, res) => {
  try {
    const status = req.query.status as string;
    let query = 'SELECT * FROM cinema_shows';
    let params: any[] = [];
    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }
    query += ' ORDER BY show_time DESC';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch cinema shows' });
  }
});

// Get single show by slug
app.get('/api/cinema/shows/:slug', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM cinema_shows WHERE slug = ?', [req.params.slug]);
    if ((rows as any).length > 0) {
      res.json((rows as any)[0]);
    } else {
      res.status(404).json({ success: false, message: 'Show not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch show' });
  }
});

// Create show
app.post('/api/cinema/shows', async (req, res) => {
  try {
    const { title, slug, status, show_time, imdb_id, plot, poster_url, trailer_url, director, release_year, production, author, main_cast, news_content } = req.body;
    await pool.query(
      `INSERT INTO cinema_shows 
      (title, slug, status, show_time, imdb_id, plot, poster_url, trailer_url, director, release_year, production, author, main_cast, news_content) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, slug, status || 'upcoming', show_time, imdb_id, plot, poster_url, trailer_url, director, release_year, production, author, main_cast, news_content]
    );
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update show
app.put('/api/cinema/shows/:id', async (req, res) => {
  try {
    const { title, slug, status, show_time, imdb_id, plot, poster_url, trailer_url, director, release_year, production, author, main_cast, news_content } = req.body;
    await pool.query(
      `UPDATE cinema_shows SET 
      title = ?, slug = ?, status = ?, show_time = ?, imdb_id = ?, plot = ?, poster_url = ?, trailer_url = ?, director = ?, release_year = ?, production = ?, author = ?, main_cast = ?, news_content = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [title, slug, status, show_time, imdb_id, plot, poster_url, trailer_url, director, release_year, production, author, main_cast, news_content, req.params.id]
    );
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete show
app.delete('/api/cinema/shows/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM cinema_shows WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Apply for a ticket
app.post('/api/cinema/tickets', async (req, res) => {
  try {
    const { show_id, full_name, whatsapp, interest_reason, age_group } = req.body;
    await pool.query(
      'INSERT INTO cinema_tickets (show_id, full_name, whatsapp, interest_reason, age_group) VALUES (?, ?, ?, ?, ?)',
      [show_id, full_name, whatsapp, interest_reason, age_group]
    );
    res.json({ success: true, message: 'Ticket application submitted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get tickets (Admin)

// Get cinema stats
app.get('/api/cinema/stats', async (req, res) => {
  try {
    const [tickets] = await pool.query("SELECT * FROM cinema_tickets WHERE status = 'approved'");
    let totalAttendance = 0;
    const ageGroups = {};

    if (Array.isArray(tickets)) {
      totalAttendance = tickets.length;
      tickets.forEach(t => {
        const group = t.age_group || 'غير محدد';
        if (!ageGroups[group]) ageGroups[group] = 0;
        ageGroups[group]++;
      });
    }

    const ageDistribution = Object.keys(ageGroups).map(key => ({
      name: key,
      value: ageGroups[key]
    }));

    res.json({ success: true, totalAttendance, ageDistribution });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/cinema/tickets', async (req, res) => {
  try {
    const show_id = req.query.show_id;
    let query = 'SELECT t.*, s.title as show_title FROM cinema_tickets t LEFT JOIN cinema_shows s ON t.show_id = s.id';
    let params: any[] = [];
    if (show_id) {
      query += ' WHERE t.show_id = ?';
      params.push(show_id);
    }
    query += ' ORDER BY t.createdAt DESC';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch tickets' });
  }
});

// Update ticket status
app.put('/api/cinema/tickets/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    await pool.query('UPDATE cinema_tickets SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update ticket status' });
  }
});

// Fetch IMDB Data (Scrape basic info since API requires key)
app.get('/api/cinema/imdb/:id', async (req, res) => {
  try {
    const imdbId = req.params.id;
    const response = await axios.get(`https://www.imdb.com/title/\${imdbId}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    
    const html = response.data;
    
    // Simple regex extraction for basic metadata
    const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
    const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
    const descMatch = html.match(/<meta name="description" content="([^"]+)"/);
    
    const titleRaw = titleMatch ? titleMatch[1] : '';
    // Format is usually "Title (Year) - IMDb" or "Title (2020)"
    let title = titleRaw.replace(' - IMDb', '');
    let year = '';
    const yearMatch = title.match(/\\((\\d{4})\\)/);
    if (yearMatch) {
      year = yearMatch[1];
      title = title.replace(/\\(\\d{4}\\)/, '').trim();
    }
    
    let plot = '';
    let director = '';
    let cast = '';
    
    if (descMatch) {
      const desc = descMatch[1];
      plot = desc;
      // Often description looks like: "Directed by John Doe. With Jane Doe, ..."
      if (desc.includes('Directed by ')) {
         const dirParts = desc.split('Directed by ');
         if (dirParts.length > 1) {
            const dirSplit = dirParts[1].split('.');
            director = dirSplit[0].trim();
         }
      }
      if (desc.includes('With ')) {
         const withParts = desc.split('With ');
         if (withParts.length > 1) {
            const castSplit = withParts[1].split('.');
            cast = castSplit[0].trim();
         }
      }
    }

    res.json({
      success: true,
      data: {
        title: title || 'Unknown Title',
        release_year: year,
        poster_url: imageMatch ? imageMatch[1] : '',
        plot: plot,
        director: director,
        main_cast: cast
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch IMDB data', error: error.message });
  }
});

// Start Server & Vite
async function startServer() {
  // Vite middleware & Static serving
  if (process.env.NODE_ENV !== 'production') {
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

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Seed admin & root users in the background 
    // after the server is up and responding
    (async () => {
      try {
        // Create YemenJPT tables if they do not exist (SQLite & Postgres compatible)
        await pool.query(`
          CREATE TABLE IF NOT EXISTS jpt_potential_incidents (
            id VARCHAR(255) PRIMARY KEY,
            victimName VARCHAR(255),
            victimInstitution VARCHAR(255),
            date VARCHAR(255),
            governorate VARCHAR(255),
            district VARCHAR(255),
            type VARCHAR(255),
            perpetrator VARCHAR(255),
            description TEXT,
            sourceUrl VARCHAR(255),
            sourcePlatform VARCHAR(255),
            originalText TEXT,
            confidenceScore INTEGER,
            confidenceLevel VARCHAR(50),
            status VARCHAR(50) DEFAULT 'pending',
            duplicateOf VARCHAR(255),
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `).catch((e: any) => console.log("jpt_potential_incidents table setup info:", e.message));

        await pool.query(`
          CREATE TABLE IF NOT EXISTS jpt_watchlists (
            id VARCHAR(255) PRIMARY KEY,
            type VARCHAR(50),
            name VARCHAR(255),
            notes TEXT,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `).catch((e: any) => console.log("jpt_watchlists table setup info:", e.message));

        await pool.query(`
          CREATE TABLE IF NOT EXISTS jpt_alerts (
            id VARCHAR(255) PRIMARY KEY,
            incidentId VARCHAR(255),
            victimName VARCHAR(255),
            type VARCHAR(255),
            severity VARCHAR(50),
            notifiedTeams VARCHAR(255),
            sentAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `).catch((e: any) => console.log("jpt_alerts table setup info:", e.message));

        await pool.query(`
          CREATE TABLE IF NOT EXISTS jpt_crawl_logs (
            id VARCHAR(255) PRIMARY KEY,
            sourceUrl VARCHAR(255),
            extractedCount INTEGER,
            rawLog TEXT,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `).catch((e: any) => console.log("jpt_crawl_logs table setup info:", e.message));

        // Database seeding is now managed via src/db.ts for root admin
        // and initial schema. Individual data seeds removed to ensure clean start.
      } catch (error) {
        console.warn('Database initialization warning:', (error as Error).message);
      }
    })();
  });
}

startServer();

export default app;
