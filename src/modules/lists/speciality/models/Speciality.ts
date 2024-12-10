import mongoose from "mongoose";

const specialitySchema = new mongoose.Schema({
  title: { type: String, maxLength: 50, required: true },
  slug: { type: String, maxLength: 50, unique: true, required: true },
});

export const Speciality = mongoose.model("Speciality", specialitySchema);
