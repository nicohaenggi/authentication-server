import { setup, disconnect } from './db';
import { License } from '../db/schemas/license';

// setup database connection
setup();

async function runStuff() {
  let licenses = await License.find({});
  licenses.forEach(license => {
    license.numActivated = 0;
    license.save();
  });
}

runStuff().then(() => {
  console.log('finished running...');
});