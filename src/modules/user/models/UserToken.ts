import mongoose from "mongoose";

const tokenSchema = new mongoose.Schema({
  refreshToken: { type: String, required: true, maxLength: 200 },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: () => Date.now() },
});

export const Token = mongoose.model("Token", tokenSchema);
