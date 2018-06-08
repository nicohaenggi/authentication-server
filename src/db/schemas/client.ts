// import dependencies
import { Document, Schema, Model, model} from 'mongoose';
import { IClientDocument } from '../interfaces/client';

export interface IClient extends IClientDocument, Document {}

export interface IClientModel extends Model<IClient>  {
  getClient(clientId: string, clientSecret?: string) : Promise<IClient>;
}

export const ClientModel: Schema = new Schema({
  name: { type: String, required: true },
  clientId: { type: String, required: true, unique: true, index: true },
  clientSecret: { type: String, required: true },
  grants: { type: [String], required: true },
  redirectUris: { type: [String], default: null },
  accessTokenLifetime: { type: Number, default: null },
  refreshTokenLifetime: { type: Number, default: null },
  maxActiveSessions: { type: Number, default: null },
  fingerprintSecret: { type: String, required: true, unique: true }
}, { timestamps: true });

ClientModel.statics.getClient = async function getClient(clientId: string, clientSecret?: string) : Promise<IClient> {
  let query: any = { clientId };
  if (clientSecret) {
    query.clientSecret = clientSecret;
  }

  // find matching client
  return await Client.findOne(query);
}

export const Client: IClientModel = model<IClient, IClientModel>('Client', ClientModel);
