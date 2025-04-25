import multer from "multer";

export const multerFileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

export const multerFileStorageForUserData = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/users/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

export const multerFileStorageForAttendance = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/attendance/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
