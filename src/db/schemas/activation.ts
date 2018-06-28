// import dependencies
import * as crypto from 'crypto';
import { Document, Schema, Model, model } from 'mongoose';
import { IActivationDocument } from '../interfaces/activation';
import { ILicense, License } from './license';
import { IClient } from './client';
import { ISensorData } from '../../oauth/interfaces';

export interface IActivation extends IActivationDocument, Document {
  revoke() : Promise<boolean>;
}

export interface IActivationModel extends Model<IActivation>  {
  getActivationByHWID(hwid: string, license: ILicense) : Promise<IActivation>;
  addActivation(hwid: string, license: ILicense, arch: string, cpus: string[], endianness: string, platform: string, username: string, hostname: string) : Promise<IActivation>;
  getSensorData(encrypted: string, client: IClient) : Promise<ISensorData>;
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
  let license = await License.findById(foundAndRemoved.license);
  await license.atomicIncrementActivation(-1);
  return !!foundAndRemoved;
}

ActivationModel.statics.getActivationByHWID = async function getActivationByHWID(hwid: string, license: ILicense) : Promise<IActivation> {
  return await Activation.findOne({ license: license._id, hwid });
}

ActivationModel.statics.getSensorData = async function getSensorData(encrypted: string, client: IClient) : Promise<ISensorData> {
    let decipher = crypto.createDecipheriv('aes-256-cbc', new Buffer(client.fingerprintSecret), new Buffer(client.fingerprintSecret.slice(0, 16)));
    let dec = decipher.update(encrypted, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return JSON.parse(dec);
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