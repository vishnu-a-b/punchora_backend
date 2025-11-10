import multer from "multer";
import fs from "fs";

// Ensure directory exists, create if it doesn't
const ensureDirectoryExists = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
};

export const multerFileStorage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    const uploadPath = "public/";
    ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: function (_req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

export const multerFileStorageForUserData = multer.diskStorage({
  destination: function (_req, _file, cb) {
    const uploadPath = "public/users/";
    ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: function (_req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

export const multerFileStorageForAttendance = multer.diskStorage({
  destination: function (_req, _file, cb) {
    const uploadPath = "public/attendance/";
    ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: function (_req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
