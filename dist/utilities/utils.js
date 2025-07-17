"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAge = void 0;
const getAge = (dateOfBirth) => {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDifference = today.getMonth() - dateOfBirth.getMonth();
    const dayDifference = today.getDate() - dateOfBirth.getDate();
    // Adjust if the current month is before the birth month, or it's the birth month but the day hasn't passed yet.
    if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)) {
        age--;
    }
    return age;
};
exports.getAge = getAge;
