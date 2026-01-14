import express, { Request, Response, NextFunction } from "express";
import { authenticateUser } from "../../authentication/middlewares/authenticateUser";
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
import authorizeUser from "../../../middlewares/authorizeUser";
import { attendanceCreateValidator } from "../validators/attendanceCreateValidator";
import { createAttendanceDoc } from "../docs/createAttendanceDoc";
import { attendanceUpdateValidator } from "../validators/attendanceUpdateValidator";
import { updateAttendanceDoc } from "../docs/updateAttendanceDoc";

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

router.post(
  "/",
  multiUploadMethod,
  authenticateUser,
  authorizeUser({ allowedRoles: [] }),
  attendanceCreateValidator,
  createAttendanceDoc,
  controller.create
);

router.get(
  "/all-staffs",
  authenticateUser,
  authorizeUser({ allowedRoles: [] }),
  attendanceListDoc,
  controller.getDatewiseAttendanceForAllStaffs
);

router.get(
  "/:id",
  authenticateUser,
  attendanceListDoc,
  controller.getAttendanceForStaff
);

router.post(
  "/mark",
  (req: Request, res: Response, next: NextFunction) => {
    console.log("=== /mark ROUTE HIT ===");
    console.log("Headers:", req.headers);
    next();
  },
  authenticateUser,
  markAttendanceDoc,
  singleUploadMethod,
  markAttendanceValidator,
  controller.markAttendance
);

router.post(
  "/mark-admin",
  (req: Request, res: Response, next: NextFunction) => {
    console.log("=== /mark ROUTE HIT ===");
    console.log("Headers:", req.headers);
    next();
  },
  authenticateUser,
  markAttendanceDoc,
  singleUploadMethod,
  markAttendanceValidator,
  controller.markAndEditAttendance
);

router.post(
  "/mark-via-recogntion",
  markAttendanceViaImageDoc,
  singleUploadMethod,
  markAttendanceViaPhotoValidator,
  controller.markAttendanceViaRecognition
);
router.put(
  "/:id",
  multiUploadMethod,
  authenticateUser,
  authorizeUser({ allowedRoles: [] }),
  attendanceUpdateValidator,
  updateAttendanceDoc,
  controller.update
);
router.delete("/:id", authenticateUser, controller.delete);

// NEW: Routes for flagged attendance
router.get(
  "/flagged/list",
  authenticateUser,
  authorizeUser({ allowedRoles: [] }),
  controller.getFlaggedAttendance
);

router.put(
  "/flagged/:id/clear",
  authenticateUser,
  authorizeUser({ allowedRoles: [] }),
  controller.clearAttendanceFlag
);

export default router;
