import { body } from "express-validator";
import { Role } from "../models/Role";
import CustomValidators from "../../base/customValidators/customValidators";

export const roleCreateValidator = [
  body("title")
    .custom(CustomValidators.isNotEmptyAndString)
    .isLength({ max: 50 }),
  body("slug")
    .custom(CustomValidators.isNotEmptyAndString)
    .isLength({ max: 50 })
    .custom(async (slug: string) => {
      try {
        const role = await Role.findOne({ slug: slug });
        if (role) {
          return Promise.reject(`Role with slug ${slug} already exists`);
        }
        return Promise.resolve();
      } catch (error: any) {
        return Promise.reject(error.message);
      }
    }),
];
