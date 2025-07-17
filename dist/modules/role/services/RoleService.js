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
const Role_1 = require("../models/Role");
class RoleService {
    constructor() {
        this.create = (_a) => __awaiter(this, [_a], void 0, function* ({ title, slug }) {
            return yield Role_1.Role.create({ title, slug });
        });
        this.find = (_a) => __awaiter(this, [_a], void 0, function* ({ limit, skip, filterQuery, sort }) {
            limit = limit ? limit : 10;
            skip = skip ? skip : 0;
            const roles = yield Role_1.Role.find(filterQuery)
                .sort(sort)
                .limit(limit)
                .skip(skip);
            const total = yield Role_1.Role.countDocuments(filterQuery);
            return {
                total,
                limit,
                skip,
                items: roles,
            };
        });
        this.findOneBySlug = (slug) => __awaiter(this, void 0, void 0, function* () {
            return yield Role_1.Role.findOne({ slug });
        });
    }
}
exports.default = RoleService;
