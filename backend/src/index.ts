import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import session from 'express-session';
import passport from 'passport';
import cors from 'cors';
import dotenv from 'dotenv';
import ConnectPgSimple from 'connect-pg-simple';
import { pool } from './db';
import { configurePassport } from './auth/passport';
import healthRouter from './routes/health';
import authRouter from './routes/auth';
import boardsRouter from './routes/boards';
import { setupSocketHandlers } from './socket';

dotenv.config();

const app = express();
const server = http.createServer(app);

const isProduction = process.env.NODE_ENV === 'production' || !!process.env.RENDER;

const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'http://frontend:3000',
];

// Allow any onrender.com subdomain in production
const isAllowedOrigin = (origin: string | undefined) => {
    if (!origin) return true;
    if (allowedOrigins.includes(origin)) return true;
    if (isProduction && origin.endsWith('.onrender.com')) return true;
    return false;
};

const io = new Server(server, {
    cors: {
        origin: (origin, callback) => {
            if (isAllowedOrigin(origin)) callback(null, true);
            else callback(new Error('Not allowed by CORS'));
        },
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

// Middleware
app.use(cors({
    origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) callback(null, true);
        else callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));
app.use(express.json());

// Session
const PgSession = ConnectPgSimple(session);
const sessionMiddleware = session({
    store: new PgSession({
        pool,
        tableName: 'user_sessions',
        createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || 'whiteboard-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: isProduction,
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: isProduction ? 'none' : 'lax',
    },
});

app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

// Configure passport
configurePassport();

// Routes
app.use('/', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/boards', boardsRouter);

// Socket.io
io.engine.use(sessionMiddleware);
setupSocketHandlers(io);

const PORT = parseInt(process.env.PORT || '3001', 10);

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend server running on port ${PORT}`);
});

export { app, server, io };
