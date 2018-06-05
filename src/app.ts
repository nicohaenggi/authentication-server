// # Express Application
// sets up the express API endpoints

// import dependencies
import * as express from 'express';
import * as path from 'path';
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
const debug = debugModule('express-server');

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
debug('setting morgan logging format to ' + config.get('express:morgan'));
app.use(morgan(config.get('express:morgan')));

// disable powered by
app.disable('x-powered-by');

// # decode authentication token
// decodes the auth token and assigns the current user to the request
app.use(middleware.auth.decodeAuthToken);

// # validation middleware
// validates the 'id' parameter in order to match mongoose format
app.param('id', middleware.validation.id);

export function addRoutes() : void {
  // # register routes
  app.post('/api/users', api.http(api.users.register) );
  app.get('/api/users/me', api.http(api.users.me) );

  // # oauth routes
  app.post('/api/oauth/token', oauth.token.bind(oauth) );

  // # customer routes
  // app.get('/api/customers', middleware.auth.requireAPICredentials, api.http(api.customers.browse) );
  // app.post('/api/customers', middleware.auth.requireAPICredentials, api.http(api.customers.add) );
  // app.get('/api/customers/:id', middleware.auth.requireAPICredentials, api.http(api.customers.read) );
  // app.get('/api/customers/services/:serviceType/:serviceId', middleware.auth.requireAPICredentials, api.http(api.customers.readByService) );
  // app.post('/api/customers/services/:serviceType/:serviceId/topup', middleware.auth.requireAPICredentials, api.http(api.topups.topupInitialize) );

  // // # orders routes
  // app.get('/api/orders', middleware.auth.requireAPICredentials, api.http(api.orders.browse) );
  // app.post('/api/orders', middleware.auth.requireAPICredentials, api.http(api.orders.create) );
  // app.get('/api/orders/:id', middleware.auth.requireAPICredentials, api.http(api.orders.read) );

  // // # lives routes
  // app.get('/api/lives/left', middleware.auth.requireAPICredentials, api.http(api.lives.totalLivesLeft) );
  // app.get('/api/lives/scheduled', middleware.auth.requireAPICredentials, api.http(api.lives.totalLivesScheduled) );

  // // # analytics routes
  // app.get('/api/analytics/balance/left', middleware.auth.requireAPICredentials, api.http(api.analytics.totalCreditsLeft) );
  // app.get('/api/analytics/balance/sold', middleware.auth.requireAPICredentials, api.http(api.analytics.totalCreditsSold) );
  // app.get('/api/analytics/lives/sold', middleware.auth.requireAPICredentials, api.http(api.analytics.totalLivesSold) );

  // // # topups routes
  // app.get('/api/topups', middleware.auth.requireAPICredentials, api.http(api.topups.browse) );
  // app.get('/api/topups/:id', middleware.auth.requireAPICredentials, api.http(api.topups.read) );

  // app.post('/api/topups/paypal/execute', api.http(api.topups.topupExecute) ); // public api point

  // # servee static files
  app.use('/', express.static(path.join(__dirname, '..' ,'public'), {
    extensions: ['html']
  }));
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
