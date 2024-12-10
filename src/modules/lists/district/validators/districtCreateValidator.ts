import { body } from "express-validator";
import CustomValidators from "../../../base/customValidators/customValidators";

export const districtCreateValidator = [
  body("name")
    .custom(CustomValidators.isNotEmptyAndString)
    .isLength({ max: 50 }),
];
