import Configs from "../../../configs/configs";
import { Token } from "../../user/models/UserToken";

const jwt = require("jsonwebtoken");

export const generateTokens = async (id: string) => {
  try {
    const accessToken = jwt.sign({ id }, Configs.accessTokenSecret, {
      expiresIn: Configs.accessTokenTimout,
    });
    let refreshToken;
    const userToken = await Token.findOne({
      user: id,
    });
    if (userToken) {
      try {
        await jwt.verify(userToken.refreshToken, Configs.refreshTokenSecret);
        refreshToken = userToken.refreshToken;
      } catch (e: any) {}
    }
    if (!refreshToken) {
      refreshToken = jwt.sign({ id }, Configs.refreshTokenSecret, {
        expiresIn: Configs.refreshTokenTimout,
      });
    }
    if (userToken) {
      const s = await Token.deleteOne({ _id: userToken.id });
    }

    await Token.create({
      user: id,
      refreshToken: refreshToken,
    });
    return Promise.resolve({ accessToken, refreshToken });
  } catch (err) {
    return Promise.reject(err);
  }
};
