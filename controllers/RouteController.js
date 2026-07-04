import { RouterService } from '../services/RouterService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ValidationError } from '../utils/AppError.js';

export class RouteController {
  constructor() {
    this.routerService = new RouterService();
  }

  handleRoute = asyncHandler(async (req, res) => {
    const { capability, payload, requirements } = req.body;

    if (!capability || !payload) {
      throw new ValidationError("Capability and payload parameters are mandatory elements.");
    }

    const outcome = await this.routerService.processRoutingRequest(capability, payload, requirements);
    return res.status(200).json(outcome);
  });
}
