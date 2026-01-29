const requesterAgent = (taskData) => {
  console.log("[Requester Agent] Planning task");

  if (
    !taskData.title ||
    !taskData.pickupLocation ||
    !taskData.dropLocation ||
    !taskData.postedBy
  ) {
    throw new Error("Invalid task data");
  }

  // Planning decisions
  return {
    ...taskData,
    status: "planned",
    priority: taskData.budget > 300 ? "HIGH" : "NORMAL",
    negotiationStatus: "none",
    bids: [],
    assignedTo: null,
  };
};

module.exports = requesterAgent;
