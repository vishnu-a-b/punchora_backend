import ListFilterData from "../../../interfaces/ListFilterData";
import { Department } from "../models/Department";

export default class DepartmentService {
  create = async (data: any) => {
    return await Department.create(data);
  };

  find = async ({ limit, skip, filterQuery, sort }: ListFilterData) => {
    limit = limit ? limit : 10;
    skip = skip ? skip : 0;

    const hospitals = await Department.find(filterQuery)
      .sort(sort)
      .limit(limit)
      .skip(skip);
    const total = await Department.countDocuments(filterQuery);
    return {
      total,
      limit,
      skip,
      items: hospitals,
    };
  };

  findOne = async (id: string) => {
    return await Department.findById(id);
  };

  countTotalDocuments = async () => await Department.countDocuments();

  update = async ({ id, data }: any) => {
    return await Department.findByIdAndUpdate(id, data);
  };

  delete = async (id: any) => {
    return await Department.findByIdAndDelete(id);
  };
  filterByHead = async (head: string) => {
    return await Department.find({
      head,
    });
  };
}
