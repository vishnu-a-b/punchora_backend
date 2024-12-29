import { Attendance } from "../models/Attendance";

interface AttendanceCheckIn {
  staff: string;
  date: Date;
  checkInTime: Date;
  createdBy?: string | undefined;
}

interface AttendanceCheckOut {
  staff: string;
  date: Date;
  checkOutTime: Date;
}

export default class AttendanceService {
  checkIn = async (data: AttendanceCheckIn) => {
    const startOfDay = new Date(data.date);
    const endOfDay = new Date(data.date);
    endOfDay.setHours(23, 59, 59, 999);
    let attendance = await Attendance.findOne({
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      staff: data.staff,
    });
    if (!attendance) {
      attendance = await Attendance.create(data);
    }
    return attendance;
  };

  checkOut = async (data: AttendanceCheckOut) => {
    const startOfDay = new Date(data.date);
    const endOfDay = new Date(data.date);
    endOfDay.setHours(23, 59, 59, 999);
    let attendance = await Attendance.findOne({
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      staff: data.staff,
    });
    if (!attendance) {
      throw Error("Unable to check out");
    }
    attendance = await Attendance.findOneAndUpdate(
      {
        date: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
        staff: data.staff,
      },
      { $set: { checkOutTime: data.checkOutTime } },
      { new: true }
    );
  };

  filterByDate = async (startDate: Date, endDate: Date, staff: string) => {
    const startOfStartDate = new Date(startDate);
    const endOfEndDate = new Date(endDate);
    const attendances = await Attendance.find({
      date: {
        $gte: startOfStartDate,
        $lte: endOfEndDate,
      },
      staff: staff,
    });
    return attendances;
  };

  delete = async (id: any) => {
    return await Attendance.findByIdAndDelete(id);
  };
}
