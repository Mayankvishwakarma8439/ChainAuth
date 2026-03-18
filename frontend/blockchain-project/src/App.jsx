import React, { useEffect, useMemo, useState } from "react";
import HomePage from "./components/HomePage";
import ManufacturerLogin from "./components/ManufacturerLogin";
import ManufacturerSignup from "./components/ManufacturerSignup";
import ManufacturerDashboard from "./components/ManufacturerDashboard";

const API_BASE_URL = `http://${window.location.hostname}:3000/api`;
const REQUEST_HEADERS = { "Content-Type": "application/json" };

export default function App() {
  const [view, setView] = useState("home");
  const [systemStatus, setSystemStatus] = useState(null);

  const [verificationType, setVerificationType] = useState("imei");
  const [verificationInput, setVerificationInput] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({
    companyName: "",
    registrationNumber: "",
    officialEmail: "",
    contactNumber: "",
    country: "",
    walletAddress: "",
    password: "",
    confirmPassword: "",
  });

  const [loadingAuth, setLoadingAuth] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [signupError, setSignupError] = useState("");
  const [activeManufacturer, setActiveManufacturer] = useState(null);

  useEffect(() => {
    checkHealth();
  }, []);

  const normalizedImei = useMemo(
    () => verificationInput.replace(/\D/g, "").slice(0, 15),
    [verificationInput]
  );

  const checkHealth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const data = await response.json();
      setSystemStatus(data);
    } catch (error) {
      console.error("Health check failed:", error);
      setSystemStatus({ contractInitialized: false });
    }
  };

  const handleVerifyIdentifier = async () => {
    setVerificationResult(null);

    if (verificationType === "imei") {
      if (normalizedImei.length !== 15) {
        setVerificationResult({
          type: "error",
          message: "IMEI must be exactly 15 digits.",
        });
        return;
      }

      setVerifying(true);
      try {
        const response = await fetch(
          `${API_BASE_URL}/verify-product/${normalizedImei}`
        );
        const data = await response.json();

        if (response.ok && data.isValid) {
          setVerificationResult({
            type: "success",
            message: data.message || "Product is authentic.",
            data: data.product,
          });
        } else {
          setVerificationResult({
            type: "error",
            message: data.message || data.error || "Product not found on-chain.",
          });
        }
      } catch (error) {
        setVerificationResult({
          type: "error",
          message: "Unable to verify right now. Make sure backend is running.",
        });
      } finally {
        setVerifying(false);
      }
      return;
    }

    const macRegex = /^([0-9A-Fa-f]{2}[:\-]){5}[0-9A-Fa-f]{2}$/;
    if (!macRegex.test(verificationInput.trim())) {
      setVerificationResult({
        type: "error",
        message: "Enter a valid MAC address, e.g. AA:BB:CC:DD:EE:FF",
      });
      return;
    }

    setVerificationResult({
      type: "error",
      message:
        "MAC verification UI is ready, but backend/blockchain endpoint is not implemented yet.",
    });
  };

  const handleSignup = async () => {
    setSignupError("");

    const requiredFields = [
      signupForm.companyName,
      signupForm.registrationNumber,
      signupForm.officialEmail,
      signupForm.contactNumber,
      signupForm.country,
      signupForm.walletAddress,
      signupForm.password,
      signupForm.confirmPassword,
    ];

    if (requiredFields.some((field) => !field.trim())) {
      setSignupError("All fields are required.");
      return;
    }

    if (signupForm.password !== signupForm.confirmPassword) {
      setSignupError("Password and confirm password do not match.");
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(signupForm.walletAddress.trim())) {
      setSignupError("Enter a valid Ethereum wallet address.");
      return;
    }

    setLoadingAuth(true);
    try {
      const response = await fetch(`${API_BASE_URL}/manufacturers/signup`, {
        method: "POST",
        headers: REQUEST_HEADERS,
        body: JSON.stringify({
          companyName: signupForm.companyName.trim(),
          registrationNumber: signupForm.registrationNumber.trim(),
          officialEmail: signupForm.officialEmail.trim(),
          contactNumber: signupForm.contactNumber.trim(),
          country: signupForm.country.trim(),
          walletAddress: signupForm.walletAddress.trim(),
          password: signupForm.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSignupError(data.error || "Signup failed. Please try again.");
        return;
      }

      setView("manufacturer-login");
      setLoginForm({
        email: data.manufacturer?.officialEmail || signupForm.officialEmail,
        password: "",
      });

      setSignupForm({
        companyName: "",
        registrationNumber: "",
        officialEmail: "",
        contactNumber: "",
        country: "",
        walletAddress: "",
        password: "",
        confirmPassword: "",
      });
    } catch (error) {
      setSignupError("Unable to signup. Make sure the backend is running.");
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleLogin = async () => {
    setLoginError("");

    if (!loginForm.email.trim() || !loginForm.password.trim()) {
      setLoginError("Email and password are required.");
      return;
    }

    setLoadingAuth(true);
    try {
      const response = await fetch(`${API_BASE_URL}/manufacturers/login`, {
        method: "POST",
        headers: REQUEST_HEADERS,
        body: JSON.stringify({
          email: loginForm.email.trim(),
          password: loginForm.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setLoginError(data.error || "Login failed.");
        return;
      }

      setActiveManufacturer(data.manufacturer);
      setView("manufacturer-dashboard");
    } catch (error) {
      setLoginError("Unable to login. Make sure the backend is running.");
    } finally {
      setLoadingAuth(false);
    }
  };

  if (view === "manufacturer-login") {
    return (
      <ManufacturerLogin
        form={loginForm}
        setForm={setLoginForm}
        onSubmit={handleLogin}
        onBack={() => {
          setLoginError("");
          setView("home");
        }}
        onGotoSignup={() => {
          setLoginError("");
          setView("manufacturer-signup");
        }}
        loading={loadingAuth}
        loginError={loginError}
      />
    );
  }

  if (view === "manufacturer-signup") {
    return (
      <ManufacturerSignup
        form={signupForm}
        setForm={setSignupForm}
        onSubmit={handleSignup}
        onBackToLogin={() => {
          setSignupError("");
          setView("manufacturer-login");
        }}
        onBackHome={() => {
          setSignupError("");
          setView("home");
        }}
        loading={loadingAuth}
        error={signupError}
      />
    );
  }

  if (view === "manufacturer-dashboard") {
    return (
      <ManufacturerDashboard
        manufacturer={activeManufacturer}
        onLogout={() => {
          setActiveManufacturer(null);
          setView("home");
        }}
      />
    );
  }

  return (
    <HomePage
      onManufacturerLogin={() => setView("manufacturer-login")}
      onSupplierPortal={() =>
        setVerificationResult({
          type: "error",
          message: "Supplier portal UI will be the next screen to implement.",
        })
      }
      checkIdentifier={handleVerifyIdentifier}
      verificationInput={verificationType === "imei" ? normalizedImei : verificationInput}
      setVerificationInput={setVerificationInput}
      verificationType={verificationType}
      setVerificationType={setVerificationType}
      verifying={verifying}
      verificationResult={verificationResult}
      systemStatus={systemStatus}
    />
  );
}
