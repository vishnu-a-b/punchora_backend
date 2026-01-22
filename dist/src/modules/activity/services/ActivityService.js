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
const Activity_1 = require("../models/Activity");
const mongoose_1 = __importDefault(require("mongoose"));
class ActivityService {
    /**
     * Start a new activity
     */
    startActivity(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const activity = new Activity_1.Activity(Object.assign(Object.assign({}, data), { status: Activity_1.ActivityStatus.STARTED, startTime: data.startTime || new Date() }));
            yield activity.save();
            return activity;
        });
    }
    /**
     * End an ongoing activity
     */
    endActivity(activityId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const activity = yield Activity_1.Activity.findById(activityId);
            if (!activity) {
                throw new Error("Activity not found");
            }
            if (activity.status === Activity_1.ActivityStatus.ENDED) {
                throw new Error("Activity already ended");
            }
            activity.status = Activity_1.ActivityStatus.ENDED;
            activity.endTime = data.endTime || new Date();
            if (data.meterReadingEnd) {
                activity.meterReadingEnd = data.meterReadingEnd;
            }
            // Duration will be calculated by pre-save hook
            yield activity.save();
            return activity;
        });
    }
    /**
     * Get staff activities
     * PHASE 5: Added .lean() optimization
     */
    getStaffActivities(staffId_1) {
        return __awaiter(this, arguments, void 0, function* (staffId, options = {}) {
            const query = { staff: staffId };
            if (options.startDate || options.endDate) {
                query.startTime = {};
                if (options.startDate) {
                    query.startTime.$gte = options.startDate;
                }
                if (options.endDate) {
                    query.startTime.$lte = options.endDate;
                }
            }
            if (options.type) {
                query.type = options.type;
            }
            if (options.status) {
                query.status = options.status;
            }
            const [items, total] = yield Promise.all([
                Activity_1.Activity.find(query)
                    .sort({ startTime: -1 })
                    .skip(options.skip || 0)
                    .limit(options.limit || 100)
                    .populate("staff", "name")
                    .populate("department", "name")
                    .lean(),
                Activity_1.Activity.countDocuments(query),
            ]);
            return { items: items, total };
        });
    }
    /**
     * Get ongoing activities for a staff member
     * PHASE 5: Added .lean() optimization
     */
    getOngoingActivities(staffId) {
        return __awaiter(this, void 0, void 0, function* () {
            return Activity_1.Activity.find({
                staff: staffId,
                status: Activity_1.ActivityStatus.STARTED,
            })
                .sort({ startTime: -1 })
                .populate("staff", "name")
                .populate("department", "name")
                .lean();
        });
    }
    /**
     * Get activity by ID
     * PHASE 5: Added .lean() optimization
     */
    getActivityById(activityId) {
        return __awaiter(this, void 0, void 0, function* () {
            return Activity_1.Activity.findById(activityId)
                .populate("staff", "name email")
                .populate("business", "name")
                .populate("department", "name")
                .lean();
        });
    }
    /**
     * Get business activities (for admin)
     * PHASE 5: Added .lean() optimization
     */
    getBusinessActivities(businessId_1) {
        return __awaiter(this, arguments, void 0, function* (businessId, options = {}) {
            const query = { business: businessId };
            if (options.startDate || options.endDate) {
                query.startTime = {};
                if (options.startDate) {
                    query.startTime.$gte = options.startDate;
                }
                if (options.endDate) {
                    query.startTime.$lte = options.endDate;
                }
            }
            if (options.type) {
                query.type = options.type;
            }
            if (options.departmentId) {
                query.department = options.departmentId;
            }
            const [items, total] = yield Promise.all([
                Activity_1.Activity.find(query)
                    .sort({ startTime: -1 })
                    .skip(options.skip || 0)
                    .limit(options.limit || 100)
                    .populate("staff", "name")
                    .populate("department", "name")
                    .lean(),
                Activity_1.Activity.countDocuments(query),
            ]);
            return { items: items, total };
        });
    }
    /**
     * Delete activity
     */
    deleteActivity(activityId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield Activity_1.Activity.deleteOne({ _id: activityId });
            return result.deletedCount > 0;
        });
    }
    /**
     * Get activity statistics
     */
    getActivityStats(staffId, startDate, endDate) {
        return __awaiter(this, void 0, void 0, function* () {
            const stats = yield Activity_1.Activity.aggregate([
                {
                    $match: {
                        staff: new mongoose_1.default.Types.ObjectId(staffId),
                        startTime: { $gte: startDate, $lte: endDate }
                    }
                },
                {
                    $group: {
                        _id: "$type",
                        count: { $sum: 1 },
                        totalDuration: { $sum: "$duration" }
                    }
                }
            ]);
            return stats;
        });
    }
}
exports.default = ActivityService;
