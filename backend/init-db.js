require('dotenv').config();
const pool = require('./config/db');
const bcrypt = require('bcryptjs');

const initDB = async (retries = 5, delay = 5000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS usuarios (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
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
          categoria VARCHAR(20) DEFAULT 'web' CHECK (categoria IN ('web', 'clinica')),
          ciudad VARCHAR(100),
          provincia VARCHAR(100),
          direccion VARCHAR(255),
          fecha_seguimiento DATE,
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

      await pool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS fecha_seguimiento DATE`);
      await pool.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE`);
      await pool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS categoria VARCHAR(20) DEFAULT 'web'`);
      await pool.query(`UPDATE leads SET categoria = 'web' WHERE categoria IS NULL`);
      await pool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS ciudad VARCHAR(100)`);
      await pool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS provincia VARCHAR(100)`);
      await pool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS direccion VARCHAR(255)`);

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Admin123!', salt);
      await pool.query(
        `INSERT INTO usuarios (username, nombre, email, password, rol)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, activo = true, username = COALESCE(EXCLUDED.username, usuarios.username)`,
        ['admin', 'Administrador', 'admin@clinica.com', hashedPassword, 'admin']
      );

      const magalyPassword = await bcrypt.hash('Magaly123!', salt);
      await pool.query(
        `INSERT INTO usuarios (username, nombre, email, password, rol)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO NOTHING`,
        ['Magaly', 'Magaly', 'magaly@clinica.com', magalyPassword, 'vendedor']
      );

      const carolinaPassword = await bcrypt.hash('Carolina123!', salt);
      await pool.query(
        `INSERT INTO usuarios (username, nombre, email, password, rol)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO NOTHING`,
        ['Carolina', 'Carolina', 'carolina@clinica.com', carolinaPassword, 'vendedor']
      );

      console.log('Base de datos inicializada correctamente');
      return;
    } catch (error) {
      console.error(`Intento ${attempt}/${retries} - Error al inicializar la base de datos:`, error.message);
      if (attempt < retries) {
        console.log(`Reintentando en ${delay / 1000} segundos...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error('No se pudo conectar a la base de datos despues de varios intentos');
      }
    }
  }
};

module.exports = initDB;
