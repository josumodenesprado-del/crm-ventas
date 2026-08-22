require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./config/db');

const createAdmin = async () => {
  const email = 'admin@clinica.com';
  const password = 'Admin123!';
  const nombre = 'Administrador';

  try {
    const existing = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      console.log('Usuario admin ya existe:', email);
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await pool.query(
      'INSERT INTO usuarios (nombre, email, password, rol) VALUES ($1, $2, $3, $4)',
      [nombre, email, hashedPassword, 'admin']
    );

    console.log('Usuario admin creado:');
    console.log('  Email:', email);
    console.log('  Password:', password);
    process.exit(0);
  } catch (error) {
    console.error('Error creando admin:', error);
    process.exit(1);
  }
};

createAdmin();