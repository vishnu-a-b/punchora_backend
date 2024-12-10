import { body } from "express-validator";
import CustomValidators from "../../../base/customValidators/customValidators";
import { Speciality } from "../models/Speciality";

export const specialityCreateValidator = [
  body("title")
    .custom(CustomValidators.isNotEmptyAndString)
    .isLength({ max: 50 }),
  body("slug")
    .custom(CustomValidators.isNotEmptyAndString)
    .isLength({ max: 50 })
    .custom(async (slug: string) => {
      try {
        const speciality = await Speciality.findOne({ slug: slug });
        if (speciality) {
          return Promise.reject(`speciality with slug ${slug} already exists`);
        }
        return Promise.resolve();
      } catch (error: any) {
        return Promise.reject(error.message);
      }
    }),
];
