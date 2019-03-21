// # Verification API
// sets up all the verification API methods

// import dependencies
import * as request from 'request-promise';
import { Response } from 'express';
import { InternalServerError, BadRequestError } from '../errors';
import { User, IUser } from '../db/schemas/user';
import { expiresIn } from '../utils';
import { OneTimeToken, IOneTimeToken } from '../db/schemas/one-time-token';
import config from '../configuration';
import i18n from '../i18n';

const BASE_URL = config.get('settings:baseUrl');
const CLIENT_ID = config.get('discord:clientId');
const CLIENT_SECRET = config.get('discord:clientSecret');
const DISCORD_EXPIRES_IN = config.get('settings:discordExpiresIn');
const REDIRECTS = config.get('redirects');
const REDIRECT_URI = BASE_URL + '/api/users/@me/discord/confirmation';

/** Verify API Routes
* implements the verification API Routes
*/

const email = async function email(options: any, object: any, res: Response) : Promise<any> {
  // find a onetimetoken to verify
  let token = await OneTimeToken.consumeVerificationToken(options.token);

  // ensure token exists and verify user
  if (token == null) {
    return res.redirect(REDIRECTS.emailVerificationFail);
  }

  // add email verified
  await token.user.setEmailVerified();

  // render email verified
  return res.redirect(REDIRECTS.emailVerificationSuccess);
}

const discordRequest = async function discordRequest(options: any, object: any, res: Response) : Promise<any> {
  // get user based on jwt context
  const user = await User.findById(options.context.user);

  // check if user exists
  if (user == null) throw new BadRequestError({ message: i18n.__('errors.api.users.notFound') });

  // create password reset token
  const expiresAt = expiresIn(DISCORD_EXPIRES_IN);
  const verifyDiscordToken = await OneTimeToken.generateToken(expiresAt, user, 'verification_discord');

  // redirect to website
  return {
    success: true,
    redirect: `https://discordapp.com/oauth2/authorize?client_id=${CLIENT_ID}&scope=identify&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${verifyDiscordToken}`
  };
}

const discordConfirmation = async function discordConfirmation(options: any, object: any, res: Response) : Promise<any> {
  // get onetimetoken and authorization code
  const { state, code } = options;

  // find token and consume it
  let token = await OneTimeToken.consumeDiscordToken(state);

  // ensure token exists
  if (!token) {
    return res.redirect(REDIRECTS.discordVerificationFail);
  }

  try {
    // fetch auth token
    let auth = await request({
      method: 'POST',
      uri: 'https://discordapp.com/api/oauth2/token',
      json: true,
      form: {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
        scope: 'identify'
      }
    });

    // fetch user data
    let discordUser = await request({
      method: 'GET',
      uri: 'https://discordapp.com/api/users/@me',
      json: true,
      headers: {
        authorization: `${auth.token_type} ${auth.access_token}` 
      }
    });

    // check if discord user is already linked
    let existingLinkedUser = await User.findOne({ discordId: discordUser.id });
    if (existingLinkedUser) {
      return res.redirect(REDIRECTS.discordVerificationAlreadyLinked);
    }

    // link discord user
    await token.user.linkDiscord(discordUser.id);

    // render success
    return res.redirect(REDIRECTS.discordVerificationSuccess);
  } catch (err) {
    throw new InternalServerError();
  }
}

export default {
  email,
  discordRequest,
  discordConfirmation
}
