import { Vendor } from '../models/Vendor.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getVendorMetrics = asyncHandler(async (req, res) => {
  const vendors = await Vendor.find({}).lean();
  const summary = {};

  vendors.forEach(v => {
    const latencies = v.metrics?.rollingLatencies || [];
    const avg = latencies.length ? latencies.reduce((a,b)=>a+b,0) / latencies.length : 0;

    summary[v.name] = {
      totalRequests: v.metrics?.totalRequests || 0,
      rollingAvgLatencyMs: Math.round(avg),
      circuitBreakerState: v.metrics?.circuitBreakerStatus || "CLOSED"
    };
  });

  return res.status(200).json({ status: "SUCCESS", metrics: summary });
});
