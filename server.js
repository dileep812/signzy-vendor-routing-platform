import express from "express"
import  {connectDatabase} from './config/db.js';

import vendorRoutes from "./routes/vendorRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import routeRoutes from "./routes/routeRoutes.js";
import metricsRoutes from "./routes/metricsRoutes.js";
import logsRoutes from "./routes/logsRoutes.js";
import agentRoutes from "./routes/agentRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app=express();
app.use(express.json());

await connectDatabase();
app.use('/vendors',vendorRoutes);
app.use('/health', healthRoutes);
app.use('/route', routeRoutes);
app.use('/vendor-metrics', metricsRoutes);
app.use('/routing-logs', logsRoutes);
app.use('/agent', agentRoutes);

// Register application-level global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Routing Core API gateway is live on port ${PORT}`));

