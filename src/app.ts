import express from "express";
import customErrorHandler from "./errors/customErrorHandler";
import routes from "./routes";
import bodyParser from "body-parser";
import expressMongoSanitize from "express-mongo-sanitize";
import "express-async-errors";
import helmet from "helmet";
import path from "path";
import { requestLogger } from "./middlewares/requestLogger";
import sentryService from "./services/SentryService";
import { performanceMiddleware } from "./middlewares/performanceMiddleware";
import { validateApiKey } from "./middlewares/apiKeyAuth";
import { csrfProtection } from "./middlewares/csrfProtection";
import { ipWhitelist } from "./middlewares/ipWhitelist";

const swaggerUi = require("swagger-ui-express");
let swaggerDocument: any = null;
try {
  swaggerDocument = require(path.join(__dirname, "../out/swagger.json"));
} catch (_) {
  console.warn("[Swagger] swagger.json not found — /docs will be unavailable");
}
const cors = require("cors");

const app = express();

// Initialize Sentry (must be first)
sentryService.initialize(app);

app.use(cors());
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(expressMongoSanitize());

// Phase 6: Security Middlewares
app.use(validateApiKey); // Validate API keys (if present)
app.use(csrfProtection); // CSRF protection for non-API requests
app.use(ipWhitelist); // IP whitelist (if enabled)

app.use(requestLogger);
app.use(performanceMiddleware); // Add performance tracking
app.use(routes);

// to serve static files
const publicDirectoryPath = path.join(__dirname, "../public");
app.use(express.static(publicDirectoryPath));

if (swaggerDocument) {
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

// Install Sentry error handler (must be before custom error handler)
sentryService.installErrorHandler(app);

app.use(customErrorHandler);

export default app;
