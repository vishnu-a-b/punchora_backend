import { error } from "console";
import NotFoundError from "../../../errors/errorTypes/NotFoundError";
import ListFilterData from "../../../interfaces/ListFilterData";
import { Staff } from "../models/Staff";
import { Attendance } from "../../attendance/models/Attendance";

export default class StaffService {
  create = async (staff: any) => {
    return await Staff.create(staff);
  };

  find = async ({ limit, skip, filterQuery, sort }: ListFilterData) => {
    limit = limit ? limit : 10;
    skip = skip ? skip : 0;
    console.log("hai",sort)
    const staffs = await Staff.find(filterQuery)
      .populate(["user", "department", "business"])
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

  findAndGetAttendance = async ({
    limit,
    skip,
    filterQuery,
    sort,
  }: ListFilterData) => {
    limit = limit ? limit : 10;
    skip = skip ? skip : 0;
    let staffData = [];

    const staffs: any[] = await Staff.find(filterQuery)
      .populate(["user", "department", "business"])
      .sort(sort)
      .limit(limit)
      .skip(skip);
    const today = new Date();
    const startOfDay = today;
    const endOfDay = today;
    startOfDay.setHours(0, 0, 0, 0);
    endOfDay.setHours(23, 59, 59, 999);

    for (const staff of staffs) {
      const attendance = await Attendance.findOne({
        date: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
        staff: staff,
      });
      let data = staff;
      data.attendance = attendance;
      staffData.push(data);
    }
    const total = await Staff.countDocuments(filterQuery);
    return {
      total,
      limit,
      skip,
      items: staffData,
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
