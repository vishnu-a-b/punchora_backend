import { body } from "express-validator";
import CustomValidators from "../../base/customValidators/customValidators";

export const addressCreateValidator = [
  body("address")
    .custom(CustomValidators.isNotEmptyAndString)
    .isLength({ max: 200 }),
  body("taluk")
    .optional()
    .custom(CustomValidators.isNotEmptyAndString)
    .isLength({ max: 50 }),
  body("district")
    .optional()
    .custom(CustomValidators.isNotEmptyAndString)
    .isLength({ max: 50 }),
  body("pinCode")
    .custom(CustomValidators.isNotEmptyAndString)
    .isLength({ max: 10 }),
  body("latitude").isNumeric().bail().isLength({ max: 20 }),
  body("longitude").isNumeric().bail().isLength({ max: 20 }),
];
