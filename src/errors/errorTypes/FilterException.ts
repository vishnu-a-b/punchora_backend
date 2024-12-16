class FilterException extends Error {
  constructor(error: string) {
    super(error);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}
export default FilterException;
