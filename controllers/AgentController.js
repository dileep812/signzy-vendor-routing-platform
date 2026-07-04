import { AgentService } from '../services/AgentService.js';

export class AgentController {
  constructor() {
    this.agentService = new AgentService();
  }

  getInsights = async (req, res) => {
    try {
      const insights = await this.agentService.getInsights();
      return res.status(200).json(insights);
    } catch (error) {
      return res.status(500).json({
        status: "ERROR",
        message: error.message
      });
    }
  }

  generateConfig = async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({
          status: "ERROR",
          message: "Prompt parameter is mandatory."
        });
      }
      const config = await this.agentService.generateConfig(prompt);
      return res.status(200).json(config);
    } catch (error) {
      return res.status(400).json({
        status: "ERROR",
        message: error.message
      });
    }
  }
}
