import express from 'express';
import Joi from 'joi';
import { AppError } from '../errorhandler/appError.js';

export class ValidationMiddleware {
    static validate(schema: Joi.ObjectSchema) {
        return (req: express.Request, res: express.Response, next: express.NextFunction): void => {
            // stripUnknown: true drops any extra unmapped fields injected by bad actors
            // abortEarly: false collects ALL schema violations instead of stopping at the first one
            const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });

            if (error) {
                // Combine multiple validation errors into a single readable sentence
                const errorMessage = error.details.map(detail => detail.message).join(', ');
                
                // Throw it immediately; Express will safely pass it to your globalErrorHandler
                throw new AppError(`Validation Failed: ${errorMessage}`, 400);
            }

            // Replace req.body with the sanitized and parsed clean payload values
            req.body = value;
            next();
        };
    }
}