import { IClient } from '../schemas/client';
import { IUser } from '../schemas/user';

export interface ILicenseDocument {
  expiresAt: Date;
  numActivated: number;
  client: IClient;
  user: IUser;
}