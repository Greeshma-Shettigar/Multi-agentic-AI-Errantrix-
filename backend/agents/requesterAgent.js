const requesterAgent = (taskData) => {
  console.log("[Requester Agent] Planning task");

  if (
    !taskData.title ||
    !taskData.pickupLatitude ||
    !taskData.pickupLongitude ||
    !taskData.dropLatitude ||
    !taskData.dropLongitude ||
    !taskData.postedBy
  ) {
    throw new Error("Invalid task data");
  }

  // Convert to GeoJSON format (required for MongoDB geo queries)
  const pickupLocation = {
    type: "Point",
    coordinates: [taskData.pickupLongitude, taskData.pickupLatitude],
  };

  const dropLocation = {
    type: "Point",
    coordinates: [taskData.dropLongitude, taskData.dropLatitude],
  };

  // Planning decisions (existing logic preserved)
  return {
    ...taskData,

    pickupLocation,
    dropLocation,

    radius: taskData.radius || 5000, // default 5km if not provided

    status: "planned",
    priority: taskData.budget > 300 ? "HIGH" : "NORMAL",
    negotiationStatus: "none",
    bids: [],
    assignedTo: null,
  };
};

module.exports = requesterAgent;
