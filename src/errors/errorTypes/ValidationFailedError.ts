import CustomError from "./CustomError";

export default class ValidationFailedError extends CustomError {
  statusCode = 422;
  error?: string | undefined;
  errorsList?: any[] | undefined;
  constructor({ error, errors }: { error?: string; errors?: any[] }) {
    super("VALIDATION_FAILED");
    this.error = error;
    this.errorsList = errors;
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}
