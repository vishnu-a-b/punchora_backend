import CustomError from "./CustomError";

export default class AuthenticationFailedError extends CustomError {
  statusCode = 401;
  error?: string | undefined;
  errorsList?: any[] | undefined;
  constructor({ error, errors }: { error?: string; errors?: any[] }) {
    super("AUTHENTICATION_FAILED");
    this.error = error;
    this.errorsList = errors;
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}
