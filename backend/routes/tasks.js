const router = require("express").Router();
const axios = require("axios");
const Task = require("../models/Task");
const requesterAgent = require("../agents/requesterAgent");
const helperAgent = require("../agents/helperAgent");
const Agent = require("../models/Agent"); 

console.log("🔥 TASK ROUTES LOADED 🔥");

// 🔥 Convert address → coordinates
async function geocodeAddress(address) {
  try {
    const response = await axios.get(
      "https://api.opencagedata.com/geocode/v1/json",
      {
        params: {
          q: address,
          key: process.env.OPENCAGE_KEY,
          limit: 1,
        },
      },
    );

    if (!response.data.results || response.data.results.length === 0) {
      throw new Error("Location not found");
    }

    const { lat, lng } = response.data.results[0].geometry;

    return {
      latitude: lat,
      longitude: lng,
    };
  } catch (error) {
    console.error("GEOCODE ERROR:", error.message);
    throw new Error("Location not found");
  }
}
// POST TASK (User)
router.post("/", async (req, res) => {
  try {
    console.log("REQ BODY 👉", req.body);

    const { title, pickupLocation, dropLocation, budget, postedBy, radius } =
      req.body;

    // 🔥 1. Convert address → coordinates
    const pickupCoords = await geocodeAddress(pickupLocation);
    const dropCoords = await geocodeAddress(dropLocation);

    // 🔥 2. Build GeoJSON structure
    const taskData = {
      title,
      budget,
      postedBy,
      radius,

      pickupLocation: {
        type: "Point",
        coordinates: [
          Number(pickupCoords.longitude),
          Number(pickupCoords.latitude),
        ],
      },

      dropLocation: {
        type: "Point",
        coordinates: [
          Number(dropCoords.longitude),
          Number(dropCoords.latitude),
        ],
      },
    };

    // 🔥 3. Send to Requester Agent
    const plannedTaskData = requesterAgent(taskData);

    console.log("AFTER AGENT 👉", plannedTaskData);

    const task = new Task(plannedTaskData);
    const savedTask = await task.save();

    res.status(201).json(savedTask);
  } catch (err) {
    console.error("TASK CREATE ERROR ❌", err);
    res.status(500).json({ message: err.message });
  }
});

/// GET ALL AVAILABLE TASKS (Delivery Dashboard)


router.get("/open", async (req, res) => {
  try {
    const { helperId } = req.query;

    let geoFilter = {};

    // 🔥 If helperId provided → apply geo-fencing
    if (helperId) {
      const helper = await Agent.findOne({ agentId: helperId });

      if (
        helper &&
        helper.location &&
        helper.location.coordinates?.length === 2
      ) {
        const radius = 5000; // 5km (change anytime)

        geoFilter = {
          pickupLocation: {
            $near: {
              $geometry: helper.location,
              $maxDistance: radius,
            },
          },
        };
      }
    }

    // 🔥 Combine existing filters + geo filter
    const tasks = await Task.find({
      status: { $in: ["planned", "open", "negotiating"] },
      assignedTo: null,
      ...geoFilter,
    }).populate("postedBy", "fullName");

    res.json(tasks);
  } catch (err) {
    console.error("OPEN TASK FETCH ERROR ❌", err);
    res.status(500).json({ message: err.message });
  }
});


// GET TASKS BY USER
router.get("/user/:userId", async (req, res) => {
  try {
    const tasks = await Task.find({ postedBy: req.params.userId })
      .populate("assignedTo", "fullName email")
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;
