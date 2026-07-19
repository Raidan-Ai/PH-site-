import path from 'path';
import fs from 'fs';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

let pool: any;
export const usePostgres = false;
let isCurrentlyUsingPostgres = false;
export let db: any = null;
let sqliteInitialized = false;
let pgPool: any = null;

function isConnectionError(err: any): boolean {
  if (!err) return false;
  const msg = (err.message || '').toLowerCase();
  const code = (err.code || '').toLowerCase();
  return (
    code === 'econnrefused' ||
    code === 'enotfound' ||
    code === 'etimedout' ||
    code === '08001' ||
    code === '08003' ||
    code === '08004' ||
    code === '08006' ||
    msg.includes('econnrefused') ||
    msg.includes('enotfound') ||
    msg.includes('etimedout') ||
    msg.includes('connect')
  );
}

async function ensureSqliteInitialized() {
  if (sqliteInitialized) return;
  sqliteInitialized = true;
  console.log('Initializing SQLite Database Fallback...');
  try {
    const Database = (await import('better-sqlite3')).default;
    const dbPath = path.join(process.cwd(), 'database.sqlite');
    db = new Database(dbPath);
    db.pragma('foreign_keys = ON');

    // Run migrations
    initDb();
    await runExtraMigrations();
  } catch (err: any) {
    console.error('Failed to initialize SQLite Database:', err.message);
  }
}

async function initPgSchema() {
  if (!pgPool) return;
  console.log('Initializing PostgreSQL schemas and tables...');
  try {
    // Initialize media_products table for PG in production
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS "media_products" (
        "id" VARCHAR(255) PRIMARY KEY,
        "division" VARCHAR(50) NOT NULL,
        "contentType" VARCHAR(50) NOT NULL,
        "title" TEXT NOT NULL,
        "slug" VARCHAR(255) NOT NULL UNIQUE,
        "metadata" TEXT NOT NULL,
        "status" VARCHAR(20) DEFAULT 'draft' NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `).catch((err: any) => console.error('PG media_products table creation failed:', err.message));

    // Initialize api_keys and api_logs tables for PG in production
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS "api_keys" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(255) NOT NULL,
        "token" VARCHAR(255) UNIQUE NOT NULL,
        "role" VARCHAR(50) DEFAULT 'publisher',
        "scopes" VARCHAR(255) DEFAULT 'articles,reports,violations',
        "isActive" INTEGER DEFAULT 1,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "lastUsedAt" TIMESTAMP
      );
    `).catch((err: any) => console.error('PG api_keys table creation failed:', err.message));

    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS "api_logs" (
        "id" SERIAL PRIMARY KEY,
        "api_key_id" INTEGER,
        "endpoint" VARCHAR(255) NOT NULL,
        "method" VARCHAR(50) NOT NULL,
        "status" INTEGER,
        "ipAddress" VARCHAR(50),
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `).catch((err: any) => console.error('PG api_logs table creation failed:', err.message));

    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS "podcasts" (
        "id" SERIAL PRIMARY KEY,
        "title_ar" TEXT NOT NULL,
        "title_en" TEXT,
        "description_ar" TEXT,
        "description_en" TEXT,
        "cover_url" TEXT,
        "host" TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `).catch((err: any) => console.error('PG "podcasts" table creation failed:', err.message));

    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS "podcast_episodes" (
        "id" SERIAL PRIMARY KEY,
        "podcast_id" INTEGER,
        "title_ar" TEXT NOT NULL,
        "title_en" TEXT,
        "description_ar" TEXT,
        "description_en" TEXT,
        "audio_url" TEXT,
        "duration" TEXT,
        "publish_date" TEXT,
        "views" INTEGER DEFAULT 0,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `).catch((err: any) => console.error('PG "podcast_episodes" table creation failed:', err.message));

    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS "social_reels" (
        "id" SERIAL PRIMARY KEY,
        "url" TEXT NOT NULL,
        "title" TEXT,
        "isActive" INTEGER DEFAULT 1,
        "sort_order" INTEGER DEFAULT 0,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `).then(async () => {
      // Add columns dynamically for PostgreSQL
      await pgPool.query('ALTER TABLE "social_reels" ADD COLUMN IF NOT EXISTS "isBroken" INTEGER DEFAULT 0;').catch(() => {});
      await pgPool.query('ALTER TABLE "social_reels" ADD COLUMN IF NOT EXISTS "lastChecked" TIMESTAMP;').catch(() => {});
      await pgPool.query('ALTER TABLE "social_reels" ADD COLUMN IF NOT EXISTS "errorMessage" TEXT;').catch(() => {});
      await pgPool.query('ALTER TABLE "social_reels" ADD COLUMN IF NOT EXISTS "type" VARCHAR(20) DEFAULT \'social\';').catch(() => {});
      await pgPool.query('ALTER TABLE "social_reels" ADD COLUMN IF NOT EXISTS "thumbnail" TEXT;').catch(() => {});
      await pgPool.query('ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "maintenanceMode" INTEGER DEFAULT 0;').catch(() => {});
      await pgPool.query('ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "maintenanceMessage" TEXT;').catch(() => {});
      await pgPool.query('ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "access_tier" VARCHAR(50) DEFAULT \'public\';').catch(() => {});

      // Create membership tables for PG
      await pgPool.query(`
        CREATE TABLE IF NOT EXISTS "membership_tiers" (
          "id" VARCHAR(255) PRIMARY KEY,
          "name_ar" VARCHAR(255) NOT NULL,
          "name_en" VARCHAR(255) NOT NULL,
          "description_ar" TEXT,
          "description_en" TEXT,
          "price" REAL DEFAULT 0,
          "benefits_ar" TEXT,
          "benefits_en" TEXT,
          "status" VARCHAR(50) DEFAULT 'active',
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `).then(async () => {
        const res: any = await pgPool.query('SELECT COUNT(*) as count FROM "membership_tiers"').catch(() => null);
        if (res && res.rows && parseInt(res.rows[0].count) === 0) {
          const defaultTiers = [
            ['free', 'عضوية مجانية', 'Free Membership', 'عضوية أساسية للوصول للأخبار العامة والنشرة البريدية', 'Basic membership for access to public news and newsletters', 0, '["الاشتراك بالنشرة الإخبارية","الوصول للأخبار العامة"]', '["Newsletter subscription","Access to public news"]'],
            ['student', 'عضوية طالب', 'Student Membership', 'مخصصة لطلاب الإعلام والناشطين لتلقي الإشعارات والفرص', 'For journalism students and activists to receive opportunities', 0, '["الاشتراك بالنشرة الإخبارية","الوصول للأخبار والتقارير الحصرية","التسجيل في دورات الأكاديمية مجاناً"]', '["Newsletter subscription","Access to exclusive news and reports","Register in academy courses for free"]'],
            ['journalist', 'عضوية صحفي محترف', 'Professional Journalist', 'تتطلب إثبات المهنة، تتيح الانضمام لنظام رصد الانتهاكات وخدمات الدعم وحضور الفعاليات الخاصة', 'Requires proof of profession, allows joining the observatory, aid services, and special events', 0, '["الوصول الكامل للأخبار والتقارير والتحليلات","الدعم القانوني والاستشاري الكامل","أولوية التسجيل في برامج الأكاديمية","لوحة حصرية للصحفيين"]', '["Full access to news, reports, and analytics","Full legal and consultative support","Priority in academy enrollment","Exclusive panel for journalists"]'],
            ['expert', 'خبير إعلامي', 'Media Expert', 'للصحفيين ذوي الخبرة الطويلة والاستشاريين والمؤسسات الأكاديمية الشريكة', 'For experienced journalists, consultants, and partner academic institutions', 0, '["تقديم استشارات وتدريبات بالأكاديمية","المشاركة في إعداد التقارير السنوية","دعوات حصرية لندوات صناعة القرار"]', '["Provide consulting and academy training","Participate in drafting annual reports","Exclusive invitations to decision-making seminars"]'],
            ['institution', 'عضوية مؤسسات شريكة', 'Partner Institution', 'للمؤسسات الحقوقية والإعلامية للتنسيق المشترك ونشر الوظائف والمناقصات', 'For human rights and media organizations to publish jobs, tenders, and co-advocate', 0, '["نشر إعلانات الوظائف والمناقصات","تنسيق حملات مناصرة مشتركة","الوصول لقاعدة بيانات التقارير والانتهاكات المصنفة"]', '["Publish job openings and tenders","Coordinate joint advocacy campaigns","Access to categorized reports and violation databases"]']
          ];
          for (const [id, nameAr, nameEn, descAr, descEn, price, benefitsAr, benefitsEn] of defaultTiers) {
            await pgPool.query('INSERT INTO "membership_tiers" ("id", "name_ar", "name_en", "description_ar", "description_en", "price", "benefits_ar", "benefits_en") VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', [id, nameAr, nameEn, descAr, descEn, price, benefitsAr, benefitsEn]).catch(() => {});
          }
        }
      }).catch((err: any) => console.error('PG membership_tiers creation failed:', err.message));

      await pgPool.query(`
        CREATE TABLE IF NOT EXISTS "user_memberships" (
          "id" SERIAL PRIMARY KEY,
          "user_uid" VARCHAR(255) NOT NULL,
          "tier_id" VARCHAR(255) NOT NULL,
          "status" VARCHAR(50) DEFAULT 'pending',
          "professional_title" VARCHAR(255),
          "institution" VARCHAR(255),
          "cv_url" TEXT,
          "id_card_url" TEXT,
          "notes" TEXT,
          "approved_by" VARCHAR(255),
          "expires_at" VARCHAR(255),
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `).catch((err: any) => console.error('PG user_memberships creation failed:', err.message));

      const resReels = await pgPool.query('SELECT COUNT(*) as count FROM "social_reels"').catch(() => null);
      if (resReels && resReels.rows && parseInt(resReels.rows[0].count) === 0) {
        const defaultReels = [
          ['https://www.facebook.com/reel/574707928558894', 'ريل 1', 1],
          ['https://www.facebook.com/reel/898303715648518', 'ريل 2', 2],
          ['https://www.facebook.com/reel/1256168632368554', 'ريل 3', 3],
          ['https://www.facebook.com/reel/1181428234022118', 'ريل 4', 4],
          ['https://www.facebook.com/reel/1099379161707069', 'ريل 5', 5],
          ['https://www.facebook.com/reel/1507499274409387', 'ريل 6', 6],
          ['https://www.facebook.com/reel/1249279356469402', 'ريل 7', 7],
          ['https://www.facebook.com/reel/1974108536810873', 'ريل 8', 8]
        ];
        for (const [url, title, order] of defaultReels) {
          await pgPool.query('INSERT INTO "social_reels" ("url", "title", "sort_order") VALUES ($1, $2, $3)', [url, title, order]).catch(() => {});
        }
      }
    }).catch(err => console.error('PG "social_reels" table creation/seeding failed:', err.message));
  } catch (err: any) {
    console.error('PostgreSQL Schema Initialization Error:', err.message);
  }
}

