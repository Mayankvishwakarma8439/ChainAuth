require("dotenv").config();

const express = require("express");
const { Web3 } = require("web3");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const Manufacturer = require("./models/Manufacturer");

const app = express();
app.use(cors());
app.use(express.json());

BigInt.prototype.toJSON = function () {
  return this.toString();
};

const PORT = Number(process.env.PORT) || 3000;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/product_registry";
const JWT_SECRET = process.env.JWT_SECRET || "change-this-in-production";
const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES) || 5;
const OTP_RESEND_COOLDOWN_SECONDS =
  Number(process.env.OTP_RESEND_COOLDOWN_SECONDS) || 60;
const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS) || 5;
const LOGIN_MAX_ATTEMPTS = Number(process.env.LOGIN_MAX_ATTEMPTS) || 5;
const LOGIN_LOCK_MINUTES = Number(process.env.LOGIN_LOCK_MINUTES) || 15;
const PASSWORD_RESET_TOKEN_EXPIRY_MINUTES =
  Number(process.env.PASSWORD_RESET_TOKEN_EXPIRY_MINUTES) || 10;
const MAIL_FROM = process.env.MAIL_FROM || process.env.SMTP_USER || "";
const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT) || 465;
const SMTP_SECURE = String(process.env.SMTP_SECURE || "true") === "true";
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const OTP_DEV_BYPASS = process.env.OTP_DEV_BYPASS === "true";
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || "";
const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL || "admin@chainauth.local";
const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD || "ChainAuthAdmin@2026";
const web3 = new Web3(process.env.WEB3_PROVIDER || "http://127.0.0.1:8545");

const contractPath = path.join(
  __dirname,
  "../blockchain/build/contracts/ProductRegistry.json"
);
const contractJson = JSON.parse(fs.readFileSync(contractPath, "utf8"));
const contractABI = contractJson.abi;

let contractAddress = process.env.CONTRACT_ADDRESS || null;
let contract = null;
let accounts = [];
let mailTransporter = null;

