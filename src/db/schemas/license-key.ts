// import dependencies
import { Document, Schema, Model, model } from 'mongoose';
import { ILicenseKeyDocument } from '../interfaces/license-key';
import { IClient } from './client';
import { ILicense } from './license';

export interface ILicenseKey extends ILicenseKeyDocument, Document {
  atomicIncrementActivation(step: number, maxAmount?: number) : Promise<boolean>;
}

export interface ILicenseKeyModel extends Model<ILicenseKey>  {
  // getLicenseForClientAndUser(client: IClient, user: IUser) : Promise<ILicense>;
  // addNewLicense(client: IClient, user: IUser, expiresAt: Date) : Promise<ILicense>;
}

export const LicenseKeyModel: Schema = new Schema({
  key: { type: String, required: true, unique: true, index: true },
  expiresAt: { type: Date, required: true, default: new Date() },
  client: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
  license: { type: Schema.Types.ObjectId, ref: 'License', required: false, default: null },
}, { timestamps: true });

LicenseKeyModel.statics.getLicensForKey = async function getLicensForKey(key: string) : Promise<ILicenseKey> {
  return await LicenseKey.findOne({ key });
}

LicenseKeyModel.statics.addNewLicenseKey = async function addNewLicense(key: string, client: IClient, expiresAt: Date) : Promise<ILicenseKey> {
  return await LicenseKey.create({
    key,
    client,
    expiresAt
  });
}

export const LicenseKey: ILicenseKeyModel = model<ILicenseKey, ILicenseKeyModel>('LicenseKey', LicenseKeyModel);