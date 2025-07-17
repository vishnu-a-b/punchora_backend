"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const configs_1 = __importDefault(require("./configs/configs"));
const db_1 = require("./configs/db");
const PassportAuthentication_1 = require("./passport/PassportAuthentication");
const port = Number(configs_1.default.port || 3000);
PassportAuthentication_1.PassportAuthentication.initialise(app_1.default);
(0, db_1.connectDb)()
    .then(() => {
    console.log("Mongo connected");
    app_1.default.listen(port, () => {
        console.log(`Server started on port ${port}`);
    });
})
    .catch((e) => console.log("unable to connect mongo", e));