function sanitizeManufacturer(record) {
  if (!record) return null;

  return {
    id: record._id?.toString() || record.id,
    companyName: record.companyName,
    registrationNumber: record.registrationNumber,
    officialEmail: record.officialEmail,
    contactNumber: record.contactNumber,
    country: record.country,
    walletAddress: record.walletAddress,
    emailVerified: Boolean(record.emailVerified),
    status: record.status,
    loginLockedUntil: record.loginLockedUntil,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function hashOtp(otp) {
  return crypto.createHash("sha256").update(String(otp)).digest("hex");
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function canResendOtp(manufacturer) {
  if (!manufacturer?.otpLastSentAt) {
    return true;
  }

  const elapsedSeconds =
    (Date.now() - new Date(manufacturer.otpLastSentAt).getTime()) / 1000;

  return elapsedSeconds >= OTP_RESEND_COOLDOWN_SECONDS;
}

function buildOtpResponse(message, devOtp) {
  if (OTP_DEV_BYPASS) {
    return {
      success: true,
      message,
      devOtp,
    };
  }

  return {
    success: true,
    message,
  };
}

async function sendOtpEmail(to, otp, purpose) {
  if (!mailTransporter) {
    console.log(
      `[OTP:${purpose}] No SMTP credentials configured. OTP for ${to}: ${otp}`
    );
    return;
  }

  const subject =
    purpose === "signup"
      ? "Verify your manufacturer signup"
      : purpose === "password-reset"
        ? "Reset your manufacturer password"
        : "Verify your manufacturer login";

  const introText =
    purpose === "password-reset"
      ? "Use this OTP to continue resetting your password:"
      : "Your one-time password is:";

  const html = `
    <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
      <h2 style="margin-bottom: 12px;">ChainAuth Manufacturer Verification</h2>
      <p>${introText}</p>
      <div style="display: inline-block; padding: 12px 18px; border-radius: 10px; background: #e0f2fe; color: #0f172a; font-size: 24px; font-weight: 700; letter-spacing: 6px;">
        ${otp}
      </div>
      <p style="margin-top: 16px;">This OTP expires in ${OTP_EXPIRY_MINUTES} minutes.</p>
      <p>If you did not request this verification, you can ignore this email.</p>
    </div>
  `;

  await mailTransporter.sendMail({
    from: MAIL_FROM || SMTP_USER,
    to,
    subject,
    html,
    text: `Your OTP is ${otp}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`,
  });
}

async function assignAndSendOtp(manufacturer, purpose) {
  const otp = generateOtp();
  const now = new Date();
  manufacturer.otpHash = hashOtp(otp);
  manufacturer.otpPurpose = purpose;
  manufacturer.otpExpiresAt = new Date(
    now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000
  );
  manufacturer.otpAttemptCount = 0;
  manufacturer.otpLastSentAt = now;
  await manufacturer.save();
  await sendOtpEmail(manufacturer.officialEmail, otp, purpose);
  return otp;
}

function clearOtpState(manufacturer) {
  manufacturer.otpHash = null;
  manufacturer.otpPurpose = null;
  manufacturer.otpExpiresAt = null;
  manufacturer.otpAttemptCount = 0;
  manufacturer.otpLastSentAt = null;
}

function isLoginLocked(manufacturer) {
  return (
    manufacturer?.loginLockedUntil &&
    new Date(manufacturer.loginLockedUntil).getTime() > Date.now()
  );
}

function resetLoginAttemptState(manufacturer) {
  manufacturer.loginAttemptCount = 0;
  manufacturer.loginLockedUntil = null;
}

function normalizeIdentifierType(identifierType) {
  const normalizedType = String(identifierType || "").trim().toLowerCase();
  if (!["imei", "mac"].includes(normalizedType)) {
    throw new Error("Unsupported identifier type");
  }
  return normalizedType;
}

function normalizeIdentifierValue(identifierType, identifierValue) {
  const rawValue = String(identifierValue || "").trim();

  if (identifierType === "imei") {
    const digitsOnly = rawValue.replace(/\D/g, "").slice(0, 15);
    if (digitsOnly.length !== 15) {
      throw new Error("IMEI must be exactly 15 digits");
    }
    return digitsOnly;
  }

  const normalizedMac = rawValue.replace(/-/g, ":").toUpperCase();
  if (!/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(normalizedMac)) {
    throw new Error("Enter a valid MAC address, e.g. AA:BB:CC:DD:EE:FF");
  }
  return normalizedMac;
}

function buildIdentifierErrorMessage(identifierType, action) {
  return identifierType === "mac"
    ? `Product with this MAC address already ${action}`
    : `Product with this IMEI already ${action}`;
}

function mapContractProduct(product) {
  return {
    productName: product.productName,
    brand: product.brand,
    model: product.model,
    identifierType: product.identifierType,
    identifierValue: product.identifierValue,
    imeiNumber: product.imeiNumber,
    macAddress: product.macAddress,
    manufacturer: product.manufacturer,
    registrationDate: new Date(
      Number(product.registrationDate) * 1000
    ).toISOString(),
    isRegistered: product.isRegistered,
  };
}

async function fetchRegisteredProduct(identifierType, identifierValue) {
  const exists = await contract.methods
    .isProductRegistered(identifierType, identifierValue)
    .call();

  if (!exists) {
    return null;
  }

  const product = await contract.methods
    .getProduct(identifierType, identifierValue)
    .call();

  return mapContractProduct(product);
}

function createToken(manufacturer) {
  return jwt.sign(
    {
      manufacturerId: manufacturer._id.toString(),
      officialEmail: manufacturer.officialEmail,
      role: "manufacturer",
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function createAdminToken() {
  return jwt.sign(
    {
      role: "admin",
      email: ADMIN_EMAIL,
    },
    JWT_SECRET,
    { expiresIn: "12h" }
  );
}

function createPasswordResetToken(manufacturer) {
  return jwt.sign(
    {
      manufacturerId: manufacturer._id.toString(),
      officialEmail: manufacturer.officialEmail,
      purpose: "password-reset",
    },
    JWT_SECRET,
    { expiresIn: `${PASSWORD_RESET_TOKEN_EXPIRY_MINUTES}m` }
  );
}

async function connectDatabase() {
  await mongoose.connect(MONGODB_URI);
  console.log("MongoDB connected");
}

async function addressHasCode(address) {
  if (!address) {
    return false;
  }

  try {
    const code = await web3.eth.getCode(address);
    return Boolean(code && code !== "0x");
  } catch (error) {
    console.warn(`Unable to check contract code at ${address}:`, error.message);
    return false;
  }
}

async function resolveContractAddress() {
  const networkId = String(await web3.eth.net.getId());
  const artifactNetworks = contractJson.networks || {};
  const currentNetworkAddress = artifactNetworks[networkId]?.address || null;

  if (contractAddress) {
    const envAddressHasCode = await addressHasCode(contractAddress);
    if (envAddressHasCode) {
      console.log(`Using contract address from .env: ${contractAddress}`);
      return contractAddress;
    }

    console.warn(
      `Configured CONTRACT_ADDRESS ${contractAddress} has no deployed code. Falling back to Truffle artifact addresses.`
    );
  }

  if (currentNetworkAddress && (await addressHasCode(currentNetworkAddress))) {
    console.log(
      `Using contract address from current network artifact (${networkId}): ${currentNetworkAddress}`
    );
    return currentNetworkAddress;
  }

  const networkIdsDescending = Object.keys(artifactNetworks)
    .sort((a, b) => Number(b) - Number(a));

  for (const artifactNetworkId of networkIdsDescending) {
    const candidateAddress = artifactNetworks[artifactNetworkId]?.address;
    if (candidateAddress && (await addressHasCode(candidateAddress))) {
      console.log(
        `Using latest valid contract address from artifact history (${artifactNetworkId}): ${candidateAddress}`
      );
      return candidateAddress;
    }
  }

  return null;
}

async function initContract() {
  try {
    accounts = await web3.eth.getAccounts();
    console.log("Available accounts:", accounts);

    contractAddress = await resolveContractAddress();

    if (contractAddress) {
      contract = new web3.eth.Contract(contractABI, contractAddress);
      console.log("Contract initialized at:", contractAddress);
    } else {
      console.log(
        "Contract address not found. Please deploy the contract first."
      );
    }
  } catch (error) {
    console.error("Error initializing contract:", error);
  }
}

async function requireManufacturerAuth(req, res, next) {
  try {
    const authorization = req.headers.authorization || "";
    const token = authorization.startsWith("Bearer ")
      ? authorization.slice(7)
      : null;

    if (!token) {
      return res.status(401).json({ error: "Authentication token is required" });
    }

    const payload = jwt.verify(token, JWT_SECRET);
    const manufacturer = await Manufacturer.findById(payload.manufacturerId);

    if (!manufacturer) {
      return res.status(401).json({ error: "Invalid authentication token" });
    }

    if (!manufacturer.emailVerified) {
      return res.status(403).json({ error: "Email verification is required" });
    }

    req.manufacturer = manufacturer;
    req.authToken = token;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}


async function requireAdminAccess(req, res, next) {
  const authorization = req.headers.authorization || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : null;

  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      if (payload?.role === "admin" && payload?.email === ADMIN_EMAIL) {
        req.admin = { email: ADMIN_EMAIL };
        return next();
      }
    } catch (error) {
      return res.status(401).json({ error: "Invalid or expired admin token" });
    }

    return res.status(403).json({ error: "Admin access is required" });
  }

  const providedKey = req.headers["x-admin-key"] || "";
  if (ADMIN_API_KEY && providedKey === ADMIN_API_KEY) {
    req.admin = { email: ADMIN_EMAIL, via: "api-key" };
    return next();
  }

  return res.status(401).json({ error: "Admin authentication is required" });
}

app.post(
  "/api/register-product",
  requireManufacturerAuth,
  async (req, res) => {
    try {
      if (!contract) {
        return res.status(500).json({ error: "Contract not initialized" });
      }

      if (req.manufacturer.status !== "approved") {
        return res.status(403).json({
          error:
            req.manufacturer.status === "rejected"
              ? "Your manufacturer account has been rejected and cannot register products."
              : "Your manufacturer account is pending approval. Product registration is available only for approved manufacturers.",
        });
      }

      const {
        identifierType,
        identifierValue,
        imeiNumber,
        macAddress,
        productName,
        brand,
        model,
      } = req.body || {};

      if (!productName || !brand || !model) {
        return res.status(400).json({ error: "All fields are required" });
      }

      let normalizedIdentifierType;
      let normalizedIdentifierValue;
      try {
        normalizedIdentifierType = normalizeIdentifierType(
          identifierType || (macAddress ? "mac" : "imei")
        );
        normalizedIdentifierValue = normalizeIdentifierValue(
          normalizedIdentifierType,
          identifierValue || imeiNumber || macAddress
        );
      } catch (validationError) {
        return res.status(400).json({ error: validationError.message });
      }

      const exists = await contract.methods
        .isProductRegistered(normalizedIdentifierType, normalizedIdentifierValue)
        .call();
      if (exists) {
        return res.status(400).json({
          error: buildIdentifierErrorMessage(
            normalizedIdentifierType,
            "registered"
          ),
        });
      }

      const result = await contract.methods
        .registerProduct(
          normalizedIdentifierType,
          normalizedIdentifierValue,
          String(productName).trim(),
          String(brand).trim(),
          String(model).trim()
        )
        .send({
          from: accounts[0],
          gas: 700000,
        });

      res.json({
        success: true,
        message: "Product registered successfully",
        transactionHash: result.transactionHash,
        blockNumber: Number(result.blockNumber),
        gasUsed: Number(result.gasUsed),
        manufacturer: sanitizeManufacturer(req.manufacturer),
        data: {
          identifierType: normalizedIdentifierType,
          identifierValue: normalizedIdentifierValue,
          imeiNumber:
            normalizedIdentifierType === "imei" ? normalizedIdentifierValue : "",
          macAddress:
            normalizedIdentifierType === "mac" ? normalizedIdentifierValue : "",
          productName: String(productName).trim(),
          brand: String(brand).trim(),
          model: String(model).trim(),
        },
      });
    } catch (error) {
      console.error("Error registering product:", error);
      res.status(500).json({
        error: "Failed to register product",
        details: error.message,
      });
    }
  }
);

app.get("/api/verify-product/:identifierType/:identifierValue", async (req, res) => {
  try {
    if (!contract) {
      return res.status(500).json({ error: "Contract not initialized" });
    }

    let normalizedIdentifierType;
    let normalizedIdentifierValue;
    try {
      normalizedIdentifierType = normalizeIdentifierType(req.params.identifierType);
      normalizedIdentifierValue = normalizeIdentifierValue(
        normalizedIdentifierType,
        req.params.identifierValue
      );
    } catch (validationError) {
      return res.status(400).json({ error: validationError.message });
    }

    const product = await fetchRegisteredProduct(
      normalizedIdentifierType,
      normalizedIdentifierValue
    );

    if (!product) {
      return res.json({
        isValid: false,
        message: "Product not found in registry",
      });
    }

    res.json({
      isValid: true,
      message: "Product verified successfully",
      product,
    });
  } catch (error) {
    console.error("Error verifying product:", error);
    res.status(500).json({
      error: "Failed to verify product",
      details: error.message,
    });
  }
});

app.get("/api/verify-product/:imeiNumber", async (req, res) => {
  try {
    if (!contract) {
      return res.status(500).json({ error: "Contract not initialized" });
    }

    let normalizedImei;
    try {
      normalizedImei = normalizeIdentifierValue("imei", req.params.imeiNumber);
    } catch (validationError) {
      return res.status(400).json({ error: validationError.message });
    }

    const product = await fetchRegisteredProduct("imei", normalizedImei);

    if (!product) {
      return res.json({
        isValid: false,
        message: "Product not found in registry",
      });
    }

    res.json({
      isValid: true,
      message: "Product verified successfully",
      product,
    });
  } catch (error) {
    console.error("Error verifying product:", error);
    res.status(500).json({
      error: "Failed to verify product",
      details: error.message,
    });
  }
});

app.get("/api/accounts", async (req, res) => {
  try {
    const accs = await web3.eth.getAccounts();
    res.json({ accounts: accs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/manufacturers/signup", async (req, res) => {
  try {
    const {
      companyName,
      registrationNumber,
      officialEmail,
      contactNumber,
      country,
      walletAddress,
      password,
    } = req.body || {};

    if (
      !companyName ||
      !registrationNumber ||
      !officialEmail ||
      !contactNumber ||
      !country ||
      !walletAddress ||
      !password
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const normalizedEmail = String(officialEmail).trim().toLowerCase();
    const normalizedWallet = String(walletAddress).trim();
    const normalizedRegistration = String(registrationNumber).trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ error: "Invalid email address" });
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(normalizedWallet)) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }

    if (String(password).length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters" });
    }

    const existingManufacturer = await Manufacturer.findOne({
      $or: [
        { officialEmail: normalizedEmail },
        { registrationNumber: normalizedRegistration },
        { walletAddress: normalizedWallet },
      ],
    });

    if (existingManufacturer?.emailVerified) {
      return res.status(409).json({
        error:
          "Manufacturer with this email, registration number, or wallet address already exists",
      });
    }

    let manufacturer = existingManufacturer;
    const passwordHash = await bcrypt.hash(String(password), 12);

    if (manufacturer) {
      manufacturer.companyName = String(companyName).trim();
      manufacturer.registrationNumber = normalizedRegistration;
      manufacturer.officialEmail = normalizedEmail;
      manufacturer.contactNumber = String(contactNumber).trim();
      manufacturer.country = String(country).trim();
      manufacturer.walletAddress = normalizedWallet;
      manufacturer.passwordHash = passwordHash;
      manufacturer.emailVerified = false;
      manufacturer.status = "pending";
      resetLoginAttemptState(manufacturer);
    } else {
      manufacturer = new Manufacturer({
        companyName: String(companyName).trim(),
        registrationNumber: normalizedRegistration,
        officialEmail: normalizedEmail,
        contactNumber: String(contactNumber).trim(),
        country: String(country).trim(),
        walletAddress: normalizedWallet,
        passwordHash,
        emailVerified: false,
        status: "pending",
        loginAttemptCount: 0,
        loginLockedUntil: null,
      });
    }

    const otp = await assignAndSendOtp(manufacturer, "signup");

    return res.status(201).json({
      ...buildOtpResponse(
        "Signup OTP sent to the official email address.",
        otp
      ),
      manufacturer: sanitizeManufacturer(manufacturer),
    });
  } catch (error) {
    console.error("Manufacturer signup failed:", error);
    return res.status(500).json({
      error: "Failed to create manufacturer",
      details: error.message,
    });
  }
});

app.post("/api/manufacturers/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const manufacturer = await Manufacturer.findOne({
      officialEmail: normalizedEmail,
    });

    if (!manufacturer) {
      return res.status(401).json({
        error: "Invalid credentials",
        loginAttemptsRemaining: LOGIN_MAX_ATTEMPTS,
      });
    }

    if (isLoginLocked(manufacturer)) {
      return res.status(429).json({
        error: `Too many failed login attempts. Try again after ${new Date(
          manufacturer.loginLockedUntil
        ).toLocaleString()}.`,
        loginAttemptsRemaining: 0,
      });
    }

    const passwordMatches = await bcrypt.compare(
      String(password),
      manufacturer.passwordHash
    );

    if (!passwordMatches) {
      manufacturer.loginAttemptCount += 1;
      let loginAttemptsRemaining = LOGIN_MAX_ATTEMPTS - manufacturer.loginAttemptCount;

      if (manufacturer.loginAttemptCount >= LOGIN_MAX_ATTEMPTS) {
        manufacturer.loginLockedUntil = new Date(
          Date.now() + LOGIN_LOCK_MINUTES * 60 * 1000
        );
        manufacturer.loginAttemptCount = 0;
        loginAttemptsRemaining = 0;
      }

      await manufacturer.save();

      return res.status(401).json({
        error:
          loginAttemptsRemaining > 0
            ? `Invalid credentials. ${loginAttemptsRemaining} login attempt${
                loginAttemptsRemaining === 1 ? "" : "s"
              } remaining.`
            : `Invalid credentials. Login locked for ${LOGIN_LOCK_MINUTES} minutes.`,
        loginAttemptsRemaining,
      });
    }

    resetLoginAttemptState(manufacturer);
    await manufacturer.save();

    if (!manufacturer.emailVerified) {
      const otp = await assignAndSendOtp(manufacturer, "signup");
      return res.status(403).json({
        ...buildOtpResponse(
          "Email not verified. A signup OTP has been sent again.",
          otp
        ),
        requiresOtp: true,
        otpPurpose: "signup",
        manufacturer: sanitizeManufacturer(manufacturer),
      });
    }

    const otp = await assignAndSendOtp(manufacturer, "login");

    return res.json({
      ...buildOtpResponse("Login OTP sent to the official email address.", otp),
      requiresOtp: true,
      otpPurpose: "login",
      manufacturer: sanitizeManufacturer(manufacturer),
    });
  } catch (error) {
    console.error("Manufacturer login failed:", error);
    return res.status(500).json({
      error: "Failed to authenticate manufacturer",
      details: error.message,
    });
  }
});

app.post("/api/manufacturers/verify-signup-otp", async (req, res) => {
  try {
    const { email, otp } = req.body || {};

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    const manufacturer = await Manufacturer.findOne({
      officialEmail: String(email).trim().toLowerCase(),
    });

    if (!manufacturer) {
      return res.status(404).json({ error: "Manufacturer account not found" });
    }

    if (manufacturer.otpPurpose !== "signup" || !manufacturer.otpHash) {
      return res.status(400).json({ error: "No signup OTP is active" });
    }

    if (
      !manufacturer.otpExpiresAt ||
      new Date(manufacturer.otpExpiresAt).getTime() < Date.now()
    ) {
      clearOtpState(manufacturer);
      await manufacturer.save();
      return res.status(400).json({ error: "OTP has expired" });
    }

    if (manufacturer.otpAttemptCount >= OTP_MAX_ATTEMPTS) {
      clearOtpState(manufacturer);
      await manufacturer.save();
      return res.status(429).json({ error: "Maximum OTP attempts exceeded" });
    }

    if (manufacturer.otpHash !== hashOtp(otp)) {
      manufacturer.otpAttemptCount += 1;
      await manufacturer.save();
      return res.status(400).json({ error: "Invalid OTP" });
    }

    manufacturer.emailVerified = true;
    clearOtpState(manufacturer);
    await manufacturer.save();

    const token = createToken(manufacturer);

    return res.json({
      success: true,
      message: "Signup verified successfully.",
      token,
      manufacturer: sanitizeManufacturer(manufacturer),
    });
  } catch (error) {
    console.error("Signup OTP verification failed:", error);
    return res.status(500).json({
      error: "Failed to verify signup OTP",
      details: error.message,
    });
  }
});

app.post("/api/manufacturers/verify-login-otp", async (req, res) => {
  try {
    const { email, otp } = req.body || {};

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    const manufacturer = await Manufacturer.findOne({
      officialEmail: String(email).trim().toLowerCase(),
    });

    if (!manufacturer) {
      return res.status(404).json({ error: "Manufacturer account not found" });
    }

    if (!manufacturer.emailVerified) {
      return res.status(403).json({ error: "Email verification is required" });
    }

    if (manufacturer.otpPurpose !== "login" || !manufacturer.otpHash) {
      return res.status(400).json({ error: "No login OTP is active" });
    }

    if (
      !manufacturer.otpExpiresAt ||
      new Date(manufacturer.otpExpiresAt).getTime() < Date.now()
    ) {
      clearOtpState(manufacturer);
      await manufacturer.save();
      return res.status(400).json({ error: "OTP has expired" });
    }

    if (manufacturer.otpAttemptCount >= OTP_MAX_ATTEMPTS) {
      clearOtpState(manufacturer);
      await manufacturer.save();
      return res.status(429).json({ error: "Maximum OTP attempts exceeded" });
    }

    if (manufacturer.otpHash !== hashOtp(otp)) {
      manufacturer.otpAttemptCount += 1;
      await manufacturer.save();
      return res.status(400).json({ error: "Invalid OTP" });
    }

    clearOtpState(manufacturer);
    await manufacturer.save();

    const token = createToken(manufacturer);

    return res.json({
      success: true,
      message: "Login verified successfully.",
      token,
      manufacturer: sanitizeManufacturer(manufacturer),
    });
  } catch (error) {
    console.error("Login OTP verification failed:", error);
    return res.status(500).json({
      error: "Failed to verify login OTP",
      details: error.message,
    });
  }
});

app.post("/api/manufacturers/forgot-password", async (req, res) => {
  try {
    const { email } = req.body || {};

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const manufacturer = await Manufacturer.findOne({
      officialEmail: normalizedEmail,
    });

    if (manufacturer && manufacturer.emailVerified) {
      if (!canResendOtp(manufacturer)) {
        return res.status(429).json({
          error: `Please wait ${OTP_RESEND_COOLDOWN_SECONDS} seconds before requesting a new OTP`,
        });
      }

      const otp = await assignAndSendOtp(manufacturer, "password-reset");

      return res.json(
        buildOtpResponse(
          "If this email exists, a password reset OTP has been sent.",
          otp
        )
      );
    }

    return res.json({
      success: true,
      message: "If this email exists, a password reset OTP has been sent.",
    });
  } catch (error) {
    console.error("Forgot password request failed:", error);
    return res.status(500).json({
      error: "Failed to start password reset",
      details: error.message,
    });
  }
});

app.post("/api/manufacturers/verify-reset-otp", async (req, res) => {
  try {
    const { email, otp } = req.body || {};

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    const manufacturer = await Manufacturer.findOne({
      officialEmail: String(email).trim().toLowerCase(),
    });

    if (!manufacturer) {
      return res.status(404).json({ error: "Manufacturer account not found" });
    }

    if (!manufacturer.emailVerified) {
      return res.status(403).json({ error: "Email verification is required" });
    }

    if (manufacturer.otpPurpose !== "password-reset" || !manufacturer.otpHash) {
      return res.status(400).json({ error: "No password reset OTP is active" });
    }

    if (
      !manufacturer.otpExpiresAt ||
      new Date(manufacturer.otpExpiresAt).getTime() < Date.now()
    ) {
      clearOtpState(manufacturer);
      await manufacturer.save();
      return res.status(400).json({ error: "OTP has expired" });
    }

    if (manufacturer.otpAttemptCount >= OTP_MAX_ATTEMPTS) {
      clearOtpState(manufacturer);
      await manufacturer.save();
      return res.status(429).json({ error: "Maximum OTP attempts exceeded" });
    }

    if (manufacturer.otpHash !== hashOtp(otp)) {
      manufacturer.otpAttemptCount += 1;
      await manufacturer.save();
      return res.status(400).json({ error: "Invalid OTP" });
    }

    clearOtpState(manufacturer);
    await manufacturer.save();

    return res.json({
      success: true,
      message: "OTP verified successfully.",
      resetToken: createPasswordResetToken(manufacturer),
    });
  } catch (error) {
    console.error("Reset OTP verification failed:", error);
    return res.status(500).json({
      error: "Failed to verify reset OTP",
      details: error.message,
    });
  }
});

app.post("/api/manufacturers/resend-otp", async (req, res) => {
  try {
    const { email, purpose } = req.body || {};

    if (!email || !purpose) {
      return res.status(400).json({ error: "Email and purpose are required" });
    }

    if (!["signup", "login", "password-reset"].includes(purpose)) {
      return res.status(400).json({ error: "Invalid OTP purpose" });
    }

    const manufacturer = await Manufacturer.findOne({
      officialEmail: String(email).trim().toLowerCase(),
    });

    if (!manufacturer) {
      return res.status(404).json({ error: "Manufacturer account not found" });
    }

    if (
      (purpose === "login" || purpose === "password-reset") &&
      !manufacturer.emailVerified
    ) {
      return res.status(403).json({ error: "Email verification is required" });
    }

    if (!canResendOtp(manufacturer)) {
      return res.status(429).json({
        error: `Please wait ${OTP_RESEND_COOLDOWN_SECONDS} seconds before requesting a new OTP`,
      });
    }

    const otp = await assignAndSendOtp(manufacturer, purpose);

    return res.json(
      buildOtpResponse("A new OTP has been sent successfully.", otp)
    );
  } catch (error) {
    console.error("OTP resend failed:", error);
    return res.status(500).json({
      error: "Failed to resend OTP",
      details: error.message,
    });
  }
});

app.post("/api/manufacturers/reset-password", async (req, res) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body || {};

    if (!resetToken || !newPassword || !confirmPassword) {
      return res.status(400).json({
        error: "Reset token, new password, and confirm password are required",
      });
    }

    if (String(newPassword).length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters" });
    }

    if (String(newPassword) !== String(confirmPassword)) {
      return res
        .status(400)
        .json({ error: "Password and confirm password do not match" });
    }

    let payload;
    try {
      payload = jwt.verify(resetToken, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ error: "Invalid or expired reset token" });
    }

    if (payload?.purpose !== "password-reset" || !payload?.manufacturerId) {
      return res.status(401).json({ error: "Invalid reset token" });
    }

    const manufacturer = await Manufacturer.findById(payload.manufacturerId);

    if (!manufacturer) {
      return res.status(404).json({ error: "Manufacturer account not found" });
    }

    if (
      manufacturer.officialEmail.toLowerCase() !==
      String(payload.officialEmail || "").toLowerCase()
    ) {
      return res.status(401).json({ error: "Invalid reset token" });
    }

    manufacturer.passwordHash = await bcrypt.hash(String(newPassword), 12);
    clearOtpState(manufacturer);
    resetLoginAttemptState(manufacturer);
    await manufacturer.save();

    return res.json({
      success: true,
      message: "Password reset successfully. You can now login.",
    });
  } catch (error) {
    console.error("Password reset failed:", error);
    return res.status(500).json({
      error: "Failed to reset password",
      details: error.message,
    });
  }
});

