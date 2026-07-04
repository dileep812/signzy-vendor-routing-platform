import { AgentService } from '../services/AgentService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ValidationError } from '../utils/AppError.js';

export class AgentController {
  constructor() {
    this.agentService = new AgentService();
  }

  getInsights = asyncHandler(async (req, res) => {
    const insights = await this.agentService.getInsights();
    return res.status(200).json(insights);
  });

  generateConfig = asyncHandler(async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
      throw new ValidationError("Prompt parameter is mandatory.");
    }
    const config = await this.agentService.generateConfig(prompt);
    return res.status(200).json(config);
  });
}
