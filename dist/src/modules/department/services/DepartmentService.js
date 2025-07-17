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
const Department_1 = require("../models/Department");
class DepartmentService {
    constructor() {
        this.create = (data) => __awaiter(this, void 0, void 0, function* () {
            return yield Department_1.Department.create(data);
        });
        this.find = (_a) => __awaiter(this, [_a], void 0, function* ({ limit, skip, filterQuery, sort }) {
            limit = limit ? limit : 10;
            skip = skip ? skip : 0;
            const departments = yield Department_1.Department.find(filterQuery)
                .sort(sort)
                .limit(limit)
                .skip(skip);
            const total = yield Department_1.Department.countDocuments(filterQuery);
            return {
                total,
                limit,
                skip,
                items: departments,
            };
        });
        this.findOne = (id) => __awaiter(this, void 0, void 0, function* () {
            return yield Department_1.Department.findById(id);
        });
        this.countTotalDocuments = () => __awaiter(this, void 0, void 0, function* () { return yield Department_1.Department.countDocuments(); });
        this.update = (_a) => __awaiter(this, [_a], void 0, function* ({ id, data }) {
            return yield Department_1.Department.findByIdAndUpdate(id, data);
        });
        this.delete = (id) => __awaiter(this, void 0, void 0, function* () {
            return yield Department_1.Department.findByIdAndDelete(id);
        });
        this.filterByHead = (head) => __awaiter(this, void 0, void 0, function* () {
            return yield Department_1.Department.find({
                head,
            });
        });
    }
}
exports.default = DepartmentService;
