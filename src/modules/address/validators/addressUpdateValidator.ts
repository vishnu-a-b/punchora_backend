import { body } from "express-validator";
import CustomValidators from "../../base/customValidators/customValidators";

export const addressUpdateValidator = [
  body("address")
    .optional()
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
    .optional()
    .custom(CustomValidators.isNotEmptyAndString)
    .isLength({ max: 10 }),
  body("latitude").optional().isNumeric().bail().isLength({ max: 20 }),
  body("longitude").optional().isNumeric().bail().isLength({ max: 20 }),
];
