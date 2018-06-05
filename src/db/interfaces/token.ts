import { IClient } from '../schemas/client';
import { IUser } from '../schemas/user';

export interface ITokenDocument {
  accessToken: string;
  accessTokenExpiresAt: Date;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
  client: IClient;
  user: IUser;
  token: string[];
}