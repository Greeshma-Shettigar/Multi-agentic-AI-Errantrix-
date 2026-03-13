import React, { useEffect, useState } from "react";
import "../styles/Dashboard.css";
import Header from "./Header.jsx";
import { io } from "socket.io-client";
import "../styles/Board.css"

export default function UserDashboard() {
  const userId = localStorage.getItem("userId");

  const [task, setTask] = useState({
    title: "",
    description: "",
    pickupLocation: "",
    dropLocation: "",
    budget: "",
  });

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showComplaint, setShowComplaint] = useState(false);
  const [taskName, setTaskName] = useState("");
  const [description, setDescription] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [partnerEmail, setPartnerEmail] = useState("");
  const [errorPopup, setErrorPopup] = useState("");

  // 🔹 Fetch user's tasks
  const fetchTasks = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/tasks/user/${userId}`);
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error("Failed to load tasks", err);
    }
  };

  useEffect(() => {
    if (userId) fetchTasks();
    
  }, [userId]);


  // 🔹 Handle input change
  const handleChange = (e) => {
    setTask({ ...task, [e.target.name]: e.target.value });
  };

  // 🔹 Submit new task (NO GEOCODING HERE)
  const submitTask = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          title: task.title,
          description:
            task.description && task.description.trim().length > 0
              ? task.description
              : "",
          pickupLocation: task.pickupLocation,
          dropLocation: task.dropLocation,
          // ✅ SEND RAW STRING
          pickupAddress: task.pickupLocation,
          dropAddress: task.dropLocation,

          budget: task.budget,
          postedBy: userId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Task creation failed");
        setLoading(false);
        return;
      }

      setTasks((prev) => [data, ...prev]);

      setTask({
        title: "",
        description: "",
        pickupLocation: "",
        dropLocation: "",
        budget: "",
      });

      alert("Task posted successfully");
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }

    setLoading(false);
  };
  
  // 🔹 Complete Task
  const completeTask = async (taskId) => {
    const res = await fetch(
      `http://localhost:5000/api/tasks/complete/${taskId}`,
      { method: "POST" },
    );

    if (!res.ok) {
      alert("Error completing task");
      return;
    }

    // Remove from UI immediately
    setTasks((prev) => prev.filter((task) => task._id !== taskId));

    alert("🎉 Task completed successfully!");
  };

  useEffect(() => {
    const socket = io("http://localhost:5000");

    socket.on("task_assigned", (updatedTask) => {
      if (updatedTask.postedBy === userId) {
        setTasks((prev) =>
          prev.map((task) =>
            task._id === updatedTask._id ? updatedTask : task,
          ),
        );
      }
    });

    socket.on("task_completed", (completedTask) => {
      setTasks((prev) => prev.filter((task) => task._id !== completedTask._id));
    });

    return () => socket.disconnect();
  }, []);

  const submitComplaint = async () => {
    console.log("Complaint button clicked");
    try {
      const res = await fetch("http://localhost:5000/api/user/complaint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskName,
          description,
          partnerEmail,
          partnerName,
          userId,
        }),
      });

      const data = await res.json();
        console.log("Server response:", data);

      if (!res.ok) {
        setErrorPopup(data.message);
        return;
      }

      alert("Complaint submitted");
      fetchTasks();
      setShowComplaint(false);
    } catch (err) {
       console.error("Complaint error:", err);
      setErrorPopup("Failed to submit complaint");
    }
  };

  return (
    <div className="dashboard-page">
      <Header onHelpClick={() => setShowComplaint(true)} />

      <div className="row">
        {/* CREATE TASK */}
        <div className="col-md-5">
          <div className="dashboard-card">
            <h5 className="fw-bold mb-3">Create New Task</h5>

            <form onSubmit={submitTask}>
              <input
                className="form-control mb-3"
                name="title"
                placeholder="Task Title"
                value={task.title}
                onChange={handleChange}
                required
              />

              <textarea
                className="form-control mb-3"
                rows="3"
                name="description"
                placeholder="Description (optional)"
                value={task.description}
                onChange={handleChange}
              />

              <input
                className="form-control mb-3"
                name="pickupLocation"
                placeholder="Pickup Location "
                value={task.pickupLocation}
                onChange={handleChange}
                required
              />

              <input
                className="form-control mb-3"
                name="dropLocation"
                placeholder="Drop Location"
                value={task.dropLocation}
                onChange={handleChange}
                required
              />

              <input
                type="number"
                className="form-control mb-4"
                name="budget"
                placeholder="Budget (₹)"
                value={task.budget}
                onChange={handleChange}
                required
              />

              <button className="btn-modern w-100" disabled={loading}>
                {loading ? "Posting..." : "🚀 Post Task"}
              </button>
            </form>
          </div>
        </div>

        {/* TASK LIST */}
        <div className="col-md-7">
          <div className="dashboard-card">
            <h5 className="fw-bold mb-3">Your Tasks</h5>

            {tasks.length === 0 ? (
              <p className="text-muted">No tasks created yet</p>
            ) : (
              tasks.map((t) => (
                <div key={t._id} className="task-item">
                  <div>
                    <div className="task-title">{t.title}</div>
                    {t.complaintRaised && (
                      <div className="complaint-tag">⚠ Complaint Raised</div>
                    )}

                    <div className="task-route">
                      <p>📍 Pickup: {t.pickupAddress}</p>
                      <p>🏁 Drop: {t.dropAddress}</p>
                    </div>

                    <div className="text-desc">
                      {t.description || "No description"}
                    </div>

                    {t.status === "assigned" && t.assignedTo && (
                      <div className="assigned-box mt-3">
                        <h6>🚚 Assigned Delivery Partner</h6>

                        <p>
                          <b>Name:</b> {t.assignedTo.fullName}
                        </p>

                        <p>
                          <b>Email:</b> {t.assignedTo.email}
                        </p>

                        <hr />

                        {/* 🔐 OTP SECTION */}
                        <div className="otp-section">
                          <p>
                            <b>🔐 Delivery Verification Code:</b> {t.otpCode}
                          </p>

                          <button
                            className="complete-user-btn"
                            disabled={!t.deliveryConfirmed}
                            onClick={() => completeTask(t._id)}
                          >
                            ✅ Complete
                          </button>

                          {!t.deliveryConfirmed && (
                            <p className="otp-note">
                              ⏳ Waiting for delivery partner to verify code...
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-end">
                    <div className="budget-badge">₹{t.budget}</div>
                    <div className="mt-2">
                      <span
                        className={`badge ${
                          t.status === "assigned"
                            ? "bg-success"
                            : t.status === "negotiating"
                              ? "bg-warning text-dark"
                              : "bg-secondary"
                        }`}
                      >
                        {t.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showComplaint && (
        <div className="complaint-overlay">
          <div className="complaint-card">
            <h3>Raise Complaint</h3>

            <input
              className="form-control mb-2"
              placeholder="Task Name"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
            />
            <textarea
              className="form-control mb-2"
              placeholder="Describe the issue"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <input
              className="form-control mb-2"
              placeholder="Delivery Partner Name"
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
            />
            <input
              className="form-control mb-3"
              placeholder="Delivery Partner Email"
              value={partnerEmail}
              onChange={(e) => setPartnerEmail(e.target.value)}
            />

            <button className="btn btn-primary me-2" onClick={submitComplaint}>
              Submit Complaint
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => setShowComplaint(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {errorPopup && (
        <div className="popup-overlay">
          <div className="popup-card">
            <h4>⚠ Complaint Error</h4>

            <p>{errorPopup}</p>

            <button
              className="popup-close-btn"
              onClick={() => setErrorPopup("")}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
