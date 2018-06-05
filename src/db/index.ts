// # Database connection
// sets up the database structure and connection

// import dependencies
import * as mongoose from 'mongoose';
import config from '../configuration';

const MONGO_URL = config.get('mongo:url');
const MONGO_USER = config.get('mongo:user');
const MONGO_PASS = config.get('mongo:pass');

// define the default mongoose options
const OPTIONS: mongoose.ConnectionOptions = {
  autoReconnect: true,
  user: MONGO_USER,
  pass: MONGO_PASS,
  poolSize: 5,
};

// add auth if present
if (MONGO_USER && MONGO_PASS) {
  OPTIONS.auth = { authdb: 'admin' };
}

export function setup() : void {
  // connect to the specified mongo database
  mongoose.connect(MONGO_URL, OPTIONS);
};


export function disconnect() : void {
  // connect to the specified mongo database
  mongoose.disconnect();
};