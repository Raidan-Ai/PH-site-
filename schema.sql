CREATE TABLE users (
  uid VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255),
  displayName VARCHAR(255),
  photoURL TEXT,
  role ENUM('root', 'admin', 'staff', 'journalist', 'user', 'editor', 'viewer', 'content_creator') NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE articles (
  id VARCHAR(255) PRIMARY KEY,
  title JSON NOT NULL,
  content JSON NOT NULL,
  category ENUM('news', 'report', 'press_release') NOT NULL,
  authorId VARCHAR(255),
  status ENUM('draft', 'published') NOT NULL,
  language ENUM('ar', 'en', 'both') NOT NULL,
  mainImage TEXT,
  show_in_slider BOOLEAN DEFAULT FALSE,
  slider_caption JSON,
  slider_button_text JSON,
  slider_image TEXT,
  seo JSON,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE violations (
  id VARCHAR(255) PRIMARY KEY,
  reporterName VARCHAR(255),
  reporterPhone VARCHAR(255),
  reporterType VARCHAR(255),
  reporterRelation VARCHAR(255),
  victimName VARCHAR(255),
  victimInstitution VARCHAR(255),
  victimPenName VARCHAR(255),
  victimSocials TEXT,
  victimPhone VARCHAR(255),
  governorate VARCHAR(255),
  district VARCHAR(255),
  date DATETIME,
  perpetrator VARCHAR(255),
  type VARCHAR(255),
  violationReason TEXT,
  description TEXT,
  evidenceTypes TEXT,
  evidenceLinks JSON,
  needs TEXT,
  privacyPolicy VARCHAR(255),
  status ENUM('pending', 'verified', 'rejected') NOT NULL,
  latitude REAL,
  longitude REAL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE jobs (
  id VARCHAR(255) PRIMARY KEY,
  title JSON NOT NULL,
  description JSON NOT NULL,
  requirements JSON NOT NULL,
  deadline DATETIME,
  status ENUM('open', 'closed') NOT NULL,
  show_in_slider BOOLEAN DEFAULT FALSE,
  slider_caption JSON,
  slider_button_text JSON,
  slider_image TEXT,
  seo JSON,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tenders (
  id VARCHAR(255) PRIMARY KEY,
  title JSON NOT NULL,
  description JSON NOT NULL,
  documents JSON,
  deadline DATETIME,
  status ENUM('open', 'closed') NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE courses (
  id VARCHAR(255) PRIMARY KEY,
  title JSON NOT NULL,
  description JSON NOT NULL,
  trainer JSON NOT NULL,
  applicationDeadline DATETIME,
  applicationUrl TEXT,
  announcementImage TEXT,
  videos JSON,
  isLive BOOLEAN DEFAULT FALSE,
  liveUrl TEXT,
  streamKey VARCHAR(255),
  streamUrl TEXT,
  status ENUM('active', 'archived') NOT NULL,
  show_in_slider BOOLEAN DEFAULT FALSE,
  slider_caption JSON,
  slider_button_text JSON,
  slider_image TEXT,
  seo JSON,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE projects (
  id VARCHAR(255) PRIMARY KEY,
  title JSON NOT NULL,
  description JSON NOT NULL,
  image TEXT,
  status ENUM('ongoing', 'completed', 'seeking_funding') NOT NULL,
  fundingGoal DECIMAL(10, 2),
  currentFunding DECIMAL(10, 2),
  isFeatured BOOLEAN DEFAULT FALSE,
  show_in_slider BOOLEAN DEFAULT FALSE,
  slider_caption JSON,
  slider_button_text JSON,
  slider_image TEXT,
  seo JSON,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE events (
  id VARCHAR(255) PRIMARY KEY,
  title JSON NOT NULL,
  description JSON NOT NULL,
  event_date DATETIME,
  location JSON NOT NULL,
  image TEXT,
  status ENUM('upcoming', 'ongoing', 'completed') NOT NULL,
  isLive BOOLEAN DEFAULT FALSE,
  liveStreamUrl TEXT,
  streamKey VARCHAR(255),
  streamUrl TEXT,
  show_in_slider BOOLEAN DEFAULT FALSE,
  slider_caption JSON,
  slider_button_text JSON,
  slider_image TEXT,
  media JSON,
  seo JSON,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE menus (
  id INT AUTO_INCREMENT PRIMARY KEY,
  location ENUM('dock', 'footer') NOT NULL,
  title JSON NOT NULL,
  icon VARCHAR(255),
  path VARCHAR(255) NOT NULL,
  `order` INT,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE job_applications (
  id VARCHAR(255) PRIMARY KEY,
  jobTitle VARCHAR(255),
  fullName VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(255),
  coverLetter TEXT,
  cvName VARCHAR(255),
  portfolioUrl TEXT,
  linkedInUrl TEXT,
  status ENUM('pending', 'reviewed', 'accepted', 'rejected') NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE site_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  siteName JSON,
  logo TEXT,
  favicon TEXT,
  primaryColor VARCHAR(50),
  secondaryColor VARCHAR(50),
  fontFamily VARCHAR(50),
  socialLinks JSON,
  contactEmail VARCHAR(255),
  contactPhone VARCHAR(255),
  address JSON,
  sshPublicKey TEXT,
  tunnelingEnabled BOOLEAN DEFAULT FALSE,
  livestream JSON,
  sliderAutoplayDelay INT DEFAULT 8000,
  sliderTransitionSpeed INT DEFAULT 1000,
  seoTitle JSON,
  seoDescription JSON,
  seoKeywords JSON,
  ogDefaultImage TEXT,
  ogSiteName TEXT,
  ogType VARCHAR(50) DEFAULT 'website',
  googleVerification TEXT,
  bingVerification TEXT,
  aiEnabled BOOLEAN DEFAULT TRUE,
  aiModel TEXT DEFAULT 'nvidia/qwen-2.5-coder-32b-instruct',
  aiBaseUrl TEXT DEFAULT 'https://integrate.api.nvidia.com/v1',
  aiApiKey TEXT,
  aiTemperature REAL DEFAULT 0.3,
  aiMaxTokens INTEGER DEFAULT 1524,
  aiSystemInstruction TEXT
);

CREATE TABLE page_content (
  id INT AUTO_INCREMENT PRIMARY KEY,
  page_name VARCHAR(255) NOT NULL,
  section_name VARCHAR(255) NOT NULL,
  content JSON NOT NULL,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY (page_name, section_name)
);

CREATE TABLE media (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  type VARCHAR(100),
  size INT,
  uploadedBy VARCHAR(255),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE hero_slides (
  id VARCHAR(255) PRIMARY KEY,
  title JSON NOT NULL,
  subtitle JSON NOT NULL,
  description JSON NOT NULL,
  mediaType ENUM('image', 'video') NOT NULL,
  mediaUrl TEXT NOT NULL,
  animationType ENUM('fade', 'slide', 'zoom', 'slide-up', 'slide-down', 'scale-up', 'scale-down') NOT NULL,
  textAnimation ENUM('fade-in', 'slide-up', 'slide-down', 'scale-in', 'none') DEFAULT 'slide-up',
  titleSize VARCHAR(50) DEFAULT 'text-4xl md:text-6xl lg:text-7xl',
  subtitleSize VARCHAR(50) DEFAULT 'text-xs',
  descriptionSize VARCHAR(50) DEFAULT 'text-lg md:text-xl',
  buttonSize VARCHAR(50) DEFAULT 'px-8 py-4',
  overlayOpacity INT DEFAULT 60,
  textAlign ENUM('left', 'center', 'right') DEFAULT 'left',
  primaryButton JSON,
  secondaryButton JSON,
  `order` INT,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscribers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  source VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS newsletter_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  recipientCount INTEGER
);

CREATE TABLE IF NOT EXISTS authorized_telegram_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chatId VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255),
  displayName VARCHAR(255),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Enterprise CMS Modules Database Extension

CREATE TABLE IF NOT EXISTS institution_identity (
  id INT PRIMARY KEY DEFAULT 1,
  name_ar TEXT,
  name_en TEXT,
  description_ar TEXT,
  description_en TEXT,
  vision_ar TEXT,
  vision_en TEXT,
  mission_ar TEXT,
  mission_en TEXT,
  goals JSON,
  work_fields JSON,
  logo_main TEXT,
  logo_colored TEXT,
  logo_dark TEXT,
  logo_white TEXT,
  favicon TEXT
);

CREATE TABLE IF NOT EXISTS employees (
  id VARCHAR(255) PRIMARY KEY,
  full_name TEXT NOT NULL,
  employee_id VARCHAR(50),
  position TEXT,
  department TEXT,
  photo_url TEXT,
  email TEXT,
  phone TEXT,
  status ENUM('active', 'inactive') DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS board_members (
  id VARCHAR(255) PRIMARY KEY,
  full_name TEXT NOT NULL,
  position TEXT,
  photo_url TEXT,
  bio TEXT,
  sort_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR(255) PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  partner_id VARCHAR(255),
  donor_id VARCHAR(255),
  beneficiaries_count INT DEFAULT 0,
  start_date DATE,
  end_date DATE,
  status ENUM('planned', 'ongoing', 'completed') DEFAULT 'planned',
  goals JSON,
  activities JSON,
  deliverables JSON,
  location_governorate TEXT,
  location_district TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS partners (
  id VARCHAR(255) PRIMARY KEY,
  name TEXT NOT NULL,
  type ENUM('donor', 'executive_partner', 'technical_partner', 'government') DEFAULT 'donor',
  logo TEXT,
  country TEXT,
  website TEXT,
  contact_person TEXT
);

CREATE TABLE IF NOT EXISTS programs (
  id VARCHAR(255) PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  imageurl TEXT,
  icon TEXT,
  category ENUM('protection', 'training', 'media', 'tech', 'research') DEFAULT 'training'
);

-- YemenJPT - Journalist Safety Intelligence Agent tables
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
);

CREATE TABLE IF NOT EXISTS jpt_watchlists (
  id VARCHAR(255) PRIMARY KEY,
  type VARCHAR(50), -- 'journalist', 'organization', 'keyword', 'location'
  name VARCHAR(255),
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS jpt_alerts (
  id VARCHAR(255) PRIMARY KEY,
  incidentId VARCHAR(255),
  victimName VARCHAR(255),
  type VARCHAR(255),
  severity VARCHAR(50), -- 'critical', 'high'
  notifiedTeams VARCHAR(255), -- Comma-separated
  sentAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS jpt_crawl_logs (
  id VARCHAR(255) PRIMARY KEY,
  sourceUrl VARCHAR(255),
  extractedCount INTEGER,
  rawLog TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

