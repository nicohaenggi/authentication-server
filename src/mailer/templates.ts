// import dependencies
import Mailer from '../mailer';
import config from '../configuration';

// set email constants
const EMAIL = config.get('email:username');
const PASSWORD = config.get('email:password');
const NAME = config.get('email:name');
const HOST = config.get('email:host');
const PORT = config.get('email:port');
const PATH = config.get('email:templates');
const SEND = config.get('email:shouldSend');
const BASE_URL = config.get('settings:baseUrl');

// discord components
const CLIENT_ID = config.get('discord:clientId');
const REDIRECT_URI = encodeURIComponent(BASE_URL + '/api/verify/discord');

// create mailer
const mailer = new Mailer(EMAIL, NAME, PASSWORD, HOST, PORT, PATH, SEND);

export const sendVerificationEmail = async function sendVerificationEmail(to: string, verifyEmailToken: string, verifyDiscordToken: string) : Promise<void> {
  // send account verification email
  await mailer.sendTemplate('account-verification', to, {
    verifyEmailLink: `${BASE_URL}/api/verify/email?token=${verifyEmailToken}`,
    verifyDiscordLink: `https://discordapp.com/oauth2/authorize?client_id=${CLIENT_ID}&scope=identify&response_type=code&redirect_uri=${REDIRECT_URI}&state=${verifyDiscordToken}`
  });
}

export const sendPasswordResetEmail = async function sendPasswordResetEmail(to: string, passwordResetToken: string) : Promise<void> {
  // send account verification email
  await mailer.sendTemplate('account-verification', to, {
    passwordResetLink: `${BASE_URL}/api/reset/password?token=${passwordResetToken}`,
  });
}

