import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

import Membership from './models/Membership.js';
import ContactMessage from './models/ContactMessage.js';
import Program from './models/Program.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/need_mission';
const SERVE_STATIC = (process.env.SERVE_STATIC || 'true').toLowerCase() === 'true';

mongoose.connect(MONGODB_URI, { dbName: undefined })
  .then(()=> console.log('MongoDB connected'))
  .catch(err => { console.error('Mongo error:', err.message); process.exit(1); });

app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true }));

app.use(cors());
app.options('*', cors());

const limiter = rateLimit({ windowMs: 15*60*1000, max: 200 });
app.use('/api/', limiter);

/* ---------------- Public forms ---------------- */
app.post('/api/memberships', async (req, res) => {
  try {
    const { name, email, type, city, message } = req.body || {};
    if (!name || !email || !type) return res.status(400).json({ message: 'name, email, and type are required' });
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) return res.status(400).json({ message: 'Invalid email' });
    if (!['Institutional','Individual','Corporate'].includes(type)) return res.status(400).json({ message: 'Invalid membership type' });

    const doc = await Membership.create({ name, email, type, city, message });
    return res.status(201).json({ message: 'Membership recorded', id: doc._id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body || {};
    if (!name || !email || !message) return res.status(400).json({ message: 'name, email, and message are required' });
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) return res.status(400).json({ message: 'Invalid email' });

    const doc = await ContactMessage.create({ name, email, subject, message });
    return res.status(201).json({ message: 'Message received', id: doc._id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

/* ---------------- Admin auth & Programs ---------------- */
function requireAdmin(req, res, next){
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Missing token' });
  try{
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
    if (payload.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    next();
  }catch(err){
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// POST /api/auth/login  {email, password} -> {token}
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const ok = (email && password &&
    email === (process.env.ADMIN_EMAIL || 'admin@example.com') &&
    password === (process.env.ADMIN_PASSWORD || 'changeme'));
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '2h' });
  return res.json({ token });
});

// GET /api/programs  → [{title, body, link, order}]
app.get('/api/programs', async (_req, res) => {
  try{
    const items = await Program.find({}).sort({ order: 1 }).lean();
    if (items.length) return res.json(items);
    // Defaults if DB empty (matches your current site content)
    return res.json([
      { title: 'Campus Energy Labs', body: 'Hands-on projects that turn classrooms into living labs for energy efficiency, renewables, and conservation.', link: 'programs.html#campus-energy-labs', order: 0 },
      { title: 'Green Leadership Fellows', body: 'Student and teacher leadership program to design, pilot, and scale sustainability initiatives within institutions.', link: 'programs.html#green-leadership', order: 1 },
      { title: 'Community Action Drives', body: 'Neighborhood-level drives for waste reduction, tree plantation, and energy awareness campaigns.', link: 'programs.html#community-action', order: 2 },
    ]);
  }catch(err){
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/programs  (admin only)
app.put('/api/programs', requireAdmin, async (req, res) => {
  try{
    const arr = Array.isArray(req.body?.programs) ? req.body.programs : [];
    if (!arr.length) return res.status(400).json({ message: 'No programs provided' });

    const clean = arr.map((p, i) => ({
      title: String(p.title || '').trim().slice(0,100),
      body:  String(p.body  || '').trim().slice(0,400),
      link:  String(p.link  || '#').trim(),
      order: Number.isFinite(p.order) ? p.order : i
    }));

    await Program.deleteMany({});
    await Program.insertMany(clean);
    res.json({ message: 'Programs updated', count: clean.length });
  }catch(err){
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ---------------- Static site ---------------- */
if (SERVE_STATIC) {
  const staticDir = path.resolve(__dirname, '../../../NEED_Mission_Site');

  app.use(express.static(staticDir));

  app.get('*', (req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'));
  });
}


app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
