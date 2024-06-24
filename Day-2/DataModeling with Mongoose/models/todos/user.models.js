import mongoose from "mongoose";

// Making a schema :
const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, lowercase: true },

    email: { type: String, required: true, unique: true, lowercase: true },

    password: { type: String, required: [true, "Password is Required !!!"] },
  },
  //   createdAt and updatedAt are such a common fields that almost every schema will have it so the {timestamps :true} adds these two fields but remember we need to pass this object as the second param
  { timestamps: true }
);

// mongoose .model() is a methos which takes two params :
// 1 -> which model to make
// 2 -> model to make on what basis
export const User = mongoose.model("User", userSchema);
