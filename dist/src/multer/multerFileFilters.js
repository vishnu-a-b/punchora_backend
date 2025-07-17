"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.multerImageFilter = void 0;
const multerImageFilter = (req, file, cb) => {
    if (file.mimetype === "image/jpeg" ||
        file.mimetype === "image/jpg" ||
        file.mimetype === "image/png" ||
        file.mimetype === "application/pdf" ||
        file.mimetype === "application/octet-stream") {
        cb(null, true);
    }
    else {
        cb(new Error("only JPEG, PNG & PDF files are allowed"));
    }
};
exports.multerImageFilter = multerImageFilter;
