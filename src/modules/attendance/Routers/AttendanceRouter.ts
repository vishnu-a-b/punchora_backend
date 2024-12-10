import express from "express";
import { authenticateUser } from "../../authentication/middlewares/authenticateUser";
import AttendanceController from "../controllers/AttendanceController";
import { attendanceListDoc } from "../docs/attendanceListDoc";
import { markAttendanceDoc } from "../docs/markAttendanceDoc";
import { attendanceCreateValidator } from "../validators/attendanceCreateValidator";

const router = express.Router();
const controller = new AttendanceController();

router.use(authenticateUser);

router.get("/:id", attendanceListDoc, controller.getAttendanceForStaff);

router.post(
  "/mark",
  markAttendanceDoc,
  attendanceCreateValidator,
  controller.markAttendance
);

export default router;
