const axios = require("axios");

const requesterAgent = async (taskData) => {
  console.log("[Requester Agent] Planning task");

  if (
    !taskData.title ||
    !taskData.pickupLocation ||
    !taskData.dropLocation ||
    !taskData.postedBy
  ) {
    throw new Error("Invalid task data");
  }

  // 🔐 ---------------------------
  // 🚨 AI MODERATION CHECK (NEW)
  // -----------------------------

  try {
    const moderationResponse = await axios.post(
      "http://127.0.0.1:8001/moderate",
      {
        text: taskData.title, // you can combine title + description if exists
      },
    );

    if (!moderationResponse.data.safe) {
      throw new Error("Task rejected: Unsafe or illegal content detected.");
    }
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        "Moderation service unavailable or task unsafe.",
    );
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

  // ✅ Convert coordinates to numbers
  taskData.pickupLocation.coordinates =
    taskData.pickupLocation.coordinates.map(Number);

  taskData.dropLocation.coordinates =
    taskData.dropLocation.coordinates.map(Number);

  // ✅ Extra safety check
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
