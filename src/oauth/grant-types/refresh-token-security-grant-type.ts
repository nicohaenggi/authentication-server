// import dependencies
import AbstractGrantType from './abstract-grant-type';
import { InvalidArgumentError, InvalidGrantError, InvalidRequestError, ForbiddenRequestError } from '../errors';
import * as is from '../validator/is';
import { generateRandomToken } from '../../utils';
import { promisify } from 'bluebird';
import { IAuthModel, IAbstractGrantTypeOptions, IRequest, Scope, } from '../interfaces';
import { IClient } from '../../db/schemas/client';
import { IUser } from '../../db/schemas/user';
import { IToken } from '../../db/schemas/token';
import { ITokenDocument } from '../../db/interfaces/token';
import { ILicense } from '../../db/schemas/license';
import { IActivation } from '../../db/schemas/activation';

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
    let activation = await this.getActivation(request, client, license);

    // revoke refresh token
    await this.revokeToken(refreshToken);

    // create new token
    return await this.saveToken(refreshToken.user, client, refreshToken.scope, activation, license);
  }

  /**
   * Get current activation
   */
  public async getActivation(request: IRequest, client: IClient, license: ILicense) : Promise<IActivation> {
    if (!request.body.requestId) {
      throw new InvalidRequestError('Missing Parameter: `requestId`');
    }

    if (!is.uchar(request.body.requestId)) {
      throw new InvalidRequestError('Invalid parameter: `requestId`');
    }

    // fetch current activation
    let payload = this.decodeSensorData(client, request.body.requestId);
    let activation = await this.model.getActivationByHWIDAndLicense(payload.hwid, license);

    if (!activation) {
      // there is no active activation for this machine
      throw new ForbiddenRequestError('Forbidden: activation does not exist');
    }

    // # there is an active activation for this machine
    // make sure signature did not change
    this.validateActivation(payload, activation);

    // !TODO: maybe wipe old reset tokens?
    return activation;
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
  public async saveToken(user: IUser, client: IClient, scope: Scope, activation: IActivation, license?: ILicense) : Promise<IToken> {
    let accessTokenExpiresAt = this.getAccessTokenExpiresAt();
    let refreshTokenExpiresAt = this.getRefreshTokenExpiresAt();
    let accessToken = await this.generateAccessToken(client, user, scope, accessTokenExpiresAt, license, activation);
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