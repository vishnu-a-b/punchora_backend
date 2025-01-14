import { body } from "express-validator";

export const markAttendanceViaPhotoValidator = [
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
