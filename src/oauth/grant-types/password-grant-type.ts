// import dependencies
import AbstractGrantType from './abstract-grant-type';
import { InvalidArgumentError, InvalidGrantError, InvalidRequestError } from '../errors';
import * as is from '../validator/is';
import { generateRandomToken } from '../../utils';
import { promisify } from 'bluebird';

export default class PasswordGrantType extends AbstractGrantType {
  public accessTokenLifetime: number;
  public refreshTokenLifetime: number;
  public model: any;
  public alwaysIssueNewRefreshToken: boolean;

  constructor(getUser: Function, saveToken: Function, accessTokenLifetime: number, refreshTokenLifetime: number, alwaysIssueNewRefreshToken: boolean, model: any) {
    if (!model) {
      throw new InvalidArgumentError('Missing parameter: `model`');
    }
  
    if (!model.getUser) {
      throw new InvalidArgumentError('Invalid argument: model does not implement `getUser()`');
    }
  
    if (!model.saveToken) {
      throw new InvalidArgumentError('Invalid argument: model does not implement `saveToken()`');
    }

    super(accessTokenLifetime, refreshTokenLifetime, alwaysIssueNewRefreshToken, model);
  }

  public handle(request: any, client: any) {
    if (!request) {
      throw new InvalidArgumentError('Missing parameter: `request`');
    }
  
    if (!client) {
      throw new InvalidArgumentError('Missing parameter: `client`');
    }

    let scope = this.getScope(request);

    return Promise.bind(this)
      .then(() => {
        return this.getUser(request);
      })
      .then((user: any) => {
        return this.saveToken(user, client, scope);
      });
  }

  /**
   * Get user using a username/password combination.
   */
  public async getUser(request: any) : Promise<any> {
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
  public async saveToken(user: any, client: any, dScope: string[]) : Promise<void> {
    var fns = [
      this.validateScope(user, client, dScope),
      this.generateAccessToken(client, user, dScope),
      this.generateRefreshToken(client, user, dScope),
      this.getAccessTokenExpiresAt(),
      this.getRefreshTokenExpiresAt()
    ];

    let scope = this.validateScope(user, client, dScope);
    let accessToken = await this.generateAccessToken(client, user, dScope);
    let refreshToken = await this.generateRefreshToken(client, user, dScope);
    let accessTokenExpiresAt = this.getAccessTokenExpiresAt();
    let refreshTokenExpiresAt = this.getRefreshTokenExpiresAt();

    let token = {
      accessToken,
      accessTokenExpiresAt,
      refreshToken,
      refreshTokenExpiresAt,
      scope
    }

    await this.model.saveToken(token, client, user);
    return;
  }


}