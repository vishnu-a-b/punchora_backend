"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const ActivityService_1 = __importDefault(require("../services/ActivityService"));
const express_validator_1 = require("express-validator");
const ValidationFailedError_1 = __importDefault(require("../../../errors/errorTypes/ValidationFailedError"));
const NotFoundError_1 = __importDefault(require("../../../errors/errorTypes/NotFoundError"));
const BadRequestError_1 = __importDefault(require("../../../errors/errorTypes/BadRequestError"));
class ActivityController extends BaseController_1.default {
    constructor() {
        super(...arguments);
        this.service = new ActivityService_1.default();
        /**
         * Start a new activity
         */
        this.startActivity = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    throw new ValidationFailedError_1.default({ errors: errors.array() });
                }
                const user = req.user;
                const files = req.files;
                // Get staff record for this user
                const { Staff } = yield Promise.resolve().then(() => __importStar(require("../../staff/models/Staff")));
                const staff = yield Staff.findOne({ user: user._id });
                if (!staff) {
                    throw new NotFoundError_1.default({ error: "Staff record not found" });
                }
                // Handle file uploads
                let photoUrl = req.body.photo;
                let vehiclePhotoUrl = req.body.vehiclePhoto;
                if (files) {
                    if (files.photo && files.photo[0]) {
                        photoUrl = files.photo[0].path || files.photo[0].filename;
                    }
                    if (files.vehiclePhoto && files.vehiclePhoto[0]) {
                        vehiclePhotoUrl = files.vehiclePhoto[0].path || files.vehiclePhoto[0].filename;
                    }
                }
                const activityData = {
                    staff: staff._id.toString(),
                    business: staff.business.toString(),
                    department: (_a = staff.department) === null || _a === void 0 ? void 0 : _a.toString(),
                    type: req.body.type,
                    startTime: req.body.startTime ? new Date(req.body.startTime) : undefined,
                    location: req.body.location,
                    reason: req.body.reason,
                    photo: photoUrl,
                    meterReadingStart: req.body.meterReadingStart ? parseFloat(req.body.meterReadingStart) : undefined,
                    vehiclePhoto: vehiclePhotoUrl,
                    gpsLocation: req.body.gpsLocation ? JSON.parse(req.body.gpsLocation) : undefined
                };
                const activity = yield this.service.startActivity(activityData);
                this.sendSuccessResponse(res, 201, {
                    message: "Activity started successfully",
                    data: activity
                });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * End an ongoing activity
         */
        this.endActivity = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { id } = req.params;
                const user = req.user;
                console.log(`[EndActivity] User ID: ${user._id}, Activity ID: ${id}`);
                const activity = yield this.service.getActivityById(id);
                if (!activity) {
                    throw new NotFoundError_1.default({ error: "Activity not found" });
                }
                console.log(`[EndActivity] Activity found - Staff: ${activity.staff}, Status: ${activity.status}`);
                // Verify this activity belongs to the user
                const { Staff } = yield Promise.resolve().then(() => __importStar(require("../../staff/models/Staff")));
                const staff = yield Staff.findOne({ user: user._id });
                console.log(`[EndActivity] Current user's staff ID: ${staff === null || staff === void 0 ? void 0 : staff._id}`);
                // Handle both populated and non-populated staff field
                const activityStaffId = ((_a = activity.staff) === null || _a === void 0 ? void 0 : _a._id) || activity.staff;
                if (!staff || activityStaffId.toString() !== staff._id.toString()) {
                    console.log(`[EndActivity] Authorization failed - Activity staff: ${activityStaffId}, User staff: ${staff === null || staff === void 0 ? void 0 : staff._id}`);
                    throw new BadRequestError_1.default({ error: "Unauthorized" });
                }
                console.log(`[EndActivity] Authorization successful, proceeding to end activity`);
                const endData = {
                    endTime: req.body.endTime ? new Date(req.body.endTime) : undefined,
                    meterReadingEnd: req.body.meterReadingEnd
                };
                const updatedActivity = yield this.service.endActivity(id, endData);
                this.sendSuccessResponse(res, 200, {
                    message: "Activity ended successfully",
                    data: updatedActivity
                });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * Get my activities
         */
        this.getMyActivities = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const user = req.user;
                const { skip, limit, startDate, endDate, type, status } = req.query;
                // Get staff record for this user
                const { Staff } = yield Promise.resolve().then(() => __importStar(require("../../staff/models/Staff")));
                const staff = yield Staff.findOne({ user: user._id });
                if (!staff) {
                    throw new NotFoundError_1.default({ error: "Staff record not found" });
                }
                const options = {
                    skip: skip ? parseInt(skip) : undefined,
                    limit: limit ? parseInt(limit) : undefined,
                    startDate: startDate ? new Date(startDate) : undefined,
                    endDate: endDate ? new Date(endDate) : undefined,
                    type: type,
                    status: status
                };
                const result = yield this.service.getStaffActivities(staff._id.toString(), options);
                this.sendSuccessResponse(res, 200, {
                    data: result
                });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * Get ongoing activities
         */
        this.getOngoing = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const user = req.user;
                // Get staff record for this user
                const { Staff } = yield Promise.resolve().then(() => __importStar(require("../../staff/models/Staff")));
                const staff = yield Staff.findOne({ user: user._id });
                if (!staff) {
                    throw new NotFoundError_1.default({ error: "Staff record not found" });
                }
                const activities = yield this.service.getOngoingActivities(staff._id.toString());
                this.sendSuccessResponse(res, 200, { data: activities });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * Get activity by ID
         */
        this.getById = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const activity = yield this.service.getActivityById(id);
                if (!activity) {
                    throw new NotFoundError_1.default({ error: "Activity not found" });
                }
                this.sendSuccessResponse(res, 200, { data: activity });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * Get business activities (Admin only)
         */
        this.getBusinessActivities = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const user = req.user;
                const { skip, limit, startDate, endDate, type, departmentId } = req.query;
                console.log(`[GetBusinessActivities] User role: ${user.role}, User business: ${user.business}, Query businessId: ${req.query.businessId}`);
                // Get business ID from user or query
                let businessId = user.business;
                // Super admin can query any business
                if (user.role === "super-admin" && req.query.businessId) {
                    businessId = req.query.businessId;
                }
                console.log(`[GetBusinessActivities] Final businessId: ${businessId}`);
                if (!businessId) {
                    console.log(`[GetBusinessActivities] No businessId found - throwing error`);
                    throw new BadRequestError_1.default({ error: "Business ID required" });
                }
                const options = {
                    skip: skip ? parseInt(skip) : undefined,
                    limit: limit ? parseInt(limit) : undefined,
                    startDate: startDate ? new Date(startDate) : undefined,
                    endDate: endDate ? new Date(endDate) : undefined,
                    type: type,
                    departmentId: departmentId
                };
                const result = yield this.service.getBusinessActivities(businessId, options);
                this.sendSuccessResponse(res, 200, {
                    data: result
                });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * Get activity statistics
         */
        this.getStats = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const user = req.user;
                const { startDate, endDate } = req.query;
                // Get staff record for this user
                const { Staff } = yield Promise.resolve().then(() => __importStar(require("../../staff/models/Staff")));
                const staff = yield Staff.findOne({ user: user._id });
                if (!staff) {
                    throw new NotFoundError_1.default({ error: "Staff record not found" });
                }
                if (!startDate || !endDate) {
                    throw new BadRequestError_1.default({
                        error: "Start date and end date are required"
                    });
                }
                const stats = yield this.service.getActivityStats(staff._id.toString(), new Date(startDate), new Date(endDate));
                this.sendSuccessResponse(res, 200, { data: stats });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * Delete activity
         */
        this.deleteActivity = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const user = req.user;
                const activity = yield this.service.getActivityById(id);
                if (!activity) {
                    throw new NotFoundError_1.default({ error: "Activity not found" });
                }
                // Verify this activity belongs to the user (or user is admin)
                if (user.role !== "super-admin" &&
                    user.role !== "business-admin") {
                    const { Staff } = yield Promise.resolve().then(() => __importStar(require("../../staff/models/Staff")));
                    const staff = yield Staff.findOne({ user: user._id });
                    if (!staff || activity.staff.toString() !== staff._id.toString()) {
                        throw new BadRequestError_1.default({ error: "Unauthorized" });
                    }
                }
                yield this.service.deleteActivity(id);
                this.sendSuccessResponse(res, 200, {
                    data: { message: "Activity deleted successfully" }
                });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * Get business activity statistics (Admin only)
         */
        this.getBusinessStats = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const user = req.user;
                const { startDate, endDate, businessId } = req.query;
                if (!startDate || !endDate) {
                    throw new BadRequestError_1.default({ error: "Start date and end date are required" });
                }
                // Get business ID
                let targetBusinessId = user.business;
                if (user.role === "super-admin" && businessId) {
                    targetBusinessId = businessId;
                }
                if (!targetBusinessId) {
                    throw new BadRequestError_1.default({ error: "Business ID required" });
                }
                const { Activity } = yield Promise.resolve().then(() => __importStar(require("../models/Activity")));
                const mongoose = yield Promise.resolve().then(() => __importStar(require("mongoose")));
                const stats = yield Activity.aggregate([
                    {
                        $match: {
                            business: new mongoose.Types.ObjectId(targetBusinessId),
                            startTime: {
                                $gte: new Date(startDate),
                                $lte: new Date(endDate)
                            }
                        }
                    },
                    {
                        $group: {
                            _id: "$type",
                            count: { $sum: 1 },
                            totalDuration: { $sum: "$duration" },
                            avgDuration: { $avg: "$duration" }
                        }
                    },
                    {
                        $sort: { count: -1 }
                    }
                ]);
                this.sendSuccessResponse(res, 200, { data: stats });
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.default = ActivityController;
