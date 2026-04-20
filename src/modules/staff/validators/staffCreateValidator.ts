import { body } from "express-validator";
import { User } from "../../user/models/User";
import { Department } from "../../department/models/Department";
import { StaffRoles } from "../../base/enums/staffRoles";
import { Staff } from "../models/Staff";
import { Business } from "../../business/models/Business";
import { StaffTypes } from "../../base/enums/staffTypes";

export const staffCreateValidator = [
  body("user").custom(async (userId: any) => {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return Promise.reject("user not found");
      }
      const staff = await Staff.find({ user: user._id });
      if (staff && staff.length > 0) {
        return Promise.reject("there is already a staff for that userId");
      }
      return Promise.resolve();
    } catch (_) {
      return Promise.reject();
    }
  }),
  body("department").custom(async (departmentId: any) => {
    try {
      const department = await Department.findById(departmentId);
      if (!department) {
        return Promise.reject("department not found");
      }
      return Promise.resolve();
    } catch (_) {
      return Promise.reject();
    }
  }),
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
  body("joinDate").isISO8601(),
  body("role").isIn(Object.values(StaffRoles)),
  body("type").isIn(Object.values(StaffTypes)),
  body("otEnabled").optional().isBoolean(),
  body("otMultiplier").optional().isFloat({ min: 1 }),
  body("weeklyOff").optional().isIn(["weekly-off", "no-off", "night-off"]),
  body("extraOff").optional().isInt({ min: 0 }),
  body("tdsPercentage").optional().isFloat({ min: 0, max: 100 }),
  body("esiPercentage").optional().isFloat({ min: 0, max: 100 }),
  body("pfPercentage").optional().isFloat({ min: 0, max: 100 }),
];
