// # Logger Class
// is responsible for logging the relevant information to the user

// import dependencies
import * as dateFormat from 'dateformat';
import * as colors from 'colors/safe';

export enum DebugLevel {
  DEV = 1,
  STG = 2,
  PROD = 3,
}

export class Logger {
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  public green(message: string, level?: DebugLevel) : void {
    this.log(`${this.getDateString()} [${this.name}] ` + colors.green(`[+] ${message}`), level);
  }

  public red(message: string, level?: DebugLevel) : void {
    this.log(`${this.getDateString()} [${this.name}] ` + colors.red(`[x] ${message}`), level);
  }

  public blue(message: string, level?: DebugLevel) : void {
    this.log(`${this.getDateString()} [${this.name}] ` + colors.blue(`[$] ${message}`), level);
  }

  public yellow(message: string, level?: DebugLevel) : void {
    this.log(`${this.getDateString()} [${this.name}] ` + colors.yellow(`[?] ${message}`), level);
  }

  public normal(message: string, level?: DebugLevel) : void {
    this.log(`${this.getDateString()} [${this.name}] [#] ${message}`, level);
  }

  private getDateString() {
    return `[${dateFormat(new Date(), "HH:MM:ss.l")}]`;
  }

  private log(text: string, level: DebugLevel = DebugLevel.PROD) : void {
    // get current logging level
    const debugLevel: DebugLevel = DebugLevel[process.env.DEBUG_LEVEL as keyof typeof DebugLevel] || DebugLevel.PROD;
    // log to the console, if the current debug level is higher than the required level
    if (level >= debugLevel) {
      console.log(text);
    }
  }
}