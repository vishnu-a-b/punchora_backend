"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.endActivityValidator = exports.startActivityValidator = void 0;
const express_validator_1 = require("express-validator");
const Activity_1 = require("../models/Activity");
exports.startActivityValidator = [
    (0, express_validator_1.body)("type")
        .isIn(Object.values(Activity_1.ActivityType))
        .withMessage("Invalid activity type"),
    (0, express_validator_1.body)("location")
        .optional()
        .isString()
        .withMessage("Location must be a string"),
    (0, express_validator_1.body)("reason")
        .optional()
        .isString()
        .withMessage("Reason must be a string"),
    (0, express_validator_1.body)("meterReadingStart")
        .optional()
        .isNumeric()
        .withMessage("Meter reading must be a number"),
    (0, express_validator_1.body)("gpsLocation.latitude")
        .optional()
        .isFloat({ min: -90, max: 90 })
        .withMessage("Invalid latitude"),
    (0, express_validator_1.body)("gpsLocation.longitude")
        .optional()
        .isFloat({ min: -180, max: 180 })
        .withMessage("Invalid longitude")
];
exports.endActivityValidator = [
    (0, express_validator_1.body)("meterReadingEnd")
        .optional()
        .isNumeric()
        .withMessage("Meter reading must be a number")
];
