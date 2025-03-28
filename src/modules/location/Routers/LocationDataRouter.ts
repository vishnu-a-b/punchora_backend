import express from "express";
import { authenticateUser } from "../../authentication/middlewares/authenticateUser";
import LocationDataController from "../controllers/LocationDataController";
import { locationDataListDoc } from "../docs/locationDataListDoc";
import { locationDataCreateDoc } from "../docs/locationDataCreateDoc";
import { createLocationDataValidator } from "../validators/createLocationDataValidator";

const router = express.Router();
const controller = new LocationDataController();

router.get(
  "/by-date",
  authenticateUser,
  locationDataListDoc,
  controller.filterByDate
);
router.get("/:id", authenticateUser, locationDataListDoc, controller.list);
router.post(
  "/bulk",
  authenticateUser,
  locationDataCreateDoc,
  controller.insertMany
);

router.post(
  "/",
  authenticateUser,
  locationDataCreateDoc,
  createLocationDataValidator,
  controller.create
);

export default router;
