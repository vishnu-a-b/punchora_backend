import { body } from "express-validator";
import { ActivityType } from "../models/Activity";

export const startActivityValidator = [
  body("type")
    .isIn(Object.values(ActivityType))
    .withMessage("Invalid activity type"),
  body("location")
    .optional()
    .isString()
    .withMessage("Location must be a string"),
  body("reason")
    .optional()
    .isString()
    .withMessage("Reason must be a string"),
  body("meterReadingStart")
    .optional()
    .isNumeric()
    .withMessage("Meter reading must be a number"),
  body("gpsLocation.latitude")
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage("Invalid latitude"),
  body("gpsLocation.longitude")
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage("Invalid longitude")
];

export const endActivityValidator = [
  body("meterReadingEnd")
    .optional()
    .isNumeric()
    .withMessage("Meter reading must be a number")
];
