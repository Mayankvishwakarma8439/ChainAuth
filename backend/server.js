require("dotenv").config();

const express = require("express");
const { Web3 } = require("web3");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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
    status: record.status,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
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

    if (existingManufacturer) {
      return res.status(409).json({
        error:
          "Manufacturer with this email, registration number, or wallet address already exists",
      });
    }

    const passwordHash = await bcrypt.hash(String(password), 12);
    const manufacturer = await Manufacturer.create({
      companyName: String(companyName).trim(),
      registrationNumber: normalizedRegistration,
      officialEmail: normalizedEmail,
      contactNumber: String(contactNumber).trim(),
      country: String(country).trim(),
      walletAddress: normalizedWallet,
      passwordHash,
    });

    const token = createToken(manufacturer);

    return res.status(201).json({
      success: true,
      token,
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
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const passwordMatches = await bcrypt.compare(
      String(password),
      manufacturer.passwordHash
    );

    if (!passwordMatches) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = createToken(manufacturer);

    return res.json({
      success: true,
      token,
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
