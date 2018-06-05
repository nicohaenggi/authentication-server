export default class Response {
  public body: any;
  public headers: any;
  public status: number;
  [key: string]: any
  
  constructor(options: any = {}) {
    this.body = options.body || {};
    this.headers = {};
    this.status = 200;

    // Store the headers in lower case.
    for (let field in options.headers) {
      if (options.headers.hasOwnProperty(field)) {
        this.headers[field.toLowerCase()] = options.headers[field];
      }
    }

    // Store additional properties of the response object passed in
    for (let property in options) {
      if (options.hasOwnProperty(property) && !this[property]) {
        this[property] = options[property];
      }
    }
  }

  /**
   * Get a response header.
   */
  public get(field: string) : string {
    return this.headers[field.toLowerCase()];
  };

  /**
   * Get a response header.
   */
  public redirect(url: string) : void {
    this.set('Location', url);
    this.status = 302;
  };

  /**
   * Set a response header.
   */
  public set(field: string, value: string) : void {
    this.headers[field.toLowerCase()] = value;
  };

}