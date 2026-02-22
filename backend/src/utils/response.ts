import { Response } from 'express';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export function success(res: Response, data: unknown, statusCode = 200, message?: string) {
  return res.status(statusCode).json({
    success: true,
    ...(message && { message }),
    data,
  });
}

export function error(res: Response, statusCode: number, message: string, code?: string) {
  return res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(code && { code }),
      statusCode,
    },
  });
}

export function paginated(
  res: Response,
  data: unknown[],
  pagination: PaginationMeta,
  message?: string,
) {
  return res.status(200).json({
    success: true,
    ...(message && { message }),
    data,
    pagination,
  });
}
