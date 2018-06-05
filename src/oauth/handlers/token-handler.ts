// import dependencies
import * as _ from 'lodash';
import BearerTokenType from '../token-types/bearer-token-type';
import { InvalidArgumentError, InvalidClientError, InvalidRequestError, OAuthError, ServerError, UnauthorizedClientError, UnsupportedGrantTypeError } from '../errors';
import Request from '../request';
import Response from '../response';
import TokenModel from '../models/token-model';
import * as auth from 'basic-auth';
import * as is from '../validator/is';

import passwordType from '../grant-types/password-grant-type';

/**
 * Grant types.
 */
let grantTypes = {
  password: passwordType
};

export default class TokenHandler {
  public accessTokenLifetime: number;
  public grantTypes: any;
  public model: any;
  public refreshTokenLifetime: number;
  public allowExtendedTokenAttributes: boolean;
  public requireClientAuthentication: any;
  public alwaysIssueNewRefreshToken: boolean;

  constructor(options: any = {}) {
    if (!options.accessTokenLifetime) {
      throw new InvalidArgumentError('Missing parameter: `accessTokenLifetime`');
    }
  
    if (!options.model) {
      throw new InvalidArgumentError('Missing parameter: `model`');
    }
  
    if (!options.refreshTokenLifetime) {
      throw new InvalidArgumentError('Missing parameter: `refreshTokenLifetime`');
    }
  
    if (!options.model.getClient) {
      throw new InvalidArgumentError('Invalid argument: model does not implement `getClient()`');
    }

    this.accessTokenLifetime = options.accessTokenLifetime;
    this.grantTypes = _.assign({}, grantTypes, options.extendedGrantTypes);
    this.model = options.model;
    this.refreshTokenLifetime = options.refreshTokenLifetime;
    this.allowExtendedTokenAttributes = options.allowExtendedTokenAttributes;
    this.requireClientAuthentication = options.requireClientAuthentication || {};
    this.alwaysIssueNewRefreshToken = options.alwaysIssueNewRefreshToken !== false;
  }

  /**
   * Token Handler.
   */
  public async handle(request: Request, response: Response) : Promise<any>{
    if (!(request instanceof Request)) {
      throw new InvalidArgumentError('Invalid argument: `request` must be an instance of Request');
    }
  
    if (!(response instanceof Response)) {
      throw new InvalidArgumentError('Invalid argument: `response` must be an instance of Response');
    }
  
    if (request.method !== 'POST') {
      return Promise.reject(new InvalidRequestError('Invalid request: method must be POST'));
    }

    if (!request.is('application/x-www-form-urlencoded')) {
      return Promise.reject(new InvalidRequestError('Invalid request: content must be application/x-www-form-urlencoded'));
    }

    try {
      let client = await this.getClient(request, response);
      let data = await this.handleGrantType(request, client);
      
      let model = new TokenModel(data, { allowExtendedTokenAttributes: this.allowExtendedTokenAttributes });
      let tokenType = this.getTokenType(model);
      this.updateSuccessResponse(response, tokenType);
  
      return data;
    } catch (err) {
      if (!(err instanceof OAuthError)) {
        err = new ServerError(err);
      }
      
      this.updateErrorResponse(response, err);
      throw err;
    }
  }

  /**
   * Get the client from the model.
   */
  public async getClient(request: Request, response: Response) : Promise<any> {
    let credentials = this.getClientCredentials(request);
    let grantType = request.body.grant_type;

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
  
      if (!(client.grants instanceof Array)) {
        throw new ServerError('Server error: `grants` must be an array');
      }
      return client;
    } catch (err) {
      // Include the "WWW-Authenticate" response header field if the client
      // attempted to authenticate via the "Authorization" request header.
      //
      // @see https://tools.ietf.org/html/rfc6749#section-5.2.
      if ((err instanceof InvalidClientError) && request.get('authorization')) {
        response.set('WWW-Authenticate', 'Basic realm="Service"');

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
  public getClientCredentials(request: any) : any {
    let credentials = auth(request);
    let grantType = request.body.grant_type;

    if (credentials) {
    return { clientId: credentials.name, clientSecret: credentials.pass };
    }

    if (request.body.client_id && request.body.client_secret) {
      return { clientId: request.body.client_id, clientSecret: request.body.client_secret };
    }

    if (!this.isClientAuthenticationRequired(grantType)) {
      if(request.body.client_id) {
        return { clientId: request.body.client_id };
      }
    }

    throw new InvalidClientError('Invalid client: cannot retrieve client credentials');
  }

  /**
   * Handle grant type.
   */
  public handleGrantType(request: any, client: any) : any {
    let grantType = request.body.grant_type;

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
    let Type = this.grantTypes[grantType];

    let options = {
      accessTokenLifetime: accessTokenLifetime,
      model: this.model,
      refreshTokenLifetime: refreshTokenLifetime,
      alwaysIssueNewRefreshToken: this.alwaysIssueNewRefreshToken
    };

    return new Type(options).handle(request, client);
  }

  /**
   * Get access token lifetime.
   */
  public getAccessTokenLifetime(client: any) : number {
    return client.accessTokenLifetime || this.accessTokenLifetime;
  };

  /**
   * Get refresh token lifetime.
   */
  public getRefreshTokenLifetime(client: any) : number {
    return client.refreshTokenLifetime || this.refreshTokenLifetime;
  };

  /**
  * Get token type.
  */
  public getTokenType(model: any) : BearerTokenType {
    return new BearerTokenType(model.accessToken, model.accessTokenLifetime, model.refreshToken, model.scope, model.customAttributes);
  };

  /**
   * Update response when a token is generated.
   */
  public updateSuccessResponse(response: Response, tokenType: BearerTokenType) : void {
    response.body = tokenType.valueOf();

    response.set('Cache-Control', 'no-store');
    response.set('Pragma', 'no-cache');
  }

  /**
   * Update response when an error is thrown.
   */
  public updateErrorResponse(response: Response, error: OAuthError) : void {
    response.body = {
      error: error.name,
      error_description: error.message
    };
  
    response.status = error.code;
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