app.post("/api/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    if (
      normalizedEmail !== ADMIN_EMAIL.toLowerCase() ||
      String(password) !== ADMIN_PASSWORD
    ) {
      return res.status(401).json({ error: "Invalid admin credentials" });
    }

    return res.json({
      success: true,
      message: "Admin login successful.",
      token: createAdminToken(),
      admin: { email: ADMIN_EMAIL },
    });
  } catch (error) {
    console.error("Admin login failed:", error);
    return res.status(500).json({
      error: "Failed to login as admin",
      details: error.message,
    });
  }
});

app.get("/api/admin/me", requireAdminAccess, async (req, res) => {
  return res.json({
    success: true,
    admin: { email: req.admin?.email || ADMIN_EMAIL },
  });
});

app.get("/api/admin/manufacturers", requireAdminAccess, async (req, res) => {
  try {
    const status = typeof req.query.status === "string" ? req.query.status.trim().toLowerCase() : "";
    const filter = status && ["pending", "approved", "rejected"].includes(status)
      ? { status }
      : {};

    const manufacturers = await Manufacturer.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      count: manufacturers.length,
      manufacturers: manufacturers.map(sanitizeManufacturer),
    });
  } catch (error) {
    console.error("Failed to list manufacturers:", error);
    return res.status(500).json({
      error: "Failed to fetch manufacturers",
      details: error.message,
    });
  }
});

