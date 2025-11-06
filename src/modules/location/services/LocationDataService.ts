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
}
