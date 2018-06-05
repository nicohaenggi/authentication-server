// import dependencies
import { InvalidArgumentError } from '../errors';

export default class TokenModel {
  public accessToken: string;
  public accessTokenExpiresAt: number;
  public client: string;
  public refreshToken: string;
  public refreshTokenExpiresAt: number;
  public accessTokenLifetime: number;
  public scope: string[];
  public user: string;
  public customAttributes: any;

  public static modelAttributes = ['accessToken', 'accessTokenExpiresAt', 'refreshToken', 'refreshTokenExpiresAt', 'scope', 'client', 'user'];

  constructor(data: any = {}, options: any) {
    if (!data.accessToken) {
      throw new InvalidArgumentError('Missing parameter: `accessToken`');
    }
  
    if (!data.client) {
      throw new InvalidArgumentError('Missing parameter: `client`');
    }
  
    if (!data.user) {
      throw new InvalidArgumentError('Missing parameter: `user`');
    }
  
    if (data.accessTokenExpiresAt && !(data.accessTokenExpiresAt instanceof Date)) {
      throw new InvalidArgumentError('Invalid parameter: `accessTokenExpiresAt`');
    }
  
    if (data.refreshTokenExpiresAt && !(data.refreshTokenExpiresAt instanceof Date)) {
      throw new InvalidArgumentError('Invalid parameter: `refreshTokenExpiresAt`');
    }

    this.accessToken = data.accessToken;
    this.accessTokenExpiresAt = data.accessTokenExpiresAt;
    this.client = data.client;
    this.refreshToken = data.refreshToken;
    this.refreshTokenExpiresAt = data.refreshTokenExpiresAt;
    this.scope = data.scope;
    this.user = data.user;

    if (options && options.allowExtendedTokenAttributes) {
      this.customAttributes = {};
  
      for (let key in data) {
        if (data.hasOwnProperty(key) && (TokenModel.modelAttributes.indexOf(key) < 0)) {
          this.customAttributes[key] = data[key];
        }
      }
    }

    if(this.accessTokenExpiresAt) {
      this.accessTokenLifetime = Math.floor((this.accessTokenExpiresAt - new Date().getTime()) / 1000);
    }
  }

}