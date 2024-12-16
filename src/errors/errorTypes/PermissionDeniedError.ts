import CustomError from "./CustomError";

export default class PermissionDeniedError extends CustomError {
  statusCode = 403;
  error?: string | undefined;
  errorsList?: any[] | undefined;
  constructor({ error, errors }: { error?: string; errors?: any[] }) {
    super("PERMISSION_DENIED");
    this.error = error;
    this.errorsList = errors;
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}
