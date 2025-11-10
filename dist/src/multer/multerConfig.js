"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.multerFileStorageForAttendance = exports.multerFileStorageForUserData = exports.multerFileStorage = void 0;
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
// Ensure directory exists, create if it doesn't
const ensureDirectoryExists = (dirPath) => {
    if (!fs_1.default.existsSync(dirPath)) {
        fs_1.default.mkdirSync(dirPath, { recursive: true });
        console.log(`Created directory: ${dirPath}`);
    }
};
exports.multerFileStorage = multer_1.default.diskStorage({
    destination: function (_req, _file, cb) {
        const uploadPath = "public/";
        ensureDirectoryExists(uploadPath);
        cb(null, uploadPath);
    },
    filename: function (_req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    },
});
exports.multerFileStorageForUserData = multer_1.default.diskStorage({
    destination: function (_req, _file, cb) {
        const uploadPath = "public/users/";
        ensureDirectoryExists(uploadPath);
        cb(null, uploadPath);
    },
    filename: function (_req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    },
});
exports.multerFileStorageForAttendance = multer_1.default.diskStorage({
    destination: function (_req, _file, cb) {
        const uploadPath = "public/attendance/";
        ensureDirectoryExists(uploadPath);
        cb(null, uploadPath);
    },
    filename: function (_req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    },
});
