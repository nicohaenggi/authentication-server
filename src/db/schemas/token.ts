// import dependencies
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import * as path from 'path';
import { Document, Schema, Model, model} from 'mongoose';
import { ITokenDocument } from '../interfaces/token';
import config from '../../configuration';
import { IClient } from './client';
import { IUser } from './user';
import { generateRandomToken } from '../../utils';
import { ILicense } from './license';
import { IActivation } from './activation';

// read jwt tokens
const JWT_ISSUER = config.get('jwt:issuer');
const CERT = fs.readFileSync(path.join(__dirname, '../../../keys/jwt/cert.key'));

export interface IToken extends ITokenDocument, Document {
  revoke() : Promise<boolean>;
}

export interface ITokenModel extends Model<IToken>  {
  getAccessToken(accessToken: string) : Promise<IToken>;
  getRefreshToken(refreshToken: string) : Promise<IToken>;
  createToken(token: ITokenDocument) : Promise<IToken>;
  generateAccessToken(client: IClient, user: IUser, scope: string[], expiresAt: Date, license?: ILicense, activation?: string) : Promise<string>;
}

export const TokenModel: Schema = new Schema({
  accessToken: { type: String, required: true },
  accessTokenExpiresAt: { type: Date, required: true, default: new Date() },
  refreshToken: { type: String, required: true },
  refreshTokenExpiresAt: { type: Date, required: true, default: new Date() },
  client: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  scope: { type: [String], required: true },
}, { timestamps: true });

TokenModel.methods.revoke = async function revoke() : Promise<boolean> {
 let foundAndRemoved = await Token.findOneAndRemove({ _id: this._id });
 return !!foundAndRemoved;
}

TokenModel.statics.getAccessToken = async function getAccessToken(accessToken: string) : Promise<IToken> {
  return await Token.findOne({ accessToken })
    .populate('client')
    .populate('user')
    .exec();
}

TokenModel.statics.getRefreshToken = async function getRefreshToken(refreshToken: string) : Promise<IToken> {
  return await Token.findOne({ refreshToken })
    .populate('client')
    .populate('user')
    .exec();
}

TokenModel.statics.generateAccessToken = async function generateAccessToken(client: IClient, user: IUser, scope: string[], expiresAt: Date, license?: ILicense, activation?: string) : Promise<string> {
  let randId = await generateRandomToken();
  // generate payload
  let payload : any = {
    id: randId,
    jto: randId,
    iss: JWT_ISSUER,
    aud: client.clientId,
    sub: user._id,
    exp: Math.floor(expiresAt.getTime()/1000),
    iat: Math.floor(Date.now()/1000),
    token_type: 'Bearer',
    scope: scope
  };

  if (license) {
    payload.license = {
      expiresAt: license.expiresAt
    };
  }

  if (activation) {
    payload.activation = activation;
  }

  // create new JWT token
  return jwt.sign(payload, CERT, { algorithm: 'RS256' });
}

TokenModel.statics.createToken = async function createToken(token: ITokenDocument) : Promise<IToken> {
  return await this.create(token);
}

export const Token: ITokenModel = model<IToken, ITokenModel>('Token', TokenModel);