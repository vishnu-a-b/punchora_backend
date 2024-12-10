import { Speciality } from "../models/Speciality";

export default class SpecialityService {
  list = async () => {
    return await Speciality.find();
  };

  create = async ({ title, slug }: any) => {
    return await Speciality.create({ title, slug });
  };

  delete = async (id: string) => {
    return await Speciality.findByIdAndDelete(id);
  };
}
