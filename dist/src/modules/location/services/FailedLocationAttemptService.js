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
Object.defineProperty(exports, "__esModule", { value: true });
const FailedLocationAttempt_1 = require("../models/FailedLocationAttempt");
class FailedLocationAttemptService {
    constructor() {
        this.list = (_a) => __awaiter(this, [_a], void 0, function* ({ limit, skip, filterQuery, sort }) {
            limit = limit ? limit : 10;
            skip = skip ? skip : 0;
            const attempts = yield FailedLocationAttempt_1.FailedLocationAttempt.find(filterQuery)
                .sort(sort)
                .limit(limit)
                .skip(skip)
                .populate("staff");
            const total = yield FailedLocationAttempt_1.FailedLocationAttempt.countDocuments(filterQuery);
            return {
                total,
                limit,
                skip,
                items: attempts,
            };
        });
        this.create = (body) => __awaiter(this, void 0, void 0, function* () {
            return yield FailedLocationAttempt_1.FailedLocationAttempt.create(body);
        });
        this.findOne = (id) => __awaiter(this, void 0, void 0, function* () {
            return yield FailedLocationAttempt_1.FailedLocationAttempt.findById(id);
        });
        this.update = (_a) => __awaiter(this, [_a], void 0, function* ({ id, body }) {
            return yield FailedLocationAttempt_1.FailedLocationAttempt.findByIdAndUpdate(id, body);
        });
        this.delete = (id) => __awaiter(this, void 0, void 0, function* () {
            return yield FailedLocationAttempt_1.FailedLocationAttempt.findByIdAndDelete(id);
        });
        this.insertMany = (data) => __awaiter(this, void 0, void 0, function* () {
            return yield FailedLocationAttempt_1.FailedLocationAttempt.insertMany(data);
        });
        this.filterByDate = (startDate, endDate, staffId) => __awaiter(this, void 0, void 0, function* () {
            const startOfStartDate = new Date(startDate);
            const endOfEndDate = new Date(endDate);
            let matchQuery = {
                attemptTime: {
                    $gte: startOfStartDate,
                    $lte: endOfEndDate,
                },
            };
            if (staffId) {
                matchQuery.staff = staffId;
            }
            const attempts = yield FailedLocationAttempt_1.FailedLocationAttempt.aggregate([
                { $match: matchQuery },
                {
                    $lookup: {
                        from: "staffs",
                        localField: "staff",
                        foreignField: "_id",
                        as: "staffInfo",
                    },
                },
                {
                    $unwind: {
                        path: "$staffInfo",
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $project: {
                        _id: 1,
                        staffName: "$staffInfo.name",
                        staffEmail: "$staffInfo.email",
                        attemptTime: 1,
                        reason: 1,
                        errorMessage: 1,
                        failureCount: { $literal: 1 },
                    },
                },
                { $sort: { attemptTime: -1 } },
            ]);
            return attempts;
        });
        // Get staff with location disabled (failed attempts in last X minutes)
        this.getStaffWithLocationDisabled = (businessId_1, ...args_1) => __awaiter(this, [businessId_1, ...args_1], void 0, function* (businessId, lastMinutes = 10) {
            const timeThreshold = new Date(Date.now() - lastMinutes * 60 * 1000);
            const pipeline = [
                {
                    $match: {
                        attemptTime: { $gte: timeThreshold },
                        reason: { $in: ["location_off", "permission_denied"] },
                    },
                },
                {
                    $sort: { attemptTime: -1 },
                },
                {
                    $group: {
                        _id: "$staff",
                        latestAttempt: { $first: "$$ROOT" },
                        failureCount: { $sum: 1 },
                    },
                },
                {
                    $replaceRoot: {
                        newRoot: {
                            $mergeObjects: ["$latestAttempt", { failureCount: "$failureCount" }],
                        },
                    },
                },
                {
                    $lookup: {
                        from: "staffs",
                        localField: "staff",
                        foreignField: "_id",
                        as: "staffInfo",
                    },
                },
                {
                    $unwind: {
                        path: "$staffInfo",
                        preserveNullAndEmptyArrays: false,
                    },
                },
            ];
            if (businessId) {
                pipeline.push({
                    $match: {
                        "staffInfo.business": businessId,
                    },
                });
            }
            pipeline.push({
                $project: {
                    _id: 1,
                    staff: "$staffInfo._id",
                    staffName: "$staffInfo.name",
                    staffEmail: "$staffInfo.email",
                    staffType: "$staffInfo.staffType",
                    attemptTime: 1,
                    reason: 1,
                    errorMessage: 1,
                    lastKnownLatitude: 1,
                    lastKnownLongitude: 1,
                    lastKnownTime: 1,
                    failureCount: 1,
                },
            });
            const staffWithIssues = yield FailedLocationAttempt_1.FailedLocationAttempt.aggregate(pipeline);
            return staffWithIssues;
        });
        // Get summary statistics for location failures
        this.getLocationFailureSummary = (startDate, endDate, businessId) => __awaiter(this, void 0, void 0, function* () {
            const pipeline = [
                {
                    $match: {
                        attemptTime: {
                            $gte: startDate,
                            $lte: endDate,
                        },
                    },
                },
                {
                    $lookup: {
                        from: "staffs",
                        localField: "staff",
                        foreignField: "_id",
                        as: "staffInfo",
                    },
                },
                {
                    $unwind: {
                        path: "$staffInfo",
                        preserveNullAndEmptyArrays: false,
                    },
                },
            ];
            if (businessId) {
                pipeline.push({
                    $match: {
                        "staffInfo.business": businessId,
                    },
                });
            }
            pipeline.push({
                $group: {
                    _id: {
                        staff: "$staff",
                        reason: "$reason",
                    },
                    count: { $sum: 1 },
                    staffName: { $first: "$staffInfo.name" },
                    staffEmail: { $first: "$staffInfo.email" },
                    lastAttemptTime: { $max: "$attemptTime" },
                },
            }, {
                $group: {
                    _id: "$_id.staff",
                    staffName: { $first: "$staffName" },
                    staffEmail: { $first: "$staffEmail" },
                    reasons: {
                        $push: {
                            reason: "$_id.reason",
                            count: "$count",
                        },
                    },
                    totalFailures: { $sum: "$count" },
                    lastFailureTime: { $max: "$lastAttemptTime" },
                },
            }, {
                $sort: { totalFailures: -1 },
            });
            const summary = yield FailedLocationAttempt_1.FailedLocationAttempt.aggregate(pipeline);
            return summary;
        });
    }
}
exports.default = FailedLocationAttemptService;
