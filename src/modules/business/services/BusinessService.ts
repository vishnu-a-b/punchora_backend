import ListFilterData from "../../../interfaces/ListFilterData";
import { Business } from "../models/Business";

export default class BusinessService {
  create = async (business: any) => {
    return await Business.create(business);
  };

  find = async ({ limit, skip, filterQuery, sort }: ListFilterData) => {
    limit = limit ? limit : 10;
    skip = skip ? skip : 0;

    const businesses = await Business.find(filterQuery)
      .sort(sort)
      .limit(limit)
      .skip(skip);
    const total = await Business.countDocuments(filterQuery);
    return {
      total,
      limit,
      skip,
      items: businesses,
    };
  };

  findOne = async (id: string) => {
    return await Business.findById(id).populate(["address"]);
  };

  countTotalDocuments = async () => await Business.countDocuments();

  update = async ({ id, business }: any) => {
    return await Business.findByIdAndUpdate(id, business);
  };

  delete = async (id: any) => {
    return await Business.findByIdAndDelete(id);
  };
  filterByAdmin = async (admin: string) => {
    return await Business.find({
      admin,
    }).populate(["address"]);
  };
}
