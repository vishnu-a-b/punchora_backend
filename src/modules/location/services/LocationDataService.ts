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
}
