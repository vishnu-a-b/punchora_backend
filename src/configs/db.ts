import mongoose from "mongoose";
import Configs from "./configs";

export const connectDb = async () => {
  await mongoose.connect(
    `mongodb+srv://${Configs.mongoUser}:${Configs.mongoPassword}@${Configs.mongoHost}/${Configs.mongoDatabase}`
  );
};
