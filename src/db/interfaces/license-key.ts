import { IClient } from '../schemas/client';
import { ILicense } from '../schemas/license';

export interface ILicenseKeyDocument {
  key: string;
  expiresAt: Date;
  client: IClient;
  license: ILicense;
}