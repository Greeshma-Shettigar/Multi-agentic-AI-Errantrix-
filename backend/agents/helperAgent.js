const helperAgent = (task, helper) => {
  console.log("[Helper Agent] Evaluating task");

  // Only planned tasks can be accepted
  if (task.status !== "planned") {
    console.log("[Helper Agent] Task not available");
    return task;
  }

  // Budget check
  if (helper.minBudget && task.budget < helper.minBudget) {
    console.log("[Helper Agent] Budget too low, skipping task");
    return task;
  }

  // Accept task
  task.status = "assigned";
  task.helperDecision = "ACCEPTED"; // UI-only field (not enum)
  task.assignedTo = helper.agentId; // OPTIONAL (add schema later)

  console.log("[Helper Agent] Task accepted");

  return task;
};

module.exports = helperAgent;
