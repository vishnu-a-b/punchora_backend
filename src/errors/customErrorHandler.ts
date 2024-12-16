import { Request, Response, NextFunction } from "express";
import CustomError from "./errorTypes/CustomError";
import ServerError from "./errorTypes/ServerError";

const customErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error instanceof CustomError) {
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

  res.status(500).json({
    success: false,
    message: "INTERNAL_SERVER_ERROR",
    error: "Something went wrong",
  });
  return;
};

export default customErrorHandler;
