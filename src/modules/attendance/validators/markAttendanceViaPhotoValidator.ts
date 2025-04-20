import { body } from "express-validator";

export const markAttendanceViaPhotoValidator = [
  body("time").isISO8601(),
  body("location").optional(),
  body("location.latitude").optional().isNumeric(),
  body("location.longitude").optional().isNumeric(),
];
