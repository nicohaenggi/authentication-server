// # Configuration class
// sets up a new configuration wrapper

// import dependencies
import * as nconf from 'nconf';
import { Logger, DebugLevel } from '../logger';
const logger = new Logger('configuration');

/**
 * Config - creates a new config instance
 *
 * @return {Config}  returns a new configuration object
 */
class Config {

  constructor() {
    // load process arguments and environment
    nconf.argv().env();
    // get the current environment
    let environment = nconf.get('NODE_ENV') || 'development';
    logger.yellow(`loading '${environment}' configuration`);
    // load in the configuration for the current enviroment
    nconf.file(environment, 'config/' + environment + '.json');
    // load in default values
    nconf.file('default', 'config/default.json');
  }

  /**
  * get - gets a config value for the specified key
  *
  * @param  {String} key the configuration key in order to retrieve the value
  * @return {Object}     the value for the configuration key
  */
  public get(key: string) : any {
    // return configuration
    return nconf.get(key);
  }
  
}

// export for use elsewhere
export default new Config();
