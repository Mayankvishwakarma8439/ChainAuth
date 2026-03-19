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
    emailVerified: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    otpHash: {
      type: String,
      default: null,
    },
    otpPurpose: {
      type: String,
      enum: ["signup", "login", "password-reset", null],
      default: null,
    },
    otpExpiresAt: {
      type: Date,
      default: null,
    },
    otpAttemptCount: {
      type: Number,
      default: 0,
    },
    otpLastSentAt: {
      type: Date,
      default: null,
    },
    loginAttemptCount: {
      type: Number,
      default: 0,
    },
    loginLockedUntil: {
      type: Date,
      default: null,
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