if (usePostgres) {
  console.log('Using PostgreSQL Database with Fast Startup Connection Verification...');
  pgPool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 2000
  });

  // Fast asynchronous test of the PostgreSQL database connection
  pgPool.query('SELECT 1')
    .then(async () => {
      console.log('PostgreSQL connection check passed successfully.');
      await initPgSchema();
    })
    .catch(async (err: any) => {
      console.warn('PostgreSQL connection failed on startup. Disabling PG and using SQLite immediately:', err.message);
      isCurrentlyUsingPostgres = false;
      await ensureSqliteInitialized();
    });
} else {
  // SQLite initialized immediately
  ensureSqliteInitialized();
}

pool = {
  query: async (sql: string, params: any[] = []) => {
    if (isCurrentlyUsingPostgres) {
      let pgSql = sql;
      let pCount = 1;
      let inString = false;
      let outSql = '';
      for (let i = 0; i < pgSql.length; i++) {
        if (pgSql[i] === "'") inString = !inString;
        if (pgSql[i] === '?' && !inString) {
          outSql += `$${pCount++}`;
        } else {
          outSql += pgSql[i];
        }
      }
      pgSql = outSql;
      pgSql = pgSql.replace(/`([a-zA-Z0-9_]+)`/g, '"$1"');

      try {
        const result = await pgPool.query(pgSql, params);
        if (sql.trim().toUpperCase().startsWith('SELECT')) {
           return [result.rows, null];
        } else {
           return [{
              insertId: result.rows && result.rows.length ? result.rows[0].id : null,
              affectedRows: result.rowCount
           }, null];
        }
      } catch (err: any) {
         if (isConnectionError(err)) {
           console.warn('PostgreSQL connection failed during query. Falling back to SQLite Database:', err.message);
           isCurrentlyUsingPostgres = false;
           await ensureSqliteInitialized();
           return pool.query(sql, params);
         }
         console.error('PostgreSQL Error:', err);
         console.error('Query:', pgSql);
         throw err;
      }
    } else {
      await ensureSqliteInitialized();
      try {
        const trimmedSql = sql.trim().toUpperCase();
        if (trimmedSql.startsWith('SELECT')) {
          const stmt = db.prepare(sql);
          const rows = stmt.all(...params);
          return [rows, null];
        } else {
          const stmt = db.prepare(sql);
          const result = stmt.run(...params);
          return [{
            insertId: result.lastInsertRowid,
            affectedRows: result.changes
          }, null];
        }
      } catch (error) {
        console.error('SQLite Fallback Database Error:', error);
        throw error;
      }
    }
  },
  execute: async (sql: string, params: any[] = []) => {
    return pool.query(sql, params);
  },
  getConnection: async () => {
    if (isCurrentlyUsingPostgres) {
      try {
        const client = await pgPool.connect();
        return {
          query: async (sql: string, params: any[] = []) => {
            if (!isCurrentlyUsingPostgres) {
              return pool.query(sql, params);
            }
            let pgSql = sql;
            let pCount = 1;
            let inString = false;
            let outSql = '';
            for (let i = 0; i < pgSql.length; i++) {
              if (pgSql[i] === "'") inString = !inString;
              if (pgSql[i] === '?' && !inString) {
                outSql += `$${pCount++}`;
              } else {
                outSql += pgSql[i];
              }
            }
            pgSql = outSql.replace(/`([a-zA-Z0-9_]+)`/g, '"$1"');
            try {
              const result = await client.query(pgSql, params);
              if (sql.trim().toUpperCase().startsWith('SELECT')) {
                return [result.rows, null];
              } else {
                return [{ insertId: result.rows && result.rows.length ? result.rows[0].id : null, affectedRows: result.rowCount }, null];
              }
            } catch (err: any) {
              if (isConnectionError(err)) {
                console.warn('PostgreSQL connection failed in client query. Falling back to SQLite Database:', err.message);
                isCurrentlyUsingPostgres = false;
                client.release();
                await ensureSqliteInitialized();
                return pool.query(sql, params);
              }
              throw err;
            }
          },
          release: () => client.release()
        };
      } catch (err: any) {
        if (isConnectionError(err)) {
          console.warn('PostgreSQL connection failed at pool.connect(). Falling back to SQLite Database:', err.message);
          isCurrentlyUsingPostgres = false;
          await ensureSqliteInitialized();
          return pool.getConnection();
        }
        throw err;
      }
    } else {
      await ensureSqliteInitialized();
      return {
        query: pool.query,
        release: () => {}
      };
    }
  }
};

// Initialize database if empty

