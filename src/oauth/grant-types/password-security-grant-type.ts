// import dependencies
import AbstractGrantType from './abstract-grant-type';
import { InvalidArgumentError, InvalidGrantError, InvalidRequestError, ForbiddenRequestError } from '../errors';
import * as is from '../validator/is';
import { generateRandomToken } from '../../utils';
import { promisify } from 'bluebird';
import { IAuthModel, IAbstractGrantTypeOptions, IRequest, Scope, ISensorData } from '../interfaces';
import { IClient } from '../../db/schemas/client';
import { IUser } from '../../db/schemas/user';
import { IToken } from '../../db/schemas/token';
import { ITokenDocument } from '../../db/interfaces/token';
import { IActivation } from '../../db/schemas/activation';
import { ILicense } from '../../db/schemas/license';

export default class PasswordSecurityGrantType extends AbstractGrantType {
  public model: IAuthModel;

  constructor(options: IAbstractGrantTypeOptions) {
    if (!options.model) {
      throw new InvalidArgumentError('Missing parameter: `model`');
    }
  
    super(options);
  }

  public async handle(request: IRequest, client: IClient) : Promise<IToken> {
    let scope = this.getScope(request);
    let user = await this.getUser(request);
    let license = await this.getLicense(client, user);
    let activation = await this.getActivation(request, client, license);

    return await this.saveToken(user, client, scope, license, activation);
  }

  /**
   * Get user using a username/password combination.
   */
  public async getUser(request: IRequest) : Promise<IUser> {
    if (!request.body.username) {
      throw new InvalidRequestError('Missing parameter: `username`');
    }
  
    if (!request.body.password) {
      throw new InvalidRequestError('Missing parameter: `password`');
    }
  
    if (!is.uchar(request.body.username)) {
      throw new InvalidRequestError('Invalid parameter: `username`');
    }
  
    if (!is.uchar(request.body.password)) {
      throw new InvalidRequestError('Invalid parameter: `password`');
    }

    let user = await this.model.getUser(request.body.username, request.body.password);
    if (!user) {
      throw new InvalidGrantError('Invalid grant: user credentials are invalid');
    }

    return user;
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
    let payload = this.decodeSensorData(request.body.requestId);
    let activation = await this.model.getActivationByHWID(payload.hwid, license);

    if (!activation) {
      // # there is no active activation for this machine
      let canActivate = await this.model.incrementActivation(license, client.maxActiveSessions);
      if (!canActivate) {
        // throw an error (max activations reached)
        throw new ForbiddenRequestError('Forbidden: maximal amount of activations reached');
      }

      // create new activation
      return await this.model.addActivation(payload.hwid, license, payload.arch, payload.cpus, payload.endianness, payload.platform, payload.username, payload.hostname);
    } else {
      // # there is an active activation for this machine

      // make sure signature did not change
      this.validateActivation(payload, activation);

      // !TODO: maybe wipe old reset tokens?
      return activation;
    }
  }

  /**
   * Save token.
   */
  public async saveToken(user: IUser, client: IClient, scope: Scope, license: ILicense, activation: IActivation) : Promise<IToken> {
    let validatedScope = await this.validateScope(client, user, scope);
    let accessTokenExpiresAt = this.getAccessTokenExpiresAt();
    let refreshTokenExpiresAt = this.getRefreshTokenExpiresAt();
    let accessToken = await this.generateAccessToken(client, user, scope, accessTokenExpiresAt, license, activation);
    let refreshToken = await this.generateRefreshToken(client, user, scope);

    let token : ITokenDocument = {
      scope: validatedScope,
      accessToken,
      accessTokenExpiresAt,
      refreshToken,
      refreshTokenExpiresAt,
      client,
      user
    }

    return await this.model.saveToken(token);
  }

}