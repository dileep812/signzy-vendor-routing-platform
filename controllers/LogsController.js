import { RoutingLog } from '../models/RoutingLog.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getRoutingLogs = asyncHandler(async (req, res) => {
  // Fetch the 50 most recent records to keep operations fast and clean (KISS)
  const logs = await RoutingLog.find({}).sort({ createdAt: -1 }).limit(50).lean();
  
  return res.status(200).json({
    status: "SUCCESS",
    count: logs.length,
    logs
  });
});
