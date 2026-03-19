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
const requestLogger_1 = require("./middlewares/requestLogger");
const SentryService_1 = __importDefault(require("./services/SentryService"));
const performanceMiddleware_1 = require("./middlewares/performanceMiddleware");
const apiKeyAuth_1 = require("./middlewares/apiKeyAuth");
const csrfProtection_1 = require("./middlewares/csrfProtection");
const ipWhitelist_1 = require("./middlewares/ipWhitelist");
const swaggerUi = require("swagger-ui-express");
let swaggerDocument = null;
try {
    swaggerDocument = require(path_1.default.join(__dirname, "../out/swagger.json"));
}
catch (_) {
    console.warn("[Swagger] swagger.json not found — /docs will be unavailable");
}
const cors = require("cors");
const app = (0, express_1.default)();
// Initialize Sentry (must be first)
SentryService_1.default.initialize(app);
app.use(cors());
app.use((0, helmet_1.default)({
    crossOriginEmbedderPolicy: false,
}));
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use(express_1.default.static("public"));
app.use((0, express_mongo_sanitize_1.default)());
// Phase 6: Security Middlewares
app.use(apiKeyAuth_1.validateApiKey); // Validate API keys (if present)
app.use(csrfProtection_1.csrfProtection); // CSRF protection for non-API requests
app.use(ipWhitelist_1.ipWhitelist); // IP whitelist (if enabled)
app.use(requestLogger_1.requestLogger);
app.use(performanceMiddleware_1.performanceMiddleware); // Add performance tracking
app.use(routes_1.default);
// to serve static files
const publicDirectoryPath = path_1.default.join(__dirname, "../public");
app.use(express_1.default.static(publicDirectoryPath));
if (swaggerDocument) {
    app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}
// Install Sentry error handler (must be before custom error handler)
SentryService_1.default.installErrorHandler(app);
app.use(customErrorHandler_1.default);
exports.default = app;
