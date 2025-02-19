import { body } from "express-validator";
import PasswordValidator from "../../authentication/utils/validatePassword";
import CustomValidators from "../../base/customValidators/customValidators";

export const updatePasswordValidator = [
  body("oldPassword").custom(CustomValidators.isNotEmptyAndString).bail(),

  body("newPassword")
    .custom(CustomValidators.isNotEmptyAndString)
    .bail()
    .custom((password: any) => {
      try {
        PasswordValidator.validate(password);
        return Promise.resolve();
      } catch (error: any) {
        return Promise.reject(error.message);
      }
    }),
];
