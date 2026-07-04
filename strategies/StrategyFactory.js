import { PriorityStrategy } from './PriorityStrategy.js';
import { LowestCostStrategy } from './LowestCostStrategy.js';
import { LowestLatencyStrategy } from './LowestLatencyStrategy.js';
import { RoundRobinStrategy } from './RoundRobinStrategy.js';

// Pre-instantiated singletons to preserve internal state (crucial for Round-Robin indexing)
const strategies = {
  priority: new PriorityStrategy(),
  cost: new LowestCostStrategy(),
  latency: new LowestLatencyStrategy(),
  roundRobin: new RoundRobinStrategy()
};

export class StrategyFactory {
  static getStrategy(requirements) {
    // Round Robin selection check
    if (requirements?.strategy === 'round-robin' || requirements?.preferRoundRobin) {
      return strategies.roundRobin;
    }
    // If preferLowCost is specified, route to cheapest
    if (requirements?.preferLowCost || requirements?.strategy === 'cost') {
      return strategies.cost;
    }
    // If preferLowLatency is specified, route to fastest
    if (requirements?.preferLowLatency || requirements?.strategy === 'latency') {
      return strategies.latency;
    }
    // Default strategy: Priority-based
    return strategies.priority;
  }
}
