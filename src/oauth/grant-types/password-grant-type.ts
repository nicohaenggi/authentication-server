// import dependencies
import AbstractGrantType from './abstract-grant-type';
import { InvalidArgumentError, InvalidGrantError, InvalidRequestError } from '../errors';
import * as is from '../validator/is';
import { generateRandomToken } from '../../utils';
import { promisify } from 'bluebird';
import { IAuthModel, IAbstractGrantTypeOptions, IRequest, Scope, } from '../interfaces';
import { IClient } from '../../db/schemas/client';
import { IUser } from '../../db/schemas/user';
import { IToken } from '../../db/schemas/token';
import { ITokenDocument } from '../../db/interfaces/token';

export default class PasswordGrantType extends AbstractGrantType {
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
    return await this.saveToken(user, client, scope);
  }

  /**
   * Get user using a username/password combination.
   */
  public async getUser(request: any) : Promise<IUser> {
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
   * Save token.
   */
  public async saveToken(user: IUser, client: IClient, scope: Scope) : Promise<IToken> {
    let validatedScope = await this.validateScope(client, user, scope);
    let accessToken = await this.generateAccessToken(client, user, scope);
    let refreshToken = await this.generateRefreshToken(client, user, scope);
    let accessTokenExpiresAt = this.getAccessTokenExpiresAt();
    let refreshTokenExpiresAt = this.getRefreshTokenExpiresAt();

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