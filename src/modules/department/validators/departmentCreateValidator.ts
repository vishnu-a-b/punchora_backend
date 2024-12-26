import { body } from "express-validator";
import CustomValidators from "../../base/customValidators/customValidators";
import { User } from "../../user/models/User";
import { Business } from "../../business/models/Business";

export const departmentCreateValidator = [
  body("name")
    .custom(CustomValidators.isNotEmptyAndString)
    .isLength({ max: 50 }),

  body("business").custom(async (businessId: any) => {
    try {
      const business = await Business.findById(businessId);
      if (!business) {
        return Promise.reject("business not found");
      }
      return Promise.resolve();
    } catch (_) {
      return Promise.reject();
    }
  }),

  body("head").custom(async (headId: any) => {
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
