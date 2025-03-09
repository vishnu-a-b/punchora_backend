import CustomError from "./CustomError";

export default class AttendanceError extends CustomError {
  statusCode = 422;
  error?: string | undefined;
  errorsList?: any[] | undefined;
  constructor({ error, errors }: { error?: string; errors?: any[] }) {
    super("ATTENDANCE_ERROR");
    this.error = error;
    this.errorsList = errors;
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}
