import mongoose, { Schema, Document } from 'mongoose';

export interface IAnalytics extends Document {
  date: string; // YYYY-MM-DD
  totalSales: number;
  totalRevenue: number;
  orderCount: number;
  categorySales: Array<{
    category: string;
    sales: number;
    revenue: number;
  }>;
  popularProducts: Array<{
    productId: string;
    name: string;
    quantity: number;
  }>;
}

const AnalyticsSchema: Schema = new Schema(
  {
    date: { type: String, required: true, unique: true },
    totalSales: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    orderCount: { type: Number, default: 0 },
    categorySales: [
      {
        category: { type: String, required: true },
        sales: { type: Number, default: 0 },
        revenue: { type: Number, default: 0 },
      },
    ],
    popularProducts: [
      {
        productId: { type: String, required: true },
        name: { type: String, required: true },
        quantity: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model<IAnalytics>('Analytics', AnalyticsSchema);
