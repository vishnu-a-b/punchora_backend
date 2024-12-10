import express, { Request, Response, NextFunction } from "express";
import { authenticateUser } from "../../authentication/middlewares/authenticateUser";
import HospitalController from "../controllers/HospitalController";
import { hospitalCreateValidator } from "../validators/hospitalCreateValidator";
import authorizeUser from "../../../middlewares/authorizeUser";
import multer from "multer";
import { multerFileStorage } from "../../../multer/multerConfig";
import { multerImageFilter } from "../../../multer/multerFileFilters";
import BadRequestError from "../../../errors/errorTypes/BadRequestError";
import setFilterParams from "../../../middlewares/setFilterParams";
import { hospitalFilterFields } from "../models/Hospital";
import { hospitalCreateDoc } from "../docs/hospitalCreateDoc";
import { hospitalListDoc } from "../docs/hospitalListDoc";
import { hospitalDeleteDoc } from "../docs/hospitalDeleteDoc";
import { hospitalUpdateDoc } from "../docs/hospitalUpdateDoc";
import { hospitalDetailsDoc } from "../docs/hospitalDetailsDoc";
import { vcLinkUpdateDoc } from "../docs/vcLinkUpdateDoc";
import { hospitalCountDoc } from "../docs/hospitalCountDoc";

const router = express.Router();
const controller = new HospitalController();

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
  hospitalListDoc,
  setFilterParams(hospitalFilterFields),
  controller.get
);

router.get(
  "/count-documents",
  hospitalCountDoc,
  controller.countTotalDocuments
);

router.get("/:id", hospitalDetailsDoc, controller.getOne);

router.post(
  "/",
  authorization,
  hospitalCreateDoc,
  uploadMethod,
  hospitalCreateValidator,
  controller.create
);
router.put(
  "/:id",
  authorization,
  hospitalUpdateDoc,
  uploadMethod,
  hospitalCreateValidator,
  controller.update
);
router.put(
  "/vcLink/:id",
  authorization,
  vcLinkUpdateDoc,
  controller.updateVcLink
);
router.delete("/:id", hospitalDeleteDoc, authorization, controller.delete);

export default router;
