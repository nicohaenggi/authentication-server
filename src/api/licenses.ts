// # Licenses API
// sets up all the licenses API methods

// import dependencies
import { InternalServerError, BadRequestError } from '../errors';
import { User, IUser } from '../db/schemas/user';
import i18n from '../i18n';
import { License, ILicense } from '../db/schemas/license';
import { Client, IClient } from '../db/schemas/client';

/** Licenses API Routes
* implements the licenses API Routes
*/

const browse = async function browse(options: any, object: any) : Promise<ILicense[]> {
  // fetch all licenses from the database
  let licenses: ILicense[] = await License.find({});
  // check if a response has been returned
  if (licenses == null) throw new InternalServerError();;
  return licenses;
}

const browsePublic = async function browsePublic(options: any, object: any) : Promise<any[]> {
  console.log(options.context);
  // fetch all licenses from the database that belong to the logged in user
  let licenses: ILicense[] = await License.find({ user: options.context.user });
  // check if a response has been returned
  if (licenses == null) throw new InternalServerError();;
  return await Promise.all(licenses.map(async (license) => await toPublicJSON(license)));
}

const read = async function read(options: any, object: any) : Promise<ILicense> {
  // fetch a license based on the id
  let license: ILicense = await License.findById(options.id);
  // check if a response has been returned
  if (license == null) throw new BadRequestError({ message: i18n.__('errors.api.licenses.notFound') });
  return license;
}

const add = async function add(options: any, object: any) : Promise<any> {
  if (!object.client || !object.expiresAt || !object.user) {
    throw new BadRequestError({ message: i18n.__('errors.api.arguments.missing') });
  }

  // fetch assigned user
  let user: IUser = await User.findById(object.user);
  if (user == null) throw new BadRequestError({ message: i18n.__('errors.api.users.notFound') });

  // get matching client
  let client: IClient = await Client.getClient(object.client);
  if (client == null) throw new BadRequestError({ message: i18n.__('errors.api.client.notFound') });

  // add new license to user
  let license = await License.addNewLicense(client, user, new Date(object.expiresAt));
  
  // depopulate license
  license.client = license.client._id;
  license.user = license.user._id;
  return license;
}

const toPublicJSON = async function toPublicLicenseJSON(license: ILicense) : Promise<any> {
  // populate reference
  license = await license.populate('client').execPopulate();

  let { numActivated, expiresAt, client } = license;
    return {
      id: license._id,
      numActivated,
      isActive: (new Date() > expiresAt) ? false : true,
      client: {
        name: client.name,
        description: client.description,
        getStartedUrl: client.getStartedUrl
      }
    };
}

export default {
  browse,
  browsePublic,
  read,
  add,
  toPublicJSON
}
