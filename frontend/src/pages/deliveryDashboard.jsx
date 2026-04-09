import React, { useEffect, useState , useRef} from "react";
import "../styles/Dashboard.css";
import Header from "./Header.jsx";
import { io } from "socket.io-client";
import AlertModal from "./Alertmodal.jsx";
import InputModal from "./InputModal.jsx";


function DeliveryDashboard() {
  const helperId = localStorage.getItem("userId");

  const [openTasks, setOpenTasks] = useState([]);
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [notification, setNotification] = useState(null);
  const [activeTab, setActiveTab] = useState("open"); // "open" or "assigned"
  const [errorPopup, setErrorPopup] = useState("");
  const [complaintAlert, setComplaintAlert] = useState("");
  const [delayPopup, setDelayPopup] = useState("");
  const [gracePopup, setGracePopup] = useState(null);
  const lastFetchTimeRef = useRef(0);
  const [graceConfirmPopup, setGraceConfirmPopup] = useState(null);
  const [alert, setAlert] = useState({
    show: false,
    type: "info",
    message: "",
  });
  // 🔥 NEW STATES FOR MODALS
  const [showBidModal, setShowBidModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpTaskId, setOtpTaskId] = useState(null);

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
  };

  const closeAlert = () => {
    setAlert({ ...alert, show: false });
  };

  useEffect(() => {
    if (assignedTasks.length > 0) {
      const complaintTask = assignedTasks.find(
        (t) => t.complaintRaised === true,
      );

      if (complaintTask) {
        setComplaintAlert(
          `⚠ Complaint raised for task: ${complaintTask.title}`,
        );
      }
    }
  }, [assignedTasks]);

  const handleIgnore = async (taskId) => {
    try {
      await fetch("http://localhost:5000/api/agents/user-decision", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskId,
          decision: "helper_reject", // 🔥 THIS triggers reopen
        }),
      });

      setGracePopup(null); // close popup
    } catch (err) {
      console.error("Ignore failed", err);
    }
  };

  // 🔹 Fetch Tasks
  const fetchTasks = async () => {
    try {
      // 1️⃣ Open Tasks
      const openRes = await fetch(
        `http://127.0.0.1:5000/api/tasks/open?helperId=${helperId}`,
      );
      const openData = await openRes.json();
      console.log("OPEN TASKS 👉", openData);

      setOpenTasks(Array.isArray(openData) ? openData : []);

      // 2️⃣ Assigned Tasks
      const assignedRes = await fetch(
        `http://127.0.0.1:5000/api/tasks/assigned/${helperId}`,
      );
      const assignedData = await assignedRes.json();
      setAssignedTasks(
        assignedData.filter(
          (t) => !(t.userConfirmed === true && t.deliveryConfirmed === true),
        ),
      );

      console.log("Assigned tasks:", assignedData);

      // 🔔 Show notification if assigned
      if (assignedData.length > 0) {
        setNotification(assignedData[0]);
      } else {
        setNotification(null);
      }

      console.log("OPEN TASKS 👉", openData);
      console.log("ASSIGNED TASKS 👉", assignedData);

      const complaintTask = assignedData.find(
        (t) => t.complaintRaised === true,
      );

      console.log("Complaint task found:", complaintTask);

      if (complaintTask) {
        setTimeout(() => {
          setComplaintAlert(
            `⚠ Complaint raised for task: ${complaintTask.title}`,
          );
        }, 300);
      }
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    }
  };

  useEffect(() => {
    if (helperId) fetchTasks();
  }, [helperId]);

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

          const now = Date.now();
          if (now - lastFetchTimeRef.current > 5000) {
            fetchTasks();
            lastFetchTimeRef.current = now;
          }
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

  // ✅ Socket Connection (SEPARATE HOOK)
  useEffect(() => {
    const socket = io("http://localhost:5000");

    socket.on("task_created", (newTask) => {
      setOpenTasks((prev) => [newTask, ...prev]);
    });

    socket.on("task_assigned", (task) => {
      if (
        String(task.assignedTo?._id || task.assignedTo) === String(helperId)
      ) {
        setTasks((prev) => {
          // 🔥 avoid duplicates
          const exists = prev.find((t) => t._id === task._id);

          if (exists) {
            return prev.map((t) =>
              t._id === task._id ? { ...t, ...task } : t,
            );
          }

          return [...prev, task];
        });

        // 🔥 fallback sync
        fetchTasks();
      }
    });

    socket.on("task_completed", (task) => {
      console.log("✅ Task completed received:", task);

      // 🔥 REMOVE ONLY WHEN USER CONFIRMED
      if (task.userConfirmed === true) {
        setAssignedTasks((prev) => prev.filter((t) => t._id !== task._id));
      }
    });
    socket.on("complaint_raised", (data) => {
      console.log("⚠ Complaint received:", data);

      // Show only to that delivery partner
      if (String(data.assignedTo) === String(helperId)) {
        setComplaintAlert("⚠ Complaint raised against you for a task!");
      }
    });

    socket.on("grace_confirmed", (data) => {
      if (String(data.assignedTo) === String(helperId)) {
        setGraceConfirmPopup(data.message);
      }
    });

    socket.on("task_delay_warning", (data) => {
      if (String(data.assignedTo) === String(helperId)) {
        setGracePopup(data);
      }
    });

    // socket.on("task_reassigned", (data) => {
    //   console.log("🔄 Task reopened:", data);

    //   fetchTasks(); // 🔥 reload tasks
    // });

    socket.on("extra_time_granted", (data) => {
      if (String(data.assignedTo) === String(helperId)) {
        setGracePopup("🎉 Customer gave you extra time! Keep going 🚀");
      }
    });

    socket.on("task_reassigned", (data) => {
      console.log("🔄 Task reopened:", data);

      // ⚡ instant UI update
      setAssignedTasks((prev) => prev.filter((t) => t._id !== data.taskId));

      fetchTasks(); // 🔥 refresh open tasks immediately
    });
    return () => socket.disconnect();
  }, [helperId]);
  // 🔹 Place Bid
  const placeBid = (taskId) => {
    setSelectedTask(taskId);
    setShowBidModal(true);
  };
  const submitBid = async (price) => {
    try {
      const res = await fetch("http://localhost:5000/api/agents/bid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentId: helperId,
          taskId: selectedTask,
          price,
          eta: 1, // ✅ dummy (since you removed ETA)
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorPopup(data.message);
        return;
      }

      showAlert("success", "Bid placed successfully 🎉");
      fetchTasks();
    } catch (err) {
      console.error(err);
      showAlert("error", "Failed to place bid");
    }
  };

  const sendGrace = async (minutes) => {
    await fetch("http://localhost:5000/api/agents/grace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId: gracePopup.taskId,
        minutes,
      }),
    });

    setGracePopup(null);
  };

  // 🔹 Verify OTP & Complete Delivery
  const verifyOTP = (taskId) => {
    setOtpTaskId(taskId);
    setShowOtpModal(true);
  };
  const submitOtp = async (code) => {
    const res = await fetch(
      `http://localhost:5000/api/tasks/verify-otp/${otpTaskId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      },
    );

    const data = await res.json();

    if (!res.ok) {
      showAlert(
        "error",
        data.message || "Wrong verification code. Try again ❌",
      );
    } else {
      showAlert("success", "Delivery verified!");
      fetchTasks();
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
                <button
                  className="complete-btn"
                  onClick={() => verifyOTP(notification._id)}
                >
                  ✅ Complete Delivery
                </button>
              </div>
            </div>
          )}

          {/* 🟢 OPEN TASKS */}
          {activeTab === "open" &&
            (openTasks.length === 0 ? (
              <p className="text-muted">No available tasks</p>
            ) : (
              openTasks.map((task) => (
                <div key={task._id} className="task-card">
                  {/* LEFT SIDE */}
                  <div className="task-left">
                    <div className="task-title">{task.title}</div>

                    <div className="task-route">
                      📍 {task.pickupAddress} → 🏁 {task.dropAddress}
                    </div>

                    <div className="task-desc">
                      {task.description || "No description"}
                    </div>

                    {task.distance && (
                      <p className="distance-preview">
                        📏 Total Distance: {task.distance.toFixed(2)} km
                      </p>
                    )}
                  </div>

                  {/* RIGHT SIDE */}
                  <div className="task-right">
                    <div className="right-content">
                      

                      <button
                        className="btn btn-primary bid-btn"
                        onClick={() => placeBid(task._id)}
                      >
                        Place Bid
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ))}

          {complaintAlert && (
            <div className="complaint-alert-overlay">
              <div className="complaint-alert-card">
                <h3>⚠ Attention!</h3>

                <p>{complaintAlert}</p>

                <button onClick={() => setComplaintAlert("")}>Got it 👍</button>
              </div>
            </div>
          )}

          {delayPopup && (
            <div className="popup-overlay">
              <div className="popup-card warning">
                <h3>⚠ Delivery Delay</h3>
                <p>{delayPopup}</p>

                <button onClick={() => setDelayPopup("")}>Got it 👍</button>
              </div>
            </div>
          )}
          {gracePopup && (
            <div className="cool-popup-overlay">
              <div className="cool-popup-card">
                <h2>⏳ Need More Time?</h2>

                <p>{gracePopup.message}</p>

                <div className="popup-actions">
                  <button onClick={() => sendGrace(2)}>+2 min</button>
                  <button onClick={() => sendGrace(5)}>+5 min</button>
                  <button
                    className="danger"
                    onClick={() => {
                      console.log("IGNORE CLICKED:", gracePopup);
                      handleIgnore(gracePopup.taskId);
                    }}
                  >
                    Ignore
                  </button>
                </div>
              </div>
            </div>
          )}

          {graceConfirmPopup && (
            <div className="popup-overlay">
              <div className="popup-card success">
                <h3>🎉 Extra Time Granted!</h3>
                <p>{graceConfirmPopup}</p>

                <button onClick={() => setGraceConfirmPopup(null)}>
                  Got it 👍
                </button>
              </div>
            </div>
          )}
          {errorPopup && (
            <div className="popup-overlay">
              <div className="popup-card">
                <h3 className="popup-title">⚠️ Action Not Allowed</h3>

                <p className="popup-message">{errorPopup}</p>

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
      </div>
      <AlertModal
        show={alert.show}
        handleClose={closeAlert}
        type={alert.type}
        message={alert.message}
      />
      {/* 🔥 BID MODAL */}
      <InputModal
        show={showBidModal}
        title="💰 Place Your Bid"
        placeholder="Enter your price"
        onClose={() => setShowBidModal(false)}
        onSubmit={(value) => {
          submitBid(value);
          setShowBidModal(false);
        }}
      />

      {/* 🔥 OTP MODAL */}
      <InputModal
        show={showOtpModal}
        title="🔐 Enter Verification Code"
        placeholder="Enter OTP"
        onClose={() => setShowOtpModal(false)}
        onSubmit={(value) => {
          submitOtp(value);
          setShowOtpModal(false);
        }}
      />
    </div>
  );
}

export default DeliveryDashboard;
