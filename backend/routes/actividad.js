const express = require('express');
const pool = require('../config/db');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 30;
    const result = await pool.query(
      `SELECT a.*, u.nombre as usuario_nombre, l.nombre as lead_nombre, l.empresa as lead_empresa
       FROM actividades a
       LEFT JOIN usuarios u ON a.usuario_id = u.id
       LEFT JOIN leads l ON a.lead_id = l.id
       ORDER BY a.created_at DESC
       LIMIT $1`,
      [limit]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
