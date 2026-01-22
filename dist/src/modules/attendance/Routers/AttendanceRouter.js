"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authenticateUser_1 = require("../../authentication/middlewares/authenticateUser");
const checkPermission_1 = require("../../../middlewares/checkPermission");
const roles_1 = require("../../../constants/roles");
const businessScopingValidator_1 = require("../../../middlewares/businessScopingValidator");
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
const attendanceCreateValidator_1 = require("../validators/attendanceCreateValidator");
const createAttendanceDoc_1 = require("../docs/createAttendanceDoc");
const attendanceUpdateValidator_1 = require("../validators/attendanceUpdateValidator");
const updateAttendanceDoc_1 = require("../docs/updateAttendanceDoc");
const { SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD, STAFF, CONTROL_ROOM } = roles_1.UserRole;
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
// Create attendance - Admin only
router.post("/", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]), businessScopingValidator_1.applyBusinessScoping, multiUploadMethod, attendanceCreateValidator_1.attendanceCreateValidator, createAttendanceDoc_1.createAttendanceDoc, controller.create);
// Get all staffs attendance - Admin and Department Head (with filtering)
router.get("/all-staffs", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD]), businessScopingValidator_1.applyBusinessScoping, attendanceListDoc_1.attendanceListDoc, controller.getDatewiseAttendanceForAllStaffs);
// Get attendance for specific staff - Admin, Department Head, or self
router.get("/:id", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD, STAFF]), businessScopingValidator_1.applyBusinessScoping, attendanceListDoc_1.attendanceListDoc, controller.getAttendanceForStaff);
// Mark attendance - Staff marks own attendance
router.post("/mark", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([STAFF, SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]), markAttendanceDoc_1.markAttendanceDoc, singleUploadMethod, markAttendanceValidator_1.markAttendanceValidator, controller.markAttendance);
// Mark attendance as admin - Admin can mark/edit for staff
router.post("/mark-admin", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]), businessScopingValidator_1.applyBusinessScoping, markAttendanceDoc_1.markAttendanceDoc, singleUploadMethod, markAttendanceValidator_1.markAttendanceValidator, controller.markAndEditAttendance);
// Mark attendance via face recognition - Staff or admin
router.post("/mark-via-recogntion", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([STAFF, SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]), markAttendanceViaImageDoc_1.markAttendanceViaImageDoc, singleUploadMethod, markAttendanceViaPhotoValidator_1.markAttendanceViaPhotoValidator, controller.markAttendanceViaRecognition);
// Update attendance - Admin only
router.put("/:id", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]), businessScopingValidator_1.applyBusinessScoping, multiUploadMethod, attendanceUpdateValidator_1.attendanceUpdateValidator, updateAttendanceDoc_1.updateAttendanceDoc, controller.update);
// Delete attendance - Admin only
router.delete("/:id", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]), businessScopingValidator_1.applyBusinessScoping, controller.delete);
// Get flagged attendance - Admin only
router.get("/flagged/list", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]), businessScopingValidator_1.applyBusinessScoping, controller.getFlaggedAttendance);
// Clear attendance flag - Admin only
router.put("/flagged/:id/clear", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]), businessScopingValidator_1.applyBusinessScoping, controller.clearAttendanceFlag);
/**
 * PHASE 3: Enhanced Flagging System
 */
// Flag an attendance record - Control Room, Business Admin, HR Admin
router.post("/:id/flag", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, CONTROL_ROOM, BUSINESS_ADMIN, HR_ADMIN]), businessScopingValidator_1.applyBusinessScoping, controller.flagAttendance);
// Review a flagged attendance record - Business Admin only
router.post("/:id/review", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN]), businessScopingValidator_1.applyBusinessScoping, controller.reviewFlag);
exports.default = router;
