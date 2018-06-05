// import dependencies
import { InvalidArgumentError } from '../errors';
import * as url from 'url';

export default class CodeResponseType {
  public code: string;

  
  constructor(code: string) {
    if (!code) {
      // make sure code is available
      throw new InvalidArgumentError('Missing parameter: `code`');
    }

    this.code = name;
  }

  public buildRedirectUri(redirectUri: string) : url.Url {
    if (!redirectUri) {
      // make sure redirect uri is available
      throw new InvalidArgumentError('Missing parameter: `redirectUri`');
    }

    const uri = url.parse(redirectUri, true);

    // assign arguments
    uri.query.code = this.code;
    uri.search = null;

    return uri;
  }

}