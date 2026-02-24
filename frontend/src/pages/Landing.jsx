import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Landing.css";

import Healthcare from "../assets/Healthcare.svg";
import Environment from "../assets/Environment.svg";
import Food from "../assets/Food.svg";
import Community from "../assets/Community.svg";

function Landing() {
  const [showLoginOptions, setShowLoginOptions] = useState(false); // ✅ Moved these inside the component
  const [showSignup, setShowSignup] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginRole, setLoginRole] = useState("");
  const [signupData, setSignupData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "user",
  });
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
    role: "",
  });

  const navigate = useNavigate();
  console.log("Signup:", showSignup, "Login:", showLogin);

  const handleLoginClick = () => {
    setShowLoginOptions((prev) => !prev);
  };
  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  // Handle Input Change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- AUTHENTICATION FUNCTIONS ---

  // 1. Handle Registration
  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signupData),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Registration failed");
        return;
      }

      alert("Registration successful");
      setShowSignup(false);
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  // 2. Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginData.email,
          password: loginData.password,
          loginAs: loginRole, // 🔥 VERY IMPORTANT
        }),
      });

      const data = await res.json();

      // ❌ LOGIN FAILED
      if (!res.ok) {
        alert(data.message || "Login failed");
        return; // ⛔ STOP HERE
       }

      // ✅ LOGIN SUCCESS
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.user.activeRole);
      localStorage.setItem("userId", data.user.id);

      if (data.user.activeRole === "user") {
        navigate("/user-dashboard");
      } else {
        navigate("/delivery-dashboard");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  return (
    <div className="landing-container">
      {/* HERO SECTION */}
      <section className="hero-section">
        {/* Top Center Brand */}
        <h2 className="brand-title">ERRANTRIX</h2>

        {/* Main Heading */}
        <h1 className="main-heading">
          AI-Based Multi-Agent Framework
          <br />
          for Distributed Task Automation
        </h1>

        {/* Description */}
        <p className="main-description">
          A decentralized marketplace where intelligent agents and humans
          collaborate to handle micro-level errands like grocery pickup, parcel
          delivery, and medicine collection — efficiently and in real time.
        </p>

        {/* Buttons BELOW description */}
        <div className="bottom-actions">
          <button
            className="cta-btn cta-outline"
            onClick={() => setShowSignup(true)}
          >
            Sign Up
          </button>

          <div className="login-wrapper">
            <button className="cta-btn cta-filled" onClick={handleLoginClick}>
              Login
            </button>

            {showLoginOptions && (
              <div className="login-dropdown">
                <button
                  className="dropdown-btn"
                  onClick={() => {
                    setLoginRole("user");
                    setLoginData({ email: "", password: "", role: "user" });
                    setShowLogin(true);
                    setShowLoginOptions(false);
                  }}
                >
                  Login as User
                </button>
                <button
                  className="dropdown-btn"
                  onClick={() => {
                    setLoginRole("delivery");
                    setLoginData({ email: "", password: "", role: "delivery" });
                    setShowLogin(true);
                    setShowLoginOptions(false);
                  }}
                >
                  Login as Delivery Partner
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SCROLL DOWN SERVICES SECTION */}
      <section className="services-section">
        <div className="services-popup">
          <div className="card-row">
            <div className="service-card">
              <img src={Healthcare} alt="Healthcare" />
              <h3>Healthcare</h3>
            </div>

            <div className="service-card">
              <img src={Environment} alt="Environment" />
              <h3>Environment</h3>
            </div>

            <div className="service-card">
              <img src={Food} alt="Food" />
              <h3>Food</h3>
            </div>

            <div className="service-card">
              <img src={Community} alt="Community" />
              <h3>Community</h3>
            </div>
          </div>

          <p className="service-description">
            We provide smart errand automation services including grocery
            delivery, medicine pickup, eco-friendly parcel transport, local
            community assistance, and intelligent task coordination powered by
            AI agents.
          </p>
        </div>
      </section>
      {showSignup && (
        <div className="auth-modal-overlay">
          <div className="auth-modal">
            <h2>Create Account</h2>

            <form onSubmit={handleRegister}>
              <input
                type="text"
                placeholder="Full Name"
                required
                value={signupData.fullName}
                onChange={(e) =>
                  setSignupData({ ...signupData, fullName: e.target.value })
                }
              />

              <input
                type="email"
                placeholder="Email"
                required
                value={signupData.email}
                onChange={(e) =>
                  setSignupData({ ...signupData, email: e.target.value })
                }
              />

              <input
                type="password"
                placeholder="Password"
                required
                value={signupData.password}
                onChange={(e) =>
                  setSignupData({ ...signupData, password: e.target.value })
                }
              />

              <button className="btn btn-filled" type="submit">
                Register
              </button>

              <button
                type="button"
                className="close-btn"
                onClick={() => setShowSignup(false)}
              >
                Close
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ✅ LOGIN MODAL */}
      {showLogin && (
        <div className="auth-modal-overlay">
          <div className="auth-modal">
            <h2>
              Login as {loginRole === "user" ? "User" : "Delivery Partner"}
            </h2>

            <form onSubmit={handleLogin}>
              <input
                type="email"
                placeholder="Email"
                required
                value={loginData.email}
                onChange={(e) =>
                  setLoginData({
                    ...loginData,
                    email: e.target.value,
                    role: loginRole,
                  })
                }
              />

              <input
                type="password"
                placeholder="Password"
                required
                value={loginData.password}
                onChange={(e) =>
                  setLoginData({
                    ...loginData,
                    password: e.target.value,
                    role: loginRole,
                  })
                }
              />

              <button className="btn btn-filled" type="submit">
                Login
              </button>

              <button
                type="button"
                className="close-btn"
                onClick={() => setShowLogin(false)}
              >
                Close
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Landing;
