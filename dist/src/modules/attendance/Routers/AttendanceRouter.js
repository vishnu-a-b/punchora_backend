"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authenticateUser_1 = require("../../authentication/middlewares/authenticateUser");
const AttendanceController_1 = __importDefault(require("../controllers/AttendanceController"));
const attendanceListDoc_1 = require("../docs/attendanceListDoc");
const markAttendanceDoc_1 = require("../docs/markAttendanceDoc");
const markAttendanceValidator_1 = require("../validators/markAttendanceValidator");
const markAttendanceViaPhotoValidator_1 = require("../validators/markAttendanceViaPhotoValidator");
const markAttendanceViaImageDoc_1 = require("../docs/markAttendanceViaImageDoc");
const multer_1 = __importDefault(require("multer"));
const multerConfig_1 = require("../../../multer/multerConfig");
const multerFileFilters_1 = require("../../../multer/multerFileFilters");
const BadRequestError_1 = __importDefault(require("../../../errors/errorTypes/BadRequestError"));
const authorizeUser_1 = __importDefault(require("../../../middlewares/authorizeUser"));
const attendanceCreateValidator_1 = require("../validators/attendanceCreateValidator");
const createAttendanceDoc_1 = require("../docs/createAttendanceDoc");
const attendanceUpdateValidator_1 = require("../validators/attendanceUpdateValidator");
const updateAttendanceDoc_1 = require("../docs/updateAttendanceDoc");
const router = express_1.default.Router();
const controller = new AttendanceController_1.default();
const singleUpload = (0, multer_1.default)({
    storage: multerConfig_1.multerFileStorageForAttendance,
    fileFilter: multerFileFilters_1.multerImageFilter,
}).single("photo");
const singleUploadMethod = (req, res, next) => {
    console.log("=== MULTER UPLOAD MIDDLEWARE ===");
    console.log("Content-Type:", req.headers['content-type']);
    console.log("Request method:", req.method);
    console.log("Request URL:", req.url);
    return singleUpload(req, res, function (err) {
        if (err) {
            console.error("Multer error:", err);
            return next(new BadRequestError_1.default({ error: "invalid file type" }));
        }
        console.log("Multer success - File uploaded:", req.file ? req.file.filename : "NO FILE");
        next();
    });
};
const multiUpload = (0, multer_1.default)({
    storage: multerConfig_1.multerFileStorageForAttendance,
    fileFilter: multerFileFilters_1.multerImageFilter,
}).fields([
    { name: "checkInPhoto", maxCount: 1 },
    { name: "checkOutPhoto", maxCount: 1 },
]);
const multiUploadMethod = (req, res, next) => {
    return multiUpload(req, res, function (err) {
        if (err) {
            return next(new BadRequestError_1.default({ error: "invalid file type" }));
        }
        next();
    });
};
router.post("/", multiUploadMethod, authenticateUser_1.authenticateUser, (0, authorizeUser_1.default)({ allowedRoles: [] }), attendanceCreateValidator_1.attendanceCreateValidator, createAttendanceDoc_1.createAttendanceDoc, controller.create);
router.get("/all-staffs", authenticateUser_1.authenticateUser, (0, authorizeUser_1.default)({ allowedRoles: [] }), attendanceListDoc_1.attendanceListDoc, controller.getDatewiseAttendanceForAllStaffs);
router.get("/:id", authenticateUser_1.authenticateUser, attendanceListDoc_1.attendanceListDoc, controller.getAttendanceForStaff);
router.post("/mark", (req, res, next) => {
    console.log("=== /mark ROUTE HIT ===");
    console.log("Headers:", req.headers);
    next();
}, authenticateUser_1.authenticateUser, markAttendanceDoc_1.markAttendanceDoc, singleUploadMethod, markAttendanceValidator_1.markAttendanceValidator, controller.markAttendance);
router.post("/mark-via-recogntion", markAttendanceViaImageDoc_1.markAttendanceViaImageDoc, singleUploadMethod, markAttendanceViaPhotoValidator_1.markAttendanceViaPhotoValidator, controller.markAttendanceViaRecognition);
router.put("/:id", multiUploadMethod, authenticateUser_1.authenticateUser, (0, authorizeUser_1.default)({ allowedRoles: [] }), attendanceUpdateValidator_1.attendanceUpdateValidator, updateAttendanceDoc_1.updateAttendanceDoc, controller.update);
router.delete("/:id", authenticateUser_1.authenticateUser, controller.delete);
exports.default = router;
