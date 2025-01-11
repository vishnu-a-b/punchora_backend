import { body } from "express-validator";

export const markAttendanceViaPhotoValidator = [
  body("date").isISO8601(),
  body("checkInTime").optional().isISO8601(),
  body("checkOutTime").optional().isISO8601(),
  body("checkInLocation").optional(),
  body("checkInLocation.latitude").isNumeric(),
  body("checkInLocation.longitude").isNumeric(),
  body("checkOutLocation").optional(),
  body("checkOutLocation.latitude").isNumeric(),
  body("checkOutLocation.longitude").isNumeric(),
];