app.patch(
  "/api/admin/manufacturers/:manufacturerId/status",
  requireAdminAccess,
  async (req, res) => {
    try {
      const { manufacturerId } = req.params;
      const nextStatus = String(req.body?.status || "").trim().toLowerCase();

      if (!["approved", "rejected", "pending"].includes(nextStatus)) {
        return res.status(400).json({
          error: "Status must be one of: pending, approved, rejected",
        });
      }

      const manufacturer = await Manufacturer.findById(manufacturerId);

      if (!manufacturer) {
        return res.status(404).json({ error: "Manufacturer account not found" });
      }

      manufacturer.status = nextStatus;
      await manufacturer.save();

      return res.json({
        success: true,
        message: `Manufacturer status updated to ${nextStatus}.`,
        manufacturer: sanitizeManufacturer(manufacturer),
      });
    } catch (error) {
      console.error("Failed to update manufacturer status:", error);
      return res.status(500).json({
        error: "Failed to update manufacturer status",
        details: error.message,
      });
    }
  }
);

app.get("/api/manufacturers/me", requireManufacturerAuth, async (req, res) => {
  return res.json({
    success: true,
    manufacturer: sanitizeManufacturer(req.manufacturer),
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    contractAddress,
    contractInitialized: !!contract,
    mongoConnected: mongoose.connection.readyState === 1,
  });
});

