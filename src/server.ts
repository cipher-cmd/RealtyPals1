import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import propertyRoutes from './routes/propertyRoutes';
import valueCheckRoutes from './routes/valueCheckRoutes';
import compareRoutes from './routes/compareRoutes';
import savedPropertyRoutes from './routes/savedPropertyRoutes';
import chatRoutes from './routes/chatRoutes';
import sectorRoutes from './routes/sectorRoutes';
import { errorHandler } from './middleware/errorHandler';
import prisma from './lib/prisma';
import { fetchGooglePlaces } from './services/googlePlacesService';

// Load environment variables
dotenv.config();

const app = express();

// Required for express-rate-limit to work correctly on Render/Vercel
app.set('trust proxy', 1);

const PORT = process.env.PORT;
if (!PORT) {
  console.error('PORT is required. Set it in .env (e.g. PORT=3000).');
  process.exit(1);
}

// ── CORS: restrict to known frontend origins ───────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGIN || 'http://localhost:3001').split(',').map(o => o.trim());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. server-to-server, Postman)
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.includes(origin) || 
                     origin.startsWith('http://localhost') ||
                     origin.endsWith('.vercel.app'); // Allow all Vercel previews/deployments

    if (isAllowed) {
      return callback(null, true);
    }
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-User-Id', 'Authorization'],
  credentials: true,
}));

app.use(express.json());

// ── Rate limiting ──────────────────────────────────────────────────────────
// Chat endpoint: 30 requests per minute per IP (protects Gemini quota)
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: true, message: 'Too many requests. Please wait a moment.' },
});

// General API: 200 requests per minute per IP
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: true, message: 'Too many requests. Please try again shortly.' },
});

app.use('/api/', generalLimiter);
app.use('/api/v1/chat', chatLimiter);

// ── Health check ───────────────────────────────────────────────────────────
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'RealtyPal API is running' });
});

// ── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/v1/properties', propertyRoutes);
app.use('/api/v1/value-check', valueCheckRoutes);
app.use('/api/v1/compare', compareRoutes);
app.use('/api/v1/saved-properties', savedPropertyRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/sectors', sectorRoutes);

// ── Test Route for Google Places API ───────────────────────────────────────
app.get('/api/test/places', async (req: Request, res: Response) => {
  const query = req.query.query as string || '2 BHK Sector 150 Noida';
  const properties = await fetchGooglePlaces(query);
  res.json({ query, properties });
});

// ── Centralized error handler (MUST be last) ───────────────────────────────
app.use(errorHandler);

// ── Graceful shutdown ──────────────────────────────────────────────────────
async function shutdown() {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  console.log('✅ Database disconnected.');
  process.exit(0);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// ── Startup ───────────────────────────────────────────────────────────
async function main() {
  const port = Number(PORT);

  // Start the server first so Render's health checks pass
  app.listen(port, () => {
    console.log(`✅ Server running on port ${port}`);
    console.log(`✅ API available at http://localhost:${port}/api/v1`);
    console.log(`✅ Health check: http://localhost:${port}/health`);
  });

  // Then attempt an initial DB connection in the background
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully.');
  } catch (err) {
    console.warn('⚠️ Initial Database connection failed. The app will retry on the first request.');
    console.error('Check your Supabase/Render environment variables if this persists.');
    // We do NOT exit here. Prisma will automatically try again when the first API call arrives.
  }
}

main();
