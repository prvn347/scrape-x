import mongoose from 'mongoose';

const trendSchema = new mongoose.Schema({
  scrapeId: { type: String, required: true },
  trend1: { type: String, required: true },
  trend2: { type: String, required: true },
  trend3: { type: String, required: true },
  trend4: { type: String, required: true },
  trend5: { type: String, required: true },
  timestamp: { type: Date, required: true },
  ipAddress: { type: String, required: true }
});

export const Trend = mongoose.models.Trend || mongoose.model('Trend', trendSchema);

