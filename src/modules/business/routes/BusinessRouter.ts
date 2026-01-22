import express, { Request, Response, NextFunction } from "express";
import { authenticateUser } from "../../authentication/middlewares/authenticateUser";
import { checkRole } from "../../../middlewares/checkPermission";
import { UserRole } from "../../../constants/roles";
import { validateBusinessParam, applyBusinessScoping } from "../../../middlewares/businessScopingValidator";
import multer from "multer";
import { multerFileStorage } from "../../../multer/multerConfig";
import { multerImageFilter } from "../../../multer/multerFileFilters";
import BadRequestError from "../../../errors/errorTypes/BadRequestError";
import setFilterParams from "../../../middlewares/setFilterParams";
import { vcLinkUpdateDoc } from "../docs/vcLinkUpdateDoc";
import BusinessController from "../controllers/BusinessController";
import { businessListDoc } from "../docs/businessListDoc";
import { businessFilterFields } from "../models/Business";
import { businessCountDoc } from "../docs/businessCountDoc";
import { businessDetailsDoc } from "../docs/businessDetailsDoc";
import { businessCreateDoc } from "../docs/businessCreateDoc";
import { businessCreateValidator } from "../validators/businessCreateValidator";
import { businessUpdateDoc } from "../docs/businessUpdateDoc";
import { businessDeleteDoc } from "../docs/businessDeleteDoc";
import { businessListofAdminDoc } from "../docs/businessListofAdminDoc";

const { SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN } = UserRole;

const router = express.Router();
const controller = new BusinessController();

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

// Get all businesses - Super admin sees all, business admin sees only theirs
router.get(
  "/",
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]),
  applyBusinessScoping,
  businessListDoc,
  setFilterParams(businessFilterFields),
  controller.get
);

// Count businesses - Admin only
router.get(
  "/count-documents",
  checkRole([SUPER_ADMIN]),
  businessCountDoc,
  controller.countTotalDocuments
);

// Get one business - Admin can only access their own business
router.get(
  "/:id",
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]),
  validateBusinessParam,
  businessDetailsDoc,
  controller.getOne
);

// Create business - Super admin only
router.post(
  "/",
  checkRole([SUPER_ADMIN]),
  businessCreateDoc,
  uploadMethod,
  businessCreateValidator,
  controller.create
);

// Update business - Super admin or business admin (only their own)
router.put(
  "/:id",
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN]),
  validateBusinessParam,
  businessUpdateDoc,
  uploadMethod,
  businessCreateValidator,
  controller.update
);

// Update VC link - Admin only (business admin can update their own)
router.put(
  "/vcLink/:id",
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN]),
  validateBusinessParam,
  vcLinkUpdateDoc,
  controller.updateVcLink
);

// Delete business - Super admin only
router.delete(
  "/:id",
  checkRole([SUPER_ADMIN]),
  businessDeleteDoc,
  controller.delete
);

// Get businesses by admin - Business admin gets their business
router.get(
  "/admin/:id",
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN]),
  validateBusinessParam,
  businessListofAdminDoc,
  controller.filterByAdmin
);

export default router;
