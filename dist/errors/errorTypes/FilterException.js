"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class FilterException extends Error {
    constructor(error) {
        super(error);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.default = FilterException;
