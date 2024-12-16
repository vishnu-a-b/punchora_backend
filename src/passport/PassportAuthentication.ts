import { Application } from "express";
import { User } from "../modules/user/models/User";
import Configs from "../configs/configs";

const passport = require("passport");
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const LocalStrategy = require("passport-local").Strategy;

const bcrypt = require("bcryptjs");

export class PassportAuthentication {
  static initialise = (app: Application) => {
    app.use(passport.initialize());

    passport.use(
      new LocalStrategy({ usernameField: "username" }, this.localAuthentication)
    );
    passport.use(
      new JwtStrategy(
        {
          jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
          secretOrKey: Configs.accessTokenSecret,
        },
        this.jwtAuthentication
      )
    );
  };

  static localAuthentication = async (
    username: string,
    password: string,
    done: any
  ) => {
    const user = await User.findOne({ mobileNo: username, isActive: true })
      .select("+password")
      .populate("roles");
    if (!user) {
      return done(null, false);
    }
    const result = await bcrypt.compare(password, user.password);
    if (!result) {
      return done(null, false);
    }
    return done(null, user);
  };

  static jwtAuthentication = async (jwt_payload: any, done: any) => {
    try {
      const user = await User.findOne({
        _id: jwt_payload.id,
        isActive: true,
      }).populate("roles");

      if (!user) {
        return done(null, false);
      }
      return done(null, user);
    } catch (e) {
      return done(null, false);
    }
  };
}
