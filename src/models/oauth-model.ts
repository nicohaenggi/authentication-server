import { IAuthModel, Scope } from '../oauth/interfaces';
import { Client, IClient } from '../db/schemas/client';
import { User, IUser } from '../db/schemas/user';
import { Token, IToken } from '../db/schemas/token';
import { ITokenDocument } from '../db/interfaces/token';
import { generateRandomToken } from '../utils';

const generateAccessToken = async function generateAccessToken(client: IClient, user: IUser, scope: Scope, expiresAt: Date) : Promise<string> {
  return await Token.generateAccessToken(client, user, scope, expiresAt);
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
  // use default scope
  return scope;
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
  revokeToken
}

export default OAuthModel;