import express, { Request, Response, NextFunction } from "express";
import { authenticateUser } from "../../authentication/middlewares/authenticateUser";
import AttendanceController from "../controllers/AttendanceController";
import { attendanceListDoc } from "../docs/attendanceListDoc";
import { markAttendanceDoc } from "../docs/markAttendanceDoc";
import { markAttendanceValidator } from "../validators/markAttendanceValidator";
import { markAttendanceViaPhotoValidator } from "../validators/markAttendanceViaPhotoValidator";
import { markAttendanceViaImageDoc } from "../docs/markAttendanceViaImageDoc";
import multer from "multer";
import { multerFileStorage } from "../../../multer/multerConfig";
import { multerImageFilter } from "../../../multer/multerFileFilters";
import BadRequestError from "../../../errors/errorTypes/BadRequestError";

const router = express.Router();
const controller = new AttendanceController();

const singleUpload = multer({
  storage: multerFileStorage,
  fileFilter: multerImageFilter,
}).single("photo");

const singleUploadMethod = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  return singleUpload(req, res, function (err) {
    if (err) {
      return next(new BadRequestError({ error: "invalid file type" }));
    }
    next();
  });
};

router.get(
  "/:id",
  authenticateUser,
  attendanceListDoc,
  controller.getAttendanceForStaff
);

router.post(
  "/mark",
  authenticateUser,
  markAttendanceDoc,
  markAttendanceValidator,
  controller.markAttendance
);

router.post(
  "/mark-via-photo",
  markAttendanceViaImageDoc,
  singleUploadMethod,
  markAttendanceViaPhotoValidator,
  controller.markAttendanceViaRecognition
);

export default router;
