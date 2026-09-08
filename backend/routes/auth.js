const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

const validarPassword = (password) => {
  if (!password || password.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres';
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
    return 'La contraseña debe tener mayúsculas y minúsculas';
  }
  if (!/[0-9]/.test(password)) {
    return 'La contraseña debe incluir al menos un número';
  }
  return null;
};

router.post('/register', auth, adminOnly, async (req, res) => {
  try {
    const { username, nombre, email, password, rol } = req.body;

    if (!username || !nombre || !email || !password) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    if (!['admin', 'vendedor'].includes(rol || 'vendedor')) {
      return res.status(400).json({ error: 'Rol no válido' });
    }

    const errorPassword = validarPassword(password);
    if (errorPassword) {
      return res.status(400).json({ error: errorPassword });
    }

    const existingUser = await pool.query('SELECT id FROM usuarios WHERE email = $1 OR username = $2', [email, username]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'El email o username ya está registrado' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await pool.query(
      'INSERT INTO usuarios (username, nombre, email, password, rol) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, nombre, email, rol',
      [username, nombre, email, hashedPassword, rol || 'vendedor']
    );

    await pool.query(
      'INSERT INTO actividades (lead_id, usuario_id, accion, descripcion) VALUES (NULL, $1, $2, $3)',
      [req.usuario.id, 'usuario_creado', `Usuario "${username}" creado con rol "${rol || 'vendedor'}"`]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const result = await pool.query('SELECT * FROM usuarios WHERE username = $1 AND activo = true', [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, nombre: user.nombre, username: user.username, email: user.email, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: { id: user.id, nombre: user.nombre, username: user.username, email: user.email, rol: user.rol }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, nombre, email, rol FROM usuarios WHERE id = $1', [req.usuario.id]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.get('/users', auth, adminOnly, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, nombre, email, rol, activo, created_at FROM usuarios ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.put('/users/:id', auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, username, rol, activo, password } = req.body;

    let query, params;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      query = 'UPDATE usuarios SET nombre = COALESCE($1, nombre), email = COALESCE($2, email), username = COALESCE($3, username), rol = COALESCE($4, rol), activo = COALESCE($5, activo), password = $6 WHERE id = $7 RETURNING id, username, nombre, email, rol, activo';
      params = [nombre, email, username, rol, activo, hashedPassword, id];
    } else {
      query = 'UPDATE usuarios SET nombre = COALESCE($1, nombre), email = COALESCE($2, email), username = COALESCE($3, username), rol = COALESCE($4, rol), activo = COALESCE($5, activo) WHERE id = $6 RETURNING id, username, nombre, email, rol, activo';
      params = [nombre, email, username, rol, activo, id];
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (activo !== undefined) {
      await pool.query(
        'INSERT INTO actividades (lead_id, usuario_id, accion, descripcion) VALUES (NULL, $1, $2, $3)',
        [req.usuario.id, 'usuario_estado', `Usuario "${result.rows[0].username}" ${activo ? 'activado' : 'desactivado'}`]
      );
    } else {
      await pool.query(
        'INSERT INTO actividades (lead_id, usuario_id, accion, descripcion) VALUES (NULL, $1, $2, $3)',
        [req.usuario.id, 'usuario_editado', `Usuario "${result.rows[0].username}" editado`]
      );
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const result = await pool.query('SELECT * FROM usuarios WHERE id = $1', [req.usuario.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'La contraseña actual es incorrecta' });
    }

    const errorPassword = validarPassword(newPassword);
    if (errorPassword) {
      return res.status(400).json({ error: errorPassword });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await pool.query('UPDATE usuarios SET password = $1 WHERE id = $2', [hashedPassword, req.usuario.id]);

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
