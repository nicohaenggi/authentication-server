import { IAuthModel, Scope } from '../oauth/interfaces';
import { Client, IClient } from '../db/schemas/client';
import { User, IUser } from '../db/schemas/user';
import { Token, IToken } from '../db/schemas/token';
import { ITokenDocument } from '../db/interfaces/token';
import { generateRandomToken } from '../utils';
import { Activation, IActivation } from '../db/schemas/activation';
import { License, ILicense } from '../db/schemas/license';

const generateAccessToken = async function generateAccessToken(client: IClient, user: IUser, scope: Scope, expiresAt: Date, license?: ILicense, activation?: IActivation) : Promise<string> {
  return await Token.generateAccessToken(client, user, scope, expiresAt, license, activation);
}

const generateRefreshToken = async function generateRefreshToken(client: IClient, user: IUser, scope: Scope) : Promise<string> {
  return await generateRandomToken();
}

const getAccessToken = async function getAccessToken(accessToken: string) : Promise<IToken> {
  return await Token.getAccessToken(accessToken);
}

const getRefreshToken = async function getRefreshToken(refreshToken: string) : Promise<IToken> {
  return await Token.getRefreshToken(refreshToken);
}

const getClient = async function getClient(clientId: string, clientSecret: string) : Promise<IClient> {
  return await Client.getClient(clientId, clientSecret);
}

const getUser = async function getUser(username: string, password: string) : Promise<IUser> {
  return await User.getUser(username, password);
}

const saveToken = async function saveToken(token: ITokenDocument) : Promise<IToken> {
  return await Token.createToken(token);
}

const revokeToken = async function revokeToken(token: IToken) : Promise<boolean> {
  return await token.revoke();
}

const validateScope = async function validateScope(user: IUser, client: IClient, scope: Scope) : Promise<Scope> {
  return scope; // use default scope
}

const getLicenseForClientAndUser = async function getLicenseForClientAndUser(client: IClient, user: IUser) : Promise<ILicense> {
  return await License.getLicenseForClientAndUser(client, user);
}

const getActivationByHWID = async function getActivationByHWID(hwid: string, license: ILicense) : Promise<IActivation> {
  return await Activation.getActivationByHWID(hwid, license);
}

const incrementActivation = async function incrementActivation(license: ILicense, maxAmount: number, negative: boolean = false) : Promise<boolean> {
  let step = negative ? -1 : 1;
  return await license.atomicIncrementActivation(step, maxAmount);
}

const addActivation = async function addActivation(hwid: string, license: ILicense, arch: string, cpus: string[], endianness: string, platform: string, username: string, hostname: string) : Promise<IActivation> {
  return await Activation.addActivation(hwid, license, arch, cpus, endianness, platform, username, hostname);
}

const OAuthModel : IAuthModel = {
  generateAccessToken,
  generateRefreshToken,
  getAccessToken,
  getClient,
  getRefreshToken,
  getUser,
  saveToken,
  validateScope,
  revokeToken,
  getActivationByHWID,
  getLicenseForClientAndUser,
  addActivation,
  incrementActivation
}

export default OAuthModel;