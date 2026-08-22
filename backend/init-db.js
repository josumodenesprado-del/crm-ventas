const pool = require('./config/db');

const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        rol VARCHAR(20) DEFAULT 'vendedor' CHECK (rol IN ('admin', 'vendedor')),
        activo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        empresa VARCHAR(150),
        telefono VARCHAR(20),
        email VARCHAR(100),
        estado VARCHAR(30) DEFAULT 'sin_contactar' CHECK (estado IN (
          'sin_contactar', 'contactado', 'interesado', 'propuesta_enviada', 'cerrado_ganado', 'cerrado_perdido'
        )),
        notas TEXT,
        asignado_a INTEGER REFERENCES usuarios(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS actividades (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
        usuario_id INTEGER REFERENCES usuarios(id),
        accion VARCHAR(50) NOT NULL,
        descripcion TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Base de datos inicializada correctamente');
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
    process.exit(1);
  }
};

module.exports = initDB;