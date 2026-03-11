import http from "http";
import app from "./app";
import Configs from "./configs/configs";
import { connectDb } from "./configs/db";
import { PassportAuthentication } from "./passport/PassportAuthentication";
import JobController from "./jobs/JobController";
import { auditMiddleware } from "./middlewares/auditMiddleware";
import { initializeSocket } from "./socket/SocketServer";

const port = Number(Configs.port || 3000);

PassportAuthentication.initialise(app);

// Apply audit middleware globally (optional - can be selective)
// Uncomment to enable automatic audit logging for all routes
// app.use(auditMiddleware);

// Create HTTP server and attach Socket.io for live tracking
const httpServer = http.createServer(app);
initializeSocket(httpServer);

connectDb()
  .then(() => {
    console.log("Mongo connected");

    // Initialize scheduled jobs
    const jobController = new JobController();
    jobController.initializeJobs();

    console.log("[AuditService] Audit logging system initialized");
    console.log("[AuditService] Use auditMiddleware to enable automatic logging");

    httpServer.listen(port, () => {
      console.log(`Server started on port ${port}`);
      console.log(`[LiveTracking] WebSocket server ready`);
    });
  })
  .catch((e) => console.log("unable to connect mongo", e));
