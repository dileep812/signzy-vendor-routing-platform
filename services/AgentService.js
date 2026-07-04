import { Vendor } from '../models/Vendor.js';
import { RoutingLog } from '../models/RoutingLog.js';
import { GoogleGenAI } from '@google/genai';

export class AgentService {
  constructor() {
    this.aiClient = null;
  }

  getAIClient() {
    if (!this.aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not defined in the environment variables.");
      }
      this.aiClient = new GoogleGenAI({ apiKey });
    }
    return this.aiClient;
  }

  async getInsights() {
    const vendors = await Vendor.find({}).lean();
    const logs = await RoutingLog.find({}).sort({ createdAt: -1 }).limit(100).lean();

    const unhealthyVendors = [];
    const recommendations = [];
    const fallbackRules = [];

    // Analyze health of each vendor
    for (const vendor of vendors) {
      let healthStatus = 'HEALTHY';
      let reason = 'Performing within nominal thresholds.';

      const latencies = vendor.metrics?.rollingLatencies || [];
      const avgLatency = latencies.length ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
      const totalRequests = vendor.metrics?.totalRequests || 0;
      const failedRequests = vendor.metrics?.failedRequests || 0;
      const errorRate = totalRequests > 0 ? (failedRequests / totalRequests) : 0;

      if (vendor.metrics?.circuitBreakerStatus === 'OPEN') {
        healthStatus = 'UNHEALTHY_CIRCUIT_BROKEN';
        reason = `Circuit breaker is OPEN. Last failure occurred at ${vendor.metrics.lastFailureTime || 'recently'}.`;
      } else if (avgLatency > vendor.timeoutMs * 0.8) {
        healthStatus = 'DEGRADED_HIGH_LATENCY';
        reason = `Rolling average latency (${Math.round(avgLatency)}ms) is near the configured timeout threshold of ${vendor.timeoutMs}ms.`;
      } else if (errorRate > 0.15) {
        healthStatus = 'DEGRADED_HIGH_ERROR_RATE';
        reason = `Error rate is high (${(errorRate * 100).toFixed(1)}%). ${failedRequests} failed out of ${totalRequests} total requests.`;
      }

      if (healthStatus !== 'HEALTHY') {
        unhealthyVendors.push({
          name: vendor.name,
          healthStatus,
          reason,
          metrics: {
            totalRequests,
            errorRate,
            avgLatency: Math.round(avgLatency)
          }
        });

        // Generate fallback suggestions
        const capabilities = vendor.capabilities;
        const alternativeVendors = vendors.filter(v => 
          v.name !== vendor.name && 
          v.isActive && 
          v.metrics?.circuitBreakerStatus !== 'OPEN' &&
          v.capabilities.some(c => capabilities.includes(c))
        );

        if (alternativeVendors.length > 0) {
          const names = alternativeVendors.map(v => v.name).join(', ');
          fallbackRules.push(`Since ${vendor.name} is ${healthStatus.replace(/_/g, ' ')}, automatically route its traffic to healthy alternatives: ${names}.`);
        } else {
          fallbackRules.push(`CRITICAL: No active fallback alternatives found for ${vendor.name} with capabilities: ${capabilities.join(', ')}.`);
        }
      }
    }

    // Recommend routing strategy
    if (unhealthyVendors.length > 0) {
      recommendations.push("Recommendation: Enable Failover/Fallback Routing logic to bypass active outages.");
      recommendations.push("Explanation: One or more vendors are currently circuit-broken or degraded. Fallback checks will automatically route requests around them.");
    } else {
      recommendations.push("Recommendation: Use Priority-Based Routing for maximum performance, or Lowest-Cost Routing to optimize expenses.");
      recommendations.push("Explanation: All registered vendors are reporting healthy metrics with nominal latency limits.");
    }

    // Selection Explanations based on recent log analysis
    const selectionExplanations = [];
    if (logs.length > 0) {
      const vendorCounts = {};
      logs.forEach(log => {
        vendorCounts[log.selectedVendor] = (vendorCounts[log.selectedVendor] || 0) + 1;
      });
      const topVendor = Object.keys(vendorCounts).reduce((a, b) => vendorCounts[a] > vendorCounts[b] ? a : b);
      selectionExplanations.push(`Vendor Selection Explanation: ${topVendor} was selected most frequently (${vendorCounts[topVendor]} requests in last 100 executions) due to matching capabilities and optimal cost/latency metrics.`);
    } else {
      selectionExplanations.push("No execution logs available yet to explain selection frequency.");
    }

    return {
      status: "SUCCESS",
      insights: {
        unhealthyVendors: unhealthyVendors.length > 0 ? unhealthyVendors : "None detected",
        strategyRecommendations: recommendations,
        suggestedFallbackRules: fallbackRules.length > 0 ? fallbackRules : ["All vendors healthy. Default fallbacks active."],
        selectionExplanations
      }
    };
  }

  async generateConfig(prompt) {
    if (!prompt || typeof prompt !== 'string') {
      throw new Error("Prompt must be a non-empty string.");
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && apiKey !== "YOUR_API_KEY" && apiKey !== "") {
      try {
        const client = this.getAIClient();
        const systemInstructions = `
          You are an expert platform engineering routing assistant.
          Your task is to convert plain English user requests into a valid structural Routing configuration JSON object.
          
          Requirements:
          - Determine strategy: "weighted" if weights/percentages/traffic split are mentioned, otherwise "priority".
          - Extract all vendors and their weights. If no weights are mentioned for priority strategy, you can set weights to null or omit them, but make sure "vendors" contains the list of vendor names.
          - If fallback conditions are specified (e.g. latency exceeds/crosses a duration, or error rate/failures exceed a percentage, switching to a specific target vendor), populate fallbackRules.
          - Convert time durations (like "2 seconds", "1 sec", "500 milliseconds") strictly into milliseconds for latencyThresholdMs.
          - Convert percentage values (like "5%", "10 percent") strictly into integers for errorRateThresholdPct.
        `;

        const schema = {
          type: "OBJECT",
          properties: {
            strategy: {
              type: "STRING",
              enum: ["weighted", "priority"]
            },
            vendors: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  name: { type: "STRING" },
                  weight: { type: "INTEGER" }
                },
                required: ["name"]
              }
            },
            fallbackRules: {
              type: "OBJECT",
              properties: {
                switchTarget: { type: "STRING" },
                latencyThresholdMs: { type: "INTEGER" },
                errorRateThresholdPct: { type: "INTEGER" }
              }
            }
          },
          required: ["strategy", "vendors"]
        };

        const response = await client.models.generateContent({
          model: "gemini-2.0-flash",
          contents: `Instructions: ${systemInstructions}\nUser Prompt: ${prompt}`,
          config: {
            responseMimeType: "application/json",
            responseSchema: schema
          }
        });

        const structuredConfigJson = JSON.parse(response.text);

        return {
          status: "SUCCESS",
          parserType: "PROBABILISTIC_LLM",
          prompt,
          configuration: structuredConfigJson
        };
      } catch (error) {
        console.warn(`[AgentService] Probabilistic LLM parsing pipeline failed. Falling back to deterministic parser. Error: ${error.message}`);
      }
    }

    // Deterministic fallback parser (for offline use, missing key, or rate limit failures)
    const normalized = prompt.replace(/\s+/g, ' ');

    let strategy = "priority";
    if (normalized.toLowerCase().includes("percent") || normalized.includes("%") || normalized.toLowerCase().includes("weighted") || normalized.toLowerCase().includes("traffic split")) {
      strategy = "weighted";
    }

    const vendors = [];
    const weightRegex = /([A-Za-z0-9\s_-]+?)\s+(?:for|:)\s*(\d+)\s*%/g;
    let match;
    while ((match = weightRegex.exec(normalized)) !== null) {
      const name = match[1].trim().replace(/^(use|and|with)\s+/i, '');
      const weight = parseInt(match[2], 10);
      vendors.push({ name, weight });
    }

    // Default if no weights matched but vendors are mentioned:
    if (vendors.length === 0) {
      const allVendors = await Vendor.find({ isActive: true }).lean();
      allVendors.forEach(v => {
        if (normalized.toLowerCase().includes(v.name.toLowerCase())) {
          vendors.push({ name: v.name });
        }
      });
    }

    let switchTarget = null;
    const switchMatch = normalized.match(/(?:switch to|move operations over to|fallback to|route to|reroute to)\s+([A-Za-z0-9\s_-]+?)(?=\s+if|\s+when|\s+or|\s+and|\.|$)/i);
    if (switchMatch) {
      switchTarget = switchMatch[1].trim();
    }

    let latencyThresholdMs = null;
    const latencyMatch = normalized.match(/latency\s+(?:crosses|exceeds|>|is greater than|longer than|is over|over)\s*(\d+)\s*(second|seconds|sec|secs|ms|millisecond|milliseconds)/i);
    if (latencyMatch) {
      const val = parseInt(latencyMatch[1], 10);
      const unit = latencyMatch[2].toLowerCase();
      if (unit.startsWith("second") || unit.startsWith("sec")) {
        latencyThresholdMs = val * 1000;
      } else {
        latencyThresholdMs = val;
      }
    }

    // Support phrasing like "take longer than 2000 milliseconds"
    if (!latencyThresholdMs) {
      const longerThanMatch = normalized.match(/(?:longer than|exceeds)\s*(\d+)\s*(second|seconds|sec|secs|ms|millisecond|milliseconds)/i);
      if (longerThanMatch) {
        const val = parseInt(longerThanMatch[1], 10);
        const unit = longerThanMatch[2].toLowerCase();
        if (unit.startsWith("second") || unit.startsWith("sec")) {
          latencyThresholdMs = val * 1000;
        } else {
          latencyThresholdMs = val;
        }
      }
    }

    let errorRateThresholdPct = null;
    const errorMatch = normalized.match(/(?:error rate|failure rate)\s+(?:is above|crosses|exceeds|>|is greater than)\s*(\d+)\s*%/i);
    if (errorMatch) {
      errorRateThresholdPct = parseInt(errorMatch[1], 10);
    }

    const fallbackRules = switchTarget ? {
      switchTarget,
      latencyThresholdMs,
      errorRateThresholdPct
    } : null;

    return {
      status: "SUCCESS",
      parserType: "DETERMINISTIC_REGEXP_FALLBACK",
      prompt,
      configuration: {
        strategy,
        vendors: vendors.length > 0 ? vendors : [{ name: "Vendor Alpha" }],
        fallbackRules
      }
    };
  }
}
