import mongoose, { Schema, Document } from 'mongoose';

export interface ISecurityLog extends Document {
  cartId: string;
  type: 'weight_mismatch' | 'unscanned_item' | 'resolved';
  description: string;
  expectedWeight: number;
  physicalWeight: number;
  resolved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SecurityLogSchema: Schema = new Schema(
  {
    cartId: { type: String, required: true },
    type: {
      type: String,
      enum: ['weight_mismatch', 'unscanned_item', 'resolved'],
      required: true,
    },
    description: { type: String, required: true },
    expectedWeight: { type: Number, default: 0 },
    physicalWeight: { type: Number, default: 0 },
    resolved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<ISecurityLog>('SecurityLog', SecurityLogSchema);
