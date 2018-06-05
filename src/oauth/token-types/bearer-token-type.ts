// import dependencies
import { InvalidArgumentError } from '../errors';
import * as url from 'url';
import { Scope, IBearerTokenResponse, IAbstractTokenType } from '../interfaces';

export default class BearerTokenType implements IAbstractTokenType {
  public accessToken: string;
  public accessTokenLifetime: number;
  public refreshToken: string;
  public scope: Scope;
  
  constructor(accessToken: string, accessTokenLifetime: number, refreshToken: string, scope: Scope) {
    if (!accessToken) {
      throw new InvalidArgumentError('Missing parameter: `accessToken`');
    }

    this.accessToken = accessToken;
    this.accessTokenLifetime = accessTokenLifetime;
    this.refreshToken = refreshToken;
    this.scope = scope;
  }

  public valueOf() : IBearerTokenResponse {
    let object : IBearerTokenResponse = {
      access_token: this.accessToken,
      token_type: 'Bearer'
    }

    if (this.accessTokenLifetime) {
      object.expires_in = this.accessTokenLifetime;
    }

    if (this.refreshToken) {
      object.refresh_token = this.refreshToken;
    }

    if (this.scope) {
      object.scope = this.scope;
    }

    return object;
  }

}