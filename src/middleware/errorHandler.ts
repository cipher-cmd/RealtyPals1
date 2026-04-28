import { Request, Response, NextFunction } from 'express';

/**
 * Centralized error handling middleware.
 * Catches all errors thrown from controllers and returns clean, safe responses.
 * NEVER exposes stack traces or internal error messages in production.
 */

export class AppError extends Error {
    public statusCode: number;
    public isOperational: boolean;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends AppError {
    constructor(message: string) {
        super(message, 400);
    }
}

export class NotFoundError extends AppError {
    constructor(message: string) {
        super(message, 404);
    }
}

export function errorHandler(
    err: Error,
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next: NextFunction
): void {
    // Always log the full error server-side
    console.error('[ERROR]', {
        message: err.message,
        stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
        url: req.url,
        method: req.method,
    });

    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            error: true,
            message: err.message,
        });
        return;
    }

    // Unknown/unexpected errors — never reveal details in production
    res.status(500).json({
        error: true,
        message: 'Something went wrong. Please try again.',
    });
}
