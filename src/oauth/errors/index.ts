// # Errors Generator
// helper functions in order to make error generation easier
'use strict';

// import dependencies
import * as _ from 'lodash';
import * as statuses from 'statuses';

/**
 * OAuthError - custom base error class for easier error handling
 * @extends Error
 */
export class OAuthError extends Error {
    public statusCode: number;
    public code: number;
    public status: number;
    [key: string]: any

    /**
     * constructor - creates a new custom error
     *
     * @param {Object} options the error options (message, statusCode, errorType) 
     */
    public constructor(messageOrError: Error | string, options?: any) {
        // check error that was providen
        let message = messageOrError instanceof Error ? messageOrError.message : messageOrError;
        let error = messageOrError instanceof Error ? messageOrError : null;
        

        // check if options has been provided
        if(!options) options = {};

        // default properties
        _.defaults(options, { code: 500 });

        // check if we got an error
        if (error) {
          options.inner = error;
        }

        if (_.isEmpty(message)) {
          message = statuses[options.code];
        }

        // call super with the error message
        super(message || 'The server has encountered an error.');
        this.code = this.status = this.statusCode = options.code;

        // assign other properties
        for (let key in options) {
          if (key !== 'code') {
            this[key] = options[key];
          }
        }

        // configure proper stack tracing
        if (typeof Error.captureStackTrace === 'function') {
            Error.captureStackTrace(this, this.constructor);
        } else {
            this.stack = (new Error(this.message)).stack;
        }
    }
}

/**
 * InvalidArgumentError
 * @extends GeneralError
 */
export class InvalidArgumentError extends OAuthError {
  public constructor(messageOrError: Error | string, options?: any) {
    options = _.assign({
      code: 500,
      name: 'invalid_argument'
    }, options)

    super(messageOrError, options);
  }
}

/**
 * AccessDeniedError
 * 
 * "The resource owner or authorization server denied the request"
 * @see https://tools.ietf.org/html/rfc6749#section-4.1.2.1
 * 
 * @extends GeneralError
 */
export class AccessDeniedError extends OAuthError {
  public constructor(messageOrError: Error | string, options?: any) {
    options = _.assign({
      code: 400,
      name: 'access_denied'
    }, options)

    super(messageOrError, options);
  }
}

/**
 * InsufficientScopeError
 * 
 * "The request requires higher privileges than provided by the access token.."
 * @see https://tools.ietf.org/html/rfc6750.html#section-3.1
 * 
 * @extends GeneralError
 */
export class InsufficientScopeError extends OAuthError {
  public constructor(messageOrError: Error | string, options?: any) {
    options = _.assign({
      code: 403,
      name: 'insufficient_scope'
    }, options)

    super(messageOrError, options);
  }
}

/**
 * InvalidClientError
 * 
 * "Client authentication failed (e.g., unknown client, no client
 * authentication included, or unsupported authentication method)"
 * @see https://tools.ietf.org/html/rfc6749#section-5.2
 * 
 * @extends GeneralError
 */
export class InvalidClientError extends OAuthError {
  public constructor(messageOrError: Error | string, options?: any) {
    options = _.assign({
      code: 400,
      name: 'invalid_client'
    }, options)

    super(messageOrError, options);
  }
}

/**
 * InvalidGrantError
 * 
 * "The provided authorization grant (e.g., authorization code, resource owner credentials)
 * or refresh token is invalid, expired, revoked, does not match the redirection URI used
 * in the authorization request, or was issued to another client."
 * @see https://tools.ietf.org/html/rfc6749#section-5.2
 * 
 * @extends GeneralError
 */
export class InvalidGrantError extends OAuthError {
  public constructor(messageOrError: Error | string, options?: any) {
    options = _.assign({
      code: 400,
      name: 'invalid_grant'
    }, options)

    super(messageOrError, options);
  }
}

