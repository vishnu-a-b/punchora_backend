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
const Taluk_1 = require("../models/Taluk");
class TalukService {
    constructor() {
        this.list = (search, filter, sort) => __awaiter(this, void 0, void 0, function* () {
            return yield Taluk_1.Taluk.find(filter).sort(sort);
        });
        this.create = (data) => __awaiter(this, void 0, void 0, function* () {
            return yield Taluk_1.Taluk.create(data);
        });
        this.delete = (id) => __awaiter(this, void 0, void 0, function* () {
            return yield Taluk_1.Taluk.findByIdAndDelete(id);
        });
    }
}
exports.default = TalukService;