async function startServer() {
  try {
    mailTransporter =
      SMTP_USER && SMTP_PASS
        ? nodemailer.createTransport({
            host: SMTP_HOST,
            port: SMTP_PORT,
            secure: SMTP_SECURE,
            auth: {
              user: SMTP_USER,
              pass: SMTP_PASS,
            },
          })
        : null;
    await connectDatabase();
    await initContract();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API endpoints:`);
      console.log(`- POST http://localhost:${PORT}/api/register-product`);
      console.log(
        `- GET  http://localhost:${PORT}/api/verify-product/:imeiNumber`
      );
      console.log(`- POST http://localhost:${PORT}/api/manufacturers/signup`);
      console.log(`- POST http://localhost:${PORT}/api/manufacturers/login`);
      console.log(`- POST http://localhost:${PORT}/api/manufacturers/forgot-password`);
      console.log(
        `- POST http://localhost:${PORT}/api/manufacturers/verify-signup-otp`
      );
      console.log(
        `- POST http://localhost:${PORT}/api/manufacturers/verify-login-otp`
      );
      console.log(
        `- POST http://localhost:${PORT}/api/manufacturers/verify-reset-otp`
      );
      console.log(`- POST http://localhost:${PORT}/api/manufacturers/reset-password`);
      console.log(`- POST http://localhost:${PORT}/api/manufacturers/resend-otp`);
      console.log(`- GET  http://localhost:${PORT}/api/manufacturers/me`);
      console.log(`- POST http://localhost:${PORT}/api/admin/login`);
      console.log(`- GET  http://localhost:${PORT}/api/admin/me`);
      console.log(`- GET  http://localhost:${PORT}/api/admin/manufacturers`);
      console.log(`- PATCH http://localhost:${PORT}/api/admin/manufacturers/:manufacturerId/status`);
      console.log(`- GET  http://localhost:${PORT}/api/accounts`);
      console.log(`- GET  http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
}

startServer();
