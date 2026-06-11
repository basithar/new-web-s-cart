import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  firebaseId: string;
  email: string;
  name: string;
  role: 'customer' | 'admin';
  budgetLimit: number;
  budgetHistory: Array<{
    date: Date;
    limit: number;
  }>;
}

const UserSchema: Schema = new Schema(
  {
    firebaseId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    budgetLimit: { type: Number, default: 0 },
    budgetHistory: [
      {
        date: { type: Date, default: Date.now },
        limit: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
