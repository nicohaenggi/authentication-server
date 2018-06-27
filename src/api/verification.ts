// # Verification API
// sets up all the verification API methods

// import dependencies
import * as request from 'request-promise';
import { Response } from 'express';
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

const email = async function email(options: any, object: any, res: Response) : Promise<any> {
  // find a onetimetoken to verify
  let token = await OneTimeToken.consumeVerificationToken(options.token);

  // ensure token exists and verify user
  if(token == null) {
    return res.render('verification', {
      websiteTitle: 'Email Verification',
      title: 'Email Verification',
      content: 'The email verification has failed because the link has either expired or does not exist.'
    });
  }

  // add email verified
  await token.user.setEmailVerified();

  // render email verified
  return res.render('verification', {
    websiteTitle: 'Email Verification',
    title: 'Email Verification',
    content: 'Your email address has been successfully verified.'
  });
}

const discord = async function discord(options: any, object: any, res: Response) : Promise<any> {
  // get onetimetoken and authorization code
  const { state, code } = options;

  // find token and consume it
  let token = await OneTimeToken.consumeVerificationToken(state);

  // ensure token exists
  if(!token) {
    return res.render('verification', {
      websiteTitle: 'Discord Verification',
      title: 'Discord Verification',
      content: 'The Discord verification has failed because the link has either expired or does not exist anymore.'
    });
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
        redirect_uri: BASE_URL + '/verification/discord',
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
      return res.render('verification', {
        websiteTitle: 'Discord Verification',
        title: 'Discord Verification',
        content: 'The Discord user you are trying to link is already connected to a Kickmoji account.'
      });
    }

    // link discord user
    let user = await token.user.linkDiscord(discordUser.id);

    // ensure user is not linked yet
    if (!user) {
      return res.render('verification', {
        websiteTitle: 'Discord Verification',
        title: 'Discord Verification',
        content: 'The Kickmoji account you are trying to verify has already been linked to a Discord account.'
      });
    }

    // render success
    return res.render('verification', {
      websiteTitle: 'Discord Verification',
      title: 'Discord Verification',
      content: 'Your Discord account was successfully linked.'
    });
  } catch (err) {
    throw new InternalServerError();
  }
}

export default {
  email,
  discord
}
