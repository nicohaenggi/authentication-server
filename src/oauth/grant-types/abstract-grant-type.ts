// import dependenceis
import { InvalidArgumentError, InvalidScopeError } from '../errors';
import * as is from '../validator/is';
import { generateRandomToken } from '../../utils';
import { IAbstractGrantTypeOptions, IAuthModel, Scope, IRequest } from '../interfaces';
import { IClient } from '../../db/schemas/client';
import { IUser } from '../../db/schemas/user';
import { IToken } from '../../db/schemas/token';

export default abstract class AbstractGrantType {
  public accessTokenLifetime: number;
  public refreshTokenLifetime: number;
  public model: IAuthModel;
  public alwaysIssueNewRefreshToken: boolean;

  constructor(options: IAbstractGrantTypeOptions) {
    if (!options.accessTokenLifetime) {
      throw new InvalidArgumentError('Missing parameter: `accessTokenLifetime`');
    }

    if (!options.model) {
      throw new InvalidArgumentError('Missing parameter: `model`');
    }

    this.accessTokenLifetime = options.accessTokenLifetime;
    this.model = options.model;
    this.refreshTokenLifetime = options.refreshTokenLifetime;
    this.alwaysIssueNewRefreshToken = options.alwaysIssueNewRefreshToken;
  }

  /**
   * Generate access token.
   */
  public async generateAccessToken(client: IClient, user: IUser, scope: Scope, expiresAt: Date) : Promise<string> {
    if (this.model.generateAccessToken) {
      let accessToken = await this.model.generateAccessToken(client, user, scope, expiresAt);
      return accessToken || generateRandomToken();
    }

    return await generateRandomToken();
  }

  /**
   * Generate refresh token.
   */
  public async generateRefreshToken(client: IClient, user: IUser, scope: Scope) : Promise<string> {
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
  public getScope(request: IRequest) : Scope {
    if (!is.nqschar(request.body.scope)) {
      throw new InvalidArgumentError('Invalid parameter: `scope`');
    }
  
    return request.body.scope;
  }

  /**
   * Validate requested scope.
   */
  public async validateScope(client: IClient, user: IUser, scope: Scope) : Promise<Scope> {
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

  public abstract async handle(request: IRequest, client: IClient) : Promise<IToken>;
}