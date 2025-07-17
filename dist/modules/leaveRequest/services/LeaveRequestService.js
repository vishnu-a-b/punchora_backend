"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const LeaveRequest_1 = require("../models/LeaveRequest");
class LeaveRequestService {
    constructor() {
        this.createLeaveRequest = (data) => __awaiter(this, void 0, void 0, function* () {
            return yield LeaveRequest_1.LeaveRequest.create(data);
        });
        this.update = (_a) => __awaiter(this, [_a], void 0, function* ({ id, data }) {
            return yield LeaveRequest_1.LeaveRequest.findByIdAndUpdate(id, data);
        });
        this.validateLeaveRequest = (_a) => __awaiter(this, [_a], void 0, function* ({ id, data, }) {
            return yield LeaveRequest_1.LeaveRequest.findByIdAndUpdate(id, data);
        });
        this.find = (_a) => __awaiter(this, [_a], void 0, function* ({ limit, skip, filterQuery, sort }) {
            limit = limit ? limit : 10;
            skip = skip ? skip : 0;
            const requests = yield LeaveRequest_1.LeaveRequest.find(filterQuery)
                .populate(["staff", "department"])
                .sort(sort)
                .limit(limit)
                .skip(skip);
            const total = yield LeaveRequest_1.LeaveRequest.countDocuments(filterQuery);
            return {
                total,
                limit,
                skip,
                items: requests,
            };
        });
        this.delete = (id) => __awaiter(this, void 0, void 0, function* () {
            return yield LeaveRequest_1.LeaveRequest.findByIdAndDelete(id);
        });
    }
}
exports.default = LeaveRequestService;
