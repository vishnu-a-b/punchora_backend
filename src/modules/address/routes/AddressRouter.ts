import express from "express";
import { authenticateUser } from "../../authentication/middlewares/authenticateUser";
import AddressController from "../controllers/AddressController";
import { addressCreateValidator } from "../validators/addressCreateValidator";
import authorizeUser from "../../../middlewares/authorizeUser";
import setFilterParams from "../../../middlewares/setFilterParams";
import { addressFilterFields } from "../models/Address";
import { addressCreateDoc } from "../docs/addressCreateDoc";
import { addressListDoc } from "../docs/addressListDoc";
import { addressDetailsDoc } from "../docs/addressDetailsDoc";
import { addressUpdateValidator } from "../validators/addressUpdateValidator";
import { addressUpdateDoc } from "../docs/addressUpdateDoc";
import { addressDeletesDoc } from "../docs/addressDeleteDoc";
const router = express.Router();
const controller = new AddressController();

router.use(authenticateUser);

router.get(
  "/",
  authorizeUser({
    allowedRoles: [],
  }),
  setFilterParams(addressFilterFields),
  addressListDoc,
  controller.list
);
router.post("/", addressCreateValidator, addressCreateDoc, controller.create);
router.get("/:id", addressDetailsDoc, controller.getOne);
router.put("/:id", addressUpdateValidator, addressUpdateDoc, controller.update);
router.delete("/:id", addressDeletesDoc, controller.delete);

export default router;
