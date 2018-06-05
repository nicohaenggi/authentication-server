// import dependencies
import * as crypto from 'crypto';
import * as bluebird from 'bluebird';
const randomBytes = bluebird.promisify(crypto.randomBytes);

export const processLoop = function processLoop(mainFn: () => Promise<any>, compareFn: (value: any) => boolean, delay?: number, retries?: number) : Promise<any> {
  return new Promise<any>((resolve, reject) => {
    let counter = 0;
    
    // # iteration function
    // will iterate as long as the comparison function returns false
    function next() {
      if (retries && counter >= retries) return reject('the maximum number of retries was reached');
      // call main function
      mainFn().then((value: any) => {
        // check what compare function returns
        if (compareFn(value)) {
          // # compare function returned true
          // interrupt loop
          return resolve(value);
        } else {
          // # compare function returned false
          // do a new iteration
          if (delay) {
            setTimeout(next, delay);
          } else {
            next();
          }
        }
        // increase counter
        counter++;
      }, reject);
    }

    // start first iteration
    next();
  });
}

export const promiseDelay = function promiseDelay(duration: number) : (value?: any) => Promise<any> {
  return (value?: any) : Promise<any> => {
    return new Promise<any>((resolve, reject) => {
      setTimeout(() => {
        return resolve(value);
      }, duration);
    });
  };
}

export const isTimeInRange = function isTimeInRange(ranges: number[][]) : boolean {
  const currTime = new Date().getTime() % 86400000;
  for (let range of ranges) {
    if ((currTime >= range[0]) && (currTime <= range[1])) {
      return true;
    }
  }
  return false;
}

export const generateRandomToken = async function generateRandomToken() : Promise<string> {
  let randBuffer = await randomBytes(256);
  return await crypto.createHash('sha1').update(randBuffer).digest('hex');
}