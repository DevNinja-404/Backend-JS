import mongoose from "mongoose";

const hoursInHospitalSchema = new mongoose.Schema({
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hospital",
    required: true,
  },
  workingHours: { type: Number, required: true },
});

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    salary: { type: String, required: true },
    qualification: { type: String, required: true },
    experienceInYears: { type: Number, default: 0 },
    worksInHospitals: {
      type: [hoursInHospitalSchema],
      required: true,
    },
  },
  { timestamps: true }
);

export const Doctor = mongoose.model("Doctor", doctorSchema);
