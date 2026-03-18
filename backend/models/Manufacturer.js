const mongoose = require("mongoose");

const manufacturerSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    registrationNumber: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    officialEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    contactNumber: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
    walletAddress: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

manufacturerSchema.index({ officialEmail: 1 }, { unique: true });
manufacturerSchema.index({ registrationNumber: 1 }, { unique: true });
manufacturerSchema.index({ walletAddress: 1 }, { unique: true });

module.exports = mongoose.model("Manufacturer", manufacturerSchema);
