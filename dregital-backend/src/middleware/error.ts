import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { ZodError } from 'zod';

/** Error with an explicit HTTP status code. */
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/** Wrap async route handlers so rejected promises reach the error middleware. */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: 'Not found' });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Invalid input',
      details: err.flatten().fieldErrors,
    });
  }
  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE' ? 'File is too large (max 5MB)' : `Upload error: ${err.message}`;
    return res.status(400).json({ error: message });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  console.error('Unhandled error:', err);
  return res.status(500).json({ error: 'Internal server error' });
}
