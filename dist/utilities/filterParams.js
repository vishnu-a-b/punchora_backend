"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFilterProperty = exports.FilterProperyOperators = void 0;
const FilterException_1 = __importDefault(require("../errors/errorTypes/FilterException"));
var FilterProperyOperators;
(function (FilterProperyOperators) {
    FilterProperyOperators[FilterProperyOperators["eq"] = 0] = "eq";
    FilterProperyOperators[FilterProperyOperators["not_eq"] = 1] = "not_eq";
    FilterProperyOperators[FilterProperyOperators["in"] = 2] = "in";
    FilterProperyOperators[FilterProperyOperators["cont"] = 3] = "cont";
})(FilterProperyOperators || (exports.FilterProperyOperators = FilterProperyOperators = {}));
const getFilterProperty = (value) => {
    switch (value) {
        case "eq":
            return FilterProperyOperators.eq;
        case "not_eq":
            return FilterProperyOperators.not_eq;
        case "in":
            return FilterProperyOperators.in;
        case "cont":
            return FilterProperyOperators.cont;
        default:
            throw new FilterException_1.default(`Filter option '${value}' not found`);
    }
};
exports.getFilterProperty = getFilterProperty;
