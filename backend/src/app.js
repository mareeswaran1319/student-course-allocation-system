require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const { testConnection } = require('./config/database');
const { initializeDatabase, seedData } = require('./config/initDb');

const studentRoutes = require('./routes/students');
const courseRoutes = require('./routes/courses');
const allocationRoutes = require('./routes/allocations');
const aiRoutes = require('./routes/ai');
const authRoutes = require('./routes/auth');

const app = express();
const server = http.createServer(app);

// ─── SOCKET.IO REAL-TIME SETUP ────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── REQUEST LOGGER ───────────────────────────────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// ─── ROUTES ───────────────────────────────────────────────────────────────────
app.use('/api/students', studentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/allocations', allocationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRoutes);

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Student Course Allocation System API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// ─── 404 HANDLER ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.path} not found` });
});

// ─── ERROR HANDLER ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// ─── START SERVER ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await testConnection();
    await initializeDatabase();
    await seedData();

    server.listen(PORT, () => {
      console.log(`\n🚀 Server running on http://localhost:${PORT}`);
      console.log(`📡 Socket.IO ready for real-time connections`);
      console.log(`🗄️  Database: ${process.env.DB_NAME}`);
      console.log(`\n📋 Available API endpoints:`);
      console.log(`   GET  /api/health`);
      console.log(`   GET  /api/students`);
      console.log(`   POST /api/students`);
      console.log(`   GET  /api/courses`);
      console.log(`   POST /api/courses`);
      console.log(`   POST /api/allocations/run`);
      console.log(`   GET  /api/allocations/stats`);
      console.log(`   POST /api/ai/query\n`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
