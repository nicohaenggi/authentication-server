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

const EMAIL_EXPIRES_IN = config.get('settings:emailExpiresIn');
const BOT_TOKEN = config.get('discord:botToken');

/** Users API Routes
* implements the users API Routes
*/

const read = async function read(options: any, object: any) : Promise<IUser> {
  // fetch a customer based on the id
  let user: IUser = await User.findById(options.id);
  // check if a response has been returned
  if (user == null) throw new BadRequestError({ message: i18n.__('errors.api.users.notFound') });
  return await toPrivateJSON(user, options.expand);
}

const readByUsername = async function readByUsername(options: any, object: any) : Promise<IUser> {
  // fetch a customer based on his username
  let user: IUser = await User.findOne({ username: options.username });
  // check if a response has been returned
  if (user == null) throw new BadRequestError({ message: i18n.__('errors.api.users.notFound') });
  return await toPrivateJSON(user, options.expand);
}

const add = async function add(options: any, object: any) : Promise<IUser> {
  // create new customer in the database
  const { username, password } = object;
  const user: IUser = await User.create({ username, password });
  // check if a response has been returned
  if (user == null) throw new BadRequestError({ message: i18n.__('errors.api.users.notCreated') });
  return user;
}

const me = async function me(options: any, object: any) : Promise<any> {
  // fetch a customer based on the id
  const user: IUser = await User.findById(options.context.user);
  // check if a response has been returned
  if (user == null) throw new BadRequestError({ message: i18n.__('errors.api.users.notFound') });
  return await toPublicJSON(user, options.expand);
}

const register = async function register(options: any, object: any) : Promise<IUser> {
  // create new customer in the database
  const user = await add(options, object);

  // create email verification token and discord verification state
  const expiresAt = expiresIn(EMAIL_EXPIRES_IN);
  const verifyEmailToken = await OneTimeToken.generateToken(expiresAt, user, 'verification');

  // send verification email
  sendVerificationEmail(user.username, verifyEmailToken);

  return await toPublicJSON(user, options.expand);
}

const resetPasswordConfirmation = async function resetPasswordConfirmation(options: any, object: any) : Promise<any> {
  // find a OneTimeToken to verify
  let token = await OneTimeToken.consumePasswordResetToken(object.token);

  // make sure token is valid and not expired not expired
  if (token == null) throw new BadRequestError({ message: i18n.__('errors.api.users.passwordResetFailed') });

  // set new password for user
  let user = await token.user.setNewPassword(object.password);

  // return sucessful response
  return await toPublicJSON(user, options.expand);
}

const resendVerification = async function resendVerification(options: any, object: any) : Promise<any> {
  // fetch user from the database
  const user = await User.findOne({ username: object.username });

  // check if a response has been returned
  if (user == null) throw new BadRequestError({ message: i18n.__('errors.api.users.notFound') });

  // check if the user is already verified
  if (user.isVerified()) throw new BadRequestError({ message: i18n.__('errors.api.users.alreadyVerified') });

  // create email verification token and discord verification state
  const expiresAt = expiresIn(EMAIL_EXPIRES_IN);
  const verifyEmailToken = await OneTimeToken.generateToken(expiresAt, user, 'verification');

  // send verification email
  sendVerificationEmail(user.username, verifyEmailToken);
  return {
    success: true,
    status: 'The verification email was successfully resent. Please check your email!'
  };
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

const fetchDiscordDetails = async function fetchDiscordDetails(discordId: string, shouldExpand: string = 'false') : Promise<any> {
  // if it should expand, get discord user details
  if (discordId && shouldExpand === 'true') {
    try {
      // fetch discord user details
      const discordUser = await request({
        method: 'GET',
        uri: 'https://discordapp.com/api/v6/users/' + discordId,
        json: true,
        headers: {
          authorization: `Bot ${BOT_TOKEN}` 
        }
      });

      // check if discord user is already linked
      if (!discordUser || !discordUser.username) throw new InternalServerError();

      // attach result to response
      return {
        id: discordUser.id,
        username: `${discordUser.username}#${discordUser.discriminator}`,
        avatarUrl: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
      };
    } catch (err) {
      throw new InternalServerError();
    }
  } else {
    return discordId;
  }
}

const toPublicJSON = async function toPublicUserJSON(user: IUser, shouldExpand: string) : Promise<any> {
  const { username, emailVerified, discordId } = user;

  // create response object
  const response = {
    id: user._id,
    username,
    emailVerified,
    discord: await fetchDiscordDetails(discordId, shouldExpand)
  }

  // return response
  return response;
}

const toPrivateJSON = async function toPublicUserJSON(user: IUser, shouldExpand: string) : Promise<any> {
  const response = user.toJSON();
  response.password = undefined;
  response.discordId = undefined;
  response.discord = await fetchDiscordDetails(user.discordId, shouldExpand);
  return response;
}

export default {
  read,
  readByUsername,
  me,
  add,
  register,
  resendVerification,
  resetPasswordRequest,
  resetPasswordConfirmation,
}
