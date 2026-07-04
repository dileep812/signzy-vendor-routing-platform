import { VendorService } from '../services/VendorService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ValidationError } from '../utils/AppError.js';

export class VendorController {
  constructor() {
    this.vendorService = new VendorService();
  }

  // Binds directly to your POST /vendors route
  register = asyncHandler(async (req, res) => {
    const vendorData = req.body;
    
    // Keep it Simple: Perform quick structural gateway payload sanity validation
    if (!vendorData.name || !vendorData.capabilities || !vendorData.costPerRequest) {
      throw new ValidationError("Missing mandatory registration properties (name, capabilities, costPerRequest).");
    }

    const newVendor = await this.vendorService.createNewVendor(vendorData);

    return res.status(201).json({
      status: "SUCCESS",
      message: "Vendor successfully provisioned into routing core architecture.",
      vendorId: newVendor._id
    });
  });

  /**
   * Handles GET requests to fetch all vendors.
   */
  getAll = asyncHandler(async (req, res) => {
    const vendors = await this.vendorService.getAllVendors();
    
    return res.status(200).json({
      status: "SUCCESS",
      count: vendors.length,
      data: vendors
    });
  });
}