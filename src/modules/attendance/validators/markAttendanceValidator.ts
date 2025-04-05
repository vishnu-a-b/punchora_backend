import { body } from "express-validator";
import { Staff } from "../../staff/models/Staff";

export const markAttendanceValidator = [
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
  body("date").isISO8601(),
  body("checkInTime").optional().isISO8601(),
  body("checkOutTime").optional().isISO8601(),
  body("checkInLocation").optional(),
  body("checkInLocation.latitude").optional().isNumeric(),
  body("checkInLocation.longitude").optional().isNumeric(),
  body("checkOutLocation").optional(),
  body("checkOutLocation.latitude").optional().isNumeric(),
  body("checkOutLocation.longitude").optional().isNumeric(),
];
