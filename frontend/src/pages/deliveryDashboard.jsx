import React, { useEffect, useState } from "react";
import "../styles/Dashboard.css";
import Header from "./Header.jsx";

function DeliveryDashboard() {
  const helperId = localStorage.getItem("userId");

  const [openTasks, setOpenTasks] = useState([]);
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [notification, setNotification] = useState(null);
  const [activeTab, setActiveTab] = useState("open"); // "open" or "assigned"

  // 🔹 Fetch Tasks
  const fetchTasks = async () => {
    try {
      // 1️⃣ Open Tasks
      const openRes = await fetch(
        `http://127.0.0.1:5000/api/tasks/open?helperId=${helperId}`,
      );
      const openData = await openRes.json();
      setOpenTasks(openData);

      // 2️⃣ Assigned Tasks
      const assignedRes = await fetch(
        `http://127.0.0.1:5000/api/tasks/assigned/${helperId}`,
      );
      const assignedData = await assignedRes.json();
      setAssignedTasks(assignedData);

      // 🔔 Show notification if assigned
      if (assignedData.length > 0) {
        setNotification(assignedData[0]);
      } else {
        setNotification(null);
      }

      console.log("OPEN TASKS 👉", openData);
      console.log("ASSIGNED TASKS 👉", assignedData);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    }
  };

  useEffect(() => {
    if (helperId) fetchTasks();
  }, []);

  // 🔹 Register Helper Agent
  useEffect(() => {
    if (!helperId) return;

    fetch("http://localhost:5000/api/agents/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentId: helperId,
        minBudget: 50,
      }),
    });
  }, [helperId]);

  // 🔥 Live GPS Tracking
  useEffect(() => {
    if (!helperId) return;

    if (!navigator.geolocation) {
      console.log("Geolocation not supported");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        try {
          await fetch("http://localhost:5000/api/agents/update-location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              agentId: helperId,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }),
          });
        } catch (err) {
          console.error("Location update failed:", err);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 5000,
      },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [helperId]);

  // 🔹 Place Bid
  const placeBid = async (taskId) => {
    const price = prompt("Enter your bid price");
    const eta = prompt("Enter ETA in minutes");

    if (!price || !eta) return;

    try {
      await fetch("http://localhost:5000/api/agents/bid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: helperId,
          taskId,
          price,
          eta,
        }),
      });

      alert("Bid placed successfully");
      fetchTasks();
    } catch (err) {
      alert("Failed to place bid");
    }
  };

  return (
    <div className="dashboard-page">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="container">
        <div className="dashboard-card">
          {/* 🔔 ASSIGNMENT NOTIFICATION */}
          {activeTab === "assigned" && notification && (
            <div className="assignment-notification">
              <h4>🎉 You’ve been assigned a new delivery! 🚚</h4>

              <hr />

              <p>
                <strong>📦 Task:</strong> {notification.title}
              </p>
              <p>
                <strong>📍 Pickup:</strong> {notification.pickupAddress}
              </p>
              <p>
                <strong>🏁 Drop:</strong> {notification.dropAddress}
              </p>
              <p>
                <strong>💰 Budget:</strong> ₹{notification.budget}
              </p>

              {notification.description && (
                <p>
                  <strong>📝 Description:</strong> {notification.description}
                </p>
              )}

              <hr />

              <p>
                <strong>👤 Customer Name:</strong>{" "}
                {notification.userName || "N/A"}
              </p>
              <p>
                <strong>📧 Customer Email:</strong>{" "}
                {notification.userEmail || "N/A"}
              </p>

              <div className="complete-btn-container">
                <button className="complete-btn">✅ Complete Delivery</button>
              </div>
            </div>
          )}

          {/* 🟢 OPEN TASKS */}
          {activeTab === "open" &&
            (openTasks.length === 0 ? (
              <p className="text-muted">No available tasks</p>
            ) : (
              openTasks.map((task) => (
                <div key={task._id} className="task-item">
                  <div>
                    <div className="task-title">{task.title}</div>

                    <div className="task-route">
                      📍 {task.pickupAddress} → 🏁 {task.dropAddress}
                    </div>

                    <div className="task-desc">
                      {task.description || "No description"}
                    </div>

                    <button
                      className="btn btn-primary btn-sm mt-2"
                      onClick={() => placeBid(task._id)}
                    >
                      Place Bid
                    </button>
                  </div>

                  <div className="budget-badge">₹{task.budget}</div>
                </div>
              ))
            ))}
        </div>
      </div>
    </div>
  );
}

export default DeliveryDashboard;
