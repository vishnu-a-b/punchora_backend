"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.multerFileStorageForAttendance = exports.multerFileStorageForUserData = exports.multerFileStorage = void 0;
const multer_1 = __importDefault(require("multer"));
exports.multerFileStorage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    },
});
exports.multerFileStorageForUserData = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/users/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    },
});
exports.multerFileStorageForAttendance = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/attendance/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    },
});
