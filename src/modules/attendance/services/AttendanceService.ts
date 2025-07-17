import AttendanceError from "../../../errors/errorTypes/AttendanceError";
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

interface AttendanceData {
  staff: string;
  photo: string | undefined;
  location?: { latitude: number; longitude: number } | undefined;
}

export default class AttendanceService {
  create = async (data: any) => {
    return await Attendance.create(data);
  };

  mark = async (data: AttendanceData) => {
    //checking for 2 minutes gap within recent markings
    const time = new Date();

    let startTime = new Date();
    const endTime = new Date();
    startTime.setMinutes(startTime.getMinutes() - 2);

    let attendance = await Attendance.findOne({
      date: {
        $gte: startTime,
        $lte: endTime,
      },
      staff: data.staff,
    }).sort({ createdAt: -1 });

    if (attendance) {
      throw new AttendanceError({
        error: "You have a recent marking. Wait for some time and try again!",
      });
    }

    //checking for marking withing 18 hrs
    startTime = new Date();
    startTime.setHours(startTime.getHours() - 18);

    attendance = await Attendance.findOne({
      date: {
        $gte: startTime,
        $lte: endTime,
      },
      staff: data.staff,
    }).sort({ createdAt: -1 });

    if (attendance && attendance.status == AttendanceStatus.checkedIn) {
      return await Attendance.findByIdAndUpdate(
        attendance.id,
        {
          $set: {
            checkOutTime: time,
            status: AttendanceStatus.present,
            checkOutLocation: data.location,
            checkOutPhoto: data.photo,
          },
        },
        { new: true }
      );
    }

    return await Attendance.create({
      staff: data.staff,
      date: time,
      checkInTime: time,
      checkInPhoto: data.photo,
      checkInLocation: data.location,
    });
  };
  checkIn = async (data: AttendanceCheckIn) => {
    const startOfDay = new Date(data.date);
    const endOfDay = new Date(data.date);
    startOfDay.setHours(startOfDay.getHours() - 18);

    console.log("startOfDay", startOfDay);
    console.log("endOfDay", endOfDay);
    let attendance = await Attendance.findOne({
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      staff: data.staff,
    }).sort({ createdAt: -1 });
    if (attendance && attendance.status == AttendanceStatus.checkedIn) {
      throw new AttendanceError({
        error: "You have to check-out before check-in again!",
      });
    }
    return await Attendance.create(data);
  };

  checkOut = async (data: AttendanceCheckOut) => {
    const startOfDay = new Date(data.date);
    const endOfDay = new Date(data.date);
    startOfDay.setHours(startOfDay.getHours() - 18);
    console.log("startOfDay", startOfDay);
    console.log("endOfDay", endOfDay);
    let attendance = await Attendance.findOne({
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      staff: data.staff,
      status: AttendanceStatus.checkedIn,
    }).sort({ createdAt: -1 });
    if (!attendance) {
      throw new AttendanceError({
        error: "You have to check-in before check-out!",
      });
    }

    attendance = await Attendance.findByIdAndUpdate(
      attendance.id,
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
    }).sort({ checkInTime: 'asc' });
    return attendances;
  };

  filterAllStaffsByDate = async (
    startDate: Date,
    endDate: Date,
    status: string
  ) => {
    const startOfStartDate = new Date(startDate);
    const endOfEndDate = new Date(endDate);
    startOfStartDate.setHours(0, 0, 0, 0);
    endOfEndDate.setHours(23, 59, 59, 999);
    const attendances = await Attendance.find({
      date: {
        $gte: startOfStartDate,
        $lte: endOfEndDate,
      },
      status: status,
    }).populate("staff");
    return attendances;
  };

  update = async (id: string, attendance: any) => {
    return await Attendance.findByIdAndUpdate(id, attendance);
  };

  delete = async (id: any) => {
    return await Attendance.findByIdAndDelete(id);
  };
}
