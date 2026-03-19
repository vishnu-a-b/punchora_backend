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

    const [staffs, total] = await Promise.all([
      Staff.find(filterQuery)
        .populate(["user", "department", "business"])
        .sort(sort)
        .limit(limit)
        .skip(skip),
      Staff.countDocuments(filterQuery),
    ]);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const staffIds = staffs.map((s: any) => s._id);
    const attendances = await Attendance.find({
      date: { $gte: startOfDay, $lte: endOfDay },
      staff: { $in: staffIds },
    });

    const attendanceMap = new Map(
      attendances.map((a: any) => [a.staff.toString(), a])
    );

    const staffData = staffs.map((staff: any) => {
      const data = staff.toObject ? staff.toObject() : staff;
      data.attendance = attendanceMap.get(staff._id.toString()) || null;
      return data;
    });

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
