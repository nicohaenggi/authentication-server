import { Request, Response } from 'express';
import { IClient } from '../db/schemas/client';
import { IUser } from '../db/schemas/user';
import { IToken } from '../db/schemas/token';
import { ITokenDocument } from '../db/interfaces/token';

export type Scope = string[];
export type Constructor<T> = new(...args: any[]) => T;

export interface IAuthModel {
  generateAccessToken(client: IClient, user: IUser, scope: Scope, expiresAt: Date) : Promise<string>;
  generateRefreshToken(client: IClient, user: IUser, scope: Scope) : Promise<string>;
  getAccessToken(accessToken: string) : Promise<IToken>;
  getRefreshToken(refreshToken: string) : Promise<IToken>;
  getClient(clientId: string, clientSecret: string) : Promise<IClient>;
  getUser(username: string, password: string) : Promise<IUser>;
  saveToken(token: ITokenDocument) : Promise<IToken>;
  revokeToken(token: IToken) : Promise<boolean>;
  validateScope(user: IUser, client: IClient, scope: Scope) : Promise<Scope>;
};

export interface OAuthServerOptions {
  model: IAuthModel;
}

export interface TokenHandlerOptions {
  accessTokenLifetime: number;
  refreshTokenLifetime: number;
  grantTypes: any;
  requireClientAuthentication: any;
  alwaysIssueNewRefreshToken: boolean;
}

export interface IClientCredentials {
  clientId: string;
  clientSecret?: string;
}

export interface IBearerTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: Scope;
}

export interface IAbstractTokenType {
  valueOf() : any;
}
export interface IAbstractGrantTypeOptions {
  accessTokenLifetime: number;
  refreshTokenLifetime: number;
  alwaysIssueNewRefreshToken: boolean;
  model: IAuthModel;
}

export interface TokenHandlerOptionsInternal extends OAuthServerOptions, TokenHandlerOptions {};
export interface IRequest extends Request {};
export interface IResponse extends Response {
  body?: any;
};     