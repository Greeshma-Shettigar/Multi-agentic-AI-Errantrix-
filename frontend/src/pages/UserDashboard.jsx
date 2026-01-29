import React, { useEffect, useState } from "react";
import "../styles/Dashboard.css";
import Header from "./Header.jsx";

export default function UserDashboard() {
  const userId = localStorage.getItem("userId");

  const [task, setTask] = useState({
    title: "",
    description: "",
    pickupLocation: "",
    dropLocation: "",
    budget: "",
    postedBy: userId,
  });

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

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

  // 🔹 Submit new task
 const submitTask = async (e) => {
   e.preventDefault();
   setLoading(true);

   const userId = localStorage.getItem("userId"); // save this at login

   try {
     const res = await fetch("http://localhost:5000/api/tasks", {
       method: "POST",
       headers: {
         "Content-Type": "application/json",
         Authorization: `Bearer ${localStorage.getItem("token")}`,
       },
       body: JSON.stringify({
         title: task.title,
         description: task.description,
         pickupLocation: task.pickupLocation,
         dropLocation: task.dropLocation,
         budget: task.budget,
         postedBy: userId,
       }),
     });

     const data = await res.json();

     if (!res.ok) {
       alert("Task creation failed");
       setLoading(false);
       return;
     }

     setTasks((prevTasks) => [data, ...prevTasks]); 

     
     setTask({ title: "", description: "", pickupLocation: "", dropLocation: "", budget: "" });
     alert("Task posted successfully");
     
   } catch (err) {
     console.error(err);
   }
 };


  return (
    <div className="dashboard-page">
      {/* HEADER */}
      <Header />

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
                placeholder="Pickup Location"
                value={task.pickupLocation}
                onChange={handleChange}
              />

              <input
                className="form-control mb-3"
                name="dropLocation"
                placeholder="Drop Location"
                value={task.dropLocation}
                onChange={handleChange}
              />

              <input
                type="number"
                className="form-control mb-4"
                name="budget"
                placeholder="Budget (₹)"
                value={task.budget}
                onChange={handleChange}
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
                    <div className="task-route">
                      {t.pickupLocation} → {t.dropLocation}
                    </div>
                    <div className="text-desc">
                      {t.description || "No description"}
                    </div>
                    {/* ✅ ASSIGNED DELIVERY PARTNER */}
                    {t.status === "assigned" && t.assignedTo && (
                      <div className="assigned-box mt-3">
                        <h6>🚚 Assigned Delivery Partner</h6>
                        <p>
                          <b>Name:</b> {t.assignedTo.fullName}
                        </p>
                        <p>
                          <b>User ID:</b> {t.assignedTo._id}
                        </p>
                       
                          <p>
                            <b>Email:</b> {t.assignedTo.email}
                          </p>
                        
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
    </div>
  );
}
