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
const { Resend } = require("resend");

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
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const RESEND_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
const OTP_DEV_BYPASS = process.env.OTP_DEV_BYPASS === "true";
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
let resendClient = null;

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
  if (!resendClient) {
    console.log(
      `[OTP:${purpose}] No Resend credentials configured. OTP for ${to}: ${otp}`
    );
    return;
  }

  const subject =
    purpose === "signup"
      ? "Verify your manufacturer signup"
      : "Verify your manufacturer login";

  const html = `
    <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
      <h2 style="margin-bottom: 12px;">ChainAuth Manufacturer Verification</h2>
      <p>Your one-time password is:</p>
      <div style="display: inline-block; padding: 12px 18px; border-radius: 10px; background: #e0f2fe; color: #0f172a; font-size: 24px; font-weight: 700; letter-spacing: 6px;">
        ${otp}
      </div>
      <p style="margin-top: 16px;">This OTP expires in ${OTP_EXPIRY_MINUTES} minutes.</p>
      <p>If you did not request this verification, you can ignore this email.</p>
    </div>
  `;

  await resendClient.emails.send({
    from: RESEND_FROM_EMAIL,
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

function createToken(manufacturer) {
  return jwt.sign(
    {
      manufacturerId: manufacturer._id.toString(),
      officialEmail: manufacturer.officialEmail,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

async function connectDatabase() {
  await mongoose.connect(MONGODB_URI);
  console.log("MongoDB connected");
}

async function initContract() {
  try {
    accounts = await web3.eth.getAccounts();
    console.log("Available accounts:", accounts);

    if (!contractAddress) {
      const networkId = await web3.eth.net.getId();
      contractAddress = contractJson.networks[networkId]?.address;
    }

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

app.post(
  "/api/register-product",
  requireManufacturerAuth,
  async (req, res) => {
    try {
      if (!contract) {
        return res.status(500).json({ error: "Contract not initialized" });
      }

      const { imeiNumber, productName, brand, model } = req.body;

      if (!imeiNumber || !productName || !brand || !model) {
        return res.status(400).json({ error: "All fields are required" });
      }

      const exists = await contract.methods
        .isProductRegistered(imeiNumber)
        .call();
      if (exists) {
        return res
          .status(400)
          .json({ error: "Product with this IMEI already registered" });
      }

      const result = await contract.methods
        .registerProduct(imeiNumber, productName, brand, model)
        .send({
          from: accounts[0],
          gas: 500000,
        });

      res.json({
        success: true,
        message: "Product registered successfully",
        transactionHash: result.transactionHash,
        blockNumber: Number(result.blockNumber),
        gasUsed: Number(result.gasUsed),
        manufacturer: sanitizeManufacturer(req.manufacturer),
        data: {
          imeiNumber,
          productName,
          brand,
          model,
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

app.get("/api/verify-product/:imeiNumber", async (req, res) => {
  try {
    if (!contract) {
      return res.status(500).json({ error: "Contract not initialized" });
    }

    const { imeiNumber } = req.params;

    if (!imeiNumber) {
      return res.status(400).json({ error: "IMEI number is required" });
    }

    const exists = await contract.methods
      .isProductRegistered(imeiNumber)
      .call();

    if (!exists) {
      return res.json({
        isValid: false,
        message: "Product not found in registry",
      });
    }

    const product = await contract.methods.getProduct(imeiNumber).call();

    res.json({
      isValid: true,
      message: "Product verified successfully",
      product: {
        productName: product.productName,
        brand: product.brand,
        model: product.model,
        imeiNumber: product.imeiNumber,
        manufacturer: product.manufacturer,
        registrationDate: new Date(
          Number(product.registrationDate) * 1000
        ).toISOString(),
        isRegistered: product.isRegistered,
      },
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

app.post("/api/manufacturers/resend-otp", async (req, res) => {
  try {
    const { email, purpose } = req.body || {};

    if (!email || !purpose) {
      return res.status(400).json({ error: "Email and purpose are required" });
    }

    if (!["signup", "login"].includes(purpose)) {
      return res.status(400).json({ error: "Invalid OTP purpose" });
    }

    const manufacturer = await Manufacturer.findOne({
      officialEmail: String(email).trim().toLowerCase(),
    });

    if (!manufacturer) {
      return res.status(404).json({ error: "Manufacturer account not found" });
    }

    if (purpose === "login" && !manufacturer.emailVerified) {
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
    resendClient = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;
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
      console.log(
        `- POST http://localhost:${PORT}/api/manufacturers/verify-signup-otp`
      );
      console.log(
        `- POST http://localhost:${PORT}/api/manufacturers/verify-login-otp`
      );
      console.log(`- POST http://localhost:${PORT}/api/manufacturers/resend-otp`);
      console.log(`- GET  http://localhost:${PORT}/api/manufacturers/me`);
      console.log(`- GET  http://localhost:${PORT}/api/accounts`);
      console.log(`- GET  http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
}

startServer();
