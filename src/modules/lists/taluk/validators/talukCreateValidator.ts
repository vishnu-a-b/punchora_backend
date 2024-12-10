import { body } from "express-validator";
import CustomValidators from "../../../base/customValidators/customValidators";
import { District } from "../../district/models/District";

export const talukCreateValidator = [
  body("name")
    .custom(CustomValidators.isNotEmptyAndString)
    .isLength({ max: 50 }),
  body("district")
    .optional()
    .custom(async (districtId: any) => {
      try {
        const address = await District.findById(districtId);
        if (!address) {
          return Promise.reject("district not found");
        }
        return Promise.resolve();
      } catch (_) {
        return Promise.reject();
      }
    }),
];
