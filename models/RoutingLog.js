import mongoose from 'mongoose';

const RoutingLogSchema = new mongoose.Schema({
  capability: { type: String, required: true, index: true },
  selectedVendor: { type: String, required: true },
  routingReason: { type: String, required: true },
  executionLatencyMs: { type: Number, required: true },
  cost: { type: Number, required: true },
  status: { type: String, enum: ['SUCCESS', 'FAILED'], required: true },
  errorMessage: { type: String, default: null }
}, { timestamps: true });

export const RoutingLog = mongoose.model('RoutingLog', RoutingLogSchema);
