// # Activations API
// sets up all the activations API methods

// import dependencies
import { InternalServerError, BadRequestError } from '../errors';
import i18n from '../i18n';
import { Activation, IActivation } from '../db/schemas/activation';
import { Client } from '../db/schemas/client';
import { License, ILicense } from '../db/schemas/license';
import { Token } from '../db/schemas/token';

/** Activations API Routes
* implements the activations API Routes
*/

const deactivate = async function read(options: any, object: any) : Promise<IActivation> {
  // fetch activation string and client and license
  let jwt = options.context.jwt;
  let client = await Client.getClient(jwt.aud);
  let license = await License.findById(jwt.license.id);
  let sensor = await Activation.getSensorData(jwt.activation, client);
  if(sensor == null || license == null || sensor == null) throw new BadRequestError({ message: i18n.__('errors.api.activation.notFound') });

  // get activation based on hwid and acccess token
  let bearer = options.context.bearer;
  let activation = await Activation.getActivationByHWID(sensor.hwid, license);
  let token = await Token.getAccessToken(bearer);
  if(token == null || activation == null) throw new BadRequestError({ message: i18n.__('errors.api.activation.notFound') });

  // revoke the tokens
  await token.revoke();
  
  // revoke the activation
  await activation.revoke();

  // return public license
  license.numActivated--;
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
  deactivate
}
