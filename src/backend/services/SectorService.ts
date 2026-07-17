import { BaseService } from './BaseService';

export interface Sector {
  name_ar: string;
  name_en?: string;
  description_ar?: string;
  description_en?: string;
  image?: string;
  icon?: string;
  color?: string;
  sort_order?: number;
  status?: string;
}

export class SectorService extends BaseService<Sector> {
  constructor() {
    super('sectors');
  }
}
