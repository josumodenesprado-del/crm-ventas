require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const initDB = require('./init-db');

const app = express();
app.set('trust proxy', 1);

app.use(helmet());

const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL, 'https://crm-velixai.vercel.app']
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones, inténtalo más tarde' }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de acceso, inténtalo en 15 minutos' }
});

app.use('/api/', apiLimiter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const authRoutes = require('./routes/auth');
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/leads', require('./routes/leads'));
app.use('/api/actividad', require('./routes/actividad'));

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await initDB();
  } catch (err) {
    console.error('Error inicializando DB:', err.message);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
  });
};

start();
