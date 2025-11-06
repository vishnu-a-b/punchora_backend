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
const NotFoundError_1 = __importDefault(require("../../../errors/errorTypes/NotFoundError"));
const Staff_1 = require("../models/Staff");
const Attendance_1 = require("../../attendance/models/Attendance");
class StaffService {
    constructor() {
        this.create = (staff) => __awaiter(this, void 0, void 0, function* () {
            return yield Staff_1.Staff.create(staff);
        });
        this.find = (_a) => __awaiter(this, [_a], void 0, function* ({ limit, skip, filterQuery, sort }) {
            limit = limit ? limit : 10;
            skip = skip ? skip : 0;
            console.log("hai", sort);
            const staffs = yield Staff_1.Staff.find(filterQuery)
                .populate(["user", "department"])
                .sort(sort)
                .limit(limit)
                .skip(skip);
            const total = yield Staff_1.Staff.countDocuments(filterQuery);
            return {
                total,
                limit,
                skip,
                items: staffs,
            };
        });
        this.findAndGetAttendance = (_a) => __awaiter(this, [_a], void 0, function* ({ limit, skip, filterQuery, sort, }) {
            limit = limit ? limit : 10;
            skip = skip ? skip : 0;
            let staffData = [];
            const staffs = yield Staff_1.Staff.find(filterQuery)
                .populate(["user", "department"])
                .sort(sort)
                .limit(limit)
                .skip(skip);
            const today = new Date();
            const startOfDay = today;
            const endOfDay = today;
            startOfDay.setHours(0, 0, 0, 0);
            endOfDay.setHours(23, 59, 59, 999);
            for (const staff of staffs) {
                const attendance = yield Attendance_1.Attendance.findOne({
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
            const total = yield Staff_1.Staff.countDocuments(filterQuery);
            return {
                total,
                limit,
                skip,
                items: staffData,
            };
        });
        this.countTotalDocuments = () => __awaiter(this, void 0, void 0, function* () { return yield Staff_1.Staff.countDocuments(); });
        this.findOne = (id) => __awaiter(this, void 0, void 0, function* () {
            return yield Staff_1.Staff.findById(id).populate([
                "user",
                "department",
                "business",
            ]);
        });
        this.findOneWithUserId = (id) => __awaiter(this, void 0, void 0, function* () {
            const staffs = yield Staff_1.Staff.find({ user: id })
                .populate(["user", "department"])
                .limit(1);
            if (staffs.length < 1)
                throw new NotFoundError_1.default({ error: "Staff not found" });
            return staffs[0];
        });
        this.update = (_a) => __awaiter(this, [_a], void 0, function* ({ id, staff }) {
            return yield Staff_1.Staff.findByIdAndUpdate(id, staff);
        });
        this.delete = (id) => __awaiter(this, void 0, void 0, function* () {
            return yield Staff_1.Staff.findByIdAndDelete(id);
        });
    }
}
exports.default = StaffService;
