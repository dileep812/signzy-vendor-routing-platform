export class PriorityStrategy {
  execute(candidates, requirements) {
    // Sort by priority ascending (1 is highest priority)
    const sorted = [...candidates].sort((a, b) => a.priority - b.priority);
    return sorted[0];
  }
}
