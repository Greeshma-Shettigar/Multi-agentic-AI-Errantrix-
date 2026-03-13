const Task = require("../models/Task");
const mongoose = require("mongoose");

const helperAgent = async (task, helper) => {
  console.log("[Helper Agent] Evaluating task", helper.agentId);

  // Only planned or negotiating tasks can be accepted
  if (!["planned", "negotiating"].includes(task.status)) {
    console.log("[Helper Agent] Task not available");
    return { allowed: false, reason: "Task not available" };
  }
  console.log("Checking active task for agent:", helper.agentId);

  // 🔥 Check DB for active assigned task
  const activeTask = await Task.findOne({
    _id: { $ne: task._id }, // exclude current task
    assignedTo: new mongoose.Types.ObjectId(helper.agentId),
    status: "assigned",
  });

  console.log("Active task found:", activeTask);
  if (activeTask) {
    return {
      allowed: false,
      reason:
        "Agent already has active taskYou already have an assigned task. Complete it before bidding again",
    };
  }

  // Budget check
  if (helper.minBudget && task.budget < helper.minBudget) {
    console.log("[Helper Agent] Budget too low");
    return { allowed: false, reason: "Budget too low" };
  }

  // ✅ If everything valid → allow
  console.log("[Helper Agent] Task allowed for bidding/assignment");

  return { allowed: true };
};

module.exports = helperAgent;
