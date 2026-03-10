import express, { Request, Response, NextFunction } from "express";
import { authenticateUser } from "../../authentication/middlewares/authenticateUser";
import { checkRole } from "../../../middlewares/checkPermission";
import { UserRole } from "../../../constants/roles";
import { applyBusinessScoping } from "../../../middlewares/businessScopingValidator";
import AttendanceController from "../controllers/AttendanceController";
import { attendanceListDoc } from "../docs/attendanceListDoc";
import { markAttendanceDoc } from "../docs/markAttendanceDoc";
import { markAttendanceValidator } from "../validators/markAttendanceValidator";
import { markAttendanceViaPhotoValidator } from "../validators/markAttendanceViaPhotoValidator";
import { markAttendanceViaImageDoc } from "../docs/markAttendanceViaImageDoc";
import multer from "multer";
import { multerFileStorageForAttendance } from "../../../multer/multerConfig";
import { multerImageFilter } from "../../../multer/multerFileFilters";
import BadRequestError from "../../../errors/errorTypes/BadRequestError";
import { attendanceCreateValidator } from "../validators/attendanceCreateValidator";
import { createAttendanceDoc } from "../docs/createAttendanceDoc";
import { attendanceUpdateValidator } from "../validators/attendanceUpdateValidator";
import { updateAttendanceDoc } from "../docs/updateAttendanceDoc";

const { SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD, STAFF, CONTROL_ROOM } = UserRole;

const router = express.Router();
const controller = new AttendanceController();

const singleUpload = multer({
  storage: multerFileStorageForAttendance,
  fileFilter: multerImageFilter,
}).single("photo");

const singleUploadMethod = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log("=== MULTER UPLOAD MIDDLEWARE ===");
  console.log("Content-Type:", req.headers['content-type']);
  console.log("Request method:", req.method);
  console.log("Request URL:", req.url);

  return singleUpload(req, res, function (err) {
    if (err) {
      console.error("Multer error:", err);
      return next(new BadRequestError({ error: "invalid file type" }));
    }
    console.log("Multer success - File uploaded:", req.file ? req.file.filename : "NO FILE");
    next();
  });
};

const multiUpload = multer({
  storage: multerFileStorageForAttendance,
  fileFilter: multerImageFilter,
}).fields([
  { name: "checkInPhoto", maxCount: 1 },
  { name: "checkOutPhoto", maxCount: 1 },
]);

const multiUploadMethod = (req: Request, res: Response, next: NextFunction) => {
  return multiUpload(req, res, function (err) {
    if (err) {
      return next(new BadRequestError({ error: "invalid file type" }));
    }
    next();
  });
};

// Create attendance - Admin only
router.post(
  "/",
  authenticateUser,
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]),
  applyBusinessScoping,
  multiUploadMethod,
  attendanceCreateValidator,
  createAttendanceDoc,
  controller.create
);

// Get all staffs attendance - Admin and Department Head (with filtering)
router.get(
  "/all-staffs",
  authenticateUser,
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD]),
  applyBusinessScoping,
  attendanceListDoc,
  controller.getDatewiseAttendanceForAllStaffs
);

// Get attendance for specific staff - Admin, Department Head, or self
router.get(
  "/:id",
  authenticateUser,
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD, STAFF]),
  applyBusinessScoping,
  attendanceListDoc,
  controller.getAttendanceForStaff
);

// Mark attendance - Staff marks own attendance
router.post(
  "/mark",
  authenticateUser,
  checkRole([STAFF, SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]),
  markAttendanceDoc,
  singleUploadMethod,
  markAttendanceValidator,
  controller.markAttendance
);

// Mark attendance as admin - Admin can mark/edit for staff
router.post(
  "/mark-admin",
  authenticateUser,
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]),
  applyBusinessScoping,
  markAttendanceDoc,
  singleUploadMethod,
  markAttendanceValidator,
  controller.markAndEditAttendance
);

// Mark attendance via face recognition - Staff or admin
router.post(
  "/mark-via-recogntion",
  authenticateUser,
  checkRole([STAFF, SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]),
  markAttendanceViaImageDoc,
  singleUploadMethod,
  markAttendanceViaPhotoValidator,
  controller.markAttendanceViaRecognition
);

// Upload photo for own attendance record - Staff uploads photo in background
router.patch(
  "/:id/photo",
  authenticateUser,
  checkRole([STAFF, SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]),
  singleUploadMethod,
  controller.uploadAttendancePhoto
);

// Update attendance - Admin only
router.put(
  "/:id",
  authenticateUser,
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]),
  applyBusinessScoping,
  multiUploadMethod,
  attendanceUpdateValidator,
  updateAttendanceDoc,
  controller.update
);

// Delete attendance - Admin only
router.delete(
  "/:id",
  authenticateUser,
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]),
  applyBusinessScoping,
  controller.delete
);

// Get flagged attendance - Admin only
router.get(
  "/flagged/list",
  authenticateUser,
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]),
  applyBusinessScoping,
  controller.getFlaggedAttendance
);

// Clear attendance flag - Admin only
router.put(
  "/flagged/:id/clear",
  authenticateUser,
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]),
  applyBusinessScoping,
  controller.clearAttendanceFlag
);

/**
 * PHASE 3: Enhanced Flagging System
 */

// Flag an attendance record - Control Room, Business Admin, HR Admin
router.post(
  "/:id/flag",
  authenticateUser,
  checkRole([SUPER_ADMIN, CONTROL_ROOM, BUSINESS_ADMIN, HR_ADMIN]),
  applyBusinessScoping,
  controller.flagAttendance
);

// Review a flagged attendance record - Business Admin only
router.post(
  "/:id/review",
  authenticateUser,
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN]),
  applyBusinessScoping,
  controller.reviewFlag
);

export default router;
