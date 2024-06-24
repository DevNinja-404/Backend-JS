import mongoose, { mongo } from "mongoose";

const medicalRecordSchema = new mongoose.Schema(
  {
    patient: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Patient" }],
      required: true,
    },
    treatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    treatedAt: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
    },
  },
  { timestamps: true }
);

export const MedicalRecord = mongoose.model(
  "MedicalRecord",
  medicalRecordSchema
);
