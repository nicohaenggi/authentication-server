// import dependencies
import * as _ from 'lodash';
import BearerTokenType from '../token-types/bearer-token-type';
import { InvalidArgumentError, InvalidClientError, InvalidRequestError, OAuthError, ServerError, UnauthorizedClientError, UnsupportedGrantTypeError } from '../errors';
import { IRequest, IResponse, TokenHandlerOptionsInternal, IAuthModel, IClientCredentials, IAbstractTokenType, Constructor, IAbstractGrantTypeOptions } from '../interfaces';
import { IClient } from '../../db/schemas/client';
import { IToken } from '../../db/schemas/token';
import TokenModel from '../models/token-model';
import * as auth from 'basic-auth';
import * as is from '../validator/is';

import passwordType from '../grant-types/password-grant-type';
import passwordSecurityType from '../grant-types/password-security-grant-type';
import refreshTokenType from '../grant-types/refresh-token-grant-type';
import AbstractGrantType from '../grant-types/abstract-grant-type';

/**
 * Grant types.
 */
let grantTypes = {
  password: passwordType,
  password_security: passwordSecurityType,
  refresh_token: refreshTokenType
};

export default class TokenHandler {
  public accessTokenLifetime: number;
  public grantTypes: { [key: string]: Constructor<AbstractGrantType> };
  public model: IAuthModel;
  public refreshTokenLifetime: number;
  public allowExtendedTokenAttributes: boolean;
  public requireClientAuthentication: any;
  public alwaysIssueNewRefreshToken: boolean;

  constructor(options: TokenHandlerOptionsInternal) {
    this.accessTokenLifetime = options.accessTokenLifetime;
    this.grantTypes = grantTypes;
    this.model = options.model;
    this.refreshTokenLifetime = options.refreshTokenLifetime;
    this.requireClientAuthentication = options.requireClientAuthentication || {};
    this.alwaysIssueNewRefreshToken = (options.alwaysIssueNewRefreshToken !== false);
  }

  /**
   * Token Handler.
   */
  public async handle(request: IRequest, response: IResponse) : Promise<IToken>{  
    if (request.method !== 'POST') {
      return Promise.reject(new InvalidRequestError('Invalid request: method must be POST'));
    }

    if (!request.is('application/json')) {
      return Promise.reject(new InvalidRequestError('Invalid request: content must be application/json'));
    }

    try {
      let client = await this.getClient(request, response);
      let grantType = await this.handleGrantType(request, client);
      
      let tokenModel = new TokenModel(grantType);
      let tokenType = this.getTokenType(tokenModel);
      this.updateSuccessResponse(response, tokenType);
  
      return grantType;
    } catch (err) {
      throw err;
    }
  }

  /**
   * Get the client from the model.
   */
  public async getClient(request: IRequest, response: IResponse) : Promise<IClient> {
    let credentials = this.getClientCredentials(request);
    let grantType : string = request.body.grant_type;

    if (!credentials.clientId) {
      throw new InvalidRequestError('Missing parameter: `client_id`');
    }
  
    if (this.isClientAuthenticationRequired(grantType) && !credentials.clientSecret) {
      throw new InvalidRequestError('Missing parameter: `client_secret`');
    }
  
    if (!is.vschar(credentials.clientId)) {
      throw new InvalidRequestError('Invalid parameter: `client_id`');
    }
  
    if (credentials.clientSecret && !is.vschar(credentials.clientSecret)) {
      throw new InvalidRequestError('Invalid parameter: `client_secret`');
    }

    try {
      let client = await this.model.getClient(credentials.clientId, credentials.clientSecret);
      if (!client) {
        throw new InvalidClientError('Invalid client: client is invalid');
      }
  
      if (!client.grants) {
        throw new ServerError('Server error: missing client `grants`');
      }
  
      // return client
      return client;
    } catch (err) {
      // Include the "WWW-Authenticate" response header field if the client
      // attempted to authenticate via the "Authorization" request header.
      //
      // @see https://tools.ietf.org/html/rfc6749#section-5.2.
      if ((err instanceof InvalidClientError) && request.get('authorization')) {
        response.set('WWW-Authenticate', 'Basic realm="Service"');

        // throw new error
        throw new InvalidClientError(err, { code: 401 });
      }

      throw err;
    }
  }

