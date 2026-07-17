import { BaseService } from './BaseService';

export interface Indicator {
  project_id: string; // Foreign Key
  name: string;
  target_value: number;
  current_value: number;
  unit: string;
}

export class IndicatorService extends BaseService<Indicator> {
  constructor() {
    super('indicators');
  }
}
