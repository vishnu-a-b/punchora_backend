import { body } from "express-validator";
import CustomValidators from "../../base/customValidators/customValidators";
import { Staff } from "../../staff/models/Staff";
import { Department } from "../../department/models/Department";

export const leaveRequestCreateValidator = [
  body("reason").custom(CustomValidators.isNotEmptyAndString),
  body("remarks").optional().custom(CustomValidators.isNotEmptyAndString),
  body("staff").custom(async (staffId: any) => {
    try {
      const staff = await Staff.findById(staffId);
      if (!staff) {
        return Promise.reject("staff not found");
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
  body("leaveDates")
    .isArray({ min: 1 })
    .withMessage("Leave dates must be an array with at least one date.")
    .custom((dates) => {
      return dates.every((date: string) => !isNaN(new Date(date).getTime()));
    })
    .withMessage("Each leave date must be a valid date."),
];
