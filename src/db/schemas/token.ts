// import dependencies
import { Document, Schema, Model, model} from 'mongoose';
import * as jwt from 'jsonwebtoken';
import { ITokenDocument } from '../interfaces/token';
import config from '../../configuration';
import { IClient } from './client';
import { IUser } from './user';

const JWT_SECRET = config.get('jwt:secret');

export interface IToken extends ITokenDocument, Document {}

export interface ITokenModel extends Model<IToken>  {
  getClient(clientId: string, clientSecret?: string) : Promise<IToken>;
}

export const TokenModel: Schema = new Schema({
  accessToken: { type: String, required: true, unique: true, index: true },
  accessTokenExpiresAt: { type: Date, required: true, default: new Date() },
  refreshToken: { type: String, required: true, unique: true, index: true },
  refreshTokenAt: { type: Date, required: true, default: new Date() },
  client: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  scope: { type: [String], required: true },
}, { timestamps: true });

TokenModel.statics.getAccessToken = async function getAccessToken(accessToken: string) : Promise<IToken> {
  return await Token.findOne({ accessToken });
}


TokenModel.statics.generateAccessToken = async function generateAccessToken(client: IClient, user: IUser, scope: string[]) : Promise<string> {
  // create new JWT token
  return jwt.sign({
    exp: Math.floor(Date.now() / 1000) + (60 * 60),
    data: 'foobar'
  }, JWT_SECRET);
}

export const Token: ITokenModel = model<IToken, ITokenModel>('Token', TokenModel);