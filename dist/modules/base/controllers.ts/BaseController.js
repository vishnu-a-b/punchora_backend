"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class BaseController {
    constructor() {
        this.sendSuccessResponse = (res, status, data) => {
            return res.status(status).json(Object.assign({ success: true }, data));
        };
        this.sendSuccessResponseList = (res, status, data) => {
            return res.status(status).json(Object.assign({ success: true }, data));
        };
    }
}
exports.default = BaseController;
