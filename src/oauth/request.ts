// import dependencies
import { InvalidArgumentError } from './errors';
import * as typeis from 'type-is';
import { HttpArchiveRequest } from 'request';
import { IncomingMessage } from 'http';

export default class Request {
  public body: any;
  public headers: any;
  public method: string;
  public query: string;
  [key: string]: any
  
  constructor(options: any = {}) {
    if (!options.headers) {
      throw new InvalidArgumentError('Missing parameter: `headers`');
    }
  
    if (!options.method) {
      throw new InvalidArgumentError('Missing parameter: `method`');
    }
  
    if (!options.query) {
      throw new InvalidArgumentError('Missing parameter: `query`');
    }

    this.body = options.body || {};
    this.headers = {};
    this.method = options.method;
    this.query = options.query;

     // Store the headers in lower case.
    for (let field in options.headers) {
      if (options.headers.hasOwnProperty(field)) {
        this.headers[field.toLowerCase()] = options.headers[field];
      }
    }

    // Store additional properties of the request object passed in
    for (let property in options) {
      if (options.hasOwnProperty(property) && !this[property]) {
        this[property] = options[property];
      }
    }
  }

  /**
   * Get a request header.
   */
  public get(field: string) : string {
    return this.headers[field.toLowerCase()];
  }

  /**
   * Check if the content-type matches any of the given mime type.
   */
  public is(types: string | string[]) {
    if (!Array.isArray(types)) {
      types = [].slice.call(types);
    }

    let thisMod = <any> this;
    return typeis(thisMod, types as string[]) || false;
  }

}