import { body } from "express-validator";
import { Department } from "../../department/models/Department";
import { StaffRoles } from "../../base/enums/staffRoles";
import { Business } from "../../business/models/Business";
import { StaffTypes } from "../../base/enums/staffTypes";

export const staffUpdateValidator = [
  body("department")
    .optional()
    .custom(async (departmentId: any) => {
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
  body("business")
    .optional()
    .custom(async (businessId: any) => {
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
  body("joinDate").optional().isISO8601(),
  body("role").optional().isIn(Object.values(StaffRoles)),
  body("type").optional().isIn(Object.values(StaffTypes)),
];
