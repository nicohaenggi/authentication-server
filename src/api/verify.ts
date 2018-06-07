// # Verify API
// sets up all the verification API methods

// import dependencies
import * as request from 'request-promise';
import { InternalServerError, BadRequestError } from '../errors';
import { User, IUser } from '../db/schemas/user';
import { OneTimeToken, IOneTimeToken } from '../db/schemas/one-time-token';
import config from '../configuration';
import i18n from '../i18n';

const BASE_URL = config.get('settings:baseUrl');
const CLIENT_ID = config.get('discord:clientId');
const CLIENT_SECRET = config.get('discord:clientSecret');

/** Verify API Routes
* implements the verification API Routes
*/

const email = async function email(options: any, object: any) : Promise<any> {
  // find a onetimetoken to verify
  let token = await OneTimeToken.consumeVerificationToken(options.token);

  // ensure token exists and verify user
  if(token == null) throw new BadRequestError({ message: i18n.__('errors.api.verify.notFound') });

  // add email verified
  await token.user.setEmailVerified();
  
  // return response
  return {
    status: 200,
    message: 'Your email address was successfully verified.'
  };
}

const discord = async function discord(options: any, object: any) : Promise<any> {
  // get onetimetoken and authorization code
  const { state, code } = options;

  // find token and consume it
  let token = await OneTimeToken.consumeVerificationToken(state);

  // ensure token exists
  if(!token) {
    throw new BadRequestError({ message: i18n.__('errors.api.verify.notFound') });
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
        redirect_uri: BASE_URL + '/api/verify/discord',
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


    // link discord user
    let user = await token.user.linkDiscord(discordUser.id);

    // ensure user is not linked yet
    if (!user) {
      throw new BadRequestError({ message: i18n.__('errors.api.verify.discordAlreadyLinked') });
    }

    return {
      status: 200,
      message: 'Your Discord account was successfully linked.'
    };
  } catch (err) {
    throw new InternalServerError();
  }
}

export default {
  email,
  discord
}
