// # Authentication middleware
// sets up the authentication middleware

// import dependencies
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import * as path from 'path';
import { Request, Response, NextFunction } from 'express'
import { UnauthorizedError, TokenExpiredError } from '../errors';
import config from '../configuration';
import { IJWTToken } from '../oauth/interfaces';

const JWT_ISSUER = config.get('jwt:issuer');
const API_KEY = config.get('api:key');
const CERT = fs.readFileSync(path.join(__dirname, '../../keys/jwt/cert.pem'));

export interface IRequest extends Request {
  isAdmin?: boolean;
  user?: string;
  jwt?: IJWTToken;
  bearer?: string;
}

/**
 * decodeAuthToken - middleware for decoding the JWT authentication token
 *
 * @param {Object} req  the request object
 * @param {Object} res  the response object
 * @param {function} next  the next function
 */
export async function decodeAuthToken(req: IRequest, res: Response, next: Function) {

    // check admin API key
    let apiKey = req.headers['x-api-key'];
    req.isAdmin = false;
    if (apiKey && apiKey === API_KEY) {
        // # the user is authorized
        req.isAdmin = true;
    }

    // decode jwt user and verify it
    let token = req.headers['authorization'] as string;
    if (token) {
        token = token.replace('Bearer ', '');
        jwt.verify(token, CERT, { algorithms: ['RS256'] }, async function (err: Error, payload: IJWTToken) {
            // check if there is an error verifying the token
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    return next(new TokenExpiredError());
                }

                return next(new UnauthorizedError());
            }

            // check issuer
            if (payload.iss !== JWT_ISSUER) {
                return next( new UnauthorizedError() );
            }

            // check audience
            // NOTE: we do not check audience since we accept authentication tokens from any of our clients

            // assign web token data
            req.jwt = payload;
            req.bearer = token;
            
            // assign logged in user data
            req.user = req.jwt.sub;

            if (!req.user) {
                // there is no user field present
                return next( new UnauthorizedError() );
            }
        });
    }

    // call next middleware
    next();
}

export async function requireAPICredentials(req: IRequest, res: Response, next: NextFunction) {
    // check if the user is authorized for the current resource
    if (!req.isAdmin) {
        // # the user is not authorized
        return next( new UnauthorizedError() );
    }
    next();
}

export async function requireAuthenticatedUser(req: IRequest, res: Response, next: NextFunction) {
    // check if the user is authorized for the current resource
    if (!req.user) {
        // the user is not authorized
        return next( new UnauthorizedError() );
    }
    next();
}