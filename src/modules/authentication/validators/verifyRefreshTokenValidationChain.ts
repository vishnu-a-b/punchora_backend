import { body } from "express-validator";
import customValidators from "../../base/customValidators/customValidators";

export const verifyRefreshTokenValidationChain = [
  body("refreshToken").custom(customValidators.isNotEmptyAndString),
];
