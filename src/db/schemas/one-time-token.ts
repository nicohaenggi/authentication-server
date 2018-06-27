// import dependencies
import { Document, Schema, Model, model} from 'mongoose';
import * as jwt from 'jsonwebtoken';
import { IOneTimeTokenDocument } from '../interfaces/one-time-token';
import { IClient } from './client';
import { IUser } from './user';
import { generateRandomToken } from '../../utils';

export interface IOneTimeToken extends IOneTimeTokenDocument, Document {}

export interface IOneTimeTokenModel extends Model<IOneTimeToken>  {
  consumeVerificationToken(token: string) : Promise<IOneTimeToken>;
  consumePasswordResetToken(token: string) : Promise<IOneTimeToken>;
  generateToken(expiresAt: Date, user: IUser, purpose: string) : Promise<string>;
  cleanExpired() : Promise<any>;
}

export const OneTimeTokenModel: Schema = new Schema({
  token: { type: String, required: true, unique: true, index: true },
  expiresAt: { type: Date, required: true, default: new Date() },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  purpose: { type: String, required: true },
}, { timestamps: true });

OneTimeTokenModel.statics.consumeVerificationToken = async function consumeVerificationToken(token: string) : Promise<IOneTimeToken> {
  return await OneTimeToken.findOneAndRemove({ token, purpose: 'verification', expiresAt: { $gt: new Date() } })
    .populate('user')
    .exec();
}

OneTimeTokenModel.statics.consumePasswordResetToken = async function consumePasswordResetToken(token: string) : Promise<IOneTimeToken> {
  return await OneTimeToken.findOneAndRemove({ token, purpose: 'password_reset', expiresAt: { $gt: new Date() } })
    .populate('user')
    .exec();
}

OneTimeTokenModel.statics.generateToken = async function generateToken(expiresAt: Date, user: IUser, purpose: string) : Promise<string> {
  let randToken = await generateRandomToken();
  await OneTimeToken.create({
    token: randToken,
    expiresAt,
    user,
    purpose
  });

  return randToken;
}

OneTimeTokenModel.statics.cleanExpired = async function cleanExpired() : Promise<any> {
  let resp = await OneTimeToken.remove({ expiresAt: { $lt: new Date() } });
  return resp;
}

export const OneTimeToken: IOneTimeTokenModel = model<IOneTimeToken, IOneTimeTokenModel>('OneTimeToken', OneTimeTokenModel);