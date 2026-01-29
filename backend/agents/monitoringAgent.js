const Task = require("../models/Task");

const MONITOR_INTERVAL = 5 * 60 * 1000; // 5 minutes
const MAX_IDLE_TIME = 10 * 60 * 1000; // 10 minutes

const monitoringAgent = async () => {
  console.log("🕵️ Monitoring Agent running...");

  const now = new Date();

  const stuckTasks = await Task.find({
    status: "assigned",
    assignedAt: { $exists: true },
  });

  for (const task of stuckTasks) {
    const idleTime = now - task.assignedAt;

    if (idleTime > MAX_IDLE_TIME) {
      console.log("⚠️ Task timed out:", task._id);

      task.status = "negotiating";
      task.assignedTo = null;
      task.negotiationStatus = "in_progress";
      task.assignedAt = null;

      await task.save();
    }
  }
};

module.exports = monitoringAgent;
