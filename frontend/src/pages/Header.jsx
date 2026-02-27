import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/Header.css";

const Header = ({ activeTab, setActiveTab }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <header className="app-header">
      {/* LEFT SIDE */}
      <div className="header-left">
        {location.pathname === "/delivery-dashboard" ? (
          <>
            <h2>🚚 Delivery Partner Dashboard</h2>
            <p>Browse tasks and manage assignments</p>
          </>
        ) : (
          <>
            <h2>🧭 Neighborhood Errand Dashboard</h2>
            <p>Post tasks and let intelligent agents handle them.</p>
          </>
        )}
      </div>

      {/* RIGHT SIDE */}
      <div className="header-right">
        {location.pathname === "/delivery-dashboard" && (
          <div className="header-tabs">
            <button
              className={`header-tab ${activeTab === "open" ? "active" : ""}`}
              onClick={() => setActiveTab("open")}
            >
              🟢 Tasks 
            </button>

            <button
              className={`header-tab ${
                activeTab === "assigned" ? "active" : ""
              }`}
              onClick={() => setActiveTab("assigned")}
            >
              🚚 Assigned 
            </button>
          </div>
        )}

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
