/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Permission/Authorization errors (403)
 */
export class PermissionError extends AppError {
  constructor(message: string = 'Permission denied') {
    super(message, 403);
  }
}

/**
 * Resource not found errors (404)
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

/**
 * Validation errors (400)
 */
export class ValidationError extends AppError {
  public readonly field?: string;

  constructor(message: string, field?: string) {
    super(message, 400);
    this.field = field;
  }
}

/**
 * Usage/Quota limit errors (429)
 */
export class UsageLimitError extends AppError {
  public readonly limit: number;
  public readonly current: number;
  public readonly resource: string;

  constructor(message: string, limit: number, current: number, resource: string = 'resource') {
    super(message, 429);
    this.limit = limit;
    this.current = current;
    this.resource = resource;
  }
}

/**
 * Authentication errors (401)
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401);
  }
}

/**
 * Conflict errors (409) - e.g., duplicate resources
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

/**
 * Rate limiting errors (429)
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429);
  }
}

/**
 * External service errors (502)
 */
export class ExternalServiceError extends AppError {
  public readonly service: string;

  constructor(service: string, message: string) {
    super(`External service error: ${message}`, 502);
    this.service = service;
  }
}

/**
 * Maps error to HTTP response object
 */
export interface ErrorResponse {
  error: string;
  statusCode: number;
  details?: any;
}

/**
 * Convert error to API response format
 */
export function toErrorResponse(error: unknown): ErrorResponse {
  // Handle known AppError instances
  if (error instanceof AppError) {
    const response: ErrorResponse = {
      error: error.message,
      statusCode: error.statusCode,
    };

    // Add additional details for specific error types
    if (error instanceof ValidationError && error.field) {
      response.details = { field: error.field };
    }

    if (error instanceof UsageLimitError) {
      response.details = {
        limit: error.limit,
        current: error.current,
        resource: error.resource,
      };
    }

    return response;
  }

  // Handle Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    return handlePrismaError(error as any);
  }

  // Handle unknown errors
  if (error instanceof Error) {
    console.error('Unhandled error:', error);
    return {
      error: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message,
      statusCode: 500,
    };
  }

  // Fallback for non-Error objects
  return {
    error: 'Internal server error',
    statusCode: 500,
  };
}

/**
 * Handle Prisma-specific errors
 */
function handlePrismaError(error: any): ErrorResponse {
  // Unique constraint violation
  if (error.code === 'P2002') {
    const fields = error.meta?.target || [];
    return {
      error: `A record with this ${fields.join(', ')} already exists`,
      statusCode: 409,
      details: { fields },
    };
  }

  // Foreign key constraint violation
  if (error.code === 'P2003') {
    return {
      error: 'Related record not found',
      statusCode: 400,
    };
  }

  // Record not found
  if (error.code === 'P2025') {
    return {
      error: 'Record not found',
      statusCode: 404,
    };
  }

  // Record not found for where condition
  if (error.code === 'P2001') {
    return {
      error: 'Record not found',
      statusCode: 404,
    };
  }

  // Default Prisma error
  return {
    error: 'Database operation failed',
    statusCode: 500,
  };
}

/**
 * Helper to validate required fields
 */
export function validateRequired(data: Record<string, any>, fields: string[]): void {
  for (const field of fields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      throw new ValidationError(`${field} is required`, field);
    }
  }
}

/**
 * Helper to validate string length
 */
export function validateLength(
  value: string, 
  field: string, 
  min?: number, 
  max?: number
): void {
  if (min !== undefined && value.length < min) {
    throw new ValidationError(`${field} must be at least ${min} characters`, field);
  }
  if (max !== undefined && value.length > max) {
    throw new ValidationError(`${field} must be at most ${max} characters`, field);
  }
}

/**
 * Helper to validate number range
 */
export function validateRange(
  value: number,
  field: string,
  min?: number,
  max?: number
): void {
  if (min !== undefined && value < min) {
    throw new ValidationError(`${field} must be at least ${min}`, field);
  }
  if (max !== undefined && value > max) {
    throw new ValidationError(`${field} must be at most ${max}`, field);
  }
}

/**
 * Helper to validate enum values
 */
export function validateEnum<T extends string>(
  value: string,
  field: string,
  enumValues: readonly T[]
): T {
  if (!enumValues.includes(value as T)) {
    throw new ValidationError(
      `${field} must be one of: ${enumValues.join(', ')}`,
      field
    );
  }
  return value as T;
}