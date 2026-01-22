import express, { Request, Response, NextFunction } from "express";
import UserController from "../controllers/UserController";
import { userCreateValidator } from "../validators/UserCreateValidator";
import { authenticateUser } from "../../authentication/middlewares/authenticateUser";
import { checkRole } from "../../../middlewares/checkPermission";
import { UserRole } from "../../../constants/roles";
import { applyBusinessScoping } from "../../../middlewares/businessScopingValidator";
import multer from "multer";
import { multerFileStorageForUserData } from "../../../multer/multerConfig";
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
import { updatePasswordDoc } from "../docs/updatePasswordDoc";
import { updatePasswordValidator } from "../validators/updatePasswordValidator";

const { SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN } = UserRole;

const router = express.Router();

const controller = new UserController();

router.use(authenticateUser);

const multiUpload = multer({
  storage: multerFileStorageForUserData,
  fileFilter: multerImageFilter,
}).fields([{ name: "photos" }, { name: "profilePicture", maxCount: 1 }]);

const uploadMethod = (req: Request, res: Response, next: NextFunction) => {
  return multiUpload(req, res, function (err) {
    if (err) {
      console.log("upload error", err);
      return next(new BadRequestError({ error: "invalid file type" }));
    }
    next();
  });
};

// Get all users - Admin only
router.get(
  "/",
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]),
  applyBusinessScoping,
  setFilterParams(userFilterFields),
  userListDoc,
  controller.getList
);

// Get users filtered by role - Admin only
router.get(
  "/filter-by-role/:slug",
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]),
  applyBusinessScoping,
  setFilterParams(userFilterFields),
  userListDoc,
  controller.filterByRole
);

// Create user - Admin only
router.post(
  "/",
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]),
  applyBusinessScoping,
  uploadMethod,
  userCreateValidator,
  userCreateDoc,
  controller.create
);

// Get one user - Admin only
router.get(
  "/:id",
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]),
  applyBusinessScoping,
  userDetailsDoc,
  controller.getOne
);

// Update user - Admin only
router.put(
  "/:id",
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]),
  applyBusinessScoping,
  uploadMethod,
  userUpdateDoc,
  userUpdateValidator,
  controller.update
);

// Update password - User can update own password, admins can update any
router.put(
  "/update-password/:id",
  updatePasswordDoc,
  updatePasswordValidator,
  controller.updatePassword
);

// Delete user - Admin only
router.delete(
  "/:id",
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]),
  applyBusinessScoping,
  userDeleteDoc,
  controller.delete
);

/**
 * @route PUT /users/:id/photos
 * @desc Update user photos and regenerate face descriptors
 * @access Admin only
 */
router.put(
  "/:id/photos",
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]),
  applyBusinessScoping,
  uploadMethod,
  controller.updatePhotos
);

/**
 * @route DELETE /users/:id/photos
 * @desc Delete user photos and face descriptors
 * @access Admin only
 */
router.delete(
  "/:id/photos",
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]),
  applyBusinessScoping,
  controller.deletePhotos
);

export default router;
