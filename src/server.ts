// # Server Startup
// imports the express app and starts up the server

/* eslint-disable no-console, no-process-exit */

// import dependencies
import * as http from 'http';
import * as https from 'https';
import * as fs from 'fs';;
import app, { addErrorRoutes, addRoutes } from './app';
import config from './configuration';
import { Logger, DebugLevel } from './logger';
const logger = new Logger('server');

// # set application port
// if the application runs in a production environment, it will listen to the environment variable 'PORT'
const port = config.get('express:port');
const isProd = config.get('environment') === 'production';
logger.yellow('started server in mode: ' + config.get('environment'));

// add API routes
addRoutes();

// add error API routes
addErrorRoutes();

// # create server
// create server with express instance and make it listen to the specified environment port
let server;
if (isProd) {
  logger.normal('starting SSL server...');
  server = https.createServer({
    key: fs.readFileSync(`/etc/letsencrypt/live/${config.get('settings:domain')}/privkey.pem`),
    cert: fs.readFileSync(`/etc/letsencrypt/live/${config.get('settings:domain')}/fullchain.pem`),
  }, app);
} else {
  logger.normal('starting HTTP server...');
  server = http.createServer(app);
}

// listen to specified port
server.listen(port, () => {
  logger.green(`API server started listening on http://localhost:${port}`);
});

// # shutdown app properly
// make sure to prevent hard exit
function handleExit(options: any, err: Error) {
  logger.red('shutting down the API server...');
  // check if any errors were encountered
  if (err) console.log(err.stack);
  // if the 'exit' key was provided, shutdown the application
  if (options.exit) process.exit();
}

// bind exit handler to process events
process.on('exit', handleExit.bind(null, { exit: true }));
process.on('SIGTERM', handleExit.bind(null, { exit: true }));
process.on('SIGINT', handleExit.bind(null, { exit: true }));
process.on('uncaughtException', handleExit.bind(null, { exit: true }));