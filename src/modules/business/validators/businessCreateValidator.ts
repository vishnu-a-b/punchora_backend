import { body } from "express-validator";
import CustomValidators from "../../base/customValidators/customValidators";
import { Address } from "../../address/models/Address";
import { ManagementTypes } from "../../base/enums/managementTypes";

export const businessCreateValidator = [
  body("name")
    .custom(CustomValidators.isNotEmptyAndString)
    .isLength({ max: 50 }),
  body("address")
    .optional()
    .custom(async (addressId: any) => {
      try {
        const address = await Address.findById(addressId);
        if (!address) {
          return Promise.reject("address not found");
        }
        return Promise.resolve();
      } catch (_) {
        return Promise.reject();
      }
    }),
  body("managementType").optional().isIn(Object.values(ManagementTypes)),
  body("contactMobileNumbers")
    .optional()
    .isArray()
    .bail()
    .custom(async (numbers: any[]) => {
      const areAllStrings = numbers.every(function (number) {
        return typeof number === "string";
      });
      if (!areAllStrings) {
        return Promise.reject(
          "contactMobileNumbers should be an array of strings"
        );
      }
    }),
  body("contactLandlines")
    .optional()
    .isArray()
    .bail()
    .custom(async (numbers: any[]) => {
      const areAllStrings = numbers.every(function (number) {
        return typeof number === "string";
      });
      if (!areAllStrings) {
        return Promise.reject("contactLandlines should be an array of strings");
      }
    }),
];
