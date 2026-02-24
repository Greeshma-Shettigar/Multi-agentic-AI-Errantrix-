const router = require("express").Router();
const Task = require("../models/Task");
const requesterAgent = require("../agents/requesterAgent");
const helperAgent = require("../agents/helperAgent");
const Agent = require("../models/Agent"); 

console.log("🔥 TASK ROUTES LOADED 🔥");

// POST TASK (User)
router.post("/", async (req, res) => {
  try {
     console.log("REQ BODY 👉", req.body);
    const plannedTaskData = requesterAgent(req.body);
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
