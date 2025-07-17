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
const Business_1 = require("../models/Business");
class BusinessService {
    constructor() {
        this.create = (business) => __awaiter(this, void 0, void 0, function* () {
            return yield Business_1.Business.create(business);
        });
        this.find = (_a) => __awaiter(this, [_a], void 0, function* ({ limit, skip, filterQuery, sort }) {
            limit = limit ? limit : 10;
            skip = skip ? skip : 0;
            const businesses = yield Business_1.Business.find(filterQuery)
                .sort(sort)
                .limit(limit)
                .skip(skip);
            const total = yield Business_1.Business.countDocuments(filterQuery);
            return {
                total,
                limit,
                skip,
                items: businesses,
            };
        });
        this.findOne = (id) => __awaiter(this, void 0, void 0, function* () {
            return yield Business_1.Business.findById(id).populate(["address"]);
        });
        this.countTotalDocuments = () => __awaiter(this, void 0, void 0, function* () { return yield Business_1.Business.countDocuments(); });
        this.update = (_a) => __awaiter(this, [_a], void 0, function* ({ id, business }) {
            return yield Business_1.Business.findByIdAndUpdate(id, business);
        });
        this.delete = (id) => __awaiter(this, void 0, void 0, function* () {
            return yield Business_1.Business.findByIdAndDelete(id);
        });
        this.filterByAdmin = (admin) => __awaiter(this, void 0, void 0, function* () {
            return yield Business_1.Business.find({
                admin,
            }).populate(["address"]);
        });
    }
}
exports.default = BusinessService;
