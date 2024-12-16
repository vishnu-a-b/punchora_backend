import ListFilterData from "../../../interfaces/ListFilterData";
import { Address } from "../models/Address";

export default class AddressService {
  list = async ({ limit, skip, filterQuery, sort }: ListFilterData) => {
    limit = limit ? limit : 10;
    skip = skip ? skip : 0;

    const addresses = await Address.find(filterQuery)
      .sort(sort)
      .limit(limit)
      .skip(skip);
    const total = await Address.countDocuments(filterQuery);
    return {
      total,
      limit,
      skip,
      items: addresses,
    };
  };
  create = async (body: any) => {
    return await Address.create(body);
  };

  findOne = async (id: string) => {
    return await Address.findById(id);
  };

  update = async ({ id, body }: any) => {
    return await Address.findByIdAndUpdate(id, body);
  };

  delete = async (id: any) => {
    return await Address.findByIdAndDelete(id);
  };
}
