import { RoutingLog } from '../models/RoutingLog.js';

export async function getRoutingLogs(req, res) {
  try {
    // Fetch the 50 most recent records to keep operations fast and clean (KISS)
    const logs = await RoutingLog.find({}).sort({ createdAt: -1 }).limit(50).lean();
    
    return res.status(200).json({
      status: "SUCCESS",
      count: logs.length,
      logs
    });
  } catch (error) {
    return res.status(500).json({ status: "ERROR", message: error.message });
  }
}
