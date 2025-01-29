import ListFilterData from "../../../interfaces/ListFilterData";
import { LeaveStatus } from "../../base/enums/leaveStatus";
import { LeaveRequest } from "../models/LeaveRequest";

interface CreateRequestData {
  reason?: string;
  staff: string;
  department: string;
  leaveDates: string[];
}

interface ValidateRequestData {
  status: LeaveStatus;
  remarks?: string;
}

export default class LeaveRequestService {
  createLeaveRequest = async (data: CreateRequestData) => {
    return await LeaveRequest.create(data);
  };

  update = async ({ id, data }: any) => {
    return await LeaveRequest.findByIdAndUpdate(id, data);
  };

  validateLeaveRequest = async ({
    id,
    data,
  }: {
    id: string;
    data: ValidateRequestData;
  }) => {
    return await LeaveRequest.findByIdAndUpdate(id, data);
  };

  find = async ({ limit, skip, filterQuery, sort }: ListFilterData) => {
    limit = limit ? limit : 10;
    skip = skip ? skip : 0;

    const requests = await LeaveRequest.find(filterQuery)
      .populate(["staff", "department"])
      .sort(sort)
      .limit(limit)
      .skip(skip);
    const total = await LeaveRequest.countDocuments(filterQuery);
    return {
      total,
      limit,
      skip,
      items: requests,
    };
  };
  delete = async (id: any) => {
    return await LeaveRequest.findByIdAndDelete(id);
  };
}
