import mongoose, { Schema } from "mongoose";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String, //cloudinary URL
      required: true,
    },
    coverImage: {
      type: String, //cloudinary URL
    },
    watchHistory: { type: [{ type: Schema.Types.ObjectId, ref: "Video" }] },
    password: { type: String, required: [true, "Password Is Required"] },
    refreshToken: { type: String },
  },
  { timestamps: true }
);

// before the save event we want to do the following work :
userSchema.pre("save", async function (next) {
  // The problem is that whenever the userSchema was to be updated we would have hashed the password everytime but we dont want to do so and as a result we use isModified() method tocheck whether the password field was modified or not
  if (!this.isModified("password")) return next();

  this.password = await bcryptjs.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcryptjs.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
};

export const User = new mongoose.model("User", userSchema);
