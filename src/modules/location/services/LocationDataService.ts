import ListFilterData from "../../../interfaces/ListFilterData";
import { LocationData } from "../models/LocationData";

export default class LocationDataService {
  list = async ({ limit, skip, filterQuery, sort }: ListFilterData) => {
    limit = limit ? limit : 10;
    skip = skip ? skip : 0;

    const locationDatas = await LocationData.find(filterQuery)
      .sort(sort)
      .limit(limit)
      .skip(skip);
    const total = await LocationData.countDocuments(filterQuery);
    return {
      total,
      limit,
      skip,
      items: locationDatas,
    };
  };
  create = async (body: any) => {
    return await LocationData.create(body);
  };

  findOne = async (id: string) => {
    return await LocationData.findById(id);
  };

  update = async ({ id, body }: any) => {
    return await LocationData.findByIdAndUpdate(id, body);
  };

  delete = async (id: any) => {
    return await LocationData.findByIdAndDelete(id);
  };

  insertMany = async (data: any[]) => {
    return await LocationData.insertMany(data);
  };
  filterByDate = async (
    startDate: Date,
    endDate: Date,
    staffId: string | undefined
  ) => {
    const startOfStartDate = new Date(startDate);
    const endOfEndDate = new Date(endDate);
    let query: any = {
      date: {
        $gte: startOfStartDate,
        $lte: endOfEndDate,
      },
    };
    if (staffId) {
      query.staff = staffId;
    }
    const locations = await LocationData.find(query).populate("staff");
    return locations;
  };

  getLastSeenLocations = async (
    startDate: Date,
    endDate: Date,
    businessId?: string
  ) => {
    const startOfStartDate = new Date(startDate);
    const endOfEndDate = new Date(endDate);

    const pipeline: any[] = [
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

    pipeline.push(
      {
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
      },
      {
        $sort: { "staff.name": 1 },
      }
    );

    const lastSeenLocations = await LocationData.aggregate(pipeline);
    return lastSeenLocations;
  };

  // Get locations with mocked GPS detected
  getMockedLocations = async (
    startDate: Date,
    endDate: Date,
    businessId?: string
  ) => {
    const pipeline: any[] = [
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

    pipeline.push(
      {
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
      },
      {
        $sort: { date: -1 },
      }
    );

    const mockedLocations = await LocationData.aggregate(pipeline);
    return mockedLocations;
  };

  // Get summary of mocked GPS by staff
  getMockedGPSSummary = async (
    startDate: Date,
    endDate: Date,
    businessId?: string
  ) => {
    const pipeline: any[] = [
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

    pipeline.push(
      {
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
      },
      {
        $sort: { mockedCount: -1 },
      }
    );

    const summary = await LocationData.aggregate(pipeline);
    return summary;
  };

  // Get location tracking status for all active staff
  getLocationTrackingStatus = async (businessId?: string) => {
    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
    const threeMinutesAgo = new Date(now.getTime() - 3 * 60 * 1000);

    const pipeline: any[] = [
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

    pipeline.push(
      {
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
      },
      {
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
      },
      {
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
      },
      {
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
      },
      {
        $sort: { name: 1 },
      }
    );

    const trackingStatus = await LocationData.db
      .collection("staffs")
      .aggregate(pipeline)
      .toArray();
    return trackingStatus;
  };
}
