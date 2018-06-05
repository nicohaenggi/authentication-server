// # Customers API
// sets up all the customers API methods

// import dependencies
import { Request, Response, NextFunction, RequestHandler } from 'express';
import i18n from '../i18n';
import OAuthServer from '../oauth/server';
import { OAuthServerOptions, IRequest, IResponse } from './interfaces';

export default class ExpressOAuthServer {
  public server: OAuthServer;

  constructor(options: OAuthServerOptions) {
    this.server = new OAuthServer(options);
  }

  public async token(req: IRequest, res: IResponse, next: NextFunction) : Promise<void> {
    try {
      // wait for method to assign response and finish request
      await this.server.token(req, res);
      this.handleResponse(res);
    } catch (err) {
      // # error should be handled by the error middleware
      // call next in order to continue middleware chain
      return next(err);
    }
  }

  private handleResponse(res: IResponse) {
    // send a properly formatted HTTP response containing the json data
		res.status(200).json(res.body || {});
  }
} 