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

    const { title,description, pickupLocation, dropLocation, budget, postedBy, radius } =
      req.body;

    // 🔥 1. Convert address → coordinates
    const pickupCoords = await geocodeAddress(pickupLocation);
    const dropCoords = await geocodeAddress(dropLocation);

    // 🔥 2. Build GeoJSON structure
    const taskData = {
      title,
      description,
      budget,
      postedBy,
      radius,

      pickupAddress: pickupLocation, 
      dropAddress: dropLocation,

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
    const plannedTaskData = await requesterAgent(taskData);

    console.log("AFTER AGENT 👉", plannedTaskData);

    const task = new Task(plannedTaskData);
    const savedTask = await task.save();
    req.app.locals.io.emit("task_created", savedTask);

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
    const tasks = await Task.find({
      postedBy: req.params.userId,
      status: { $ne: "completed" }, // 🔥 exclude completed
    })
      .populate("assignedTo", "fullName email")
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 🔔 Get tasks assigned to specific helper
router.get("/assigned/:helperId", async (req, res) => {
  try {
    const { helperId } = req.params;

    const tasks = await Task.find({
      assignedTo: helperId,
      status: "assigned",
    }).populate("postedBy", "fullName email"); // 🔥 populate user

    const formattedTasks = tasks.map((task) => ({
      ...task._doc, // ✅ keep ALL existing fields

      // 🔥 add readable customer info
      userName: task.postedBy?.fullName,
      userEmail: task.postedBy?.email,
    }));

    res.json(formattedTasks);
  } catch (err) {
    console.error("Assigned fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/verify-otp/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;
    const { code } = req.body;

    const task = await Task.findById(taskId);

    if (!task) return res.status(404).json({ message: "Task not found" });

    if (task.otpCode !== code) {
      return res.status(400).json({ message: "Invalid code" });
    }

    task.deliveryConfirmed = true;
    await task.save();

    res.json({ message: "OTP verified successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});
router.post("/complete/:taskId", async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);

    if (!task) return res.status(404).json({ message: "Task not found" });

    task.status = "completed";
    task.userConfirmed = true;

    await task.save();
    req.app.locals.io.emit("task_completed", task);

    res.json({ message: "Task completed successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
