import express from 'express';
import {
  getVisitorCount,
  incrementVisitorCount,
  resetVisitorCount,
} from '../services/visitorCounterService.js';

const router = express.Router();

// GET visitor count - use for displaying the counter
router.get("/count/:projectId?", async (req, res) => {
  try {
    const projectId = req.params.projectId || "portfolio";
    const counter = await getVisitorCount(projectId);

    res.status(200).json({
      success: true,
      projectId: counter.projectId,
      visitorCount: counter.visitorCount,
      lastUpdated: counter.lastUpdated,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching visitor count", error });
  }
});

// POST to track visitor - call this when user visits the page
router.post("/track/:projectId?", async (req, res) => {
  try {
    const projectId = req.params.projectId || "portfolio";
    const counter = await incrementVisitorCount(projectId);

    res.status(200).json({
      success: true,
      projectId: counter.projectId,
      visitorCount: counter.visitorCount,
      message: "Visitor tracked successfully",
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error tracking visitor", error });
  }
});

// GET total count (alias for count)
router.get("/total/:projectId?", async (req, res) => {
  try {
    const projectId = req.params.projectId || "portfolio";
    const counter = await getVisitorCount(projectId);

    res.status(200).json({
      success: true,
      count: counter.visitorCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching count" });
  }
});

// RESET counter (optional, for admin use)
router.post("/reset/:projectId?", async (req, res) => {
  try {
    const projectId = req.params.projectId || "portfolio";
    const counter = await resetVisitorCount(projectId);

    res.status(200).json({
      success: true,
      message: "Visitor count reset",
      visitorCount: counter.visitorCount,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error resetting visitor count" });
  }
});

export default router;
