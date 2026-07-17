import { BaseService } from './BaseService';

export interface Activity {
  project_id: string; // Foreign Key
  title: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status: string;
}

export class ActivityService extends BaseService<Activity> {
  constructor() {
    super('project_activities');
  }
}
