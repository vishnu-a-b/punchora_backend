"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config();
class Configs {
}
Configs.port = process.env.PORT;
Configs.domain = process.env.DOMAIN;
Configs.serverUrl = process.env.SERVER_URL;
// mongo
Configs.mongoHost = process.env.MONGO_HOST;
Configs.mongoDatabase = process.env.MONGO_DATABASE;
Configs.mongoUser = process.env.MONGO_USER;
Configs.mongoPassword = process.env.MONGO_PASSWORD;
// Authentication
Configs.accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
Configs.refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
Configs.accessTokenTimout = process.env.ACCESS_TOKEN_TIMOUT;
Configs.refreshTokenTimout = process.env.REFRESH_TOKEN_TIMOUT;
exports.default = Configs;
