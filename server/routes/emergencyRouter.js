import { Router } from "express";
import { requireRoles } from "../middleware/authMiddleware.js";
import {
	createEmergencyController,
	assignEmergencyController,
	acceptEmergencyController,
	completeEmergencyController,
	cancelEmergencyController,
	getEmergencySupportController,
	triggerEmergencyAlertController,
	getMyEmergencyAlertsController,
	getEmergencyAlertByIdController,
	notifyAmbulanceDriverController,
} from "../controllers/emergencyController.js";

const emergencyRouter = Router();

emergencyRouter.get("/support", requireRoles("patient", "admin", "hospital"), getEmergencySupportController);
emergencyRouter.get("/alerts/my", requireRoles("patient", "admin", "hospital", "doctor"), getMyEmergencyAlertsController);
emergencyRouter.get("/:id/details", requireRoles("patient", "admin", "hospital", "doctor"), getEmergencyAlertByIdController);
emergencyRouter.post("/:id/notify-driver", requireRoles("hospital", "admin"), notifyAmbulanceDriverController);
emergencyRouter.post("/trigger", requireRoles("patient", "admin"), triggerEmergencyAlertController);
emergencyRouter.post("/", requireRoles("patient", "admin"), createEmergencyController);
emergencyRouter.post("/:emergencyId/assign", requireRoles("admin", "hospital"), assignEmergencyController);
emergencyRouter.post("/:id/accept", requireRoles("driver", "admin"), acceptEmergencyController);
emergencyRouter.post("/:id/complete", requireRoles("driver", "admin", "hospital"), completeEmergencyController);
emergencyRouter.post("/:id/cancel", requireRoles("patient", "admin", "hospital"), cancelEmergencyController);

export default emergencyRouter;
