require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');

// Route imports
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const matchRoutes = require('./routes/matches');
const requestRoutes = require('./routes/requests');
const sessionRoutes = require('./routes/sessions');
const notificationRoutes = require('./routes/notifications');
const reportRoutes = require('./routes/reports');

// Connect to MongoDB
connectDB();

const app = express();

// ─── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet());

app.use(
    cors({
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        credentials: true,
    })
);

// Rate limiting — 100 requests per 15 minutes globally
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { success: false, message: 'Too many requests, please try again later' },
});
app.use(limiter);

// Stricter limit on auth routes (10 per 15 min)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { success: false, message: 'Too many login attempts, please try again later' },
});

// ─── Body Parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'SkillSwap API is running', timestamp: new Date() });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n🚀 SkillSwap server running on port ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
});
