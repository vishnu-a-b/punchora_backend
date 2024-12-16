import { Schema } from "mongoose";

const baseSchema = new Schema({
  created_at: { type: Date, default: () => Date.now() },
  updated_at: { type: Date, default: () => Date.now() },
  deleted_at: { type: Date },
});
