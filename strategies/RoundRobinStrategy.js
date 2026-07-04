export class RoundRobinStrategy {
  constructor() {
    this.lastIndexes = new Map(); // capability -> lastIndex
  }

  execute(candidates, requirements) {
    if (!candidates || candidates.length === 0) {
      return null;
    }

    const key = requirements?.capability || "default";

    // Retrieve last used index for this capability
    let lastIndex = this.lastIndexes.get(key) ?? -1;

    // Calculate next index in a circular queue fashion
    const nextIndex = (lastIndex + 1) % candidates.length;

    // Save back to tracking Map to persist the state
    this.lastIndexes.set(key, nextIndex);

    return candidates[nextIndex];
  }
}
