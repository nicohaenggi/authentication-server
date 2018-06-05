// # Users API
// sets up all the users API methods

// import dependencies
import { InternalServerError, BadRequestError } from '../errors';
import { User, IUser } from '../db/schemas/user';
import i18n from '../i18n';

/** Users API Routes
* implements the users API Routes
*/

const read = async function read(options: any, object: any) : Promise<IUser> {
  // fetch a customer based on the id
  let user: IUser = await User.findById(options.id);
  // check if a response has been returned
  if(user == null) throw new BadRequestError({ message: i18n.__('errors.api.users.notFound') });
  return user;
}

const me = async function me(options: any, object: any) : Promise<IUser> {
  return await read({ id: object.user.id }, {});
}

const add = async function add(options: any, object: any) : Promise<IUser> {
  // create new customer in the database
  const { username, password } = object;
  const user: IUser = await User.create({ username, password });
  // check if a response has been returned
  if(user == null) throw new BadRequestError({ message: i18n.__('errors.api.users.notCreated') });
  return user;
}

const register = async function register(options: any, object: any) : Promise<IUser> {
  // create new customer in the database
  const user = await add(options, object);

  // make sure to verify email
  // !TODO

  return user;
}

export default {
  read,
  me,
  add,
  register
}
