// import dependenceis
import { InvalidArgumentError, InvalidScopeError } from '../errors';
import * as is from '../validator/is';
import { generateRandomToken } from '../../utils';

export default class AbstractGrantType {
  public accessTokenLifetime: number;
  public refreshTokenLifetime: number;
  public model: any;
  public alwaysIssueNewRefreshToken: boolean;

  constructor(accessTokenLifetime: number, refreshTokenLifetime: number, alwaysIssueNewRefreshToken: boolean, model: any) {
    if (!accessTokenLifetime) {
      throw new InvalidArgumentError('Missing parameter: `accessTokenLifetime`');
    }

    if (!model) {
      throw new InvalidArgumentError('Missing parameter: `model`');
    }

    this.accessTokenLifetime = accessTokenLifetime;
    this.model = model;
    this.refreshTokenLifetime = refreshTokenLifetime;
    this.alwaysIssueNewRefreshToken = alwaysIssueNewRefreshToken;
  }

  /**
   * Generate access token.
   */
  public async generateAccessToken(client: string, user: string, scope: string[]) : Promise<string> {
    if (this.model.generateAccessToken) {
      let accessToken = await this.model.generateAccessToken(client, user, scope);
      return accessToken || generateRandomToken();
    }

    return await generateRandomToken();
  }

  /**
   * Generate refresh token.
   */
  public async generateRefreshToken(client: string, user: string, scope: string[]) : Promise<string> {
    if (this.model.generateAccessToken) {
      let refreshToken = await this.model.generateRefreshToken(client, user, scope);
      return refreshToken || generateRandomToken();
    }

    return await generateRandomToken();
  }

  /**
   * Get access token expiration date.
   */
  public getAccessTokenExpiresAt() : Date {
    let expires = new Date();
    expires.setSeconds(expires.getSeconds() + this.accessTokenLifetime);
    return expires;
  }

  /**
   * Get refresh token expiration date.
   */
  public getRefreshTokenExpiresAt() : Date {
    let expires = new Date();
    expires.setSeconds(expires.getSeconds() + this.refreshTokenLifetime);
    return expires;
  }
  
  /**
   * Get scope from the request body.
   */
  public getScope(request: any) : string[] {
    if (!is.nqschar(request.body.scope)) {
      throw new InvalidArgumentError('Invalid parameter: `scope`');
    }
  
    return request.body.scope;
  }

  /**
   * Validate requested scope.
   */
  public async validateScope(client: string, user: string, scope: string[]) : Promise<string[]> {
    if (this.model.validateScope) {
      let newScope = await this.model.validateScope(user, client, scope);
      if (!newScope) {
        throw new InvalidScopeError('Invalid scope: Requested scope is invalid');
      }
      return newScope;

    } else {
      return scope;
    }
  }

}