import express from "express";
import RoleController from "../controllers/RoleController";
import { roleCreateValidator } from "../validators/roleCreateValidator";
import { authenticateUser } from "../../authentication/middlewares/authenticateUser";
import authorizeUser from "../../../middlewares/authorizeUser";
import { roleListDoc } from "../docs/roleListDoc";
import { roleCreateDoc } from "../docs/roleCreateDoc";
import { roleFilterFields } from "../models/Role";
import setFilterParams from "../../../middlewares/setFilterParams";
import { roleFindBySlugDoc } from "../docs/roleDetailsDoc";
const router = express.Router();
const controller = new RoleController();

router.use(authenticateUser);
router.use(authorizeUser({ allowedRoles: [] }));

router.get("/", roleListDoc, setFilterParams(roleFilterFields), controller.get);
router.get(
  "/:slug",
  roleFindBySlugDoc,
  controller.getOneBySlug
);

router.post("/", roleCreateDoc, roleCreateValidator, controller.create);

export default router;
