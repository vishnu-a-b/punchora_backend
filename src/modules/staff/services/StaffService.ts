import { error } from "console";
import NotFoundError from "../../../errors/errorTypes/NotFoundError";
import ListFilterData from "../../../interfaces/ListFilterData";
import { Staff } from "../models/Staff";

export default class StaffService {
  create = async (staff: any) => {
    return await Staff.create(staff);
  };

  find = async ({ limit, skip, filterQuery, sort }: ListFilterData) => {
    limit = limit ? limit : 10;
    skip = skip ? skip : 0;

    const staffs = await Staff.find(filterQuery)
      .populate(["user", "department"])
      .sort(sort)
      .limit(limit)
      .skip(skip);
    const total = await Staff.countDocuments(filterQuery);
    return {
      total,
      limit,
      skip,
      items: staffs,
    };
  };

  countTotalDocuments = async () => await Staff.countDocuments();

  findOne = async (id: string) => {
    return await Staff.findById(id).populate([
      "user",
      "department",
      "business",
    ]);
  };

  findOneWithUserId = async (id: string) => {
    const staffs = await Staff.find({ user: id })
      .populate(["user", "department"])
      .limit(1);
    if (staffs.length < 1)
      throw new NotFoundError({ error: "Staff not found" });
    return staffs[0];
  };

  update = async ({ id, staff }: any) => {
    return await Staff.findByIdAndUpdate(id, staff);
  };

  delete = async (id: any) => {
    return await Staff.findByIdAndDelete(id);
  };
}
