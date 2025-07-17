"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const baseSchema = new mongoose_1.Schema({
    created_at: { type: Date, default: () => Date.now() },
    updated_at: { type: Date, default: () => Date.now() },
    deleted_at: { type: Date },
});
