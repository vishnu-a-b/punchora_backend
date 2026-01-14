import { Request, Response, NextFunction } from "express";
import CustomError from "./errorTypes/CustomError";
import ServerError from "./errorTypes/ServerError";
import logger from "../utils/logger";

const customErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error details
  const errorContext = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    userId: (req as any).user?._id || 'anonymous',
    body: req.body,
    params: req.params,
    query: req.query,
  };

  if (error instanceof CustomError) {
    // Log custom errors as warnings (these are expected errors)
    logger.warn('Custom Error', {
      ...errorContext,
      statusCode: error.statusCode,
      message: error.message,
      error: error.error,
      errorsList: error.errorsList,
      stack: error.stack,
    });

    let errorResponse: {
      success: false;
      message: string;
      error?: string;
      errorsList?: any[];
    } = {
      success: false,
      message: error.message,
    };
    if (error.error) {
      errorResponse.error = error.error;
    }
    if (error.errorsList) {
      errorResponse.errorsList = error.errorsList;
    }
    res.status(error.statusCode).json(errorResponse);
    return;
  }

  // Log unexpected errors as errors
  logger.error('Unhandled Error', {
    ...errorContext,
    message: error.message,
    stack: error.stack,
    name: error.name,
  });

  res.status(500).json({
    success: false,
    message: "INTERNAL_SERVER_ERROR",
    error: "Something went wrong",
  });
  return;
};

export default customErrorHandler;
