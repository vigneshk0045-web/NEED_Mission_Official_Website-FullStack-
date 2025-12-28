import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Membership from '../src/models/Membership.js';
import ContactMessage from '../src/models/ContactMessage.js';

dotenv.config({ path: new URL('../.env', import.meta.url).pathname });

const run = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/need_mission';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB:', uri);

  await Membership.deleteMany({ seed: true });
  await ContactMessage.deleteMany({ seed: true });

  const members = await Membership.insertMany([
    { name: 'KCT Eco Club', email: 'eco@kct.edu', type: 'Institutional', city: 'Coimbatore', message: 'Pilot campus audit', seed: true },
    { name: 'Riya Sharma', email: 'riya@example.com', type: 'Individual', city: 'Delhi', message: 'Volunteer for waste drives', seed: true },
    { name: 'GreenCorp Pvt Ltd', email: 'sustainability@greencorp.com', type: 'Corporate', city: 'Bengaluru', message: 'CSR collaboration', seed: true }
  ]);

  const contacts = await ContactMessage.insertMany([
    { name: 'Arun', email: 'arun@example.com', subject: 'Partnership', message: 'Interested in partnering for schools program', seed: true },
    { name: 'Meera', email: 'meera@example.com', subject: 'Resources', message: 'Can we get the teacher toolkit PDF?', seed: true }
  ]);

  console.log(`Seeded ${members.length} memberships and ${contacts.length} contact messages.`);
  await mongoose.disconnect();
  console.log('Done.');
};

run().catch(err => { console.error(err); process.exit(1); });
