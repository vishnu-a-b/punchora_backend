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
const FailedLocationAttempt_1 = require("../models/FailedLocationAttempt");
class FailedLocationAttemptService {
    constructor() {
        this.list = (_a) => __awaiter(this, [_a], void 0, function* ({ limit, skip, filterQuery, sort }) {
            limit = limit ? limit : 10;
            skip = skip ? skip : 0;
            const attempts = yield FailedLocationAttempt_1.FailedLocationAttempt.find(filterQuery)
                .sort(sort)
                .limit(limit)
                .skip(skip)
                .populate("staff");
            const total = yield FailedLocationAttempt_1.FailedLocationAttempt.countDocuments(filterQuery);
            return {
                total,
                limit,
                skip,
                items: attempts,
            };
        });
        this.create = (body) => __awaiter(this, void 0, void 0, function* () {
            return yield FailedLocationAttempt_1.FailedLocationAttempt.create(body);
        });
        this.findOne = (id) => __awaiter(this, void 0, void 0, function* () {
            return yield FailedLocationAttempt_1.FailedLocationAttempt.findById(id);
        });
        this.update = (_a) => __awaiter(this, [_a], void 0, function* ({ id, body }) {
            return yield FailedLocationAttempt_1.FailedLocationAttempt.findByIdAndUpdate(id, body);
        });
        this.delete = (id) => __awaiter(this, void 0, void 0, function* () {
            return yield FailedLocationAttempt_1.FailedLocationAttempt.findByIdAndDelete(id);
        });
        this.insertMany = (data) => __awaiter(this, void 0, void 0, function* () {
            return yield FailedLocationAttempt_1.FailedLocationAttempt.insertMany(data);
        });
        this.filterByDate = (startDate, endDate, staffId) => __awaiter(this, void 0, void 0, function* () {
            const startOfStartDate = new Date(startDate);
            const endOfEndDate = new Date(endDate);
            let query = {
                attemptTime: {
                    $gte: startOfStartDate,
                    $lte: endOfEndDate,
                },
            };
            if (staffId) {
                query.staff = staffId;
            }
            const attempts = yield FailedLocationAttempt_1.FailedLocationAttempt.find(query).populate("staff");
            return attempts;
        });
    }
}
exports.default = FailedLocationAttemptService;
