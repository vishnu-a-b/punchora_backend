import CustomError from "./CustomError";

export default class DuplicateError extends CustomError {
  statusCode = 409;
  error?: string | undefined;
  errorsList?: any[] | undefined;
  constructor({ error, errors }: { error?: string; errors?: any[] }) {
    super("DUPLICATE_VALUE");
    this.error = error;
    this.errorsList = errors;
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}
