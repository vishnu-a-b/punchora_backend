import { body } from "express-validator";

export const markAttendanceViaPhotoValidator = [
  body("date").isISO8601(),
  body("checkInTime").optional().isISO8601(),
  body("checkOutTime").optional().isISO8601(),
];
