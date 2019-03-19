// import dependencies
import Mailer from '../mailer';
import config from '../configuration';

// set email constants
const USERNAME = config.get('email:username');
const PASSWORD = config.get('email:password');
const EMAIL = config.get('email:email');
const NAME = config.get('email:name');
const HOST = config.get('email:host');
const PORT = config.get('email:port');
const PATH = config.get('email:templates');
const SEND = config.get('email:shouldSend');
const BASE_URL = config.get('settings:baseUrl');

// create mailer
const mailer = new Mailer(EMAIL, NAME, USERNAME, PASSWORD, HOST, PORT, PATH, SEND);

export const sendVerificationEmail = async function sendVerificationEmail(to: string, verifyEmailToken: string) : Promise<void> {
  // send account verification email
  await mailer.sendTemplate('account-verification', to, {
    verifyEmailLink: `${BASE_URL}/verification/email?token=${verifyEmailToken}`
  });
}

export const sendPasswordResetEmail = async function sendPasswordResetEmail(to: string, passwordResetToken: string) : Promise<void> {
  // send account verification email
  await mailer.sendTemplate('password-reset', to, {
    passwordResetLink: `${BASE_URL}/reset/password?token=${passwordResetToken}`,
  });
}