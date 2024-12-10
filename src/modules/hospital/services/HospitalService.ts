import ListFilterData from "../../../interfaces/ListFilterData";
import { Hospital } from "../models/Hospital";

export default class HospitalService {
  create = async (hospital: any) => {
    return await Hospital.create(hospital);
  };

  find = async ({ limit, skip, filterQuery, sort }: ListFilterData) => {
    limit = limit ? limit : 10;
    skip = skip ? skip : 0;

    const hospitals = await Hospital.find(filterQuery)
      .sort(sort)
      .limit(limit)
      .skip(skip);
    const total = await Hospital.countDocuments(filterQuery);
    return {
      total,
      limit,
      skip,
      items: hospitals,
    };
  };

  findOne = async (id: string) => {
    return await Hospital.findById(id).populate(["specialities", "address"]);
  };

  countTotalDocuments = async ()=>  await Hospital.countDocuments();


  update = async ({ id, hospital }: any) => {
    return await Hospital.findByIdAndUpdate(id, hospital);
  };

  delete = async (id: any) => {
    return await Hospital.findByIdAndDelete(id);
  };
  filterByAdmin = async (admin: string) => {
    return await Hospital.find({
      admin,
    }).populate(["specialities", "address"]);
  };
}
