import User from "../../modules/user/models/User";

export {};

declare global {
  namespace Express {
    export interface Request {
      user?: User;
      file: any;
      files: any;
      sort: any;
      filterQuery: any;
    }
  }
}
