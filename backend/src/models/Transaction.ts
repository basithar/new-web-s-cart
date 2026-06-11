import mongoose, { Schema, Document } from 'mongoose';

export interface ITransactionItem {
  productName: string;
  price: number;
  quantity: number;
}

export interface ITransaction extends Document {
  transactionId: string; // Transaction ID
  orderNumber?: string;  // Order Number
  paymentMethod?: string;
  customerName: string;
  phone: string;
  email: string;
  items: ITransactionItem[];
  totalPaid: number;
  paymentStatus?: string; // e.g. "Success"
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema = new Schema(
  {
    transactionId: { type: String, required: true, unique: true },
    orderNumber: { type: String },
    paymentMethod: { type: String, default: 'Credit Card' },
    customerName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    items: [
      {
        productName: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
      },
    ],
    totalPaid: { type: Number, required: true },
    paymentStatus: { type: String, default: 'Success' },
  },
  { timestamps: true }
);

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);
