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
            //checking for 2 minutes gap within recent markings
            const time = new Date();
            let startTime = new Date();
            const endTime = new Date();
            startTime.setMinutes(startTime.getMinutes() - 2);
            let attendance = yield Attendance_1.Attendance.findOne({
                date: {
                    $gte: startTime,
                    $lte: endTime,
                },
                staff: data.staff,
            }).sort({ createdAt: -1 });
            if (attendance) {
                throw new AttendanceError_1.default({
                    error: "You have a recent marking. Wait for some time and try again!",
                });
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
                return yield Attendance_1.Attendance.findByIdAndUpdate(attendance.id, {
                    $set: {
                        checkOutTime: time,
                        status: attendanceStatus_1.AttendanceStatus.present,
                        checkOutLocation: data.location,
                        checkOutPhoto: data.photo,
                    },
                }, { new: true });
            }
            return yield Attendance_1.Attendance.create({
                staff: data.staff,
                date: time,
                checkInTime: time,
                checkInPhoto: data.photo,
                checkInLocation: data.location,
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
            }).populate("staff");
            return attendances;
        });
        this.update = (id, attendance) => __awaiter(this, void 0, void 0, function* () {
            return yield Attendance_1.Attendance.findByIdAndUpdate(id, attendance);
        });
        this.delete = (id) => __awaiter(this, void 0, void 0, function* () {
            return yield Attendance_1.Attendance.findByIdAndDelete(id);
        });
    }
}
exports.default = AttendanceService;
