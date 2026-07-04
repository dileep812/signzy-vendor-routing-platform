import { RouterService } from '../services/RouterService.js';

export class RouteController {
  constructor() {
    this.routerService = new RouterService();
  }

  handleRoute = async (req, res) => {
    try {
      const { capability, payload, requirements } = req.body;

      if (!capability || !payload) {
        return res.status(400).json({
          status: "ERROR",
          message: "Capability and payload parameters are mandatory elements."
        });
      }

      const outcome = await this.routerService.processRoutingRequest(capability, payload, requirements);
      return res.status(200).json(outcome);
    } catch (error) {
      return res.status(502).json({
        status: "FAILED",
        vendorUsed: "NONE",
        routingReason: error.message
      });
    }
  }
}
