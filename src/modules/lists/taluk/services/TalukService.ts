import { Taluk } from "../models/Taluk";

export default class TalukService {
  list = async (search?: string, filter?: any, sort?: any) => {
    return await Taluk.find(filter).sort(sort);
  };

  create = async (data: any) => {
    return await Taluk.create(data);
  };

  delete = async (id: string) => {
    return await Taluk.findByIdAndDelete(id);
  };
}
