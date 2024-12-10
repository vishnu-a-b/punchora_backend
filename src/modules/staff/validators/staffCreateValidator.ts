import { body } from "express-validator";
import CustomValidators from "../../base/customValidators/customValidators";
import { User } from "../../user/models/User";
import { Department } from "../../department/models/Department";
import { Hospital } from "../../hospital/models/Hospital";
import { StaffRoles } from "../../base/enums/staffRoles";
import { Staff } from "../models/Staff";

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
  body("hospital").custom(async (hospitalId: any) => {
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
  body("joinDate").isISO8601(),
  body("role").isIn(Object.values(StaffRoles)),
];
