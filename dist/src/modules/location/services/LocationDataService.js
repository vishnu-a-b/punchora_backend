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
const LocationData_1 = require("../models/LocationData");
class LocationDataService {
    constructor() {
        this.list = (_a) => __awaiter(this, [_a], void 0, function* ({ limit, skip, filterQuery, sort }) {
            limit = limit ? limit : 10;
            skip = skip ? skip : 0;
            const locationDatas = yield LocationData_1.LocationData.find(filterQuery)
                .sort(sort)
                .limit(limit)
                .skip(skip);
            const total = yield LocationData_1.LocationData.countDocuments(filterQuery);
            return {
                total,
                limit,
                skip,
                items: locationDatas,
            };
        });
        this.create = (body) => __awaiter(this, void 0, void 0, function* () {
            return yield LocationData_1.LocationData.create(body);
        });
        this.findOne = (id) => __awaiter(this, void 0, void 0, function* () {
            return yield LocationData_1.LocationData.findById(id);
        });
        this.update = (_a) => __awaiter(this, [_a], void 0, function* ({ id, body }) {
            return yield LocationData_1.LocationData.findByIdAndUpdate(id, body);
        });
        this.delete = (id) => __awaiter(this, void 0, void 0, function* () {
            return yield LocationData_1.LocationData.findByIdAndDelete(id);
        });
        this.insertMany = (data) => __awaiter(this, void 0, void 0, function* () {
            return yield LocationData_1.LocationData.insertMany(data);
        });
        this.filterByDate = (startDate, endDate, staffId, sessionId // Fix 7: filter by session (attendance record)
        ) => __awaiter(this, void 0, void 0, function* () {
            const startOfStartDate = new Date(startDate);
            const endOfEndDate = new Date(endDate);
            let query = {
                date: { $gte: startOfStartDate, $lte: endOfEndDate },
            };
            if (staffId)
                query.staff = staffId;
            if (sessionId)
                query.sessionId = sessionId; // Fix 7
            const locations = yield LocationData_1.LocationData.find(query).sort({ date: 1 }).populate("staff");
            return locations;
        });
        this.getLastSeenLocations = (startDate, endDate, businessId) => __awaiter(this, void 0, void 0, function* () {
            const startOfStartDate = new Date(startDate);
            const endOfEndDate = new Date(endDate);
            const pipeline = [
                {
                    $match: {
                        date: {
                            $gte: startOfStartDate,
                            $lte: endOfEndDate,
                        },
                    },
                },
                {
                    $sort: { date: -1 },
                },
                {
                    $group: {
                        _id: "$staff",
                        lastLocation: { $first: "$$ROOT" },
                    },
                },
                {
                    $replaceRoot: { newRoot: "$lastLocation" },
                },
                {
                    $lookup: {
                        from: "staffs",
                        localField: "staff",
                        foreignField: "_id",
                        as: "staff",
                    },
                },
                {
                    $unwind: {
                        path: "$staff",
                        preserveNullAndEmptyArrays: false,
                    },
                },
            ];
            // Add business filter if provided
            if (businessId) {
                pipeline.push({
                    $match: {
                        "staff.business": businessId,
                    },
                });
            }
            pipeline.push({
                $project: {
                    _id: 1,
                    latitude: 1,
                    longitude: 1,
                    date: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    "staff._id": 1,
                    "staff.name": 1,
                    "staff.email": 1,
                },
            }, {
                $sort: { "staff.name": 1 },
            });
            const lastSeenLocations = yield LocationData_1.LocationData.aggregate(pipeline);
            return lastSeenLocations;
        });
        // Get locations with mocked GPS detected
        this.getMockedLocations = (startDate, endDate, businessId) => __awaiter(this, void 0, void 0, function* () {
            const pipeline = [
                {
                    $match: {
                        date: {
                            $gte: startDate,
                            $lte: endDate,
                        },
                        mocked: true,
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
                    latitude: 1,
                    longitude: 1,
                    date: 1,
                    mocked: 1,
                    accuracy: 1,
                    altitude: 1,
                    createdAt: 1,
                },
            }, {
                $sort: { date: -1 },
            });
            const mockedLocations = yield LocationData_1.LocationData.aggregate(pipeline);
            return mockedLocations;
        });
        // Get summary of mocked GPS by staff
        this.getMockedGPSSummary = (startDate, endDate, businessId) => __awaiter(this, void 0, void 0, function* () {
            const pipeline = [
                {
                    $match: {
                        date: {
                            $gte: startDate,
                            $lte: endDate,
                        },
                        mocked: true,
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
                    _id: "$staff",
                    staffName: { $first: "$staffInfo.name" },
                    staffEmail: { $first: "$staffInfo.email" },
                    staffType: { $first: "$staffInfo.staffType" },
                    mockedCount: { $sum: 1 },
                    firstDetected: { $min: "$date" },
                    lastDetected: { $max: "$date" },
                    locations: {
                        $push: {
                            latitude: "$latitude",
                            longitude: "$longitude",
                            date: "$date",
                        },
                    },
                },
            }, {
                $sort: { mockedCount: -1 },
            });
            const summary = yield LocationData_1.LocationData.aggregate(pipeline);
            return summary;
        });
        // Get location tracking status for all active staff
        this.getLocationTrackingStatus = (businessId) => __awaiter(this, void 0, void 0, function* () {
            const now = new Date();
            const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
            const threeMinutesAgo = new Date(now.getTime() - 3 * 60 * 1000);
            const pipeline = [
                {
                    $match: {
                        staffType: "outside-staff",
                    },
                },
            ];
            if (businessId) {
                pipeline.push({
                    $match: {
                        business: businessId,
                    },
                });
            }
            pipeline.push({
                $lookup: {
                    from: "locationdatas",
                    let: { staffId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$staff", "$$staffId"] },
                                        { $gte: ["$date", tenMinutesAgo] },
                                    ],
                                },
                            },
                        },
                        { $sort: { date: -1 } },
                        { $limit: 1 },
                    ],
                    as: "lastLocation",
                },
            }, {
                $lookup: {
                    from: "failedlocationattempts",
                    let: { staffId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$staff", "$$staffId"] },
                                        { $gte: ["$attemptTime", tenMinutesAgo] },
                                    ],
                                },
                            },
                        },
                        { $sort: { attemptTime: -1 } },
                        { $limit: 1 },
                    ],
                    as: "lastFailedAttempt",
                },
            }, {
                $addFields: {
                    lastLocation: { $arrayElemAt: ["$lastLocation", 0] },
                    lastFailedAttempt: { $arrayElemAt: ["$lastFailedAttempt", 0] },
                    status: {
                        $cond: {
                            if: {
                                $gte: [
                                    { $ifNull: ["$lastLocation.date", new Date(0)] },
                                    threeMinutesAgo,
                                ],
                            },
                            then: "tracking",
                            else: {
                                $cond: {
                                    if: {
                                        $gte: [
                                            {
                                                $ifNull: [
                                                    "$lastFailedAttempt.attemptTime",
                                                    new Date(0),
                                                ],
                                            },
                                            threeMinutesAgo,
                                        ],
                                    },
                                    then: "location_disabled",
                                    else: "no_data",
                                },
                            },
                        },
                    },
                },
            }, {
                $project: {
                    _id: 1,
                    name: 1,
                    email: 1,
                    staffType: 1,
                    status: 1,
                    lastLocationDate: "$lastLocation.date",
                    lastLocationLat: "$lastLocation.latitude",
                    lastLocationLng: "$lastLocation.longitude",
                    lastLocationMocked: "$lastLocation.mocked",
                    lastFailedReason: "$lastFailedAttempt.reason",
                    lastFailedTime: "$lastFailedAttempt.attemptTime",
                },
            }, {
                $sort: { name: 1 },
            });
            const trackingStatus = yield LocationData_1.LocationData.db
                .collection("staffs")
                .aggregate(pipeline)
                .toArray();
            return trackingStatus;
        });
    }
}
exports.default = LocationDataService;
