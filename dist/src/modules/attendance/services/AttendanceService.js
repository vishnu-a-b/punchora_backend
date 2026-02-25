"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AttendanceError_1 = __importDefault(require("../../../errors/errorTypes/AttendanceError"));
const attendanceStatus_1 = require("../../base/enums/attendanceStatus");
const Attendance_1 = require("../models/Attendance");
class AttendanceService {
    constructor() {
        this.create = (data) => __awaiter(this, void 0, void 0, function* () {
            return yield Attendance_1.Attendance.create(data);
        });
        this.mark = (data) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const time = new Date();
            // ===== NEW: Check idempotency key first =====
            if (data.idempotencyKey) {
                const existingPunch = yield Attendance_1.Attendance.findOne({
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
            startTime.setMinutes(startTime.getMinutes() - 1); // CHANGED FROM 2 to 1
            let attendance = yield Attendance_1.Attendance.findOne({
                date: {
                    $gte: startTime,
                    $lte: endTime,
                },
                staff: data.staff,
            }).sort({ createdAt: -1 });
            if (attendance) {
                throw new AttendanceError_1.default({
                    error: "You have a recent marking. Wait for 1 minute and try again!",
                });
            }
            // ===== NEW: Flag suspicious locations =====
            let flagged = false;
            let flagReason = "";
            if (((_a = data.location) === null || _a === void 0 ? void 0 : _a.mocked) === true) {
                flagged = true;
                flagReason = "Mocked GPS detected - possible location spoofing";
            }
            if (((_b = data.location) === null || _b === void 0 ? void 0 : _b.accuracy) && data.location.accuracy > 100) {
                flagged = true;
                flagReason = flagReason
                    ? `${flagReason}; Low GPS accuracy (${data.location.accuracy}m)`
                    : `Low GPS accuracy (${data.location.accuracy}m)`;
            }
            if (((_c = data.location) === null || _c === void 0 ? void 0 : _c.speed) && data.location.speed > 5) {
                flagged = true;
                flagReason = flagReason
                    ? `${flagReason}; User in motion (${data.location.speed.toFixed(1)} m/s)`
                    : `User in motion (${data.location.speed.toFixed(1)} m/s)`;
            }
            //checking for marking withing 18 hrs
            startTime = new Date();
            startTime.setHours(startTime.getHours() - 18);
            attendance = yield Attendance_1.Attendance.findOne({
                date: {
                    $gte: startTime,
                    $lte: endTime,
                },
                staff: data.staff,
            }).sort({ createdAt: -1 });
            if (attendance && attendance.status == attendanceStatus_1.AttendanceStatus.checkedIn) {
                // Check-out
                return yield Attendance_1.Attendance.findByIdAndUpdate(attendance.id, {
                    $set: {
                        checkOutTime: time,
                        status: attendanceStatus_1.AttendanceStatus.present,
                        checkOutLocation: data.location,
                        checkOutPhoto: data.photo,
                        idempotencyKey: data.idempotencyKey, // NEW
                        flagged: flagged, // NEW
                        flagReason: flagReason || undefined, // NEW
                    },
                }, { new: true });
            }
            // Check-in
            return yield Attendance_1.Attendance.create({
                staff: data.staff,
                date: time,
                checkInTime: time,
                checkInPhoto: data.photo,
                checkInLocation: data.location,
                idempotencyKey: data.idempotencyKey, // NEW
                flagged: flagged, // NEW
                flagReason: flagReason || undefined, // NEW
            });
        });
        this.checkIn = (data) => __awaiter(this, void 0, void 0, function* () {
            const startOfDay = new Date(data.date);
            const endOfDay = new Date(data.date);
            startOfDay.setHours(startOfDay.getHours() - 18);
            console.log("startOfDay", startOfDay);
            console.log("endOfDay", endOfDay);
            let attendance = yield Attendance_1.Attendance.findOne({
                date: {
                    $gte: startOfDay,
                    $lte: endOfDay,
                },
                staff: data.staff,
            }).sort({ createdAt: -1 });
            if (attendance && attendance.status == attendanceStatus_1.AttendanceStatus.checkedIn) {
                throw new AttendanceError_1.default({
                    error: "You have to check-out before check-in again!",
                });
            }
            return yield Attendance_1.Attendance.create(data);
        });
        this.checkOut = (data) => __awaiter(this, void 0, void 0, function* () {
            const startOfDay = new Date(data.date);
            const endOfDay = new Date(data.date);
            startOfDay.setHours(startOfDay.getHours() - 18);
            console.log("startOfDay", startOfDay);
            console.log("endOfDay", endOfDay);
            let attendance = yield Attendance_1.Attendance.findOne({
                date: {
                    $gte: startOfDay,
                    $lte: endOfDay,
                },
                staff: data.staff,
                status: attendanceStatus_1.AttendanceStatus.checkedIn,
            }).sort({ createdAt: -1 });
            if (!attendance) {
                throw new AttendanceError_1.default({
                    error: "You have to check-in before check-out!",
                });
            }
            attendance = yield Attendance_1.Attendance.findByIdAndUpdate(attendance.id, {
                $set: {
                    checkOutTime: data.checkOutTime,
                    status: attendanceStatus_1.AttendanceStatus.present,
                    checkOutLocation: data.checkOutLocation,
                    checkOutPhoto: data.checkOutPhoto,
                },
            }, { new: true });
            return attendance;
        });
        this.filterByDate = (startDate, endDate, staff) => __awaiter(this, void 0, void 0, function* () {
            const startOfStartDate = new Date(startDate);
            const endOfEndDate = new Date(endDate);
            startOfStartDate.setHours(0, 0, 0, 0);
            endOfEndDate.setHours(23, 59, 59, 999);
            const attendances = yield Attendance_1.Attendance.find({
                date: {
                    $gte: startOfStartDate,
                    $lte: endOfEndDate,
                },
                staff: staff,
            }).sort({ checkInTime: 'asc' });
            return attendances;
        });
        this.filterAllStaffsByDate = (startDate, endDate, status) => __awaiter(this, void 0, void 0, function* () {
            const startOfStartDate = new Date(startDate);
            const endOfEndDate = new Date(endDate);
            startOfStartDate.setHours(0, 0, 0, 0);
            endOfEndDate.setHours(23, 59, 59, 999);
            const attendances = yield Attendance_1.Attendance.find({
                date: {
                    $gte: startOfStartDate,
                    $lte: endOfEndDate,
                },
                status: status,
            }).populate({
                path: "staff",
                populate: [
                    { path: "business", select: "name" },
                    { path: "department", select: "name" },
                ],
            });
            return attendances;
        });
        this.update = (id, attendance) => __awaiter(this, void 0, void 0, function* () {
            return yield Attendance_1.Attendance.findByIdAndUpdate(id, attendance);
        });
        this.delete = (id) => __awaiter(this, void 0, void 0, function* () {
            return yield Attendance_1.Attendance.findByIdAndDelete(id);
        });
        // NEW: Get all flagged attendance records
        this.getFlaggedAttendance = (startDate, endDate) => __awaiter(this, void 0, void 0, function* () {
            const query = { flagged: true };
            if (startDate && endDate) {
                query.date = { $gte: startDate, $lte: endDate };
            }
            return yield Attendance_1.Attendance.find(query)
                .populate('staff', 'name email')
                .sort({ createdAt: -1 });
        });
        // NEW: Clear flag after review
        this.clearFlag = (attendanceId, note) => __awaiter(this, void 0, void 0, function* () {
            return yield Attendance_1.Attendance.findByIdAndUpdate(attendanceId, {
                $set: {
                    flagged: false,
                    flagReason: note || "Reviewed and cleared",
                },
            }, { new: true });
        });
    }
    /**
     * PHASE 3: Enhanced Flagging System
     */
    /**
     * Flag an attendance record for review
     */
    flagAttendance(attendanceId, flagData) {
        return __awaiter(this, void 0, void 0, function* () {
            const attendance = yield Attendance_1.Attendance.findByIdAndUpdate(attendanceId, {
                flagged: true,
                flaggedAt: new Date(),
                flaggedBy: flagData.flaggedBy,
                flaggedByName: flagData.flaggedByName,
                flagReason: flagData.flagReason,
                flagNotes: flagData.flagNotes || "",
                flagStatus: "pending",
            }, { new: true }).populate([
                { path: "staff", select: "name uid" },
                { path: "flaggedBy", select: "name email" },
            ]);
            return attendance;
        });
    }
    /**
     * Review a flagged attendance record
     */
    reviewFlag(attendanceId, reviewData) {
        return __awaiter(this, void 0, void 0, function* () {
            const attendance = yield Attendance_1.Attendance.findByIdAndUpdate(attendanceId, {
                flagStatus: reviewData.flagStatus,
                reviewedAt: new Date(),
                reviewedBy: reviewData.reviewedBy,
                reviewNotes: reviewData.reviewNotes || "",
            }, { new: true }).populate([
                { path: "staff", select: "name uid" },
                { path: "flaggedBy", select: "name email" },
                { path: "reviewedBy", select: "name email" },
            ]);
            return attendance;
        });
    }
    /**
     * Get attendance by ID (for controller use)
     */
    getById(attendanceId) {
        return __awaiter(this, void 0, void 0, function* () {
            const attendance = yield Attendance_1.Attendance.findById(attendanceId).populate([
                { path: "staff", select: "name uid" },
            ]);
            return attendance;
        });
    }
}
exports.default = AttendanceService;
