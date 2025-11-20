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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const NotFoundError_1 = __importDefault(require("../../../errors/errorTypes/NotFoundError"));
const ValidationFailedError_1 = __importDefault(require("../../../errors/errorTypes/ValidationFailedError"));
const createPasswordHash_1 = require("../../authentication/utils/createPasswordHash");
const Role_1 = require("../../role/models/Role");
const User_1 = require("../models/User");
const bcrypt = require("bcryptjs");
class UserService {
    constructor() {
        this.list = (_a) => __awaiter(this, [_a], void 0, function* ({ limit, skip, filterQuery, sort }) {
            limit = limit ? limit : 10;
            skip = skip ? skip : 0;
            const users = yield User_1.User.find(filterQuery)
                .sort(sort)
                .limit(limit)
                .skip(skip);
            const total = yield User_1.User.countDocuments(filterQuery);
            return {
                total,
                limit,
                skip,
                items: users,
            };
        });
        this.filterByRole = (roleSlug_1, _a) => __awaiter(this, [roleSlug_1, _a], void 0, function* (roleSlug, { limit, skip, filterQuery, sort }) {
            limit = limit ? limit : 10;
            skip = skip ? skip : 0;
            const role = yield Role_1.Role.findOne({ slug: roleSlug });
            if (!role) {
                return {
                    total: 0,
                    limit,
                    skip,
                    items: [],
                };
            }
            let query = filterQuery;
            query.roles = { $in: role.id };
            const users = yield User_1.User.find(query).sort(sort).limit(limit).skip(skip);
            const total = yield User_1.User.countDocuments(filterQuery);
            return {
                total,
                limit,
                skip,
                items: users,
            };
        });
        this.create = (data) => __awaiter(this, void 0, void 0, function* () {
            const password = yield (0, createPasswordHash_1.createPasswordHash)(data.password);
            delete data.password;
            return yield User_1.User.create(Object.assign(Object.assign({}, data), { password }));
        });
        this.findOne = (id) => __awaiter(this, void 0, void 0, function* () {
            return yield User_1.User.findOne({ _id: id }).populate("roles");
        });
        this.update = (id, user) => __awaiter(this, void 0, void 0, function* () {
            return yield User_1.User.findByIdAndUpdate(id, user);
        });
        this.updatePassword = (id, oldPassword, newPassword) => __awaiter(this, void 0, void 0, function* () {
            const user = yield User_1.User.findById(id).select("password");
            if (!user) {
                throw new NotFoundError_1.default({ error: "user not found" });
            }
            const newPasswordHash = yield (0, createPasswordHash_1.createPasswordHash)(newPassword);
            const result = yield bcrypt.compare(oldPassword, user.password);
            if (!result) {
                throw new ValidationFailedError_1.default({ error: "incorrect password" });
            }
            return yield User_1.User.findByIdAndUpdate(id, { password: newPasswordHash });
        });
        this.delete = (id) => __awaiter(this, void 0, void 0, function* () {
            // Delete face descriptors (using correct model - AverageFaceDescriptor, not FaceDescriptor)
            const { AverageFaceDescriptor } = require("../../faceDescriptor/models/AverageFaceDescriptor");
            yield AverageFaceDescriptor.deleteMany({ user: id });
            return yield User_1.User.findByIdAndDelete(id);
        });
    }
}
exports.default = UserService;
