require("dotenv").config();

export default class Configs {
  static port = process.env.PORT;
  static domain = process.env.DOMAIN;
  static serverUrl = process.env.SERVER_URL;

  // mongo
  static mongoHost = process.env.MONGO_HOST;
  static mongoDatabase = process.env.MONGO_DATABASE;
  static mongoUser = process.env.MONGO_USER;
  static mongoPassword = process.env.MONGO_PASSWORD;

  // Authentication
  static accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
  static refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
  static accessTokenTimout = process.env.ACCESS_TOKEN_TIMOUT;
  static refreshTokenTimout = process.env.REFRESH_TOKEN_TIMOUT;
}
