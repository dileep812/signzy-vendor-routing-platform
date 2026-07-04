import mongoose from 'mongoose';

/**
 * Metrics Schema
 * Single Responsibility: Manages dynamic health logs and circuit breaking metrics.
 */
const MetricsSchema = new mongoose.Schema({
  totalRequests: {
    type: Number,
    default: 0,
    min: [0, 'Total requests cannot be negative']
  },
  successfulRequests: {
    type: Number,
    default: 0,
    min: [0, 'Successful requests cannot be negative']
  },
  failedRequests: {
    type: Number,
    default: 0,
    min: [0, 'Failed requests cannot be negative']
  },
  rollingLatencies: {
    type: [Number],
    default: []
  },
  circuitBreakerStatus: {
    type: String,
    enum: {
      values: ['CLOSED', 'HALF-OPEN', 'OPEN'],
      message: '{VALUE} is not a valid circuit status'
    },
    default: 'CLOSED'
  },
  lastFailureTime: {
    type: Date,
    default: null
  }
}, { _id: false }); // Prevents creating unnecessary sub-document IDs

/**
 * Main Vendor Schema
 * Single Responsibility: Defines the structural attributes, configuration limits,
 * and capability mappings for external API providers.
 */
const VendorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Vendor name is required'],
    unique: true,
    trim: true,
    index: true
  },
  capabilities: {
    type: [String],
    required: [true, 'At least one capability (e.g., PAN_VERIFICATION) must be defined'],
    validate: {
      validator: (array) => array && array.length > 0,
      message: 'Capabilities array cannot be empty'
    }
  },
  costPerRequest: {
    type: Number,
    required: [true, 'Cost per request is required'],
    min: [0, 'Cost per request cannot be negative']
  },
  timeoutMs: {
    type: Number,
    required: [true, 'Timeout duration is required'],
    default: 2000,
    min: [1, 'Timeout must be at least 1 millisecond']
  },
  rateLimitPerMinute: {
    type: Number,
    required: [true, 'Rate limit value is required'],
    min: [1, 'Rate limit must be at least 1 request per minute']
  },
  priority: {
    type: Number,
    required: [true, 'Vendor processing priority ranking is required'],
    default: 1,
    min: [1, 'Priority rank must be 1 or higher']
  },
  supportedFeatures: {
    type: [String],
    default: [] // e.g., ['OCR', 'FUZZY_MATCHING']
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  metrics: {
    type: MetricsSchema,
    default: () => ({}) // Generates defaults smoothly when a vendor document drops in
  }
}, { 
  timestamps: true // Automatically generates `createdAt` and `updatedAt` field trails
});

// --- Performance Index Optimizations ---

// Optimized compound index for fast candidate lookups during router execution matches
VendorSchema.index({ capabilities: 1, isActive: 1, priority: 1 });

// Backup query optimization for cost strategy sorting patterns
VendorSchema.index({ capabilities: 1, isActive: 1, costPerRequest: 1 });

export const Vendor = mongoose.model('Vendor', VendorSchema);