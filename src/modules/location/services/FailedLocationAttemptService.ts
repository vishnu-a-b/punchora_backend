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
    let query: any = {
      attemptTime: {
        $gte: startOfStartDate,
        $lte: endOfEndDate,
      },
    };
    if (staffId) {
      query.staff = staffId;
    }
    const attempts = await FailedLocationAttempt.find(query).populate("staff");
    return attempts;
  };
}
