import React, { useEffect, useMemo, useState } from "react";
import HomePage from "./components/HomePage";
import ManufacturerLogin from "./components/ManufacturerLogin";
import ManufacturerOtp from "./components/ManufacturerOtp";
import ManufacturerSignup from "./components/ManufacturerSignup";
import ManufacturerDashboard from "./components/ManufacturerDashboard";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";

const API_BASE_URL = `http://${window.location.hostname}:3000/api`;
const REQUEST_HEADERS = { "Content-Type": "application/json" };
const MANUFACTURER_TOKEN_KEY = "manufacturer_auth_token";
const ADMIN_TOKEN_KEY = "admin_auth_token";

function getHashRoute() {
  return window.location.hash || "#/";
}

function setHashRoute(route) {
  if (window.location.hash !== route) {
    window.location.hash = route;
  }
}

function getInitialViewFromHash() {
  const hash = getHashRoute();
  return hash.startsWith("#/admin") ? "admin-login" : "home";
}

export default function App() {
  const [view, setView] = useState(() => getInitialViewFromHash());
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
  const [adminForm, setAdminForm] = useState({
    email: "",
    password: "",
  });

  const [loadingAuth, setLoadingAuth] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [signupError, setSignupError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [adminError, setAdminError] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpFlow, setOtpFlow] = useState(null);
  const [activeManufacturer, setActiveManufacturer] = useState(null);
  const [activeAdmin, setActiveAdmin] = useState(null);
  const [authToken, setAuthToken] = useState(
    () => window.localStorage.getItem(MANUFACTURER_TOKEN_KEY) || ""
  );
  const [adminToken, setAdminToken] = useState(
    () => window.localStorage.getItem(ADMIN_TOKEN_KEY) || ""
  );

  useEffect(() => {
    checkHealth();
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = getHashRoute();
      if (hash.startsWith("#/admin")) {
        setView(adminToken ? "admin-dashboard" : "admin-login");
      } else if (view === "admin-login" || view === "admin-dashboard") {
        setView(authToken ? "manufacturer-dashboard" : "home");
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    handleHashChange();
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [adminToken, authToken, view]);

  useEffect(() => {
    if (!authToken) {
      return;
    }

    let cancelled = false;

    const restoreManufacturerSession = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/manufacturers/me`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Session restore failed.");
        }

        if (!cancelled) {
          setActiveManufacturer(data.manufacturer);
          if (!getHashRoute().startsWith("#/admin")) {
            setView("manufacturer-dashboard");
          }
        }
      } catch (error) {
        if (!cancelled) {
          window.localStorage.removeItem(MANUFACTURER_TOKEN_KEY);
          setAuthToken("");
          setActiveManufacturer(null);
        }
      }
    };

    restoreManufacturerSession();

    return () => {
      cancelled = true;
    };
  }, [authToken]);

  useEffect(() => {
    if (!adminToken) {
      return;
    }

    let cancelled = false;

    const restoreAdminSession = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/admin/me`, {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Admin session restore failed.");
        }

        if (!cancelled) {
          setActiveAdmin(data.admin);
          if (getHashRoute().startsWith("#/admin")) {
            setView("admin-dashboard");
          }
        }
      } catch (error) {
        if (!cancelled) {
          window.localStorage.removeItem(ADMIN_TOKEN_KEY);
          setAdminToken("");
          setActiveAdmin(null);
          if (getHashRoute().startsWith("#/admin")) {
            setView("admin-login");
          }
        }
      }
    };

    restoreAdminSession();

    return () => {
      cancelled = true;
    };
  }, [adminToken]);

  const normalizedImei = useMemo(
    () => verificationInput.replace(/\D/g, "").slice(0, 15),
    [verificationInput]
  );
  const normalizedMac = useMemo(
    () => verificationInput.trim().replace(/-/g, ":").toUpperCase(),
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

    let identifierValue = "";
    if (verificationType === "imei") {
      if (normalizedImei.length !== 15) {
        setVerificationResult({
          type: "error",
          message: "IMEI must be exactly 15 digits.",
        });
        return;
      }
      identifierValue = normalizedImei;
    } else {
      const macRegex = /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/;
      if (!macRegex.test(normalizedMac)) {
        setVerificationResult({
          type: "error",
          message: "Enter a valid MAC address, e.g. AA:BB:CC:DD:EE:FF",
        });
        return;
      }
      identifierValue = normalizedMac;
    }

    setVerifying(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/verify-product/${verificationType}/${encodeURIComponent(identifierValue)}`
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

      setOtpCode("");
      setOtpFlow({
        purpose: "signup",
        email: signupForm.officialEmail.trim().toLowerCase(),
        message: data.message,
        devOtp: data.devOtp || "",
      });
      setView("manufacturer-otp");

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
        if (data.requiresOtp) {
          setOtpCode("");
          setOtpError("");
          setOtpFlow({
            purpose: data.otpPurpose || "signup",
            email: loginForm.email.trim().toLowerCase(),
            message: data.message,
            devOtp: data.devOtp || "",
          });
          setView("manufacturer-otp");
          return;
        }
        if (typeof data.loginAttemptsRemaining === "number") {
          setLoginError(
            data.error ||
              `Login failed. ${data.loginAttemptsRemaining} attempts remaining.`
          );
        } else {
          setLoginError(data.error || "Login failed.");
        }
        return;
      }

      if (data.requiresOtp) {
        setOtpCode("");
        setOtpError("");
        setOtpFlow({
          purpose: data.otpPurpose || "login",
          email: loginForm.email.trim().toLowerCase(),
          message: data.message,
          devOtp: data.devOtp || "",
        });
        setView("manufacturer-otp");
        return;
      }

      window.localStorage.setItem(MANUFACTURER_TOKEN_KEY, data.token);
      setAuthToken(data.token);
      setActiveManufacturer(data.manufacturer);
      setView("manufacturer-dashboard");
    } catch (error) {
      setLoginError("Unable to login. Make sure the backend is running.");
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleVerifyOtp = async () => {
    setOtpError("");

    if (!otpFlow?.email || !otpFlow?.purpose) {
      setOtpError("OTP verification session is missing.");
      return;
    }

    if (otpCode.length !== 6) {
      setOtpError("Enter the 6-digit OTP.");
      return;
    }

    setLoadingAuth(true);
    try {
      const route =
        otpFlow.purpose === "signup"
          ? "/manufacturers/verify-signup-otp"
          : "/manufacturers/verify-login-otp";

      const response = await fetch(`${API_BASE_URL}${route}`, {
        method: "POST",
        headers: REQUEST_HEADERS,
        body: JSON.stringify({
          email: otpFlow.email,
          otp: otpCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setOtpError(data.error || "OTP verification failed.");
        return;
      }

      window.localStorage.setItem(MANUFACTURER_TOKEN_KEY, data.token);
      setAuthToken(data.token);
      setActiveManufacturer(data.manufacturer);
      setOtpFlow(null);
      setOtpCode("");
      setView("manufacturer-dashboard");
    } catch (error) {
      setOtpError("Unable to verify OTP. Make sure the backend is running.");
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleResendOtp = async () => {
    setOtpError("");

    if (!otpFlow?.email || !otpFlow?.purpose) {
      setOtpError("OTP verification session is missing.");
      return;
    }

    setLoadingAuth(true);
    try {
      const response = await fetch(`${API_BASE_URL}/manufacturers/resend-otp`, {
        method: "POST",
        headers: REQUEST_HEADERS,
        body: JSON.stringify({
          email: otpFlow.email,
          purpose: otpFlow.purpose,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setOtpError(data.error || "Failed to resend OTP.");
        return;
      }

      setOtpFlow((prev) =>
        prev
          ? {
              ...prev,
              message: data.message,
              devOtp: data.devOtp || "",
            }
          : prev
      );
    } catch (error) {
      setOtpError("Unable to resend OTP. Make sure the backend is running.");
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleAdminLogin = async () => {
    setAdminError("");

    if (!adminForm.email.trim() || !adminForm.password.trim()) {
      setAdminError("Email and password are required.");
      return;
    }

    setLoadingAuth(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/login`, {
        method: "POST",
        headers: REQUEST_HEADERS,
        body: JSON.stringify({
          email: adminForm.email.trim(),
          password: adminForm.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setAdminError(data.error || "Admin login failed.");
        return;
      }

      window.localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
      setAdminToken(data.token);
      setActiveAdmin(data.admin);
      setHashRoute("#/admin/dashboard");
      setView("admin-dashboard");
    } catch (error) {
      setAdminError("Unable to login as admin. Make sure the backend is running.");
    } finally {
      setLoadingAuth(false);
    }
  };

  const logoutManufacturer = () => {
    window.localStorage.removeItem(MANUFACTURER_TOKEN_KEY);
    setAuthToken("");
    setActiveManufacturer(null);
    setOtpFlow(null);
    setOtpCode("");
    setView("home");
    if (!getHashRoute().startsWith("#/admin")) {
      setHashRoute("#/");
    }
  };

  const logoutAdmin = () => {
    window.localStorage.removeItem(ADMIN_TOKEN_KEY);
    setAdminToken("");
    setActiveAdmin(null);
    setAdminError("");
    setHashRoute("#/admin/login");
    setView("admin-login");
  };

  if (view === "admin-login") {
    return (
      <AdminLogin
        form={adminForm}
        setForm={setAdminForm}
        onSubmit={handleAdminLogin}
        loading={loadingAuth}
        error={adminError}
      />
    );
  }

  if (view === "admin-dashboard") {
    return (
      <AdminDashboard
        adminEmail={activeAdmin?.email || adminForm.email}
        adminToken={adminToken}
        onLogout={logoutAdmin}
      />
    );
  }

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

  if (view === "manufacturer-otp") {
    return (
      <ManufacturerOtp
        otpCode={otpCode}
        setOtpCode={setOtpCode}
        otpFlow={otpFlow}
        loading={loadingAuth}
        error={otpError}
        onVerify={handleVerifyOtp}
        onResend={handleResendOtp}
        onBack={() => {
          setOtpError("");
          setOtpCode("");
          if (otpFlow?.purpose === "signup") {
            setView("manufacturer-signup");
          } else {
            setView("manufacturer-login");
          }
        }}
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
        authToken={authToken}
        onLogout={logoutManufacturer}
      />
    );
  }

  return (
    <HomePage
      onManufacturerLogin={() => setView("manufacturer-login")}
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
