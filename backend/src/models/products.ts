import mongoose, { Schema, Document } from 'mongoose';

// TypeScript walata data types kiyala dima
export interface IProduct extends Document {
  name: string;
  rfidUid: string;
  price: number;
  weight: number;
  expiryDate: Date;
}

// MongoDB Database eke Blueprint (Schema) eka
const ProductSchema: Schema = new Schema({
  name: { 
    type: String, 
    required: true 
  },
  rfidUid: { 
    type: String, 
    required: true, 
    unique: true // Eka RFID tag ekak deparak add wenna bari wenna
  },
  price: { 
    type: Number, 
    required: true 
  },
  weight: { 
    type: Number, 
    required: true 
  },
  expiryDate: { 
    type: Date, 
    required: true 
  }
}, { 
  timestamps: true // Data eka add karapu welawa (createdAt/updatedAt) auto save wenawa
});

// Model eka export kireema
export default mongoose.model('Product', ProductSchema);