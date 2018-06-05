// import dependencies
import { InvalidArgumentError } from '../errors';
import { IClient } from '../../db/schemas/client';
import { Scope } from '../interfaces';
import { IUser } from '../../db/schemas/user';
import { IToken } from '../../db/schemas/token';

export default class TokenModel {
  public accessToken: string;
  public accessTokenExpiresAt: Date;
  public client: IClient;
  public refreshToken: string;
  public refreshTokenExpiresAt: Date;
  public accessTokenLifetime: number;
  public scope: Scope;
  public user: IUser;

  public static modelAttributes = ['accessToken', 'accessTokenExpiresAt', 'refreshToken', 'refreshTokenExpiresAt', 'scope', 'client', 'user'];

  constructor(token: IToken) {
    if (!token.accessToken) {
      throw new InvalidArgumentError('Missing parameter: `accessToken`');
    }
  
    if (!token.client) {
      throw new InvalidArgumentError('Missing parameter: `client`');
    }
  
    if (!token.user) {
      throw new InvalidArgumentError('Missing parameter: `user`');
    }
  
    if (token.accessTokenExpiresAt && !(token.accessTokenExpiresAt instanceof Date)) {
      throw new InvalidArgumentError('Invalid parameter: `accessTokenExpiresAt`');
    }
  
    if (token.refreshTokenExpiresAt && !(token.refreshTokenExpiresAt instanceof Date)) {
      throw new InvalidArgumentError('Invalid parameter: `refreshTokenExpiresAt`');
    }

    this.accessToken = token.accessToken;
    this.accessTokenExpiresAt = token.accessTokenExpiresAt;
    this.client = token.client;
    this.refreshToken = token.refreshToken;
    this.refreshTokenExpiresAt = token.refreshTokenExpiresAt;
    this.scope = token.scope;
    this.user = token.user;

    if(this.accessTokenExpiresAt) {
      this.accessTokenLifetime = Math.floor((this.accessTokenExpiresAt.getTime() - new Date().getTime()) / 1000);
    }
  }

}