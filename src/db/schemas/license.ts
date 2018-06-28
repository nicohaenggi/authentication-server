// import dependencies
import { Document, Schema, Model, model } from 'mongoose';
import { ILicenseDocument } from '../interfaces/license';
import { IClient } from './client';
import { IUser } from './user';

export interface ILicense extends ILicenseDocument, Document {
  atomicIncrementActivation(step: number, maxAmount?: number) : Promise<boolean>;
}

export interface ILicenseModel extends Model<ILicense>  {
  getLicenseForClientAndUser(client: IClient, user: IUser) : Promise<ILicense>;
  addNewLicense(client: IClient, user: IUser, expiresAt: Date) : Promise<ILicense>;
}

export const LicenseModel: Schema = new Schema({
  numActivated: { type: Number, required: true, default: 0, min: 0 },
  expiresAt: { type: Date, required: true, default: new Date() },
  client: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });


LicenseModel.methods.atomicIncrementActivation = async function atomicIncrementActivation(step: number, maxAmount: number = 999999) : Promise<boolean> {
	// prepare filter conditions
	let conditions: any = {
    _id: this._id,
		numActivated: { $lt: maxAmount }
	};

	// make sure counter decrement will not result in negative counter
	if (step < 0) {
		conditions.numActivated['$gte'] = -1*step;
	}

	// make atomic counter update
  const status = await License.update(conditions, { $inc: { numActivated: step } });
	if (status.nModified === 1) {
		return true;
	} else {
		return false;
	}
}

LicenseModel.statics.getLicenseForClientAndUser = async function getLicenseForClientAndUser(client: IClient, user: IUser) : Promise<ILicense> {
  return await License.findOne({ client: client._id, user: user._id });
}

LicenseModel.statics.addNewLicense = async function addNewLicense(client: IClient, user: IUser, expiresAt: Date) : Promise<ILicense> {
  return await License.create({
    numActivated: 0,
    expiresAt,
    client,
    user
  });
}

export const License: ILicenseModel = model<ILicense, ILicenseModel>('License', LicenseModel);