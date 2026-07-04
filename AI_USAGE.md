# Agentic AI Integration and Usage

This document explains the Agentic AI capabilities built directly into the Intelligent Vendor Routing Platform, as well as how AI tools were utilized during development.

---

## 1. Embedded Project-Level Agentic AI

The routing engine features a dedicated, self-contained Agentic AI module (implemented in [AgentService.js](file:///d:/PROJECTS/signzy%20vendor%20routing%20platform/services/AgentService.js) and [AgentController.js](file:///d:/PROJECTS/signzy%20vendor%20routing%20platform/controllers/AgentController.js)). This module performs autonomous platform operations across two key pillars:

### Autonomous Telemetry and Insights (GET /agent/insights)
Rather than relying on human engineers to monitor logs and adjust rules, the routing core exposes an agentic loop that:
1. **Scans Vendor Metrics**: Periodically reads dynamic health state variables (such as circuit breaker states, rolling average latency trends, and historic error rates).
2. **Detects Anomalies**: Identifies degraded vendors (e.g. flagging a vendor as `DEGRADED_HIGH_LATENCY` if its average latency is within 80% of its configured timeout limit).
3. **Generates Recommendations**: Dynamically recommends strategy adjustments (e.g. suggesting switching from cost-based routing to failover routing if crucial providers are offline).
4. **Suggests Fallbacks**: Scans capabilities and provides actionable failover configurations to route around active outages.

### Natural Language Config Generation (POST /agent/generate-config)
To simplify configuration management, administrators can specify routing rules in plain, context-rich English (including colloquial phrasings, slang, or complex sentences):
1. **Probabilistic LLM Parser**: Passes the instruction to Google's `gemini-2.0-flash` model using the modern `@google/genai` SDK.
2. **Schema-Forced Structured Outputs**: Enforces a strict JSON Schema configuration output at the LLM compiler layer. It correctly translates time definitions (e.g. "2 seconds" -> `2000ms`) and percentages (e.g. "5 percent" -> `5`) into parameters.
3. **Resilient Fallback Mode**: If the `GEMINI_API_KEY` is not defined or the network is offline, the pipeline automatically redirects the request to an in-memory regex-based deterministic parser. This guarantees 100% gateway uptime and prevents runtime crashes while preserving structured configuration compilation.

---
