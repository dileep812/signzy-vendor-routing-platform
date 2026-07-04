import { Vendor } from '../models/Vendor.js';
import { RoutingLog } from '../models/RoutingLog.js';
import { StrategyFactory } from '../strategies/StrategyFactory.js';
import { RoutingError } from '../utils/AppError.js';

export class RouterService {
  async processRoutingRequest(capability, payload, requirements) {
    // Filter Candidates by Capability and structural status flags
    let candidates = await Vendor.find({ capabilities: capability, isActive: true });

    if (!candidates.length) {
      throw new RoutingError(`No active providers registered for capability: ${capability}`);
    }

    let skipReasons = [];
    let healthyCandidates = [];

    // Evaluate candidates with async checks (circuit breaker, rate limit, features, latency)
    for (const vendor of candidates) {
      // 1. Circuit breaker check
      if (vendor.metrics?.circuitBreakerStatus === 'OPEN') {
        const cooldownMs = 30000; // 30 seconds cooldown
        const timePassed = Date.now() - new Date(vendor.metrics.lastFailureTime).getTime();
        if (timePassed > cooldownMs) {
          vendor.metrics.circuitBreakerStatus = 'HALF-OPEN';
          await vendor.save();
        } else {
          skipReasons.push(`${vendor.name} skipped (circuit breaker is OPEN)`);
          continue;
        }
      }

      // 2. Feature check
      if (requirements?.requiredFeatures) {
        const hasFeatures = requirements.requiredFeatures.every(f => vendor.supportedFeatures.includes(f));
        if (!hasFeatures) {
          skipReasons.push(`${vendor.name} skipped (missing required features)`);
          continue;
        }
      }

      // 3. Rate limit check
      const oneMinuteAgo = new Date(Date.now() - 60000);
      const requestsInLastMinute = await RoutingLog.countDocuments({
        selectedVendor: vendor.name,
        createdAt: { $gte: oneMinuteAgo }
      });
      if (requestsInLastMinute >= vendor.rateLimitPerMinute) {
        skipReasons.push(`${vendor.name} skipped (rate limit of ${vendor.rateLimitPerMinute}/min reached)`);
        continue;
      }

      // 4. Latency evaluation check
      const latencies = vendor.metrics?.rollingLatencies || [];
      const avgLatency = latencies.length ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
      if (requirements?.maxLatencyMs && avgLatency > requirements.maxLatencyMs) {
        skipReasons.push(`${vendor.name} crossed latency threshold (${Math.round(avgLatency)}ms)`);
        continue;
      }

      healthyCandidates.push(vendor);
    }

    // Fallback protection: if all providers are circuit-broken/degraded, bypass rules to avoid outage
    let finalReason = "";
    if (!healthyCandidates.length) {
      healthyCandidates = candidates;
      finalReason += `[Outage Fallback Mode Activated] All variants degraded. ${skipReasons.join(', ')}. `;
    }

    // Select Strategy dynamically using our Strategy Factory
    const strategy = StrategyFactory.getStrategy(requirements);
    const chosenVendor = strategy.execute(healthyCandidates, { ...requirements, capability });
    
    if (finalReason === "") {
      finalReason = skipReasons.length 
        ? `${chosenVendor.name} selected because ${skipReasons.join(', ')}.` 
        : `${chosenVendor.name} selected using standard ${strategy.constructor.name} selection logic.`;
    }

    // Wrap the downstream simulation execution in high-resolution timers
    const startTime = Date.now();
    
    // Simulate runtime processing speeds based on the vendor priority config
    const mockDelay = chosenVendor.priority === 1 ? 450 : 850; 
    
    const willTimeout = mockDelay > chosenVendor.timeoutMs;
    if (willTimeout) {
      await new Promise(resolve => setTimeout(resolve, chosenVendor.timeoutMs));
      const actualLatency = Date.now() - startTime;
      const errMsg = `Timeout exceeded: mock delay of ${mockDelay}ms is greater than vendor timeout limit of ${chosenVendor.timeoutMs}ms`;
      await this.updateMetricsAndLogs(chosenVendor, actualLatency, finalReason, capability, 'FAILED', errMsg);
      throw new RoutingError(errMsg);
    }

    await new Promise(resolve => setTimeout(resolve, mockDelay));
    const actualLatency = Date.now() - startTime;

    // Asynchronously update dynamic health indices and log results
    await this.updateMetricsAndLogs(chosenVendor, actualLatency, finalReason, capability, 'SUCCESS');

    return {
      status: "SUCCESS",
      vendorUsed: chosenVendor.name,
      routingReason: finalReason,
      latencyMs: actualLatency,
      cost: chosenVendor.costPerRequest,
      response: { panStatus: "VALID", nameMatch: true }
    };
  }

  async updateMetricsAndLogs(vendor, latency, reason, capability, status = 'SUCCESS', errorMessage = null) {
    // 1. Update Vendor Health Performance Signals
    vendor.metrics.totalRequests += 1;
    
    if (status === 'SUCCESS') {
      vendor.metrics.successfulRequests += 1;
      vendor.metrics.rollingLatencies.push(latency);
      if (vendor.metrics.rollingLatencies.length > 20) {
        vendor.metrics.rollingLatencies.shift();
      }
      if (vendor.metrics.circuitBreakerStatus === 'HALF-OPEN') {
        vendor.metrics.circuitBreakerStatus = 'CLOSED';
      }
    } else {
      vendor.metrics.failedRequests += 1;
      vendor.metrics.lastFailureTime = new Date();
      if (vendor.metrics.circuitBreakerStatus === 'CLOSED' || vendor.metrics.circuitBreakerStatus === 'HALF-OPEN') {
        vendor.metrics.circuitBreakerStatus = 'OPEN';
      }
    }
    
    await vendor.save();

    // 2. Persist execution log history
    await RoutingLog.create({
      capability,
      selectedVendor: vendor.name,
      routingReason: reason,
      executionLatencyMs: latency,
      cost: vendor.costPerRequest,
      status,
      errorMessage
    });
  }
}
