import ListFilterData from "../../../../interfaces/ListFilterData";
import { District } from "../models/District";

export default class DistrictService {
  list = async ({ limit, skip, filterQuery, sort }: ListFilterData) => {
    limit = limit ? limit : 10;
    skip = skip ? skip : 0;
    const districts = await District.find(filterQuery)
      .sort(sort)
      .limit(limit)
      .skip(skip);
    const total = await District.countDocuments(filterQuery);
    return {
      total,
      limit,
      skip,
      items: districts,
    };
  };

  create = async (data: any) => {
    return await District.create(data);
  };

  delete = async (id: string) => {
    return await District.findByIdAndDelete(id);
  };
}
