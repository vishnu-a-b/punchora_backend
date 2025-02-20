import { body } from "express-validator";
import { Staff } from "../../staff/models/Staff";

export const createLocationDataValidator = [
  body("staff").custom(async (staffId: any) => {
    console.log("staff id in validator");
    console.log(staffId);
    try {
      const staff = await Staff.findById(staffId);
      console.log(staff);
      if (!staff) {
        return Promise.reject("staff not found");
      }
      return Promise.resolve();
    } catch (_) {
      return Promise.reject();
    }
  }),
  body("latitude").optional().isNumeric(),
  body("longitude").optional().isNumeric(),
];
