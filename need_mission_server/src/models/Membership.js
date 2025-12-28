import mongoose from 'mongoose';

const membershipSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  type: { type: String, enum: ['Institutional','Individual','Corporate'], required: true },
  city: { type: String, default: '' },
  message: { type: String, default: '' }
,
  seed: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Membership', membershipSchema);
