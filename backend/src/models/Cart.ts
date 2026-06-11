import mongoose, { Schema, Document } from 'mongoose';
import { IProduct } from './Product';

export interface ICartItem {
  product: mongoose.Types.ObjectId | IProduct;
  quantity: number;
}

export interface ICart extends Document {
  cartId: string;
  userId?: string;
  items: ICartItem[];
  budget: number;
  totalAmount: number;
  expectedWeight: number; // in grams
  physicalWeight: number; // in grams from IoT scale
  weightMismatch: boolean;
  status: 'active' | 'checkout' | 'completed';
}

const CartSchema: Schema = new Schema(
  {
    cartId: { type: String, required: true, unique: true },
    userId: { type: String }, // Firebase ID or null for guest
    items: [
      {
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true, default: 1 },
      },
    ],
    budget: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    expectedWeight: { type: Number, default: 0 },
    physicalWeight: { type: Number, default: 0 },
    weightMismatch: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['active', 'checkout', 'completed'],
      default: 'active',
    },
  },
  { timestamps: true }
);

export default mongoose.model<ICart>('Cart', CartSchema);
