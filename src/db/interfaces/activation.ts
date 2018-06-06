import { ILicense } from '../schemas/license';

export interface IActivationDocument {
  license: ILicense;
  hwid: string;
  arch: string;
  cpus: string[];
  endianness: string;
  platform: string;
  username: string;
  hostname: string;
}