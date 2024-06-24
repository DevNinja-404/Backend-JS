import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

const todoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    isCompleted: { type: Boolean, default: false },

    // ref must the modelName of the model which we want this model to link/relate to
    createdBy: { type: ObjectId, ref: "User" },

    // Array of subTodos :
    subTodos: { type: [{ type: ObjectId, ref: "SubTodo" }] },
  },
  { timestamps: true }
);

export const Todo = mongoose.model("Todo", todoSchema);
