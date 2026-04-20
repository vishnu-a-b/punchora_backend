import ListFilterData from "../../../interfaces/ListFilterData";
import { FailedLocationAttempt } from "../models/FailedLocationAttempt";

export default class FailedLocationAttemptService {
  list = async ({ limit, skip, filterQuery, sort }: ListFilterData) => {
    limit = limit ? limit : 10;
    skip = skip ? skip : 0;

    const attempts = await FailedLocationAttempt.find(filterQuery)
      .sort(sort)
      .limit(limit)
      .skip(skip)
      .populate("staff");
    const total = await FailedLocationAttempt.countDocuments(filterQuery);
    return {
      total,
      limit,
      skip,
      items: attempts,
    };
  };

  create = async (body: any) => {
    return await FailedLocationAttempt.create(body);
  };

  findOne = async (id: string) => {
    return await FailedLocationAttempt.findById(id);
  };

  update = async ({ id, body }: any) => {
    return await FailedLocationAttempt.findByIdAndUpdate(id, body);
  };

  delete = async (id: any) => {
    return await FailedLocationAttempt.findByIdAndDelete(id);
  };

  insertMany = async (data: any[]) => {
    return await FailedLocationAttempt.insertMany(data);
  };

  filterByDate = async (
    startDate: Date,
    endDate: Date,
    staffId: string | undefined
  ) => {
    const startOfStartDate = new Date(startDate);
    const endOfEndDate = new Date(endDate);
    let matchQuery: any = {
      attemptTime: {
        $gte: startOfStartDate,
        $lte: endOfEndDate,
      },
    };
    if (staffId) {
      matchQuery.staff = staffId;
    }
    const attempts = await FailedLocationAttempt.aggregate([
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
  };

  // Get staff with location disabled (failed attempts in last X minutes)
  getStaffWithLocationDisabled = async (
    businessId?: string,
    lastMinutes: number = 10
  ) => {
    const timeThreshold = new Date(Date.now() - lastMinutes * 60 * 1000);

    const pipeline: any[] = [
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

    const staffWithIssues = await FailedLocationAttempt.aggregate(pipeline);
    return staffWithIssues;
  };

  // Get summary statistics for location failures
  getLocationFailureSummary = async (
    startDate: Date,
    endDate: Date,
    businessId?: string
  ) => {
    const pipeline: any[] = [
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

    pipeline.push(
      {
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
      },
      {
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
      },
      {
        $sort: { totalFailures: -1 },
      }
    );

    const summary = await FailedLocationAttempt.aggregate(pipeline);
    return summary;
  };
}
