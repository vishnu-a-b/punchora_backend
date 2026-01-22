import app from "./app";
import Configs from "./configs/configs";
import { connectDb } from "./configs/db";
import { PassportAuthentication } from "./passport/PassportAuthentication";
import JobController from "./jobs/JobController";
import { auditMiddleware } from "./middlewares/auditMiddleware";

const port = Number(Configs.port || 3000);

PassportAuthentication.initialise(app);

// Apply audit middleware globally (optional - can be selective)
// Uncomment to enable automatic audit logging for all routes
// app.use(auditMiddleware);

connectDb()
  .then(() => {
    console.log("Mongo connected");

    // Initialize scheduled jobs
    const jobController = new JobController();
    jobController.initializeJobs();

    console.log("[AuditService] Audit logging system initialized");
    console.log("[AuditService] Use auditMiddleware to enable automatic logging");

    app.listen(port, () => {
      console.log(`Server started on port ${port}`);
    });
  })
  .catch((e) => console.log("unable to connect mongo", e));
