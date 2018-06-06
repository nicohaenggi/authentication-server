import { IUser } from '../schemas/user';

export interface IOneTimeTokenDocument {
  token: string;
  expiresAt: Date;
  user: IUser;
  purpose: string; 
}