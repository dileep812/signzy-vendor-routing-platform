import { Vendor } from '../models/Vendor.js';

export class VendorService {
  async createNewVendor(vendorData) {
    // Check if the vendor exists beforehand to avoid raw database trace crashes
    const existingVendor = await Vendor.findOne({ name: vendorData.name.trim() });
    if (existingVendor) {
      throw new Error(`A vendor profile named '${vendorData.name}' already exists.`);
    }

    const vendor = new Vendor({
      name: vendorData.name,
      capabilities: vendorData.capabilities,
      costPerRequest: vendorData.costPerRequest,
      timeoutMs: vendorData.timeoutMs,
      rateLimitPerMinute: vendorData.rateLimitPerMinute,
      priority: vendorData.priority,
      supportedFeatures: vendorData.supportedFeatures,
      isActive: vendorData.isActive ?? true
      // Note: 'metrics' is automatically instantiated cleanly by Mongoose default callbacks
    });

    return await vendor.save();
  }
  /**
   * Fetches all registered vendors from the database.
   * @returns {Promise<Array>} List of all vendor documents
   */
  async getAllVendors() {
    // .lean() strips Mongoose internal state tracking overhead, maximizing execution speed
    return await Vendor.find({}).lean();
  }
}