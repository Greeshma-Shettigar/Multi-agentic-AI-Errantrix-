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

  // 🔥 Validate Pickup GeoJSON
  if (
    !taskData.pickupLocation ||
    taskData.pickupLocation.type !== "Point" ||
    !Array.isArray(taskData.pickupLocation.coordinates) ||
    taskData.pickupLocation.coordinates.length !== 2
  ) {
    throw new Error("Invalid pickup location format");
  }

  // 🔥 Validate Drop GeoJSON
  if (
    !taskData.dropLocation ||
    taskData.dropLocation.type !== "Point" ||
    !Array.isArray(taskData.dropLocation.coordinates) ||
    taskData.dropLocation.coordinates.length !== 2
  ) {
    throw new Error("Invalid drop location format");
  }

  // ✅ Convert coordinates to numbers (VERY IMPORTANT FIX)
  taskData.pickupLocation.coordinates =
    taskData.pickupLocation.coordinates.map(Number);

  taskData.dropLocation.coordinates =
    taskData.dropLocation.coordinates.map(Number);

  // ✅ Extra safety check (avoid NaN values)
  if (
    taskData.pickupLocation.coordinates.some(isNaN) ||
    taskData.dropLocation.coordinates.some(isNaN)
  ) {
    throw new Error("Coordinates must be valid numbers");
  }

  return {
    ...taskData,
    radius: taskData.radius || 5000,
    status: "planned",
    priority: taskData.budget > 300 ? "HIGH" : "NORMAL",
    negotiationStatus: "none",
    bids: [],
    assignedTo: null,
  };
};

module.exports = requesterAgent;
