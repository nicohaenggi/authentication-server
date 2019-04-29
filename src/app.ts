// # Express Application
// sets up the express API endpoints

// import dependencies
import * as express from 'express';
import * as morgan from 'morgan';
import * as bodyParser from 'body-parser';
import * as debugModule from 'debug';
import config from './configuration';
import { setup } from './db';
import * as middleware from './middleware';
import * as api from './api';
import ExpressOAuthServer from './oauth';
import OAuthModel from './models/oauth-model';
const app = express();

// open database connection
setup();

// create new oauth server
const oauth : ExpressOAuthServer = new ExpressOAuthServer({
  model: OAuthModel
});

// use bodyparser middleware for url and json parsing
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// use morgan to log requests to the console
app.use(morgan(config.get('express:morgan')));

// disable powered by
app.disable('x-powered-by');

// allow cors
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', config.get('settings:corsAllowOrigins'));
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

// return 200 for all options
app.use('*', function(req, res, next) {
  if (req.method === 'OPTIONS') {
    res.status(200);
    res.end();
  } else {
    next();
  }
});

// # decode authentication token
// decodes the auth token and assigns the current user to the request
app.use(middleware.auth.decodeAuthToken);

// # validation middleware
// validates the 'id' parameter in order to match mongoose format
app.param('id', middleware.validation.id);

export function addRoutes() : void {
  // # user routes
  app.post('/api/users', api.http(api.users.register) );
  app.get('/api/users/@me', middleware.auth.requireAuthenticatedUser, api.http(api.users.me) );
  app.get('/api/users/@me/licenses', middleware.auth.requireAuthenticatedUser, api.http(api.users.myLicenses) );
  app.get('/api/users/@me/discord/request', middleware.auth.requireAuthenticatedUser, api.http(api.verification.discordRequest) );

  // # resend verification
  app.post('/api/verification/resend', api.http(api.users.resendVerification) );

  // # reset password route
  app.post('/api/reset/password/request', api.http(api.users.resetPasswordRequest) );
  app.post('/api/reset/password/confirmation', api.http(api.users.resetPasswordConfirmation) );

  // # oauth routes
  app.post('/api/oauth/token', oauth.token.bind(oauth) );
  // app.post('/api/oauth/deactivate', middleware.auth.requireAuthenticatedUser, api.http(api.activations.deactivate) ); // DO CHECK

  // # admin routes
  app.get('/api/admin/users/:id', middleware.auth.requireAPICredentials, api.http(api.users.read) );
  app.get('/api/admin/users/username/:username', middleware.auth.requireAPICredentials, api.http(api.users.readByUsername) );
  app.post('/api/admin/users/:id/license', middleware.auth.requireAPICredentials, api.http(api.licenses.add) );

  // ## RENDER FILES
  // # verification routes
  app.get('/verification/email', api.render(api.verification.email) );
  app.get('/api/users/@me/discord/confirmation', api.render(api.verification.discordConfirmation) );
}

export function addErrorRoutes() : void {
  // # error routes
  // handles request the remanining requests, which results in a 404 Not Found
  app.use(middleware.error.resourceNotFound);
  // handles all unhandled errors
  app.use(middleware.error.handleError);
}

// export for use elsewhere
export default app;
