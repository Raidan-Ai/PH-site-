import { BaseService } from './BaseService';

export interface Program {
  sector_id: string; // Foreign Key
  name: string;
  description?: string;
  imageurl?: string;
  icon?: string;
  category?: string;
}

export class ProgramService extends BaseService<Program> {
  constructor() {
    super('programs');
  }
}
