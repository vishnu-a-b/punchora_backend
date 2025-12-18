import express from "express";
import { authenticateUser } from "../../authentication/middlewares/authenticateUser";
import FailedLocationAttemptController from "../controllers/FailedLocationAttemptController";

const router = express.Router();
const controller = new FailedLocationAttemptController();

router.get(
  "/by-date",
  authenticateUser,
  controller.filterByDate
);
router.get("/", authenticateUser, controller.list);
router.post(
  "/bulk",
  authenticateUser,
  controller.insertMany
);

router.post(
  "/",
  authenticateUser,
  controller.create
);

router.get("/:id", authenticateUser, controller.getOne);
router.put("/:id", authenticateUser, controller.update);
router.delete("/:id", authenticateUser, controller.delete);

export default router;
