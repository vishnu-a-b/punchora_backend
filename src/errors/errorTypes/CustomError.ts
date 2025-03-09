export default abstract class CustomError extends Error {
  abstract statusCode: number;
  abstract error?: string;
  abstract errorsList?: any[];

  constructor(
    message:
      | "INTERNAL_SERVER_ERROR"
      | "DUPLICATE_VALUE"
      | "VALIDATION_FAILED"
      | "AUTHENTICATION_FAILED"
      | "NOT_FOUND"
      | "BAD_REQUEST"
      | "PERMISSION_DENIED"
      | "OBJECT_RELATION_EXIST"
      | "ATTENDANCE_ERROR"
  ) {
    super(message);
    Object.setPrototypeOf(this, Error.prototype);
  }
}
