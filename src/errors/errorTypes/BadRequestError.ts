import CustomError from "./CustomError";

export default class BadRequestError extends CustomError {
  statusCode = 400;
  error?: string | undefined;
  errorsList?: any[] | undefined;
  constructor({ error, errors }: { error?: string; errors?: any[] }) {
    super("BAD_REQUEST");
    this.error = error;
    this.errorsList = errors;
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}
