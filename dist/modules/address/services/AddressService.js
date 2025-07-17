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
const Address_1 = require("../models/Address");
class AddressService {
    constructor() {
        this.list = (_a) => __awaiter(this, [_a], void 0, function* ({ limit, skip, filterQuery, sort }) {
            limit = limit ? limit : 10;
            skip = skip ? skip : 0;
            const addresses = yield Address_1.Address.find(filterQuery)
                .sort(sort)
                .limit(limit)
                .skip(skip);
            const total = yield Address_1.Address.countDocuments(filterQuery);
            return {
                total,
                limit,
                skip,
                items: addresses,
            };
        });
        this.create = (body) => __awaiter(this, void 0, void 0, function* () {
            return yield Address_1.Address.create(body);
        });
        this.findOne = (id) => __awaiter(this, void 0, void 0, function* () {
            return yield Address_1.Address.findById(id);
        });
        this.update = (_a) => __awaiter(this, [_a], void 0, function* ({ id, body }) {
            return yield Address_1.Address.findByIdAndUpdate(id, body);
        });
        this.delete = (id) => __awaiter(this, void 0, void 0, function* () {
            return yield Address_1.Address.findByIdAndDelete(id);
        });
    }
}
exports.default = AddressService;
