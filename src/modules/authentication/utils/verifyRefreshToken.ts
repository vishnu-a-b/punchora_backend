import Configs from "../../../configs/configs";
import { Token } from "../../user/models/UserToken";

const jwt = require("jsonwebtoken");

const verifyRefreshToken = (refreshToken: string) => {
  return new Promise(async (resolve, reject) => {
    try {
      await Token.findOne({
        refreshToken: refreshToken,
      });
      jwt.verify(
        refreshToken,
        Configs.refreshTokenSecret,
        (error: any, payload: any) => {
          if (error) {
            return reject({ message: "Invalid refresh token" });
          }
          return resolve(payload);
        }
      );
    } catch (e) {
      return reject({ message: "Invalid refresh token" });
    }
  });
};
export default verifyRefreshToken;
