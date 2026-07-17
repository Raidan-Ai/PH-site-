import { BaseService } from './BaseService';

export interface Partner {
  name: string;
  type: string;
  logo?: string;
  country?: string;
  website?: string;
  contact_person?: string;
}

export class PartnerService extends BaseService<Partner> {
  constructor() {
    super('partners');
  }
}
