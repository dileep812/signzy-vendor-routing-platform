import { VendorService } from '../services/VendorService.js';

export class VendorController {
  constructor() {
    this.vendorService = new VendorService();
  }

  // Binds directly to your POST /vendors route
  register = async (req, res) => {
    try {
      const vendorData = req.body;
      
      // Keep it Simple: Perform quick structural gateway payload sanity validation
      if (!vendorData.name || !vendorData.capabilities || !vendorData.costPerRequest) {
        return res.status(400).json({
          status: "ERROR",
          message: "Missing mandatory registration properties (name, capabilities, costPerRequest)."
        });
      }

      const newVendor = await this.vendorService.createNewVendor(vendorData);

      return res.status(201).json({
        status: "SUCCESS",
        message: "Vendor successfully provisioned into routing core architecture.",
        vendorId: newVendor._id
      });
    } catch (error) {
      // Graceful error isolation
      return res.status(400).json({
        status: "ERROR",
        message: error.message
      });
    }
  }
  /**
   * Handles GET requests to fetch all vendors.
   */
  getAll = async (req, res) => {
    try {
      const vendors = await this.vendorService.getAllVendors();
      
      return res.status(200).json({
        status: "SUCCESS",
        count: vendors.length,
        data: vendors
      });
    } catch (error) {
      return res.status(500).json({
        status: "ERROR",
        message: "Failed to retrieve vendor metrics configurations.",
        error: error.message
      });
    }
  }
}