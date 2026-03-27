const Task = require("../models/Task");

const MAX_IDLE_TIME = 2 * 60 * 1000; // 2 min
const GRACE_TIME = 1 * 60 * 1000; // extra 1 min

const monitoringAgent = async (io) => {
  console.log("🕵️ Monitoring Agent running...");

  const now = new Date();

  const tasks = await Task.find({
    status: "assigned",
    assignedAt: { $exists: true },
  });

  for (const task of tasks) {
    const idleTime = now - new Date(task.assignedAt);

    // 🔥 ADD THIS LOG HERE (inside loop)
    console.log("⏳ Checking task:", task.title, "Idle:", idleTime);

    // 🔥 STEP 1: First warning
    if (idleTime > MAX_IDLE_TIME && !task.warningSent && !task.graceUsed) {
      console.log("⚠ Sending warning for:", task.title);

      task.warningSent = true;
      task.warningAt = new Date();

      await task.save();

      // 🔥 Notify both
      io.emit("task_delay_warning", {
        taskId: task._id,
        message: `⏳ Delivery delayed for task: ${task.title}`,
        assignedTo: task.assignedTo?.toString(),
        postedBy: task.postedBy?.toString(), // 🔥 ADD THIS
      });
      continue;
    }

    // 🔥 STEP 2: After grace time → reassign
    const idleAfterGrace = now - new Date(task.assignedAt);

    if (
      task.graceUsed &&
      task.assignedAt && // updated by grace
      now - new Date(task.assignedAt) > GRACE_TIME && // grace expired
      !task.userDecisionAsked
    ) {
      console.log("👤 Asking user decision for:", task.title);

      task.userDecisionAsked = true;
      await task.save();

      io.emit("request_user_decision", {
        taskId: task._id,
        message: `⏳ Driver needs more time for ${task.title}`,
        assignedTo: task.assignedTo?.toString(),
        postedBy: task.postedBy?.toString(),
      });
    }

    // 🔥 STEP 3: If user did NOT respond → auto reassign
    if (
      task.userDecisionAsked &&
      task.assignedAt &&
      now - new Date(task.assignedAt) > GRACE_TIME * 2
    ) {
      console.log("♻ Auto reassigning task:", task.title);

      task.status = "negotiating";
      task.assignedTo = null;
      task.negotiationStatus = "in_progress";

      // 🔥 RESET EVERYTHING
      task.assignedAt = null;
      task.warningSent = false;
      task.graceUsed = false;
      task.userDecisionAsked = false;

      task.bids = []; // allow fresh bidding

      await task.save();

      io.emit("task_reassigned", {
        taskId: task._id,
        message: `🔄 Task reopened: ${task.title}`,
      });
    }
   }
};

module.exports = monitoringAgent;