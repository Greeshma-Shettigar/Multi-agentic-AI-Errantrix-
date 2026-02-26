import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Landing.css";

import Healthcare from "../assets/Healthcare.svg";
import Environment from "../assets/Environment.svg";
import Food from "../assets/Food.svg";
import Community from "../assets/Community.svg";

function Landing() {
  const [showLoginOptions, setShowLoginOptions] = useState(false);
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
  });

  const navigate = useNavigate();

  const handleLoginClick = () => {
    setShowLoginOptions((prev) => !prev);
  };

  /* ================= REGISTER ================= */

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

  /* ================= LOGIN ================= */

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginData.email,
          password: loginData.password,
          loginAs: loginRole,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Login failed");
        return;
      }

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
        <h2 className="brand-title">ERRANTRIX</h2>

        <h1 className="main-heading">
          AI-Based Multi-Agent Framework
          <br />
          for Distributed Task Automation
        </h1>

        <p className="main-description">
          A decentralized marketplace where intelligent agents and humans
          collaborate to handle micro-level errands like grocery pickup, parcel
          delivery, and medicine collection — efficiently and in real time.
        </p>

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
                    setLoginData({ email: "", password: "" });
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
                    setLoginData({ email: "", password: "" });
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

      {/* SERVICES SECTION */}
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

      {/* ================= SIGNUP MODAL ================= */}
      {showSignup && (
        <div className="auth-modal-overlay">
          <div className="modern-modal">
            <div className="modal-left">
              <h2>Let's Get Started!</h2>
            </div>

            <div className="modal-right">
              <h3>Create Account</h3>

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

                <button type="submit" className="modal-btn">
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
        </div>
      )}

      {/* ================= LOGIN MODAL ================= */}
      {showLogin && (
        <div className="auth-modal-overlay">
          <div className="modern-modal">
            <div className="modal-left">
              <h2>Welcome Back!</h2>
            </div>

            <div className="modal-right">
              <h3>
                Login as {loginRole === "user" ? "User" : "Delivery Partner"}
              </h3>

              <form onSubmit={handleLogin}>
                <input
                  type="email"
                  placeholder="Email"
                  required
                  value={loginData.email}
                  onChange={(e) =>
                    setLoginData({ ...loginData, email: e.target.value })
                  }
                />

                <input
                  type="password"
                  placeholder="Password"
                  required
                  value={loginData.password}
                  onChange={(e) =>
                    setLoginData({ ...loginData, password: e.target.value })
                  }
                />

                <button type="submit" className="modal-btn">
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
        </div>
      )}
    </div>
  );
}

export default Landing;
