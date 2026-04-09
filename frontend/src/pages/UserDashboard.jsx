import React, { useEffect, useState } from "react";
import "../styles/Dashboard.css";
import Header from "./Header.jsx";
import { io } from "socket.io-client";
import "../styles/Board.css";
import AlertModal from "./Alertmodal.jsx";

export default function UserDashboard() {
  const userId = localStorage.getItem("userId");

  const [task, setTask] = useState({
    title: "",
    description: "",
    pickupLocation: "",
    dropLocation: "",
    
  });

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showComplaint, setShowComplaint] = useState(false);
  const [taskName, setTaskName] = useState("");
  const [description, setDescription] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [partnerEmail, setPartnerEmail] = useState("");
  const [errorPopup, setErrorPopup] = useState("");
  const [successPopup, setSuccessPopup] = useState("");
  const [decisionPopup, setDecisionPopup] = useState(null);
  const [alert, setAlert] = useState({
    show: false,
    type: "info",
    message: "",
  });

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
  };

  const closeAlert = () => {
    setAlert({ ...alert, show: false });
  };

  const activatePriority = async (taskId) => {
    try {
      await fetch("http://localhost:5000/api/agents/set-priority", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ taskId }),
      });

      setAlert({
        show: true,
        message: "🚀 Priority Mode Enabled! Fastest delivery will be selected.",
        type: "success",
      });
    } catch (err) {
      console.error(err);
    }
  };
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

          
          postedBy: userId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showAlert("error", data.message || "Task creation failed");
        setLoading(false);
        return;
      }

      setTasks((prev) => [data, ...prev]);

      setTask({
        title: "",
        description: "",
        pickupLocation: "",
        dropLocation: "",
        
      });

      showAlert("success", "Task posted successfully 🎉");
    } catch (err) {
      console.error(err);
      showAlert("error", "Something went wrong");
    }

    setLoading(false);
  };

  const handleDecision = async (decision) => {
    try {
      await fetch("http://localhost:5000/api/agents/user-decision", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskId: decisionPopup.taskId,
          decision, // "allow" or "reject"
        }),
      });

      // 🔥 close popup
      setDecisionPopup(null);
    } catch (err) {
      console.error("Decision error ❌", err);
    }
  };

  // 🔹 Complete Task
  const completeTask = async (taskId) => {
    const res = await fetch(
      `http://localhost:5000/api/tasks/complete/${taskId}`,
      { method: "POST" },
    );

    if (!res.ok) {
      showAlert("error", "Error completing task");
      return;
    }

    // Remove from UI immediately
    setTasks((prev) => prev.filter((task) => task._id !== taskId));

    showAlert("success", "🎉 Task completed successfully!");
  };

  useEffect(() => {
    const socket = io("http://localhost:5000");

    socket.on("task_assigned", (updatedTask) => {
      if (String(updatedTask.postedBy) === String(userId)) {
        setTasks((prev) =>
          prev.map((task) => {
            if (task._id === updatedTask._id) {
              return {
                ...task, // keep old data
                ...updatedTask, // merge new data
              };
            }
            return task;
          }),
        );
        fetchTasks(); // ensure we have the latest data from server

        if (updatedTask.priorityMode) {
          setAlert({
            show: true,
            message:
              "🚀 Priority Mode Activated! Closest delivery partner assigned.",
            type: "success",
          });
        }

      }
    });

    socket.on("task_completed", (completedTask) => {
      setTasks((prev) => prev.filter((task) => task._id !== completedTask._id));
    });

    socket.on("request_user_decision", (data) => {
      console.log("👤 USER DECISION EVENT:", data);
      if (String(data.postedBy) === String(userId)) {
        setDecisionPopup(data);
      }
    });

    socket.on("task_reassigned", (data) => {
      fetchTasks(); // refresh user tasks instantly
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

      setSuccessPopup("🎉 Complaint submitted successfully!");
      fetchTasks();
      setShowComplaint(false);
    } catch (err) {
      console.error("Complaint error:", err);
      setErrorPopup("Failed to submit complaint");
    }
  };

  useEffect(() => {
    if (successPopup) {
      const timer = setTimeout(() => {
        setSuccessPopup("");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [successPopup]);

  const autoFillPartner = () => {
    const selectedTask = tasks.find(
      (t) => t.title.toLowerCase() === taskName.toLowerCase(),
    );

    if (!selectedTask) {
      setPartnerName("");
      setPartnerEmail("");
      return;
    }

    // If task exists but not assigned
    if (!selectedTask.assignedTo) {
      setPartnerName("");
      setPartnerEmail("");
      return;
    }

    if (selectedTask.assignedTo) {
      setPartnerName(selectedTask.assignedTo.fullName);
      setPartnerEmail(selectedTask.assignedTo.email);
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
                      <div className="complaint-alert-box">
                        <div className="complaint-header">
                          ⚠ Complaint Raised
                        </div>
                        <div className="complaint-subtext">
                          Issue reported for this task
                        </div>
                      </div>
                    )}

                    <div className="task-route">
                      <p>📍 Pickup: {t.pickupAddress}</p>
                      <p>🏁 Drop: {t.dropAddress}</p>
                    </div>

                    <div className="text-desc">
                      {t.description || "No description"}
                    </div>
                    <button
                      className="priority-btn"
                      disabled={t.status === "assigned" || t.assignedTo}
                      onClick={(e) => {
                        e.stopPropagation(); // 🔥 THIS FIXES DOUBLE CALL
                        activatePriority(t._id);
                      }}
                    >
                      {t.status === "assigned" ? "✅ Assigned" : "🚀 Priority"}
                    </button>

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
                            onClick={(e) => {
                              e.stopPropagation(); // prevents accidental triggers

                              const confirmAction = window.confirm(
                                "Are you sure you want to complete this task?",
                              );

                              if (confirmAction) {
                                completeTask(t._id);
                              }
                            }}
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
            <h2 className="complaint-title">🆘 Need Help?</h2>
            <p className="complaint-subtitle">
              Having trouble with a delivery? Tell us what happened!
            </p>

            <label className="complaint-label">📦 Task Name</label>
            <input
              className="complaint-input"
              placeholder="Example: Grocery Pickup"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              onBlur={autoFillPartner}
            />
            <p className="complaint-tip">
              💡 Tip: Enter the exact task title to auto-fill delivery partner
              details.
            </p>
            <label className="complaint-label">📝 What went wrong?</label>
            <textarea
              className="complaint-textarea"
              placeholder="Describe the issue..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <label className="complaint-label">🚚 Delivery Partner Name</label>
            <input
              className="complaint-input"
              placeholder="Enter delivery partner name (optional)"
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
            />

            <label className="complaint-label">📧 Delivery Partner Email</label>
            <input
              className="complaint-input"
              placeholder="Enter delivery partner email (optional)"
              value={partnerEmail}
              onChange={(e) => setPartnerEmail(e.target.value)}
            />
            <div className="complaint-buttons">
              <button className="complaint-submit" onClick={submitComplaint}>
                🚨 Submit Complaint
              </button>

              <button
                className="complaint-close"
                onClick={() => setShowComplaint(false)}
              >
                ✖ Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {successPopup && (
        <div className="popup-overlay">
          <div className="success-card">
            <h3 className="success-title">✅ Success!</h3>

            <p className="success-message">{successPopup}</p>

            <button
              className="success-close-btn"
              onClick={() => setSuccessPopup("")}
            >
              ✖ Close
            </button>
          </div>
        </div>
      )}

      {decisionPopup && (
        <div className="cool-popup-overlay">
          <div className="cool-popup-card">
            <h2>⏳ Delivery Delay</h2>

            <p>{decisionPopup.message}</p>

            <div className="popup-actions">
              <button onClick={() => handleDecision("allow")}>
                Give More Time 👍
              </button>

              <button
                className="danger"
                onClick={() => handleDecision("user_reassign")}
              >
                Assign New Partner 🔄
              </button>
            </div>
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
      <AlertModal
        show={alert.show}
        handleClose={closeAlert}
        type={alert.type}
        message={alert.message}
      />
    </div>
  );
}
