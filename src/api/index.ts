// # Application API
// sets up the application API

// import dependencies
import * as _ from 'lodash';
import { Request, Response, NextFunction, RequestHandler } from 'express';
export { default as users } from './users';
export { default as verify } from './verify';

export interface IRequest extends Request {
  isAdmin?: boolean;
  file?: any;
}

function getLocationHeader(apiMethod: Function, req: Request, response: Response) {
	let location;

	// make sure that the location header is only added to 'POST requests'
	if(req.method === 'POST') {
		// check which API method has been called in order to determine result
	}

	return location;
}

function addHeaders(apiMethod: Function, req: Request, res: Response, response: any) {
	let location;
	// check if a new object was created
	if(req.method === 'POST') {
		location = getLocationHeader(apiMethod, req, response);
		if(location) {
			// # a new object was created
			// set location header to indicate where the object was created
			// the status code should be set to 201 Created
			res.set({ Location: location });
			res.status(201);
		}
	}
}

/**
 * http - HTTP wrapper function
 *
 * HTTP wrapper function that takes the API method and wraps it in order to make express able to handle it
 *
 * @param  {Function} apiMethod API method to call
 * @return {Function} middleware format function to be called by express
 */
export function http(apiMethod: Function) : RequestHandler {
	return async function apiHandler(req: IRequest, res: Response, next: NextFunction) {
		// define two base properties which will be used in every API method call
		let object = req.body;
		let options = _.extend({}, req.file, { ip: req.ip }, req.query, req.params, {
			context: {
				// add admin payload if he is authenticated
				isAdmin: req.isAdmin
			}
		});

		// call API method with the prepared properties
		try {
			let response = await apiMethod(options, object);
			// add headers to API response
			await addHeaders(apiMethod, req, res, response);

			// check if the request method is DELETE
			if(req.method === 'DELETE') {
				// set status code to No Content (204)
				return res.status(204).end();
			}

			// send a properly formatted HTTP response containing the json data
			res.status(200).json(response || {});
		} catch (err) {
			// # error should be handled by the error middleware
			// call next in order to continue middleware chain
			return next(err);
		}
	}
}