export class LowestLatencyStrategy {
  execute(candidates, requirements) {
    const getAvgLatency = (vendor) => {
      const latencies = vendor.metrics?.rollingLatencies || [];
      return latencies.length ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
    };
    // Sort by rolling average latency ascending
    const sorted = [...candidates].sort((a, b) => getAvgLatency(a) - getAvgLatency(b));
    return sorted[0];
  }
}
