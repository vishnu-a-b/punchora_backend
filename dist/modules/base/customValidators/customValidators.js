"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const isString = (value) => {
    if (typeof value !== "string") {
        throw new Error("value should be a string");
    }
    return true;
};
const isEmpty = (value) => {
    if (value === null || value === "" || value === undefined) {
        throw new Error("value should not be empty");
    }
    return true;
};
const isNotEmptyAndString = (value) => {
    if (value === null || value === "" || value === undefined) {
        throw new Error("value should not be empty");
    }
    if (typeof value !== "string") {
        throw new Error("value should be a string");
    }
    return true;
};
exports.default = { isString, isEmpty, isNotEmptyAndString };
