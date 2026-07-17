export type AppRoleName = 'Super Admin' | 'Developer' | 'Content Editor' | 'Legal Lawyer' | 'Academy Trainer' | 'Reporter' | 'General User' | 'Guest';

export interface RolePermissions {
  role: AppRoleName;
  dbRoles: string[];
  descriptionAr: string;
  descriptionEn: string;
  capabilities: {
    news: { create: boolean; edit: boolean; publish: boolean; delete: boolean; view: boolean };
    violations: { create: boolean; edit: boolean; publish: boolean; delete: boolean; view: boolean };
    tenders: { create: boolean; edit: boolean; publish: boolean; delete: boolean; view: boolean };
    jobs: { create: boolean; edit: boolean; publish: boolean; delete: boolean; view: boolean };
    forum: { create: boolean; edit: boolean; publish: boolean; delete: boolean; view: boolean };
    users: { manage: boolean };
    settings: { manage: boolean };
  };
}

export const ROLE_PERMISSIONS_MATRIX: Record<AppRoleName, RolePermissions> = {
  'Super Admin': {
    role: 'Super Admin',
    dbRoles: ['root', 'admin'],
    descriptionAr: 'تحكم كامل ومطلق بنظام تشغيل بيت الصحافة وإعدادات الموقع وإدارة حسابات المستخدمين.',
    descriptionEn: 'Absolute full access, capability to manage users, configurations, and overwrite and publish all sections.',
    capabilities: {
      news: { create: true, edit: true, publish: true, delete: true, view: true },
      violations: { create: true, edit: true, publish: true, delete: true, view: true },
      tenders: { create: true, edit: true, publish: true, delete: true, view: true },
      jobs: { create: true, edit: true, publish: true, delete: true, view: true },
      forum: { create: true, edit: true, publish: true, delete: true, view: true },
      users: { manage: true },
      settings: { manage: true }
    }
  },
  'Developer': {
    role: 'Developer',
    dbRoles: ['developer'],
    descriptionAr: 'صلاحيات وصول تقنية للواجهات البرمجية والتحليل ومراقبة أداء النظام وقاعدة البيانات دون تعديل المحتوى الإعلامي الأساسي.',
    descriptionEn: 'Technical clearance for APIs, analytics, monitoring system health, and database utilities without direct editorial override.',
    capabilities: {
      news: { create: true, edit: true, publish: false, delete: false, view: true },
      violations: { create: false, edit: false, publish: false, delete: false, view: true },
      tenders: { create: true, edit: true, publish: false, delete: false, view: true },
      jobs: { create: true, edit: true, publish: false, delete: false, view: true },
      forum: { create: true, edit: true, publish: true, delete: true, view: true },
      users: { manage: true },
      settings: { manage: true }
    }
  },
  'Content Editor': {
    role: 'Content Editor',
    dbRoles: ['editor', 'staff'],
    descriptionAr: 'صلاحيات إدارة الأخبار والمشاريع والمناقصات والإشراف على المنتدى والمحتوى الإداري دون تعديل إعدادات النظام.',
    descriptionEn: 'Manage, edit and publish articles, forums, job postings and tenders. Can approve reports, but can\'t modify key site configurations.',
    capabilities: {
      news: { create: true, edit: true, publish: true, delete: true, view: true },
      violations: { create: true, edit: true, publish: true, delete: false, view: true },
      tenders: { create: true, edit: true, publish: true, delete: true, view: true },
      jobs: { create: true, edit: true, publish: true, delete: true, view: true },
      forum: { create: true, edit: true, publish: true, delete: true, view: true },
      users: { manage: false },
      settings: { manage: false }
    }
  },
  'Legal Lawyer': {
    role: 'Legal Lawyer',
    dbRoles: ['lawyer'],
    descriptionAr: 'مستشار قانوني مخصص لتدقيق والتحقيق بملفات وبلاغات الانتهاكات وتقديم التوصيات والدعم القانوني للضحايا.',
    descriptionEn: 'Dedicated legal counsel with specialized access to manage, edit, and provide reports on violation files and legal defense cases.',
    capabilities: {
      news: { create: false, edit: false, publish: false, delete: false, view: true },
      violations: { create: true, edit: true, publish: true, delete: false, view: true },
      tenders: { create: false, edit: false, publish: false, delete: false, view: true },
      jobs: { create: false, edit: false, publish: false, delete: false, view: true },
      forum: { create: true, edit: true, publish: true, delete: false, view: true },
      users: { manage: false },
      settings: { manage: false }
    }
  },
  'Academy Trainer': {
    role: 'Academy Trainer',
    dbRoles: ['trainer'],
    descriptionAr: 'صلاحيات إدارة وتطوير المساقات الأكاديمية وصياغة المواد التدريبية وإصدار الشهادات للطلاب بنجاح.',
    descriptionEn: 'Academic administrator capable of organizing training programs, grading applicants, and awarding professional certificates.',
    capabilities: {
      news: { create: true, edit: false, publish: false, delete: false, view: true },
      violations: { create: false, edit: false, publish: false, delete: false, view: true },
      tenders: { create: false, edit: false, publish: false, delete: false, view: true },
      jobs: { create: true, edit: true, publish: false, delete: false, view: true },
      forum: { create: true, edit: true, publish: true, delete: false, view: true },
      users: { manage: false },
      settings: { manage: false }
    }
  },
  'Reporter': {
    role: 'Reporter',
    dbRoles: ['journalist', 'content_creator'],
    descriptionAr: 'كتابة التقارير الإخبارية وصياغة مسودات الأخبار، وإدخال بلاغات الانتهاكات الجديدة وتقديمها للمراجعة والنشر.',
    descriptionEn: 'Create drafts, report physical/digital press violations, participate in forums and read all pages.',
    capabilities: {
      news: { create: true, edit: true, publish: false, delete: false, view: true },
      violations: { create: true, edit: false, publish: false, delete: false, view: true },
      tenders: { create: false, edit: false, publish: false, delete: false, view: true },
      jobs: { create: false, edit: false, publish: false, delete: false, view: true },
      forum: { create: true, edit: true, publish: true, delete: false, view: true },
      users: { manage: false },
      settings: { manage: false }
    }
  },
  'General User': {
    role: 'General User',
    dbRoles: ['user', 'viewer'],
    descriptionAr: 'قراءة الأخبار، تقديم البلاغات الأولية لحوادث الانتهاك، التقديم على الوظائف والفرص التطوعية، والمشاركة في المنتدى.',
    descriptionEn: 'Browse site articles, tenders, and job openings. Report violations for verification, write posts in public forums.',
    capabilities: {
      news: { create: false, edit: false, publish: false, delete: false, view: true },
      violations: { create: true, edit: false, publish: false, delete: false, view: true },
      tenders: { create: false, edit: false, publish: false, delete: false, view: true },
      jobs: { create: false, edit: false, publish: false, delete: false, view: true },
      forum: { create: true, edit: true, publish: false, delete: false, view: true },
      users: { manage: false },
      settings: { manage: false }
    }
  },
  'Guest': {
    role: 'Guest',
    dbRoles: ['guest'],
    descriptionAr: 'حساب زائر، تصفح المحتوى والمقالات العامة والتقارير الأكاديمية المتاحة للجمهور مع صلاحية قراءة فقط دون القدرة على التفاعل.',
    descriptionEn: 'Guest status, read-only browse of public reports, academy curricula, and observatory publications without interactive post authorization.',
    capabilities: {
      news: { create: false, edit: false, publish: false, delete: false, view: true },
      violations: { create: false, edit: false, publish: false, delete: false, view: true },
      tenders: { create: false, edit: false, publish: false, delete: false, view: true },
      jobs: { create: false, edit: false, publish: false, delete: false, view: true },
      forum: { create: false, edit: false, publish: false, delete: false, view: true },
      users: { manage: false },
      settings: { manage: false }
    }
  }
};

