// # Erorr middleware
// sets up the error middleware
'use strict';

/* eslint-disable no-console */

// import dependencies
import * as _ from 'lodash';
import { Request, Response, NextFunction, Errback } from 'express'
import i18n from '../i18n';
import { NotFoundError, GeneralError, BadRequestError } from '../errors';

export interface IRequest extends Request {
  err?: GeneralError;
}

/**
 * resourceNotFound - throws a NotFoundError if the resource could not be found
 *
 * @param {Object} req  the request object
 * @param {Object} res  the response object
 * @param {function} next  the next function
 */
export function resourceNotFound(req: Request, res: Response, next: NextFunction) {
	// # endpoint could not be found
	next(new NotFoundError({ message: i18n.__('errors.api.common.resourceNotFound', req.path) }));
}

/**
 * prepareError - prepares proper error handling (called at the very last of express middleware chain)
 *
 * @param {Error} err  	the error object
 * @param {Object} req  the request object
 * @param {Object} res  the response object
 * @param {function} next  the next function
 */
function prepareError(err: GeneralError, req: IRequest, res: Response, next: NextFunction) {
	// # check if there are multiple errors
	// we are currently only able to handle the first error
	if(_.isArray(err)) {
		err = err[0];
	}
	// set request error (used for express logging middleware)
	req.err = err;

	if (!err.statusCode) {
		// an intenal server error occured; log error and set internal server error
		console.log('printing out stack trace of error:');
		console.log(err);
		err = new BadRequestError();
	} 
	res.status(err.statusCode);
	// never cache errors
	res.set({
		'Cache-Control': 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0'
	});

	// call next error handler
	next(err);
}

/**
 * ErrorJSONRenderer - renders the error that will be sent back to the client
 *
 * @param {Error} err  	the error object
 * @param {Object} req  the request object
 * @param {Object} res  the response object
 * @param {function} next  the next function
 */
function ErrorJSONRenderer(err: GeneralError, req: Request, res: Response, next: NextFunction) {
	// prepare JSON response that will be sent back to the client
	res.json({
		error: {
			message: err.message,
			errorType: err.errorType,
			code: err.statusCode
		}
	});
}

// combines both middlewares into one middleware, making sure preparation is called beforehand
export const handleError = [
	// prepare the error for proper rendering
	prepareError,
	// render the error to json for proper formatting
	ErrorJSONRenderer
];