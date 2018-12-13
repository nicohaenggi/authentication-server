// # Users API
// sets up all the users API methods

// import dependencies
import * as request from 'request-promise';
import { InternalServerError, BadRequestError } from '../errors';
import { User, IUser } from '../db/schemas/user';
import { OneTimeToken, IOneTimeToken } from '../db/schemas/one-time-token';
import { expiresIn } from '../utils';
import { sendVerificationEmail, sendPasswordResetEmail } from '../mailer/templates';
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

const readByUsername = async function readByUsername(options: any, object: any) : Promise<IUser> {
  // fetch a customer based on his username
  let user: IUser = await User.findOne({ username: options.username });
  // check if a response has been returned
  if(user == null) throw new BadRequestError({ message: i18n.__('errors.api.users.notFound') });
  return toPublicUserJSON(user);
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


const resendVerification = async function resendVerification(options: any, object: any) : Promise<any> {
  // fetch user from the database
  const user = await User.findOne({ username: object.username });

   // check if a response has been returned
   if(user == null) throw new BadRequestError({ message: i18n.__('errors.api.users.notFound') });

   // check if the user is already verified
   if (user.isVerified()) throw new BadRequestError({ message: i18n.__('errors.api.users.alreadyVerified') });

  // create email verification token and discord verification state
  const expiresAt = expiresIn(EMAIL_EXPIRES_IN);
  const verifyEmailToken = await OneTimeToken.generateToken(expiresAt, user, 'verification');
  const verifyDiscordToken = await OneTimeToken.generateToken(expiresAt, user, 'verification');

  // send verification email
  sendVerificationEmail(user.username, verifyEmailToken, verifyDiscordToken);
  return {
    success: true,
    status: 'The verification email was successfully resent. Please check your email!'
  }
}

const resetPasswordRequest = async function resetPasswordRequest(options: any, object: any) : Promise<any> {
  // get user based on email
  const user = await User.findOne({ username: object.username });

  // check if user exists
  if (user == null) throw new BadRequestError({ message: i18n.__('errors.api.users.notFound') });

  // create password reset token
  const expiresAt = expiresIn(EMAIL_EXPIRES_IN);
  const passwordResetToken = await OneTimeToken.generateToken(expiresAt, user, 'password_reset');

  // send password reset email
  sendPasswordResetEmail(user.username, passwordResetToken);

  // return sucessful response
  return {
    success: true,
    status: 'The password reset was successfully initiated. Please check your email!'
  }
}

const resetPasswordConfirmation = async function resetPasswordConfirmation(options: any, object: any) : Promise<any> {
   // find a onetimetoken to verify
   let token = await OneTimeToken.consumePasswordResetToken(object.token);

  // add email verified
  let user = await token.user.setNewPassword(object.password);

  // return sucessful response
  return toPublicUserJSON(user);
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
  readByUsername,
  me,
  add,
  register,
  registerWithLicense,
  myLicenses,
  resendVerification,
  resetPasswordRequest,
  resetPasswordConfirmation
}
