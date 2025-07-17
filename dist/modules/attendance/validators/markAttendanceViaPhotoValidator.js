"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAttendanceViaPhotoValidator = void 0;
const express_validator_1 = require("express-validator");
exports.markAttendanceViaPhotoValidator = [
    (0, express_validator_1.body)("location").optional(),
    (0, express_validator_1.body)("location.latitude").optional().isNumeric(),
    (0, express_validator_1.body)("location.longitude").optional().isNumeric(),
];
