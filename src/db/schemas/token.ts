// import dependencies
import { Document, Schema, Model, model} from 'mongoose';
import * as jwt from 'jsonwebtoken';
import { ITokenDocument } from '../interfaces/token';
import config from '../../configuration';
import { IClient } from './client';
import { IUser } from './user';
import { METHODS } from 'http';

const JWT_SECRET = config.get('jwt:secret');

export interface IToken extends ITokenDocument, Document {
  revoke() : Promise<boolean>;
}

export interface ITokenModel extends Model<IToken>  {
  getAccessToken(accessToken: string) : Promise<IToken>;
  getRefreshToken(refreshToken: string) : Promise<IToken>;
  createToken(token: ITokenDocument) : Promise<IToken>;
  generateAccessToken(client: IClient, user: IUser, scope: string[]) : Promise<string>;
}

export const TokenModel: Schema = new Schema({
  accessToken: { type: String, required: true, unique: true, index: true },
  accessTokenExpiresAt: { type: Date, required: true, default: new Date() },
  refreshToken: { type: String, required: true, unique: true, index: true },
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

TokenModel.statics.generateAccessToken = async function generateAccessToken(client: IClient, user: IUser, scope: string[]) : Promise<string> {
  // create new JWT token
  // !TODO: implement real JWT
  return jwt.sign({
    exp: Math.floor(Date.now() / 1000) + (60 * 60),
    data: 'foobar'
  }, JWT_SECRET);
}

TokenModel.statics.createToken = async function createToken(token: ITokenDocument) : Promise<IToken> {
  return await this.create(token);
}

export const Token: ITokenModel = model<IToken, ITokenModel>('Token', TokenModel);