/**
 * InvalidRequestError
 * 
 * "The request is missing a required parameter, includes an invalid parameter value,
 * includes a parameter more than once, or is otherwise malformed."
 * @see https://tools.ietf.org/html/rfc6749#section-4.2.2.1
 * 
 * @extends GeneralError
 */
export class InvalidRequestError extends OAuthError {
  public constructor(messageOrError: Error | string, options?: any) {
    options = _.assign({
      code: 400,
      name: 'invalid_request'
    }, options)

    super(messageOrError, options);
  }
}

/**
 * InvalidScopeError
 * 
 * "The requested scope is invalid, unknown, or malformed."
 * @see https://tools.ietf.org/html/rfc6749#section-4.1.2.1
 * 
 * @extends GeneralError
 */
export class InvalidScopeError extends OAuthError {
  public constructor(messageOrError: Error | string, options?: any) {
    options = _.assign({
      code: 400,
      name: 'invalid_scope'
    }, options)

    super(messageOrError, options);
  }
}

/**
 * InvalidTokenError
 * 
 * "The access token provided is expired, revoked, malformed, or invalid for other reasons."
 * @see https://tools.ietf.org/html/rfc6750#section-3.1
 * 
 * @extends GeneralError
 */
export class InvalidTokenError extends OAuthError {
  public constructor(messageOrError: Error | string, options?: any) {
    options = _.assign({
      code: 401,
      name: 'invalid_token'
    }, options)

    super(messageOrError, options);
  }
}

/**
 * ServerError
 * 
 * "The authorization server encountered an unexpected condition that prevented it from fulfilling the request."
 * @see https://tools.ietf.org/html/rfc6749#section-4.1.2.1
 * 
 * @extends GeneralError
 */
export class ServerError extends OAuthError {
  public constructor(messageOrError: Error | string, options?: any) {
    options = _.assign({
      code: 503,
      name: 'server_error'
    }, options)

    super(messageOrError, options);
  }
}

/**
 * UnauthorizedClientError
 * 
 * "The authenticated client is not authorized to use this authorization grant type."
 * @see https://tools.ietf.org/html/rfc6749#section-4.1.2.1
 * 
 * @extends GeneralError
 */
export class UnauthorizedClientError extends OAuthError {
  public constructor(messageOrError: Error | string, options?: any) {
    options = _.assign({
      code: 400,
      name: 'unauthorized_client'
    }, options)

    super(messageOrError, options);
  }
}

/**
 * UnauthorizedRequestError
 * 
 * "If the request lacks any authentication information (e.g., the client
 * was unaware that authentication is necessary or attempted using an
 * unsupported authentication method), the resource server SHOULD NOT
 * include an error code or other error information."
 * @see https://tools.ietf.org/html/rfc6750#section-3.1
 * 
 * @extends GeneralError
 */
export class UnauthorizedRequestError extends OAuthError {
  public constructor(messageOrError: Error | string, options?: any) {
    options = _.assign({
      code: 401,
      name: 'unauthorized_request'
    }, options)

    super(messageOrError, options);
  }
}

/**
 * UnsupportedGrantTypeError
 * 
 * "The authorization grant type is not supported by the authorization server."
 * @see https://tools.ietf.org/html/rfc6749#section-4.1.2.1
 * 
 * @extends GeneralError
 */
export class UnsupportedGrantTypeError extends OAuthError {
  public constructor(messageOrError: Error | string, options?: any) {
    options = _.assign({
      code: 400,
      name: 'unsupported_grant_type'
    }, options)

    super(messageOrError, options);
  }
}

/**
 * UnsupportedResponseTypeError
 * 
 * "The authorization server does not supported obtaining an
 * authorization code using this method."
 * @see https://tools.ietf.org/html/rfc6749#section-4.1.2.1
 * 
 * @extends GeneralError
 */
export class UnsupportedResponseTypeError extends OAuthError {
  public constructor(messageOrError: Error | string, options?: any) {
    options = _.assign({
      code: 400,
      name: 'unsupported_response_type'
    }, options)

    super(messageOrError, options);
  }
}