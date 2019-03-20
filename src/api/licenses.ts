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

const read = async function read(options: any, object: any) : Promise<ILicense> {
  // fetch a license based on the id
  let license: ILicense = await License.findById(options.id);
  // check if a response has been returned
  if (license == null) throw new BadRequestError({ message: i18n.__('errors.api.licenses.notFound') });
  return license;
}

const add = async function add(options: any, object: any) : Promise<any> {
  if (!options.id || !object.client || !object.expiresAt) {
    throw new BadRequestError({ message: i18n.__('errors.api.arguments.missing') });
  }

  // fetch assigned user
  let user: IUser = await User.findById(options.id);
  if (user == null) throw new BadRequestError({ message: i18n.__('errors.api.users.notFound') });

  // get matching client
  let client: IClient = await Client.getClient(object.client);
  if (client == null) throw new BadRequestError({ message: i18n.__('errors.api.client.notFound') });

  // add new license to user
  let license = await License.addNewLicense(client, user, new Date(object.expiresAt));
  return toPublicLicenseJSON(license);
}

const toPublicLicenseJSON = function toPublicLicenseJSON(license: ILicense) : any {
  let { numActivated, expiresAt } = license;
    return {
      numActivated,
      expiresAt,
      id: license._id
    };
}

export default {
  read,
  add
}
