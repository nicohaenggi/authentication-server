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
  tokenType: { type: [String], required: true },
  redirectUri: { type: String, required: true, default: null }
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
