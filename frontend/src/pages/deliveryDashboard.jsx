import React, { useEffect, useState } from "react";
import "../styles/Dashboard.css";
import Header from "./Header.jsx";
function DeliveryDashboard() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/tasks/open")
      .then((res) => res.json())
      .then((data) => setTasks(data));
  }, []);

  const fetchTasks = async () => {
    const res = await fetch("http://localhost:5000/api/tasks/open");
    const data = await res.json();
    setTasks(data);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    const helperId = localStorage.getItem("userId");

    fetch("http://localhost:5000/api/agents/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentId: helperId,
        minBudget: 50, // helper minimum acceptable money
      }),
    });
  }, []);

  
  const placeBid = async (taskId) => {
    const price = prompt("Enter your bid price");
    const eta = prompt("Enter ETA in minutes");

    if (!price || !eta) return;

    const agentId = localStorage.getItem("userId");

    try {
      await fetch("http://localhost:5000/api/agents/bid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentId,
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
                <div className="task-route">
                  {task.pickupLocation} → {task.dropLocation}
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
