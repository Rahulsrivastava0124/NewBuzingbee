const express = require("express");
const { protectAdmin, requireRole } = require("../middleware/authMiddleware");
const lead = require("../controllers/leadController");

const router = express.Router();

// Every role may use the CRM; team members are limited to their own leads in the controller
router.use(protectAdmin);

router.get("/", lead.getLeads);
router.get("/stats/weekly", lead.getWeeklyStats);
router.post("/", lead.createLead);
router.get("/:id", lead.getLead);
router.put("/:id", lead.updateLead);
router.delete("/:id", requireRole("super", "admin"), lead.deleteLead);
router.post("/:id/activities", lead.addActivity);
router.delete("/:id/activities/:activityId", lead.deleteActivity);

module.exports = router;
