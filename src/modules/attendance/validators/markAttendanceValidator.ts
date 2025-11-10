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
  body("checkInLocation").optional().custom((value: any) => {
    // Accept either JSON string or object
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number') {
          return true;
        }
      } catch (e) {
        throw new Error('checkInLocation must be valid JSON with latitude and longitude');
      }
    } else if (typeof value === 'object' && value.latitude && value.longitude) {
      return true;
    }
    throw new Error('checkInLocation must contain latitude and longitude');
  }),
  body("checkOutLocation").optional().custom((value: any) => {
    // Accept either JSON string or object
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number') {
          return true;
        }
      } catch (e) {
        throw new Error('checkOutLocation must be valid JSON with latitude and longitude');
      }
    } else if (typeof value === 'object' && value.latitude && value.longitude) {
      return true;
    }
    throw new Error('checkOutLocation must contain latitude and longitude');
  }),
];
