import CustomError from "./CustomError";

export default class ObjectRelationExistError extends CustomError {
  statusCode = 422;
  error?: string | undefined;
  errorsList?: any[] | undefined;
  constructor({ error, errors }: { error?: string; errors?: any[] }) {
    super("OBJECT_RELATION_EXIST");
    this.error = error;
    this.errorsList = errors;
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}
