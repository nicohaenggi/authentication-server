// import dependencies
import AbstractGrantType from './abstract-grant-type';
import { InvalidArgumentError, InvalidGrantError, InvalidRequestError } from '../errors';
import * as is from '../validator/is';
import { IAuthModel, IAbstractGrantTypeOptions, IRequest, Scope, } from '../interfaces';
import { IClient } from '../../db/schemas/client';
import { IUser } from '../../db/schemas/user';
import { ILicense } from '../../db/schemas/license';
import { IToken } from '../../db/schemas/token';
import { ITokenDocument } from '../../db/interfaces/token';

export default class RefreshTokenGrantType extends AbstractGrantType {
  public model: IAuthModel;

  constructor(options: IAbstractGrantTypeOptions) {
    if (!options.model) {
      throw new InvalidArgumentError('Missing parameter: `model`');
    }
  
    super(options);
  }

  /**
   * Handle refresh token grant.
   *
   * @see https://tools.ietf.org/html/rfc6749#section-6
   */
  public async handle(request: IRequest, client: IClient) : Promise<IToken> {
    // get user specified refresh token
    let refreshToken = await this.getRefreshToken(request, client);
    let license = await this.getLicense(client, refreshToken.user);
    
    // revoke refresh token
    await this.revokeToken(refreshToken);

    // create new token
    return await this.saveToken(refreshToken.user, client, refreshToken.scope, license);
  }

  /**
   * Get refresh token.
   */
  public async getRefreshToken(request: IRequest, client: IClient) {
    if (!request.body.refresh_token) {
      throw new InvalidRequestError('Missing parameter: `refresh_token`');
    }
  
    if (!is.vschar(request.body.refresh_token)) {
      throw new InvalidRequestError('Invalid parameter: `refresh_token`');
    }

    let token = await this.model.getRefreshToken(request.body.refresh_token);

    if (!token || token.client.clientId !== client.clientId || !token.user) {
      throw new InvalidGrantError('Invalid grant: refresh token is invalid');
    }

    if (token.refreshTokenExpiresAt && token.refreshTokenExpiresAt < new Date()) {
      throw new InvalidGrantError('Invalid grant: refresh token has expired');
    }

    return token;
  };

  /**
   * Revoke the refresh token.
   *
   * @see https://tools.ietf.org/html/rfc6749#section-6
   */
  public async revokeToken(token: IToken) : Promise<IToken> {
    if (this.alwaysIssueNewRefreshToken === false) {
      return token;
    }

    let isRevoked = await this.model.revokeToken(token);
    if (!isRevoked) {
      throw new InvalidGrantError('Invalid grant: refresh token is invalid');
    }

    return token;
  };

  /**
   * Save token.
   */
  public async saveToken(user: IUser, client: IClient, scope: Scope, license?: ILicense) : Promise<IToken> {
    let accessTokenExpiresAt = this.getAccessTokenExpiresAt();
    let refreshTokenExpiresAt = this.getRefreshTokenExpiresAt();
    let accessToken = await this.generateAccessToken(client, user, scope, accessTokenExpiresAt, license);
    let refreshToken = await this.generateRefreshToken(client, user, scope);
   
    let token : ITokenDocument = {
      scope: scope,
      accessToken,
      accessTokenExpiresAt,
      client,
      user
    }

    if (this.alwaysIssueNewRefreshToken !== false) {
      token.refreshToken = refreshToken;
      token.refreshTokenExpiresAt = refreshTokenExpiresAt;
    }

    return await this.model.saveToken(token);
  }


}