export class LowestCostStrategy {
  execute(candidates, requirements) {
    // Sort by costPerRequest ascending
    const sorted = [...candidates].sort((a, b) => a.costPerRequest - b.costPerRequest);
    return sorted[0];
  }
}
