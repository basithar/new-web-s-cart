import mongoose, { Schema, Document } from 'mongoose';

export interface IRFIDScan extends Document {
  uid: string;
  timestamp: Date;
  success: boolean;
  productName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RFIDScanSchema: Schema = new Schema(
  {
    uid: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    success: { type: Boolean, required: true },
    productName: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IRFIDScan>('RFIDScan', RFIDScanSchema);
