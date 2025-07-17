"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertUtcStringToLocalDate = exports.getStartAndEndofTheDay = void 0;
const getStartAndEndofTheDay = (date) => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return [start, end];
};
exports.getStartAndEndofTheDay = getStartAndEndofTheDay;
const convertUtcStringToLocalDate = (utcTime) => {
    const localDateString = new Date(utcTime).toLocaleString();
    return new Date(localDateString);
};
exports.convertUtcStringToLocalDate = convertUtcStringToLocalDate;
