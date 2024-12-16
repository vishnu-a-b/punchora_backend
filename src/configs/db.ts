import mongoose from "mongoose";
import Configs from "./configs";

export const connectDb = async () => {
  await mongoose.connect(
    `mongodb://${Configs.mongoUser}:${Configs.mongoPassword}@${Configs.mongoHost}:27017/${Configs.mongoDatabase}`
  );
};
