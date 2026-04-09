import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/Header.css";

const Header = ({ activeTab, setActiveTab, onHelpClick }) => {
  const [showSidebar, setShowSidebar] = React.useState(false);

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    navigate("/login");
  };

  return (
    <header className="app-header">
      {/* LEFT: Profile */}
      <div className="left-section">
        <div className="profile-circle" onClick={toggleSidebar}>
          👤
        </div>
      </div>

      {/* CENTER: Title */}
      <div className="center-section">
        {location.pathname === "/delivery-dashboard" ? (
          <h1>Helper Dashboard</h1>
        ) : (
          <h1>User Dashboard</h1>
        )}
      </div>

      {/* RIGHT: Buttons */}
      <div className="right-section">
        {/* Help button (only for user dashboard) */}
        {location.pathname !== "/delivery-dashboard" && (
          <button className="help-btn" onClick={onHelpClick}>
            ❓ Help
          </button>
        )}

        {/* Tabs (only for delivery dashboard) */}
        {location.pathname === "/delivery-dashboard" && (
          <>
            <button
              className={`nav-btn ${activeTab === "open" ? "active" : ""}`}
              onClick={() => setActiveTab("open")}
            >
              Tasks
            </button>

            <button
              className={`nav-btn ${activeTab === "assigned" ? "active" : ""}`}
              onClick={() => setActiveTab("assigned")}
            >
              Assigned
            </button>
          </>
        )}

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
      {showSidebar && (
        <div className="sidebar">
          <h4>👤 Profile</h4>

          <p>
            <b>Name:</b> {localStorage.getItem("name") || "User"}
          </p>
          <p>
            <b>Email:</b> {localStorage.getItem("email") || "example@mail.com"}
          </p>

          <button onClick={toggleSidebar}>Close</button>
        </div>
      )}
    </header>
  );
};

export default Header;
