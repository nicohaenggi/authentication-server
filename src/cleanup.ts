import { setup, disconnect } from './db';
import { OneTimeToken } from './db/schemas/one-time-token';
import { Token } from './db/schemas/token'
import config from './configuration';

// setup database connection
setup();

// clean up OneTimeTokens and Tokens
const CLEANUP_DELAY = config.get('settings:cleanupDelay');
let interval = setInterval(async () => {
  let onetime = await OneTimeToken.cleanExpired();
  let tokens = await Token.cleanExpired();
  console.log(`removed ${onetime.n} OneTimeTokens`);
  console.log(`removed ${tokens.n} Tokens`);
}, CLEANUP_DELAY*1000);