// Initialize database if empty
const initDb = () => {
  const schemaPath = path.join(process.cwd(), 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    let schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Original schema length:', schema.length);

    // SQLite adjustments (Precise replacements)
    
    // 1. Primary Keys with Auto Increment
    schema = schema.replace(/id INT AUTO_INCREMENT PRIMARY KEY/gi, 'id INTEGER PRIMARY KEY AUTOINCREMENT');
    schema = schema.replace(/id INTEGER AUTO_INCREMENT PRIMARY KEY/gi, 'id INTEGER PRIMARY KEY AUTOINCREMENT');
    
    // 2. Data Types
    schema = schema.replace(/\sJSON/gi, ' TEXT');
    schema = schema.replace(/\sENUM\([^)]+\)/gi, ' TEXT');
    schema = schema.replace(/\sVARCHAR\(\d+\)/gi, ' TEXT');
    schema = schema.replace(/\sDECIMAL\(\d+,\s*\d+\)/gi, ' REAL');
    schema = schema.replace(/\sINT([\s,])/gi, ' INTEGER$1');
    
    // 3. Constraints/Defaults
    schema = schema.replace(/DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP/gi, 'DATETIME DEFAULT CURRENT_TIMESTAMP');

    // 4. If Not Exists
    schema = schema.replace(/CREATE TABLE/gi, 'CREATE TABLE IF NOT EXISTS');
    schema = schema.replace(/CREATE TABLE IF NOT EXISTS IF NOT EXISTS/gi, 'CREATE TABLE IF NOT EXISTS');
    
    // 5. Cleanup
    schema = schema.replace(/AUTO_INCREMENT/gi, 'AUTOINCREMENT');
    schema = schema.replace(/UNIQUE KEY /gi, 'UNIQUE ');
    
    try {
      // Check if site_settings is in the adjusted schema
      if (!schema.toLowerCase().includes('site_settings')) {
        console.error('CRITICAL: site_settings table missing from transformed schema!');
      }

      // Split the schema into individual statements and execute them to handle errors gracefully
      const statements = schema
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);

      let successCount = 0;
      let errorCount = 0;
      for (const statement of statements) {
        try {
          db.exec(statement);
          successCount++;
        } catch (stmtError: any) {
          errorCount++;
          // Only log serious failures that aren't "table already exists"
          if (!stmtError.message.includes('already exists')) {
            console.error(`Statement execution error for: ${statement.substring(0, 50)}...`, stmtError.message);
          }
        }
      }
      console.log(`Database schema initialization complete. Executed statements: ${successCount} successful, ${errorCount} errors skipped.`);
    } catch (error) {
      console.error('Schema initialization error:', error);
    }
  }
};

export async function runExtraMigrations() {
// Add dynamic migrations for existing database
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      uid TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT,
      displayName TEXT,
      photoURL TEXT,
      role TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('Database Migration: Checked/Created users table');
} catch (e: any) {
  console.error('Migration Error (users):', e.message);
}

try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL,
      authorId TEXT,
      status TEXT NOT NULL,
      language TEXT NOT NULL,
      mainImage TEXT,
      show_in_slider INTEGER DEFAULT 0,
      slider_caption TEXT,
      slider_button_text TEXT,
      slider_image TEXT,
      seo TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('Database Migration: Checked/Created articles table');
} catch (e: any) {
  console.error('Migration Error (articles):', e.message);
}

try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS violations (
      id TEXT PRIMARY KEY,
      reporterName TEXT,
      reporterPhone TEXT,
      reporterType TEXT,
      reporterRelation TEXT,
      victimName TEXT,
      victimInstitution TEXT,
      victimPenName TEXT,
      victimSocials TEXT,
      victimPhone TEXT,
      governorate TEXT,
      district TEXT,
      date DATETIME,
      perpetrator TEXT,
      type TEXT,
      violationReason TEXT,
      description TEXT,
      evidenceTypes TEXT,
      evidenceLinks TEXT,
      needs TEXT,
      privacyPolicy TEXT,
      status TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('Database Migration: Checked/Created violations table');
} catch (e: any) {
  console.error('Migration Error (violations):', e.message);
}

try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS videos (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      url TEXT NOT NULL,
      thumbnail TEXT,
      category TEXT,
      tags TEXT,
      views INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0,
      duration TEXT,
      status TEXT DEFAULT 'published',
      authorId TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('Database Migration: Checked/Created videos table');
} catch (e: any) {
  console.error('Migration Error (videos):', e.message);
}

try {
  db.exec("ALTER TABLE violations ADD COLUMN latitude REAL;");
  console.log('Database Migration: Added latitude column to violations');
} catch (e) {
  // Column already exists
}
try {
  db.exec("ALTER TABLE violations ADD COLUMN longitude REAL;");
  console.log('Database Migration: Added longitude column to violations');
} catch (e) {
  // Column already exists
}

// Add rich Google Form matching columns to violations
const newViolationCols = [
  { name: 'reporterType', type: 'TEXT' },
  { name: 'reporterRelation', type: 'TEXT' },
  { name: 'victimPenName', type: 'TEXT' },
  { name: 'victimSocials', type: 'TEXT' },
  { name: 'victimPhone', type: 'TEXT' },
  { name: 'violationReason', type: 'TEXT' },
  { name: 'evidenceTypes', type: 'TEXT' },
  { name: 'needs', type: 'TEXT' },
  { name: 'privacyPolicy', type: 'TEXT' }
];

for (const col of newViolationCols) {
  try {
    db.exec(`ALTER TABLE violations ADD COLUMN ${col.name} ${col.type};`);
    console.log(`Database Migration: Added ${col.name} column to violations`);
  } catch (e) {
    // Already exists
  }
}

try {
  db.exec("ALTER TABLE articles ADD COLUMN access_tier TEXT DEFAULT 'public';");
  console.log('Database Migration: Added access_tier column to articles');
} catch (e) {
  // Column already exists
}

// Explicit migrations to ensure tables exist in case of incremental deployment
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      source TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('Database Migration: Checked/Created subscribers table');
} catch (e: any) {
  console.error('Database Migration Error (subscribers):', e.message);
}

