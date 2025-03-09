import { AttendanceStatus } from "../../base/enums/attendanceStatus";
import { Attendance } from "../models/Attendance";

interface AttendanceCheckIn {
  staff: string;
  date: Date;
  checkInTime: Date;
  checkInPhoto: string | undefined;
  checkInLocation?: { latitude: number; longitude: number } | undefined;
  createdBy?: string | undefined;
}

interface AttendanceCheckOut {
  staff: string;
  date: Date;
  checkOutTime: Date;
  checkOutPhoto: string | undefined;
  checkOutLocation?: { latitude: number; longitude: number } | undefined;
}

export default class AttendanceService {
  checkIn = async (data: AttendanceCheckIn) => {
    console.log(data);
    const startOfDay = new Date(data.date);
    const endOfDay = new Date(data.date);
    startOfDay.setDate(startOfDay.getDate() - 1);
    console.log(startOfDay);
    console.log(endOfDay);
    let attendance = await Attendance.findOne({
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      staff: data.staff,
    });
    console.log("available attenfdance");
    console.log(attendance)
    console.log(attendance?.status == AttendanceStatus.checkedIn)
    if (attendance && attendance.status == AttendanceStatus.checkedIn) {
      throw Error("You have to checkout before checking in again!");
    }

    return await Attendance.create(data);
  };

  checkOut = async (data: AttendanceCheckOut) => {
    console.log(data);
    const startOfDay = new Date(data.date);
    const endOfDay = new Date(data.date);
    startOfDay.setDate(startOfDay.getDate() - 1);
    console.log(startOfDay);
    console.log(endOfDay);
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
    if (attendance.status != AttendanceStatus.checkedIn) {
      return attendance;
    }
    attendance = await Attendance.findOneAndUpdate(
      {
        date: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
        staff: data.staff,
      },
      {
        $set: {
          checkOutTime: data.checkOutTime,
          status: AttendanceStatus.present,
          checkOutLocation: data.checkOutLocation,
          checkOutPhoto: data.checkOutPhoto,
        },
      },
      { new: true }
    );
    return attendance;
  };

  filterByDate = async (startDate: Date, endDate: Date, staff: string) => {
    console.log(startDate);
    console.log(endDate);
    const startOfStartDate = new Date(startDate);
    const endOfEndDate = new Date(endDate);
    startOfStartDate.setHours(0, 0, 0, 0);
    endOfEndDate.setHours(23, 59, 59, 999);
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
