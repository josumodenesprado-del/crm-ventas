require('dotenv').config();
const express = require('express');
const cors = require('cors');
const initDB = require('./init-db');

const app = express();

const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL, 'https://crm-velixai.vercel.app', 'https://frontend-gmveovj5f-josumodenesprado-5339s-projects.vercel.app']
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', require('./routes/auth'));
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
