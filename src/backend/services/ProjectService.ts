import { BaseService } from './BaseService';

export interface Project {
  program_id: string; // Foreign Key
  title: Record<string, string>; // e.g., { ar: string, en: string }
  type: string;
  status: string;
  start_date: string;
  end_date: string;
  location: string;
  partners_json?: string;
  donors_json?: string;
  objectives?: string;
  outputs?: string;
  beneficiaries_count?: string;
  brief_importance_ar?: string;
  brief_importance_en?: string;
  beneficiaries_direct?: number;
  beneficiaries_indirect?: number;
  coverImage?: string;
}

export class ProjectService extends BaseService<Project> {
  constructor() {
    super('projects');
  }
}
