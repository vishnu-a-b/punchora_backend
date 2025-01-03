import express, { Request, Response, NextFunction } from "express";
import UserController from "../controllers/UserController";
import { userCreateValidator } from "../validators/UserCreateValidator";
import { authenticateUser } from "../../authentication/middlewares/authenticateUser";
import authorizeUser from "../../../middlewares/authorizeUser";
import multer from "multer";
import { multerFileStorage } from "../../../multer/multerConfig";
import { multerImageFilter } from "../../../multer/multerFileFilters";
import BadRequestError from "../../../errors/errorTypes/BadRequestError";
import setFilterParams from "../../../middlewares/setFilterParams";
import { userFilterFields } from "../models/User";
import { userCreateDoc } from "../docs/userCreateDoc";
import { userListDoc } from "../docs/userListDoc";
import { userDetailsDoc } from "../docs/userDetailsDoc";
import { userUpdateDoc } from "../docs/userUpdateDoc";
import { userUpdateValidator } from "../validators/UserUpdateValidator";
import { userDeleteDoc } from "../docs/userDeleteDoc";
const router = express.Router();

const controller = new UserController();

router.use(authenticateUser);

const upload = multer({
  storage: multerFileStorage,
  fileFilter: multerImageFilter,
}).any();

const uploadMethod = (req: Request, res: Response, next: NextFunction) => {
  return upload(req, res, function (err) {
    if (err) {
      return next(new BadRequestError({ error: "invalid file type" }));
    }
    next();
  });
};

router.get(
  "/",
  setFilterParams(userFilterFields),
  authorizeUser({ allowedRoles: [] }),
  userListDoc,
  controller.getList
);

router.get(
  "/filter-by-role/:slug",
  setFilterParams(userFilterFields),
  authorizeUser({ allowedRoles: [] }),
  userListDoc,
  controller.filterByRole
);
router.post(
  "/",
  uploadMethod,
  authorizeUser({ allowedRoles: [] }),
  userCreateValidator,
  userCreateDoc,
  controller.create
);
router.get(
  "/:id",
  authorizeUser({ allowedRoles: [] }),
  userDetailsDoc,
  controller.getOne
);
router.put(
  "/:id",
  authorizeUser({ allowedRoles: [] }),
  userUpdateDoc,
  uploadMethod,
  userUpdateValidator,
  controller.update
);

router.delete(
  "/:id",
  authenticateUser,
  userDeleteDoc,
  authorizeUser({ allowedRoles: [] }),
  controller.delete
);

export default router;
