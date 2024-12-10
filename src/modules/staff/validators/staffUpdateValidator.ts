import { body } from "express-validator";
import { Department } from "../../department/models/Department";
import { Hospital } from "../../hospital/models/Hospital";
import { StaffRoles } from "../../base/enums/staffRoles";

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
  body("joinDate").optional().isISO8601(),
  body("role").optional().isIn(Object.values(StaffRoles)),
];
