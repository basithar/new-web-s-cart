import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  rfidUid: string;
  productName: string;
  price: number;
  weight: number; // in grams
  expiryDate: string; // YYYY-MM-DD
  category: string;
  image: string;
}

const ProductSchema: Schema = new Schema(
  {
    rfidUid: { type: String, required: true, unique: true },
    productName: { type: String, required: true },
    price: { type: Number, required: true },
    weight: { type: Number, required: true }, // physical weight in grams
    expiryDate: { type: String, required: true },
    category: { type: String, required: true },
    image: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IProduct>('Product', ProductSchema);
