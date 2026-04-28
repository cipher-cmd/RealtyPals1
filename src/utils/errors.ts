/**
 * Centralized Error Taxonomy
 * Provides structured error types for better API clarity
 */

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class EstimationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EstimationError';
  }
}

/**
 * Helper to convert error to HTTP status code
 */
export function getErrorStatusCode(error: Error): number {
  if (error instanceof ValidationError) {
    return 400;
  }
  if (error instanceof NotFoundError) {
    return 404;
  }
  if (error instanceof EstimationError) {
    return 400; // Estimation errors are client input issues
  }
  return 500; // Default to internal server error
}