/**
 * Maps a database role string (e.g. 'root' or 'editor') to an AppRoleName.
 */
export function getAppRoleForDbRole(dbRole: string): AppRoleName {
  if (dbRole === 'root' || dbRole === 'admin') return 'Super Admin';
  if (dbRole === 'developer') return 'Developer';
  if (dbRole === 'editor' || dbRole === 'staff') return 'Content Editor';
  if (dbRole === 'lawyer') return 'Legal Lawyer';
  if (dbRole === 'trainer') return 'Academy Trainer';
  if (dbRole === 'journalist' || dbRole === 'content_creator') return 'Reporter';
  if (dbRole === 'guest') return 'Guest';
  return 'General User';
}

/**
 * Checks if a specific db role has permission for a specific module capability
 */
export function hasCapability(
  dbRole: string,
  module: 'news' | 'violations' | 'tenders' | 'jobs' | 'forum',
  action: 'create' | 'edit' | 'publish' | 'delete' | 'view'
): boolean {
  const appRole = getAppRoleForDbRole(dbRole);
  const perm = ROLE_PERMISSIONS_MATRIX[appRole];
  return perm?.capabilities?.[module]?.[action] || false;
}

/**
 * Checks if a user has management permissions (User profiles or System Settings)
 */
export function canManage(dbRole: string, aspect: 'users' | 'settings'): boolean {
  const appRole = getAppRoleForDbRole(dbRole);
  const perm = ROLE_PERMISSIONS_MATRIX[appRole];
  return perm?.capabilities?.[aspect]?.manage || false;
}
