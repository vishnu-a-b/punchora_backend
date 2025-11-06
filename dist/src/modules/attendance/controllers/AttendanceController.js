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
const BaseController_1 = __importDefault(require("../../base/controllers.ts/BaseController"));
const express_validator_1 = require("express-validator");
const ValidationFailedError_1 = __importDefault(require("../../../errors/errorTypes/ValidationFailedError"));
const AttendanceService_1 = __importDefault(require("../services/AttendanceService"));
const facialRecognitionservice_1 = require("../../../services/facialRecognitionservice");
const Staff_1 = require("../../staff/models/Staff");
const configs_1 = __importDefault(require("../../../configs/configs"));
const AttendanceError_1 = __importDefault(require("../../../errors/errorTypes/AttendanceError"));
const BadRequestError_1 = __importDefault(require("../../../errors/errorTypes/BadRequestError"));
const mongoose_1 = __importDefault(require("mongoose"));
const NotFoundError_1 = __importDefault(require("../../../errors/errorTypes/NotFoundError"));
class AttendanceController extends BaseController_1.default {
    constructor() {
        super(...arguments);
        this.service = new AttendanceService_1.default();
        this.facialRecognitionService = new facialRecognitionservice_1.FaceRecognitionService();
        this.create = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            try {
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    next(new ValidationFailedError_1.default({ errors: errors.array() }));
                    return;
                }
                let body = req.body;
                if (req.files) {
                    const files = req.files;
                    if ((_a = files.checkInPhoto) === null || _a === void 0 ? void 0 : _a[0]) {
                        body.checkInPhoto =
                            configs_1.default.domain + "attendance/" + ((_b = files.checkInPhoto) === null || _b === void 0 ? void 0 : _b[0].filename);
                    }
                    if ((_c = files.checkOutPhoto) === null || _c === void 0 ? void 0 : _c[0]) {
                        body.checkOutPhoto =
                            configs_1.default.domain + "attendance/" + ((_d = files.checkOutPhoto) === null || _d === void 0 ? void 0 : _d[0].filename);
                    }
                }
                const attendance = yield this.service.create(req.body);
                this.sendSuccessResponse(res, 201, { data: attendance });
            }
            catch (e) {
                if (e instanceof mongoose_1.default.Error.CastError) {
                    next(new BadRequestError_1.default({ error: "invalid data" }));
                }
                next(e);
            }
        });
        this.update = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            try {
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    next(new ValidationFailedError_1.default({ errors: errors.array() }));
                    return;
                }
                let body = req.body;
                if (req.files) {
                    const files = req.files;
                    if ((_a = files.checkInPhoto) === null || _a === void 0 ? void 0 : _a[0]) {
                        body.checkInPhoto =
                            configs_1.default.domain + "attendance/" + ((_b = files.checkInPhoto) === null || _b === void 0 ? void 0 : _b[0].filename);
                    }
                    if ((_c = files.checkOutPhoto) === null || _c === void 0 ? void 0 : _c[0]) {
                        body.checkOutPhoto =
                            configs_1.default.domain + "attendance/" + ((_d = files.checkOutPhoto) === null || _d === void 0 ? void 0 : _d[0].filename);
                    }
                }
                const attendance = yield this.service.update(req.params.id, body);
                if (!attendance) {
                    throw new NotFoundError_1.default({ error: "attendance not found" });
                }
                this.sendSuccessResponse(res, 200, { data: { _id: attendance._id } });
            }
            catch (e) {
                if (e instanceof mongoose_1.default.Error.CastError) {
                    next(new BadRequestError_1.default({ error: "invalid attendance_id" }));
                }
                next(e);
            }
        });
        this.markAttendance = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    throw new ValidationFailedError_1.default({ errors: errors.array() });
                }
                const body = req.body;
                if (!body.checkOutTime && !body.checkInTime) {
                    throw new ValidationFailedError_1.default({
                        error: "checkOutTime or checkInTime required",
                    });
                }
                if (!req.file) {
                    throw new ValidationFailedError_1.default({ errors: ["no photo provided"] });
                }
                body.photo = configs_1.default.domain + "attendance/" + req.file.filename;
                let data;
                if (body.checkIn === "false") {
                    if (!body.checkOutLocation) {
                        throw new ValidationFailedError_1.default({
                            errors: ["checkOutLocation required"],
                        });
                    }
                    data = yield this.service.checkOut({
                        date: body.date,
                        checkOutTime: new Date(),
                        staff: body.staff,
                        checkOutPhoto: body.photo,
                        checkOutLocation: JSON.parse(body.checkOutLocation),
                    });
                }
                if (body.checkIn === "true") {
                    if (!body.checkInLocation) {
                        throw new ValidationFailedError_1.default({
                            errors: ["checkInLocation required"],
                        });
                    }
                    data = yield this.service.checkIn({
                        date: body.date,
                        checkInTime: new Date(),
                        staff: body.staff,
                        checkInPhoto: body.photo,
                        checkInLocation: JSON.parse(body.checkInLocation),
                        createdBy: req.user._id,
                    });
                }
                this.sendSuccessResponse(res, 201, { data });
            }
            catch (e) {
                next(e);
            }
        });
        this.markAttendanceViaRecognition = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    throw new ValidationFailedError_1.default({ errors: errors.array() });
                }
                const body = req.body;
                if (!req.file) {
                    throw new ValidationFailedError_1.default({ errors: ["no photo provided"] });
                }
                body.photo = configs_1.default.domain + "attendance/" + req.file.filename;
                const user = yield this.facialRecognitionService.recognizeUser(req.file.path);
                if (!user) {
                    throw new AttendanceError_1.default({
                        error: "facial recognition failed. No user found",
                    });
                }
                const staff = yield Staff_1.Staff.findOne({ user: user.id });
                if (!staff) {
                    throw new AttendanceError_1.default({
                        error: "facial recognition failed. No staff found",
                    });
                }
                yield this.service.mark({
                    staff: staff.id,
                    photo: body.photo,
                    location: JSON.parse(body.location),
                });
                this.sendSuccessResponse(res, 201, { data: staff });
            }
            catch (e) {
                next(e);
            }
        });
        this.getAttendanceForStaff = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { limit, skip } = req.query;
                const { filterQuery, sort } = req;
                const staffId = req.params.id;
                const { startDate, endDate } = req.query;
                if (!startDate || !endDate) {
                    throw new ValidationFailedError_1.default({
                        errors: ["startDate & endDate required as query parameters"],
                    });
                }
                const data = yield this.service.filterByDate(new Date(startDate), new Date(endDate), staffId);
                this.sendSuccessResponse(res, 200, { data });
            }
            catch (e) {
                next(e);
            }
        });
        this.getDatewiseAttendanceForAllStaffs = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { startDate, endDate, status } = req.query;
                if (!startDate || !endDate || !status) {
                    throw new ValidationFailedError_1.default({
                        errors: ["startDate, endDate & status required as query parameters"],
                    });
                }
                const data = yield this.service.filterAllStaffsByDate(new Date(startDate), new Date(endDate), status);
                this.sendSuccessResponse(res, 200, { data });
            }
            catch (e) {
                next(e);
            }
        });
        this.delete = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const attendance = yield this.service.delete(req.params.id);
                if (!attendance) {
                    throw new NotFoundError_1.default({ error: "attendance not found" });
                }
                this.sendSuccessResponse(res, 204, { data: {} });
            }
            catch (e) {
                if (e instanceof mongoose_1.default.Error.CastError) {
                    next(new BadRequestError_1.default({ error: "invalid attendance_id" }));
                }
                next(e);
            }
        });
    }
}
exports.default = AttendanceController;
