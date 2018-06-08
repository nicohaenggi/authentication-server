// import dependenceis
import * as crypto from 'crypto';
import { InvalidArgumentError, InvalidScopeError, ForbiddenRequestError } from '../errors';
import * as is from '../validator/is';
import { generateRandomToken } from '../../utils';
import { IAbstractGrantTypeOptions, IAuthModel, Scope, IRequest, ISensorData } from '../interfaces';
import { IClient } from '../../db/schemas/client';
import { IUser } from '../../db/schemas/user';
import { IToken } from '../../db/schemas/token';
import { ILicense } from '../../db/schemas/license';
import { IActivation } from '../../db/schemas/activation';

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
  public async generateAccessToken(client: IClient, user: IUser, scope: Scope, expiresAt: Date, license?: ILicense, activation?: IActivation) : Promise<string> {
    if (this.model.generateAccessToken) {
      // encrypt activation payload
      let activationPayload = {
        hwid: activation.hwid,
        hostname: activation.hostname,
        arch: activation.arch,
        cpus: activation.cpus,
        endianness: activation.endianness,
        platform: activation.platform,
        username: activation.username,
      };
      let activationEnc = this.encrypt(client, activationPayload);

      // generate access token
      let accessToken = await this.model.generateAccessToken(client, user, scope, expiresAt, license, activationEnc);
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
   * Get user license
   */
  public async getLicense(client: IClient, user: IUser) : Promise<ILicense> {
    // fetch current license
    let license = await this.model.getLicenseForClientAndUser(client, user);
    if (!license) {
      throw new ForbiddenRequestError('Forbidden: the user does not have a license for this product');
    }

    if (license.expiresAt && license.expiresAt < new Date()) {
      throw new ForbiddenRequestError('Forbidden: license has expired');
    }

    return license;
  }

  /**
   * decode sensor data.
   */
  public decodeSensorData(client: IClient, sensor: any) : ISensorData {
    let decoded = this.decrypt(client, sensor);

    if (!decoded.hwid || !decoded.arch || !decoded.cpus || !decoded.endianness || !decoded.platform || !decoded.username || !decoded.hostname || !decoded.exp || (new Date(decoded.exp) < new Date())) {
      throw new InvalidArgumentError('Invalid Parameter: `requestId`');
    }

    return decoded;
  }

  public validateActivation(payload: ISensorData, activation: IActivation) : void {
    if ((payload.username !== activation.username) || (payload.arch !== activation.arch) || !(JSON.stringify(payload.cpus) == JSON.stringify(activation.cpus)) ||
      (payload.endianness !== activation.endianness) || (payload.platform !== activation.platform) || (payload.hwid !== activation.hwid) || (payload.hostname !== activation.hostname)) {
      throw new InvalidArgumentError('Invalid parameter: `requestId`');
    }
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

  private decrypt(client: IClient, text: string) : ISensorData {
    let decipher = crypto.createDecipheriv('aes-256-cbc', new Buffer(client.fingerprintSecret), new Buffer(client.fingerprintSecret.slice(0, 16)));
    let dec = decipher.update(text, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return JSON.parse(dec);
  }

  private encrypt(client: IClient, activation: any) : string {
    let cipher = crypto.createCipheriv('aes-256-cbc', new Buffer(client.fingerprintSecret), new Buffer(client.fingerprintSecret.slice(0, 16)));
    let crypted = cipher.update(JSON.stringify(activation), 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
  }

  public abstract async handle(request: IRequest, client: IClient) : Promise<IToken>;
}