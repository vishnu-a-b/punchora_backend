import NotFoundError from "../../../errors/errorTypes/NotFoundError";
import ValidationFailedError from "../../../errors/errorTypes/ValidationFailedError";
import ListFilterData from "../../../interfaces/ListFilterData";
import { createPasswordHash } from "../../authentication/utils/createPasswordHash";
import { Role } from "../../role/models/Role";
import { User } from "../models/User";

export default class UserService {
  list = async ({ limit, skip, filterQuery, sort }: ListFilterData) => {
    limit = limit ? limit : 10;
    skip = skip ? skip : 0;
    const users = await User.find(filterQuery)
      .sort(sort)
      .limit(limit)
      .skip(skip);
    const total = await User.countDocuments(filterQuery);
    return {
      total,
      limit,
      skip,
      items: users,
    };
  };

  filterByRole = async (
    roleSlug: string,
    { limit, skip, filterQuery, sort }: ListFilterData
  ) => {
    limit = limit ? limit : 10;
    skip = skip ? skip : 0;
    const role = await Role.findOne({ slug: roleSlug });
    if (!role) {
      return {
        total: 0,
        limit,
        skip,
        items: [],
      };
    }
    let query: any = filterQuery;
    query.roles = { $in: role.id };
    const users = await User.find(query).sort(sort).limit(limit).skip(skip);
    const total = await User.countDocuments(filterQuery);
    return {
      total,
      limit,
      skip,
      items: users,
    };
  };

  create = async (data: any) => {
    const password = await createPasswordHash(data.password);
    delete data.password;
    return await User.create({ ...data, ...{ password } });
  };

  findOne = async (id: string) => {
    return await User.findOne({ _id: id }).populate("roles");
  };

  update = async (id: string, user: any) => {
    return await User.findByIdAndUpdate(id, user);
  };

  updatePassword = async (
    id: string,
    oldPassword: string,
    newPassword: string
  ) => {
    const oldPasswordHash = await createPasswordHash(oldPassword);
    const user = await User.findById(id);
    if (!user) {
      throw new NotFoundError({ error: "user not found" });
    }
    if (user.password !== oldPasswordHash) {
      throw new ValidationFailedError({ error: "incorrect passowrd" });
    }
    const newPasswordHash = await createPasswordHash(newPassword);
    return await User.findByIdAndUpdate(id, { password: newPasswordHash });
  };
  delete = async (id: any) => {
    return await User.findByIdAndDelete(id);
  };
}
