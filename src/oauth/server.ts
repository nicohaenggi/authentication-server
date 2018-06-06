// import dependencies
import * as _ from 'lodash';
import { OAuthServerOptions, TokenHandlerOptions, IRequest, IResponse, TokenHandlerOptionsInternal } from './interfaces';
import TokenHandler from './handlers/token-handler';
import { InvalidArgumentError } from './errors';
import { IToken } from '../db/schemas/token';

export default class OAuth2Server {
  public options: OAuthServerOptions;

  constructor(options: OAuthServerOptions) {
    this.options = options;
  }

  /**
   * Create a token.
   */
  public async token(request: IRequest, response: IResponse, options?: TokenHandlerOptions) : Promise<IToken> {
    let tokenOptions : TokenHandlerOptionsInternal = _.assign({
      accessTokenLifetime: 60 * 60,             // 1 hour.
      refreshTokenLifetime: 60 * 60 * 24 * 14,  // 2 weeks.
      allowExtendedTokenAttributes: false,
      requireClientAuthentication: {
        password: false,
        password_security: false,
        refresh_token: false
      }
    }, this.options, options);

    return await new TokenHandler(tokenOptions).handle(request, response);
  }
}