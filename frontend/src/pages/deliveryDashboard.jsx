import React, { useEffect, useState , useRef} from "react";
import "../styles/Dashboard.css";
import Header from "./Header.jsx";
import { io } from "socket.io-client";
import AlertModal from "./Alertmodal.jsx";
import InputModal from "./InputModal.jsx";

  const socket = io("http://localhost:5000");


function DeliveryDashboard() {
  const helperId = localStorage.getItem("userId");
   const myId = localStorage.getItem("userId");


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
  const [chatOpen, setChatOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [messages, setMessages] = useState({});
  const [input, setInput] = useState("");
  const [unreadCounts, setUnreadCounts] = useState({});
  const messagesEndRef = useRef(null);

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
  };

  const closeAlert = () => {
    setAlert({ ...alert, show: false });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

    useEffect(() => {
      assignedTasks.forEach((task) => {
        socket.emit("join_task_room", task._id);
      });
    }, [assignedTasks]);
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

  const openChat = async (task) => {
    setCurrentTask(task);
    setChatOpen(true);
    //setMessages([]);

     try {
    // ✅ 1. Fetch old messages (DB persistence)
    const res = await fetch(`http://localhost:5000/api/messages/${task._id}`);
    const oldMessages = (await res.json()).sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    );

   // setMessages(oldMessages);  // load previous chat
   setMessages((prev) => {
     const existing = prev[task._id] || [];

     const merged = [...existing, ...oldMessages];

     const unique = merged.filter(
       (msg, index, self) => index === self.findIndex((m) => m._id === msg._id),
     );

     return {
       ...prev,
       [task._id]: unique,
     };
   });

  } catch (err) {
    console.error("Failed to load messages:", err);
  }

    socket.emit("join_task_room", task._id);

    // reset unread count
    setUnreadCounts((prev) => ({
      ...prev,
      [task._id]: 0,
    }));
  };
  const sendMessage = () => {
    if (!input.trim()) return;

     const msg = {
       taskId: currentTask._id,
       senderId: localStorage.getItem("userId"),
       receiverId: currentTask.userId || currentTask.postedBy, // or assigned user
       text: input,
     };

    socket.emit("send_message", msg);

   
    setInput("");
  };

  useEffect(() => {
    if (myId) {
      socket.emit("join_user", myId);
    }
  }, [myId]);

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
  const handleReceiveMessage = (data) => {
    setMessages((prev) => {
      const taskMessages = prev[data.taskId] || [];
      console.log("Incoming message:", data);

      // ✅ Avoid duplicate messages (important after DB + socket combo)
      const exists = taskMessages.some((m) => m._id === data._id);
      if (exists) return prev;

      return {
        ...prev,
        [data.taskId]: [...taskMessages, data],
      };
    });

    // ✅ Unread count (only if chat not open)
    if (!currentTask || data.taskId !== currentTask._id) {
      setUnreadCounts((prev) => ({
        ...prev,
        [data.taskId]: (prev[data.taskId] || 0) + 1,
      }));
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
    socket.on("task_created", (newTask) => {
      setOpenTasks((prev) => [newTask, ...prev]);
    });

    socket.on("task_assigned", (task) => {
      if (
        String(task.assignedTo?._id || task.assignedTo) === String(helperId)
      ) {
        setTasks((prev) => {
          const exists = prev.find((t) => t._id === task._id);

          if (exists) {
            return prev.map((t) =>
              t._id === task._id ? { ...t, ...task } : t,
            );
          }

          return [...prev, task];
        });

        fetchTasks();
      }
    });

    socket.on("task_completed", (task) => {
      if (task.userConfirmed === true) {
        setAssignedTasks((prev) => prev.filter((t) => t._id !== task._id));
      }
    });

    socket.on("complaint_raised", (data) => {
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

    socket.on("extra_time_granted", (data) => {
      if (String(data.assignedTo) === String(helperId)) {
        setGracePopup("🎉 Customer gave you extra time! Keep going 🚀");
      }
    });

    socket.on("task_reassigned", (data) => {
      setAssignedTasks((prev) => prev.filter((t) => t._id !== data.taskId));
      fetchTasks();
    });

    // 🔥 CHAT LISTENER (ADD HERE)
    
   socket.on("receive_message", handleReceiveMessage);
    return () => {
      socket.off("task_created");
      socket.off("task_assigned");
      socket.off("task_completed");
      socket.off("complaint_raised");
      socket.off("grace_confirmed");
      socket.off("task_delay_warning");
      socket.off("extra_time_granted");
      socket.off("task_reassigned");
      socket.off("receive_message", handleReceiveMessage); // 🔥 important
    };
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
          {activeTab === "assigned" &&
            (assignedTasks.length === 0 ? (
              <p className="text-muted">No assigned tasks</p>
            ) : (
              assignedTasks.map((task) => (
                <div key={task._id} className="task-card">
                  {/* ✅ TITLE (CENTER) */}
                  <div className="task-title center"> {task.title}</div>

                  {/* ✅ DESCRIPTION (CENTER) */}
                  <div className="task-desc center">
                    <strong> {task.description || "No description"}</strong>
                  </div>

                  {/* ✅ PICKUP + DROP (BLUE BOX) */}
                  <div className="location-box">
                    <div className="location-item">
                      📍 <strong>Pickup:</strong> {task.pickupAddress}
                    </div>

                    <div className="location-item">
                      🏁 <strong>Drop:</strong> {task.dropAddress}
                    </div>
                  </div>

                  {/* ✅ ACTION BUTTONS (CENTER) */}
                  <div className="action-buttons">
                    <button
                      className="complete-btn"
                      onClick={() => verifyOTP(task._id)}
                    >
                      Complete
                    </button>

                    <button className="chat-btn" onClick={() => openChat(task)}>
                      💬 Chat
                      {unreadCounts[task._id] > 0 && (
                        <span className="chat-badge">
                          {unreadCounts[task._id]}
                        </span>
                      )}
                    </button>
                  </div>

                  <hr />

                  {/* ✅ CUSTOMER INFO (SIDE BY SIDE) */}
                  <div className="customer-info">
                    <div>
                      👤 <strong>{task.userName || "N/A"}</strong>
                    </div>

                    <div>
                      📧<strong> {task.userEmail || "N/A"}</strong>
                    </div>
                  </div>
                </div>
              ))
            ))}

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
                        Accept Task
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

          {chatOpen && (
            <div className="chat-sidebar">
              <div className="chat-header">
                💬 Chat
                <button onClick={() => setChatOpen(false)}>✖</button>
              </div>

              <div className="chat-messages">
                {(messages[currentTask?._id] || []).map((msg, i) => (
                  <div
                    key={i}
                    className={msg.senderId === myId ? "my-msg" : "other-msg"}
                  >
                    <div className="msg-text">{msg.text}</div>
                    <div className="msg-time">
                      {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef}></div>
              </div>
              <div className="chat-input">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type message..."
                />
                <button onClick={sendMessage}>Send</button>
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
