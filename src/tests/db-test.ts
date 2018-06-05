import { setup, disconnect } from './db';
import { User } from '../db/schemas/user';

// setup database connection
setup();

let customers : any = {};