import express from "express";
import customErrorHandler from "./errors/customErrorHandler";
import routes from "./routes";
import bodyParser from "body-parser";
import expressMongoSanitize from "express-mongo-sanitize";
import "express-async-errors";
import helmet from "helmet";
import path from "path";

const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("../out/swagger.json");
const cors = require("cors");

const app = express();
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
app.use(routes);

// to serve static files
const publicDirectoryPath = path.join(__dirname, "../public");
app.use(express.static(publicDirectoryPath));

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(customErrorHandler);

export default app;
