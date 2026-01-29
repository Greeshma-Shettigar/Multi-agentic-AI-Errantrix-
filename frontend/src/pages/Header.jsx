import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/Header.css";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    // localStorage.removeItem("token");
    navigate("/");
  };

  const getHeaderContent = () => {
    switch (location.pathname) {
      case "/user-dashboard":
        return (
          <div className="dashboard-header">
            <h2>🧭 Neighborhood Errand Dashboard</h2>
            <p>Post tasks and let intelligent agents handle them.</p>
          </div>
        );

      case "/delivery-dashboard":
        return (
          <div className="dashboard-header">
            <h2>🚚 Delivery Partner Dashboard</h2>
            <p>Browse tasks and place bids</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <header className="app-header">
      {/* Left section */}
      {getHeaderContent()}

      {/* Right section */}
      <div className="header-right">
        <img
          src="https://via.placeholder.com/40"
          alt="Profile"
          className="profile-image"
        />
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;
