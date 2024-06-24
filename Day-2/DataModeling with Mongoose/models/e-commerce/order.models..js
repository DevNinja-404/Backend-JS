import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  quantity: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema(
  {
    orderPrice: { type: Number, required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // So the problem here is we need to track what product the user ordered and how many of that particular product he ordered,well we can have the product we ordered but what about the number so what we do is we make a separate schema for that, which will basically help us to define our orderSchema properly
    orderItems: { type: [orderItemSchema] },
    address: { type: String, required: true },
    status: {
      type: String,
      enum: ["Placed", "Pending", "Delievered", "Cancelled"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);
