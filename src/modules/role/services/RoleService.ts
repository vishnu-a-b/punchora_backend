import ListFilterData from "../../../interfaces/ListFilterData";
import { Role } from "../models/Role";

export default class RoleService {

  create = async ({ title, slug }: any) => {
    return await Role.create({ title, slug });
  };


  find = async ({ limit, skip, filterQuery, sort }: ListFilterData) => {
    limit = limit ? limit : 10;
    skip = skip ? skip : 0;

    const roles = await Role.find(filterQuery)
      .sort(sort)
      .limit(limit)
      .skip(skip);
    const total = await Role.countDocuments(filterQuery);
    return {
      total,
      limit,
      skip,
      items: roles,
    };
  };



  findOneBySlug = async (slug: string) => {
    return await Role.findOne({slug})
  };
}