try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS newsletter_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject TEXT NOT NULL,
      content TEXT NOT NULL,
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      recipientCount INTEGER
    );
  `);
  console.log('Database Migration: Checked/Created newsletter_history table');
} catch (e: any) {
  console.error('Database Migration Error (newsletter_history):', e.message);
}

try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS authorized_telegram_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chatId TEXT UNIQUE NOT NULL,
      username TEXT,
      displayName TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('Database Migration: Checked/Created authorized_telegram_users table');
} catch (e: any) {
  console.error('Database Migration Error (authorized_telegram_users):', e.message);
}

try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS membership_tiers (
      id TEXT PRIMARY KEY,
      name_ar TEXT NOT NULL,
      name_en TEXT NOT NULL,
      description_ar TEXT,
      description_en TEXT,
      price REAL DEFAULT 0,
      benefits_ar TEXT,
      benefits_en TEXT,
      status TEXT DEFAULT 'active',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  // Seed default tiers for SQLite
  const tierRow = db.prepare("SELECT COUNT(*) as count FROM membership_tiers").get() as any;
  if (tierRow && tierRow.count === 0) {
    const defaultTiers = [
      { id: 'free', name_ar: 'عضوية مجانية', name_en: 'Free Membership', description_ar: 'عضوية أساسية للوصول للأخبار العامة والنشرة البريدية', description_en: 'Basic membership for access to public news and newsletters', price: 0, benefits_ar: '["الاشتراك بالنشرة الإخبارية","الوصول للأخبار العامة"]', benefits_en: '["Newsletter subscription","Access to public news"]' },
      { id: 'student', name_ar: 'عضوية طالب', name_en: 'Student Membership', description_ar: 'مخصصة لطلاب الإعلام والناشطين لتلقي الإشعارات والفرص', description_en: 'For journalism students and activists to receive opportunities', price: 0, benefits_ar: '["الاشتراك بالنشرة الإخبارية","الوصول للأخبار والتقارير الحصرية","التسجيل في دورات الأكاديمية مجاناً"]', benefits_en: '["Newsletter subscription","Access to exclusive news and reports","Register in academy courses for free"]' },
      { id: 'journalist', name_ar: 'عضوية صحفي محترف', name_en: 'Professional Journalist', description_ar: 'تتطلب إثبات المهنة، تتيح الانضمام لنظام رصد الانتهاكات وخدمات الدعم وحضور الفعاليات الخاصة', description_en: 'Requires proof of profession, allows joining the observatory, aid services, and special events', price: 0, benefits_ar: '["الوصول الكامل للأخبار والتقارير والتحليلات","الدعم القانوني والاستشاري الكامل","أولوية التسجيل في برامج الأكاديمية","لوحة حصرية للصحفيين"]', benefits_en: '["Full access to news, reports, and analytics","Full legal and consultative support","Priority in academy enrollment","Exclusive panel for journalists"]' },
      { id: 'expert', name_ar: 'خبير إعلامي', name_en: 'Media Expert', description_ar: 'للصحفيين ذوي الخبرة الطويلة والاستشاريين والمؤسسات الأكاديمية الشريكة', description_en: 'For experienced journalists, consultants, and partner academic institutions', price: 0, benefits_ar: '["تقديم استشارات وتدريبات بالأكاديمية","المشاركة في إعداد التقارير السنوية","دعوات حصرية لندوات صناعة القرار"]', benefits_en: '["Provide consulting and academy training","Participate in drafting annual reports","Exclusive invitations to decision-making seminars"]' },
      { id: 'institution', name_ar: 'عضوية مؤسسات شريكة', name_en: 'Partner Institution', description_ar: 'للمؤسسات الحقوقية والإعلامية للتنسيق المشترك ونشر الوظائف والمناقصات', description_en: 'For human rights and media organizations to publish jobs, tenders, and co-advocate', price: 0, benefits_ar: '["نشر إعلانات الوظائف والمناقصات","تنسيق حملات مناصرة مشتركة","الوصول لقاعدة بيانات التقارير والانتهاكات المصنفة"]', benefits_en: '["Publish job openings and tenders","Coordinate joint advocacy campaigns","Access to categorized reports and violation databases"]' }
    ];
    const insertStmt = db.prepare("INSERT INTO membership_tiers (id, name_ar, name_en, description_ar, description_en, price, benefits_ar, benefits_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    for (const tier of defaultTiers) {
      insertStmt.run(tier.id, tier.name_ar, tier.name_en, tier.description_ar, tier.description_en, tier.price, tier.benefits_ar, tier.benefits_en);
    }
  }
  console.log('Database Migration: Checked/Created/Seeded membership_tiers table');
} catch (e: any) {
  console.error('Database Migration Error (membership_tiers SQLite):', e.message);
}

try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_memberships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_uid TEXT NOT NULL,
      tier_id TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      professional_title TEXT,
      institution TEXT,
      cv_url TEXT,
      id_card_url TEXT,
      notes TEXT,
      approved_by TEXT,
      expires_at TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('Database Migration: Checked/Created user_memberships table');
} catch (e: any) {
  console.error('Database Migration Error (user_memberships SQLite):', e.message);
}

try {
  db.exec("ALTER TABLE projects ADD COLUMN isFeatured INTEGER DEFAULT 0;");
  console.log('Database Migration: Added isFeatured column to projects');
} catch (e) {
  // Column already exists
}

try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS page_content (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_name TEXT NOT NULL,
      section_name TEXT NOT NULL,
      content TEXT NOT NULL,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (page_name, section_name)
    );
  `);
  console.log('Database Migration: Checked/Created page_content table');
} catch (e: any) {
  console.error('Database Migration Error (page_content):', e.message);
}

try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT,
      rating INTEGER,
      feedback_type TEXT DEFAULT 'general',
      item_id TEXT,
      comment TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('Database Migration: Checked/Created feedback table');
} catch (e: any) {
  console.error('Database Migration Error (feedback):', e.message);
}

