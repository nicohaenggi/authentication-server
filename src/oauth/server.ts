// import dependencies
import * as _ from 'lodash';
import TokenHandler from './handlers/token-handler';
import { InvalidArgumentError } from './errors';

export default class OAuth2Server {
  public options: any;

  constructor(options: any = {}) {
    if (!options.model) {
      throw new InvalidArgumentError('Missing parameter: `model`');
    }

    this.options = options;
  }

  /**
   * Create a token.
   */
  public token(request: any, response: any, options: any) : Promise<void> {
    options = _.assign({
      accessTokenLifetime: 60 * 60,             // 1 hour.
      refreshTokenLifetime: 60 * 60 * 24 * 14,  // 2 weeks.
      allowExtendedTokenAttributes: false,
      requireClientAuthentication: {}           // defaults to true for all grant types
    }, this.options, options);

    return new TokenHandler(options).handle(request, response);
  }
}