import express, { Request, Response, NextFunction } from "express";
import { authenticateUser } from "../../authentication/middlewares/authenticateUser";
import authorizeUser from "../../../middlewares/authorizeUser";
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

const authorization = authorizeUser({
  allowedRoles: [],
});

router.get(
  "/",
  businessListDoc,
  setFilterParams(businessFilterFields),
  controller.get
);

router.get(
  "/count-documents",
  businessCountDoc,
  controller.countTotalDocuments
);

router.get("/:id", businessDetailsDoc, controller.getOne);

router.post(
  "/",
  authorization,
  businessCreateDoc,
  uploadMethod,
  businessCreateValidator,
  controller.create
);
router.put(
  "/:id",
  authorization,
  businessUpdateDoc,
  uploadMethod,
  businessCreateValidator,
  controller.update
);
router.put(
  "/vcLink/:id",
  authorization,
  vcLinkUpdateDoc,
  controller.updateVcLink
);
router.delete("/:id", businessDeleteDoc, authorization, controller.delete);

export default router;
