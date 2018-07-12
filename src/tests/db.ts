// # Database connection
// sets up the database structure and connection

// import dependencies
import * as mongoose from 'mongoose';

const MONGO_URL = 'mongodb://www.auth.kickmoji.io/kickmoji-auth';
const MONGO_USER = 'admin';
const MONGO_PASS = 'KA!D}5Z;)Q{b/?c5w]6nYV';

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