// # Authentication middleware
// sets up the authentication middleware

// import dependencies
import { Request, Response, NextFunction } from 'express'
import { UnauthorizedError, NotVerifiedError } from '../errors';
import config from '../configuration';

export interface IRequest extends Request {
  isAdmin?: boolean;
}

/**
 * decodeAuthToken - middleware for decoding the JWT authentication token
 *
 * @param {Object} req  the request object
 * @param {Object} res  the response object
 * @param {function} next  the next function
 */
export async function decodeAuthToken(req: IRequest, res: Response, next: Function) {
    // define variables
    let token, decoded, user, apiKey;

    // # add admin token
    apiKey = req.headers['x-api-key'];
    req.isAdmin = false;
    if (apiKey && apiKey === config.get('api:key')) {
        // # the user is authorized
        req.isAdmin = true;
    }

    // call next middleware
    next();
}

export async function requireAPICredentials(req: IRequest, res: Response, next: NextFunction) {
    // check if the user is authorized for the current resource
    if (!req.isAdmin) {
        // # the user is not authorized
        next(new UnauthorizedError());
    }
    next();
}