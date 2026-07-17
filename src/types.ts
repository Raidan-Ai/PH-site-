export interface User {
  uid: string;
  entityType?: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'root' | 'admin' | 'staff' | 'journalist' | 'user' | 'editor' | 'viewer' | 'content_creator' | 'member';
  department_id?: number | null;
  team_id?: number | null;
  system_role_id?: number | null;
  age?: number;
  gender?: string;
  workplace?: string;
  work_samples?: string;
  phone?: string;
  whatsapp?: string;
  social_pages?: string;
  bio?: string;
  specialization?: string;
  googleId?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  entityType?: string;
  title: string;
  description: string;
  assigned_to: string;
  created_by: string;
  project_id: string;
  entityType?: string;
  program_id?: string;
  sector_id?: string;
  due_date: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  createdAt: string;
}

export interface Article {
  id: string;
  entityType?: string;
  title: { ar: string; en: string };
  content: { ar: string; en: string };
  category: 'news' | 'report' | 'press_release';
  authorId: string;
  status: 'draft' | 'published';
  language: 'ar' | 'en' | 'both';
  mainImage: string;
  sector_id?: string | null;
  program_id?: string | null;
  project_id?: string | null;
  access_tier?: string;
  seo?: {
    title: { ar: string; en: string };
    description: { ar: string; en: string };
    keywords: { ar: string; en: string };
  };
  createdAt: string;
  updatedAt: string;
}

export interface Violation {
  id: string;
  entityType?: string;
  reporterName: string;
  reporterPhone: string;
  victimName: string;
  victimInstitution: string;
  governorate: string;
  district: string;
  date: string;
  perpetrator: string;
  type: string;
  description: string;
  evidenceLinks: string[];
  status: 'pending' | 'verified' | 'rejected';
  createdAt: string;
}

export interface Job {
  id: string;
  entityType?: string;
  title: { ar: string; en: string };
  description: { ar: string; en: string };
  requirements: { ar: string; en: string };
  location: { ar: string; en: string };
  employmentType: 'full-time' | 'part-time' | 'contract' | 'remote';
  salary: string;
  deadline: string;
  status: 'open' | 'closed';
  sector_id?: string | null;
  program_id?: string | null;
  project_id?: string | null;
  seo?: {
    title: { ar: string; en: string };
    description: { ar: string; en: string };
    keywords: { ar: string; en: string };
  };
  createdAt: string;
  updatedAt: string;
}

export interface Tender {
  id: string;
  entityType?: string;
  title: { ar: string; en: string };
  description: { ar: string; en: string };
  documents: string[];
  deadline: string;
  status: 'open' | 'closed';
  createdAt: string;
}

export interface Course {
  id: string;
  entityType?: string;
  title: { ar: string; en: string };
  description: { ar: string; en: string };
  trainer: {
    name: { ar: string; en: string };
    cvUrl: string;
    photoUrl: string;
  };
  applicationDeadline: string;
  applicationUrl: string;
  announcementImage: string;
  videos: { title: string; url: string }[];
  isLive: boolean;
  liveUrl?: string;
  streamKey?: string;
  streamUrl?: string;
  status: 'active' | 'archived';
  seo?: {
    title: { ar: string; en: string };
    description: { ar: string; en: string };
    keywords: { ar: string; en: string };
  };
  createdAt: string;
}

export interface Project {
  id: string;
  entityType?: string;
  title: { ar: string; en: string };
  description: { ar: string; en: string };
  image: string;
  status: 'ongoing' | 'completed' | 'seeking_funding';
  fundingGoal?: number;
  currentFunding?: number;
  isFeatured?: boolean;
  seo?: {
    title: { ar: string; en: string };
    description: { ar: string; en: string };
    keywords: { ar: string; en: string };
  };
  createdAt: string;
}

export interface Event {
  id: string;
  entityType?: string;
  title: { ar: string; en: string };
  description: { ar: string; en: string };
  date: string;
  location: { ar: string; en: string };
  image: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  isLive?: boolean;
  liveStreamUrl?: string;
  streamKey?: string;
  streamUrl?: string;
  media: { type: 'image' | 'video'; url: string }[];
  videos?: { title: string; url: string }[];
  sector_id?: string | null;
  program_id?: string | null;
  project_id?: string | null;
  seo?: {
    title: { ar: string; en: string };
    description: { ar: string; en: string };
    keywords: { ar: string; en: string };
  };
  createdAt: string;
}

export interface JobApplication {
  id: string;
  entityType?: string;
  jobTitle: string;
  fullName: string;
  email: string;
  phone: string;
  coverLetter: string;
  cvName: string;
  portfolioUrl?: string;
  linkedInUrl?: string;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface SiteSettings {
  siteName: { ar: string; en: string };
  logo: string;
  favicon: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  socialLinks: { platform: string; url: string }[];
  youtubeChannelId?: string;
  youtubePlaylistUrl?: string;
  contactEmail: string;
  contactPhone: string;
  address: { ar: string; en: string };
  sshPublicKey?: string;
  tunnelingEnabled?: boolean;
  sliderAutoplayDelay?: number;
  sliderTransitionSpeed?: number;
  seoTitle?: { ar: string; en: string };
  seoDescription?: { ar: string; en: string };
  seoKeywords?: { ar: string; en: string };
  ogDefaultImage?: string;
  ogSiteName?: string;
  ogType?: string;
  googleVerification?: string;
  bingVerification?: string;
  aiEnabled?: boolean;
  aiProvider?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  smtpFrom?: string;
  aiModel?: string;
  aiBaseUrl?: string;
  aiApiKey?: string;
  aiTemperature?: number;
  aiMaxTokens?: number;
  aiSystemInstruction?: string;
  maintenanceMode?: number;
  maintenanceMessage?: string | { ar: string; en: string };
}

export interface HeroSlide {
  id: string;
  entityType?: string;
  title: { ar: string; en: string };
  subtitle: { ar: string; en: string };
  description: { ar: string; en: string };
  mediaType: 'image' | 'video';
  mediaUrl: string;
  animationType: 'fade' | 'slide' | 'zoom' | 'slide-up' | 'slide-down' | 'scale-up' | 'scale-down';
  textAnimation?: 'fade-in' | 'slide-up' | 'slide-down' | 'scale-in' | 'none';
  titleSize?: string;
  subtitleSize?: string;
  descriptionSize?: string;
  buttonSize?: string;
  overlayOpacity?: number;
  textAlign?: 'left' | 'center' | 'right';
  primaryButton: {
    text: { ar: string; en: string };
    link: string;
    icon: string;
  };
  secondaryButton: {
    text: { ar: string; en: string };
    link: string;
    icon: string;
  };
  order: number;
  isActive: boolean;
  createdAt: string;
}