  /**
   * Get client credentials.
   *
   * The client credentials may be sent using the HTTP Basic authentication scheme or, alternatively,
   * the `client_id` and `client_secret` can be embedded in the body.
   *
   * @see https://tools.ietf.org/html/rfc6749#section-2.3.1
   */
  public getClientCredentials(request: IRequest) : IClientCredentials {
    let credentials = auth(request);
    let grantType : string = request.body.grant_type;

    if (credentials) {
      return { clientId: credentials.name, clientSecret: credentials.pass };
    }

    if (request.body.client_id && request.body.client_secret) {
      return { clientId: request.body.client_id, clientSecret: request.body.client_secret };
    }

    if (!this.isClientAuthenticationRequired(grantType)) {
      if (request.body.client_id) {
        return { clientId: request.body.client_id };
      }
    }

    throw new InvalidClientError('Invalid client: cannot retrieve client credentials');
  }

  /**
   * Handle grant type.
   */
  public async handleGrantType(request: IRequest, client: IClient) : Promise<IToken> {
    let grantType : string = request.body.grant_type;

    if (!grantType) {
      throw new InvalidRequestError('Missing parameter: `grant_type`');
    }
  
    if (!is.nchar(grantType) && !is.uri(grantType)) {
      throw new InvalidRequestError('Invalid parameter: `grant_type`');
    }
  
    if (!_.has(this.grantTypes, grantType)) {
      throw new UnsupportedGrantTypeError('Unsupported grant type: `grant_type` is invalid');
    }
  
    if (!_.includes(client.grants, grantType)) {
      throw new UnauthorizedClientError('Unauthorized client: `grant_type` is invalid');
    }

    let accessTokenLifetime = this.getAccessTokenLifetime(client);
    let refreshTokenLifetime = this.getRefreshTokenLifetime(client);
    let Type = this.grantTypes[grantType] as Constructor<AbstractGrantType>;

    let options: IAbstractGrantTypeOptions = {
      accessTokenLifetime: accessTokenLifetime,
      refreshTokenLifetime: refreshTokenLifetime,
      model: this.model,
      alwaysIssueNewRefreshToken: this.alwaysIssueNewRefreshToken
    };

    return await new Type(options).handle(request, client);
  }

  /**
   * Get access token lifetime.
   */
  public getAccessTokenLifetime(client: IClient) : number {
    return client.accessTokenLifetime || this.accessTokenLifetime;
  };

  /**
   * Get refresh token lifetime.
   */
  public getRefreshTokenLifetime(client: IClient) : number {
    return client.refreshTokenLifetime || this.refreshTokenLifetime;
  };

  /**
  * Get token type.
  */
  public getTokenType(tokenModel: TokenModel) : IAbstractTokenType {
    return new BearerTokenType(tokenModel.accessToken, tokenModel.accessTokenLifetime, tokenModel.refreshToken, tokenModel.scope);
  };

  /**
   * Update response when a token is generated.
   */
  public updateSuccessResponse(response: IResponse, tokenType: IAbstractTokenType) : void {
    response.body = tokenType.valueOf();

    response.set('Cache-Control', 'no-store');
    response.set('Pragma', 'no-cache');
  }

  /**
   * Given a grant type, check if client authentication is required
   */
  public isClientAuthenticationRequired = function(grantType: string) : boolean {
    if (Object.keys(this.requireClientAuthentication).length > 0) {
      return (typeof this.requireClientAuthentication[grantType] !== 'undefined') ? this.requireClientAuthentication[grantType] : true;
    } else {
      return true;
    }
  }

}