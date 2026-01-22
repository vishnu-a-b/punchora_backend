import AttendanceError from "../../../errors/errorTypes/AttendanceError";
import { AttendanceStatus } from "../../base/enums/attendanceStatus";
import { Attendance } from "../models/Attendance";

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp?: number;
  mocked?: boolean;
}

interface AttendanceCheckIn {
  staff: string;
  date: Date;
  checkInTime: Date;
  checkInPhoto: string | undefined;
  checkInLocation?: LocationData | undefined;
  createdBy?: string | undefined;
  idempotencyKey?: string;
}

interface AttendanceCheckOut {
  staff: string;
  date: Date;
  checkOutTime: Date;
  checkOutPhoto: string | undefined;
  checkOutLocation?: LocationData | undefined;
  idempotencyKey?: string;
}

interface AttendanceData {
  staff: string;
  photo: string | undefined;
  location?: LocationData | undefined;
  idempotencyKey?: string;
}

export default class AttendanceService {
  create = async (data: any) => {
    return await Attendance.create(data);
  };

  mark = async (data: AttendanceData) => {
    const time = new Date();

    // ===== NEW: Check idempotency key first =====
    if (data.idempotencyKey) {
      const existingPunch = await Attendance.findOne({
        idempotencyKey: data.idempotencyKey,
      });

      if (existingPunch) {
        // Request already processed - return existing record (idempotent)
        console.log(`Duplicate request detected: ${data.idempotencyKey}`);
        return existingPunch;
      }
    }

    // ===== UPDATED: Changed from 2 minutes to 1 minute =====
    let startTime = new Date();
    const endTime = new Date();
    startTime.setMinutes(startTime.getMinutes() - 1);  // CHANGED FROM 2 to 1

    let attendance = await Attendance.findOne({
      date: {
        $gte: startTime,
        $lte: endTime,
      },
      staff: data.staff,
    }).sort({ createdAt: -1 });

    if (attendance) {
      throw new AttendanceError({
        error: "You have a recent marking. Wait for 1 minute and try again!",
      });
    }

    // ===== NEW: Flag suspicious locations =====
    let flagged = false;
    let flagReason = "";

    if (data.location?.mocked === true) {
      flagged = true;
      flagReason = "Mocked GPS detected - possible location spoofing";
    }

    if (data.location?.accuracy && data.location.accuracy > 100) {
      flagged = true;
      flagReason = flagReason
        ? `${flagReason}; Low GPS accuracy (${data.location.accuracy}m)`
        : `Low GPS accuracy (${data.location.accuracy}m)`;
    }

    if (data.location?.speed && data.location.speed > 5) {
      flagged = true;
      flagReason = flagReason
        ? `${flagReason}; User in motion (${data.location.speed.toFixed(1)} m/s)`
        : `User in motion (${data.location.speed.toFixed(1)} m/s)`;
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
      // Check-out
      return await Attendance.findByIdAndUpdate(
        attendance.id,
        {
          $set: {
            checkOutTime: time,
            status: AttendanceStatus.present,
            checkOutLocation: data.location,
            checkOutPhoto: data.photo,
            idempotencyKey: data.idempotencyKey,  // NEW
            flagged: flagged,                      // NEW
            flagReason: flagReason || undefined,   // NEW
          },
        },
        { new: true }
      );
    }

    // Check-in
    return await Attendance.create({
      staff: data.staff,
      date: time,
      checkInTime: time,
      checkInPhoto: data.photo,
      checkInLocation: data.location,
      idempotencyKey: data.idempotencyKey,  // NEW
      flagged: flagged,                      // NEW
      flagReason: flagReason || undefined,   // NEW
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

  // NEW: Get all flagged attendance records
  getFlaggedAttendance = async (startDate?: Date, endDate?: Date) => {
    const query: any = { flagged: true };

    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }

    return await Attendance.find(query)
      .populate('staff', 'name email')
      .sort({ createdAt: -1 });
  };

  // NEW: Clear flag after review
  clearFlag = async (attendanceId: string, note?: string) => {
    return await Attendance.findByIdAndUpdate(
      attendanceId,
      {
        $set: {
          flagged: false,
          flagReason: note || "Reviewed and cleared",
        },
      },
      { new: true }
    );
  };

  /**
   * PHASE 3: Enhanced Flagging System
   */

  /**
   * Flag an attendance record for review
   */
  async flagAttendance(
    attendanceId: string,
    flagData: {
      flaggedBy: string;
      flaggedByName: string;
      flagReason: string;
      flagNotes?: string;
    }
  ): Promise<any> {
    const attendance = await Attendance.findByIdAndUpdate(
      attendanceId,
      {
        flagged: true,
        flaggedAt: new Date(),
        flaggedBy: flagData.flaggedBy,
        flaggedByName: flagData.flaggedByName,
        flagReason: flagData.flagReason,
        flagNotes: flagData.flagNotes || "",
        flagStatus: "pending",
      },
      { new: true }
    ).populate([
      { path: "staff", select: "name uid" },
      { path: "flaggedBy", select: "name email" },
    ]);

    return attendance;
  }

  /**
   * Review a flagged attendance record
   */
  async reviewFlag(
    attendanceId: string,
    reviewData: {
      reviewedBy: string;
      flagStatus: string;
      reviewNotes?: string;
    }
  ): Promise<any> {
    const attendance = await Attendance.findByIdAndUpdate(
      attendanceId,
      {
        flagStatus: reviewData.flagStatus,
        reviewedAt: new Date(),
        reviewedBy: reviewData.reviewedBy,
        reviewNotes: reviewData.reviewNotes || "",
      },
      { new: true }
    ).populate([
      { path: "staff", select: "name uid" },
      { path: "flaggedBy", select: "name email" },
      { path: "reviewedBy", select: "name email" },
    ]);

    return attendance;
  }

  /**
   * Get attendance by ID (for controller use)
   */
  async getById(attendanceId: string): Promise<any> {
    const attendance = await Attendance.findById(attendanceId).populate([
      { path: "staff", select: "name uid" },
    ]);
    return attendance;
  }
}
