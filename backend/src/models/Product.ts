import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  uid: string;
  name: string;
  price: number;
  weight: number; // in grams
  stock: number;
  category: string;
}

const ProductSchema: Schema = new Schema(
  {
    uid: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    weight: { type: Number, required: true }, // weight in grams
    stock: { type: Number, required: true, default: 100 },
    category: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IProduct>('Product', ProductSchema);
