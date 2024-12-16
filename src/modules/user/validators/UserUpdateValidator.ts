import { body } from "express-validator";
import CustomValidators from "../../base/customValidators/customValidators";
import { Genders } from "../../base/enums/genders";
import { MaritalStatuses } from "../../base/enums/maritalStatuses";
import { Role } from "../../role/models/Role";
import PasswordValidator from "../../authentication/utils/validatePassword";

export const userUpdateValidator = [
  body("name")
    .optional()
    .custom(CustomValidators.isNotEmptyAndString)
    .bail()
    .isLength({ max: 100 }),
  body("password")
    .optional()
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
  body("email").optional().isEmail().isLength({ max: 100 }),
  body("dateOfBirth").optional().isISO8601(),
  body("gender").optional().isIn(Object.values(Genders)),
  body("maritalStatus").optional().isIn(Object.values(MaritalStatuses)),
  body("roles")
    .optional()
    .isArray()
    .bail()
    .custom(async (roles: any[]) => {
      const areAllStrings = roles.every(function (item) {
        return typeof item === "string";
      });
      if (!areAllStrings) {
        return Promise.reject("roles should be an array of ids");
      }
      const existingRoles = await Role.find({ _id: { $in: roles } });
      if (existingRoles.length !== roles.length) {
        return Promise.reject("invalid role ids provided");
      }
    }),
  body("isActive").optional().isBoolean(),
];