try {
  const tables = ['articles', 'jobs', 'courses', 'projects', 'events'];
  tables.forEach(table => {
    try { db.exec(`ALTER TABLE ${table} ADD COLUMN show_in_slider INTEGER DEFAULT 0;`); } catch(e) {}
    try { db.exec(`ALTER TABLE ${table} ADD COLUMN slider_caption TEXT;`); } catch(e) {}
    try { db.exec(`ALTER TABLE ${table} ADD COLUMN slider_button_text TEXT;`); } catch(e) {}
    try { db.exec(`ALTER TABLE ${table} ADD COLUMN slider_image TEXT;`); } catch(e) {}
  });
  db.exec(`
    CREATE TABLE IF NOT EXISTS menus (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      location TEXT NOT NULL,
      title TEXT NOT NULL,
      icon TEXT,
      path TEXT NOT NULL,
      isActive INTEGER DEFAULT 1,
      \`order\` INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // New slider customization migrations
  const heroColumns = [
    { name: 'textAnimation', type: 'TEXT DEFAULT "slide-up"' },
    { name: 'titleSize', type: 'TEXT DEFAULT "text-4xl md:text-6xl lg:text-7xl"' },
    { name: 'subtitleSize', type: 'TEXT DEFAULT "text-xs"' },
    { name: 'descriptionSize', type: 'TEXT DEFAULT "text-lg md:text-xl"' },
    { name: 'buttonSize', type: 'TEXT DEFAULT "px-8 py-4"' },
    { name: 'overlayOpacity', type: 'INTEGER DEFAULT 60' },
    { name: 'textAlign', type: 'TEXT DEFAULT "left"' }
  ];

  heroColumns.forEach(col => {
    try {
      db.exec(`ALTER TABLE hero_slides ADD COLUMN ${col.name} ${col.type};`);
      console.log(`Database Migration: Added ${col.name} column to hero_slides`);
    } catch(e) {}
  });

  try { db.exec("ALTER TABLE site_settings ADD COLUMN sliderAutoplayDelay INTEGER DEFAULT 8000;"); } catch(e) {}
  try { db.exec("ALTER TABLE site_settings ADD COLUMN sliderTransitionSpeed INTEGER DEFAULT 1000;"); } catch(e) {}
  
  // SEO and site verification migrations
  try { db.exec("ALTER TABLE site_settings ADD COLUMN seoTitle TEXT;"); } catch(e) {}
  try { db.exec("ALTER TABLE site_settings ADD COLUMN seoDescription TEXT;"); } catch(e) {}
  try { db.exec("ALTER TABLE site_settings ADD COLUMN seoKeywords TEXT;"); } catch(e) {}
  try { db.exec("ALTER TABLE site_settings ADD COLUMN ogDefaultImage TEXT;"); } catch(e) {}
  try { db.exec("ALTER TABLE site_settings ADD COLUMN ogSiteName TEXT;"); } catch(e) {}
  try { db.exec("ALTER TABLE site_settings ADD COLUMN ogType TEXT DEFAULT 'website';"); } catch(e) {}
  try { db.exec("ALTER TABLE site_settings ADD COLUMN googleVerification TEXT;"); } catch(e) {}
  try { db.exec("ALTER TABLE site_settings ADD COLUMN bingVerification TEXT;"); } catch(e) {}

  // AI Configuration migrations
  try { db.exec("ALTER TABLE site_settings ADD COLUMN aiEnabled BOOLEAN DEFAULT TRUE;"); } catch(e) {}
  try { db.exec("ALTER TABLE site_settings ADD COLUMN aiModel TEXT DEFAULT 'nvidia/qwen-2.5-coder-32b-instruct';"); } catch(e) {}
  try { db.exec("ALTER TABLE site_settings ADD COLUMN aiBaseUrl TEXT DEFAULT 'https://integrate.api.nvidia.com/v1';"); } catch(e) {}
  try { db.exec("ALTER TABLE site_settings ADD COLUMN aiApiKey TEXT;"); } catch(e) {}
  try { db.exec("ALTER TABLE site_settings ADD COLUMN aiTemperature REAL DEFAULT 0.3;"); } catch(e) {}
  try { db.exec("ALTER TABLE site_settings ADD COLUMN aiMaxTokens INTEGER DEFAULT 1524;"); } catch(e) {}
  try { db.exec("ALTER TABLE site_settings ADD COLUMN aiSystemInstruction TEXT;"); } catch(e) {}
  try { db.exec("ALTER TABLE site_settings ADD COLUMN maintenanceMode INTEGER DEFAULT 0;"); } catch(e) {}
  try { db.exec("ALTER TABLE site_settings ADD COLUMN maintenanceMessage TEXT;"); } catch(e) {}
  
  // Remove AI link from bottom dock as requested
  try { db.prepare("DELETE FROM menus WHERE path LIKE '%ai.ph-ye.org%'").run(); } catch(e) {}

  try {
    db.exec(`ALTER TABLE job_applications ADD COLUMN user_uid TEXT;`);
  } catch (e) {}

  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS course_applications (
        id VARCHAR(255) PRIMARY KEY,
        course_id VARCHAR(255) NOT NULL,
        user_uid VARCHAR(255),
        fullName VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(255),
        status ENUM('pending', 'reviewed', 'accepted', 'rejected', 'completed') NOT NULL DEFAULT 'pending',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (e) {}
  
  // AI Provider settings
  try { db.exec("ALTER TABLE site_settings ADD COLUMN aiProvider TEXT DEFAULT 'openai';"); } catch(e) {}
  
  try { db.exec("ALTER TABLE site_settings ADD COLUMN smtpHost TEXT;"); } catch(e) {}
  try { db.exec("ALTER TABLE site_settings ADD COLUMN smtpPort INTEGER;"); } catch(e) {}
  try { db.exec("ALTER TABLE site_settings ADD COLUMN smtpUser TEXT;"); } catch(e) {}
  try { db.exec("ALTER TABLE site_settings ADD COLUMN smtpPass TEXT;"); } catch(e) {}
  try { db.exec("ALTER TABLE site_settings ADD COLUMN smtpFrom TEXT;"); } catch(e) {}
  
  // Enterprise CMS Extension Tables Check
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS institution_identity (
        id INTEGER PRIMARY KEY DEFAULT 1,
        name_ar TEXT,
        name_en TEXT,
        description_ar TEXT,
        description_en TEXT,
        vision_ar TEXT,
        vision_en TEXT,
        mission_ar TEXT,
        mission_en TEXT,
        goals TEXT,
        work_fields TEXT,
        logo_main TEXT,
        logo_colored TEXT,
        logo_dark TEXT,
        logo_white TEXT,
        favicon TEXT,
        primaryColor TEXT,
        secondaryColor TEXT,
        accentColor TEXT,
        fontArPrimary TEXT,
        fontArSecondary TEXT,
        fontEnPrimary TEXT,
        fontEnSecondary TEXT
      );
    `);
    
    // Seed default item if doesn't exist
    const row = db.prepare("SELECT id FROM institution_identity WHERE id = 1").get();
    if (!row) {
      db.prepare(`
        INSERT INTO institution_identity (id, name_ar, name_en, description_ar, description_en)
        VALUES (1, 'بيت الصحافة - اليمن', 'Press House - Yemen', 'مؤسسة إعلامية متخصصة', 'Specialized media organization')
      `).run();
    }
    console.log('Database Migration: Checked/Created institution_identity table');
  } catch (e: any) {
    console.error('Migration Error (institution_identity):', e.message);
  }

  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS employees (
        id TEXT PRIMARY KEY,
        full_name TEXT NOT NULL,
        employee_id TEXT,
        position TEXT,
        department TEXT,
        photo_url TEXT,
        email TEXT,
        phone TEXT,
        status TEXT DEFAULT 'active'
      );
    `);
    console.log('Database Migration: Checked/Created employees table');
  } catch (e: any) {
    console.error('Migration Error (employees):', e.message);
  }

  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS board_members (
        id TEXT PRIMARY KEY,
        full_name TEXT NOT NULL,
        position TEXT,
        photo_url TEXT,
        bio TEXT,
        sort_order INTEGER DEFAULT 0
      );
    `);
    
    // Developer Rule #3: Idempotent migration for new columns
    try {
      db.exec(`ALTER TABLE board_members ADD COLUMN category TEXT DEFAULT 'leadership'`);
      console.log('Database Migration: Added category column to board_members');
    } catch (err: any) {
      // Column may already exist
    }
    
    console.log('Database Migration: Checked/Created board_members table');
  } catch (e: any) {
    console.error('Migration Error (board_members):', e.message);
  }

  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS partners (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT DEFAULT 'donor',
        logo TEXT,
        country TEXT,
        website TEXT,
        contact_person TEXT
      );
    `);
    console.log('Database Migration: Checked/Created partners table');
  } catch (e: any) {
    console.error('Migration Error (partners):', e.message);
  }

  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS programs (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        imageurl TEXT,
        icon TEXT,
        category TEXT DEFAULT 'training'
      );
    `);
    console.log('Database Migration: Checked/Created programs table');
  } catch (e: any) {
    console.error('Migration Error (programs):', e.message);
  }

  // Add missing columns to projects
  const projectCols = [
    { name: 'partner_id', type: 'TEXT' },
    { name: 'donor_id', type: 'TEXT' },
    { name: 'beneficiaries_count', type: 'INTEGER DEFAULT 0' },
    { name: 'start_date', type: 'TEXT' },
    { name: 'end_date', type: 'TEXT' },
    { name: 'goals', type: 'TEXT' },
    { name: 'activities', type: 'TEXT' },
    { name: 'deliverables', type: 'TEXT' },
    { name: 'location_governorate', type: 'TEXT' },
    { name: 'location_district', type: 'TEXT' }
  ];

  projectCols.forEach(col => {
    try {
      db.exec(`ALTER TABLE projects ADD COLUMN ${col.name} ${col.type};`);
    } catch (e) {}
  });

  // Media Library - Albums & associations
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS media_albums (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name_ar TEXT NOT NULL,
        name_en TEXT,
        description_ar TEXT,
        description_en TEXT,
        type TEXT DEFAULT 'mixed',
        project_id TEXT,
        event_id INTEGER,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Database Migration: Checked/Created media_albums table');
  } catch (e: any) {
    console.error('Database Migration Error (media_albums):', e.message);
  }

  try {
    db.exec("ALTER TABLE media ADD COLUMN album_id INTEGER;");
    console.log('Database Migration: Added album_id column to media');
  } catch (e) {}

  try { db.exec("ALTER TABLE media ADD COLUMN alt_text TEXT;"); } catch (e) {}
  try { db.exec("ALTER TABLE media ADD COLUMN photographer TEXT;"); } catch (e) {}
  try { db.exec("ALTER TABLE media ADD COLUMN description TEXT;"); } catch (e) {}
  try { db.exec("ALTER TABLE media ADD COLUMN extracted_text TEXT;"); } catch (e) {}

  // --- NEW PRESSHOUSE ENTERPRISE CMS TABLES & MIGRATIONS ---
  
  // Advanced Role Management & Organization Structure
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS departments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name_ar TEXT NOT NULL,
        name_en TEXT,
        description TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Database Migration: Checked/Created departments table');
  } catch (e: any) {}

  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS teams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name_ar TEXT NOT NULL,
        name_en TEXT,
        department_id INTEGER,
        description TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Database Migration: Checked/Created teams table');
  } catch (e: any) {}

  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS system_roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name_ar TEXT NOT NULL,
        name_en TEXT,
        role_key TEXT UNIQUE,
        permissions TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    // Seed default role
    const row = db.prepare("SELECT id FROM system_roles WHERE role_key = 'super_admin'").get();
    if (!row) {
      db.prepare(`
        INSERT INTO system_roles (name_ar, name_en, role_key, permissions)
        VALUES ('مدير نظام', 'Super Admin', 'super_admin', '["all"]')
      `).run();
    }
    console.log('Database Migration: Checked/Created system_roles table');
  } catch (e: any) {}

  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        assigned_to TEXT,
        created_by TEXT,
        project_id TEXT,
        program_id TEXT,
        sector_id TEXT,
        due_date DATETIME,
        status TEXT DEFAULT 'pending',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Database Migration: Checked/Created tasks table');
  } catch (e: any) {}

  // Update Users Table
  const userAdditionalCols = [
    { name: 'department_id', type: 'INTEGER' },
    { name: 'team_id', type: 'INTEGER' },
    { name: 'system_role_id', type: 'INTEGER' },
    { name: 'disabled', type: 'INTEGER DEFAULT 0' }
  ];
  userAdditionalCols.forEach(col => {
    try {
      db.exec(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type};`);
    } catch (e) {}
  });

  // 1. Sectors (القطاعات)

  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS sectors (
        id TEXT PRIMARY KEY,
        name_ar TEXT NOT NULL,
        name_en TEXT,
        description_ar TEXT,
        description_en TEXT,
        image TEXT,
        icon TEXT,
        color TEXT,
        sort_order INTEGER DEFAULT 0,
        status TEXT DEFAULT 'published'
      );
    `);
    console.log('Database Migration: Checked/Created sectors table');
  } catch (e: any) {
    console.error('Migration Error (sectors):', e.message);
  }

  // 2. Program Extensions
  const programCols = [
    { name: 'sector_id', type: 'TEXT' },
    { name: 'description_full_ar', type: 'TEXT' },
    { name: 'description_full_en', type: 'TEXT' },
    { name: 'status', type: 'TEXT DEFAULT "published"' }
  ];
  programCols.forEach(col => {
    try {
      db.exec(`ALTER TABLE programs ADD COLUMN ${col.name} ${col.type};`);
    } catch (e) {}
  });

  // 3. Project Extensions
  const richProjectCols = [
    { name: 'reference_code', type: 'TEXT' },
    { name: 'short_name_ar', type: 'TEXT' },
    { name: 'short_name_en', type: 'TEXT' },
    { name: 'sector_id', type: 'TEXT' },
    { name: 'program_id', type: 'TEXT' },
    { name: 'duration', type: 'TEXT' },
    { name: 'geo_location', type: 'TEXT' },
    { name: 'governorates_json', type: 'TEXT' },
    { name: 'districts_json', type: 'TEXT' },
    { name: 'beneficiaries_males', type: 'INTEGER DEFAULT 0' },
    { name: 'beneficiaries_females', type: 'INTEGER DEFAULT 0' },
    
    { name: 'brief_introduction_ar', type: 'TEXT' },
    { name: 'brief_introduction_en', type: 'TEXT' },
    { name: 'brief_concept_ar', type: 'TEXT' },
    { name: 'brief_concept_en', type: 'TEXT' },
    { name: 'brief_justifications_ar', type: 'TEXT' },
    { name: 'brief_justifications_en', type: 'TEXT' },
    { name: 'brief_importance_ar', type: 'TEXT' },
    { name: 'brief_importance_en', type: 'TEXT' },
    
    { name: 'beneficiaries_direct', type: 'INTEGER DEFAULT 0' },
    { name: 'beneficiaries_indirect', type: 'INTEGER DEFAULT 0' },
    { name: 'main_target_group', type: 'TEXT' },
    { name: 'secondary_target_groups', type: 'TEXT' },
    
    { name: 'problem_description', type: 'TEXT' },
    { name: 'problem_main_causes', type: 'TEXT' },
    { name: 'problem_sub_causes', type: 'TEXT' },
    { name: 'problem_effects', type: 'TEXT' },
    { name: 'problem_evidence', type: 'TEXT' },
    { name: 'problem_studies', type: 'TEXT' },
    { name: 'problem_references', type: 'TEXT' },
    { name: 'problem_attachments', type: 'TEXT' },
    
    { name: 'beneficiary_description', type: 'TEXT' },
    { name: 'beneficiary_current_status', type: 'TEXT' },
    { name: 'beneficiary_challenges', type: 'TEXT' },
    { name: 'beneficiary_needs', type: 'TEXT' },
    { name: 'beneficiary_demographics', type: 'TEXT' },
    
    { name: 'general_goal', type: 'TEXT' },
    { name: 'funding_org', type: 'TEXT' },
    { name: 'partners_json', type: 'TEXT' }
  ];
  richProjectCols.forEach(col => {
    try {
      db.exec(`ALTER TABLE projects ADD COLUMN ${col.name} ${col.type};`);
    } catch (e) {}
  });

  // 4. Content extensions (Articles, Events, Jobs get sector_id, program_id, project_id)
  const contentTables = ['articles', 'events', 'jobs'];
  contentTables.forEach(tbl => {
    try { db.exec(`ALTER TABLE ${tbl} ADD COLUMN sector_id TEXT;`); } catch (e) {}
    try { db.exec(`ALTER TABLE ${tbl} ADD COLUMN program_id TEXT;`); } catch (e) {}
    try { db.exec(`ALTER TABLE ${tbl} ADD COLUMN project_id TEXT;`); } catch (e) {}
  });

  // 5. Success Stories (قصص النجاح)
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS success_stories (
        id TEXT PRIMARY KEY,
        title_ar TEXT NOT NULL,
        title_en TEXT,
        project_id TEXT,
        program_id TEXT,
        sector_id TEXT,
        beneficiary_name TEXT,
        beneficiary_role TEXT,
        content_ar TEXT,
        content_en TEXT,
        images TEXT,
        video_url TEXT,
        tags TEXT,
        status TEXT DEFAULT 'published',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Database Migration: Checked/Created success_stories table');
  } catch (e: any) {
    console.error('Migration Error (success_stories):', e.message);
  }

  // 6. Testimonials (الشهادات)
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS testimonials (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        photo_url TEXT,
        role TEXT,
        organization TEXT,
        content_ar TEXT,
        content_en TEXT,
        rating REAL DEFAULT 5,
        project_id TEXT,
        program_id TEXT,
        sector_id TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Database Migration: Checked/Created testimonials table');
  } catch (e: any) {
    console.error('Migration Error (testimonials):', e.message);
  }

  // 7. Custom Lists (قوائم المنسدلة الإعدادات)
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS custom_lists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        list_key TEXT UNIQUE,
        list_value TEXT
      );
    `);
    console.log('Database Migration: Checked/Created custom_lists table');
    
    // Seed default customizable lists if they do not exist
    const defaultLists = [
      { key: 'activity_types', value: ['تدريب', 'ورشة عمل', 'ندوة', 'مؤتمر', 'منحة', 'دراسة وبحث', 'رصد وتوثيق', 'حملة مناصرة', 'جلسة بؤرية حوارية', 'إنتاج محتوى', 'استشارة'] },
      { key: 'opportunity_types', value: ['منحة صحفية', 'زمالة تدريبية', 'فرص عمل', 'استشارات', 'مسابقات وجوائز'] },
      { key: 'event_types', value: ['ندوة', 'ورشة عمل', 'مؤتمر صحفي', 'حلقة نقاشية', 'مائدة مستديرة'] },
      { key: 'article_types', value: ['أخبار', 'تقارير', 'بلاغات صحفية', 'دراسات وأبحاث', 'بيانات الاستنكار'] },
      { key: 'story_types', value: ['تطوير ذاتي', 'تأسيس مشروع صحفي', 'حماية قانونية ناجحة', 'قصة سلامة مهنية'] },
      { key: 'testimonial_types', value: ['مستفيد', 'صحفي مشارك', 'شريك محلي', 'منظمة دولية', 'ممثل جهة حكومية'] },
      { key: 'governorates', value: ['صنعاء', 'عدن', 'تعز', 'حضرموت', 'الحديدة', 'إب', 'مأرب', 'شبوة', 'أبين', 'المهرة', 'الضالع', 'لحج', 'عمران', 'حجة', 'البيضاء', 'ذمار', 'صعدة', 'الجوف', 'المحويت', 'ريمة', 'سقطرى'] },
      { key: 'districts', value: ['صيرة', 'المعلا', 'التواهي', 'المنصورة', 'الشيخ عثمان', 'البريقة', 'خور مكسر', 'دار سعد', 'القاهرة', 'المظفر', 'صالة', 'التعزية', 'المواسط', 'الشمايتين', 'المعافر', 'جبل حبشي', 'المخا', 'ذوباب', 'الوازعية', 'موزع'] },
      { key: 'partners', value: ['نقابة الصحفيين اليمنيين', 'الإتحاد الدولي للصحفيين', 'مرصد الحريات الإعلامية', 'مؤسسة يمن فيوتشر', 'منظمة أوت دورز'] },
      { name: 'funding_orgs', value: ['منظمة اليونسكو', 'الوكالة الفرنسية لتنمية الإعلام CFI', 'الصندوق الوطني للديمقراطية NED', 'الاتحاد الأوروبي', 'برنامج الأمم المتحدة الإنمائي UNDP'] },
      { key: 'tags', value: ['حقوق الإنسان', 'حرية الإعلام', 'سلامة الصحفيين', 'الدعم القانوني', 'التحول الرقمي', 'التدريب الإعلامي'] },
      { key: 'keywords', value: ['اليمن', 'بيت الصحافة', 'صحافة حرة', 'رصد الانتهاكات', 'تأهيل ومهارات', 'حماية الصحفيين'] }
    ];

    defaultLists.forEach(item => {
      const listKey = item.key || (item as any).name; // safely handle funding_orgs
      const row = db.prepare("SELECT id FROM custom_lists WHERE list_key = ?").get(listKey);
      if (!row) {
        db.prepare("INSERT INTO custom_lists (list_key, list_value) VALUES (?, ?)").run(listKey, JSON.stringify(item.value));
      }
    });
  } catch (e: any) {
    console.error('Migration Error (custom_lists):', e.message);
  }

  // Seed default mockup content for page_content so it exists as real data
  try {
    const pagesContentToSeed = [
      {
        page_name: 'home',
        section_name: 'impact_stats',
        content: {
          stats: [
            { ar: '0', en: '0', labelAr: 'انتهاك موثق', labelEn: 'Violations Documented', descAr: 'رصد دقيق ومستمر للانتهاكات', descEn: 'Accurate and continuous monitoring' },
            { ar: '0', en: '0', labelAr: 'صحفي مستفيد', labelEn: 'Journalists Supported', descAr: 'دعم قانوني ونفسي ومهني', descEn: 'Legal, psychological and professional support' },
            { ar: '0', en: '0', labelAr: 'دورة تدريبية', labelEn: 'Training Courses', descAr: 'بناء قدرات الكوادر الإعلامية', descEn: 'Capacity building for media cadres' },
            { ar: '0', en: '0', labelAr: 'تقرير حقوقي', labelEn: 'Rights Reports', descAr: 'توثيق للعدالة والمساءلة', descEn: 'Documentation for justice and accountability' }
          ]
        }
      },
      {
        page_name: 'home',
        section_name: 'programs_intro',
        content: {
          title: { ar: 'برامج بيت الصحافة', en: 'Press House Programs' },
          text: { ar: 'نعمل على تعزيز حرية الصحافة ودعم الصحفيين في اليمن من خلال برامج متكاملة.', en: 'We work to promote press freedom and support journalists in Yemen through integrated programs.' }
        }
      },
      {
        page_name: 'about',
        section_name: 'introduction',
        content: {
          title: { ar: 'عن بيت الصحافة', en: 'About Press House' },
          text: { ar: 'مؤسسة إعلامية حقوقية مستقلة.', en: 'Independent media and rights institution.' },
          image: ''
        }
      },
      {
        page_name: 'about',
        section_name: 'vision',
        content: {
          title: { ar: 'رؤيتنا', en: 'Our Vision' },
          text: { ar: 'صحافة حرة ومهنية.', en: 'Free and professional journalism.' }
        }
      },
      {
        page_name: 'about',
        section_name: 'mission',
        content: {
          title: { ar: 'رسالتنا', en: 'Our Mission' },
          text: { ar: 'دعم حقوق الصحفيين وتعزيز الحريات الإعلامية.', en: 'Supporting journalists rights and promoting media freedoms.' }
        }
      }
    ];

    pagesContentToSeed.forEach(item => {
      const row = db.prepare("SELECT id FROM page_content WHERE page_name = ? AND section_name = ?").get(item.page_name, item.section_name);
      if (!row) {
        db.prepare("INSERT INTO page_content (page_name, section_name, content) VALUES (?, ?, ?)").run(item.page_name, item.section_name, JSON.stringify(item.content));
      } else {
        // Update existing mock data to new neutral values
        db.prepare("UPDATE page_content SET content = ? WHERE page_name = ? AND section_name = ?").run(JSON.stringify(item.content), item.page_name, item.section_name);
      }
    });
  } catch (e: any) {
    console.error('Database Migration Error (page_content seeds):', e.message);
  }

  // Media Products Schema Migration for 6 major divisions and 33 content types
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS media_products (
        id TEXT PRIMARY KEY,
        division TEXT NOT NULL,
        contentType TEXT NOT NULL,
        title TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        metadata TEXT NOT NULL,
        status TEXT DEFAULT 'draft' NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Database Migration: Checked/Created media_products table successfully');
  } catch (e: any) {
    console.error('Database Migration Error (media_products):', e.message);
  }

  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS cinema_shows (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        status TEXT DEFAULT 'upcoming',
        show_time DATETIME,
        imdb_id TEXT,
        plot TEXT,
        poster_url TEXT,
        trailer_url TEXT,
        director TEXT,
        release_year TEXT,
        production TEXT,
        author TEXT,
        main_cast TEXT,
        news_content TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS cinema_tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        show_id INTEGER NOT NULL,
        full_name TEXT NOT NULL,
        whatsapp TEXT NOT NULL,
        interest_reason TEXT,
        status TEXT DEFAULT 'pending',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(show_id) REFERENCES cinema_shows(id) ON DELETE CASCADE
      );
    `);
    try { db.exec(`ALTER TABLE cinema_tickets ADD COLUMN age_group TEXT;`); } catch(e) {}
    console.log('Database Migration: Checked/Created cinema_shows and cinema_tickets tables successfully');
  } catch (e: any) {
    console.error('Database Migration Error (cinema):', e.message);
  }

  // --- NEW BAYT AL-SAHAFA ACADEMY PLATFORM TABLES ---
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS academy_applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id TEXT NOT NULL,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        education TEXT,
        experience TEXT,
        motivation TEXT,
        cv_url TEXT,
        scoring_data TEXT,
        reviewer_notes TEXT,
        status TEXT DEFAULT 'pending',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS academy_trainers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        bio TEXT,
        expertise TEXT,
        experience TEXT,
        certifications TEXT,
        rating REAL DEFAULT 5,
        feedback TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS academy_venues (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT,
        capacity INTEGER,
        equipment TEXT,
        accessibility TEXT,
        cost REAL DEFAULT 0
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS academy_logistics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id TEXT NOT NULL,
        item_type TEXT NOT NULL,
        details TEXT,
        cost REAL DEFAULT 0,
        status TEXT DEFAULT 'pending'
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS academy_certificates (
        id TEXT PRIMARY KEY,
        course_id TEXT NOT NULL,
        recipient_name TEXT NOT NULL,
        recipient_email TEXT,
        type TEXT NOT NULL,
        issue_date TEXT,
        qr_code_url TEXT,
        verify_url TEXT,
        status TEXT DEFAULT 'active'
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS academy_alumni (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL,
        graduation_year INTEGER,
        courses_completed TEXT,
        current_position TEXT,
        organization TEXT,
        is_mentor INTEGER DEFAULT 0
      );
    `);
    console.log('Database Migration: Checked/Created Academy Platform tables successfully');
  } catch (e: any) {
    console.error('Database Migration Error (Academy Platform):', e.message);
  }

  // --- NEW BAYT AL-SAHAFA VOLUNTEER MANAGEMENT SYSTEM (VMS) TABLES ---
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS volunteer_registry (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        volunteer_id TEXT NOT NULL UNIQUE,
        full_name TEXT NOT NULL,
        profile_photo TEXT,
        gender TEXT,
        dob TEXT,
        nationality TEXT,
        location TEXT,
        address TEXT,
        phone TEXT,
        email TEXT UNIQUE,
        occupation TEXT,
        organization TEXT,
        education TEXT,
        skills TEXT,
        languages TEXT,
        certifications TEXT,
        status TEXT DEFAULT 'Applicant',
        registration_date TEXT,
        preferred_areas TEXT,
        availability TEXT,
        experience_level TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS volunteer_opportunities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        program_id TEXT,
        project_id TEXT,
        description TEXT,
        requirements TEXT,
        location TEXT,
        duration TEXT,
        available_positions INTEGER DEFAULT 5,
        application_deadline TEXT,
        form_fields TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS volunteer_applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        opportunity_id INTEGER NOT NULL,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        resume_url TEXT,
        portfolio_link TEXT,
        answers TEXT,
        screening_notes TEXT,
        interview_notes TEXT,
        background_check TEXT,
        references_data TEXT,
        interviewer TEXT,
        evaluation_scores TEXT,
        status TEXT DEFAULT 'Submitted',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS volunteer_onboarding (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        volunteer_id INTEGER NOT NULL,
        orientation_sessions TEXT,
        checklist TEXT,
        submitted_documents TEXT,
        signature TEXT,
        status TEXT DEFAULT 'pending'
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS volunteer_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        volunteer_id INTEGER NOT NULL,
        opportunity_id INTEGER,
        assignment_name TEXT NOT NULL,
        project_id TEXT,
        department TEXT,
        supervisor TEXT,
        start_date TEXT,
        end_date TEXT,
        duty_location TEXT,
        status TEXT DEFAULT 'Planned'
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS volunteer_hours (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        volunteer_id INTEGER NOT NULL,
        project_id TEXT,
        activity TEXT,
        date TEXT,
        hours_worked REAL NOT NULL,
        status TEXT DEFAULT 'approved'
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS volunteer_skills_capacity (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        volunteer_id INTEGER NOT NULL,
        skill_name TEXT NOT NULL,
        level TEXT,
        certifications TEXT,
        training_completed TEXT
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS volunteer_reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        volunteer_id INTEGER NOT NULL,
        review_period TEXT,
        supervisor_feedback TEXT,
        self_assessment TEXT,
        communication_score INTEGER,
        leadership_score INTEGER,
        teamwork_score INTEGER,
        technical_score INTEGER,
        reliability_score INTEGER,
        avg_score REAL
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS volunteer_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        date TEXT,
        venue TEXT,
        attendees TEXT,
        checkins TEXT
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS volunteer_recognition (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        volunteer_id INTEGER NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        badge TEXT,
        date_awarded TEXT
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS indicators (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id TEXT,
        name TEXT NOT NULL,
        target_value REAL DEFAULT 0,
        current_value REAL DEFAULT 0,
        unit TEXT
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS impact_widgets (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        settings TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Database Migration: Checked/Created VMS Platform indicators and impact_widgets tables successfully');
    console.log('Database Migration: Checked/Created VMS Platform tables successfully');
  } catch (e: any) {
    console.error('Database Migration Error (VMS Platform):', e.message);
  }

  // --- SEED ROOT ADMIN ---
  try {
    const rootEmail = process.env.ROOT_ADMIN_EMAIL || 'raidan@ph-ye.org';
    const rootPass = process.env.ROOT_ADMIN_PASSWORD || process.env.DEFAULT_ADMIN_PASSWORD || 'samah@2052024';
    
    const userRow = db.prepare("SELECT uid FROM users WHERE role = 'root' LIMIT 1").get();
    if (!userRow) {
      console.log('Seeding Root Admin User...');
      const bcrypt = (await import('bcryptjs')).default;
      const hashedPass = await bcrypt.hash(rootPass, 10);
      const uid = 'root-' + Date.now();
      
      db.prepare(`
        INSERT INTO users (uid, email, password_hash, displayName, role) 
        VALUES (?, ?, ?, ?, ?)
      `).run(uid, rootEmail, hashedPass, 'Root Administrator', 'root');
      
      console.log(`✅ Root Admin created: ${rootEmail}`);
    }
  } catch (e: any) {
    console.error('Database Migration Error (root seed):', e.message);
  }

  console.log('Database Migration: Slider fields, menus table and PressHouse CMS core updated');
} catch (e: any) {
  console.error('Database Migration Error (slider/menus):', e.message);
}

// User Profile Extensions
try {
  const userProfileCols = [
    { name: 'age', type: 'INTEGER' },
    { name: 'gender', type: 'TEXT' },
    { name: 'workplace', type: 'TEXT' },
    { name: 'work_samples', type: 'TEXT' },
    { name: 'phone', type: 'TEXT' },
    { name: 'whatsapp', type: 'TEXT' },
    { name: 'social_pages', type: 'TEXT' },
    { name: 'bio', type: 'TEXT' },
    { name: 'specialization', type: 'TEXT' },
    { name: 'googleId', type: 'TEXT UNIQUE' },
    { name: 'reset_token', type: 'TEXT' },
    { name: 'reset_token_expiry', type: 'DATETIME' }
  ];

  for (const col of userProfileCols) {
    try {
      db.exec(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type};`);
      console.log(`Database Migration: Added ${col.name} column to users`);
    } catch (e) {
      // Column already exists
    }
  }
} catch (e: any) {
  console.error('Database Migration Error (user profiles):', e.message);
}

