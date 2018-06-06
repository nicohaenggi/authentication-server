// import dependencies
import { Document, Schema, Model, model } from 'mongoose';
import { IActivationDocument } from '../interfaces/activation';
import { ILicense } from './license';

export interface IActivation extends IActivationDocument, Document {
  revoke() : Promise<boolean>;
}

export interface IActivationModel extends Model<IActivation>  {
  getActivationByHWID(hwid: string, license: ILicense) : Promise<IActivation>;
  addActivation(hwid: string, license: ILicense, arch: string, cpus: string[], endianness: string, platform: string, username: string, hostname: string) : Promise<IActivation>;
}

export const ActivationModel: Schema = new Schema({
  hwid: { type: String, required: true, unique: true, index: true },
  license: { type: Schema.Types.ObjectId, ref: 'License', required: true },
  arch: { type: String, required: true },
  cpus: { type: [String], required: true },
  endianness: { type: String, required: true },
  platform: { type: String, required: true },
  username: { type: String, required: true },
  hostname: { type: String, required: true }
}, { timestamps: true });

ActivationModel.methods.revoke = async function revoke() : Promise<boolean> {
  let foundAndRemoved = await Activation.findOneAndRemove({ _id: this._id });
  return !!foundAndRemoved;
}

ActivationModel.statics.getActivationByHWID = async function getActivationByHWID(hwid: string, license: ILicense) : Promise<IActivation> {
  return await Activation.findOne({ license: license._id, hwid });
}

ActivationModel.statics.addActivation = async function addActivation(hwid: string, license: ILicense, arch: string, cpus: string[], endianness: string, platform: string, username: string, hostname: string) : Promise<IActivation> {
  return await Activation.create({
    hwid,
    license,
    arch,
    cpus,
    endianness,
    platform,
    username,
    hostname
  });
}

export const Activation: IActivationModel = model<IActivation, IActivationModel>('Activation', ActivationModel);