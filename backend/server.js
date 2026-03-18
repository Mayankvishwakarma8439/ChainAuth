const express = require("express");
const { Web3 } = require("web3");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(express.json());

BigInt.prototype.toJSON = function () {
  return this.toString();
};

const web3 = new Web3("http://127.0.0.1:8545");

const contractPath = path.join(
  __dirname,
  "../blockchain/build/contracts/ProductRegistry.json"
);
const contractJson = JSON.parse(fs.readFileSync(contractPath, "utf8"));
const contractABI = contractJson.abi;

let contractAddress = process.env.CONTRACT_ADDRESS || null;
let contract = null;
let accounts = [];

const MANUFACTURERS_FILE = path.join(__dirname, "data", "manufacturers.json");
const PASSWORD_KEYLEN = 64;

function ensureManufacturersFile() {
  try {
    if (!fs.existsSync(MANUFACTURERS_FILE)) {
      fs.mkdirSync(path.dirname(MANUFACTURERS_FILE), { recursive: true });
      fs.writeFileSync(MANUFACTURERS_FILE, "[]");
    }
  } catch (error) {
    console.error("Failed to initialize manufacturers store:", error);
  }
}

function loadManufacturers() {
  ensureManufacturersFile();
  try {
    const raw = fs.readFileSync(MANUFACTURERS_FILE, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Failed to read manufacturers store:", error);
    return [];
  }
}

function saveManufacturers(records) {
  ensureManufacturersFile();
  fs.writeFileSync(MANUFACTURERS_FILE, JSON.stringify(records, null, 2));
}

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, PASSWORD_KEYLEN).toString("hex");
}

function sanitizeManufacturer(record) {
  if (!record) return null;
  const { passwordHash, passwordSalt, ...safe } = record;
  return safe;
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

app.post("/api/register-product", async (req, res) => {
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
});

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

app.post("/api/manufacturers/signup", (req, res) => {
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ error: "Invalid email address" });
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(normalizedWallet)) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }

    const manufacturers = loadManufacturers();
    const emailExists = manufacturers.some(
      (entry) => entry.officialEmail === normalizedEmail
    );
    if (emailExists) {
      return res
        .status(409)
        .json({ error: "Manufacturer with this email already exists" });
    }

    const id = crypto.randomUUID();
    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = hashPassword(String(password), salt);

    const record = {
      id,
      companyName: String(companyName).trim(),
      registrationNumber: String(registrationNumber).trim(),
      officialEmail: normalizedEmail,
      contactNumber: String(contactNumber).trim(),
      country: String(country).trim(),
      walletAddress: normalizedWallet,
      passwordHash,
      passwordSalt: salt,
      createdAt: new Date().toISOString(),
    };

    manufacturers.push(record);
    saveManufacturers(manufacturers);

    return res.status(201).json({
      success: true,
      manufacturer: sanitizeManufacturer(record),
    });
  } catch (error) {
    console.error("Manufacturer signup failed:", error);
    return res.status(500).json({
      error: "Failed to create manufacturer",
      details: error.message,
    });
  }
});

app.post("/api/manufacturers/login", (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const manufacturers = loadManufacturers();
    const record = manufacturers.find(
      (entry) => entry.officialEmail === normalizedEmail
    );

    if (!record) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const attemptedHash = hashPassword(String(password), record.passwordSalt);
    if (attemptedHash !== record.passwordHash) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    return res.json({
      success: true,
      manufacturer: sanitizeManufacturer(record),
    });
  } catch (error) {
    console.error("Manufacturer login failed:", error);
    return res.status(500).json({
      error: "Failed to authenticate manufacturer",
      details: error.message,
    });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    contractAddress: contractAddress,
    contractInitialized: !!contract,
  });
});

const PORT = process.env.PORT || 3000;

// Start server after contract initialization
initContract().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API endpoints:`);
    console.log(`- POST http://localhost:${PORT}/api/register-product`);
    console.log(
      `- GET  http://localhost:${PORT}/api/verify-product/:imeiNumber`
    );
    console.log(`- POST http://localhost:${PORT}/api/manufacturers/signup`);
    console.log(`- POST http://localhost:${PORT}/api/manufacturers/login`);
    console.log(`- GET  http://localhost:${PORT}/api/accounts`);
    console.log(`- GET  http://localhost:${PORT}/api/health`);
  });
});
