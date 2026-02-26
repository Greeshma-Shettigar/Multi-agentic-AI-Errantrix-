import React, { useEffect, useState } from "react";
import "../styles/Dashboard.css";
import Header from "./Header.jsx";

function DeliveryDashboard() {
  const [tasks, setTasks] = useState([]);

  const helperId = localStorage.getItem("userId");

  // 🔹 Fetch Open Tasks
  const fetchTasks = async () => {
    const helperId = localStorage.getItem("userId");
    const res = await fetch(`http://localhost:5000/api/tasks/open?helperId=${helperId}`);
    const data = await res.json();
    setTasks(data);
  };

  useEffect(() => {
    fetchTasks();
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

  // 🔥 NEW: Live GPS Tracking for Geo-Fencing
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
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              agentId: localStorage.getItem("userId"),
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
        headers: {
          "Content-Type": "application/json",
        },
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
      <Header />

      <div className="container">
        <div className="dashboard-card">
          {tasks.map((task) => (
            <div key={task._id} className="task-item">
              <div>
                <div className="task-title">{task.title}</div>

                {/* Since location is now GeoJSON, show formatted */}
                <div className="task-route">
                  Pickup: {t.pickupAddress}
                  {" → "}
                  Drop: {t.dropAddress}
                </div>

                <div className="task-desc">{task.description}</div>

                {task.status !== "assigned" && (
                  <button
                    className="btn btn-primary btn-sm mt-2"
                    onClick={() => placeBid(task._id)}
                  >
                    Place Bid
                  </button>
                )}
              </div>

              <div className="budget-badge">₹{task.budget}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DeliveryDashboard;
