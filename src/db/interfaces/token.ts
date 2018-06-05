import { IClient } from '../schemas/client';
import { IUser } from '../schemas/user';
import { Scope } from '../../oauth/interfaces';

export interface ITokenDocument {
  accessToken: string;
  accessTokenExpiresAt: Date;
  refreshToken?: string;
  refreshTokenExpiresAt?: Date;
  client: IClient;
  user: IUser;
  scope: Scope;
}