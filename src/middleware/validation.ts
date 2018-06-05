// # Validation middleware
// sets up the validation middleware and prevents malicious input

// import dependencies
import { Request, Response, NextFunction } from 'express'
import { BadRequestError } from '../errors';
import i18n from '../i18n';

/**
 * id - checks if the requested resource id is valid or not
 *
 * @param {Object} req  the request object
 * @param {Object} res  the response object
 * @param {function} next  the next function
 * @param {ObjectId} id object id of the requested resource
 */
export function id(req: Request, res: Response, next: NextFunction, id: string) {
	// check if the 'id' parameter meets the required format
    if (id.match(/^[0-9a-fA-F]{24}$/) === null) {
		// throw bad request
        throw new BadRequestError({ message: i18n.__('errors.api.common.invalidId', id) });
    }
	// call the next middleware
    next();
}
