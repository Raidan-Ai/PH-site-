import { BaseService } from './BaseService';

export interface Report {
  project_id?: string;
  title: string;
  pdf_url?: string;
  author_id?: string;
  published_date: string;
}

export class ReportService extends BaseService<Report> {
  constructor() {
    super('reports');
  }
}
