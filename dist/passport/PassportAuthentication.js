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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PassportAuthentication = void 0;
const User_1 = require("../modules/user/models/User");
const configs_1 = __importDefault(require("../configs/configs"));
const passport = require("passport");
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
class PassportAuthentication {
}
exports.PassportAuthentication = PassportAuthentication;
_a = PassportAuthentication;
PassportAuthentication.initialise = (app) => {
    app.use(passport.initialize());
    passport.use(new LocalStrategy({ usernameField: "username" }, _a.localAuthentication));
    passport.use(new JwtStrategy({
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: configs_1.default.accessTokenSecret,
    }, _a.jwtAuthentication));
};
PassportAuthentication.localAuthentication = (username, password, done) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield User_1.User.findOne({ mobileNo: username, isActive: true })
        .select("+password")
        .populate("roles");
    if (!user) {
        return done(null, false);
    }
    const result = yield bcrypt.compare(password, user.password);
    if (!result) {
        return done(null, false);
    }
    return done(null, user);
});
PassportAuthentication.jwtAuthentication = (jwt_payload, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield User_1.User.findOne({
            _id: jwt_payload.id,
            isActive: true,
        }).populate("roles");
        if (!user) {
            return done(null, false);
        }
        return done(null, user);
    }
    catch (e) {
        return done(null, false);
    }
});