// Initialize api_keys and api_logs for SQLite fallback
try {
  let Database = (await import('better-sqlite3')).default;
  const dbPath = path.join(process.cwd(), 'database.sqlite');
  let db = new Database(dbPath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      role TEXT DEFAULT 'publisher',
      scopes TEXT DEFAULT 'articles,reports,violations',
      isActive INTEGER DEFAULT 1,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      lastUsedAt TIMESTAMP
    );
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS api_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      api_key_id INTEGER,
      endpoint TEXT NOT NULL,
      method TEXT NOT NULL,
      status INTEGER,
      ipAddress TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS podcasts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title_ar TEXT NOT NULL,
      title_en TEXT,
      description_ar TEXT,
      description_en TEXT,
      cover_url TEXT,
      host TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS podcast_episodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      podcast_id INTEGER,
      title_ar TEXT NOT NULL,
      title_en TEXT,
      description_ar TEXT,
      description_en TEXT,
      audio_url TEXT,
      duration TEXT,
      publish_date TEXT,
      views INTEGER DEFAULT 0,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS social_reels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT NOT NULL,
      title TEXT,
      isActive INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  try {
    db.exec(`ALTER TABLE social_reels ADD COLUMN isBroken INTEGER DEFAULT 0;`);
  } catch (err) {}
  try {
    db.exec(`ALTER TABLE social_reels ADD COLUMN lastChecked TEXT;`);
  } catch (err) {}
  try {
    db.exec(`ALTER TABLE social_reels ADD COLUMN errorMessage TEXT;`);
  } catch (err) {}
  try {
    db.exec(`ALTER TABLE social_reels ADD COLUMN type TEXT DEFAULT 'social';`);
  } catch (err) {}
  try {
    db.exec(`ALTER TABLE social_reels ADD COLUMN thumbnail TEXT;`);
  } catch (err) {}

  const countRow = db.prepare("SELECT COUNT(*) as count FROM social_reels").get();
  // social_reels seeding removed to ensure clean start
  
  // --- DATA SEEDING REMOVED TO ENSURE CLEAN START ---
  // Users are expected to populate the platform via the Admin Dashboard.
  console.log('Database Migration: Checked/Created SQLite api_keys, api_logs, podcasts, podcast_episodes, and social_reels tables successfully');
} catch (e: any) {
  console.error('Database Migration Error (api_keys/api_logs SQLite):', e.message);
}
}

export default pool;
