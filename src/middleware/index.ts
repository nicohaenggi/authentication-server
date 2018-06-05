// # Application middleware
// combines the application middlewares into a single object

// import dependencies
import * as validationModule from './validation';
import * as errorModule from './error';
import * as authModule from './authentication';

export const validation = validationModule;
export const auth = authModule;
export const error = errorModule;
