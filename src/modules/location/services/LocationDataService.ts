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
  filterByDate = async (date: Date) => {
    const startOfStartDate = new Date(date);
    const endOfEndDate = new Date(date);
    startOfStartDate.setHours(0, 0, 0, 0);
    endOfEndDate.setHours(23, 59, 59, 999);
    const locations = await LocationData.find({
      date: {
        $gte: startOfStartDate,
        $lte: endOfEndDate,
      },
    }).populate("staff");
    return locations;
  };
}
