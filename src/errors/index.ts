// # Errors Generator
// helper functions in order to make error generation easier
'use strict';

// import dependencies
import * as _ from 'lodash';
import i18n from '../i18n';

/**
 * GeneralError - custom base error class for easier error handling
 * @extends Error
 */
export class GeneralError extends Error {
    public statusCode: number;
    public errorType: string;

    /**
     * constructor - creates a new custom error
     *
     * @param {Object} options the error options (message, statusCode, errorType) 
     */
    public constructor(options?: any) {
        // check if options has been provided
        if(!options) options = {};
        // call super with the error message
        super( options.message || 'The server has encountered an error.');

        // set up error defaults
        this.statusCode = options.statusCode || 500;
        this.errorType = options.errorType || 'InternalServerError';
        this.name = this.constructor.name;

        // configure proper stack tracing
        if (typeof Error.captureStackTrace === 'function') {
            Error.captureStackTrace(this, this.constructor);
        } else {
            this.stack = (new Error(this.message)).stack;
        }
    }
}

/**
 * InternalServerError - error used for handling internal server error (500)
 * @extends GeneralError
 */
export class InternalServerError extends GeneralError {
    /**
     * constructor - creates a new internal server error
     *
     * @param {Object} options the error options (message, statusCode, errorType) 
     */
    public constructor(options?: any) {
        super(_.merge({
            statusCode: 500,
            errorType: 'InternalServerError',
            message: i18n.__('errors.types.internalServerError')
        }, options));
    }
}

/**
 * IncorrectUsageError - error used for handling incorrect usage (400)
 * @extends GeneralError
 */
export class IncorrectUsageError extends GeneralError {
    /**
     * constructor - creates a new incorrect usage error
     *
     * @param {Object} options the error options (message, statusCode, errorType) 
     */
    constructor(options?: any) {
        super(_.merge({
            statusCode: 400,
            errorType: 'IncorrectUsageError',
            message: i18n.__('errors.types.incorrectUsageError')
        }, options));
    }
}

/**
 * NotFoundError - error used for handling not found errors (404)
 * @extends GeneralError
 */
export class NotFoundError extends GeneralError {
    /**
     * constructor - creates a new not found error
     *
     * @param {Object} options the error options (message, statusCode, errorType) 
     */
    constructor(options?: any) {
        super(_.merge({
            statusCode: 404,
            errorType: 'NotFoundError',
            message: i18n.__('errors.types.notFoundError')
        }, options));
    }
}

/**
 * BadRequestError - error used for handling bad requests (400)
 * @extends GeneralError
 */
export class BadRequestError extends GeneralError {
    /**
     * constructor - creates a new bad request error
     *
     * @param {Object} options the error options (message, statusCode, errorType) 
     */
    constructor(options?: any) {
        super(_.merge({
            statusCode: 400,
            errorType: 'BadRequestError',
            message: i18n.__('errors.types.badRequestError')
        }, options));
    }
}

/**
 * UnauthorizedError - error used for indicating an authentication error (401)
 * @extends GeneralError
 */
export class UnauthorizedError extends GeneralError {
    /**
     * constructor - creates a new unauthorized error
     *
     * @param {Object} options the error options (message, statusCode, errorType) 
     */
    constructor(options?: any) {
        super(_.merge({
            statusCode: 401,
            errorType: 'UnauthorizedError',
            message: i18n.__('errors.types.unauthorizedError')
        }, options));
    }
}

/**
 * NoPermissionError - error used for indicating the user doesn't have the required permissions (403)
 * @extends GeneralError
 */
export class NoPermissionError extends GeneralError {
    /**
     * constructor - creates a new no permission error
     *
     * @param {Object} options the error options (message, statusCode, errorType) 
     */
    constructor(options?: any) {
        super(_.merge({
            statusCode: 403,
            errorType: 'NoPermissionError',
            message: i18n.__('errors.types.noPermissionError')
        }, options));
    }
}

/**
 * NotVerifiedError - error used for indicating that the user has not been verified yet (404)
 * @extends GeneralError
 */
export class NotVerifiedError extends GeneralError {
    /**
     * constructor - creates a not verified error
     *
     * @param {Object} options the error options (message, statusCode, errorType) 
     */
    constructor(options?: any) {
        super(_.merge({
            statusCode: 404,
            errorCode: 4001,
            errorType: 'NotVerifiedError',
            message: i18n.__('errors.types.notVerifiedError')
        }, options));
    }
}

/**
 * TokenExpiredError - error used for indicating that the user has not been verified yet (404)
 * @extends GeneralError
 */
export class TokenExpiredError extends GeneralError {
    /**
     * constructor - creates a not verified error
     *
     * @param {Object} options the error options (message, statusCode, errorType) 
     */
    constructor(options?: any) {
        super(_.merge({
            statusCode: 401,
            errorCode: 4002,
            errorType: 'TokenExpiredError',
            message: i18n.__('errors.types.tokenExpiredError')
        }, options));
    }
}


/**
 * ValidationError - error used for indicating that validation has failed (422)
 * @extends GeneralError
 */
export class ValidationError extends GeneralError {
    /**
     * constructor - creates a new validation error
     *
     * @param {Object} options the error options (message, statusCode, errorType) 
     */
    constructor(options?: any) {
        super(_.merge({
            statusCode: 422,
            errorType: 'ValidationError',
            message: i18n.__('errors.types.validationError')
        }, options));
    }
}

/**
 * MongooseValidationError - generates custom validation errors based on mongoose errors (middleware)
 *
 * @param {Object} mongooseError the error objects being passed in by mongoose
 */
export function MongooseValidationError(mongooseError: any) {
    // iterate through all mongoose error objects
    let errors = [];
    for (const key of Object.keys(mongooseError.errors)) {
        // extract error object
        let errorObject = mongooseError.errors[key];
        // create new validation error
        errors.push(new ValidationError({
            message: errorObject.message
        }));
    }
    // return errors
    return errors;
}
