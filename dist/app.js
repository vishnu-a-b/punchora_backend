"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const customErrorHandler_1 = __importDefault(require("./errors/customErrorHandler"));
const routes_1 = __importDefault(require("./routes"));
const body_parser_1 = __importDefault(require("body-parser"));
const express_mongo_sanitize_1 = __importDefault(require("express-mongo-sanitize"));
require("express-async-errors");
const helmet_1 = __importDefault(require("helmet"));
const path_1 = __importDefault(require("path"));
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("../out/swagger.json");
const cors = require("cors");
const app = (0, express_1.default)();
app.use(cors());
app.use((0, helmet_1.default)({
    crossOriginEmbedderPolicy: false,
}));
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use(express_1.default.static("public"));
app.use((0, express_mongo_sanitize_1.default)());
app.use(routes_1.default);
// to serve static files
const publicDirectoryPath = path_1.default.join(__dirname, "../public");
app.use(express_1.default.static(publicDirectoryPath));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(customErrorHandler_1.default);
exports.default = app;
