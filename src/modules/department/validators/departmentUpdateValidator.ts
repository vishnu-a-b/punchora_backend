import { body } from "express-validator";
import CustomValidators from "../../base/customValidators/customValidators";

import { User } from "../../user/models/User";
import { Hospital } from "../../hospital/models/Hospital";

export const departmentUpdateValidator = [
  body("name")
    .optional()
    .custom(CustomValidators.isNotEmptyAndString)
    .isLength({ max: 50 }),
  body("hospital")
    .optional()
    .custom(async (hospitalId: any) => {
      try {
        const hospital = await Hospital.findById(hospitalId);
        if (!hospital) {
          return Promise.reject("hospital not found");
        }
        return Promise.resolve();
      } catch (_) {
        return Promise.reject();
      }
    }),

  body("head")
    .optional()
    .custom(async (headId: any) => {
      try {
        const head = await User.findById(headId);
        if (!head) {
          return Promise.reject("user not found");
        }
        return Promise.resolve();
      } catch (_) {
        return Promise.reject();
      }
    }),
];
