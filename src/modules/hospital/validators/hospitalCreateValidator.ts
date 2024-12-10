import { body } from "express-validator";
import CustomValidators from "../../base/customValidators/customValidators";
import { Address } from "../../address/models/Address";
import { ManagementTypes } from "../../base/enums/managementTypes";
import { HospitalTypes } from "../../base/enums/hospitalTypes";
import { Speciality } from "../../lists/speciality/models/Speciality";
import { TreatmentTypes } from "../../base/enums/treatmentTypes";

export const hospitalCreateValidator = [
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
  body("specialities")
    .optional()
    .isArray()
    .bail()
    .custom(async (specialities: any[]) => {
      const areAllStrings = specialities.every(function (speciality) {
        return typeof speciality === "string";
      });
      if (!areAllStrings) {
        return Promise.reject("specialities should be an array of ids");
      }
      const existingRoles = await Speciality.find({
        _id: { $in: specialities },
      });
      if (existingRoles.length !== specialities.length) {
        return Promise.reject("invalid speciality ids provided");
      }
    }),
  body("managementType").isIn(Object.values(ManagementTypes)),
  body("hospitalType").isIn(Object.values(HospitalTypes)),
  body("treatmentType").isIn(Object.values(TreatmentTypes)),
  body("numberOfBeds").isNumeric().bail().isLength({ max: 20 }),
  body("haveEmergency").optional().isBoolean(),
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
  body("isIndependent").optional().isBoolean(),
];
