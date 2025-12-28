// models/Program.js
import mongoose from 'mongoose';

const ProgramSchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 100 },
  body:  { type: String, required: true, maxlength: 400 },
  link:  { type: String, default: '#' },
  order: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('Program', ProgramSchema);
