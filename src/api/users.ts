// # Users API
// sets up all the users API methods

// import dependencies
import * as request from 'request-promise';
import { InternalServerError, BadRequestError } from '../errors';
import { User, IUser } from '../db/schemas/user';
import { OneTimeToken, IOneTimeToken } from '../db/schemas/one-time-token';
import { expiresIn } from '../utils';
import { sendVerificationEmail } from '../mailer/templates';
import config from '../configuration';
import i18n from '../i18n';
import { License, ILicense } from '../db/schemas/license';
import { IClient, Client } from '../db/schemas/client';

const EMAIL_EXPIRES_IN = config.get('settings:emailExpiresIn');

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

const me = async function me(options: any, object: any) : Promise<any> {
  let user = await read({ id: options.context.user }, {});
  return toPublicUserJSON(user);
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

  // create email verification token and discord verification state
  const expiresAt = expiresIn(EMAIL_EXPIRES_IN);
  const verifyEmailToken = await OneTimeToken.generateToken(expiresAt, user, 'verification');
  const verifyDiscordToken = await OneTimeToken.generateToken(expiresAt, user, 'verification');

  // send verification email
  sendVerificationEmail(user.username, verifyEmailToken, verifyDiscordToken);
  return toPublicUserJSON(user);
}

const registerWithLicense = async function registerWithLicense(options: any, object: any) : Promise<IUser> {
  // check arguments
  if (!object.username || !object.password || !object.license) {
    throw new BadRequestError({ message: i18n.__('errors.api.arguments.error') })
  }

  // find user
  let userTemp = await User.findOne({ username: object.username });
  if (userTemp) throw new BadRequestError({ message: i18n.__('errors.api.users.emailAlreadyTaken') });

  // check license key
  let res = await request({
    method: 'POST',
    uri: 'http://manager.faggot.io:8888/secret/migrate/update',
    json: true,
    body: {
      _license: object.license,
    }
  });

  // make sure license is not already migrated
  if (res.status !== 'Updated') {
    throw new BadRequestError({ message: i18n.__('errors.api.license.alreadyMigrated') });
  }

  // create new customer in the database
  const user = await add(options, object);
 
  // get matching client
  let client: IClient = await Client.getClient('vBHXyHLc0OOxq5OmC7NQ8nqqSy85jdXQ'); // Kickmoji SNKRS client
  if (client == null) throw new BadRequestError({ message: i18n.__('errors.api.client.notFound') });
 
  // add new license to user
  let license = await License.addNewLicense(client, user, new Date(4102441200000)); // expires at Jan 1, 2100

  // create email verification token and discord verification state
  const expiresAt = expiresIn(EMAIL_EXPIRES_IN);
  const verifyEmailToken = await OneTimeToken.generateToken(expiresAt, user, 'verification');
  const verifyDiscordToken = await OneTimeToken.generateToken(expiresAt, user, 'verification');

  // send verification email
  sendVerificationEmail(user.username, verifyEmailToken, verifyDiscordToken);
  return toPublicUserJSON(user);
}

const myLicenses = async function myLicenses(options: any, object: any) : Promise<any[]> {
  // get all licenses from database
  const licenses = await License.find({ user: options.context.user });
  return toPublicLicenseJSON(licenses);
}

const toPublicUserJSON = function toPublicUserJSON(user: IUser) : any {
  let { username, emailVerified, discordId } = user;
  return {
    username,
    emailVerified,
    discordId,
    id: user._id
  }
}

const toPublicLicenseJSON = function toPublicLicenseJSON(licenses: ILicense[]) : any[] {
  let cleaned = licenses.map((license: ILicense) : any => {
    let { numActivated, expiresAt } = license;
    return {
      numActivated,
      expiresAt,
      id: license._id
    }
  });
  return cleaned;
}

export default {
  read,
  me,
  add,
  register,
  registerWithLicense,
  myLicenses
}
